import React, { useState } from 'react';
import { useAssistant } from '../context/AssistantContext';
import { googleEcosystem } from '../services/googleEcosystem';
import { antigravityBridge } from '../services/antigravityBridge';
import { selfLearningEngine, LearnedInsight } from '../services/selfLearningEngine';
import { 
  Sparkles, 
  Brain, 
  Lightbulb, 
  Send, 
  Mic, 
  MicOff, 
  CheckCircle2, 
  Calendar, 
  Mail, 
  Database, 
  Layers, 
  Bot, 
  Terminal, 
  ArrowRight, 
  Copy, 
  Share2, 
  PlusCircle,
  ExternalLink,
  Zap,
  Globe,
  Flame
} from 'lucide-react';

interface ThoughtItem {
  id: string;
  rawText: string;
  category: 'Strategy' | 'Engineering' | 'Finance' | 'Productivity' | 'Personal';
  summary: string;
  keyInsights: string[];
  actionSteps: string[];
  googleSynced: boolean;
  antigravityReady: boolean;
  createdAt: string;
}

export const ThoughtActionHub: React.FC = () => {
  const { 
    isListening, 
    startVoiceListening, 
    stopVoiceListening, 
    submitVoiceTranscript,
    isProcessingSpeech,
    tasks,
    customSkills,
    createCustomSkill,
    kpi
  } = useAssistant();

  const [inputText, setInputText] = useState('');
  const [activeCategory, setActiveCategory] = useState<'All' | 'Strategy' | 'Engineering' | 'Finance' | 'Productivity' | 'Personal'>('All');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedThought, setSelectedThought] = useState<ThoughtItem | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const [thoughts, setThoughts] = useState<ThoughtItem[]>([
    {
      id: 'th-1',
      rawText: "We need an edge-first AI Assistant architecture that connects our voice transcripts through Groq Whisper and Gemini Ultra, syncs to Google Sheets and BigQuery, and lets us teach it new skills dynamically.",
      category: 'Engineering',
      summary: "Edge-First AI Architecture with hybrid Groq/Gemini pipelines, Google Ecosystem synchronization, and on-the-fly skill learning.",
      keyInsights: [
        "Groq Whisper delivers < 200ms voice-to-text latency for real-time mobile conversational fluidity.",
        "Google Gemini AI Ultra acts as high-IQ reasoning core for deep strategic dissection and code generation.",
        "Self-Learning Engine persists voice-taught routines into Antigravity SKILL.md customizations."
      ],
      actionSteps: [
        "Deploy Cloudflare Pages Functions edge gateway for < 50ms global API latency.",
        "Implement 2-way Google Apps Script webhook for Sheets & BigQuery warehouse streaming.",
        "Package as installable Progressive Web App (PWA) with offline service worker caching."
      ],
      googleSynced: true,
      antigravityReady: true,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    {
      id: 'th-2',
      rawText: "Protect the morning 90-minute deep work block at all costs. Triage VIP emails only twice daily and delegate sub-$100/hr operational tasks to AI swarm workers.",
      category: 'Productivity',
      summary: "Executive High-Leverage Time Management & Autonomous Delegation Protocol.",
      keyInsights: [
        "Circadian Peak Optimization: 08:30 AM to 10:00 AM reserved strictly for highest-priority strategic execution.",
        "Inbox Asynchronicity: Triage at 11:30 AM and 04:30 PM eliminates attention residue.",
        "Autonomous Task Delegation: AI swarm agents handle repetitive scraping, data entry, and drafting."
      ],
      actionSteps: [
        "Block daily Google Calendar slots labeled 'Deep Work (No Meetings)'.",
        "Enable VIP-only push notifications for Emily and Executive Board.",
        "Automate Monday.com backlog execution with background worker swarm."
      ],
      googleSynced: true,
      antigravityReady: false,
      createdAt: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSynthesize = async (overrideText?: string) => {
    const textToProcess = overrideText || inputText;
    if (!textToProcess.trim()) return;

    setIsSynthesizing(true);
    
    // Categorize
    let category: ThoughtItem['category'] = 'Strategy';
    const lower = textToProcess.toLowerCase();
    if (/code|api|deploy|edge|cloud|engine|architecture|database|bug/i.test(lower)) category = 'Engineering';
    else if (/revenue|cost|valuation|dcf|pricing|tax|invest|cac/i.test(lower)) category = 'Finance';
    else if (/routine|morning|habit|focus|time|deep work|energy/i.test(lower)) category = 'Productivity';
    else if (/wife|emily|family|health|gym|dinner|weekend/i.test(lower)) category = 'Personal';

    // Formulate structured thought item
    const summary = textToProcess.length > 80 ? textToProcess.substring(0, 77) + '...' : textToProcess;
    const newThought: ThoughtItem = {
      id: 'th-' + Date.now().toString(36),
      rawText: textToProcess,
      category,
      summary: `Strategic Synthesis: ${summary}`,
      keyInsights: [
        `Core Value Driver: Accelerate executive execution speed and eliminate low-leverage friction.`,
        `Ecosystem Alignment: Seamlessly bridges across Google Workspace and Antigravity Development Suite.`,
        `Self-Improving Feedback Loop: Logged to memory graph for future conversational context.`
      ],
      actionSteps: [
        `Step 1: Validate architectural blueprint and verify prerequisites.`,
        `Step 2: Sync records to Google Sheets & BigQuery warehouse.`,
        `Step 3: Export actionable automation routine to Antigravity Suite.`
      ],
      googleSynced: false,
      antigravityReady: true,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setThoughts(prev => [newThought, ...prev]);
    setSelectedThought(newThought);
    setInputText('');
    setIsSynthesizing(false);

    // Also trigger conversational voice response
    await submitVoiceTranscript(textToProcess);
    showNotification('💡 Thought synthesized, actionable steps extracted, and voiced by Eve!');
  };

  const handleSyncToGoogle = async (thought: ThoughtItem) => {
    const defaultKpi = {
      totalHoursWonBack: 776,
      automationHoursInvested: 135.5,
      netROIHours: 640.5,
      roiMultiplier: 5.7,
      totalTasks: tasks.length,
      completedTasks: 2,
      ongoingTasks: 44,
      backlogTasks: 3,
      aiAutomatedCount: 42,
      humanOnlyCount: 4,
      hybridCount: 3,
      highValueCount: 49,
      completionRatePercent: 4
    };

    const res = await googleEcosystem.syncToSheetsAndBigQuery(
      [{
        id: thought.id,
        content: thought.rawText,
        category: thought.category,
        executiveSummary: thought.summary,
        keyInsights: thought.keyInsights,
        actionSteps: thought.actionSteps,
        googleSyncStatus: 'synced',
        antigravityExported: thought.antigravityReady,
        createdAt: thought.createdAt
      }],
      tasks,
      kpi || defaultKpi
    );

    setThoughts(prev => prev.map(t => t.id === thought.id ? { ...t, googleSynced: true } : t));
    if (selectedThought?.id === thought.id) {
      setSelectedThought(prev => prev ? { ...prev, googleSynced: true } : null);
    }
    showNotification(`📊 ${res.summary}`);
  };

  const handleExportToAntigravity = (thought: ThoughtItem) => {
    const slug = thought.summary.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30);
    const mockSkill = {
      id: 'skill-' + Date.now().toString(36),
      name: `${thought.category} Routine`,
      triggerPhrase: slug,
      description: thought.summary,
      actionSteps: thought.actionSteps.map((step, i) => ({
        id: `s-${i}`,
        order: i + 1,
        actionType: 'triage_inbox' as any,
        label: step
      })),
      isEnabled: true,
      executionCount: 1,
      learnedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      source: 'voice_learned' as any
    };

    const exported = antigravityBridge.exportToAntigravitySkill(mockSkill);
    navigator.clipboard.writeText(exported.skillContent);
    showNotification(`⚡ Antigravity SKILL.md exported for "${mockSkill.name}" & copied to clipboard!`);
  };

  const filteredThoughts = thoughts.filter(t => activeCategory === 'All' || t.category === activeCategory);

  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-6xl mx-auto px-4 py-6 space-y-6 animate-fadeIn">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-brand-500/90 text-slate-950 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center space-x-2 font-medium text-xs border border-teal-300 animate-bounce">
          <Sparkles className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Banner: PWA Engine & Ecosystem Status */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-brand-950/40 border border-slate-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse"></span>
                PWA Mobile Engine Active
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                Google Ecosystem 2-Way Live
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white mt-2 flex items-center gap-2">
              <Brain className="w-6 h-6 text-brand-400" />
              <span>Interactive Thought, Idea & Action Studio</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Brainstorm freely, share raw streams of consciousness, and let Eve structure your ideas into Google Workspace & Antigravity execution pipelines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-brand-400" />
              <span>Antigravity 2.0 Bridge: <strong>Connected</strong></span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-teal-400" />
              <span>BigQuery Warehouse: <strong>Streaming</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Thought Capture Studio + Real-Time Synthesis Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Thought Input & Quick Audio Capture (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>Capture Thought or Idea</span>
              </span>
              <button
                onClick={isListening ? stopVoiceListening : startVoiceListening}
                className={`p-2 rounded-xl border flex items-center space-x-1.5 text-xs font-semibold transition ${
                  isListening 
                    ? 'bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/30 animate-pulse' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-brand-400" />}
                <span>{isListening ? 'Listening...' : 'Voice Stream'}</span>
              </button>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Dump your raw thoughts, brainstorm strategic directions, discuss tech architecture tradeoffs, or teach Eve a new workflow routine..."
              rows={6}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition resize-none leading-relaxed"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">
                Say <strong className="text-slate-300">"Hey Eve"</strong> or tap Voice Stream
              </span>
              <button
                onClick={() => handleSynthesize()}
                disabled={isSynthesizing || !inputText.trim()}
                className="flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-500 to-teal-500 hover:from-brand-600 hover:to-teal-600 text-slate-950 shadow-lg shadow-brand-500/20 transition disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSynthesizing ? 'Synthesizing...' : 'Synthesize & Execute'}</span>
              </button>
            </div>
          </div>

          {/* Quick Brainstorming Prompts */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-2.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Quick Brainstorm Starters
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                "How do we scale our AI agent swarm to 10 parallel workers?",
                "What are 3 strategic pricing levers to double ARPU?",
                "When I say 'Executive Sync', check calendar and triage VIP emails",
                "Teach yourself to sync weekly financial KPIs to BigQuery",
                "Draft an email to my wife to say I love her"
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputText(prompt);
                    handleSynthesize(prompt);
                  }}
                  className="text-left text-[11px] px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-brand-500/10 hover:border-brand-500/30 text-slate-300 hover:text-brand-300 border border-slate-800 transition line-clamp-1"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Real-Time Thought Synthesis & Action Dispatcher (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Active / Latest Synthesized Thought Card */}
          {selectedThought || thoughts[0] ? (
            (() => {
              const current = selectedThought || thoughts[0];
              return (
                <div className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-brand-950/30 border border-brand-500/30 rounded-3xl p-5 shadow-2xl space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                        {current.category}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {current.createdAt}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${current.summary}\n\nInsights:\n${current.keyInsights.join('\n')}\n\nActions:\n${current.actionSteps.join('\n')}`);
                          setCopiedId(current.id);
                          setTimeout(() => setCopiedId(null), 2000);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition flex items-center gap-1"
                      >
                        {copiedId === current.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-brand-400" />}
                        <span>{copiedId === current.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>{current.summary}</span>
                    </h3>
                    <p className="text-xs text-slate-400 italic mt-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                      "{current.rawText}"
                    </p>
                  </div>

                  {/* Strategic Insights */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Executive Key Insights</span>
                    </span>
                    <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80 space-y-1 text-xs text-slate-200">
                      {current.keyInsights.map((insight, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-brand-400 font-bold">•</span>
                          <span>{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Steps */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Execution Steps</span>
                    </span>
                    <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80 space-y-1.5 text-xs text-slate-200">
                      {current.actionSteps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 1-Click Ecosystem Action Dispatcher */}
                  <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleSyncToGoogle(current)}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                          current.googleSynced
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }`}
                      >
                        <Database className="w-3.5 h-3.5 text-teal-400" />
                        <span>{current.googleSynced ? 'Synced to Sheets & BigQuery ✅' : 'Sync to Google Warehouse'}</span>
                      </button>

                      <button
                        onClick={() => handleExportToAntigravity(current)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 border border-brand-500/30 transition"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        <span>Export Antigravity SKILL.md</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl p-12 text-center text-slate-500 space-y-2">
              <Brain className="w-10 h-10 mx-auto text-slate-600 animate-pulse" />
              <p className="text-sm font-semibold">No thoughts captured yet</p>
              <p className="text-xs text-slate-600">Speak or write your ideas to see real-time AI synthesis here.</p>
            </div>
          )}

          {/* Filterable Thought Stream History */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-400" />
                <span>Thought Stream History ({filteredThoughts.length})</span>
              </span>

              {/* Category Pills */}
              <div className="flex items-center space-x-1">
                {(['All', 'Strategy', 'Engineering', 'Finance', 'Productivity', 'Personal'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-semibold transition ${
                      activeCategory === cat
                        ? 'bg-brand-500 text-slate-950'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {filteredThoughts.map(t => (
                <div
                  key={t.id}
                  onClick={() => setSelectedThought(t)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                    selectedThought?.id === t.id
                      ? 'bg-slate-900 border-brand-500/50 shadow-lg'
                      : 'bg-slate-950/60 hover:bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {t.category}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{t.createdAt}</span>
                      {t.googleSynced && <span className="text-[9px] text-emerald-400">● Synced</span>}
                    </div>
                    <p className="text-xs font-semibold text-slate-200 truncate">{t.summary}</p>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
