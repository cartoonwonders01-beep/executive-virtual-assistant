// Google Cloud Journey Studio TTS Service
// Uses Google Cloud Project homeassistant-506520 and service_account.json
// Synthesizes conversational human audio with Journey & Studio neural voices

import path from 'path';
import fs from 'fs';
import { GoogleAuth } from 'google-auth-library';

export type JourneyVoiceId =
  | 'en-US-Journey-F' // Warm, conversational, natural female podcast voice
  | 'en-US-Journey-O' // Expressive, crisp studio female voice
  | 'en-US-Journey-D' // Conversational male voice
  | 'en-GB-Journey-F' // British executive natural female voice
  | 'en-GB-Journey-O' // British studio natural voice
  | 'fr-FR-Neural2-A' // Natural French Studio voice
  | 'de-DE-Neural2-F'; // Natural German Studio voice

export class GoogleTTSService {
  private static instance: GoogleTTSService;
  private auth: GoogleAuth | null = null;
  private keyPath: string = '';

  private constructor() {
    this.initAuth();
  }

  public static getInstance(): GoogleTTSService {
    if (!GoogleTTSService.instance) {
      GoogleTTSService.instance = new GoogleTTSService();
    }
    return GoogleTTSService.instance;
  }

  private initAuth(): void {
    this.keyPath = path.resolve(__dirname, 'service_account.json');
    if (fs.existsSync(this.keyPath)) {
      try {
        this.auth = new GoogleAuth({
          keyFilename: this.keyPath,
          scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });
        console.log('[GOOGLE_TTS] 🎙️ Google Cloud Journey TTS Authenticated via Service Account.');
      } catch (err) {
        console.warn('[GOOGLE_TTS] Notice initializing auth:', err);
      }
    }
  }

  /**
   * Synthesizes text into high-fidelity MP3 audio using Google Journey Studio Voices
   */
  public async synthesizeSpeech(
    text: string,
    voiceName: JourneyVoiceId = 'en-US-Journey-F',
    speakingRate: number = 1.05
  ): Promise<{ audioBase64: string; mimeType: string } | null> {
    const cleanText = text.replace(/[*#_`~>]/g, '').trim();
    if (!cleanText) return null;

    if (!this.auth) {
      this.initAuth();
    }

    if (!this.auth) {
      console.warn('[GOOGLE_TTS] Service account not available, client should use browser synthesis fallback.');
      return null;
    }

    try {
      const client = await this.auth.getClient();
      const tokenResponse = await client.getAccessToken();
      const accessToken = tokenResponse.token;

      if (!accessToken) {
        throw new Error('Failed to acquire GCP access token');
      }

      const languageCode = voiceName.split('-').slice(0, 2).join('-');

      const requestBody = {
        input: { text: cleanText },
        voice: {
          languageCode,
          name: voiceName
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: Math.max(0.8, Math.min(speakingRate, 1.5)),
          pitch: 0.0,
          sampleRateHertz: 24000
        }
      };

      const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[GOOGLE_TTS] API Error (${response.status}):`, errText);
        return null;
      }

      const data = await response.json() as { audioContent?: string };
      if (data.audioContent) {
        return {
          audioBase64: data.audioContent,
          mimeType: 'audio/mp3'
        };
      }

      return null;
    } catch (err: any) {
      console.error('[GOOGLE_TTS] Speech synthesis exception:', err.message);
      return null;
    }
  }
}

export const googleTTS = GoogleTTSService.getInstance();
