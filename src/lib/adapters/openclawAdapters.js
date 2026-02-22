/**
 * openclawAdapters.js
 * 
 * Maps OpenClaw raw Gateway Payloads to the strict Sovereign Glass UI expected formats.
 */

// A) adaptPresenceToAgentStatus
// Maps from: (Gateway PresenceEntry OR AgentEvent)
// UI Expects: { id, name, role, state: 'IDLE'|'ACTIVE'|'PROCESSING', activeTask, tokens, load(0-100) }
export const adaptPresenceToAgentStatus = (agentsListResult, presenceSnapshots = []) => {
    // We assume the caller provides the base agents (from agents.list) and the active presence overlay
    if (!Array.isArray(agentsListResult)) return [];

    return agentsListResult.map(agent => {
        // Find if agent is currently active in a session
        const presence = presenceSnapshots.find(p => p.agentId === agent.id);

        let state = 'IDLE';
        let load = 0;

        if (presence) {
            state = presence.status === 'processing' ? 'PROCESSING' : 'ACTIVE';
            load = presence.status === 'processing' ? 75 + Math.random() * 20 : 20 + Math.random() * 10;
            // Note: OpenClaw doesn't provide CPU-like 'load' %. Using heuristic based on state. 
        }

        return {
            id: agent.id,
            name: agent.name || agent.id.substring(0, 8),
            role: agent.role || 'Agent',
            state: state,
            activeTask: presence ? (presence.activeTask || "Processing request...") : null,
            tokens: agent.usage?.totalTokens || 0,
            load: load
        };
    });
};

// B) adaptLogsToIntelFeed
// Maps from: OpenClaw log stream or ChatEvent errors
// UI Expects: { id, time(ms), severity:'nominal'|'caution'|'critical', message, source, label }
export const adaptLogsToIntelFeed = (logsTailResultLines) => {
    if (!Array.isArray(logsTailResultLines)) return [];

    return logsTailResultLines.map((lineStr, index) => {
        try {
            const log = typeof lineStr === 'string' ? JSON.parse(lineStr) : lineStr;
            let severity = 'nominal';
            if (log.level === 'warn' || log.level === 'warning') severity = 'caution';
            if (log.level === 'error' || log.level === 'fatal') severity = 'critical';

            return {
                id: log.id || Date.now() + index,
                time: log.timestamp || log.time || Date.now(),
                severity,
                message: log.msg || log.message || "Unknown event",
                source: log.agentId || log.source || "SYSTEM",
                label: log.reqId ? log.reqId.substring(0, 6) : `L-${index}`
            };
        } catch (e) {
            // Unparseable log fallback
            return {
                id: Date.now() + index,
                time: Date.now(),
                severity: 'caution',
                message: String(lineStr),
                source: 'SYSTEM',
                label: 'RAW'
            };
        }
    });
};

// C) adaptMetricsToSystemMetrics
// Maps from: OpenClaw metrics (or derived from presence)
// UI Expects: { activeAgents, tasksInFlight, queueDepth, avgResponse(ms), uptime(seconds), globalHealth }
export const adaptMetricsToSystemMetrics = (presence, sessions, serverUptimeMs) => {
    const activeAgentsCount = Array.isArray(presence) ? presence.length : 0;
    const activeSessions = Array.isArray(sessions) ? sessions.filter(s => s.active).length : 0;

    let commsHealth = 'nominal';
    let cognitionHealth = 'nominal';

    if (activeAgentsCount > 5) cognitionHealth = 'caution';
    if (activeSessions > 10) commsHealth = 'caution';

    return {
        activeAgents: activeAgentsCount,
        tasksInFlight: activeSessions, // Approximation if real tasks API doesn't exist
        queueDepth: Math.max(0, activeSessions - activeAgentsCount),
        avgResponse: 120, // Requires APM instrumentation normally
        uptime: Math.floor((serverUptimeMs || 0) / 1000),
        globalHealth: {
            ingestion: 'nominal',
            cognition: cognitionHealth,
            comms: commsHealth
        }
    };
};

// D) adaptTaskEventsToKanban
// Since OpenClaw does not have a native Kanban Tasks API, 
// this adapter will be used primarily by the custom REST backend, 
// but is placed here for architectural consistency.
export const adaptTaskEventsToKanban = (backendTasksArr) => {
    const kanban = { INBOX: [], ASSIGNED: [], IN_PROGRESS: [], REVIEW: [], DONE: [] };

    if (!Array.isArray(backendTasksArr)) return kanban;

    backendTasksArr.forEach(task => {
        const col = kanban[task.status] || kanban.INBOX;
        col.push({
            id: task.id,
            title: task.title,
            assignee: task.assigneeId,
            priority: task.priority || 'nominal'
        });
    });

    return kanban;
};
