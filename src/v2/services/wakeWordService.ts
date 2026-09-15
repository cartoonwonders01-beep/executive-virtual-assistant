import { telemetry } from './telemetryLogger';

export type WakeWordCallback = (trailingQuery?: string) => void;

class WakeWordService {
  private recognition: any = null;
  private isListening: boolean = false;
  private onWakeCallback: WakeWordCallback | null = null;
  private enabled: boolean = false;
  private triggerTimestamps: number[] = [];
  private readonly MAX_TRIGGERS_PER_MINUTE = 5;
  private readonly RATE_LIMIT_WINDOW_MS = 60000;

  constructor() {
    if (typeof window !== 'undefined') {
      this.enabled = localStorage.getItem('eve_v2_wake_word_enabled') === 'true';
    }
  }

  public checkRateLimit(): boolean {
    const now = Date.now();
    this.triggerTimestamps = this.triggerTimestamps.filter(t => now - t < this.RATE_LIMIT_WINDOW_MS);
    if (this.triggerTimestamps.length >= this.MAX_TRIGGERS_PER_MINUTE) {
      return false;
    }
    this.triggerTimestamps.push(now);
    return true;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    localStorage.setItem('eve_v2_wake_word_enabled', val ? 'true' : 'false');
    if (!val) {
      this.stop();
    } else {
      this.start();
    }
  }

  public onWake(callback: WakeWordCallback) {
    this.onWakeCallback = callback;
  }

  public start() {
    if (!this.enabled || this.isListening || typeof window === 'undefined') return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        telemetry.log('event', { action: 'wake_word_started' });
      };

      this.recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript.toLowerCase();
          const match = transcript.match(/\b(?:hey\s+eve|hi\s+eve|ok\s+eve|okay\s+eve)\b(.*)/i);
          if (match) {
            const trailing = match[1]?.trim();
            if (!this.checkRateLimit()) {
              telemetry.log('error', { source: 'WakeWord', message: 'Rate limit exceeded: max 5 triggers/minute' });
              return;
            }
            telemetry.log('event', { action: 'wake_word_triggered', transcript, trailing });
            this.stop();
            if (this.onWakeCallback) {
              this.onWakeCallback(trailing);
            }
            break;
          }
        }
      };

      this.recognition.onerror = (err: any) => {
        if (err.error !== 'no-speech') {
          telemetry.log('error', { source: 'WakeWord', error: err.error });
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        // Auto-restart passive loop if still enabled
        if (this.enabled) {
          setTimeout(() => this.start(), 800);
        }
      };

      this.recognition.start();
    } catch (e) {
      telemetry.log('error', { source: 'WakeWordStart', message: String(e) });
    }
  }

  public stop() {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {}
      this.recognition = null;
    }
    this.isListening = false;
  }
}

export const wakeWordService = new WakeWordService();
