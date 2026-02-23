import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Statusbar } from './components/Statusbar';
import { IntelFeed } from './components/IntelFeed';
import { OverviewPanel } from './components/OverviewPanel';
import { CommsConsole } from './components/CommsConsole';
import { AgentsPanel } from './components/AgentsPanel';
import { TasksPanel } from './components/TasksPanel';
import { IntelPanel } from './components/IntelPanel';
import { useOpenClaw, useTasksApi } from './hooks/useOpenClaw';
import { WifiOff } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeAgentId, setActiveAgentId] = useState(null);

  // Real OpenClaw Gateway Integration
  const openClawState = useOpenClaw();
  const tasksApi = useTasksApi();

  // Unified object mimicking the old simulation shape for backward compatibility with UI props
  const simulation = {
    missionTime: new Date().toISOString().substr(11, 8), // Local clock fallback since Gateway doesn't broadcast time ticks
    agentStatus: openClawState.agentStatus,
    intelFeed: openClawState.intelFeed,
    systemMetrics: openClawState.systemMetrics,
    tasks: tasksApi.tasks,
    heatmap: [], // OpenClaw doesn't provide heatmap natively
    directives: [], // Fallback
    cognitionData: [], // Fallback
    timelineEvents: openClawState.intelFeed, // Map intelFeed to timelineEvents for now to avoid crash
    connectionStatus: openClawState.connectionStatus
  };

  return (
    <div className="w-full h-full flex flex-col bg-void text-primary selection:bg-accent selection:text-black overflow-hidden relative font-sans">
      {/* 
        Grid & noise overlay handled globally by body::before & ::after in index.css 
      */}

      <Topbar
        missionTime={simulation.missionTime}
        globalHealth={simulation.systemMetrics.globalHealth}
        connectionStatus={simulation.connectionStatus}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          agents={simulation.agentStatus}
        />

        <main className="flex-1 overflow-hidden relative">
          {activeTab === 'overview' && <OverviewPanel simulation={simulation} />}
          {activeTab === 'agents' && (
            <AgentsPanel
              agents={simulation.agentStatus}
              systemMetrics={simulation.systemMetrics}
              onSelectAgent={(id) => {
                setActiveAgentId(id);
                setActiveTab('comms');
              }}
            />
          )}
          {activeTab === 'comms' && (
            <CommsConsole
              agents={simulation.agentStatus}
              activeAgentId={activeAgentId || simulation.agentStatus[0]?.id}
              setActiveAgentId={setActiveAgentId}
            />
          )}

          {activeTab === 'tasks' && <TasksPanel tasks={simulation.tasks} agents={simulation.agentStatus} ws={openClawState.client?.ws} />}
          {activeTab === 'intel' && <IntelPanel intelFeed={simulation.intelFeed} heatmap={simulation.heatmap} agents={simulation.agentStatus} />}
        </main>

        {activeTab !== 'comms' && (
          <IntelFeed feed={simulation.intelFeed} />
        )}
      </div>

      <Statusbar metrics={simulation.systemMetrics} />

      {/* CONNECTION LOST OVERLAY */}
      {openClawState.connectionStatus === 'RECONNECTING' && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: 'rgba(5,5,8,0.92)', backdropFilter: 'blur(8px)' }}>

          <div className="flex flex-col items-center gap-6 text-center">

            <div className="w-16 h-16 rounded-full border-2 border-critical flex items-center justify-center animate-strobe">
              <WifiOff className="w-8 h-8 text-critical" />
            </div>

            <div>
              <p className="font-heading text-2xl uppercase tracking-widest text-critical">
                CONNECTION LOST
              </p>
              <p className="font-mono text-sm text-[#6B7280] mt-1">
                BFF Gateway unreachable — ws://localhost:4000
              </p>
            </div>

            <p className="font-mono text-xs text-[#6B7280]">
              RECONNECT ATTEMPT <span className="text-caution">{openClawState.client?.reconnectAttempts || 1}</span> — RETRY IN PROGRESS
            </p>

            <div className="w-64 h-[2px] bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
              <div className="h-full bg-critical animate-[retryProgress_5s_linear_infinite]" />
            </div>

            <button
              onClick={() => {
                if (openClawState.client) {
                  if (openClawState.client.reconnectTimer) clearTimeout(openClawState.client.reconnectTimer);
                  openClawState.client.connect();
                }
              }}
              className="font-mono text-xs uppercase tracking-widest px-4 py-2 border border-[rgba(255,255,255,0.06)] text-[#E8E4DD] hover:border-[rgba(245,158,11,0.3)] hover:text-caution transition-all duration-200 cursor-crosshair"
            >
              [ FORCE RECONNECT ]
            </button>

          </div>
        </div>
      )}
    </div>
  );
}

export default App;
