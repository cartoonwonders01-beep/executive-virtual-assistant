import { EmailDraft, ContactPerson } from '../src/types';
import { db } from './db';

export function draftEmailFromSpeech(speechText: string, contactHint?: string): EmailDraft {
  const textLower = speechText.toLowerCase();

  // 1. Determine recipient
  let recipient: ContactPerson | undefined;
  if (contactHint) {
    recipient = db.findContact(contactHint);
  }
  
  if (!recipient) {
    const contacts = db.getContacts();
    for (const c of contacts) {
      if (textLower.includes(c.name.toLowerCase().split(' ')[0])) {
        recipient = c;
        break;
      }
    }
  }

  // Check relationship keywords
  let toName = recipient ? recipient.name : 'Recipient';
  let toEmail = recipient ? (recipient.email || 'partner@example.com') : 'recipient@example.com';

  if (!recipient) {
    const contacts = db.getContacts();
    const wifeContact = contacts.find(c => (c.role && /wife|family/i.test(c.role)) || /emily/i.test(c.name));
    
    if (textLower.includes('wife')) {
      toName = wifeContact ? wifeContact.name : 'Emily Baxter (Wife)';
      toEmail = wifeContact?.email || 'emily.baxter@personal.com';
    } else if (textLower.includes('husband')) {
      toName = 'My Husband';
      toEmail = 'husband@personal.com';
    } else if (textLower.includes('mom') || textLower.includes('mum') || textLower.includes('mother')) {
      toName = 'Mom';
      toEmail = 'mom@personal.com';
    } else if (textLower.includes('dad') || textLower.includes('father')) {
      toName = 'Dad';
      toEmail = 'dad@personal.com';
    } else {
      const matchTo = speechText.match(/(?:email|mail|message)\s+(?:to\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
      if (matchTo && !['The', 'An', 'My'].includes(matchTo[1])) {
        toName = matchTo[1];
        toEmail = `${matchTo[1].toLowerCase().replace(/\s+/g, '.')}@example.com`;
      }
    }
  }

  // 2. Extract Message / "saying ..." or "regarding ..."
  let subject = 'Message from Andrew';
  let bodyContent = '';

  const sayingMatch = speechText.match(/(?:saying|to say|that says|with message|telling (?:her|him|them)|to tell (?:her|him|them))\s+(.+)$/i);
  const regardingMatch = speechText.match(/(?:regarding|about|re:|topic:|for)\s+([^,.]+)/i);

  if (/love|loved/i.test(textLower) && (textLower.includes('wife') || textLower.includes('emily'))) {
    subject = 'Thinking of you ❤️';
    bodyContent = `Hi Emily,\n\nJust wanted to send you a quick note to say I love you and hope you are having a wonderful day!\n\nLove,\nAndrew`;
  } else if (sayingMatch) {
    const directMessage = sayingMatch[1].trim();
    subject = directMessage.length > 40 ? directMessage.substring(0, 37) + '...' : directMessage;
    subject = subject.charAt(0).toUpperCase() + subject.slice(1);
    
    if (/love you|miss you|thinking of you|kiss|hug/i.test(directMessage)) {
      subject = 'Thinking of you ❤️';
      bodyContent = `${directMessage.charAt(0).toUpperCase() + directMessage.slice(1)} ❤️\n\nWith all my love,\nAndrew`;
    } else {
      bodyContent = `Hi ${toName.split(' ')[0]},\n\n${directMessage.charAt(0).toUpperCase() + directMessage.slice(1)}.\n\nBest regards,\nAndrew`;
    }
  } else if (regardingMatch) {
    const topic = regardingMatch[1].trim().replace(/^the\s+/i, '');
    subject = topic.charAt(0).toUpperCase() + topic.slice(1);
    bodyContent = `Hi ${toName.split(' ')[0]},\n\nI wanted to follow up regarding ${topic}.\n\nLet me know your thoughts so we can coordinate next steps.\n\nBest regards,\nAndrew`;
  } else {
    bodyContent = `Hi ${toName.split(' ')[0]},\n\nI wanted to connect and follow up on our recent conversation.\n\nBest regards,\nAndrew`;
  }

  const emailDraft: EmailDraft = {
    id: 'em-' + Date.now().toString(36),
    toName,
    toEmail,
    subject,
    body: bodyContent,
    tone: /love|miss you|family|wife|husband|mom|dad/i.test(textLower) ? 'friendly' : 'professional',
    status: 'draft'
  };

  return emailDraft;
}
