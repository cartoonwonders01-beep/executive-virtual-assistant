import { ActionCard, ActionIntentType, TaskItem, ContactPerson } from '../src/types';
import { db } from './db';
import { draftEmailFromSpeech } from './emailService';
import { parseAppointmentFromSpeech } from './calendarService';
import { generateAutomationBlueprint } from './automationEngine';
import { intelligentAdvisor } from './intelligentAdvisor';

export function parseIntentFromSpeech(speechText: string): ActionCard {
  const text = speechText.trim();
  const textLower = text.toLowerCase();
  const cardId = 'ac-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5);
  const nowStr = new Date().toISOString();

  // -------------------------------------------------------------------------
  // 0. High-IQ Knowledge, Q&A & Strategic Solution Engine
  // (Analyse questions, inquiries, strategies, explanations, advice)
  // -------------------------------------------------------------------------
  const isExplicitTaskCommand = /^(add\s+task|create\s+task|log\s+task|put\s+on\s+my\s+board|new\s+task|automate\s+task)\b/i.test(textLower);
  
  if (!isExplicitTaskCommand && intelligentAdvisor.isQuestionOrInquiry(text)) {
    const solution = intelligentAdvisor.solve(text);
    const formattedDesc = [
      solution.summary,
      '',
      '**Strategic Insights:**',
      ...solution.keyInsights.map(k => `• ${k}`),
      '',
      '**Execution Steps:**',
      ...solution.actionSteps.map((s, i) => `${i + 1}. ${s}`),
      solution.proTip ? `\n💡 **Executive Pro-Tip:** ${solution.proTip}` : '',
      solution.formulaOrCode ? `\n\`\`\`\n${solution.formulaOrCode}\n\`\`\`` : ''
    ].filter(Boolean).join('\n');

    return {
      id: cardId,
      intent: 'knowledge_qa',
      title: solution.title,
      description: formattedDesc,
      spokenResponse: solution.spokenResponse,
      status: 'executed',
      createdAt: nowStr
    };
  }

  // -------------------------------------------------------------------------
  // 1. Adaptive Memory & Self-Learning ("Remember that...", "What is my...")
  // -------------------------------------------------------------------------
  const isLearnMemory = /^(remember\s+that|remember\s+|learn\s+that|don't\s+forget\s+that|save\s+memory[:\s]+)/i.test(textLower);
  if (isLearnMemory) {
    const memoryContent = text.replace(/^(remember\s+that|remember\s+|learn\s+that|don't\s+forget\s+that|save\s+memory[:\s]+)/i, '').trim();
    let key = memoryContent;
    let value = memoryContent;

    if (/is|are|likes|prefers|has|born|birthday/i.test(memoryContent)) {
      const parts = memoryContent.split(/\s+(?:is|are|likes|prefers|has|was)\s+/i);
      if (parts.length >= 2) {
        key = parts[0].trim();
        value = parts.slice(1).join(' ').trim();
      }
    }

    const saved = db.saveMemory(key, memoryContent);
    const spoken = `I've committed that to memory: "${memoryContent}". You can ask me about it anytime.`;

    return {
      id: cardId,
      intent: 'memory_learn',
      title: `Learned Memory: ${key}`,
      description: `🧠 "${memoryContent}" (Saved to Executive Memory)`,
      spokenResponse: spoken,
      status: 'executed',
      createdAt: nowStr
    };
  }

  const isRecallMemory = /^(what\s+is|what\s+was|when\s+is|recall|what\s+did\s+i\s+ask\s+you\s+to\s+remember|tell\s+me\s+about|do\s+you\s+remember|list\s+my\s+memories)/i.test(textLower) && 
    !/weather|time|date|calendar|schedule|email|task/i.test(textLower);

  if (isRecallMemory) {
    const query = text.replace(/^(what\s+is|what\s+was|when\s+is|recall|what\s+did\s+i\s+ask\s+you\s+to\s+remember|tell\s+me\s+about|do\s+you\s+remember|list\s+my\s+memories)\s*/i, '').replace(/[?.]/g, '').trim();
    const found = query ? db.findMemory(query) : null;
    const allMemories = db.getMemories();

    if (found) {
      const spoken = `According to my memory records: ${found.value}`;
      return {
        id: cardId,
        intent: 'memory_recall',
        title: `Recalled: ${found.key}`,
        description: `🧠 ${found.value}`,
        spokenResponse: spoken,
        status: 'executed',
        createdAt: nowStr
      };
    } else if (allMemories.length > 0 && (!query || /remember|memories/i.test(textLower))) {
      const listText = allMemories.slice(0, 3).map(m => m.value).join('; ');
      const spoken = `Here is what I remember: ${listText}`;
      return {
        id: cardId,
        intent: 'memory_recall',
        title: `Executive Memory Log (${allMemories.length} items)`,
        description: allMemories.map(m => `• ${m.value}`).join('\n'),
        spokenResponse: spoken,
        status: 'executed',
        createdAt: nowStr
      };
    }
  }

  // -------------------------------------------------------------------------
  // 2. Timers & Alarms ("Set a timer for 15 minutes", "Start 5 min timer")
  // -------------------------------------------------------------------------
  if (/(timer|alarm|stopwatch)/i.test(textLower) && /(set|start|create|run|for|\d+)/i.test(textLower)) {
    let durationSeconds = 300; // default 5 min
    const minMatch = textLower.match(/(\d+)\s*(?:minute|min|m)/i);
    const secMatch = textLower.match(/(\d+)\s*(?:second|sec|s)/i);
    const hourMatch = textLower.match(/(\d+)\s*(?:hour|hr|h)/i);

    if (minMatch) durationSeconds = parseInt(minMatch[1], 10) * 60;
    else if (secMatch) durationSeconds = parseInt(secMatch[1], 10);
    else if (hourMatch) durationSeconds = parseInt(hourMatch[1], 10) * 3600;

    const label = text.replace(/^(set\s+a\s+timer\s+for|start\s+timer\s+for|set\s+timer\s+for|timer\s+for)\s*/i, '').trim() || `${Math.round(durationSeconds / 60)} min timer`;
    const timer = db.createTimer(label, durationSeconds);
    const mins = Math.floor(durationSeconds / 60);
    const secs = durationSeconds % 60;
    const timeFormatted = mins > 0 ? `${mins} minute${mins > 1 ? 's' : ''}` : `${secs} seconds`;
    const spoken = `Timer set for ${timeFormatted}. Starting now.`;

    return {
      id: cardId,
      intent: 'timer_alarm',
      title: `⏱️ ${label}`,
      description: `Counting down ${timeFormatted} • Active in background`,
      spokenResponse: spoken,
      status: 'executed',
      createdAt: nowStr
    };
  }

  // -------------------------------------------------------------------------
  // 3. Reminders ("Remind me to call accountant at 5 PM")
  // -------------------------------------------------------------------------
  if (/^remind\s+me\s+to|^create\s+reminder|^set\s+a\s+reminder/i.test(textLower)) {
    const reminderContent = text.replace(/^(remind\s+me\s+to|create\s+reminder[:\s]+|set\s+a\s+reminder\s+to)\s*/i, '').trim();
    const reminder = db.createReminder(reminderContent, new Date(Date.now() + 3600000).toISOString());
    const spoken = `I've set a reminder to: "${reminderContent}".`;

    return {
      id: cardId,
      intent: 'reminder_create',
      title: `🔔 Reminder: ${reminderContent}`,
      description: `Due in 1 hour • Notification queued`,
      spokenResponse: spoken,
      status: 'confirmed',
      createdAt: nowStr
    };
  }

  // -------------------------------------------------------------------------
  // 4. Calculations, Conversions & Math ("What is 15% of $850?", "Calculate 24 * 7")
  // -------------------------------------------------------------------------
  if (/^(what\s+is|calculate|how\s+much\s+is|compute)\s+/i.test(textLower) && (/\d+\s*%/i.test(textLower) || /[\d+*\/^-]/.test(textLower)) ||
      /\d+\s*%\s*(?:of)/i.test(textLower) ||
      /\d+\s*[+\-*\/]\s*\d+/.test(textLower)) {
    try {
      // Percentage calculation: "15% of 850"
      const pctMatch = textLower.match(/(\d+(?:\.\d+)?)\s*%\s*(?:of)\s*\$?(\d+(?:\.\d+)?)/i);
      let answer = '';
      if (pctMatch) {
        const pct = parseFloat(pctMatch[1]);
        const val = parseFloat(pctMatch[2]);
        const res = (pct / 100) * val;
        answer = `${pct}% of ${val} is ${res.toLocaleString()}`;
      } else {
        const expr = textLower.replace(/^(what\s+is|calculate|how\s+much\s+is|compute)\s*/i, '').replace(/[$]/g, '').trim();
        // Safe math evaluator
        const sanitized = expr.replace(/[^0-9+\-*/().\s]/g, '');
        if (sanitized) {
          const evalRes = new Function(`return (${sanitized})`)();
          answer = `${expr} = ${evalRes}`;
        }
      }

      if (answer) {
        return {
          id: cardId,
          intent: 'calc_query',
          title: `🔢 Calculation Result`,
          description: answer,
          spokenResponse: answer,
          status: 'executed',
          createdAt: nowStr
        };
      }
    } catch (calcErr) {
      // Pass through if calculation parse fails
    }
  }

  // -------------------------------------------------------------------------
  // 5. Weather & Forecast Inquiries ("What's the weather today?", "Weather in London")
  // -------------------------------------------------------------------------
  if (/(weather|forecast|temperature|will\s+it\s+rain|is\s+it\s+sunny)/i.test(textLower)) {
    let location = 'your area';
    const locMatch = textLower.match(/(?:in|for|at)\s+([a-zA-Z\s]+)/i);
    if (locMatch && locMatch[1].trim()) {
      location = locMatch[1].trim();
    }
    const weatherSummary = `In ${location}, it is currently 22°C (72°F) and mostly sunny with clear skies and a light breeze.`;

    return {
      id: cardId,
      intent: 'weather_query',
      title: `☀️ Weather Forecast: ${location}`,
      description: weatherSummary,
      spokenResponse: weatherSummary,
      status: 'executed',
      createdAt: nowStr
    };
  }

  // -------------------------------------------------------------------------
  // 6. Smart Notes Ingestion ("Take a note: ...", "Save note: ...")
  // -------------------------------------------------------------------------
  if (/^(take\s+a\s+note|save\s+note|write\s+this\s+down|note\s+down)[:\s]+/i.test(textLower)) {
    const noteText = text.replace(/^(take\s+a\s+note|save\s+note|write\s+this\s+down|note\s+down)[:\s]*/i, '').trim();
    const article = db.createWikiArticle({
      id: 'wiki-note-' + Date.now().toString(36),
      slug: 'note-' + Date.now().toString(36),
      title: `Executive Note: ${noteText.substring(0, 35)}...`,
      category: 'Executive Actions',
      summary: noteText,
      content: `## Quick Note\n\n${noteText}\n\n*Captured via Voice AI on ${new Date().toLocaleString()}*`,
      tags: ['Voice Note', 'Quick Capture'],
      lastUpdated: nowStr,
      author: 'Andrew'
    });

    const spoken = `I've saved your note: "${noteText.substring(0, 45)}". It is filed in your Living Wiki.`;
    return {
      id: cardId,
      intent: 'note_save',
      title: `📝 Note Saved: ${noteText.substring(0, 35)}...`,
      description: noteText,
      spokenResponse: spoken,
      status: 'executed',
      createdAt: nowStr
    };
  }

  // -------------------------------------------------------------------------
  // 7. Compound Multi-Intent Check (e.g. Schedule meeting AND draft email)
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // 8. Email Draft Intent (Including Wife, Sarah, David, Celine, etc.)
  // -------------------------------------------------------------------------
  if (/(write|send|draft|compose)\s+([\w\s]+\s+)?(email|mail|message)\s+to/i.test(textLower) ||
      /^email\s+/i.test(textLower) ||
      (/(wife|celine|emily|sarah|david)/i.test(textLower) && /love|loved|saying|tell/i.test(textLower))) {
    const emailDraft = draftEmailFromSpeech(text);
    db.saveToDisk();

    const isWife = emailDraft.toName.toLowerCase().includes('celine') || emailDraft.toName.toLowerCase().includes('emily') || emailDraft.toName.toLowerCase().includes('wife');
    const spoken = isWife
      ? `I've prepared and sent an email to ${emailDraft.toName} saying you love her ❤️.`
      : `I've prepared a draft email to ${emailDraft.toName} regarding ${emailDraft.subject}. You can review it on your screen.`;

    return {
      id: cardId,
      intent: 'email_draft',
      title: `${isWife ? 'Sent Email' : 'Draft Email'} to ${emailDraft.toName}`,
      description: `Subject: "${emailDraft.subject}" (${emailDraft.toEmail})`,
      spokenResponse: spoken,
      status: isWife ? 'confirmed' : 'pending',
      createdAt: nowStr,
      emailData: emailDraft
    };
  }

  // -------------------------------------------------------------------------
  // 9. Calendar Booking Intent
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // 10. Calendar Reschedule / Cancel Intent
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // 11. Call / Phone Dial Intent
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // 12. Automation / Work Hub Task Creation Intent (Default & Fallback)
  // -------------------------------------------------------------------------
  let category: TaskItem['category'] = 'Tech/Dev';
  if (/invoice|receipt|finance|tax|accounting|revenue|stripe/i.test(textLower)) category = 'Finance';
  else if (/marketing|sales|lead|growth|campaign/i.test(textLower)) category = 'Marketing & Sales';
  else if (/client|customer|deal|contract|partner/i.test(textLower)) category = 'Client Projects';
  else if (/strategy|business|competitor|pricing|roadmap/i.test(textLower)) category = 'Business & Strategy';
  else if (/personal|health|gym|doctor|home|grocer/i.test(textLower)) category = 'Personal & Health';
  else if (/admin|ops|vendor|legal/i.test(textLower)) category = 'Operations & Admin';

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
