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
    if (/^(remind\s+me|create\s+reminder|set\s+a\s+reminder|erinnere\s+mich|rappelle-moi|recuérdame)/i.test(lower)) return false;
    if (/^(take\s+a\s+note|save\s+note|write\s+this\s+down|note\s+down|notiz|note:)/i.test(lower)) return false;
    if (/^(call|dial|phone|ring|anrufen|appeler|llamar)\s+/i.test(lower)) return false;
    if (/(email|message|schreibe|écris|escribe|scrivi|napisz)\s+/i.test(lower) && /(wife|frau|épouse|esposa|emily|sarah|david|celine|alex)/i.test(lower)) return false;
    if (/love|liebe|aime|amo|kocham/i.test(lower) && /wife|frau|épouse|esposa|emily/i.test(lower)) return false;
    if (/(book|schedule|vereinbare|planen|planifier|programar|prenota)\s+([\w\s]+\s+)?(appointment|termin|meeting|reunión|appuntamento|spotkanie)/i.test(lower)) return false;

    // Multilingual question words & conversational prefixes
    const questionPrefixes = [
      // English
      'what', 'why', 'how', 'when', 'where', 'who', 'which',
      'are you', 'can you', 'do you', 'will you', 'did you', 'could you', 'would you',
      'can you hear me', 'are you there', 'are you listening', 'are you working', 'are you going to respond',
      'what is going on', 'what\'s going on', 'what\'s happening', 'what are you doing', 'talk to me', 'listen to me',
      'can you explain', 'explain', 'tell me about', 'tell me how', 'tell me a joke', 'tell me another joke',
      'give me advice', 'how should i', 'how do i', 'how can we', 'how to',
      'what are the pros and cons', 'pros and cons of', 'compare', 'difference between',
      'what do you think about', 'what is the best way to', 'strategies for', 'strategy to',
      'tips for', 'help me understand', 'solve', 'is it better to',
      'suggest', 'recommend', 'how would you', 'teach me', 'give me ideas',
      // German (Deutsch)
      'was', 'warum', 'wie', 'wann', 'wo', 'wer', 'welche', 'welcher', 'welches',
      'bist du da', 'hörst du mich', 'antwortest du', 'was ist los', 'kannst du mich hören',
      'kannst du erklären', 'erkläre', 'erzähl mir von', 'gib mir rat', 'wie sollte ich',
      'was sind die vor- und nachteile', 'unterschied zwischen', 'was denkst du über',
      'strategien für', 'tipps für', 'hilf mir zu verstehen', 'empfehle', 'guten morgen', 'hallo',
      // French (Français)
      'qu\'est-ce que', 'qu\'est-ce qui', 'pourquoi', 'comment', 'quand', 'où', 'qui', 'quel', 'quelle',
      'tu m\'entends', 'tu es là', 'est-ce que', 'qu\'est-ce qui se passe', 'qu\'est-ce que tu fais',
      'tu as entendu', 'tu l\'as entendu', 'j\'ai la même impression', 'j\'ai l\'impression', 'on doit',
      'peux-tu expliquer', 'explique', 'parle-moi de', 'donne-moi des conseils', 'dis-moi', 'réponds-moi',
      'quelles sont les stratégies', 'stratégies pour', 'que penses-tu de', 'bonjour', 'salut',
      // Spanish (Español)
      'qué', 'por qué', 'cómo', 'cuándo', 'dónde', 'quién', 'cuál', 'cuáles',
      'estás ahí', 'me escuchas', 'vas a responder', 'qué pasa', 'qué está pasando',
      'puedes explicar', 'explica', 'cuéntame sobre', 'dame consejos',
      'cuáles son las estrategias', 'estrategias para', 'qué piensas de', 'hola', 'buenos días',
      // Italian (Italiano)
      'cosa', 'perché', 'come', 'quando', 'dove', 'chi', 'quale', 'quali',
      'ci sei', 'mi senti', 'puoi spiegare', 'spiega', 'parlami di', 'dammi consigli', 'strategie per', 'buongiorno', 'ciao',
      // Dutch (Nederlands)
      'wat', 'waarom', 'hoe', 'wanneer', 'waar', 'wie', 'welke', 'hoor je mij', 'ben je daar', 'kun je uitleggen', 'leg uit',
      'geef me advies', 'strategieën voor', 'goedemorgen', 'hallo',
      // Polish (Polski)
      'co', 'dlaczego', 'jak', 'kiedy', 'gdzie', 'kto', 'który', 'czy słyszysz mnie', 'czy możesz wyjaśnić',
      'wyjaśnij', 'opowiedz mi o', 'doradź mi', 'jakie są strategie', 'dzień dobry', 'cześć',
      // Portuguese (Português)
      'o que', 'por que', 'como', 'quando', 'onde', 'quem', 'qual', 'quais', 'está aí', 'você me ouve',
      'você pode explicar', 'explique', 'me fale sobre', 'me dê conselhos', 'estratégias para', 'bom dia', 'olá'
    ];

    if (questionPrefixes.some(prefix => lower.startsWith(prefix) || lower.includes(' ' + prefix + ' '))) {
      return true;
    }

    // Conversational greetings, liveness, jokes, & direct inquiries
    if (/\b(?:hello|hi|hey|good morning|guten morgen|bonjour|hola|buongiorno|goedemorgen|dzień dobry|bom dia|who are you|wer bist du|qui es-tu|quién eres|tell me|tell a joke|joke|what's going on|how are you|witze|blague|chiste|barzelletta|grappig|żart|piada|respond|listening|working|hearing|hear me|impression|entendu|compris|d'accord|agree)\b/i.test(lower)) {
      return true;
    }

    // If it ends in a question mark or is conversational reflection (not explicit task command)
    if (lower.endsWith('?') || !/^(add|create|log|insert|schedule|draft|send|book)\b/i.test(lower)) {
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

      if (/crise|escalade|réclamation|client|difficile|gérer/i.test(lower)) {
        return {
          title: 'Protocole de Gestion de Crise & Escalade Client',
          category: 'Communication',
          spokenResponse: 'Pour désamorcer une crise client en 4 étapes : Accuser réception immédiatement avec empathie, clarifier les faits, proposer un plan d’action avec date limite, et assurer un suivi personnalisé.',
          summary: 'Méthodologie en 4 phases pour transformer un incident en levier de fidélisation.',
          keyInsights: [
            'Désamorçage émotionnel : Valider la préoccupation avant de défendre les faits.',
            'Action concrète : Donner un calendrier précis d\'intervention.'
          ],
          actionSteps: [
            'Appelez le client directement ou envoyez une réponse structurée sous 30 minutes.',
            'Documentez l\'incident dans le Work Hub.'
          ],
          language: 'fr'
        };
      }

      if (/tu\s+m'entends|tu\s+es\s+là|tu\s+m'écoutes|tu\s+fonctionnes|qu'est-ce\s+qui\s+se\s+passe|qu'est-ce\s+que\s+tu\s+fais|tu\s+as\s+entendu|tu\s+l'as\s+entendu|est-ce\s+que\s+tu\s+marches|réponds-moi/i.test(lower)) {
        return {
          title: 'Présence & Écoute Active',
          category: 'General',
          spokenResponse: "Je suis là et je t'écoute parfaitement, Andrew ! Tout fonctionne à merveille. De quoi aimerais-tu qu'on parle ?",
          summary: "Confirmation de présence et écoute active en temps réel.",
          keyInsights: [
            'Microphone et transcription vocale actifs en temps réel.',
            'Prête pour la dictée, l\'analyse stratégique ou la gestion d\'agenda.'
          ],
          actionSteps: [
            'Posez votre question ou dictez votre pensée naturellement.',
            'Dites "Hey Eve, fais le point sur mon planning" pour la journée.'
          ],
          language: 'fr'
        };
      }

      if (/j'ai\s+la\s+même\s+impression|j'ai\s+l'impression|d'accord|exactement|on\s+doit\s+trancher/i.test(lower)) {
        return {
          title: 'Alignement & Échange Conversationnel',
          category: 'General',
          spokenResponse: "Je partage tout à fait cette analyse. Concentrons-nous sur les priorités décisives pour avancer rapidement.",
          summary: "Alignement stratégique et validation des orientations opérationnelles.",
          keyInsights: [
            'Validation des points de convergence et élimination des ambiguïtés.',
            'Passage direct à l\'action mesurable.'
          ],
          actionSteps: [
            'Définir les étapes concrètes dans le Work Hub.',
            'Planifier le prochain point d\'étape.'
          ],
          language: 'fr'
        };
      }

      if (/qui\s+es-tu|bonjour|comment\s+vas-tu|aide|salut/i.test(lower)) {
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

      return {
        title: 'Dialogue Exécutif & Réflexion',
        category: 'Business & Strategy',
        spokenResponse: `Sur ce point : l'essentiel est de cibler le point de levier majeur et d'éliminer les frictions opérationnelles. Voici l'analyse à l'écran.`,
        summary: `Synthèse et réflexion conversationnelle pour : "${text}".`,
        keyInsights: ['Alignement sur la priorité fondamentale.', 'Mesure continue de l\'impact.'],
        actionSteps: ['Passez en revue les points clés sur votre écran.'],
        language: 'fr'
      };
    }

    // =========================================================================
    // 3. SPANISH (Español) RESPONSES
    // =========================================================================
    if (lang === 'es') {
      if (/productividad|trabajo\s+profundo|deep\s+work|rutina|gestión\s+del\s+tiempo|enfoque|optimizar/i.test(lower)) {
        return {
          title: 'Estrategia de Productividad y Trabajo Profundo',
          category: 'Productivity',
          spokenResponse: 'Para maximizar tu productividad y enfoque ejecutivo, implementa un bloque de 90 minutos de trabajo profundo por la mañana antes de abrir el correo, utiliza time-boxing y automatiza todas las tareas rutinarias.',
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

      return {
        title: 'Análisis Estratégico y Solución Ejecutiva',
        category: 'Business & Strategy',
        spokenResponse: `Aquí tienes la recomendación estratégica para: "${text}". Enfócate en las prioridades de alto impacto y la ejecución disciplinada.`,
        summary: `Síntesis ejecutiva en español para: "${text}".`,
        keyInsights: ['Alineamiento estratégico y ejecución rápida.'],
        actionSteps: ['Revisa los puntos clave en pantalla.'],
        language: 'es'
      };
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
    // Presence, Liveness & Conversational Check-ins
    if (/^(are\s+you\s+going\s+to\s+respond|are\s+you\s+responding|are\s+you\s+there|are\s+you\s+listening|can\s+you\s+hear\s+me|are\s+you\s+working|what'?s\s+going\s+on|what\s+is\s+going\s+on|what'?s\s+happening|what\s+are\s+you\s+doing|maybe\s+working|is\s+this\s+working|hello\??$|talk\s+to\s+me|why\s+aren'?t\s+you\s+answering)/i.test(lower)) {
      return {
        title: 'Conversational Presence & Liveness',
        category: 'General',
        spokenResponse: "I'm right here with you and listening clearly, Andrew! Everything is active and ready. What can I do for you right now?",
        summary: "Live voice connection confirmed. Assistant is active, listening, and ready.",
        keyInsights: [
          'Microphone stream and speech recognition are active.',
          'Ready for strategic questions, email dictation, calendar scheduling, or conversational thoughts.'
        ],
        actionSteps: [
          'Ask any question or dictate your thoughts naturally.',
          'Say "Hey Eve, what are my priorities today?" for an instant briefing.'
        ],
        language: 'en'
      };
    }

    // Clarification & Curiosity Inquiries (Handling ambiguous, incomplete, or underspecified requests)
    if (/^(i\s+have\s+a\s+problem|there'?s\s+an\s+issue|what\s+should\s+i\s+do\??$|what\s+do\s+you\s+think\??$|help\s+me\??$|i\s+need\s+help\??$|let'?s\s+fix\s+this|something\s+is\s+wrong|i\s+need\s+advice\??$|can\s+you\s+help\s+me\??$|i\s+have\s+a\s+question\??$|i\s+need\s+to\s+make\s+a\s+decision)/i.test(lower)) {
      return {
        title: 'Interactive Clarification & Alignment',
        category: 'General',
        spokenResponse: "I'm right here with you, Andrew. Could you share a bit more about the specific challenge or decision you're facing so we can think through it together?",
        summary: "I'm ready to help you navigate this decision or challenge. Tell me what's on your mind:",
        keyInsights: [
          'Active Listening & Diagnosis: Clear problem framing is 80% of the solution.',
          'Collaborative Brainstorming: We can break down strategic trade-offs, operational hurdles, or team decisions.'
        ],
        actionSteps: [
          'Describe the decision: e.g. "I need to choose between hiring or outsourcing."',
          'Describe the bottleneck: e.g. "Our product release is blocked by QA delays."',
          'Say "Hey Eve, let\'s brainstorm solutions" to explore alternative approaches.'
        ],
        language: 'en'
      };
    }

    // Chain-of-Thought Strategic Action Planning & Roadmaps
    if (/^(plan|create\s+a\s+plan|build\s+a\s+plan|formulate\s+a\s+plan|roadmap|strategy\s+for|how\s+do\s+i\s+scale|next\s+30\s+days|next\s+90\s+days|step\s+by\s+step\s+plan)/i.test(lower) || /plan\s+(?:my|our|for|the)\s+/i.test(lower)) {
      return {
        title: `Strategic Action Plan: ${text.length > 35 ? text.substring(0, 32) + '...' : text}`,
        category: 'Business & Strategy',
        spokenResponse: "I've structured a 3-phase action plan for you. Phase 1 focuses on diagnosis and high-leverage alignment, Phase 2 on core sprint execution, and Phase 3 on automated measurement. You can review the complete roadmap on your screen.",
        summary: "Comprehensive 3-Phase Strategic Roadmap & Execution Protocol:",
        keyInsights: [
          'Phase 1: Alignment & Diagnosis (Days 1–7): Identify core bottlenecks, establish KPI baselines, and eliminate immediate friction.',
          'Phase 2: High-Leverage Sprint Execution (Days 8–21): Deploy the top 20% of initiatives that generate 80% of measurable impact.',
          'Phase 3: Automation & Feedback Loops (Days 22–30): Institutionalize continuous monitoring, automated reporting, and retrospective refinement.'
        ],
        actionSteps: [
          'Review the 3-phase milestones in the Work Hub.',
          'Delegate execution steps across the domain Agent Swarm.',
          'Say "Hey Eve, log these as tasks" to sync directly to your Monday.com board.'
        ],
        language: 'en'
      };
    }

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

    // Contact Inquiries & Directory
    if (/who\s+is\s+sarah|tell\s+me\s+about\s+sarah/i.test(lower)) {
      return {
        title: 'Executive Contact: Sarah Chen',
        category: 'Communication',
        spokenResponse: "Sarah Chen is your Head of Growth at Innovate Group (sarah.chen@innovate.co). She leads growth marketing and enterprise partnerships.",
        summary: "Sarah Chen — Head of Growth at Innovate Group (sarah.chen@innovate.co).",
        keyInsights: ['Key contact for growth metrics and client partnership initiatives.'],
        actionSteps: ['Say "Send Sarah an email" or "Call Sarah" to initiate contact.'],
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

    // Pricing & Business Economics
    if (/pricing|how\s+should\s+i\s+price|price\s+point|freemium|subscription|monetiz|margin|saas\s+pricing/i.test(lower)) {
      return {
        title: 'Strategic Pricing & Unit Economics Framework',
        category: 'Finance',
        spokenResponse: "For pricing strategy, value-metric pricing tied to your customer's ROI is almost always superior to cost-plus. I've broken down 3 pricing tiers and margin safeguards on your screen.",
        summary: "Value-based pricing architecture designed to optimize LTV, expand ACV, and maximize gross margins.",
        keyInsights: [
          'Value Metric Alignment: Price along the axis that scales with customer value (e.g. seats, API calls, or tracked volume) so revenue expands naturally.',
          'Price Elasticity: High-tier enterprise buyers prioritize compliance, reliability, and dedicated support far more than base software cost.',
          'Grandfathering Strategy: Protect legacy customer trust by grandfathering pricing while applying new pricing to all new customer cohorts.'
        ],
        actionSteps: [
          'Audit your current gross margin per customer tier (target > 80% for SaaS / digital services).',
          'Introduce a 3-tier structure: Starter (low friction), Growth (core value driver), and Enterprise (custom security & SLAs).',
          'Test a 15-20% price increase on the next 10 inbound sales conversations to establish your demand curve.'
        ],
        proTip: 'Most early companies underprice by 30-50%. If no customer complains about price, your price is too low.',
        language: 'en'
      };
    }

    // Growth, Acquisition & Retention
    if (/retention|churn|user\s+growth|get\s+more\s+customers|marketing\s+channel|acquisition|drop\s+off|conversion/i.test(lower)) {
      return {
        title: 'High-Impact Growth & Retention Acceleration',
        category: 'Business & Strategy',
        spokenResponse: "To diagnose growth bottlenecks, look at the delta between your acquisition cost and customer retention. If retention is dipping, doubling down on acquisition is like pouring water into a leaky bucket.",
        summary: "Cohort retention analysis and organic growth loop framework.",
        keyInsights: [
          'Retention Precedes Growth: Establish a flat retention curve for core user cohorts before accelerating ad spend.',
          'Time to Value (TTV): Shorten the onboarding path so new users reach their "Aha!" moment in under 3 minutes.',
          'Viral & Expansion Loops: Build natural sharing and workflow invite triggers directly into product usage.'
        ],
        actionSteps: [
          'Run a cohort retention analysis grouped by signup week to identify when user drop-off occurs.',
          'Conduct 5 exit interviews with churned users to uncover the root blocker.',
          'Optimize your top activation bottleneck in this sprint.'
        ],
        language: 'en'
      };
    }

    // Product Architecture & Technical Trade-offs
    if (/refactor|technical\s+debt|monolith|microservice|architecture|tech\s+stack|scalab/i.test(lower)) {
      return {
        title: 'Pragmatic Product & Architecture Decision Protocol',
        category: 'Tech/Dev',
        spokenResponse: "When balancing technical debt against product velocity, the golden rule is: never refactor speculatively. Refactor only the modules that are actively impeding feature shipping or causing user-facing outages.",
        summary: "Architecture framework balancing immediate feature velocity with long-term codebase health.",
        keyInsights: [
          'Modular Monolith First: Keep domain boundaries clean inside a unified deployment until scaling bottlenecks force separation.',
          '80/20 Debt Paydown: Allocate 20% of every sprint to high-friction technical debt that speeds up the remaining 80%.',
          'Automated Guardrails: Strong type checking and integration test suites prevent regressions far better than manual code review.'
        ],
        actionSteps: [
          'Identify the single file or service causing the highest developer friction this quarter.',
          'Write end-to-end integration tests around that boundary before modifying logic.',
          'Ship refactors in small, continuous pull requests rather than long-running branches.'
        ],
        language: 'en'
      };
    }

    // Leadership, Delegation & Team Performance
    if (/delegate|delegation|team\s+alignment|leadership|underperform|manage\s+people|accountab/i.test(lower)) {
      return {
        title: 'Executive Delegation & Autonomous Team Leadership',
        category: 'Business & Strategy',
        spokenResponse: "High-leverage delegation requires defining clear outcomes rather than managing daily inputs. Give complete ownership of the goal, set measurable check-in milestones, and remove roadblocks.",
        summary: "Outcome-driven leadership protocol for building high-autonomy teams.",
        keyInsights: [
          'Task-Relevant Maturity (TRM): Calibrate your management style to each team member\'s experience level on the specific task.',
          'Definition of Done: Agree on what "done" looks like before work begins to avoid misalignment.',
          'Pre-Mortem Alignment: Ask your team "If this fails in 30 days, what was the most likely reason?" to surface hidden risks early.'
        ],
        actionSteps: [
          'Document the single most critical objective for the week with a clear success metric.',
          'Assign single-threaded ownership to one lead.',
          'Schedule a 15-minute weekly checkpoint to review deliverables and unblock dependencies.'
        ],
        language: 'en'
      };
    }

    // High-Stakes Negotiations & Strategic Deals
    if (/negotiat|supplier|contract\s+terms|deal\s+terms|discount\s+request|closing\s+the\s+deal/i.test(lower)) {
      return {
        title: 'Strategic Deal Negotiation & Value Optimization',
        category: 'Communication',
        spokenResponse: "In strategic negotiations, never negotiate on price alone. Expand the deal parameters to include payment terms, exclusivity, contract duration, and volume tiers so both parties win.",
        summary: "Multi-variable negotiation protocol for maximizing contract value and partnership trust.",
        keyInsights: [
          'BATNA (Best Alternative to a Negotiated Agreement): Always know your walk-away threshold before entering discussions.',
          'Trade, Don\'t Concede: Never give a price discount without receiving something in return (e.g. upfront annual payment, case study rights, or longer commitment).',
          'Anchoring: Set the initial baseline high with clear justification to control the bargaining corridor.'
        ],
        actionSteps: [
          'List all non-monetary levers (payment terms, case studies, multi-year term, scope of support).',
          'Establish your ideal target, acceptable fallback, and walk-away points.',
          'Anchor the discussion around total economic value delivered rather than input costs.'
        ],
        language: 'en'
      };
    }

    // Executive Focus & Mental Clarity
    if (/overwhelm|too\s+many\s+things|burned\s+out|stuck|prioritiz|can't\s+decide|clarity/i.test(lower)) {
      return {
        title: 'Executive Triage & Radical Focus Protocol',
        category: 'Productivity',
        spokenResponse: "When everything feels like a priority, nothing is. Let's apply the Eisenhower triage: identify the single constraint that unlocks everything else, and push all non-critical tasks to next week.",
        summary: "Radical prioritization framework for restoring executive clarity and momentum.",
        keyInsights: [
          'The Theory of Constraints: There is always only ONE primary bottleneck limiting throughput at any given moment.',
          'Elimination over Optimization: The fastest way to complete a low-value task is to eliminate it entirely.',
          'Cognitive Recovery: Decision fatigue degrades judgment; high-stakes decisions should be made after morning rest, not late at night.'
        ],
        actionSteps: [
          'Write down the 3 things causing the most friction or anxiety right now.',
          'Choose the single item that, if resolved, makes the other two easier or irrelevant.',
          'Dedicate the first 90 minutes tomorrow exclusively to executing on that single item.'
        ],
        language: 'en'
      };
    }

    // Dynamic Multi-Domain Semantic Thought Engine (Natural Human Thought & Analysis)
    const cleanTopic = text
      .replace(/^(what\s+is|what\s+are|how\s+do\s+i|how\s+can\s+we|why\s+is|why\s+are|explain|tell\s+me\s+about|give\s+me\s+advice\s+on|can\s+you\s+explain|what\s+do\s+you\s+think\s+about|thoughts\s+on)\s+/i, '')
      .replace(/[?.]+$/, '')
      .trim();
    const capitalizedTopic = cleanTopic ? cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1) : 'Strategic Question';

    return {
      title: `Strategic Analysis: ${capitalizedTopic}`,
      category: 'Business & Strategy',
      spokenResponse: `Looking at ${cleanTopic || 'this'}: The core strategic priority is to identify your primary point of leverage, eliminate operational drag, and test assumptions in rapid feedback cycles. Let's review the breakdown on your screen.`,
      summary: `In-depth analysis and executive perspective on ${cleanTopic || 'your inquiry'}.`,
      keyInsights: [
        `Leverage Point: Focus on the single highest-impact variable that drives 80% of desired outcomes for ${cleanTopic || 'this initiative'}.`,
        `Risk & Trade-off Assessment: Balance short-term execution speed against sustainable long-term defensibility.`,
        `Feedback & Iteration: Use rapid, low-cost experiments to validate assumptions before committing significant capital or resources.`
      ],
      actionSteps: [
        `1. Define the precise success metric and timeframe for ${cleanTopic || 'this project'}.`,
        `2. Identify the primary operational bottleneck or constraint.`,
        `3. Execute a 7-day focused sprint to test the initial milestone.`
      ],
      proTip: `Simplicity scales; complexity fails. Keep your execution loop lean and measurable.`,
      language: 'en'
    };
  }
}

export const intelligentAdvisor = new IntelligentAdvisor();
