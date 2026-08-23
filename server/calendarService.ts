import { CalendarAppointment, ContactPerson } from '../src/types';
import { db } from './db';

export function parseAppointmentFromSpeech(speechText: string): {
  appointment: CalendarAppointment;
  conflict: boolean;
  conflictDetails?: string;
} {
  const now = new Date('2026-08-22T10:00:00.000Z');
  
  // Extract Person
  let attendee: ContactPerson | undefined;
  const contacts = db.getContacts();
  for (const c of contacts) {
    if (speechText.toLowerCase().includes(c.name.toLowerCase().split(' ')[0])) {
      attendee = c;
      break;
    }
  }

  // Extract Title
  let title = 'Executive Strategy Sync';
  if (attendee) {
    title = `Meeting with ${attendee.name}`;
  }
  if (/dentist|doctor|medical/i.test(speechText)) title = 'Medical Appointment';
  else if (/pricing|financial|audit/i.test(speechText)) title = 'Financial & Pricing Review';
  else if (/product|roadmap|sprint/i.test(speechText)) title = 'Product & AI Roadmap Review';
  else if (/dinner|lunch|coffee/i.test(speechText)) title = `Lunch with ${attendee?.name || 'Partner'}`;

  // Default target date computation (relative to current time)
  let targetDate = new Date(now);
  let hour = 14; // 2 PM default
  let minute = 0;

  // Day resolution
  if (/tomorrow/i.test(speechText)) {
    targetDate.setDate(targetDate.getDate() + 1);
  } else if (/tuesday/i.test(speechText)) {
    targetDate.setDate(targetDate.getDate() + ((2 + 7 - targetDate.getDay()) % 7 || 7));
  } else if (/wednesday/i.test(speechText)) {
    targetDate.setDate(targetDate.getDate() + ((3 + 7 - targetDate.getDay()) % 7 || 7));
  } else if (/thursday/i.test(speechText)) {
    targetDate.setDate(targetDate.getDate() + ((4 + 7 - targetDate.getDay()) % 7 || 7));
  } else if (/friday/i.test(speechText)) {
    targetDate.setDate(targetDate.getDate() + ((5 + 7 - targetDate.getDay()) % 7 || 7));
  } else if (/monday/i.test(speechText)) {
    targetDate.setDate(targetDate.getDate() + ((1 + 7 - targetDate.getDay()) % 7 || 7));
  } else {
    targetDate.setDate(targetDate.getDate() + 2);
  }

  // Time resolution (e.g. "at 10 am", "at 3 pm", "14:00")
  const timeMatch = speechText.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (timeMatch) {
    let parsedHour = parseInt(timeMatch[1], 10);
    const parsedMin = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const ampm = timeMatch[3]?.toLowerCase();

    if (ampm === 'pm' && parsedHour < 12) parsedHour += 12;
    if (ampm === 'am' && parsedHour === 12) parsedHour = 0;
    if (!ampm && parsedHour <= 6) parsedHour += 12; // assume afternoon for small numbers like 2, 3, 4

    hour = parsedHour;
    minute = parsedMin;
  }

  targetDate.setUTCHours(hour, minute, 0, 0);
  const startDateStr = targetDate.toISOString();

  // Duration: default 45 mins
  const endDate = new Date(targetDate.getTime() + 45 * 60 * 1000);
  const endDateStr = endDate.toISOString();

  // Conflict Detection
  const existing = db.getAppointments();
  const conflictingApt = existing.find(a => {
    if (a.status === 'cancelled') return false;
    const aStart = new Date(a.startDateTime).getTime();
    const aEnd = new Date(a.endDateTime).getTime();
    const tStart = targetDate.getTime();
    const tEnd = endDate.getTime();
    return (tStart < aEnd && tEnd > aStart);
  });

  const attendeesList = attendee 
    ? [{ name: attendee.name, email: attendee.email || 'attendee@example.com' }]
    : [{ name: 'Team Member', email: 'team@example.com' }];

  // Google Calendar URL Generator
  const gcalFormat = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');
  const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${gcalFormat(targetDate)}/${gcalFormat(endDate)}&details=${encodeURIComponent('Coordinated automatically by Executive AI Assistant')}&location=${encodeURIComponent('Google Meet / Virtual Bridge')}`;

  const appointment: CalendarAppointment = {
    id: 'apt-' + Date.now().toString(36),
    title,
    startDateTime: startDateStr,
    endDateTime: endDateStr,
    location: 'Google Meet / Virtual Bridge',
    attendees: attendeesList,
    description: `Discussion topic: ${speechText}`,
    status: 'confirmed',
    googleCalendarUrl: gcalUrl
  };

  return {
    appointment,
    conflict: !!conflictingApt,
    conflictDetails: conflictingApt ? `Overlaps with "${conflictingApt.title}" (${new Date(conflictingApt.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : undefined
  };
}

// iCalendar (RFC 5545) Exporter for Apple Calendar & Outlook
export function generateICSString(apt: CalendarAppointment): string {
  const formatICSDate = (isoStr: string) => {
    return new Date(isoStr).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Executive AI Personal Assistant//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${apt.id}@assistant.executive.ai`,
    `DTSTAMP:${formatICSDate(new Date().toISOString())}`,
    `DTSTART:${formatICSDate(apt.startDateTime)}`,
    `DTEND:${formatICSDate(apt.endDateTime)}`,
    `SUMMARY:${apt.title}`,
    `DESCRIPTION:${(apt.description || '').replace(/\n/g, '\\n')}`,
    `LOCATION:${apt.location || 'Virtual Bridge'}`,
    `STATUS:${apt.status.toUpperCase()}`,
    ...apt.attendees.map(a => `ATTENDEE;CN=${a.name};ROLE=REQ-PARTICIPANT:mailto:${a.email}`),
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

export function generateFullCalendarICS(appointments: CalendarAppointment[]): string {
  const formatICSDate = (isoStr: string) => {
    return new Date(isoStr).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const activeApts = appointments.filter(a => a.status !== 'cancelled');

  const events = activeApts.map(apt => [
    'BEGIN:VEVENT',
    `UID:${apt.id}@assistant.executive.ai`,
    `DTSTAMP:${formatICSDate(new Date().toISOString())}`,
    `DTSTART:${formatICSDate(apt.startDateTime)}`,
    `DTEND:${formatICSDate(apt.endDateTime)}`,
    `SUMMARY:${apt.title}`,
    `DESCRIPTION:${(apt.description || '').replace(/\n/g, '\\n')}`,
    `LOCATION:${apt.location || 'Virtual Bridge'}`,
    `STATUS:${apt.status.toUpperCase()}`,
    'END:VEVENT'
  ].join('\r\n'));

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Executive AI Personal Assistant//EN',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:Executive Assistant AI Feed',
    ...events,
    'END:VCALENDAR'
  ].join('\r\n');
}
