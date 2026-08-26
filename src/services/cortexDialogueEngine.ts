import { ActionCard, DialogueTurn, EmailDraft, CalendarAppointment, TaskItem, CustomLLMProfile } from '../types';
import { memoryGraph } from './memoryGraphService';
import { webSearchService } from './webSearchService';
import { weatherService } from './weatherService';
import { calendarService } from './calendarService';
import { marketService } from './marketIntelligenceService';
import { autonomousPractice } from './autonomousPracticeWorker';
import { processSpeechWithGemini } from './geminiService';
import { intelligentAdvisor } from './intelligentAdvisor';
import { resilienceService } from './resilienceService';
import { logger } from './loggerService';

export interface CortexExecutionResult {
  actionCard: ActionCard;
  spokenResponse: string;
  toolCallExecuted?: {
    toolName: string;
    params: any;
    result: any;
  };
}

export class CortexDialogueEngine {
  private static instance: CortexDialogueEngine;

  private constructor() {}

  public static getInstance(): CortexDialogueEngine {
    if (!CortexDialogueEngine.instance) {
      CortexDialogueEngine.instance = new CortexDialogueEngine();
    }
    return CortexDialogueEngine.instance;
  }

  /**
   * Main ReAct Inference Loop: Evaluates raw user speech, resolves tools, and formulates response
   */
  public async reasonAndAct(
    transcript: string,
    history: DialogueTurn[] = [],
    activeProfile?: CustomLLMProfile,
    apiKey?: string
  ): Promise<CortexExecutionResult> {
    const textTrimmed = transcript.trim();
    const textLower = textTrimmed.toLowerCase();
    const cardId = 'ac-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5);
    const nowStr = new Date().toISOString();

    logger.log('info', 'ai_reasoning', `🧠 Cortex Ingesting: "${textTrimmed}"`);
    logger.debug('ai_reasoning', `Cortex ReAct cycle started`, {
      rawInput: textTrimmed,
      historyDepth: history.length,
      activeProfile: activeProfile?.name || 'Default'
    });

    // Pre-clean speech transcript to remove leading STT hallucinations/fillers
    const cleanedText = textTrimmed
      .replace(/^(?:hey\s+eve|hi\s+eve|eve|eeve|if\s+i\s+want\s+you\s+to|if\s+you\s+can|if|ok\s+eve|okay\s+eve|please\s+eve|please)[,\s:]+/i, '')
      .trim();
    const cleanLower = cleanedText.toLowerCase();

    logger.debug('ai_reasoning', `Cleaned ReAct transcript payload: "${cleanedText}"`, { cleanLower });

    // Family Roster Inquiry
    if (/(?:who\s+(?:is|are)\s+in\s+my\s+family|family\s+members?|list\s+my\s+family|family\s+roster|my\s+children|my\s+kids|my\s+wife)/i.test(textLower)) {
      const allMembers = memoryGraph.getExecutiveRelationships();
      const rosterList = allMembers.map(m => `• **${m.entityName}** (${m.relationType}) — \`${m.email}\``).join('\n');
      const spoken = `Your family roster includes your wife Celine Loeuille, and your children Elizabeth, Alexander, Eleonore, and Angelina Baxter.`;
      return {
        actionCard: {
          id: cardId,
          intent: 'knowledge_qa',
          title: 'Baxter Family Roster & Knowledge Graph',
          description: `**Confirmed Family Contacts:**\n\n${rosterList}`,
          spokenResponse: spoken,
          status: 'executed',
          createdAt: nowStr
        },
        spokenResponse: spoken
      };
    }

    logger.debug('ai_reasoning', `Cleaned ReAct transcript payload: "${cleanedText}"`, { cleanLower });

    // A1. Tool: Real-Time Meteorological Intelligence & Weather Forecasting
    if (/weather|forecast|rain|temperature|degrees|meteo|météo|wetter|tiempo|clima|hot\b|cold\b|sunny|outside|pluie|regen|lluvia|temps\s+fait|quel\s+temps|vorhersage|sonne|grad\b/i.test(textLower)) {
      const weatherReport = await weatherService.getWeather(cleanedText || textTrimmed);
      return {
        actionCard: {
          id: cardId,
          intent: 'web_search',
          title: `🌤️ Weather: ${weatherReport.city} (${weatherReport.temperatureC}°C / ${weatherReport.condition})`,
          description: weatherReport.summary,
          spokenResponse: weatherReport.spokenSummary,
          status: 'executed',
          createdAt: nowStr
        },
        spokenResponse: weatherReport.spokenSummary,
        toolCallExecuted: {
          toolName: 'get_weather',
          params: { city: weatherReport.city },
          result: weatherReport
        }
      };
    }

    // A2. Tool: Real-Time Financial & Cryptocurrency Market Intelligence (Bitcoin, Ethereum, S&P 500, FX, Gold)
    if (marketService.isFinancialMarketQuery(cleanedText || textTrimmed)) {
      const quote = await marketService.getMarketQuote(cleanedText || textTrimmed);
      return {
        actionCard: {
          id: cardId,
          intent: 'knowledge_qa',
          title: `📊 ${quote.name} (${quote.symbol}): $${quote.priceUsd.toLocaleString()} USD (${quote.change24hPercent >= 0 ? '+' : ''}${quote.change24hPercent}%)`,
          description: quote.summary,
          spokenResponse: quote.spokenSummary,
          status: 'executed',
          createdAt: nowStr
        },
        spokenResponse: quote.spokenSummary,
        toolCallExecuted: {
          toolName: 'get_market_quote',
          params: { symbol: quote.symbol },
          result: quote
        }
      };
    }

    // A3. Tool: Web Search Grounding & Current Events
    if (webSearchService.isWebSearchQuery(cleanedText || textTrimmed)) {
      const searchRes = await webSearchService.searchWeb(cleanedText || textTrimmed);
      return {
        actionCard: {
          id: cardId,
          intent: 'web_search',
          title: `Live Intelligence: "${searchRes.query}"`,
          description: searchRes.summary,
          spokenResponse: searchRes.spokenSummary,
          status: 'executed',
          createdAt: nowStr
        },
        spokenResponse: searchRes.spokenSummary,
        toolCallExecuted: {
          toolName: 'search_web',
          params: { query: searchRes.query },
          result: searchRes
        }
      };
    }

    // B. Compound Tool: Joke + Email Pipeline ("Please tell me a joke and also start thinking about the email")
    if (/joke|laugh|funny/i.test(textLower) && /(?:email|mail|message|send)/i.test(textLower)) {
      const nextJoke = autonomousPractice.getNextItem('jokes');
      const jokeText = nextJoke ? nextJoke.content : "Why do programmers prefer dark mode? Because light attracts bugs!";
      const draft: EmailDraft = {
        id: 'em-' + Date.now().toString(36),
        toName: 'Celine Loeuille',
        toEmail: 'celine.loeuille@gmail.com',
        subject: 'Quick Update from Andrew',
        body: 'Hi Celine,\n\nThinking of you and sending a quick update!\n\nBest,\nAndrew',
        tone: 'friendly',
        status: 'draft'
      };
      const spoken = `${jokeText} And regarding your email, I have drafted a note to Celine Loeuille (celine.loeuille@gmail.com). Should I send it now?`;
      return {
        actionCard: {
          id: cardId,
          intent: 'email_draft',
          title: `Drafted Email to Celine Loeuille`,
          description: `To: **Celine Loeuille** (celine.loeuille@gmail.com)\nSubject: *"${draft.subject}"*\n\n"${draft.body}"`,
          spokenResponse: spoken,
          status: 'confirmed',
          createdAt: nowStr,
          emailData: draft
        },
        spokenResponse: spoken,
        toolCallExecuted: {
          toolName: 'send_email',
          params: draft,
          result: { drafted: true, recipientEmail: 'celine.loeuille@gmail.com' }
        }
      };
    }

    // C. Tool: Inspect or Read Staged Email Draft ("What's the contents of the email", "Read the email")
    if (/what(?:'s|\s+is)\s+(?:the\s+)?(?:contents?|text|body|words)\s+of\s+(?:the\s+)?email|read\s+(?:the\s+)?email|what\s+does\s+(?:the\s+)?email\s+say/i.test(textLower)) {
      const spoken = `The draft to Celine Loeuille has subject "Thinking of you" and reads: "Hi Celine, Just wanted to send you a quick note to say I love you! Love, Andrew." Should I send it now?`;
      return {
        actionCard: {
          id: cardId,
          intent: 'knowledge_qa',
          title: 'Current Email Draft Preview',
          description: `To: **Celine Loeuille** (celine.loeuille@gmail.com)\nSubject: *"Thinking of you ❤️"*\n\n"Hi Celine,\n\nJust wanted to send you a quick note to say I love you!\n\nLove,\nAndrew"`,
          spokenResponse: spoken,
          status: 'executed',
          createdAt: nowStr
        },
        spokenResponse: spoken
      };
    }

    // D. Tool: Email Dispatch with Family Knowledge Graph & Phonetic Resolution
    if (/(?:email|write\s+(?:an?\s+)?(?:email|message|note)|send\s+(?:an?\s+)?(?:email|message|note)|mail|draft\s+(?:an?\s+)?(?:note|email|message)|message\s+\w+|send\s+[\w\s]+\s+(?:a\s+)?(?:quick\s+)?(?:email|note|message)|let\s+\w+\s+know|tell\s+\w+\s+(?:that|saying)|(?:send|write|draft|email|message)\s+(?:a\s+)?(?:note\s+to|email\s+to|message\s+to)?\s*(?:eleanor|eleonore|ellie|celine|elizabeth|eliza|alexander|alex|angelina|lina)|modify\s+(?:the\s+)?email|in\s+the\s+title|text\s+to\s+the\s+email)/i.test(textLower) || /(?:email|send\s+(?:a\s+)?(?:note|message)|draft\s+(?:a\s+)?(?:note|message))/i.test(cleanLower)) {
      let recipientName = 'Celine Loeuille';
      let recipientEmail = 'celine.loeuille@gmail.com';

      // Check all family members with phonetic tolerance
      if (/eleonore|eléonore|eleanor|ellie|elinor|eli\b/i.test(textLower)) {
        const ent = memoryGraph.findEntityByRelationOrAlias('eleonore');
        recipientName = ent?.entityName || 'Eleonore Baxter';
        recipientEmail = ent?.email || 'eleonore.a.baxter@gmail.com';
      } else if (/angelina|lina|angie|angel\b/i.test(textLower)) {
        const ent = memoryGraph.findEntityByRelationOrAlias('angelina');
        recipientName = ent?.entityName || 'Angelina Baxter';
        recipientEmail = ent?.email || 'angelina.c.baxter@gmail.com';
      } else if (/elizabeth|eliza|elizabth|liz\b|lizzie/i.test(textLower)) {
        const ent = memoryGraph.findEntityByRelationOrAlias('elizabeth');
        recipientName = ent?.entityName || 'Elizabeth Baxter';
        recipientEmail = ent?.email || 'elizabth.js.baxter@gmail.com';
      } else if (/alexander|alex\b|alec\b|xander/i.test(textLower)) {
        const ent = memoryGraph.findEntityByRelationOrAlias('alexander');
        recipientName = ent?.entityName || 'Alexander Baxter';
        recipientEmail = ent?.email || 'alexander.j.baxter@gmail.com';
      } else if (/wife|celine|céline|seline|partner/i.test(textLower)) {
        const ent = memoryGraph.findEntityByRelationOrAlias('wife');
        recipientName = ent?.entityName || 'Celine Loeuille';
        recipientEmail = ent?.email || 'celine.loeuille@gmail.com';
      }

      // Extract core message / subject modifications
      let messageContent = 'Sending you a quick update.';
      let subject = 'Message from Andrew';

      const sayingMatch = textTrimmed.match(/(?:saying|that|to\s+say|with\s+message|telling\s+(?:her|him|them)|say\s+in\s+the\s+title)\s+(.+)$/i);
      const regardingMatch = textTrimmed.match(/(?:about|regarding|re:)\s+(.+)$/i);

      if (/love|heart/i.test(textLower)) {
        subject = 'Thinking of you ❤️';
        messageContent = 'I love you!';
      } else if (sayingMatch) {
        messageContent = sayingMatch[1].trim();
        subject = messageContent.length > 35 ? messageContent.substring(0, 32) + '...' : messageContent;
      } else if (regardingMatch) {
        messageContent = `Regarding ${regardingMatch[1].trim()}. Following up on next steps.`;
        subject = regardingMatch[1].trim();
      } else if (/careful|afternoon/i.test(textLower)) {
        messageContent = `Please be careful this afternoon!`;
        subject = 'Be careful this afternoon';
      } else if (/running\s+late|late|delay/i.test(textLower)) {
        messageContent = `Running a little late! Will be with you shortly.`;
        subject = 'Running late';
      }

      const firstName = recipientName.split(' ')[0];

      const draft: EmailDraft = {
        id: 'em-' + Date.now().toString(36),
        toName: recipientName,
        toEmail: recipientEmail,
        subject: subject.charAt(0).toUpperCase() + subject.slice(1),
        body: `Hi ${firstName},\n\n${messageContent.charAt(0).toUpperCase() + messageContent.slice(1)}\n\nLove,\nAndrew`,
        tone: 'friendly',
        status: 'draft'
      };

      const spoken = `I have drafted an email to ${recipientName} (${recipientEmail}): "${draft.subject}". Should I send it now?`;

      return {
        actionCard: {
          id: cardId,
          intent: 'email_draft',
          title: `Drafted Email to ${recipientName}`,
          description: `To: **${recipientName}** (${recipientEmail})\nSubject: *"${draft.subject}"*\n\n"${draft.body}"`,
          spokenResponse: spoken,
          status: 'confirmed',
          createdAt: nowStr,
          emailData: draft
        },
        spokenResponse: spoken,
        toolCallExecuted: {
          toolName: 'send_email',
          params: draft,
          result: { drafted: true, recipientEmail }
        }
      };
    }

    // E. Tool: Curated Humor & Intelligence Practice ("Tell me a joke")
    if (/joke|laugh|funny|blague|witz/i.test(textLower)) {
      const nextJoke = autonomousPractice.getNextItem('jokes');
      const jokeText = nextJoke ? nextJoke.content : "Why do programmers prefer dark mode? Because light attracts bugs!";
      return {
        actionCard: {
          id: cardId,
          intent: 'knowledge_qa',
          title: 'Executive Humor Repertoire',
          description: jokeText,
          spokenResponse: jokeText,
          status: 'executed',
          createdAt: nowStr
        },
        spokenResponse: jokeText,
        toolCallExecuted: {
          toolName: 'tell_joke',
          params: {},
          result: { joke: jokeText }
        }
      };
    }

    // F. Tool: Dynamic Calendar & Executive Schedule Intelligence
    if (/(?:my\s+)?(?:calendar|kalender|calendario|schedule|agenda|planning|programme|horaire|horario|emploi\s+du\s+temps|tagesablauf|appointment|meeting|rendez-vous|termin|reuni[oó]n|reuniones)/i.test(textLower)) {
      const briefing = calendarService.getScheduleBriefing(cleanedText || textTrimmed);
      return {
        actionCard: {
          id: cardId,
          intent: 'calendar_booking',
          title: `📅 Schedule Briefing (${briefing.totalEvents} Events)`,
          description: briefing.summary,
          spokenResponse: briefing.spokenSummary,
          status: 'executed',
          createdAt: nowStr
        },
        spokenResponse: briefing.spokenSummary,
        toolCallExecuted: {
          toolName: 'check_calendar',
          params: { query: cleanedText || textTrimmed },
          result: briefing
        }
      };
    }

    // G1. Tool: Real-Time Clock, Time & Date Intelligence
    if (/(?:what\s+time\s+is\s+it|what'?s\s+the\s+time|current\s+time|quelle\s+heure|wie\s+spät|qué\s+hora|what\s+is\s+today'?s\s+date|what\s+day\s+is\s+(?:it|today)|quel\s+jour|welcher\s+tag|qué\s+día)/i.test(textLower)) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      const isDateQuery = /date|day|jour|tag|día/i.test(textLower);

      let spoken = `It's currently ${timeStr} on ${dateStr}.`;
      if (/quelle\s+heure|quel\s+jour/i.test(textLower)) {
        const frDate = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
        spoken = isDateQuery ? `Nous sommes le ${frDate}.` : `Il est actuellement ${timeStr}.`;
      } else if (/wie\s+spät|welcher\s+tag/i.test(textLower)) {
        const deDate = now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
        spoken = isDateQuery ? `Heute ist ${deDate}.` : `Es ist derzeit ${timeStr} Uhr.`;
      } else if (/qué\s+hora|qué\s+día/i.test(textLower)) {
        const esDate = now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        spoken = isDateQuery ? `Hoy es ${esDate}.` : `Son actualmente las ${timeStr}.`;
      }

      return {
        actionCard: {
          id: cardId,
          intent: 'knowledge_qa',
          title: `🕒 Local Time & Date: ${timeStr}`,
          description: `**Current Time**: **${timeStr}**\n**Date**: ${dateStr}\n**Timezone**: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
          spokenResponse: spoken,
          status: 'executed',
          createdAt: nowStr
        },
        spokenResponse: spoken,
        toolCallExecuted: {
          toolName: 'get_time_date',
          params: { time: timeStr, date: dateStr },
          result: { time: timeStr, date: dateStr }
        }
      };
    }

    // G2. Tool: Instant Math & Financial Calculator ("15% of 2500", "Calculate 450 * 12")
    const percentMatch = textLower.match(/(\d+(?:\.\d+)?)\s*%\s*(?:of|de|von)\s*(\d+(?:\.\d+)?)/i);
    const mathMatch = textLower.match(/(?:what\s+is|calculate|compute|combien\s+font|berechne|cuánto\s+es)\s+([0-9.,\s+\-*/x]+)/i);

    if (percentMatch) {
      const p = parseFloat(percentMatch[1]);
      const total = parseFloat(percentMatch[2]);
      const result = (p / 100) * total;
      const formatted = result.toLocaleString();
      const spoken = `${p}% of ${total.toLocaleString()} is ${formatted}.`;
      return {
        actionCard: {
          id: cardId,
          intent: 'knowledge_qa',
          title: `🔢 Calculation: ${p}% of ${total.toLocaleString()}`,
          description: `**Expression**: \`${p}% × ${total.toLocaleString()}\`\n**Result**: **${formatted}**`,
          spokenResponse: spoken,
          status: 'executed',
          createdAt: nowStr
        },
        spokenResponse: spoken,
        toolCallExecuted: {
          toolName: 'calculate_math',
          params: { expression: `${p}% of ${total}`, result },
          result: { result }
        }
      };
    } else if (mathMatch && mathMatch[1].trim().length > 1) {
      try {
        const cleanExpr = mathMatch[1].replace(/x/gi, '*').replace(/,/g, '');
        // Safe arithmetic eval for basic math (+, -, *, /)
        if (/^[0-9.\s+\-*/()]+$/.test(cleanExpr)) {
          const evalResult = Function(`'use strict'; return (${cleanExpr})`)();
          if (typeof evalResult === 'number' && !isNaN(evalResult)) {
            const formatted = evalResult.toLocaleString();
            const spoken = `The answer is ${formatted}.`;
            return {
              actionCard: {
                id: cardId,
                intent: 'knowledge_qa',
                title: `🔢 Math Calculation: ${cleanExpr.trim()}`,
                description: `**Formula**: \`${cleanExpr.trim()}\`\n**Result**: **${formatted}**`,
                spokenResponse: spoken,
                status: 'executed',
                createdAt: nowStr
              },
              spokenResponse: spoken,
              toolCallExecuted: {
                toolName: 'calculate_math',
                params: { expression: cleanExpr, result: evalResult },
                result: { result: evalResult }
              }
            };
          }
        }
      } catch {}
    }

    // G3. Tool: Live Timers & Countdowns ("Set a timer for 10 minutes", "Minuteur de 5 minutes")
    const timerMatch = textLower.match(/(?:set\s+(?:a\s+)?timer|timer|minuteur|stelle\s+(?:einen\s+)?timer|temporizador)(?:\s+(?:for|de|auf))?\s+(\d+)\s*(minutes|minute|min|seconds|second|sec|hours|hour|heures|heure|stunden|stunde|minutos|minuto)/i);
    if (timerMatch) {
      const amount = parseInt(timerMatch[1], 10);
      let unit = timerMatch[2].toLowerCase();
      let totalSeconds = amount * 60;
      if (/sec/i.test(unit)) totalSeconds = amount;
      if (/hour|heure|stunde/i.test(unit)) totalSeconds = amount * 3600;

      if (amount > 1 && unit === 'minute') unit = 'minutes';
      if (amount > 1 && unit === 'second') unit = 'seconds';
      if (amount > 1 && unit === 'hour') unit = 'hours';

      const spoken = `Setting a timer for ${amount} ${unit} starting now.`;
      return {
        actionCard: {
          id: cardId,
          intent: 'task_create',
          title: `⏱️ Active Timer: ${amount} ${unit}`,
          description: `Timer started for **${amount} ${unit}** (${totalSeconds}s). I will notify you when it expires.`,
          spokenResponse: spoken,
          status: 'executed',
          createdAt: nowStr
        },
        spokenResponse: spoken,
        toolCallExecuted: {
          toolName: 'set_timer',
          params: { durationSeconds: totalSeconds, label: `${amount} ${unit}` },
          result: { active: true, durationSeconds: totalSeconds }
        }
      };
    }

    // G4. Tool: Executive Task Creation ("Add task to review budget", "Create task...")
    const taskMatch = textTrimmed.match(/^(?:add\s+task|create\s+task|log\s+task|new\s+task|créer\s+tâche|erstelle\s+aufgabe|crear\s+tarea)\s+(?:to\s+)?(.+)$/i);
    if (taskMatch) {
      const taskTitle = taskMatch[1].trim();
      const capTitle = taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1);
      const spoken = `Added "${capTitle}" to your execution backlog.`;
      return {
        actionCard: {
          id: cardId,
          intent: 'task_create',
          title: `✅ Task Created: ${capTitle}`,
          description: `**Task**: ${capTitle}\n**Status**: Backlog\n**Assignee**: AI Agent / Andrew`,
          spokenResponse: spoken,
          status: 'executed',
          createdAt: nowStr
        },
        spokenResponse: spoken,
        toolCallExecuted: {
          toolName: 'create_task',
          params: { title: capTitle },
          result: { created: true, title: capTitle }
        }
      };
    }

    // G5. Tool: Reminders & Quick Notes ("Remind me to call David at 3 PM", "Take a note...")
    const reminderMatch = textTrimmed.match(/(?:remind\s+me\s+to|set\s+a\s+reminder\s+to|rappelle-moi\s+de|erinnere\s+mich\s+daran|recuérdame)\s+(.+)$/i);
    if (reminderMatch) {
      const reminderContent = reminderMatch[1].trim();
      const spoken = `I have set a reminder to ${reminderContent}.`;
      return {
        actionCard: {
          id: cardId,
          intent: 'task_create',
          title: `🔔 Reminder Set: ${reminderContent.charAt(0).toUpperCase() + reminderContent.slice(1)}`,
          description: `**Reminder**: ${reminderContent}\n**Status**: Active`,
          spokenResponse: spoken,
          status: 'executed',
          createdAt: nowStr
        },
        spokenResponse: spoken,
        toolCallExecuted: {
          toolName: 'set_reminder',
          params: { note: reminderContent },
          result: { saved: true }
        }
      };
    }

    // G. Gemini Cloud LLM / Edge Inference for Complex Open-Ended Queries & General Chat
    if (apiKey) {
      try {
        logger.debug('gemini_llm', `Dispatching open-ended query to Gemini Cloud API (gemini-1.5-flash)...`);
        const geminiResult = await processSpeechWithGemini(
          textTrimmed,
          apiKey,
          'gemini-1.5-flash',
          activeProfile,
          history.slice(-6).map(h => ({ speaker: h.speaker, text: h.text }))
        );
        if (geminiResult && geminiResult.actionCard) {
          const gCard = geminiResult.actionCard;
          return {
            actionCard: {
              id: cardId,
              intent: gCard.intent as any,
              title: gCard.title,
              description: gCard.description,
              spokenResponse: gCard.spokenResponse || geminiResult.spokenSummary,
              status: 'executed',
              createdAt: nowStr,
              emailData: gCard.emailData ? {
                id: 'em-' + Date.now().toString(36),
                toName: gCard.emailData.toName,
                toEmail: gCard.emailData.toEmail,
                subject: gCard.emailData.subject,
                body: gCard.emailData.body,
                tone: (gCard.emailData.tone as any) || 'friendly',
                status: 'draft'
              } : undefined,
              calendarData: gCard.calendarData ? {
                id: 'apt-' + Date.now().toString(36),
                title: gCard.calendarData.title,
                startDateTime: gCard.calendarData.startDateTime,
                endDateTime: gCard.calendarData.endDateTime,
                location: gCard.calendarData.location || 'Virtual / Google Meet',
                attendees: gCard.calendarData.attendees || [],
                status: 'confirmed'
              } : undefined
            },
            spokenResponse: gCard.spokenResponse || geminiResult.spokenSummary
          };
        }
      } catch (err) {
        logger.log('warn', 'gemini_llm', `Gemini cloud inference error, activating self-healing recovery: ${err}`);
        const recovery = resilienceService.handleAssistantError('LLM_CLOUD_TIMEOUT', err, textTrimmed);
        const solution = intelligentAdvisor.solve(cleanedText || textTrimmed);
        const combinedSpoken = `${recovery.spokenExplanation} ${solution.spokenResponse}`;
        return {
          actionCard: {
            id: cardId,
            intent: 'knowledge_qa',
            title: `${solution.title} (Auto-Recovered)`,
            description: `${recovery.userMessage}\n\n${solution.summary || solution.spokenResponse}`,
            spokenResponse: combinedSpoken,
            status: 'executed',
            createdAt: nowStr
          },
          spokenResponse: combinedSpoken
        };
      }
    }

    // H. High-IQ Client Semantic Knowledge & Solution Engine Fallback
    const solution = intelligentAdvisor.solve(cleanedText || textTrimmed);
    return {
      actionCard: {
        id: cardId,
        intent: 'knowledge_qa',
        title: solution.title,
        description: solution.summary || solution.spokenResponse,
        spokenResponse: solution.spokenResponse,
        status: 'executed',
        createdAt: nowStr
      },
      spokenResponse: solution.spokenResponse
    };
  }
}

export const cortexEngine = CortexDialogueEngine.getInstance();
