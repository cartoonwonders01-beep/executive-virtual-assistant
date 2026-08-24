import React, { useState, useRef, useEffect } from 'react';
import { useAssistant } from '../context/AssistantContext';
import { 
  speakResponse, 
  stopSpeaking,
  getPreferredLanguage,
  setPreferredLanguage,
  SupportedLanguage
} from '../services/speechSynthesis';
import { selfLearningEngine } from '../services/selfLearningEngine';
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  Trash2, 
  Sparkles, 
  Bot, 
  User, 
  Play, 
  Terminal, 
  Settings, 
  Menu, 
  X,
  Radio,
  ThumbsUp,
  ThumbsDown,
  Globe,
  Brain,
  ChevronDown,
  MessageSquare,
  Square,
  RotateCcw
} from 'lucide-react';
import { AppView } from '../types';
import { LiveActivityLogPanel } from './LiveActivityLogPanel';
import { logger } from '../services/loggerService';

export const LiveChatView: React.FC = () => {
  const {
    dialogueTurns,
    clearDialogueTurns,
    liveTranscript,
    isListening,
    isProcessingSpeech,
    startVoiceListening,
    stopVoiceListening,
    emergencyHaltAssistant,
    submitVoiceTranscript,
    quietMode,
    toggleQuietMode,
    setIsActivityLogOpen,
    setIsSettingsOpen,
    activeView,
    setActiveView,
    continuousTimeoutSeconds,
    isContinuousSessionActive,
    isPromptStudioOpen,
    setIsPromptStudioOpen,
    activeLLMProfile,
    allLLMProfiles,
    switchActiveProfile
  } = useAssistant();

  const [inputMessage, setInputMessage] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingTurnId, setPlayingTurnId] = useState<string | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, 'up' | 'down'>>({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<string>(() => getPreferredLanguage());

  // Docked Right-Hand Side Log Inspector State
  const [isSideLogOpen, setIsSideLogOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem('assistant_side_log_open') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSideLog = () => {
    setIsSideLogOpen(prev => {
      const next = !prev;
      try { localStorage.setItem('assistant_side_log_open', String(next)); } catch {}
      return next;
    });
  };

  const handleNewChatAndArchive = () => {
    const title = dialogueTurns.length > 0
      ? `Chat: "${dialogueTurns[dialogueTurns.length - 1].text.slice(0, 30)}..." (${dialogueTurns.length} turns)`
      : `Chat Session — ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    logger.archiveCurrentSession(title);
    clearDialogueTurns();
  };

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll chat container directly without affecting window scroll
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [dialogueTurns, liveTranscript, isProcessingSpeech]);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputMessage.trim();
    if (!text || isProcessingSpeech) return;
    setInputMessage('');
    await submitVoiceTranscript(text);
    inputRef.current?.focus();
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePlayAudio = (id: string, text: string) => {
    if (playingTurnId === id) {
      stopSpeaking();
      setPlayingTurnId(null);
      return;
    }
    stopSpeaking();
    setPlayingTurnId(id);
    speakResponse(text, () => setPlayingTurnId(null));
  };

  const handleFeedback = (turnId: string, isPositive: boolean) => {
    setFeedbackMap(prev => ({ ...prev, [turnId]: isPositive ? 'up' : 'down' }));
    selfLearningEngine.recordFeedback(turnId, isPositive);
  };

  const handleCycleLanguage = () => {
    const langs: (SupportedLanguage | 'auto')[] = ['auto', 'en', 'de', 'fr', 'es', 'it', 'nl'];
    const nextIdx = (langs.indexOf(currentLang as any) + 1) % langs.length;
    const nextLang = langs[nextIdx];
    setCurrentLang(nextLang);
    setPreferredLanguage(nextLang);
  };

  const starterChips = [
    { label: '🇬🇧 Deep Work Strategies', prompt: 'What are 3 strategies for deep work?' },
    { label: '🇩🇪 Morgenroutine (DE)', prompt: 'Was sind 3 Strategien für eine produktive Morgenroutine?' },
    { label: '🇫🇷 Travail Profond (FR)', prompt: 'Quelles sont 3 stratégies pour le travail profond ?' },
    { label: '🇪🇸 Estrategias (ES)', prompt: '¿Cuáles son 3 estrategias para la productividad ejecutiva?' },
    { label: '🧠 Save Memory', prompt: 'Eve, remember that my preferred meeting tool is Google Meet' },
    { label: '💌 Email Emily', prompt: 'Draft an email to Emily saying I love her ❤️' },
    { label: '📅 Schedule Meeting', prompt: 'Schedule sync with David Miller tomorrow at 2pm' },
    { label: '🤖 Teach Routine', prompt: 'Teach skill: when I say wrap up my day, summarize KPIs and list tasks' },
  ];

  const secondaryViews: { id: AppView; label: string; desc: string }[] = [
    { id: 'thought_hub', label: 'Thought Studio', desc: 'Voice memo waveforms & notes' },
    { id: 'gmail', label: 'Gmail Suite', desc: 'Email inbox & drafts' },
    { id: 'calendar', label: 'Calendar Hub', desc: 'Appointments & schedule' },
    { id: 'comms', label: 'Comms & Calls', desc: 'Contacts & call logs' },
    { id: 'skills', label: 'Skill Studio', desc: 'Custom voice routines' },
    { id: 'table', label: 'Work Table', desc: 'Task database' },
    { id: 'gantt', label: 'Gantt Timeline', desc: 'Critical Path schedule' },
    { id: 'matrix', label: 'Priority Matrix', desc: 'Eisenhower 2x2 grid' },
    { id: 'autonomous', label: 'Autonomous Worker', desc: 'Background execution' },
    { id: 'swarm', label: 'Agent Swarm', desc: 'Multi-agent system' },
    { id: 'wiki', label: 'Wiki Guides', desc: 'Knowledge documentation' },
  ];

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-slate-950 text-slate-100 font-sans">
      
      {/* Top Header Bar — Always pinned, strictly visible */}
      <header className="w-full shrink-0 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md px-3 sm:px-4 py-2.5 sm:py-3 z-30 flex items-center justify-between">
        
        {/* Left: Brand / Status */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-400 shadow-md shadow-teal-500/20">
            <Sparkles className="w-4 h-4 text-slate-950 animate-pulse" />
            {isListening && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-sm sm:text-base text-white tracking-tight">Eve</h1>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 font-medium">
                Assistant
              </span>
            </div>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              {isListening ? (
                <span className="text-rose-400 font-semibold animate-pulse">
                  🎙️ Listening {continuousTimeoutSeconds > 0 ? `(${continuousTimeoutSeconds}s)` : '(Live)'}...
                </span>
              ) : isProcessingSpeech ? (
                <span className="text-purple-400 font-semibold animate-pulse">🧠 Thinking...</span>
              ) : isContinuousSessionActive ? (
                <span className="text-teal-400 font-semibold">🎙️ Ready for next turn...</span>
              ) : (
                <span className="text-emerald-400">● Online</span>
              )}
            </p>
          </div>
        </div>

        {/* Right: Controls (Language, Quiet Mode, Logs, Config, Menu) */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          
          {/* Quick Language Toggle */}
          <button
            type="button"
            onClick={handleCycleLanguage}
            className="px-2 py-1.5 rounded-xl text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 flex items-center space-x-1 transition cursor-pointer"
            title="Cycle European Language (Auto / EN / DE / FR / ES / IT / NL)"
          >
            <Globe className="w-3.5 h-3.5 text-teal-400" />
            <span className="uppercase font-mono text-[10px]">{currentLang === 'auto' ? '🌐 Multi' : currentLang}</span>
          </button>

          {/* Quiet Mode Switch */}
          <button
            type="button"
            onClick={toggleQuietMode}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center space-x-1 cursor-pointer ${
              quietMode
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Toggle Quiet Mode (Silent responses vs Spoken audio)"
          >
            {quietMode ? <VolumeX className="w-3.5 h-3.5 text-amber-400" /> : <Volume2 className="w-3.5 h-3.5 text-teal-400" />}
            <span className="hidden sm:inline">{quietMode ? 'Quiet Mode' : 'Spoken'}</span>
          </button>

          {/* Multi-User & Family Profile Switcher Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="px-2.5 py-1.5 rounded-xl text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 flex items-center space-x-1.5 transition cursor-pointer shadow-sm hover:border-teal-500/40"
              title="Switch Active Family / User Profile"
            >
              <span>{activeLLMProfile?.avatarIcon || '👤'}</span>
              <span className="font-semibold text-teal-300 max-w-[80px] sm:max-w-[110px] truncate">
                {activeLLMProfile?.userContext.userName || 'User'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center justify-between">
                  <span>Family & Profiles</span>
                  <span className="text-teal-400">Multi-User</span>
                </div>
                <div className="max-h-60 overflow-y-auto py-1 space-y-1 custom-scrollbar">
                  {allLLMProfiles.map((p) => {
                    const isCurrent = p.id === activeLLMProfile?.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          switchActiveProfile(p.id);
                          setIsProfileDropdownOpen(false);
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-xl text-left transition cursor-pointer flex items-center justify-between ${
                          isCurrent
                            ? 'bg-teal-500/15 border border-teal-500/40 text-teal-200'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2 min-w-0">
                          <span className="text-base">{p.avatarIcon || '👤'}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate">{p.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{p.userContext.userRole || p.description}</p>
                          </div>
                        </div>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                <div className="border-t border-slate-800 pt-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      setIsPromptStudioOpen(true);
                    }}
                    className="w-full px-2 py-1 rounded-lg text-left text-[11px] text-teal-300 hover:bg-teal-500/10 font-semibold flex items-center justify-between transition cursor-pointer"
                  >
                    <span>Manage & Add Profiles</span>
                    <span>⚙️ ↗</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Universal Emergency Hard STOP Button */}
          <button
            type="button"
            onClick={emergencyHaltAssistant}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 flex items-center space-x-1.5 transition cursor-pointer active:scale-95 shadow-sm"
            title="Emergency Hard Stop: Silence all audio, abort running tasks, and halt background listening"
          >
            <Square className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
            <span>STOP</span>
          </button>

          {/* New Chat & Archive Button */}
          <button
            type="button"
            onClick={handleNewChatAndArchive}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/40 text-teal-300 flex items-center space-x-1.5 transition cursor-pointer active:scale-95 shadow-sm"
            title="Start a new clean chat session and archive current logs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">New Chat</span>
          </button>

          {/* LLM Prompt Studio Button */}
          <button
            type="button"
            onClick={() => setIsPromptStudioOpen(true)}
            className="px-2.5 py-1.5 rounded-xl text-xs bg-gradient-to-r from-teal-950 to-purple-950 hover:from-teal-900 hover:to-purple-900 border border-teal-500/40 text-teal-200 flex items-center space-x-1.5 transition cursor-pointer shadow-sm hover:shadow-teal-500/20 active:scale-95"
            title="Open LLM Prompt Studio & Persona Customizer"
          >
            <Brain className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
            <span className="hidden md:inline font-semibold">Prompt Studio</span>
          </button>

          {/* Activity Logs Side-Panel Toggle */}
          <button
            type="button"
            onClick={toggleSideLog}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 transition cursor-pointer ${
              isSideLogOpen
                ? 'bg-emerald-500/25 border-emerald-500/60 text-emerald-200 shadow-md shadow-emerald-500/20'
                : 'bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-800 text-emerald-300'
            }`}
            title="Toggle Right-Hand Telemetry & Diagnostic Inspector"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isSideLogOpen ? 'Hide Logs' : 'Logs'}</span>
          </button>

          {/* Config / Settings */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="px-2.5 py-1.5 rounded-xl text-xs bg-purple-950/70 hover:bg-purple-900 border border-purple-800 text-purple-200 flex items-center space-x-1 transition cursor-pointer"
            title="Relay Audio Slicing & AI Configuration"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Config</span>
          </button>

          {/* Secondary Tools Menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition cursor-pointer"
              title="More Modules"
            >
              <Menu className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Additional Views
                </div>
                <div className="max-h-80 overflow-y-auto py-1 space-y-0.5 custom-scrollbar">
                  <button
                    onClick={() => {
                      setIsPromptStudioOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left bg-gradient-to-r from-teal-950/40 to-purple-950/40 hover:from-teal-900/60 hover:to-purple-900/60 border border-teal-500/30 text-teal-300 transition cursor-pointer mb-1"
                  >
                    <div className="flex items-center space-x-2">
                      <Brain className="w-4 h-4 text-teal-400" />
                      <span className="text-xs font-bold">🧠 LLM Prompt Studio</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Customize system prompt & user profile</p>
                  </button>
                  {secondaryViews.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveView(item.id);
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left hover:bg-slate-800 transition cursor-pointer"
                    >
                      <p className="text-xs font-semibold text-slate-200">{item.label}</p>
                      <p className="text-[10px] text-slate-500 truncate">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

      </header>

      {/* Split Screen Layout Container */}
      <div className="flex-1 flex flex-row min-h-0 overflow-hidden w-full relative">
        
        {/* Left Column: Interactive Chat Stream & Bottom Input Bar */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          
          {/* Main Conversation Stream */}
          <main ref={chatContainerRef} className="flex-1 w-full max-w-4xl mx-auto overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar">
            {dialogueTurns.length === 0 && !isProcessingSpeech ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-5 my-auto animate-fadeIn">
                
                {/* Glowing Hero Voice Orb Button */}
                <div className="relative flex items-center justify-center pt-2">
                  <div className={`absolute w-36 h-36 rounded-full transition-all duration-300 ${
                    isListening
                      ? 'bg-rose-500/30 animate-ping opacity-80'
                      : 'bg-teal-500/15 animate-ping opacity-60'
                  } pointer-events-none`} />
                  <div className={`absolute w-28 h-28 rounded-full blur-xl transition-all duration-300 ${
                    isListening ? 'bg-rose-500/40' : 'bg-teal-500/25'
                  } pointer-events-none`} />

                  <button
                    type="button"
                    onClick={isListening ? stopVoiceListening : startVoiceListening}
                    className={`relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 transform active:scale-95 shadow-2xl cursor-pointer border-2 ${
                      isListening
                        ? 'bg-gradient-to-tr from-rose-600 via-rose-500 to-red-600 border-rose-300 text-white shadow-rose-500/60 scale-110 animate-pulse'
                        : 'bg-gradient-to-tr from-slate-900 via-teal-950 to-slate-900 border-teal-400 text-teal-300 hover:border-teal-300 hover:text-white shadow-teal-500/40 hover:scale-105'
                    }`}
                    title={isListening ? 'Tap to stop and send' : 'Start Voice Conversation with Eve'}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-10 h-10 sm:w-12 sm:h-12 text-white animate-bounce" />
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider mt-1 text-white">
                          Listening...
                        </span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-10 h-10 sm:w-12 sm:h-12 text-teal-300 animate-pulse" />
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider mt-1 text-teal-200">
                          Tap to Talk
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {/* Live Hearing Display when Listening */}
                {isListening && (
                  <div className="bg-slate-900/90 border border-teal-500/40 rounded-2xl p-3.5 shadow-xl text-center max-w-md w-full animate-fadeIn">
                    <p className="text-[10px] text-teal-400 font-semibold uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
                      Listening to your voice:
                    </p>
                    <p className="text-sm text-slate-100 font-medium italic">
                      "{liveTranscript || 'Speak naturally to Eve...'}"
                    </p>
                  </div>
                )}

                <div>
                  <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                    How can I assist you today, Andrew?
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Executive Virtual Assistant. Tap the orb or speak to trigger autonomous workflows, emails, calendar, and live intelligence.
                  </p>
                </div>

                {/* Quick Prompts Carousel Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl w-full text-left pt-2">
                  {starterChips.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => submitVoiceTranscript(chip.prompt)}
                      className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-teal-500/50 transition cursor-pointer text-left group shadow-lg flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-200 group-hover:text-teal-300 transition">
                          {chip.label}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5 max-w-[220px]">
                          "{chip.prompt}"
                        </p>
                      </div>
                      <span className="text-slate-600 group-hover:text-teal-400 text-xs transition-transform group-hover:translate-x-0.5">
                        →
                      </span>
                    </button>
                  ))}
                </div>

              </div>
            ) : (
              <div className="space-y-4 max-w-3xl mx-auto pb-4">
                {dialogueTurns.slice().reverse().map((turn) => {
                  const isUser = turn.speaker === 'user';
                  const isSpeakingThis = playingTurnId === turn.id;

                  return (
                    <div
                      key={turn.id}
                      className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn group`}
                    >
                      {!isUser && (
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-brand-600 via-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 shrink-0 mt-1 shadow-md shadow-teal-500/20">
                          <Sparkles className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={`relative max-w-[85%] sm:max-w-xl rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed transition ${
                          isUser
                            ? 'bg-slate-800 text-white rounded-tr-sm shadow-md border border-slate-700/80'
                            : 'bg-slate-900/95 text-slate-100 rounded-tl-sm border border-slate-800 shadow-xl'
                        }`}
                      >
                        {/* Speaker & Timestamp header */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5 pb-1 border-b border-slate-800/60 font-mono">
                          <span className="font-semibold text-slate-300">
                            {isUser ? `👤 ${activeLLMProfile?.userContext.userName || 'Andrew Baxter'}` : '✨ Eve'}
                          </span>
                          <span>
                            {new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Turn Content Text */}
                        <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm">
                          {turn.text}
                        </div>

                        {/* Action Toolbar on Hover/Focus */}
                        <div className="mt-2.5 pt-1.5 border-t border-slate-800/80 flex items-center justify-between gap-2 text-slate-400 text-[10px]">
                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopy(turn.id, turn.text)}
                              className="p-1 hover:text-white rounded transition cursor-pointer"
                              title="Copy message"
                            >
                              {copiedId === turn.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>

                            {!isUser && (
                              <button
                                type="button"
                                onClick={() => handlePlayAudio(turn.id, turn.text)}
                                className={`p-1 rounded transition cursor-pointer flex items-center gap-1 ${
                                  isSpeakingThis ? 'text-teal-400 font-semibold' : 'hover:text-white'
                                }`}
                                title={isSpeakingThis ? 'Stop speaking' : 'Read aloud'}
                              >
                                <Volume2 className={`w-3.5 h-3.5 ${isSpeakingThis ? 'animate-pulse' : ''}`} />
                                <span className="text-[9px]">{isSpeakingThis ? 'Stop' : 'Speak'}</span>
                              </button>
                            )}
                          </div>

                          {!isUser && (
                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={() => handleFeedback(turn.id, true)}
                                className={`p-1 rounded transition cursor-pointer ${
                                  feedbackMap[turn.id] === 'up' ? 'text-emerald-400 bg-emerald-500/10' : 'hover:text-emerald-400'
                                }`}
                                title="Good response"
                              >
                                <ThumbsUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleFeedback(turn.id, false)}
                                className={`p-1 rounded transition cursor-pointer ${
                                  feedbackMap[turn.id] === 'down' ? 'text-rose-400 bg-rose-500/10' : 'hover:text-rose-400'
                                }`}
                                title="Needs improvement"
                              >
                                <ThumbsDown className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Interactive Direct Execution Buttons for pending email/WhatsApp */}
                        {!isUser && turn.intent === 'email_draft' && (
                          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => submitVoiceTranscript('Yes, send it')}
                              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition shadow-md shadow-teal-600/20 cursor-pointer flex items-center gap-1.5"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>✈️ Send Email Now</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => submitVoiceTranscript('Cancel')}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition border border-slate-700 cursor-pointer"
                            >
                              <span>Cancel</span>
                            </button>
                          </div>
                        )}

                        {!isUser && (turn.intent === 'whatsapp_message' || turn.text.includes('wa.me')) && (
                          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const match = turn.text.match(/https:\/\/wa\.me\/[^\s\)]+/);
                                if (match) {
                                  window.open(match[0], '_blank');
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>💬 Open in WhatsApp & Send</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {isUser && (
                        <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 shrink-0 mt-1 shadow-sm">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Live Streaming Speech Bubble */}
                {(isListening || liveTranscript) && (
                  <div className="flex items-start gap-3 justify-end animate-pulse">
                    <div className="max-w-[85%] sm:max-w-xl rounded-2xl p-3.5 text-xs sm:text-sm bg-teal-950/40 border border-teal-500/50 text-teal-100 rounded-tr-sm">
                      <div className="flex items-center gap-1.5 text-[10px] text-teal-300 font-semibold pb-1 mb-1 border-teal-800/40 border-b">
                        <Mic className="w-3 h-3 text-teal-400 animate-bounce" />
                        <span>Live Ingesting Speech...</span>
                      </div>
                      <p className="italic text-teal-200">
                        "{liveTranscript || 'Listening to your voice...'}"
                      </p>
                    </div>
                    <div className="w-7 h-7 rounded-xl bg-teal-600/30 border border-teal-500 flex items-center justify-center text-teal-300 shrink-0 mt-1">
                      <Mic className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}

                {/* Thinking / Analyzing Indicator */}
                {isProcessingSpeech && (
                  <div className="flex items-start gap-3 justify-start animate-fadeIn">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center text-white shrink-0 mt-1">
                      <Sparkles className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="rounded-2xl p-3 bg-slate-900 border border-teal-500/40 text-xs text-teal-300 flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                      <span>Eve is thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>

          {/* Bottom Input & Action Bar — Always pinned, strictly visible */}
          <footer className="w-full shrink-0 border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-md p-3 sm:p-4 z-30">
            <div className="max-w-4xl mx-auto flex flex-col gap-2">
              
              {/* Quick Starter Chips Row (if dialogue is active) */}
              {dialogueTurns.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto text-xs no-scrollbar pb-1">
                  {starterChips.slice(0, 4).map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => submitVoiceTranscript(chip.prompt)}
                      className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/40 text-[11px] text-slate-400 hover:text-white transition whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Form with Mic & Text Box */}
              <form onSubmit={handleSend} className="bg-slate-900 border border-slate-800 focus-within:border-teal-500/60 rounded-2xl p-1.5 sm:p-2 flex items-center gap-2 shadow-xl transition">
                {/* Push-to-talk mic button */}
                <button
                  type="button"
                  onClick={isListening ? stopVoiceListening : startVoiceListening}
                  className={`p-2.5 sm:p-3 rounded-xl transition flex items-center justify-center shrink-0 cursor-pointer ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-teal-400 hover:text-teal-300'
                  }`}
                  title={isListening ? 'Stop Listening' : 'Speak to Eve'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-teal-400" />}
                </button>

                {/* Text Input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={quietMode ? "Message Eve (Quiet Mode is ON)..." : "Message Eve or hold mic to speak..."}
                  className="flex-1 bg-transparent border-none px-2 py-1.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isProcessingSpeech}
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-40 disabled:hover:bg-teal-500 text-slate-950 font-bold text-xs flex items-center space-x-1 transition shadow-md shrink-0 cursor-pointer active:scale-95"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </footer>

        </div>

        {/* Right Column: Docked Live Activity & Telemetry Inspector */}
        {isSideLogOpen && (
          <aside className="w-full md:w-[420px] lg:w-[480px] shrink-0 h-full border-l border-slate-800 bg-slate-950 z-20 flex flex-col overflow-hidden animate-slideLeft shadow-2xl">
            <LiveActivityLogPanel onClose={() => setIsSideLogOpen(false)} isSidePanel={true} />
          </aside>
        )}

      </div>

    </div>
  );
};
