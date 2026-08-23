import { CustomSkill, SkillStep, ActionCard } from '../src/types';

export class SkillRegistryService {
  private skills: CustomSkill[] = [
    {
      id: 'skill-morning-briefing',
      name: 'Morning Executive Briefing',
      triggerPhrase: 'morning briefing',
      description: 'Triages unread VIP emails, fetches today’s calendar agenda, and highlights top AI-automated tasks.',
      actionSteps: [
        { id: 's1', order: 1, actionType: 'triage_inbox', label: 'Triage VIP Inbox' },
        { id: 's2', order: 2, actionType: 'check_calendar', label: 'Check Today’s Schedule' },
        { id: 's3', order: 3, actionType: 'list_tasks', label: 'Identify Top 3 Priorities' }
      ],
      learnedAt: '2026-08-20T08:00:00Z',
      executionCount: 14,
      isEnabled: true,
      source: 'builtin'
    },
    {
      id: 'skill-wife-love',
      name: 'Wife Check-in & Love Dispatch',
      triggerPhrase: 'wife check-in',
      description: 'Sends an affectionate check-in email to Emily Baxter.',
      actionSteps: [
        { id: 's1', order: 1, actionType: 'send_email', label: 'Draft Love Note to Emily', target: 'emily.baxter@personal.com' }
      ],
      learnedAt: '2026-08-21T10:00:00Z',
      executionCount: 8,
      isEnabled: true,
      source: 'voice_learned'
    },
    {
      id: 'skill-eod-wrapup',
      name: 'End-of-Day ROI Wrap-Up',
      triggerPhrase: 'end of day wrap up',
      description: 'Calculates cumulative hours won back, completed automation steps, and summaries daily gains.',
      actionSteps: [
        { id: 's1', order: 1, actionType: 'summarize_kpi', label: 'Calculate Hours Won Back' },
        { id: 's2', order: 2, actionType: 'run_autonomous', label: 'Sync Swarm Autonomous Agents' }
      ],
      learnedAt: '2026-08-22T17:00:00Z',
      executionCount: 5,
      isEnabled: true,
      source: 'builtin'
    }
  ];

  public getSkills(): CustomSkill[] {
    return [...this.skills];
  }

  public getSkillById(id: string): CustomSkill | undefined {
    return this.skills.find(s => s.id === id);
  }

  public findMatchingSkill(phrase: string): CustomSkill | undefined {
    const clean = phrase.toLowerCase().trim();
    return this.skills.find(s => {
      if (!s.isEnabled) return false;
      const trigger = s.triggerPhrase.toLowerCase().trim();
      return clean.includes(trigger) || trigger.includes(clean);
    });
  }

  public createSkill(skill: Partial<CustomSkill>): CustomSkill {
    const newSkill: CustomSkill = {
      id: skill.id || 'skill-' + Date.now().toString(36),
      name: skill.name || 'Custom Skill',
      triggerPhrase: skill.triggerPhrase || 'custom trigger',
      description: skill.description || 'Custom autonomous routine',
      actionSteps: skill.actionSteps || [],
      learnedAt: new Date().toISOString(),
      executionCount: 0,
      isEnabled: skill.isEnabled !== undefined ? skill.isEnabled : true,
      source: skill.source || 'voice_learned'
    };
    this.skills.push(newSkill);
    return newSkill;
  }

  public updateSkill(id: string, updates: Partial<CustomSkill>): CustomSkill | null {
    const idx = this.skills.findIndex(s => s.id === id);
    if (idx === -1) return null;
    this.skills[idx] = { ...this.skills[idx], ...updates };
    return this.skills[idx];
  }

  public deleteSkill(id: string): boolean {
    const initialLen = this.skills.length;
    this.skills = this.skills.filter(s => s.id !== id);
    return this.skills.length < initialLen;
  }

  public incrementExecutionCount(id: string): void {
    const skill = this.skills.find(s => s.id === id);
    if (skill) skill.executionCount++;
  }

  /**
   * Parses dynamic skill learning voice commands:
   * e.g. "When I say 'Daily Standup', triage my inbox and summarize tasks"
   * e.g. "Learn a skill: 'Invoice Run' means run autonomous tasks"
   */
  public parseSkillFromSpeech(text: string): CustomSkill | null {
    const textLower = text.toLowerCase().trim();

    const pattern1 = /(?:when\s+i\s+say|whenever\s+i\s+say)\s+["']?([^"',]+)["']?[,\s]+(?:do\s+|run\s+|execute\s+|then\s+)?(.+)/i;
    const pattern2 = /(?:learn\s+(?:a\s+)?(?:new\s+)?skill|teach\s+skill|save\s+routine)[:\s]+["']?([^"',]+)["']?\s*(?:means|does|to)\s*(.+)/i;

    const match = textLower.match(pattern1) || textLower.match(pattern2);
    if (!match) return null;

    const triggerPhrase = match[1].trim();
    const actionsRaw = match[2].trim();

    const steps: SkillStep[] = [];
    let order = 1;

    if (/inbox|email|mail|triage/i.test(actionsRaw)) {
      steps.push({ id: `step-${order}`, order: order++, actionType: 'triage_inbox', label: 'Triage Inbox & Unread Messages' });
    }
    if (/calendar|agenda|schedule|meeting/i.test(actionsRaw)) {
      steps.push({ id: `step-${order}`, order: order++, actionType: 'check_calendar', label: 'Review Today’s Schedule' });
    }
    if (/task|priority|priorities|backlog/i.test(actionsRaw)) {
      steps.push({ id: `step-${order}`, order: order++, actionType: 'list_tasks', label: 'Summarize Top Tasks' });
    }
    if (/kpi|hour|won back|roi|metrics/i.test(actionsRaw)) {
      steps.push({ id: `step-${order}`, order: order++, actionType: 'summarize_kpi', label: 'Calculate KPI Multiplier' });
    }
    if (/autonomous|swarm|automate/i.test(actionsRaw)) {
      steps.push({ id: `step-${order}`, order: order++, actionType: 'run_autonomous', label: 'Trigger Autonomous Backlog Worker' });
    }
    if (steps.length === 0) {
      steps.push({ id: `step-${order}`, order: order++, actionType: 'custom_command', label: actionsRaw, params: { prompt: actionsRaw } });
    }

    const titleWords = triggerPhrase.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    return this.createSkill({
      name: `${titleWords} Routine`,
      triggerPhrase,
      description: `Automates: ${actionsRaw}`,
      actionSteps: steps,
      source: 'voice_learned'
    });
  }
}

export const skillRegistry = new SkillRegistryService();
export const parseSkillFromSpeech = (text: string) => skillRegistry.parseSkillFromSpeech(text);
