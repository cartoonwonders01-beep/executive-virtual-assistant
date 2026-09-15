import { nativeTts } from './nativeTts';
import { telemetry } from './telemetryLogger';

export interface StreamCallbacks {
  onToken?: (token: string, fullAccumulated: string) => void;
  onSentence?: (sentence: string) => void;
  onDone?: (fullText: string) => void;
}

export class StreamingAudioPipeline {
  private sentenceQueue: string[] = [];
  private isSynthesizing: boolean = false;
  private currentBuffer: string = '';
  private fullText: string = '';
  private isStreamActive: boolean = false;

  /**
   * Punctuation boundary detector for natural sentence & clause breaks.
   * Splits at '.', '!', '?', ';', or '\n' when followed by whitespace or end of string,
   * avoiding abbreviation splits (e.g. "e.g.", "Dr.").
   */
  public extractSentences(buffer: string): { sentences: string[]; remainder: string } {
    const sentences: string[] = [];
    let remaining = buffer;

    // Regex looks for sentence terminator followed by space or newline
    const sentenceRegex = /([.!?;\n])\s+/;

    while (true) {
      const match = remaining.match(sentenceRegex);
      if (!match || match.index === undefined) break;

      const splitIndex = match.index + match[1].length;
      const sentence = remaining.slice(0, splitIndex).trim();
      remaining = remaining.slice(splitIndex).trimStart();

      if (sentence.length > 0) {
        sentences.push(sentence);
      }
    }

    return { sentences, remainder: remaining };
  }

  public startStream(): void {
    this.sentenceQueue = [];
    this.isSynthesizing = false;
    this.currentBuffer = '';
    this.fullText = '';
    this.isStreamActive = true;
    telemetry.log('event', { action: 'streaming_audio_pipeline_started' });
  }

  /**
   * Ingests a new token from SSE stream and pushes completed sentences to TTS queue.
   */
  public pushToken(token: string, callbacks?: StreamCallbacks): void {
    if (!this.isStreamActive) return;

    this.fullText += token;
    this.currentBuffer += token;

    if (callbacks?.onToken) {
      callbacks.onToken(token, this.fullText);
    }

    const { sentences, remainder } = this.extractSentences(this.currentBuffer);
    if (sentences.length > 0) {
      this.currentBuffer = remainder;
      for (const s of sentences) {
        if (s.trim().length > 1) {
          this.sentenceQueue.push(s);
          if (callbacks?.onSentence) callbacks.onSentence(s);
        }
      }
      this.processQueue();
    }
  }

  /**
   * Finalizes the stream, flushes any remaining buffered text, and triggers completion.
   */
  public finishStream(callbacks?: StreamCallbacks): string {
    if (this.currentBuffer.trim().length > 0) {
      const finalSentence = this.currentBuffer.trim();
      this.sentenceQueue.push(finalSentence);
      if (callbacks?.onSentence) callbacks.onSentence(finalSentence);
      this.currentBuffer = '';
      this.processQueue();
    }

    const finalFull = this.fullText;
    this.isStreamActive = false;

    if (callbacks?.onDone) {
      callbacks.onDone(finalFull);
    }
    telemetry.log('event', { action: 'streaming_audio_pipeline_completed', totalLength: finalFull.length });
    return finalFull;
  }

  /**
   * Sequential audio worker that feeds sentences to native TTS one-by-one without overlap.
   */
  private processQueue(): void {
    if (this.isSynthesizing || this.sentenceQueue.length === 0) return;

    const nextSentence = this.sentenceQueue.shift();
    if (!nextSentence) return;

    this.isSynthesizing = true;
    nativeTts.speak(nextSentence, () => {
      this.isSynthesizing = false;
      this.processQueue();
    });
  }

  public abort(): void {
    this.isStreamActive = false;
    this.sentenceQueue = [];
    this.currentBuffer = '';
    this.isSynthesizing = false;
    nativeTts.stop();
  }

  public async streamSSE(
    url: string,
    apiKey: string,
    payload: any,
    callbacks?: StreamCallbacks
  ): Promise<string> {
    this.startStream();
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...payload, stream: true })
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let partialLine = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = (partialLine + chunk).split('\n');
        partialLine = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue; // Skip comments/empty
          if (trimmed === 'data: [DONE]') break;

          if (trimmed.startsWith('data: ')) {
            try {
              const json = JSON.parse(trimmed.slice(6));
              const token = json.choices?.[0]?.delta?.content || '';
              if (token) {
                this.pushToken(token, callbacks);
              }
            } catch {}
          }
        }
      }

      return this.finishStream(callbacks);
    } catch (e) {
      telemetry.log('error', { source: 'StreamingAudioPipeline', message: String(e) });
      return this.finishStream(callbacks);
    }
  }
}

export const streamingAudioPipeline = new StreamingAudioPipeline();
