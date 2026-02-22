import WebSocket from 'ws';

const ws = new WebSocket("ws://217.65.146.21:43533", {
    headers: {
        "Origin": "http://localhost:5173"
    }
});

ws.on("open", () => {
    console.log("[Test] Socket opened");
});

ws.on("message", (data) => {
    const dataStr = data.toString();
    console.log("[Test] RX:", dataStr);
    try {
        const frame = JSON.parse(dataStr);
        if (frame.type === "event" && frame.event === "connect.challenge") {
            const req = {
                type: "req",
                id: "test-req-id-12345",
                method: "connect",
                params: {
                    minProtocol: 1,
                    maxProtocol: 3,
                    client: {
                        id: "cli",
                        version: "1.0.0",
                        platform: "web",
                        mode: "cli"
                    },
                    auth: {
                        token: "CCFpi2mPpDWFJuZqNo2RWp7MeTsZa2jD"
                    }
                }
            };
            console.log("[Test] TX:", JSON.stringify(req));
            ws.send(JSON.stringify(req));
        }
    } catch (e) {
        // ...
    }
});

ws.on("close", (code, reason) => {
    console.log(`[Test] Closed: code=${code}`);
});

setTimeout(() => {
    console.log("[Test] Timeout reached, exiting.");
    process.exit(0);
}, 4000);
