import { logger } from './loggerService';
import { stopSpeaking } from './speechSynthesis';

export interface WakeWordListenerConfig {
  onWakeWord?: (detectedTrigger: string, trailingSpeech?: string) => void;
  onWakeWordDetected?: (detectedTrigger: string, trailingSpeech?: string) => void;
  onSpeechDetected?: (text: string) => void;
  onError?: (err: string) => void;
}

export class WakeWordService {
  private isListening = false;
  private isPaused = false;
  private recognition: any = null;
  private config: WakeWordListenerConfig | null = null;
  private primaryWakeWord = 'hey eve';
  private sensitivity: 'high' | 'normal' = 'high';
  private restartTimeout: any = null;

  // Expanded phonetic wake triggers
  private wakeTriggers = [
    'hey eve',
    'hello eve',
    'ok eve',
    'okay eve',
    'eve',
    'hey eva',
    'hello eva',
    'hey eave',
    'hey if',
    'hey heave',
    'hey dave',
    'hey eevee',
    'hey ava',
    'hay eve',
    'a eve',
    'hey andy',
    'hello andy',
    'hey assistant',
    'hello assistant',
    'ok assistant'
  ];

  // Regex patterns for phonetic fuzzy match
  private phoneticPatterns = [
    /\b(?:hey|hay|hi|hello|ok|okay|a|pay)\s+(?:eve|eva|eave|eevee|eeve|ava|iva|if|heave|leave|dave)\b/i,
    /\b(?:eve|eva|eevee)\b/i,
    /\b(?:hey\s+assistant|hello\s+assistant|ok\s+assistant)\b/i
  ];

  public getPrimaryWakeWord(): string {
    return this.primaryWakeWord;
  }

  public setPrimaryWakeWord(word: string): void {
    const clean = word.toLowerCase().trim();
    this.primaryWakeWord = clean;
    if (!this.wakeTriggers.includes(clean)) {
      this.wakeTriggers.unshift(clean);
    }
  }

  public setSensitivity(level: 'high' | 'normal'): void {
    this.sensitivity = level;
    logger.log('info', 'wake_word', `Wake-word sensitivity set to: ${level.toUpperCase()}`);
  }

  public getSensitivity(): 'high' | 'normal' {
    return this.sensitivity;
  }

  public setCustomWakeWords(words: string[]): void {
    this.wakeTriggers = words.map(w => w.toLowerCase().trim());
  }

  public getWakeWords(): string[] {
    return [...this.wakeTriggers];
  }

  public pause(): void {
    this.isPaused = true;
    if (this.recognition) {
      try { this.recognition.stop(); } catch {}
    }
  }

  public resume(): void {
    this.isPaused = false;
    if (this.isListening && !this.recognition) {
      if (this.config) {
        this.startPassiveListening(this.config);
      }
    } else if (this.recognition) {
      try {
        this.recognition.start();
      } catch {}
    }
  }

  public startPassiveListening(config: WakeWordListenerConfig): boolean {
    if (typeof window === 'undefined') return false;
    this.config = config;
    this.isPaused = false;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      logger.log('warn', 'wake_word', 'SpeechRecognition API not available in this browser environment.');
      return false;
    }

    try {
      if (this.recognition) {
        try { this.recognition.stop(); } catch {}
        this.recognition = null;
      }

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      logger.log('info', 'wake_word', `Passive wake-word listener activated. Listening for "${this.primaryWakeWord}" & direct voice input...`);

      this.recognition.onresult = (event: any) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          fullTranscript += ' ' + event.results[i][0].transcript;
        }

        const lower = fullTranscript.toLowerCase().trim();
        if (lower) {
          stopSpeaking(); // Immediate barge-in on user speech
          logger.log('info', 'speech_stt', `Passive Audio Stream: "${lower}"`);
        }

        if (this.config?.onSpeechDetected) {
          this.config.onSpeechDetected(lower);
        }

        // 1. Direct Trigger Matching
        let matchedTrigger: string | null = null;
        let command = '';

        for (const trigger of this.wakeTriggers) {
          if (lower.includes(trigger)) {
            matchedTrigger = trigger;
            const triggerIdx = lower.indexOf(trigger);
            command = lower.substring(triggerIdx + trigger.length).replace(/^[,.\s]+/, '').trim();
            break;
          }
        }

        // 2. Phonetic Regex Matching if in High Sensitivity Mode
        if (!matchedTrigger && this.sensitivity === 'high') {
          for (const pattern of this.phoneticPatterns) {
            const match = lower.match(pattern);
            if (match) {
              matchedTrigger = match[0];
              const matchIdx = lower.indexOf(matchedTrigger);
              command = lower.substring(matchIdx + matchedTrigger.length).replace(/^[,.\s]+/, '').trim();
              break;
            }
          }
        }

        // 3. Conversational Speech & Direct Commands (e.g. questions, greetings, jokes, queries)
        if (!matchedTrigger && lower.split(' ').length >= 2) {
          const directIntentRegex = /\b(?:tell|what|how|why|who|when|where|can\s+you|could\s+you|please|hi|hey|hello|good\s+morning|good\s+evening|remember|draft|send|book|schedule|task|joke|help|it'?s|this\s+is|explain|suggest|was|wie|warum|wer|hallo|dime|raconte)\b/i;
          if (directIntentRegex.test(lower) || lower.split(' ').length >= 3) {
            matchedTrigger = 'Direct Voice Command';
            command = lower;
          }
        }

        if (matchedTrigger) {
          logger.log('success', 'wake_word', `🎯 Voice Command/Trigger DETECTED: "${matchedTrigger}"`, { command: command || 'none' });

          // Play Google-style double-tone wake chime
          this.playGoogleAssistantChime();

          // Temporarily pause passive recognition so dialogue execution takes place
          this.pause();

          if (this.config?.onWakeWord) {
            this.config.onWakeWord(matchedTrigger, command);
          }
          if (this.config?.onWakeWordDetected) {
            this.config.onWakeWordDetected(matchedTrigger, command);
          }
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          logger.log('warn', 'wake_word', `Passive recognition notice: ${event.error}`);
        }
      };

      this.recognition.onend = () => {
        if (this.isListening && !this.isPaused) {
          if (this.restartTimeout) clearTimeout(this.restartTimeout);
          this.restartTimeout = setTimeout(() => {
            if (this.isListening && !this.isPaused) {
              try {
                this.recognition?.start();
              } catch {}
            }
          }, 150);
        }
      };

      this.recognition.start();
      this.isListening = true;
      this.isPaused = false;
      return true;
    } catch (err: any) {
      logger.log('error', 'wake_word', `Failed to start passive wake-word listener: ${err?.message}`);
      this.config?.onError?.(err?.message || 'Wake-word listener error');
      return false;
    }
  }

  public stopPassiveListening(): void {
    this.isListening = false;
    this.isPaused = false;
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    if (this.recognition) {
      try { this.recognition.stop(); } catch {}
      this.recognition = null;
    }
  }

  public isPassiveListeningActive(): boolean {
    return this.isListening && !this.isPaused;
  }

  /**
   * Synthesizes double-tone activation chime
   * (High note -> Higher note: 880Hz to 1320Hz)
   */
  public playActivationChime(): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      // First tone (880Hz / A5)
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      // Second tone (1320Hz / E6)
      osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.09);
      osc2.start(ctx.currentTime + 0.09);
      osc2.stop(ctx.currentTime + 0.28);
    } catch (e) {
      console.log('Audio chime error:', e);
    }
  }

  public playGoogleAssistantChime(): void {
    this.playActivationChime();
  }

  public testRecognize(transcript: string): { detected: boolean; wakeWord?: string; command?: string } {
    const lower = transcript.toLowerCase().trim();
    for (const trigger of this.wakeTriggers) {
      if (lower.includes(trigger)) {
        const triggerIdx = lower.indexOf(trigger);
        const command = lower.substring(triggerIdx + trigger.length).replace(/^[,.\s]+/, '').trim();
        return {
          detected: true,
          wakeWord: trigger,
          command
        };
      }
    }
    return { detected: false };
  }
}

export const wakeWordService = new WakeWordService();
