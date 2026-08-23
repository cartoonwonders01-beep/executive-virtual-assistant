export interface WakeWordListenerConfig {
  onWakeWord?: (detectedTrigger: string, trailingSpeech?: string) => void;
  onWakeWordDetected?: (detectedTrigger: string, trailingSpeech?: string) => void;
  onSpeechDetected?: (text: string) => void;
  onError?: (err: string) => void;
}

export class WakeWordService {
  private isListening = false;
  private recognition: any = null;
  private config: WakeWordListenerConfig | null = null;
  private primaryWakeWord = 'hey eve';
  private wakeTriggers = [
    'hey eve',
    'hello eve',
    'ok eve',
    'eve',
    'hey eva',
    'hello eva',
    'hey andy',
    'hello andy',
    'hey assistant',
    'hello assistant',
    'ok assistant'
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

  public setCustomWakeWords(words: string[]): void {
    this.wakeTriggers = words.map(w => w.toLowerCase().trim());
  }

  public getWakeWords(): string[] {
    return [...this.wakeTriggers];
  }

  public startPassiveListening(config: WakeWordListenerConfig): boolean {
    if (typeof window === 'undefined') return false;
    this.config = config;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not available in this browser environment.');
      return false;
    }

    try {
      if (this.recognition) {
        try { this.recognition.stop(); } catch {}
      }

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }

        const lower = transcript.toLowerCase().trim();
        if (this.config?.onSpeechDetected) {
          this.config.onSpeechDetected(lower);
        }

        // Check if any wake trigger is contained in transcript
        for (const trigger of this.wakeTriggers) {
          if (lower.includes(trigger)) {
            // Extract trailing command after the trigger
            const triggerIdx = lower.indexOf(trigger);
            const afterTrigger = lower.substring(triggerIdx + trigger.length).replace(/^[,.\s]+/, '').trim();
            
            // Play Google-style double-tone wake chime
            this.playGoogleAssistantChime();
            
            if (this.config?.onWakeWord) {
              this.config.onWakeWord(trigger, afterTrigger);
            }
            if (this.config?.onWakeWordDetected) {
              this.config.onWakeWordDetected(trigger, afterTrigger);
            }
            break;
          }
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.log('Passive wake word recognition notice:', event.error);
        }
      };

      this.recognition.onend = () => {
        // Auto-restart passive listening if still enabled
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch {}
        }
      };

      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (err: any) {
      console.error('Failed to start passive wake-word listener:', err);
      this.config?.onError?.(err?.message || 'Wake-word listener error');
      return false;
    }
  }

  public stopPassiveListening(): void {
    this.isListening = false;
    if (this.recognition) {
      try { this.recognition.stop(); } catch {}
      this.recognition = null;
    }
  }

  public isPassiveListeningActive(): boolean {
    return this.isListening;
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
