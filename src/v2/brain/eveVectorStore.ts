export interface VectorItem {
  id: string;
  type: 'task' | 'memory' | 'person' | 'preference' | 'decision';
  text: string;
  embedding: number[];
  metadata: Record<string, any>;
  timestamp: number;
}

import { indexedDbMemory } from './indexedDbStorage';
import { computeDenseEmbedding, EMBEDDING_DIMENSION } from '../workers/embeddingWorker';

const STORAGE_KEY = 'eve_v2_vector_memories';

export class EveVectorStore {
  private items: VectorItem[] = [];
  private worker: Worker | null = null;
  private workerCallbacks: Map<string, (vec: number[]) => void> = new Map();

  constructor() {
    this.loadFromStorage();
    this.warmupFromIndexedDb();
    this.initWorker();
  }

  private initWorker(): void {
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      try {
        this.worker = new Worker(
          new URL('../workers/embeddingWorker.ts', import.meta.url),
          { type: 'module' }
        );
        this.worker.onmessage = (e: MessageEvent) => {
          const { id, embedding } = e.data;
          const cb = this.workerCallbacks.get(id);
          if (cb) {
            this.workerCallbacks.delete(id);
            cb(embedding);
          }
        };
      } catch {
        this.worker = null;
      }
    }
  }

  public async computeEmbeddingAsync(text: string): Promise<number[]> {
    if (this.worker) {
      return new Promise((resolve) => {
        const id = 'emb-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
        this.workerCallbacks.set(id, resolve);
        this.worker!.postMessage({ id, text });
        // 500ms safety timeout to fallback to direct sync computation
        setTimeout(() => {
          if (this.workerCallbacks.has(id)) {
            this.workerCallbacks.delete(id);
            resolve(computeDenseEmbedding(text));
          }
        }, 500);
      });
    }
    return computeDenseEmbedding(text);
  }

  private loadFromStorage(): void {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.items = JSON.parse(stored);
        }
      }
    } catch (e) {
      this.items = [];
    }
  }

  private async warmupFromIndexedDb(): Promise<void> {
    try {
      const dbItems = await indexedDbMemory.getAllItems();
      if (dbItems && dbItems.length > 0) {
        const itemMap = new Map<string, VectorItem>();
        for (const item of this.items) itemMap.set(item.id, item);
        for (const item of dbItems) itemMap.set(item.id, item);
        this.items = Array.from(itemMap.values());
      }
    } catch {}
  }

  private saveToStorage(): void {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const recent = this.items.slice(-200);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
      }
    } catch {}
  }

  public async addItem(
    type: VectorItem['type'], 
    text: string, 
    metadata: Record<string, any> = {}
  ): Promise<VectorItem> {
    const existing = this.items.find(i => i.text.toLowerCase().trim() === text.toLowerCase().trim());
    if (existing) {
      existing.timestamp = Date.now();
      existing.metadata = { ...existing.metadata, ...metadata };
      this.saveToStorage();
      return existing;
    }

    const embedding = await this.computeEmbeddingAsync(text);
    const item: VectorItem = {
      id: crypto.randomUUID(),
      type,
      text,
      embedding,
      metadata,
      timestamp: Date.now()
    };
    
    this.items.push(item);
    this.saveToStorage();
    indexedDbMemory.saveItem(item).catch(() => {});
    return item;
  }

  /**
   * Hybrid retrieval combining 384-dim dense cosine similarity with keyword token overlap
   */
  public search(query: string, limit: number = 5): Array<{ item: VectorItem; score: number }> {
    if (!query || this.items.length === 0) return [];
    
    const queryVec = computeDenseEmbedding(query);
    const queryTokens = new Set(query.toLowerCase().split(/\W+/).filter(t => t.length > 2));
    
    const scored = this.items.map(item => {
      const vectorScore = this.computeCosineSimilarity(queryVec, item.embedding);
      
      let keywordBoost = 0;
      const itemTokens = item.text.toLowerCase().split(/\W+/);
      for (const t of itemTokens) {
        if (queryTokens.has(t)) keywordBoost += 0.08;
      }

      const compositeScore = vectorScore + Math.min(keywordBoost, 0.4);
      return { item, score: compositeScore };
    });

    return scored
      .filter(s => s.score > 0.25)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  public getMemoriesCount(): number {
    return this.items.length;
  }

  public getAllMemories(): VectorItem[] {
    return [...this.items];
  }

  public clearAll(): void {
    this.items = [];
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  public computeCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export const eveVectorStore = new EveVectorStore();
