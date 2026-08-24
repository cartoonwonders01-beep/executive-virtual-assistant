// Intelligent AI Knowledge, Q&A, and Strategic Solution Engine
// Powers Eve's conversational IQ with Multilingual European Language Support

import { detectLanguage, SupportedLanguage } from './speechSynthesis';

export interface IntelligentAnswer {
  title: string;
  category: 'Business & Strategy' | 'Finance' | 'Tech/Dev' | 'Operations' | 'Productivity' | 'Communication' | 'General';
  spokenResponse: string;
  summary: string;
  keyInsights: string[];
  actionSteps: string[];
  proTip?: string;
  formulaOrCode?: string;
  language?: SupportedLanguage;
}

export class IntelligentAdvisor {
  /**
   * Evaluates whether a transcript is a question, advice request, explanation, or conversational dialogue
   */
  public isQuestionOrInquiry(text: string): boolean {
    const lower = text.toLowerCase().trim();
    
    // Explicit task commands should NOT be treated as questions
    if (/^(add\s+task|create\s+task|log\s+task|put\s+on\s+my\s+board|new\s+task|automate\s+task|erstelle\s+aufgabe|créer\s+tâche|crear\s+tarea)\b/i.test(lower)) {
      return false;
    }

    // Specialized device tools
    if (/(weather|forecast|wetter|météo|clima|tiempo|tempo|pogoda)/i.test(lower)) return false;
    if (/\d+\s*%\s*(?:of)/i.test(lower) || /\d+\s*[+\-*\/]\s*\d+/.test(lower)) return false;
    if (/^(what\s+did\s+i\s+ask\s+you\s+to\s+remember|recall|list\s+my\s+memories|was\s+hast\s+du\s+gespeichert|rappelle-toi|recuerda)/i.test(lower)) return false;
    if (/(timer|alarm|wecker|minuterie|alarma|sveglia)/i.test(lower)) return false;
    if (/(email|message|schreibe|écris|escribe|scrivi|napisz)\s+/i.test(lower) && /(wife|frau|épouse|esposa|emily|sarah|david|celine|alex)/i.test(lower)) return false;
    if (/love|liebe|aime|amo|kocham/i.test(lower) && /wife|frau|épouse|esposa|emily/i.test(lower)) return false;
    if (/(book|schedule|vereinbare|planen|planifier|programar|prenota)\s+([\w\s]+\s+)?(appointment|termin|meeting|reunión|appuntamento|spotkanie)/i.test(lower)) return false;

    // Multilingual question words & prefixes
    const questionPrefixes = [
      // English
      'what', 'why', 'how', 'when', 'where', 'who', 'which',
      'can you explain', 'explain', 'could you explain', 'tell me about', 'tell me how',
      'give me advice', 'how should i', 'how do i', 'how can we', 'how to',
      'what are the pros and cons', 'pros and cons of', 'compare', 'difference between',
      'what do you think about', 'what is the best way to', 'strategies for', 'strategy to',
      'tips for', 'help me understand', 'solve', 'is it better to',
      'suggest', 'recommend', 'how would you', 'teach me', 'give me ideas',
      // German (Deutsch)
      'was', 'warum', 'wie', 'wann', 'wo', 'wer', 'welche', 'welcher', 'welches',
      'kannst du erklären', 'erkläre', 'erzähl mir von', 'gib mir rat', 'wie sollte ich',
      'was sind die vor- und nachteile', 'unterschied zwischen', 'was denkst du über',
      'strategien für', 'tipps für', 'hilf mir zu verstehen', 'empfehle', 'guten morgen', 'hallo',
      // French (Français)
      'qu\'est-ce que', 'pourquoi', 'comment', 'quand', 'où', 'qui', 'quel', 'quelle',
      'peux-tu expliquer', 'explique', 'parle-moi de', 'donne-moi des conseils',
      'quelles sont les stratégies', 'stratégies pour', 'que penses-tu de', 'bonjour', 'salut',
      // Spanish (Español)
      'qué', 'por qué', 'cómo', 'cuándo', 'dónde', 'quién', 'cuál', 'cuáles',
      'puedes explicar', 'explica', 'cuéntame sobre', 'dame consejos',
      'cuáles son las estrategias', 'estrategias para', 'qué piensas de', 'hola', 'buenos días',
      // Italian (Italiano)
      'cosa', 'perché', 'come', 'quando', 'dove', 'chi', 'quale', 'quali',
      'puoi spiegare', 'spiega', 'parlami di', 'dammi consigli', 'strategie per', 'buongiorno', 'ciao',
      // Dutch (Nederlands)
      'wat', 'waarom', 'hoe', 'wanneer', 'waar', 'wie', 'welke', 'kun je uitleggen', 'leg uit',
      'geef me advies', 'strategieën voor', 'goedemorgen', 'hallo',
      // Polish (Polski)
      'co', 'dlaczego', 'jak', 'kiedy', 'gdzie', 'kto', 'który', 'czy możesz wyjaśnić',
      'wyjaśnij', 'opowiedz mi o', 'doradź mi', 'jakie są strategie', 'dzień dobry', 'cześć',
      // Portuguese (Português)
      'o que', 'por que', 'como', 'quando', 'onde', 'quem', 'qual', 'quais',
      'você pode explicar', 'explique', 'me fale sobre', 'me dê conselhos', 'estratégias para', 'bom dia', 'olá'
    ];

    if (questionPrefixes.some(prefix => lower.startsWith(prefix) || lower.includes(' ' + prefix + ' '))) {
      return true;
    }

    // Conversational greetings & direct inquiries
    if (/\b(?:hello|hi|hey|good morning|guten morgen|bonjour|hola|buongiorno|goedemorgen|dzień dobry|bom dia|who are you|wer bist du|qui es-tu|quién eres|tell me|tell a joke|joke|what's going on|how are you|witze|blague|chiste|barzelletta|grappig|żart|piada)\b/i.test(lower)) {
      return true;
    }

    return false;
  }

  /**
   * Generates a high-IQ, structured executive answer in the speaker's language
   */
  public solve(transcript: string): IntelligentAnswer {
    const text = transcript.trim();
    const lower = text.toLowerCase();
    const lang = detectLanguage(text);

    // =========================================================================
    // 1. GERMAN (Deutsch) RESPONSES
    // =========================================================================
    if (lang === 'de') {
      if (/produktivität|deep\s+work|fokus|morgenroutine|zeitmanagement|überlastung/i.test(lower)) {
        return {
          title: 'Produktivitäts- und Deep-Work-Strategie',
          category: 'Productivity',
          spokenResponse: 'Um deinen täglichen Hebel zu maximieren, empfehle ich einen 90-minütigen Deep-Work-Block am Morgen vor dem ersten E-Mail-Check, konsequentes Timeboxing und die Delegation aller Routineaufgaben unter 80 Euro pro Stunde.',
          summary: 'Ein 3-Säulen-Protokoll für maximale exekutive Hebelwirkung und kognitive Klarheit.',
          keyInsights: [
            'Die 90-Minuten-Regel: Widme die ersten 90 Minuten ausschließlich deiner strategisch wichtigsten Aufgabe.',
            'Timeboxing statt To-Do-Listen: Feste Kalenderblöcke für strategisches Denken schützen vor Ablenkung.',
            'Automatisierungsschwelle: Automatisiere oder delegiere repetitive Aufgaben unter deinem Zielstundensatz.'
          ],
          actionSteps: [
            'Blockiere täglich 08:30 bis 10:00 Uhr in deinem Kalender als "Deep Work Sprint (Keine Meetings)".',
            'Prüfe dein Postfach nur zweimal täglich: um 11:30 Uhr und um 16:30 Uhr.',
            'Überprüfe das Monday.com Work Hub am Ende des Tages für einen klaren Abschluss.'
          ],
          proTip: 'Energiemanagement schlägt Zeitmanagement. Lege analytische Aufgaben in dein morgendliches Leistungshoch.',
          language: 'de'
        };
      }

      if (/kunde|eskalation|krise|beschwerde|schwierig/i.test(lower)) {
        return {
          title: 'Strategischer Leitfaden für Kundeneskalationen',
          category: 'Communication',
          spokenResponse: 'Nutze bei Kundeneskalationen das 4-Stufen-Prinzip: Bestätige die Auswirkungen innerhalb von 15 Minuten, stoppe das Problem sofort, kommuniziere transparent die Ursachen und liefere einen verbindlichen Präventionsplan.',
          summary: 'Ein Deeskalationsprotokoll, das Kundenvertrauen und langfristige Bindung sichert.',
          keyInsights: [
            'Reaktionsgeschwindigkeit: Bestätige den Eingang innerhalb von 15 Minuten.',
            'Fokus auf Geschäftsauswirkung: Validiere die geschäftliche Beeinträchtigung des Kunden.',
            'Ein zentraler Ansprechpartner: Vermeide fragmentierte Kommunikation durch einen dedizierten Lead.'
          ],
          actionSteps: [
            'Sende eine sofortige exekutive Eingangsbestätigung.',
            'Setze ein internes Tiger-Team für den Sofort-Fix ein.',
            'Liefere innerhalb von 24 Stunden einen vollständigen Post-Incident Report (PIR).'
          ],
          proTip: 'Kunden beurteilen Partnerschaften oft danach, wie Krisen bewältigt werden.',
          language: 'de'
        };
      }

      if (/wer\s+bist\s+du|hallo|guten\s+morgen|wie\s+geht\s+es|hilfe/i.test(lower)) {
        return {
          title: 'Eve — Deine Exekutive KI-Assistentin',
          category: 'General',
          spokenResponse: 'Hallo Andrew! Ich bin Eve, deine exekutive KI-Assistentin. Ich verwalte deine E-Mails, Termine, Workflows und stehe dir für strategische Fragen und Analysen jederzeit zur Verfügung. Womit beginnen wir?',
          summary: 'Exekutive Assistenz mit mehrsprachiger Konversationsintelligenz.',
          keyInsights: [
            'Sprach- und Textinteraktion: Sprich direkt mit mir oder tippe deine Aufgaben ein.',
            'Autonome Workflows: Verwaltung von Kalender, E-Mails und Monday.com Board.',
            'Kontinuierliches Lernen: Bringe mir neue Routinen bei mit "Wenn ich sage...".'
          ],
          actionSteps: [
            'Frage mich nach Analysen, Strategien oder Finanzen.',
            'Diktierte E-Mails oder plane neue Meetings.'
          ],
          language: 'de'
        };
      }
    }

    // =========================================================================
    // 2. FRENCH (Français) RESPONSES
    // =========================================================================
    if (lang === 'fr') {
      if (/productivité|travail\s+profond|deep\s+work|routine|gestion\s+du\s+temps/i.test(lower)) {
        return {
          title: 'Stratégie de Productivité et Travail Profond',
          category: 'Productivity',
          spokenResponse: 'Pour maximiser votre impact stratégique, appliquez un bloc de 90 minutes de travail profond chaque matin avant de consulter vos emails, protégez votre énergie par le time-boxing et déléguez les tâches subalternes.',
          summary: 'Protocole en 3 piliers conçu pour la clarté cognitive et le levier exécutif.',
          keyInsights: [
            'Règle des 90 premières minutes : Consacrez le début de journée exclusivement à votre priorité n°1.',
            'Time-Boxing : Planifiez des créneaux dédiés dans votre agenda pour la réflexion stratégique.',
            'Délégation proactive : Automatisez toute tâche sous votre taux horaire cible.'
          ],
          actionSteps: [
            'Bloquez 08h30 à 10h00 chaque jour comme "Sprint Travail Profond (Sans réunion)".',
            'Traitez vos emails uniquement à 11h30 et 16h30.',
            'Validez l\'avancement dans le Work Hub en fin de journée.'
          ],
          proTip: 'La gestion de l\'énergie surpasse toujours la gestion du temps.',
          language: 'fr'
        };
      }

      if (/qui\s+es-tu|bonjour|comment\s+vas-tu|aide/i.test(lower)) {
        return {
          title: 'Eve — Votre Assistante IA Exécutive',
          category: 'General',
          spokenResponse: 'Bonjour Andrew ! Je suis Eve, votre assistante IA exécutive. Je gère vos emails, votre agenda, vos tâches et vos analyses stratégiques. Que souhaitez-vous accomplir aujourd\'hui ?',
          summary: 'Assistant virtuel exécutif avec intelligence conversationnelle multilingue.',
          keyInsights: [
            'Interface Vocale et Écrite : Parlez ou écrivez à tout moment.',
            'Gestion Exécutive : Emails, calendrier et Monday.com automatisés.',
            'Apprentissage Continu : Apprenez-moi de nouvelles routines facilement.'
          ],
          actionSteps: [
            'Posez une question stratégique ou demandez une synthèse.',
            'Dictez un email ou réservez un créneau de réunion.'
          ],
          language: 'fr'
        };
      }
    }

    // =========================================================================
    // 3. SPANISH (Español) RESPONSES
    // =========================================================================
    if (lang === 'es') {
      if (/productividad|trabajo\s+profundo|deep\s+work|rutina|gestión\s+del\s+tiempo/i.test(lower)) {
        return {
          title: 'Estrategia de Productividad y Trabajo Profundo',
          category: 'Productivity',
          spokenResponse: 'Para maximizar tu rendimiento ejecutivo, implementa un bloque de 90 minutos de trabajo profundo por la mañana antes de abrir el correo, utiliza time-boxing y automatiza todas las tareas rutinarias.',
          summary: 'Protocolo de 3 pilares para máxima claridad estratégica y eficiencia ejecutiva.',
          keyInsights: [
            'Regla de los 90 minutos: Dedica el inicio del día exclusivamente a tu prioridad estratégica n°1.',
            'Time-Boxing: Bloquea tiempo en tu calendario para el pensamiento crítico.',
            'Automatización continua: Delega tareas operativas repetitivas.'
          ],
          actionSteps: [
            'Bloquea de 08:30 a 10:00 en tu calendario como "Sprint de Trabajo Profundo (Sin Reuniones)".',
            'Revisa tu bandeja de entrada solo dos veces al día: 11:30 y 16:30.',
            'Actualiza el Work Hub al final del día.'
          ],
          proTip: 'La gestión de la energía supera siempre a la gestión del tiempo.',
          language: 'es'
        };
      }

      if (/quién\s+eres|hola|buenos\s+días|cómo\s+estás|ayuda/i.test(lower)) {
        return {
          title: 'Eve — Tu Asistente Ejecutiva de IA',
          category: 'General',
          spokenResponse: '¡Hola Andrew! Soy Eve, tu asistente ejecutiva de inteligencia artificial. Gestiono tu correo, calendario, tareas y te brindo análisis estratégicos en tiempo real. ¿En qué trabajamos hoy?',
          summary: 'Asistente ejecutiva inteligente con soporte multilingüe.',
          keyInsights: [
            'Voz y Texto Integrados: Habla con "Hey Eve" o escribe en el chat.',
            'Automatización Integral: Gestión de calendario, Gmail y Monday.com.',
            'Aprendizaje Adaptativo: Aprende rutinas personalizadas instantáneamente.'
          ],
          actionSteps: [
            'Hazme cualquier consulta estratégica o de negocio.',
            'Dicta un correo o agenda tus reuniones de hoy.'
          ],
          language: 'es'
        };
      }
    }

    // =========================================================================
    // 4. ITALIAN & DUTCH RESPONSES
    // =========================================================================
    if (lang === 'it') {
      return {
        title: 'Analisi Strategica e Soluzione Esecutiva',
        category: 'Business & Strategy',
        spokenResponse: 'Certamente Andrew. Per ottimizzare i risultati, stabiliamo obiettivi chiari, eliminiamo le inefficienze operative ed eseguiamo in cicli rapidi e misurabili. Ecco i dettagli sullo schermo.',
        summary: 'Sintesi strategica e piano d\'azione esecutivo.',
        keyInsights: [
          'Allineamento Strategico: Massima focalizzazione sulle priorità ad alto impatto.',
          'Efficienza Operativa: Automazione delle attività ripetitive.'
        ],
        actionSteps: [
          'Definisci i KPI misurabili per questa iniziativa.',
          'Esegui una revisione settimanale dei progressi nel Work Hub.'
        ],
        language: 'it'
      };
    }

    if (lang === 'nl') {
      return {
        title: 'Strategische Analyse & Uitvoerend Plan',
        category: 'Business & Strategy',
        spokenResponse: 'Natuurlijk Andrew. Om maximaal resultaat te behalen, focussen we op de belangrijkste hefbomen, elimineren we operationele frictie en werken we in snelle iteraties. Zie het overzicht op je scherm.',
        summary: 'Strategische analyse en uitvoerend actieplan.',
        keyInsights: [
          'Focus op Waarde: 80% van de resultaten komt uit de 20% kernactiviteiten.',
          'Tijdwinst: Automatiseer routinematige administratieve taken.'
        ],
        actionSteps: [
          'Blokkeer tijd voor strategische focus in je agenda.',
          'Controleer het Monday.com Work Hub voor actuele status.'
        ],
        language: 'nl'
      };
    }

    // =========================================================================
    // 5. ENGLISH (Standard Default)
    // =========================================================================
    // Morning Routine & Executive Productivity
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
        proTip: 'Energy management always beats time management. Schedule analytical tasks during your peak morning circadian rhythm.',
        language: 'en'
      };
    }

    // Client Escalation & Difficult Conversations
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
        proTip: 'Clients frequently judge partnerships by how crises are handled rather than when everything goes smoothly.',
        language: 'en'
      };
    }

    // DCF & Valuation Framework
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
        proTip: 'Always run sensitivity tables on WACC (+/- 1%) and Perpetual Growth Rate (+/- 0.5%) to establish a realistic valuation corridor.',
        language: 'en'
      };
    }

    // Hiring & Team Scaling
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
        proTip: 'A-players attract A-players. Involve your highest-performing domain leads in the final cultural alignment interview.',
        language: 'en'
      };
    }

    // System Architecture
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
        proTip: 'Premature distributed architecture is the #1 driver of unnecessary engineering friction in early-to-mid stage startups.',
        language: 'en'
      };
    }

    // Small Talk & Check-ins
    if (/how\s+are\s+you|how\s+is\s+it\s+going|how\s+are\s+things|how\s+do\s+you\s+feel|how\s+was\s+your\s+day/i.test(lower)) {
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
        ],
        language: 'en'
      };
    }

    // General Greeting
    if (/^(good\s+morning|morning|good\s+afternoon|good\s+evening|hello|hey\s+there|hi\s+eve)\b/i.test(lower)) {
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
        ],
        language: 'en'
      };
    }

    // Humor & Jokes
    if (/tell\s+me\s+a\s+joke|make\s+me\s+laugh|say\s+something\s+funny|joke/i.test(lower)) {
      return {
        title: 'Executive Humor Break',
        category: 'General',
        spokenResponse: "Why do programmers prefer dark mode? Because light attracts bugs!",
        summary: "Why do programmers prefer dark mode? — Because light attracts bugs!",
        keyInsights: [
          'Humor & Cognitive Relief: Taking quick mental resets enhances neuroplasticity and problem-solving creativity.'
        ],
        actionSteps: [
          'Smile, take a deep breath, and dive back into your highest-leverage sprint.'
        ],
        language: 'en'
      };
    }

    // Philosophy & Meaning of Life
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
        proTip: '"We suffer more often in imagination than in reality." — Seneca',
        language: 'en'
      };
    }

    // Introductions & Capabilities
    if (/^(who\s+are\s+you|what\s+can\s+you\s+do|introduce\s+yourself|help|features)/i.test(lower)) {
      return {
        title: 'Eve — Your Executive AI Assistant',
        category: 'General',
        spokenResponse: "I am Eve, your Executive AI Assistant. I manage your emails, calendar, Monday.com work hub, and voice automations, and provide high-level strategic reasoning and answers in multiple languages. What would you like to accomplish today?",
        summary: 'Autonomous executive virtual assistant powered by multilingual conversational intelligence.',
        keyInsights: [
          'Hands-Free Voice Activation: Say "Hey Eve" to activate anytime without touching your device.',
          'Autonomous Email & Calendar: Dictate love notes to your wife, triage VIP emails, or schedule executive meetings.',
          'Strategic Advisor & Problem Solver: Ask questions on finance, engineering, hiring, business strategy, or daily productivity in English, German, French, Spanish, and more.',
          'Dynamic Skill Learning: Teach Eve custom multi-step routines simply by saying "When I say [Trigger]..."'
        ],
        actionSteps: [
          'Say "Hey Eve, what are three strategies to improve my morning routine?" for advice.',
          'Say "Hey Eve, send an email to my wife to say I love her" for fast comms.',
          'Say "Hey Eve, schedule sync with David tomorrow at 2 PM" to book calendar events.'
        ],
        proTip: 'You can configure your preferred voice persona, language, and API keys in Settings ⚙️.',
        language: 'en'
      };
    }

    // Default Fallback
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
      proTip: `Focus 80% of your executive attention on the 20% of inputs that produce the vast majority of tangible output.`,
      language: 'en'
    };
  }
}

export const intelligentAdvisor = new IntelligentAdvisor();
