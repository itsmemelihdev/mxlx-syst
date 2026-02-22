import { useState, useEffect, useCallback, useRef } from 'react';
import { openClawClient } from '../lib/openclawWs.js';
import {
    adaptPresenceToAgentStatus,
    adaptLogsToIntelFeed,
    adaptMetricsToSystemMetrics,
    adaptTaskEventsToKanban
} from '../lib/adapters/openclawAdapters.js';

export const useOpenClaw = () => {
    const [connectionStatus, setConnectionStatus] = useState('DISCONNECTED');

    // Core states natively mapping to UI expectations
    // Fallback data strictly for UI display when servers are offline
    const MOCK_AGENTS = [
        { id: "ALPHA", name: "ALPHA", role: "Chief of Staff", state: "ACTIVE", activeTask: "Monitoring Comms", tokens: 145020, load: 35 },
        { id: "ATLAS", name: "ATLAS", role: "Reconnaissance", state: "PROCESSING", activeTask: "Scanning sector 7G", tokens: 89000, load: 82 },
        { id: "HERALD", name: "HERALD", role: "Communications", state: "IDLE", activeTask: null, tokens: 45200, load: 12 },
        { id: "LEDGER", name: "LEDGER", role: "Financial Audits", state: "IDLE", activeTask: null, tokens: 920000, load: 5 },
        { id: "FORGE", name: "FORGE", role: "Execution Engine", state: "PROCESSING", activeTask: "Compiling binary", tokens: 340500, load: 95 },
        { id: "ORACLE", name: "ORACLE", role: "Personal OS", state: "ACTIVE", activeTask: "Awaiting Query", tokens: 21500, load: 22 }
    ];

    const [agentStatus, setAgentStatus] = useState(MOCK_AGENTS);
    const [intelFeed, setIntelFeed] = useState([]);
    const [systemMetrics, setSystemMetrics] = useState({
        activeAgents: 3,
        tasksInFlight: 14,
        queueDepth: 5,
        avgResponse: 124,
        uptime: 86400,
        globalHealth: { ingestion: 'nominal', cognition: 'caution', comms: 'nominal' }
    });

    // We maintain raw OpenClaw presence state here to compute metrics and agent statuses
    const rawPresenceRef = useRef([]);
    const rawSessionsRef = useRef([]);

    useEffect(() => {
        // Map status changes
        openClawClient.onStatusChange = (status) => setConnectionStatus(status);

        // Auto-connect on mount
        openClawClient.connect();

        // 1. Initial Data Loaders (upon handshake complete)
        const loadInitialData = async () => {
            // Wait for handshake
            if (!openClawClient.hasHandshakeCompleted) {
                setTimeout(loadInitialData, 500);
                return;
            }

            try {
                // To fetch initial agents list, we need the requestId to hook into the `res` response
                const listReqId = openClawClient.requestMethod('agents.list');
                const resolveAgents = openClawClient.on(`res:${listReqId}`, (payloadFrame) => {
                    const rawAgents = payloadFrame.payload?.items || payloadFrame.payload || [];
                    setAgentStatus(adaptPresenceToAgentStatus(rawAgents, rawPresenceRef.current));
                    resolveAgents(); // unsubscribe
                });

                // Fetch initial sessions
                const sessReqId = openClawClient.requestMethod('sessions.list');
                const resolveSessions = openClawClient.on(`res:${sessReqId}`, (frame) => {
                    rawSessionsRef.current = frame.payload?.items || [];
                    updateMetrics();
                    resolveSessions();
                });

                // Fetch initial Chat History for global intel? For now we'll just listen to real-time chats as Intel logs
            } catch (e) {
                console.error("Failed loading OpenClaw initial data", e);
            }
        };

        loadInitialData();

        // 2. Real-Time Subscriptions
        const unsubPresence = openClawClient.on('presence.updated', (payload) => {
            // Replaces or adds presence
            const existingIdx = rawPresenceRef.current.findIndex(p => p.agentId === payload.agentId);
            if (existingIdx > -1) rawPresenceRef.current[existingIdx] = payload;
            else rawPresenceRef.current.push(payload);

            // Trigger re-render of AgentStatus using previous agents pool
            setAgentStatus(prev => adaptPresenceToAgentStatus(prev, rawPresenceRef.current));
            updateMetrics();
        });

        const unsubChat = openClawClient.on('chat', (payload) => {
            // Only log final OR aborted bounds to IntelFeed to avoid spam. Delta is handled directly in CommsConsole.
            if (payload.state === 'final' || payload.state === 'error' || payload.state === 'aborted') {
                const simulatedLogFrame = {
                    time: Date.now(),
                    level: payload.state === 'error' ? 'error' : 'info',
                    message: payload.errorMessage || `Transmission ${payload.state}`,
                    agentId: payload.sessionKey // The agent we're talking to
                };

                setIntelFeed(prev => {
                    const newFeed = [...adaptLogsToIntelFeed([simulatedLogFrame]), ...prev].slice(0, 50);
                    return newFeed;
                });
            }
        });

        const updateMetrics = () => {
            setSystemMetrics(adaptMetricsToSystemMetrics(rawPresenceRef.current, rawSessionsRef.current, performance.now()));
        };

        // Cleanup
        return () => {
            unsubPresence();
            unsubChat();
            openClawClient.disconnect();
        };

    }, []);

    return {
        connectionStatus,
        agentStatus,
        intelFeed,
        systemMetrics,
        // Expose direct client for CommsConsole mutations
        client: openClawClient
    };
};

/**
 * Separate hook for Tasks to decouple its REST polling from the WebSocket
 * Since Kanban tasks are hitting VITE_MISSIONCONTROL_API_BASE per avantlancement.md constraints
 */
export const useTasksApi = (pollingIntervalMs = 5000) => {
    // Offline Mock Fallback for Tasks Kanban
    const MOCK_TASKS = {
        INBOX: [],
        ASSIGNED: [],
        IN_PROGRESS: [],
        REVIEW: [],
        DONE: []
    };

    const [tasks, setTasks] = useState(MOCK_TASKS);
    const apiBase = import.meta.env.VITE_MISSIONCONTROL_API_BASE || 'http://localhost:4000/api';

    const fetchTasks = useCallback(async () => {
        try {
            const res = await fetch(`${apiBase}/tasks`);
            if (res.ok) {
                const data = await res.json();
                setTasks(adaptTaskEventsToKanban(data));
            } else {
                // If API fails with 404/500, keep fallback
                console.warn("[Tasks API] Server responded with error, using offline mock tasks.");
            }
        } catch (e) {
            console.warn("[Tasks API] Polling failed, using offline mock tasks.", e.message);
        }
    }, [apiBase]);

    useEffect(() => {
        fetchTasks();
        const t = setInterval(fetchTasks, pollingIntervalMs);
        return () => clearInterval(t);
    }, [fetchTasks, pollingIntervalMs]);

    return { tasks, refetchTasks: fetchTasks };
};
