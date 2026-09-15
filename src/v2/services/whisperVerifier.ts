import { telemetry } from './telemetryLogger';

class WhisperVerifier {
  private mediaRecorder: MediaRecorder | null = null;
  private currentStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];

  async startRecording() {
    this.cleanupTracks();
    try {
      this.currentStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.currentStream, { mimeType: 'audio/webm' });
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      telemetry.log('whisper_result', { status: 'recording_started' });
    } catch (err) {
      this.cleanupTracks();
      telemetry.log('error', { source: 'WhisperVerifier', message: String(err) });
    }
  }

  /**
   * Completely shut down and release hardware microphone tracks (turns off OS mic indicator)
   */
  public cleanupTracks() {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
      this.currentStream = null;
    }
  }

  async stopAndVerify(nativeTranscript: string): Promise<string> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        this.cleanupTracks();
        resolve(nativeTranscript);
        return;
      }

      this.mediaRecorder.onstop = async () => {
        // Guarantee hardware tracks are released immediately upon recording stop
        this.cleanupTracks();

        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        
        // Call Groq API directly for verification
        const groqApiKey = localStorage.getItem('assistant_groq_api_key') || import.meta.env.VITE_GROQ_API_KEY;
        
        if (!groqApiKey || groqApiKey.includes('placeholder') || groqApiKey.includes('sample_')) {
          telemetry.log('whisper_result', { status: 'skipped', reason: 'Invalid or placeholder Groq API Key' });
          resolve(nativeTranscript);
          return;
        }

        try {
          const formData = new FormData();
          formData.append('file', audioBlob, 'audio.webm');
          formData.append('model', 'whisper-large-v3-turbo');
          
          telemetry.log('event', { action: 'groq_whisper_start', size: audioBlob.size });

          const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${groqApiKey}`
            },
            body: formData
          });

          if (!res.ok) throw new Error(`Groq API Error: ${res.status}`);
          const data = await res.json();
          
          telemetry.log('whisper_result', { 
            status: 'success', 
            native: nativeTranscript,
            groq: data.text 
          });
          
          resolve(data.text || nativeTranscript);
        } catch (err) {
          telemetry.log('error', { source: 'GroqWhisper', message: String(err) });
          resolve(nativeTranscript);
        }
      };

      try {
        this.mediaRecorder.stop();
      } catch {
        this.cleanupTracks();
        resolve(nativeTranscript);
      }
    });
  }
}

export const whisperVerifier = new WhisperVerifier();
