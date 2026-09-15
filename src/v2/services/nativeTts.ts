import { telemetry } from './telemetryLogger';

export function cleanTextForSpeech(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [text](url) -> text
    .replace(/https?:\/\/\S+/g, '') // strip raw URLs
    .replace(/```[\s\S]*?```/g, 'Code block omitted.') // code blocks
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/[*#_~>•]/g, '') // strip markdown asterisks, hashes, bullets
    .replace(/[-–—]\s+/g, ', ') // dashes to soft pauses
    .replace(/\b(\d+)\s*°\s*C\b/gi, '$1 degrees Celsius')
    .replace(/\b(\d+)\s*°\s*F\b/gi, '$1 degrees Fahrenheit')
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, '') // strip emojis & variation selectors
    .replace(/\s+([.,!?;:])/g, '$1') // normalize spacing before punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

export function detectLanguage(text: string): 'fr' | 'nl' | 'de' | 'en' {
  const lower = text.toLowerCase();
  const frCount = (lower.match(/\b(le|la|les|du|des|un|une|est|sont|fait|merci|bonjour|bonsoir|oui|non|pourquoi|comment|temps|demain|aujourd'hui|avec|nous|vous|cette)\b/g) || []).length;
  const nlCount = (lower.match(/\b(de|het|een|van|ik|je|hij|we|is|zijn|weer|goed|morgen|vandaag|hoe|wat|waar|alstublieft|niet|veel|naar)\b/g) || []).length;
  const deCount = (lower.match(/\b(der|die|das|und|ist|nicht|wetter|heute|morgen|danke|bitte|wir|sie)\b/g) || []).length;

  if (frCount >= 2 && frCount >= nlCount && frCount >= deCount) return 'fr';
  if (nlCount >= 2 && nlCount >= frCount && nlCount >= deCount) return 'nl';
  if (deCount >= 2 && deCount >= frCount && deCount >= nlCount) return 'de';
  return 'en';
}

export interface VoiceOption {
  id: string;
  name: string;
  lang: string;
  isHighQuality: boolean;
}

class NativeTtsService {
  private synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private activeAudio: HTMLAudioElement | null = null;
  private speechRate: number = 1.02;
  private speechPitch: number = 1.0;
  private preferredVoiceName: string = '';
  private isSpeakingState: boolean = false;
  private recentSpokenUtterances: { text: string; ts: number }[] = [];
  private lastSpokenEndedTs: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.preferredVoiceName = localStorage.getItem('eve_v2_voice_name') || '';
      const savedRate = localStorage.getItem('eve_v2_voice_rate');
      if (savedRate) this.speechRate = parseFloat(savedRate);
      const savedPitch = localStorage.getItem('eve_v2_voice_pitch');
      if (savedPitch) this.speechPitch = parseFloat(savedPitch);

      this.initVoice();
      if (this.synth && this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.initVoice();
      }
    }
  }

  public isCurrentlySpeaking(): boolean {
    return this.isSpeakingState;
  }

  public isAcousticEcho(transcript: string): boolean {
    if (!transcript.trim()) return false;
    const clean = transcript.toLowerCase().trim();
    const now = Date.now();

    const recentlySpoken = this.isSpeakingState || (now - this.lastSpokenEndedTs < 1800);
    if (!recentlySpoken) return false;

    for (const record of this.recentSpokenUtterances) {
      if (now - record.ts < 12000) {
        if (record.text.includes(clean) || clean.includes(record.text)) return true;
        const words = clean.split(/\s+/).filter(w => w.length > 2);
        if (words.length > 0) {
          const recWords = new Set(record.text.split(/\s+/));
          const matches = words.filter(w => recWords.has(w)).length;
          if (matches / words.length >= 0.5) return true;
        }
      }
    }
    return false;
  }

  private recordSpokenText(text: string) {
    const clean = text.toLowerCase().replace(/[*#_`~>•]/g, '').trim();
    if (!clean) return;
    this.recentSpokenUtterances.unshift({ text: clean, ts: Date.now() });
    if (this.recentSpokenUtterances.length > 6) {
      this.recentSpokenUtterances.pop();
    }
  }

  public getAvailableVoices(): VoiceOption[] {
    if (!this.synth) return [];
    const voices = this.synth.getVoices();
    const ranked = this.rankVoices(voices);
    return ranked.map(v => {
      const lower = v.name.toLowerCase();
      const isHighQuality = lower.includes('premium') || lower.includes('enhanced') || lower.includes('natural') || lower.includes('online');
      return {
        id: v.name,
        name: v.name,
        lang: v.lang,
        isHighQuality
      };
    });
  }

  private rankVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
    const scoreVoice = (v: SpeechSynthesisVoice) => {
      const n = v.name.toLowerCase();
      let s = v.lang.startsWith('en') ? 15 : 0;
      if (n.includes('premium')) s += 100;
      if (n.includes('enhanced')) s += 80;
      if (n.includes('natural') || n.includes('online')) s += 75;
      if (n.includes('google')) s += 60;
      if (n.includes('siri')) s += 50;
      if (n.includes('compact')) s -= 60;
      if (n === 'alex' || (n === 'samantha' && !n.includes('enhanced'))) s -= 40;
      return s;
    };
    return [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a));
  }

  private initVoice() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    if (voices.length === 0) return;

    if (this.preferredVoiceName) {
      const matched = voices.find(v => v.name === this.preferredVoiceName);
      if (matched) {
        this.selectedVoice = matched;
        return;
      }
    }

    const ranked = this.rankVoices(voices);
    this.selectedVoice = ranked[0] || voices[0];
  }

  private resolveVoiceForLanguage(lang: 'fr' | 'nl' | 'de' | 'en'): SpeechSynthesisVoice | null {
    if (!this.synth || lang === 'en') return this.selectedVoice;
    const voices = this.synth.getVoices();
    const match = voices.find(v => v.lang.startsWith(lang) && (v.name.includes('Natural') || v.name.includes('Premium') || v.name.includes('Enhanced')));
    return match || voices.find(v => v.lang.startsWith(lang)) || this.selectedVoice;
  }

  public setVoice(voiceName: string) {
    this.preferredVoiceName = voiceName;
    try { localStorage.setItem('eve_v2_voice_name', voiceName); } catch {}
    this.initVoice();
  }

  public setRate(rate: number) {
    this.speechRate = rate;
    try { localStorage.setItem('eve_v2_voice_rate', rate.toString()); } catch {}
  }

  public setPitch(pitch: number) {
    this.speechPitch = pitch;
    try { localStorage.setItem('eve_v2_voice_pitch', pitch.toString()); } catch {}
  }

  public getVoiceSettings() {
    return {
      selectedVoiceName: this.selectedVoice?.name || '',
      rate: this.speechRate,
      pitch: this.speechPitch
    };
  }

  async speak(rawText: string, onFinish?: () => void) {
    const text = cleanTextForSpeech(rawText);
    if (!text) {
      if (onFinish) onFinish();
      return;
    }

    this.stop();
    this.recordSpokenText(text);

    const hasStorage = typeof window !== 'undefined' && typeof localStorage !== 'undefined';
    const openAiKey = hasStorage ? (localStorage.getItem('assistant_openai_api_key') || '') : '';
    const openAiVoice = hasStorage ? (localStorage.getItem('eve_v2_openai_voice') || 'nova') : 'nova';

    if (openAiKey && !openAiKey.includes('placeholder')) {
      try {
        this.isSpeakingState = true;
        telemetry.log('tts_start', { provider: 'openai_tts', voice: openAiVoice, length: text.length });
        const res = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'tts-1',
            voice: openAiVoice,
            input: text,
            speed: this.speechRate
          })
        });

        if (res.ok) {
          const blob = await res.blob();
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          this.activeAudio = audio;

          audio.onended = () => {
            this.isSpeakingState = false;
            this.lastSpokenEndedTs = Date.now();
            this.activeAudio = null;
            URL.revokeObjectURL(audioUrl);
            telemetry.log('tts_end', { provider: 'openai_tts' });
            if (onFinish) onFinish();
          };
          audio.onerror = () => {
            this.isSpeakingState = false;
            this.lastSpokenEndedTs = Date.now();
            this.activeAudio = null;
            URL.revokeObjectURL(audioUrl);
            this.fallbackBrowserSpeak(text, onFinish);
          };

          await audio.play();
          return;
        }
      } catch (e) {
        telemetry.log('error', { source: 'OpenAITTS', message: String(e) });
      }
    }

    this.fallbackBrowserSpeak(text, onFinish);
  }

  private fallbackBrowserSpeak(text: string, onFinish?: () => void) {
    if (!this.synth) {
      if (onFinish) onFinish();
      return;
    }

    const detectedLang = detectLanguage(text);
    const targetVoice = this.resolveVoiceForLanguage(detectedLang) || this.selectedVoice;

    const utterance = new SpeechSynthesisUtterance(text);
    if (targetVoice) {
      utterance.voice = targetVoice;
      utterance.lang = targetVoice.lang;
    }
    utterance.rate = this.speechRate;
    utterance.pitch = this.speechPitch;

    this.isSpeakingState = true;
    utterance.onstart = () => telemetry.log('tts_start', { provider: 'browser', voice: targetVoice?.name, lang: detectedLang });
    utterance.onend = () => {
      this.isSpeakingState = false;
      this.lastSpokenEndedTs = Date.now();
      telemetry.log('tts_end', { provider: 'browser' });
      if (onFinish) onFinish();
    };
    utterance.onerror = (e) => {
      this.isSpeakingState = false;
      this.lastSpokenEndedTs = Date.now();
      telemetry.log('error', { source: 'TTS', error: e.error });
      if (onFinish) onFinish();
    };

    try {
      this.synth.resume();
    } catch {}
    this.synth.speak(utterance);
  }

  stop() {
    this.isSpeakingState = false;
    this.lastSpokenEndedTs = Date.now();
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio.currentTime = 0;
      this.activeAudio = null;
    }
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

export const nativeTts = new NativeTtsService();
