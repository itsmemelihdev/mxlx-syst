import React, { useState, useEffect, useRef } from 'react';

const WELCOME_MESSAGES = {
    ALPHA: "NEXUS LINK ESTABLISHED. Chief of Staff ALPHA online. Awaiting directives.",
    ATLAS: "INTEL UPLINK ACTIVE. ATLAS reconnaissance array online. Query ready.",
    HERALD: "COMMS CHANNEL OPEN. HERALD standing by. Draft, send, or monitor.",
    LEDGER: "LEDGER CONNECTED. Financial telemetry nominal. Awaiting audit request.",
    FORGE: "FORGE ONLINE. Execution engine primed. Assign target objective.",
    ORACLE: "ORACLE SYNC COMPLETE. Personal OS active. Daily brief queued.",
};

export const CommsConsole = ({ agents, activeAgentId, setActiveAgentId }) => {
    // Instead of array, Map of agentId -> array of messages
    const [chatHistories, setChatHistories] = useState(new Map());
    const [inputVal, setInputVal] = useState('');
    // Lock to prevent sending while streaming
    const [isStreaming, setIsStreaming] = useState(false);

    const bottomRef = useRef(null);
    const { client } = useOpenClaw();

    useEffect(() => {
        if (activeAgentId && !chatHistories.has(activeAgentId)) {
            const welcomeMsg = {
                id: Date.now(),
                role: activeAgentId,
                content: WELCOME_MESSAGES[activeAgentId] || "SECURE CHANNEL ESTABLISHED. Awaiting operator input.",
                agent: agents.find(a => a.id === activeAgentId)
            };
            setChatHistories(prev => {
                const newMap = new Map(prev);
                if (!newMap.has(activeAgentId)) {
                    newMap.set(activeAgentId, [welcomeMsg]);
                }
                return newMap;
            });
        }
    }, [activeAgentId, chatHistories, agents]);

    const currentMessages = chatHistories.get(activeAgentId) ?? [];

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentMessages, chatHistories]);

    const activeAgent = agents.find(a => a.id === activeAgentId);

    // ------------------------------------------------------------------------
    // OpenClaw WebSocket Chat Stream Listener (avantlancement.md constraints)
    // ------------------------------------------------------------------------
    useEffect(() => {
        if (!client) return;

        const unsubscribe = client.on('chat', (payload) => {
            const { sessionKey, state, message, errorMessage } = payload;

            setChatHistories(prev => {
                const mapCopy = new Map(prev);
                const msgs = mapCopy.get(sessionKey) || [];
                // We'll mutate the copy to avoid heavy re-allocations during fast streaming
                const lastMsg = msgs[msgs.length - 1];

                if (state === 'delta') {
                    // Accumulate streaming text
                    if (lastMsg && lastMsg.role === sessionKey && lastMsg.isStreaming) {
                        lastMsg.content += (message?.content || '');
                    } else {
                        msgs.push({
                            id: Date.now() + Math.random(),
                            role: sessionKey,
                            content: message?.content || '',
                            isStreaming: true,
                            agent: agents.find(a => a.id === sessionKey)
                        });
                    }
                }
                else if (state === 'final') {
                    // Commit final message
                    if (lastMsg && lastMsg.role === sessionKey && lastMsg.isStreaming) {
                        lastMsg.isStreaming = false;
                        if (message?.content && typeof message.content === 'string') {
                            lastMsg.content = message.content;
                        }
                    } else if (message?.content) {
                        msgs.push({
                            id: Date.now() + Math.random(),
                            role: sessionKey,
                            content: message.content,
                            isStreaming: false,
                            agent: agents.find(a => a.id === sessionKey)
                        });
                    }
                    if (sessionKey === activeAgentId) setIsStreaming(false);
                }
                else if (state === 'aborted' || state === 'error') {
                    msgs.push({
                        id: Date.now() + Math.random(),
                        role: 'SYSTEM_ERROR',
                        content: state === 'error' ? `[ERR] ${errorMessage || 'Unknown stream error'}` : '[STREAM ABORTED BY OPERATOR]',
                        isError: true
                    });
                    if (sessionKey === activeAgentId) setIsStreaming(false);
                }

                mapCopy.set(sessionKey, [...msgs]);
                return mapCopy;
            });
        });

        return () => unsubscribe();
    }, [client, activeAgentId, agents]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!inputVal.trim() || !activeAgentId || isStreaming) return;

        const operatorMsg = { role: 'OPERATOR', content: inputVal };

        setChatHistories(prev => {
            const msgs = prev.get(activeAgentId) || [];
            return new Map(prev).set(activeAgentId, [...msgs, operatorMsg]);
        });

        // Exact OpenClaw `chat.send` WS integration
        try {
            client.sendChatMessage(activeAgentId, inputVal);
            setIsStreaming(true);
        } catch (err) {
            console.error("[CommsConsole] Failed to send over WS", err);
        }

        setInputVal('');
    };

    return (
        <div className="w-full h-full flex bg-void p-6 gap-6 overflow-hidden">

            {/* Left: Command Terminal */}
            <div className="flex-1 flex flex-col tactical-panel">
                <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4 shrink-0">
                    <h2 className="text-heading text-lg">Uplink Console</h2>
                    <div className="flex space-x-1">
                        <span className="px-2 py-0.5 rounded flex items-center bg-accent/20 border border-accent/40 font-mono text-[10px] text-accent font-bold">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse mr-2"></div>
                            {activeAgent?.name || 'GLOBAL'}
                        </span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 font-mono text-[13px] leading-relaxed">
                    {currentMessages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col animate-data-enter ${msg.role === 'OPERATOR' ? 'items-end' : 'items-start'}`}>
                            <div className={`text-[10px] mb-1 font-bold tracking-widest ${msg.role === 'OPERATOR' ? 'text-gray-500' : msg.isError ? 'text-critical' : 'text-accent'}`}>
                                {msg.role}
                            </div>
                            <div className={`px-4 py-2 rounded max-w-[80%] whitespace-pre-wrap ${msg.role === 'OPERATOR'
                                ? 'bg-surface border border-white/10 text-[#E8E4DD]'
                                : msg.isError
                                    ? 'bg-critical/10 border-l-4 border-critical text-critical font-bold mt-2'
                                    : 'bg-accent/5 border left-border border-l-4 border-accent text-gray-300'
                                }`}>
                                {msg.content}
                                {msg.isStreaming && <span className="inline-block w-1.5 h-3 ml-1 bg-accent animate-pulse align-middle"></span>}
                            </div>
                        </div>
                    ))}
                    <div ref={bottomRef} className="h-1" />
                </div>

                <form onSubmit={handleSubmit} className={`shrink-0 flex items-center bg-black/50 border rounded transition-colors p-1 pl-3 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] ${isStreaming ? 'border-white/10 opacity-50 cursor-not-allowed' : 'border-accent/30 focus-within:border-accent'}`}>
                    <span className="text-accent font-mono font-bold mr-2">&gt;</span>
                    <input
                        type="text"
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        disabled={isStreaming}
                        className="flex-1 bg-transparent border-none text-primary font-mono text-[13px] focus:outline-none placeholder-gray-600 h-10 disabled:cursor-not-allowed"
                        placeholder={isStreaming ? "Streaming response..." : "Transmit directive..."}
                        autoFocus
                    />
                    <button type="submit" disabled={isStreaming} className="bg-white/5 hover:bg-accent hover:text-black hover:border-accent text-accent disabled:text-gray-500 disabled:border-gray-600 disabled:hover:bg-transparent font-heading px-6 py-2 rounded text-xs tracking-widest uppercase transition-all border border-accent/30 h-10 font-bold ml-2">
                        {isStreaming ? 'STREAMING' : 'TRANSMIT'}
                    </button>
                </form>
            </div>

            {/* Right: Agent Context */}
            <div className="w-[320px] flex flex-col space-y-4 shrink-0 overflow-y-auto">
                <div className="tactical-panel w-full flex flex-col border-t-2 border-t-accent">
                    <div className="mb-6">
                        <h2 className="font-serif italic text-3xl text-[#E8E4DD] mb-1">{activeAgent?.name || 'SYS'}</h2>
                        <div className="font-mono text-[10px] text-accent tracking-widest uppercase bg-accent/10 px-2 py-1 inline-block rounded">
                            {activeAgent?.role || 'N/A'}
                        </div>
                    </div>

                    <div className="space-y-4 flex-1">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="text-[10px] font-heading text-gray-500 uppercase">Status</span>
                            <span className={`text-[10px] font-mono font-bold ${activeAgent?.state === 'ACTIVE' ? 'text-nominal pulse' : 'text-caution'}`}>
                                {activeAgent?.state || 'IDLE'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="text-[10px] font-heading text-gray-500 uppercase">Tokens Consumed</span>
                            <span className="text-[10px] font-mono text-[#E8E4DD]">{(activeAgent?.tokens || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="text-[10px] font-heading text-gray-500 uppercase">Current Load</span>
                            <span className="text-[10px] font-mono text-[#E8E4DD]">{typeof activeAgent?.load === 'number' ? activeAgent.load.toFixed(1) : 0}%</span>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10">
                        <h3 className="text-heading text-xs text-gray-400 mb-3">Recent Sub-tasks</h3>
                        <div className="space-y-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-start space-x-2 text-[10px] font-mono opacity-60">
                                    <div className="w-3 h-3 border border-gray-500 rounded-sm flex items-center justify-center shrink-0 mt-0.5">
                                        {i !== 1 && <div className="w-1.5 h-1.5 bg-gray-500" />}
                                    </div>
                                    <span className={i !== 1 ? 'line-through text-gray-600' : 'text-gray-300'}>
                                        {i === 1 ? 'Awaiting command parsing' : 'Initialization sequence and memory pre-fetch'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="tactical-panel w-full">
                    <div className="text-[10px] font-heading text-gray-500 uppercase mb-3 tracking-widest">Available Links</div>
                    <div className="flex flex-wrap gap-2">
                        {agents.map(a => (
                            <button
                                key={a.id}
                                onClick={() => setActiveAgentId(a.id)}
                                className={`px-3 py-1.5 font-mono text-[9px] rounded border transition-all ${activeAgentId === a.id
                                    ? 'bg-accent/20 border-accent text-accent shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                    : 'bg-black/30 border-white/10 hover:border-white/30 text-gray-500'
                                    }`}
                            >
                                {a.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
};
