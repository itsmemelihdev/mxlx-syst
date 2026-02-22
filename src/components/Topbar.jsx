import React, { useState, useEffect } from 'react';

const formatTime = (ms) => {
    const d = new Date();
    return d.toISOString().substr(11, 8) + ' UTC';
};

const formatUptime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `T+${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const Topbar = ({ missionTime, globalHealth, connectionStatus }) => {
    const [time, setTime] = useState(formatTime());

    useEffect(() => {
        const timer = setInterval(() => setTime(formatTime()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="h-12 w-full bg-obsidian border-b border-white/5 flex items-center justify-between px-6 z-50 relative shrink-0">
            {/* Left items */}
            <div className="flex flex-col">
                <div className="font-serif italic text-accent text-lg leading-tight uppercase tracking-wide">
                    MXLX Syst. Command Center
                </div>
                <div className="font-mono text-[10px] text-gray-500 tracking-widest opacity-80">
                    CLASSIFICATION: OP INTERNAL
                </div>
            </div>

            {/* Center items */}
            <div className="absolute left-[50%] translate-x-[-50%] flex flex-col items-center">
                <div className="font-mono text-primary text-sm tracking-wider">{time}</div>
                <div className="font-mono text-[10px] text-accent tracking-widest">{formatUptime(missionTime)}</div>
            </div>

            {/* Right items */}
            <div className="flex items-center space-x-6">
                <div className="flex space-x-3 bg-surface px-3 py-1.5 rounded border border-white/5">
                    {['ingestion', 'cognition', 'comms'].map(sys => (
                        <div key={sys} className="flex items-center space-x-1.5" title={`System: ${sys}`}>
                            <div className={`w-2 h-2 rounded-full ${globalHealth[sys] === 'nominal' ? 'bg-nominal animate-pulse-slow' :
                                globalHealth[sys] === 'caution' ? 'bg-caution animate-pulse-fast' : 'bg-critical animate-strobe'
                                }`} />
                            <span className="font-heading text-[9px] uppercase tracking-wider text-gray-400">{sys.substring(0, 3)}</span>
                        </div>
                    ))}
                </div>

                <div className={`flex items-center space-x-2 border px-3 py-1 rounded transition-colors ${connectionStatus === 'CONNECTED' ? 'bg-nominal/10 border-nominal/30' :
                        connectionStatus === 'RECONNECTING' ? 'bg-caution/10 border-caution/30' :
                            'bg-critical/10 border-critical/30'
                    }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'CONNECTED' ? 'bg-nominal animate-pulse' :
                            connectionStatus === 'RECONNECTING' ? 'bg-caution animate-ping' :
                                'bg-critical'
                        }`}></div>
                    <span className={`font-heading text-[10px] tracking-widest uppercase mt-[1px] ${connectionStatus === 'CONNECTED' ? 'text-nominal' :
                            connectionStatus === 'RECONNECTING' ? 'text-caution' :
                                'text-critical'
                        }`}>
                        {connectionStatus === 'CONNECTED' ? 'UPLINK ESTABLISHED' :
                            connectionStatus === 'RECONNECTING' ? 'REESTABLISHING...' :
                                'NO SIGNAL'}
                    </span>
                </div>
            </div>
        </div>
    );
};
