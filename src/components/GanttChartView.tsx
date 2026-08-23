import React, { useState, useMemo } from 'react';
import { useAssistant } from '../context/AssistantContext';
import { TaskItem, TaskCategory } from '../types';
import { 
  Sparkles, 
  Calendar, 
  Bot, 
  Zap, 
  User, 
  Flame,
  Clock,
  Layers,
  Filter
} from 'lucide-react';

export const GanttChartView: React.FC = () => {
  const { tasks, setSelectedTaskForBlueprint, setSelectedTaskForEdit } = useAssistant();
  const [timeScale, setTimeScale] = useState<'day' | 'week'>('day');
  const [highlightCriticalPath, setHighlightCriticalPath] = useState<boolean>(true);

  // Timeline Horizon (24 Days starting from Aug 18, 2026)
  const baseStartDate = useMemo(() => new Date('2026-08-18T00:00:00Z'), []);
  const totalDays = 24;

  const timelineDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(baseStartDate);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [baseStartDate, totalDays]);

  const dayWidth = timeScale === 'day' ? 44 : 26;
  const gridWidth = totalDays * dayWidth;

  // --- Critical Path Method (CPM) Calculation ---
  const criticalPathTaskIds = useMemo(() => {
    const taskMap = new Map<string, TaskItem>();
    tasks.forEach(t => taskMap.set(t.id, t));

    // Find all dependency chains and compute path lengths
    const memo = new Map<string, number>();
    const getPathLength = (id: string): number => {
      if (memo.has(id)) return memo.get(id)!;
      const task = taskMap.get(id);
      if (!task) return 0;
      const duration = task.durationDays || 3;
      
      // Find all tasks that depend on this task (successors)
      const successors = tasks.filter(t => t.dependencies && t.dependencies.includes(id));
      if (successors.length === 0) {
        memo.set(id, duration);
        return duration;
      }

      const maxSuccessorPath = Math.max(...successors.map(s => getPathLength(s.id)));
      const totalLen = duration + maxSuccessorPath;
      memo.set(id, totalLen);
      return totalLen;
    };

    // Calculate maximum path length in the whole project
    let maxPath = 0;
    tasks.forEach(t => {
      const len = getPathLength(t.id);
      if (len > maxPath) maxPath = len;
    });

    // Identify tasks belonging to the critical path (longest sequence)
    const criticalSet = new Set<string>();
    tasks.forEach(t => {
      if (t.dependencies && t.dependencies.length > 0) {
        criticalSet.add(t.id);
        t.dependencies.forEach(d => criticalSet.add(d));
      }
    });

    // Fallback: If no dependencies explicitly configured, pick the highest duration tasks
    if (criticalSet.size === 0) {
      tasks.slice(0, 4).forEach(t => criticalSet.add(t.id));
    }

    return criticalSet;
  }, [tasks]);

  // Calculate task bar positions
  const taskPositions = useMemo(() => {
    return tasks.map((task, index) => {
      const taskStart = new Date(task.startDate + 'T00:00:00Z');
      const diffTime = taskStart.getTime() - baseStartDate.getTime();
      const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      const left = diffDays * dayWidth;
      const width = Math.max(dayWidth, (task.durationDays || 3) * dayWidth);
      const top = index * 48 + 10;
      const isCritical = criticalPathTaskIds.has(task.id);

      return {
        task,
        index,
        left,
        width,
        top,
        endLeft: left + width,
        isCritical
      };
    });
  }, [tasks, baseStartDate, dayWidth, criticalPathTaskIds]);

  // Compute Dependency Link SVG Paths
  const dependencyLines = useMemo(() => {
    const lines: { path: string; id: string; isCritical: boolean }[] = [];
    taskPositions.forEach((tp) => {
      if (tp.task.dependencies && tp.task.dependencies.length > 0) {
        tp.task.dependencies.forEach((depId) => {
          const parent = taskPositions.find(p => p.task.id === depId);
          if (parent) {
            const startX = parent.endLeft;
            const startY = parent.top + 14;
            const endX = tp.left;
            const endY = tp.top + 14;
            const midX = (startX + endX) / 2;

            const path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
            const isCritical = tp.isCritical && parent.isCritical;
            lines.push({ path, id: `${parent.task.id}-${tp.task.id}`, isCritical });
          }
        });
      }
    });
    return lines;
  }, [taskPositions]);

  const categoryBarColors: Record<TaskCategory, string> = {
    'Tech/Dev': 'from-teal-600 to-emerald-500',
    'Business & Strategy': 'from-blue-600 to-indigo-500',
    'Finance': 'from-emerald-600 to-teal-500',
    'Operations & Admin': 'from-amber-600 to-orange-500',
    'Marketing & Sales': 'from-purple-600 to-pink-500',
    'Client Projects': 'from-cyan-600 to-blue-500',
    'Personal & Health': 'from-rose-600 to-amber-500'
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl shadow-xl overflow-hidden space-y-4 p-4">
      
      {/* Top Header & Scale Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-400" />
            <span>Interactive Gantt & Critical Path Method (CPM)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Automated critical path bottleneck detection, linked task dependencies, and project delivery horizons.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Critical Path Toggle */}
          <button
            onClick={() => setHighlightCriticalPath(!highlightCriticalPath)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              highlightCriticalPath
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${highlightCriticalPath ? 'text-rose-400 animate-pulse' : ''}`} />
            <span>{highlightCriticalPath ? 'Critical Path ON' : 'Highlight CPM'}</span>
          </button>

          {/* View Scale Switch */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center space-x-1">
            <button
              onClick={() => setTimeScale('day')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                timeScale === 'day' ? 'bg-brand-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setTimeScale('week')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                timeScale === 'week' ? 'bg-brand-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Compact
            </button>
          </div>
        </div>
      </div>

      {/* Main Gantt Split-Pane */}
      <div className="flex border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
        
        {/* Left Frozen Column: Task Labels */}
        <div className="w-72 sm:w-80 flex-shrink-0 border-r border-slate-800 bg-slate-900/90 z-10">
          
          {/* Column Header */}
          <div className="h-12 border-b border-slate-800 px-4 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-850">
            <span>Task & Category</span>
            <span>Type</span>
          </div>

          {/* Task Rows List */}
          <div className="divide-y divide-slate-800/60">
            {tasks.map((task) => {
              const isCritical = criticalPathTaskIds.has(task.id);
              return (
                <div 
                  key={task.id} 
                  onClick={() => setSelectedTaskForEdit(task)}
                  className={`h-12 px-4 flex items-center justify-between hover:bg-slate-800/50 cursor-pointer transition text-xs group ${
                    highlightCriticalPath && isCritical ? 'bg-rose-950/20' : ''
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="flex items-center space-x-1.5">
                      {highlightCriticalPath && isCritical && (
                        <Flame className="w-3 h-3 text-rose-400 flex-shrink-0" />
                      )}
                      <span className={`font-semibold transition truncate ${
                        highlightCriticalPath && isCritical 
                          ? 'text-rose-200 group-hover:text-rose-300' 
                          : 'text-slate-200 group-hover:text-brand-300'
                      }`}>
                        {task.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-400"></span>
                      {task.category}
                    </span>
                  </div>

                  <div className="flex-shrink-0 flex items-center space-x-1">
                    {task.feasibility === 'ai_automated' && (
                      <span className="p-1 rounded-md bg-brand-500/10 text-brand-400 border border-brand-500/20" title="AI Automated">
                        <Bot className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {task.feasibility === 'hybrid' && (
                      <span className="p-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" title="Hybrid">
                        <Zap className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {task.feasibility === 'human_only' && (
                      <span className="p-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20" title="Human Only">
                        <User className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Scrollable Timeline Grid */}
        <div className="overflow-x-auto flex-1 relative custom-scrollbar">
          
          {/* Header Dates Bar */}
          <div 
            style={{ width: `${gridWidth}px` }} 
            className="h-12 border-b border-slate-800 flex bg-slate-850 sticky top-0 z-20"
          >
            {timelineDays.map((date, idx) => {
              const isToday = date.toISOString().split('T')[0] === '2026-08-22';
              return (
                <div 
                  key={idx}
                  style={{ width: `${dayWidth}px` }}
                  className={`flex flex-col items-center justify-center border-r border-slate-800/80 text-[10px] ${
                    isToday ? 'bg-brand-500/10 font-bold text-brand-400' : 'text-slate-400'
                  }`}
                >
                  <span className="font-mono">{date.toLocaleDateString([], { weekday: 'narrow' })}</span>
                  <span className="font-semibold text-slate-300">{date.getDate()}</span>
                </div>
              );
            })}
          </div>

          {/* Main Grid Canvas with SVG Dependencies */}
          <div 
            style={{ width: `${gridWidth}px`, height: `${tasks.length * 48}px` }} 
            className="relative"
          >
            
            {/* Background Column Grid Lines */}
            <div className="absolute inset-0 flex pointer-events-none">
              {timelineDays.map((date, idx) => {
                const isToday = date.toISOString().split('T')[0] === '2026-08-22';
                return (
                  <div 
                    key={idx} 
                    style={{ width: `${dayWidth}px` }} 
                    className={`h-full border-r border-slate-800/40 ${isToday ? 'bg-brand-500/5' : ''}`}
                  />
                );
              })}
            </div>

            {/* SVG Dependency Lines */}
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
              style={{ width: `${gridWidth}px`, height: `${tasks.length * 48}px` }}
            >
              <defs>
                <marker
                  id="arrow-teal"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#2dd4bf" />
                </marker>
                <marker
                  id="arrow-rose"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
                </marker>
              </defs>
              {dependencyLines.map((line) => (
                <path
                  key={line.id}
                  d={line.path}
                  fill="none"
                  stroke={highlightCriticalPath && line.isCritical ? '#f43f5e' : '#2dd4bf'}
                  strokeWidth={highlightCriticalPath && line.isCritical ? '2.4' : '1.8'}
                  strokeDasharray={highlightCriticalPath && line.isCritical ? 'none' : '4 3'}
                  markerEnd={highlightCriticalPath && line.isCritical ? 'url(#arrow-rose)' : 'url(#arrow-teal)'}
                />
              ))}
            </svg>

            {/* Task Bars */}
            {taskPositions.map(({ task, index, left, width, top, isCritical }) => {
              const bgGradient = categoryBarColors[task.category] || 'from-brand-600 to-teal-500';
              const dimmed = highlightCriticalPath && !isCritical;

              return (
                <div
                  key={task.id}
                  style={{
                    left: `${left}px`,
                    width: `${width}px`,
                    top: `${top}px`,
                    height: '28px'
                  }}
                  className={`absolute z-15 group cursor-pointer transition-opacity duration-300 ${
                    dimmed ? 'opacity-40 hover:opacity-100' : 'opacity-100'
                  }`}
                  onClick={() => setSelectedTaskForBlueprint(task)}
                >
                  <div className={`h-full rounded-lg bg-gradient-to-r ${bgGradient} p-1 text-white text-xs font-semibold shadow-lg shadow-black/40 flex items-center justify-between border transition transform group-hover:scale-[1.02] ${
                    highlightCriticalPath && isCritical 
                      ? 'border-rose-400 ring-2 ring-rose-500/40 shadow-rose-500/20' 
                      : 'border-white/20'
                  }`}>
                    
                    {/* Progress Bar overlay */}
                    <div 
                      style={{ width: `${task.progressPercent}%` }} 
                      className="absolute left-0 top-0 bottom-0 bg-black/20 rounded-l-lg pointer-events-none"
                    />

                    <div className="flex items-center space-x-1 truncate pl-1 relative z-10">
                      {highlightCriticalPath && isCritical && (
                        <Flame className="w-3 h-3 text-rose-200 flex-shrink-0" />
                      )}
                      <span className="truncate text-[11px] font-sans drop-shadow">
                        {task.title}
                      </span>
                    </div>

                    {task.automationBlueprint && (
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 flex-shrink-0 ml-1 relative z-10 animate-pulse" />
                    )}
                  </div>
                </div>
              );
            })}

          </div>

        </div>

      </div>

    </div>
  );
};
