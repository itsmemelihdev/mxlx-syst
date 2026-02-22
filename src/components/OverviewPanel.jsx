import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

// --- Widget 1: Task Pipeline ---
const TaskPipeline = ({ tasks, setTasks }) => {
    const columns = ['INBOX', 'ASSIGNED', 'IN_PROGRESS', 'REVIEW', 'DONE'];
    const totalCount = columns.reduce((acc, col) => acc + (tasks[col]?.length || 0), 0);

    return (
        <div className="tactical-panel col-span-1 md:col-span-2 row-span-2 flex flex-col h-[400px]">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
                <h3 className="text-heading text-sm">Task Pipeline</h3>
                <span className="text-[10px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded">LIVE</span>
            </div>
            {totalCount === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center border border-white/5 bg-black/40 rounded relative overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none z-0 flex flex-col justify-around opacity-10">
                        <div className="w-full h-px bg-white animate-decrypt-scan" style={{ animationDelay: '0s' }}></div>
                        <div className="w-full h-px bg-white animate-decrypt-scan" style={{ animationDelay: '0.7s' }}></div>
                        <div className="w-full h-px bg-white animate-decrypt-scan" style={{ animationDelay: '1.4s' }}></div>
                    </div>
                    <h4 className="font-heading text-gray-500 tracking-widest text-xs mb-2 animate-glitch-hover cursor-crosshair z-10">PIPELINE SECURE</h4>
                    <div className="font-mono text-[9px] text-gray-600 uppercase tracking-widest z-10">
                        Decrypting Incoming Directives <span className="animate-blink-cursor font-bold">_</span>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex space-x-2 overflow-x-auto pb-2">
                    {columns.map(col => (
                        <div key={col} className="w-64 min-w-[240px] bg-black/40 rounded flex flex-col border border-white/5">
                            <div className="px-3 py-2 border-b border-white/5 bg-white/5 flex justify-between items-center">
                                <span className="font-heading text-[10px] uppercase tracking-wider text-gray-400">{col.replace('_', ' ')}</span>
                                <span className="text-[10px] font-mono bg-black/50 px-1.5 py-0.5 rounded">{tasks[col]?.length || 0}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                {(tasks[col] || []).map(task => (
                                    <div key={task.id} className="bg-surface border border-white/10 p-2 rounded cursor-grab hover:border-accent/40 transition-colors animate-data-enter group relative shadow-md">
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l ${task.priority === 'critical' ? 'bg-critical' : task.priority === 'caution' ? 'bg-caution' : 'bg-nominal'
                                            }`} />
                                        <div className="pl-2">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <span className="font-mono text-[9px] text-gray-500">{task.id}</span>
                                                <span className="font-mono text-[9px] text-accent uppercase">{task.assignee}</span>
                                            </div>
                                            <p className="text-[11px] font-sans text-gray-300 leading-snug line-clamp-2">{task.title}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Widget 2: Cognition Load ---
const CognitionLoad = ({ data }) => {
    return (
        <div className="tactical-panel w-full h-[240px] flex flex-col">
            <div className="flex items-center justify-between mb-4 z-10">
                <h3 className="text-heading text-sm">Cognition Load</h3>
            </div>
            {(!data || data.length === 0) ? (
                <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden border border-white/5 bg-black/40 rounded">
                    <div className="w-16 h-16 rounded-full border border-accent/20 flex items-center justify-center mb-4 animate-breathe-glow relative z-10">
                        <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/30 animate-pulse-slow"></div>
                    </div>
                    <span className="font-mono text-[10px] text-accent/50 tracking-widest cursor-crosshair animate-glitch-hover z-10">AWAITING NEURAL SYNC</span>
                </div>
            ) : (
                <div className="flex-1 relative -mx-4 -mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCog" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorCom" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#E63B2E" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#E63B2E" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-glass border border-white/10 p-2 text-[10px] font-mono shadow-2xl rounded">
                                                <div className="text-accent flex justify-between gap-4"><span>COG</span><span>{payload[0].value.toFixed(1)}%</span></div>
                                                <div className="text-critical flex justify-between gap-4"><span>COM</span><span>{payload[1].value.toFixed(1)}%</span></div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Area type="monotone" dataKey="cognition" stroke="#F59E0B" fillOpacity={1} fill="url(#colorCog)" strokeWidth={1.5} isAnimationActive={false} />
                            <Area type="monotone" dataKey="comms" stroke="#E63B2E" fillOpacity={1} fill="url(#colorCom)" strokeWidth={1} isAnimationActive={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

// --- Sub-component for CLI Boot Sequence ---
const CliBootSequence = () => {
    const [lines, setLines] = useState([]);
    const containerRef = useRef(null);

    useEffect(() => {
        let isMounted = true;
        const generateHex = () => Math.floor(Math.random() * 0xFFFFFFFF).toString(16).toUpperCase().padStart(8, '0');
        const generateGarbage = () => Array.from({ length: 40 }, () => String.fromCharCode(33 + Math.floor(Math.random() * 94))).join('');

        const pushLine = (line, delay) => new Promise(resolve => {
            setTimeout(() => {
                if (isMounted) {
                    setLines(prev => {
                        const newLines = [...prev, line];
                        return newLines.slice(-30); // Keep last 30 lines
                    });
                    resolve();
                }
            }, delay);
        });

        const runSequence = async () => {
            // Phase 1: Bootloader & RAM Check
            await pushLine("[SYSTEM] INITIATING SOVEREIGN KERNEL v9.4", 400);
            for (let i = 0; i < 4; i++) {
                await pushLine(`[MEM] 0x${generateHex()} : ALLOCATED OK`, 80);
            }
            await pushLine("[SYS] MOUNTING SECURE VOLUMES...", 500);
            await pushLine("[OK] ROOTFS MOUNTED", 200);
            await pushLine("[SYS] WAKING NEURAL UPLINK DAEMON...", 800);

            // Phase 2: Decryption Mock
            await pushLine("[SEC] DECRYPTING HANDSHAKE PAYLOAD", 600);
            for (let i = 0; i < 6; i++) {
                await pushLine(`> ${generateGarbage()}`, 50);
            }
            await pushLine("> " + generateGarbage().substring(0, 20) + " [DECRYPTED]", 100);
            await pushLine("[OK] PAYLOAD VERIFIED. CHECKSUM MATCH.", 400);

            // Phase 3: Handshake
            await pushLine("[NET] ESTABLISHING TUNNEL OVER TLS 1.3", 500);
            await pushLine("[NET] NEGOTIATING CIPHER SUITE...", 600);
            await pushLine("[NET] CIPHER: CHACHA20-POLY1305", 200);
            await pushLine("[EXT] WAITING FOR REMOTE GATEWAY CONFIRMATION", 1000);

            // Phase 4: Infinite Loop Scanner
            while (isMounted) {
                const target = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
                const port = Math.floor(Math.random() * 65535);
                await pushLine(`[SCAN] PROBING SECTOR 0x${generateHex()} -> ${target}:${port}`, 150);
                await pushLine(`[WARN] CONNECTION REFUSED BY PEER`, 150);
                await pushLine(`[NET] RE-ROUTING THROUGH PROXY NODE...`, 1500);
                await pushLine(`[SYS] AWAITING AUTHORIZATION TOKEN...`, 2500);
            }
        };

        runSequence();

        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [lines]);

    return (
        <div ref={containerRef} className="font-mono text-[9px] text-accent/70 flex flex-col space-y-1 h-full overflow-y-auto pr-2 hide-scrollbar pb-2">
            {lines.map((line, idx) => (
                <div key={idx} className={`${line.startsWith('>') ? 'text-gray-500' : ''}`}>
                    {line.startsWith('[WARN]') || line.startsWith('[EXT]') || line.startsWith('[SEC]') ? (
                        <span className="text-accent">{line.substring(0, 6)}</span>
                    ) : line.startsWith('[OK]') ? (
                        <span className="text-nominal">{line.substring(0, 4)}</span>
                    ) : line.startsWith('[') ? (
                        <span className="text-gray-500">{line.substring(0, line.indexOf(']') + 1)}</span>
                    ) : null}
                    {line.includes(']') ? line.substring(line.indexOf(']') + 1) : line}
                </div>
            ))}
            <div className="mt-1 flex items-center">&gt; <span className="w-1.5 h-3 bg-accent ml-1 animate-blink-cursor"></span></div>
        </div>
    );
};

// --- Widget 3: Active Directives ---
const ActiveDirectives = ({ messages }) => {
    return (
        <div className="tactical-panel w-full h-[240px] bg-[#050508] border-white/10 flex flex-col">
            <h3 className="text-heading text-sm mb-3">Active Directives</h3>
            {(!messages || messages.length === 0) ? (
                <div className="flex-1 flex flex-col justify-end border border-white/5 bg-black/40 rounded relative overflow-hidden text-left pl-4 pb-2 pt-2">
                    <CliBootSequence />
                </div>
            ) : (
                <div className="flex-1 overflow-hidden relative text-[11px] font-mono text-gray-400 space-y-1.5 leading-relaxed tracking-wider">
                    {messages.map((msg, idx) => (
                        <div key={idx} className="animate-data-enter">
                            {msg.startsWith('[SYSTEM]') ? (
                                <><span className="text-gray-600">[SYSTEM]</span> {msg.replace('[SYSTEM]', '')}</>
                            ) : (
                                <><span className="text-accent">{msg.split('] ')[0]}]</span> {msg.substring(msg.indexOf('] ') + 2)}</>
                            )}
                        </div>
                    ))}
                    <div className="flex items-center text-accent mt-2">
                        <span>&gt;</span>
                        <span className="w-2 h-3 bg-accent ml-2 animate-pulse-fast"></span>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Widget 4: Agent Telemetry Matrix ---
const AgentTelemetry = ({ agents }) => {
    return (
        <div className="tactical-panel w-full h-[320px] flex flex-col">
            <h3 className="text-heading text-sm mb-4">Telemetry Matrix</h3>
            {(!agents || agents.length === 0) ? (
                <div className="flex-1 flex flex-col items-center justify-center border border-white/5 bg-black/40 rounded relative overflow-hidden">
                    <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-1 p-4 opacity-30 pointer-events-none">
                        {[...Array(16)].map((_, i) => (
                            <div key={i} className="bg-white/5 rounded-sm animate-block-shift" style={{ animationDelay: `${(i % 5) * 0.3}s` }}></div>
                        ))}
                    </div>
                    <div className="flex flex-col items-center z-10 bg-black/60 px-4 py-2 rounded shadow-[0_0_15px_rgba(0,0,0,0.8)] border border-white/5">
                        <span className="font-mono text-[10px] text-gray-400 tracking-widest uppercase cursor-crosshair animate-glitch-hover mb-1">Grid Standby</span>
                        <span className="font-mono text-[8px] text-gray-600 uppercase">Allocating Memory Blocks...</span>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-2 flex-auto overflow-y-auto pr-2">
                    {agents.map(agent => (
                        <div key={agent.id} className="bg-black/40 border border-white/5 rounded p-2 relative overflow-hidden group hover:border-accent/30 transition-colors">
                            {agent.state === 'PROCESSING' && (
                                <div className="absolute inset-0 bg-accent/[0.03] animate-pulse"></div>
                            )}
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-heading text-[10px] text-gray-300 tracking-wider group-hover:text-accent transition-colors">{agent.name}</span>
                                <span className={`w-1.5 h-1.5 rounded-full ${agent.state === 'IDLE' ? 'bg-caution' :
                                    agent.state === 'ACTIVE' ? 'bg-nominal' : 'bg-accent animate-pulse-fast'
                                    }`} />
                            </div>
                            <div className="flex justify-between items-end mt-4">
                                <div className="flex flex-col">
                                    <span className="font-mono text-[8px] text-gray-600">TOKENS</span>
                                    <span className="font-mono text-[11px] text-[#E8E4DD]">{agent.tokens.toLocaleString()}</span>
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="font-mono text-[8px] text-gray-600">LOAD</span>
                                    <span className={`font-mono text-[11px] ${agent.load > 80 ? 'text-critical animate-pulse-fast' : 'text-[#E8E4DD]'}`}>
                                        {agent.load.toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                            {/* Sparkline overlay mockup */}
                            <div className="absolute bottom-0 left-0 w-full h-4 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none">
                                <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full">
                                    <path
                                        d={`M0,20 Q25,${20 - agent.load / 5} 50,${20 - agent.load / 7} T100,${20 - agent.load / 4}`}
                                        fill="none"
                                        stroke="var(--accent)"
                                        strokeWidth="1.5"
                                        vectorEffect="non-scaling-stroke"
                                    />
                                </svg>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Widget 5: Threat Heatmap ---
const ThreatHeatmap = ({ heatmapData }) => {
    return (
        <div className="tactical-panel w-full h-[320px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-heading text-sm">Zone Activity</h3>
                <span className="w-2 h-2 rounded bg-accent animate-pulse-fast shadow-[0_0_10px_var(--accent)]" />
            </div>
            {(!heatmapData || heatmapData.length === 0) ? (
                <div className="flex-1 flex flex-col items-center justify-center border border-white/5 bg-black/40 rounded relative overflow-hidden">
                    <div className="absolute w-20 h-20 rounded-full border-2 border-accent/40 animate-sonar-pulse z-0"></div>
                    <div className="flex items-center space-x-2 z-10 bg-black/50 px-3 py-1.5 rounded-full border border-accent/10 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                        <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse-fast"></div>
                        <span className="font-mono text-[9px] text-accent/70 tracking-widest uppercase cursor-crosshair animate-glitch-hover">Sonar Sweep Active</span>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex-1 grid grid-cols-7 grid-rows-7 gap-[2px]">
                        {heatmapData.map((cell) => {
                            let bgColor = 'bg-white/5'; // nominal, idle
                            if (cell.intensity > 85) bgColor = 'bg-critical';
                            else if (cell.intensity > 60) bgColor = 'bg-accent/80';
                            else if (cell.intensity > 40) bgColor = 'bg-caution/50';
                            else if (cell.intensity > 20) bgColor = 'bg-white/20';

                            return (
                                <div
                                    key={cell.id}
                                    className={`${bgColor} rounded-[2px] cursor-crosshair relative group transition-colors duration-1000`}
                                >
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-glass border border-white/10 px-2 py-1 rounded text-[9px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap hidden group-hover:block">
                                        <div className="text-accent mb-0.5">{cell.category}</div>
                                        <div>INT: {cell.intensity.toFixed(0)} | QTY: {cell.count}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-3 flex justify-between text-[8px] font-mono text-gray-500 uppercase">
                        <span>Low</span>
                        <span>Critical Level</span>
                    </div>
                </>
            )}
        </div>
    );
};

// --- Widget 6: System Timeline ---
const SystemTimeline = ({ events }) => {
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }
    }, [events]);

    return (
        <div className="tactical-panel w-full h-[160px] col-span-1 md:col-span-2 lg:col-span-3 flex flex-col">
            <h3 className="text-heading text-sm mb-4">Operational Timeline</h3>
            {(!events || events.length === 0) ? (
                <div className="flex-1 flex flex-col items-center justify-center border border-white/5 bg-black/40 rounded relative overflow-hidden">
                    <div className="w-full h-[1px] absolute top-1/2 -translate-y-1/2 opacity-30 animate-timeline-scroll" style={{ backgroundImage: 'linear-gradient(to right, #F59E0B 50%, transparent 50%)', backgroundSize: '20px 100%' }}></div>
                    <div className="z-10 bg-[#050508] px-4 py-1 border border-accent/20 rounded shadow-[0_0_10px_rgba(0,0,0,0.8)]">
                        <span className="font-mono text-[9px] text-accent/60 tracking-widest uppercase cursor-crosshair hover:text-accent transition-colors">Monitoring Log...</span>
                    </div>
                </div>
            ) : (
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-x-auto overflow-y-hidden flex items-center relative py-4 hide-scrollbar scroll-smooth"
                >
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10 -translate-y-1/2 z-0" style={{ width: Math.max(1000, events.length * 150) + 'px' }} />

                    <div className="flex space-x-12 px-8 z-10 items-center">
                        {events.map((evt, i) => (
                            <div key={i} className="relative flex flex-col items-center min-w-[120px] animate-data-enter">
                                <div className={`w-3 h-3 rounded-full mb-3 border-2 border-black relative z-10 ${evt.severity === 'critical' ? 'bg-critical shadow-[0_0_10px_#E63B2E]' :
                                    evt.severity === 'caution' ? 'bg-caution' : 'bg-nominal shadow-[0_0_5px_#22C55E]'
                                    }`} />
                                <div className="absolute top-1.5 h-6 w-px bg-white/20 left-1/2 -translate-x-1/2 -z-10" />
                                <span className="font-mono text-[9px] text-[#E8E4DD] mb-1 tracking-wider bg-black/60 px-1 rounded">{evt.label}</span>
                                <span className="font-mono text-[8px] text-gray-500 block text-center max-w-full truncate px-2">{new Date(evt.time).toISOString().substr(11, 8)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const OverviewPanel = ({ simulation }) => {
    return (
        <div className="w-full h-full bg-void p-6 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
                <TaskPipeline tasks={simulation.tasks} setTasks={simulation.setTasks} />
                <CognitionLoad data={simulation.cognitionData} />
                <ActiveDirectives messages={simulation.directives} />
                <AgentTelemetry agents={simulation.agentStatus} />
                <ThreatHeatmap heatmapData={simulation.heatmap} />
                <SystemTimeline events={simulation.timelineEvents} />
            </div>
        </div>
    );
};
