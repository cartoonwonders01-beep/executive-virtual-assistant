import React, { useState, useEffect } from 'react';
import { logger, LogEntry, LogLevel } from '../services/loggerService';
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
  Filter
} from 'lucide-react';

interface ActivityLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const LEVEL_STYLES: Record<LogLevel, { text: string; bg: string; border: string; icon: React.ReactNode }> = {
  error: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: <XCircle className="w-3.5 h-3.5 text-red-400" /> },
  warn: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> },
  success: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> },
  info: { text: 'text-slate-300', bg: 'bg-slate-800/40', border: 'border-slate-800', icon: <Info className="w-3.5 h-3.5 text-slate-400" /> }
};

export const ActivityLogDrawer: React.FC<ActivityLogDrawerProps> = ({ isOpen, onClose }) => {
  const [entries, setEntries] = useState<LogEntry[]>(logger.getEntries());
  const [filter, setFilter] = useState<'all' | LogLevel>('all');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setEntries(logger.getEntries());
    const unsubscribe = logger.subscribe((newEntry) => {
      setEntries(prev => [newEntry, ...prev]);
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const visibleEntries = filter === 'all' ? entries : entries.filter(e => e.level === filter);

  const copyAll = () => {
    const text = entries
      .map(e => `${new Date(e.ts).toISOString()} [${e.level.toUpperCase()}] [${e.category.toUpperCase()}] ${e.msg}${e.details ? ' ' + JSON.stringify(e.details) : ''}`)
      .join('\n');
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const clearAll = () => {
    logger.clear();
    setEntries(logger.getEntries());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-brand-500/10 border border-brand-500/20 rounded-xl text-brand-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>GUI Activity & Diagnostic Log</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </h2>
              <p className="text-xs text-slate-400">Live telemetry for microphone, wake-word, AI thinking, and speech synthesis</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={copyAll}
              disabled={entries.length === 0}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition disabled:opacity-50"
              title="Copy all logs"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-brand-400" />}
              <span>{copied ? 'Copied!' : 'Copy Logs'}</span>
            </button>

            <button
              onClick={clearAll}
              disabled={entries.length === 0}
              className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 transition disabled:opacity-50"
              title="Clear logs"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
              title="Close log viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Pills Bar */}
        <div className="px-5 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-500 flex items-center gap-1 mr-1 text-[11px] font-semibold">
              <Filter className="w-3 h-3" />
              <span>Filter:</span>
            </span>
            {(['all', 'info', 'success', 'warn', 'error'] as const).map((lvl) => {
              const count = lvl === 'all' ? entries.length : entries.filter(e => e.level === lvl).length;
              return (
                <button
                  key={lvl}
                  onClick={() => setFilter(lvl)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition flex items-center gap-1.5 ${
                    filter === lvl
                      ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/20'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                  }`}
                >
                  <span className="capitalize">{lvl}</span>
                  {count > 0 && <span className="font-mono text-[10px] opacity-75">({count})</span>}
                </button>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            Total: {entries.length} events
          </div>
        </div>

        {/* Log Entries Container */}
        <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-2 bg-slate-950/90">
          {visibleEntries.length === 0 ? (
            <div className="py-16 text-center text-slate-600 space-y-2">
              <Terminal className="w-8 h-8 mx-auto text-slate-700" />
              <p>No activity logs recorded yet.</p>
              <p className="text-[11px]">Say "Hey Eve" or tap the mic to see live events streamed here.</p>
            </div>
          ) : (
            visibleEntries.map((entry) => {
              const style = LEVEL_STYLES[entry.level] || LEVEL_STYLES.info;
              const timeStr = new Date(entry.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 as any });
              
              const categoryBadge = {
                groq_whisper: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
                speech_stt: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
                ai_reasoning: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
                wake_word: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
                tts_speech: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
                audio: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                google_sync: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                system: 'bg-slate-800 text-slate-400 border-slate-700'
              }[entry.category] || 'bg-slate-800 text-slate-400 border-slate-700';

              return (
                <div
                  key={entry.id}
                  className={`p-2.5 rounded-xl border ${style.bg} ${style.border} flex items-start gap-2.5 leading-relaxed transition hover:border-slate-600`}
                >
                  <span className="shrink-0 mt-0.5">{style.icon}</span>
                  <span className="text-slate-500 text-[10px] shrink-0 tabular-nums font-mono">{timeStr}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 border ${categoryBadge}`}>
                    {entry.category.replace('_', ' ')}
                  </span>
                  <span className={`flex-1 min-w-0 break-words ${style.text}`}>
                    {entry.msg}
                    {entry.details && (
                      <pre className="mt-1.5 p-2 rounded-lg bg-slate-950 text-[10px] text-slate-300 overflow-x-auto border border-slate-800/90 font-mono">
                        {typeof entry.details === 'string' ? entry.details : JSON.stringify(entry.details, null, 2)}
                      </pre>
                    )}
                  </span>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
