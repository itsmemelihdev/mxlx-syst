import { v4 as uuidv4 } from 'uuid';

export class OpenClawClient {
    constructor(config = {}) {
        // URL Builder (wss if https, ws otherwise)
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = config.host || window.location.hostname;
        const port = config.port || 43533;
        const defaultUrl = `${protocol}//${host}:${port}`;

        this.url = import.meta.env.VITE_OPENCLAW_WS_URL || defaultUrl;
        this.token = config.token || import.meta.env.VITE_OPENCLAW_GATEWAY_TOKEN || '';

        this.ws = null;
        this.listeners = new Map();
        this.reconnectTimer = null;
        this.reconnectAttempts = 0;
        this.maxReconnectDelay = 30000;

        // Auth Handshake state
        this.isConnected = false;
        this.hasHandshakeCompleted = false;

        // Callbacks for UI React Hooks
        this.onStatusChange = config.onStatusChange || (() => { });
    }

    connect() {
        if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
            return;
        }

        this._setStatus('CONNECTING');
        this.ws = new WebSocket(this.url);

        this.ws.onopen = this._handleOpen.bind(this);
        this.ws.onmessage = this._handleMessage.bind(this);
        this.ws.onclose = this._handleClose.bind(this);
        this.ws.onerror = this._handleError.bind(this);
    }

    disconnect() {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        if (this.ws) {
            this.ws.close(1000, "Client disconnect");
            this.ws = null;
        }
        this.isConnected = false;
        this.hasHandshakeCompleted = false;
        this._setStatus('DISCONNECTED');
    }

    _setStatus(status) {
        this.onStatusChange(status);
    }

    _handleOpen() {
        console.log(`[OpenClaw] WS Socket opened to ${this.url}. Awaiting connect.challenge...`);
        // Note: Do not emit 'CONNECTED' yet. Wait for handshake.
    }

    _handleMessage(event) {
        try {
            const frame = JSON.parse(event.data);

            // 1. Handshake Phase
            if (!this.hasHandshakeCompleted && frame.type === 'event' && frame.event === 'connect.challenge') {
                this._replyToChallenge(frame.payload);
                return;
            }

            if (!this.hasHandshakeCompleted && frame.type === 'hello-ok') {
                this.hasHandshakeCompleted = true;
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this._setStatus('CONNECTED');
                console.log('[OpenClaw] Handshake OK. Protocol Active.');
                return;
            }

            // 2. Gateway Event Dispatcher (post-handshake)
            if (this.hasHandshakeCompleted) {
                if (frame.type === 'event') {
                    this._emitEvent(frame.event, frame.payload);
                } else if (frame.type === 'res') {
                    // RPC Response (e.g for agents.list)
                    this._emitEvent(`res:${frame.id}`, frame);
                }
            }

        } catch (e) {
            console.warn('[OpenClaw] Failed to parse Gateway frame', e);
        }
    }

    _replyToChallenge(challengePayload) {
        // Create strictly structured ConnectParams Schema Payload
        const connectParams = {
            minProtocol: 1,
            maxProtocol: 3,
            client: {
                id: "MXLX-Syst-UI",
                version: "1.0.0",
                platform: "web",
                mode: "operator"
            },
            role: "operator",
            auth: {
                token: this.token
            }
        };

        // Challenge Response RequestFrame
        const reqFrame = {
            type: "req",
            id: uuidv4(),
            method: "connect",
            params: connectParams
        };

        this._sendFrame(reqFrame);
    }

    _handleClose(event) {
        this.hasHandshakeCompleted = false;
        this.isConnected = false;
        this._setStatus('RECONNECTING');

        // Exponantial backoff for reconnect
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), this.maxReconnectDelay);
        this.reconnectAttempts++;

        console.log(`[OpenClaw] WS Closed. Reconnecting in ${delay}ms...`);
        this.reconnectTimer = setTimeout(() => this.connect(), delay);
    }

    _handleError(error) {
        console.error('[OpenClaw] WS Error:', error);
        // onclose will handle reconnect
    }

    _sendFrame(frame) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(frame));
        } else {
            console.warn('[OpenClaw] Cannot send frame over closed socket', frame);
        }
    }

    // ============== PUBLIC API =================

    /**
     * Send a chat message to an agent session using the chat.send exact method schema + idempotency key.
     */
    sendChatMessage(sessionKey, messageString) {
        if (!this.hasHandshakeCompleted) throw new Error("Gateway not connected");

        const reqId = uuidv4();
        const frame = {
            type: "req",
            id: reqId,
            method: "chat.send",
            params: {
                sessionKey: sessionKey,
                message: messageString,
                idempotencyKey: uuidv4() // Obligatory constraint from avantlancement.md
            }
        };

        this._sendFrame(frame);
        return reqId; // To tie responses if needed, though streaming comes via `event: "chat"`
    }

    /**
     * Request a generic RPC method
     */
    requestMethod(method, params = {}) {
        if (!this.hasHandshakeCompleted) throw new Error("Gateway not connected");
        const reqId = uuidv4();
        this._sendFrame({
            type: "req",
            id: reqId,
            method: method,
            params: params
        });
        return reqId;
    }

    /**
     * Subscribe to Gateway Events (like 'chat', 'presence.*')
     */
    on(eventName, callback) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set());
        }
        this.listeners.get(eventName).add(callback);
        return () => this.off(eventName, callback); // Returns cleanup fn
    }

    off(eventName, callback) {
        if (this.listeners.has(eventName)) {
            this.listeners.get(eventName).delete(callback);
        }
    }

    _emitEvent(eventName, payload) {
        if (this.listeners.has(eventName)) {
            for (const cb of this.listeners.get(eventName)) {
                cb(payload);
            }
        }
    }
}

// Singleton for easy access across the app
export const openClawClient = new OpenClawClient();
