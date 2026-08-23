// Configuration & Tuning Engine for Eve Virtual Assistant
// Ported from Relay PWA configuration architecture

export const APP_VERSION = '3.2.0';

export const DEFAULT_CHUNK_INTERVAL_MS = 3500;
export const MIN_CHUNK_INTERVAL_MS = 1500;
export const MAX_CHUNK_INTERVAL_MS = 15000;

export const DEFAULT_AUDIO_BITRATE_KBPS = 64;
export const DEFAULT_MIME_TYPE = 'auto';

export const DEFAULT_SILENCE_DURATION_MS = 1600;
export const DEFAULT_SILENCE_THRESHOLD = 0.06;
export const DEFAULT_SPEECH_TRIGGER_THRESHOLD = 0.12;

export const DEFAULT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbxIIkn9yUHjzo7xJCmgcVCjT-6fQfuXw82TzdDdlSZQUD7nmPcwy3qqNnq9AC5-l3NV/exec';
export const DEFAULT_PAYLOAD_FORMAT = 'json';

export const CHUNK_INTERVAL_OPTIONS = [
  { value: 2500, label: '⚡ 2.5 Seconds (Ultra-Fast Assistant Slices)' },
  { value: 3500, label: '⏱️ 3.5 Seconds (Default — Recommended)' },
  { value: 5000, label: '⏱️ 5.0 Seconds (Balanced)' },
  { value: 7000, label: '⏱️ 7.0 Seconds (Relay Meeting Standard)' },
  { value: 10000, label: '⏱️ 10.0 Seconds (Extended Recording)' },
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
  { value: 1000, label: '⚡ 1.0s (Snappy — Rapid Turnaround)' },
  { value: 1600, label: '⏱️ 1.6s (Default — Recommended)' },
  { value: 2200, label: '⏱️ 2.2s (Patient — Thoughtful Pauses)' },
  { value: 3000, label: '⏱️ 3.0s (Relaxed — Long Sentences)' },
];

export const LIVE_MODEL_OPTIONS = [
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Ultra-Fast Reasoning — Default)' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Next-Gen)' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Executive Depth & Coding)' },
  { value: 'groq-llama-3.3-70b', label: 'Groq LLaMA 3.3 70B (High-Speed)' },
  { value: 'local-heuristic', label: 'Local In-Memory Engine (Sub-50ms Offline)' },
];

export const PAYLOAD_FORMAT_OPTIONS = [
  { value: 'json', label: 'JSON + Base64 (Google Apps Script / BigQuery)' },
  { value: 'multipart', label: 'Multipart Form-Data (n8n / Cloud Edge)' },
];

// Storage Keys
const CHUNK_INTERVAL_KEY = 'assistant_chunk_interval_ms';
const AUDIO_BITRATE_KEY = 'assistant_audio_bitrate_kbps';
const MIME_TYPE_KEY = 'assistant_mime_type';
const SILENCE_DURATION_KEY = 'assistant_silence_duration_ms';
const SILENCE_THRESHOLD_KEY = 'assistant_silence_threshold';
const PURGE_AUDIO_KEY = 'assistant_purge_audio';
const DEBUG_MODE_KEY = 'assistant_debug_mode';
const LIVE_MODEL_KEY = 'assistant_live_model';
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
  return Number.isFinite(stored) && stored >= 500 && stored <= 6000 ? stored : DEFAULT_SILENCE_DURATION_MS;
}

export function storeSilenceDurationMs(ms: number): void {
  try {
    localStorage.setItem(SILENCE_DURATION_KEY, String(ms));
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
