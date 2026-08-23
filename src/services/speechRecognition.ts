// Web Speech API wrapper with fallback audio recording

export interface SpeechListenerHandlers {
  onTranscriptChange: (text: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onAudioLevel?: (level: number) => void;
}

export class SpeechService {
  private recognition: any = null;
  private isListening = false;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private animFrameId: number | null = null;
  private stream: MediaStream | null = null;

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
    }
  }

  public isSupported(): boolean {
    return !!this.recognition;
  }

  public async startListening(handlers: SpeechListenerHandlers): Promise<void> {
    if (this.isListening) return;

    // Start Audio Level Analyser for Visualizer
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.microphone.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkLevel = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(1, average / 128);
        if (handlers.onAudioLevel) {
          handlers.onAudioLevel(normalized);
        }
        this.animFrameId = requestAnimationFrame(checkLevel);
      };
      checkLevel();
    } catch (err) {
      console.warn('Microphone stream audio level metering unavailable:', err);
    }

    // Start Speech Recognition
    if (this.recognition) {
      this.recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const text = final || interim;
        handlers.onTranscriptChange(text, !!final);
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          handlers.onError(event.error);
        }
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch (e) {
            // Already started
          }
        }
      };

      try {
        this.recognition.start();
        this.isListening = true;
      } catch (err: any) {
        handlers.onError(err.message || 'Could not start speech recognition');
      }
    } else {
      handlers.onError('Web Speech API is not supported in this browser. You can type or upload audio files directly.');
    }
  }

  public stopListening(): void {
    this.isListening = false;

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }

    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }
}

export const speechService = new SpeechService();
