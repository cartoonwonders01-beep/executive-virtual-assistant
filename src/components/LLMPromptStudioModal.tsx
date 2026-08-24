import React, { useState, useEffect } from 'react';
import { useAssistant } from '../context/AssistantContext';
import { CustomLLMProfile, UserProfileContext } from '../types';
import { 
  DEFAULT_LLM_PROFILES, 
  getStoredLLMProfiles, 
  storeLLMProfiles, 
  getActiveLLMProfile, 
  storeActiveLLMProfileId,
  buildUnifiedSystemPrompt,
  LIVE_MODEL_OPTIONS
} from '../config';
import { processSpeechWithGemini } from '../services/geminiService';
import { logger } from '../services/loggerService';
import { 
  X, 
  Sparkles, 
  User, 
  Cpu, 
  Sliders, 
  Play, 
  Plus, 
  Copy, 
  Trash2, 
  RotateCcw, 
  Check, 
  Zap, 
  MessageSquare, 
  Brain, 
  Layers, 
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Send
} from 'lucide-react';

export const LLMPromptStudioModal: React.FC = () => {
  const { 
    isPromptStudioOpen, 
    setIsPromptStudioOpen, 
    geminiApiKey,
    groqApiKey
  } = useAssistant();

  const [profiles, setProfiles] = useState<CustomLLMProfile[]>(() => getStoredLLMProfiles());
  const [activeProfileId, setActiveProfileId] = useState<string>(() => getActiveLLMProfile().id);
  const [activeTab, setActiveTab] = useState<'user_context' | 'system_prompt' | 'model_tuning' | 'prompt_sandbox'>('user_context');
  
  // Working draft state for the selected profile
  const [currentProfile, setCurrentProfile] = useState<CustomLLMProfile>(() => getActiveLLMProfile());
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Sandbox Testing State
  const [sandboxInput, setSandboxInput] = useState('What are the top 3 second-order risks in our Q3 product roadmap?');
  const [sandboxOutput, setSandboxOutput] = useState('');
  const [isSandboxRunning, setIsSandboxRunning] = useState(false);

  // New Goal / Communication Rule Inputs
  const [newGoalInput, setNewGoalInput] = useState('');
  const [newRuleInput, setNewRuleInput] = useState('');

  // Synchronize when modal opens or profile changes
  useEffect(() => {
    if (isPromptStudioOpen) {
      const storedProfiles = getStoredLLMProfiles();
      setProfiles(storedProfiles);
      const active = storedProfiles.find(p => p.id === activeProfileId) || storedProfiles[0] || DEFAULT_LLM_PROFILES[0];
      setCurrentProfile(JSON.parse(JSON.stringify(active)));
    }
  }, [isPromptStudioOpen, activeProfileId]);

  if (!isPromptStudioOpen) return null;

  const handleSelectProfile = (id: string) => {
    setActiveProfileId(id);
    const target = profiles.find(p => p.id === id);
    if (target) {
      setCurrentProfile(JSON.parse(JSON.stringify(target)));
    }
  };

  const handleCreateNewProfile = () => {
    const newId = 'prof-custom-' + Date.now().toString(36);
    const newProfile: CustomLLMProfile = {
      id: newId,
      name: '✍️ Custom User Persona (' + (profiles.length + 1) + ')',
      description: 'Custom tailored AI prompt & personality configuration.',
      isDefault: false,
      systemPrompt: `You are Eve, an autonomous executive AI assistant tailored specifically for your user. Deliver thoughtful, razor-sharp, and context-aware intelligence.`,
      userContext: {
        userName: 'Andrew',
        userRole: 'Founder / Executive',
        organization: 'My Organization',
        strategicGoals: ['Maximize high-leverage output', 'Fast execution loops'],
        communicationRules: ['Direct and insightful', 'Zero corporate boilerplate'],
        personalNotes: ''
      },
      model: 'gemini-1.5-flash',
      temperature: 0.7,
      tone: 'executive_peer',
      responseVerbosity: 'balanced',
      customInstructions: 'Tailor all advice to the user profile and strategic goals.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [...profiles, newProfile];
    setProfiles(updated);
    storeLLMProfiles(updated);
    setActiveProfileId(newId);
    setCurrentProfile(newProfile);
    logger.log('info', 'ai_reasoning', `✨ Created new LLM persona profile: "${newProfile.name}"`);
  };

  const handleDuplicateProfile = () => {
    const dupId = 'prof-dup-' + Date.now().toString(36);
    const duplicated: CustomLLMProfile = {
      ...JSON.parse(JSON.stringify(currentProfile)),
      id: dupId,
      name: `${currentProfile.name} (Copy)`,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [...profiles, duplicated];
    setProfiles(updated);
    storeLLMProfiles(updated);
    setActiveProfileId(dupId);
    setCurrentProfile(duplicated);
  };

  const handleDeleteProfile = (idToDelete: string) => {
    if (profiles.length <= 1) return;
    const filtered = profiles.filter(p => p.id !== idToDelete);
    setProfiles(filtered);
    storeLLMProfiles(filtered);
    const nextActive = filtered[0];
    setActiveProfileId(nextActive.id);
    setCurrentProfile(JSON.parse(JSON.stringify(nextActive)));
    storeActiveLLMProfileId(nextActive.id);
  };

  const handleResetToDefault = () => {
    const defaultOne = DEFAULT_LLM_PROFILES[0];
    setCurrentProfile(JSON.parse(JSON.stringify(defaultOne)));
  };

  const handleSaveProfile = () => {
    const updatedProfiles = profiles.map(p => p.id === currentProfile.id ? { ...currentProfile, updatedAt: new Date().toISOString() } : p);
    setProfiles(updatedProfiles);
    storeLLMProfiles(updatedProfiles);
    storeActiveLLMProfileId(currentProfile.id);
    
    logger.log('success', 'ai_reasoning', `💾 Saved & applied LLM Prompt Studio profile: "${currentProfile.name}"`);
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
      setIsPromptStudioOpen(false);
    }, 900);
  };

  // Helper additions for Goals and Rules
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalInput.trim()) return;
    setCurrentProfile(prev => ({
      ...prev,
      userContext: {
        ...prev.userContext,
        strategicGoals: [...(prev.userContext.strategicGoals || []), newGoalInput.trim()]
      }
    }));
    setNewGoalInput('');
  };

  const handleRemoveGoal = (index: number) => {
    setCurrentProfile(prev => ({
      ...prev,
      userContext: {
        ...prev.userContext,
        strategicGoals: prev.userContext.strategicGoals.filter((_, i) => i !== index)
      }
    }));
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleInput.trim()) return;
    setCurrentProfile(prev => ({
      ...prev,
      userContext: {
        ...prev.userContext,
        communicationRules: [...(prev.userContext.communicationRules || []), newRuleInput.trim()]
      }
    }));
    setNewRuleInput('');
  };

  const handleRemoveRule = (index: number) => {
    setCurrentProfile(prev => ({
      ...prev,
      userContext: {
        ...prev.userContext,
        communicationRules: prev.userContext.communicationRules.filter((_, i) => i !== index)
      }
    }));
  };

  // Run Sandbox prompt test
  const handleRunSandboxTest = async () => {
    if (!sandboxInput.trim()) return;
    setIsSandboxRunning(true);
    setSandboxOutput('');

    try {
      if (geminiApiKey) {
        const result = await processSpeechWithGemini(
          sandboxInput,
          geminiApiKey,
          currentProfile.model.includes('pro') ? 'gemini-1.5-pro' : 'gemini-1.5-flash',
          currentProfile
        );
        if (result?.actionCard) {
          setSandboxOutput(result.actionCard.description || result.actionCard.spokenResponse);
        } else {
          setSandboxOutput('⚠️ No response returned from Gemini. Verify API key in Settings.');
        }
      } else {
        // Instant simulated preview
        const unified = buildUnifiedSystemPrompt(currentProfile);
        setSandboxOutput(`[Instant Studio Simulation Mode]\n\nUnder profile "${currentProfile.name}" (${currentProfile.tone}):\n\nPrompt Context Applied:\n${unified.substring(0, 300)}...\n\nSimulated Answer:\nBased on ${currentProfile.userContext.userName || 'Andrew'}'s strategic priorities (${currentProfile.userContext.strategicGoals?.[0] || 'High leverage'}), here is the direct executive assessment:\n1. Execution drag from legacy dependencies.\n2. Premature scaling before unit economics converge.\n3. Friction in autonomous delegation pipelines.`);
      }
    } catch (err: any) {
      setSandboxOutput(`Error evaluating prompt: ${err?.message || err}`);
    } finally {
      setIsSandboxRunning(false);
    }
  };

  const unifiedPromptLength = buildUnifiedSystemPrompt(currentProfile).length;
  const approxTokens = Math.round(unifiedPromptLength / 4);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-200 animate-fadeIn">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-teal-500 text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">LLM Prompt Studio & Persona Customizer</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30">
                  {approxTokens} tokens (~{unifiedPromptLength} chars)
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Customize system instructions, user context, and reasoning behavior for each user.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsPromptStudioOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Selector & Quick Actions */}
        <div className="px-5 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-1">
            <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">Active Persona:</span>
            {profiles.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectProfile(p.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                  p.id === currentProfile.id
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/60 shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCreateNewProfile}
              className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 flex items-center gap-1 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
            <button
              type="button"
              onClick={handleDuplicateProfile}
              className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 transition cursor-pointer"
              title="Duplicate Profile"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Copy</span>
            </button>
            {profiles.length > 1 && (
              <button
                type="button"
                onClick={() => handleDeleteProfile(currentProfile.id)}
                className="p-1 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                title="Delete Profile"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-800 px-5 bg-slate-900/60 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('user_context')}
            className={`py-2.5 px-4 font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'user_context'
                ? 'border-teal-400 text-teal-300 bg-teal-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>1. User Profile & Context</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('system_prompt')}
            className={`py-2.5 px-4 font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'system_prompt'
                ? 'border-teal-400 text-teal-300 bg-teal-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>2. System Persona & Prompt</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('model_tuning')}
            className={`py-2.5 px-4 font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'model_tuning'
                ? 'border-teal-400 text-teal-300 bg-teal-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>3. LLM Model & Parameters</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('prompt_sandbox')}
            className={`py-2.5 px-4 font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'prompt_sandbox'
                ? 'border-purple-400 text-purple-300 bg-purple-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>4. Live Sandbox Test</span>
          </button>
        </div>

        {/* Studio Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs custom-scrollbar">
          
          {/* TAB 1: User Profile & Context */}
          {activeTab === 'user_context' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-teal-400" />
                  <span>Who is the AI Assisting? (User Identity)</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Provide background details about you so Eve tailors all reasoning and recommendations to your exact context.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold text-[11px] block mb-1">User Name</label>
                    <input
                      type="text"
                      value={currentProfile.userContext.userName}
                      onChange={(e) => setCurrentProfile(prev => ({
                        ...prev,
                        userContext: { ...prev.userContext, userName: e.target.value }
                      }))}
                      placeholder="e.g. Andrew"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:border-teal-500 focus:outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold text-[11px] block mb-1">Role / Job Title</label>
                    <input
                      type="text"
                      value={currentProfile.userContext.userRole}
                      onChange={(e) => setCurrentProfile(prev => ({
                        ...prev,
                        userContext: { ...prev.userContext, userRole: e.target.value }
                      }))}
                      placeholder="e.g. Founder & Executive Director"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:border-teal-500 focus:outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold text-[11px] block mb-1">Organization / Domain</label>
                    <input
                      type="text"
                      value={currentProfile.userContext.organization}
                      onChange={(e) => setCurrentProfile(prev => ({
                        ...prev,
                        userContext: { ...prev.userContext, organization: e.target.value }
                      }))}
                      placeholder="e.g. Apex Enterprise"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:border-teal-500 focus:outline-none text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold text-[11px] block mb-1">Personal Context & Preferences</label>
                  <input
                    type="text"
                    value={currentProfile.userContext.personalNotes || ''}
                    onChange={(e) => setCurrentProfile(prev => ({
                      ...prev,
                      userContext: { ...prev.userContext, personalNotes: e.target.value }
                    }))}
                    placeholder="e.g. Wife is Emily, loves espresso, focus on family time on weekends, based in Zurich"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:border-teal-500 focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* Strategic Goals List */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Strategic Goals & Priorities</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Eve uses these strategic anchors to evaluate trade-offs and prioritize high-leverage tasks.
                </p>

                <div className="space-y-1.5">
                  {currentProfile.userContext.strategicGoals.map((goal, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                      <span className="text-slate-200">🎯 {goal}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveGoal(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddGoal} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newGoalInput}
                    onChange={(e) => setNewGoalInput(e.target.value)}
                    placeholder="Add new strategic priority (e.g. Scale ARR with AI Swarm)..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none text-xs"
                  />
                  <button
                    type="submit"
                    disabled={!newGoalInput.trim()}
                    className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition cursor-pointer disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Goal</span>
                  </button>
                </form>
              </div>

              {/* Communication Rules */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                  <span>Communication Rules & Pushback Guidelines</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Rules for how Eve interacts (e.g., direct, no canned apologies, challenge flawed logic).
                </p>

                <div className="space-y-1.5">
                  {currentProfile.userContext.communicationRules.map((rule, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                      <span className="text-slate-200">💬 {rule}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRule(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddRule} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newRuleInput}
                    onChange={(e) => setNewRuleInput(e.target.value)}
                    placeholder="Add communication constraint (e.g. Highlight second-order risks)..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-purple-500 focus:outline-none text-xs"
                  />
                  <button
                    type="submit"
                    disabled={!newRuleInput.trim()}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Rule</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: System Persona & Prompt */}
          {activeTab === 'system_prompt' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Brain className="w-4 h-4 text-teal-400" />
                    <span>System Persona Instructions (Core LLM Prompt)</span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className="text-[11px] text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Default Prompt</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  This core system prompt defines the cognitive identity, intellect, depth, and world-view of Eve.
                </p>

                <textarea
                  rows={8}
                  value={currentProfile.systemPrompt}
                  onChange={(e) => setCurrentProfile(prev => ({ ...prev, systemPrompt: e.target.value }))}
                  placeholder="You are Eve..."
                  className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl p-3 text-slate-100 placeholder-slate-600 focus:outline-none font-mono text-xs leading-relaxed custom-scrollbar"
                />
              </div>

              {/* Custom Specific Instructions */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>Specific Behavioral Directives & Edge Cases</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Additional rules for sensitive topics, task categorization, or custom skill routines.
                </p>
                <textarea
                  rows={3}
                  value={currentProfile.customInstructions || ''}
                  onChange={(e) => setCurrentProfile(prev => ({ ...prev, customInstructions: e.target.value }))}
                  placeholder="e.g. When asked for code, output complete runnable TypeScript or Python files..."
                  className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl p-3 text-slate-100 placeholder-slate-600 focus:outline-none text-xs leading-relaxed custom-scrollbar"
                />
              </div>
            </div>
          )}

          {/* TAB 3: LLM Model & Parameters */}
          {activeTab === 'model_tuning' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-teal-400" />
                  <span>LLM Reasoning Model & Hyperparameters</span>
                </h3>

                {/* Model Selection */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold text-[11px]">Reasoning Brain Model</label>
                  <select
                    value={currentProfile.model}
                    onChange={(e) => setCurrentProfile(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 text-xs focus:border-teal-500 focus:outline-none cursor-pointer"
                  >
                    {LIVE_MODEL_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Temperature / Creativity Slider */}
                <div className="space-y-2 pt-2 border-t border-slate-900">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">Creativity / Temperature</span>
                    <span className="font-mono text-teal-300 font-bold">{currentProfile.temperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={currentProfile.temperature}
                    onChange={(e) => setCurrentProfile(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    className="w-full accent-teal-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>0.0 (Deterministic / Analytical)</span>
                    <span>0.7 (Executive Balance)</span>
                    <span>1.0 (Creative & Bold)</span>
                  </div>
                </div>

                {/* Tone Preset */}
                <div className="space-y-1.5 pt-2 border-t border-slate-900">
                  <label className="text-slate-300 font-semibold text-[11px]">Reasoning Tone</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'executive_peer', label: '🧠 Executive Peer' },
                      { id: 'thought_partner', label: '💡 Co-Founder' },
                      { id: 'direct_operator', label: '⚡ Direct Operator' },
                      { id: 'technical_architect', label: '🛠️ Tech Architect' },
                      { id: 'socratic_mentor', label: '🎯 Socratic Mentor' },
                      { id: 'custom', label: '✍️ Custom' }
                    ].map(toneItem => (
                      <div
                        key={toneItem.id}
                        onClick={() => setCurrentProfile(prev => ({ ...prev, tone: toneItem.id as any }))}
                        className={`p-2 rounded-xl border text-center cursor-pointer transition ${
                          currentProfile.tone === toneItem.id
                            ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-bold shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {toneItem.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Verbosity Level */}
                <div className="space-y-1.5 pt-2 border-t border-slate-900">
                  <label className="text-slate-300 font-semibold text-[11px]">Response Verbosity</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'ultra_concise', label: '⚡ Ultra-Concise (1-3 sentences)' },
                      { id: 'balanced', label: '⚖️ Balanced Executive (Default)' },
                      { id: 'comprehensive', label: '📚 Comprehensive Deep Dive' }
                    ].map(verb => (
                      <div
                        key={verb.id}
                        onClick={() => setCurrentProfile(prev => ({ ...prev, responseVerbosity: verb.id as any }))}
                        className={`p-2 rounded-xl border text-center cursor-pointer transition ${
                          currentProfile.responseVerbosity === verb.id
                            ? 'bg-purple-500/20 border-purple-500 text-purple-300 font-bold shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {verb.label}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: Live Sandbox Test */}
          {activeTab === 'prompt_sandbox' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-950 p-4 rounded-2xl border border-purple-500/30 space-y-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span>Interactive Live Prompt Testing Sandbox</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Test how your customized persona and user profile context respond to realistic questions.
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sandboxInput}
                    onChange={(e) => setSandboxInput(e.target.value)}
                    placeholder="Enter test prompt (e.g. How should we prioritize Q3 roadmap?)..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:border-purple-500 focus:outline-none text-xs font-sans"
                  />
                  <button
                    type="button"
                    onClick={handleRunSandboxTest}
                    disabled={isSandboxRunning || !sandboxInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
                  >
                    <Play className={`w-3.5 h-3.5 ${isSandboxRunning ? 'animate-spin' : ''}`} />
                    <span>{isSandboxRunning ? 'Evaluating...' : 'Run Test'}</span>
                  </button>
                </div>

                {/* Response Output Box */}
                {sandboxOutput && (
                  <div className="mt-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-purple-400 font-mono">
                      <span>Reasoning Output ({currentProfile.name}):</span>
                      <span>Model: {currentProfile.model}</span>
                    </div>
                    <div className="text-slate-200 text-xs leading-relaxed whitespace-pre-wrap">
                      {sandboxOutput}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <span className="font-mono">{currentProfile.name}</span>
            <span>•</span>
            <span>{currentProfile.model}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPromptStudioOpen(false)}
              className="px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveProfile}
              className="px-4 py-1.5 rounded-xl font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 transition flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
            >
              {savedFeedback ? (
                <>
                  <Check className="w-3.5 h-3.5 text-slate-950" />
                  <span>Applied Live!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                  <span>Save & Apply Persona</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
