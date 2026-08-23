import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  ContactPerson,
  ChatMessage,
  CallLog,
  AutonomousJob,
  AppView
} from '../types';
import { api } from '../services/api';
import { audioRecorder } from '../services/audioRecorder';
import { speakResponse, stopSpeaking } from '../services/speechSynthesis';
import { processSpeechWithGemini } from '../services/geminiService';

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

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<TaskCategory | 'all'>('all');
  const [filterFeasibility, setFilterFeasibility] = useState<FeasibilityType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');

  const refreshAll = useCallback(async () => {
    try {
      const [t, m, ac, apt, emails, cont, msgs, calls, jobs, k, w] = await Promise.all([
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
        api.getWikiArticles()
      ]);
      setTasks(t);
      setMemos(m);
      setActionCards(ac);
      setAppointments(apt);
      setInboxEmails(emails);
      setContacts(cont);
      setChatMessages(msgs);
      setCallLogs(calls);
      setAutonomousJobs(jobs);
      setKpi(k);
      setWikiArticles(w);
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

  // Submit speech transcript to AI backend
  const submitVoiceTranscript = async (text: string) => {
    if (!text.trim()) return;
    setIsProcessingSpeech(true);
    try {
      let res: any = null;

      // Gemini AI Ultra Brain with API Key (Groq Whisper -> Gemini Ultra Reasoning)
      if (aiBrainProvider === 'gemini_ultra' && geminiApiKey) {
        const geminiResult = await processSpeechWithGemini(text, geminiApiKey, 'gemini-1.5-flash');
        if (geminiResult) {
          const cardId = 'ac-' + Date.now().toString(36);
          const actionCard: ActionCard = {
            id: cardId,
            intent: geminiResult.actionCard.intent,
            title: geminiResult.actionCard.title,
            description: geminiResult.actionCard.description,
            spokenResponse: geminiResult.actionCard.spokenResponse,
            status: 'confirmed',
            createdAt: new Date().toISOString(),
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
              status: 'draft'
            } : undefined
          };

          setActionCards(prev => [actionCard, ...prev]);

          if (actionCard.calendarData) {
            setAppointments(prev => [actionCard.calendarData!, ...prev]);
          }

          if (geminiResult.tasks && geminiResult.tasks.length > 0) {
            const formattedTasks: TaskItem[] = geminiResult.tasks.map((t, idx) => ({
              id: t.id || `task-gemini-${Date.now()}-${idx}`,
              title: t.title,
              description: t.description,
              category: t.category,
              userPriority: t.userPriority,
              aiPriority: t.aiPriority,
              priorityRationale: `Analyzed by Gemini AI Ultra: ${t.feasibilityReasoning}`,
              feasibility: t.feasibility,
              feasibilityReasoning: t.feasibilityReasoning,
              valueScore: t.valueScore || 8,
              estimatedValue: t.estimatedValue || '$1,500/mo',
              manualHoursEstimate: t.manualHoursEstimate || 8,
              automationHoursInvested: t.automationHoursInvested || 2,
              timeWonBackHours: t.timeWonBackHours || 12,
              status: t.status || 'in_progress',
              startDate: t.startDate || new Date().toISOString().split('T')[0],
              dueDate: t.dueDate || new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
              durationDays: t.durationDays || 5,
              progressPercent: t.progressPercent || 25,
              dependencies: t.dependencies || [],
              assignee: t.assignee || 'AI Agent',
              automationBlueprint: t.automationBlueprint,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }));

            setTasks(prev => [...formattedTasks, ...prev]);
          }

          const memo: VoiceMemo = {
            id: 'memo-' + Date.now().toString(36),
            title: text.length > 50 ? text.substring(0, 47) + '...' : text,
            durationSeconds: Math.max(3, Math.round(text.split(' ').length / 2.5)),
            recordedAt: new Date().toISOString(),
            transcript: text,
            status: 'analyzed',
            extractedTaskIds: (geminiResult.tasks || []).map((t, i) => t.id || `task-gemini-${i}`),
            extractedActionCardIds: [actionCard.id],
            summary: geminiResult.spokenSummary || actionCard.description,
            source: 'browser_mic'
          };
          setMemos(prev => [memo, ...prev]);

          if (voiceFeedbackEnabled && actionCard.spokenResponse) {
            speakResponse(actionCard.spokenResponse);
          }

          forwardEventToGoogleCloud({
            action: actionCard.intent,
            actionCard,
            tasks: geminiResult.tasks,
            memo,
            transcript: text
          });

          return;
        }
      }

      // Default AI Brain Backend
      res = await api.processVoiceText(text, 'browser_mic');
      setActionCards(prev => [res.actionCard, ...prev]);
      if (res.createdTasks && res.createdTasks.length > 0) {
        setTasks(prev => [...res.createdTasks, ...prev]);
      }
      setMemos(prev => [res.memo, ...prev]);
      setKpi(res.kpi);

      if (voiceFeedbackEnabled && res.actionCard?.spokenResponse) {
        speakResponse(res.actionCard.spokenResponse);
      }

      forwardEventToGoogleCloud({
        action: res.actionCard?.intent || 'task_create',
        actionCard: res.actionCard,
        tasks: res.createdTasks,
        memo: res.memo
      });

    } catch (err) {
      console.error('Failed to process voice transcript:', err);
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

    const started = await audioRecorder.start({
      onAudioLevel: (level) => setAudioLevel(level),
      onLiveTranscript: (text) => setLiveTranscript(text),
      onRecordingComplete: async (blob, mimeType, liveTranscript) => {
        setIsProcessingSpeech(true);
        try {
          let textToProcess = (liveTranscript || '').trim();

          if (groqApiKey && blob.size > 500) {
            try {
              const res = await api.transcribeRecordedAudio(blob, mimeType, groqApiKey);
              if (res.transcript && res.transcript.trim()) {
                textToProcess = res.transcript.trim();
              }
            } catch (wErr) {
              console.warn('Groq Whisper refine skipped, using live transcript:', wErr);
            }
          }

          if (textToProcess) {
            await submitVoiceTranscript(textToProcess);
          }
        } catch (err) {
          console.error('Audio processing error:', err);
        } finally {
          setIsProcessingSpeech(false);
        }
      },
      onError: (err) => {
        console.warn('Audio recorder error:', err);
        setIsListening(false);
        setAudioLevel(0);
      }
    });

    if (!started) {
      setIsListening(false);
    }
  };

  const stopVoiceListening = () => {
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
