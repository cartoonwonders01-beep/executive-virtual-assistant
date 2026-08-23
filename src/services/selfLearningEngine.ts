// Autonomous Self-Learning & Skill Acquisition Engine for Eve
// Empowers Eve to learn routines on the fly, self-reflect, tune execution blueprints, and evolve capabilities

import { CustomSkill, SkillStep, TaskItem } from '../types';
import { db } from '../../server/db';

export interface LearnedInsight {
  id: string;
  topic: string;
  insight: string;
  confidenceScore: number;
  source: 'voice_interaction' | 'execution_telemetry' | 'autonomous_reflection';
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

  /**
   * Automatically parses and compiles a new skill from freeform voice speech
   */
  public compileSkillFromSpeech(transcript: string): CustomSkill | null {
    const textLower = transcript.toLowerCase().trim();

    // Trigger phrase extraction
    const triggerMatch = transcript.match(/(?:when\s+i\s+say|teach\s+yourself\s+to|learn\s+how\s+to|learn\s+skill|routine\s+for)\s+['"]?([^,'"]+)['"]?/i);
    const trigger = triggerMatch ? triggerMatch[1].trim() : 'custom routine';

    const steps: SkillStep[] = [];

    if (/inbox|email|mail|triage/i.test(textLower)) {
      steps.push({ id: 'step-1', order: 1, actionType: 'triage_inbox', label: 'Triage VIP Gmail Inbox' });
    }
    if (/calendar|schedule|agenda|meetings/i.test(textLower)) {
      steps.push({ id: 'step-2', order: steps.length + 1, actionType: 'check_calendar', label: 'Review Today\'s Google Calendar' });
    }
    if (/task|priorit|backlog|work\s+hub/i.test(textLower)) {
      steps.push({ id: 'step-3', order: steps.length + 1, actionType: 'list_tasks', label: 'Extract High-Leverage Tasks' });
    }
    if (/wife|emily|love/i.test(textLower)) {
      steps.push({ id: 'step-4', order: steps.length + 1, actionType: 'send_email', label: 'Send Love Note to Emily', target: 'emily.baxter@personal.com' });
    }
    if (/sync|warehouse|sheets|bigquery/i.test(textLower)) {
      steps.push({ id: 'step-5', order: steps.length + 1, actionType: 'sync_sheets', label: 'Sync Metrics to Google Sheets' });
    }

    if (steps.length === 0) {
      steps.push({ id: 'step-1', order: 1, actionType: 'triage_inbox', label: 'Triage VIP Gmail Inbox' });
      steps.push({ id: 'step-2', order: 2, actionType: 'check_calendar', label: 'Review Today\'s Google Calendar' });
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
      id: 'ins-' + Date.now().toString(36),
      topic,
      insight,
      confidenceScore: 0.92,
      source,
      learnedAt: new Date().toISOString()
    };
    this.insights.unshift(newInsight);
    return newInsight;
  }

  /**
   * Retrieves all learned insights
   */
  public getInsights(): LearnedInsight[] {
    return this.insights;
  }
}

export const selfLearningEngine = new SelfLearningEngine();
