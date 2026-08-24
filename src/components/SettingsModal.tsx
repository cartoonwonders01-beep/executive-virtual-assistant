import React, { useState, useEffect } from 'react';
import { useAssistant } from '../context/AssistantContext';
import { 
  setVoicePersona, 
  getVoicePersona, 
  setVoiceRate, 
  getVoiceRate, 
  setVoicePitch, 
  getVoicePitch, 
  speakResponse, 
  stopSpeaking,
  VoicePersona,
  resolveBestVoice,
  setPreferredLanguage,
  getPreferredLanguage,
  SupportedLanguage
} from '../services/speechSynthesis';
import { wakeWordService } from '../services/wakeWordService';
import { selfLearningEngine, LearnedInsight } from '../services/selfLearningEngine';
import {
  APP_VERSION,
  CHUNK_INTERVAL_OPTIONS,
  AUDIO_BITRATE_OPTIONS,
  MIME_TYPE_OPTIONS,
  SILENCE_DURATION_OPTIONS,
  CONTINUOUS_TIMEOUT_OPTIONS,
  LIVE_MODEL_OPTIONS,
  LANGUAGE_OPTIONS,
  PAYLOAD_FORMAT_OPTIONS,
  PERSONA_PRESETS,
  getStoredChunkIntervalMs,
  storeChunkIntervalMs,
  getStoredAudioBitrateKbps,
  storeAudioBitrateKbps,
  getStoredMimeType,
  storeMimeType,
  getStoredSilenceDurationMs,
  storeSilenceDurationMs,
  getStoredContinuousTimeoutSeconds,
  storeContinuousTimeoutSeconds,
  getStoredPersonaStyle,
  storePersonaStyle,
  getStoredPersonaPrompt,
  storePersonaPrompt,
  getStoredLanguage,
  storeLanguage,
  getStoredPurgeAudio,
  storePurgeAudio,
  getStoredDebugMode,
  storeDebugMode,
  getStoredLiveModel,
  storeLiveModel,
  getStoredPayloadFormat,
  storePayloadFormat
} from '../config';
import { 
  Settings, 
  X, 
  Key, 
  Check, 
  Sparkles, 
  Volume2, 
  Play, 
  Cloud, 
  Cpu, 
  RefreshCw,
  Zap,
  Layers,
  Radio,
  Sliders,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  FileText,
  Globe,
  Brain,
  Trash2,
  Plus
} from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const { 
    isSettingsOpen, 
    setIsSettingsOpen, 
    groqApiKey, 
    setGroqApiKey,
    geminiApiKey,
    setGeminiApiKey,
    googleAppsScriptUrl,
    setGoogleAppsScriptUrl,
    aiBrainProvider,
    setAiBrainProvider,
    syncAllToGoogleDataWarehouse,
    continuousTimeoutSeconds,
    setContinuousTimeoutSeconds,
    personaStyle,
    setPersonaStyle,
    personaPrompt,
    setPersonaPrompt
  } = useAssistant();

  const [groqKeyInput, setGroqKeyInput] = useState(groqApiKey);
  const [geminiKeyInput, setGeminiKeyInput] = useState(geminiApiKey);
  const [gasUrlInput, setGasUrlInput] = useState(googleAppsScriptUrl);
  const [brain, setBrain] = useState(aiBrainProvider);
  
  const [saved, setSaved] = useState(false);
  const [isPlayingSample, setIsPlayingSample] = useState(false);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Relay Configuration State
  const [chunkIntervalMs, setChunkIntervalMs] = useState<number>(() => getStoredChunkIntervalMs());
  const [audioBitrateKbps, setAudioBitrateKbps] = useState<number>(() => getStoredAudioBitrateKbps());
  const [mimeType, setMimeType] = useState<string>(() => getStoredMimeType());
  const [silenceDurationMs, setSilenceDurationMs] = useState<number>(() => getStoredSilenceDurationMs());
  const [continuousTimeoutInput, setContinuousTimeoutInput] = useState<number>(() => getStoredContinuousTimeoutSeconds());
  const [purgeAudio, setPurgeAudio] = useState<boolean>(() => getStoredPurgeAudio());
  const [debugMode, setDebugMode] = useState<boolean>(() => getStoredDebugMode());
  const [liveModel, setLiveModel] = useState<string>(() => getStoredLiveModel());
  const [payloadFormat, setPayloadFormat] = useState<string>(() => getStoredPayloadFormat());
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Persona & Custom Prompt State
  const [selectedPersonaStyle, setSelectedPersonaStyle] = useState<string>(() => getStoredPersonaStyle());
  const [customPersonaPromptInput, setCustomPersonaPromptInput] = useState<string>(() => getStoredPersonaPrompt());

  // Voice Persona State
  const [persona, setPersona] = useState<VoicePersona>(getVoicePersona());
  const [rate, setRate] = useState<number>(getVoiceRate());
  const [pitch, setPitch] = useState<number>(getVoicePitch());
  const [detectedVoiceName, setDetectedVoiceName] = useState<string>('');
  const [selectedWakeWord, setSelectedWakeWord] = useState<string>('hey eve');
  const [language, setLanguage] = useState<string>(() => getStoredLanguage());
  
  // Continuous Memories State
  const [insights, setInsights] = useState<LearnedInsight[]>(() => selfLearningEngine.getInsights());
  const [newTopic, setNewTopic] = useState('');
  const [newFact, setNewFact] = useState('');

  // Hydrate settings
  useEffect(() => {
    if (isSettingsOpen) {
      setGroqKeyInput(groqApiKey);
      setGeminiKeyInput(geminiApiKey);
      setGasUrlInput(googleAppsScriptUrl);
      setBrain(aiBrainProvider);
      setLanguage(getStoredLanguage());
      setChunkIntervalMs(getStoredChunkIntervalMs());
      setAudioBitrateKbps(getStoredAudioBitrateKbps());
      setMimeType(getStoredMimeType());
      setSilenceDurationMs(getStoredSilenceDurationMs());
      setContinuousTimeoutInput(getStoredContinuousTimeoutSeconds());
      setPurgeAudio(getStoredPurgeAudio());
      setDebugMode(getStoredDebugMode());
      setLiveModel(getStoredLiveModel());
      setPayloadFormat(getStoredPayloadFormat());
      setSelectedPersonaStyle(getStoredPersonaStyle());
      setCustomPersonaPromptInput(getStoredPersonaPrompt());
      setInsights(selfLearningEngine.getInsights());
      const voice = resolveBestVoice(getVoicePersona());
      if (voice) setDetectedVoiceName(voice.name);
      try {
        const stored = localStorage.getItem('assistant_primary_wake_word') || 'hey eve';
        setSelectedWakeWord(stored);
      } catch {}
    }
  }, [isSettingsOpen, groqApiKey, geminiApiKey, googleAppsScriptUrl, aiBrainProvider]);

  if (!isSettingsOpen) return null;

  const handlePersonaChange = (newPersona: VoicePersona) => {
    setPersona(newPersona);
    setVoicePersona(newPersona);
    const resolved = resolveBestVoice(newPersona);
    if (resolved) setDetectedVoiceName(resolved.name);
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    storeLanguage(newLang);
    setPreferredLanguage(newLang as any);
  };

  const handlePersonaStyleSelect = (styleKey: string) => {
    setSelectedPersonaStyle(styleKey);
    const preset = PERSONA_PRESETS[styleKey];
    if (preset && preset.prompt) {
      setCustomPersonaPromptInput(preset.prompt);
    }
  };

  const handleResetPersonaPrompt = () => {
    const preset = PERSONA_PRESETS[selectedPersonaStyle] || PERSONA_PRESETS.executive_peer;
    setCustomPersonaPromptInput(preset.prompt);
  };

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim()) return;
    const topic = newTopic.trim() || 'User Preference';
    selfLearningEngine.learnInsight(topic, newFact.trim(), 'user_explicit_memory');
    setInsights(selfLearningEngine.getInsights());
    setNewTopic('');
    setNewFact('');
  };

  const handleDeleteMemory = (id: string) => {
    selfLearningEngine.deleteInsight(id);
    setInsights(selfLearningEngine.getInsights());
  };

  const handleRateChange = (newRate: number) => {
    setRate(newRate);
    setVoiceRate(newRate);
  };

  const handlePitchChange = (newPitch: number) => {
    setPitch(newPitch);
    setVoicePitch(newPitch);
  };

  const playVoiceSample = () => {
    setIsPlayingSample(true);
    speakResponse(
      "Hello Andrew! I am your Executive AI Assistant. How can I help you achieve maximum leverage and win back your time today?",
      () => setIsPlayingSample(false),
      persona
    );
  };

  const handleManualGoogleSync = async () => {
    setIsSyncingGoogle(true);
    const success = await syncAllToGoogleDataWarehouse();
    setIsSyncingGoogle(false);
    if (success) {
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 2500);
    }
  };

  const handleSave = () => {
    setGroqApiKey(groqKeyInput.trim());
    setGeminiApiKey(geminiKeyInput.trim());
    setGoogleAppsScriptUrl(gasUrlInput.trim());
    setAiBrainProvider(brain);
    setVoicePersona(persona);
    setVoiceRate(rate);
    setVoicePitch(pitch);
    
    // Store Persona Framing Settings
    setPersonaStyle(selectedPersonaStyle);
    setPersonaPrompt(customPersonaPromptInput.trim());

    // Store Continuous Listening Timeout
    setContinuousTimeoutSeconds(continuousTimeoutInput);
    
    // Store Relay Tuning Settings
    storeChunkIntervalMs(chunkIntervalMs);
    storeAudioBitrateKbps(audioBitrateKbps);
    storeMimeType(mimeType);
    storeSilenceDurationMs(silenceDurationMs);
    storePurgeAudio(purgeAudio);
    storeDebugMode(debugMode);
    storeLiveModel(liveModel);
    storePayloadFormat(payloadFormat);
    storeLanguage(language);
    setPreferredLanguage(language as any);

    const cleanWake = selectedWakeWord.trim().toLowerCase() || 'hey eve';
    wakeWordService.setPrimaryWakeWord(cleanWake);
    try {
      localStorage.setItem('assistant_primary_wake_word', cleanWake);
    } catch {}
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setIsSettingsOpen(false);
    }, 1000);
  };

  const wakeWordPresets = [
    { id: 'hey eve', label: '🌟 Hey Eve', desc: 'Short, sweet & executive (Recommended)' },
    { id: 'hey eva', label: '⚡ Hey Eva', desc: 'Fast, crisp & futuristic' },
    { id: 'hey andy', label: '👤 Hey Andy', desc: 'Direct personal executive name' },
    { id: 'hey aria', label: '🎙️ Hey Aria', desc: 'Natural & articulate' },
    { id: 'hey assistant', label: '🤖 Hey Assistant', desc: 'Universal assistant trigger' },
  ];

  const voicePersonas = [
    { id: 'studio_american_female' as VoicePersona, title: 'Studio American Female', desc: 'Aria/Jenny (Natural & Studio-Grade)' },
    { id: 'executive_british_male' as VoicePersona, title: 'Executive British Male', desc: 'Daniel/Ryan (Refined & Authoritative)' },
    { id: 'crisp_american_male' as VoicePersona, title: 'Crisp American Male', desc: 'Guy/Christopher (Dynamic & Clear)' },
    { id: 'warm_australian' as VoicePersona, title: 'Warm Australian', desc: 'Natasha/Karen (Approachable & Warm)' },
    { id: 'german_natural' as VoicePersona, title: 'Deutsch (German Natural)', desc: 'Katja/Marlene/Conrad' },
    { id: 'french_natural' as VoicePersona, title: 'Français (French Natural)', desc: 'Denise/Henri/Amelie' },
    { id: 'spanish_natural' as VoicePersona, title: 'Español (Spanish Natural)', desc: 'Elvira/Alvaro/Monica' },
    { id: 'italian_natural' as VoicePersona, title: 'Italiano (Italian Natural)', desc: 'Elsa/Diego/Alice' },
    { id: 'dutch_natural' as VoicePersona, title: 'Nederlands (Dutch Natural)', desc: 'Colette/Maarten/Fenna' },
    { id: 'polish_natural' as VoicePersona, title: 'Polski (Polish Natural)', desc: 'Zofia/Jan/Maja' },
    { id: 'portuguese_natural' as VoicePersona, title: 'Português (Portuguese Natural)', desc: 'Raquel/Duarte' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-5 animate-fadeIn text-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-brand-500/20 text-brand-300 rounded-lg">
              <Settings className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white">Hybrid AI Architecture & Settings</h2>
          </div>
          <button
            onClick={() => {
              stopSpeaking();
              setIsSettingsOpen(false);
            }}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
          
          {/* Hybrid Architecture Badge */}
          <div className="bg-gradient-to-r from-brand-950/60 to-indigo-950/60 border border-brand-500/30 p-3.5 rounded-2xl space-y-2">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-brand-400" />
              <span className="font-semibold text-brand-300 text-xs">Hybrid Best-of-Breed Pipeline Active</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              <strong className="text-brand-300 font-semibold">1. Groq Whisper</strong> transcribes your voice with ultra-low latency (&lt;250ms) and maximum phonetic accuracy.
              <br />
              <strong className="text-amber-300 font-semibold">2. Google Gemini AI Ultra</strong> receives the text to execute all deep reasoning, email/calendar drafting, task classification, and blueprint synthesis.
            </p>
          </div>

          {/* Persona & Interaction Framing (Skills-Like Custom Instructions) */}
          <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-teal-500/40 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-slate-200 font-semibold flex items-center gap-1.5 text-xs">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span>Conversational Persona & Framing</span>
              </label>
              <span className="text-[10px] font-mono text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20 font-bold">
                {PERSONA_PRESETS[selectedPersonaStyle]?.label.split(' ')[0]} {selectedPersonaStyle.replace('_', ' ')}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Define how Eve reasons, converses, and interacts with you. Switch presets or write custom behavioral instructions (like skills).
            </p>

            {/* Persona Preset Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {Object.entries(PERSONA_PRESETS).map(([key, item]) => (
                <div
                  key={key}
                  onClick={() => handlePersonaStyleSelect(key)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition ${
                    selectedPersonaStyle === key
                      ? 'bg-teal-500/15 border-teal-500 text-teal-200 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="font-semibold text-slate-200 text-xs">{item.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Editable Custom System Prompt */}
            <div className="space-y-1.5 pt-2 border-t border-slate-900">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300">Custom Interaction Prompt:</span>
                <button
                  type="button"
                  onClick={handleResetPersonaPrompt}
                  className="text-[10px] text-teal-400 hover:underline cursor-pointer"
                >
                  Reset to Preset Default ↺
                </button>
              </div>
              <textarea
                rows={4}
                value={customPersonaPromptInput}
                onChange={(e) => {
                  setCustomPersonaPromptInput(e.target.value);
                  if (selectedPersonaStyle !== 'custom') {
                    setSelectedPersonaStyle('custom');
                  }
                }}
                placeholder="Write detailed instructions for how Eve should frame responses and interact with you..."
                className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl p-2.5 text-slate-100 placeholder-slate-600 focus:outline-none font-sans text-xs leading-relaxed custom-scrollbar"
              />
              <p className="text-[10px] text-slate-500">
                {customPersonaPromptInput.length} characters • Applied directly to live reasoning core.
              </p>
            </div>
          </div>

          {/* Continuous Listening Session Inactivity Timeout */}
          <div className="space-y-2 bg-slate-950 p-3.5 rounded-2xl border border-teal-500/30">
            <div className="flex items-center justify-between">
              <label className="text-slate-200 font-semibold flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-teal-400" />
                <span>Continuous Listening Inactivity Timeout</span>
              </label>
              <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20 font-bold">
                {continuousTimeoutInput === 0 ? '♾️ Manual Only' : `${continuousTimeoutInput}s`}
              </span>
            </div>
            <select
              value={continuousTimeoutInput}
              onChange={(e) => setContinuousTimeoutInput(parseInt(e.target.value, 10))}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 text-xs focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              {CONTINUOUS_TIMEOUT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400">
              Eve stays listening across multiple conversation turns until turned off or until this inactivity timeout expires (default: 60s).
            </p>
          </div>

          {/* AI Brain Selection */}
          <div className="space-y-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <label className="text-slate-200 font-semibold flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-brand-400" />
              <span>Executive Reasoning Engine ("The Brain")</span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <div 
                onClick={() => setBrain('gemini_ultra')}
                className={`p-2.5 rounded-xl border cursor-pointer transition ${
                  brain === 'gemini_ultra'
                    ? 'bg-brand-500/10 border-brand-500 text-brand-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-200 text-xs">Google Gemini AI Ultra</p>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Gemini 1.5 Pro / Flash (Deep Reasoning)</p>
              </div>

              <div 
                onClick={() => setBrain('groq')}
                className={`p-2.5 rounded-xl border cursor-pointer transition ${
                  brain === 'groq'
                    ? 'bg-brand-500/10 border-brand-500 text-brand-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-200 text-xs">Local & Groq Engine</p>
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Local Server Intent Classifier</p>
              </div>
            </div>
          </div>

          {/* European Language Preference */}
          <div className="space-y-2 bg-slate-950 p-3.5 rounded-2xl border border-teal-500/30">
            <div className="flex items-center justify-between">
              <label className="text-slate-200 font-semibold flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-teal-400" />
                <span>Conversational Language (European Multilingual)</span>
              </label>
              <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20 font-bold">
                {LANGUAGE_OPTIONS.find(l => l.value === language)?.label.split(' ')[0] || '🌐 Auto'}
              </span>
            </div>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 text-xs focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400">
              Eve understands and speaks in English, German (Deutsch), French (Français), Spanish (Español), Italian (Italiano), Dutch (Nederlands), Polish (Polski), and Portuguese (Português).
            </p>
          </div>

          {/* Continuous Memory & Self-Learned Insights */}
          <div className="space-y-2 bg-slate-950 p-3.5 rounded-2xl border border-purple-500/30">
            <div className="flex items-center justify-between">
              <label className="text-slate-200 font-semibold flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-purple-400" />
                <span>Continuous Memory & Learned Insights ({insights.length})</span>
              </label>
            </div>
            <p className="text-[10px] text-slate-400">
              Eve retains memories, preferences, and feedback across conversations. Say "Eve, remember that..." to teach new facts.
            </p>

            {/* Existing Memories List */}
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
              {insights.map((ins) => (
                <div key={ins.id} className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-slate-200">{ins.topic}</p>
                    <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{ins.insight}</p>
                    <span className="inline-block text-[9px] font-mono text-purple-300 mt-1 px-1.5 py-0.2 rounded bg-purple-950/60 border border-purple-800/60">
                      {ins.source.replace(/_/g, ' ')} • {Math.round(ins.confidenceScore * 100)}% confidence
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteMemory(ins.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition cursor-pointer"
                    title="Delete Memory"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Memory Form */}
            <form onSubmit={handleAddMemory} className="pt-2 border-t border-slate-900 flex flex-col sm:flex-row gap-1.5">
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="Topic (e.g. Diet)"
                className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 text-xs sm:w-1/3"
              />
              <input
                type="text"
                value={newFact}
                onChange={(e) => setNewFact(e.target.value)}
                placeholder="Fact (e.g. Andrew prefers espresso)"
                className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 text-xs flex-1"
              />
              <button
                type="submit"
                disabled={!newFact.trim()}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center space-x-1 transition cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </form>
          </div>

          {/* Groq Whisper API Key */}
          <div className="space-y-1.5 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <label className="text-slate-300 font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-brand-400" />
                <span>1. Groq API Key (Voice-to-Text Transcription)</span>
              </span>
              <a 
                href="https://console.groq.com/keys" 
                target="_blank" 
                rel="noreferrer" 
                className="text-[10px] text-brand-400 hover:underline"
              >
                Get Free Groq Key ↗
              </a>
            </label>
            <input
              type="password"
              value={groqKeyInput}
              onChange={(e) => setGroqKeyInput(e.target.value)}
              placeholder="gsk_..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 font-mono text-[11px]"
            />
            <p className="text-[10px] text-slate-400">
              Powers instant Whisper Large v3 Turbo audio transcription (&lt; 250ms).
            </p>
          </div>

          {/* Google Gemini API Key */}
          <div className="space-y-1.5 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <label className="text-slate-300 font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>2. Google Gemini API Key (Executive Reasoning Brain)</span>
              </span>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer" 
                className="text-[10px] text-amber-400 hover:underline"
              >
                Get Free Gemini Key ↗
              </a>
            </label>
            <input
              type="password"
              value={geminiKeyInput}
              onChange={(e) => setGeminiKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono text-[11px]"
            />
            <p className="text-[10px] text-slate-400">
              Powers intent parsing, blueprint code synthesis, and Monday.com task extraction.
            </p>
          </div>

          {/* Google Apps Script & Looker Studio Cloud Sync */}
          <div className="space-y-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-slate-200 font-semibold flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-brand-400" />
                <span>Google Apps Script Cloud Dispatcher</span>
              </label>
              {gasUrlInput ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  Connected
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400">
                  Not Configured
                </span>
              )}
            </div>

            <input
              type="text"
              value={gasUrlInput}
              onChange={(e) => setGasUrlInput(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 font-mono text-[11px]"
            />
            <p className="text-[10px] text-slate-400">
              Synchronizes voice actions to Google Calendar, Gmail, BigQuery & Looker Studio automatically.
            </p>

            {gasUrlInput && (
              <button
                type="button"
                onClick={handleManualGoogleSync}
                disabled={isSyncingGoogle}
                className="w-full mt-1.5 flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-brand-300 border border-slate-800 transition text-xs font-semibold cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGoogle ? 'animate-spin' : ''}`} />
                <span>{syncSuccess ? 'Synced to BigQuery & Sheets! ✅' : isSyncingGoogle ? 'Syncing...' : '1-Click Sync Work Hub to Google'}</span>
              </button>
            )}
          </div>

          {/* Wake-Word Keyword Trigger Selection */}
          <div className="space-y-2 bg-slate-950 p-3.5 rounded-2xl border border-teal-500/40 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-slate-200 font-semibold flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-teal-400" />
                <span>Voice Activation Wake Word ("Hey ...")</span>
              </label>
              <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20 font-bold">
                "{selectedWakeWord}"
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Select your hands-free voice trigger phrase. The assistant passively listens and activates with a double-chime.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {wakeWordPresets.map((ww) => (
                <div
                  key={ww.id}
                  onClick={() => setSelectedWakeWord(ww.id)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition ${
                    selectedWakeWord === ww.id
                      ? 'bg-teal-500/10 border-teal-500 text-teal-300 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="font-semibold text-slate-200 text-xs">{ww.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{ww.desc}</p>
                </div>
              ))}
            </div>

            {/* Custom Wake Word Input */}
            <div className="pt-2 border-t border-slate-900 flex items-center space-x-2">
              <span className="text-[11px] text-slate-400 whitespace-nowrap">Custom Trigger:</span>
              <input
                type="text"
                value={selectedWakeWord}
                onChange={(e) => setSelectedWakeWord(e.target.value)}
                placeholder="e.g. hey nova"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 font-mono text-xs"
              />
            </div>
          </div>

          {/* Human Voice Persona Selection */}
          <div className="space-y-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-slate-200 font-semibold flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-brand-400" />
                <span>Spoken Voice Persona</span>
              </label>
              
              <button
                type="button"
                onClick={playVoiceSample}
                disabled={isPlayingSample}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 border border-brand-500/30 transition text-[11px] font-semibold cursor-pointer"
              >
                <Play className={`w-3 h-3 ${isPlayingSample ? 'animate-spin' : ''}`} />
                <span>{isPlayingSample ? 'Speaking...' : 'Test Voice'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {voicePersonas.map((vp) => (
                <div
                  key={vp.id}
                  onClick={() => handlePersonaChange(vp.id)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition ${
                    persona === vp.id
                      ? 'bg-brand-500/10 border-brand-500 text-brand-300 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="font-semibold text-slate-200 text-xs">{vp.title}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{vp.desc}</p>
                </div>
              ))}
            </div>

            {/* Speed & Pitch Adjusters */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-900">
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>Rate:</span>
                  <span className="font-mono text-brand-300">{rate}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.3"
                  step="0.05"
                  value={rate}
                  onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                  className="w-full accent-brand-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>Pitch:</span>
                  <span className="font-mono text-brand-300">{pitch}</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.2"
                  step="0.05"
                  value={pitch}
                  onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
                  className="w-full accent-brand-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Relay Engine Audio Slicing & Pipeline Tuning */}
          <div className="border border-purple-900/60 rounded-2xl overflow-hidden bg-slate-950">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-900/60 transition cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                <span className="font-semibold text-purple-300 text-xs">Relay Audio Slicing & Engine Tuning</span>
              </div>
              {showAdvanced ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showAdvanced && (
              <div className="p-3.5 pt-0 space-y-3.5 border-t border-slate-900">
                {/* Slicing Chunk Interval */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold text-[11px]">Audio Slice Interval (ms)</label>
                  <select
                    value={chunkIntervalMs}
                    onChange={(e) => setChunkIntervalMs(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-200 text-xs focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    {CHUNK_INTERVAL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500">Slices live audio into small rolling packets sent to Groq Whisper.</p>
                </div>

                {/* Audio Bitrate */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold text-[11px]">Audio Bitrate (kbps)</label>
                  <select
                    value={audioBitrateKbps}
                    onChange={(e) => setAudioBitrateKbps(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-200 text-xs focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    {AUDIO_BITRATE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* VAD Silence Duration */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold text-[11px]">Voice Activity Silence Threshold</label>
                  <select
                    value={silenceDurationMs}
                    onChange={(e) => setSilenceDurationMs(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-200 text-xs focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    {SILENCE_DURATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <span className="text-[10px] text-slate-500 font-mono">Eve Virtual Assistant v{APP_VERSION}</span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="px-3.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 transition flex items-center space-x-1.5 cursor-pointer active:scale-95 shadow-md"
            >
              {saved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-slate-950" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
