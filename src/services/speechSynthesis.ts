// Production Human Voice Synthesis Engine with Natural Voice Resolution

export type VoicePersona = 
  | 'studio_american_female' // Aria, Jenny, Ava Premium, Samantha Enhanced
  | 'executive_british_male' // Daniel Enhanced, Ryan Natural, Oliver, George
  | 'crisp_american_male'    // Guy Natural, Christopher, Tom Enhanced, Alex
  | 'warm_australian'        // Natasha, Karen, Russell
  | 'auto';

let cachedVoices: SpeechSynthesisVoice[] = [];
let activePersona: VoicePersona = 'studio_american_female';
let speechRate = 0.98; // Slightly more relaxed for natural cadence
let speechPitch = 1.0;

// Load saved settings from localStorage
if (typeof window !== 'undefined') {
  const savedPersona = localStorage.getItem('assistant_voice_persona');
  if (savedPersona) activePersona = savedPersona as VoicePersona;

  const savedRate = localStorage.getItem('assistant_voice_rate');
  if (savedRate) speechRate = parseFloat(savedRate);

  const savedPitch = localStorage.getItem('assistant_voice_pitch');
  if (savedPitch) speechPitch = parseFloat(savedPitch);
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

export function resolveBestVoice(persona: VoicePersona = activePersona): SpeechSynthesisVoice | undefined {
  const voices = getAvailableVoices();
  if (voices.length === 0) return undefined;

  const enVoices = voices.filter(v => v.lang.startsWith('en'));

  // Studio American Female: Prioritize Microsoft Natural, Apple Premium/Enhanced, Google Neural
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

  // Executive British Male: Prioritize Ryan Natural, Daniel Enhanced, Oliver, George
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

  // Crisp American Male: Prioritize Guy Natural, Christopher, Tom Enhanced, Alex
  if (persona === 'crisp_american_male') {
    return enVoices.find(v => v.name.includes('Guy') && v.name.includes('Natural'))
      || enVoices.find(v => v.name.includes('Christopher') && v.name.includes('Natural'))
      || enVoices.find(v => v.name.includes('Tom') && v.name.includes('Enhanced'))
      || enVoices.find(v => v.name.includes('Alex'))
      || enVoices.find(v => v.lang.includes('US') && v.name.toLowerCase().includes('male'))
      || enVoices[0];
  }

  // Warm Australian: Natasha, Karen, Russell
  if (persona === 'warm_australian') {
    return enVoices.find(v => v.name.includes('Natasha') && v.name.includes('Natural'))
      || enVoices.find(v => v.name.includes('Karen') && v.name.includes('Enhanced'))
      || enVoices.find(v => v.name.includes('Russell'))
      || enVoices.find(v => v.lang.includes('AU') || v.lang.includes('en-AU'))
      || enVoices[0];
  }

  // Auto
  return enVoices.find(v => v.name.includes('Natural') || v.name.includes('Premium') || v.name.includes('Enhanced') || v.name.includes('Google'))
    || enVoices[0];
}

export function speakResponse(text: string, onEnd?: () => void, persona?: VoicePersona): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  window.speechSynthesis.cancel();

  // Strip markdown styling and emojis for clean phonetics
  const cleanText = text
    .replace(/[*#_`~>]/g, '')
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Emojis
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanText) {
    if (onEnd) onEnd();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = speechRate;
  utterance.pitch = speechPitch;

  const targetVoice = resolveBestVoice(persona || activePersona);
  if (targetVoice) {
    utterance.voice = targetVoice;
  }

  let ended = false;
  const finish = () => {
    if (!ended) {
      ended = true;
      if (onEnd) onEnd();
    }
  };

  utterance.onend = finish;
  utterance.onerror = finish;

  // Fallback safety timeout in case browser TTS hangs
  const approxDurationMs = (cleanText.split(' ').length / (speechRate * 2.5)) * 1000 + 2000;
  setTimeout(() => finish(), Math.max(4000, approxDurationMs));

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
