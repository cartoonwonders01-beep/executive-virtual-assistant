import { InboxEmail, CalendarAppointment, TaskItem, ActionIntentType, ActionCard, CustomLLMProfile } from '../types';
import { logger } from './loggerService';

export interface ProactiveAlert {
  id: string;
  source: 'email' | 'calendar' | 'task';
  sourceId: string;
  title: string;
  message: string;
  spokenSummary: string;
  intent: ActionIntentType;
  actionCardData?: Partial<ActionCard>;
  triggeredAt?: string;
}

export interface AutonomousAuditEntry {
  id: string;
  timestamp: string;
  source: 'email' | 'calendar' | 'task' | 'scan_cycle';
  action: 'flagged' | 'scanned' | 'deduplicated' | 'skipped';
  title: string;
  details: string;
}

export interface AutonomousReportSummary {
  isLoopActive: boolean;
  totalScanCycles: number;
  lastScanTimestamp: string | null;
  totalEmailsInspected: number;
  totalAppointmentsInspected: number;
  totalTasksInspected: number;
  totalAlertsGenerated: number;
  activeAlerts: ProactiveAlert[];
  recentAuditTrail: AutonomousAuditEntry[];
}

export class ProactiveLoopService {
  private static instance: ProactiveLoopService;
  private notifiedIds: Set<string> = new Set();
  private totalScanCycles = 0;
  private lastScanTimestamp: string | null = null;
  private totalEmailsInspected = 0;
  private totalAppointmentsInspected = 0;
  private totalTasksInspected = 0;
  private recentAlerts: ProactiveAlert[] = [];
  private auditTrail: AutonomousAuditEntry[] = [];

  private constructor() {
    this.loadNotifiedIds();
  }

  public static getInstance(): ProactiveLoopService {
    if (!ProactiveLoopService.instance) {
      ProactiveLoopService.instance = new ProactiveLoopService();
    }
    return ProactiveLoopService.instance;
  }

  private loadNotifiedIds() {
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem('assistant_proactive_notified_ids');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            this.notifiedIds = new Set(parsed);
          }
        }
      } catch {}
    }
  }

  private saveNotifiedIds() {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(
          'assistant_proactive_notified_ids',
          JSON.stringify(Array.from(this.notifiedIds))
        );
      } catch {}
    }
  }

  public markAsNotified(id: string) {
    this.notifiedIds.add(id);
    this.saveNotifiedIds();
  }

  public isNotified(id: string): boolean {
    return this.notifiedIds.has(id);
  }

  public resetAlertHistory() {
    this.notifiedIds.clear();
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem('assistant_proactive_notified_ids');
      } catch {}
    }
    logger.log('info', 'autonomous_loop', '🔄 Proactive alert history reset.');
  }

  /**
   * Scans email inbox, calendar schedule, and task backlog for urgent proactive triggers
   */
  public checkUrgentEvents(params: {
    inboxEmails: InboxEmail[];
    appointments: CalendarAppointment[];
    tasks: TaskItem[];
    activeProfile?: CustomLLMProfile;
    isLoopActive?: boolean;
  }): ProactiveAlert | null {
    const { inboxEmails = [], appointments = [], tasks = [], activeProfile, isLoopActive = false } = params;
    const now = Date.now();
    const nowISO = new Date().toISOString();
    const userName = activeProfile?.userContext?.userName || 'Andrew';

    this.totalScanCycles++;
    this.lastScanTimestamp = nowISO;
    this.totalEmailsInspected += inboxEmails.length;
    this.totalAppointmentsInspected += appointments.length;
    this.totalTasksInspected += tasks.length;

    // 1. Check for Urgent / VIP Unread Emails
    const urgentEmail = inboxEmails.find(email => {
      if (!email.isUnread) return false;
      const alertKey = `email-${email.id}`;
      if (this.isNotified(alertKey)) return false;

      const text = `${email.subject} ${email.snippet} ${email.fromName}`.toLowerCase();
      const isVip = email.category === 'vip' || email.isStarred;
      const hasUrgentKeyword = /(urgent|asap|budget|deadline|critical|emergency|action\s+required|signoff|overdue|important)/i.test(text);

      return isVip && hasUrgentKeyword;
    });

    if (urgentEmail) {
      const alertKey = `email-${urgentEmail.id}`;
      this.markAsNotified(alertKey);

      const title = `🚨 Urgent VIP Email: ${urgentEmail.fromName}`;
      const spokenSummary = `Excuse me ${userName}, you have an urgent unread message from ${urgentEmail.fromName} regarding "${urgentEmail.subject}". Shall I prepare a response?`;
      const message = `**🚨 [Proactive Executive Alert] Urgent Message Received**\n\n• **From**: **${urgentEmail.fromName}** (\`${urgentEmail.fromEmail}\`)\n• **Subject**: *"${urgentEmail.subject}"*\n• **Preview**: "${urgentEmail.snippet || urgentEmail.body.slice(0, 120)}..."\n\n*Proactively flagged by Eve's Autonomous Background Loop.*`;

      logger.log('warn', 'autonomous_loop', `🔔 Proactive loop triggered for urgent email: "${urgentEmail.subject}" from ${urgentEmail.fromName}`);

      const alert: ProactiveAlert = {
        id: alertKey,
        source: 'email',
        sourceId: urgentEmail.id,
        title,
        message,
        spokenSummary,
        intent: 'email_draft',
        triggeredAt: nowISO,
        actionCardData: {
          id: 'ac-proactive-' + Date.now().toString(36),
          intent: 'email_draft',
          title: `🚨 Urgent VIP Alert: ${urgentEmail.fromName}`,
          description: message,
          spokenResponse: spokenSummary,
          status: 'confirmed',
          createdAt: nowISO,
          emailData: {
            id: 'em-reply-' + Date.now().toString(36),
            toName: urgentEmail.fromName,
            toEmail: urgentEmail.fromEmail,
            subject: `Re: ${urgentEmail.subject}`,
            body: urgentEmail.suggestedReply || `Hi ${urgentEmail.fromName},\n\nI reviewed your note regarding ${urgentEmail.subject}. Confirming next steps.\n\nBest regards,\n${userName}`,
            tone: 'professional',
            status: 'draft'
          }
        }
      };

      this.recentAlerts.unshift(alert);
      if (this.recentAlerts.length > 20) this.recentAlerts.pop();

      this.auditTrail.unshift({
        id: 'aud-' + Date.now().toString(36),
        timestamp: nowISO,
        source: 'email',
        action: 'flagged',
        title: `Urgent Email: ${urgentEmail.subject}`,
        details: `From ${urgentEmail.fromName} (${urgentEmail.fromEmail})`
      });

      return alert;
    }

    // 2. Check for Imminent Calendar Events (starting within next 45 minutes)
    const imminentAppointment = appointments.find(apt => {
      if (apt.status === 'cancelled') return false;
      const alertKey = `cal-${apt.id}`;
      if (this.isNotified(alertKey)) return false;

      const startTime = new Date(apt.startDateTime).getTime();
      const timeDiffMinutes = Math.round((startTime - now) / 60000);

      // Trigger if starting within 5 to 45 minutes
      return timeDiffMinutes >= 0 && timeDiffMinutes <= 45;
    });

    if (imminentAppointment) {
      const alertKey = `cal-${imminentAppointment.id}`;
      this.markAsNotified(alertKey);

      const startTime = new Date(imminentAppointment.startDateTime);
      const timeDiffMinutes = Math.max(1, Math.round((startTime.getTime() - now) / 60000));
      const timeStr = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const title = `📅 Upcoming Meeting in ${timeDiffMinutes}m: ${imminentAppointment.title}`;
      const spokenSummary = `Heads up ${userName}, you have "${imminentAppointment.title}" starting in ${timeDiffMinutes} minutes at ${timeStr}.`;
      const message = `**📅 [Proactive Calendar Reminder] Meeting Starting Soon**\n\n• **Event**: **${imminentAppointment.title}**\n• **Time**: **${timeStr}** (in ~${timeDiffMinutes} mins)\n• **Location**: ${imminentAppointment.location || 'Google Meet'}\n${imminentAppointment.attendees?.length ? `• **Attendees**: ${imminentAppointment.attendees.map(a => a.name).join(', ')}` : ''}\n\n*Proactively queued by Autonomous Calendar Monitor.*`;

      logger.log('info', 'autonomous_loop', `🔔 Proactive loop triggered for upcoming event: "${imminentAppointment.title}" at ${timeStr}`);

      const alert: ProactiveAlert = {
        id: alertKey,
        source: 'calendar',
        sourceId: imminentAppointment.id,
        title,
        message,
        spokenSummary,
        intent: 'calendar_booking',
        triggeredAt: nowISO,
        actionCardData: {
          id: 'ac-proactive-' + Date.now().toString(36),
          intent: 'calendar_booking',
          title,
          description: message,
          spokenResponse: spokenSummary,
          status: 'executed',
          createdAt: nowISO,
          calendarData: imminentAppointment
        }
      };

      this.recentAlerts.unshift(alert);
      if (this.recentAlerts.length > 20) this.recentAlerts.pop();

      this.auditTrail.unshift({
        id: 'aud-' + Date.now().toString(36),
        timestamp: nowISO,
        source: 'calendar',
        action: 'flagged',
        title: `Upcoming: ${imminentAppointment.title}`,
        details: `Starts at ${timeStr} (~${timeDiffMinutes}m)`
      });

      return alert;
    }

    // 3. Check for Blocked High-Priority Tasks
    const blockedTask = tasks.find(task => {
      if (task.status !== 'blocked') return false;
      const alertKey = `task-${task.id}`;
      if (this.isNotified(alertKey)) return false;
      return task.userPriority === 'urgent' || task.aiPriority === 'critical';
    });

    if (blockedTask) {
      const alertKey = `task-${blockedTask.id}`;
      this.markAsNotified(alertKey);

      const title = `⚠️ Blocked Critical Task: ${blockedTask.title}`;
      const spokenSummary = `Note for your pipeline ${userName}: the high-priority task "${blockedTask.title}" is currently blocked. Would you like me to run an autonomous unblocking blueprint?`;
      const message = `**⚠️ [Proactive Pipeline Notice] Critical Task Blocked**\n\n• **Task**: **${blockedTask.title}** (${blockedTask.category})\n• **Reason**: ${blockedTask.priorityRationale || 'Requires executive unblocking'}\n• **Estimated Value**: ${blockedTask.estimatedValue}\n\n*Identified by Work Hub Autonomous Monitor.*`;

      logger.log('warn', 'autonomous_loop', `🔔 Proactive loop triggered for blocked task: "${blockedTask.title}"`);

      const alert: ProactiveAlert = {
        id: alertKey,
        source: 'task',
        sourceId: blockedTask.id,
        title,
        message,
        spokenSummary,
        intent: 'task_create',
        triggeredAt: nowISO,
        actionCardData: {
          id: 'ac-proactive-' + Date.now().toString(36),
          intent: 'task_create',
          title,
          description: message,
          spokenResponse: spokenSummary,
          status: 'confirmed',
          createdAt: nowISO,
          taskData: blockedTask
        }
      };

      this.recentAlerts.unshift(alert);
      if (this.recentAlerts.length > 20) this.recentAlerts.pop();

      this.auditTrail.unshift({
        id: 'aud-' + Date.now().toString(36),
        timestamp: nowISO,
        source: 'task',
        action: 'flagged',
        title: `Blocked Task: ${blockedTask.title}`,
        details: `Priority: ${blockedTask.userPriority}`
      });

      return alert;
    }

    return null;
  }

  public getAutonomousAuditReport(isLoopActive: boolean = false): AutonomousReportSummary {
    return {
      isLoopActive,
      totalScanCycles: this.totalScanCycles,
      lastScanTimestamp: this.lastScanTimestamp,
      totalEmailsInspected: this.totalEmailsInspected,
      totalAppointmentsInspected: this.totalAppointmentsInspected,
      totalTasksInspected: this.totalTasksInspected,
      totalAlertsGenerated: this.recentAlerts.length,
      activeAlerts: [...this.recentAlerts],
      recentAuditTrail: [...this.auditTrail].slice(0, 30)
    };
  }
}

export const proactiveLoopService = ProactiveLoopService.getInstance();
