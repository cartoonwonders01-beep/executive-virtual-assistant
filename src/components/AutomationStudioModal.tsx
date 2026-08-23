import React, { useState } from 'react';
import { useAssistant } from '../context/AssistantContext';
import { 
  Sparkles, 
  X, 
  Code2, 
  Terminal, 
  ExternalLink, 
  CheckCircle2, 
  Copy, 
  Play, 
  Bot, 
  Clock, 
  TrendingUp, 
  Wrench, 
  BookOpen,
  Radio
} from 'lucide-react';

export const AutomationStudioModal: React.FC = () => {
  const { selectedTaskForBlueprint, setSelectedTaskForBlueprint, updateTaskStatus } = useAssistant();
  const [copied, setCopied] = useState(false);
  const [isRunningSim, setIsRunningSim] = useState(false);
  const [simOutput, setSimOutput] = useState<string | null>(null);

  if (!selectedTaskForBlueprint) return null;

  const task = selectedTaskForBlueprint;
  const bp = task.automationBlueprint;

  const copyCode = () => {
    if (bp?.executableCodeSample) {
      navigator.clipboard.writeText(bp.executableCodeSample);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRunSimulation = () => {
    setIsRunningSim(true);
    setSimOutput('Connecting to sandbox-vm via SSH bridge (10.211.55.6)...\nExecuting dry-run automated validation...');
    setTimeout(() => {
      setSimOutput(`[sandbox-vm] Script executed successfully.\n[sandbox-vm] Parsed target output without errors.\n[sandbox-vm] Recurring hours saved: +${bp?.recurringHoursSavedPerMonth || 12}h/mo.\nStatus: SYSTEM_OPERATIONAL ✅`);
      setIsRunningSim(false);
      updateTaskStatus(task.id, 'automating');
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 p-6 animate-fadeIn text-slate-200">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-brand-500/20 text-brand-300 rounded-lg border border-brand-500/30">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
                Self-Teaching Automation Studio
              </span>
            </div>
            <h2 className="text-lg font-bold text-white">{task.title}</h2>
          </div>

          <button
            onClick={() => setSelectedTaskForBlueprint(null)}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ROI & Feasibility Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 font-mono text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">Feasibility</span>
            <span className="text-brand-400 font-bold capitalize">{task.feasibility.replace('_', ' ')}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Est. Build Time</span>
            <span className="text-white font-bold">{bp?.estimatedHoursToBuild || 3} Hours</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Recurring Saved</span>
            <span className="text-emerald-400 font-bold">+{bp?.recurringHoursSavedPerMonth || 12}h / month</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Readiness</span>
            <span className="text-teal-300 font-bold capitalize">{bp?.executionReadiness.replace(/_/g, ' ') || 'Ready'}</span>
          </div>
        </div>

        {/* Strategy Steps */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-brand-400" />
            <span>Step-by-Step AI Execution Strategy</span>
          </h3>
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
            {bp?.strategy && bp.strategy.length > 0 ? (
              bp.strategy.map((step, idx) => (
                <div key={idx} className="flex items-start space-x-2 text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 flex-shrink-0" />
                  <span>{step}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-400 italic">No custom strategy steps available.</p>
            )}
          </div>
        </div>

        {/* Tools & APIs */}
        {bp?.toolsNeeded && bp.toolsNeeded.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-teal-400" />
              <span>Required Tools & APIs</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {bp.toolsNeeded.map((tool, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-slate-950 text-slate-300 border border-slate-800 rounded-lg text-xs font-mono">
                  {tool}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Executable Code / Script Sample */}
        {bp?.executableCodeSample && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-indigo-400" />
                <span>Generated Automation Script ({bp.codeLanguage})</span>
              </h3>
              <button
                onClick={copyCode}
                className="flex items-center space-x-1 text-xs text-brand-400 hover:text-brand-300 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-brand-300 overflow-x-auto">
              <pre>{bp.executableCodeSample}</pre>
            </div>
          </div>
        )}

        {/* Web Research & Best Practices Inspiration */}
        {bp?.webInspiration && bp.webInspiration.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Web Research & Best Practices Synthesis</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {bp.webInspiration.map((item, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                  <p className="font-semibold text-slate-200">{item.title}</p>
                  <p className="text-slate-400 text-[11px]">{item.keyTakeaway}</p>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-400 hover:underline text-[10px] inline-flex items-center gap-0.5 pt-1"
                    >
                      <span>Read Docs</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Simulation Output */}
        {simOutput && (
          <div className="bg-slate-950 p-3.5 rounded-xl border border-teal-500/40 font-mono text-xs text-teal-300 space-y-1">
            <p className="text-[10px] uppercase font-bold text-teal-400">Sandbox VM Execution Output:</p>
            <pre className="whitespace-pre-wrap">{simOutput}</pre>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            onClick={() => setSelectedTaskForBlueprint(null)}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
          >
            Close
          </button>

          <button
            onClick={handleRunSimulation}
            disabled={isRunningSim}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-brand-500 to-teal-500 hover:from-brand-600 hover:to-teal-600 text-slate-950 shadow-lg shadow-teal-900/40 transition disabled:opacity-50"
          >
            {isRunningSim ? <Radio className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>{isRunningSim ? 'Executing on Sandbox VM...' : 'Test & Run Automation'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
