import React, { useState, useEffect } from 'react';
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CheckCircle, AlertTriangle, Flame, LayoutGrid, List } from 'lucide-react';

// --- Sortable Task Item ---
const TaskCardItem = ({ task, agentMap, isOverlay, isDragging }) => {
    const agent = agentMap[task.assignee] || { state: 'IDLE' };

    const getPriorityColor = (p) => {
        if (p === 'critical') return 'bg-critical';
        if (p === 'caution') return 'bg-caution';
        return 'bg-nominal';
    };

    const getPriorityIcon = (p) => {
        if (p === 'critical') return <Flame className="w-3.5 h-3.5 text-critical" />;
        if (p === 'caution') return <AlertTriangle className="w-3.5 h-3.5 text-caution" />;
        return <CheckCircle className="w-3.5 h-3.5 text-nominal" />;
    };

    const agentStateColor =
        agent.state === 'PROCESSING' ? 'bg-accent text-black font-bold animate-pulse-fast' :
            agent.state === 'ACTIVE' ? 'bg-nominal/20 text-nominal border border-nominal/50' :
                'bg-surface border border-white/20 text-gray-400';

    return (
        <div className={`p-3 bg-glass rounded mb-2 border border-white/5 relative overflow-hidden group hover:border-white/20 transition-colors shadow-lg cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-30' : 'opacity-100'} ${isOverlay ? 'shadow-[0_10px_30px_rgba(0,0,0,0.5)] rotate-2 scale-105 border-accent/50' : ''}`}>
            {/* Priority Border */}
            <div className={`absolute top-0 bottom-0 left-0 w-[3px] ${getPriorityColor(task.priority)}`} />

            <div className="pl-3">
                <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-[10px] text-[#6B7280] tracking-wider">{task.id}</span>
                    {getPriorityIcon(task.priority)}
                </div>
                <div className="font-heading text-[13px] text-white leading-snug mb-3">
                    {task.title}
                </div>
                <div className="flex justify-between items-center mt-auto">
                    <span className={`text-[9px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded ${agentStateColor}`}>
                        {task.assignee.substring(0, 3)}
                    </span>
                </div>
            </div>
        </div>
    );
};

const SortableTaskWrapper = ({ task, agentMap }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <TaskCardItem task={task} agentMap={agentMap} isDragging={isDragging} />
        </div>
    );
};

// --- Column Droppable Area ---
import { useDroppable } from '@dnd-kit/core';

const KanbanColumn = ({ id, title, tasks, agentMap }) => {
    const { setNodeRef, isOver } = useDroppable({ id });

    const getBadgeColor = () => {
        if (id === 'INBOX') return 'bg-white/10 text-white';
        if (id === 'IN_PROGRESS') return 'bg-accent/20 text-accent';
        if (id === 'DONE') return 'bg-nominal/20 text-nominal';
        return 'bg-white/5 text-gray-400';
    };

    return (
        <div className="flex-1 flex flex-col bg-black/40 rounded-lg border border-white/5 overflow-hidden">
            <div className="px-4 py-3 bg-white/5 border-b border-white/5 flex justify-between items-center shrink-0">
                <h3 className="font-heading text-xs uppercase tracking-widest text-[#E8E4DD]">{title}</h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${getBadgeColor()}`}>{tasks.length}</span>
            </div>
            <div
                ref={setNodeRef}
                className={`flex-1 p-3 overflow-y-auto custom-scrollbar transition-colors ${isOver ? 'bg-white/5' : 'bg-transparent'
                    }`}
            >
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map(task => (
                        <SortableTaskWrapper key={task.id} task={task} agentMap={agentMap} />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
};

// --- Main Panel ---
export const TasksPanel = ({ tasks, agents }) => {
    const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'timeline'
    const [localTasks, setLocalTasks] = useState(tasks);
    const [activeDragTask, setActiveDragTask] = useState(null);

    // Sync initial strictly once or lightly to keep data flowing but allow drags
    useEffect(() => {
        // Only map new tasks from useSimulation into local if they don't exist
        // For simplicity of this demo, we'll just initially set it, 
        // but a real app would merge websocket updates with local drag state.
        // To respect the prompt: "copie du state tasks, indépendant de useSimulation"
        // We only initialize once.
    }, []);

    const totalCount = Object.values(localTasks).flat().length;
    const criticalCount = Object.values(localTasks).flat().filter(t => t.priority === 'critical').length;

    const agentMap = agents.reduce((acc, a) => ({ ...acc, [a.name]: a }), {});

    const columns = ['INBOX', 'ASSIGNED', 'IN_PROGRESS', 'REVIEW', 'DONE'];

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor)
    );

    const findContainer = (id) => {
        if (columns.includes(id)) return id;
        return Object.keys(localTasks).find((key) => localTasks[key].some(task => task.id === id));
    };

    const handleDragStart = (event) => {
        const { active } = event;
        const activeContainer = findContainer(active.id);
        if (!activeContainer) return;
        const task = localTasks[activeContainer].find(t => t.id === active.id);
        setActiveDragTask(task);
    };

    const handleDragOver = (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeContainer = findContainer(active.id);
        const overContainer = findContainer(over.id);

        if (!activeContainer || !overContainer || activeContainer === overContainer) {
            return;
        }

        setLocalTasks(prev => {
            const activeItems = [...prev[activeContainer]];
            const overItems = [...prev[overContainer]];

            const activeIndex = activeItems.findIndex(t => t.id === active.id);
            const overIndex = over.id in prev
                ? overItems.length + 1
                : overItems.findIndex(t => t.id === over.id);

            let newIndex = overIndex >= 0 ? overIndex : overItems.length + 1;

            return {
                ...prev,
                [activeContainer]: activeItems.filter(t => t.id !== active.id),
                [overContainer]: [
                    ...overItems.slice(0, newIndex),
                    activeItems[activeIndex],
                    ...overItems.slice(newIndex, overItems.length)
                ]
            };
        });
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveDragTask(null);
        if (!over) return;

        const activeContainer = findContainer(active.id);
        const overContainer = findContainer(over.id);

        if (!activeContainer || !overContainer || activeContainer !== overContainer) {
            return;
        }

        const activeIndex = localTasks[activeContainer].findIndex(t => t.id === active.id);
        const overIndex = localTasks[overContainer].findIndex(t => t.id === over.id);

        if (activeIndex !== overIndex) {
            // 1. Snapshot for rollback
            const previousTasks = { ...localTasks };

            // 2. Optimistic UI update
            setLocalTasks(prev => ({
                ...prev,
                [overContainer]: arrayMove(prev[overContainer], activeIndex, overIndex)
            }));

            // 3. Dispatch PATCH to backend (per avantlancement.md)
            try {
                const apiBase = import.meta.env.VITE_MISSIONCONTROL_API_BASE || 'http://localhost:4000/api';
                const res = await fetch(`${apiBase}/tasks/${active.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ column: overContainer, order: overIndex })
                });

                if (!res.ok) {
                    throw new Error(`Failed to save drag end: ${res.statusText}`);
                }
            } catch (err) {
                console.error("[TasksPanel] Kanban Drag sync failed, rolling back.", err);
                // Rollback optimistic update
                setLocalTasks(previousTasks);
            }
        }
    };

    // Sync only when 'tasks' prop structurally updates and differs from 'localTasks' length.
    // Important: avoid jittering during drags.
    useEffect(() => {
        const inLen = Object.values(tasks).flat().length;
        const locLen = Object.values(localTasks).flat().length;
        if (inLen !== locLen) {
            setLocalTasks(tasks);
        }
    }, [tasks]);

    // Timeline computation
    const allTasksChronological = Object.keys(localTasks).flatMap(col =>
        localTasks[col].map(t => ({ ...t, column: col, mockTime: Date.now() - Math.random() * 1000000 }))
    ).sort((a, b) => {
        if (a.priority === 'critical' && b.priority !== 'critical') return -1;
        if (b.priority === 'critical' && a.priority !== 'critical') return 1;
        return b.mockTime - a.mockTime;
    });

    return (
        <div className="w-full h-full bg-void p-6 flex flex-col overflow-hidden relative font-sans">

            {/* Header */}
            <div className="flex justify-between items-center mb-6 shrink-0">
                <div className="flex items-center space-x-4">
                    <h2 className="font-heading text-xl uppercase tracking-widest text-[#E8E4DD]">Task Queue — Full Spectrum</h2>
                    <div className="flex space-x-2">
                        <span className="font-mono text-[10px] bg-white/10 px-2 py-1 rounded text-[#E8E4DD] tracking-widest">
                            TOTAL: {totalCount}
                        </span>
                        <span className={`font-mono text-[10px] px-2 py-1 rounded tracking-widest font-bold ${criticalCount > 0 ? 'bg-critical/20 text-critical border border-critical/50 animate-strobe' : 'bg-surface text-gray-500'
                            }`}>
                            CRITICAL: {criticalCount}
                        </span>
                    </div>
                </div>

                {/* View Toggle */}
                <div className="flex bg-black/40 border border-white/10 rounded p-1">
                    <button
                        onClick={() => setViewMode('kanban')}
                        className={`px-3 py-1.5 rounded flex items-center space-x-2 transition-colors ${viewMode === 'kanban' ? 'bg-surface border border-white/10 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}
                    >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span className="font-heading text-[10px] uppercase tracking-widest">Kanban</span>
                    </button>
                    <button
                        onClick={() => setViewMode('timeline')}
                        className={`px-3 py-1.5 rounded flex items-center space-x-2 transition-colors ${viewMode === 'timeline' ? 'bg-surface border border-white/10 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}
                    >
                        <List className="w-3.5 h-3.5" />
                        <span className="font-heading text-[10px] uppercase tracking-widest">Timeline</span>
                    </button>
                </div>
            </div>

            {/* Main View Area */}
            <div className="flex-1 overflow-hidden relative">

                {/* Empty State Overlay */}
                {totalCount === 0 && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg border border-white/5 overflow-hidden">
                        {/* Background Scanline */}
                        <div className="absolute inset-0 pointer-events-none z-0">
                            <div className="w-full h-[15%] bg-gradient-to-b from-transparent via-white/10 to-transparent animate-scanline"></div>
                        </div>

                        {/* Data Stream Lines */}
                        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-30">
                            {[...Array(5)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute w-px bg-gradient-to-b from-transparent via-white/40 to-transparent animate-data-stream"
                                    style={{
                                        left: `${15 + i * 18}%`,
                                        height: '100%',
                                        animationDelay: `${i * 0.7}s`,
                                        animationDuration: `${3 + (i % 3)}s`
                                    }}
                                ></div>
                            ))}
                        </div>

                        <div className="tactical-panel relative z-10 flex flex-col items-center justify-center p-12 text-center max-w-lg border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.02)]">
                            <div className="w-24 h-24 rounded-full border border-white/20 flex items-center justify-center mb-6 relative overflow-hidden bg-white/5">
                                <div className="absolute inset-x-0 top-1/2 h-px bg-white/20" />
                                <div className="absolute inset-y-0 left-1/2 w-px bg-white/20" />
                                <div
                                    className="w-[150%] h-[150%] absolute origin-center animate-radar-spin"
                                    style={{ background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(255, 255, 255, 0.15) 360deg)' }}
                                />
                                <LayoutGrid className="w-8 h-8 text-gray-400 relative z-10 animate-pulse-slow" />
                            </div>

                            <h2 className="font-heading text-xl text-gray-300 tracking-[0.2em] uppercase mb-4 animate-glitch-hover cursor-crosshair select-none">
                                Task Queue Empty
                            </h2>
                            <p className="font-mono text-[11px] text-gray-500 max-w-sm text-center tracking-widest leading-relaxed uppercase">
                                No operational directives detected. Awaiting upstream dispatch from OpenClaw Nexus.
                            </p>

                            <div className="mt-8 flex items-center text-[10px] font-mono text-gray-400 border border-white/10 px-4 py-2 bg-white/5 rounded">
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 animate-pulse-fast"></div>
                                SYNC IDLE
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === 'kanban' ? (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCorners}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="w-full h-full flex space-x-4 overflow-x-auto pb-4 custom-scrollbar">
                            {columns.map(col => (
                                <KanbanColumn
                                    key={col}
                                    id={col}
                                    title={col.replace('_', ' ')}
                                    tasks={localTasks[col] || []}
                                    agentMap={agentMap}
                                />
                            ))}
                        </div>
                        <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
                            {activeDragTask ? <TaskCardItem task={activeDragTask} agentMap={agentMap} isOverlay /> : null}
                        </DragOverlay>
                    </DndContext>
                ) : (
                    <div className="w-full h-full bg-obsidian rounded-lg border border-white/5 overflow-y-auto custom-scrollbar p-1">
                        <div className="sticky top-0 bg-obsidian/90 backdrop-blur z-10 grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/10 font-heading text-[10px] uppercase tracking-widest text-[#6B7280]">
                            <div className="col-span-1">Prio</div>
                            <div className="col-span-2">Time (Sim)</div>
                            <div className="col-span-2">Task ID</div>
                            <div className="col-span-4">Directive</div>
                            <div className="col-span-1">Assignee</div>
                            <div className="col-span-2 text-right">Status</div>
                        </div>

                        <div className="flex flex-col">
                            {allTasksChronological.map((task, idx) => (
                                <div key={task.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[rgba(255,255,255,0.04)] hover:bg-white/5 transition-colors animate-data-enter" style={{ animationDelay: `${idx * 0.05}s` }}>
                                    <div className="col-span-1 flex items-center">
                                        {task.priority === 'critical' ? <Flame className="w-4 h-4 text-critical animate-pulse" /> :
                                            task.priority === 'caution' ? <AlertTriangle className="w-4 h-4 text-caution" /> :
                                                <CheckCircle className="w-4 h-4 text-nominal" />}
                                    </div>
                                    <div className="col-span-2 flex items-center font-mono text-[11px] text-[#6B7280]">
                                        {new Date(task.mockTime).toISOString().substr(11, 8)}
                                    </div>
                                    <div className="col-span-2 flex items-center font-mono text-[11px] text-white">
                                        {task.id}
                                    </div>
                                    <div className="col-span-4 flex items-center font-sans text-[13px] text-gray-300">
                                        {task.title}
                                    </div>
                                    <div className="col-span-1 flex items-center font-mono text-[10px] text-accent">
                                        {task.assignee}
                                    </div>
                                    <div className="col-span-2 flex items-center justify-end font-mono text-[10px] text-gray-500 uppercase tracking-widest">
                                        {task.column.replace('_', ' ')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
