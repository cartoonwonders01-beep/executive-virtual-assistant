import { telemetry } from './telemetryLogger';
import { nativeTts } from './nativeTts';
import { streamingAudioPipeline } from './streamingAudioPipeline';

export interface VadConfig {
  energyThreshold: number; // RMS threshold for human speech (default 0.025)
  silenceDelayMs: number; // Sub-350ms silence detection for fast turn-taking (default 350)
  bargeInEnabled: boolean; // Immediately cut off assistant speech when user speaks (default true)
}

export type VadEventCallback = () => void;
export type VadSpeechEndCallback = (durationMs: number) => void;
export type VadEnergyCallback = (energy: number) => void;

class VadService {
  private config: VadConfig = {
    energyThreshold: 0.025,
    silenceDelayMs: 350,
    bargeInEnabled: true,
  };

  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private isListening: boolean = false;
  private isUserSpeaking: boolean = false;
  private speechStartTs: number = 0;
  private silenceTimer: any = null;

  private onSpeechStartCallbacks: VadEventCallback[] = [];
  private onSpeechEndCallbacks: VadSpeechEndCallback[] = [];
  private onBargeInCallbacks: VadEventCallback[] = [];
  private onEnergyCallbacks: VadEnergyCallback[] = [];

  constructor() {
    // Config initialized
  }

  public getConfig(): VadConfig {
    return { ...this.config };
  }

  public updateConfig(patch: Partial<VadConfig>): void {
    this.config = { ...this.config, ...patch };
  }

  public onSpeechStart(cb: VadEventCallback): () => void {
    this.onSpeechStartCallbacks.push(cb);
    return () => {
      this.onSpeechStartCallbacks = this.onSpeechStartCallbacks.filter(c => c !== cb);
    };
  }

  public onSpeechEnd(cb: VadSpeechEndCallback): () => void {
    this.onSpeechEndCallbacks.push(cb);
    return () => {
      this.onSpeechEndCallbacks = this.onSpeechEndCallbacks.filter(c => c !== cb);
    };
  }

  public onBargeIn(cb: VadEventCallback): () => void {
    this.onBargeInCallbacks.push(cb);
    return () => {
      this.onBargeInCallbacks = this.onBargeInCallbacks.filter(c => c !== cb);
    };
  }

  public onEnergy(cb: VadEnergyCallback): () => void {
    this.onEnergyCallbacks.push(cb);
    return () => {
      this.onEnergyCallbacks = this.onEnergyCallbacks.filter(c => c !== cb);
    };
  }

  /**
   * Computes Root Mean Square (RMS) energy of an audio buffer.
   */
  public calculateRms(samples: Float32Array): number {
    if (!samples || samples.length === 0) return 0;
    let sumSq = 0;
    for (let i = 0; i < samples.length; i++) {
      sumSq += samples[i] * samples[i];
    }
    return Math.sqrt(sumSq / samples.length);
  }

  /**
   * Computes Zero Crossing Rate (ZCR) to distinguish voice formants from DC offset or rumble.
   */
  public calculateZcr(samples: Float32Array): number {
    if (!samples || samples.length < 2) return 0;
    let crossings = 0;
    for (let i = 1; i < samples.length; i++) {
      if ((samples[i] >= 0 && samples[i - 1] < 0) || (samples[i] < 0 && samples[i - 1] >= 0)) {
        crossings++;
      }
    }
    return crossings / (samples.length - 1);
  }

  /**
   * Ingests a frame of raw PCM audio samples and updates VAD state.
   */
  public processAudioFrame(samples: Float32Array): { isSpeech: boolean; rms: number; zcr: number } {
    const rms = this.calculateRms(samples);
    const zcr = this.calculateZcr(samples);
    const isSpeech = rms >= this.config.energyThreshold;

    this.onEnergyCallbacks.forEach(cb => cb(rms));

    if (isSpeech) {
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
      }

      if (!this.isUserSpeaking) {
        this.isUserSpeaking = true;
        this.speechStartTs = Date.now();

        // Check for Acoustic Barge-In (Interruption of Eve's speech)
        if (this.config.bargeInEnabled && nativeTts.isCurrentlySpeaking()) {
          this.triggerBargeIn();
        }

        this.onSpeechStartCallbacks.forEach(cb => cb());
        telemetry.log('event', { action: 'vad_speech_start', rms, zcr });
      }
    } else if (this.isUserSpeaking) {
      if (!this.silenceTimer) {
        this.silenceTimer = setTimeout(() => {
          const duration = Date.now() - this.speechStartTs;
          this.isUserSpeaking = false;
          this.silenceTimer = null;
          this.onSpeechEndCallbacks.forEach(cb => cb(duration));
          telemetry.log('event', { action: 'vad_speech_end', durationMs: duration });
        }, this.config.silenceDelayMs);
      }
    }

    return { isSpeech, rms, zcr };
  }

  /**
   * Immediate acoustic barge-in: instantly cancels speech playback and flushes audio buffers.
   */
  public triggerBargeIn(): void {
    streamingAudioPipeline.abort();
    nativeTts.stop();
    this.onBargeInCallbacks.forEach(cb => cb());
    telemetry.log('event', { action: 'vad_barge_in_interruption' });
  }

  /**
   * Returns a low-latency conversational backchannel filler token.
   */
  public getConversationalBackchannel(intent?: string): string {
    const normalized = (intent || '').toLowerCase();
    if (normalized.includes('calendar') || normalized.includes('agenda') || normalized.includes('schedule')) {
      return 'Checking your calendar...';
    }
    if (normalized.includes('weather') || normalized.includes('forecast')) {
      return 'Looking up the current conditions...';
    }
    if (normalized.includes('entity') || normalized.includes('contact') || normalized.includes('who is')) {
      return 'Checking executive memory...';
    }
    if (normalized.includes('terminal') || normalized.includes('command') || normalized.includes('tool')) {
      return 'Dispatching request...';
    }
    return 'One moment, looking into that...';
  }

  /**
   * Attaches an active microphone MediaStream for live browser VAD processing.
   */
  public attachMediaStream(stream: MediaStream): boolean {
    if (typeof window === 'undefined' || !window.AudioContext) return false;
    try {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = this.audioCtx.createMediaStreamSource(stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 512;
      source.connect(this.analyser);

      const buffer = new Float32Array(this.analyser.fftSize);
      this.isListening = true;

      const pollLoop = () => {
        if (!this.isListening || !this.analyser) return;
        this.analyser.getFloatTimeDomainData(buffer);
        this.processAudioFrame(buffer);
        requestAnimationFrame(pollLoop);
      };
      requestAnimationFrame(pollLoop);
      return true;
    } catch (e) {
      telemetry.log('error', { source: 'VadService', error: String(e) });
      return false;
    }
  }

  public detach(): void {
    this.isListening = false;
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }
    this.analyser = null;
    this.isUserSpeaking = false;
  }

  public isUserCurrentlySpeaking(): boolean {
    return this.isUserSpeaking;
  }
}

export const vadService = new VadService();
