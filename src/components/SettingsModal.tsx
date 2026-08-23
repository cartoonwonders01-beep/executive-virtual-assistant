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
  resolveBestVoice
} from '../services/speechSynthesis';
import { wakeWordService } from '../services/wakeWordService';
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
  Radio
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
    syncAllToGoogleDataWarehouse
  } = useAssistant();

  const [groqKeyInput, setGroqKeyInput] = useState(groqApiKey);
  const [geminiKeyInput, setGeminiKeyInput] = useState(geminiApiKey);
  const [gasUrlInput, setGasUrlInput] = useState(googleAppsScriptUrl);
  const [brain, setBrain] = useState(aiBrainProvider);
  
  const [saved, setSaved] = useState(false);
  const [isPlayingSample, setIsPlayingSample] = useState(false);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Voice Persona State
  const [persona, setPersona] = useState<VoicePersona>(getVoicePersona());
  const [rate, setRate] = useState<number>(getVoiceRate());
  const [pitch, setPitch] = useState<number>(getVoicePitch());
  const [detectedVoiceName, setDetectedVoiceName] = useState<string>('');
  const [selectedWakeWord, setSelectedWakeWord] = useState<string>('hey nova');

  useEffect(() => {
    if (isSettingsOpen) {
      setGroqKeyInput(groqApiKey);
      setGeminiKeyInput(geminiApiKey);
      setGasUrlInput(googleAppsScriptUrl);
      setBrain(aiBrainProvider);
      setPersona(getVoicePersona());
      setRate(getVoiceRate());
      setPitch(getVoicePitch());
      const voice = resolveBestVoice(getVoicePersona());
      if (voice) setDetectedVoiceName(voice.name);
      try {
        const stored = localStorage.getItem('assistant_primary_wake_word') || 'hey nova';
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
    const cleanWake = selectedWakeWord.toLowerCase().trim() || 'hey nova';
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
    { id: 'hey nova', label: '🌟 Hey Nova', desc: 'Short, sweet & executive (Recommended)' },
    { id: 'hey aria', label: '🎙️ Hey Aria', desc: 'Natural & articulate' },
    { id: 'hey andy', label: '👤 Hey Andy', desc: 'Direct personal executive name' },
    { id: 'hey eva', label: '⚡ Hey Eva', desc: 'Fast, crisp & futuristic' },
    { id: 'hey assistant', label: '🤖 Hey Assistant', desc: 'Universal assistant trigger' },
  ];

  const voicePersonas = [
    { id: 'studio_american_female' as VoicePersona, title: 'Studio American Female', desc: 'Natural, articulate, and studio-grade' },
    { id: 'executive_british_male' as VoicePersona, title: 'Executive British Male', desc: 'Refined, authoritative, and crisp' },
    { id: 'crisp_american_male' as VoicePersona, title: 'Crisp American Male', desc: 'Dynamic, clear, and professional' },
    { id: 'warm_australian' as VoicePersona, title: 'Warm Australian', desc: 'Approachable, warm, and clear' },
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
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
          
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
                className="w-full mt-1.5 flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-brand-300 border border-slate-800 transition text-xs font-semibold"
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
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 border border-brand-500/30 transition text-[11px] font-semibold"
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

          {/* Workspace Hygiene & System Reset */}
          <div className="space-y-2 bg-slate-950 p-3.5 rounded-2xl border border-rose-500/30">
            <div className="flex items-center justify-between">
              <label className="text-rose-300 font-semibold flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-rose-400" />
                <span>Workspace Hygiene & Clean Slate Initialization</span>
              </label>
            </div>
            <p className="text-[10px] text-slate-400">
              Clear test/dummy data and initialize your workspace into a pristine production state.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={async () => {
                  if (confirm('Initialize workspace to Pristine Clean Slate (0 dummy tasks, 0 test memos)?')) {
                    await fetch('/api/system/reset', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ mode: 'pristine' })
                    });
                    window.location.reload();
                  }
                }}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition text-left"
              >
                <p className="font-semibold text-white text-xs">✨ Pristine Clean Slate</p>
                <p className="text-[9px] text-slate-500 mt-0.5">0 tasks, 0 memos, clean slate for your voice</p>
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (confirm('Reset workspace to canonical Executive Starter Pack?')) {
                    await fetch('/api/system/reset', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ mode: 'executive_starter' })
                    });
                    window.location.reload();
                  }
                }}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-brand-300 hover:text-brand-200 transition text-left"
              >
                <p className="font-semibold text-brand-300 text-xs">🌟 Executive Starter Pack</p>
                <p className="text-[9px] text-slate-500 mt-0.5">7 canonical tasks across all categories</p>
              </button>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
          <button
            onClick={() => {
              stopSpeaking();
              setIsSettingsOpen(false);
            }}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-md transition"
          >
            {saved ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            <span>{saved ? 'Saved!' : 'Save Settings'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
