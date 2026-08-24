// Relational Memory Graph Service for Long-Term Entity & Relationship Storage
import { logger } from './loggerService';

export interface RelationalEntity {
  id: string;
  userId: string;
  relationType: 'wife' | 'husband' | 'spouse' | 'child' | 'colleague' | 'manager' | 'client' | 'friend' | 'contact' | 'preference' | 'custom';
  entityName: string;
  aliases: string[];
  email?: string;
  phone?: string;
  company?: string;
  notes: string[];
  confidence: number; // 0.0 to 1.0
  firstLearnedAt: string;
  lastConfirmedAt: string;
  usageCount: number;
}

export class MemoryGraphService {
  private entities: Map<string, RelationalEntity> = new Map();
  private storageKey = 'assistant_memory_graph_v1';

  constructor() {
    this.loadFromStorage();
    this.ensureDefaultEntities();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed: RelationalEntity[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(e => this.entities.set(e.id, e));
        }
      }
    } catch (e) {
      console.warn('Failed to load memory graph from storage:', e);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const arr = Array.from(this.entities.values());
      localStorage.setItem(this.storageKey, JSON.stringify(arr));
    } catch (e) {
      console.warn('Failed to save memory graph to storage:', e);
    }
  }

  private ensureDefaultEntities(): void {
    if (this.entities.size === 0) {
      // Default initial profile relationships for Andrew
      const defaultWife: RelationalEntity = {
        id: 'rel-wife-celine',
        userId: 'andrew',
        relationType: 'wife',
        entityName: 'Celine Baxter',
        aliases: ['celine', 'my wife', 'wife', 'céline', 'partner'],
        email: 'celine.baxter@executive.co',
        phone: '+33 6 12 34 56 78',
        company: 'Executive Operations',
        notes: ['Wife of Andrew', 'Executive partner and Operations Lead'],
        confidence: 1.0,
        firstLearnedAt: new Date().toISOString(),
        lastConfirmedAt: new Date().toISOString(),
        usageCount: 5
      };

      const defaultColleague: RelationalEntity = {
        id: 'rel-colleague-sarah',
        userId: 'andrew',
        relationType: 'colleague',
        entityName: 'Sarah Chen',
        aliases: ['sarah', 'sarah chen', 'vp of product', 'product lead'],
        email: 'sarah.chen@innovate.co',
        phone: '+1 (555) 382-9901',
        company: 'Innovate AI Labs',
        notes: ['VP of Product', 'Prefers Slack for quick updates, Email for specs'],
        confidence: 1.0,
        firstLearnedAt: new Date().toISOString(),
        lastConfirmedAt: new Date().toISOString(),
        usageCount: 4
      };

      this.entities.set(defaultWife.id, defaultWife);
      this.entities.set(defaultColleague.id, defaultColleague);
      this.saveToStorage();
    }
  }

  /**
   * Find entity by relation type (e.g. 'wife', 'colleague') or alias / name
   */
  public findEntityByRelationOrAlias(relationOrAlias: string): RelationalEntity | null {
    const clean = relationOrAlias.toLowerCase().trim();
    if (!clean) return null;

    // 1. Direct relation match (e.g. 'wife', 'my wife')
    for (const entity of this.entities.values()) {
      if (clean === entity.relationType || clean === `my ${entity.relationType}`) {
        return entity;
      }
      if (entity.aliases.some(a => clean.includes(a) || a.includes(clean))) {
        return entity;
      }
      if (entity.entityName.toLowerCase().includes(clean)) {
        return entity;
      }
    }
    return null;
  }

  /**
   * Record or update an entity relationship in memory
   */
  public learnEntity(
    relationType: RelationalEntity['relationType'],
    entityName: string,
    email?: string,
    phone?: string,
    notes: string[] = []
  ): RelationalEntity {
    const existing = Array.from(this.entities.values()).find(
      e => e.relationType === relationType || e.entityName.toLowerCase() === entityName.toLowerCase()
    );

    const now = new Date().toISOString();

    if (existing) {
      existing.entityName = entityName;
      if (email) existing.email = email;
      if (phone) existing.phone = phone;
      if (!existing.aliases.includes(entityName.toLowerCase())) {
        existing.aliases.push(entityName.toLowerCase());
      }
      existing.notes = Array.from(new Set([...existing.notes, ...notes]));
      existing.lastConfirmedAt = now;
      existing.confidence = 1.0;
      existing.usageCount++;
      this.saveToStorage();
      logger.log('success', 'ai_reasoning', `🧠 Memory Graph: Updated entity [${existing.relationType}] "${existing.entityName}" (${email || 'no email'}).`);
      return existing;
    }

    const newId = 'rel-' + relationType + '-' + Date.now().toString(36);
    const newEntity: RelationalEntity = {
      id: newId,
      userId: 'andrew',
      relationType,
      entityName,
      aliases: [entityName.toLowerCase(), relationType, `my ${relationType}`],
      email,
      phone,
      notes,
      confidence: 1.0,
      firstLearnedAt: now,
      lastConfirmedAt: now,
      usageCount: 1
    };

    this.entities.set(newId, newEntity);
    this.saveToStorage();
    logger.log('success', 'ai_reasoning', `🧠 Memory Graph: Committed new entity [${relationType}] "${entityName}" to permanent memory.`);
    return newEntity;
  }

  public getAllEntities(): RelationalEntity[] {
    return Array.from(this.entities.values());
  }

  public deleteEntity(id: string): boolean {
    const res = this.entities.delete(id);
    this.saveToStorage();
    return res;
  }

  public clear(): void {
    this.entities.clear();
    this.saveToStorage();
  }
}

export const memoryGraph = new MemoryGraphService();
