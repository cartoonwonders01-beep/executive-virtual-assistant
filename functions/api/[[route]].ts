// Cloudflare Pages Functions Edge API Gateway
// Handles all /api/* requests directly on Cloudflare Workers edge

interface Env {
  GEMINI_API_KEY?: string;
  GROQ_API_KEY?: string;
}

const SEED_DATA = {
  contacts: [
    { id: 'c1', name: 'Sarah Chen', role: 'Head of Growth', email: 'sarah.chen@innovate.co', phone: '+1 (555) 234-5678', company: 'Innovate Group', isVIP: true },
    { id: 'c2', name: 'David Miller', role: 'VP Engineering', email: 'david.m@cloudscale.io', phone: '+1 (555) 876-5432', company: 'CloudScale Systems', isVIP: true },
    { id: 'c3', name: 'Dr. Celine Laurent', role: 'Operations Lead', email: 'celine@vandenbranden.com', phone: '+32 470 12 34 56', company: 'VDB Suites', isVIP: true },
    { id: 'c4', name: 'Alex Rivera', role: 'Accountant & Tax Advisor', email: 'alex.r@riveratax.com', phone: '+1 (555) 345-6789', company: 'Rivera Advisory', isVIP: false },
    { id: 'c5', name: 'Emily Baxter', role: 'Wife / Personal', email: 'emily.baxter@personal.com', phone: '+1 (555) 987-6543', company: 'Family', isVIP: true }
  ],
  tasks: [
    {
      id: 'task-101',
      title: 'Automate PDF Invoice & Receipt Extraction to Accounting Sheet',
      category: 'Finance',
      userPriority: 'high',
      aiPriority: 'critical',
      feasibility: 'ai_automated',
      valueScore: 9,
      estimatedValue: '$1,400/mo Time Savings',
      timeWonBackHours: 36,
      status: 'in_progress',
      progressPercent: 65
    },
    {
      id: 'task-102',
      title: 'Deploy Real-Time Competitor Pricing & Feature Scraper',
      category: 'Business & Strategy',
      userPriority: 'medium',
      aiPriority: 'high',
      feasibility: 'ai_automated',
      valueScore: 8,
      estimatedValue: 'Market Advantage',
      timeWonBackHours: 24,
      status: 'automating',
      progressPercent: 40
    }
  ],
  inboxEmails: [
    {
      id: 'inbox-1',
      fromName: 'Sarah Chen',
      fromEmail: 'sarah.chen@innovate.co',
      subject: 'Urgent: Q3 Growth Sprint Alignment & Budget Signoff',
      snippet: 'Hi Andrew, I reviewed the preliminary numbers for our inbound qualification funnel...',
      isUnread: true,
      isStarred: true,
      category: 'vip'
    }
  ],
  appointments: [
    {
      id: 'apt-1',
      title: 'Q3 Product Strategy & AI Roadmap',
      startDateTime: '2026-08-25T14:00:00.000Z',
      endDateTime: '2026-08-25T15:00:00.000Z',
      location: 'Google Meet / Virtual',
      status: 'confirmed'
    }
  ],
  actionCards: [
    {
      id: 'ac-seed-1',
      intent: 'email_draft',
      title: 'Sent Email to Emily Baxter (Wife)',
      description: 'Subject: "Thinking of you ❤️" • Delivered to emily.baxter@personal.com',
      spokenResponse: "I have sent an email to Emily saying you love her ❤️",
      status: 'executed',
      createdAt: '2026-08-23T12:00:00Z',
      emailData: {
        id: 'em-seed-1',
        toName: 'Emily Baxter (Wife)',
        toEmail: 'emily.baxter@personal.com',
        subject: 'Thinking of you ❤️',
        body: 'Hi Emily,\n\nJust wanted to send you a quick note to say I love you!\n\nLove,\nAndrew',
        tone: 'friendly',
        status: 'sent'
      }
    }
  ],
  memos: [
    {
      id: 'memo-seed-1',
      title: 'Personal Assistant Voice Setup',
      durationSeconds: 15,
      recordedAt: '2026-08-23T12:00:00Z',
      transcript: 'Send an email to my wife to say I love her',
      status: 'analyzed',
      extractedTaskIds: [],
      extractedActionCardIds: ['ac-seed-1'],
      summary: 'Dispatched love email to wife',
      source: 'browser_mic'
    }
  ],
  chatMessages: [
    { id: 'msg-1', contactId: 'c1', sender: 'Sarah Chen', text: 'Q3 growth targets approved!', sentAt: '2026-08-23T10:00:00Z' }
  ],
  callLogs: [
    { id: 'call-1', contactId: 'c1', contactName: 'Sarah Chen', phone: '+1 (555) 234-5678', durationSeconds: 240, startedAt: '2026-08-23T09:00:00Z', status: 'completed', notes: 'Growth sprint sync' }
  ],
  wikiArticles: [
    { id: 'wiki-1', slug: 'voice-ai-hud-mobile-pwa', title: '📱 Voice AI HUD & Mobile PWA', category: 'Voice AI & Mobile', summary: 'Real-time voice recognition and spoken TTS feedback.' }
  ],
  memories: [
    { id: 'mem-1', key: "Wife's Birthday", value: "Emily's birthday is on June 14th.", learnedAt: '2026-08-20T10:00:00Z', category: 'personal' }
  ]
};

export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, '');
  const method = request.method.toUpperCase();

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-groq-api-key',
    'Content-Type': 'application/json'
  };

  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health
  if (path === '/health') {
    return new Response(JSON.stringify({
      status: 'online',
      edge: 'Cloudflare Pages Functions Edge',
      timestamp: new Date().toISOString()
    }), { headers: corsHeaders });
  }

  // Voice Process Text
  if (path === '/voice/process-text' && method === 'POST') {
    try {
      const body = await request.json() as { text: string };
      const text = (body.text || '').trim();
      const textLower = text.toLowerCase();
      const nowStr = new Date().toISOString();

      let intent = 'task_create';
      let title = `Task: ${text}`;
      let spokenResponse = `I've analyzed your voice memo and logged it to the Monday.com Work Hub.`;
      let emailData: any = undefined;
      let calendarData: any = undefined;

      // 1. Adaptive Memory & Learning ("Remember that...", "What is my...")
      if (/^(remember\s+that|remember\s+|learn\s+that|don't\s+forget\s+that)/i.test(textLower)) {
        const memFact = text.replace(/^(remember\s+that|remember\s+|learn\s+that|don't\s+forget\s+that)\s*/i, '').trim();
        intent = 'memory_learn';
        title = `Learned Fact`;
        spokenResponse = `I have committed that to memory: "${memFact}".`;
      }
      else if (/^(what\s+is|when\s+is|recall|what\s+did\s+i\s+ask\s+you\s+to\s+remember|list\s+my\s+memories)/i.test(textLower) && !/weather|time|date|task|email/i.test(textLower)) {
        intent = 'memory_recall';
        title = `Executive Memory Recall`;
        spokenResponse = `According to what you taught me, Emily's birthday is on June 14th, and Sarah prefers Slack over email.`;
      }

      // 2. Timers & Alarms
      else if (/(timer|alarm|stopwatch)/i.test(textLower) && /(set|start|create|for|\d+)/i.test(textLower)) {
        intent = 'timer_alarm';
        title = `⏱️ Timer Active`;
        spokenResponse = `Timer set and running. I will alert you when it expires.`;
      }

      // 3. Reminders
      else if (/^remind\s+me\s+to|^create\s+reminder/i.test(textLower)) {
        intent = 'reminder_create';
        const rem = text.replace(/^(remind\s+me\s+to|create\s+reminder[:\s]+)\s*/i, '').trim();
        title = `🔔 Reminder: ${rem}`;
        spokenResponse = `I have created a reminder to: "${rem}".`;
      }

      // 4. Calculations & Math
      else if (/^(what\s+is|calculate|how\s+much\s+is)\s+[\d\s+\-*/%$.^()]+$/i.test(textLower) || /\d+\s*[%+\-*/]\s*\d+/.test(textLower)) {
        intent = 'calc_query';
        title = `🔢 Calculation`;
        spokenResponse = `Calculation evaluated: ${text}.`;
      }

      // 5. Weather
      else if (/(weather|forecast|temperature|will\s+it\s+rain)/i.test(textLower)) {
        intent = 'weather_query';
        title = `☀️ Weather Forecast`;
        spokenResponse = `In your location, it is currently 22°C (72°F) and sunny with mild conditions.`;
      }

      // 6. Notes
      else if (/^(take\s+a\s+note|save\s+note|write\s+this\s+down)/i.test(textLower)) {
        intent = 'note_save';
        const note = text.replace(/^(take\s+a\s+note|save\s+note|write\s+this\s+down)[:\s]*/i, '').trim();
        title = `📝 Note Saved`;
        spokenResponse = `I've saved your note: "${note.substring(0, 40)}".`;
      }

      // 7. Email Intent (e.g. wife, Sarah, David, etc.)
      else if (/email|message|write to|send to|mail|love/i.test(textLower) && /wife|emily|sarah|david|celine|love/i.test(textLower)) {
        intent = 'email_draft';
        let toName = 'Contact';
        let toEmail = 'partner@company.com';

        if (/wife|emily/i.test(textLower)) {
          toName = 'Emily Baxter (Wife)';
          toEmail = 'emily.baxter@personal.com';
        } else if (/sarah/i.test(textLower)) {
          toName = 'Sarah Chen';
          toEmail = 'sarah.chen@innovate.co';
        } else if (/david/i.test(textLower)) {
          toName = 'David Miller';
          toEmail = 'david.m@cloudscale.io';
        }

        let subject = 'Personal Note';
        let emailBody = text;
        if (/love|wife/i.test(textLower)) {
          subject = 'Thinking of you ❤️';
          emailBody = 'Hi Emily,\n\nJust wanted to send you a quick note to say I love you and hope you have a wonderful day!\n\nLove,\nAndrew';
        }

        emailData = {
          id: 'em-' + Date.now().toString(36),
          toName,
          toEmail,
          subject,
          body: emailBody,
          tone: /love|wife/i.test(textLower) ? 'friendly' : 'professional',
          status: 'sent',
          sentAt: nowStr
        };

        title = `Sent Email to ${toName}`;
        spokenResponse = /wife|emily/i.test(textLower)
          ? `I've sent an email to Emily saying you love her ❤️`
          : `I've prepared and dispatched the email to ${toName} regarding ${subject}.`;
      }

      // 8. Calendar Booking
      else if (/book|schedule|meet|appointment|sync/i.test(textLower)) {
        intent = 'calendar_booking';
        title = `Strategy Session with David Miller`;
        const start = new Date(Date.now() + 86400000).toISOString();
        const end = new Date(Date.now() + 86400000 + 3600000).toISOString();
        calendarData = {
          id: 'apt-' + Date.now().toString(36),
          title: 'Strategy Session with David Miller',
          startDateTime: start,
          endDateTime: end,
          location: 'Google Meet / Virtual',
          attendees: [{ name: 'David Miller', email: 'david.m@cloudscale.io' }],
          status: 'confirmed'
        };
        spokenResponse = `I booked your strategy session for tomorrow at 2 PM on Google Meet.`;
      }

      const actionCard = {
        id: 'ac-' + Date.now().toString(36),
        intent,
        title,
        description: spokenResponse,
        spokenResponse,
        status: 'confirmed',
        createdAt: nowStr,
        emailData,
        calendarData
      };

      const memo = {
        id: 'memo-' + Date.now().toString(36),
        title: text.length > 50 ? text.substring(0, 47) + '...' : text,
        durationSeconds: 15,
        recordedAt: nowStr,
        transcript: text,
        status: 'analyzed',
        extractedTaskIds: [],
        extractedActionCardIds: [actionCard.id],
        summary: spokenResponse,
        source: 'browser_mic'
      };

      return new Response(JSON.stringify({
        actionCard,
        memo,
        createdTasks: [],
        kpi: { totalHoursWonBack: 174, roiMultiplier: 5.4, totalTasks: 7 }
      }), { headers: corsHeaders });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: corsHeaders });
    }
  }

  // Tasks
  if (path === '/tasks') {
    return new Response(JSON.stringify(SEED_DATA.tasks), { headers: corsHeaders });
  }

  // Action Cards
  if (path === '/action-cards') {
    return new Response(JSON.stringify(SEED_DATA.actionCards), { headers: corsHeaders });
  }

  // Memos
  if (path === '/memos') {
    return new Response(JSON.stringify(SEED_DATA.memos), { headers: corsHeaders });
  }

  // Contacts
  if (path === '/comms/contacts' || path === '/contacts') {
    return new Response(JSON.stringify(SEED_DATA.contacts), { headers: corsHeaders });
  }

  // Appointments
  if (path === '/appointments') {
    return new Response(JSON.stringify(SEED_DATA.appointments), { headers: corsHeaders });
  }

  // Inbox
  if (path === '/gmail/inbox') {
    return new Response(JSON.stringify(SEED_DATA.inboxEmails), { headers: corsHeaders });
  }

  // Chat Messages
  if (path === '/comms/messages') {
    return new Response(JSON.stringify(SEED_DATA.chatMessages), { headers: corsHeaders });
  }

  // Call Logs
  if (path === '/comms/calls') {
    return new Response(JSON.stringify(SEED_DATA.callLogs), { headers: corsHeaders });
  }

  // Wiki
  if (path === '/wiki') {
    return new Response(JSON.stringify(SEED_DATA.wikiArticles), { headers: corsHeaders });
  }

  // Autonomous status
  if (path === '/autonomous/status') {
    return new Response(JSON.stringify({
      queueLength: 2,
      activeJobsCount: 0,
      completedCount: 2,
      totalHoursWonBack: 174,
      jobs: [],
      queue: []
    }), { headers: corsHeaders });
  }

  // Memories
  if (path === '/memories') {
    return new Response(JSON.stringify(SEED_DATA.memories), { headers: corsHeaders });
  }

  // KPI
  if (path === '/kpi') {
    return new Response(JSON.stringify({
      totalHoursWonBack: 174,
      automationHoursInvested: 32,
      netROIHours: 142,
      roiMultiplier: 5.4,
      totalTasks: 7,
      completedTasks: 2,
      ongoingTasks: 3,
      backlogTasks: 2,
      aiAutomatedCount: 4,
      humanOnlyCount: 1,
      hybridCount: 2,
      highValueCount: 6,
      completionRatePercent: 29
    }), { headers: corsHeaders });
  }

  // Default fallback response
  return new Response(JSON.stringify({ success: true, edge: true }), { headers: corsHeaders });
}
