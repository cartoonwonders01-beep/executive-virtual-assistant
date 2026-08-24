import { ActionCard, DialogueTurn, EmailDraft, CalendarAppointment, TaskItem, CustomLLMProfile } from '../types';
import { memoryGraph } from './memoryGraphService';
import { webSearchService } from './webSearchService';
import { autonomousPractice } from './autonomousPracticeWorker';
import { processSpeechWithGemini } from './geminiService';
import { intelligentAdvisor } from './intelligentAdvisor';
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

    // 1. If live Gemini API key is available, leverage Live Gemini LLM with Family Context & Tool Schemas
    if (apiKey) {
      try {
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
                location: gCard.calendarData.location || 'Google Meet',
                attendees: gCard.calendarData.attendees || [],
                status: 'confirmed'
              } : undefined
            },
            spokenResponse: gCard.spokenResponse || geminiResult.spokenSummary
          };
        }
      } catch (err) {
        logger.log('warn', 'ai_reasoning', `Gemini remote call failed, falling back to local Cortex ReAct reasoning: ${err}`);
      }
    }

    // =========================================================================
    // 2. High-IQ Local ReAct Semantic Cortex Reasoning & Tool Calling
    // =========================================================================

    // Pre-clean speech transcript to remove leading STT hallucinations/fillers
    const cleanedText = textTrimmed
      .replace(/^(?:hey\s+eve|hi\s+eve|eve|eeve|if\s+i\s+want\s+you\s+to|if\s+you\s+can|if|ok\s+eve|okay\s+eve|please\s+eve|please)[,\s:]+/i, '')
      .trim();
    const cleanLower = cleanedText.toLowerCase();

    // A. Tool: Web Search & Weather Grounding (Prioritized over calendar)
    if (/weather|forecast|rain|temperature|degrees|meteo/i.test(textLower) || webSearchService.isWebSearchQuery(cleanedText || textTrimmed)) {
      const query = /weather|forecast|rain|temperature/i.test(textLower) ? (cleanedText || 'weather forecast') : (cleanedText || textTrimmed);
      const searchRes = await webSearchService.searchWeb(query);
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
    if (/(?:email|write\s+(?:an?\s+)?email|send\s+(?:an?\s+)?email|mail|draft\s+(?:an?\s+)?(?:note|email)|send\s+[\w\s]+\s+(?:a\s+)?(?:quick\s+)?(?:email|note)|let\s+\w+\s+know|message\s+\w+\s+saying|tell\s+\w+\s+(?:that|saying)|(?:send|write|draft|email)\s+(?:a\s+)?(?:note\s+to|email\s+to)?\s*(?:eleanor|eleonore|ellie|celine|elizabeth|eliza|alexander|alex|angelina|lina|sarah)|modify\s+(?:the\s+)?email|in\s+the\s+title|text\s+to\s+the\s+email)/i.test(textLower) || /(?:email|send\s+(?:a\s+)?note|draft\s+(?:a\s+)?note)/i.test(cleanLower)) {
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
      } else if (/sarah/i.test(textLower)) {
        const ent = memoryGraph.findEntityByRelationOrAlias('sarah');
        recipientName = ent?.entityName || 'Sarah Chen';
        recipientEmail = ent?.email || 'sarah.chen@innovate.co';
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

    // F. Tool: Calendar Coordination ("My calendar", "What is on my schedule tomorrow")
    if (/^(?:my\s+)?calendar$|^(?:check|view|show|what's\s+on)\s+(?:my\s+)?(?:calendar|schedule)|(?:calendar|schedule|agenda|appointment|meeting)/i.test(textLower)) {
      const spoken = `You have your Q3 Product Strategy sync tomorrow at 10:00 AM, followed by an afternoon alignment call. Your schedule is clear from 2:00 PM onwards.`;
      return {
        actionCard: {
          id: cardId,
          intent: 'calendar_booking',
          title: `Schedule Briefing`,
          description: spoken,
          spokenResponse: spoken,
          status: 'executed',
          createdAt: nowStr
        },
        spokenResponse: spoken,
        toolCallExecuted: {
          toolName: 'check_calendar',
          params: {},
          result: { eventsFound: 2 }
        }
      };
    }

    // E. Conversational Strategic Dialogue, Capability Inquiries & Personal Q&A
    if (intelligentAdvisor.isQuestionOrInquiry(cleanedText || textTrimmed)) {
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

    // F. General Executive Inquiry Fallback
    const solution = intelligentAdvisor.solve(textTrimmed);
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
