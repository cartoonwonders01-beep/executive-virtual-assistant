import React, { useState, useEffect } from 'react';
import { useAssistant } from '../context/AssistantContext';
import { AutonomousJob, TaskItem } from '../types';
import { 
  Bot, 
  Play, 
  FastForward, 
  CheckCircle2, 
  Clock, 
  Terminal, 
  Zap, 
  RotateCw, 
  Sparkles, 
  Code2, 
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export const AutonomousWorkerDeck: React.FC = () => {
  const { 
    tasks, 
    autonomousJobs, 
    runAutonomousStep, 
    runAllAutonomousBacklog,
    setSelectedTaskForBlueprint,
    kpi
  } = useAssistant();

  const [isRunningSingle, setIsRunningSingle] = useState(false);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [lastStepMsg, setLastStepMsg] = useState<string | null>(null);

  const backlogQueue = tasks.filter(
    t => t.status === 'automating' || t.status === 'in_progress' || (t.status === 'backlog' && t.feasibility === 'ai_automated')
  );

  const completedTasks = tasks.filter(t => t.status === 'completed');

  const handleStep = async (taskId?: string) => {
    setIsRunningSingle(true);
    const res = await runAutonomousStep(taskId);
    setIsRunningSingle(false);
    if (res && res.logMessage) {
      setLastStepMsg(res.logMessage);
      setTimeout(() => setLastStepMsg(null), 4000);
    }
  };

  const handleRunAll = async () => {
    setIsRunningAll(true);
    const res = await runAllAutonomousBacklog();
    setIsRunningAll(false);
    if (res && res.executedCount !== undefined) {
      setLastStepMsg(`Successfully executed ${res.executedCount} autonomous backlog automation steps.`);
      setTimeout(() => setLastStepMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Deck */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-brand-500/10 border border-brand-500/30 text-brand-400 rounded-2xl">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Autonomous Backlog Worker Deck</h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                Sandbox VM Connected (10.211.55.6)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Self-healing AI agent that picks prioritized backlog items and executes blueprints autonomously
            </p>
          </div>
        </div>

        {/* Global Control Buttons */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => handleStep()}
            disabled={isRunningSingle || isRunningAll || backlogQueue.length === 0}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-950 hover:bg-slate-800 text-brand-300 border border-slate-800 transition disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isRunningSingle ? 'animate-spin' : ''}`} />
            <span>{isRunningSingle ? 'Executing...' : 'Run Single Step'}</span>
          </button>

          <button
            onClick={handleRunAll}
            disabled={isRunningSingle || isRunningAll || backlogQueue.length === 0}
            className="flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-md transition disabled:opacity-50"
          >
            <FastForward className={`w-4 h-4 ${isRunningAll ? 'animate-spin' : ''}`} />
            <span>{isRunningAll ? 'Resolving Backlog...' : 'Run Full Autonomous Loop'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <p className="text-[11px] font-semibold text-slate-400">Backlog Queue</p>
          <p className="text-xl font-bold text-white mt-1">{backlogQueue.length} Tasks</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <p className="text-[11px] font-semibold text-slate-400">Completed Automations</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">{completedTasks.length} Done</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <p className="text-[11px] font-semibold text-slate-400">Total Hours Won Back</p>
          <p className="text-xl font-bold text-brand-400 mt-1">+{kpi?.totalHoursWonBack || 0}h</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <p className="text-[11px] font-semibold text-slate-400">Execution Velocity</p>
          <p className="text-xl font-bold text-indigo-400 mt-1">{kpi?.roiMultiplier || 5.5}x ROI</p>
        </div>
      </div>

      {/* Toast notification message */}
      {lastStepMsg && (
        <div className="bg-brand-950/40 border border-brand-500/40 p-3.5 rounded-2xl text-xs text-brand-200 flex items-center space-x-2 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-brand-400 flex-shrink-0" />
          <span>{lastStepMsg}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Prioritized Task Backlog Queue */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Prioritized Backlog Queue ({backlogQueue.length})</span>
            </h2>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {backlogQueue.length === 0 ? (
              <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400 opacity-60" />
                <p className="font-semibold text-slate-300">All prioritized tasks automated & completed!</p>
                <p className="text-[11px] text-slate-500 mt-1">Speak into the Voice HUD to add new executive action items.</p>
              </div>
            ) : (
              backlogQueue.map(task => (
                <div
                  key={task.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl space-y-3 shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                          {task.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          task.status === 'automating' ? 'bg-amber-500/20 text-amber-300' : 'bg-brand-500/20 text-brand-300'
                        }`}>
                          {task.status.toUpperCase()}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-white mt-1.5 leading-snug">{task.title}</h3>
                    </div>

                    <span className="text-xs font-bold text-emerald-400 font-mono whitespace-nowrap">
                      +{task.timeWonBackHours}h
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {task.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Blueprint Execution Progress</span>
                      <span className="font-mono text-brand-300">{task.progressPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all duration-300"
                        style={{ width: `${task.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => setSelectedTaskForBlueprint(task)}
                      className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <Code2 className="w-3 h-3" />
                      <span>View Blueprint Code</span>
                    </button>

                    <button
                      onClick={() => handleStep(task.id)}
                      disabled={isRunningSingle || isRunningAll}
                      className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 border border-brand-500/30 text-[11px] font-semibold transition"
                    >
                      <Play className="w-3 h-3" />
                      <span>Step Agent</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        {/* Right Column: Live Terminal & Autonomous Job Stream */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Live Agent Execution Console</span>
            </h2>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-4 max-h-[600px] overflow-y-auto font-mono text-xs">
            
            {/* Terminal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-900 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>sandbox-vm: active</span>
              </span>
              <span>PARALLELS VM: 10.211.55.6</span>
            </div>

            {/* Active Jobs Stream */}
            <div className="space-y-4">
              {autonomousJobs.map(job => (
                <div
                  key={job.id}
                  className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl space-y-2.5 font-sans"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate max-w-xs">{job.taskTitle}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      job.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-brand-500/20 text-brand-300'
                    }`}>
                      {job.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-brand-300 font-mono">
                    ➜ {job.currentStepText}
                  </p>

                  {/* Terminal Logs */}
                  <div className="bg-black/60 p-2.5 rounded-xl border border-slate-800/80 space-y-1 font-mono text-[10px]">
                    {job.logs.map((l, idx) => (
                      <div key={idx} className="flex items-start space-x-1.5 text-slate-300 leading-tight">
                        <span className="text-slate-600">[{new Date(l.timestamp).toLocaleTimeString()}]</span>
                        <span className={l.type === 'success' ? 'text-emerald-400 font-semibold' : l.type === 'error' ? 'text-red-400' : 'text-slate-300'}>
                          {l.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
