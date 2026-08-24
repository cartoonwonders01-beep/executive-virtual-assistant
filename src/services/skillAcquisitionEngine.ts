// Universal Interactive Skill Acquisition Engine (UISAP)
import { CustomSkill, SkillStep, SkillActionType } from '../types';
import { logger } from './loggerService';
import { memoryGraph } from './memoryGraphService';

export type AcquisitionState = 
  | 'idle'
  | 'awaiting_missing_entity'
  | 'awaiting_skill_explanation'
  | 'awaiting_confirmation';

export interface PendingSkillBlueprint {
  skillName: string;
  triggerPhrase: string;
  description: string;
  actionSteps: SkillStep[];
  rawExplanation: string;
  originalQuery: string;
}

export interface PendingEntityRequest {
  relationType: 'wife' | 'colleague' | 'child' | 'manager' | 'contact' | 'custom';
  entityRoleName: string;
  originalIntent: string;
  originalTranscript: string;
}

export class SkillAcquisitionEngine {
  private state: AcquisitionState = 'idle';
  private pendingSkill: PendingSkillBlueprint | null = null;
  private pendingEntity: PendingEntityRequest | null = null;

  public getState(): AcquisitionState {
    return this.state;
  }

  public getPendingSkill(): PendingSkillBlueprint | null {
    return this.pendingSkill;
  }

  public getPendingEntity(): PendingEntityRequest | null {
    return this.pendingEntity;
  }

  public reset(): void {
    this.state = 'idle';
    this.pendingSkill = null;
    this.pendingEntity = null;
  }

  /**
   * Phase 1A: Start Entity Clarification Interview (e.g. "Send email to my wife")
   */
  public startEntityClarification(
    relationType: PendingEntityRequest['relationType'],
    entityRoleName: string,
    originalTranscript: string
  ): { spokenPrompt: string; summaryPrompt: string } {
    this.state = 'awaiting_missing_entity';
    this.pendingEntity = {
      relationType,
      entityRoleName,
      originalIntent: 'email_or_contact',
      originalTranscript
    };

    const spokenPrompt = `I would love to help with that, Andrew! Who is your ${entityRoleName} and what is their email address or contact details so I can remember for next time?`;
    const summaryPrompt = `❓ **Clarifying Question**: Please share the name and email/phone for your **${entityRoleName}** so I can save it to my permanent memory.`;

    logger.log('info', 'ai_reasoning', `❓ Interactive Interview: Asking user for missing entity details [${entityRoleName}].`);
    return { spokenPrompt, summaryPrompt };
  }

  /**
   * Phase 1B: Start Unknown Skill Explanation Interview
   */
  public startSkillInterview(
    skillName: string,
    originalQuery: string
  ): { spokenPrompt: string; summaryPrompt: string } {
    this.state = 'awaiting_skill_explanation';
    this.pendingSkill = {
      skillName,
      triggerPhrase: skillName.toLowerCase().trim(),
      description: `User-taught custom workflow for "${skillName}"`,
      actionSteps: [],
      rawExplanation: '',
      originalQuery
    };

    const spokenPrompt = `I don't know how to ${skillName} yet, but I'd love to learn! What specific steps would you like me to follow to execute this?`;
    const summaryPrompt = `🛠️ **Learning New Skill**: I'm ready to learn how to **${skillName}**. Tell me the steps (e.g. *"First check calendar, then draft email, then log a task"*).`;

    logger.log('info', 'ai_reasoning', `🛠️ Interactive Skill Interview started for: "${skillName}".`);
    return { spokenPrompt, summaryPrompt };
  }

  /**
   * Phase 2: Parse user's step explanation and synthesize confirmation blueprint
   */
  public synthesizeSkillFromExplanation(explanationText: string): {
    blueprint: PendingSkillBlueprint;
    spokenConfirmation: string;
    summaryMarkdown: string;
  } {
    const current = this.pendingSkill || {
      skillName: 'Custom Workflow',
      triggerPhrase: 'custom action',
      description: 'User-taught workflow',
      actionSteps: [],
      rawExplanation: explanationText,
      originalQuery: explanationText
    };

    const lower = explanationText.toLowerCase();
    const steps: SkillStep[] = [];

    // Parse natural workflow verbs
    if (/inbox|email|mail|courriel/i.test(lower) && /triage|check|review/i.test(lower)) {
      steps.push({ id: 's1', order: steps.length + 1, actionType: 'triage_inbox', label: 'Triage VIP Inbox & Unread Messages' });
    }

    if (/calendar|agenda|schedule|meeting|appointment|calendrier/i.test(lower) && /check|view|list|review/i.test(lower)) {
      steps.push({ id: 's2', order: steps.length + 1, actionType: 'check_calendar', label: 'Verify Calendar Appointments & Conflicts' });
    }

    if (/task|tasks|priority|priorities|monday|work\s+hub|tâche/i.test(lower)) {
      steps.push({ id: 's3', order: steps.length + 1, actionType: 'list_tasks', label: 'Triage High-ROI Tasks on Monday.com Work Hub' });
    }

    if (/send|draft|email\s+to|écris/i.test(lower) && /(wife|celine|emily|sarah|david|alex|team)/i.test(lower)) {
      const recipientMatch = lower.match(/(?:to|à)\s+([a-zA-Z]+)/i);
      const targetName = recipientMatch ? recipientMatch[1] : 'Contact';
      steps.push({
        id: 's4',
        order: steps.length + 1,
        actionType: 'send_email',
        label: `Draft & Dispatch Executive Email to ${targetName.charAt(0).toUpperCase() + targetName.slice(1)}`,
        target: targetName
      });
    }

    if (/kpi|metrics|hours\s+won|roi|summary/i.test(lower)) {
      steps.push({ id: 's5', order: steps.length + 1, actionType: 'summarize_kpi', label: 'Calculate KPI Multiplier & Time Won Back' });
    }

    if (/autonomous|worker|automation|swarm|bot/i.test(lower)) {
      steps.push({ id: 's6', order: steps.length + 1, actionType: 'run_autonomous', label: 'Execute Autonomous Background Execution Cycle' });
    }

    // Default fallback steps if ambiguous
    if (steps.length === 0) {
      steps.push({ id: 's1', order: 1, actionType: 'check_calendar', label: 'Review Schedule & Appointments' });
      steps.push({ id: 's2', order: 2, actionType: 'triage_inbox', label: 'Triage VIP Communications' });
      steps.push({ id: 's3', order: 3, actionType: 'list_tasks', label: 'Organize Daily High-Leverage Tasks' });
    }

    current.actionSteps = steps;
    current.rawExplanation = explanationText;
    this.pendingSkill = current;
    this.state = 'awaiting_confirmation';

    const stepBulletList = steps.map((s, idx) => `${idx + 1}. ${s.label}`).join('\n');
    const spokenSteps = steps.map((s, idx) => `Step ${idx + 1}: ${s.label}`).join('. ');

    const spokenConfirmation = `Understood! Here is what I will do: ${spokenSteps}. Should I commit this skill to memory and execute it now?`;
    const summaryMarkdown = `### 📋 Execution Blueprint: "${current.skillName}"\n\n` +
      `${stepBulletList}\n\n` +
      `**Should I commit this skill to permanent memory and execute it now?**\n\n` +
      `*(Say "Yes" / "Proceed" or tap Confirm below)*`;

    logger.log('info', 'ai_reasoning', `📋 Synthesized skill blueprint for "${current.skillName}" with ${steps.length} steps.`);
    return { blueprint: current, spokenConfirmation, summaryMarkdown };
  }

  /**
   * Phase 3: Commit Skill to Permanent Memory
   */
  public commitPendingSkill(): CustomSkill | null {
    if (!this.pendingSkill) return null;

    const skill: CustomSkill = {
      id: 'skill-learned-' + Date.now().toString(36),
      name: this.pendingSkill.skillName,
      triggerPhrase: this.pendingSkill.triggerPhrase,
      description: this.pendingSkill.description,
      actionSteps: this.pendingSkill.actionSteps,
      learnedAt: new Date().toISOString(),
      executionCount: 1,
      isEnabled: true,
      source: 'voice_learned'
    };

    logger.log('success', 'ai_reasoning', `💾 Permanently committed skill "${skill.name}" (${skill.actionSteps.length} steps) to skill registry.`);
    this.reset();
    return skill;
  }
}

export const skillAcquisitionEngine = new SkillAcquisitionEngine();
