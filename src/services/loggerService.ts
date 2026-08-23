// Live Telemetry & Activity Logger for Eve Virtual Assistant
// Captures real-time audio states, wake word triggers, AI thinking, and execution logs
// Modeled on Relay PWA meeting logging engine with localStorage persistence

export type LogLevel = 'info' | 'success' | 'warn' | 'error';

export interface LogEntry {
  id: string;
  ts: number;
  level: LogLevel;
  category: 'audio' | 'wake_word' | 'speech_stt' | 'ai_reasoning' | 'tts_speech' | 'google_sync' | 'system';
  msg: string;
  details?: any;
}

type LogListener = (entry: LogEntry) => void;

const LOG_STORAGE_KEY = 'assistant_gui_logs';
const MAX_LOGS = 300;

function loadStoredLogs(): LogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOG_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_LOGS) : [];
  } catch {
    return [];
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
  private listeners: Set<LogListener> = new Set();

  constructor() {
    this.entries = loadStoredLogs();
    this.log('info', 'system', 'Eve Assistant Core Telemetry Engine initialized (Relay architecture sync active).');

    // Global uncaught error listener
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.log('error', 'system', `Uncaught runtime error: ${event.message}`, {
          filename: event.filename,
          lineno: event.lineno
        });
      });
      window.addEventListener('unhandledrejection', (event) => {
        this.log('error', 'system', `Unhandled Promise Rejection: ${event.reason?.message || event.reason}`);
      });
    }
  }

  public log(level: LogLevel, category: LogEntry['category'], msg: string, details?: any): void {
    const entry: LogEntry = {
      id: 'log-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5),
      ts: Date.now(),
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

  public getEntries(): LogEntry[] {
    return [...this.entries];
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
    this.log('info', 'system', 'Activity log cleared.');
  }
}

export const logger = new LoggerService();

