import React, { useState, useRef, useEffect } from 'react';
import { useAssistant } from '../context/AssistantContext';
import { 
  speakResponse, 
  stopSpeaking 
} from '../services/speechSynthesis';
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
  Download
} from 'lucide-react';
import { AppView } from '../types';

export const LiveChatView: React.FC = () => {
  const {
    dialogueTurns,
    clearDialogueTurns,
    liveTranscript,
    isListening,
    isProcessingSpeech,
    startVoiceListening,
    stopVoiceListening,
    submitVoiceTranscript,
    quietMode,
    toggleQuietMode,
    setIsActivityLogOpen,
    setIsSettingsOpen,
    activeView,
    setActiveView,
    inboxEmails,
    kpi
  } = useAssistant();

  const [inputMessage, setInputMessage] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingTurnId, setPlayingTurnId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const starterChips = [
    { label: 'Deep Work Strategies', prompt: 'What are 3 strategies for deep work?' },
    { label: 'Draft Email to Emily', prompt: 'Draft an email to Emily saying I love her ❤️' },
    { label: 'Schedule Meeting', prompt: 'Schedule sync with David Miller tomorrow at 2pm' },
    { label: 'Triage VIP Inbox', prompt: 'Triage my VIP inbox and summarize urgent emails' },
    { label: 'Create Daily Routine', prompt: 'Teach skill: when I say wrap up my day, summarize KPIs and list tasks' },
    { label: 'Tell a Joke', prompt: 'Tell me a quick joke' },
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
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-slate-950 text-slate-100 font-sans">
      
      {/* Clean Top Navigation Bar */}
      <header className="px-4 py-3 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md flex items-center justify-between shrink-0">
        
        {/* Left: Brand / Title */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 via-teal-500 to-emerald-400 shadow-md shadow-teal-500/20">
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
            <p className="text-[10px] text-slate-400">
              {isListening ? (
                <span className="text-rose-400 font-semibold animate-pulse">🎙️ Listening...</span>
              ) : isProcessingSpeech ? (
                <span className="text-purple-400 font-semibold animate-pulse">🧠 Thinking...</span>
              ) : (
                <span className="text-emerald-400">● Online</span>
              )}
            </p>
          </div>
        </div>

        {/* Right: Actions (Quiet Mode, Logs, Config, Menu) */}
        <div className="flex items-center space-x-2">
          
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

          {/* Activity Logs */}
          <button
            type="button"
            onClick={() => setIsActivityLogOpen(true)}
            className="px-2.5 py-1.5 rounded-xl text-xs bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 flex items-center space-x-1 transition cursor-pointer"
            title="Open Telemetry & Activity Logs"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logs</span>
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

          {/* Clear Chat */}
          {dialogueTurns.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Clear chat conversation?')) {
                  clearDialogueTurns();
                }
              }}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition border border-transparent hover:border-rose-500/30 cursor-pointer"
              title="Clear conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Minimal More Tools Menu */}
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
                <div className="max-h-80 overflow-y-auto py-1 space-y-0.5">
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

      {/* Main Conversational Message Stream */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {dialogueTurns.length === 0 && !isListening && !liveTranscript && !isProcessingSpeech ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600/20 to-teal-500/20 border border-brand-500/30 flex items-center justify-center text-teal-300">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">How can I help you today?</h2>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Say <strong className="text-teal-300">"Hey Eve"</strong>, tap the microphone, or type a message below.
              </p>
            </div>

            {/* Starter Suggestion Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg pt-4">
              {starterChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => submitVoiceTranscript(chip.prompt)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-brand-500/40 text-xs text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Render Chronological Message Bubbles */}
            {dialogueTurns.slice().reverse().map((turn) => {
              const isUser = turn.speaker === 'user';
              const timeStr = new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={turn.id}
                  className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-xl rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-sm border ${
                      isUser
                        ? 'bg-slate-900 border-slate-800 text-slate-100 rounded-tr-sm'
                        : 'bg-slate-900/90 border-slate-800 text-slate-100 rounded-tl-sm'
                    }`}
                  >
                    {/* Speaker Header */}
                    <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400 pb-1.5 border-b border-slate-800/60 mb-2">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <span className={isUser ? 'text-blue-300' : 'text-teal-300'}>
                          {isUser ? 'You' : 'Eve'}
                        </span>
                        {turn.intent && (
                          <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-purple-950 border border-purple-800 text-purple-300">
                            [{turn.intent}]
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span>{timeStr}</span>

                        {/* Copy button */}
                        <button
                          type="button"
                          onClick={() => handleCopy(turn.id, turn.text)}
                          className="hover:text-white transition p-0.5 cursor-pointer"
                          title="Copy text"
                        >
                          {copiedId === turn.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>

                        {/* Play Aloud Button */}
                        {!isUser && (
                          <button
                            type="button"
                            onClick={() => handlePlayAudio(turn.id, turn.spokenResponse || turn.text)}
                            className="hover:text-teal-300 transition p-0.5 text-teal-400 cursor-pointer"
                            title="Play spoken response"
                          >
                            <Play className={`w-3 h-3 ${playingTurnId === turn.id ? 'animate-spin' : ''}`} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Message Body */}
                    <p className="whitespace-pre-wrap font-sans text-slate-200">
                      {turn.text}
                    </p>
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
                  <div className="flex items-center gap-1.5 text-[10px] text-teal-300 font-semibold pb-1 mb-1 border-b border-teal-800/40">
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
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-1">
                  <Sparkles className="w-4 h-4 animate-spin" />
                </div>
                <div className="rounded-2xl p-3 bg-slate-900 border border-brand-500/40 text-xs text-brand-300 flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-brand-400 animate-ping" />
                  <span>Eve is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Suggestion Chips Bar */}
      {dialogueTurns.length > 0 && (
        <div className="px-4 py-1 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar shrink-0">
          {starterChips.slice(0, 4).map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => submitVoiceTranscript(chip.prompt)}
              className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-brand-500/40 text-[11px] text-slate-400 hover:text-white transition whitespace-nowrap shrink-0 cursor-pointer"
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Clean Bottom Chat & Voice Input Bar */}
      <footer className="p-4 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md shrink-0">
        <form onSubmit={handleSend} className="bg-slate-900 border border-slate-800 focus-within:border-teal-500/50 rounded-2xl p-2 flex items-center gap-2 shadow-lg transition">
          {/* Push-to-talk mic button */}
          <button
            type="button"
            onClick={isListening ? stopVoiceListening : startVoiceListening}
            className={`p-2.5 rounded-xl transition flex items-center justify-center shrink-0 cursor-pointer ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
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
            className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-40 disabled:hover:bg-teal-500 text-slate-950 font-bold text-xs flex items-center space-x-1 transition shadow-md shrink-0 cursor-pointer"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </footer>

    </div>
  );
};
