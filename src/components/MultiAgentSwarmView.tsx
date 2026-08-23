import React, { useState, useEffect } from 'react';
import { useAssistant } from '../context/AssistantContext';
import { SwarmStatus, AgentActivityLog, SwarmAgent } from '../types';
import { 
  Users, 
  Play, 
  Zap, 
  Cpu, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Activity,
  Bot,
  RefreshCw,
  Terminal,
  Layers
} from 'lucide-react';
import { playChime } from '../services/soundEffects';

export const MultiAgentSwarmView: React.FC = () => {
  const { setSelectedTaskForBlueprint, refreshAll, tasks } = useAssistant();
  const [swarm, setSwarm] = useState<SwarmStatus | null>(null);
  const [isCycling, setIsCycling] = useState(false);
  const [autoCycle, setAutoCycle] = useState(false);

  const fetchSwarmStatus = async () => {
    try {
      const res = await fetch('/api/swarm/status');
      const data = await res.json();
      setSwarm(data);
    } catch (e) {
      console.warn('Failed to fetch swarm status:', e);
    }
  };

  useEffect(() => {
    fetchSwarmStatus();
    const interval = setInterval(fetchSwarmStatus, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerCycle = async () => {
    setIsCycling(true);
    playChime('listen_start');
    try {
      const res = await fetch('/api/swarm/cycle', { method: 'POST' });
      const data = await res.json();
      await fetchSwarmStatus();
      await refreshAll();
      if (data.completedCount > 0) {
        playChime('action_success');
      }
    } catch (e) {
      console.error('Error triggering swarm cycle:', e);
    } finally {
      setIsCycling(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Autonomous Multi-Agent Swarm</h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse">
                4 Specialized Subagents Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Concurrent domain-specialized agents executing backlog blueprints in parallel on Sandbox VM
            </p>
          </div>
        </div>

        {/* Trigger Button */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleTriggerCycle}
            disabled={isCycling}
            className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg transition disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${isCycling ? 'animate-spin' : ''}`} />
            <span>{isCycling ? 'Swarm Executing...' : 'Trigger Swarm Cycle'}</span>
          </button>
        </div>
      </div>

      {/* Swarm Telemetry KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <p className="text-[11px] font-semibold text-slate-400">Concurrent Subagents</p>
          <p className="text-xl font-bold text-white mt-1 font-mono">4 Subagents</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <p className="text-[11px] font-semibold text-slate-400">Swarm Concurrency</p>
          <p className="text-xl font-bold text-purple-400 mt-1 font-mono">100% Parallel</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <p className="text-[11px] font-semibold text-slate-400">Cumulative Hours Won</p>
          <p className="text-xl font-bold text-brand-400 mt-1 font-mono">+{swarm?.totalHoursWonBack || 0}h</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <p className="text-[11px] font-semibold text-slate-400">Agent Accuracy</p>
          <p className="text-xl font-bold text-emerald-400 mt-1 font-mono">99.1% Green</p>
        </div>
      </div>

      {/* 4 Specialized Subagents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {swarm?.agents.map((agent: SwarmAgent) => (
          <div
            key={agent.id}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-3xl space-y-4 shadow-xl transition flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Agent Top Row */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl p-2 bg-slate-950 rounded-2xl border border-slate-800 shadow-sm">
                    {agent.avatar}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{agent.name}</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">{agent.role}</p>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  agent.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                }`}>
                  {agent.status}
                </span>
              </div>

              {/* Domain & Stats */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800/80 text-center font-mono">
                <div>
                  <p className="text-[9px] text-slate-500 uppercase">Domain</p>
                  <p className="text-[11px] font-semibold text-slate-200 truncate">{agent.assignedDomain}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 uppercase">Done</p>
                  <p className="text-[11px] font-semibold text-emerald-400">+{agent.tasksCompletedCount}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 uppercase">Hours Won</p>
                  <p className="text-[11px] font-semibold text-brand-300">+{agent.hoursWonBack}h</p>
                </div>
              </div>

              {/* Current Task if any */}
              {agent.currentTaskTitle && (
                <div className="bg-purple-950/20 border border-purple-500/30 p-2.5 rounded-xl space-y-1">
                  <p className="text-[10px] text-purple-300 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Activity className="w-3 h-3 text-purple-400 animate-pulse" />
                    <span>Active Backlog Assignment:</span>
                  </p>
                  <p className="text-xs text-white font-medium line-clamp-1">{agent.currentTaskTitle}</p>
                </div>
              )}
            </div>

            {/* Recent Log Footer */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="truncate max-w-xs font-mono text-slate-400">➜ {agent.recentLog}</span>
              <span className="text-[10px] font-mono text-slate-600">
                {new Date(agent.lastActiveAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Real-Time Agent Communication Feed */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-900">
          <h2 className="text-xs font-bold text-slate-200 flex items-center gap-2 font-mono">
            <Terminal className="w-4 h-4 text-purple-400" />
            <span>Real-Time Swarm Activity Stream (Sandbox VM: 10.211.55.6)</span>
          </h2>
          <span className="text-[10px] text-slate-500 font-mono">Auto-refreshing (3.5s)</span>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto font-mono text-[11px] pr-1">
          {swarm?.recentLogs.map((log: AgentActivityLog) => (
            <div
              key={log.id}
              className="flex items-start space-x-2 p-2 bg-slate-900/60 rounded-xl border border-slate-800/80 leading-relaxed text-slate-300"
            >
              <span className="text-slate-600 text-[10px]">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
              <span className="text-purple-300 font-semibold">{log.agentName}:</span>
              <span className="text-slate-200">{log.message}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
