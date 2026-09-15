import { ActionCardData } from '../components/ActionCardView';
import { ChatTurn } from './intelligenceBridge';
import { telemetry } from './telemetryLogger';
import { liveCalendarService } from './liveCalendarService';

export interface System1Result {
  isReflex: boolean;
  responseText?: string;
  actionCard?: ActionCardData;
  intent?: 'GREETING' | 'AFFIRMATION' | 'STOP' | 'TIME_STATUS';
}

export interface DiscourseEntity {
  name: string;
  type: 'person' | 'event' | 'task' | 'date';
  context: string;
  timestamp: number;
}

export class DualProcessCortex {
  private recentEntities: DiscourseEntity[] = [];

  /**
   * Kahneman System 1: Sub-200ms instantaneous reflex matcher
   * Handles conversational pleasantries, affirmations, stop signals, and status queries
   * without calling the remote LLM.
   */
  public evaluateSystem1(transcript: string): System1Result {
    const clean = transcript.toLowerCase().trim().replace(/[.,!?;:]/g, '');

    // 0. Greeting reflex
    if (/^(hi|hello|hey|good morning|good afternoon|good evening|bonjour|bonsoir|hallo|goedemorgen)( eve)?$/i.test(clean) ||
        /^(hey|hi|hello) eve( good morning| good afternoon| good evening)?$/i.test(clean)) {
      telemetry.log('event', { action: 'system1_reflex', intent: 'GREETING' });
      const greeting = clean.includes('morning') ? 'Good morning' :
                       clean.includes('evening') ? 'Good evening' :
                       clean.includes('afternoon') ? 'Good afternoon' : 'Hello';
      return {
        isReflex: true,
        responseText: `${greeting} Andrew. How can I assist you?`,
        intent: 'GREETING'
      };
    }

    // 1. Stop / Interruption reflex
    if (/^(stop|pause|silence|quiet|shut up|arrete|tais-toi|stop eve|eve stop|eve stop talking|stop talking)$/i.test(clean)) {
      telemetry.log('event', { action: 'system1_reflex', intent: 'STOP' });
      return {
        isReflex: true,
        responseText: 'Stopping now.',
        intent: 'STOP'
      };
    }

    // 2. Affirmation / Gratitude reflex
    if (/^(thank you|thanks|merci|merci eve|dank je|dank u|perfect|okay perfect|ok perfect|got it|c'est bon|great|excellent|awesome|understood)$/i.test(clean)) {
      telemetry.log('event', { action: 'system1_reflex', intent: 'AFFIRMATION' });
      const replies = ['Got it.', 'Understood.', 'On it.'];
      const chosen = replies[Math.floor(Math.random() * replies.length)];
      return {
        isReflex: true,
        responseText: chosen,
        intent: 'AFFIRMATION'
      };
    }

    // 3. Quick Time / Status reflex
    if (/^(what time is it|what time is it right now|what is the time|quelle heure est-il|hoe laat is het|current time)$/i.test(clean)) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      telemetry.log('event', { action: 'system1_reflex', intent: 'TIME_STATUS' });
      return {
        isReflex: true,
        responseText: `The time is ${timeStr}.`,
        intent: 'TIME_STATUS'
      };
    }

    // 4. Agenda / Schedule query reflex
    if (/^(what's on my agenda|what is on my agenda|my schedule today|my agenda today|what do i have today|what do i have scheduled)$/i.test(clean)) {
      const summary = liveCalendarService.generateDailyAgendaSummary();
      telemetry.log('event', { action: 'system1_reflex', intent: 'TIME_STATUS' });
      return {
        isReflex: true,
        responseText: summary,
        intent: 'TIME_STATUS'
      };
    }

    return { isReflex: false };
  }

  /**
   * Resolves anaphoric pronouns ("it", "him", "her", "that meeting") in follow-up queries
   * by examining the active discourse entity stack.
   */
  public resolveAnaphora(query: string, history: ChatTurn[]): string {
    if (!query) return query;
    let resolved = query;

    // Extract recent entities from history if not cached
    this.updateDiscourseEntities(history);

    const lower = query.toLowerCase();
    const hasPronoun = /\b(it|him|her|them|that|that meeting|cette reunion|ce meeting)\b/i.test(lower);

    if (hasPronoun && this.recentEntities.length > 0) {
      // Find person entity or event entity
      const personEntity = this.recentEntities.find(e => e.type === 'person');
      const eventEntity = this.recentEntities.find(e => e.type === 'event');

      // If query is e.g. "Invite Celine to it" or "Reschedule that meeting"
      if (/\b(to it|to that|it|that meeting)\b/i.test(lower) && eventEntity) {
        resolved = query.replace(/\b(to it|to that)\b/gi, `to "${eventEntity.name}"`)
                        .replace(/\b(it|that meeting)\b/gi, `"${eventEntity.name}"`);
        telemetry.log('event', { action: 'anaphora_resolved', original: query, resolved, entity: eventEntity.name });
      } else if (/\b(him|her)\b/i.test(lower) && personEntity) {
        resolved = query.replace(/\b(him|her)\b/gi, personEntity.name);
        telemetry.log('event', { action: 'anaphora_resolved', original: query, resolved, entity: personEntity.name });
      }
    }

    return resolved;
  }

  /**
   * System 2 Pre-Execution Conflict Auditor:
   * Inspects proposed action cards against existing commitments, duplicate alerts, and live agenda clashes.
   */
  public auditActionConflicts(card: ActionCardData, history: ChatTurn[]): { hasConflict: boolean; warningMessage?: string } {
    if (!card || card.type !== 'calendar') return { hasConflict: false };

    // 1. Session history duplicate detection
    for (const turn of history.slice(-10)) {
      if (turn.actionCard && turn.actionCard.type === 'calendar') {
        const prevTitle = turn.actionCard.title.toLowerCase();
        const currTitle = card.title.toLowerCase();

        if (prevTitle === currTitle) {
          return {
            hasConflict: true,
            warningMessage: `Duplicate scheduling detected: "${card.title}" was already staged in this session.`
          };
        }
      }
    }

    // 2. Live Calendar Time Slot Clash Detection
    for (const existing of liveCalendarService.getAllEvents()) {
      if (card.title.toLowerCase().includes(existing.title.toLowerCase()) || 
          existing.title.toLowerCase().includes(card.title.toLowerCase())) {
        const timeStr = new Date(existing.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        return {
          hasConflict: true,
          warningMessage: `Live calendar conflict: "${existing.title}" is already scheduled at ${timeStr}.`
        };
      }
    }

    return { hasConflict: false };
  }

  private updateDiscourseEntities(history: ChatTurn[]): void {
    for (let i = history.length - 1; i >= 0; i--) {
      const turn = history[i];
      if (turn.actionCard?.title) {
        const title = turn.actionCard.title;
        // Check for person names inside card title or content (e.g. "with Dr. Sarah Jenkins", "with David")
        const personMatch = title.match(/(?:with|avec|met)\s+([A-Z][a-zA-Z\.\s]+)/i) ||
                            turn.content.match(/(?:with|avec|met)\s+([A-Z][a-zA-Z\.\s]+)/i);
        if (personMatch) {
          const personName = personMatch[1].replace(/[,!?;:]/g, '').trim();
          if (!this.recentEntities.find(e => e.name === personName)) {
            this.recentEntities.unshift({
              name: personName,
              type: 'person',
              context: turn.content,
              timestamp: turn.timestamp
            });
          }
        }

        const existing = this.recentEntities.find(e => e.name === title);
        if (!existing) {
          this.recentEntities.unshift({
            name: title,
            type: turn.actionCard.type === 'calendar' ? 'event' : 'task',
            context: turn.content,
            timestamp: turn.timestamp
          });
        }
      }
    }
    // Keep max 10 active discourse entities
    if (this.recentEntities.length > 10) {
      this.recentEntities = this.recentEntities.slice(0, 10);
    }
  }

  public getRecentEntities(): DiscourseEntity[] {
    return [...this.recentEntities];
  }

  public clear(): void {
    this.recentEntities = [];
  }
}

export const dualProcessCortex = new DualProcessCortex();
