import { 
  DialogueTurn, 
  DialogueSession, 
  DialogueContext, 
  ActionCard, 
  ContactPerson, 
  EmailDraft, 
  CalendarAppointment 
} from '../src/types';
import { db } from './db';
import { skillRegistry } from './skillRegistry';
import { parseIntentFromSpeech } from './intentParser';

export class DialogueEngine {
  private currentSession: DialogueSession;

  constructor() {
    this.currentSession = this.createNewSession();
  }

  public getSession(): DialogueSession {
    return this.currentSession;
  }

  public createNewSession(): DialogueSession {
    this.currentSession = {
      id: 'sess-' + Date.now().toString(36),
      turns: [],
      context: {
        variables: {}
      },
      status: 'idle',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return this.currentSession;
  }

  public resetSession(): DialogueSession {
    return this.createNewSession();
  }

  /**
   * Processes a dialogue turn with multi-turn context memory:
   * Handles:
   * 1. Confirmation turns ("yes", "send it", "confirm", "proceed", "cancel")
   * 2. Pronoun & entity resolution ("Who is Sarah?" -> "Send her an email")
   * 3. Skill learning triggers ("When I say 'Morning Briefing'...")
   * 4. Custom skill execution ("Morning Briefing")
   * 5. Out-of-the-box Assistant commands
   */
  public processTurn(userSpeech: string): {
    turn: DialogueTurn;
    actionCard?: ActionCard;
    session: DialogueSession;
  } {
    const text = userSpeech.trim();
    const textLower = text.toLowerCase();
    const nowStr = new Date().toISOString();
    const turnId = 'turn-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5);

    // Record user turn
    const userTurn: DialogueTurn = {
      id: turnId + '-u',
      speaker: 'user',
      text,
      timestamp: nowStr
    };
    this.currentSession.turns.push(userTurn);

    let spokenResponse = '';
    let actionCard: ActionCard | undefined;
    const ctx = this.currentSession.context;

    // -------------------------------------------------------------------------
    // 1. Pending Action Confirmation Turn ("Yes", "Send it", "Cancel", "No")
    // -------------------------------------------------------------------------
    if (ctx.pendingAction) {
      const isAffirmative = /^(yes|yeah|sure|do\s+it|send\s+it|confirm|proceed|ok|okay|please\s+send)/i.test(textLower);
      const isNegative = /^(no|cancel|stop|don't|abort|nevermind|discard)/i.test(textLower);

      if (isAffirmative) {
        const pending = ctx.pendingAction;
        ctx.pendingAction = undefined;
        this.currentSession.status = 'idle';

        if (pending.type === 'confirm_send_email' && pending.payload) {
          const email: EmailDraft = { ...pending.payload, status: 'sent', sentAt: nowStr };
          ctx.lastDraftedEmail = email;

          actionCard = {
            id: 'ac-' + Date.now().toString(36),
            intent: 'email_draft',
            title: `Delivered Email to ${email.toName}`,
            description: `Subject: "${email.subject}" • Sent to ${email.toEmail}`,
            spokenResponse: `Sent! I have dispatched and delivered the email to ${email.toName}.`,
            status: 'executed',
            createdAt: nowStr,
            emailData: email
          };
          spokenResponse = actionCard.spokenResponse;
        } else {
          spokenResponse = "Confirmed! I've executed your requested action.";
        }
      } else if (isNegative) {
        ctx.pendingAction = undefined;
        this.currentSession.status = 'idle';
        spokenResponse = "Cancelled. I won't send that. What else can I help you with?";
      }
    }

    // -------------------------------------------------------------------------
    // 2. Dynamic Skill Ingestion: "When I say [Trigger], [Do Action]"
    // -------------------------------------------------------------------------
    if (!spokenResponse && /(?:when\s+i\s+say|whenever\s+i\s+say|learn\s+(?:a\s+)?skill|teach\s+skill)/i.test(textLower)) {
      const learnedSkill = skillRegistry.parseSkillFromSpeech(text);
      if (learnedSkill) {
        actionCard = {
          id: 'ac-' + Date.now().toString(36),
          intent: 'custom_skill_learn',
          title: `🧠 Learned New Skill: "${learnedSkill.name}"`,
          description: `Trigger: "${learnedSkill.triggerPhrase}" • ${learnedSkill.actionSteps.length} automated steps configured`,
          spokenResponse: `I've learned that routine! Whenever you say "${learnedSkill.triggerPhrase}", I will automatically execute ${learnedSkill.description}.`,
          status: 'executed',
          createdAt: nowStr
        };
        spokenResponse = actionCard.spokenResponse;
      }
    }

    // -------------------------------------------------------------------------
    // 3. Custom Skill Execution Match (e.g. "Morning Briefing", "Wife Check-in")
    // -------------------------------------------------------------------------
    if (!spokenResponse) {
      const matchedSkill = skillRegistry.findMatchingSkill(text);
      if (matchedSkill) {
        skillRegistry.incrementExecutionCount(matchedSkill.id);
        const stepsExecuted = matchedSkill.actionSteps.map(s => s.label).join(' → ');

        actionCard = {
          id: 'ac-' + Date.now().toString(36),
          intent: 'custom_skill_exec',
          title: `⚡ Executing Skill: ${matchedSkill.name}`,
          description: `Steps: ${stepsExecuted}`,
          spokenResponse: `Executing your ${matchedSkill.name} routine: ${matchedSkill.description}. All ${matchedSkill.actionSteps.length} steps completed.`,
          status: 'executed',
          createdAt: nowStr
        };
        spokenResponse = actionCard.spokenResponse;
      }
    }

    // -------------------------------------------------------------------------
    // 4. Multi-Turn Pronoun & Contact Resolution:
    // "Who is Sarah?" -> "Sarah Chen is Head of Growth..."
    // Follow-up: "Send her an email about the budget" -> Understands "her" = Sarah
    // -------------------------------------------------------------------------
    if (!spokenResponse) {
      // Check if user is asking about a contact ("Who is X?", "What is X's phone/email?")
      const whoMatch = textLower.replace(/[?.!,]+$/, '').match(/who\s+is\s+([a-zA-Z\s]+)/i);
      if (whoMatch) {
        const queryName = whoMatch[1].trim();
        const contacts = db.getContacts();
        const found = contacts.find(c => c.name.toLowerCase().includes(queryName.toLowerCase()));

        if (found) {
          ctx.lastMentionedContact = found;
          spokenResponse = `${found.name} is your ${found.role || 'colleague'} at ${found.company || 'Innovate Group'}. You can email them at ${found.email || 'their work address'}.`;
          actionCard = {
            id: 'ac-' + Date.now().toString(36),
            intent: 'knowledge_qa',
            title: `Contact: ${found.name}`,
            description: `${found.role || 'Executive'} • ${found.company || 'Company'} • ${found.email}`,
            spokenResponse,
            status: 'executed',
            createdAt: nowStr,
            contactData: found
          };
        }
      }
    }

    // Pronoun resolution: "email him/her/them", "send him/her an email", "call him/her/them", "schedule with him/her/them"
    if (!spokenResponse && /(send|draft|email|message|write|tell|call|meet\s+with)\s+(?:him|her|them|that\s+person)/i.test(textLower)) {
      if (ctx.lastMentionedContact) {
        const contact = ctx.lastMentionedContact;
        const isEmail = /send|draft|email|message|write|tell/i.test(textLower);

        if (isEmail) {
          const draft: EmailDraft = {
            id: 'em-' + Date.now().toString(36),
            toName: contact.name,
            toEmail: contact.email || `${contact.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
            subject: 'Quick Follow-Up from Andrew',
            body: `Hi ${contact.name.split(' ')[0]},\n\nFollowing up regarding our recent discussion.\n\nBest,\nAndrew`,
            tone: 'professional',
            status: 'draft'
          };

          ctx.lastDraftedEmail = draft;
          ctx.pendingAction = {
            type: 'confirm_send_email',
            payload: draft,
            prompt: `Drafted email to ${contact.name}. Say 'Send it' to deliver.`
          };
          this.currentSession.status = 'waiting_for_confirmation';

          spokenResponse = `I've prepared a draft to ${contact.name} regarding your request. Should I send it now?`;
          actionCard = {
            id: 'ac-' + Date.now().toString(36),
            intent: 'dialogue_confirmation',
            title: `Draft for ${contact.name} Ready`,
            description: `Subject: "${draft.subject}" • To: ${draft.toEmail}`,
            spokenResponse,
            status: 'pending',
            createdAt: nowStr,
            emailData: draft
          };
        }
      }
    }

    // -------------------------------------------------------------------------
    // 5. Standard Speech Intent Parser Fallback
    // -------------------------------------------------------------------------
    if (!spokenResponse) {
      actionCard = parseIntentFromSpeech(text);
      spokenResponse = actionCard.spokenResponse;

      if (actionCard.contactData) ctx.lastMentionedContact = actionCard.contactData;
      if (actionCard.emailData) ctx.lastDraftedEmail = actionCard.emailData;
      if (actionCard.calendarData) ctx.lastAppointment = actionCard.calendarData;
      if (actionCard.taskData) ctx.lastCreatedTask = actionCard.taskData as any;
    }

    // Record assistant response turn
    const assistantTurn: DialogueTurn = {
      id: turnId + '-a',
      speaker: 'assistant',
      text: spokenResponse,
      intent: actionCard?.intent,
      spokenResponse,
      timestamp: new Date().toISOString(),
      actionCardId: actionCard?.id
    };
    this.currentSession.turns.push(assistantTurn);
    this.currentSession.updatedAt = new Date().toISOString();

    return {
      turn: assistantTurn,
      actionCard,
      session: this.currentSession
    };
  }
}

export const dialogueEngine = new DialogueEngine();
