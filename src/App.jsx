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
import { useSimulation } from './hooks/useSimulation';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeAgentId, setActiveAgentId] = useState(null);
  const simulation = useSimulation();

  return (
    <div className="w-full h-full flex flex-col bg-void text-primary selection:bg-accent selection:text-black overflow-hidden relative font-sans">
      {/* 
        Grid & noise overlay handled globally by body::before & ::after in index.css 
      */}

      <Topbar
        missionTime={simulation.missionTime}
        globalHealth={simulation.systemMetrics.globalHealth}
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

          {activeTab === 'tasks' && <TasksPanel tasks={simulation.tasks} agents={simulation.agentStatus} />}
          {activeTab === 'intel' && <IntelPanel intelFeed={simulation.intelFeed} heatmap={simulation.heatmap} agents={simulation.agentStatus} />}
        </main>

        {activeTab !== 'comms' && (
          <IntelFeed feed={simulation.intelFeed} />
        )}
      </div>

      <Statusbar metrics={simulation.systemMetrics} />
    </div>
  );
}

export default App;
