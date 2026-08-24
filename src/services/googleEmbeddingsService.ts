// Google Native Vector Embeddings & Semantic Search Engine
// Powered by Google text-embedding-004 (768-dimensional dense vectors)
// Runs with zero third-party vector DB retainers (100% Google Cloud / AI Studio ecosystem)

import { logger } from './loggerService';

export interface VectorRecord {
  id: string;
  text: string;
  category: 'family_roster' | 'executive_memory' | 'voice_memo' | 'task_context' | 'preference';
  vector: number[];
  metadata?: Record<string, any>;
  createdAt: string;
}

export class GoogleEmbeddingsService {
  private static instance: GoogleEmbeddingsService;
  private vectorStore: VectorRecord[] = [];
  private apiKey: string = '';

  private constructor() {
    this.loadApiKey();
    this.seedDefaultFamilyVectors();
  }

  public static getInstance(): GoogleEmbeddingsService {
    if (!GoogleEmbeddingsService.instance) {
      GoogleEmbeddingsService.instance = new GoogleEmbeddingsService();
    }
    return GoogleEmbeddingsService.instance;
  }

  private loadApiKey(): void {
    if (typeof window !== 'undefined') {
      this.apiKey = localStorage.getItem('assistant_gemini_key') || '';
    }
    if (!this.apiKey && typeof process !== 'undefined' && process.env.GEMINI_API_KEY) {
      this.apiKey = process.env.GEMINI_API_KEY;
    }
  }

  public setApiKey(key: string): void {
    this.apiKey = key;
  }

  /**
   * Generates a 768-dim dense embedding using Google text-embedding-004
   * Falls back to high-dimensional deterministic hashing if offline or unkeyed
   */
  public async generateEmbedding(text: string): Promise<number[]> {
    const clean = text.trim();
    if (!clean) return new Array(768).fill(0);

    if (this.apiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${this.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'models/text-embedding-004',
              content: {
                parts: [{ text: clean }]
              }
            })
          }
        );

        if (response.ok) {
          const data = await response.json() as { embedding?: { values?: number[] } };
          if (data.embedding?.values && data.embedding.values.length > 0) {
            return data.embedding.values;
          }
        }
      } catch (err) {
        logger.log('warn', 'system', `Google text-embedding-004 notice, utilizing semantic fallback: ${err}`);
      }
    }

    // High-entropy 768-dim semantic hash fallback
    return this.generateDeterministicSemanticVector(clean, 768);
  }

  /**
   * High-dimensional semantic feature projection fallback (TF-IDF & N-gram hashing)
   */
  private generateDeterministicSemanticVector(text: string, dimensions: number = 768): number[] {
    const vec = new Array(dimensions).fill(0);
    const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    const words = clean.split(/\s+/).filter(w => w.length > 0);
    const stopWords = new Set(['is', 'are', 'the', 'a', 'an', 'and', 'or', 'who', 'what', 'where', 'to', 'in', 'of', 'for', 'it', 'my']);

    for (const word of words) {
      const weight = stopWords.has(word) ? 0.2 : 3.0;
      let h1 = 5381;
      for (let i = 0; i < word.length; i++) {
        h1 = ((h1 << 5) + h1) ^ word.charCodeAt(i);
      }
      const idx1 = Math.abs(h1) % dimensions;
      vec[idx1] += weight;

      for (let i = 0; i <= word.length - 3; i++) {
        const trigram = word.substring(i, i + 3);
        let h2 = 0;
        for (let j = 0; j < trigram.length; j++) {
          h2 = ((h2 << 5) - h2) + trigram.charCodeAt(j);
        }
        const idx2 = Math.abs(h2) % dimensions;
        vec[idx2] += weight * 0.5;
      }
    }

    const magnitude = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vec.map(v => v / magnitude) : vec;
  }

  /**
   * Calculates cosine similarity between two vectors
   */
  public cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom > 0 ? dot / denom : 0;
  }

  /**
   * Stores a new memory vector in the Google memory substrate
   */
  public async storeMemory(
    text: string,
    category: VectorRecord['category'],
    metadata?: Record<string, any>
  ): Promise<VectorRecord> {
    const vector = await this.generateEmbedding(text);
    const record: VectorRecord = {
      id: 'vec-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5),
      text,
      category,
      vector,
      metadata,
      createdAt: new Date().toISOString()
    };
    this.vectorStore.unshift(record);
    return record;
  }

  /**
   * Performs semantic vector search over Google memory substrate
   */
  public async searchSemanticContext(query: string, topK: number = 3): Promise<{ record: VectorRecord; score: number }[]> {
    const queryVec = await this.generateEmbedding(query);
    const scored = this.vectorStore.map(record => ({
      record,
      score: this.cosineSimilarity(queryVec, record.vector)
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  /**
   * Pre-seeds Baxter family knowledge into the vector store
   */
  private async seedDefaultFamilyVectors(): Promise<void> {
    const defaultSeeds = [
      { text: 'Andrew Baxter is the founder and executive lead. User email is andy.j.baxter@gmail.com.', category: 'family_roster' as const },
      { text: 'Celine Loeuille is Andrew\'s wife and partner. Her email is celine.loeuille@gmail.com.', category: 'family_roster' as const },
      { text: 'Eleonore Baxter is Andrew\'s daughter (also known as Eleanor or Ellie). Her email is eleonore.a.baxter@gmail.com.', category: 'family_roster' as const },
      { text: 'Elizabeth Baxter is Andrew\'s daughter (also known as Eliza or Liz). Her email is elizabth.js.baxter@gmail.com.', category: 'family_roster' as const },
      { text: 'Alexander Baxter is Andrew\'s son (also known as Alex). His email is alexander.j.baxter@gmail.com.', category: 'family_roster' as const },
      { text: 'Angelina Baxter is Andrew\'s daughter (also known as Lina). Her email is angelina.c.baxter@gmail.com.', category: 'family_roster' as const }
    ];

    for (const seed of defaultSeeds) {
      const vec = this.generateDeterministicSemanticVector(seed.text, 768);
      this.vectorStore.push({
        id: 'seed-' + Math.random().toString(36).substring(2, 7),
        text: seed.text,
        category: seed.category,
        vector: vec,
        createdAt: '2026-08-24T00:00:00Z'
      });
    }
  }
}

export const googleEmbeddings = GoogleEmbeddingsService.getInstance();
