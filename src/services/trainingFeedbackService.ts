// Training & Diagnostic Feedback Service for Eve Cognitive Operating System (Eve-COS)
// Stores ground-truth annotations, expected vs actual behavior, telemetry traces, and generates automated regression tests

import { logger } from './loggerService';
import { episodicMemoryService } from './episodicMemoryService';

export type FailureCategory = 
  | 'stt_phonetics' 
  | 'intent_misclassification' 
  | 'entity_resolution' 
  | 'context_loss' 
  | 'bad_formatting' 
  | 'proactive_noise'
  | 'other';

export interface TrainingCase {
  id: string;
  timestamp: string;
  audioCorpusId?: string;
  originalTranscript: string;
  correctedTranscript: string;
  actualIntent: string;
  expectedIntent: string;
  actualSpokenResponse: string;
  expectedSpokenResponse: string;
  failureCategory: FailureCategory;
  notes: string;
  sttProvider: string;
  llmProvider: string;
  sttLatencyMs?: number;
  status: 'open' | 'investigating' | 'resolved' | 'test_generated';
  tags: string[];
}

const STORAGE_KEY = 'assistant_training_feedback_cases_v1';

class TrainingFeedbackService {
  private cases: TrainingCase[] = [];

  constructor() {
    this.loadFromStorage();
    this.ensureSeedCases();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.cases = parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load training cases:', e);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cases));
    } catch (e) {
      console.warn('Failed to save training cases:', e);
    }
  }

  private ensureSeedCases(): void {
    if (this.cases.length === 0) {
      const now = new Date().toISOString();
      this.cases = [
        {
          id: 'train-case-1',
          timestamp: now,
          originalTranscript: 'Send an email to Selene saying I love her',
          correctedTranscript: 'Send an email to Celine saying I love her',
          actualIntent: 'email_draft',
          expectedIntent: 'email_draft',
          actualSpokenResponse: 'Drafted email to Celine (celine.loeuille@gmail.com)',
          expectedSpokenResponse: "I've drafted a loving email to Celine right away.",
          failureCategory: 'stt_phonetics',
          notes: 'Whisper sometimes hears Selene instead of Celine. Mapped to celine.loeuille@gmail.com.',
          sttProvider: 'groq_whisper',
          llmProvider: 'gemini-2.5-flash',
          status: 'resolved',
          tags: ['family', 'stt', 'phonetics']
        },
        {
          id: 'train-case-2',
          timestamp: now,
          originalTranscript: 'Tell Ellie I am on my way',
          correctedTranscript: 'Tell Ellie I am on my way',
          actualIntent: 'email_draft',
          expectedIntent: 'email_draft',
          actualSpokenResponse: 'Drafted email to Eleonore (eleonore.a.baxter@gmail.com)',
          expectedSpokenResponse: "I've sent Ellie a note letting her know you're on your way.",
          failureCategory: 'entity_resolution',
          notes: 'Ellie is daughter Eleonore Baxter (eleonore.a.baxter@gmail.com).',
          sttProvider: 'groq_whisper',
          llmProvider: 'gemini-2.5-flash',
          status: 'resolved',
          tags: ['family', 'alias', 'daughter']
        }
      ];
      this.saveToStorage();
    }
  }

  public getAllCases(): TrainingCase[] {
    return [...this.cases].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public getCaseById(id: string): TrainingCase | null {
    return this.cases.find(c => c.id === id) || null;
  }

  public createTrainingCase(data: Omit<TrainingCase, 'id' | 'timestamp' | 'status'>): TrainingCase {
    const id = 'train-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    const newCase: TrainingCase = {
      id,
      timestamp: new Date().toISOString(),
      status: 'open',
      ...data
    };

    this.cases.unshift(newCase);
    this.saveToStorage();

    logger.log('info', 'ai_reasoning', `📝 Training Feedback Case logged [${id}]: "${data.originalTranscript}" -> Expected Intent: [${data.expectedIntent}]`);

    // Ingest learned rule into Episodic Memory Graph for prompt priming
    if (data.correctedTranscript && data.expectedSpokenResponse) {
      episodicMemoryService.addMemory({
        topic: `Training Correction: ${data.expectedIntent}`,
        summary: `When user says "${data.correctedTranscript}", expected intent is ${data.expectedIntent}. Notes: ${data.notes || 'User annotated training rule'}.`,
        decision: `Rule committed from Training Feedback Case ${id}`,
        keyEntities: [data.expectedIntent, ...data.tags],
        importance: 5,
        tags: ['user_training', 'ground_truth', data.failureCategory]
      });
    }

    return newCase;
  }

  public updateCaseStatus(id: string, status: TrainingCase['status']): boolean {
    const item = this.cases.find(c => c.id === id);
    if (!item) return false;
    item.status = status;
    this.saveToStorage();
    return true;
  }

  public deleteCase(id: string): boolean {
    const initialLen = this.cases.length;
    this.cases = this.cases.filter(c => c.id !== id);
    if (this.cases.length !== initialLen) {
      this.saveToStorage();
      return true;
    }
    return false;
  }

  public exportDatasetJSON(): string {
    return JSON.stringify(this.cases, null, 2);
  }

  public getCategorySummary(): Record<FailureCategory, number> {
    const summary: Record<FailureCategory, number> = {
      stt_phonetics: 0,
      intent_misclassification: 0,
      entity_resolution: 0,
      context_loss: 0,
      bad_formatting: 0,
      proactive_noise: 0,
      other: 0
    };

    for (const c of this.cases) {
      if (c.failureCategory in summary) {
        summary[c.failureCategory]++;
      } else {
        summary.other++;
      }
    }

    return summary;
  }
}

export const trainingFeedbackService = new TrainingFeedbackService();
