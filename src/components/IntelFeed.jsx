import React, { useState } from 'react';
import { AlertTriangle, Info, Zap, Copy } from 'lucide-react';

export const IntelFeed = ({ feed }) => {
    const [filter, setFilter] = useState('ALL');
    const [paused, setPaused] = useState(false);

    const formatTime = (ms) => new Date(ms).toISOString().substr(11, 8);

    const filteredFeed = feed.filter(item => {
        if (filter === 'CRITICAL' && item.severity !== 'critical') return false;
        if (filter === 'AGENTS' && item.source === 'SYSTEM') return false;
        return true;
    });

    const getIcon = (severity) => {
        switch (severity) {
            case 'critical': return <AlertTriangle className="w-3.5 h-3.5 text-critical" />;
            case 'caution': return <Zap className="w-3.5 h-3.5 text-caution" />;
            default: return <Info className="w-3.5 h-3.5 text-nominal" />;
        }
    };

    const copyToClipboard = () => {
        const text = filteredFeed.map(i => `[${formatTime(i.time)}] [${i.source}] ${i.message}`).join('\n');
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="w-[320px] h-full bg-obsidian border-l border-white/5 flex flex-col shrink-0 z-40">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <div className="font-heading text-[#E8E4DD] tracking-wide uppercase text-sm">Intel Feed</div>
                    <div className="bg-white/10 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">{feed.length}</div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="px-4 py-3 border-b border-white/5 flex space-x-2">
                {['ALL', 'CRITICAL', 'AGENTS'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1 rounded text-[10px] font-heading tracking-wider transition-colors ${filter === f ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-surface text-gray-500 border border-white/5 hover:bg-white/5 hover:text-gray-300'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Feed List */}
            <div
                className="flex-1 overflow-y-auto overflow-x-hidden p-2 relative"
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
            >
                {paused && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-surface border border-accent/20 px-3 py-1 rounded text-[9px] font-mono text-accent tracking-widest z-10 opacity-90 shadow-lg pointer-events-none">
                        FEED PAUSED
                    </div>
                )}

                <div className="space-y-1">
                    {filteredFeed.map((item, i) => (
                        <div
                            key={`${item.id}-${i}`}
                            className={`p-3 rounded bg-surface/40 border border-white/5 flex items-start space-x-3 transition-opacity duration-300 hover:bg-surface animate-data-enter`}
                        >
                            <div className="pt-0.5 flex-shrink-0">
                                {getIcon(item.severity)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className="text-[10px] font-mono text-accent">[{item.source}]</span>
                                    <span className="text-[9px] font-mono text-gray-500">{formatTime(item.time)}</span>
                                </div>
                                <div className="text-xs font-sans text-gray-300 leading-relaxed pr-2">
                                    {item.message}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 bg-surface/30">
                <button
                    onClick={copyToClipboard}
                    className="w-full flex items-center justify-center space-x-2 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors text-gray-400 hover:text-white group"
                >
                    <Copy className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-heading tracking-widest uppercase">Export Log</span>
                </button>
            </div>
        </div>
    );
};
