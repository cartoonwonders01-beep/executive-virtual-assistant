import React from 'react';
import { useAssistant } from '../context/AssistantContext';
import { TaskItem } from '../types';
import { LayoutGrid, Sparkles, Bot, User, Zap, AlertCircle } from 'lucide-react';

export const PriorityMatrixView: React.FC = () => {
  const { tasks, setSelectedTaskForBlueprint } = useAssistant();

  // Quadrant 1: Urgent & Critical (Do First)
  const q1 = tasks.filter(t => (t.userPriority === 'urgent' || t.userPriority === 'high') && (t.aiPriority === 'critical' || t.aiPriority === 'high'));

  // Quadrant 2: High Impact / High Automation ROI (Schedule / Automate)
  const q2 = tasks.filter(t => (t.userPriority === 'medium' || t.userPriority === 'low') && (t.aiPriority === 'critical' || t.aiPriority === 'high'));

  // Quadrant 3: User Urgent / Low AI Leverage (Delegate / Fast Human Finish)
  const q3 = tasks.filter(t => (t.userPriority === 'urgent' || t.userPriority === 'high') && (t.aiPriority === 'medium' || t.aiPriority === 'low' || t.aiPriority === 'defer'));

  // Quadrant 4: Low Urgency / Low Leverage (Backlog)
  const q4 = tasks.filter(t => (t.userPriority === 'medium' || t.userPriority === 'low') && (t.aiPriority === 'medium' || t.aiPriority === 'low' || t.aiPriority === 'defer'));

  const renderQuadrant = (title: string, subtitle: string, items: TaskItem[], colorClass: string, badgeText: string) => (
    <div className={`bg-slate-900/70 border rounded-2xl p-4 flex flex-col justify-between shadow-xl ${colorClass}`}>
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-100">{title}</h3>
            <p className="text-[11px] text-slate-400">{subtitle}</p>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
            {badgeText} ({items.length})
          </span>
        </div>

        <div className="space-y-2.5 mt-3 max-h-80 overflow-y-auto pr-1">
          {items.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4 text-center">No tasks in this quadrant.</p>
          ) : (
            items.map(task => (
              <div
                key={task.id}
                onClick={() => setSelectedTaskForBlueprint(task)}
                className="bg-slate-950/80 border border-slate-800/90 hover:border-brand-500/50 p-3 rounded-xl cursor-pointer transition shadow group"
              >
                <div className="flex items-start justify-between">
                  <h4 className="text-xs font-semibold text-slate-200 group-hover:text-brand-300 transition">
                    {task.title}
                  </h4>
                  {task.feasibility === 'ai_automated' && <Bot className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />}
                  {task.feasibility === 'hybrid' && <Zap className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />}
                  {task.feasibility === 'human_only' && <User className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-850 text-[10px] text-slate-400">
                  <span className="font-mono text-brand-400 font-bold">+{task.timeWonBackHours}h won</span>
                  <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800">
                    AI: {task.aiPriority.toUpperCase()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-brand-400" />
            <span>Dual-Priority Decision Matrix (User Gut vs AI Leverage)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Compare user urgency against objective automation feasibility and hours won back.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderQuadrant(
          'Q1: High Urgency + High AI Leverage',
          'Immediate Execution / Fast Win Automation',
          q1,
          'border-rose-500/30 bg-gradient-to-br from-rose-950/20 to-slate-900',
          'Execute Now'
        )}

        {renderQuadrant(
          'Q2: High Automation ROI + Low Urgency',
          'Build Automated Systems for Maximum Long-term Savings',
          q2,
          'border-brand-500/30 bg-gradient-to-br from-teal-950/20 to-slate-900',
          'Automate Blueprint'
        )}

        {renderQuadrant(
          'Q3: High Urgency + Human Only',
          'Direct Personal Attention / Executive Authority Needed',
          q3,
          'border-amber-500/30 bg-gradient-to-br from-amber-950/20 to-slate-900',
          'Human Action'
        )}

        {renderQuadrant(
          'Q4: Low Urgency + Low ROI',
          'Backlog & Routine Maintenance',
          q4,
          'border-slate-800 bg-slate-900/50',
          'Backlog'
        )}
      </div>
    </div>
  );
};
