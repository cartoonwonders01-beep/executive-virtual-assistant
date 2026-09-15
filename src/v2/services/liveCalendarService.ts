/**
 * Live Calendar Engine & Slot Indexer
 * Manages live agenda synchronization, time window indexing, and schedule clash detection.
 */

import { telemetry } from './telemetryLogger';

export interface CalendarEvent {
  id: string;
  title: string;
  start: number; // UTC timestamp ms
  end: number;   // UTC timestamp ms
  location?: string;
  description?: string;
  attendees?: string[];
  source?: 'google' | 'caldav' | 'local';
}

export interface ConflictAuditResult {
  hasConflict: boolean;
  conflictingEvent?: CalendarEvent;
  warningMessage?: string;
}

export interface FreeSlot {
  start: number;
  end: number;
  durationMinutes: number;
}

const STORAGE_KEY = 'eve_v2_live_calendar_events';

export class LiveCalendarService {
  private events: Map<string, CalendarEvent> = new Map();

  constructor() {
    this.loadEvents();
  }

  private loadEvents(): void {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: CalendarEvent[] = JSON.parse(stored);
          parsed.forEach(e => this.events.set(e.id, e));
          return;
        }
      }
    } catch {}
    this.seedDefaultAgenda();
  }

  private saveEvents(): void {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(this.events.values())));
      }
    } catch {}
  }

  public seedDefaultAgenda(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const baseMs = today.getTime();
    const seeds: CalendarEvent[] = [
      {
        id: 'cal-exec-sync',
        title: 'Executive Architecture Review',
        start: baseMs + (10 * 3600 * 1000), // Today 10:00 AM
        end: baseMs + (11 * 3600 * 1000),   // Today 11:00 AM
        location: 'Virtual Room A',
        source: 'google'
      },
      {
        id: 'cal-lunch-family',
        title: 'Lunch with Celine',
        start: baseMs + (12.5 * 3600 * 1000), // Today 12:30 PM
        end: baseMs + (13.5 * 3600 * 1000),   // Today 1:30 PM
        location: 'Hoeilaart',
        source: 'google'
      },
      {
        id: 'cal-auric-mesh',
        title: 'AuricPass Security & Edge Review',
        start: baseMs + (15 * 3600 * 1000), // Today 3:00 PM
        end: baseMs + (16 * 3600 * 1000),   // Today 4:00 PM
        location: 'Virtual',
        source: 'google'
      }
    ];

    seeds.forEach(s => this.events.set(s.id, s));
    this.saveEvents();
  }

  public getAllEvents(): CalendarEvent[] {
    return Array.from(this.events.values()).sort((a, b) => a.start - b.start);
  }

  public getEventsForDay(date: Date = new Date()): CalendarEvent[] {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const startMs = startOfDay.getTime();
    const endMs = endOfDay.getTime();

    return this.getAllEvents().filter(e => 
      (e.start >= startMs && e.start <= endMs) || 
      (e.end >= startMs && e.end <= endMs)
    );
  }

  public addEvent(event: CalendarEvent): void {
    this.events.set(event.id, event);
    this.saveEvents();
    telemetry.log('event', { action: 'calendar_event_added', title: event.title, start: event.start });
  }

  public deleteEvent(id: string): boolean {
    const res = this.events.delete(id);
    if (res) this.saveEvents();
    return res;
  }

  /**
   * Audits proposed time window against existing calendar commitments.
   */
  public auditSlotClash(startMs: number, endMs: number, eventTitle?: string): ConflictAuditResult {
    for (const existing of this.events.values()) {
      // Check interval intersection: max(startA, startB) < min(endA, endB)
      const overlapStart = Math.max(startMs, existing.start);
      const overlapEnd = Math.min(endMs, existing.end);

      if (overlapStart < overlapEnd) {
        const startTimeStr = new Date(existing.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const endTimeStr = new Date(existing.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return {
          hasConflict: true,
          conflictingEvent: existing,
          warningMessage: `Schedule clash: conflicts with "${existing.title}" (${startTimeStr} - ${endTimeStr})`
        };
      }
    }

    return { hasConflict: false };
  }

  /**
   * Computes available free slots for a given date between work hours (09:00 - 18:00)
   */
  public findFreeSlots(date: Date = new Date(), minDurationMinutes: number = 30): FreeSlot[] {
    const dayEvents = this.getEventsForDay(date);

    const dayStart = new Date(date);
    dayStart.setHours(9, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(18, 0, 0, 0);

    let currentCursor = dayStart.getTime();
    const freeSlots: FreeSlot[] = [];

    for (const ev of dayEvents) {
      if (ev.start > currentCursor) {
        const gapMs = ev.start - currentCursor;
        const gapMinutes = Math.floor(gapMs / (60 * 1000));
        if (gapMinutes >= minDurationMinutes) {
          freeSlots.push({ start: currentCursor, end: ev.start, durationMinutes: gapMinutes });
        }
      }
      currentCursor = Math.max(currentCursor, ev.end);
    }

    if (currentCursor < dayEnd.getTime()) {
      const gapMs = dayEnd.getTime() - currentCursor;
      const gapMinutes = Math.floor(gapMs / (60 * 1000));
      if (gapMinutes >= minDurationMinutes) {
        freeSlots.push({ start: currentCursor, end: dayEnd.getTime(), durationMinutes: gapMinutes });
      }
    }

    return freeSlots;
  }

  /**
   * Generates spoken agenda briefing for a specific day
   */
  public generateDailyAgendaSummary(date: Date = new Date()): string {
    const events = this.getEventsForDay(date);
    if (events.length === 0) {
      return 'You have a completely open calendar with no scheduled appointments today.';
    }

    const items = events.map(e => {
      const timeStr = new Date(e.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      return `${e.title} at ${timeStr}`;
    });

    return `You have ${events.length} appointments scheduled: ${items.join(', ')}.`;
  }

  public clear(): void {
    this.events.clear();
    this.seedDefaultAgenda();
  }
}

export const liveCalendarService = new LiveCalendarService();
