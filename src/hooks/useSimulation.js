import { useState, useEffect, useRef } from 'react';

// Shared mock data generator based on parameters
const AGENTS = [
    { id: 'ALPHA', name: 'ALPHA', role: 'Chief of Staff' },
    { id: 'ATLAS', name: 'ATLAS', role: 'Intelligence Analyst' },
    { id: 'HERALD', name: 'HERALD', role: 'Communications Officer' },
    { id: 'LEDGER', name: 'LEDGER', role: 'Finance Controller' },
    { id: 'FORGE', name: 'FORGE', role: 'Execution Agent' },
    { id: 'ORACLE', name: 'ORACLE', role: 'Personal OS' }
];

const TASK_CATEGORIES = ['ORCHESTRATION', 'COMMS', 'EXECUTION', 'FINANCE', 'HEALTH', 'INTELLIGENCE'];

const generateTaskId = () => `TSK-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

export const useSimulation = () => {
    const [missionTime, setMissionTime] = useState(0);
    const [agentStatus, setAgentStatus] = useState(
        AGENTS.map(a => ({ ...a, state: 'IDLE', activeTask: null, tokens: 0, load: 0 }))
    );

    const [intelFeed, setIntelFeed] = useState([
        { id: 1, time: Date.now(), severity: 'nominal', message: 'System boot sequence initiated. OP INTERNAL secured.', source: 'SYSTEM' }
    ]);

    const [systemMetrics, setSystemMetrics] = useState({
        activeAgents: 0,
        tasksInFlight: 0,
        queueDepth: 0,
        avgResponse: 124,
        uptime: 0,
        globalHealth: { ingestion: 'nominal', cognition: 'nominal', comms: 'nominal' }
    });

    const [tasks, setTasks] = useState({
        INBOX: [],
        ASSIGNED: [],
        IN_PROGRESS: [],
        REVIEW: [],
        DONE: []
    });

    const [cognitionData, setCognitionData] = useState(
        Array.from({ length: 60 }).map((_, i) => ({ time: i, cognition: 20, comms: 10 }))
    );

    const [directives, setDirectives] = useState([
        '[SYSTEM] Memory checkpoint written to .mission-control/STATE.md',
        '[SYSTEM] Command interface initialized. Awaiting directives.'
    ]);

    const [heatmap, setHeatmap] = useState(
        Array.from({ length: 49 }).map((_, i) => ({
            id: i,
            intensity: Math.random() * 100,
            category: TASK_CATEGORIES[i % TASK_CATEGORIES.length],
            count: Math.floor(Math.random() * 20)
        }))
    );

    const [timelineEvents, setTimelineEvents] = useState([
        { id: 'init', time: Date.now(), severity: 'nominal', label: 'SYSTEM_INIT' }
    ]);

    // Main simulation loop
    useEffect(() => {
        const startTime = Date.now();
        let tick = 0;

        const interval = setInterval(() => {
            const now = Date.now();
            tick++;

            setMissionTime(Math.floor((now - startTime) / 1000));

            // Update Metrics
            setSystemMetrics(prev => ({
                ...prev,
                uptime: Math.floor((now - startTime) / 1000),
                avgResponse: Math.max(50, prev.avgResponse + (Math.random() * 20 - 10)),
                globalHealth: {
                    ingestion: Math.random() > 0.95 ? 'caution' : 'nominal',
                    cognition: Math.random() > 0.98 ? 'caution' : 'nominal',
                    comms: Math.random() > 0.99 ? 'critical' : 'nominal'
                }
            }));

            // Agent Status Updates (every few seconds)
            if (tick % 5 === 0) {
                setAgentStatus(prev => {
                    let activeCount = 0;
                    const next = prev.map(agent => {
                        const isChanging = Math.random() > 0.7;
                        let newState = agent.state;
                        if (isChanging) {
                            const states = ['IDLE', 'ACTIVE', 'PROCESSING'];
                            newState = states[Math.floor(Math.random() * states.length)];
                        }
                        if (newState !== 'IDLE') activeCount++;

                        return {
                            ...agent,
                            state: newState,
                            load: newState === 'PROCESSING' ? Math.random() * 100 : (newState === 'ACTIVE' ? Math.random() * 40 : 0),
                            tokens: agent.tokens + (newState === 'PROCESSING' ? Math.floor(Math.random() * 50) : 0)
                        };
                    });
                    setSystemMetrics(m => ({ ...m, activeAgents: activeCount }));
                    return next;
                });
            }

            // Cognition Chart Data (every second)
            setCognitionData(prev => {
                const next = [...prev.slice(1)];
                const last = next[next.length - 1];
                next.push({
                    time: tick,
                    cognition: Math.max(10, Math.min(100, last.cognition + (Math.random() * 30 - 15))),
                    comms: Math.max(5, Math.min(100, last.comms + (Math.random() * 20 - 10)))
                });
                return next;
            });

            // Tasks flow simulation
            if (tick % 8 === 0) {
                setTasks(prev => {
                    // Simply adjust numbers for UI
                    const fakeTasks = ['INBOX', 'ASSIGNED', 'IN_PROGRESS', 'REVIEW', 'DONE'];
                    const nextTasks = { ...prev };
                    // Add random task
                    if (Math.random() > 0.5) {
                        nextTasks.INBOX = [{
                            id: generateTaskId(),
                            title: `Analyze data packet ${Math.floor(Math.random() * 1000)}`,
                            assignee: AGENTS[Math.floor(Math.random() * AGENTS.length)].name,
                            priority: Math.random() > 0.8 ? 'critical' : (Math.random() > 0.5 ? 'caution' : 'nominal')
                        }, ...nextTasks.INBOX].slice(0, 10);
                    }

                    // Calculate tasks in flight
                    const inFlight = nextTasks.ASSIGNED.length + nextTasks.IN_PROGRESS.length + nextTasks.REVIEW.length;
                    setSystemMetrics(m => ({ ...m, tasksInFlight: inFlight, queueDepth: nextTasks.INBOX.length }));
                    return nextTasks;
                });
            }

            // Heatmap update
            if (tick % 10 === 0) {
                setHeatmap(prev => prev.map(h => ({
                    ...h,
                    intensity: Math.max(0, Math.min(100, h.intensity + (Math.random() * 40 - 20)))
                })));
            }

            // Intel Feed & Timeline
            if (Math.random() > 0.85) {
                const severityList = ['nominal', 'nominal', 'nominal', 'caution', 'critical'];
                const agent = AGENTS[Math.floor(Math.random() * AGENTS.length)];
                const newEvent = {
                    id: tick,
                    time: Date.now(),
                    severity: severityList[Math.floor(Math.random() * severityList.length)],
                    source: Math.random() > 0.3 ? agent.name : 'SYSTEM',
                    label: `E-` + Math.floor(Math.random() * 9000 + 1000),
                    message: `Operation ${Math.random() > 0.5 ? 'completed' : 'initiated'} on sector ${Math.floor(Math.random() * 99)}`
                };

                setIntelFeed(prev => [newEvent, ...prev].slice(0, 50));
                setTimelineEvents(prev => [...prev, newEvent].slice(-20));
            }

            // Directives
            if (Math.random() > 0.9) {
                const agent = AGENTS[Math.floor(Math.random() * AGENTS.length)];
                const msgs = [
                    `[${agent.name}] Analyzing context window...`,
                    `[${agent.name}] Subtask execution complete. Confidence: ${(Math.random() * 20 + 80).toFixed(1)}%`,
                    `[SYSTEM] Reallocating memory for ${agent.name} partition...`,
                    `[${agent.name}] Awaiting user confirmation.`
                ];
                setDirectives(prev => [...prev, msgs[Math.floor(Math.random() * msgs.length)]].slice(-10));
            }

        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return {
        agents: AGENTS,
        agentStatus,
        intelFeed,
        systemMetrics,
        missionTime,
        tasks,
        setTasks,
        cognitionData,
        directives,
        heatmap,
        timelineEvents
    };
};
