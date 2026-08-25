// Live Telemetry & Activity Logger for Eve Virtual Assistant
// Captures real-time audio states, wake word triggers, AI thinking, and execution logs
// Modeled on Relay PWA meeting logging engine with localStorage persistence

export type LogLevel = 'info' | 'success' | 'warn' | 'error' | 'debug';

export type LogCategory = 
  | 'audio' 
  | 'wake_word' 
  | 'speech_stt' 
  | 'groq_whisper' 
  | 'ai_reasoning' 
  | 'tts_speech' 
  | 'google_sync' 
  | 'system'
  | 'rag_vector'
  | 'gemini_llm'
  | 'vad_mic'
  | 'state_machine';

export interface LogEntry {
  id: string;
  ts: number;
  sessionId: string;
  userId: string;
  level: LogLevel;
  category: LogCategory;
  msg: string;
  details?: any;
}

export interface HourlyLogSummary {
  hourTimestamp: string;
  sessionId: string;
  userId: string;
  totalEntries: number;
  speechTurns: number;
  aiDecisions: number;
  errorsCount: number;
  warningsCount: number;
  averageLatencyMs: number;
  topEvents: string[];
}

export interface ArchivedLogSession {
  id: string;
  sessionId: string;
  title: string;
  startedAt: string;
  archivedAt: string;
  entryCount: number;
  entries: LogEntry[];
}

type LogListener = (entry: LogEntry) => void;

const LOG_STORAGE_KEY = 'assistant_gui_logs';
const LOG_ARCHIVE_KEY = 'assistant_logs_archive';
const SESSIONS_ARCHIVE_KEY = 'assistant_archived_sessions';
const MAX_LOGS = 500;
const ONE_HOUR_MS = 60 * 60 * 1000;

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') return 'session-server';
  try {
    let sid = sessionStorage.getItem('assistant_session_id');
    if (!sid) {
      sid = 'session-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
      sessionStorage.setItem('assistant_session_id', sid);
    }
    return sid;
  } catch {
    return 'session-fallback';
  }
}

function loadStoredLogs(currentSessionId: string): { currentEntries: LogEntry[]; pastSessionArchives: ArchivedLogSession[] } {
  if (typeof window === 'undefined') return { currentEntries: [], pastSessionArchives: [] };
  try {
    const raw = localStorage.getItem(LOG_STORAGE_KEY);
    if (!raw) return { currentEntries: [], pastSessionArchives: [] };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { currentEntries: [], pastSessionArchives: [] };

    // Separate logs belonging to the active session vs historical sessions
    const currentEntries = parsed.filter((e: LogEntry) => e.sessionId === currentSessionId);
    const pastEntries = parsed.filter((e: LogEntry) => e.sessionId !== currentSessionId);

    const pastSessionArchives: ArchivedLogSession[] = [];
    if (pastEntries.length > 0) {
      // Group past entries by sessionId
      const grouped: Record<string, LogEntry[]> = {};
      for (const e of pastEntries) {
        const sid = e.sessionId || 'session-legacy';
        if (!grouped[sid]) grouped[sid] = [];
        grouped[sid].push(e);
      }

      for (const [sid, grp] of Object.entries(grouped)) {
        if (grp.length > 0) {
          pastSessionArchives.push({
            id: 'arch-' + sid,
            sessionId: sid,
            title: `Archived Session — ${new Date(grp[0].ts).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}`,
            startedAt: new Date(grp[grp.length - 1].ts).toISOString(),
            archivedAt: new Date(grp[0].ts).toISOString(),
            entryCount: grp.length,
            entries: grp
          });
        }
      }
    }

    return { currentEntries, pastSessionArchives };
  } catch {
    return { currentEntries: [], pastSessionArchives: [] };
  }
}

function saveStoredLogs(entries: LogEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_LOGS)));
  } catch {}
}

class LoggerService {
  private entries: LogEntry[] = [];
  private archivedSessions: ArchivedLogSession[] = [];
  private listeners: Set<LogListener> = new Set();
  private sessionId: string;
  private userId: string = 'andrew';

  constructor() {
    this.sessionId = getOrCreateSessionId();
    this.loadArchivedSessions();
    const { currentEntries, pastSessionArchives } = loadStoredLogs(this.sessionId);
    this.entries = currentEntries;

    // Merge auto-archived past sessions into archivedSessions
    if (pastSessionArchives.length > 0) {
      const existingIds = new Set(this.archivedSessions.map(s => s.sessionId));
      for (const arch of pastSessionArchives) {
        if (!existingIds.has(arch.sessionId)) {
          this.archivedSessions.push(arch);
        }
      }
      this.archivedSessions = this.archivedSessions.slice(0, 50);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(SESSIONS_ARCHIVE_KEY, JSON.stringify(this.archivedSessions));
        } catch {}
      }
    }

    saveStoredLogs(this.entries);
    this.curateHourlyLogs();
    this.log('info', 'system', `✨ Eve Assistant Telemetry initialized for user [${this.userId}] (Active Session: ${this.sessionId}).`);

    // Global uncaught error listener
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('error', (event) => {
        this.log('error', 'system', `Uncaught runtime error: ${event.message}`, {
          filename: event.filename,
          lineno: event.lineno
        });
      });
      window.addEventListener('unhandledrejection', (event) => {
        this.log('error', 'system', `Unhandled Promise Rejection: ${event.reason?.message || event.reason}`);
      });

      // Auto-curate every 15 minutes
      const curateTimer = setInterval(() => {
        this.curateHourlyLogs();
      }, 15 * 60 * 1000);
      if (typeof (curateTimer as any)?.unref === 'function') {
        (curateTimer as any).unref();
      }
    }
  }

  private loadArchivedSessions(): void {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(SESSIONS_ARCHIVE_KEY);
        if (raw) {
          this.archivedSessions = JSON.parse(raw);
        }
      } catch {}
    }
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public setUserId(uid: string): void {
    this.userId = uid;
  }

  public log(level: LogLevel, category: LogCategory, msg: string, details?: any): void {
    // Deduplicate & throttle rapid interim STT entries to prevent log flooding
    if (category === 'speech_stt' && level === 'info' && this.entries.length > 0) {
      const top = this.entries[0];
      if (top.category === 'speech_stt' && top.level === 'info' && (Date.now() - top.ts < 1800)) {
        top.msg = msg;
        top.ts = Date.now();
        top.details = details;
        saveStoredLogs(this.entries);
        this.listeners.forEach(listener => {
          try { listener(top); } catch {}
        });
        return;
      }
    }

    const entry: LogEntry = {
      id: 'log-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5),
      ts: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      level,
      category,
      msg,
      details
    };

    this.entries.unshift(entry);
    if (this.entries.length > MAX_LOGS) {
      this.entries.pop();
    }
    saveStoredLogs(this.entries);

    // Dev console mirroring
    const prefix = `[${category.toUpperCase()}]`;
    if (level === 'error') console.error(prefix, msg, details || '');
    else if (level === 'warn') console.warn(prefix, msg, details || '');
    else if (level === 'success') console.log(`%c${prefix} ${msg}`, 'color: #10b981; font-weight: bold;', details || '');
    else if (level === 'debug') console.log(`%c${prefix} ${msg}`, 'color: #38bdf8; font-style: italic;', details || '');
    else console.log(prefix, msg, details || '');

    // Notify UI subscribers
    this.listeners.forEach(listener => {
      try {
        listener(entry);
      } catch (err) {
        console.error('Log listener callback error:', err);
      }
    });
  }

  public debug(category: LogCategory, msg: string, details?: any): void {
    this.log('debug', category, msg, details);
  }

  /**
   * Curates logs into rolling hourly windows and archives older records
   */
  public curateHourlyLogs(): HourlyLogSummary {
    const now = Date.now();
    const cutoff = now - ONE_HOUR_MS;
    const currentHourEntries = this.entries.filter(e => e.ts >= cutoff);
    const olderEntries = this.entries.filter(e => e.ts < cutoff);

    // Archive older entries
    if (olderEntries.length > 0 && typeof window !== 'undefined') {
      try {
        const rawArchive = localStorage.getItem(LOG_ARCHIVE_KEY);
        const existingArchive = rawArchive ? JSON.parse(rawArchive) : [];
        const updatedArchive = [...olderEntries, ...existingArchive].slice(0, 1000);
        localStorage.setItem(LOG_ARCHIVE_KEY, JSON.stringify(updatedArchive));
      } catch {}
    }

    // Keep active buffer trimmed to the most recent 1-hour + 100 buffer items
    this.entries = this.entries.slice(0, Math.max(currentHourEntries.length, 100));
    saveStoredLogs(this.entries);

    const speechTurns = currentHourEntries.filter(e => e.category === 'speech_stt').length;
    const aiDecisions = currentHourEntries.filter(e => e.category === 'ai_reasoning').length;
    const errorsCount = currentHourEntries.filter(e => e.level === 'error').length;
    const warningsCount = currentHourEntries.filter(e => e.level === 'warn').length;

    return {
      hourTimestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      totalEntries: currentHourEntries.length,
      speechTurns,
      aiDecisions,
      errorsCount,
      warningsCount,
      averageLatencyMs: 85,
      topEvents: currentHourEntries.slice(0, 5).map(e => `[${e.category}] ${e.msg}`)
    };
  }

  public getEntries(): LogEntry[] {
    return [...this.entries];
  }

  public exportCleanLogsAsText(): string {
    return this.entries
      .map(e => `${new Date(e.ts).toISOString()} [${e.level.toUpperCase()}] [${e.category.toUpperCase()}] ${e.msg}`)
      .join('\n');
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public clear(): void {
    this.entries = [];
    saveStoredLogs([]);
    this.log('info', 'system', 'Activity log cleared for current session.');
  }

  /**
   * Archives current session log entries and starts a brand new fresh session log
   */
  public archiveCurrentSession(title?: string): ArchivedLogSession {
    const archiveId = 'arch-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    const sessionRecord: ArchivedLogSession = {
      id: archiveId,
      sessionId: this.sessionId,
      title: title || `Chat Session — ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      startedAt: this.entries.length > 0 ? new Date(this.entries[this.entries.length - 1].ts).toISOString() : new Date().toISOString(),
      archivedAt: new Date().toISOString(),
      entryCount: this.entries.length,
      entries: [...this.entries]
    };

    this.archivedSessions = [sessionRecord, ...this.archivedSessions].slice(0, 50);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SESSIONS_ARCHIVE_KEY, JSON.stringify(this.archivedSessions));
      } catch {}
    }

    // Start brand new session
    this.sessionId = 'session-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem('assistant_session_id', this.sessionId);
      } catch {}
    }
    this.entries = [];
    saveStoredLogs([]);
    this.log('info', 'system', `✨ New chat session started (Session: ${this.sessionId}). Previous session archived (${sessionRecord.entryCount} logs).`);

    return sessionRecord;
  }

  public getArchivedSessions(): ArchivedLogSession[] {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(SESSIONS_ARCHIVE_KEY);
        if (raw) {
          this.archivedSessions = JSON.parse(raw);
        }
      } catch {}
    }
    return [...this.archivedSessions];
  }

  public deleteArchivedSession(id: string): void {
    this.archivedSessions = this.archivedSessions.filter(s => s.id !== id);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SESSIONS_ARCHIVE_KEY, JSON.stringify(this.archivedSessions));
      } catch {}
    }
  }

  public clearAllArchivedSessions(): void {
    this.archivedSessions = [];
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(SESSIONS_ARCHIVE_KEY);
      } catch {}
    }
  }

  /**
   * Complete reset: Wipes all historical logs, archived sessions, and creates a fresh session
   */
  public clearAllStorage(): void {
    this.entries = [];
    this.archivedSessions = [];
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(LOG_STORAGE_KEY);
        localStorage.removeItem(LOG_ARCHIVE_KEY);
        localStorage.removeItem(SESSIONS_ARCHIVE_KEY);
        sessionStorage.removeItem('assistant_session_id');
      } catch {}
    }
    this.sessionId = 'session-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    this.log('info', 'system', `✨ Complete reset: All historical logs wiped. Fresh active session started (${this.sessionId}).`);
  }
}

export const logger = new LoggerService();

