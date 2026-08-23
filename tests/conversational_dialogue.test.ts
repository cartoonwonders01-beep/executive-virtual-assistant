import test from 'node:test';
import assert from 'node:assert/strict';
import { dialogueEngine } from '../server/dialogueEngine';
import { skillRegistry, parseSkillFromSpeech } from '../server/skillRegistry';
import { wakeWordService } from '../src/services/wakeWordService';

test('Conversational Dialogue Engine & Dynamic Skill Learning Suite', async (t) => {

  await t.test('Turn 1: Contact query sets context contact and responds informatively', () => {
    dialogueEngine.resetSession();
    const res = dialogueEngine.processTurn('Who is Sarah?');

    assert.equal(res.turn.speaker, 'assistant');
    assert.ok(res.turn.spokenResponse?.includes('Sarah Chen'), 'Spoken response mentions Sarah Chen');
    assert.ok(res.session.context.lastMentionedContact, 'Context stores Sarah Chen');
    assert.equal(res.session.context.lastMentionedContact?.email, 'sarah.chen@innovate.co');
  });

  await t.test('Turn 2: Pronoun resolution uses context to draft email to Sarah Chen', () => {
    const res = dialogueEngine.processTurn('Send her an email about our Q3 budget forecast');

    assert.equal(res.turn.speaker, 'assistant');
    assert.ok(res.session.context.pendingAction, 'Pending action queued for confirmation');
    assert.equal(res.session.context.pendingAction?.type, 'confirm_send_email');
    assert.equal(res.session.context.pendingAction?.payload.toEmail, 'sarah.chen@innovate.co');
    assert.ok(res.turn.spokenResponse?.includes('Sarah Chen'), 'Asks for confirmation to send to Sarah Chen');
  });

  await t.test('Turn 3: Confirmation dialogue executes pending action upon "Yes, send it"', () => {
    const res = dialogueEngine.processTurn('Yes, send it');

    assert.equal(res.turn.speaker, 'assistant');
    assert.ok(res.turn.spokenResponse?.includes('dispatched'), 'Response confirms email was sent');
    assert.equal(res.session.context.pendingAction, undefined, 'Pending action is cleared');
    assert.equal(res.session.status, 'idle', 'Session status resets to idle');
  });

  await t.test('Turn 4: Dynamic voice skill learning registers new routine from speech', () => {
    const speech = "When I say 'Daily Standup', triage my inbox and summarize top priority tasks";
    const parsed = parseSkillFromSpeech(speech);

    assert.ok(parsed, 'Successfully parsed skill from speech');
    assert.equal(parsed?.triggerPhrase, 'daily standup');
    assert.ok(parsed?.actionSteps.length >= 2, 'Has multiple sequential action steps');

    const created = skillRegistry.createSkill(parsed!);
    assert.ok(created.id, 'Skill assigned unique ID');
    assert.equal(created.triggerPhrase, 'daily standup');
  });

  await t.test('Turn 5: Spoken custom trigger executes the learned routine pipeline', () => {
    const res = dialogueEngine.processTurn('Daily Standup');

    assert.equal(res.turn.speaker, 'assistant');
    assert.ok(res.turn.spokenResponse?.includes('Daily Standup Routine') || res.turn.spokenResponse?.includes('Executed'), 'Acknowledged routine execution');
    
    const registered = skillRegistry.getSkills().find(s => s.triggerPhrase === 'daily standup');
    assert.ok(registered && registered.executionCount >= 1, 'Execution count incremented');
  });

  await t.test('Turn 6: Wake-word extraction isolates trigger phrase and trailing command', () => {
    const res1 = wakeWordService.testRecognize('Hey Eve what is the weather today');
    assert.equal(res1.detected, true);
    assert.equal(res1.wakeWord, 'hey eve');
    assert.equal(res1.command, 'what is the weather today');

    const res2 = wakeWordService.testRecognize('Hello Eve send an email to Emily');
    assert.equal(res2.detected, true);
    assert.equal(res2.wakeWord, 'hello eve');
    assert.equal(res2.command, 'send an email to emily');

    const res3 = wakeWordService.testRecognize('Hey Eva check my calendar');
    assert.equal(res3.detected, true);
    assert.equal(res3.wakeWord, 'hey eva');
    assert.equal(res3.command, 'check my calendar');
  });

  await t.test('Turn 7: Open question on productivity delivers spoken advice and structured solution', () => {
    const res = dialogueEngine.processTurn('What are three strategies to improve my morning routine?');
    assert.equal(res.turn.speaker, 'assistant');
    assert.equal(res.actionCard?.intent, 'knowledge_qa', 'Intent resolved to knowledge_qa instead of creating a task');
    assert.ok(res.turn.spokenResponse?.includes('deep work') || res.turn.spokenResponse?.includes('leverage'), 'Spoke actionable productivity advice');
    assert.ok(res.actionCard?.description.includes('Strategic Insights'), 'Contains structured insights');
  });

  await t.test('Turn 8: Strategic client escalation inquiry delivers executive framework', () => {
    const res = dialogueEngine.processTurn('How do I handle a difficult client escalation?');
    assert.equal(res.turn.speaker, 'assistant');
    assert.equal(res.actionCard?.intent, 'knowledge_qa');
    assert.ok(res.turn.spokenResponse?.includes('A.C.T.S.') || res.turn.spokenResponse?.includes('escalation'), 'Spoke de-escalation framework');
  });

  await t.test('Turn 9: Financial valuation inquiry explains DCF model and formula', () => {
    const res = dialogueEngine.processTurn('Can you explain how a DCF model works?');
    assert.equal(res.turn.speaker, 'assistant');
    assert.equal(res.actionCard?.intent, 'knowledge_qa');
    assert.ok(res.turn.spokenResponse?.includes('Free Cash Flows') || res.turn.spokenResponse?.includes('WACC'), 'Spoke DCF financial explanation');
    assert.ok(res.actionCard?.description.includes('Enterprise Value'), 'Card includes formula and methodology');
  });

});
