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
      const nowStr = new Date().toISOString();
      
      // Default initial profile relationships for Andrew & Family
      const defaultWife: RelationalEntity = {
        id: 'rel-wife-celine',
        userId: 'andrew',
        relationType: 'wife',
        entityName: 'Celine Loeuille',
        aliases: ['celine', 'celine loeuille', 'celine baxter', 'my wife', 'wife', 'céline', 'partner'],
        email: 'celine.loeuille@gmail.com',
        phone: '+33 6 12 34 56 78',
        company: 'Executive Operations',
        notes: ['Wife of Andrew', 'Executive partner and Operations Lead'],
        confidence: 1.0,
        firstLearnedAt: nowStr,
        lastConfirmedAt: nowStr,
        usageCount: 10
      };

      const defaultElizabeth: RelationalEntity = {
        id: 'rel-child-elizabeth',
        userId: 'andrew',
        relationType: 'child',
        entityName: 'Elizabeth Baxter',
        aliases: ['elizabeth', 'eliza', 'elizabth', 'liz', 'lizzie', 'daughter elizabeth', 'my daughter', 'my daughter elizabeth'],
        email: 'elizabth.js.baxter@gmail.com',
        phone: '+33 6 22 33 44 55',
        notes: ['Daughter of Andrew and Celine'],
        confidence: 1.0,
        firstLearnedAt: nowStr,
        lastConfirmedAt: nowStr,
        usageCount: 5
      };

      const defaultAlexander: RelationalEntity = {
        id: 'rel-child-alexander',
        userId: 'andrew',
        relationType: 'child',
        entityName: 'Alexander Baxter',
        aliases: ['alexander', 'alex', 'alec', 'xander', 'son alexander', 'my son', 'my son alexander'],
        email: 'alexander.j.baxter@gmail.com',
        phone: '+33 6 33 44 55 66',
        notes: ['Son of Andrew and Celine'],
        confidence: 1.0,
        firstLearnedAt: nowStr,
        lastConfirmedAt: nowStr,
        usageCount: 5
      };

      const defaultEleonore: RelationalEntity = {
        id: 'rel-child-eleonore',
        userId: 'andrew',
        relationType: 'child',
        entityName: 'Eleonore Baxter',
        aliases: ['eleonore', 'eléonore', 'eleanor', 'ellie', 'elinor', 'eli', 'daughter eleonore', 'daughter ellie', 'daughter eleanor', 'my daughter eleonore', 'my daughter ellie'],
        email: 'eleonore.a.baxter@gmail.com',
        phone: '+33 6 44 55 66 77',
        notes: ['Daughter of Andrew and Celine'],
        confidence: 1.0,
        firstLearnedAt: nowStr,
        lastConfirmedAt: nowStr,
        usageCount: 5
      };

      const defaultAngelina: RelationalEntity = {
        id: 'rel-child-angelina',
        userId: 'andrew',
        relationType: 'child',
        entityName: 'Angelina Baxter',
        aliases: ['angelina', 'lina', 'angie', 'angel', 'daughter angelina', 'daughter lina', 'my daughter angelina'],
        email: 'angelina.c.baxter@gmail.com',
        phone: '+33 6 55 66 77 88',
        notes: ['Daughter of Andrew and Celine'],
        confidence: 1.0,
        firstLearnedAt: nowStr,
        lastConfirmedAt: nowStr,
        usageCount: 5
      };

      const defaultHome: RelationalEntity = {
        id: 'rel-preference-home',
        userId: 'andrew',
        relationType: 'preference',
        entityName: 'Hoeilaart, Belgium (Postcode 1560)',
        aliases: ['hoeilaart', '1560', 'home', 'residence', 'my home', 'where i live', 'where we live', 'my house', 'house', 'living in'],
        notes: ['Primary Residence: Hoeilaart (1560), Flemish Brabant, Belgium next to Sonian Forest. Commuter stations: Hoeilaart & Groenendaal.'],
        confidence: 1.0,
        firstLearnedAt: nowStr,
        lastConfirmedAt: nowStr,
        usageCount: 15
      };

      this.entities.set(defaultWife.id, defaultWife);
      this.entities.set(defaultElizabeth.id, defaultElizabeth);
      this.entities.set(defaultAlexander.id, defaultAlexander);
      this.entities.set(defaultEleonore.id, defaultEleonore);
      this.entities.set(defaultAngelina.id, defaultAngelina);
      this.entities.set(defaultHome.id, defaultHome);
      this.saveToStorage();
    }
  }

  /**
   * Gets user's confirmed primary residence
   */
  public getHomeLocation(): string {
    const home = this.entities.get('rel-preference-home') || this.findEntityByRelationOrAlias('home');
    return home?.entityName || 'Hoeilaart, Belgium (Postcode 1560)';
  }

  /**
   * Sets and persists updated home location
   */
  public setHomeLocation(location: string): void {
    const nowStr = new Date().toISOString();
    const existing = this.entities.get('rel-preference-home') || {
      id: 'rel-preference-home',
      userId: 'andrew',
      relationType: 'preference' as const,
      aliases: ['hoeilaart', '1560', 'home', 'residence', 'my home', 'where i live'],
      notes: [],
      confidence: 1.0,
      firstLearnedAt: nowStr,
      lastConfirmedAt: nowStr,
      usageCount: 1
    };

    const updated: RelationalEntity = {
      ...existing,
      entityName: location,
      lastConfirmedAt: nowStr,
      usageCount: (existing.usageCount || 0) + 1,
      notes: [`Updated home residence: ${location}`]
    };

    this.entities.set('rel-preference-home', updated);
    this.saveToStorage();
    logger.log('success', 'ai_reasoning', `🏡 Relational Memory: Updated primary residence to "${location}".`);
  }

  /**
   * Dynamically learns residence or relationships from free-form user speech
   */
  public learnFromUtterance(text: string): { learned: boolean; message?: string } {
    const lower = text.toLowerCase();
    
    // Check if user is stating where they live
    const liveMatch = lower.match(/(?:i\s+live\s+in|i'm\s+living\s+in|my\s+home\s+is\s+in|we\s+live\s+in|reside\s+in)\s+([a-z0-9\s,.-]+?)(?:\s+now|\.|\?|$)/i);
    if (liveMatch && liveMatch[1]) {
      const loc = liveMatch[1].trim();
      if (loc.length > 2 && !/where|how|what/i.test(loc)) {
        const formattedLoc = loc.charAt(0).toUpperCase() + loc.slice(1);
        this.setHomeLocation(formattedLoc);
        return {
          learned: true,
          message: `Got it Andrew, I have updated your primary residence to ${formattedLoc}.`
        };
      }
    }

    return { learned: false };
  }

  /**
   * Find entity by relation type (e.g. 'wife', 'colleague') or alias / name
   */
  public findEntityByRelationOrAlias(relationOrAlias: string): RelationalEntity | null {
    const clean = relationOrAlias.toLowerCase().trim();
    if (!clean) return null;

    // 1. Direct relation match (e.g. 'wife', 'my wife', 'son', 'daughter')
    for (const entity of this.entities.values()) {
      if (clean === entity.relationType || clean === `my ${entity.relationType}`) {
        return entity;
      }
    }

    // 2. Exact name or exact alias match
    for (const entity of this.entities.values()) {
      if (entity.entityName.toLowerCase() === clean || entity.aliases.some(a => a === clean)) {
        return entity;
      }
    }

    // 3. Whole word alias match or multi-word phrase containment
    const cleanWords = clean.split(/\s+/);
    for (const entity of this.entities.values()) {
      if (entity.aliases.some(a => {
        if (a.includes(' ')) {
          return clean.includes(a) || a.includes(clean);
        }
        return cleanWords.includes(a) || new RegExp(`\\b${a}\\b`, 'i').test(clean);
      })) {
        return entity;
      }
      if (new RegExp(`\\b${entity.entityName.toLowerCase()}\\b`, 'i').test(clean)) {
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

  public getExecutiveRelationships(): RelationalEntity[] {
    return this.getAllEntities().filter(e => e.relationType === 'wife' || e.relationType === 'child' || e.relationType === 'spouse');
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
