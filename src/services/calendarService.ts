// Intelligent Executive Calendar & Schedule Briefing Engine
import { logger } from './loggerService';
import { detectLanguage, SupportedLanguage } from './speechSynthesis';
import { CalendarAppointment } from '../types';

export interface CalendarBriefing {
  totalEvents: number;
  events: CalendarAppointment[];
  summary: string;
  spokenSummary: string;
  nextMeetingTitle?: string;
  nextMeetingTime?: string;
}

export class CalendarService {
  private appointments: CalendarAppointment[] = [
    {
      id: 'apt-1',
      title: 'Q3 Product Strategy & AI Roadmap',
      startDateTime: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(), // 2 hours from now
      endDateTime: new Date(Date.now() + 1000 * 60 * 60 * 3).toISOString(),
      location: 'Google Meet / Virtual',
      attendees: [{ name: 'David Miller', email: 'david.m@cloudscale.io' }],
      description: 'Align on Cloudflare Workers AI pipeline and vector search performance benchmarks.',
      status: 'confirmed',
      googleCalendarUrl: 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Q3+Product+Strategy'
    },
    {
      id: 'apt-2',
      title: 'Executive Operations & Budget Sync',
      startDateTime: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(), // 6 hours from now
      endDateTime: new Date(Date.now() + 1000 * 60 * 60 * 7).toISOString(),
      location: 'Executive Boardroom / Zoom',
      attendees: [{ name: 'Celine Loeuille', email: 'celine.loeuille@gmail.com' }],
      description: 'Review Q3 operational deliverables and marketing inbound pipeline.',
      status: 'confirmed',
      googleCalendarUrl: 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Executive+Operations'
    }
  ];

  public getAppointments(): CalendarAppointment[] {
    return [...this.appointments];
  }

  public addAppointment(apt: CalendarAppointment): void {
    this.appointments.unshift(apt);
    logger.log('success', 'google_sync', `📅 New calendar event scheduled: "${apt.title}"`);
  }

  /**
   * Generates intelligent, human-like schedule briefings in the user's spoken language
   */
  public getScheduleBriefing(query: string = ''): CalendarBriefing {
    const lang = detectLanguage(query);
    const isTomorrow = /tomorrow|demain|morgen|mañana/i.test(query);
    const count = this.appointments.length;

    const first = this.appointments[0];
    const second = this.appointments[1];

    let spokenSummary = '';

    if (lang === 'fr') {
      if (isTomorrow) {
        spokenSummary = `Pour demain, votre agenda prévoit 1 session clé : ${first.title} à 10h00 avec ${first.attendees[0].name}. L'après-midi reste disponible pour le travail de fond.`;
      } else {
        spokenSummary = `Vous avez ${count} événements à votre calendrier aujourd'hui : Tout d'abord "${first.title}" avec ${first.attendees[0].name} à 14h00, suivi de "${second.title}" à 17h00. Votre matinée reste dégagée pour vos priorités stratégiques.`;
      }
    } else if (lang === 'de') {
      if (isTomorrow) {
        spokenSummary = `Morgen haben Sie 1 wichtigen Termin: ${first.title} um 10:00 Uhr mit ${first.attendees[0].name}. Der Nachmittag steht für Deep-Work zur Verfügung.`;
      } else {
        spokenSummary = `Sie haben heute ${count} Termine im Kalender: Zuerst "${first.title}" mit ${first.attendees[0].name} um 14:00 Uhr, gefolgt von "${second.title}" um 17:00 Uhr.`;
      }
    } else if (lang === 'es') {
      if (isTomorrow) {
        spokenSummary = `Mañana tienes 1 reunión programada: ${first.title} a las 10:00 con ${first.attendees[0].name}.`;
      } else {
        spokenSummary = `Tienes ${count} eventos en tu calendario hoy: Primero "${first.title}" con ${first.attendees[0].name} a las 14:00, y luego "${second.title}" a las 17:00.`;
      }
    } else {
      if (isTomorrow) {
        spokenSummary = `For tomorrow, you have 1 meeting scheduled: "${first.title}" at 10:00 AM with ${first.attendees[0].name}. The rest of your day is open for deep work.`;
      } else {
        spokenSummary = `You have ${count} events on your schedule today: First, the "${first.title}" with ${first.attendees[0].name} at 2:00 PM, followed by the "${second.title}" at 5:00 PM. Your morning is clear for strategic execution.`;
      }
    }

    const summary = `### 📅 Executive Calendar & Schedule\n\n` +
      `**Confirmed Appointments:**\n\n` +
      this.appointments.map(a => 
        `• **${a.title}**\n` +
        `  - **Time**: ${new Date(a.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n` +
        `  - **Location**: ${a.location}\n` +
        `  - **Attendees**: ${a.attendees.map(att => `${att.name} (${att.email})`).join(', ')}\n` +
        `  - **Context**: ${a.description}`
      ).join('\n\n') +
      `\n\n**Executive Overview**: ${spokenSummary}`;

    logger.log('info', 'google_sync', `📅 Calendar briefing generated (${count} events found).`);

    return {
      totalEvents: count,
      events: this.appointments,
      summary,
      spokenSummary,
      nextMeetingTitle: first?.title,
      nextMeetingTime: '2:00 PM'
    };
  }
}

export const calendarService = new CalendarService();
