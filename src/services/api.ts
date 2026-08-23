import { 
  TaskItem, 
  VoiceMemo, 
  ActionCard, 
  CalendarAppointment, 
  EmailDraft, 
  KPISummary,
  InboxEmail,
  ContactPerson,
  ChatMessage,
  CallLog,
  AutonomousJob
} from '../types';

const API_BASE = '/api';

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  async getKPI(): Promise<KPISummary> {
    const res = await fetch(`${API_BASE}/kpi`);
    return res.json();
  },

  async getTasks(): Promise<TaskItem[]> {
    const res = await fetch(`${API_BASE}/tasks`);
    return res.json();
  },

  async createTask(task: Partial<TaskItem>): Promise<TaskItem> {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    return res.json();
  },

  async updateTask(id: string, updates: Partial<TaskItem>): Promise<TaskItem> {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  async deleteTask(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async getMemos(): Promise<VoiceMemo[]> {
    const res = await fetch(`${API_BASE}/memos`);
    return res.json();
  },

  async processVoiceText(text: string, source = 'browser_mic'): Promise<{
    actionCard: ActionCard;
    memo: VoiceMemo;
    createdTasks: TaskItem[];
    kpi: KPISummary;
  }> {
    const res = await fetch(`${API_BASE}/voice/process-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, source }),
    });
    return res.json();
  },

  async transcribeRecordedAudio(blob: Blob, mimeType: string, groqKey?: string): Promise<{
    transcript: string;
    actionCard: ActionCard;
    memo: VoiceMemo;
    createdTasks: TaskItem[];
    kpi: KPISummary;
  }> {
    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
    const formData = new FormData();
    formData.append('audio', blob, `voice_recording.${ext}`);

    const headers: Record<string, string> = {};
    if (groqKey) {
      headers['x-groq-api-key'] = groqKey;
    }

    const res = await fetch(`${API_BASE}/voice/transcribe-audio`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return res.json();
  },

  async uploadAudioFile(file: File, groqKey?: string): Promise<{
    transcript: string;
    memo: VoiceMemo;
    createdTasks: TaskItem[];
    kpi: KPISummary;
  }> {
    const formData = new FormData();
    formData.append('audio', file);
    const headers: Record<string, string> = {};
    if (groqKey) {
      headers['x-groq-api-key'] = groqKey;
    }
    const res = await fetch(`${API_BASE}/voice/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return res.json();
  },

  async getActionCards(): Promise<ActionCard[]> {
    const res = await fetch(`${API_BASE}/action-cards`);
    return res.json();
  },

  async executeActionCard(id: string): Promise<{ success: boolean; card: ActionCard }> {
    const res = await fetch(`${API_BASE}/action-cards/${id}/execute`, {
      method: 'POST',
    });
    return res.json();
  },

  async getAppointments(): Promise<CalendarAppointment[]> {
    const res = await fetch(`${API_BASE}/appointments`);
    return res.json();
  },

  async createAppointment(apt: Partial<CalendarAppointment>): Promise<CalendarAppointment> {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apt),
    });
    return res.json();
  },

  async updateAppointment(id: string, updates: Partial<CalendarAppointment>): Promise<CalendarAppointment> {
    const res = await fetch(`${API_BASE}/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  async getEmails(): Promise<EmailDraft[]> {
    const res = await fetch(`${API_BASE}/emails`);
    return res.json();
  },

  async sendEmail(id: string): Promise<{ success: boolean; email: EmailDraft; message: string }> {
    const res = await fetch(`${API_BASE}/emails/${id}/send`, {
      method: 'POST',
    });
    return res.json();
  },

  // =========================================================================
  // GMAIL INBOX SUITE API
  // =========================================================================
  async getInboxEmails(): Promise<InboxEmail[]> {
    const res = await fetch(`${API_BASE}/gmail/inbox`);
    return res.json();
  },

  async getInboxEmailById(id: string): Promise<InboxEmail> {
    const res = await fetch(`${API_BASE}/gmail/inbox/${id}`);
    return res.json();
  },

  async sendDirectEmail(payload: { toName?: string; toEmail: string; subject: string; body: string; tone?: string }): Promise<{ success: boolean; email: EmailDraft; message: string }> {
    const res = await fetch(`${API_BASE}/gmail/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async triageInbox(): Promise<{ unreadCount: number; triageSummary: string; emails: InboxEmail[] }> {
    const res = await fetch(`${API_BASE}/gmail/triage`, {
      method: 'POST'
    });
    return res.json();
  },

  async markEmailRead(id: string, isUnread = false): Promise<InboxEmail> {
    const res = await fetch(`${API_BASE}/gmail/inbox/${id}/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isUnread })
    });
    return res.json();
  },

  async toggleEmailStar(id: string): Promise<InboxEmail> {
    const res = await fetch(`${API_BASE}/gmail/inbox/${id}/star`, {
      method: 'PATCH'
    });
    return res.json();
  },

  async deleteInboxEmail(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/gmail/inbox/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // =========================================================================
  // COMMUNICATIONS: CONTACTS, CHAT & CALLS
  // =========================================================================
  async getContacts(): Promise<ContactPerson[]> {
    const res = await fetch(`${API_BASE}/comms/contacts`);
    return res.json();
  },

  async createContact(contact: Partial<ContactPerson>): Promise<ContactPerson> {
    const res = await fetch(`${API_BASE}/comms/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contact),
    });
    return res.json();
  },

  async getChatMessages(contactId?: string): Promise<ChatMessage[]> {
    const url = contactId ? `${API_BASE}/comms/messages?contactId=${encodeURIComponent(contactId)}` : `${API_BASE}/comms/messages`;
    const res = await fetch(url);
    return res.json();
  },

  async sendChatMessage(contactId: string, text: string): Promise<{ userMessage: ChatMessage; replyMessage: ChatMessage }> {
    const res = await fetch(`${API_BASE}/comms/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId, text })
    });
    return res.json();
  },

  async getCallLogs(): Promise<CallLog[]> {
    const res = await fetch(`${API_BASE}/comms/calls`);
    return res.json();
  },

  async logCall(payload: Partial<CallLog>): Promise<CallLog> {
    const res = await fetch(`${API_BASE}/comms/calls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // =========================================================================
  // AUTONOMOUS BACKLOG WORKER
  // =========================================================================
  async getAutonomousStatus(): Promise<{
    queueLength: number;
    activeJobsCount: number;
    completedCount: number;
    totalHoursWonBack: number;
    jobs: AutonomousJob[];
    queue: any[];
  }> {
    const res = await fetch(`${API_BASE}/autonomous/status`);
    return res.json();
  },

  async executeAutonomousStep(taskId?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/autonomous/step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId })
    });
    return res.json();
  },

  async runAllAutonomousTasks(): Promise<{ executedCount: number; results: any[] }> {
    const res = await fetch(`${API_BASE}/autonomous/run-all`, {
      method: 'POST'
    });
    return res.json();
  },

  // =========================================================================
  // WIKI KNOWLEDGE BASE
  // =========================================================================
  async getWikiArticles(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/wiki`);
    return res.json();
  },

  async getWikiArticleById(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/wiki/${id}`);
    return res.json();
  },

  async createWikiArticle(article: any): Promise<any> {
    const res = await fetch(`${API_BASE}/wiki`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(article),
    });
    return res.json();
  },

  async updateWikiArticle(id: string, updates: any): Promise<any> {
    const res = await fetch(`${API_BASE}/wiki/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  async deleteWikiArticle(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/wiki/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  }
};
