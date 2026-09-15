import test from 'node:test';
import assert from 'node:assert/strict';

test('Speech Audio Corpus & Telemetry Replay Suite (Historical Log Verification)', async (t) => {
  const { cortexEngine } = await import('../src/services/cortexDialogueEngine');
  const { marketService } = await import('../src/services/marketIntelligenceService');
  const { weatherService } = await import('../src/services/weatherService');
  const { selfLearningEngine } = await import('../src/services/selfLearningEngine');
  const { memoryGraph } = await import('../src/services/memoryGraphService');
  const { logger } = await import('../src/services/loggerService');

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

  // =========================================================================
  // CATEGORY 1: Baxter Family & Roster Dispatch (Celine, Ellie, Alexander, Elizabeth, Angelina)
  // =========================================================================
  await t.test('1.1: Audio Replay — Email to Wife Celine', async () => {
    const res = await cortexEngine.reasonAndAct('Send an email to Celine saying I love her and will be home soon', [], undefined, GEMINI_API_KEY);
    assert.equal(res.actionCard.intent, 'email_draft', 'Resolved email draft intent');
    assert.equal(res.actionCard.emailData?.toEmail, 'celine.loeuille@gmail.com', 'Routed to celine.loeuille@gmail.com');
    assert.ok(!res.spokenResponse.toLowerCase().includes('emily'), 'Zero Emily leakage');
    assert.ok(res.actionCard.emailData?.body.toLowerCase().includes('love') || res.actionCard.emailData?.body.toLowerCase().includes('home'), 'Email body contains intent');
  });

  await t.test('1.2: Audio Replay — Email to Ellie (Eleonore)', async () => {
    const res = await cortexEngine.reasonAndAct("Tell Ellie I'm on my way to pick her up", [], undefined, GEMINI_API_KEY);
    assert.equal(res.actionCard.intent, 'email_draft', 'Resolved email draft intent');
    assert.equal(res.actionCard.emailData?.toEmail, 'eleonore.a.baxter@gmail.com', 'Mapped Ellie to eleonore.a.baxter@gmail.com');
  });

  await t.test('1.3: Audio Replay — Email to Alexander', async () => {
    const res = await cortexEngine.reasonAndAct('Email Alexander: please review the latest code deployment', [], undefined, GEMINI_API_KEY);
    assert.equal(res.actionCard.intent, 'email_draft');
    assert.equal(res.actionCard.emailData?.toEmail, 'alexander.j.baxter@gmail.com', 'Mapped Alexander to alexander.j.baxter@gmail.com');
  });

  await t.test('1.4: Audio Replay — Email to Elizabeth', async () => {
    const res = await cortexEngine.reasonAndAct('Draft an email to Elizabeth: great presentation today', [], undefined, GEMINI_API_KEY);
    assert.equal(res.actionCard.intent, 'email_draft');
    assert.equal(res.actionCard.emailData?.toEmail, 'elizabth.js.baxter@gmail.com', 'Mapped Elizabeth to elizabth.js.baxter@gmail.com');
  });

  await t.test('1.5: Audio Replay — Email to Angelina', async () => {
    const res = await cortexEngine.reasonAndAct('Send an email to Angelina wishing her good luck tomorrow', [], undefined, GEMINI_API_KEY);
    assert.equal(res.actionCard.intent, 'email_draft');
    assert.equal(res.actionCard.emailData?.toEmail, 'angelina.c.baxter@gmail.com', 'Mapped Angelina to angelina.c.baxter@gmail.com');
  });

  // =========================================================================
  // CATEGORY 2: Pronoun Anaphora & Multi-Turn Context Continuity
  // =========================================================================
  await t.test('2.1: Multi-Turn Coreference Resolution ("Send her a quick note")', async () => {
    const history = [
      { id: 'turn-1', speaker: 'user' as const, text: 'We received the Q4 proposal from Sarah Chen at InnovateAI.', timestamp: new Date(Date.now() - 30000).toISOString() },
      { id: 'turn-2', speaker: 'assistant' as const, text: 'I see the proposal from Sarah Chen. Would you like to review or respond?', timestamp: new Date(Date.now() - 15000).toISOString() }
    ];

    const res = await cortexEngine.reasonAndAct(
      'Send her a quick note saying we approve the marketing budget',
      history,
      undefined,
      GEMINI_API_KEY
    );

    assert.equal(res.actionCard.intent, 'email_draft', 'Resolved email intent from pronoun');
    assert.ok(
      res.actionCard.title.toLowerCase().includes('sarah') ||
      res.actionCard.description.toLowerCase().includes('sarah') ||
      res.spokenResponse.toLowerCase().includes('sarah'),
      'Grounded "her" to Sarah Chen from recent turns'
    );
  });

  // =========================================================================
  // CATEGORY 3: Market Spot Intelligence & BTC Cycle Verification
  // =========================================================================
  await t.test('3.1: Financial Intelligence — Bitcoin (BTC) Price', async () => {
    const quote = await marketService.getMarketQuote('BTC');
    assert.ok(quote && quote.priceUsd > 10000, `BTC price resolved: $${quote?.priceUsd}`);

    const res = await cortexEngine.reasonAndAct('What is the price of Bitcoin right now?', [], undefined, GEMINI_API_KEY);
    assert.ok(res.spokenResponse.length > 10, 'Generated spoken market response');
    assert.ok(res.actionCard.description.includes('$') || res.spokenResponse.includes('$') || res.spokenResponse.toLowerCase().includes('bitcoin'), 'Contains price intelligence');
  });

  await t.test('3.2: Financial Intelligence — Gold & Ethereum', async () => {
    const ethQuote = await marketService.getMarketQuote('ETH');
    assert.ok(ethQuote && ethQuote.priceUsd > 500, `ETH price resolved: $${ethQuote?.priceUsd}`);

    const goldQuote = await marketService.getMarketQuote('GOLD');
    assert.ok(goldQuote && goldQuote.priceUsd > 1500, `Gold price resolved: $${goldQuote?.priceUsd}`);
  });

  // =========================================================================
  // CATEGORY 4: Executive Briefing & Hoeilaart Commute Grounding
  // =========================================================================
  await t.test('4.1: Executive Morning Briefing (Hoeilaart Weather & Commute)', async () => {
    const weather = await weatherService.getWeather('Hoeilaart');
    assert.ok(weather && weather.temperatureC > -20 && weather.temperatureC < 50, 'Weather resolved for Hoeilaart');

    const res = await cortexEngine.reasonAndAct('Give me my morning briefing for Hoeilaart', [], undefined, GEMINI_API_KEY);
    assert.ok(res.spokenResponse.length > 10, 'Produced morning briefing');
    assert.ok(
      res.actionCard.description.toLowerCase().includes('hoeilaart') ||
      res.actionCard.description.toLowerCase().includes('weather') ||
      res.spokenResponse.toLowerCase().includes('morning') ||
      res.spokenResponse.toLowerCase().includes('hoeilaart'),
      'Briefing context grounded'
    );
  });

  // =========================================================================
  // CATEGORY 5: Quantitative Calculations
  // =========================================================================
  await t.test('5.1: Math — "What is 15 percent of 250?"', async () => {
    const res = await cortexEngine.reasonAndAct('What is 15 percent of 250?', [], undefined, GEMINI_API_KEY);
    assert.ok(res.spokenResponse.includes('37.5'), 'Calculated 15% of 250 = 37.5');
  });

  await t.test('5.2: Math — "What is 20 percent of 840?"', async () => {
    const res = await cortexEngine.reasonAndAct('What is 20 percent of 840?', [], undefined, GEMINI_API_KEY);
    assert.ok(res.spokenResponse.includes('168'), 'Calculated 20% of 840 = 168');
  });

  // =========================================================================
  // CATEGORY 6: Speech Fillers & STT Hallucination Stripping
  // =========================================================================
  await t.test('6.1: Filler Stripping — "If I want you to send an email to Celine"', async () => {
    const res = await cortexEngine.reasonAndAct('If I want you to send an email to Celine saying hello', [], undefined, GEMINI_API_KEY);
    assert.equal(res.actionCard.intent, 'email_draft');
    assert.equal(res.actionCard.emailData?.toEmail, 'celine.loeuille@gmail.com');
  });

  await t.test('6.2: Filler Stripping — "Can you please tell Ellie I am coming"', async () => {
    const res = await cortexEngine.reasonAndAct('Can you please tell Ellie I am coming', [], undefined, GEMINI_API_KEY);
    assert.equal(res.actionCard.intent, 'email_draft');
    assert.equal(res.actionCard.emailData?.toEmail, 'eleonore.a.baxter@gmail.com');
  });
});
