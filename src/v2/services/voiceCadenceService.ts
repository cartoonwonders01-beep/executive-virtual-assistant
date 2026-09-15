import { nativeTts } from './nativeTts';
import { telemetry } from './telemetryLogger';

export type CadencePreset = 'morning_crisp' | 'evening_calm' | 'urgent_alert' | 'conversational_default' | 'deep_focus';

export interface CadenceSettings {
  preset: CadencePreset;
  rate: number;
  pitch: number;
  description: string;
}

const CADENCE_PROFILES: Record<CadencePreset, { rate: number; pitch: number; description: string }> = {
  morning_crisp: {
    rate: 1.06,
    pitch: 1.03,
    description: 'Energetic, articulate morning briefing tone'
  },
  evening_calm: {
    rate: 0.94,
    pitch: 0.96,
    description: 'Warm, measured, soothing evening reflection tone'
  },
  urgent_alert: {
    rate: 1.14,
    pitch: 1.05,
    description: 'Crisp, rapid cadence for critical schedule clashes'
  },
  deep_focus: {
    rate: 0.98,
    pitch: 0.98,
    description: 'Calm, minimal cognitive load tone for coding & review'
  },
  conversational_default: {
    rate: 1.02,
    pitch: 1.0,
    description: 'Natural balanced conversational cadence'
  }
};

export class VoiceCadenceService {
  private activePreset: CadencePreset = 'conversational_default';

  constructor() {
    // Default initialized
  }

  public getCurrentCadence(): CadenceSettings {
    const profile = CADENCE_PROFILES[this.activePreset];
    return {
      preset: this.activePreset,
      rate: profile.rate,
      pitch: profile.pitch,
      description: profile.description
    };
  }

  public applyPreset(preset: CadencePreset): CadenceSettings {
    const profile = CADENCE_PROFILES[preset] || CADENCE_PROFILES.conversational_default;
    this.activePreset = preset;

    nativeTts.setRate(profile.rate);
    nativeTts.setPitch(profile.pitch);

    telemetry.log('event', {
      action: 'voice_cadence_applied',
      preset,
      rate: profile.rate,
      pitch: profile.pitch
    });

    return this.getCurrentCadence();
  }

  /**
   * Infers the optimal acoustic cadence preset based on user utterance or system intent.
   */
  public inferCadenceFromContext(text: string, intent?: string): CadencePreset {
    const lower = (text + ' ' + (intent || '')).toLowerCase();

    if (lower.includes('urgent') || lower.includes('conflict') || lower.includes('clash') || lower.includes('warning') || lower.includes('emergency')) {
      return 'urgent_alert';
    }

    if (lower.includes('good morning') || lower.includes('morning briefing') || lower.includes('start the day')) {
      return 'morning_crisp';
    }

    if (lower.includes('evening') || lower.includes('good night') || lower.includes('debrief') || lower.includes('reflection') || lower.includes('wind down')) {
      return 'evening_calm';
    }

    if (lower.includes('code') || lower.includes('refactor') || lower.includes('audit') || lower.includes('review file')) {
      return 'deep_focus';
    }

    return 'conversational_default';
  }

  public resetToDefault(): CadenceSettings {
    return this.applyPreset('conversational_default');
  }
}

export const voiceCadenceService = new VoiceCadenceService();
