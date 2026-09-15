import { eveJournalStore, JournalEntry, JournalEntryType, HabitStreakStats } from '../brain/eveJournalStore';
import { liveCalendarService } from './liveCalendarService';
import { toolDispatcher } from './toolDispatcher';
import { telemetry } from './telemetryLogger';

export interface DebriefSummary {
  entry: JournalEntry;
  spokenDebrief: string;
  streak: HabitStreakStats;
}

export class JournalService {
  constructor() {
    this.registerTools();
  }

  private registerTools(): void {
    toolDispatcher.registerTool(
      {
        name: 'record_executive_journal',
        description: 'Records an executive daily reflection, habit check-in, win, or open loop.',
        parameters: {
          type: 'object',
          properties: {
            win: { type: 'string', description: 'A win or completed achievement' },
            openLoop: { type: 'string', description: 'An unresolved task or open loop to carry forward' },
            energyScore: { type: 'number', description: 'Energy/focus score from 1 to 5' }
          },
          required: ['win']
        }
      },
      async (args) => {
        const entry = await this.recordHabitCheckin(
          args.energyScore || 4,
          args.win,
          args.openLoop
        );
        return { success: true, entryId: entry.id, date: entry.date };
      }
    );

    toolDispatcher.registerTool(
      {
        name: 'query_executive_journal',
        description: 'Queries recent executive journal reflections and habit streak metrics.',
        parameters: {
          type: 'object',
          properties: {
            days: { type: 'number', description: 'Number of past days to inspect (default 5)' }
          }
        }
      },
      async (args) => {
        const recent = await eveJournalStore.getRecentEntries(args.days || 5);
        const streak = await eveJournalStore.computeHabitStreak();
        return {
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          entryCount: recent.length,
          recentEntries: recent.map(r => ({ date: r.date, type: r.type, summary: r.executiveSummary }))
        };
      }
    );
  }

  /**
   * Generates a synthesized executive evening debrief correlating today's agenda with reflections.
   */
  public async generateEveningDebrief(targetDateStr?: string): Promise<DebriefSummary> {
    const date = targetDateStr || new Date().toISOString().slice(0, 10);
    const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();
    const todayEvents = liveCalendarService.getEventsForDay(targetDate);

    const completedItems = todayEvents.map(e => e.title);
    const wins: string[] = [];
    if (completedItems.length > 0) {
      wins.push(`Honored ${completedItems.length} calendar commitments`);
    } else {
      wins.push('Dedicated deep-focus executive work session');
    }

    const openLoops: string[] = [];
    const energyScore = 4;

    const summaryParts: string[] = [
      `Evening debrief for ${date}.`,
      completedItems.length > 0
        ? `You completed ${completedItems.length} scheduled engagements including "${completedItems[0]}".`
        : `Today was dedicated to open strategic deep focus.`,
    ];

    const streak = await eveJournalStore.computeHabitStreak(date);
    const nextStreak = streak.currentStreak + 1;
    summaryParts.push(`Your executive reflection streak is at ${nextStreak} ${nextStreak === 1 ? 'day' : 'days'}.`);

    const executiveSummary = summaryParts.join(' ');

    const entry = await eveJournalStore.saveEntry({
      date,
      type: 'evening_debrief',
      completedItems,
      openLoops,
      wins,
      energyScore,
      executiveSummary
    });

    telemetry.log('event', { action: 'evening_debrief_generated', date, eventCount: completedItems.length });

    return {
      entry,
      spokenDebrief: executiveSummary,
      streak: {
        ...streak,
        currentStreak: nextStreak,
        lastActiveDate: date
      }
    };
  }

  /**
   * Quick habit or win check-in.
   */
  public async recordHabitCheckin(
    energyScore: number,
    win: string,
    openLoop?: string,
    targetDateStr?: string
  ): Promise<JournalEntry> {
    const date = targetDateStr || new Date().toISOString().slice(0, 10);
    const wins = [win];
    const openLoops = openLoop ? [openLoop] : [];

    const summary = `Recorded check-in for ${date}: "${win}" (Energy: ${energyScore}/5).` + 
      (openLoop ? ` Pending open loop: "${openLoop}".` : '');

    const entry = await eveJournalStore.saveEntry({
      date,
      type: 'habit_checkin',
      completedItems: [],
      wins,
      openLoops,
      energyScore,
      executiveSummary: summary
    });

    telemetry.log('event', { action: 'habit_checkin_recorded', date, energyScore });
    return entry;
  }
}

export const journalService = new JournalService();
