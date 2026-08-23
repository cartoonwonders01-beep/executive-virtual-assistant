// Live Telemetry & Activity Logger for Eve Virtual Assistant
// Captures real-time audio states, wake word triggers, AI thinking, and execution logs

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

class LoggerService {
  private entries: LogEntry[] = [];
  private listeners: Set<LogListener> = new Set();
  private maxLogs = 200;

  constructor() {
    this.log('info', 'system', 'Eve Assistant Core Telemetry Logger initialized.');
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
    if (this.entries.length > this.maxLogs) {
      this.entries.pop();
    }

    // Output to browser dev console
    const prefix = `[${category.toUpperCase()}]`;
    if (level === 'error') console.error(prefix, msg, details || '');
    else if (level === 'warn') console.warn(prefix, msg, details || '');
    else if (level === 'success') console.log(`%c${prefix} ${msg}`, 'color: #10b981; font-weight: bold;', details || '');
    else console.log(prefix, msg, details || '');

    // Notify UI listeners
    this.listeners.forEach(listener => {
      try {
        listener(entry);
      } catch (err) {
        console.error('Log listener error:', err);
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
    this.log('info', 'system', 'Activity log cleared.');
  }
}

export const logger = new LoggerService();
