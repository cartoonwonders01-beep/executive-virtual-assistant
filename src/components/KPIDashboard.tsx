import React, { useState } from 'react';
import { useAssistant } from '../context/AssistantContext';
import { 
  TrendingUp, 
  Clock, 
  Bot, 
  Zap, 
  CheckCircle2, 
  BarChart3,
  DollarSign,
  Download,
  FileSpreadsheet
} from 'lucide-react';

export const KPIDashboard: React.FC = () => {
  const { kpi } = useAssistant();
  const [hourlyRate, setHourlyRate] = useState<number>(200); // Default $200/hr executive value

  if (!kpi) return null;

  const aiPercent = kpi.totalTasks > 0 ? Math.round((kpi.aiAutomatedCount / kpi.totalTasks) * 100) : 0;
  const hybridPercent = kpi.totalTasks > 0 ? Math.round((kpi.hybridCount / kpi.totalTasks) * 100) : 0;
  const humanPercent = kpi.totalTasks > 0 ? Math.round((kpi.humanOnlyCount / kpi.totalTasks) * 100) : 0;

  const totalDollarValue = (kpi.totalHoursWonBack * hourlyRate).toLocaleString();
  const netDollarSaved = (kpi.netROIHours * hourlyRate).toLocaleString();

  const handleDownloadCSV = () => {
    window.open('/api/tasks/export/csv', '_blank');
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-400" />
            <span>Automation Velocity & Financial ROI Engine</span>
          </h2>
          <p className="text-xs text-slate-400">
            Calculates recurring time saved and monetary bottom-line value created via AI automation.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Hourly Rate Adjuster */}
          <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 text-xs">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400 text-[11px]">Rate:</span>
            <select
              value={hourlyRate}
              onChange={(e) => setHourlyRate(Number(e.target.value))}
              className="bg-transparent text-emerald-400 font-bold font-mono focus:outline-none cursor-pointer"
            >
              <option value={100} className="bg-slate-900">$100/hr</option>
              <option value={150} className="bg-slate-900">$150/hr</option>
              <option value={200} className="bg-slate-900">$200/hr</option>
              <option value={350} className="bg-slate-900">$350/hr</option>
              <option value={500} className="bg-slate-900">$500/hr</option>
            </select>
          </div>

          <button
            onClick={handleDownloadCSV}
            className="flex items-center space-x-1.5 px-3 py-1 text-xs font-semibold bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl transition"
            title="Export Monday Work Hub to CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-brand-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Total Financial Value Won */}
        <div className="bg-slate-950/70 border border-emerald-500/30 rounded-xl p-3.5 space-y-1 shadow-emerald-950/20 shadow-lg">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-medium text-slate-400">Financial Value Won</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-400 font-mono">${totalDollarValue}</p>
          <p className="text-[11px] text-emerald-300 flex items-center gap-1 font-medium font-mono">
            <TrendingUp className="w-3 h-3" />
            <span>+${netDollarSaved} net financial ROI</span>
          </p>
        </div>

        {/* Hours Won Back */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-brand-400">
            <span className="text-xs font-medium text-slate-400">Total Hours Won Back</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-white font-mono">{kpi.totalHoursWonBack}h</p>
          <p className="text-[11px] text-brand-400 font-mono">
            {kpi.roiMultiplier}x Automation ROI Multiplier
          </p>
        </div>

        {/* AI Feasibility Share */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-teal-400">
            <span className="text-xs font-medium text-slate-400">AI / Hybrid Feasible</span>
            <Bot className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-white font-mono">{aiPercent + hybridPercent}%</p>
          <p className="text-[11px] text-teal-400">
            {kpi.aiAutomatedCount} AI • {kpi.hybridCount} Hybrid • {kpi.humanOnlyCount} Human
          </p>
        </div>

        {/* Completion Velocity */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-indigo-400">
            <span className="text-xs font-medium text-slate-400">Completion Rate</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-white font-mono">{kpi.completionRatePercent}%</p>
          <p className="text-[11px] text-slate-400">
            {kpi.completedTasks} completed / {kpi.totalTasks} total
          </p>
        </div>
      </div>

      {/* Progress Bar of Feasibility Allocation */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Workload Feasibility Distribution</span>
          <span className="font-mono text-slate-300">
            🤖 {aiPercent}% AI Automated | ⚡ {hybridPercent}% Hybrid | 👤 {humanPercent}% Human-Only
          </span>
        </div>
        <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
          <div 
            style={{ width: `${aiPercent}%` }} 
            className="bg-brand-500 hover:bg-brand-400 transition-all" 
            title={`AI Automated: ${aiPercent}%`}
          />
          <div 
            style={{ width: `${hybridPercent}%` }} 
            className="bg-indigo-500 hover:bg-indigo-400 transition-all" 
            title={`Hybrid: ${hybridPercent}%`}
          />
          <div 
            style={{ width: `${humanPercent}%` }} 
            className="bg-amber-500 hover:bg-amber-400 transition-all" 
            title={`Human-Only: ${humanPercent}%`}
          />
        </div>
      </div>

    </div>
  );
};
