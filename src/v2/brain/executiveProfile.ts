export interface ExecutiveProfileData {
  user: {
    name: string;
    preferred_languages: string[];
    role: string;
  };
  family: Record<string, string>;
  preferences: Record<string, string>;
  active_projects: Record<string, string>;
  key_facts: Record<string, string>;
  updated_at: number;
}

const PROFILE_STORAGE_KEY = 'eve_v2_executive_profile';

const DEFAULT_PROFILE: ExecutiveProfileData = {
  user: {
    name: 'Andrew',
    preferred_languages: ['English', 'French', 'Dutch'],
    role: 'Executive & Systems Architect'
  },
  family: {
    'Celine': 'Partner / Co-parent. French communication.',
    'Angelina': 'Child.',
    'Elizabeth': 'Child.',
    'Alexander': 'Child.',
    'Eleonore': 'Child.'
  },
  preferences: {
    'voice': 'Natural, succinct, high agency',
    'output_style': 'Crisp spoken responses, 1-3 sentences'
  },
  active_projects: {
    'Eve Assistant': 'v2 Core Audio Loop, Cognitive Memory Architecture, PWA',
    'AuricPass': 'Zero-Knowledge Security & MCP Brain Engine'
  },
  key_facts: {},
  updated_at: Date.now()
};

export class ExecutiveProfileManager {
  private profile: ExecutiveProfileData = DEFAULT_PROFILE;

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
        if (stored) {
          this.profile = { ...DEFAULT_PROFILE, ...JSON.parse(stored) };
          return;
        }
        this.save();
      }
    } catch {
      this.profile = DEFAULT_PROFILE;
    }
  }

  public save(): void {
    try {
      this.profile.updated_at = Date.now();
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(this.profile));
      }
    } catch (e) {
      console.warn('[ExecutiveProfile] Failed to save to storage:', e);
    }
  }

  public getProfile(): ExecutiveProfileData {
    return { ...this.profile };
  }

  /**
   * Generates a compact system prompt block (<150 tokens) with zero noise
   */
  public getSystemPromptSnippet(): string {
    const familyEntries = Object.entries(this.profile.family).map(([k, v]) => `${k}: ${v}`).join('; ');
    const projectEntries = Object.entries(this.profile.active_projects).map(([k, v]) => `${k}: ${v}`).join('; ');
    const prefEntries = Object.entries(this.profile.preferences).map(([k, v]) => `${k}: ${v}`).join('; ');
    const factEntries = Object.entries(this.profile.key_facts).map(([k, v]) => `${k}: ${v}`).join('; ');

    return `EXECUTIVE KNOWLEDGE VAULT (Ground Truth):
• User: ${this.profile.user.name} (${this.profile.user.role}) | Languages: ${this.profile.user.preferred_languages.join(', ')}
• Family & Circle: ${familyEntries || 'None recorded'}
• Active Projects: ${projectEntries || 'None recorded'}
• Key Preferences: ${prefEntries || 'None recorded'}
${factEntries ? `• Known Facts: ${factEntries}` : ''}`.trim();
  }

  public updateField(
    category: 'family' | 'preferences' | 'active_projects' | 'key_facts',
    key: string,
    value: string
  ): void {
    if (!key.trim()) return;
    this.profile[category][key.trim()] = value.trim();
    this.save();
  }

  public deleteField(
    category: 'family' | 'preferences' | 'active_projects' | 'key_facts',
    key: string
  ): void {
    delete this.profile[category][key];
    this.save();
  }

  // Taint-Tracking & Human-in-the-Loop Confirmation Gate
  private pendingUpdates: StagedProfileUpdate[] = [];

  public stageUpdate(
    category: 'family' | 'preferences' | 'active_projects' | 'key_facts',
    key: string,
    value: string,
    source: string = 'llm_extraction'
  ): StagedProfileUpdate {
    const update: StagedProfileUpdate = {
      id: 'stg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      category,
      key: key.trim(),
      value: value.trim(),
      source,
      timestamp: Date.now()
    };
    this.pendingUpdates.push(update);
    return update;
  }

  public getPendingUpdates(): StagedProfileUpdate[] {
    return [...this.pendingUpdates];
  }

  public approveUpdate(id: string): boolean {
    const idx = this.pendingUpdates.findIndex(u => u.id === id);
    if (idx === -1) return false;
    const [item] = this.pendingUpdates.splice(idx, 1);
    this.updateField(item.category, item.key, item.value);
    return true;
  }

  public rejectUpdate(id: string): boolean {
    const idx = this.pendingUpdates.findIndex(u => u.id === id);
    if (idx === -1) return false;
    this.pendingUpdates.splice(idx, 1);
    return true;
  }

  public clearPendingUpdates(): void {
    this.pendingUpdates = [];
  }
}

export interface StagedProfileUpdate {
  id: string;
  category: 'family' | 'preferences' | 'active_projects' | 'key_facts';
  key: string;
  value: string;
  source: string;
  timestamp: number;
}

export const executiveProfile = new ExecutiveProfileManager();

