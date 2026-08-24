// ==============================================================================
// Comprehensive Multi-Turn Voice Action Depth Suite
// Verifies all core executive capabilities, multi-turn state transitions,
// topic switching, family roster recall, and zero historic loop traps.
// ==============================================================================

import test from 'node:test';
import assert from 'node:assert/strict';
import { cortexEngine } from '../src/services/cortexDialogueEngine';
import { dialogueManager } from '../src/services/dialogueManager';
import { memoryGraph } from '../src/services/memoryGraphService';
import { googleEmbeddings } from '../src/services/googleEmbeddingsService';
import { recordAssistantSpokenText, isAcousticEcho } from '../src/services/speechSynthesis';

test('Comprehensive Multi-Turn Voice Action Depth Suite', async (t) => {

  await t.test('1. Multi-Turn Email Workflow with Slot Updates & Preview', async () => {
    // Step 1: Draft email to Celine
    dialogueManager.clearPendingAction();
    const draftRes = await cortexEngine.reasonAndAct("Send an email to Celine saying I will be home soon");
    assert.equal(draftRes.actionCard.intent, 'email_draft');
    assert.equal(draftRes.actionCard.emailData?.toEmail, 'celine.loeuille@gmail.com');
    assert.ok(draftRes.spokenResponse.includes('Celine Loeuille'));

    // Step 2: In-flight slot modification ("say in the title I love you")
    const modRes = await cortexEngine.reasonAndAct("Now I would like to say in the title I love you");
    assert.equal(modRes.actionCard.intent, 'email_draft');
    assert.equal(modRes.actionCard.emailData?.toEmail, 'celine.loeuille@gmail.com');
    assert.ok(modRes.actionCard.emailData?.body.includes('love you'));

    // Step 3: Inspect draft contents
    const inspectRes = await cortexEngine.reasonAndAct("What's the contents of the email");
    assert.ok(/draft|subject|reads|Celine/i.test(inspectRes.spokenResponse));
  });

  await t.test('2. Family Roster Knowledge Graph & Nickname Disambiguation', async () => {
    const questions = [
      { q: "Who's in my family", expected: /celine|elizabeth|alexander|eleonore|angelina/i },
      { q: "Email Eleanor to check the document", recipient: 'eleonore.a.baxter@gmail.com' },
      { q: "Draft note to Ellie: see you tomorrow", recipient: 'eleonore.a.baxter@gmail.com' },
      { q: "Email Alex: review the code", recipient: 'alexander.j.baxter@gmail.com' },
      { q: "Draft note to Eliza: great presentation", recipient: 'elizabth.js.baxter@gmail.com' },
      { q: "Send Angelina an email wishing her luck", recipient: 'angelina.c.baxter@gmail.com' }
    ];

    for (const item of questions) {
      const res = await cortexEngine.reasonAndAct(item.q);
      if (item.expected) {
        assert.ok(item.expected.test(res.spokenResponse), `Matched expected pattern for "${item.q}"`);
      }
      if (item.recipient) {
        assert.equal(res.actionCard.emailData?.toEmail, item.recipient, `Correct recipient resolved for "${item.q}"`);
      }
    }
  });

  await t.test('3. Weather vs Calendar Disambiguation Under Multiple Phrasings', async () => {
    const weatherQueries = [
      "What's the weather going to be like tomorrow",
      "Is it going to rain this afternoon",
      "What is the forecast in Paris",
      "How hot is it outside"
    ];

    for (const q of weatherQueries) {
      const res = await cortexEngine.reasonAndAct(q);
      assert.equal(res.actionCard.intent, 'web_search', `Correctly routed weather query "${q}" to web search`);
      assert.ok(!res.spokenResponse.includes('Q3 Product Strategy'), `Did not confuse weather with calendar`);
    }

    const calendarQueries = [
      "My calendar",
      "Check my schedule for tomorrow",
      "What is on my calendar today",
      "Show my appointments"
    ];

    for (const q of calendarQueries) {
      const res = await cortexEngine.reasonAndAct(q);
      assert.equal(res.actionCard.intent, 'calendar_booking', `Correctly routed calendar query "${q}" to calendar`);
    }
  });

  await t.test('4. Seamless Topic-Shifting Without Getting Trapped in Stale States', async () => {
    // Turn 1: Start an email
    await cortexEngine.reasonAndAct("Draft an email to Celine saying running late");

    // Turn 2: Shift to weather
    const weatherRes = await cortexEngine.reasonAndAct("What's the weather tomorrow");
    assert.equal(weatherRes.actionCard.intent, 'web_search');

    // Turn 3: Shift to joke
    const jokeRes = await cortexEngine.reasonAndAct("Tell me a joke");
    assert.equal(jokeRes.actionCard.intent, 'knowledge_qa');

    // Turn 4: Shift to pipeline inquiry
    const pipelineRes = await cortexEngine.reasonAndAct("What is the state of my pipeline of work");
    assert.ok(pipelineRes.spokenResponse.length > 20);
    assert.ok(!pipelineRes.spokenResponse.includes('I have cancelled'));
  });

  await t.test('5. Compound Multi-Task Execution', async () => {
    const compoundRes = await cortexEngine.reasonAndAct("Please tell me a joke and start thinking about also the email that I need to send");
    assert.equal(compoundRes.actionCard.intent, 'email_draft');
    assert.ok(compoundRes.spokenResponse.includes('Celine Loeuille'));
  });

  await t.test('6. Google Native Vector Embeddings & Similarity Matching', async () => {
    const query = "Find notes about Celine and family";
    const results = await googleEmbeddings.searchSemanticContext(query, 3);
    assert.ok(results.length > 0);
    assert.ok(results.some(r => r.record.category === 'family_roster'));
  });

  await t.test('7. Acoustic Echo Cancellation (AEC) Shield', async () => {
    recordAssistantSpokenText("Your schedule is clear from 2:00 PM onwards. Let me know what step you'd like to take.");
    assert.ok(isAcousticEcho("let me know what step you'd like to take"));
    assert.ok(isAcousticEcho("your schedule is clear from 2 00 pm"));
    assert.ok(!isAcousticEcho("what is the weather tomorrow in london"));
  });

  await t.test('8. Emergency Hard Halt Verification', async () => {
    const { wakeWordService } = await import('../src/services/wakeWordService');
    const { stopSpeaking, isCurrentlySpeaking } = await import('../src/services/speechSynthesis');
    const { dialogueManager } = await import('../src/services/dialogueManager');

    // Simulate active dialogue and wake-word
    dialogueManager.setPendingAction({
      type: 'send_email',
      payload: { toName: 'Celine', toEmail: 'celine.loeuille@gmail.com', subject: 'Emergency Test', body: 'Test', tone: 'friendly', status: 'draft', id: 'halt-1' },
      prompt: 'Confirm email?'
    });
    assert.ok(dialogueManager.hasPendingAction(), 'Pending action set');

    // Execute hard halt
    wakeWordService.hardHalt();
    stopSpeaking();
    dialogueManager.clearPendingAction();

    assert.equal(isCurrentlySpeaking(), false, 'Speech synthesis silenced');
    assert.equal(wakeWordService.isPassiveListeningActive(), false, 'Wake word completely halted');
    assert.equal(dialogueManager.hasPendingAction(), false, 'Pending state cleared');
  });

  await t.test('9. Sub-Second Snappy Fast-Path Reasoning Latency', async () => {
    const start = Date.now();
    const res = await cortexEngine.reasonAndAct("Tell me a joke");
    const duration = Date.now() - start;

    assert.equal(res.actionCard.intent, 'knowledge_qa');
    assert.ok(duration < 250, `Fast-path executed in ${duration}ms (target: <250ms)`);
  });

  await t.test('10. Session Rotation & Log Archiving Verification', async () => {
    const { logger } = await import('../src/services/loggerService');

    const initialSessionId = logger.getSessionId();
    logger.log('info', 'ai_reasoning', 'Testing session archiving turn 1');
    logger.log('info', 'speech_stt', 'User asked about weather');

    const archive = logger.archiveCurrentSession('Test Completed Chat Session');

    assert.equal(archive.sessionId, initialSessionId, 'Archived record retains initial session id');
    assert.equal(archive.title, 'Test Completed Chat Session');
    assert.ok(archive.entryCount >= 2, 'Archived session contains entries');

    const newSessionId = logger.getSessionId();
    assert.notEqual(newSessionId, initialSessionId, 'New fresh session id was generated');

    const archives = logger.getArchivedSessions();
    assert.ok(archives.some(a => a.id === archive.id), 'Archive is retrievable via getArchivedSessions');
  });

});
