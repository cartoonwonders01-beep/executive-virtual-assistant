// Production MediaRecorder & Web Audio monitoring with intelligent Voice Activity Detection (VAD)
// and Concurrent Web Speech API Real-Time Speech Recognition

export interface AudioRecorderConfig {
  onAudioLevel: (level: number) => void;
  onRecordingComplete: (blob: Blob, mimeType: string, liveTranscript?: string) => void;
  onLiveTranscript?: (text: string) => void;
  onError: (error: string) => void;
  onVADSilenceCountdown?: (secondsRemaining: number) => void;
}

export interface VADOptions {
  autoStopOnSilence: boolean;
  silenceThreshold: number; // 0.0 to 1.0 (default: 0.06)
  silenceDurationMs: number; // milliseconds of silence before trigger (default: 1600ms)
  speechTriggerThreshold: number; // minimum level to consider speech started (default: 0.12)
}

export class AudioRecorderService {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private chunks: Blob[] = [];
  private wakeLock: any = null;
  private isRecordingActive = false;

  // Real-time Speech Recognition
  private speechRecognition: any = null;
  private capturedLiveTranscript = '';

  // VAD State
  private vadOptions: VADOptions = {
    autoStopOnSilence: true,
    silenceThreshold: 0.06,
    silenceDurationMs: 1600,
    speechTriggerThreshold: 0.12,
  };
  private hasDetectedSpeech = false;
  private silenceStartTime: number | null = null;
  private configRef: AudioRecorderConfig | null = null;

  public setVADOptions(options: Partial<VADOptions>): void {
    this.vadOptions = { ...this.vadOptions, ...options };
  }

  public getVADOptions(): VADOptions {
    return { ...this.vadOptions };
  }

  public resolveMimeType(): string {
    if (typeof window === 'undefined' || !window.MediaRecorder) return 'audio/webm';
    if (window.MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus';
    if (window.MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
    if (window.MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4';
    if (window.MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) return 'audio/ogg;codecs=opus';
    return '';
  }

  public async start(config: AudioRecorderConfig): Promise<boolean> {
    try {
      this.chunks = [];
      this.hasDetectedSpeech = false;
      this.silenceStartTime = null;
      this.configRef = config;
      this.capturedLiveTranscript = '';

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
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
              } else {
                interimTranscript += event.results[i][0].transcript;
              }
            }

            const current = (finalTranscript || interimTranscript).trim();
            if (current) {
              this.capturedLiveTranscript = current;
              if (config.onLiveTranscript) {
                config.onLiveTranscript(current);
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
          } else if (this.hasDetectedSpeech && normalized <= this.vadOptions.silenceThreshold) {
            if (!this.silenceStartTime) {
              this.silenceStartTime = now;
            } else {
              const elapsedSilence = now - this.silenceStartTime;
              if (this.vadOptions.autoStopOnSilence && elapsedSilence >= this.vadOptions.silenceDurationMs) {
                // Auto-stop triggered by silence!
                this.stop();
                return;
              }
            }
          }

          this.animFrameId = requestAnimationFrame(checkAudioFrame);
        };
        this.animFrameId = requestAnimationFrame(checkAudioFrame);
      }

      const mimeType = this.resolveMimeType();
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: mimeType || undefined,
        audioBitsPerSecond: 64000
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.cleanupAudioMonitoring();
        const liveText = this.capturedLiveTranscript;
        if (this.chunks.length > 0) {
          const finalBlob = new Blob(this.chunks, { type: mimeType || 'audio/webm' });
          config.onRecordingComplete(finalBlob, mimeType || 'audio/webm', liveText);
        } else if (liveText) {
          // If no chunks but we got live text, trigger with empty blob
          config.onRecordingComplete(new Blob([], { type: 'audio/webm' }), 'audio/webm', liveText);
        }
      };

      this.mediaRecorder.start(250);
      this.isRecordingActive = true;
      return true;
    } catch (err: any) {
      console.error('Failed to start audio recording:', err);
      config.onError(err?.message || 'Microphone access denied or unsupported');
      this.cleanup();
      return false;
    }
  }

  public stop(): void {
    this.isRecordingActive = false;
    if (this.speechRecognition) {
      try { this.speechRecognition.stop(); } catch {}
      this.speechRecognition = null;
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
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
