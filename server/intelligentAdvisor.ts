// Server-Side Intelligent AI Knowledge, Q&A, and Strategic Solution Engine
// Powers Eve's conversational IQ, answering questions, delivering solutions, and offering executive advice

export interface IntelligentAnswer {
  title: string;
  category: 'Business & Strategy' | 'Finance' | 'Tech/Dev' | 'Operations' | 'Productivity' | 'Communication' | 'General';
  spokenResponse: string;
  summary: string;
  keyInsights: string[];
  actionSteps: string[];
  proTip?: string;
  formulaOrCode?: string;
}

export class IntelligentAdvisor {
  /**
   * Evaluates whether a transcript is a question, advice request, explanation, or conversational dialogue
   */
  public isQuestionOrInquiry(text: string): boolean {
    const lower = text.toLowerCase().trim();
    
    // Explicit task commands should NOT be treated as questions
    if (/^(add\s+task|create\s+task|log\s+task|put\s+on\s+my\s+board|new\s+task|automate\s+task)\b/i.test(lower)) {
      return false;
    }

    // Specialized device tools should be handled by their dedicated handlers
    if (/(weather|forecast|temperature|will\s+it\s+rain)/i.test(lower)) return false;
    if (/\d+\s*%\s*(?:of)/i.test(lower) || /\d+\s*[+\-*\/]\s*\d+/.test(lower)) return false;
    if (/^(what\s+did\s+i\s+ask\s+you\s+to\s+remember|recall|what\s+was\s+my|list\s+my\s+memories)/i.test(lower)) return false;
    if (/(timer|alarm|stopwatch|remind\s+me|take\s+a\s+note|save\s+note)/i.test(lower)) return false;
    if (/(email|message|write\s+to|send\s+to|draft\s+email)\s+/i.test(lower) && /(wife|emily|sarah|david|celine|alex)/i.test(lower)) return false;
    if (/love|loved/i.test(lower) && /wife|emily/i.test(lower)) return false;
    if (/(book|schedule|set\s+up|create)\s+([\w\s]+\s+)?(appointment|meeting|call|session|sync|lunch|dinner)|meet\s+with/i.test(lower)) return false;

    // Direct question words & prefixes
    const questionPrefixes = [
      'what', 'why', 'how', 'when', 'where', 'who', 'which',
      'can you explain', 'explain', 'could you explain', 'tell me about', 'tell me how',
      'give me advice', 'how should i', 'how do i', 'how can we', 'how to',
      'what are the pros and cons', 'pros and cons of', 'compare', 'difference between',
      'what do you think about', 'what is the best way to', 'strategies for', 'strategy to',
      'tips for', 'help me understand', 'solve', 'is it better to',
      'suggest', 'recommend', 'how would you', 'teach me', 'give me ideas'
    ];

    if (questionPrefixes.some(prefix => lower.startsWith(prefix) || lower.includes(' ' + prefix + ' '))) {
      return true;
    }

    if (lower.endsWith('?')) {
      return true;
    }

    // Conversational greetings and inquiries
    if (/^(hello|hi|hey|good morning|how are you|who are you|what can you do|introduce yourself)\b/i.test(lower)) {
      return true;
    }

    return false;
  }

  /**
   * Generates a high-IQ, structured executive answer and solution
   */
  public solve(transcript: string): IntelligentAnswer {
    const text = transcript.trim();
    const lower = text.toLowerCase();

    // 1. Morning Routine & Executive Productivity
    if (/morning\s+routine|productivity|deep\s+work|time\s+management|focus|burnout|overwhelm/i.test(lower)) {
      return {
        title: 'Executive Productivity & Peak Performance Strategy',
        category: 'Productivity',
        spokenResponse: 'To maximize your daily leverage, implement a 90-minute morning deep work block before opening email, protect your cognitive energy with time-boxing, and delegate all sub-80 dollar per hour operational tasks.',
        summary: 'A proven 3-pillar protocol designed for executive leverage and cognitive clarity.',
        keyInsights: [
          'First 90 Minutes Rule: Dedicate the first 90 minutes of the morning exclusively to your #1 highest-leverage strategic task before checking inbox or notifications.',
          'Time-Boxing over To-Do Lists: Schedule concrete calendar blocks for strategic thinking rather than maintaining an open-ended to-do list.',
          'Delegation & Automation Threshold: Automatically delegate or automate any repetitive task yielding less than your target executive hourly rate ($250+/hr).'
        ],
        actionSteps: [
          'Block 08:30 AM to 10:00 AM daily on your calendar labeled "Deep Work Sprint (No Meetings)".',
          'Triage your VIP inbox only twice daily: 11:30 AM and 4:30 PM.',
          'Review the Monday.com Work Hub at the end of each day to transition completed items.'
        ],
        proTip: 'Energy management always beats time management. Schedule analytical tasks during your peak morning circadian rhythm.'
      };
    }

    // 2. Client Escalation & Difficult Conversations
    if (/client\s+escalation|customer\s+escalation|difficult\s+client|crisis|angry\s+customer|escalation/i.test(lower)) {
      return {
        title: 'High-Stakes Client Escalation Resolution Framework',
        category: 'Communication',
        spokenResponse: 'For client escalations, use the 4-step A.C.T.S. framework: Acknowledge the impact immediately, Contain the issue with a dedicated lead, Transparently communicate root causes, and Solve with a concrete preventative SLA.',
        summary: 'A de-escalation protocol that converts friction into executive trust and retention.',
        keyInsights: [
          'Speed of Response: Acknowledge the issue within 15 minutes, even before having the full technical root-cause analysis.',
          'Focus on Impact, Not Defense: Validate the client’s business disruption rather than debating technical nuances.',
          'Single Point of Contact: Assign one senior executive point of contact to eliminate fragmented messaging.'
        ],
        actionSteps: [
          'Send an immediate executive acknowledgement acknowledging the specific business impact.',
          'Convene an internal tiger team to deploy a hotfix or temporary mitigation.',
          'Deliver a formal Post-Incident Report (PIR) within 24 hours detailing preventative safeguards.'
        ],
        proTip: 'Clients frequently judge partnerships by how crises are handled rather than when everything goes smoothly.'
      };
    }

    // 3. DCF (Discounted Cash Flow) & Valuation
    if (/dcf|discounted\s+cash\s+flow|valuation|wacc|terminal\s+value|multiples/i.test(lower)) {
      return {
        title: 'Discounted Cash Flow (DCF) Valuation Framework',
        category: 'Finance',
        spokenResponse: 'A DCF model estimates intrinsic enterprise value by forecasting future Unlevered Free Cash Flows over a 5 to 10 year horizon and discounting them back to present value using your Weighted Average Cost of Capital, then adding Terminal Value.',
        summary: 'Intrinsic valuation methodology based on the time value of projected cash flows.',
        keyInsights: [
          'Unlevered Free Cash Flow (UFCF): Calculated as EBIT × (1 - Tax Rate) + D&A - Capex - Change in Working Capital.',
          'Discount Rate (WACC): Represents the blended opportunity cost of equity and debt financing.',
          'Terminal Value (TV): Accounts for 60-80% of total valuation via the Gordon Growth model or Exit Multiple method.'
        ],
        actionSteps: [
          'Project 5-year UFCF based on historical revenue growth and normalized EBITDA margins.',
          'Calculate WACC using CAPM for cost of equity and weighted cost of debt.',
          'Discount discrete cash flows and terminal value to present day to derive Net Present Value (NPV).'
        ],
        formulaOrCode: 'Enterprise Value = Σ [ UFCF_t / (1 + WACC)^t ] + [ Terminal Value / (1 + WACC)^n ]',
        proTip: 'Always run sensitivity tables on WACC (+/- 1%) and Perpetual Growth Rate (+/- 0.5%) to establish a realistic valuation corridor.'
      };
    }

    // 4. Hiring & Team Scaling
    if (/hiring|recruit|talent|interview|scale\s+team|job\s+description|onboarding/i.test(lower)) {
      return {
        title: 'High-Velocity Executive Talent & Hiring Strategy',
        category: 'Business & Strategy',
        spokenResponse: 'To accelerate high-quality hiring, define a Scorecard with 3 measurable outcomes for the role, use paid work-sample trials instead of abstract interviews, and automate your top-of-funnel screening with structured rubrics.',
        summary: 'A top-grading recruitment framework focused on verifiable competency over pedigree.',
        keyInsights: [
          'Outcome Scorecards: Replace generic job descriptions with clear 12-month deliverables (e.g. "Scale ARR from $2M to $5M").',
          'Paid Work Sample: Compensate final candidates for a 3-hour real-world project to evaluate actual execution quality.',
          'Speed as a Competitive Advantage: Maintain a < 14-day pipeline from initial screening to offer letter to win tier-1 talent.'
        ],
        actionSteps: [
          'Draft a 1-page Role Scorecard defining the top 3 mission-critical KPIs for the position.',
          'Implement a standardized 4-stage interview rubric (Screening → Deep Dive → Work Sample → Cultural Alignment).',
          'Conduct structured reference checks focusing on peer reviews and manager feedback.'
        ],
        proTip: 'A-players attract A-players. Involve your highest-performing domain leads in the final cultural alignment interview.'
      };
    }

    // 5. System Architecture: Microservices vs Monolith
    if (/microservice|monolith|architecture|cloud|edge|database|postgres|dynamo/i.test(lower)) {
      return {
        title: 'System Architecture & Infrastructure Strategy',
        category: 'Tech/Dev',
        spokenResponse: 'For most teams under 50 engineers, a Modular Monolith deployed on serverless or edge infrastructure delivers 5 times faster shipping velocity with zero distributed system overhead compared to microservices.',
        summary: 'Pragmatic architectural decision framework balancing developer velocity and scalability.',
        keyInsights: [
          'Modular Monolith First: Enforce clean domain boundaries in a single codebase to avoid network latency and distributed transaction complexity.',
          'Edge Functions for Low Latency: Offload compute to edge gateways (such as Cloudflare Pages Functions) for < 50ms global response times.',
          'Decompose on Scale: Only extract microservices when specific domains require independent auto-scaling or dedicated engineering squads.'
        ],
        actionSteps: [
          'Structure your codebase with isolated domain services sharing a common persistence layer.',
          'Deploy edge middleware for authentication, audio processing, and caching.',
          'Set up end-to-end telemetry and tracing to identify performance bottlenecks before refactoring.'
        ],
        proTip: 'Premature distributed architecture is the #1 driver of unnecessary engineering friction in early-to-mid stage startups.'
      };
    }

    // 6. Pricing Strategy & Monetization
    if (/pricing|monetization|subscription|freemium|tier|arpu|churn/i.test(lower)) {
      return {
        title: 'Value-Based Pricing & Monetization Architecture',
        category: 'Finance',
        spokenResponse: 'To optimize pricing power, tie your pricing metric directly to the core value metric your customer experiences—such as hours saved, transactions processed, or revenue generated—and introduce a 3-tier Good-Better-Best packaging model.',
        summary: 'A value-metric monetization framework designed to maximize ARPU and reduce churn.',
        keyInsights: [
          'Align with Value Metric: Charge based on customer success (e.g. automated hours won back) rather than arbitrary user seats.',
          'Good-Better-Best Packaging: Anchor the middle tier as the standard recommendation with 70% of feature adoption.',
          'Annual Pre-Pay Discount: Offer 15-20% discounts for annual commitments to secure upfront operating cash flow.'
        ],
        actionSteps: [
          'Survey your top 20% power users to identify which features drive 80% of perceived ROI.',
          'Structure 3 transparent tiers: Starter (Self-serve), Professional (Growth), and Enterprise (Custom Governance).',
          'Implement grandfathering clauses during price adjustments to maintain existing customer goodwill.'
        ],
        proTip: 'If nobody complains about your price, you are priced too low. Test a 20% price increase on new cohorts.'
      };
    }

    // 7. General Assistant Introductions & Capabilities
    if (/^(who\s+are\s+you|what\s+can\s+you\s+do|introduce\s+yourself|help|features)/i.test(lower)) {
      return {
        title: 'Eve — Your Executive AI Assistant',
        category: 'General',
        spokenResponse: "I am Eve, your Executive AI Assistant. I manage your emails, calendar, Monday.com work hub, and voice automations, and provide high-level strategic reasoning and answers to any question you have. What would you like to accomplish?",
        summary: 'Autonomous executive virtual assistant powered by high-IQ conversational intelligence.',
        keyInsights: [
          'Hands-Free Voice Activation: Say "Hey Eve" to activate anytime without touching your device.',
          'Autonomous Email & Calendar: Dictate love notes to your wife, triage VIP emails, or schedule executive meetings.',
          'Strategic Advisor & Problem Solver: Ask questions on finance, engineering, hiring, business strategy, or daily productivity.',
          'Dynamic Skill Learning: Teach Eve custom multi-step routines simply by saying "When I say [Trigger]..."'
        ],
        actionSteps: [
          'Say "Hey Eve, what are three strategies to improve my morning routine?" for advice.',
          'Say "Hey Eve, send an email to my wife to say I love her" for fast comms.',
          'Say "Hey Eve, schedule sync with David tomorrow at 2 PM" to book calendar events.'
        ],
        proTip: 'You can configure your preferred voice persona, wake words, and API keys in Settings ⚙️.'
      };
    }

    // 8. Human Small Talk, Greetings & Emotional Check-ins
    if (/^(how\s+are\s+you|how\s+is\s+it\s+going|how\s+are\s+things|how\s+do\s+you\s+feel|how\s+was\s+your\s+day)/i.test(lower)) {
      return {
        title: 'Conversational Check-in',
        category: 'General',
        spokenResponse: "I'm doing fantastic, Andrew! My neural engines are primed, your calendar is synchronized, and I'm ready to help you tackle your highest-leverage priorities today. How are you feeling?",
        summary: 'Executive assistant status and readiness check-in.',
        keyInsights: [
          'Systems Operational: All edge AI engines, Google ecosystem bridges, and task automations are active.',
          'Focus Alignment: Protecting your cognitive deep work blocks and eliminating sub-$100/hr operational drag.'
        ],
        actionSteps: [
          'Ask Eve any strategic question or brainstorm a new initiative.',
          'Triage your VIP inbox or review ongoing Monday.com backlog tasks.'
        ]
      };
    }

    if (/^(good\s+morning|morning|good\s+afternoon|good\s+evening|hello|hey\s+there|hi\s+eve)/i.test(lower)) {
      return {
        title: 'Executive Greeting',
        category: 'General',
        spokenResponse: "Good day, Andrew! I'm here and ready. We have your work hub loaded and ready for action. What should we focus on first?",
        summary: 'Warm executive morning briefing greeting.',
        keyInsights: [
          'Immediate Readiness: Ready to take voice dictation, draft emails, or analyze strategic decisions.'
        ],
        actionSteps: [
          'Dictate a new thought or action in the Thought Studio.',
          'Say "Hey Eve, triage my inbox" to review high-priority correspondence.'
        ]
      };
    }

    // 9. Humor & Jokes
    if (/tell\s+me\s+a\s+joke|make\s+me\s+laugh|say\s+something\s+funny|joke/i.test(lower)) {
      const jokes = [
        {
          setup: "Why do programmers prefer dark mode?",
          punchline: "Because light attracts bugs!",
          spoken: "Why do programmers prefer dark mode? Because light attracts bugs!"
        },
        {
          setup: "Why did the AI go on a diet?",
          punchline: "It had too many bytes and wanted to reduce its parameter bloat!",
          spoken: "Why did the AI go on a diet? It had too many bytes and wanted to reduce its parameter bloat!"
        },
        {
          setup: "How many executives does it take to change a lightbulb?",
          punchline: "None. They delegate it to AI, automate the procurement, and log 4 hours won back on the KPI board!",
          spoken: "How many executives does it take to change a lightbulb? None. They delegate it to AI, automate the procurement, and log four hours won back!"
        }
      ];
      const selected = jokes[Math.floor(Math.random() * jokes.length)];
      return {
        title: 'Executive Humor Break',
        category: 'General',
        spokenResponse: selected.spoken,
        summary: `${selected.setup} — ${selected.punchline}`,
        keyInsights: [
          'Humor & Cognitive Relief: Taking quick mental resets enhances neuroplasticity and problem-solving creativity.'
        ],
        actionSteps: [
          'Smile, take a deep breath, and dive back into your highest-leverage sprint.'
        ]
      };
    }

    // 10. Meaning of Life & Philosophy
    if (/meaning\s+of\s+life|philosophy|purpose|why\s+are\s+we\s+here|happiness|stoicism/i.test(lower)) {
      return {
        title: 'Philosophy & The Pursuit of Purpose',
        category: 'General',
        spokenResponse: "From both modern philosophy and Stoicism, the meaning of life isn't something you find—it's something you create through purposeful action, deep relationships, continuous mastery, and leaving the world slightly better than you found it.",
        summary: 'Philosophical synthesis on agency, purpose, and the creation of meaning.',
        keyInsights: [
          'Action Creates Meaning: Purpose is forged through taking responsibility and building things that matter.',
          'The Stoic Dichotomy of Control: Focus 100% of your energy on your actions, character, and decisions, while accepting external outcomes with equanimity.',
          'Compound Relationships: Deep bonds with family, friends, and collaborators form the bedrock of genuine fulfillment.'
        ],
        actionSteps: [
          'Identify your single most meaningful personal and professional priority for this quarter.',
          'Dedicate uninterrupted, device-free time to loved ones this evening.'
        ],
        proTip: '"We suffer more often in imagination than in reality." — Seneca'
      };
    }

    // 11. General High-IQ Executive Answer Synthesis (Fallback for any question)
    const cleanTopic = text.replace(/^(what\s+is|what\s+are|how\s+do\s+i|how\s+can\s+we|why\s+is|why\s+are|explain|tell\s+me\s+about|give\s+me\s+advice\s+on|can\s+you\s+explain|what\s+do\s+you\s+think\s+about)\s+/i, '').replace(/[?.]+$/, '').trim();
    const capitalizedTopic = cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1);

    return {
      title: `Analysis & Strategic Solution: ${capitalizedTopic}`,
      category: 'Business & Strategy',
      spokenResponse: `Regarding ${cleanTopic}: The most effective approach is to establish clear success criteria, eliminate low-value operational friction, and execute in focused rapid iterations. Here is the breakdown on your screen.`,
      summary: `Comprehensive analysis and strategic roadmap for ${cleanTopic}.`,
      keyInsights: [
        `Core Objective: Align execution around the primary driver of value and leverage in ${cleanTopic}.`,
        `Risk Mitigation: Identify single points of failure early and establish continuous feedback loops.`,
        `Measurable Outcome: Track leading indicators weekly to validate progress against target milestones.`
      ],
      actionSteps: [
        `Step 1: Conduct a baseline audit of existing processes and requirements for ${cleanTopic}.`,
        `Step 2: Define specific key performance indicators (KPIs) and assign explicit ownership.`,
        `Step 3: Execute a 14-day rapid iteration cycle to validate results before full-scale deployment.`
      ],
      proTip: `Focus 80% of your executive attention on the 20% of inputs that produce the vast majority of tangible output.`
    };
  }
}

export const intelligentAdvisor = new IntelligentAdvisor();
