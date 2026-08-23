import { ActionCard, ActionIntentType, TaskItem, ContactPerson } from '../src/types';
import { db } from './db';
import { draftEmailFromSpeech } from './emailService';
import { parseAppointmentFromSpeech } from './calendarService';
import { generateAutomationBlueprint } from './automationEngine';

export function parseIntentFromSpeech(speechText: string): ActionCard {
  const text = speechText.trim();
  const textLower = text.toLowerCase();
  const cardId = 'ac-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5);
  const nowStr = new Date().toISOString();

  // 0. Compound Multi-Intent Check (e.g. Schedule meeting AND draft email)
  const hasCalendar = /(book|schedule|set\s+up|create)\s+([\w\s]+\s+)?(appointment|meeting|call|session|sync|lunch|dinner)|meet\s+with/i.test(textLower);
  const hasEmail = /(write|send|draft|compose)\s+([\w\s]+\s+)?(email|mail|message)\s+to|^email\s+|email\s+[a-z]+/i.test(textLower);

  if (hasCalendar && hasEmail && /(and|also|then|,)\s+(draft|send|write|email)/i.test(textLower)) {
    const parts = text.split(/(?:and\s+also|and\s+then|and\s+draft|and\s+send|and\s+email|,\s*also|,\s*then)/i);
    const calPart = parts.find(p => /book|schedule|meet|sync|meeting/i.test(p)) || text;
    const emailPart = parts.find(p => /draft|email|mail|send|write/i.test(p)) || text;

    const { appointment } = parseAppointmentFromSpeech(calPart);
    db.createAppointment(appointment);

    const emailDraft = draftEmailFromSpeech(emailPart);
    db.saveToDisk();

    return {
      id: cardId,
      intent: 'calendar_booking',
      title: `Coordinated: Meeting + Email Draft`,
      description: `📅 ${appointment.title} (${new Date(appointment.startDateTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}) • 📧 Draft to ${emailDraft.toName}`,
      spokenResponse: `I have booked "${appointment.title}" and drafted a confirmation email to ${emailDraft.toName}. Both are ready on your screen.`,
      status: 'confirmed',
      createdAt: nowStr,
      calendarData: appointment,
      emailData: emailDraft
    };
  }

  // 1. Email Draft Intent
  if (/(write|send|draft|compose)\s+([\w\s]+\s+)?(email|mail|message)\s+to/i.test(textLower) ||
      /^email\s+/i.test(textLower)) {
    const emailDraft = draftEmailFromSpeech(text);
    db.saveToDisk();

    return {
      id: cardId,
      intent: 'email_draft',
      title: `Draft Email to ${emailDraft.toName}`,
      description: `Subject: "${emailDraft.subject}" (${emailDraft.toEmail})`,
      spokenResponse: `I've prepared a draft email to ${emailDraft.toName} regarding ${emailDraft.subject}. You can review it on your screen and tap send.`,
      status: 'pending',
      createdAt: nowStr,
      emailData: emailDraft
    };
  }

  // 2. Calendar Booking Intent
  if (/(book|schedule|set\s+up|create)\s+([\w\s]+\s+)?(appointment|meeting|call|session|sync|lunch|dinner)/i.test(textLower) ||
      /^(book|schedule)\s+/i.test(textLower) ||
      /(meet\s+with|see\s+the\s+doctor|see\s+the\s+dentist)/i.test(textLower) ||
      (/(appointment|meeting|sync|call)\s+with\s+[\w\s]+\s+(at|on|next|tomorrow)/i.test(textLower))) {
    const { appointment, conflict, conflictDetails } = parseAppointmentFromSpeech(text);
    db.createAppointment(appointment);

    const spoken = conflict
      ? `I've scheduled "${appointment.title}" for ${new Date(appointment.startDateTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at ${new Date(appointment.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, but note that there is a schedule overlap: ${conflictDetails}.`
      : `I have booked "${appointment.title}" for ${new Date(appointment.startDateTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at ${new Date(appointment.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;

    return {
      id: cardId,
      intent: 'calendar_booking',
      title: appointment.title,
      description: `${new Date(appointment.startDateTime).toLocaleString()} • ${appointment.location} ${conflict ? '⚠️ (Schedule Conflict)' : '✅'}`,
      spokenResponse: spoken,
      status: 'confirmed',
      createdAt: nowStr,
      calendarData: appointment
    };
  }

  // 3. Calendar Reschedule / Cancel Intent
  if (/reschedule|move|postpone|cancel\s+(the\s+)?(appointment|meeting|sync)/i.test(textLower)) {
    const appointments = db.getAppointments();
    const targetApt = appointments.find(a => a.status === 'confirmed');

    if (targetApt) {
      if (/cancel/i.test(textLower)) {
        db.updateAppointment(targetApt.id, { status: 'cancelled' });
        return {
          id: cardId,
          intent: 'calendar_cancel',
          title: `Cancelled: ${targetApt.title}`,
          description: `Appointment marked cancelled in your schedule.`,
          spokenResponse: `I have cancelled "${targetApt.title}" from your calendar.`,
          status: 'executed',
          createdAt: nowStr,
          calendarData: { ...targetApt, status: 'cancelled' }
        };
      } else {
        // Reschedule 24h later
        const newStart = new Date(new Date(targetApt.startDateTime).getTime() + 24 * 60 * 60 * 1000).toISOString();
        const newEnd = new Date(new Date(targetApt.endDateTime).getTime() + 24 * 60 * 60 * 1000).toISOString();
        const updated = db.updateAppointment(targetApt.id, { startDateTime: newStart, endDateTime: newEnd })!;
        return {
          id: cardId,
          intent: 'calendar_reschedule',
          title: `Rescheduled: ${updated.title}`,
          description: `Moved to ${new Date(newStart).toLocaleString()}`,
          spokenResponse: `I moved "${updated.title}" to ${new Date(newStart).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at ${new Date(newStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          status: 'confirmed',
          createdAt: nowStr,
          calendarData: updated
        };
      }
    }
  }

  // 4. Call / Phone Dial Intent
  if (/call|dial|phone|ring\s+/i.test(textLower)) {
    let contact: ContactPerson | undefined;
    const contacts = db.getContacts();
    for (const c of contacts) {
      if (textLower.includes(c.name.toLowerCase().split(' ')[0])) {
        contact = c;
        break;
      }
    }

    const name = contact ? contact.name : text.replace(/^call\s+/i, '');
    const phone = contact ? (contact.phone || '+1 (555) 019-2834') : '+1 (555) 019-2834';

    return {
      id: cardId,
      intent: 'call_contact',
      title: `Call ${name}`,
      description: `Phone: ${phone} • Tap to dial`,
      spokenResponse: `Connecting you with ${name} on ${phone}.`,
      status: 'pending',
      createdAt: nowStr,
      contactData: contact || { id: 'c-custom', name, phone }
    };
  }

  // 5. Automation / Task Creation Intent (Default & Fallback)
  // Classify category
  let category: TaskItem['category'] = 'Tech/Dev';
  if (/invoice|receipt|finance|tax|accounting|revenue|stripe/i.test(textLower)) category = 'Finance';
  else if (/marketing|sales|lead|growth|campaign/i.test(textLower)) category = 'Marketing & Sales';
  else if (/client|customer|deal|contract|partner/i.test(textLower)) category = 'Client Projects';
  else if (/strategy|business|competitor|pricing|roadmap/i.test(textLower)) category = 'Business & Strategy';
  else if (/personal|health|gym|doctor|home|grocer/i.test(textLower)) category = 'Personal & Health';
  else if (/admin|ops|vendor|legal/i.test(textLower)) category = 'Operations & Admin';

  // Feasibility
  let feasibility: TaskItem['feasibility'] = 'ai_automated';
  let feasibilityReasoning = '100% executable by AI agent via scripts, web APIs, or automation pipeline.';
  let assignee: TaskItem['assignee'] = 'AI Agent';
  let hoursInvested = 3;
  let hoursWonBack = 12;

  if (/meet|call|talk|personally|negotiat|doctor|physical|sign\s+paper/i.test(textLower)) {
    feasibility = 'human_only';
    feasibilityReasoning = 'Requires human physical presence, relationship nuance, or executive signature.';
    assignee = 'Andrew';
    hoursInvested = 0.5;
    hoursWonBack = 4;
  } else if (/draft|review|approve|collaborat|signoff/i.test(textLower)) {
    feasibility = 'hybrid';
    feasibilityReasoning = 'AI prepares the execution draft; human conducts final review and approval.';
    assignee = 'Hybrid';
    hoursInvested = 1.5;
    hoursWonBack = 8;
  }

  const blueprint = generateAutomationBlueprint(text, text, category);

  const newTask: TaskItem = {
    id: 'task-' + Date.now().toString(36),
    title: text.length > 70 ? text.substring(0, 67) + '...' : text,
    description: text,
    category,
    userPriority: /urgent|asap|critical|emergency/i.test(textLower) ? 'urgent' : /high|important/i.test(textLower) ? 'high' : 'medium',
    aiPriority: feasibility === 'ai_automated' ? 'critical' : 'high',
    priorityRationale: `High automation leverage (${blueprint.recurringHoursSavedPerMonth}h/mo saved with ${blueprint.estimatedHoursToBuild}h build time).`,
    feasibility,
    feasibilityReasoning,
    valueScore: 8,
    estimatedValue: '$1,200/mo Value',
    manualHoursEstimate: 8,
    automationHoursInvested: hoursInvested,
    timeWonBackHours: hoursWonBack,
    status: feasibility === 'ai_automated' ? 'in_progress' : 'backlog',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    durationDays: 5,
    progressPercent: 20,
    dependencies: [],
    assignee,
    automationBlueprint: blueprint,
    createdAt: nowStr,
    updatedAt: nowStr
  };

  db.createTask(newTask);

  return {
    id: cardId,
    intent: 'task_create',
    title: `Task Logged: ${newTask.title}`,
    description: `Category: ${category} • Feasibility: ${feasibility === 'ai_automated' ? '🤖 AI Automated' : feasibility === 'hybrid' ? '⚡ Hybrid' : '👤 Human'}`,
    spokenResponse: `I've analyzed your request and logged it to the Monday.com Work Hub under ${category}. Feasibility is assessed as ${feasibility.replace('_', ' ')}. Blueprint generated!`,
    status: 'confirmed',
    createdAt: nowStr,
    taskData: newTask
  };
}
