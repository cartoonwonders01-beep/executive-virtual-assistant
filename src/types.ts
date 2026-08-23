export type FeasibilityType = 'ai_automated' | 'human_only' | 'hybrid';

export type UserPriority = 'urgent' | 'high' | 'medium' | 'low';
export type AIPriority = 'critical' | 'high' | 'medium' | 'low' | 'defer';

export type TaskStatus = 'backlog' | 'in_progress' | 'automating' | 'completed' | 'blocked';

export type TaskCategory = 
  | 'Tech/Dev'
  | 'Business & Strategy'
  | 'Operations & Admin'
  | 'Personal & Health'
  | 'Client Projects'
  | 'Marketing & Sales'
  | 'Finance';

export interface AutomationBlueprint {
  strategy: string[];
  toolsNeeded: string[];
  executableCodeSample: string;
  codeLanguage: 'python' | 'typescript' | 'bash' | 'curl';
  bestPractices: string[];
  webInspiration: {
    title: string;
    url?: string;
    keyTakeaway: string;
  }[];
  executionReadiness: 'ready' | 'needs_credentials' | 'requires_human_review';
  estimatedHoursToBuild: number;
  recurringHoursSavedPerMonth: number;
}

export interface TaskItem {
  id: string;
  memoId?: string;
  title: string;
  description: string;
  category: TaskCategory;
  userPriority: UserPriority;
  aiPriority: AIPriority;
  priorityRationale: string;
  feasibility: FeasibilityType;
  feasibilityReasoning: string;
  valueScore: number; // 1 to 10
  estimatedValue: string; // e.g. "$2,500 MRR" or "Peace of Mind"
  manualHoursEstimate: number; // Hours for human to do manually
  automationHoursInvested: number; // Hours invested in automating
  timeWonBackHours: number; // Cumulative or monthly hours saved
  status: TaskStatus;
  startDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  durationDays: number;
  progressPercent: number;
  dependencies: string[]; // List of Task IDs
  assignee: 'AI Agent' | 'Andrew' | 'Hybrid';
  automationBlueprint?: AutomationBlueprint;
  executionLogs?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface VoiceMemo {
  id: string;
  title: string;
  audioUrl?: string;
  durationSeconds: number;
  recordedAt: string;
  transcript: string;
  status: 'processing' | 'analyzed' | 'archived';
  extractedTaskIds: string[];
  extractedActionCardIds: string[];
  summary: string;
  source: 'browser_mic' | 'ios_shortcut' | 'file_upload' | 'watch_memo';
}

export type ActionIntentType = 
  | 'email_draft'
  | 'calendar_booking'
  | 'calendar_reschedule'
  | 'calendar_cancel'
  | 'call_contact'
  | 'task_create'
  | 'automation_run'
  | 'web_search'
  | 'general_chat';

export interface EmailDraft {
  id: string;
  toName: string;
  toEmail: string;
  subject: string;
  body: string;
  tone: 'professional' | 'urgent' | 'friendly' | 'concise';
  status: 'draft' | 'ready_to_send' | 'sent';
  sentAt?: string;
}

export interface InboxEmail {
  id: string;
  fromName: string;
  fromEmail: string;
  toName: string;
  toEmail: string;
  subject: string;
  snippet: string;
  body: string;
  receivedAt: string;
  isUnread: boolean;
  isStarred: boolean;
  category: 'primary' | 'updates' | 'finance' | 'vip';
  hasAttachments?: boolean;
  suggestedReply?: string;
}

export interface CalendarAppointment {
  id: string;
  title: string;
  startDateTime: string; // ISO String
  endDateTime: string; // ISO String
  location?: string;
  attendees: { name: string; email: string }[];
  description?: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  googleCalendarUrl?: string;
}

export interface ContactPerson {
  id: string;
  name: string;
  role?: string;
  phone?: string;
  email?: string;
  company?: string;
  avatarUrl?: string;
  isVIP?: boolean;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  contactId: string;
  sender: 'Andrew' | 'Contact' | 'AI Assistant' | string;
  text: string;
  sentAt: string;
}

export interface CallLog {
  id: string;
  contactId: string;
  contactName: string;
  phone: string;
  durationSeconds: number;
  startedAt: string;
  status: 'completed' | 'missed' | 'active';
  notes: string;
  transcriptSummary?: string;
}

export interface ActionCard {
  id: string;
  intent: ActionIntentType;
  title: string;
  description: string;
  spokenResponse: string;
  status: 'pending' | 'confirmed' | 'executed' | 'dismissed';
  createdAt: string;
  emailData?: EmailDraft;
  calendarData?: CalendarAppointment;
  contactData?: ContactPerson;
  taskData?: Partial<TaskItem>;
  automationData?: {
    taskTitle: string;
    scriptPreview: string;
    executionLog?: string;
  };
}

export interface AutonomousJob {
  id: string;
  taskId: string;
  taskTitle: string;
  category: TaskCategory;
  currentStepIndex: number;
  totalSteps: number;
  currentStepText: string;
  progressPercent: number;
  status: 'idle' | 'running' | 'completed' | 'paused' | 'failed';
  logs: Array<{
    timestamp: string;
    type: 'info' | 'success' | 'warn' | 'error';
    message: string;
  }>;
  startedAt: string;
  completedAt?: string;
}

export type SwarmAgentId = 
  | 'chief_of_staff'
  | 'finance_agent'
  | 'tech_agent'
  | 'growth_agent';

export interface SwarmAgent {
  id: SwarmAgentId;
  name: string;
  role: string;
  avatar: string;
  status: 'idle' | 'active' | 'evaluating' | 'syncing';
  assignedDomain: TaskCategory;
  currentTaskTitle?: string;
  currentTaskId?: string;
  tasksCompletedCount: number;
  hoursWonBack: number;
  efficiencyRating: string; // e.g. "98.4%"
  lastActiveAt: string;
  recentLog: string;
}

export interface AgentActivityLog {
  id: string;
  agentId: SwarmAgentId;
  agentName: string;
  actionType: 'task_exec' | 'conflict_resolve' | 'invoice_parse' | 'scraper_run' | 'email_triage';
  message: string;
  timestamp: string;
}

export interface SwarmStatus {
  isRunning: boolean;
  agents: SwarmAgent[];
  activeTasksCount: number;
  totalHoursWonBack: number;
  recentLogs: AgentActivityLog[];
}

export interface KPISummary {
  totalHoursWonBack: number;
  automationHoursInvested: number;
  netROIHours: number;
  roiMultiplier: number;
  totalTasks: number;
  completedTasks: number;
  ongoingTasks: number;
  backlogTasks: number;
  aiAutomatedCount: number;
  humanOnlyCount: number;
  hybridCount: number;
  highValueCount: number;
  completionRatePercent: number;
}

export type WikiCategory = 
  | 'Voice AI & Mobile'
  | 'Executive Actions'
  | 'Work Hub & Gantt'
  | 'Automation Studio'
  | 'System Architecture';

export interface WikiArticle {
  id: string;
  slug: string;
  title: string;
  category: WikiCategory;
  summary: string;
  content: string;
  tags: string[];
  lastUpdated: string;
  author: 'AI Assistant' | 'Andrew';
  icon?: string;
}

export type AppView = 
  | 'voice_hud'
  | 'gmail'
  | 'calendar'
  | 'comms'
  | 'table'
  | 'gantt'
  | 'matrix'
  | 'autonomous'
  | 'swarm'
  | 'wiki';

