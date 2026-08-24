import { logger } from './loggerService';

export type VoicePersona = 
  | 'google_journey_female' // en-US-Journey-F (Studio Conversational Human Female - Podcast Quality)
  | 'google_journey_british' // en-GB-Journey-F (Studio Executive British Female)
  | 'google_journey_male'    // en-US-Journey-D (Studio Conversational Male)
  | 'studio_american_female' // Aria, Jenny, Ava Premium, Samantha Enhanced
  | 'executive_british_male' // Daniel Enhanced, Ryan Natural, Oliver, George
  | 'crisp_american_male'    // Guy Natural, Christopher, Tom Enhanced, Alex
  | 'warm_australian'        // Natasha, Karen, Russell
  | 'german_natural'         // Katja, Marlene, Conrad, Google Deutsch
  | 'french_natural'         // Denise, Henri, Amelie, Google Français
  | 'spanish_natural'        // Elvira, Alvaro, Monica, Google Español
  | 'italian_natural'        // Elsa, Diego, Alice, Google Italiano
  | 'dutch_natural'          // Colette, Maarten, Fenna, Google Nederlands
  | 'polish_natural'         // Zofia, Jan, Maja, Google Polski
  | 'portuguese_natural'     // Raquel, Duarte, Francisca, Google Português
  | 'auto';

export type SupportedLanguage = 'en' | 'de' | 'fr' | 'es' | 'it' | 'nl' | 'pl' | 'pt' | 'ru';

let cachedVoices: SpeechSynthesisVoice[] = [];
let activePersona: VoicePersona = 'google_journey_female';
let activeAudioElement: HTMLAudioElement | null = null;
let speechRate = 1.02;
let speechPitch = 1.0;
let preferredLanguage: SupportedLanguage | 'auto' = 'auto';

// Acoustic Echo Cancellation (AEC) Fingerprint Buffer
interface UtteranceRecord {
  text: string;
  ts: number;
}
const recentAssistantUtterances: UtteranceRecord[] = [];
let lastSpeechEndedTs = 0;

export function recordAssistantSpokenText(text: string): void {
  const clean = text.toLowerCase().replace(/[*#_`~>]/g, '').trim();
  if (!clean) return;
  recentAssistantUtterances.unshift({ text: clean, ts: Date.now() });
  if (recentAssistantUtterances.length > 8) {
    recentAssistantUtterances.pop();
  }
}

export function isAcousticEcho(transcript: string): boolean {
  if (!transcript) return false;
  const clean = transcript.toLowerCase().trim();
  if (isCurrentlySpeaking()) return true;

  const now = Date.now();
  for (const record of recentAssistantUtterances) {
    if (now - record.ts < 10000) {
      if (record.text.includes(clean) || clean.includes(record.text)) {
        return true;
      }
      const recordWords = new Set(record.text.split(/\s+/));
      const transWords = clean.split(/\s+/);
      const matched = transWords.filter(w => recordWords.has(w) && w.length > 2).length;
      if (transWords.length > 0 && (matched / transWords.length) >= 0.5) {
        return true;
      }
    }
  }
  return false;
}

// Load saved settings from localStorage
if (typeof window !== 'undefined') {
  const savedPersona = localStorage.getItem('assistant_voice_persona');
  if (savedPersona) activePersona = savedPersona as VoicePersona;

  const savedRate = localStorage.getItem('assistant_voice_rate');
  if (savedRate) speechRate = parseFloat(savedRate);

  const savedPitch = localStorage.getItem('assistant_voice_pitch');
  if (savedPitch) speechPitch = parseFloat(savedPitch);

  const savedLang = localStorage.getItem('assistant_preferred_language');
  if (savedLang) preferredLanguage = savedLang as SupportedLanguage | 'auto';
}

function initVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  cachedVoices = window.speechSynthesis.getVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoices = window.speechSynthesis.getVoices();
    };
  }
}

initVoices();

export function setVoicePersona(persona: VoicePersona): void {
  activePersona = persona;
  if (typeof window !== 'undefined') {
    localStorage.setItem('assistant_voice_persona', persona);
  }
}

export function getVoicePersona(): VoicePersona {
  return activePersona;
}

export function setPreferredLanguage(lang: SupportedLanguage | 'auto'): void {
  preferredLanguage = lang;
  if (typeof window !== 'undefined') {
    localStorage.setItem('assistant_preferred_language', lang);
  }
}

export function getPreferredLanguage(): SupportedLanguage | 'auto' {
  return preferredLanguage;
}

export function setVoiceRate(rate: number): void {
  speechRate = rate;
  if (typeof window !== 'undefined') {
    localStorage.setItem('assistant_voice_rate', rate.toString());
  }
}

export function getVoiceRate(): number {
  return speechRate;
}

export function setVoicePitch(pitch: number): void {
  speechPitch = pitch;
  if (typeof window !== 'undefined') {
    localStorage.setItem('assistant_voice_pitch', pitch.toString());
  }
}

export function getVoicePitch(): number {
  return speechPitch;
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  if (cachedVoices.length === 0) {
    cachedVoices = window.speechSynthesis.getVoices();
  }
  return cachedVoices;
}

/**
 * Intelligent European Language Detector with Multi-Factor Scoring
 */
export function detectLanguage(text: string): SupportedLanguage {
  const lower = text.toLowerCase();
  const scores: Record<SupportedLanguage, number> = {
    en: 0,
    de: 0,
    fr: 0,
    es: 0,
    it: 0,
    nl: 0,
    pl: 0,
    pt: 0,
    ru: 0
  };

  // Unique Characters
  if (/[äöüß]/.test(lower)) scores.de += 6;
  if (/[¿¡ñ]/.test(lower)) scores.es += 6;
  if (/[çœæ]/.test(lower)) scores.fr += 6;
  if (/[ëï]/.test(lower)) scores.nl += 6;
  if (/[ąćęłńóśźż]/.test(lower)) scores.pl += 6;
  if (/[ãõ]/.test(lower)) scores.pt += 6;
  if (/[а-яё]/i.test(lower)) scores.ru += 8;

  // Spanish words
  const esWords = ['cuales', 'cuáles', 'estrategias', 'trabajo', 'profundo', 'productividad', 'rutina', 'buenos', 'días', 'hola', 'gracias', 'tarea', 'correo', 'para', 'como', 'cómo', 'por', 'que', 'qué', 'reunión', 'está', 'hacer', 'mejorar', 'enfoque', 'una', 'crisis', 'optimizar', 'el', 'la', 'los', 'las', 'de', 'en', 'y'];
  for (const w of esWords) {
    if (new RegExp(`\\b${w}\\b`, 'i').test(lower)) scores.es += 3;
  }

  // French elisions & specific patterns (j'ai, c'est, qu'est-ce, etc.)
  if (/\b(?:j'ai|j’ai|c'est|c’est|qu'est-ce|qu’est-ce|d'accord|d’accord|aujourd'hui|aujourd’hui)\b/i.test(lower) ||
      /\b(?:j'|c'|qu'|l'|d'|n'|s'|m'|t')\w+/i.test(lower)) {
    scores.fr += 8;
  }

  // French words
  const frWords = [
    'quelles', 'quels', 'stratégies', 'travail', 'profond', 'productivité', 'bonjour', 'merci', 'tâche', 'courriel', 
    'écris', 'rendez-vous', 'pour', 'dans', 'avec', 'sur', 'vous', 'nous', 'est-ce', 'comment', 'gérer', 'crise', 
    'réclamation', 'client', 'une', 'qui', 'est', 'même', 'impression', 'entends', 'écoute', 'passe', 'marche', 
    'trancher', 'doit', 'fait', 'plus', 'aussi', 'bien', 'très', 'faire', 'tout', 'tous', 'notre', 'votre', 
    'planning', 'famille', 'peux-tu', 'veux-tu', 'dis-moi'
  ];
  for (const w of frWords) {
    if (new RegExp(`\\b${w}\\b`, 'i').test(lower)) scores.fr += 3;
  }

  // German words
  const deWords = ['strategien', 'morgenroutine', 'produktivität', 'guten', 'morgen', 'danke', 'bitte', 'aufgabe', 'kalender', 'arbeit', 'schreibe', 'haben', 'kann', 'nicht', 'oder', 'verbessern', 'fokus', 'wie', 'warum', 'wer', 'sind'];
  for (const w of deWords) {
    if (new RegExp(`\\b${w}\\b`, 'i').test(lower)) scores.de += 3;
  }

  // Italian words
  const itWords = ['strategie', 'lavoro', 'profondo', 'buongiorno', 'grazie', 'ciao', 'compito', 'scrivi', 'appuntamento', 'perché', 'come', 'quando', 'dove', 'quali', 'sono'];
  for (const w of itWords) {
    if (new RegExp(`\\b${w}\\b`, 'i').test(lower)) scores.it += 3;
  }

  // Dutch words
  const nlWords = ['wat', 'zijn', 'strategieën', 'werk', 'goedemorgen', 'bedankt', 'afspraak', 'graag', 'alsjeblieft', 'dankjewel', 'voor', 'niet', 'taak', 'hoe', 'wanneer'];
  for (const w of nlWords) {
    if (new RegExp(`\\b${w}\\b`, 'i').test(lower)) scores.nl += 3;
  }

  // Polish words
  const plWords = ['strategie', 'głęboką', 'pracę', 'praca', 'dzień', 'dobry', 'dziękuję', 'zadanie', 'napisz', 'spotkanie', 'jakie', 'jest', 'się', 'są'];
  for (const w of plWords) {
    if (new RegExp(`\\b${w}\\b`, 'i').test(lower)) scores.pl += 3;
  }

  // Portuguese words
  const ptWords = ['estratégias', 'trabalho', 'profundo', 'obrigado', 'olá', 'bom', 'dia', 'tarefa', 'escreva', 'reunião', 'você', 'quais', 'são'];
  for (const w of ptWords) {
    if (new RegExp(`\\b${w}\\b`, 'i').test(lower)) scores.pt += 3;
  }

  // English words
  const enWords = [
    'what', 'whats', 'why', 'how', 'when', 'where', 'who', 'which', 'going', 'listening', 'working', 
    'respond', 'responding', 'hear', 'hearing', 'can', 'will', 'did', 'there', 'this', 'that', 
    'strategies', 'deep', 'routine', 'email', 'schedule', 'meeting', 'and', 'create', 
    'plan', 'fix', 'problem', 'delays', 'client', 'should', 'think', 'need', 'make', 'decision', 
    'onboarding', 'grow', 'revenue', 'next', 'days', 'tell', 'joke'
  ];
  for (const w of enWords) {
    if (new RegExp(`\\b${w}\\b`, 'i').test(lower)) scores.en += 3;
  }

  let bestLang: SupportedLanguage = 'en';
  let maxScore = 0;
  for (const [l, s] of Object.entries(scores) as [SupportedLanguage, number][]) {
    if (s > maxScore) {
      maxScore = s;
      bestLang = l;
    }
  }

  return maxScore > 0 ? bestLang : 'en';
}

/**
 * Resolves the highest fidelity natural neural voice for the specified language & persona
 */
export function resolveBestVoice(persona: VoicePersona = activePersona, targetLang?: SupportedLanguage): SpeechSynthesisVoice | undefined {
  const voices = getAvailableVoices();
  if (voices.length === 0) return undefined;

  const lang = targetLang || (preferredLanguage !== 'auto' ? preferredLanguage : 'en');

  // 1. German Voices
  if (lang === 'de' || persona === 'german_natural') {
    const deVoices = voices.filter(v => v.lang.startsWith('de'));
    if (deVoices.length > 0) {
      return deVoices.find(v => v.name.includes('Katja') && v.name.includes('Natural'))
        || deVoices.find(v => v.name.includes('Marlene') || v.name.includes('Premium'))
        || deVoices.find(v => v.name.includes('Conrad') || v.name.includes('Natural'))
        || deVoices.find(v => v.name.includes('Google Deutsch'))
        || deVoices.find(v => v.name.includes('Hedda') || v.name.includes('Stefan'))
        || deVoices[0];
    }
  }

  // 2. French Voices
  if (lang === 'fr' || persona === 'french_natural') {
    const frVoices = voices.filter(v => v.lang.startsWith('fr'));
    if (frVoices.length > 0) {
      return frVoices.find(v => v.name.includes('Denise') && v.name.includes('Natural'))
        || frVoices.find(v => v.name.includes('Henri') && v.name.includes('Natural'))
        || frVoices.find(v => v.name.includes('Amelie') || v.name.includes('Premium'))
        || frVoices.find(v => v.name.includes('Thomas') || v.name.includes('Enhanced'))
        || frVoices.find(v => v.name.includes('Google français'))
        || frVoices[0];
    }
  }

  // 3. Spanish Voices
  if (lang === 'es' || persona === 'spanish_natural') {
    const esVoices = voices.filter(v => v.lang.startsWith('es'));
    if (esVoices.length > 0) {
      return esVoices.find(v => v.name.includes('Elvira') && v.name.includes('Natural'))
        || esVoices.find(v => v.name.includes('Alvaro') && v.name.includes('Natural'))
        || esVoices.find(v => v.name.includes('Monica') || v.name.includes('Premium'))
        || esVoices.find(v => v.name.includes('Jorge') || v.name.includes('Enhanced'))
        || esVoices.find(v => v.name.includes('Google español'))
        || esVoices[0];
    }
  }

  // 4. Italian Voices
  if (lang === 'it' || persona === 'italian_natural') {
    const itVoices = voices.filter(v => v.lang.startsWith('it'));
    if (itVoices.length > 0) {
      return itVoices.find(v => v.name.includes('Elsa') && v.name.includes('Natural'))
        || itVoices.find(v => v.name.includes('Diego') && v.name.includes('Natural'))
        || itVoices.find(v => v.name.includes('Alice') || v.name.includes('Premium'))
        || itVoices.find(v => v.name.includes('Federico'))
        || itVoices.find(v => v.name.includes('Google italiano'))
        || itVoices[0];
    }
  }

  // 5. Dutch Voices
  if (lang === 'nl' || persona === 'dutch_natural') {
    const nlVoices = voices.filter(v => v.lang.startsWith('nl'));
    if (nlVoices.length > 0) {
      return nlVoices.find(v => v.name.includes('Colette') && v.name.includes('Natural'))
        || nlVoices.find(v => v.name.includes('Maarten') && v.name.includes('Natural'))
        || nlVoices.find(v => v.name.includes('Fenna'))
        || nlVoices.find(v => v.name.includes('Google Nederlands'))
        || nlVoices[0];
    }
  }

  // 6. Polish Voices
  if (lang === 'pl' || persona === 'polish_natural') {
    const plVoices = voices.filter(v => v.lang.startsWith('pl'));
    if (plVoices.length > 0) {
      return plVoices.find(v => v.name.includes('Zofia') && v.name.includes('Natural'))
        || plVoices.find(v => v.name.includes('Maja'))
        || plVoices.find(v => v.name.includes('Jan'))
        || plVoices.find(v => v.name.includes('Google polski'))
        || plVoices[0];
    }
  }

  // 7. Portuguese Voices
  if (lang === 'pt' || persona === 'portuguese_natural') {
    const ptVoices = voices.filter(v => v.lang.startsWith('pt'));
    if (ptVoices.length > 0) {
      return ptVoices.find(v => v.name.includes('Raquel') && v.name.includes('Natural'))
        || ptVoices.find(v => v.name.includes('Duarte') && v.name.includes('Natural'))
        || ptVoices.find(v => v.name.includes('Francisca'))
        || ptVoices.find(v => v.name.includes('Google português'))
        || ptVoices[0];
    }
  }

  // 8. English Personas
  const enVoices = voices.filter(v => v.lang.startsWith('en'));

  if (persona === 'studio_american_female') {
    return enVoices.find(v => v.name.includes('Aria') && v.name.includes('Natural'))
      || enVoices.find(v => v.name.includes('Jenny') && v.name.includes('Natural'))
      || enVoices.find(v => v.name.includes('Ava') && (v.name.includes('Premium') || v.name.includes('Enhanced')))
      || enVoices.find(v => v.name.includes('Samantha') && v.name.includes('Enhanced'))
      || enVoices.find(v => v.name.includes('Google US English'))
      || enVoices.find(v => v.name.includes('Zira'))
      || enVoices.find(v => v.name.includes('Samantha'))
      || enVoices.find(v => v.lang.includes('US') && !v.name.toLowerCase().includes('male'))
      || enVoices[0];
  }

  if (persona === 'executive_british_male') {
    return enVoices.find(v => v.name.includes('Ryan') && v.name.includes('Natural'))
      || enVoices.find(v => v.name.includes('Daniel') && v.name.includes('Enhanced'))
      || enVoices.find(v => v.name.includes('Oliver') && v.name.includes('Enhanced'))
      || enVoices.find(v => v.name.includes('George') && v.name.includes('Natural'))
      || enVoices.find(v => v.name.includes('Google UK English Male'))
      || enVoices.find(v => v.name.includes('Daniel'))
      || enVoices.find(v => v.lang.includes('GB') || v.lang.includes('en-GB'))
      || enVoices[0];
  }

  if (persona === 'crisp_american_male') {
    return enVoices.find(v => v.name.includes('Guy') && v.name.includes('Natural'))
      || enVoices.find(v => v.name.includes('Christopher') && v.name.includes('Natural'))
      || enVoices.find(v => v.name.includes('Tom') && v.name.includes('Enhanced'))
      || enVoices.find(v => v.name.includes('Alex'))
      || enVoices.find(v => v.lang.includes('US') && v.name.toLowerCase().includes('male'))
      || enVoices[0];
  }

  if (persona === 'warm_australian') {
    return enVoices.find(v => v.name.includes('Natasha') && v.name.includes('Natural'))
      || enVoices.find(v => v.name.includes('Karen') && v.name.includes('Enhanced'))
      || enVoices.find(v => v.name.includes('Russell'))
      || enVoices.find(v => v.lang.includes('AU') || v.lang.includes('en-AU'))
      || enVoices[0];
  }

  // Fallback
  return enVoices.find(v => v.name.includes('Natural') || v.name.includes('Premium') || v.name.includes('Enhanced') || v.name.includes('Google'))
    || voices[0];
}

let isSpeakingState = false;
let activeUtteranceRef: SpeechSynthesisUtterance | null = null;
let watchdogInterval: any = null;

export function isCurrentlySpeaking(): boolean {
  return isSpeakingState;
}

export function speakResponse(text: string, onEnd?: () => void, persona?: VoicePersona, targetLang?: SupportedLanguage): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  // Clear previous watchdog
  if (watchdogInterval) {
    clearInterval(watchdogInterval);
    watchdogInterval = null;
  }

  // Cancel any lingering utterances
  try {
    window.speechSynthesis.cancel();
  } catch {}

  // Strip markdown styling and emojis for clean phonetics
  const cleanText = text
    .replace(/[*#_`~>]/g, '')
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Emojis
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanText) {
    isSpeakingState = false;
    activeUtteranceRef = null;
    if (onEnd) onEnd();
    return;
  }

  recordAssistantSpokenText(cleanText);
  const selectedPersona = persona || activePersona;

  const finish = () => {
    isSpeakingState = false;
    lastSpeechEndedTs = Date.now();
    activeUtteranceRef = null;
    activeAudioElement = null;
    if (watchdogInterval) {
      clearInterval(watchdogInterval);
      watchdogInterval = null;
    }
    if (onEnd) onEnd();
  };

  const fallbackBrowserSynthesis = () => {
    const detectedLang = targetLang || detectLanguage(cleanText);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    activeUtteranceRef = utterance;
    isSpeakingState = true;

    utterance.rate = speechRate;
    utterance.pitch = speechPitch;
    utterance.lang = detectedLang;

    const targetVoice = resolveBestVoice(selectedPersona, detectedLang);
    if (targetVoice) {
      utterance.voice = targetVoice;
    }

    utterance.onend = finish;
    utterance.onerror = finish;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      watchdogInterval = setInterval(() => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        } else {
          if (watchdogInterval) clearInterval(watchdogInterval);
        }
      }, 6000);

      try {
        window.speechSynthesis.resume();
      } catch {}
      window.speechSynthesis.speak(utterance);
    } else {
      finish();
    }
  };

  // Google Journey Neural Studio Synthesis with 350ms fast-fallback race
  if (selectedPersona.startsWith('google_journey') && typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    let journeyVoice = 'en-US-Journey-F';
    if (selectedPersona === 'google_journey_british') journeyVoice = 'en-GB-Journey-F';
    if (selectedPersona === 'google_journey_male') journeyVoice = 'en-US-Journey-D';

    logger.debug('tts_speech', `Requesting Google Cloud Journey TTS`, {
      voiceName: journeyVoice,
      textLength: cleanText.length,
      rate: speechRate
    });

    const ttsAbort = new AbortController();
    const fetchTimeout = setTimeout(() => {
      ttsAbort.abort();
      logger.debug('tts_speech', `Journey TTS 350ms race timeout expired, triggering instant browser neural fallback`);
      fallbackBrowserSynthesis();
    }, 350);

    fetch('/api/tts/journey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanText, voiceName: journeyVoice, speakingRate: speechRate }),
      signal: ttsAbort.signal
    })
      .then(res => res.json())
      .then((data: any) => {
        clearTimeout(fetchTimeout);
        if (data.success && data.audioBase64) {
          logger.debug('tts_speech', `Journey TTS MP3 received successfully (${Math.round(data.audioBase64.length / 1024)} KB)`);
          isSpeakingState = true;
          const audio = new Audio(`data:audio/mp3;base64,${data.audioBase64}`);
          activeAudioElement = audio;
          audio.onended = finish;
          audio.onerror = finish;
          audio.play().catch(() => {
            logger.debug('tts_speech', `Audio element play error, falling back to browser synthesis`);
            fallbackBrowserSynthesis();
          });
          return;
        }
        logger.debug('tts_speech', `Journey TTS returned non-success, using browser fallback`, { data });
        fallbackBrowserSynthesis();
      })
      .catch((err) => {
        clearTimeout(fetchTimeout);
        logger.debug('tts_speech', `Journey TTS fetch caught exception, falling back to browser`, { error: String(err) });
        fallbackBrowserSynthesis();
      });
    return;
  }

  fallbackBrowserSynthesis();
}

export function stopSpeaking(): void {
  isSpeakingState = false;
  activeUtteranceRef = null;
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    } catch {}
    activeAudioElement = null;
  }
  if (watchdogInterval) {
    clearInterval(watchdogInterval);
    watchdogInterval = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}
