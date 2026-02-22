import React from 'react';

export const Statusbar = ({ metrics }) => {

    const formatUptime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const statusItems = [
        { label: 'ACTIVE AGENTS', value: metrics.activeAgents },
        { label: 'TASKS IN FLIGHT', value: metrics.tasksInFlight, highlight: metrics.tasksInFlight > 0 },
        { label: 'QUEUE DEPTH', value: metrics.queueDepth },
        { label: 'AVG RESPONSE', value: `${Math.floor(metrics.avgResponse)}ms` },
        { label: 'SESSION UPTIME', value: formatUptime(metrics.uptime) }
    ];

    return (
        <div className="h-8 w-full bg-[#050508] border-t border-white/5 flex shrink-0 z-50 overflow-hidden text-[10px]">
            {statusItems.map((item, idx) => (
                <div
                    key={item.label}
                    className={`flex-1 flex items-center justify-between px-4 border-r border-white/5 last:border-r-0 ${item.highlight ? 'text-accent' : 'text-gray-500'
                        }`}
                >
                    <span className="font-heading tracking-widest uppercase opacity-80">{item.label}</span>
                    <span className={`font-mono ${item.highlight ? 'animate-pulse' : 'text-[#E8E4DD]'}`}>{item.value}</span>
                </div>
            ))}
            {/* Visual terminal cursor block at end */}
            <div className="w-8 flex items-center justify-center bg-accent/10 border-l border-accent/20">
                <div className="w-2 h-3 bg-accent animate-pulse-fast"></div>
            </div>
        </div>
    );
};
