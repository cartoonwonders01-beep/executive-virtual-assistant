import { telemetry } from './telemetryLogger';
import { nativeTts } from './nativeTts';

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: SpeechRecognition, ev: any) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: any) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: {
      new(): SpeechRecognition;
    };
    webkitSpeechRecognition?: {
      new(): SpeechRecognition;
    };
  }
}

class NativeSpeechService {
  private recognition: SpeechRecognition | null = null;
  private onTranscriptCallback: ((text: string, isFinal: boolean) => void) | null = null;
  private onSilenceCallback: (() => void) | null = null;
  private silenceTimer: any = null;
  private maxIdleTimer: any = null;
  private silenceDelayMs = 2000;
  private maxIdleTimeoutSec = 15;

  constructor() {
    this.loadConfig();
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        telemetry.log('speech_start');
        this.resetMaxIdleTimer();
      };

      this.recognition.onend = () => {
        this.clearTimers();
        telemetry.log('speech_end');
      };

      this.recognition.onerror = (e) => {
        this.clearTimers();
        telemetry.log('error', e.error);
      };

      this.recognition.onresult = (event: any) => {
        this.resetMaxIdleTimer();
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const candidate = finalTranscript || interimTranscript;
        if (candidate && nativeTts.isAcousticEcho(candidate)) {
          telemetry.log('event', { action: 'acoustic_echo_discarded', text: candidate });
          return;
        }

        if (finalTranscript) {
          telemetry.log('interim_token', { type: 'final', text: finalTranscript });
          if (this.onTranscriptCallback) this.onTranscriptCallback(finalTranscript, true);
          this.resetSilenceTimer();
        } else if (interimTranscript) {
          telemetry.log('interim_token', { type: 'interim', text: interimTranscript });
          if (this.onTranscriptCallback) this.onTranscriptCallback(interimTranscript, false);
          this.resetSilenceTimer();
        }
      };
    }
  }

  public loadConfig() {
    try {
      const storedDelay = localStorage.getItem('eve_v2_silence_delay_ms');
      if (storedDelay) this.silenceDelayMs = parseInt(storedDelay, 10) || 2000;

      const storedMaxIdle = localStorage.getItem('eve_v2_max_idle_sec');
      if (storedMaxIdle) this.maxIdleTimeoutSec = parseInt(storedMaxIdle, 10) || 15;
    } catch {}
  }

  private resetSilenceTimer() {
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    if (this.onSilenceCallback) {
      this.silenceTimer = setTimeout(() => {
        telemetry.log('event', { action: 'silence_endpoint_triggered', delayMs: this.silenceDelayMs });
        if (this.onSilenceCallback) this.onSilenceCallback();
      }, this.silenceDelayMs);
    }
  }

  private resetMaxIdleTimer() {
    if (this.maxIdleTimer) clearTimeout(this.maxIdleTimer);
    this.maxIdleTimer = setTimeout(() => {
      telemetry.log('event', { action: 'max_idle_timeout_shutoff', maxIdleSec: this.maxIdleTimeoutSec });
      this.stop();
      if (this.onSilenceCallback) this.onSilenceCallback();
    }, this.maxIdleTimeoutSec * 1000);
  }

  private clearTimers() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.maxIdleTimer) {
      clearTimeout(this.maxIdleTimer);
      this.maxIdleTimer = null;
    }
  }

  start(
    onTranscript: (text: string, isFinal: boolean) => void,
    onSilence?: () => void
  ) {
    this.loadConfig();
    this.onTranscriptCallback = onTranscript;
    this.onSilenceCallback = onSilence || null;
    this.clearTimers();

    if (this.recognition) {
      try {
        this.recognition.start();
        this.resetMaxIdleTimer();
      } catch (e) {
        console.warn("Speech recognition already started or error:", e);
      }
    }
  }

  stop() {
    this.clearTimers();
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }
  }
}

export const nativeSpeech = new NativeSpeechService();
