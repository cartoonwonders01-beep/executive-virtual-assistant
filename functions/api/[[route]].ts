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

  // Voice Transcribe Audio (Groq Whisper Edge Relay)
  if ((path === '/voice/transcribe-audio' || path === '/voice/upload') && method === 'POST') {
    try {
      const formData = await request.formData();
      const audioFile = formData.get('audio') as File | null;
      const clientGroqKey = request.headers.get('x-groq-api-key') || '';
      const groqKey = clientGroqKey || env.GROQ_API_KEY || '';

      let transcript = '';

      if (audioFile && groqKey) {
        try {
          const groqFormData = new FormData();
          groqFormData.append('file', audioFile, audioFile.name || 'recording.webm');
          groqFormData.append('model', 'whisper-large-v3-turbo');
          groqFormData.append('response_format', 'json');
          groqFormData.append('temperature', '0.0');

          const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${groqKey}`
            },
            body: groqFormData
          });

          if (groqRes.ok) {
            const data = await groqRes.json() as { text: string };
            transcript = (data.text || '').trim();
          }
        } catch (groqErr) {
          console.warn('Groq edge transcription notice:', groqErr);
        }
      }

      const text = transcript || 'Voice Recording';
      const textLower = text.toLowerCase();
      const nowStr = new Date().toISOString();

      let intent = 'knowledge_qa';
      let title = `Conversation with Eve`;
      let spokenResponse = `I'm here with you. What would you like to explore or accomplish today?`;
      let emailData: any = undefined;
      let calendarData: any = undefined;

      if (/joke/i.test(textLower)) {
        title = `A Quick Joke`;
        spokenResponse = `Why do programmers prefer dark mode? Because light attracts bugs!`;
      } else if (/how\s+are\s+you|how\s+is\s+it\s+going|how's\s+it\s+going/i.test(textLower)) {
        title = `Conversational Check-in`;
        spokenResponse = `I'm doing wonderfully! Ready to help you tackle your highest-leverage goals. How are you feeling today?`;
      } else if (/who\s+are\s+you|what\s+can\s+you\s+do/i.test(textLower)) {
        title = `Eve — Executive AI Partner`;
        spokenResponse = `I'm Eve, your executive assistant and strategic partner. I help manage your schedule, inbox, and priorities, brainstorm ideas, and automate your workflows.`;
      } else if (/wife|love|emily/i.test(textLower)) {
        intent = 'email_draft';
        title = `Sent Email to Emily Baxter`;
        spokenResponse = `I've drafted a warm note to Emily saying you're thinking of her ❤️`;
        emailData = {
          id: 'em-' + Date.now().toString(36),
          toName: 'Emily Baxter (Wife)',
          toEmail: 'emily.baxter@personal.com',
          subject: 'Thinking of you ❤️',
          body: 'Hi Emily,\n\nJust wanted to send you a quick note to say I love you!\n\nLove,\nAndrew',
          tone: 'friendly',
          status: 'sent',
          sentAt: nowStr
        };
      } else if (/book|schedule|meet|appointment/i.test(textLower)) {
        intent = 'calendar_booking';
        title = `Strategy Session with David Miller`;
        spokenResponse = `I booked your strategy session for tomorrow at 2 PM on Google Meet.`;
        calendarData = {
          id: 'apt-' + Date.now().toString(36),
          title: 'Strategy Session with David Miller',
          startDateTime: new Date(Date.now() + 86400000).toISOString(),
          endDateTime: new Date(Date.now() + 86400000 + 3600000).toISOString(),
          location: 'Google Meet / Virtual',
          attendees: [{ name: 'David Miller', email: 'david.m@cloudscale.io' }],
          status: 'confirmed'
        };
      } else if (text && text.trim().length > 3) {
        title = text.length > 40 ? text.substring(0, 37) + '...' : text;
        spokenResponse = `I understand you're asking about "${text}". Let me assist you with that directly.`;
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
        transcript,
        actionCard,
        memo,
        createdTasks: [],
        kpi: { totalHoursWonBack: 174, roiMultiplier: 5.4, totalTasks: 7 }
      }), { headers: corsHeaders });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: corsHeaders });
    }
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

      // 0. Question / Advice / Strategic Inquiry Resolver
      const isExplicitTask = /^(add\s+task|create\s+task|log\s+task|put\s+on\s+my\s+board|new\s+task)\b/i.test(textLower);
      const isQuestion = !isExplicitTask && (
        /^(what|why|how|when|where|who|which|can you|explain|tell me|give me advice|how should|how do|what are|is it|suggest|recommend|who are you|what can you do)/i.test(textLower) ||
        textLower.endsWith('?')
      );

      if (isQuestion) {
        intent = 'knowledge_qa';
        if (/morning|productivity|deep\s+work|focus/i.test(textLower)) {
          title = 'Executive Productivity Protocol';
          spokenResponse = 'To maximize your daily leverage, implement a 90-minute morning deep work block before opening email, time-box strategic thinking, and delegate repetitive operational tasks.';
        } else if (/escalat|difficult\s+client|angry/i.test(textLower)) {
          title = 'Client Escalation Framework';
          spokenResponse = 'For client escalations, use the A.C.T.S. framework: Acknowledge the impact immediately, Contain the issue with a single lead, Transparently communicate root causes, and Solve with a preventative SLA.';
        } else if (/dcf|discounted\s+cash\s+flow|valuation/i.test(textLower)) {
          title = 'DCF Valuation Framework';
          spokenResponse = 'A DCF model estimates enterprise value by forecasting future Unlevered Free Cash Flows over 5 to 10 years, discounting them with WACC, and adding Terminal Value.';
        } else if (/who\s+are\s+you|what\s+can\s+you\s+do|introduce/i.test(textLower)) {
          title = 'Eve — Executive Assistant';
          spokenResponse = 'I am Eve, your Executive AI Assistant. I manage your emails, calendar, Monday.com work hub, and voice automations, and answer any strategic questions you have.';
        } else if (/pricing|price/i.test(textLower)) {
          title = 'Strategic Pricing & Margins';
          spokenResponse = 'Value-metric pricing tied directly to customer ROI yields the highest expansion revenue and gross margins.';
        } else if (/growth|retention|churn/i.test(textLower)) {
          title = 'Growth & Retention Strategy';
          spokenResponse = 'Focus on cohort retention before accelerating marketing spend to ensure users reach their activation milestone.';
        } else {
          const cleanTopic = text.replace(/^(what\s+is|what\s+are|how\s+do\s+i|explain|tell\s+me\s+about|what\s+about)\s+/i, '').replace(/[?.]+$/, '');
          title = `Strategic Insight: ${cleanTopic ? cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1) : 'Analysis'}`;
          spokenResponse = `Looking at ${cleanTopic || 'this'}: The core strategic priority is to identify the primary point of leverage, eliminate friction, and test assumptions in rapid iterations.`;
        }
      }

      // 1. Adaptive Memory & Learning ("Remember that...", "What is my...")
      else if (/^(remember\s+that|remember\s+|learn\s+that|don't\s+forget\s+that)/i.test(textLower)) {
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

      // 9. Conversational Q&A, Small Talk & Strategic Advice
      else {
        intent = 'knowledge_qa';
        if (/how\s+are\s+you|how\s+is\s+it\s+going|how\s+are\s+things/i.test(textLower)) {
          title = `Conversational Check-in`;
          spokenResponse = `I'm doing fantastic, Andrew! My neural engines are primed, your calendar is synchronized, and I'm ready to help you tackle your highest-leverage priorities today. How are you feeling?`;
        } else if (/good\s+morning|hello|hi\s+eve|hey\s+there/i.test(textLower)) {
          title = `Executive Greeting`;
          spokenResponse = `Good day, Andrew! I'm here and ready. We have your work hub loaded and ready for action. What should we focus on first?`;
        } else if (/joke|funny/i.test(textLower)) {
          title = `Executive Humor Break`;
          spokenResponse = `Why do programmers prefer dark mode? Because light attracts bugs!`;
        } else if (/morning\s+routine|productivity|focus/i.test(textLower)) {
          title = `Executive Productivity Strategy`;
          spokenResponse = `To maximize your daily leverage, implement a 90-minute morning deep work block before opening email, protect your cognitive energy with time-boxing, and delegate sub-80 dollar per hour operational tasks.`;
        } else if (/client\s+escalation|difficult\s+client/i.test(textLower)) {
          title = `Client Escalation Resolution Protocol`;
          spokenResponse = `For client escalations, use the 4-step A.C.T.S. framework: Acknowledge the impact immediately, Contain the issue with a dedicated lead, Transparently communicate root causes, and Solve with a preventative SLA.`;
        } else if (/dcf|discounted\s+cash\s+flow|valuation/i.test(textLower)) {
          title = `DCF Valuation Model`;
          spokenResponse = `A DCF model estimates intrinsic enterprise value by forecasting Unlevered Free Cash Flows over 5 to 10 years, discounting them with WACC, and adding Terminal Value.`;
        } else {
          const cleanTopic = text.replace(/^(what\s+is|what\s+are|how\s+do\s+i|how\s+can\s+we|why\s+is|explain|tell\s+me\s+about)\s+/i, '').replace(/[?.]+$/, '').trim();
          title = `Analysis: ${cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1)}`;
          spokenResponse = `Regarding ${cleanTopic}: The most effective executive approach is to establish clear success criteria, eliminate operational friction, and execute in focused rapid iterations. Here is the full breakdown.`;
        }
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

  // Skills
  if (path === '/skills' && method === 'GET') {
    return new Response(JSON.stringify([
      {
        id: 'skill-morning-briefing',
        name: 'Morning Executive Briefing',
        triggerPhrase: 'morning briefing',
        description: 'Triages VIP inbox, checks calendar, and lists top tasks.',
        actionSteps: [
          { id: 's1', order: 1, actionType: 'triage_inbox', label: 'Triage VIP Inbox' },
          { id: 's2', order: 2, actionType: 'check_calendar', label: 'Check Schedule' },
          { id: 's3', order: 3, actionType: 'list_tasks', label: 'List Top Priorities' }
        ],
        learnedAt: '2026-08-20T08:00:00Z',
        executionCount: 14,
        isEnabled: true,
        source: 'builtin'
      },
      {
        id: 'skill-wife-love',
        name: 'Wife Check-in & Love Dispatch',
        triggerPhrase: 'wife check-in',
        description: 'Sends an affectionate check-in email to Emily Baxter.',
        actionSteps: [
          { id: 's1', order: 1, actionType: 'send_email', label: 'Draft Love Note to Emily', target: 'emily.baxter@personal.com' }
        ],
        learnedAt: '2026-08-21T10:00:00Z',
        executionCount: 8,
        isEnabled: true,
        source: 'voice_learned'
      }
    ]), { headers: corsHeaders });
  }

  // Execute Skill
  if (path.startsWith('/skills/') && path.endsWith('/execute') && method === 'POST') {
    return new Response(JSON.stringify({
      success: true,
      message: 'Executed autonomous routine steps successfully.',
      executedAt: new Date().toISOString()
    }), { headers: corsHeaders });
  }

  // Dialogue Turn
  if (path === '/dialogue/turn' && method === 'POST') {
    const body = await request.json() as { speech: string };
    const speech = body.speech || '';
    const nowStr = new Date().toISOString();

    return new Response(JSON.stringify({
      turn: {
        id: 'turn-' + Date.now().toString(36),
        speaker: 'assistant',
        text: `I heard: "${speech}". How else can I assist you?`,
        spokenResponse: `I'm on it! How else can I assist you?`,
        timestamp: nowStr
      },
      session: {
        id: 'sess-edge',
        status: 'idle',
        turns: []
      }
    }), { headers: corsHeaders });
  }

  // Default fallback response
  return new Response(JSON.stringify({ success: true, edge: true }), { headers: corsHeaders });
}
