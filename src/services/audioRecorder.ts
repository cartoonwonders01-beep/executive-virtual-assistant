import { 
  getStoredChunkIntervalMs, 
  getStoredAudioBitrateKbps, 
  getStoredSilenceDurationMs, 
  getStoredMimeType 
} from '../config';
import { stopSpeaking, isCurrentlySpeaking } from './speechSynthesis';

// Production MediaRecorder & Web Audio monitoring with intelligent Voice Activity Detection (VAD)
// and Concurrent Web Speech API Real-Time Speech Recognition

// Verbal Stop / Cancel Command Matcher across English, French, German, Spanish
export function isVerbalStopCommand(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase().trim();
  return /^(stop|eve stop|hey eve stop|stop listening|stop talking|be quiet|quiet|shut up|cancel|cancel that|pause|halt|stopp|arrête|arrête-toi|arrete|tais-toi|silence|para|parar|enough)$/i.test(lower) ||
    /\b(?:stop listening|stop talking|be quiet|shut up|arrête-toi|tais-toi)\b/i.test(lower);
}

export interface AudioRecorderConfig {
  onAudioLevel: (level: number) => void;
  onRecordingComplete: (blob: Blob, mimeType: string, liveTranscript?: string) => void;
  onChunkSlice?: (chunkBlob: Blob, chunkIndex: number, isFinal: boolean) => void;
  onLiveTranscript?: (text: string) => void;
  onError: (error: string) => void;
  onVADSilenceCountdown?: (secondsRemaining: number) => void;
  onVerbalStopDetected?: (command: string) => void;
}

export interface VADOptions {
  autoStopOnSilence: boolean;
  silenceThreshold: number; // 0.0 to 1.0 (default: 0.06)
  silenceDurationMs: number; // milliseconds of silence before trigger (default: 1600ms)
  speechTriggerThreshold: number; // minimum level to consider speech started (default: 0.12)
  chunkIntervalMs?: number; // duration of each standalone slice (default: 3500ms)
}

export class AudioRecorderService {
  private mediaStream: MediaStream | null = null;
  private currentSegmentRecorder: MediaRecorder | null = null;
  private segmentTimer: any = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private masterChunks: Blob[] = [];
  private chunkCounter = 0;
  private wakeLock: any = null;
  private isRecordingActive = false;

  // Real-time Speech Recognition
  private speechRecognition: any = null;
  private capturedLiveTranscript = '';

  // VAD & Slicing State (Hydrated from persistent config)
  private vadOptions: VADOptions = {
    autoStopOnSilence: true,
    silenceThreshold: 0.02,
    silenceDurationMs: getStoredSilenceDurationMs(),
    speechTriggerThreshold: 0.03,
    chunkIntervalMs: getStoredChunkIntervalMs()
  };
  private hasDetectedSpeech = false;
  private silenceStartTime: number | null = null;
  private speechFinishTimer: any = null;
  private maxDurationTimer: any = null;
  private configRef: AudioRecorderConfig | null = null;

  public setVADOptions(options: Partial<VADOptions>): void {
    this.vadOptions = { ...this.vadOptions, ...options };
  }

  public getVADOptions(): VADOptions {
    return { ...this.vadOptions };
  }

  public resolveMimeType(): string {
    if (typeof window === 'undefined' || !window.MediaRecorder) return 'audio/webm';
    const preferred = getStoredMimeType();
    if (preferred && preferred !== 'auto' && window.MediaRecorder.isTypeSupported(preferred)) {
      return preferred;
    }
    if (window.MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus';
    if (window.MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
    if (window.MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4';
    if (window.MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) return 'audio/ogg;codecs=opus';
    return '';
  }

  public async start(config: AudioRecorderConfig): Promise<boolean> {
    try {
      this.masterChunks = [];
      this.chunkCounter = 0;
      this.hasDetectedSpeech = false;
      this.silenceStartTime = null;
      this.configRef = config;
      this.capturedLiveTranscript = '';

      if (this.speechFinishTimer) clearTimeout(this.speechFinishTimer);
      if (this.maxDurationTimer) clearTimeout(this.maxDurationTimer);

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      // Request Screen WakeLock to prevent mobile sleep
      try {
        if ('wakeLock' in navigator) {
          this.wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch {}

      // Start Browser Web Speech Recognition for 100% accurate live transcription
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          this.speechRecognition = new SpeechRecognition();
          this.speechRecognition.continuous = true;
          this.speechRecognition.interimResults = true;
          this.speechRecognition.lang = 'en-US';

          this.speechRecognition.onresult = (event: any) => {
            let fullAccumulated = '';
            for (let i = 0; i < event.results.length; ++i) {
              fullAccumulated += ' ' + event.results[i][0].transcript;
            }

            const current = fullAccumulated.trim();
            if (current) {
              if (isVerbalStopCommand(current)) {
                if (config.onVerbalStopDetected) {
                  config.onVerbalStopDetected(current);
                }
                stopSpeaking();
                this.stop();
                return;
              }

              // Full-Duplex Acoustic Isolation: Ignore microphone speaker pickup during active TTS playback
              if (isCurrentlySpeaking()) {
                return;
              }

              this.hasDetectedSpeech = true;
              this.silenceStartTime = null;
              this.capturedLiveTranscript = current;
              stopSpeaking(); // Barge-in

              if (config.onLiveTranscript) {
                config.onLiveTranscript(current);
              }

              // Auto-stop after user finishes speaking their sentence (Adaptive Low-Latency VAD: 450ms)
              if (this.vadOptions.autoStopOnSilence) {
                if (this.speechFinishTimer) clearTimeout(this.speechFinishTimer);
                this.speechFinishTimer = setTimeout(() => {
                  if (this.isRecordingActive) {
                    this.stop();
                  }
                }, Math.max(450, this.vadOptions.silenceDurationMs));
              }
            }
          };

          this.speechRecognition.onerror = (e: any) => {
            console.log('Web Speech non-fatal event:', e?.error);
          };

          this.speechRecognition.start();
        } catch (srErr) {
          console.log('Web Speech initial start notice:', srErr);
        }
      }

      // Max safety duration per utterance (8 seconds) to prevent infinite recording loops
      this.maxDurationTimer = setTimeout(() => {
        if (this.isRecordingActive) {
          this.stop();
        }
      }, 8000);

      // Setup Web Audio Analyser for glowing visualizer & VAD
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
        const source = this.audioContext.createMediaStreamSource(this.mediaStream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.4;
        source.connect(this.analyser);

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        const checkAudioFrame = () => {
          if (!this.analyser || !this.isRecordingActive) return;
          this.analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          const normalized = Math.min(1, avg / 110);
          config.onAudioLevel(normalized);

          // Voice Activity Detection (VAD) Logic
          const now = Date.now();
          if (normalized >= this.vadOptions.speechTriggerThreshold) {
            this.hasDetectedSpeech = true;
            this.silenceStartTime = null;
            stopSpeaking();
          } else if (this.hasDetectedSpeech && normalized <= this.vadOptions.silenceThreshold) {
            if (!this.silenceStartTime) {
              this.silenceStartTime = now;
            } else {
              const elapsedSilence = now - this.silenceStartTime;
              if (this.vadOptions.autoStopOnSilence && elapsedSilence >= this.vadOptions.silenceDurationMs) {
                // Auto-stop triggered by audio level silence!
                this.stop();
                return;
              }
            }
          }

          this.animFrameId = requestAnimationFrame(checkAudioFrame);
        };
        this.animFrameId = requestAnimationFrame(checkAudioFrame);
      }

      const resolvedMimeType = this.resolveMimeType();
      this.isRecordingActive = true;

      // Relay Segment Recording Loop (Standalone lightweight ~15-25 KB slices)
      const startNextSegment = () => {
        if (!this.isRecordingActive || !this.mediaStream) return;
        const segmentBlobs: Blob[] = [];
        let segRecorder: MediaRecorder;

        try {
          const bitrate = getStoredAudioBitrateKbps() * 1000;
          segRecorder = new MediaRecorder(this.mediaStream, {
            mimeType: resolvedMimeType || undefined,
            audioBitsPerSecond: bitrate
          });
        } catch (err) {
          console.error('Segment recorder creation failed:', err);
          return;
        }

        segRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            segmentBlobs.push(event.data);
            this.masterChunks.push(event.data);
          }
        };

        segRecorder.onstop = () => {
          if (segmentBlobs.length > 0) {
            this.chunkCounter++;
            const standaloneBlob = new Blob(segmentBlobs, { type: resolvedMimeType || 'audio/webm' });
            if (standaloneBlob.size > 300 && config.onChunkSlice) {
              config.onChunkSlice(standaloneBlob, this.chunkCounter, !this.isRecordingActive);
            }
          }

          if (this.isRecordingActive) {
            startNextSegment();
          } else {
            // Final recording cleanup & completion callback
            this.cleanupAudioMonitoring();
            const liveText = this.capturedLiveTranscript;
            const finalBlob = this.masterChunks.length > 0 
              ? new Blob(this.masterChunks, { type: resolvedMimeType || 'audio/webm' }) 
              : new Blob([], { type: resolvedMimeType || 'audio/webm' });
            config.onRecordingComplete(finalBlob, resolvedMimeType || 'audio/webm', liveText);
          }
        };

        segRecorder.start();
        this.currentSegmentRecorder = segRecorder;

        const sliceMs = this.vadOptions.chunkIntervalMs || 3500;
        this.segmentTimer = setTimeout(() => {
          if (segRecorder.state === 'recording') {
            segRecorder.stop();
          }
        }, sliceMs);
      };

      startNextSegment();
      return true;
    } catch (err: any) {
      console.error('Failed to start audio recording:', err);
      config.onError(err?.message || 'Microphone access denied or unsupported');
      this.cleanup();
      return false;
    }
  }

  public stop(): void {
    if (!this.isRecordingActive) return;
    this.isRecordingActive = false;

    if (this.segmentTimer) {
      clearTimeout(this.segmentTimer);
      this.segmentTimer = null;
    }
    if (this.speechFinishTimer) {
      clearTimeout(this.speechFinishTimer);
      this.speechFinishTimer = null;
    }
    if (this.maxDurationTimer) {
      clearTimeout(this.maxDurationTimer);
      this.maxDurationTimer = null;
    }

    if (this.speechRecognition) {
      try { this.speechRecognition.stop(); } catch {}
      this.speechRecognition = null;
    }

    if (this.currentSegmentRecorder && this.currentSegmentRecorder.state === 'recording') {
      this.currentSegmentRecorder.stop();
    } else {
      this.cleanup();
      if (this.configRef) {
        const resolvedMimeType = this.resolveMimeType();
        const finalBlob = this.masterChunks.length > 0 
          ? new Blob(this.masterChunks, { type: resolvedMimeType || 'audio/webm' }) 
          : new Blob([], { type: resolvedMimeType || 'audio/webm' });
        this.configRef.onRecordingComplete(finalBlob, resolvedMimeType || 'audio/webm', this.capturedLiveTranscript);
      }
    }
  }

  public abort(): void {
    this.isRecordingActive = false;
    if (this.segmentTimer) {
      clearTimeout(this.segmentTimer);
      this.segmentTimer = null;
    }
    if (this.speechFinishTimer) {
      clearTimeout(this.speechFinishTimer);
      this.speechFinishTimer = null;
    }
    if (this.maxDurationTimer) {
      clearTimeout(this.maxDurationTimer);
      this.maxDurationTimer = null;
    }
    if (this.speechRecognition) {
      try { this.speechRecognition.stop(); } catch {}
      this.speechRecognition = null;
    }
    if (this.currentSegmentRecorder) {
      try {
        this.currentSegmentRecorder.ondataavailable = null;
        this.currentSegmentRecorder.onstop = null;
        this.currentSegmentRecorder.stop();
      } catch {}
      this.currentSegmentRecorder = null;
    }
    this.cleanup();
  }

  public isActive(): boolean {
    return this.isRecordingActive;
  }

  public getCapturedTranscript(): string {
    return this.capturedLiveTranscript;
  }

  private cleanupAudioMonitoring(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.speechFinishTimer) {
      clearTimeout(this.speechFinishTimer);
      this.speechFinishTimer = null;
    }
    if (this.maxDurationTimer) {
      clearTimeout(this.maxDurationTimer);
      this.maxDurationTimer = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.analyser = null;
  }

  private cleanup(): void {
    this.cleanupAudioMonitoring();
    if (this.speechRecognition) {
      try { this.speechRecognition.stop(); } catch {}
      this.speechRecognition = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.wakeLock) {
      this.wakeLock.release().catch(() => {});
      this.wakeLock = null;
    }
  }
}

export const audioRecorder = new AudioRecorderService();
