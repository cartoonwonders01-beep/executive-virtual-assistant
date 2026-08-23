import React, { useState, useRef, useEffect } from 'react';
import { useAssistant } from '../context/AssistantContext';
import { 
  speakResponse, 
  stopSpeaking, 
  getVoicePersona 
} from '../services/speechSynthesis';
import { 
  MessageSquare, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  Download, 
  Trash2, 
  Sparkles, 
  Bot, 
  User, 
  Clock, 
  Flame, 
  Play, 
  HelpCircle, 
  Zap, 
  Terminal, 
  CornerDownLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export const LiveTranscriptView: React.FC = () => {
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
    customSkills
  } = useAssistant();

  const [chatInput, setChatInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [playingTurnId, setPlayingTurnId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dialogueTurns, liveTranscript, isProcessingSpeech]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = chatInput.trim();
    if (!text || isProcessingSpeech) return;
    setChatInput('');
    await submitVoiceTranscript(text);
    inputRef.current?.focus();
  };

  const handleCopyTurn = (turnId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(turnId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAllTranscript = () => {
    const fullText = dialogueTurns
      .slice()
      .reverse()
      .map(t => `[${new Date(t.timestamp).toLocaleTimeString()}] ${t.speaker === 'user' ? 'Andrew' : 'Eve'}: ${t.text}`)
      .join('\n\n');
    navigator.clipboard.writeText(fullText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const handleExportMarkdown = () => {
    const mdContent = `# Executive Assistant Dialogue Transcript\nExported on: ${new Date().toLocaleString()}\n\n---\n\n` +
      dialogueTurns
        .slice()
        .reverse()
        .map(t => `### ${t.speaker === 'user' ? '👤 Andrew' : '🤖 Eve'} *(${new Date(t.timestamp).toLocaleTimeString()})*\n${t.intent ? `**Intent:** \`[${t.intent}]\`\n\n` : ''}${t.text}\n`)
        .join('\n---\n\n');

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `eve_dialogue_transcript_${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePlayTurn = (turnId: string, text: string) => {
    if (playingTurnId === turnId) {
      stopSpeaking();
      setPlayingTurnId(null);
      return;
    }
    stopSpeaking();
    setPlayingTurnId(turnId);
    speakResponse(text, () => setPlayingTurnId(null));
  };

  const quickPrompts = [
    { label: 'Deep Work Strategies', text: 'What are 3 strategies for deep work?' },
    { label: 'Love Note to Emily', text: 'Draft an email to Emily saying I love her ❤️' },
    { label: 'Schedule with David', text: 'Schedule sync with David Miller tomorrow at 2pm' },
    { label: 'Triage VIP Inbox', text: 'Triage my VIP inbox and summarize urgent emails' },
    { label: 'Executive Routine', text: 'Teach skill: when I say wrap up my day, summarize KPIs and list tasks' },
    { label: 'Tell me a Joke', text: 'Tell me a quick joke' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto p-3 sm:p-6 space-y-4 text-slate-100 animate-fadeIn">
      
      {/* Header Controls Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-md backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-brand-500/20 text-brand-300 rounded-xl border border-brand-500/30">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">Live Dialogue & Interactive Transcript</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-950 border border-brand-800 text-brand-300 font-semibold">
                {dialogueTurns.length} turns
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live stream of what Eve is hearing, real-time reasoning, and full text chat interface
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Quiet Mode Pill */}
          <button
            type="button"
            onClick={toggleQuietMode}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border transition cursor-pointer ${
              quietMode
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
                : 'bg-teal-500/10 border-teal-500/40 text-teal-300 hover:bg-teal-500/20'
            }`}
          >
            {quietMode ? <VolumeX className="w-3.5 h-3.5 text-amber-400" /> : <Volume2 className="w-3.5 h-3.5 text-teal-400" />}
            <span>{quietMode ? '🤫 Quiet Mode (Silent)' : '🔊 Spoken Mode'}</span>
          </button>

          {/* Copy All */}
          <button
            type="button"
            onClick={handleCopyAllTranscript}
            disabled={dialogueTurns.length === 0}
            className="px-2.5 py-1.5 rounded-xl text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 flex items-center space-x-1 transition disabled:opacity-50 cursor-pointer"
          >
            {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedAll ? 'Copied!' : 'Copy'}</span>
          </button>

          {/* Export Markdown */}
          <button
            type="button"
            onClick={handleExportMarkdown}
            disabled={dialogueTurns.length === 0}
            className="px-2.5 py-1.5 rounded-xl text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 flex items-center space-x-1 transition disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Clear History */}
          <button
            type="button"
            onClick={() => {
              if (confirm('Clear entire dialogue conversation transcript?')) {
                clearDialogueTurns();
              }
            }}
            disabled={dialogueTurns.length === 0}
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition border border-transparent hover:border-rose-500/30 disabled:opacity-30 cursor-pointer"
            title="Clear Dialogue History"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Telemetry Log */}
          <button
            type="button"
            onClick={() => setIsActivityLogOpen(true)}
            className="px-2.5 py-1.5 rounded-xl text-xs bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-800 flex items-center space-x-1 transition cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span>Logs</span>
          </button>
        </div>
      </div>

      {/* Main Conversation Utterance Container */}
      <div className="flex-1 bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 overflow-y-auto space-y-4 shadow-inner">
        {dialogueTurns.length === 0 && !isListening && !liveTranscript && !isProcessingSpeech ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-300">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">No Dialogue History Yet</p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Say <strong className="text-teal-300">"Hey Eve"</strong>, click the microphone, or type a message below to start chatting with your AI Assistant.
              </p>
            </div>

            {/* Starter Suggestion Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg pt-3">
              {quickPrompts.slice(0, 4).map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => submitVoiceTranscript(p.text)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-brand-500/40 text-xs text-slate-300 hover:text-white transition flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Render Chronological Turns (Reversed from LIFO array) */}
            {dialogueTurns.slice().reverse().map((turn) => {
              const isUser = turn.speaker === 'user';
              const timeStr = new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={turn.id}
                  className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
                >
                  {/* Assistant Avatar */}
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  {/* Message Bubble Card */}
                  <div
                    className={`max-w-[85%] sm:max-w-xl rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-sm border ${
                      isUser
                        ? 'bg-slate-900 border-slate-800 text-slate-100 rounded-tr-sm'
                        : 'bg-gradient-to-br from-slate-900/90 to-brand-950/40 border-brand-500/30 text-slate-100 rounded-tl-sm'
                    }`}
                  >
                    {/* Speaker Header */}
                    <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400 pb-1.5 border-b border-slate-800/60 mb-2">
                      <div className="flex items-center gap-1.5 font-semibold">
                        {isUser ? (
                          <>
                            <User className="w-3 h-3 text-blue-400" />
                            <span className="text-blue-300">Andrew</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 text-brand-400" />
                            <span className="text-brand-300">Eve (Executive Assistant)</span>
                          </>
                        )}
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
                          onClick={() => handleCopyTurn(turn.id, turn.text)}
                          className="hover:text-white transition p-0.5"
                          title="Copy text"
                        >
                          {copiedId === turn.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>

                        {/* Play Aloud Button (for Assistant Turns) */}
                        {!isUser && (
                          <button
                            type="button"
                            onClick={() => handlePlayTurn(turn.id, turn.spokenResponse || turn.text)}
                            className="hover:text-brand-300 transition p-0.5 text-brand-400"
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

                  {/* User Avatar */}
                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 shrink-0 mt-0.5 shadow-sm">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Live Streaming Speech Bubble (While recording or STT stream) */}
            {(isListening || liveTranscript) && (
              <div className="flex items-start gap-3 justify-end animate-pulse">
                <div className="max-w-[85%] sm:max-w-xl rounded-2xl p-3.5 text-xs sm:text-sm bg-teal-950/40 border border-teal-500/50 text-teal-100 rounded-tr-sm">
                  <div className="flex items-center gap-1.5 text-[10px] text-teal-300 font-semibold pb-1 mb-1 border-b border-teal-800/40">
                    <Mic className="w-3 h-3 text-teal-400 animate-bounce" />
                    <span>🎙️ Live Ingesting Speech...</span>
                  </div>
                  <p className="italic text-teal-200">
                    "{liveTranscript || 'Listening to your voice...'}"
                  </p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-teal-600/30 border border-teal-500 flex items-center justify-center text-teal-300 shrink-0 mt-0.5">
                  <Mic className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}

            {/* Processing Indicator */}
            {isProcessingSpeech && (
              <div className="flex items-start gap-3 justify-start animate-fadeIn">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 animate-spin" />
                </div>
                <div className="rounded-2xl p-3 bg-slate-900 border border-brand-500/40 text-xs text-brand-300 flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-brand-400 animate-ping" />
                  <span>Eve is thinking & analyzing intent...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Suggestion Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono shrink-0">Quick Ask:</span>
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => submitVoiceTranscript(p.text)}
            className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-brand-500/40 text-[11px] text-slate-300 hover:text-white transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Chat Text Input & Push-To-Talk Bar */}
      <form onSubmit={handleSendMessage} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2 flex items-center gap-2 shadow-lg">
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
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder={quietMode ? "Type silently to Eve (Quiet Mode is ON)..." : "Chat with Eve or give an executive command..."}
          className="flex-1 bg-transparent border-none px-2 py-1.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={!chatInput.trim() || isProcessingSpeech}
          className="px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:hover:bg-brand-500 text-slate-950 font-bold text-xs flex items-center space-x-1 transition shadow-md shrink-0 cursor-pointer"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

    </div>
  );
};
