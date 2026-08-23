import React, { useState } from 'react';
import { 
  Sparkles, 
  Bot, 
  Play, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Mic, 
  Zap, 
  Layers, 
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Code,
  Terminal,
  Copy
} from 'lucide-react';
import { useAssistant } from '../context/AssistantContext';
import { CustomSkill, SkillStep } from '../types';
import { antigravityBridge } from '../services/antigravityBridge';

export const SkillLearningHub: React.FC = () => {
  const { 
    customSkills, 
    createCustomSkill, 
    deleteCustomSkill, 
    toggleCustomSkill, 
    executeCustomSkill,
    submitVoiceTranscript,
    isProcessingSpeech
  } = useAssistant();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [skillName, setSkillName] = useState('');
  const [triggerPhrase, setTriggerPhrase] = useState('');
  const [description, setDescription] = useState('');
  const [selectedActions, setSelectedActions] = useState<string[]>(['triage_inbox', 'check_calendar']);
  const [activeTestingSkillId, setActiveTestingSkillId] = useState<string | null>(null);

  const availableActionTypes = [
    { id: 'triage_inbox', label: 'Triage VIP Inbox & Summarize Emails', icon: '📬' },
    { id: 'check_calendar', label: 'Check Today’s Calendar & Conflicts', icon: '📅' },
    { id: 'list_tasks', label: 'Identify Top 3 AI Automated Tasks', icon: '⚡' },
    { id: 'summarize_kpi', label: 'Calculate Cumulative Hours Won Back', icon: '📊' },
    { id: 'run_autonomous', label: 'Trigger Autonomous Backlog Worker', icon: '🤖' },
    { id: 'query_weather', label: 'Fetch Weather & Forecast', icon: '☀️' }
  ];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim() || !triggerPhrase.trim()) return;

    const steps: SkillStep[] = selectedActions.map((act, idx) => {
      const def = availableActionTypes.find(a => a.id === act);
      return {
        id: `step-${idx + 1}`,
        order: idx + 1,
        actionType: act as any,
        label: def?.label || act
      };
    });

    createCustomSkill({
      name: skillName,
      triggerPhrase,
      description: description || `Automates ${steps.length} sequential workflow steps.`,
      actionSteps: steps,
      source: 'user_configured'
    });

    setSkillName('');
    setTriggerPhrase('');
    setDescription('');
    setIsCreateModalOpen(false);
  };

  const handleTestSkill = async (skill: CustomSkill) => {
    setActiveTestingSkillId(skill.id);
    await executeCustomSkill(skill.id);
    setTimeout(() => setActiveTestingSkillId(null), 2500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-950/40 to-slate-900 border border-brand-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-48 h-48 text-brand-400" />
        </div>

        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" />
            <span>Autonomous Self-Teaching Skill Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Executive Skill & Routine Studio
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Teach your AI assistant new multi-step routines using natural speech or manual blueprints. 
            Whenever you speak the trigger phrase, the assistant executes every step autonomously.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white text-xs font-semibold shadow-lg shadow-teal-500/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create Custom Routine</span>
            </button>

            <button
              onClick={() => submitVoiceTranscript("Learn a skill: 'Morning Briefing' means triage inbox and check schedule")}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition"
            >
              <Mic className="w-4 h-4 text-brand-400" />
              <span>Teach via Voice Demo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Voice Prompt Teaching Examples */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-3">
          <Bot className="w-4 h-4 text-teal-400" />
          <span>Teach by Speaking to Your Mic Anytime:</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div 
            onClick={() => submitVoiceTranscript("When I say 'Daily Standup', triage my inbox and summarize top priority tasks")}
            className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-brand-500/40 cursor-pointer transition group"
          >
            <p className="text-brand-400 font-mono font-semibold mb-1 group-hover:underline">🗣️ "When I say 'Daily Standup'..."</p>
            <p className="text-slate-400">Triages inbox, checks calendar & extracts top 3 tasks.</p>
          </div>

          <div 
            onClick={() => submitVoiceTranscript("When I say 'Wife Check-in', send an email to Emily saying I love her")}
            className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-brand-500/40 cursor-pointer transition group"
          >
            <p className="text-brand-400 font-mono font-semibold mb-1 group-hover:underline">🗣️ "When I say 'Wife Check-in'..."</p>
            <p className="text-slate-400">Dispatches love note directly to Emily Baxter.</p>
          </div>

          <div 
            onClick={() => submitVoiceTranscript("When I say 'EOD Wrap Up', calculate hours won back and run autonomous tasks")}
            className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-brand-500/40 cursor-pointer transition group"
          >
            <p className="text-brand-400 font-mono font-semibold mb-1 group-hover:underline">🗣️ "When I say 'EOD Wrap Up'..."</p>
            <p className="text-slate-400">Computes daily hours saved & syncs Swarm jobs.</p>
          </div>
        </div>
      </div>

      {/* Skills Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-400" />
            <span>Active Learned Skills Registry ({customSkills.length})</span>
          </h2>
          <span className="text-xs text-slate-400">All skills respond to voice activation</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customSkills.map((skill) => (
            <div 
              key={skill.id}
              className={`bg-slate-900/90 border rounded-2xl p-5 shadow-xl transition flex flex-col justify-between ${
                skill.isEnabled 
                  ? 'border-slate-800 hover:border-brand-500/40' 
                  : 'border-slate-800/50 opacity-60'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">⚡</span>
                      <h3 className="font-bold text-white text-sm">{skill.name}</h3>
                    </div>
                    <p className="text-xs text-slate-400">{skill.description}</p>
                  </div>
                  
                  <input
                    type="checkbox"
                    checked={skill.isEnabled}
                    onChange={() => toggleCustomSkill(skill.id)}
                    className="w-4 h-4 rounded text-brand-500 bg-slate-800 border-slate-700 focus:ring-brand-400 cursor-pointer"
                  />
                </div>

                {/* Trigger Phrase Badge */}
                <div className="bg-slate-950/80 border border-brand-500/20 rounded-xl px-3 py-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Voice Trigger:</span>
                  <code className="text-xs text-brand-300 font-mono font-semibold">"{skill.triggerPhrase}"</code>
                </div>

                {/* Action Steps */}
                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Execution Pipeline ({skill.actionSteps.length} Steps):</p>
                  <div className="space-y-1">
                    {skill.actionSteps.map((step, sIdx) => (
                      <div key={step.id || sIdx} className="text-[11px] text-slate-300 flex items-center space-x-2 bg-slate-800/40 px-2.5 py-1 rounded-lg">
                        <span className="text-[10px] font-mono text-brand-400 font-bold">{sIdx + 1}.</span>
                        <span className="truncate">{step.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Actions & Stats */}
              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div className="text-[11px] text-slate-400">
                  <span>Executed </span>
                  <span className="font-mono text-white font-semibold">{skill.executionCount}x</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleTestSkill(skill)}
                    disabled={activeTestingSkillId === skill.id || isProcessingSpeech}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-semibold transition"
                  >
                    {activeTestingSkillId === skill.id ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Running...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" />
                        <span>Test Run</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      const exp = antigravityBridge.exportToAntigravitySkill(skill);
                      navigator.clipboard.writeText(exp.skillContent);
                      alert(`⚡ Antigravity SKILL.md for "${skill.name}" copied to clipboard!`);
                    }}
                    className="p-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 text-brand-300 transition"
                    title="Export to Antigravity SKILL.md"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => deleteCustomSkill(skill.id)}
                    className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition"
                    title="Delete Skill"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* Create Skill Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-brand-500/10 rounded-xl text-brand-400">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Create Custom Voice Skill</h3>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Skill Routine Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Morning Standup"
                  value={skillName}
                  onChange={e => setSkillName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Voice Trigger Phrase</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. morning standup"
                  value={triggerPhrase}
                  onChange={e => setTriggerPhrase(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">Whenever you say this phrase, the assistant executes the steps below.</p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Reads unread emails and checks calendar"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-2">Select Actions to Execute Sequentially:</label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {availableActionTypes.map((action) => {
                    const isSelected = selectedActions.includes(action.id);
                    return (
                      <div
                        key={action.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedActions(prev => prev.filter(a => a !== action.id));
                          } else {
                            setSelectedActions(prev => [...prev, action.id]);
                          }
                        }}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                          isSelected
                            ? 'bg-brand-500/10 border-brand-500/40 text-white'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <span>{action.icon}</span>
                          <span className="font-medium">{action.label}</span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-400" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedActions.length === 0}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white font-semibold shadow-lg shadow-teal-500/20 transition disabled:opacity-50"
                >
                  Save Skill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
