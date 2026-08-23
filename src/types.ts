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

export interface AssistantMemory {
  id: string;
  key: string;
  value: string;
  learnedAt: string;
  category: 'personal' | 'preference' | 'work' | 'credential';
}

export interface TimerItem {
  id: string;
  label: string;
  durationSeconds: number;
  remainingSeconds: number;
  status: 'running' | 'paused' | 'completed';
  createdAt: string;
}

export interface ReminderItem {
  id: string;
  text: string;
  dueDateTime: string;
  status: 'pending' | 'completed';
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
  | 'general_chat'
  | 'general_query'
  | 'timer_alarm'
  | 'reminder_create'
  | 'memory_learn'
  | 'memory_recall'
  | 'weather_query'
  | 'calc_query'
  | 'note_save'
  | 'skill_learn'
  | 'custom_skill_exec'
  | 'custom_skill_learn'
  | 'dialogue_confirmation'
  | 'knowledge_qa';

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
  efficiencyRating: string;
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

// =========================================================================
// INTERACTIVE CONVERSATIONAL DIALOGUE & SKILL LEARNING TYPES
// =========================================================================

export interface DialogueTurn {
  id: string;
  speaker: 'user' | 'assistant';
  text: string;
  intent?: ActionIntentType;
  spokenResponse?: string;
  timestamp: string;
  actionCardId?: string;
}

export interface DialogueContext {
  lastMentionedContact?: ContactPerson;
  lastDraftedEmail?: EmailDraft;
  lastCreatedTask?: TaskItem;
  lastAppointment?: CalendarAppointment;
  pendingAction?: {
    type: 'confirm_send_email' | 'confirm_book_appointment' | 'confirm_delete_task' | 'confirm_run_skill' | 'send_email' | 'create_task' | string;
    payload: any;
    prompt: string;
  };
  variables: Record<string, any>;
}

export interface DialogueSession {
  id: string;
  turns: DialogueTurn[];
  context: DialogueContext;
  status: 'active' | 'idle' | 'waiting_for_confirmation';
  createdAt: string;
  updatedAt: string;
}

export type SkillActionType = 
  | 'triage_inbox'
  | 'send_email'
  | 'check_calendar'
  | 'book_appointment'
  | 'list_tasks'
  | 'summarize_kpi'
  | 'run_autonomous'
  | 'query_weather'
  | 'custom_command';

export interface SkillStep {
  id: string;
  order: number;
  actionType: SkillActionType;
  label: string;
  target?: string;
  params?: Record<string, any>;
}

export interface CustomSkill {
  id: string;
  name: string;
  triggerPhrase: string;
  description: string;
  actionSteps: SkillStep[];
  learnedAt: string;
  executionCount: number;
  isEnabled: boolean;
  source: 'voice_learned' | 'user_configured' | 'builtin';
}

export interface WakeWordConfig {
  enabled: boolean;
  wakeWords: string[];
  continuousListening: boolean;
  bargeInEnabled: boolean;
  selectedPersona: 'aria_female' | 'executive_british' | 'crisp_male' | 'warm_australian';
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
  | 'wiki'
  | 'skills';
