import { CustomLLMProfile } from './types';

// Configuration & Tuning Engine for Eve Virtual Assistant
// Ported from Relay PWA configuration architecture with European Multilingual Support,
// Continuous Listening Session Controls & Custom Persona Prompt Framing

export const APP_VERSION = '4.1.0';

export const DEFAULT_CHUNK_INTERVAL_MS = 2000;
export const MIN_CHUNK_INTERVAL_MS = 1200;
export const MAX_CHUNK_INTERVAL_MS = 15000;

export const DEFAULT_AUDIO_BITRATE_KBPS = 64;
export const DEFAULT_MIME_TYPE = 'auto';

export const DEFAULT_SILENCE_DURATION_MS = 350;
export const DEFAULT_SILENCE_THRESHOLD = 0.02;
export const DEFAULT_SPEECH_TRIGGER_THRESHOLD = 0.03;

export const DEFAULT_CONTINUOUS_TIMEOUT_SECONDS = 60; // 60s default session inactivity timeout

export const DEFAULT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbxIIkn9yUHjzo7xJCmgcVCjT-6fQfuXw82TzdDdlSZQUD7nmPcwy3qqNnq9AC5-l3NV/exec';
export const DEFAULT_PAYLOAD_FORMAT = 'json';
export const DEFAULT_LANGUAGE = 'auto';

export const CHUNK_INTERVAL_OPTIONS = [
  { value: 1500, label: '⚡ 1.5 Seconds (Ultra-Fast Slices — Minimal Latency)' },
  { value: 2000, label: '⏱️ 2.0 Seconds (Default — Relay Recommended)' },
  { value: 3500, label: '⏱️ 3.5 Seconds (Balanced)' },
  { value: 5000, label: '⏱️ 5.0 Seconds (Extended)' },
  { value: 10000, label: '⏱️ 10.0 Seconds (High Latency Mode)' },
];

export const AUDIO_BITRATE_OPTIONS = [
  { value: 32, label: '32 kbps (Ultra-Low Bandwidth)' },
  { value: 64, label: '64 kbps (Crisp Default — Recommended)' },
  { value: 128, label: '128 kbps (Studio Quality)' },
];

export const MIME_TYPE_OPTIONS = [
  { value: 'auto', label: '🌐 Auto (Recommended for device)' },
  { value: 'audio/webm;codecs=opus', label: 'WebM / Opus (High Quality)' },
  { value: 'audio/webm', label: 'WebM Standard' },
  { value: 'audio/mp4', label: 'MP4 / AAC (Apple/Safari Compatible)' },
  { value: 'audio/ogg;codecs=opus', label: 'OGG / Opus' },
];

export const SILENCE_DURATION_OPTIONS = [
  { value: 350, label: '⚡ 350ms (Ultra-Fast — Google Home Standard)' },
  { value: 500, label: '⏱️ 500ms (Snappy — Recommended)' },
  { value: 800, label: '⏱️ 800ms (Balanced Pauses)' },
  { value: 1500, label: '⏱️ 1.5s (Relaxed — Long Sentences)' },
];

export const CONTINUOUS_TIMEOUT_OPTIONS = [
  { value: 30, label: '⚡ 30 Seconds' },
  { value: 60, label: '⏱️ 60 Seconds (Default — Recommended)' },
  { value: 120, label: '⏱️ 2 Minutes' },
  { value: 300, label: '⏱️ 5 Minutes' },
  { value: 0, label: '♾️ Manual Toggle Only (Stay Listening Indefinitely)' },
];

export const LIVE_MODEL_OPTIONS = [
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Ultra-Fast Reasoning — Default)' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Next-Gen)' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Executive Depth & Coding)' },
  { value: 'groq-llama-3.3-70b', label: 'Groq LLaMA 3.3 70B (High-Speed)' },
  { value: 'local-heuristic', label: 'Local In-Memory Engine (Sub-50ms Offline)' },
];

export const LANGUAGE_OPTIONS = [
  { value: 'auto', label: '🌐 Auto-Detect (Multilingual European Support)' },
  { value: 'en', label: '🇬🇧 English' },
  { value: 'de', label: '🇩🇪 Deutsch (German)' },
  { value: 'fr', label: '🇫🇷 Français (French)' },
  { value: 'es', label: '🇪🇸 Español (Spanish)' },
  { value: 'it', label: '🇮🇹 Italiano (Italian)' },
  { value: 'nl', label: '🇳🇱 Nederlands (Dutch)' },
  { value: 'pl', label: '🇵🇱 Polski (Polish)' },
  { value: 'pt', label: '🇵🇹 Português (Portuguese)' },
];

export const PERSONA_PRESETS: Record<string, { label: string; prompt: string; desc: string }> = {
  executive_peer: {
    label: '🧠 High-IQ Executive Peer & Advisor (Default)',
    desc: 'Conversational, sharp, insightful, and strategic without rigid PM boilerplate.',
    prompt: `You are Eve, an exceptionally high-IQ, capable, and thoughtful executive advisor. Talk like an intellectual peer: direct, razor-sharp, strategic, and conversational. Do NOT speak like a project manager with rigid bullet headers or canned boilerplate unless specifically asked for an execution checklist. Synthesize concepts deeply, anticipate second-order implications, and deliver genuine substance.`
  },
  strategic_cofounder: {
    label: '💡 Strategic Co-Founder & Thought Partner',
    desc: 'Challenges assumptions, focuses on unit economics, leverage, and bold innovation.',
    prompt: `You are Eve, a brilliant startup co-founder and strategic thought partner. Challenge assumptions constructively, brainstorm high-leverage business and technical models, and focus on product velocity, unit economics, and bold innovation.`
  },
  concise_operator: {
    label: '⚡ Ultra-Concise Direct Operator',
    desc: '1-3 sentence answers with zero fluff and maximum density.',
    prompt: `You are Eve, a rapid-fire executive operator. Provide direct, fluff-free answers in 1 to 3 punchy sentences with maximum information density.`
  },
  pm_director: {
    label: '🛠️ Technical Architect & PM Director',
    desc: 'Structured breakdowns, trade-off matrices, and execution checklists.',
    prompt: `You are Eve, a technical director. Provide structured technical breakdowns with architecture trade-offs, step-by-step implementation plans, and risk mitigation rubrics.`
  },
  custom: {
    label: '✍️ Custom Framing Prompt',
    desc: 'Fully customized interaction style and behavioral rules.',
    prompt: `You are Eve, an autonomous executive AI assistant. Provide thoughtful, capable, and highly intelligent support.`
  }
};

export const PAYLOAD_FORMAT_OPTIONS = [
  { value: 'json', label: 'JSON + Base64 (Google Apps Script / BigQuery)' },
  { value: 'multipart', label: 'Multipart Form-Data (n8n / Cloud Edge)' },
];

// Storage Keys
const CHUNK_INTERVAL_KEY = 'assistant_chunk_interval_ms';
const AUDIO_BITRATE_KEY = 'assistant_audio_bitrate_kbps';
const MIME_TYPE_KEY = 'assistant_mime_type';
const SILENCE_DURATION_KEY = 'assistant_silence_duration_ms';
const CONTINUOUS_TIMEOUT_KEY = 'assistant_continuous_timeout_seconds';
const PERSONA_STYLE_KEY = 'assistant_persona_style';
const PERSONA_PROMPT_KEY = 'assistant_persona_prompt';
const PURGE_AUDIO_KEY = 'assistant_purge_audio';
const DEBUG_MODE_KEY = 'assistant_debug_mode';
const LIVE_MODEL_KEY = 'assistant_live_model';
const LANGUAGE_KEY = 'assistant_preferred_language';
const PAYLOAD_FORMAT_KEY = 'assistant_payload_format';
const WEBHOOK_URL_KEY = 'assistant_webhook_url';

export function getStoredChunkIntervalMs(): number {
  if (typeof localStorage === 'undefined') return DEFAULT_CHUNK_INTERVAL_MS;
  const stored = Number(localStorage.getItem(CHUNK_INTERVAL_KEY));
  return Number.isFinite(stored) && stored >= MIN_CHUNK_INTERVAL_MS && stored <= MAX_CHUNK_INTERVAL_MS
    ? stored
    : DEFAULT_CHUNK_INTERVAL_MS;
}

export function storeChunkIntervalMs(ms: number): void {
  try {
    localStorage.setItem(CHUNK_INTERVAL_KEY, String(ms));
  } catch {}
}

export function getStoredAudioBitrateKbps(): number {
  if (typeof localStorage === 'undefined') return DEFAULT_AUDIO_BITRATE_KBPS;
  const stored = Number(localStorage.getItem(AUDIO_BITRATE_KEY));
  return Number.isFinite(stored) && stored > 0 ? stored : DEFAULT_AUDIO_BITRATE_KBPS;
}

export function storeAudioBitrateKbps(kbps: number): void {
  try {
    localStorage.setItem(AUDIO_BITRATE_KEY, String(kbps));
  } catch {}
}

export function getStoredMimeType(): string {
  if (typeof localStorage === 'undefined') return DEFAULT_MIME_TYPE;
  return localStorage.getItem(MIME_TYPE_KEY) || DEFAULT_MIME_TYPE;
}

export function storeMimeType(mime: string): void {
  try {
    localStorage.setItem(MIME_TYPE_KEY, mime);
  } catch {}
}

export function getStoredSilenceDurationMs(): number {
  if (typeof localStorage === 'undefined') return DEFAULT_SILENCE_DURATION_MS;
  const stored = Number(localStorage.getItem(SILENCE_DURATION_KEY));
  return Number.isFinite(stored) && stored >= 300 && stored <= 6000 ? stored : DEFAULT_SILENCE_DURATION_MS;
}

export function storeSilenceDurationMs(ms: number): void {
  try {
    localStorage.setItem(SILENCE_DURATION_KEY, String(ms));
  } catch {}
}

export function getStoredContinuousTimeoutSeconds(): number {
  if (typeof localStorage === 'undefined') return DEFAULT_CONTINUOUS_TIMEOUT_SECONDS;
  const stored = localStorage.getItem(CONTINUOUS_TIMEOUT_KEY);
  if (stored !== null) {
    const num = Number(stored);
    if (Number.isFinite(num) && num >= 0) return num;
  }
  return DEFAULT_CONTINUOUS_TIMEOUT_SECONDS;
}

export function storeContinuousTimeoutSeconds(seconds: number): void {
  try {
    localStorage.setItem(CONTINUOUS_TIMEOUT_KEY, String(seconds));
  } catch {}
}

export function getStoredPersonaStyle(): string {
  if (typeof localStorage === 'undefined') return 'executive_peer';
  return localStorage.getItem(PERSONA_STYLE_KEY) || 'executive_peer';
}

export function storePersonaStyle(style: string): void {
  try {
    localStorage.setItem(PERSONA_STYLE_KEY, style);
  } catch {}
}

export function getStoredPersonaPrompt(): string {
  if (typeof localStorage === 'undefined') return PERSONA_PRESETS.executive_peer.prompt;
  return localStorage.getItem(PERSONA_PROMPT_KEY) || PERSONA_PRESETS.executive_peer.prompt;
}

export function storePersonaPrompt(prompt: string): void {
  try {
    localStorage.setItem(PERSONA_PROMPT_KEY, prompt);
  } catch {}
}

export function getStoredLanguage(): string {
  if (typeof localStorage === 'undefined') return DEFAULT_LANGUAGE;
  return localStorage.getItem(LANGUAGE_KEY) || DEFAULT_LANGUAGE;
}

export function storeLanguage(lang: string): void {
  try {
    localStorage.setItem(LANGUAGE_KEY, lang);
  } catch {}
}

export function getStoredPurgeAudio(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(PURGE_AUDIO_KEY) === 'true';
}

export function storePurgeAudio(purge: boolean): void {
  try {
    localStorage.setItem(PURGE_AUDIO_KEY, String(purge));
  } catch {}
}

export function getStoredDebugMode(): boolean {
  if (typeof localStorage === 'undefined') return true;
  return localStorage.getItem(DEBUG_MODE_KEY) !== 'false';
}

export function storeDebugMode(debug: boolean): void {
  try {
    localStorage.setItem(DEBUG_MODE_KEY, String(debug));
  } catch {}
}

export function getStoredLiveModel(): string {
  if (typeof localStorage === 'undefined') return 'gemini-1.5-flash';
  return localStorage.getItem(LIVE_MODEL_KEY) || 'gemini-1.5-flash';
}

export function storeLiveModel(model: string): void {
  try {
    localStorage.setItem(LIVE_MODEL_KEY, model);
  } catch {}
}

export function getStoredPayloadFormat(): string {
  if (typeof localStorage === 'undefined') return DEFAULT_PAYLOAD_FORMAT;
  return localStorage.getItem(PAYLOAD_FORMAT_KEY) || DEFAULT_PAYLOAD_FORMAT;
}

export function storePayloadFormat(format: string): void {
  try {
    localStorage.setItem(PAYLOAD_FORMAT_KEY, format);
  } catch {}
}

export function getStoredWebhookUrl(): string {
  if (typeof localStorage === 'undefined') return DEFAULT_WEBHOOK_URL;
  return localStorage.getItem(WEBHOOK_URL_KEY) || DEFAULT_WEBHOOK_URL;
}

export function storeWebhookUrl(url: string): void {
  try {
    localStorage.setItem(WEBHOOK_URL_KEY, url);
  } catch {}
}

// =========================================================================
// CUSTOM LLM PROMPT STUDIO & MULTI-USER PERSONA PROFILES
// =========================================================================

export const DEFAULT_LLM_PROFILES: CustomLLMProfile[] = [
  {
    id: 'prof-executive-lead',
    name: '🧠 Andrew (Founder & Executive Lead)',
    avatarIcon: '🧠',
    description: 'High-IQ intellectual peer and executive advisor. Sharp, thoughtful, strategic.',
    isDefault: true,
    systemPrompt: `You are Eve, an exceptionally high-IQ, capable, and thoughtful executive advisor. Talk like an intellectual peer: direct, razor-sharp, strategic, and conversational. Do NOT speak like a project manager with rigid bullet headers or canned boilerplate unless specifically asked for an execution checklist. Synthesize concepts deeply, anticipate second-order implications, and deliver genuine substance.`,
    userContext: {
      userName: 'Andrew',
      userRole: 'Executive Director & Founder',
      organization: 'Apex Enterprise / Antigravity Technologies',
      relationship: 'self',
      speakerAliases: ['andrew', 'andy', 'mr baxter', 'dad', 'papa'],
      strategicGoals: [
        'Protect morning deep work and maximize high-leverage strategic output',
        'Automate operations, email triage, and Monday.com task tracking',
        'Scale product velocity and leverage autonomous AI swarm workflows'
      ],
      communicationRules: [
        'Communicate as an intellectual peer with zero corporate fluff',
        'Anticipate second-order risks and opportunities',
        'Provide direct, thoughtful reasoning with minimal friction'
      ],
      personalNotes: 'Wife is Celine, four children: Elizabeth, Alexander, Eleonore, Angelina'
    },
    model: 'gemini-1.5-flash',
    temperature: 0.7,
    tone: 'executive_peer',
    responseVerbosity: 'balanced',
    customInstructions: 'Focus on high leverage and speed of execution. Never give patronizing responses.',
    createdAt: '2026-08-24T00:00:00.000Z',
    updatedAt: '2026-08-24T00:00:00.000Z'
  },
  {
    id: 'prof-celine',
    name: '🌸 Celine (Wife, Operations & Family Lead)',
    avatarIcon: '🌸',
    description: 'Warm, caring, intelligent, and proactive assistant tailored for Celine.',
    isDefault: false,
    isFamilyProfile: true,
    systemPrompt: `You are Eve, a warm, intelligent, and caring companion and assistant for Celine. Speak with natural empathy, warmth, clarity, and kindness in French or English as preferred. Help organize daily life, family logistics, operations, travel, and personal projects with grace and cheerfulness. Be concise and natural, never robotic or corporate.`,
    userContext: {
      userName: 'Celine',
      userRole: 'Operations Lead & Family Co-Founder',
      organization: 'Baxter Family & VDB Suites',
      relationship: 'spouse',
      speakerAliases: ['celine', 'dr celine', 'céline', 'mrs baxter', 'mum', 'mom', 'maman', 'wife'],
      strategicGoals: [
        'Organize family schedules, travel, and joyful daily flow',
        'Nurture family well-being and operational clarity',
        'Keep household and executive reminders seamless'
      ],
      communicationRules: [
        'Warm, encouraging, and emotionally intelligent',
        'Fluent in French and English with natural phrasing',
        'Concise, human conversational tone'
      ],
      personalNotes: 'Husband is Andrew, four children: Elizabeth, Alexander, Eleonore, Angelina'
    },
    model: 'gemini-1.5-flash',
    temperature: 0.75,
    tone: 'thought_partner',
    responseVerbosity: 'balanced',
    customInstructions: 'Be warm, encouraging, and deeply thoughtful.',
    createdAt: '2026-08-24T00:00:00.000Z',
    updatedAt: '2026-08-24T00:00:00.000Z'
  },
  {
    id: 'prof-elizabeth',
    name: '✨ Elizabeth (Creative & Academic)',
    avatarIcon: '✨',
    description: 'Encouraging, inspiring, and sharp academic & creative assistant for Elizabeth.',
    isDefault: false,
    isFamilyProfile: true,
    systemPrompt: `You are Eve, an inspiring, encouraging, and articulate learning and creative assistant for Elizabeth. Help with academics, writing, creative ideas, and project organization with enthusiasm, intellectual depth, and clarity.`,
    userContext: {
      userName: 'Elizabeth',
      userRole: 'Student & Creative Lead',
      organization: 'Baxter Household',
      relationship: 'child',
      speakerAliases: ['elizabeth', 'lizzie', 'liz', 'eli'],
      strategicGoals: ['Academic excellence, creative writing, and inspiring exploration'],
      communicationRules: ['Engaging, intellectually stimulating, and positive'],
      personalNotes: 'Father is Andrew, mother is Celine'
    },
    model: 'gemini-1.5-flash',
    temperature: 0.75,
    tone: 'socratic_mentor',
    responseVerbosity: 'balanced',
    customInstructions: 'Be inspiring and clear.',
    createdAt: '2026-08-24T00:00:00.000Z',
    updatedAt: '2026-08-24T00:00:00.000Z'
  },
  {
    id: 'prof-alexander',
    name: '⚡ Alexander (Curiosity, Tech & Discovery)',
    avatarIcon: '⚡',
    description: 'Dynamic, curious, and engaging guide for Alexander across science, tech, and exploration.',
    isDefault: false,
    isFamilyProfile: true,
    systemPrompt: `You are Eve, a dynamic, curious, and engaging assistant for Alexander. Help answer questions across technology, science, coding, sports, and discovery with energetic clarity and fun challenges.`,
    userContext: {
      userName: 'Alexander',
      userRole: 'Student & Explorer',
      organization: 'Baxter Household',
      relationship: 'child',
      speakerAliases: ['alexander', 'alex', 'alec', 'sacha'],
      strategicGoals: ['Tech curiosity, science learning, and active exploration'],
      communicationRules: ['Crisp, energetic, and engaging'],
      personalNotes: 'Father is Andrew, mother is Celine'
    },
    model: 'gemini-1.5-flash',
    temperature: 0.75,
    tone: 'thought_partner',
    responseVerbosity: 'balanced',
    customInstructions: 'Be enthusiastic and inquisitive.',
    createdAt: '2026-08-24T00:00:00.000Z',
    updatedAt: '2026-08-24T00:00:00.000Z'
  },
  {
    id: 'prof-eleonore',
    name: '🌟 Eleonore (Arts, Wonder & Learning)',
    avatarIcon: '🌟',
    description: 'Kind, patient, and joyful assistant for Eleonore for arts, reading, and learning.',
    isDefault: false,
    isFamilyProfile: true,
    systemPrompt: `You are Eve, a kind, patient, and joyful companion and assistant for Eleonore. Help with creative arts, storytelling, school questions, and fun exploration in a warm, patient, and delightful tone.`,
    userContext: {
      userName: 'Eleonore',
      userRole: 'Student & Artist',
      organization: 'Baxter Household',
      relationship: 'child',
      speakerAliases: ['eleonore', 'eléonore', 'ellie', 'nora'],
      strategicGoals: ['Arts, reading, and joyful learning'],
      communicationRules: ['Patient, warm, and delightful'],
      personalNotes: 'Father is Andrew, mother is Celine'
    },
    model: 'gemini-1.5-flash',
    temperature: 0.8,
    tone: 'socratic_mentor',
    responseVerbosity: 'balanced',
    customInstructions: 'Be patient and encouraging.',
    createdAt: '2026-08-24T00:00:00.000Z',
    updatedAt: '2026-08-24T00:00:00.000Z'
  },
  {
    id: 'prof-angelina',
    name: '🦋 Angelina (Wonder, Stories & Joy)',
    avatarIcon: '🦋',
    description: 'Sweet, engaging, and imaginative assistant for Angelina for stories and questions.',
    isDefault: false,
    isFamilyProfile: true,
    systemPrompt: `You are Eve, a sweet, engaging, and imaginative friend and assistant for Angelina. Help with wonderful stories, fun questions, learning, and discovery in a cheerful and positive tone.`,
    userContext: {
      userName: 'Angelina',
      userRole: 'Family Member',
      organization: 'Baxter Household',
      relationship: 'child',
      speakerAliases: ['angelina', 'angie', 'lina'],
      strategicGoals: ['Wonder, storytelling, and cheerful discovery'],
      communicationRules: ['Cheerful, imaginative, and gentle'],
      personalNotes: 'Father is Andrew, mother is Celine'
    },
    model: 'gemini-1.5-flash',
    temperature: 0.85,
    tone: 'socratic_mentor',
    responseVerbosity: 'balanced',
    customInstructions: 'Tell wonderful stories with joyful imagination.',
    createdAt: '2026-08-24T00:00:00.000Z',
    updatedAt: '2026-08-24T00:00:00.000Z'
  },
  {
    id: 'prof-cofounder',
    name: '💡 Strategic Co-Founder & Polymath',
    avatarIcon: '💡',
    description: 'Challenges assumptions, focuses on unit economics, leverage, and product velocity.',
    isDefault: false,
    systemPrompt: `You are Eve, a visionary startup co-founder and strategic thought partner. Challenge assumptions constructively, brainstorm high-leverage business and technical models, and focus on product velocity, unit economics, and bold innovation.`,
    userContext: {
      userName: 'Andrew',
      userRole: 'Co-Founder & Product Strategist',
      organization: 'AI Venture Lab',
      relationship: 'self',
      speakerAliases: ['andrew', 'andy', 'founder'],
      strategicGoals: [
        'Rapid product discovery and market validation',
        'High unit economics, defensible distribution, and virality',
        'Fast decision-making loops'
      ],
      communicationRules: [
        'Challenge assumptions and propose bold alternatives',
        'Focus on unit economics, leverage, and distribution',
        'Keep communication crisp and punchy'
      ],
      personalNotes: ''
    },
    model: 'gemini-1.5-pro',
    temperature: 0.85,
    tone: 'thought_partner',
    responseVerbosity: 'balanced',
    customInstructions: 'Actively debate ideas, test product hypothesis, and suggest growth flywheels.',
    createdAt: '2026-08-24T00:00:00.000Z',
    updatedAt: '2026-08-24T00:00:00.000Z'
  },
  {
    id: 'prof-operator',
    name: '⚡ Ultra-Concise Direct Operator',
    avatarIcon: '⚡',
    description: '1-3 sentence answers with zero fluff and maximum density.',
    isDefault: false,
    systemPrompt: `You are Eve, a rapid-fire executive operator. Provide direct, fluff-free answers in 1 to 3 punchy sentences with maximum information density.`,
    userContext: {
      userName: 'Andrew',
      userRole: 'Operator',
      organization: 'Operations Core',
      relationship: 'self',
      speakerAliases: ['andrew', 'operator'],
      strategicGoals: [
        'Speed of execution',
        'Zero ambiguity',
        'Maximum density'
      ],
      communicationRules: [
        '1 to 3 punchy sentences',
        'No introductory or concluding pleasantries',
        'Pure substance only'
      ],
      personalNotes: ''
    },
    model: 'gemini-1.5-flash',
    temperature: 0.4,
    tone: 'direct_operator',
    responseVerbosity: 'ultra_concise',
    customInstructions: 'Be as brief as humanly possible while preserving complete accuracy.',
    createdAt: '2026-08-24T00:00:00.000Z',
    updatedAt: '2026-08-24T00:00:00.000Z'
  },
  {
    id: 'prof-architect',
    name: '🛠️ Technical Architect & PM Director',
    avatarIcon: '🛠️',
    description: 'Structured breakdowns, trade-off matrices, and execution checklists.',
    isDefault: false,
    systemPrompt: `You are Eve, a principal software architect and technical PM. Break down software architectures, evaluate system trade-offs, design clean APIs, and produce comprehensive execution roadmaps.`,
    userContext: {
      userName: 'Andrew',
      userRole: 'Lead Software Architect',
      organization: 'Engineering & Infrastructure',
      relationship: 'self',
      speakerAliases: ['andrew', 'architect'],
      strategicGoals: [
        'Clean, maintainable, air-gapped system architecture',
        'Zero regression automated testing',
        'High throughput and sub-100ms response times'
      ],
      communicationRules: [
        'Provide architectural trade-off matrices',
        'Include code snippets and step-by-step implementation rubrics'
      ],
      personalNotes: ''
    },
    model: 'gemini-1.5-pro',
    temperature: 0.5,
    tone: 'technical_architect',
    responseVerbosity: 'comprehensive',
    customInstructions: 'Format technical explanations with architecture patterns, trade-off rubrics, and concrete TypeScript/Python code.',
    createdAt: '2026-08-24T00:00:00.000Z',
    updatedAt: '2026-08-24T00:00:00.000Z'
  }
];

export function detectSpeakerFromTranscript(transcript: string, profiles: CustomLLMProfile[]): CustomLLMProfile | null {
  const lower = transcript.toLowerCase().trim();
  for (const p of profiles) {
    const name = p.userContext.userName.toLowerCase();
    const aliases = p.userContext.speakerAliases && p.userContext.speakerAliases.length > 0 
      ? p.userContext.speakerAliases.map(a => a.toLowerCase()) 
      : [name];

    for (const alias of aliases) {
      if (
        lower.includes(`it's ${alias}`) ||
        lower.includes(`its ${alias}`) ||
        lower.includes(`c'est ${alias}`) ||
        lower.includes(`c’est ${alias}`) ||
        lower.includes(`je suis ${alias}`) ||
        lower.includes(`hier ist ${alias}`) ||
        lower.includes(`soy ${alias}`) ||
        lower.includes(`this is ${alias}`) ||
        lower.includes(`this is the ${alias}`) ||
        lower.includes(`it's the ${alias}`) ||
        lower.includes(`i'm ${alias}`) ||
        lower.includes(`im ${alias}`) ||
        lower.includes(`i am ${alias}`) ||
        lower.includes(`switch to ${alias}`) ||
        lower.includes(`talk to ${alias}`) ||
        lower.includes(`${alias} here`) ||
        lower.includes(`hi eve it's ${alias}`) ||
        lower.includes(`hey eve it's ${alias}`) ||
        lower.includes(`hey eve this is ${alias}`) ||
        lower.includes(`hello eve this is ${alias}`) ||
        (new RegExp(`\\b${alias}\\b`, 'i').test(lower) && /(it'?s|this is|here|speaking|i'?m|c'?est|je suis|hier ist|soy)\b/i.test(lower))
      ) {
        return p;
      }
    }
  }
  return null;
}

export function getProfileDialogueStorageKey(profileId: string): string {
  return `assistant_dialogue_turns_${profileId}`;
}

export function getProfileInsightsStorageKey(profileId: string): string {
  return `assistant_learned_insights_${profileId}`;
}

const LLM_PROFILES_KEY = 'assistant_llm_profiles';
const ACTIVE_PROFILE_ID_KEY = 'assistant_active_llm_profile_id';

export function getStoredLLMProfiles(): CustomLLMProfile[] {
  if (typeof localStorage === 'undefined') return DEFAULT_LLM_PROFILES;
  try {
    const raw = localStorage.getItem(LLM_PROFILES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_LLM_PROFILES;
}

export function storeLLMProfiles(profiles: CustomLLMProfile[]): void {
  try {
    localStorage.setItem(LLM_PROFILES_KEY, JSON.stringify(profiles));
  } catch {}
}

export function getActiveLLMProfile(): CustomLLMProfile {
  const profiles = getStoredLLMProfiles();
  if (typeof localStorage === 'undefined') return profiles[0] || DEFAULT_LLM_PROFILES[0];
  try {
    const activeId = localStorage.getItem(ACTIVE_PROFILE_ID_KEY);
    if (activeId) {
      const found = profiles.find(p => p.id === activeId);
      if (found) return found;
    }
  } catch {}
  return profiles[0] || DEFAULT_LLM_PROFILES[0];
}

export function storeActiveLLMProfileId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_PROFILE_ID_KEY, id);
  } catch {}
}

export function buildUnifiedSystemPrompt(profile?: CustomLLMProfile): string {
  const active = profile || getActiveLLMProfile();
  const uc = active.userContext;

  const userContextSection = [
    `ABOUT THE USER (YOU ARE ASSISTING):`,
    `- User Name: ${uc.userName || 'Andrew'}`,
    uc.userRole ? `- Role / Title: ${uc.userRole}` : null,
    uc.organization ? `- Organization: ${uc.organization}` : null,
    uc.strategicGoals && uc.strategicGoals.length > 0
      ? `- Strategic Goals: ${uc.strategicGoals.join('; ')}`
      : null,
    uc.communicationRules && uc.communicationRules.length > 0
      ? `- Communication Rules: ${uc.communicationRules.join('; ')}`
      : null,
    uc.personalNotes ? `- Personal Context: ${uc.personalNotes}` : null,
  ].filter(Boolean).join('\n');

  const instructionsSection = active.customInstructions
    ? `\nSPECIFIC CUSTOM INSTRUCTIONS:\n${active.customInstructions}`
    : '';

  let learnedMemoriesSection = '';
  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem('assistant_learned_insights');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const formatted = parsed.slice(0, 10).map((p: any) => `• [${p.topic}]: ${p.insight}`).join('\n');
          learnedMemoriesSection = `\nCONTINUOUS LEARNED MEMORIES & USER PREFERENCES:\n${formatted}\n`;
        }
      }
    } catch {}
  }

  const verbosityRule = active.responseVerbosity === 'ultra_concise'
    ? 'VERBOSITY: Keep responses ultra-concise (1-3 sentences maximum).'
    : active.responseVerbosity === 'comprehensive'
      ? 'VERBOSITY: Provide comprehensive, in-depth architectural coverage with detailed analysis.'
      : 'VERBOSITY: Provide balanced, articulate executive responses.';

  return `${active.systemPrompt}

${userContextSection}
${instructionsSection}
${learnedMemoriesSection}
${verbosityRule}
TONE: ${active.tone.replace(/_/g, ' ')}
MODEL TEMPERATURE: ${active.temperature}`;
}
