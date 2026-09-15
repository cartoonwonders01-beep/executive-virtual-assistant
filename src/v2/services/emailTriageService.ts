import { telemetry } from './telemetryLogger';
import { toolDispatcher } from './toolDispatcher';
import { ActionCardData } from '../components/ActionCardView';

export type EmailPriority = 'urgent' | 'high' | 'normal' | 'low';
export type EmailCategory = 'action_required' | 'meeting_request' | 'fyi' | 'newsletter';

export interface EmailMessage {
  id: string;
  sender: string;
  subject: string;
  body: string;
  timestamp: number;
  priority: EmailPriority;
  category: EmailCategory;
  suggestedReply?: string;
}

export interface TriageSummary {
  total: number;
  urgentCount: number;
  actionRequiredCount: number;
  messages: EmailMessage[];
  spokenBriefing: string;
}

export class EmailTriageService {
  private inbox: EmailMessage[] = [];

  constructor() {
    this.seedDefaultInbox();
    this.registerTools();
  }

  private seedDefaultInbox(): void {
    const now = Date.now();
    this.inbox = [
      {
        id: 'msg-001',
        sender: 'Sarah Jenkins <s.jenkins@biotech-ventures.com>',
        subject: 'Urgent: Contract sign-off needed for Q4 genomics milestone',
        body: 'Andrew, we need your signed authorization on the compute cluster grant before 5 PM today.',
        timestamp: now - 3600 * 1000,
        priority: 'urgent',
        category: 'action_required',
        suggestedReply: 'Hi Sarah, review is in progress. I will execute the grant authorization before 5 PM.'
      },
      {
        id: 'msg-002',
        sender: 'Laurent Dupont <laurent@dupoint-partners.eu>',
        subject: 'Product Roadmap follow-up & sync next Tuesday',
        body: 'Bonjour Andrew, could we meet for 30 minutes next Tuesday at 2 PM to review the AuricPass integration?',
        timestamp: now - 7200 * 1000,
        priority: 'high',
        category: 'meeting_request',
        suggestedReply: 'Bonjour Laurent, Tuesday at 2 PM works perfectly. Staging the invitation now.'
      },
      {
        id: 'msg-003',
        sender: 'AWS Billing Alerts <no-reply@amazon.com>',
        subject: 'Monthly AWS Cloud Cost Summary',
        body: 'Your total charges for the billing period are within expected budget limits.',
        timestamp: now - 86400 * 1000,
        priority: 'low',
        category: 'fyi'
      }
    ];
  }

  private registerTools(): void {
    toolDispatcher.registerTool(
      {
        name: 'triage_executive_inbox',
        description: 'Triages the executive email inbox and extracts urgent items requiring sign-off or action.',
        parameters: {
          type: 'object',
          properties: {
            priorityFilter: { type: 'string', enum: ['urgent', 'high', 'all'], description: 'Filter by priority level' }
          }
        }
      },
      async (args) => {
        const summary = await this.triageInbox(args.priorityFilter);
        return {
          total: summary.total,
          urgentCount: summary.urgentCount,
          actionRequiredCount: summary.actionRequiredCount,
          spokenBriefing: summary.spokenBriefing,
          items: summary.messages.map(m => ({ id: m.id, sender: m.sender, subject: m.subject, priority: m.priority }))
        };
      }
    );

    toolDispatcher.registerTool(
      {
        name: 'stage_email_reply_card',
        description: 'Stages a 1-click executive reply ActionCard for an email message.',
        parameters: {
          type: 'object',
          properties: {
            messageId: { type: 'string', description: 'ID of the email to reply to' },
            customReply: { type: 'string', description: 'Custom reply body override' }
          },
          required: ['messageId']
        }
      },
      async (args) => {
        const msg = this.inbox.find(m => m.id === args.messageId);
        if (!msg) throw new Error(`Message not found: ${args.messageId}`);
        const card = this.stageEmailActionCard(msg, args.customReply);
        return { success: true, card };
      }
    );
  }

  public async triageInbox(filter?: 'urgent' | 'high' | 'all'): Promise<TriageSummary> {
    let filtered = [...this.inbox];
    if (filter === 'urgent') {
      filtered = filtered.filter(m => m.priority === 'urgent');
    } else if (filter === 'high') {
      filtered = filtered.filter(m => m.priority === 'urgent' || m.priority === 'high');
    }

    const urgentCount = this.inbox.filter(m => m.priority === 'urgent').length;
    const actionRequiredCount = this.inbox.filter(m => m.category === 'action_required').length;

    const spoken = urgentCount > 0
      ? `You have ${urgentCount} urgent email requiring sign-off from ${filtered[0]?.sender.split('<')[0].trim() || 'team'}.`
      : `Your inbox is clear of critical emergencies. ${actionRequiredCount} action items pending.`;

    telemetry.log('event', { action: 'inbox_triaged', total: this.inbox.length, urgentCount });

    return {
      total: this.inbox.length,
      urgentCount,
      actionRequiredCount,
      messages: filtered,
      spokenBriefing: spoken
    };
  }

  public stageEmailActionCard(message: EmailMessage, customReply?: string): ActionCardData {
    const replyBody = customReply || message.suggestedReply || 'Acknowledged, reviewing now.';
    return {
      id: `act-email-${message.id}`,
      type: 'task',
      title: `Reply to ${message.sender.split('<')[0].trim()}`,
      subtitle: `Subject: ${message.subject}`,
      details: [
        `Draft: "${replyBody}"`,
        `Priority: ${message.priority.toUpperCase()}`,
        `Original: ${message.body}`
      ],
      dateStr: 'Action Required'
    };
  }

  public addMessage(message: EmailMessage): void {
    this.inbox.unshift(message);
    telemetry.log('event', { action: 'email_received', id: message.id, priority: message.priority });
  }

  public getInbox(): EmailMessage[] {
    return [...this.inbox];
  }
}

export const emailTriageService = new EmailTriageService();
