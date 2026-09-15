import { telemetry } from '../services/telemetryLogger';

export type JournalEntryType = 'morning_intention' | 'evening_debrief' | 'habit_checkin' | 'weekly_review';

export interface JournalEntry {
  id: string; // e.g. "journal_2026-09-14_evening_debrief"
  date: string; // YYYY-MM-DD
  type: JournalEntryType;
  completedItems: string[];
  openLoops: string[];
  wins: string[];
  energyScore: number; // 1 to 5
  executiveSummary: string;
  timestamp: number;
}

export interface HabitStreakStats {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
}

const DB_NAME = 'EveV2JournalDB';
const DB_VERSION = 1;
const STORE_NAME = 'journal_entries';

export class EveJournalStore {
  private inMemoryEntries: Map<string, JournalEntry> = new Map();
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.initIndexedDb();
  }

  private async initIndexedDb(): Promise<void> {
    if (typeof window === 'undefined' || !window.indexedDB) return;

    return new Promise((resolve) => {
      try {
        const req = window.indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (ev: any) => {
          const db = ev.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('date', 'date', { unique: false });
            store.createIndex('type', 'type', { unique: false });
            store.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };

        req.onsuccess = async (ev: any) => {
          this.db = ev.target.result;
          await this.loadAllFromDb();
          resolve();
        };

        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  private async loadAllFromDb(): Promise<void> {
    if (!this.db) return;
    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          if (Array.isArray(req.result)) {
            req.result.forEach(entry => this.inMemoryEntries.set(entry.id, entry));
          }
          resolve();
        };
        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  public async saveEntry(data: Omit<JournalEntry, 'id' | 'timestamp'> & { id?: string; timestamp?: number }): Promise<JournalEntry> {
    if (this.initPromise) await this.initPromise;

    const id = data.id || `journal_${data.date}_${data.type}`;
    const timestamp = data.timestamp || Date.now();
    const entry: JournalEntry = {
      ...data,
      id,
      timestamp,
    };

    this.inMemoryEntries.set(id, entry);

    if (this.db) {
      try {
        const tx = this.db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(entry);
      } catch (err) {
        telemetry.log('error', { source: 'EveJournalStore', message: String(err) });
      }
    }

    telemetry.log('event', { action: 'journal_entry_saved', id, date: entry.date, type: entry.type });
    return entry;
  }

  public async getEntryByDate(date: string, type?: JournalEntryType): Promise<JournalEntry | null> {
    if (this.initPromise) await this.initPromise;

    for (const entry of this.inMemoryEntries.values()) {
      if (entry.date === date && (!type || entry.type === type)) {
        return entry;
      }
    }
    return null;
  }

  public async getRecentEntries(limit: number = 7): Promise<JournalEntry[]> {
    if (this.initPromise) await this.initPromise;

    const entries = Array.from(this.inMemoryEntries.values())
      .sort((a, b) => b.timestamp - a.timestamp);
    return entries.slice(0, limit);
  }

  /**
   * Computes consecutive habit check-in streaks.
   */
  public async computeHabitStreak(todayDateStr?: string): Promise<HabitStreakStats> {
    if (this.initPromise) await this.initPromise;

    const uniqueDates = Array.from(new Set(
      Array.from(this.inMemoryEntries.values()).map(e => e.date)
    )).sort();

    if (uniqueDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0, lastActiveDate: null };
    }

    const lastActiveDate = uniqueDates[uniqueDates.length - 1];
    const today = todayDateStr || new Date().toISOString().slice(0, 10);

    // Calculate streaks by checking day differences
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < uniqueDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = new Date(uniqueDates[i - 1]).getTime();
        const curr = new Date(uniqueDates[i]).getTime();
        const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    }

    // Check if the current streak is active (today or yesterday active)
    const lastActiveMs = new Date(lastActiveDate).getTime();
    const todayMs = new Date(today).getTime();
    const daysSinceLast = Math.round((todayMs - lastActiveMs) / (1000 * 60 * 60 * 24));

    if (daysSinceLast <= 1) {
      currentStreak = tempStreak;
    } else {
      currentStreak = 0;
    }

    return {
      currentStreak,
      longestStreak,
      lastActiveDate,
    };
  }

  public async clear(): Promise<void> {
    this.inMemoryEntries.clear();
    if (this.db) {
      try {
        const tx = this.db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).clear();
      } catch {}
    }
  }
}

export const eveJournalStore = new EveJournalStore();
