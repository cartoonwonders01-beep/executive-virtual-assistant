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
    const res1 = wakeWordService.testRecognize('Hey Nova what is the weather today');
    assert.equal(res1.detected, true);
    assert.equal(res1.wakeWord, 'hey nova');
    assert.equal(res1.command, 'what is the weather today');

    const res2 = wakeWordService.testRecognize('Hello Nova send an email to Emily');
    assert.equal(res2.detected, true);
    assert.equal(res2.wakeWord, 'hello nova');
    assert.equal(res2.command, 'send an email to emily');

    const res3 = wakeWordService.testRecognize('Hey Aria check my calendar');
    assert.equal(res3.detected, true);
    assert.equal(res3.wakeWord, 'hey aria');
    assert.equal(res3.command, 'check my calendar');
  });

});
