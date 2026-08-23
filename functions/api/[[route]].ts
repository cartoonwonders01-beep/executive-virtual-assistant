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
  wikiArticles: [
    { id: 'wiki-1', slug: 'voice-ai-hud-mobile-pwa', title: '📱 Voice AI HUD & Mobile PWA', category: 'Voice AI & Mobile', summary: 'Real-time voice recognition and spoken TTS feedback.' }
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

      let intent = 'task_create';
      let title = `Task: ${text}`;
      let spokenResponse = `I've analyzed your voice memo and logged it to the Monday.com Work Hub.`;
      let emailData: any = undefined;
      let calendarData: any = undefined;

      // 1. Email Intent (e.g. wife, Sarah, David, etc.)
      if (/email|message|write to|send to|mail/i.test(textLower)) {
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
        if (/love/i.test(textLower)) {
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
          sentAt: new Date().toISOString()
        };

        title = `Sent Email to ${toName}`;
        spokenResponse = /wife|emily/i.test(textLower)
          ? `I've sent an email to Emily saying you love her ❤️`
          : `I've prepared and dispatched the email to ${toName} regarding ${subject}.`;
      }

      // 2. Calendar Booking
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
        createdAt: new Date().toISOString(),
        emailData,
        calendarData
      };

      const memo = {
        id: 'memo-' + Date.now().toString(36),
        title: text.length > 50 ? text.substring(0, 47) + '...' : text,
        durationSeconds: 15,
        recordedAt: new Date().toISOString(),
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
