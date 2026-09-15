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

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errorBody = await res.json();
      if (errorBody && (errorBody.error || errorBody.message)) {
        errorMessage = errorBody.error || errorBody.message;
      }
    } catch {
      // Body wasn't JSON, fallback to status text
    }
    throw new Error(errorMessage);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getHealth: () => requestJson<{ status: string; timestamp: string }>(`${API_BASE}/health`),
  getKPI: (): Promise<KPISummary> => requestJson<KPISummary>(`${API_BASE}/kpi`),
  getTasks: (): Promise<TaskItem[]> => requestJson<TaskItem[]>(`${API_BASE}/tasks`),
  createTask: (task: Partial<TaskItem>): Promise<TaskItem> =>
    requestJson<TaskItem>(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    }),
  updateTask: (id: string, updates: Partial<TaskItem>): Promise<TaskItem> =>
    requestJson<TaskItem>(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }),
  deleteTask: (id: string): Promise<{ success: boolean }> =>
    requestJson<{ success: boolean }>(`${API_BASE}/tasks/${id}`, { method: 'DELETE' }),
  getMemos: (): Promise<VoiceMemo[]> => requestJson<VoiceMemo[]>(`${API_BASE}/memos`),
  
  processVoiceText: (text: string, source = 'browser_mic'): Promise<{
    actionCard: ActionCard;
    memo: VoiceMemo;
    createdTasks: TaskItem[];
    kpi: KPISummary;
  }> =>
    requestJson(`${API_BASE}/voice/process-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, source }),
    }),

  transcribeRecordedAudio: (blob: Blob, mimeType: string, groqKey?: string): Promise<{
    transcript: string;
    actionCard: ActionCard;
    memo: VoiceMemo;
    createdTasks: TaskItem[];
    kpi: KPISummary;
  }> => {
    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
    const formData = new FormData();
    formData.append('audio', blob, `voice_recording.${ext}`);
    const headers: Record<string, string> = {};
    if (groqKey) headers['x-groq-api-key'] = groqKey;

    return requestJson(`${API_BASE}/voice/transcribe-audio`, {
      method: 'POST',
      headers,
      body: formData,
    });
  },

  uploadAudioFile: (file: File, groqKey?: string): Promise<{
    transcript: string;
    memo: VoiceMemo;
    createdTasks: TaskItem[];
    kpi: KPISummary;
  }> => {
    const formData = new FormData();
    formData.append('audio', file);
    const headers: Record<string, string> = {};
    if (groqKey) headers['x-groq-api-key'] = groqKey;

    return requestJson(`${API_BASE}/voice/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
  },

  getActionCards: (): Promise<ActionCard[]> => requestJson<ActionCard[]>(`${API_BASE}/action-cards`),
  executeActionCard: (id: string): Promise<{ success: boolean; card: ActionCard }> =>
    requestJson<{ success: boolean; card: ActionCard }>(`${API_BASE}/action-cards/${id}/execute`, {
      method: 'POST',
    }),

  getAppointments: (): Promise<CalendarAppointment[]> => requestJson<CalendarAppointment[]>(`${API_BASE}/appointments`),
  createAppointment: (apt: Partial<CalendarAppointment>): Promise<CalendarAppointment> =>
    requestJson<CalendarAppointment>(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apt),
    }),
  updateAppointment: (id: string, updates: Partial<CalendarAppointment>): Promise<CalendarAppointment> =>
    requestJson<CalendarAppointment>(`${API_BASE}/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }),

  getEmails: (): Promise<EmailDraft[]> => requestJson<EmailDraft[]>(`${API_BASE}/emails`),
  sendEmail: (id: string): Promise<{ success: boolean; email: EmailDraft; message: string }> =>
    requestJson<{ success: boolean; email: EmailDraft; message: string }>(`${API_BASE}/emails/${id}/send`, {
      method: 'POST',
    }),

  // GMAIL INBOX SUITE API
  getInboxEmails: (): Promise<InboxEmail[]> => requestJson<InboxEmail[]>(`${API_BASE}/gmail/inbox`),
  getInboxEmailById: (id: string): Promise<InboxEmail> => requestJson<InboxEmail>(`${API_BASE}/gmail/inbox/${id}`),
  sendDirectEmail: (payload: { toName?: string; toEmail: string; subject: string; body: string; tone?: string }): Promise<{ success: boolean; email: EmailDraft; message: string }> =>
    requestJson<{ success: boolean; email: EmailDraft; message: string }>(`${API_BASE}/gmail/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  triageInbox: (): Promise<{ unreadCount: number; triageSummary: string; emails: InboxEmail[] }> =>
    requestJson<{ unreadCount: number; triageSummary: string; emails: InboxEmail[] }>(`${API_BASE}/gmail/triage`, {
      method: 'POST',
    }),
  markEmailRead: (id: string, isUnread = false): Promise<InboxEmail> =>
    requestJson<InboxEmail>(`${API_BASE}/gmail/inbox/${id}/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isUnread }),
    }),
  toggleEmailStar: (id: string): Promise<InboxEmail> =>
    requestJson<InboxEmail>(`${API_BASE}/gmail/inbox/${id}/star`, { method: 'PATCH' }),
  deleteInboxEmail: (id: string): Promise<{ success: boolean }> =>
    requestJson<{ success: boolean }>(`${API_BASE}/gmail/inbox/${id}`, { method: 'DELETE' }),

  // COMMUNICATIONS: CONTACTS, CHAT & CALLS
  getContacts: (): Promise<ContactPerson[]> => requestJson<ContactPerson[]>(`${API_BASE}/comms/contacts`),
  createContact: (contact: Partial<ContactPerson>): Promise<ContactPerson> =>
    requestJson<ContactPerson>(`${API_BASE}/comms/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contact),
    }),
  getChatMessages: (contactId?: string): Promise<ChatMessage[]> => {
    const url = contactId ? `${API_BASE}/comms/messages?contactId=${encodeURIComponent(contactId)}` : `${API_BASE}/comms/messages`;
    return requestJson<ChatMessage[]>(url);
  },
  sendChatMessage: (contactId: string, text: string): Promise<{ userMessage: ChatMessage; replyMessage: ChatMessage }> =>
    requestJson<{ userMessage: ChatMessage; replyMessage: ChatMessage }>(`${API_BASE}/comms/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId, text }),
    }),
  getCallLogs: (): Promise<CallLog[]> => requestJson<CallLog[]>(`${API_BASE}/comms/calls`),
  logCall: (payload: Partial<CallLog>): Promise<CallLog> =>
    requestJson<CallLog>(`${API_BASE}/comms/calls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  // AUTONOMOUS BACKLOG WORKER
  getAutonomousStatus: (): Promise<{
    queueLength: number;
    activeJobsCount: number;
    completedCount: number;
    totalHoursWonBack: number;
    jobs: AutonomousJob[];
    queue: any[];
  }> => requestJson(`${API_BASE}/autonomous/status`),
  executeAutonomousStep: (taskId?: string): Promise<any> =>
    requestJson<any>(`${API_BASE}/autonomous/step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId }),
    }),
  runAllAutonomousTasks: (): Promise<{ executedCount: number; results: any[] }> =>
    requestJson<{ executedCount: number; results: any[] }>(`${API_BASE}/autonomous/run-all`, { method: 'POST' }),

  // WIKI KNOWLEDGE BASE
  getWikiArticles: (): Promise<any[]> => requestJson<any[]>(`${API_BASE}/wiki`),
  getWikiArticleById: (id: string): Promise<any> => requestJson<any>(`${API_BASE}/wiki/${id}`),
  createWikiArticle: (article: any): Promise<any> =>
    requestJson<any>(`${API_BASE}/wiki`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(article),
    }),
  updateWikiArticle: (id: string, updates: any): Promise<any> =>
    requestJson<any>(`${API_BASE}/wiki/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }),
  deleteWikiArticle: (id: string): Promise<{ success: boolean }> =>
    requestJson<{ success: boolean }>(`${API_BASE}/wiki/${id}`, { method: 'DELETE' }),

  // DYNAMIC SKILLS & CONVERSATIONAL DIALOGUE
  getSkills: (): Promise<any[]> => requestJson<any[]>(`${API_BASE}/skills`),
  createSkill: (skill: any): Promise<any> =>
    requestJson<any>(`${API_BASE}/skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(skill),
    }),
  updateSkill: (id: string, updates: any): Promise<any> =>
    requestJson<any>(`${API_BASE}/skills/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }),
  deleteSkill: (id: string): Promise<{ success: boolean }> =>
    requestJson<{ success: boolean }>(`${API_BASE}/skills/${id}`, { method: 'DELETE' }),
  executeSkill: (id: string): Promise<any> =>
    requestJson<any>(`${API_BASE}/skills/${id}/execute`, { method: 'POST' }),
  processDialogueTurn: (speech: string): Promise<any> =>
    requestJson<any>(`${API_BASE}/dialogue/turn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speech }),
    }),
};
