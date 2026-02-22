import React from 'react';
import { Zap } from 'lucide-react';

export const AgentsPanel = ({ agents, systemMetrics, onSelectAgent }) => {
    const activeCount = agents.filter(a => a.state !== 'IDLE').length;

    const getAvgLoad = () => {
        if (!agents.length) return 0;
        const total = agents.reduce((acc, a) => acc + (a.load || 0), 0);
        return (total / agents.length).toFixed(1);
    };

    const getTotalTokens = () => {
        return agents.reduce((acc, a) => acc + (a.tokens || 0), 0).toLocaleString();
    };

    return (
        <div className="w-full h-full bg-void p-6 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center space-x-4 mb-6 shrink-0">
                <h2 className="font-heading text-xl uppercase tracking-widest text-[#E8E4DD]">Agent Roster</h2>
                <div className="flex items-center space-x-2 bg-nominal/10 border border-nominal/20 px-3 py-1 rounded">
                    <div className="w-2 h-2 rounded-full bg-nominal animate-pulse"></div>
                    <span className="font-mono text-[10px] text-nominal tracking-widest uppercase">{activeCount} ACTIVE</span>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative">
                {agents.length === 0 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 relative overflow-hidden rounded-lg border border-white/5 bg-black/40">
                        {/* Scanline Background */}
                        <div className="absolute inset-0 z-0 opacity-50">
                            <div className="w-full h-[10%] bg-gradient-to-b from-transparent via-white/10 to-transparent animate-scanline"></div>
                        </div>

                        {/* Circular Radar */}
                        <div className="w-40 h-40 rounded-full border border-white/10 flex items-center justify-center mb-8 relative overflow-hidden shadow-[inset_0_0_30px_rgba(255,255,255,0.05)] z-10">
                            <div className="absolute inset-x-0 top-1/2 h-px bg-white/10"></div>
                            <div className="absolute inset-y-0 left-1/2 w-px bg-white/10"></div>
                            <div className="absolute w-24 h-24 rounded-full border border-white/5"></div>
                            <div
                                className="w-[150%] h-[150%] absolute origin-center animate-radar-spin"
                                style={{ background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(255, 255, 255, 0.1) 360deg)' }}
                            ></div>
                            <div className="absolute w-8 h-8 rounded-full border border-white/40 animate-radar-ping z-0"></div>
                            <Zap className="w-6 h-6 text-gray-500 relative z-10 animate-pulse-slow" />
                        </div>

                        <h2 className="font-heading text-lg text-gray-400 tracking-[0.2em] uppercase mb-2 animate-glitch-hover cursor-crosshair select-none">
                            Tracking Signatures...
                        </h2>
                        <p className="font-mono text-[10px] text-gray-500 max-w-sm text-center tracking-widest leading-relaxed">
                            No active intelligence assets detected in sector. Awaiting synchronisation with OpenClaw Command Gateway.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {agents.map(agent => (
                            <div key={agent.id} className="tactical-panel flex flex-col group relative overflow-hidden transition-all duration-300">

                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div>
                                        <div className={`font-serif italic text-3xl mb-1 ${agent.state === 'PROCESSING' ? 'text-accent' : 'text-white'}`}>
                                            {agent.name}
                                        </div>
                                        <div className="font-sans text-xs text-[#6B7280]">
                                            {agent.role}
                                        </div>
                                    </div>
                                    <div className={`px-2 py-0.5 rounded text-[10px] font-mono tracking-widest uppercase ${agent.state === 'PROCESSING' ? 'bg-accent/20 text-accent border border-accent/30 animate-pulse-fast' :
                                        agent.state === 'ACTIVE' ? 'bg-nominal/20 text-nominal border border-nominal/30 animate-pulse-slow' :
                                            'bg-surface border border-white/10 text-gray-500'
                                        }`}>
                                        {agent.state}
                                    </div>
                                </div>

                                {/* Load Bar */}
                                <div className="mb-4 relative z-10">
                                    <div className="flex justify-between text-[10px] font-mono text-[#6B7280] mb-1.5 uppercase tracking-wider">
                                        <span>System Load</span>
                                        <span className={agent.load > 80 ? 'text-critical' : agent.load > 50 ? 'text-caution' : 'text-nominal'}>
                                            {(agent.load || 0).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded overflow-hidden relative">
                                        <div
                                            className={`absolute top-0 left-0 h-full transition-all duration-500 ${agent.load > 80 ? 'bg-critical' : agent.load > 50 ? 'bg-caution' : 'bg-nominal'
                                                }`}
                                            style={{ width: `${agent.load || 0}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Tokens & Task */}
                                <div className="grid grid-cols-2 gap-4 mb-5 relative z-10">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-mono text-[#6B7280] uppercase tracking-wider mb-1">Tokens Ingested</span>
                                        <span className="font-mono text-sm text-[#E8E4DD] animate-data-enter" key={agent.tokens}>{agent.tokens.toLocaleString()}</span>
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[9px] font-mono text-[#6B7280] uppercase tracking-wider mb-1">Active Task</span>
                                        {agent.activeTask ? (
                                            <div className="flex items-center text-sm font-mono text-white min-w-0" title={agent.activeTask}>
                                                <Zap className="w-3.5 h-3.5 mr-1.5 text-accent shrink-0" />
                                                <span className="truncate">{agent.activeTask}</span>
                                            </div>
                                        ) : (
                                            <span className="text-sm font-mono text-[#6B7280] whitespace-nowrap">[ STANDBY ]</span>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-auto relative z-10">
                                    <button
                                        onClick={() => onSelectAgent(agent.id)}
                                        className="w-full py-2 bg-black/40 hover:bg-black border border-white/5 hover:border-accent/40 rounded text-[10px] font-heading text-gray-400 hover:text-accent tracking-widest uppercase transition-all shadow-md group-hover:shadow-[0_0_10px_rgba(245,158,11,0.1)]"
                                    >
                                        Uplink
                                    </button>
                                </div>

                                {/* Ambient processing effect */}
                                {agent.state === 'PROCESSING' && (
                                    <div className="absolute inset-0 bg-gradient-to-t from-accent/5 to-transparent pointer-events-none opacity-50 z-0 animate-pulse-slow"></div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Squad Telemetry */}
            <div className="mt-6 shrink-0 py-3 border-t border-white/5 bg-obsidian flex justify-between items-center text-[10px] font-mono text-gray-500 uppercase tracking-widest px-6 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] z-20">
                <div className="flex items-center space-x-8">
                    <div>
                        <span className="mr-2">Active Agents:</span>
                        <span className="text-white bg-white/5 px-2 py-0.5 rounded">{activeCount} / {agents.length}</span>
                    </div>
                    <div className="w-px h-4 bg-white/10"></div>
                    <div>
                        <span className="mr-2">Avg Load:</span>
                        <span className={getAvgLoad() > 80 ? 'text-critical' : getAvgLoad() > 50 ? 'text-caution' : 'text-nominal'}>{getAvgLoad()}%</span>
                    </div>
                    <div className="w-px h-4 bg-white/10"></div>
                    <div>
                        <span className="mr-2">Total Tokens:</span>
                        <span className="text-white">{getTotalTokens()}</span>
                    </div>
                    <div className="w-px h-4 bg-white/10"></div>
                    <div>
                        <span className="mr-2">Avg Resp:</span>
                        <span className="text-white">{systemMetrics.avgResponse.toFixed(0)} ms</span>
                    </div>
                </div>

                <div className="flex items-center text-accent/50">
                    <div className="w-1.5 h-1.5 bg-accent/50 rounded-full animate-pulse-fast mr-2"></div>
                    SQUAD TELEMETRY SYNCED
                </div>
            </div>

        </div>
    );
};
