import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, Flame, Copy, Check } from 'lucide-react';

const ThreatMatrix = ({ heatmapData }) => {
    return (
        <div className="tactical-panel w-full flex flex-col mb-6 shrink-0">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-heading text-sm text-[#E8E4DD] tracking-widest">Threat Matrix</h3>
                <span className="w-2 h-2 rounded bg-accent animate-pulse-fast shadow-[0_0_10px_var(--accent)]" />
            </div>
            <div className="grid grid-cols-7 grid-rows-7 gap-1">
                {heatmapData.map((cell) => {
                    let bgColor = 'bg-white/5';
                    if (cell.intensity > 85) bgColor = 'bg-critical shadow-[0_0_8px_rgba(230,59,46,0.5)] z-10';
                    else if (cell.intensity > 60) bgColor = 'bg-accent/80 shadow-[0_0_5px_rgba(245,158,11,0.3)]';
                    else if (cell.intensity > 40) bgColor = 'bg-caution/50';
                    else if (cell.intensity > 20) bgColor = 'bg-white/20';

                    return (
                        <div
                            key={cell.id}
                            className={`${bgColor} aspect-square rounded-[2px] cursor-crosshair relative group transition-colors duration-1000`}
                        >
                            <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-glass border border-white/10 px-3 py-2 rounded shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none w-48 hidden group-hover:block">
                                <div className="text-[10px] font-heading text-accent mb-1 tracking-widest uppercase">{cell.category}</div>
                                <div className="flex justify-between font-mono text-[9px] text-[#E8E4DD] mb-1.5">
                                    <span>INT: {cell.intensity.toFixed(1)}%</span>
                                    <span>QTY: {cell.count}</span>
                                </div>
                                <div className="h-1 w-full bg-white/10 rounded overflow-hidden">
                                    <div className={`h-full ${bgColor.split(' ')[0]}`} style={{ width: `${Math.min(100, cell.intensity)}%` }} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const SourceBreakdown = ({ feed }) => {
    // Compute stats per source
    const sources = {};
    feed.forEach(item => {
        if (!sources[item.source]) {
            sources[item.source] = {
                name: item.source,
                total: 0,
                nominal: 0,
                caution: 0,
                critical: 0,
                lastActive: item.time
            };
        }
        const s = sources[item.source];
        s.total++;
        s[item.severity]++;
        if (item.time > s.lastActive) s.lastActive = item.time;
    });

    const sourceList = Object.values(sources).sort((a, b) => b.total - a.total);

    const formatRelTime = (ms) => {
        const s = Math.floor((Date.now() - ms) / 1000);
        if (s < 60) return `${s}s ago`;
        return `${Math.floor(s / 60)}m ago`;
    };

    return (
        <div className="tactical-panel w-full flex-1 flex flex-col overflow-hidden">
            <h3 className="text-heading text-sm text-[#E8E4DD] tracking-widest mb-4 shrink-0">Source Breakdown</h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                {sourceList.map(src => {
                    const nominalPct = (src.nominal / src.total) * 100;
                    const cautionPct = (src.caution / src.total) * 100;
                    const criticalPct = (src.critical / src.total) * 100;

                    return (
                        <div key={src.name} className="bg-black/40 border border-white/5 p-3 rounded">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center space-x-2">
                                    <span className={`font-mono text-[10px] uppercase font-bold tracking-widest ${src.name === 'SYSTEM' ? 'text-gray-400' : 'text-accent'}`}>{src.name}</span>
                                    <span className="font-mono text-[9px] bg-white/10 text-white px-1.5 py-0.5 rounded">{src.total}</span>
                                </div>
                                <span className="font-mono text-[9px] text-gray-500">{formatRelTime(src.lastActive)}</span>
                            </div>

                            {/* Segmented bar */}
                            <div className="h-1.5 w-full flex rounded overflow-hidden opacity-80">
                                <div className="bg-nominal transition-all" style={{ width: `${nominalPct}%` }} title={`Nominal: ${src.nominal}`} />
                                <div className="bg-caution transition-all" style={{ width: `${cautionPct}%` }} title={`Caution: ${src.caution}`} />
                                <div className="bg-critical transition-all" style={{ width: `${criticalPct}%` }} title={`Critical: ${src.critical}`} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const IntelPanel = ({ intelFeed, heatmap, agents }) => {
    const [severityFilter, setSeverityFilter] = useState('ALL');
    const [sourceFilter, setSourceFilter] = useState('ALL');
    const [copying, setCopying] = useState(false);

    const getIcon = (severity) => {
        if (severity === 'critical') return <Flame className="w-4 h-4 text-critical" />;
        if (severity === 'caution') return <AlertTriangle className="w-4 h-4 text-caution" />;
        return <Info className="w-4 h-4 text-nominal" />;
    };

    const sources = ['ALL', ...Array.from(new Set(intelFeed.map(i => i.source)))];

    const filteredFeed = intelFeed.filter(item => {
        if (severityFilter !== 'ALL' && item.severity !== severityFilter.toLowerCase()) return false;
        if (sourceFilter !== 'ALL' && item.source !== sourceFilter) return false;
        return true;
    });

    const handleExport = () => {
        const text = filteredFeed.map(i => `[${new Date(i.time).toISOString().substr(11, 8)}] [${i.source}] [${i.severity.toUpperCase()}] ${i.message}`).join('\n');
        navigator.clipboard.writeText(text);
        setCopying(true);
        setTimeout(() => setCopying(false), 2000);
    };

    return (
        <div className="w-full h-full bg-void p-6 flex gap-6 overflow-hidden">

            {/* Left Column - 60% */}
            <div className="w-[60%] flex flex-col h-full bg-obsidian rounded-lg border border-white/5 overflow-hidden shadow-2xl">

                {/* Header & Filters */}
                <div className="p-4 border-b border-white/5 bg-surface/50 shrink-0">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-heading text-lg text-[#E8E4DD] tracking-widest uppercase">Full Intel Stream</h2>
                        <button
                            onClick={handleExport}
                            className={`flex items-center space-x-2 px-4 py-1.5 border rounded text-[10px] font-heading tracking-widest uppercase transition-all ${copying
                                    ? 'bg-nominal/20 border-nominal text-nominal'
                                    : 'bg-white/5 border-white/10 hover:border-white/30 text-gray-400 hover:text-white'
                                }`}
                        >
                            {copying ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copying ? 'Copied' : 'Export Log'}</span>
                        </button>
                    </div>

                    <div className="flex justify-between items-center">
                        <div className="flex space-x-2">
                            {['ALL', 'CRITICAL', 'CAUTION', 'NOMINAL'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setSeverityFilter(f)}
                                    className={`px-3 py-1 rounded text-[10px] font-heading tracking-widest transition-colors border ${severityFilter === f
                                            ? f === 'CRITICAL' ? 'bg-critical/20 text-critical border-critical/40'
                                                : f === 'CAUTION' ? 'bg-caution/20 text-caution border-caution/40'
                                                    : f === 'NOMINAL' ? 'bg-nominal/20 text-nominal border-nominal/40'
                                                        : 'bg-accent/20 text-accent border-accent/40'
                                            : 'bg-black/30 text-gray-500 border-white/5 hover:border-white/20 hover:text-gray-300'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-mono text-gray-600 uppercase">Source:</span>
                            <select
                                value={sourceFilter}
                                onChange={(e) => setSourceFilter(e.target.value)}
                                className="bg-black/50 border border-white/10 text-white font-mono text-[10px] px-2 py-1 rounded outline-none focus:border-accent"
                            >
                                {sources.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Log Stream */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 relative bg-[#0A0A0F]">
                    <div className="space-y-[2px]">
                        {filteredFeed.map((item, idx) => (
                            <div
                                key={`${item.id}-${idx}`}
                                className="px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] border border-transparent hover:border-white/5 flex items-start space-x-4 transition-colors animate-data-enter group"
                            >
                                <div className="flex-shrink-0 pt-0.5">
                                    {getIcon(item.severity)}
                                </div>
                                <div className="font-mono text-[11px] text-[#6B7280] pt-0.5 w-[70px] shrink-0">
                                    {new Date(item.time).toISOString().substr(11, 8)}
                                </div>
                                <div className="flex-shrink-0 w-[80px]">
                                    <span className={`font-mono text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded ${item.source === 'SYSTEM' ? 'bg-white/5 text-[#E8E4DD]' : 'bg-accent/10 text-accent border border-accent/20'
                                        }`}>
                                        {item.source}
                                    </span>
                                </div>
                                <div className="flex-1 font-sans text-[13px] text-white leading-relaxed">
                                    {item.message}
                                </div>
                                <div className="font-mono text-[10px] text-[#6B7280] bg-black/50 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    {item.label}
                                </div>
                            </div>
                        ))}

                        {filteredFeed.length === 0 && (
                            <div className="h-full flex items-center justify-center font-mono text-gray-500 text-xs">
                                [ NO EVENTS MATCHING FILTERS ]
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Column - 40% */}
            <div className="w-[40%] flex flex-col h-full gap-6">
                <ThreatMatrix heatmapData={heatmap} />
                <SourceBreakdown feed={intelFeed} />
            </div>

        </div>
    );
};
