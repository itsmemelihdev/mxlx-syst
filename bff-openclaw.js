import WebSocket, { WebSocketServer } from "ws";
import crypto from "crypto";
import fs from "fs";
import path from "path";

// Manually parse .env without external modules that fail in ESM
try {
    const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
    envFile.split(/\r?\n/).forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            process.env[match[1]] = match[2] ? match[2].trim() : '';
        }
    });
} catch (e) {
    console.warn("[BFF] Could not read .env file directly", e.message);
}

// --- base64url helpers (match OpenClaw) ---
function b64url(buf) {
    return Buffer.from(buf)
        .toString("base64")
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replace(/=+$/g, "");
}

// Ed25519 SPKI prefix used by OpenClaw to strip DER header and return 32-byte raw key
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

function derivePublicKeyRawFromPem(publicKeyPem) {
    const spkiDer = crypto.createPublicKey(publicKeyPem).export({ type: "spki", format: "der" });
    // If it's Ed25519 SPKI, strip prefix to get 32-byte raw key
    if (
        spkiDer.length === ED25519_SPKI_PREFIX.length + 32 &&
        spkiDer.subarray(0, ED25519_SPKI_PREFIX.length).equals(ED25519_SPKI_PREFIX)
    ) {
        return spkiDer.subarray(ED25519_SPKI_PREFIX.length);
    }
    // Fallback: return full SPKI DER (shouldn't happen for ed25519)
    return spkiDer;
}

function fingerprintDeviceId(publicKeyPem) {
    const raw = derivePublicKeyRawFromPem(publicKeyPem);
    return crypto.createHash("sha256").update(raw).digest("hex"); // matches OpenClaw client
}

function buildDeviceAuthPayload({
    deviceId,
    clientId,
    clientMode,
    role,
    scopes,
    signedAtMs,
    token,
    nonce,
}) {
    const version = nonce ? "v2" : "v1";
    const scopesCsv = scopes.join(",");
    const tok = token ?? "";
    const parts = [
        version,
        deviceId,
        clientId,
        clientMode,
        role,
        scopesCsv,
        String(signedAtMs),
        tok,
    ];
    if (version === "v2") parts.push(nonce ?? "");
    return parts.join("|");
}

function signDevicePayload(privateKeyPem, payload) {
    const key = crypto.createPrivateKey(privateKeyPem);
    // For Ed25519 in Node, algorithm is null
    const sig = crypto.sign(null, Buffer.from(payload, "utf8"), key);
    return b64url(sig);
}

function getOrGenerateKeypair() {
    const keyPath = path.join(process.cwd(), 'bff-keypair.json');
    if (fs.existsSync(keyPath)) {
        console.log("[BFF Server] Loading existing Ed25519 keypair from disk...");
        const data = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        return data;
    }

    console.log("[BFF Server] Generating new stable Ed25519 keypair...");
    const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
    const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });
    const privateKeyPem = privateKey.export({ type: "pkcs8", format: "pem" });

    const keypair = { publicKeyPem, privateKeyPem };
    fs.writeFileSync(keyPath, JSON.stringify(keypair, null, 2));
    console.log("[BFF Server] Keypair saved to disk for stable Identity.");
    return keypair;
}

// ----------------------
// Main connect
// ----------------------
const GATEWAY_URL = process.env.VITE_OPENCLAW_REMOTE_WS_URL || "wss://mxlihiaopenclaw1846.up.railway.app";
const GATEWAY_TOKEN = process.env.VITE_OPENCLAW_GATEWAY_TOKEN || "f4fad79632a5a6fc1c1353089c30ce26c1274b958c109daab360fcd7abe1216e";
if (!GATEWAY_TOKEN) throw new Error("Missing VITE_OPENCLAW_GATEWAY_TOKEN env var");

const CLIENT_ID = "cli";
const CLIENT_VERSION = "1.0.0";
const CLIENT_PLATFORM = "node";
const CLIENT_MODE = "cli";
const ROLE = "operator";
const SCOPES = ["operator.read", "operator.write", "admin"]; // full access for the dashboard

const { publicKeyPem, privateKeyPem } = getOrGenerateKeypair();
const deviceId = fingerprintDeviceId(publicKeyPem);
const devicePublicKeyRawB64Url = b64url(derivePublicKeyRawFromPem(publicKeyPem));

console.log(`[BFF Server] Device Identity Fingerprint: ${deviceId}`);

let openClawWs = null;
let isHandshakeComplete = false;

// ----------------------------------------------------
// LOCAL REACT WS SERVER (The Proxy Endpoint for UI)
// ----------------------------------------------------
const wss = new WebSocketServer({ port: 4000 }, () => {
    console.log(`[BFF Server] Internal WS Server listening on ws://localhost:4000`);
});

// React dashboard clients
const uiClients = new Set();

wss.on('connection', (socket) => {
    console.log('[BFF Server] React UI connected to local socket.');
    uiClients.add(socket);

    // If OpenClaw gateway is already connected and authenticated, tell UI it's OK immediately
    if (isHandshakeComplete) {
        socket.send(JSON.stringify({ type: 'hello-ok' }));
    }

    socket.on('message', (message) => {
        // Transparent Forwarding: UI -> Gateway
        const msgStr = message.toString();
        console.log(`[UI -> Gateway]:`, msgStr.substring(0, 100) + '...');
        if (openClawWs && openClawWs.readyState === WebSocket.OPEN && isHandshakeComplete) {
            openClawWs.send(msgStr);
        } else {
            console.warn('[BFF Server] Dropped message from UI, Gateway not ready.');
        }
    });

    socket.on('close', () => {
        console.log('[BFF Server] React UI disconnected.');
        uiClients.delete(socket);
    });
});

function broadcastToUI(msgObj) {
    const data = JSON.stringify(msgObj);
    for (const client of uiClients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    }
}

function connectToGateway() {
    console.log(`[BFF Server] Connecting to OpenClaw Gateway: ${GATEWAY_URL}...`);
    openClawWs = new WebSocket(GATEWAY_URL, {
        headers: {
            "User-Agent": "mxlx-syst-bff/1.0.0",
        },
    });

    openClawWs.on("open", () => {
        console.log("[BFF Server] Gateway Socket opened. Waiting for challenge...");
    });

    openClawWs.on("message", (data) => {
        const msg = JSON.parse(data.toString());

        if (msg?.type === "event" && msg?.event === "connect.challenge") {
            console.log("[BFF Server] Challenge received. Signing payload...");
            const connectNonce = msg.payload?.nonce;
            const signedAtMs = Date.now();

            const payload = buildDeviceAuthPayload({
                deviceId,
                clientId: CLIENT_ID,
                clientMode: CLIENT_MODE,
                role: ROLE,
                scopes: SCOPES,
                signedAtMs,
                token: GATEWAY_TOKEN,
                nonce: connectNonce,
            });

            const signature = signDevicePayload(privateKeyPem, payload);
            const reqId = crypto.randomUUID();

            const frame = {
                type: "req",
                id: reqId,
                method: "connect",
                params: {
                    minProtocol: 3,
                    maxProtocol: 3,
                    client: {
                        id: CLIENT_ID,
                        version: CLIENT_VERSION,
                        platform: CLIENT_PLATFORM,
                        mode: CLIENT_MODE,
                    },
                    role: ROLE,
                    scopes: SCOPES,
                    caps: [],
                    commands: [],
                    permissions: {},
                    auth: { token: GATEWAY_TOKEN },
                    locale: "fr-FR",
                    userAgent: "mxlx-syst-bff/1.0.0",
                    device: {
                        id: deviceId,
                        publicKey: devicePublicKeyRawB64Url,
                        signature,
                        signedAt: signedAtMs,
                        nonce: connectNonce,
                    },
                },
            };

            openClawWs.send(JSON.stringify(frame));
            return;
        }

        // Handshake response check
        if (msg?.type === "res" && msg?.ok && msg?.payload?.type === "hello-ok") {
            console.log("[BFF Server] Gateway Authentication Successful! Forwarding hello-ok to UI clients.");
            isHandshakeComplete = true;
            // Fake a flat hello-ok event backward to React so it trips its isConnected flag
            broadcastToUI({ type: "hello-ok", ...msg.payload });
            return;
        }

        if (msg?.type === "res" && msg?.ok === false && !isHandshakeComplete) {
            console.error("[BFF Server] Auth ERROR:", msg.error);
            return;
        }

        // Transparent Forwarding: Gateway -> UI
        if (isHandshakeComplete) {
            broadcastToUI(msg);
        }
    });

    openClawWs.on("close", (code, reason) => {
        console.log("[BFF Server] Gateway connection closed", code, reason?.toString() || "");
        isHandshakeComplete = false;

        // Notify UI to show disconnected state
        broadcastToUI({ type: "close", code, reason: reason?.toString() });

        setTimeout(connectToGateway, 5000); // Reconnect loop
    });

    openClawWs.on("error", (err) => {
        console.error("[BFF Server] Gateway connection error:", err.message, err.code, err);
    });

    openClawWs.on("unexpected-response", (request, response) => {
        console.error("[BFF Server] Unexpected HTTP response from Gateway:", response.statusCode, response.statusMessage);
        response.on('data', (chunk) => {
            console.error("[BFF Server] HTTP Response Body:", chunk.toString());
        });
    });
}

// Boot
connectToGateway();
