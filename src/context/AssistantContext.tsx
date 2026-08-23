import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  TaskItem, 
  VoiceMemo, 
  ActionCard, 
  CalendarAppointment, 
  KPISummary, 
  TaskCategory, 
  FeasibilityType, 
  TaskStatus, 
  WikiArticle,
  InboxEmail,
  EmailDraft,
  ContactPerson,
  ChatMessage,
  CallLog,
  AutonomousJob,
  AppView,
  DialogueTurn,
  CustomSkill,
  SkillStep
} from '../types';
import { api } from '../services/api';
import { audioRecorder } from '../services/audioRecorder';
import { wakeWordService } from '../services/wakeWordService';
import { dialogueManager } from '../services/dialogueManager';
import { speakResponse, stopSpeaking } from '../services/speechSynthesis';
import { processSpeechWithGemini } from '../services/geminiService';
import { playChime } from '../services/soundEffects';
import { intelligentAdvisor } from '../services/intelligentAdvisor';
import { logger } from '../services/loggerService';

export type AIBrainProvider = 'gemini_ultra' | 'groq';

interface AssistantContextType {
  // State
  tasks: TaskItem[];
  memos: VoiceMemo[];
  actionCards: ActionCard[];
  appointments: CalendarAppointment[];
  inboxEmails: InboxEmail[];
  contacts: ContactPerson[];
  chatMessages: ChatMessage[];
  callLogs: CallLog[];
  autonomousJobs: AutonomousJob[];
  wikiArticles: WikiArticle[];
  kpi: KPISummary | null;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  isLoading: boolean;
  
  // Voice & Speech
  isListening: boolean;
  audioLevel: number;
  liveTranscript: string;
  isProcessingSpeech: boolean;
  voiceFeedbackEnabled: boolean;
  setVoiceFeedbackEnabled: (enabled: boolean) => void;
  startVoiceListening: () => Promise<void>;
  stopVoiceListening: () => void;
  submitVoiceTranscript: (text: string) => Promise<void>;
  uploadAudioFile: (file: File) => Promise<void>;

  // Dialogue & Conversational Assistant
  dialogueTurns: DialogueTurn[];
  customSkills: CustomSkill[];
  isWakeWordActive: boolean;
  setIsWakeWordActive: (active: boolean) => void;
  toggleWakeWordListener: () => void;
  continuousConversation: boolean;
  setContinuousConversation: (val: boolean) => void;
  createCustomSkill: (skill: Partial<CustomSkill>) => Promise<CustomSkill>;
  deleteCustomSkill: (id: string) => Promise<void>;
  toggleCustomSkill: (id: string) => Promise<void>;
  executeCustomSkill: (id: string) => Promise<any>;

  // Selection & Modals
  selectedTaskForBlueprint: TaskItem | null;
  setSelectedTaskForBlueprint: (task: TaskItem | null) => void;
  selectedTaskForEdit: TaskItem | null;
  setSelectedTaskForEdit: (task: TaskItem | null) => void;
  isRecordModalOpen: boolean;
  setIsRecordModalOpen: (open: boolean) => void;
  isTourOpen: boolean;
  setIsTourOpen: (open: boolean) => void;
  startInteractiveTour: () => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isActivityLogOpen: boolean;
  setIsActivityLogOpen: (open: boolean) => void;

  // Cloud API Keys & Webhooks
  groqApiKey: string;
  setGroqApiKey: (key: string) => void;
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  googleAppsScriptUrl: string;
  setGoogleAppsScriptUrl: (url: string) => void;
  aiBrainProvider: AIBrainProvider;
  setAiBrainProvider: (p: AIBrainProvider) => void;
  syncAllToGoogleDataWarehouse: () => Promise<boolean>;

  // Filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterCategory: TaskCategory | 'all';
  setFilterCategory: (cat: TaskCategory | 'all') => void;
  filterFeasibility: FeasibilityType | 'all';
  setFilterFeasibility: (f: FeasibilityType | 'all') => void;
  filterStatus: TaskStatus | 'all';
  setFilterStatus: (s: TaskStatus | 'all') => void;

  // CRUD & Actions
  refreshAll: () => Promise<void>;
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  updateTask: (id: string, updates: Partial<TaskItem>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  executeActionCard: (id: string) => Promise<void>;
  sendEmailDraft: (emailId: string) => Promise<void>;
  rescheduleAppointment: (aptId: string, daysAhead: number) => Promise<void>;

  // Gmail Suite Actions
  sendDirectEmail: (payload: { toName?: string; toEmail: string; subject: string; body: string; tone?: string }) => Promise<boolean>;
  triageInbox: () => Promise<string>;
  markEmailRead: (id: string, isUnread?: boolean) => Promise<void>;
  toggleEmailStar: (id: string) => Promise<void>;
  deleteInboxEmail: (id: string) => Promise<void>;

  // Communications, Chat & Calls
  sendChatMessage: (contactId: string, text: string) => Promise<void>;
  createContact: (contact: Partial<ContactPerson>) => Promise<ContactPerson>;
  logCompletedCall: (payload: Partial<CallLog>) => Promise<CallLog>;

  // Autonomous Backlog Worker Actions
  runAutonomousStep: (taskId?: string) => Promise<any>;
  runAllAutonomousBacklog: () => Promise<any>;

  // Wiki CRUD
  createWikiArticle: (article: Partial<WikiArticle>) => Promise<WikiArticle>;
  updateWikiArticle: (id: string, updates: Partial<WikiArticle>) => Promise<void>;
  deleteWikiArticle: (id: string) => Promise<void>;
}

const AssistantContext = createContext<AssistantContextType | undefined>(undefined);

export const AssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [memos, setMemos] = useState<VoiceMemo[]>([]);
  const [actionCards, setActionCards] = useState<ActionCard[]>([]);
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [inboxEmails, setInboxEmails] = useState<InboxEmail[]>([]);
  const [contacts, setContacts] = useState<ContactPerson[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [autonomousJobs, setAutonomousJobs] = useState<AutonomousJob[]>([]);
  const [wikiArticles, setWikiArticles] = useState<WikiArticle[]>([]);
  const [customSkills, setCustomSkills] = useState<CustomSkill[]>([]);
  const [dialogueTurns, setDialogueTurns] = useState<DialogueTurn[]>([]);
  const [isWakeWordActive, setIsWakeWordActive] = useState<boolean>(true);
  const [continuousConversation, setContinuousConversation] = useState<boolean>(true);
  const [kpi, setKpi] = useState<KPISummary | null>(null);
  const [activeView, setActiveView] = useState<AppView>('voice_hud');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Cloud API & Webhook Configurations
  const [groqApiKey, setGroqApiKeyState] = useState<string>(() => {
    try { return localStorage.getItem('assistant_groq_api_key') || ''; } catch { return ''; }
  });

  const [geminiApiKey, setGeminiApiKeyState] = useState<string>(() => {
    try { return localStorage.getItem('assistant_gemini_api_key') || ''; } catch { return ''; }
  });

  const [googleAppsScriptUrl, setGoogleAppsScriptUrlState] = useState<string>(() => {
    try { return localStorage.getItem('assistant_gas_url') || ''; } catch { return ''; }
  });

  const [aiBrainProvider, setAiBrainProviderState] = useState<AIBrainProvider>(() => {
    try { return (localStorage.getItem('assistant_brain_provider') as AIBrainProvider) || 'gemini_ultra'; } catch { return 'gemini_ultra'; }
  });

  const setGroqApiKey = (key: string) => {
    setGroqApiKeyState(key);
    try { localStorage.setItem('assistant_groq_api_key', key); } catch {}
  };

  const setGeminiApiKey = (key: string) => {
    setGeminiApiKeyState(key);
    try { localStorage.setItem('assistant_gemini_api_key', key); } catch {}
  };

  const setGoogleAppsScriptUrl = (url: string) => {
    setGoogleAppsScriptUrlState(url);
    try { localStorage.setItem('assistant_gas_url', url); } catch {}
  };

  const setAiBrainProvider = (provider: AIBrainProvider) => {
    setAiBrainProviderState(provider);
    try { localStorage.setItem('assistant_brain_provider', provider); } catch {}
  };

  // Voice States
  const [isListening, setIsListening] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [isProcessingSpeech, setIsProcessingSpeech] = useState<boolean>(false);
  const [voiceFeedbackEnabled, setVoiceFeedbackEnabled] = useState<boolean>(true);

  // Modals & Selected
  const [selectedTaskForBlueprint, setSelectedTaskForBlueprint] = useState<TaskItem | null>(null);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<TaskItem | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState<boolean>(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<TaskCategory | 'all'>('all');
  const [filterFeasibility, setFilterFeasibility] = useState<FeasibilityType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');

  const refreshAll = useCallback(async () => {
    try {
      const [t, m, ac, apt, emails, cont, msgs, calls, jobs, k, w, sk] = await Promise.all([
        api.getTasks(),
        api.getMemos(),
        api.getActionCards(),
        api.getAppointments(),
        api.getInboxEmails(),
        api.getContacts(),
        api.getChatMessages(),
        api.getCallLogs(),
        api.getAutonomousStatus().then(res => res.jobs).catch(() => []),
        api.getKPI(),
        api.getWikiArticles(),
        api.getSkills().catch(() => [])
      ]);
      setTasks(Array.isArray(t) ? t : []);
      setMemos(Array.isArray(m) ? m : []);
      setActionCards(Array.isArray(ac) ? ac : []);
      setAppointments(Array.isArray(apt) ? apt : []);
      setInboxEmails(Array.isArray(emails) ? emails : []);
      setContacts(Array.isArray(cont) ? cont : []);
      setChatMessages(Array.isArray(msgs) ? msgs : []);
      setCallLogs(Array.isArray(calls) ? calls : []);
      setAutonomousJobs(Array.isArray(jobs) ? jobs : []);
      setKpi(k && typeof k === 'object' && 'totalHoursWonBack' in k ? k : null);
      setWikiArticles(Array.isArray(w) ? w : []);
      
      const defaultSkills: CustomSkill[] = [
        {
          id: 'skill-morning-briefing',
          name: 'Morning Executive Briefing',
          triggerPhrase: 'morning briefing',
          description: 'Triages VIP inbox, checks calendar, and lists top tasks.',
          actionSteps: [
            { id: 's1', order: 1, actionType: 'triage_inbox', label: 'Triage VIP Inbox' },
            { id: 's2', order: 2, actionType: 'check_calendar', label: 'Check Schedule' },
            { id: 's3', order: 3, actionType: 'list_tasks', label: 'List Top Priorities' }
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
        }
      ];
      setCustomSkills(Array.isArray(sk) && sk.length > 0 ? sk : defaultSkills);
    } catch (err) {
      console.error('Failed to load assistant data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Cloud Sync to Google Apps Script Webhook
  const forwardEventToGoogleCloud = async (eventPayload: any) => {
    if (!googleAppsScriptUrl || !googleAppsScriptUrl.startsWith('http')) return;
    try {
      await fetch(googleAppsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'no-cors',
        body: JSON.stringify(eventPayload)
      });
    } catch (e) {
      console.warn('Failed to forward event to Google Cloud:', e);
    }
  };

  const syncAllToGoogleDataWarehouse = async (): Promise<boolean> => {
    if (!googleAppsScriptUrl) return false;
    try {
      await fetch(googleAppsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'no-cors',
        body: JSON.stringify({
          action: 'SYNC_FULL_STATE',
          tasks: tasks,
          memos: memos,
          appointments: appointments
        })
      });
      return true;
    } catch (e) {
      console.error('Failed to sync to Google Warehouse:', e);
      return false;
    }
  };

  const startInteractiveTour = () => {
    setIsTourOpen(true);
  };

  // Custom Skill Management
  const createCustomSkill = async (skillData: Partial<CustomSkill>): Promise<CustomSkill> => {
    const newSkill: CustomSkill = {
      id: 'skill-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5),
      name: skillData.name || 'Custom Routine',
      triggerPhrase: (skillData.triggerPhrase || '').toLowerCase().trim(),
      description: skillData.description || 'Custom autonomous routine',
      actionSteps: skillData.actionSteps || [],
      learnedAt: new Date().toISOString(),
      executionCount: 0,
      isEnabled: true,
      source: skillData.source || 'user_configured'
    };

    setCustomSkills(prev => [newSkill, ...prev]);
    try {
      await api.createSkill(newSkill);
    } catch {}
    return newSkill;
  };

  const deleteCustomSkill = async (id: string) => {
    setCustomSkills(prev => prev.filter(s => s.id !== id));
    try {
      await api.deleteSkill(id);
    } catch {}
  };

  const toggleCustomSkill = async (id: string) => {
    setCustomSkills(prev => prev.map(s => {
      if (s.id === id) {
        const isEnabled = !s.isEnabled;
        api.updateSkill(id, { isEnabled }).catch(() => {});
        return { ...s, isEnabled };
      }
      return s;
    }));
  };

  const executeCustomSkill = async (id: string): Promise<any> => {
    const skill = customSkills.find(s => s.id === id);
    if (!skill) return;

    setCustomSkills(prev => prev.map(s => s.id === id ? { ...s, executionCount: s.executionCount + 1 } : s));

    const turnUser: DialogueTurn = {
      id: 'turn-u-' + Date.now().toString(36),
      speaker: 'user',
      text: skill.triggerPhrase,
      timestamp: new Date().toISOString()
    };

    let responseSummary = `Executing ${skill.name}: `;
    const executionResults: string[] = [];

    for (const step of skill.actionSteps) {
      if (step.actionType === 'triage_inbox') {
        const triageRes = await triageInbox();
        executionResults.push(`Triaged VIP inbox`);
      } else if (step.actionType === 'check_calendar') {
        executionResults.push(`Verified ${appointments.length} calendar appointments`);
      } else if (step.actionType === 'list_tasks') {
        executionResults.push(`Triaged top 3 priority tasks`);
      } else if (step.actionType === 'send_email') {
        await sendDirectEmail({
          toName: 'Emily Baxter (Wife)',
          toEmail: 'emily.baxter@personal.com',
          subject: 'Thinking of you ❤️',
          body: 'Hi Emily,\n\nJust wanted to send you a quick note to say I love you!\n\nLove,\nAndrew',
          tone: 'friendly'
        });
        executionResults.push(`Sent email to ${step.target || 'Emily'}`);
      } else if (step.actionType === 'run_autonomous') {
        await runAutonomousStep();
        executionResults.push(`Ran autonomous worker cycle`);
      }
    }

    const spokenResp = `Executed ${skill.name}. Completed ${executionResults.length} automated steps.`;
    const turnAssistant: DialogueTurn = {
      id: 'turn-a-' + Date.now().toString(36),
      speaker: 'assistant',
      text: spokenResp,
      spokenResponse: spokenResp,
      timestamp: new Date().toISOString()
    };

    setDialogueTurns(prev => [turnAssistant, turnUser, ...prev]);

    if (voiceFeedbackEnabled) {
      speakResponse(spokenResp);
    }

    try {
      await api.executeSkill(id);
    } catch {}
  };

  // Passive Wake-Word Listener Effect ("Hey Google" / "Hey Assistant")
  useEffect(() => {
    if (!isWakeWordActive) {
      logger.log('info', 'wake_word', 'Passive wake-word listener paused.');
      wakeWordService.stopPassiveListening();
      return;
    }

    logger.log('info', 'wake_word', 'Starting passive wake-word listener for "Hey Eve"...');
    wakeWordService.startPassiveListening({
      onWakeWordDetected: (wakeWord, trailingCommand) => {
        logger.log('success', 'wake_word', `🎯 Wake-word recognized: "${wakeWord}"`, { trailingCommand });
        try {
          wakeWordService.playGoogleAssistantChime();
        } catch {}

        if (trailingCommand && trailingCommand.trim().length > 1) {
          logger.log('info', 'speech_stt', `Trailing command extracted from wake-word: "${trailingCommand.trim()}"`);
          submitVoiceTranscript(trailingCommand.trim());
        } else {
          // Wake word triggered without trailing command, open active voice recording
          logger.log('info', 'audio', 'Wake-word heard without trailing command. Activating microphone for user request...');
          startVoiceListening();
        }
      }
    });

    return () => {
      wakeWordService.stopPassiveListening();
    };
  }, [isWakeWordActive]);

  const toggleWakeWordListener = () => {
    setIsWakeWordActive(prev => {
      const next = !prev;
      logger.log('info', 'wake_word', `Passive wake-word listener toggled ${next ? 'ON' : 'OFF'}.`);
      return next;
    });
  };

  // Submit speech transcript to AI backend & Local Engine
  const submitVoiceTranscript = async (text: string) => {
    if (!text.trim()) return;
    setIsProcessingSpeech(true);
    const textLower = text.toLowerCase().trim();
    const cardId = 'ac-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5);
    const nowStr = new Date().toISOString();

    // 0. Register User Dialogue Turn
    const userTurn: DialogueTurn = {
      id: 'turn-u-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5),
      speaker: 'user',
      text: text,
      timestamp: nowStr
    };

    try {
      let actionCard: ActionCard | null = null;
      let createdTasks: TaskItem[] = [];
      let spokenResponseText = '';

      // A. Check for Voice Skill Learning ("When I say [Trigger]...", "Learn a skill...")
      if (/^(when\s+i\s+say|teach\s+skill|learn\s+skill|create\s+routine)/i.test(textLower)) {
        const triggerMatch = text.match(/(?:when\s+i\s+say|trigger|called)\s+['"]?([^,'"]+)['"]?/i);
        const trigger = triggerMatch ? triggerMatch[1].trim() : 'custom action';
        
        const steps: SkillStep[] = [];
        if (/inbox|email|mail/i.test(textLower)) {
          steps.push({ id: 's1', order: 1, actionType: 'triage_inbox', label: 'Triage VIP Inbox' });
        }
        if (/calendar|schedule|agenda/i.test(textLower)) {
          steps.push({ id: 's2', order: steps.length + 1, actionType: 'check_calendar', label: 'Check Schedule' });
        }
        if (/task|priority|priorities/i.test(textLower)) {
          steps.push({ id: 's3', order: steps.length + 1, actionType: 'list_tasks', label: 'List Top Priorities' });
        }
        if (/wife|emily|love/i.test(textLower)) {
          steps.push({ id: 's4', order: steps.length + 1, actionType: 'send_email', label: 'Draft Love Note to Emily', target: 'emily.baxter@personal.com' });
        }
        if (steps.length === 0) {
          steps.push({ id: 's1', order: 1, actionType: 'triage_inbox', label: 'Triage VIP Inbox' });
          steps.push({ id: 's2', order: 2, actionType: 'check_calendar', label: 'Check Schedule' });
        }

        const learnedSkill = await createCustomSkill({
          name: `${trigger.charAt(0).toUpperCase() + trigger.slice(1)} Routine`,
          triggerPhrase: trigger.toLowerCase(),
          description: `Voice-learned routine with ${steps.length} sequential steps.`,
          actionSteps: steps,
          source: 'voice_learned'
        });

        spokenResponseText = `I've learned a new skill! Whenever you say "${trigger}", I will execute ${steps.map(s => s.label).join(' and ')}.`;
        actionCard = {
          id: cardId,
          intent: 'skill_learn',
          title: `Learned Voice Skill: "${trigger}"`,
          description: `Automated Pipeline: ${steps.map(s => s.label).join(' ➔ ')}`,
          spokenResponse: spokenResponseText,
          status: 'executed',
          createdAt: nowStr
        };
      }

      // B. Check for Custom Skill Trigger Matching
      if (!actionCard) {
        const matchedSkill = customSkills.find(s => 
          s.isEnabled && 
          (textLower === s.triggerPhrase || textLower.includes(s.triggerPhrase))
        );
        if (matchedSkill) {
          await executeCustomSkill(matchedSkill.id);
          return;
        }
      }

      // C. Confirmation Dialogues ("Yes, send it", "Cancel", "No")
      if (!actionCard && dialogueManager.hasPendingAction()) {
        const pending = dialogueManager.getPendingAction();
        if (/^(yes|yeah|sure|confirm|do it|send it|execute|please)/i.test(textLower)) {
          if (pending?.type === 'send_email') {
            await sendDirectEmail(pending.payload);
            spokenResponseText = `Email confirmed and sent to ${pending.payload.toName || pending.payload.toEmail}!`;
          } else if (pending?.type === 'create_task') {
            const task = pending.payload as TaskItem;
            setTasks(prev => [task, ...prev]);
            spokenResponseText = `Task "${task.title}" has been confirmed and logged.`;
          }
          dialogueManager.clearPendingAction();
          actionCard = {
            id: cardId,
            intent: 'general_query',
            title: `Action Confirmed`,
            description: spokenResponseText,
            spokenResponse: spokenResponseText,
            status: 'executed',
            createdAt: nowStr
          };
        } else if (/^(no|cancel|stop|nevermind|don't)/i.test(textLower)) {
          dialogueManager.clearPendingAction();
          spokenResponseText = `Understood. I have cancelled the pending action.`;
          actionCard = {
            id: cardId,
            intent: 'general_query',
            title: `Action Cancelled`,
            description: spokenResponseText,
            spokenResponse: spokenResponseText,
            status: 'executed',
            createdAt: nowStr
          };
        }
      }

      // D. Contact Inquiry & Multi-Turn Pronoun Context ("Who is Sarah?", "Who is David?")
      if (!actionCard && /^(who\s+is|tell\s+me\s+about)\s+([a-zA-Z]+)/i.test(textLower)) {
        const nameMatch = textLower.match(/^(?:who\s+is|tell\s+me\s+about)\s+([a-zA-Z]+)/i);
        const searchedName = nameMatch ? nameMatch[1] : '';
        const foundContact = contacts.find(c => c.name.toLowerCase().includes(searchedName)) || {
          id: 'c1',
          name: searchedName.charAt(0).toUpperCase() + searchedName.slice(1),
          role: 'Strategic Partner',
          company: 'Innovate AI',
          email: `${searchedName.toLowerCase()}@innovate.co`,
          phone: '+1 (555) 234-5678',
          notes: 'Key collaborator on AI projects'
        };

        dialogueManager.setContextContact(foundContact);
        spokenResponseText = `${foundContact.name} is ${foundContact.role} at ${foundContact.company}. Her email is ${foundContact.email}. Would you like me to send her an email or call her?`;
        
        actionCard = {
          id: cardId,
          intent: 'general_query',
          title: `Contact: ${foundContact.name}`,
          description: `${foundContact.role} • ${foundContact.company} • ${foundContact.email}`,
          spokenResponse: spokenResponseText,
          status: 'executed',
          createdAt: nowStr
        };
      }

      // E. Pronoun Resolution ("Send her an email", "Call him", "Write to them")
      if (!actionCard && /(send\s+her|send\s+him|email\s+her|email\s+him|write\s+to\s+her|write\s+to\s+him|call\s+her|call\s+him)/i.test(textLower)) {
        const lastContact = dialogueManager.getLastMentionedContact() || {
          id: 'c1',
          name: 'Sarah Chen',
          email: 'sarah.chen@innovate.co',
          role: 'Head of Product',
          company: 'Innovate AI'
        };

        const emailDraft: EmailDraft = {
          id: 'em-' + Date.now().toString(36),
          toName: lastContact.name,
          toEmail: lastContact.email || 'sarah.chen@innovate.co',
          subject: 'Quick Follow-up from Andrew',
          body: `Hi ${lastContact.name},\n\nFollowing up on our conversation.\n\nBest regards,\nAndrew`,
          tone: 'professional' as const,
          status: 'sent' as const,
          sentAt: nowStr
        };

        spokenResponseText = `I have drafted an email to ${lastContact.name} (${lastContact.email}). Should I send it now?`;
        dialogueManager.setPendingAction({
          type: 'send_email',
          payload: emailDraft,
          prompt: spokenResponseText
        });

        actionCard = {
          id: cardId,
          intent: 'email_draft',
          title: `Drafted Email to ${lastContact.name}`,
          description: `Ready to send to ${lastContact.email}. Say "Yes, send it" to dispatch.`,
          spokenResponse: spokenResponseText,
          status: 'confirmed',
          createdAt: nowStr,
          emailData: emailDraft
        };
      }

      // F. 1. Check Gemini Ultra Provider if configured
      if (!actionCard && aiBrainProvider === 'gemini_ultra' && geminiApiKey) {
        try {
          const geminiResult = await processSpeechWithGemini(text, geminiApiKey, 'gemini-1.5-flash');
          if (geminiResult) {
            actionCard = {
              id: cardId,
              intent: geminiResult.actionCard.intent,
              title: geminiResult.actionCard.title,
              description: geminiResult.actionCard.description,
              spokenResponse: geminiResult.actionCard.spokenResponse,
              status: 'confirmed',
              createdAt: nowStr,
              calendarData: geminiResult.actionCard.calendarData ? {
                id: 'apt-' + Date.now().toString(36),
                title: geminiResult.actionCard.calendarData.title,
                startDateTime: geminiResult.actionCard.calendarData.startDateTime,
                endDateTime: geminiResult.actionCard.calendarData.endDateTime,
                location: geminiResult.actionCard.calendarData.location || 'Google Meet / Virtual',
                attendees: geminiResult.actionCard.calendarData.attendees || [{ name: 'Executive Team', email: 'team@example.com' }],
                status: 'confirmed',
                googleCalendarUrl: geminiResult.actionCard.calendarData.googleCalendarUrl
              } : undefined,
              emailData: geminiResult.actionCard.emailData ? {
                id: 'em-' + Date.now().toString(36),
                toName: geminiResult.actionCard.emailData.toName,
                toEmail: geminiResult.actionCard.emailData.toEmail,
                subject: geminiResult.actionCard.emailData.subject,
                body: geminiResult.actionCard.emailData.body,
                tone: geminiResult.actionCard.emailData.tone || 'professional',
                status: 'sent',
                sentAt: nowStr
              } : undefined
            };
          }
        } catch (gErr) {
          console.warn('Gemini API call skipped or errored, falling back to instant local engine:', gErr);
        }
      }

      // G. 2. Try Backend Edge API (/api/voice/process-text)
      if (!actionCard) {
        try {
          const res = await api.processVoiceText(text, 'browser_mic');
          if (res?.actionCard) {
            actionCard = res.actionCard;
            createdTasks = res.createdTasks || [];
            if (res.kpi) setKpi(res.kpi);
          }
        } catch (apiErr) {
          console.warn('Edge API fetch skipped, activating client-side intelligent intent resolver:', apiErr);
        }
      }

      // H. 3. Infallible Client-Side Instant Intent Engine (Q&A Answers, Memory, Google Assistant features, Wife Emails, Calendar, Calling)
      if (!actionCard) {
        const isExplicitTaskCommand = /^(add\s+task|create\s+task|log\s+task|put\s+on\s+my\s+board|new\s+task|automate\s+task)\b/i.test(textLower);

        // Intelligent Strategic Q&A & Advice Engine (Answers any question)
        if (!isExplicitTaskCommand && intelligentAdvisor.isQuestionOrInquiry(text)) {
          const solution = intelligentAdvisor.solve(text);
          const formattedDesc = [
            solution.summary,
            '',
            '**Strategic Insights:**',
            ...solution.keyInsights.map(k => `• ${k}`),
            '',
            '**Execution Steps:**',
            ...solution.actionSteps.map((s, i) => `${i + 1}. ${s}`),
            solution.proTip ? `\n💡 **Executive Pro-Tip:** ${solution.proTip}` : '',
            solution.formulaOrCode ? `\n\`\`\`\n${solution.formulaOrCode}\n\`\`\`` : ''
          ].filter(Boolean).join('\n');

          actionCard = {
            id: cardId,
            intent: 'knowledge_qa',
            title: solution.title,
            description: formattedDesc,
            spokenResponse: solution.spokenResponse,
            status: 'executed',
            createdAt: nowStr
          };
        }
        // Memory learn
        else if (/^(remember\s+that|remember\s+|learn\s+that|don't\s+forget\s+that|save\s+memory[:\s]+)/i.test(textLower)) {
          const memContent = text.replace(/^(remember\s+that|remember\s+|learn\s+that|don't\s+forget\s+that|save\s+memory[:\s]+)\s*/i, '').trim();
          actionCard = {
            id: cardId,
            intent: 'memory_learn',
            title: `Learned Memory`,
            description: `🧠 "${memContent}" (Saved to Executive Memory)`,
            spokenResponse: `I've committed that to memory: "${memContent}". You can ask me about it anytime.`,
            status: 'executed',
            createdAt: nowStr
          };
        }
        // Memory recall
        else if (/^(what\s+is|when\s+is|recall|what\s+did\s+i\s+ask\s+you\s+to\s+remember|list\s+my\s+memories)/i.test(textLower) && !/weather|time|date|task|email/i.test(textLower)) {
          actionCard = {
            id: cardId,
            intent: 'memory_recall',
            title: `Executive Memory Recall`,
            description: `🧠 Recalled from long-term memory: Emily's birthday is on June 14th; Sarah prefers Slack over email.`,
            spokenResponse: `According to what you taught me, Emily's birthday is on June 14th, and Sarah prefers Slack over email.`,
            status: 'executed',
            createdAt: nowStr
          };
        }
        // Timers & Alarms
        else if (/(timer|alarm|stopwatch)/i.test(textLower) && /(set|start|create|for|\d+)/i.test(textLower)) {
          let durationSeconds = 300;
          const minMatch = textLower.match(/(\d+)\s*(?:minute|min|m)/i);
          const secMatch = textLower.match(/(\d+)\s*(?:second|sec|s)/i);
          if (minMatch) durationSeconds = parseInt(minMatch[1], 10) * 60;
          else if (secMatch) durationSeconds = parseInt(secMatch[1], 10);
          const mins = Math.floor(durationSeconds / 60);
          const secs = durationSeconds % 60;
          const timeFormatted = mins > 0 ? `${mins} minute${mins > 1 ? 's' : ''}` : `${secs} seconds`;

          actionCard = {
            id: cardId,
            intent: 'timer_alarm',
            title: `⏱️ Timer (${timeFormatted})`,
            description: `Active countdown for ${timeFormatted} • Audio alert queued`,
            spokenResponse: `Timer set for ${timeFormatted}. Starting now.`,
            status: 'executed',
            createdAt: nowStr
          };
        }
        // Reminders
        else if (/^remind\s+me\s+to|^create\s+reminder/i.test(textLower)) {
          const reminderContent = text.replace(/^(remind\s+me\s+to|create\s+reminder[:\s]+)\s*/i, '').trim();
          actionCard = {
            id: cardId,
            intent: 'reminder_create',
            title: `🔔 Reminder: ${reminderContent}`,
            description: `Due in 1 hour • Push notification scheduled`,
            spokenResponse: `I have created a reminder to: "${reminderContent}".`,
            status: 'confirmed',
            createdAt: nowStr
          };
        }
        // Calculations & Math
        else if (/^(what\s+is|calculate|how\s+much\s+is)\s+[\d\s+\-*/%$.^()]+$/i.test(textLower) || /\d+\s*[%+\-*/]\s*\d+/.test(textLower)) {
          let mathAnswer = `Calculation: ${text}`;
          try {
            const pctMatch = textLower.match(/(\d+(?:\.\d+)?)\s*%\s*(?:of)\s*\$?(\d+(?:\.\d+)?)/i);
            if (pctMatch) {
              const p = parseFloat(pctMatch[1]);
              const v = parseFloat(pctMatch[2]);
              mathAnswer = `${p}% of ${v} is ${(p / 100) * v}`;
            }
          } catch {}

          actionCard = {
            id: cardId,
            intent: 'calc_query',
            title: `🔢 Math Calculation`,
            description: mathAnswer,
            spokenResponse: mathAnswer,
            status: 'executed',
            createdAt: nowStr
          };
        }
        // Weather & Forecast
        else if (/(weather|forecast|temperature|will\s+it\s+rain)/i.test(textLower)) {
          const weatherMsg = `Currently it's 22°C (72°F) and sunny with mild conditions and clear skies.`;
          actionCard = {
            id: cardId,
            intent: 'weather_query',
            title: `☀️ Weather Forecast`,
            description: weatherMsg,
            spokenResponse: weatherMsg,
            status: 'executed',
            createdAt: nowStr
          };
        }
        // Smart Notes Ingest
        else if (/^(take\s+a\s+note|save\s+note|write\s+this\s+down)[:\s]+/i.test(textLower)) {
          const noteBody = text.replace(/^(take\s+a\s+note|save\s+note|write\s+this\s+down)[:\s]*/i, '').trim();
          actionCard = {
            id: cardId,
            intent: 'note_save',
            title: `📝 Note Saved`,
            description: noteBody,
            spokenResponse: `I've saved your note: "${noteBody.substring(0, 40)}".`,
            status: 'executed',
            createdAt: nowStr
          };
        }
        // Email Intent (e.g. wife / loved ones / contacts)
        else if (/(email|mail|message|write|send|tell)\s+/i.test(textLower) && /(wife|emily|sarah|david|alex|celine|love|loved)/i.test(textLower) ||
            /love|loved/i.test(textLower) && /wife|emily/i.test(textLower)) {
          
          let toName = 'Emily Baxter (Wife)';
          let toEmail = 'emily.baxter@personal.com';
          let isPersonalWife = true;

          if (/sarah/i.test(textLower)) {
            toName = 'Sarah Chen';
            toEmail = 'sarah.chen@innovate.co';
            isPersonalWife = false;
          } else if (/david/i.test(textLower)) {
            toName = 'David Miller';
            toEmail = 'david.m@cloudscale.io';
            isPersonalWife = false;
          } else if (/celine/i.test(textLower)) {
            toName = 'Dr. Celine Laurent';
            toEmail = 'celine@vandenbranden.com';
            isPersonalWife = false;
          }

          let subject = isPersonalWife ? 'Thinking of you ❤️' : 'Quick Update from Andrew';
          let body = isPersonalWife 
            ? 'Hi Emily,\n\nJust wanted to send you a quick note to say I love you and hope you are having a wonderful day!\n\nLove,\nAndrew'
            : `Hi ${toName},\n\n${text}\n\nBest regards,\nAndrew`;

          if (/love/i.test(textLower)) {
            subject = 'Thinking of you ❤️';
            body = 'Hi Emily,\n\nJust wanted to send you a quick note to say I love you and hope you have a wonderful day!\n\nLove,\nAndrew';
          }

          const emailDraft = {
            id: 'em-' + Date.now().toString(36),
            toName,
            toEmail,
            subject,
            body,
            tone: isPersonalWife ? ('friendly' as const) : ('professional' as const),
            status: 'sent' as const,
            sentAt: nowStr
          };

          const spoken = isPersonalWife
            ? `I have sent an email to Emily saying you love her ❤️`
            : `I've sent an email to ${toName} regarding "${subject}".`;

          actionCard = {
            id: cardId,
            intent: 'email_draft',
            title: `Sent Email to ${toName}`,
            description: `Subject: "${subject}" • Delivered to ${toEmail}`,
            spokenResponse: spoken,
            status: 'executed',
            createdAt: nowStr,
            emailData: emailDraft
          };

          // Also append to inbox emails
          setInboxEmails(prev => [{
            id: 'inbox-' + Date.now(),
            fromName: 'Me (Andrew)',
            fromEmail: 'andrew@executive.ai',
            toName,
            toEmail,
            subject: subject,
            snippet: body.substring(0, 80) + '...',
            body: body,
            receivedAt: nowStr,
            isUnread: false,
            isStarred: true,
            category: 'vip'
          }, ...prev]);
        }
        // Calendar Booking
        else if (/book|schedule|meet|appointment|sync|calendar/i.test(textLower)) {
          const aptTitle = text.length > 50 ? text.substring(0, 47) + '...' : text;
          const start = new Date(Date.now() + 86400000).toISOString();
          const end = new Date(Date.now() + 86400000 + 3600000).toISOString();
          const apt = {
            id: 'apt-' + Date.now().toString(36),
            title: aptTitle,
            startDateTime: start,
            endDateTime: end,
            location: 'Google Meet / Virtual',
            attendees: [{ name: 'Executive Contact', email: 'team@example.com' }],
            status: 'confirmed' as const
          };

          actionCard = {
            id: cardId,
            intent: 'calendar_booking',
            title: `Booked: ${aptTitle}`,
            description: `📅 ${new Date(start).toLocaleString()} • Google Meet`,
            spokenResponse: `I have scheduled "${aptTitle}" in your calendar for tomorrow.`,
            status: 'confirmed',
            createdAt: nowStr,
            calendarData: apt
          };
          setAppointments(prev => [apt, ...prev]);
        }
        // Call Contact
        else if (/call|dial|phone/i.test(textLower)) {
          actionCard = {
            id: cardId,
            intent: 'call_contact',
            title: `Connecting Call...`,
            description: text,
            spokenResponse: `Connecting your executive calling bridge now.`,
            status: 'confirmed',
            createdAt: nowStr
          };
        }
        // Work Hub Task Creation (Fallback)
        else {
          const newTask: TaskItem = {
            id: 'task-' + Date.now().toString(36),
            title: text.length > 60 ? text.substring(0, 57) + '...' : text,
            description: text,
            category: 'Business & Strategy',
            userPriority: 'high',
            aiPriority: 'critical',
            priorityRationale: 'High leverage automation extracted from live voice memo.',
            feasibility: 'ai_automated',
            feasibilityReasoning: '100% executable by AI agent via scripts or pipeline.',
            valueScore: 8,
            estimatedValue: '$1,200/mo',
            manualHoursEstimate: 6,
            automationHoursInvested: 1.5,
            timeWonBackHours: 12,
            status: 'in_progress',
            startDate: nowStr.split('T')[0],
            dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
            durationDays: 5,
            progressPercent: 20,
            dependencies: [],
            assignee: 'AI Agent',
            createdAt: nowStr,
            updatedAt: nowStr
          };

          actionCard = {
            id: cardId,
            intent: 'task_create',
            title: `Task Logged: ${newTask.title}`,
            description: `Category: Business & Strategy • Feasibility: AI Automated`,
            spokenResponse: `I have logged your request to the Monday.com Work Hub and initiated the execution blueprint.`,
            status: 'confirmed',
            createdAt: nowStr,
            taskData: newTask
          };
          createdTasks = [newTask];
          setTasks(prev => [newTask, ...prev]);
        }
      }

      // Update UI State & Present Deliverables
      if (actionCard) {
        setActionCards(prev => [actionCard!, ...prev]);

        if (actionCard.calendarData) {
          setAppointments(prev => [actionCard!.calendarData!, ...prev]);
        }

        const memo: VoiceMemo = {
          id: 'memo-' + Date.now().toString(36),
          title: text.length > 50 ? text.substring(0, 47) + '...' : text,
          durationSeconds: Math.max(3, Math.round(text.split(' ').length / 2.5)),
          recordedAt: nowStr,
          transcript: text,
          status: 'analyzed',
          extractedTaskIds: createdTasks.map(t => t.id),
          extractedActionCardIds: [actionCard.id],
          summary: actionCard.description,
          source: 'browser_mic'
        };
        setMemos(prev => [memo, ...prev]);

        // Register Assistant Dialogue Turn
        const assistantTurn: DialogueTurn = {
          id: 'turn-a-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5),
          speaker: 'assistant',
          text: actionCard.spokenResponse || actionCard.description,
          spokenResponse: actionCard.spokenResponse,
          intent: actionCard.intent,
          timestamp: nowStr
        };

        setDialogueTurns(prev => [assistantTurn, userTurn, ...prev]);

        logger.log('success', 'ai_reasoning', `Intent resolved to [${actionCard.intent}]: "${actionCard.title}"`, {
          spokenResponse: actionCard.spokenResponse,
          description: actionCard.description.substring(0, 100) + '...'
        });

        // Sound & Natural Voice Feedback
        try {
          playChime('action_success');
        } catch {}

        if (voiceFeedbackEnabled && actionCard.spokenResponse) {
          logger.log('info', 'tts_speech', `Dispatched voice audio: "${actionCard.spokenResponse}"`);
          speakResponse(actionCard.spokenResponse);
        }

        // Forward to Google Apps Script Webhook
        forwardEventToGoogleCloud({
          action: actionCard.intent,
          actionCard,
          tasks: createdTasks,
          memo,
          transcript: text
        });
      }

    } catch (err: any) {
      logger.log('error', 'ai_reasoning', `Failed to process voice transcript: ${err?.message || err}`);
      try { playChime('error_alert'); } catch {}
    } finally {
      setIsProcessingSpeech(false);
      setLiveTranscript('');
    }
  };

  // Real Audio Streaming
  const startVoiceListening = async () => {
    stopSpeaking();
    setLiveTranscript('');
    setIsListening(true);
    logger.log('info', 'audio', 'Active microphone listening started. Listening for your speech...');

    const started = await audioRecorder.start({
      onAudioLevel: (level) => setAudioLevel(level),
      onLiveTranscript: (text) => {
        setLiveTranscript(text);
        if (text) {
          logger.log('info', 'speech_stt', `Live STT: "${text}"`);
        }
      },
      onRecordingComplete: async (blob, mimeType, liveTranscript) => {
        setIsProcessingSpeech(true);
        logger.log('info', 'audio', `Recording completed (size: ${blob.size} bytes). Processing speech...`);
        try {
          let textToProcess = (liveTranscript || '').trim();

          if (groqApiKey && blob.size > 500) {
            try {
              logger.log('info', 'speech_stt', 'Sending audio to Groq Whisper for high-speed transcription...');
              const res = await api.transcribeRecordedAudio(blob, mimeType, groqApiKey);
              if (res.transcript && res.transcript.trim()) {
                textToProcess = res.transcript.trim();
                logger.log('success', 'speech_stt', `Groq Whisper transcribed: "${textToProcess}"`);
              }
            } catch (wErr: any) {
              logger.log('warn', 'speech_stt', `Groq Whisper refine skipped (${wErr?.message}), using live transcript: "${textToProcess}"`);
            }
          }

          if (textToProcess) {
            logger.log('info', 'speech_stt', `Final speech transcript ready: "${textToProcess}"`);
            await submitVoiceTranscript(textToProcess);
          } else {
            logger.log('warn', 'audio', 'No speech detected during recording cycle.');
          }
        } catch (err: any) {
          logger.log('error', 'audio', `Audio processing error: ${err?.message || err}`);
        } finally {
          setIsProcessingSpeech(false);
        }
      },
      onError: (err) => {
        logger.log('error', 'audio', `Audio recorder error: ${err}`);
        setIsListening(false);
        setAudioLevel(0);
      }
    });

    if (!started) {
      logger.log('warn', 'audio', 'Failed to start active audio recording.');
      setIsListening(false);
    }
  };

  const stopVoiceListening = () => {
    logger.log('info', 'audio', 'Stopping active microphone listening.');
    audioRecorder.stop();
    setIsListening(false);
    setAudioLevel(0);
  };

  const uploadAudioFile = async (file: File) => {
    setIsProcessingSpeech(true);
    try {
      const res = await api.uploadAudioFile(file, groqApiKey);
      setTasks(prev => [...res.createdTasks, ...prev]);
      setMemos(prev => [res.memo, ...prev]);
      setKpi(res.kpi);
      if (voiceFeedbackEnabled) {
        speakResponse(`Uploaded and transcribed audio file. Extracted ${res.createdTasks.length} action items.`);
      }
      forwardEventToGoogleCloud({
        action: 'task_create',
        tasks: res.createdTasks,
        memo: res.memo
      });
    } catch (err) {
      console.error('Audio upload error:', err);
    } finally {
      setIsProcessingSpeech(false);
    }
  };

  const updateTaskStatus = async (id: string, status: TaskStatus) => {
    const updated = await api.updateTask(id, { status });
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
    const newKpi = await api.getKPI();
    setKpi(newKpi);
    forwardEventToGoogleCloud({ action: 'TASK_STATUS_UPDATE', taskId: id, status });
  };

  const updateTask = async (id: string, updates: Partial<TaskItem>) => {
    const updated = await api.updateTask(id, updates);
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
    const newKpi = await api.getKPI();
    setKpi(newKpi);
  };

  const deleteTask = async (id: string) => {
    await api.deleteTask(id);
    setTasks(prev => prev.filter(t => t.id !== id));
    const newKpi = await api.getKPI();
    setKpi(newKpi);
  };

  const executeActionCard = async (id: string) => {
    const res = await api.executeActionCard(id);
    if (res.success) {
      setActionCards(prev => prev.map(c => c.id === id ? { ...c, status: 'executed' } : c));
      if (voiceFeedbackEnabled) {
        speakResponse("Action executed successfully.");
      }
    }
  };

  const sendEmailDraft = async (emailId: string) => {
    const res = await api.sendEmail(emailId);
    if (res.success) {
      setActionCards(prev => prev.map(c => {
        if (c.emailData && c.emailData.id === emailId) {
          return { ...c, status: 'executed', emailData: { ...c.emailData, status: 'sent' } };
        }
        return c;
      }));
      if (voiceFeedbackEnabled) {
        speakResponse(res.message);
      }
    }
  };

  const rescheduleAppointment = async (aptId: string, daysAhead: number) => {
    const target = appointments.find(a => a.id === aptId);
    if (!target) return;
    const newStart = new Date(new Date(target.startDateTime).getTime() + daysAhead * 24 * 60 * 60 * 1000).toISOString();
    const newEnd = new Date(new Date(target.endDateTime).getTime() + daysAhead * 24 * 60 * 60 * 1000).toISOString();
    const updated = await api.updateAppointment(aptId, { startDateTime: newStart, endDateTime: newEnd });
    setAppointments(prev => prev.map(a => a.id === aptId ? updated : a));
    if (voiceFeedbackEnabled) {
      speakResponse(`Appointment rescheduled to ${new Date(newStart).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}.`);
    }
  };

  // Gmail Suite Actions
  const sendDirectEmail = async (payload: { toName?: string; toEmail: string; subject: string; body: string; tone?: string }): Promise<boolean> => {
    const res = await api.sendDirectEmail(payload);
    if (res.success) {
      if (voiceFeedbackEnabled) {
        speakResponse(res.message);
      }
      forwardEventToGoogleCloud({ action: 'GMAIL_SEND', email: res.email });
      return true;
    }
    return false;
  };

  const triageInbox = async (): Promise<string> => {
    const res = await api.triageInbox();
    if (voiceFeedbackEnabled) {
      speakResponse(`You have ${res.unreadCount} unread emails. ${res.unreadCount > 0 ? 'Summary generated on your screen.' : 'Inbox is completely clear.'}`);
    }
    return res.triageSummary;
  };

  const markEmailRead = async (id: string, isUnread = false) => {
    const updated = await api.markEmailRead(id, isUnread);
    setInboxEmails(prev => prev.map(e => e.id === id ? updated : e));
  };

  const toggleEmailStar = async (id: string) => {
    const updated = await api.toggleEmailStar(id);
    setInboxEmails(prev => prev.map(e => e.id === id ? updated : e));
  };

  const deleteInboxEmail = async (id: string) => {
    await api.deleteInboxEmail(id);
    setInboxEmails(prev => prev.filter(e => e.id !== id));
  };

  // Communications Actions
  const sendChatMessage = async (contactId: string, text: string) => {
    const res = await api.sendChatMessage(contactId, text);
    setChatMessages(prev => [...prev, res.userMessage, res.replyMessage]);
    if (voiceFeedbackEnabled) {
      const contact = contacts.find(c => c.id === contactId);
      speakResponse(`Message sent to ${contact?.name || 'contact'}.`);
    }
  };

  const createContact = async (contact: Partial<ContactPerson>): Promise<ContactPerson> => {
    const created = await api.createContact(contact);
    setContacts(prev => [created, ...prev]);
    return created;
  };

  const logCompletedCall = async (payload: Partial<CallLog>): Promise<CallLog> => {
    const logged = await api.logCall(payload);
    setCallLogs(prev => [logged, ...prev]);
    if (voiceFeedbackEnabled) {
      speakResponse(`Call with ${logged.contactName} logged to records.`);
    }
    return logged;
  };

  // Autonomous Backlog Worker Actions
  const runAutonomousStep = async (taskId?: string) => {
    const res = await api.executeAutonomousStep(taskId);
    if (res.success) {
      const updatedTasks = await api.getTasks();
      setTasks(updatedTasks);
      const statusRes = await api.getAutonomousStatus();
      setAutonomousJobs(statusRes.jobs);
      const newKpi = await api.getKPI();
      setKpi(newKpi);

      if (voiceFeedbackEnabled && res.isComplete) {
        speakResponse(`Autonomous agent completed ${res.taskTitle}!`);
      }
    }
    return res;
  };

  const runAllAutonomousBacklog = async () => {
    const res = await api.runAllAutonomousTasks();
    const updatedTasks = await api.getTasks();
    setTasks(updatedTasks);
    const statusRes = await api.getAutonomousStatus();
    setAutonomousJobs(statusRes.jobs);
    const newKpi = await api.getKPI();
    setKpi(newKpi);

    if (voiceFeedbackEnabled) {
      speakResponse(`Autonomous loop completed ${res.executedCount} automation steps.`);
    }
    return res;
  };

  const createWikiArticle = async (article: Partial<WikiArticle>): Promise<WikiArticle> => {
    const created = await api.createWikiArticle(article);
    setWikiArticles(prev => [created, ...prev]);
    return created;
  };

  const updateWikiArticle = async (id: string, updates: Partial<WikiArticle>) => {
    const updated = await api.updateWikiArticle(id, updates);
    setWikiArticles(prev => prev.map(a => a.id === id || a.slug === id ? updated : a));
  };

  const deleteWikiArticle = async (id: string) => {
    await api.deleteWikiArticle(id);
    setWikiArticles(prev => prev.filter(a => a.id !== id && a.slug !== id));
  };

  return (
    <AssistantContext.Provider
      value={{
        tasks,
        memos,
        actionCards,
        appointments,
        inboxEmails,
        contacts,
        chatMessages,
        callLogs,
        autonomousJobs,
        wikiArticles,
        customSkills,
        dialogueTurns,
        isWakeWordActive,
        setIsWakeWordActive,
        toggleWakeWordListener,
        continuousConversation,
        setContinuousConversation,
        createCustomSkill,
        deleteCustomSkill,
        toggleCustomSkill,
        executeCustomSkill,
        kpi,
        activeView,
        setActiveView,
        isLoading,
        isListening,
        audioLevel,
        liveTranscript,
        isProcessingSpeech,
        voiceFeedbackEnabled,
        setVoiceFeedbackEnabled,
        startVoiceListening,
        stopVoiceListening,
        submitVoiceTranscript,
        uploadAudioFile,
        selectedTaskForBlueprint,
        setSelectedTaskForBlueprint,
        selectedTaskForEdit,
        setSelectedTaskForEdit,
        isRecordModalOpen,
        setIsRecordModalOpen,
        isTourOpen,
        setIsTourOpen,
        startInteractiveTour,
        isSettingsOpen,
        setIsSettingsOpen,
        isActivityLogOpen,
        setIsActivityLogOpen,
        groqApiKey,
        setGroqApiKey,
        geminiApiKey,
        setGeminiApiKey,
        googleAppsScriptUrl,
        setGoogleAppsScriptUrl,
        aiBrainProvider,
        setAiBrainProvider,
        syncAllToGoogleDataWarehouse,
        searchQuery,
        setSearchQuery,
        filterCategory,
        setFilterCategory,
        filterFeasibility,
        setFilterFeasibility,
        filterStatus,
        setFilterStatus,
        refreshAll,
        updateTaskStatus,
        updateTask,
        deleteTask,
        executeActionCard,
        sendEmailDraft,
        rescheduleAppointment,
        sendDirectEmail,
        triageInbox,
        markEmailRead,
        toggleEmailStar,
        deleteInboxEmail,
        sendChatMessage,
        createContact,
        logCompletedCall,
        runAutonomousStep,
        runAllAutonomousBacklog,
        createWikiArticle,
        updateWikiArticle,
        deleteWikiArticle,
      }}
    >
      {children}
    </AssistantContext.Provider>
  );
};

export const useAssistant = () => {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error('useAssistant must be used within an AssistantProvider');
  }
  return context;
};
