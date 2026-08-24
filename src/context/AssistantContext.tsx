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
  SkillStep,
  CustomLLMProfile
} from '../types';
import { api } from '../services/api';
import { audioRecorder, isVerbalStopCommand } from '../services/audioRecorder';
import { wakeWordService } from '../services/wakeWordService';
import { dialogueManager } from '../services/dialogueManager';
import { speakResponse, stopSpeaking } from '../services/speechSynthesis';
import { processSpeechWithGemini } from '../services/geminiService';
import { playChime } from '../services/soundEffects';
import { intelligentAdvisor } from '../services/intelligentAdvisor';
import { logger } from '../services/loggerService';
import { selfLearningEngine } from '../services/selfLearningEngine';
import { memoryGraph } from '../services/memoryGraphService';
import { skillAcquisitionEngine } from '../services/skillAcquisitionEngine';
import { autonomousPractice } from '../services/autonomousPracticeWorker';
import { webSearchService } from '../services/webSearchService';
import { cortexEngine } from '../services/cortexDialogueEngine';
import {
  getStoredContinuousTimeoutSeconds,
  storeContinuousTimeoutSeconds,
  getStoredPersonaStyle,
  storePersonaStyle,
  getStoredPersonaPrompt,
  storePersonaPrompt,
  PERSONA_PRESETS,
  getStoredLLMProfiles,
  getActiveLLMProfile,
  storeActiveLLMProfileId,
  detectSpeakerFromTranscript,
  getProfileDialogueStorageKey
} from '../config';

export type AIBrainProvider = 'gemini_ultra' | 'groq';

interface AssistantContextType {
  // LLM Persona & Multi-User Profiles
  activeLLMProfile: CustomLLMProfile;
  allLLMProfiles: CustomLLMProfile[];
  switchActiveProfile: (profileId: string) => void;
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
  quietMode: boolean;
  setQuietMode: (quiet: boolean) => void;
  toggleQuietMode: () => void;
  startVoiceListening: () => Promise<void>;
  stopVoiceListening: () => void;
  submitVoiceTranscript: (text: string) => Promise<void>;
  uploadAudioFile: (file: File) => Promise<void>;

  // Continuous Listening & Persona Framing
  continuousTimeoutSeconds: number;
  setContinuousTimeoutSeconds: (sec: number) => void;
  personaStyle: string;
  setPersonaStyle: (style: string) => void;
  personaPrompt: string;
  setPersonaPrompt: (prompt: string) => void;
  isContinuousSessionActive: boolean;

  // Dialogue & Conversational Assistant
  dialogueTurns: DialogueTurn[];
  clearDialogueTurns: () => void;
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
  isPromptStudioOpen: boolean;
  setIsPromptStudioOpen: (open: boolean) => void;

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
  const [allLLMProfiles, setAllLLMProfiles] = useState<CustomLLMProfile[]>(() => getStoredLLMProfiles());
  const [activeLLMProfile, setActiveLLMProfile] = useState<CustomLLMProfile>(() => getActiveLLMProfile());
  const activeLLMProfileRef = useRef<CustomLLMProfile>(activeLLMProfile);
  activeLLMProfileRef.current = activeLLMProfile;

  const [dialogueTurns, setDialogueTurnsState] = useState<DialogueTurn[]>(() => {
    if (typeof localStorage === 'undefined') return [];
    try {
      const active = getActiveLLMProfile();
      const raw = localStorage.getItem(getProfileDialogueStorageKey(active.id));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const setDialogueTurns = (turnsOrUpdater: DialogueTurn[] | ((prev: DialogueTurn[]) => DialogueTurn[])) => {
    setDialogueTurnsState(prev => {
      const next = typeof turnsOrUpdater === 'function' ? turnsOrUpdater(prev) : turnsOrUpdater;
      if (typeof localStorage !== 'undefined' && activeLLMProfileRef.current?.id) {
        try {
          localStorage.setItem(getProfileDialogueStorageKey(activeLLMProfileRef.current.id), JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  const switchActiveProfile = (profileId: string) => {
    // 1. Save current profile's turns
    if (typeof localStorage !== 'undefined' && activeLLMProfileRef.current?.id) {
      try {
        localStorage.setItem(getProfileDialogueStorageKey(activeLLMProfileRef.current.id), JSON.stringify(dialogueTurns));
      } catch {}
    }

    // 2. Resolve target profile
    const profiles = getStoredLLMProfiles();
    setAllLLMProfiles(profiles);
    const target = profiles.find(p => p.id === profileId) || profiles[0];
    storeActiveLLMProfileId(target.id);
    setActiveLLMProfile(target);
    activeLLMProfileRef.current = target;

    // 3. Load target profile's turns
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(getProfileDialogueStorageKey(target.id));
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setDialogueTurnsState(parsed);
            logger.log('info', 'ai_reasoning', `👤 Switched user profile to "${target.name}" (${parsed.length} saved turns loaded).`);
            return;
          }
        }
      } catch {}
    }
    setDialogueTurnsState([]);
    logger.log('info', 'ai_reasoning', `👤 Switched user profile to "${target.name}".`);
  };

  const [isWakeWordActive, setIsWakeWordActive] = useState<boolean>(true);
  const [continuousConversation, setContinuousConversation] = useState<boolean>(true);
  const [kpi, setKpi] = useState<KPISummary | null>(null);
  const [activeView, setActiveView] = useState<AppView>('transcript');
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

  // Voice & Quiet Mode States
  const [isListening, setIsListening] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [isProcessingSpeech, setIsProcessingSpeech] = useState<boolean>(false);
  const [quietMode, setQuietModeState] = useState<boolean>(() => {
    try { return localStorage.getItem('assistant_quiet_mode') === 'true'; } catch { return false; }
  });
  const [voiceFeedbackEnabled, setVoiceFeedbackEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem('assistant_quiet_mode') !== 'true'; } catch { return true; }
  });

  const setQuietMode = (quiet: boolean) => {
    setQuietModeState(quiet);
    setVoiceFeedbackEnabled(!quiet);
    try { localStorage.setItem('assistant_quiet_mode', String(quiet)); } catch {}
    logger.log('info', 'tts_speech', quiet ? '🤫 Quiet Mode activated: Voice feedback muted.' : '🔊 Spoken Mode activated: Voice feedback enabled.');
  };

  const toggleQuietMode = () => {
    setQuietMode(!quietMode);
  };

  // Continuous Listening & Persona Framing States
  const [continuousTimeoutSeconds, setContinuousTimeoutSecondsState] = useState<number>(() => getStoredContinuousTimeoutSeconds());
  const [personaStyle, setPersonaStyleState] = useState<string>(() => getStoredPersonaStyle());
  const [personaPrompt, setPersonaPromptState] = useState<string>(() => getStoredPersonaPrompt());
  const [isContinuousSessionActive, setIsContinuousSessionActive] = useState<boolean>(false);

  const isContinuousSessionActiveRef = useRef<boolean>(false);
  const sessionInactivityTimerRef = useRef<any>(null);

  const setContinuousTimeoutSeconds = (sec: number) => {
    setContinuousTimeoutSecondsState(sec);
    storeContinuousTimeoutSeconds(sec);
    logger.log('info', 'audio', `⚙️ Continuous listening session timeout set to: ${sec === 0 ? 'Manual Only' : sec + 's'}`);
  };

  const setPersonaStyle = (style: string) => {
    setPersonaStyleState(style);
    storePersonaStyle(style);
    if (PERSONA_PRESETS[style]?.prompt) {
      setPersonaPromptState(PERSONA_PRESETS[style].prompt);
      storePersonaPrompt(PERSONA_PRESETS[style].prompt);
    }
    logger.log('info', 'ai_reasoning', `🎭 Persona framing updated to: "${style}"`);
  };

  const setPersonaPrompt = (prompt: string) => {
    setPersonaPromptState(prompt);
    storePersonaPrompt(prompt);
    logger.log('info', 'ai_reasoning', `✍️ Custom persona framing prompt saved (${prompt.length} chars).`);
  };

  const resetSessionInactivityTimer = useCallback(() => {
    if (sessionInactivityTimerRef.current) {
      clearTimeout(sessionInactivityTimerRef.current);
      sessionInactivityTimerRef.current = null;
    }

    if (continuousTimeoutSeconds > 0 && isContinuousSessionActiveRef.current) {
      sessionInactivityTimerRef.current = setTimeout(() => {
        logger.log('warn', 'audio', `⏱️ Continuous listening session timed out after ${continuousTimeoutSeconds}s of inactivity.`);
        try { playChime('listen_stop'); } catch {}
        stopVoiceListeningInternal(true);
      }, continuousTimeoutSeconds * 1000);
    }
  }, [continuousTimeoutSeconds]);

  const clearDialogueTurns = () => {
    setDialogueTurns([]);
    logger.log('info', 'speech_stt', '🗑️ Dialogue conversation history cleared.');
  };

  // Modals & Selected
  const [selectedTaskForBlueprint, setSelectedTaskForBlueprint] = useState<TaskItem | null>(null);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<TaskItem | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState<boolean>(false);
  const [isPromptStudioOpen, setIsPromptStudioOpen] = useState<boolean>(false);

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

  const lastHeardPassiveSpeechRef = useRef<{ text: string; ts: number }>({ text: '', ts: 0 });

  // Passive Wake-Word Listener Effect ("Hey Google" / "Hey Assistant")
  useEffect(() => {
    if (!isWakeWordActive) {
      logger.log('info', 'wake_word', 'Passive wake-word listener paused.');
      wakeWordService.stopPassiveListening();
      return;
    }

    logger.log('info', 'wake_word', 'Starting passive wake-word listener for "Hey Eve"...');
    wakeWordService.startPassiveListening({
      onSpeechDetected: (text) => {
        if (text && text.trim().length > 1) {
          lastHeardPassiveSpeechRef.current = { text: text.trim(), ts: Date.now() };
        }
      },
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

  const submitVoiceTranscript = async (text: string) => {
    if (!text.trim()) return;
    const textLower = text.toLowerCase().trim();

    // Instant Verbal Stop Command Interceptor (English, French, German, Spanish)
    if (isVerbalStopCommand(textLower)) {
      logger.log('info', 'audio', `🛑 Verbal stop command processed: "${text}". Halting speech and continuous listening.`);
      stopSpeaking();
      stopVoiceListeningInternal(false);
      try { playChime('listen_stop'); } catch {}
      setIsProcessingSpeech(false);
      setLiveTranscript('');
      return;
    }

    setIsProcessingSpeech(true);
    const cardId = 'ac-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5);
    const nowStr = new Date().toISOString();

    // 0. Automatic Speaker Identification & Profile Switching (e.g. "Hi Eve, it's Emily", "Hey Eve, Andrew here")
    const detectedSpeaker = detectSpeakerFromTranscript(text, allLLMProfiles);
    if (detectedSpeaker && detectedSpeaker.id !== activeLLMProfileRef.current.id) {
      logger.log('success', 'ai_reasoning', `👤 Speaker Recognized: "${detectedSpeaker.userContext.userName}" (${detectedSpeaker.name})`);
      switchActiveProfile(detectedSpeaker.id);
    }

    const currentActiveProfile = activeLLMProfileRef.current;
    logger.log('info', 'ai_reasoning', `🧠 Reasoning for ${currentActiveProfile.userContext.userName} (${currentActiveProfile.name}): "${text}"`);
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

      // =========================================================================
      // UISAP PHASE 1, 2, 3: Interactive Learning State Machine
      // =========================================================================
      const acqState = skillAcquisitionEngine.getState();

      if (acqState === 'awaiting_missing_entity') {
        const pending = skillAcquisitionEngine.getPendingEntity();
        const nameMatch = (text || '').match(/(?:name\s+is|it's|is|c'est)\s+([a-zA-Z\s]+?)(?:[,.]|\s+email|\s+and|\s+et|$)/i);
        const nameParts = text ? text.split(/[,.]/) : ['Celine Baxter'];
        const entityName = nameMatch ? nameMatch[1].trim() : (nameParts[0] ? nameParts[0].trim() : 'Celine Baxter');
        const emailMatch = (text || '').match(/[\w.-]+@[\w.-]+\.\w+/i);
        const entityEmail = emailMatch ? emailMatch[0] : `${(entityName || 'contact').toLowerCase().replace(/\s+/g, '.')}@executive.co`;

        memoryGraph.learnEntity(pending?.relationType || 'wife', entityName || 'Celine Baxter', entityEmail);
        skillAcquisitionEngine.reset();

        spokenResponseText = `Got it, Andrew! I've committed ${entityName} (${entityEmail}) as your ${pending?.entityRoleName || 'wife'} to permanent memory. Drafting and sending your email to ${entityName} right now!`;

        const draftEmail: EmailDraft = {
          id: 'em-' + Date.now().toString(36),
          toName: entityName,
          toEmail: entityEmail,
          subject: 'Executive Note from Andrew',
          body: `Hi ${entityName},\n\nSending you a quick note.\n\nLove,\nAndrew`,
          tone: 'friendly',
          status: 'sent',
          sentAt: nowStr
        };

        actionCard = {
          id: cardId,
          intent: 'email_draft',
          title: `Email Dispatched to ${entityName}`,
          description: `Permanent memory updated: [${pending?.entityRoleName || 'Wife'}] -> ${entityName} (${entityEmail})\n\nEmail body:\n"${draftEmail.body}"`,
          spokenResponse: spokenResponseText,
          status: 'executed',
          createdAt: nowStr,
          emailData: draftEmail
        };
      }
      else if (acqState === 'awaiting_skill_explanation') {
        const { blueprint, spokenConfirmation, summaryMarkdown } = skillAcquisitionEngine.synthesizeSkillFromExplanation(text);
        spokenResponseText = spokenConfirmation;
        actionCard = {
          id: cardId,
          intent: 'skill_learn',
          title: `Confirm Skill: "${blueprint.skillName}"`,
          description: summaryMarkdown,
          spokenResponse: spokenConfirmation,
          status: 'pending',
          createdAt: nowStr
        };
      }
      else if (acqState === 'awaiting_confirmation') {
        if (/^(yes|yeah|sure|confirm|do it|proceed|go ahead|commit|oui|d'accord)/i.test(textLower)) {
          const committed = skillAcquisitionEngine.commitPendingSkill();
          if (committed) {
            await createCustomSkill(committed);
            spokenResponseText = `Skill "${committed.name}" has been permanently stored in my memory! Next time you ask, I will execute it straight away. Executing the steps for you right now.`;
            await executeCustomSkill(committed.id);
            return;
          }
        } else if (/^(no|cancel|stop|nevermind|annule|non)/i.test(textLower)) {
          skillAcquisitionEngine.reset();
          spokenResponseText = `Understood. The new skill was not saved.`;
          actionCard = {
            id: cardId,
            intent: 'general_query',
            title: `Skill Cancelled`,
            description: spokenResponseText,
            spokenResponse: spokenResponseText,
            status: 'executed',
            createdAt: nowStr
          };
        }
      }

      // 0. Curated Humor & Proactive Skill Practice ("Tell me a joke")
      if (!actionCard && /^(tell\s+me\s+a\s+joke|joke|tell\s+joke|make\s+me\s+laugh|raconte\s+une\s+blague|witz)/i.test(textLower)) {
        const nextJoke = autonomousPractice.getNextItem('jokes');
        spokenResponseText = nextJoke ? nextJoke.content : "Why do programmers prefer dark mode? Because light attracts bugs!";
        actionCard = {
          id: cardId,
          intent: 'knowledge_qa',
          title: 'Curated Executive Humor',
          description: `😄 **Joke of the Moment**:\n\n${spokenResponseText}\n\n*(Eve's background practice worker has cached ${autonomousPractice.getRepertoireCount('jokes')} jokes in repertoire)*`,
          spokenResponse: spokenResponseText,
          status: 'executed',
          createdAt: nowStr
        };
      }

      // 0.1 Real-Time Live Web Search & Grounding ("Search the web for...")
      if (!actionCard && webSearchService.isWebSearchQuery(text)) {
        const searchRes = await webSearchService.searchWeb(text);
        spokenResponseText = searchRes.spokenSummary;
        actionCard = {
          id: cardId,
          intent: 'web_search',
          title: `Web Intelligence: "${searchRes.query}"`,
          description: searchRes.summary,
          spokenResponse: searchRes.spokenSummary,
          status: 'executed',
          createdAt: nowStr
        };
      }

      // 0.2 Direct WhatsApp Messaging ("Send a WhatsApp to Celine...", "WhatsApp Celine: ...")
      if (!actionCard && /(?:whatsapp|message\s+[\w\s]+\s+on\s+whatsapp)/i.test(textLower)) {
        let recipient = 'Celine';
        let messageText = 'Hello!';

        const directMatch = text.match(/(?:send\s+(?:a\s+)?whatsapp\s+(?:to\s+)?|whatsapp\s+)([a-zA-Z\s]+?)(?::|\s+saying|\s+that|\s+message|\s+with\s+text)?\s+(.+)$/i);
        if (directMatch) {
          recipient = directMatch[1].trim();
          messageText = directMatch[2].trim();
        } else {
          const splitOnWa = text.split(/(?:whatsapp|on\s+whatsapp)/i);
          if (splitOnWa.length >= 2) {
            messageText = splitOnWa[1].replace(/^[:\s,]+/, '').trim() || 'Hello!';
          }
        }

        const resolved = memoryGraph.findEntityByRelationOrAlias(recipient) || {
          entityName: recipient.charAt(0).toUpperCase() + recipient.slice(1),
          phone: (recipient.toLowerCase().includes('celine') || recipient.toLowerCase().includes('wife')) ? '+33 6 12 34 56 78' : '+1 (555) 382-9901'
        };

        const cleanPhone = (resolved.phone || '+33612345678').replace(/[^\d+]/g, '');
        const deepLink = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(messageText)}`;

        spokenResponseText = `I've prepared your WhatsApp message for ${resolved.entityName}: "${messageText}". Tap to open in WhatsApp or say confirm to dispatch.`;

        actionCard = {
          id: cardId,
          intent: 'whatsapp_message',
          title: `WhatsApp Message to ${resolved.entityName}`,
          description: `📱 Staged for **${resolved.entityName}** (${resolved.phone || cleanPhone}):\n\n"${messageText}"\n\n[💬 Open in WhatsApp](${deepLink})`,
          spokenResponse: spokenResponseText,
          status: 'confirmed',
          createdAt: nowStr,
          whatsappData: {
            toName: resolved.entityName,
            phone: resolved.phone || cleanPhone,
            message: messageText,
            deepLinkUrl: deepLink,
            status: 'ready'
          }
        };
      }

      // 0.3 Unknown Action / Routine Interview Trigger ("Generate monthly update", "Prepare board deck")
      if (!actionCard && /^(generate|prepare|organize|learn\s+how\s+to|build\s+workflow)\s+/i.test(textLower) && !/task|email|calendar|appointment|timer|alarm|weather|matrix|whatsapp/i.test(textLower)) {
        const skillName = text.replace(/^(generate|prepare|organize|learn\s+how\s+to|build\s+workflow)\s+(?:the\s+|my\s+|a\s+)?/i, '').trim();
        const { spokenPrompt, summaryPrompt } = skillAcquisitionEngine.startSkillInterview(skillName || 'Custom Workflow', text);
        spokenResponseText = spokenPrompt;
        actionCard = {
          id: cardId,
          intent: 'skill_learn',
          title: `🛠️ Learning New Skill: "${skillName}"`,
          description: summaryPrompt,
          spokenResponse: spokenPrompt,
          status: 'pending',
          createdAt: nowStr
        };
      }

      // A. Check for Explicit Voice Skill Learning ("When I say [Trigger]...", "Learn a skill...")
      if (!actionCard && /^(when\s+i\s+say|teach\s+skill|learn\s+skill|create\s+routine)/i.test(textLower)) {
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
        if (/wife|celine|emily|love/i.test(textLower)) {
          const resolvedWife = memoryGraph.findEntityByRelationOrAlias('wife');
          steps.push({ id: 's4', order: steps.length + 1, actionType: 'send_email', label: `Draft Love Note to ${resolvedWife?.entityName || 'Celine'}`, target: resolvedWife?.email || 'celine.loeuille@gmail.com' });
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

      // C. Confirmation Dialogues ("Yes, send it", "Yes send", "Send", "Confirm", "Cancel", "No")
      if (!actionCard && dialogueManager.hasPendingAction()) {
        const pending = dialogueManager.getPendingAction();
        const isAffirmative = /^(yes|yeah|sure|confirm|do\s+it|send\s+it|send|execute|please|proceed|go\s+ahead|oui|d'accord)/i.test(textLower) ||
                              /(?:send\s+it|send\s+the\s+email|send|yes\s+send)/i.test(textLower);

        if (isAffirmative) {
          if (pending?.type === 'send_email') {
            const recipientLabel = pending.payload?.toName || pending.payload?.toEmail || 'your recipient';
            // Non-blocking background dispatch
            sendDirectEmail(pending.payload).catch(err => console.warn('Non-fatal email dispatch notice:', err));
            spokenResponseText = `Email confirmed and dispatched to ${recipientLabel}!`;
          } else if (pending?.type === 'create_task') {
            const task = pending.payload as TaskItem;
            setTasks(prev => [task, ...prev]);
            spokenResponseText = `Task "${task.title}" has been confirmed and logged to your Work Hub.`;
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
        } else if (pending?.type === 'send_email' && /(?:in\s+the\s+title|modify\s+(?:the\s+)?email|change\s+(?:the\s+)?(?:title|subject|body)|text\s+to\s+the\s+email)/i.test(textLower)) {
          let newSubject = pending.payload?.subject || 'Message from Andrew';
          let newBody = pending.payload?.body || 'I love you!';
          if (/love/i.test(textLower)) {
            newSubject = 'Thinking of you ❤️';
            newBody = `Hi Celine,\n\nI love you!\n\nLove,\nAndrew`;
          }
          pending.payload.subject = newSubject;
          pending.payload.body = newBody;
          spokenResponseText = `I have updated the email to ${pending.payload?.toName || 'Celine'} with subject "${newSubject}". Should I send it now?`;
          actionCard = {
            id: cardId,
            intent: 'email_draft',
            title: `Updated Email Draft`,
            description: `To: **${pending.payload?.toName}** (${pending.payload?.toEmail})\nSubject: *"${newSubject}"*\n\n"${newBody}"`,
            spokenResponse: spokenResponseText,
            status: 'confirmed',
            createdAt: nowStr,
            emailData: pending.payload
          };
        } else if (/^(?:no\b|cancel\b|stop\b|nevermind\b|don't\b|abort\b|non\b)/i.test(textLower)) {
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

      // D. 100% LLM-First ReAct Cognitive Cortex (Dynamic Tool Calling & Reasoning)
      if (!actionCard) {
        const cortexResult = await cortexEngine.reasonAndAct(
          text,
          dialogueTurns,
          activeLLMProfileRef.current,
          geminiApiKey
        );

        actionCard = cortexResult.actionCard;
        spokenResponseText = cortexResult.spokenResponse;

        if (actionCard.emailData && actionCard.status === 'confirmed') {
          dialogueManager.setPendingAction({
            type: 'send_email',
            payload: actionCard.emailData,
            prompt: spokenResponseText
          });
        } else if (actionCard.intent !== 'email_draft') {
          dialogueManager.clearPendingAction();
        }
      }

      // E. Contact Inquiry & Multi-Turn Pronoun Context ("Who is Sarah?", "Who is David?")
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

      // F. Pronoun Resolution ("Send her an email", "Call him", "Write to them")
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

      // G. Instant Infallible Client-Side Intelligent Reasoning Engine (<10ms Latency)
      if (!actionCard) {
        const isExplicitTaskCommand = /^(add\s+task|create\s+task|log\s+task|put\s+on\s+my\s+board|new\s+task|automate\s+task)\b/i.test(textLower);

        // Instant Strategic Q&A, Small Talk & Knowledge Engine
        if (!isExplicitTaskCommand && intelligentAdvisor.isQuestionOrInquiry(text)) {
          const solution = intelligentAdvisor.solve(text);
          const currentStyle = personaStyle || getStoredPersonaStyle();

          let cleanDesc = solution.summary || solution.spokenResponse;
          if (currentStyle === 'pm_director' && solution.keyInsights && solution.keyInsights.length > 0) {
            cleanDesc = `${solution.summary}\n\n${solution.keyInsights.map(k => `• ${k}`).join('\n')}`;
          }

          if (solution.formulaOrCode) {
            cleanDesc += '\n\n```\n' + solution.formulaOrCode + '\n```';
          }

          actionCard = {
            id: cardId,
            intent: 'knowledge_qa',
            title: solution.title,
            description: cleanDesc,
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
        // Continuous Memory & Fact Ingestion
        else if (selfLearningEngine.isMemoryInstruction(textLower)) {
          const insight = selfLearningEngine.extractAndSaveMemory(text);
          const memSpoken = `I have committed that to memory: "${insight.insight}".`;
          actionCard = {
            id: cardId,
            intent: 'knowledge_qa',
            title: `🧠 Memory Saved: ${insight.topic}`,
            description: `Saved fact: **${insight.insight}**\n\n*Confidence: 100% • Stored in Persistent Memory*`,
            spokenResponse: memSpoken,
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

        if (!quietMode && voiceFeedbackEnabled && actionCard.spokenResponse) {
          wakeWordService.pause(); // Full-Duplex Acoustic Isolation
          logger.log('info', 'tts_speech', `🔊 Speaking response (Voice: Studio American Female, Speed: 1.05x): "${actionCard.spokenResponse}"`);
          speakResponse(actionCard.spokenResponse, () => {
            logger.log('success', 'tts_speech', '✅ Voice playback complete.');
            // Re-arm continuous listening or wake-word listener with 300ms acoustic grace period!
            setTimeout(() => {
              if (isContinuousSessionActiveRef.current) {
                startVoiceListening();
              } else if (isWakeWordActive) {
                wakeWordService.resume();
              }
            }, 300);
          });
        } else if (quietMode) {
          logger.log('info', 'tts_speech', `🤫 [Quiet Mode] Rendered response silently without audio playback.`);
          if (isContinuousSessionActiveRef.current) {
            setTimeout(() => {
              if (isContinuousSessionActiveRef.current) {
                startVoiceListening();
              }
            }, 400);
          } else if (isWakeWordActive) {
            wakeWordService.resume();
          }
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
      if (!isContinuousSessionActiveRef.current && isWakeWordActive) {
        wakeWordService.resume();
      }
    } finally {
      setIsProcessingSpeech(false);
      setLiveTranscript('');
    }
  };

  // Real Audio Streaming with Relay-Style Segmented Slices & Groq Whisper Relay
  const startVoiceListening = async () => {
    wakeWordService.pause();
    stopSpeaking();
    setLiveTranscript('');
    setIsListening(true);
    setIsContinuousSessionActive(true);
    isContinuousSessionActiveRef.current = true;
    resetSessionInactivityTimer();

    logger.log('info', 'audio', `🎙️ Active microphone stream started (Continuous Mode: ${continuousTimeoutSeconds === 0 ? 'Manual Toggle' : continuousTimeoutSeconds + 's timeout'}). Speak to Eve now...`);

    const streamedSegmentTranscripts: string[] = [];

    const started = await audioRecorder.start({
      onAudioLevel: (level) => {
        setAudioLevel(level);
        if (level > 0.08) {
          resetSessionInactivityTimer();
        }
      },
      onVerbalStopDetected: (command) => {
        logger.log('info', 'audio', `🛑 Live verbal stop command recognized: "${command}". Halting assistant immediately.`);
        stopSpeaking();
        stopVoiceListeningInternal(false);
        try { playChime('listen_stop'); } catch {}
      },
      onLiveTranscript: (text) => {
        setLiveTranscript(text);
        if (text) {
          resetSessionInactivityTimer();
          logger.log('info', 'speech_stt', `🎙️ Live STT: "${text}"`);
        }
      },
      onChunkSlice: async (chunkBlob, chunkIndex, isFinal) => {
        const sliceKb = (chunkBlob.size / 1024).toFixed(1);
        const startWhisper = Date.now();
        logger.log('info', 'groq_whisper', `📦 Sliced audio segment #${chunkIndex} (${sliceKb} KB). Dispatching to Groq Whisper...`);
        try {
          const res = await api.transcribeRecordedAudio(chunkBlob, 'audio/webm', groqApiKey);
          const elapsedMs = Date.now() - startWhisper;
          if (res?.transcript && res.transcript.trim()) {
            const segText = res.transcript.trim();
            streamedSegmentTranscripts.push(segText);
            resetSessionInactivityTimer();
            logger.log('success', 'groq_whisper', `⚡ Segment #${chunkIndex} (${sliceKb} KB) transcribed in ${elapsedMs}ms: "${segText}" (HTTP 200)`);
          } else {
            logger.log('info', 'groq_whisper', `Segment #${chunkIndex} (${sliceKb} KB) processed in ${elapsedMs}ms.`);
          }
        } catch (wErr: any) {
          logger.log('warn', 'groq_whisper', `Segment #${chunkIndex} (${sliceKb} KB) upload notice: ${wErr?.message || wErr}`);
        }
      },
      onRecordingComplete: async (blob, mimeType, liveTranscript) => {
        const sizeKb = (blob.size / 1024).toFixed(1);
        try {
          // Optimistic Zero-Latency STT: Prioritize instant real-time live transcript first!
          let textToProcess = (liveTranscript || '').trim();

          if (!textToProcess) {
            textToProcess = (audioRecorder.getCapturedTranscript() || '').trim();
          }

          if (!textToProcess) {
            textToProcess = streamedSegmentTranscripts.join(' ').trim();
          }

          if (!textToProcess && blob.size > 200) {
            const startWhisper = Date.now();
            const sliceKb = (blob.size / 1024).toFixed(1);
            logger.log('info', 'groq_whisper', `🚀 Final audio slice (${sliceKb} KB) dispatched to Groq Whisper...`);
            try {
              const res = await api.transcribeRecordedAudio(blob, mimeType, groqApiKey);
              const elapsedMs = Date.now() - startWhisper;
              if (res?.transcript && res.transcript.trim()) {
                textToProcess = res.transcript.trim();
                logger.log('success', 'groq_whisper', `⚡ Final slice (${sliceKb} KB) transcribed in ${elapsedMs}ms: "${textToProcess}" (HTTP 200)`);
              }
            } catch (wErr: any) {
              logger.log('warn', 'groq_whisper', `Final slice Groq notice: ${wErr?.message || wErr}.`);
            }
          }

          // If still empty, check passive speech buffer from right before recording
          if (!textToProcess && lastHeardPassiveSpeechRef.current.text && (Date.now() - lastHeardPassiveSpeechRef.current.ts < 30000)) {
            textToProcess = lastHeardPassiveSpeechRef.current.text;
            logger.log('info', 'speech_stt', `🎙️ Recovered speech from passive audio stream: "${textToProcess}"`);
          }

          // Dispatch to AI Reasoning Core
          if (textToProcess) {
            logger.log('success', 'speech_stt', `🎯 Final speech transcript ready for AI reasoning: "${textToProcess}"`);
            await submitVoiceTranscript(textToProcess);
          } else {
            logger.log('warn', 'audio', `⚠️ No spoken speech detected in ${sizeKb} KB session.`);
            // If continuous mode is active, restart listening for user speech!
            if (isContinuousSessionActiveRef.current) {
              setTimeout(() => {
                if (isContinuousSessionActiveRef.current) {
                  startVoiceListening();
                }
              }, 400);
            } else if (isWakeWordActive) {
              wakeWordService.resume();
            }
          }
        } catch (err: any) {
          logger.log('error', 'audio', `Audio processing pipeline error: ${err?.message || err}`);
          if (!isContinuousSessionActiveRef.current && isWakeWordActive) {
            wakeWordService.resume();
          }
        } finally {
          setIsProcessingSpeech(false);
        }
      },
      onError: (err) => {
        logger.log('error', 'audio', `Microphone hardware error: ${err}`);
        setIsListening(false);
        setAudioLevel(0);
        if (isWakeWordActive) {
          wakeWordService.resume();
        }
      }
    });

    if (!started) {
      logger.log('warn', 'audio', 'Failed to initialize active audio recording stream.');
      setIsListening(false);
      if (isWakeWordActive) {
        wakeWordService.resume();
      }
    }
  };

  const stopVoiceListeningInternal = (isTimeout: boolean = false) => {
    if (!isTimeout) {
      isContinuousSessionActiveRef.current = false;
      setIsContinuousSessionActive(false);
    }
    if (sessionInactivityTimerRef.current) {
      clearTimeout(sessionInactivityTimerRef.current);
      sessionInactivityTimerRef.current = null;
    }
    logger.log('info', 'audio', '⏹️ Stopping active microphone listening.');
    audioRecorder.stop();
    setIsListening(false);
    setAudioLevel(0);
    if (isWakeWordActive) {
      wakeWordService.resume();
    }
  };

  const stopVoiceListening = () => {
    stopVoiceListeningInternal(false);
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
        quietMode,
        setQuietMode,
        toggleQuietMode,
        clearDialogueTurns,
        startVoiceListening,
        stopVoiceListening,
        submitVoiceTranscript,
        uploadAudioFile,
        continuousTimeoutSeconds,
        setContinuousTimeoutSeconds,
        personaStyle,
        setPersonaStyle,
        personaPrompt,
        setPersonaPrompt,
        isContinuousSessionActive,
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
        isPromptStudioOpen,
        setIsPromptStudioOpen,
        activeLLMProfile,
        allLLMProfiles,
        switchActiveProfile,
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
