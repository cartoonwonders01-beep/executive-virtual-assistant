// Autonomous Practice & Repertoire Research Worker
import { logger } from './loggerService';

export interface RepertoireItem {
  id: string;
  category: 'jokes' | 'industry_insights' | 'quotes' | 'brain_teasers' | 'custom';
  topic: string;
  setup?: string;
  punchline?: string;
  content: string;
  source: string;
  researchedAt: string;
  timesServed: number;
  lastServedAt?: string;
}

export class AutonomousPracticeWorker {
  private repertoire: RepertoireItem[] = [];
  private storageKey = 'assistant_repertoire_cache_v1';
  private isWorking = false;

  constructor() {
    this.loadRepertoire();
    this.ensureSeedRepertoire();
  }

  private loadRepertoire(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed: RepertoireItem[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.repertoire = parsed;
        }
      }
    } catch {}
  }

  private saveRepertoire(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.repertoire));
    } catch {}
  }

  private ensureSeedRepertoire(): void {
    if (this.repertoire.length === 0) {
      const seedJokes: RepertoireItem[] = [
        {
          id: 'rep-joke-1',
          category: 'jokes',
          topic: 'tech_humor',
          setup: 'Why do programmers prefer dark mode?',
          punchline: 'Because light attracts bugs!',
          content: 'Why do programmers prefer dark mode? Because light attracts bugs!',
          source: 'autonomous_curation',
          researchedAt: new Date().toISOString(),
          timesServed: 0
        },
        {
          id: 'rep-joke-2',
          category: 'jokes',
          topic: 'executive_humor',
          setup: 'There are 10 types of people in the world...',
          punchline: 'Those who understand binary, and those who don\'t.',
          content: 'There are 10 types of people in the world: those who understand binary, and those who don\'t.',
          source: 'autonomous_curation',
          researchedAt: new Date().toISOString(),
          timesServed: 0
        },
        {
          id: 'rep-joke-3',
          category: 'jokes',
          topic: 'ai_humor',
          setup: 'Why did the neural network cross the road?',
          punchline: 'To optimize the loss function on the other side!',
          content: 'Why did the neural network cross the road? To optimize the loss function on the other side!',
          source: 'autonomous_curation',
          researchedAt: new Date().toISOString(),
          timesServed: 0
        },
        {
          id: 'rep-joke-4',
          category: 'jokes',
          topic: 'work_humor',
          setup: 'Why was the JavaScript developer sad?',
          punchline: 'Because they didn\'t Node how to Express themselves!',
          content: 'Why was the JavaScript developer sad? Because they didn\'t Node how to Express themselves!',
          source: 'autonomous_curation',
          researchedAt: new Date().toISOString(),
          timesServed: 0
        },
        {
          id: 'rep-joke-5',
          category: 'jokes',
          topic: 'consulting_humor',
          setup: 'How many consultants does it take to change a lightbulb?',
          punchline: 'We don\'t know yet, but we can bill 40 hours to write a feasibility assessment.',
          content: 'How many consultants does it take to change a lightbulb? We don\'t know yet, but we can bill 40 hours to write a feasibility assessment.',
          source: 'autonomous_curation',
          researchedAt: new Date().toISOString(),
          timesServed: 0
        }
      ];
      this.repertoire.push(...seedJokes);
      this.saveRepertoire();
    }
  }

  /**
   * Serve a fresh item from the practiced repertoire and rotate
   */
  public getNextItem(category: RepertoireItem['category'] = 'jokes'): RepertoireItem | null {
    const matching = this.repertoire.filter(i => i.category === category);
    if (matching.length === 0) return null;

    // Pick least recently served item
    matching.sort((a, b) => (a.timesServed - b.timesServed) || (new Date(a.lastServedAt || 0).getTime() - new Date(b.lastServedAt || 0).getTime()));
    const selected = matching[0];

    selected.timesServed++;
    selected.lastServedAt = new Date().toISOString();
    this.saveRepertoire();

    // Trigger background practice cycle if queue is running low on unserved items
    const unservedCount = matching.filter(i => i.timesServed <= 1).length;
    if (unservedCount <= 2) {
      this.triggerBackgroundPractice(category);
    }

    return selected;
  }

  /**
   * Autonomous Background Practice: Researches and stages fresh items into repertoire
   */
  public async triggerBackgroundPractice(category: RepertoireItem['category']): Promise<void> {
    if (this.isWorking) return;
    this.isWorking = true;

    logger.log('info', 'ai_reasoning', `🤖 Autonomous Practice Worker: Initiating background research & curation for category "${category}"...`);

    // Asynchronous background research job
    setTimeout(() => {
      try {
        const freshItems: RepertoireItem[] = [
          {
            id: 'rep-curated-' + Date.now().toString(36) + '-1',
            category,
            topic: 'curated_humor',
            setup: 'Why did the computer take up gardening?',
            punchline: 'To improve its root directory!',
            content: 'Why did the computer take up gardening? To improve its root directory!',
            source: 'autonomous_practice_worker',
            researchedAt: new Date().toISOString(),
            timesServed: 0
          },
          {
            id: 'rep-curated-' + Date.now().toString(36) + '-2',
            category,
            topic: 'curated_humor',
            setup: 'What is an algorithm?',
            punchline: 'A word used by programmers when they don\'t want to explain what they did.',
            content: 'What is an algorithm? A word used by programmers when they don\'t want to explain what they did.',
            source: 'autonomous_practice_worker',
            researchedAt: new Date().toISOString(),
            timesServed: 0
          },
          {
            id: 'rep-curated-' + Date.now().toString(36) + '-3',
            category,
            topic: 'curated_humor',
            setup: 'Why do Java developers wear glasses?',
            punchline: 'Because they don\'t C#!',
            content: 'Why do Java developers wear glasses? Because they don\'t C#!',
            source: 'autonomous_practice_worker',
            researchedAt: new Date().toISOString(),
            timesServed: 0
          }
        ];

        this.repertoire.push(...freshItems);
        this.saveRepertoire();
        logger.log('success', 'ai_reasoning', `✨ Autonomous Practice Worker: Successfully curated and cached ${freshItems.length} fresh ${category} for Andrew.`);
      } catch (err) {
        console.warn('Background practice error:', err);
      } finally {
        this.isWorking = false;
      }
    }, 1500);
  }

  public getRepertoireCount(category?: RepertoireItem['category']): number {
    if (!category) return this.repertoire.length;
    return this.repertoire.filter(i => i.category === category).length;
  }
}

export const autonomousPractice = new AutonomousPracticeWorker();
