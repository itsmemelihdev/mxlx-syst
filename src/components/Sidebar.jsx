import React from 'react';
import { LayoutDashboard, Users, GitMerge, FileTerminal, Radio } from 'lucide-react';

const NavItem = ({ icon: Icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center w-full px-4 py-3 border-l-2 transition-all group ${active
                ? 'border-accent bg-surface'
                : 'border-transparent hover:border-white/20 hover:bg-white/5'
            }`}
    >
        <Icon className={`w-4 h-4 mr-3 ${active ? 'text-accent' : 'text-gray-500 group-hover:text-gray-300'}`} />
        <span className={`font-heading tracking-widest text-xs uppercase ${active ? 'text-[#E8E4DD]' : 'text-gray-500 group-hover:text-gray-300'
            }`}>{label}</span>
    </button>
);

const ActivityBars = ({ active }) => (
    <div className="flex items-end space-x-[2px] h-3 w-4 opacity-70">
        {[1, 2, 3].map(i => (
            <div
                key={i}
                className={`w-1 bg-accent ${active ? 'animate-pulse' : 'h-1/3'}`}
                style={{
                    height: active ? `${Math.random() * 60 + 40}%` : '30%',
                    animationDelay: `${i * 0.15}s`
                }}
            />
        ))}
    </div>
);

export const Sidebar = ({ activeTab, setActiveTab, agents }) => {
    const tabs = [
        { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
        { id: 'agents', icon: Users, label: 'Agents' },
        { id: 'tasks', icon: GitMerge, label: 'Task Queue' },
        { id: 'intel', icon: FileTerminal, label: 'Intel Feed' },
        { id: 'comms', icon: Radio, label: 'Comms' },
    ];

    return (
        <div className="w-[240px] h-full bg-obsidian border-r border-white/5 flex flex-col shrink-0 z-40 relative">
            <div className="flex-1 overflow-hidden flex flex-col">
                {/* Navigation */}
                <div className="py-4 border-b border-white/5">
                    {tabs.map(tab => (
                        <NavItem
                            key={tab.id}
                            {...tab}
                            active={activeTab === tab.id}
                            onClick={() => setActiveTab(tab.id)}
                        />
                    ))}
                </div>

                {/* Agent Roster */}
                <div className="flex-1 overflow-y-auto py-4 px-4 space-y-3">
                    <div className="text-[10px] font-mono text-gray-500 mb-4 tracking-widest">AGENT ROSTER [ {agents.length} ]</div>
                    {agents.map(agent => (
                        <div key={agent.id} className="tactical-panel !p-3 cursor-crosshair">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="font-heading text-sm text-[#E8E4DD] tracking-wide">{agent.name}</div>
                                    <div className="text-[10px] text-gray-500 font-mono leading-tight mt-0.5">{agent.role.toUpperCase()}</div>
                                </div>
                                <ActivityBars active={agent.state === 'PROCESSING'} />
                            </div>

                            <div className="flex items-center justify-between mt-3">
                                <div className={`text-[9px] font-mono tracking-widest px-1.5 py-0.5 rounded-sm ${agent.state === 'IDLE' ? 'bg-amber-500/10 text-amber-500' :
                                        agent.state === 'ACTIVE' ? 'bg-nominal/10 text-nominal' :
                                            'bg-accent/20 text-accent animate-pulse'
                                    }`}>
                                    {agent.state}
                                </div>
                                {agent.tokens > 0 && (
                                    <div className="text-[9px] text-gray-600 font-mono">
                                        [{agent.tokens} TKNS]
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Connection Endpoint */}
            <div className="p-4 border-t border-white/5 bg-surface/50">
                <div className="flex items-center space-x-2 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-nominal animate-pulse-slow"></div>
                    <div className="text-[9px] font-mono text-nominal tracking-widest uppercase">Mission Control Connected</div>
                </div>
                <div className="flex space-x-2">
                    <input
                        type="text"
                        defaultValue="localhost:3000"
                        className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] font-mono text-gray-400 focus:outline-none focus:border-white/30"
                    />
                    <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-[#E8E4DD] text-[9px] font-heading px-3 rounded uppercase transition-colors">
                        Connect
                    </button>
                </div>
            </div>
        </div>
    );
};
