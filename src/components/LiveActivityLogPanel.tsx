import React, { useState, useEffect, useRef } from 'react';
import { logger, LogEntry, LogLevel, ArchivedLogSession } from '../services/loggerService';
import { useAssistant } from '../context/AssistantContext';
import { 
  Terminal, 
  Copy, 
  Trash2, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  XCircle,
  Sparkles,
  Radio,
  Filter,
  FolderArchive,
  RotateCcw,
  ArrowDown,
  ChevronRight,
  Clock,
  Send,
  Zap,
  Layers,
  Database,
  Bug
} from 'lucide-react';

interface LiveActivityLogPanelProps {
  onClose?: () => void;
  isSidePanel?: boolean;
}

const LEVEL_STYLES: Record<LogLevel, { text: string; bg: string; border: string; icon: React.ReactNode }> = {
  error: { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', icon: <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" /> },
  warn: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" /> },
  success: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> },
  info: { text: 'text-slate-300', bg: 'bg-slate-900/60', border: 'border-slate-800', icon: <Info className="w-3.5 h-3.5 text-teal-400 shrink-0" /> },
  debug: { text: 'text-sky-300', bg: 'bg-sky-950/30', border: 'border-sky-800/40', icon: <Bug className="w-3.5 h-3.5 text-sky-400 shrink-0" /> }
};

const CATEGORY_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  ai_reasoning: { label: '🧠 Reasoning', bg: 'bg-purple-950/60 border-purple-800/60', text: 'text-purple-300' },
  speech_stt: { label: '🎙️ STT', bg: 'bg-teal-950/60 border-teal-800/60', text: 'text-teal-300' },
  audio: { label: '🔊 Audio', bg: 'bg-blue-950/60 border-blue-800/60', text: 'text-blue-300' },
  wake_word: { label: '⚡ Wake', bg: 'bg-amber-950/60 border-amber-800/60', text: 'text-amber-300' },
  tts_speech: { label: '🗣️ TTS', bg: 'bg-indigo-950/60 border-indigo-800/60', text: 'text-indigo-300' },
  google_sync: { label: '☁️ Google', bg: 'bg-emerald-950/60 border-emerald-800/60', text: 'text-emerald-300' },
  gemini_llm: { label: '🤖 Gemini', bg: 'bg-blue-950/60 border-blue-800/60', text: 'text-blue-300' },
  rag_vector: { label: '🔍 RAG', bg: 'bg-emerald-950/60 border-emerald-800/60', text: 'text-emerald-300' },
  vad_mic: { label: '🎙️ VAD', bg: 'bg-cyan-950/60 border-cyan-800/60', text: 'text-cyan-300' },
  state_machine: { label: '⚙️ State', bg: 'bg-orange-950/60 border-orange-800/60', text: 'text-orange-300' },
  system: { label: '⚙️ System', bg: 'bg-slate-900 border-slate-800', text: 'text-slate-400' }
};

export const LiveActivityLogPanel: React.FC<LiveActivityLogPanelProps> = ({ onClose, isSidePanel = false }) => {
  const { clearDialogueTurns, dialogueTurns } = useAssistant();
  const [activeTab, setActiveTab] = useState<'live' | 'archived'>('live');
  const [entries, setEntries] = useState<LogEntry[]>(() => logger.getEntries());
  const [archivedSessions, setArchivedSessions] = useState<ArchivedLogSession[]>(() => logger.getArchivedSessions());
  const [selectedArchive, setSelectedArchive] = useState<ArchivedLogSession | null>(null);
  
  const [filter, setFilter] = useState<'all' | 'debug' | 'ai_reasoning' | 'speech_stt' | 'audio' | 'gemini_llm' | 'error'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const logsEndRef = useRef<HTMLDivElement | null>(null);

  // Subscribe to real-time telemetry stream
  useEffect(() => {
    setEntries(logger.getEntries());
    const unsubscribe = logger.subscribe((newEntry) => {
      setEntries(prev => [newEntry, ...prev]);
    });
    return unsubscribe;
  }, []);

  // Auto-scroll to bottom of logs if autoScroll is enabled
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entries, autoScroll]);

  // Handle Starting a New Chat and Archiving Current Logs
  const handleNewChatAndArchive = () => {
    const title = dialogueTurns.length > 0
      ? `Chat: "${dialogueTurns[dialogueTurns.length - 1].text.slice(0, 30)}..." (${dialogueTurns.length} turns)`
      : `Chat Session — ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const archived = logger.archiveCurrentSession(title);
    setArchivedSessions(logger.getArchivedSessions());
    clearDialogueTurns();
    setEntries(logger.getEntries());
  };

  const copyLogs = () => {
    const targetLogs = selectedArchive ? selectedArchive.entries : entries;
    const text = targetLogs
      .map(e => `${new Date(e.ts).toLocaleTimeString()} [${e.level.toUpperCase()}] [${e.category.toUpperCase()}] ${e.msg}${e.details ? ' ' + JSON.stringify(e.details) : ''}`)
      .join('\n');

    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const currentDisplayLogs = selectedArchive 
    ? selectedArchive.entries 
    : entries;

  const filteredLogs = filter === 'all'
    ? currentDisplayLogs
    : filter === 'debug'
    ? currentDisplayLogs.filter(e => e.level === 'debug')
    : filter === 'error'
    ? currentDisplayLogs.filter(e => e.level === 'error')
    : currentDisplayLogs.filter(e => e.category === filter);

  return (
    <div className={`flex flex-col h-full bg-slate-950/95 backdrop-blur-md border-l border-slate-800 text-slate-100 ${isSidePanel ? 'w-full shadow-2xl' : 'rounded-3xl border shadow-2xl overflow-hidden'}`}>
      
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-slate-800/90 flex items-center justify-between bg-slate-900/70 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-teal-500/10 border border-teal-500/20 rounded-xl text-teal-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">Behind-the-Scenes Telemetry</h3>
              {activeTab === 'live' && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Session: {logger.getSessionId()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          {/* New Chat & Archive Button */}
          <button
            type="button"
            onClick={handleNewChatAndArchive}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/40 text-teal-300 text-[11px] font-semibold transition cursor-pointer active:scale-95 shadow-sm"
            title="Archive current session and start a new fresh chat"
          >
            <RotateCcw className="w-3 h-3 text-teal-400" />
            <span className="hidden sm:inline">New Chat & Archive</span>
          </button>

          {/* Copy Logs */}
          <button
            type="button"
            onClick={copyLogs}
            disabled={filteredLogs.length === 0}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition border border-slate-700 disabled:opacity-40 cursor-pointer"
            title="Copy logs to clipboard"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
          </button>

          {/* Close Panel */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              title="Close log inspector"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs Row: Live Stream vs Archived Sessions */}
      <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800/80 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center space-x-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab('live');
              setSelectedArchive(null);
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'live'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3 h-3 text-teal-400" />
            <span>Live Stream ({entries.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('archived');
              setArchivedSessions(logger.getArchivedSessions());
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'archived'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderArchive className="w-3 h-3 text-purple-400" />
            <span>Archived Chats ({archivedSessions.length})</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar">
          {([
            { id: 'all', label: 'All' },
            { id: 'debug', label: '🔍 Debug' },
            { id: 'ai_reasoning', label: '🧠 Brain' },
            { id: 'speech_stt', label: '🎙️ STT' },
            { id: 'audio', label: '🔊 Audio' },
            { id: 'gemini_llm', label: '🤖 Gemini' },
            { id: 'error', label: '❌ Error' }
          ] as const).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition border whitespace-nowrap cursor-pointer ${
                filter === f.id
                  ? 'bg-slate-800 text-teal-300 border-teal-500/40 font-bold'
                  : 'bg-slate-900/60 text-slate-500 border-slate-800 hover:text-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Logs View Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-xs custom-scrollbar">
        
        {/* Archived Sessions List (When in Archived Tab & no session selected) */}
        {activeTab === 'archived' && !selectedArchive && (
          <div className="space-y-2">
            <p className="text-[11px] text-slate-400 font-sans px-1">
              Select a previous conversation log archive to inspect what happened behind the scenes:
            </p>
            {archivedSessions.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                <FolderArchive className="w-8 h-8 mx-auto mb-2 opacity-40 text-purple-400" />
                <p>No archived chat sessions yet.</p>
                <p className="text-[10px] mt-1">Click "New Chat & Archive" anytime to archive your active session.</p>
              </div>
            ) : (
              archivedSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setSelectedArchive(session)}
                  className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition cursor-pointer flex items-center justify-between group shadow-sm"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-200 truncate group-hover:text-purple-300">
                        {session.title}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-950/60 text-purple-300 border border-purple-800/60">
                        {session.entryCount} events
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Archived: {new Date(session.archivedAt).toLocaleString()}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-300 transition-transform group-hover:translate-x-0.5 shrink-0" />
                </div>
              ))
            )}
          </div>
        )}

        {/* Viewing Selected Archive Header */}
        {activeTab === 'archived' && selectedArchive && (
          <div className="mb-2 p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400">Viewing Archived Session</span>
              <p className="text-xs font-bold text-slate-200 truncate">{selectedArchive.title}</p>
            </div>
            <button
              onClick={() => setSelectedArchive(null)}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition border border-slate-700"
            >
              ← Back to List
            </button>
          </div>
        )}

        {/* Live Stream / Archive Event Cards */}
        {(activeTab === 'live' || (activeTab === 'archived' && selectedArchive)) && (
          <>
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                <Terminal className="w-8 h-8 mx-auto mb-2 opacity-30 text-teal-400" />
                <p>No telemetry events matching filter.</p>
                <p className="text-[10px] mt-1 text-slate-600">Speak or chat with Eve to watch live cognitive events stream in real time.</p>
              </div>
            ) : (
              [...filteredLogs].reverse().map((entry) => {
                const style = LEVEL_STYLES[entry.level] || LEVEL_STYLES.info;
                const badge = CATEGORY_BADGES[entry.category] || CATEGORY_BADGES.system;
                const isExpanded = expandedId === entry.id;

                return (
                  <div
                    key={entry.id}
                    className={`p-2.5 rounded-xl border ${style.border} ${style.bg} transition-all duration-150 shadow-sm`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {style.icon}
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(entry.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}.{String(entry.ts % 1000).padStart(3, '0')}
                        </span>
                      </div>

                      {entry.details && (
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                          className="text-[9px] font-mono text-teal-400 hover:underline cursor-pointer"
                        >
                          {isExpanded ? 'Hide Payload [-]' : 'Payload [+]'}
                        </button>
                      )}
                    </div>

                    <p className={`text-xs mt-1.5 leading-relaxed font-sans ${style.text}`}>
                      {entry.msg}
                    </p>

                    {/* Detailed JSON Payload Drawer */}
                    {isExpanded && entry.details && (
                      <pre className="mt-2 p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[10px] text-teal-300/90 overflow-x-auto custom-scrollbar">
                        {JSON.stringify(entry.details, null, 2)}
                      </pre>
                    )}
                  </div>
                );
              })
            )}
            <div ref={logsEndRef} />
          </>
        )}
      </div>

      {/* Footer Status Bar */}
      <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-[10px] text-slate-400 font-mono shrink-0">
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
          <span>Active Session Buffer: {filteredLogs.length} events</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => {
              if (logsEndRef.current) {
                logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 transition text-[10px] border border-slate-700"
            title="Scroll directly to the newest telemetry event"
          >
            ⬇️ Latest Entry
          </button>

          {activeTab === 'live' && (
            <button
              type="button"
              onClick={() => logger.clear()}
              className="text-slate-500 hover:text-rose-400 transition cursor-pointer text-[10px]"
              title="Clear active live buffer"
            >
              Clear Buffer
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
