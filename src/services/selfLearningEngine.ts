// Autonomous Self-Learning & Skill Acquisition Engine for Eve
// Empowers Eve to learn routines on the fly, retain persistent user facts, and continuously improve

import { CustomSkill, SkillStep, TaskItem } from '../types';

export interface LearnedInsight {
  id: string;
  topic: string;
  insight: string;
  confidenceScore: number;
  source: 'voice_interaction' | 'execution_telemetry' | 'autonomous_reflection' | 'user_explicit_memory' | 'feedback_adjustment';
  learnedAt: string;
}

export class SelfLearningEngine {
  private insights: LearnedInsight[] = [
    {
      id: 'ins-1',
      topic: 'VIP Communication Protocol',
      insight: 'Emails to Emily (wife) require immediate high-priority dispatch with loving, warm tone.',
      confidenceScore: 0.98,
      source: 'voice_interaction',
      learnedAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'ins-2',
      topic: 'Morning Deep Work Optimization',
      insight: 'Andrew performs highest cognitive tasks between 08:30 AM and 10:00 AM; protect from meetings.',
      confidenceScore: 0.95,
      source: 'autonomous_reflection',
      learnedAt: new Date(Date.now() - 43200000).toISOString()
    },
    {
      id: 'ins-3',
      topic: 'Cloudflare & VM Execution Pipeline',
      insight: 'Always run 100% of tests in sandbox-vm before deploying to Cloudflare Pages edge.',
      confidenceScore: 0.99,
      source: 'execution_telemetry',
      learnedAt: new Date().toISOString()
    }
  ];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('assistant_learned_insights');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.insights = parsed;
          }
        }
      } catch {}
    }
  }

  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('assistant_learned_insights', JSON.stringify(this.insights));
      } catch {}
    }
  }

  /**
   * Detects if the user is giving an explicit instruction to remember a fact or preference
   */
  public isMemoryInstruction(text: string): boolean {
    const lower = text.toLowerCase().trim().replace(/^(?:(?:hey|hello|hi)?\s*eve\s*[,:]?\s*)/i, '');
    return /^(remember\s+that|note\s+that|don't\s+forget\s+that|save\s+to\s+memory|merk\s+dir|behalte\s+im\s+gedächtnis|rappelle-toi\s+que|note\s+que|recuerda\s+que|anota\s+que|ricorda\s+che|onthoud\s+dat|zapamiętaj\s+że|lembre-se\s+que)\b/i.test(lower)
      || /\b(please\s+remember|bitte\s+merk\s+dir|n'oublie\s+pas)\b/i.test(lower);
  }

  /**
   * Extracts and stores an explicit user memory
   */
  public extractAndSaveMemory(text: string): LearnedInsight {
    const clean = text
      .trim()
      .replace(/^(?:(?:hey|hello|hi)?\s*eve\s*[,:]?\s*)/i, '')
      .replace(/^(remember\s+that|note\s+that|don't\s+forget\s+that|save\s+to\s+memory|please\s+remember|merk\s+dir\s*,?\s*dass|behalte\s+im\s+gedächtnis\s*,?\s*dass|rappelle-toi\s+que|recuerda\s+que|ricorda\s+che|onthoud\s+dat|zapamiętaj\s+że|lembre-se\s+que)\s+/i, '')
      .trim();

    const topic = clean.length > 30 ? clean.substring(0, 30) + '...' : clean;
    const insight = clean.charAt(0).toUpperCase() + clean.slice(1);

    return this.learnInsight(topic, insight, 'user_explicit_memory');
  }

  /**
   * Automatically parses and compiles a new skill from freeform voice speech
   */
  public compileSkillFromSpeech(transcript: string): CustomSkill | null {
    const textLower = transcript.toLowerCase().trim();

    // Trigger phrase extraction
    const triggerMatch = transcript.match(/(?:when\s+i\s+say|teach\s+yourself\s+to|learn\s+how\s+to|learn\s+skill|routine\s+for|wenn\s+ich\s+sage|quand\s+je\s+dis|cuando\s+diga)\s+['"]?([^,'"]+)['"]?/i);
    const trigger = triggerMatch ? triggerMatch[1].trim() : 'custom routine';

    const steps: SkillStep[] = [];

    if (/inbox|email|mail|triage|postfach/i.test(textLower)) {
      steps.push({ id: 'step-1', order: 1, actionType: 'triage_inbox', label: 'Triage VIP Gmail Inbox' });
    }
    if (/calendar|schedule|agenda|meetings|termin|kalender|rendez-vous/i.test(textLower)) {
      steps.push({ id: 'step-2', order: steps.length + 1, actionType: 'check_calendar', label: 'Review Today\'s Calendar' });
    }
    if (/task|priorit|backlog|work\s+hub|aufgabe|tâche|tarea/i.test(textLower)) {
      steps.push({ id: 'step-3', order: steps.length + 1, actionType: 'list_tasks', label: 'Extract High-Leverage Tasks' });
    }
    if (/wife|emily|love|frau|épouse/i.test(textLower)) {
      steps.push({ id: 'step-4', order: steps.length + 1, actionType: 'send_email', label: 'Send Love Note to Emily', target: 'emily.baxter@personal.com' });
    }
    if (/sync|warehouse|sheets|bigquery/i.test(textLower)) {
      steps.push({ id: 'step-5', order: steps.length + 1, actionType: 'sync_sheets', label: 'Sync Metrics to Google Sheets' });
    }

    if (steps.length === 0) {
      steps.push({ id: 'step-1', order: 1, actionType: 'triage_inbox', label: 'Triage VIP Gmail Inbox' });
      steps.push({ id: 'step-2', order: 2, actionType: 'check_calendar', label: 'Review Today\'s Calendar' });
    }

    const skillId = 'skill-' + Date.now().toString(36);
    const skill: CustomSkill = {
      id: skillId,
      name: `${trigger.charAt(0).toUpperCase() + trigger.slice(1)} Pipeline`,
      triggerPhrase: trigger.toLowerCase(),
      description: `Autonomous routine compiling ${steps.length} sequential operations.`,
      actionSteps: steps,
      isEnabled: true,
      executionCount: 0,
      learnedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      source: 'voice_learned'
    };

    return skill;
  }

  /**
   * Records a new self-learned insight from interaction
   */
  public learnInsight(topic: string, insight: string, source: LearnedInsight['source'] = 'voice_interaction'): LearnedInsight {
    const newInsight: LearnedInsight = {
      id: 'ins-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5),
      topic,
      insight,
      confidenceScore: source === 'user_explicit_memory' ? 1.0 : 0.92,
      source,
      learnedAt: new Date().toISOString()
    };
    this.insights.unshift(newInsight);
    this.saveToStorage();
    return newInsight;
  }

  /**
   * Adjusts learning weights based on user feedback
   */
  public recordFeedback(turnId: string, wasHelpful: boolean, note?: string): void {
    if (wasHelpful) {
      this.learnInsight('User Feedback Reinforcement', `Response pattern for turn ${turnId} marked helpful by Andrew.`, 'feedback_adjustment');
    } else {
      this.learnInsight('User Feedback Correction', `Response pattern for turn ${turnId} flagged for adjustment: ${note || 'Needs refinement'}.`, 'feedback_adjustment');
    }
  }

  /**
   * Retrieves all learned insights and memories
   */
  public getInsights(): LearnedInsight[] {
    return this.insights;
  }

  /**
   * Deletes a specific learned insight
   */
  public deleteInsight(id: string): void {
    this.insights = this.insights.filter(i => i.id !== id);
    this.saveToStorage();
  }
}

export const selfLearningEngine = new SelfLearningEngine();
