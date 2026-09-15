// Episodic & Semantic Memory Service for Eve Cognitive Operating System (Eve-COS)
// Captures past conversational episodes, extracted decisions, user preferences, and agreements
// Enables MemGPT-grade multi-turn cross-session recall and context continuity

import { logger } from './loggerService';

export interface EpisodicMemory {
  id: string;
  timestamp: string;
  topic: string;
  summary: string;
  decision?: string;
  keyEntities: string[];
  userStatement?: string;
  assistantResponse?: string;
  intent?: string;
  importance: number; // 1 to 5
  tags: string[];
}

const EPISODIC_STORAGE_KEY = 'assistant_episodic_memory_v1';
const MAX_EPISODIC_MEMORIES = 200;

export class EpisodicMemoryService {
  private static instance: EpisodicMemoryService;
  private memories: EpisodicMemory[] = [];

  private constructor() {
    this.loadFromStorage();
    this.ensureDefaultKnowledge();
  }

  public static getInstance(): EpisodicMemoryService {
    if (!EpisodicMemoryService.instance) {
      EpisodicMemoryService.instance = new EpisodicMemoryService();
    }
    return EpisodicMemoryService.instance;
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(EPISODIC_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.memories = parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load episodic memories from storage:', e);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(EPISODIC_STORAGE_KEY, JSON.stringify(this.memories.slice(0, MAX_EPISODIC_MEMORIES)));
    } catch (e) {
      console.warn('Failed to save episodic memories to storage:', e);
    }
  }

  private ensureDefaultKnowledge(): void {
    if (this.memories.length === 0) {
      const now = new Date().toISOString();
      const defaultDecisions: EpisodicMemory[] = [
        {
          id: 'ep-mem-residence',
          timestamp: now,
          topic: 'Primary Residence & Commute',
          summary: 'Andrew lives in Hoeilaart (postcode 1560), Belgium. Commutes to Brussels via S8 train line.',
          decision: 'Primary residence set to Hoeilaart (1560) with Groenendaal/Hoeilaart station hubs.',
          keyEntities: ['Hoeilaart', '1560', 'Brussels', 'S8 train', 'Groenendaal'],
          importance: 5,
          tags: ['residence', 'commute', 'location']
        },
        {
          id: 'ep-mem-family',
          timestamp: now,
          topic: 'Family Structure',
          summary: 'Andrew is married to Celine Loeuille. Children are Elizabeth, Alexander, Eleonore (Ellie), and Angelina.',
          decision: 'Emails and notes to Celine and children are prioritized with warm, affectionate tone.',
          keyEntities: ['Celine', 'Elizabeth', 'Alexander', 'Eleonore', 'Ellie', 'Angelina'],
          importance: 5,
          tags: ['family', 'contacts', 'vip']
        },
        {
          id: 'ep-mem-architecture',
          timestamp: now,
          topic: 'Execution Infrastructure & Sandbox VM',
          summary: 'Strict Zero-Host execution standard: 100% of testing, builds, and Cloudflare Pages deployments run in sandbox-vm.',
          decision: 'All commands and scripts execute on Parallels guest VM at 10.211.55.6.',
          keyEntities: ['sandbox-vm', 'Cloudflare Pages', 'Parallels', 'Zero-Host'],
          importance: 5,
          tags: ['infrastructure', 'architecture', 'sandbox']
        }
      ];

      this.memories = defaultDecisions;
      this.saveToStorage();
    }
  }

  /**
   * Adds a new structured episodic memory
   */
  public addMemory(memory: Partial<EpisodicMemory>): EpisodicMemory {
    const newRecord: EpisodicMemory = {
      id: memory.id || 'ep-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: memory.timestamp || new Date().toISOString(),
      topic: memory.topic || 'General Discussion',
      summary: memory.summary || '',
      decision: memory.decision,
      keyEntities: memory.keyEntities || [],
      userStatement: memory.userStatement,
      assistantResponse: memory.assistantResponse,
      intent: memory.intent || 'knowledge_qa',
      importance: memory.importance || 3,
      tags: memory.tags || []
    };

    // Deduplicate existing identical topic memories
    this.memories = this.memories.filter(m => m.topic.toLowerCase() !== newRecord.topic.toLowerCase() || (Date.now() - new Date(m.timestamp).getTime() > 3600000));
    this.memories.unshift(newRecord);
    if (this.memories.length > MAX_EPISODIC_MEMORIES) {
      this.memories.pop();
    }
    this.saveToStorage();

    logger.log('success', 'ai_reasoning', `🧠 Episodic Memory Recorded: [${newRecord.topic}] "${newRecord.summary.slice(0, 70)}..."`);
    return newRecord;
  }

  /**
   * Automatically extracts facts, decisions, or rules from a conversation turn
   */
  public extractMemoryFromTurn(userText: string, assistantResponse: string, intent: string = 'general_query'): EpisodicMemory | null {
    if (!userText || userText.trim().length < 5) return null;
    const lower = userText.toLowerCase().trim();

    // 1. Explicit user decision or agreement (e.g. "We decided to allocate 45k", "I agreed with David", "Let's commit to X")
    const decisionMatch = userText.match(/(?:we\s+decided\s+to|i\s+decided\s+to|let's\s+allocate|allocated|budget\s+is\s+set\s+to|agreed\s+to|agreed\s+on|committed\s+to)\s+(.+?)(?:\.|$)/i);
    if (decisionMatch) {
      const decisionContent = decisionMatch[1].trim();
      const topic = `Decision: ${decisionContent.slice(0, 30)}...`;
      return this.addMemory({
        topic,
        summary: `Andrew established: "${userText}"`,
        decision: decisionContent,
        userStatement: userText,
        assistantResponse,
        intent,
        importance: 4,
        tags: ['decision', 'strategy']
      });
    }

    // 2. Explicit memory storage ("Remember that...", "Note that...")
    const rememberMatch = userText.match(/(?:remember\s+that|note\s+that|don't\s+forget\s+that|save\s+to\s+memory|please\s+remember)\s+(.+?)(?:\.|$)/i);
    if (rememberMatch) {
      const fact = rememberMatch[1].trim();
      const topic = `Fact: ${fact.slice(0, 30)}...`;
      return this.addMemory({
        topic,
        summary: fact,
        userStatement: userText,
        assistantResponse,
        intent,
        importance: 5,
        tags: ['user_preference', 'explicit_memory']
      });
    }

    // 3. Meaningful high-substance factual query & resolution (>25 words)
    if (userText.split(/\s+/).length >= 5 && assistantResponse && assistantResponse.length > 50) {
      const topic = userText.length > 35 ? userText.slice(0, 32) + '...' : userText;
      return this.addMemory({
        topic,
        summary: assistantResponse.slice(0, 160) + '...',
        userStatement: userText,
        assistantResponse,
        intent,
        importance: 2,
        tags: ['discussion_history']
      });
    }

    return null;
  }

  /**
   * Hybrid keyword and entity search across episodic memory
   */
  public searchMemories(query: string, limit: number = 5): EpisodicMemory[] {
    const clean = query.toLowerCase().trim();
    if (!clean) return this.memories.slice(0, limit);

    const words = clean.split(/\s+/).filter(w => w.length > 2);

    const scored = this.memories.map(m => {
      let score = 0;
      const fullText = `${m.topic} ${m.summary} ${m.decision || ''} ${m.keyEntities.join(' ')} ${m.tags.join(' ')} ${m.userStatement || ''}`.toLowerCase();

      // Exact substring match
      if (fullText.includes(clean)) score += 10;

      // Word match scoring
      for (const word of words) {
        if (m.topic.toLowerCase().includes(word)) score += 5;
        if (m.decision?.toLowerCase().includes(word)) score += 4;
        if (m.keyEntities.some(e => e.toLowerCase().includes(word))) score += 4;
        if (m.summary.toLowerCase().includes(word)) score += 2;
        if (m.tags.some(t => t.toLowerCase().includes(word))) score += 2;
      }

      // Importance bias
      score += (m.importance || 1) * 0.5;

      return { memory: m, score };
    });

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.memory);
  }

  public getAllMemories(): EpisodicMemory[] {
    return [...this.memories];
  }

  public clear(): void {
    this.memories = [];
    this.saveToStorage();
    logger.log('info', 'ai_reasoning', 'Episodic memory store wiped.');
  }

  /**
   * Formats relevant memories into prompt markdown for Gemini context
   */
  public formatMemoriesForPrompt(memories: EpisodicMemory[]): string {
    if (!memories || memories.length === 0) return '';
    return `\nRELEVANT EPISODIC & HISTORICAL MEMORY (Recall past context):\n` +
      memories.map(m => `• [${m.topic}] ${m.summary}${m.decision ? ` (Decision: "${m.decision}")` : ''}`).join('\n') + '\n';
  }
}

export const episodicMemoryService = EpisodicMemoryService.getInstance();
