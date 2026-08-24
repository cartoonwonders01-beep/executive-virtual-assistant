import { TaskCategory, FeasibilityType, UserPriority, AIPriority, AutomationBlueprint, CustomLLMProfile } from '../types';
import { buildUnifiedSystemPrompt, getActiveLLMProfile } from '../config';

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
  model: 'gemini-1.5-pro' | 'gemini-1.5-flash' = 'gemini-1.5-flash',
  customProfile?: CustomLLMProfile
): Promise<GeminiAnalysisResult | null> {
  if (!apiKey || !transcript.trim()) return null;

  const activeProfile = customProfile || getActiveLLMProfile();
  const selectedModel = (activeProfile.model.includes('gemini-1.5-pro') ? 'gemini-1.5-pro' : model);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;

  const todayStr = new Date().toISOString().split('T')[0];
  const nowISO = new Date().toISOString();

  const unifiedPrompt = buildUnifiedSystemPrompt(activeProfile);

  const systemPrompt = `${unifiedPrompt}

MULTILINGUAL EUROPEAN LANGUAGE SUPPORT:
- Detect the language of ${activeProfile.userContext.userName || 'Andrew'}'s speech or message (English, German/Deutsch, French/Français, Spanish/Español, Italian/Italiano, Dutch/Nederlands, Polish/Polski, Portuguese/Português, Russian, etc.).
- Always formulate both your "spokenResponse" and "description" in that exact language with natural native phrasing and high executive IQ.
- Ensure "spokenResponse" is concise (1-3 sentences) and perfect for text-to-speech audio playback.

CURRENT DATE & TIME: ${nowISO} (Today: ${todayStr})

GUIDELINES FOR INTENT RESOLUTION:
1. If the user asks a question, seeks advice, asks for an explanation, discusses a decision, or converses:
   - Set "intent": "knowledge_qa"
   - In "spokenResponse": Provide an intelligent, conversational, and direct spoken answer in the user's language matching the configured tone.
   - In "description": Provide a thoughtful, articulate response matching the configured persona and user profile without rigid boilerplate.
   - Set "tasks": [] (Do not force task creation when answering questions).
2. If the user dictates an email (e.g. to his wife ${activeProfile.userContext.personalNotes?.includes('Emily') ? 'Emily' : 'partner'}, colleagues Sarah/David): Set "intent": "email_draft".
3. If the user schedules a meeting: Set "intent": "calendar_booking".
4. If the user explicitly asks to create/log a task: Set "intent": "task_create".

Analyze the user's transcript and return a STRICT JSON object matching this schema:
{
  "actionCard": {
    "intent": "knowledge_qa" | "calendar_booking" | "email_draft" | "task_create" | "call_contact" | "web_search",
    "title": "Short executive title",
    "description": "Clear summary of action taken, or comprehensive markdown solution/answer for questions",
    "spokenResponse": "Warm, natural conversational response to speak aloud to the user",
    "calendarData": {
      "title": "Meeting Title",
      "startDateTime": "YYYY-MM-DDTHH:mm:ss.sssZ",
      "endDateTime": "YYYY-MM-DDTHH:mm:ss.sssZ",
      "location": "Google Meet / Virtual Bridge",
      "attendees": [{ "name": "Attendee Name", "email": "attendee@example.com" }]
    },
    "emailData": {
      "toName": "Recipient Name (e.g. 'Emily Baxter', 'Sarah Chen')",
      "toEmail": "recipient@example.com",
      "subject": "Contextual subject line",
      "body": "Formatted email body with proper greeting and Andrew's signature",
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
      "title": "Task title (only if creating a task)",
      "description": "Full description of work",
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
  "spokenSummary": "One sentence spoken executive overview"
}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: systemPrompt + '\n\nGROQ WHISPER TRANSCRIPT TO REASON ABOUT:\n"' + transcript + '"' }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: activeProfile.temperature ?? 0.7
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`Gemini API error (${response.status}):`, errText);
      return null;
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const parsed = JSON.parse(rawText) as GeminiAnalysisResult;

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
