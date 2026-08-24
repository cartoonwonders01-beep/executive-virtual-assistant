import test from 'node:test';
import assert from 'node:assert/strict';

test('Real-World Dialogue & Telemetry Robustness Suite (Zero Boilerplate Verification)', async (t) => {
  const { cortexEngine } = await import('../src/services/cortexDialogueEngine');
  const { intelligentAdvisor } = await import('../src/services/intelligentAdvisor');
  const { memoryGraph } = await import('../src/services/memoryGraphService');
  const { logger } = await import('../src/services/loggerService');

  const BANNED_BOILERPLATE = 'The core strategic priority is to identify your primary point of leverage';

  await t.test('Case 1: User Identity & Profile ("How old am I")', async () => {
    const res = await cortexEngine.reasonAndAct('How old am I');
    assert.ok(!res.spokenResponse.includes(BANNED_BOILERPLATE), 'Did not return banned boilerplate');
    assert.ok(res.spokenResponse.includes('Andrew Baxter'), 'Correctly identified Andrew Baxter');
  });

  await t.test('Case 2: Assistant Origin ("Where are you from")', async () => {
    const res = await cortexEngine.reasonAndAct('Where are you from');
    assert.ok(!res.spokenResponse.includes(BANNED_BOILERPLATE), 'Did not return banned boilerplate');
    assert.ok(/edge cloud|assistant|virtual assistant/i.test(res.spokenResponse), 'Explained assistant origin accurately');
  });

  await t.test('Case 3: Capabilities Inquiry ("Can you tell me what it is you can do for me")', async () => {
    const res = await cortexEngine.reasonAndAct('Can you tell me what it is you can do for me');
    assert.ok(!res.spokenResponse.includes(BANNED_BOILERPLATE), 'Did not return banned boilerplate');
    assert.ok(/email|calendar|pipeline|research|automate/i.test(res.spokenResponse), 'Enumerated real assistant capabilities');
  });

  await t.test('Case 4: Work Pipeline Briefing ("So you didn\'t tell me what the state of my pipeline is of work")', async () => {
    const res = await cortexEngine.reasonAndAct("So you didn't tell me what the state of my pipeline is of work");
    assert.ok(!res.spokenResponse.includes(BANNED_BOILERPLATE), 'Did not return banned boilerplate');
    assert.ok(/pipeline|deliverables|work/i.test(res.spokenResponse), 'Provided direct pipeline briefing');
  });

  await t.test('Case 5: Real-World Phonetic Email to Eleanor ("Send Eleanor a quick email Telling her to be careful this afternoon")', async () => {
    const res = await cortexEngine.reasonAndAct('Send Eleanor a quick email Telling her to be careful this afternoon');
    assert.equal(res.actionCard.intent, 'email_draft', 'Resolved email draft intent');
    assert.equal(res.actionCard.emailData?.toEmail, 'eleonore.a.baxter@gmail.com', 'Resolved Eleanor to eleonore.a.baxter@gmail.com');
    assert.ok(res.actionCard.emailData?.toName.includes('Eleonore'), 'Resolved name to Eleonore Baxter');
    assert.ok(res.actionCard.emailData?.body.includes('careful'), 'Email body contains the message');
  });

  await t.test('Case 6: Leading STT Hallucination "If I want you to send an email to Eleanor"', async () => {
    const res = await cortexEngine.reasonAndAct('If I want you to send an email to Eleanor');
    assert.equal(res.actionCard.intent, 'email_draft', 'Resolved email draft despite leading "If I want you to"');
    assert.equal(res.actionCard.emailData?.toEmail, 'eleonore.a.baxter@gmail.com', 'Correctly routed to eleonore.a.baxter@gmail.com');
  });

  await t.test('Case 7: Nickname "Can you send Ellie and tell her I am on my way"', async () => {
    const res = await cortexEngine.reasonAndAct('Can you send Ellie and tell her I am on my way');
    assert.equal(res.actionCard.intent, 'email_draft', 'Resolved Ellie as email intent');
    assert.equal(res.actionCard.emailData?.toEmail, 'eleonore.a.baxter@gmail.com', 'Mapped Ellie to eleonore.a.baxter@gmail.com');
  });

  await t.test('Case 8: Family Email - Celine ("Send an email to Celine saying I\'ll be home soon")', async () => {
    const res = await cortexEngine.reasonAndAct("Send an email to Celine saying I'll be home soon");
    assert.equal(res.actionCard.intent, 'email_draft');
    assert.equal(res.actionCard.emailData?.toEmail, 'celine.loeuille@gmail.com', 'Resolved Celine to celine.loeuille@gmail.com');
  });

  await t.test('Case 9: Family Email - Alexander ("Email Alexander: review the code")', async () => {
    const res = await cortexEngine.reasonAndAct('Email Alexander: review the code');
    assert.equal(res.actionCard.intent, 'email_draft');
    assert.equal(res.actionCard.emailData?.toEmail, 'alexander.j.baxter@gmail.com', 'Resolved Alexander to alexander.j.baxter@gmail.com');
  });

  await t.test('Case 10: Family Email - Elizabeth ("Draft note to Elizabeth: great presentation")', async () => {
    const res = await cortexEngine.reasonAndAct('Draft note to Elizabeth: great presentation');
    assert.equal(res.actionCard.intent, 'email_draft');
    assert.equal(res.actionCard.emailData?.toEmail, 'elizabth.js.baxter@gmail.com', 'Resolved Elizabeth to elizabth.js.baxter@gmail.com');
  });

  await t.test('Case 11: Family Email - Angelina ("Send an email to Angelina wishing her luck")', async () => {
    const res = await cortexEngine.reasonAndAct('Send an email to Angelina wishing her luck');
    assert.equal(res.actionCard.intent, 'email_draft');
    assert.equal(res.actionCard.emailData?.toEmail, 'angelina.c.baxter@gmail.com', 'Resolved Angelina to angelina.c.baxter@gmail.com');
  });

  await t.test('Case 12: Farewell ("bye-bye")', async () => {
    const res = await cortexEngine.reasonAndAct('bye-bye');
    assert.ok(!res.spokenResponse.includes(BANNED_BOILERPLATE), 'Did not return banned boilerplate');
    assert.ok(/goodbye|wonderful day|see you/i.test(res.spokenResponse), 'Delivered warm executive farewell');
  });

  await t.test('Case 13: Comprehension Check ("What did you understand")', async () => {
    const res = await cortexEngine.reasonAndAct('What did you understand');
    assert.ok(!res.spokenResponse.includes(BANNED_BOILERPLATE), 'Did not return banned boilerplate');
    assert.ok(/understood|ready/i.test(res.spokenResponse), 'Confirmed comprehension');
  });

  await t.test('Case 14: Hourly Log Management & Session Scoping', async () => {
    const session = logger.getSessionId();
    assert.ok(session.startsWith('session-'), 'Session ID is scoped');

    const summary = logger.curateHourlyLogs();
    assert.equal(summary.userId, 'andrew', 'Logged under active executive user');
    assert.ok(summary.hourTimestamp.length > 10, 'Generated hourly timestamp');

    const exportText = logger.exportCleanLogsAsText();
    assert.ok(exportText.length > 0, 'Clean log export produced formatted records');
  });

});
