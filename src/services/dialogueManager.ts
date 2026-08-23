import { 
  DialogueTurn, 
  DialogueSession, 
  DialogueContext, 
  ActionCard, 
  ContactPerson, 
  EmailDraft, 
  CalendarAppointment,
  CustomSkill 
} from '../types';

export class ClientDialogueManager {
  private session: DialogueSession;

  constructor() {
    this.session = this.createNewSession();
  }

  public getSession(): DialogueSession {
    return this.session;
  }

  public createNewSession(): DialogueSession {
    this.session = {
      id: 'sess-' + Date.now().toString(36),
      turns: [],
      context: {
        variables: {}
      },
      status: 'idle',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return this.session;
  }

  public getTurns(): DialogueTurn[] {
    return this.session.turns;
  }

  public clearTurns(): void {
    this.session.turns = [];
    this.session.updatedAt = new Date().toISOString();
  }

  public addTurn(speaker: 'user' | 'assistant', text: string, intent?: any, spokenResponse?: string): DialogueTurn {
    const turn: DialogueTurn = {
      id: 'turn-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5),
      speaker,
      text,
      intent,
      spokenResponse,
      timestamp: new Date().toISOString()
    };
    this.session.turns.push(turn);
    this.session.updatedAt = new Date().toISOString();
    return turn;
  }

  public setContextContact(contact: ContactPerson): void {
    this.session.context.lastMentionedContact = contact;
  }

  public setPendingAction(action: { type: any; payload: any; prompt: string }): void {
    this.session.context.pendingAction = action;
    this.session.status = 'waiting_for_confirmation';
  }

  public clearPendingAction(): void {
    this.session.context.pendingAction = undefined;
    this.session.status = 'idle';
  }

  public hasPendingAction(): boolean {
    return Boolean(this.session.context.pendingAction);
  }

  public getPendingAction() {
    return this.session.context.pendingAction;
  }

  public getLastMentionedContact(): ContactPerson | undefined {
    return this.session.context.lastMentionedContact;
  }
}

export const dialogueManager = new ClientDialogueManager();
