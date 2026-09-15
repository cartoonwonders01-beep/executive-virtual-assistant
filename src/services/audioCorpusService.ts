// Persistent Audio Test Corpus & Recording Repository for Eve
// Utilizes IndexedDB for zero-RAM overhead storage of raw audio blobs and transcription telemetry

import { logger } from './loggerService';

export interface AudioTestRecord {
  id: string;
  timestamp: string;
  audioBlob: Blob;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number;
  transcript: string;
  sttProvider: string;
  sttLatencyMs: number;
  intent?: string;
  spokenResponse?: string;
  tags?: string[];
}

const DB_NAME = 'eve_audio_test_corpus_db';
const DB_VERSION = 1;
const STORE_NAME = 'recordings';

class AudioCorpusService {
  private dbPromise: Promise<IDBDatabase | null> | null = null;
  private isEnabled: boolean = true;

  constructor() {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('assistant_record_audio_corpus');
      this.isEnabled = stored !== 'false'; // Default enabled for testing
    }
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('assistant_record_audio_corpus', String(enabled));
      } catch {}
    }
  }

  public isCorpusEnabled(): boolean {
    return this.isEnabled;
  }

  private getDB(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.resolve(null);
    }
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve) => {
      try {
        const req = window.indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e: any) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };
        req.onsuccess = (e: any) => resolve(e.target.result);
        req.onerror = () => {
          console.warn('IndexedDB not available for audio corpus storage.');
          resolve(null);
        };
      } catch {
        resolve(null);
      }
    });

    return this.dbPromise;
  }

  /**
   * Saves a newly recorded audio utterance, transcript, and telemetry into IndexedDB
   */
  public async saveRecording(record: Omit<AudioTestRecord, 'id' | 'timestamp' | 'sizeBytes'>): Promise<AudioTestRecord | null> {
    if (!this.isEnabled) return null;
    const db = await this.getDB();
    if (!db) return null;

    const id = 'aud-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    const fullRecord: AudioTestRecord = {
      id,
      timestamp: new Date().toISOString(),
      sizeBytes: record.audioBlob.size,
      ...record
    };

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(fullRecord);
        req.onsuccess = () => {
          logger.log('info', 'audio', `💾 Saved audio test sample [${id}] (${Math.round(fullRecord.sizeBytes / 1024)} KB, "${record.transcript.substring(0, 30)}...")`);
          resolve(fullRecord);
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  /**
   * Retrieves all stored audio test records sorted newest first
   */
  public async getAllRecordings(): Promise<AudioTestRecord[]> {
    const db = await this.getDB();
    if (!db) return [];

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = (e: any) => {
          const records: AudioTestRecord[] = e.target.result || [];
          records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          resolve(records);
        };
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  /**
   * Retrieves a single audio recording by ID
   */
  public async getRecordingById(id: string): Promise<AudioTestRecord | null> {
    const db = await this.getDB();
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);
        req.onsuccess = (e: any) => resolve(e.target.result || null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  /**
   * Deletes a recording by ID
   */
  public async deleteRecording(id: string): Promise<boolean> {
    const db = await this.getDB();
    if (!db) return false;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  }

  /**
   * Clears the entire audio corpus
   */
  public async clearCorpus(): Promise<boolean> {
    const db = await this.getDB();
    if (!db) return false;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.clear();
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  }

  /**
   * Generates a playable ObjectURL for audio playback
   */
  public createAudioUrl(blob: Blob): string {
    return URL.createObjectURL(blob);
  }
}

export const audioCorpusService = new AudioCorpusService();
