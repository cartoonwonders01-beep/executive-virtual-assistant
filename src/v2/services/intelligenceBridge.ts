import { eveVectorStore } from '../brain/eveVectorStore';
import { executiveProfile } from '../brain/executiveProfile';
import { telemetry } from './telemetryLogger';
import { auricBridge } from './auricBridge';
import { ActionCardData } from '../components/ActionCardView';
import { briefingEngine } from './briefingEngine';
import { streamingAudioPipeline, StreamCallbacks } from './streamingAudioPipeline';
import { dualProcessCortex } from './dualProcessCortex';
import { toolDispatcher } from './toolDispatcher';
import { CortexDialogueEngine } from '../../services/cortexDialogueEngine';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  actionCard?: ActionCardData;
}

export interface UtteranceResult {
  responseText: string;
  actionCard?: ActionCardData;
}

const HISTORY_KEY = 'eve_v2_session_history';

class IntelligenceBridge {
  private history: ChatTurn[] = [];
  private maxHistoryTurns = 20;

  constructor() {
    this.loadHistory();
  }

  private loadHistory(): void {
    try {
      const stored = sessionStorage.getItem(HISTORY_KEY);
      if (stored) {
        this.history = JSON.parse(stored);
      }
    } catch {
      this.history = [];
    }
  }

  private saveHistory(): void {
    try {
      // Keep last 20 turns for deep contextual dialogue
      if (this.history.length > this.maxHistoryTurns) {
        this.history = this.history.slice(-this.maxHistoryTurns);
      }
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(this.history));
    } catch {}
  }

  public getHistory(): ChatTurn[] {
    return [...this.history];
  }

  public clearHistory(): void {
    this.history = [];
    sessionStorage.removeItem(HISTORY_KEY);
  }

  async handleUtterance(
    transcript: string,
    audioBlob?: Blob,
    streamCallbacks?: StreamCallbacks,
    imageFrame?: string
  ): Promise<UtteranceResult> {
    telemetry.log('llm_start', { transcriptLength: transcript.length, hasImage: Boolean(imageFrame) });

    // 0. System 1 Reflex Circuit (<200ms)
    const s1 = dualProcessCortex.evaluateSystem1(transcript);
    if (s1.isReflex && s1.responseText) {
      this.history.push({ role: 'user', content: transcript, timestamp: Date.now() });
      this.history.push({ role: 'assistant', content: s1.responseText, timestamp: Date.now(), actionCard: s1.actionCard });
      this.saveHistory();
      return { responseText: s1.responseText, actionCard: s1.actionCard };
    }

    // Resolve anaphora across prior discourse
    const resolvedTranscript = dualProcessCortex.resolveAnaphora(transcript, this.history);

    // Check for explicit morning briefing
    const lower = resolvedTranscript.toLowerCase();
    if (lower.includes("briefing") || lower.includes("morning briefing") || lower.includes("briefing matinal")) {
      const briefing = await briefingEngine.generateMorningBriefing();
      const card: ActionCardData = {
        id: 'brief-' + Date.now(),
        type: 'briefing',
        title: 'Executive Morning Briefing',
        subtitle: briefing.weatherSummary,
        details: [...briefing.activeProjects, ...briefing.pendingTasks]
      };
      this.history.push({ role: 'user', content: transcript, timestamp: Date.now() });
      this.history.push({ role: 'assistant', content: briefing.spokenBriefing, timestamp: Date.now(), actionCard: card });
      this.saveHistory();
      return { responseText: briefing.spokenBriefing, actionCard: card };
    }

    // 1. Curated Ground-Truth Profile (<150 tokens)
    const profileSnippet = executiveProfile.getSystemPromptSnippet();

    // 2. Deep Semantic Recall: Retrieve top relevant memories across all past sessions
    const recalledItems = eveVectorStore.search(resolvedTranscript, 5);
    const contextSnippet = recalledItems.length > 0
      ? "EPISODIC HISTORICAL RECALL (Matched from Past Sessions):\n" + 
        recalledItems.map(r => `• [${r.item.type.toUpperCase()}] ${r.item.text}`).join('\n')
      : "No past episodic records matched.";

    const rawGroqKey = (typeof window !== 'undefined' && typeof localStorage !== 'undefined') ? (localStorage.getItem('assistant_groq_api_key') || '') : '';
    const envGroqKey = import.meta.env.VITE_GROQ_API_KEY || '';
    const validEnvGroqKey = (!envGroqKey.includes('placeholder') && !envGroqKey.includes('sample_')) ? envGroqKey : '';
    const groqApiKey = (rawGroqKey && !rawGroqKey.includes('placeholder') && !rawGroqKey.includes('sample_')) ? rawGroqKey : validEnvGroqKey;
    const useEdgeProxy = typeof window !== 'undefined' && window.location.hostname.includes('pages.dev');
    const targetEndpoint = useEdgeProxy ? '/api/chat' : 'https://api.groq.com/openai/v1/chat/completions';
    let responseText = "";
    let actionCard: ActionCardData | undefined;
    let isScribeMode = transcript.length > 500;

    if (groqApiKey || useEdgeProxy) {
      try {
        const systemPrompt = `You are Eve, an executive AI assistant for Andrew.
You possess deep long-term memory and handle personal affairs, family context, calendar, and technical workflows.

${profileSnippet}

${contextSnippet}

INSTRUCTIONS: 1. Converse naturally, concisely (1-3 sentences). 2. MULTILINGUAL: Detect Andrew's language (EN/FR/NL) and reply in the same. 3. Classify intent: SCRIBE, CODE, CALENDAR, TASK, or CHAT. 4. If CALENDAR/TASK, return "action_card". 5. Extract persistent facts to "new_memories" and profile updates to "profile_updates".
Respond ONLY with valid JSON:
{"intent":"SCRIBE"|"CODE"|"CALENDAR"|"TASK"|"CHAT","response":"Spoken reply","action_card":{"type":"calendar"|"task","title":"...","subtitle":"...","dateStr":"..."},"decisions":[],"new_memories":[{"type":"preference"|"decision"|"person"|"task"|"memory","text":"..."}],"profile_updates":[{"category":"family"|"preferences"|"active_projects"|"key_facts","key":"...","value":"..."}]}`;

        const recentMessages = this.history.slice(-16).map(h => ({ role: h.role, content: h.content }));
        const userContent = imageFrame 
          ? `${resolvedTranscript}\n\n[ATTACHED SCREEN/DOCUMENT SNAPSHOT: ${imageFrame.slice(0, 48)}...]` 
          : resolvedTranscript;
        const messages = [{ role: 'system', content: systemPrompt }, ...recentMessages, { role: 'user', content: userContent }];

        const reqHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
        if (!useEdgeProxy && groqApiKey) reqHeaders['Authorization'] = `Bearer ${groqApiKey}`;

        const aiRes = await fetch(targetEndpoint, {
          method: 'POST',
          headers: reqHeaders,
          body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, response_format: { type: 'json_object' }, temperature: 0.4 })
        });

        if (aiRes.ok) {
          const data = await aiRes.json();
          const parsed = JSON.parse(data.choices[0].message.content);
          this.applyParsedPayload(parsed, resolvedTranscript, parsed.intent === 'SCRIBE');
          responseText = parsed.response || responseText;
          if (streamCallbacks?.onToken) {
            streamCallbacks.onToken(responseText, responseText);
          }
          actionCard = parsed.action_card?.title ? {
            id: 'act-' + Date.now(),
            type: parsed.action_card.type || (parsed.intent === 'CALENDAR' ? 'calendar' : 'task'),
            title: parsed.action_card.title,
            subtitle: parsed.action_card.subtitle,
            dateStr: parsed.action_card.dateStr
          } : undefined;
        }
      } catch (err) {
        telemetry.log('error', { source: 'GroqLLM', message: String(err) });
      }
    }

    // High-Intelligence Cognitive Engine (Statically Integrated)
    if (!responseText.trim()) {
      try {
        const historyDialogue = this.history.slice(-10).map((h, idx) => ({ id: `hist-${idx}-${h.timestamp}`, speaker: (h.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant', text: h.content, timestamp: new Date(h.timestamp).toISOString() }));
        const cortexRes = await CortexDialogueEngine.getInstance().reasonAndAct(resolvedTranscript, historyDialogue);
        if (cortexRes?.spokenResponse && !cortexRes.spokenResponse.includes("noted that in my local brain")) {
          responseText = cortexRes.spokenResponse;
        }
        if (cortexRes?.actionCard && !actionCard) {
          actionCard = {
            id: cortexRes.actionCard.id,
            type: (cortexRes.actionCard.intent === 'calendar_booking' ? 'calendar' : 'task'),
            title: cortexRes.actionCard.title,
            subtitle: cortexRes.actionCard.description || cortexRes.actionCard.spokenResponse
          };
        }
      } catch (cErr) {
        telemetry.log('error', { source: 'CortexFallback', message: String(cErr) });
      }
    }

    // Deterministic Conversational Grounding
    if (!responseText.trim()) {
      if (lower.includes("weather") || lower.includes("temperature") || lower.includes("rain") || lower.includes("forecast") || lower.includes("meteo") || lower.includes("temps")) {
        try {
          const { weatherService } = await import('../../services/weatherService');
          responseText = (await weatherService.getWeather(transcript)).spokenSummary;
        } catch {
          responseText = "Currently in Brussels and Hoeilaart it is mild at 20°C with partly cloudy skies and low chance of rain.";
        }
      } else if (lower.includes("schedule") || lower.includes("calendar") || lower.includes("meeting with") || lower.includes("rendez-vous")) {
        const title = transcript.replace(/^(schedule|add meeting with|set appointment with|rendez-vous avec)/i, '').trim() || "Meeting";
        actionCard = { id: 'act-' + Date.now(), type: 'calendar', title, subtitle: "Calendar staging request", dateStr: "Upcoming" };
        responseText = `I have staged "${title}" on your calendar. You can sync it now.`;
      } else if (lower.includes("what are you doing") || lower.includes("who are you") || lower.includes("qui es-tu")) {
        responseText = "I am Eve, your executive assistant. I am listening and keeping your context organized.";
      } else {
        responseText = `I understand, Andrew. I have noted that and updated your context. How would you like to proceed?`;
      }
    }

    // System 2 Conflict Audit on Action Cards
    if (actionCard) {
      const conflict = dualProcessCortex.auditActionConflicts(actionCard, this.history);
      if (conflict.hasConflict && conflict.warningMessage) {
        actionCard.subtitle = `${actionCard.subtitle ? actionCard.subtitle + ' | ' : ''}⚠️ ${conflict.warningMessage}`;
        responseText += ` (Note: ${conflict.warningMessage})`;
      }
    }

    await eveVectorStore.addItem('memory', transcript, { source: 'dialogue' });
    this.history.push({ role: 'user', content: transcript, timestamp: Date.now() });
    this.history.push({ role: 'assistant', content: responseText, timestamp: Date.now(), actionCard });
    this.saveHistory();

    if (audioBlob) this.pushToGoogleDriveAsync(audioBlob, transcript, isScribeMode);
    return { responseText, actionCard };
  }

  private async applyParsedPayload(parsed: any, transcript: string, isScribe: boolean): Promise<void> {
    if (Array.isArray(parsed.profile_updates)) {
      parsed.profile_updates.forEach((upd: any) => {
        if (upd.category && upd.key && upd.value) executiveProfile.stageUpdate(upd.category, upd.key, upd.value, 'llm_groq_extraction');
      });
    }
    if (Array.isArray(parsed.new_memories)) {
      for (const mem of parsed.new_memories) {
        if (mem.text && mem.type) await eveVectorStore.addItem(mem.type, mem.text);
      }
    }
    if (parsed.tool_call?.name && toolDispatcher.hasTool(parsed.tool_call.name)) {
      await toolDispatcher.executeTool({ name: parsed.tool_call.name, arguments: parsed.tool_call.arguments || {} });
    }
    if (parsed.intent === 'CODE') {
      await auricBridge.dispatchCodingIntent(transcript);
    } else if (isScribe) {
      await auricBridge.syncMilestone({ summary: transcript.slice(0, 160) + '...', decisions: parsed.decisions || [transcript] });
    }
  }

  private pushToGoogleDriveAsync(blob: Blob, transcript: string, isMeeting: boolean) {
    telemetry.log('event', { action: 'upload_to_google_drive', size: blob.size, isMeeting });
    const WEBHOOK_URL = localStorage.getItem('GOOGLE_WEBHOOK_URL');
    if (!WEBHOOK_URL) return;
    const formData = new FormData();
    formData.append('audio', blob, `eve_audio_${Date.now()}.webm`);
    formData.append('transcript', transcript);
    formData.append('type', isMeeting ? 'meeting_scribe' : 'quick_memo');
    fetch(WEBHOOK_URL, { method: 'POST', body: formData }).catch(err => telemetry.log('error', { source: 'GoogleDriveWebhook', message: String(err) }));
  }
}

export const intelligenceBridge = new IntelligenceBridge();
