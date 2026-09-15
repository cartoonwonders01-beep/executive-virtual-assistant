import { TaskCategory, FeasibilityType, UserPriority, AIPriority, AutomationBlueprint, CustomLLMProfile, ImageAttachment } from '../types';
import { buildUnifiedSystemPrompt, getActiveLLMProfile } from '../config';
import { logger } from './loggerService';

export interface GeminiImageInput {
  mimeType: string;
  data: string; // base64 string
}

export interface GeminiAnalysisResult {
  actionCard: {
    intent: 'calendar_booking' | 'email_draft' | 'task_create' | 'call_contact' | 'web_search' | 'knowledge_qa' | 'general_query';
    title: string;
    description: string;
    spokenResponse: string;
    calendarData?: {
      title: string;
      startDateTime: string;
      endDateTime: string;
      location?: string;
      attendees?: Array<{ name: string; email: string }>;
      googleCalendarUrl?: string;
    };
    emailData?: {
      toName: string;
      toEmail: string;
      subject: string;
      body: string;
      tone?: 'professional' | 'urgent' | 'friendly' | 'concise';
    };
    contactData?: {
      name: string;
      phone: string;
      email?: string;
    };
  };
  tasks: Array<{
    id?: string;
    title: string;
    description: string;
    category: TaskCategory;
    userPriority: UserPriority;
    aiPriority: AIPriority;
    feasibility: FeasibilityType;
    feasibilityReasoning: string;
    valueScore: number;
    estimatedValue: string;
    manualHoursEstimate: number;
    automationHoursInvested: number;
    timeWonBackHours: number;
    status: 'backlog' | 'in_progress' | 'automating' | 'completed';
    startDate: string;
    dueDate: string;
    durationDays: number;
    progressPercent: number;
    dependencies: string[];
    assignee: 'AI Agent' | 'Andrew' | 'Hybrid';
    automationBlueprint?: AutomationBlueprint;
  }>;
  spokenSummary: string;
}

export async function processSpeechWithGemini(
  transcript: string,
  apiKey: string,
  model: 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-1.5-pro' | 'gemini-1.5-flash' | 'gemini-flash-latest' | string = 'gemini-2.5-flash',
  customProfile?: CustomLLMProfile,
  conversationHistory?: Array<{ speaker: string; text: string }>,
  images?: Array<ImageAttachment | GeminiImageInput | { dataUrl: string; mimeType: string; name?: string }>,
  episodicContext?: string
): Promise<GeminiAnalysisResult | null> {
  if (!apiKey || (!transcript.trim() && (!images || images.length === 0))) return null;

  const activeProfile = customProfile || getActiveLLMProfile();
  const selectedModel = activeProfile.model.includes('pro') ? 'gemini-2.5-pro' : (activeProfile.model.includes('gemini') ? activeProfile.model : 'gemini-2.5-flash');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;

  const todayStr = new Date().toISOString().split('T')[0];
  const nowISO = new Date().toISOString();

  const unifiedPrompt = buildUnifiedSystemPrompt(activeProfile);

  let historyContext = '';
  if (conversationHistory && conversationHistory.length > 0) {
    historyContext = `\nRECENT CONVERSATION HISTORY (Chronological, Oldest to Newest):\n` + 
      conversationHistory.map(t => `${t.speaker === 'user' ? (activeProfile.userContext.userName || 'User') : 'Eve'}: "${t.text}"`).join('\n') + '\n';
  }

  const hasImages = images && images.length > 0;
  const visionPrompt = hasImages
    ? `\nMULTIMODAL VISION REASONING INSTRUCTIONS:
- You have received ${images.length} visual attachment(s) (screenshots, UI designs, documents, diagrams, photos, receipts, or data visualizations).
- Inspect the visual content thoroughly. Extract text, analyze structures, understand architecture diagrams, diagnose visual UI errors, or extract action items.
- Incorporate visual insights directly into your response and action card.\n`
    : '';

  const coreferencePrompt = `
COREFERENCE & PRONOUN ANAPHORA RESOLUTION:
- When ${activeProfile.userContext.userName} uses pronouns like "it", "them", "that", "he", "she", "him", "her", or phrases like "the meeting", "the email", "our previous discussion", look at RECENT CONVERSATION HISTORY and identify the exact antecedent object, person, meeting, or topic discussed in the previous turns.
- Maintain seamless context continuity across sequential instructions (e.g. if the previous turn discusses a meeting with David Miller, and the current message asks "Can you push it to 4 PM?", recognize that "it" = the David Miller meeting and update the start/end time accordingly).
- If ${activeProfile.userContext.userName} says "Send him an email" or "Tell her", resolve the recipient name and email from the recent discussion or Baxter family directory.
`;

  const memorySection = episodicContext ? `\n${episodicContext}\n` : '';

  const systemPrompt = `${unifiedPrompt}
${visionPrompt}
${coreferencePrompt}
${memorySection}
MULTILINGUAL EUROPEAN LANGUAGE SUPPORT:
- Detect the language of ${activeProfile.userContext.userName}'s speech or message (English, German/Deutsch, French/Français, Spanish/Español, Italian/Italiano, Dutch/Nederlands, Polish/Polski, Portuguese/Português, Russian, etc.).
- Always formulate both your "spokenResponse" and "description" in that exact language with natural native phrasing and high IQ.

NATURAL HUMAN CONVERSATIONAL BEHAVIOR:
- Respond naturally, warmly, and directly as an intelligent human companion and advisor.
- Do NOT talk like a rigid Project Manager. Do NOT build a book, output generic checklists, or force artificial bullet points unless the user explicitly asks for a structured plan.
- For ambiguous, incomplete, or underspecified statements (e.g. "I have a problem", "what should I do?", "let's fix this", "help me"):
  - Actively ask a warm, thoughtful clarifying question to understand the specific context before giving assumptions.
  - "spokenResponse": A warm, direct clarifying question (1-2 sentences).
  - "description": An empathetic response offering possible exploration angles.
- For complex planning or strategy requests (e.g. "Plan my 30 days", "How do I scale operations?", "Create a roadmap"):
  - Formulate a clean 3-Phase Action Plan (Phase 1: Alignment & Diagnosis, Phase 2: High-Leverage Execution, Phase 3: Automation & Measurement).
  - "spokenResponse": A crisp 1-2 sentence executive briefing overview.
  - "description": The structured 3-phase roadmap.
- For general questions, advice, ideas, or casual conversation:
  - "spokenResponse": 1 to 2 crisp, natural sentences for speech.
  - "description": 1 to 2 thoughtful, articulate paragraphs in direct human tone.
  - "tasks": [] (Leave tasks empty unless the user explicitly asks to create a task).

CURRENT DATE & TIME: ${nowISO} (Today: ${todayStr})
${historyContext}
BAXTER FAMILY & RESIDENCE CONTEXT:
- Andrew Baxter: User / Founder & Lead (Email: andy.j.baxter@gmail.com)
- Celine Loeuille: Wife & Operations Lead / Partner (Email: celine.loeuille@gmail.com)
- Elizabeth Baxter: Daughter (Email: elizabth.js.baxter@gmail.com)
- Alexander Baxter: Son (Email: alexander.j.baxter@gmail.com)
- Eleonore Baxter: Daughter (Email: eleonore.a.baxter@gmail.com)
- Angelina Baxter: Daughter (Email: angelina.c.baxter@gmail.com)
- Primary Residence: Hoeilaart, Belgium (Postcode 1560), near Sonian Forest.
- Commute Route to Brussels / Work: S8 or S81 commuter train from Hoeilaart or Groenendaal station to Brussels-Luxembourg (18 min) or Brussels-Central (22 min). By car: E411.

GUIDELINES FOR INTENT RESOLUTION:
1. If the user asks a question, seeks advice, discusses an idea, tells or asks for a joke, or converses: Set "intent": "knowledge_qa".
2. If the user dictates or asks to send an email (e.g. to wife Celine, children Elizabeth/Alexander/Eleonore/Angelina): Set "intent": "email_draft" and use the exact verified email from the roster above.
3. If the user asks to schedule/check a meeting: Set "intent": "calendar_booking".
4. If the user asks for transit, commute, or directions from home to work/Brussels: provide the Hoeilaart/Groenendaal S8 train route.
5. If the user asks to track a colleague's arrival without providing their name or flight/carrier: Ask a clarifying question for their name/flight and set "executionTier": "needs_slots".
6. If the user explicitly asks to create/log a task: Set "intent": "task_create".
7. If the user asks for real-time web or external research: Set "intent": "web_search".

Analyze the user's transcript and return a STRICT JSON object matching this schema:
{
  "actionCard": {
    "intent": "knowledge_qa" | "calendar_booking" | "email_draft" | "task_create" | "call_contact" | "web_search" | "calendar_reschedule",
    "title": "Short title",
    "description": "Natural, articulate human conversational response (1-2 paragraphs max)",
    "spokenResponse": "Warm, natural spoken response (1-2 sentences)",
    "executionTier": "instant" | "needs_slots" | "requires_approval",
    "calendarData": {
      "title": "Meeting Title",
      "startDateTime": "YYYY-MM-DDTHH:mm:ss.sssZ",
      "endDateTime": "YYYY-MM-DDTHH:mm:ss.sssZ",
      "location": "Google Meet / Virtual Bridge",
      "attendees": [{ "name": "Attendee Name", "email": "attendee@example.com" }]
    },
    "emailData": {
      "toName": "Recipient Name",
      "toEmail": "recipient@example.com",
      "subject": "Contextual subject line",
      "body": "Formatted email body with proper greeting and signature",
      "tone": "professional" | "friendly" | "urgent" | "concise"
    },
    "contactData": {
      "name": "Contact Name",
      "phone": "+1 (555) ...",
      "email": "contact@example.com"
    }
  },
  "tasks": [
    {
      "title": "Task title (ONLY if user explicitly asked to create a task)",
      "description": "Description",
      "category": "Tech/Dev" | "Business & Strategy" | "Finance" | "Operations & Admin" | "Marketing & Sales" | "Client Projects" | "Personal & Health",
      "userPriority": "urgent" | "high" | "medium" | "low",
      "aiPriority": "critical" | "high" | "medium" | "low",
      "feasibility": "ai_automated" | "hybrid" | "human_only",
      "feasibilityReasoning": "Why this task is automated, hybrid, or human-only",
      "valueScore": 8,
      "estimatedValue": "$1,500/mo Value",
      "manualHoursEstimate": 8,
      "automationHoursInvested": 2,
      "timeWonBackHours": 16,
      "status": "in_progress",
      "startDate": "${todayStr}",
      "dueDate": "YYYY-MM-DD",
      "durationDays": 5,
      "progressPercent": 20,
      "dependencies": [],
      "assignee": "AI Agent"
    }
  ],
  "spokenSummary": "One sentence spoken overview"
}`;

  try {
    const userParts: any[] = [
      { text: systemPrompt + '\n\nGROQ WHISPER TRANSCRIPT TO REASON ABOUT:\n"' + (transcript || (hasImages ? 'Please inspect and analyze the attached visual input.' : '')) + '"' }
    ];

    if (images && images.length > 0) {
      for (const img of images) {
        const mimeType = (img as any).mimeType || 'image/png';
        let rawBase64 = '';
        if ('data' in img && typeof img.data === 'string') {
          rawBase64 = img.data.replace(/^data:[^;]+;base64,/, '');
        } else if ('url' in img && typeof img.url === 'string') {
          rawBase64 = img.url.replace(/^data:[^;]+;base64,/, '');
        } else if ('dataUrl' in img && typeof (img as any).dataUrl === 'string') {
          rawBase64 = (img as any).dataUrl.replace(/^data:[^;]+;base64,/, '');
        }
        if (rawBase64) {
          userParts.push({
            inline_data: {
              mime_type: mimeType,
              data: rawBase64
            }
          });
        }
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 4500);

    const startTime = Date.now();
    logger.debug('gemini_llm', `🚀 [Gemini 2.5 Dispatch] Calling Gemini API (${selectedModel})`, {
      model: selectedModel,
      timeoutMs: 4500,
      hasImages: images && images.length > 0,
      temperature: activeProfile.temperature ?? 0.7,
      historyTurnsIncluded: conversationHistory?.length || 0
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: userParts
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: activeProfile.temperature ?? 0.7
        }
      })
    });
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    let rawText = '';

    if (response.ok) {
      const data = await response.json();
      rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      logger.debug('gemini_llm', `📥 [Gemini 2.5 Response] Received payload in ${latencyMs}ms`, {
        latencyMs,
        status: response.status,
        textBytes: rawText.length
      });
    } else {
      const errText = await response.text().catch(() => '');
      logger.debug('gemini_llm', `⚠️ [Gemini 2.5 Non-OK Status] ${response.status}: ${errText.slice(0, 150)}`);
      
      // Edge Relay Fallback
      if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
        const edgeRes = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: userParts }],
            model: selectedModel,
            apiKey
          })
        }).catch(() => null);

        if (edgeRes && edgeRes.ok) {
          const edgeData = await edgeRes.json().catch(() => null);
          rawText = edgeData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
      }
    }

    if (!rawText) return null;

    let parsed: GeminiAnalysisResult;
    try {
      // Clean JSON fences if model outputted markdown code block
      const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      parsed = JSON.parse(cleanJson) as GeminiAnalysisResult;
    } catch {
      // Natural text fallback
      parsed = {
        actionCard: {
          intent: 'knowledge_qa',
          title: transcript.length > 35 ? transcript.substring(0, 32) + '...' : transcript,
          description: rawText,
          spokenResponse: rawText.split('\n')[0].replace(/[*#]/g, '')
        },
        tasks: [],
        spokenSummary: rawText.split('\n')[0].replace(/[*#]/g, '')
      };
    }

    // Post-process IDs and date formats
    if (parsed.tasks && Array.isArray(parsed.tasks)) {
      parsed.tasks = parsed.tasks.map((t, idx) => ({
        ...t,
        id: t.id || `task-gemini-${Date.now()}-${idx}`
      }));
    }

    // Generate Google Calendar deep link if appointment is returned
    if (parsed.actionCard?.calendarData && !parsed.actionCard.calendarData.googleCalendarUrl) {
      const gcalFormat = (d: string) => new Date(d).toISOString().replace(/-|:|\.\d+/g, '');
      const cal = parsed.actionCard.calendarData;
      cal.googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(cal.title)}&dates=${gcalFormat(cal.startDateTime)}/${gcalFormat(cal.endDateTime)}&details=${encodeURIComponent('Coordinated via Gemini AI Ultra')}&location=${encodeURIComponent(cal.location || 'Google Meet')}`;
    }

    return parsed;
  } catch (err) {
    console.error('Failed to parse with Gemini API:', err);
    return null;
  }
}

export async function testGeminiConnection(apiKey: string): Promise<{ success: boolean; message: string; model?: string }> {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, message: 'Please enter a valid Google Gemini API key.' };
  }
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Hello, respond with the single word: Connected' }] }]
      })
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as any;
      return { success: false, message: `Google API Error (${res.status}): ${err?.error?.message || res.statusText}` };
    }
    const data = (await res.json()) as any;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { success: true, message: `Connected to Google Gemini 2.5 Flash: "${text.trim()}"`, model: 'gemini-2.5-flash' };
  } catch (err: any) {
    return { success: false, message: `Network Error connecting to Google Gemini: ${err.message}` };
  }
}

export async function testGroqConnection(apiKey: string): Promise<{ success: boolean; message: string }> {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, message: 'Please enter a valid Groq API key.' };
  }
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey.trim()}` }
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as any;
      return { success: false, message: `Groq API Error (${res.status}): ${err?.error?.message || res.statusText}` };
    }
    return { success: true, message: `Connected to Groq Cloud (Whisper Large v3 Turbo ready)` };
  } catch (err: any) {
    return { success: false, message: `Network Error connecting to Groq: ${err.message}` };
  }
}
