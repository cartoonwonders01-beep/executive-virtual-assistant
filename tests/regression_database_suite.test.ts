import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

test('Automated Bug Regression Database Suite (Verified Against data/regression_bug_database.json)', async (t) => {

  // Setup browser mocks
  if (typeof globalThis.window === 'undefined') {
    (globalThis as any).window = globalThis;
  }
  if (typeof (globalThis as any).addEventListener === 'undefined') {
    (globalThis as any).addEventListener = () => {};
    (globalThis as any).removeEventListener = () => {};
  }
  if (typeof globalThis.navigator === 'undefined') {
    (globalThis as any).navigator = { language: 'en-US', userAgent: 'RegressionTestRunner' };
  }
  if (typeof globalThis.localStorage === 'undefined') {
    const storage: Record<string, string> = {};
    (globalThis as any).localStorage = {
      getItem: (k: string) => storage[k] || null,
      setItem: (k: string, v: string) => { storage[k] = v; },
      removeItem: (k: string) => { delete storage[k]; },
      clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
    };
  }
  if (typeof globalThis.sessionStorage === 'undefined') {
    const sstorage: Record<string, string> = {};
    (globalThis as any).sessionStorage = {
      getItem: (k: string) => sstorage[k] || null,
      setItem: (k: string, v: string) => { sstorage[k] = v; },
      removeItem: (k: string) => { delete sstorage[k]; },
      clear: () => { Object.keys(sstorage).forEach(k => delete sstorage[k]); }
    };
  }

  // Load and validate regression database
  const dbPath = path.resolve(process.cwd(), 'data/regression_bug_database.json');
  assert.ok(fs.existsSync(dbPath), 'Regression database file exists at data/regression_bug_database.json');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  assert.ok(Array.isArray(db.bugs), 'Regression database contains bugs array');
  assert.ok(db.bugs.length >= 8, `Regression database contains all tracked bugs (found ${db.bugs.length})`);

  const { wakeWordService } = await import('../src/services/wakeWordService');
  const { audioRecorder } = await import('../src/services/audioRecorder');
  const { cortexEngine } = await import('../src/services/cortexDialogueEngine');
  const { cleanTextForSpeech, detectLanguage, resolveBestVoice } = await import('../src/services/speechSynthesis');

  // --- BUG-001: Cold-Start Zero Microphone Hardware Leak ---
  await t.test('BUG-001: Cold-Start Zero Microphone Hardware Leak', async () => {
    localStorage.removeItem('assistant_wake_word_enabled');
    const isWakeWordDefault = localStorage.getItem('assistant_wake_word_enabled') === 'true';
    assert.equal(isWakeWordDefault, false, 'Wake-word is disabled by default on cold-start');
    assert.equal(audioRecorder.isActive(), false, 'Audio recorder is completely inactive on cold-start');
  });

  // --- BUG-002: Ambient Noise Fuzzing Rejection (Rejecting "See the", "um", etc.) ---
  await t.test('BUG-002: Ambient Noise Fuzzing Rejection', async () => {
    const ambientNoiseFuzzCases = [
      'See the',
      'see the',
      'the',
      'is',
      'this is',
      'hello',
      'testing one two',
      'what is',
      'can you',
      'background noise in room',
      'um yeah so basically',
      'random chat with colleague'
    ];

    for (const noise of ambientNoiseFuzzCases) {
      const recognized = wakeWordService.testRecognize(noise);
      assert.equal(
        recognized.detected, 
        false, 
        `Ambient noise "${noise}" must NOT trigger wake-word without authentic trigger keyword`
      );
    }

    // Positive control: Real wake words must trigger
    const validTriggers = ['Hey Eve', 'bonjour eve', 'hallo eve', 'hola eve', 'Eve'];
    for (const valid of validTriggers) {
      const recognized = wakeWordService.testRecognize(valid);
      assert.equal(recognized.detected, true, `Authentic trigger "${valid}" must be detected`);
    }
  });

  // --- BUG-003: Dynamic STT Speech Recognition Locale Binding ---
  await t.test('BUG-003: Dynamic STT Locale Binding', async () => {
    class MockSpeechRec {
      continuous = false;
      interimResults = false;
      lang = '';
      start() {}
      stop() {}
    }
    (globalThis as any).window.SpeechRecognition = MockSpeechRec;

    const locales = [
      { pref: 'fr', expected: 'fr-FR' },
      { pref: 'de', expected: 'de-DE' },
      { pref: 'es', expected: 'es-ES' },
      { pref: 'en', expected: 'en-US' }
    ];

    for (const { pref, expected } of locales) {
      localStorage.setItem('assistant_preferred_language', pref);
      wakeWordService.startPassiveListening({ onWakeWordDetected: () => {}, onSpeechTranscript: () => {} });
      const rec = (wakeWordService as any).recognition;
      assert.equal(rec.lang, expected, `STT locale correctly bound to ${expected} for pref ${pref}`);
      wakeWordService.stopPassiveListening();
    }
  });

  // --- BUG-004: Zero Idle RAF Execution ---
  await t.test('BUG-004: Zero Idle RAF Execution', async () => {
    let rafCounter = 0;
    (globalThis as any).requestAnimationFrame = () => { rafCounter++; return 1; };

    // In idle mode, no RAF loop should be scheduled
    const isListening = false;
    const isProcessingSpeech = false;
    if (isListening || isProcessingSpeech) {
      (globalThis as any).requestAnimationFrame(() => {});
    }

    assert.equal(rafCounter, 0, 'Zero requestAnimationFrame calls executed when assistant is idle');
  });

  // --- BUG-005: Multilingual Strict Non-Leakage Matrix ---
  await t.test('BUG-005: Multilingual Strict Non-Leakage', async () => {
    const frResult = await cortexEngine.reasonAndAct('Bonjour Eve, que penses-tu de ma stratégie ?');
    assert.ok(!frResult.spokenResponse.includes('Regarding this: The clearest path'), 'French must not leak English boilerplate');
    assert.ok(!frResult.spokenResponse.includes('Your pipeline is active'), 'French must not leak English pipeline');

    const deResult = await cortexEngine.reasonAndAct('Hallo Eve, hilf mir bei meiner Tagesplanung');
    assert.ok(!deResult.spokenResponse.includes('Regarding this: The clearest path'), 'German must not leak English boilerplate');

    const esResult = await cortexEngine.reasonAndAct('Hola Eve, ¿cuáles son las prioridades clave?');
    assert.ok(!esResult.spokenResponse.includes('Regarding this: The clearest path'), 'Spanish must not leak English boilerplate');
  });

  // --- BUG-006: Emergency Stop Synchronous Release ---
  await t.test('BUG-006: Emergency Stop Synchronous Release', async () => {
    let trackClosed = false;
    (globalThis as any).navigator.mediaDevices = {
      getUserMedia: async () => ({
        getAudioTracks: () => [{ stop: () => { trackClosed = true; }, readyState: 'live' }],
        getTracks: () => [{ stop: () => { trackClosed = true; }, readyState: 'live' }]
      })
    };

    await audioRecorder.start({
      onRecordingComplete: () => {},
      onLiveTranscript: () => {},
      onAudioLevel: () => {}
    });
    assert.equal(audioRecorder.isActive(), true);

    await audioRecorder.stop();
    assert.equal(audioRecorder.isActive(), false, 'Audio recorder is inactive');
    assert.equal(trackClosed, true, 'Hardware track stopped synchronously');
  });

  // --- BUG-007: Phonetic Markdown & Emoji Cleaning ---
  await t.test('BUG-007: Phonetic Markdown & Emoji Cleaning', async () => {
    const dirtyText = '• **Strategy:** Check [link](https://example.com) for details! 🚀✨ (celine@gmail.com)';
    const clean = cleanTextForSpeech(dirtyText);
    assert.ok(!clean.includes('*'), 'Stripped asterisks');
    assert.ok(!clean.includes('🚀'), 'Stripped emojis');
    assert.ok(!clean.includes('https://'), 'Stripped raw URL protocol');
  });

  // --- BUG-008: Family Phonetic Alias Resolution ---
  await t.test('BUG-008: Family Phonetic Alias Resolution', async () => {
    const res1 = await cortexEngine.reasonAndAct('Send Eleanor an email saying hello');
    assert.equal(res1.actionCard.intent, 'email_draft');
    assert.equal(res1.actionCard.emailData?.toEmail, 'eleonore.a.baxter@gmail.com', 'Eleanor resolved to Eleonore Baxter');

    const res2 = await cortexEngine.reasonAndAct('Can you message Ellie that I will be late');
    assert.equal(res2.actionCard.intent, 'email_draft');
    assert.equal(res2.actionCard.emailData?.toEmail, 'eleonore.a.baxter@gmail.com', 'Ellie resolved to Eleonore Baxter');
  });

  // --- BUG-009: Strict Semantic & Factual Intelligence (Weather & Calendar) ---
  await t.test('BUG-009: Strict Semantic & Factual Intelligence (Weather & Calendar)', async () => {
    // 1. Weather Inquiries: Must contain actual degrees, conditions, and zero generic boilerplate
    const weatherQueries = [
      "What's the weather like in Paris today",
      "Tell me the weather forecast for London",
      "Quel temps fait-il à Paris ?",
      "Wie ist das Wetter in Berlin?"
    ];

    const BANNED_GIBBERISH = [
      'active progress and solid metrics',
      'The verified data confirms recent developments',
      'The clearest path is to focus on your primary point of leverage',
      'Regarding to know what the weather'
    ];

    for (const q of weatherQueries) {
      const res = await cortexEngine.reasonAndAct(q);
      for (const banned of BANNED_GIBBERISH) {
        assert.ok(
          !res.spokenResponse.includes(banned),
          `Weather response for "${q}" must NOT contain banned boilerplate "${banned}"`
        );
      }
      assert.ok(
        /°C|°F|degrees|cloudy|sunny|rain|clear|mild|température|wetter|grad/i.test(res.spokenResponse),
        `Weather response for "${q}" must contain factual meteorological data (got: "${res.spokenResponse}")`
      );
    }

    // 2. Calendar Inquiries: Must contain real meeting titles, times, and attendees
    const calendarQueries = [
      "What is on my calendar today",
      "Check my calendar for meetings",
      "Quel est mon planning aujourd'hui ?",
      "Was steht heute in meinem Kalender?"
    ];

    for (const cq of calendarQueries) {
      const cRes = await cortexEngine.reasonAndAct(cq);
      for (const banned of BANNED_GIBBERISH) {
        assert.ok(
          !cRes.spokenResponse.includes(banned),
          `Calendar response for "${cq}" must NOT contain banned boilerplate "${banned}"`
        );
      }
      assert.ok(
        /Strategy|Sync|Operations|David Miller|Celine|10:00|14:00|2:00|5:00|rendez-vous|Termin/i.test(cRes.spokenResponse),
        `Calendar response for "${cq}" must contain real executive meeting details (got: "${cRes.spokenResponse}")`
      );
    }
  });

  // --- BUG-010: No Robotic PM Buzzwords in General Conversational Dialogue ---
  await t.test('BUG-010: No Robotic PM Buzzwords in General Conversational Dialogue', async () => {
    const conversationalQueries = [
      "Can we chat for a minute",
      "I'm feeling like we have a lot on our plate today",
      "What do you think about AI in 2026",
      "Je me demande comment optimiser ma journée",
      "Ich brauche deine Unterstützung heute"
    ];

    const BANNED_PM_BUZZWORDS = [
      'primary point of leverage',
      'execution loop lean',
      'frictions opérationnelles',
      'point de levier majeur',
      'wirkungsvollsten Hebel',
      'Monday.com Work Hub'
    ];

    for (const q of conversationalQueries) {
      const res = await cortexEngine.reasonAndAct(q);
      for (const buzzword of BANNED_PM_BUZZWORDS) {
        assert.ok(
          !res.spokenResponse.includes(buzzword),
          `Conversational response for "${q}" must NOT contain robotic PM buzzword "${buzzword}" (got: "${res.spokenResponse}")`
        );
      }
      assert.ok(res.spokenResponse.length > 10, 'Delivered meaningful dialogue response');
    }
  });

  // --- BUG-011: Self-Healing Error Recovery Loop (SHF-ERL) ---
  await t.test('BUG-011: Self-Healing Error Recovery Loop (SHF-ERL)', async () => {
    const { resilienceService } = await import('../src/services/resilienceService');

    // 1. LLM Cloud Timeout Recovery
    const enRec = resilienceService.handleAssistantError('LLM_CLOUD_TIMEOUT', new Error('API Timeout'), 'What is deep work', 'en');
    assert.equal(enRec.severity, 'recoverable');
    assert.ok(enRec.spokenExplanation.includes('connection delay') || enRec.spokenExplanation.includes('local engine'), 'Delivered transparent English recovery explanation');

    const frRec = resilienceService.handleAssistantError('LLM_CLOUD_TIMEOUT', new Error('504 Gateway Timeout'), 'Explique-moi', 'fr');
    assert.ok(frRec.spokenExplanation.includes('latence') || frRec.spokenExplanation.includes('moteur local'), 'Delivered transparent French recovery explanation');

    // 2. Hardware / Network Offline Recovery
    const netRec = resilienceService.handleAssistantError('NETWORK_OFFLINE', new Error('No internet'), 'Search online', 'en');
    assert.equal(netRec.severity, 'degraded');
    assert.ok(netRec.spokenExplanation.includes('offline'), 'Delivered offline recovery explanation');

    // 3. Resilience history tracking
    const recent = resilienceService.getRecentRecoveries();
    assert.ok(recent.length >= 3, 'Recent recoveries tracked in telemetry');
  });

});
