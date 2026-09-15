import { telemetry } from './telemetryLogger';

class MobileAudioUnlocker {
  private unlocked = false;
  private audioContext: AudioContext | null = null;

  /**
   * Warm up and unlock mobile audio restrictions on first user interaction.
   * Required for iOS Safari and Android Chrome audio autoplay policy.
   */
  public async unlock(): Promise<boolean> {
    if (this.unlocked) return true;

    try {
      // 1. Prime AudioContext
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!this.audioContext) {
          this.audioContext = new AudioCtx();
        }
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
      }

      // 2. Prime SpeechSynthesis with silent utterance
      if ('speechSynthesis' in window) {
        const silentUtterance = new SpeechSynthesisUtterance('');
        silentUtterance.volume = 0;
        window.speechSynthesis.speak(silentUtterance);
      }

      this.unlocked = true;
      telemetry.log('event', { action: 'mobile_audio_unlocked' });
      return true;
    } catch (err) {
      telemetry.log('error', { source: 'MobileAudioUnlocker', message: String(err) });
      return false;
    }
  }

  public isUnlocked(): boolean {
    return this.unlocked;
  }
}

export const mobileAudio = new MobileAudioUnlocker();
