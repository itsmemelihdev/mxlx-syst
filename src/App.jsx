import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Statusbar } from './components/Statusbar';
import { IntelFeed } from './components/IntelFeed';
import { OverviewPanel } from './components/OverviewPanel';
import { CommsConsole } from './components/CommsConsole';
import { useSimulation } from './hooks/useSimulation';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
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
          {activeTab === 'comms' && <CommsConsole agents={simulation.agentStatus} />}

          {/* Work in progress states for other tabs */}
          {['agents', 'tasks'].includes(activeTab) && (
            <div className="w-full h-full flex items-center justify-center font-mono text-gray-500 text-sm animate-pulse">
              [ {activeTab.toUpperCase()} MODULE ALLOCATING MEMORY... ]
            </div>
          )}
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
