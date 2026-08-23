import React from 'react';
import { useAssistant } from '../context/AssistantContext';
import { TaskItem, TaskStatus } from '../types';
import { 
  Sparkles, 
  Bot, 
  User, 
  Zap, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  Flame, 
  Target, 
  ShieldAlert, 
  Archive,
  Plus
} from 'lucide-react';

export const EisenhowerMatrixView: React.FC = () => {
  const { 
    tasks, 
    updateTaskStatus, 
    setSelectedTaskForBlueprint, 
    setSelectedTaskForEdit,
    setIsRecordModalOpen 
  } = useAssistant();

  // Helper to categorize tasks into the 4 Eisenhower Quadrants
  const isUrgent = (t: TaskItem) => t.userPriority === 'urgent' || t.userPriority === 'high';
  const isHighLeverage = (t: TaskItem) => t.aiPriority === 'critical' || t.aiPriority === 'high' || t.feasibility === 'ai_automated';

  const q1Tasks = tasks.filter(t => isUrgent(t) && isHighLeverage(t));
  const q2Tasks = tasks.filter(t => !isUrgent(t) && isHighLeverage(t));
  const q3Tasks = tasks.filter(t => isUrgent(t) && !isHighLeverage(t));
  const q4Tasks = tasks.filter(t => !isUrgent(t) && !isHighLeverage(t));

  const renderQuadrant = (
    title: string,
    subtitle: string,
    badgeText: string,
    badgeColor: string,
    icon: React.ReactNode,
    quadrantTasks: TaskItem[],
    borderColor: string,
    bgGradient: string
  ) => {
    const totalHours = quadrantTasks.reduce((sum, t) => sum + (t.timeWonBackHours || 0), 0);

    return (
      <div className={`bg-gradient-to-b ${bgGradient} border ${borderColor} rounded-2xl p-4 flex flex-col justify-between shadow-xl space-y-3 min-h-[380px]`}>
        
        {/* Quadrant Header */}
        <div className="flex items-start justify-between pb-2 border-b border-slate-800/80">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
                {icon}
              </span>
              <h3 className="font-bold text-sm text-slate-100">{title}</h3>
            </div>
            <p className="text-[11px] text-slate-400">{subtitle}</p>
          </div>

          <div className="text-right">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badgeColor}`}>
              {badgeText}
            </span>
            <p className="text-[11px] font-mono text-brand-400 font-bold mt-1">
              +{totalHours}h won ({quadrantTasks.length})
            </p>
          </div>
        </div>

        {/* Task Cards List */}
        <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[320px] pr-1 custom-scrollbar">
          {quadrantTasks.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center p-6 text-slate-500 text-xs italic">
              No tasks in this quadrant.
            </div>
          ) : (
            quadrantTasks.map((task) => (
              <div
                key={task.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-3 space-y-2 transition group shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <span 
                    onClick={() => setSelectedTaskForEdit(task)}
                    className="font-semibold text-xs text-slate-200 group-hover:text-brand-300 transition cursor-pointer line-clamp-2"
                  >
                    {task.title}
                  </span>

                  {task.feasibility === 'ai_automated' && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center gap-1 flex-shrink-0">
                      <Bot className="w-2.5 h-2.5" />
                      <span>AI</span>
                    </span>
                  )}
                  {task.feasibility === 'hybrid' && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 flex-shrink-0">
                      <Zap className="w-2.5 h-2.5" />
                      <span>Hybrid</span>
                    </span>
                  )}
                  {task.feasibility === 'human_only' && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 flex-shrink-0">
                      <User className="w-2.5 h-2.5" />
                      <span>Human</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-850">
                  <div className="flex items-center space-x-1.5">
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                      {task.category}
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">
                      +{task.timeWonBackHours}h
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {task.automationBlueprint && (
                      <button
                        onClick={() => setSelectedTaskForBlueprint(task)}
                        className="px-2 py-0.5 text-[10px] font-semibold text-brand-300 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 rounded-md transition flex items-center gap-1"
                        title="View Code Blueprint"
                      >
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Code</span>
                      </button>
                    )}

                    <select
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                      className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-300 focus:outline-none"
                    >
                      <option value="backlog">Backlog</option>
                      <option value="in_progress">In Progress</option>
                      <option value="automating">Automating</option>
                      <option value="completed">Done</option>
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    );
  };

  return (
    <div className="space-y-4">
      
      {/* Header & Description */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-brand-400" />
            <span>Dual-Priority 2x2 Decision Matrix (Eisenhower Engine)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Balances subjective human urgency against mathematical AI automation leverage to optimize executive focus.
          </p>
        </div>

        <button
          onClick={() => setIsRecordModalOpen(true)}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-md transition flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Task via Voice</span>
        </button>
      </div>

      {/* 2x2 Quadrant Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Q1: Do First (Urgent & High AI Leverage) */}
        {renderQuadrant(
          "Q1: Do First (Immediate Wins)",
          "High User Urgency + High AI Automation Leverage",
          "Immediate ROI",
          "bg-rose-500/20 text-rose-300 border-rose-500/40",
          <Flame className="w-4 h-4 text-rose-400" />,
          q1Tasks,
          "border-rose-500/30",
          "from-slate-900 via-rose-950/10 to-slate-950"
        )}

        {/* Q2: Automate & Schedule (Low Urgency & High AI Leverage) */}
        {renderQuadrant(
          "Q2: Strategic Automation",
          "Low Urgency + High Recurring ROI (Compound Value)",
          "Compound Leverage",
          "bg-brand-500/20 text-brand-300 border-brand-500/40",
          <Sparkles className="w-4 h-4 text-brand-400" />,
          q2Tasks,
          "border-brand-500/30",
          "from-slate-900 via-teal-950/10 to-slate-950"
        )}

        {/* Q3: Direct Executive Action (Urgent & Human Only) */}
        {renderQuadrant(
          "Q3: Executive Direct Action",
          "High Urgency + Human-Only / Relationship Nuance",
          "Personal Focus",
          "bg-amber-500/20 text-amber-300 border-amber-500/40",
          <ShieldAlert className="w-4 h-4 text-amber-400" />,
          q3Tasks,
          "border-amber-500/30",
          "from-slate-900 via-amber-950/10 to-slate-950"
        )}

        {/* Q4: Routine & Backlog (Low Urgency & Low Leverage) */}
        {renderQuadrant(
          "Q4: Routine & Backlog",
          "Low Urgency + Low Automation Impact",
          "Defer / Batch",
          "bg-slate-800 text-slate-400 border-slate-700",
          <Archive className="w-4 h-4 text-slate-400" />,
          q4Tasks,
          "border-slate-800",
          "from-slate-900 to-slate-950"
        )}

      </div>

    </div>
  );
};
