// Standalone Microsoft Edge Neural TTS Service
// Provides free, high-fidelity conversational female speech synthesis
// Defaults to en-US-AvaMultilingualNeural (Expressive, Caring, Copilot) or en-US-AriaNeural

import { execFile } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export interface NeuralSynthesisResult {
  audioBase64: string;
  mimeType: string;
  voice: string;
  durationMs: number;
}

export class EdgeTTSService {
  private static instance: EdgeTTSService;
  private binaryPath: string = '';

  private constructor() {
    const homeDir = os.homedir();
    const candidatePath = path.join(homeDir, '.local', 'bin', 'edge-tts');
    this.binaryPath = fs.existsSync(candidatePath) ? candidatePath : 'edge-tts';
  }

  public static getInstance(): EdgeTTSService {
    if (!EdgeTTSService.instance) {
      EdgeTTSService.instance = new EdgeTTSService();
    }
    return EdgeTTSService.instance;
  }

  /**
   * Synthesize clean text to MP3 audio via Edge Neural TTS
   */
  public async synthesize(
    text: string,
    voice: string = 'en-US-AvaMultilingualNeural',
    rateDelta: number = 0
  ): Promise<NeuralSynthesisResult | null> {
    const cleanText = text.replace(/[*#_`~>•]/g, '').trim();
    if (!cleanText) return null;

    const startTime = Date.now();
    const tempFile = path.join(os.tmpdir(), `eve_tts_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.mp3`);

    const ratePercent = Math.round(rateDelta * 100);
    const rateArg = ratePercent >= 0 ? `+${ratePercent}%` : `${ratePercent}%`;

    return new Promise((resolve) => {
      execFile(
        this.binaryPath,
        ['--voice', voice, '--rate', rateArg, '--text', cleanText, '--write-media', tempFile],
        { timeout: 25000 },
        (err) => {
          if (err) {
            console.warn('[EDGE_TTS] Synthesis execution notice:', err.message);
            if (fs.existsSync(tempFile)) try { fs.unlinkSync(tempFile); } catch {}
            return resolve(null);
          }

          try {
            if (fs.existsSync(tempFile)) {
              const audioBuffer = fs.readFileSync(tempFile);
              fs.unlinkSync(tempFile);
              const durationMs = Date.now() - startTime;
              return resolve({
                audioBase64: audioBuffer.toString('base64'),
                mimeType: 'audio/mp3',
                voice,
                durationMs
              });
            }
            resolve(null);
          } catch (readErr) {
            console.error('[EDGE_TTS] Read audio exception:', readErr);
            resolve(null);
          }
        }
      );
    });
  }
}

export const edgeTTS = EdgeTTSService.getInstance();
