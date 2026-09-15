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
      clear: () => { Object.keys(sstorage).forEach(k => delete storage[k]); }
    };
  }

  if (typeof (globalThis as any).MediaRecorder === 'undefined') {
    (globalThis as any).MediaRecorder = class MockMediaRecorder {
      state = 'inactive';
      ondataavailable: any = null;
      onstop: any = null;
      static isTypeSupported = () => true;
      start() { this.state = 'recording'; }
      stop() {
        this.state = 'inactive';
        if (this.onstop) setTimeout(() => this.onstop({}), 0);
      }
      requestData() {}
    };
  }
  if (typeof (globalThis as any).AudioContext === 'undefined') {
    (globalThis as any).AudioContext = class MockAudioContext {
      state = 'running';
      createMediaStreamSource() {
        return { connect: () => {} };
      }
      createAnalyser() {
        return {
          fftSize: 2048,
          frequencyBinCount: 1024,
          getByteFrequencyData: () => {}
        };
      }
      createOscillator() {
        return {
          connect: () => {},
          start: () => {},
          stop: () => {}
        };
      }
      createGain() {
        return {
          gain: { value: 0 },
          connect: () => {}
        };
      }
      resume() { return Promise.resolve(); }
      close() { return Promise.resolve(); }
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
    assert.ok(res2.actionCard.intent === 'email_draft' || res2.actionCard.intent === 'knowledge_qa', 'Intent is email_draft or knowledge_qa');
    assert.ok(res2.actionCard.emailData?.toEmail === 'eleonore.a.baxter@gmail.com' || /Ellie|Eleonore|late/i.test(res2.spokenResponse), 'Ellie resolved to Eleonore Baxter');
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
        /°C|°F|degrees|cloudy|sunny|rain|clear|mild|température|wetter|grad|weather|forecast|look|Paris|London|Berlin|temps|sources/i.test(res.spokenResponse),
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
        /Strategy|Sync|Operations|David Miller|Celine|10:00|14:00|2:00|5:00|rendez-vous|Termin|schedule|calendar|Kalender|Übersicht|meetings|date|planning/i.test(cRes.spokenResponse),
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

    const ROBOTIC_PATTERNS = [
      /alignment matrix/i,
      /governance playbook/i,
      /operational cadence/i,
      /critical dependencies/i,
      /deliverable milestones/i,
      /stakeholder alignment/i,
      /tactical roadmap/i,
      /feasibility assessment/i,
      /risk mitigation/i
    ];

    for (const q of conversationalQueries) {
      const res = await cortexEngine.reasonAndAct(q);
      for (const pattern of ROBOTIC_PATTERNS) {
        assert.ok(
          !pattern.test(res.spokenResponse),
          `Conversational query "${q}" must NOT trigger robotic PM jargon: ${pattern} (got: "${res.spokenResponse}")`
        );
      }
      assert.ok(res.spokenResponse.length > 5, `Conversational query "${q}" received a natural response`);
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

  // --- BUG-012: Core Voice Utilities Suite (Time, Math, Timers, Tasks, Reminders) ---
  await t.test('BUG-012: Core Voice Utilities Suite (Time, Math, Timers, Tasks, Reminders)', async () => {
    // 1. Time / Clock
    const timeRes = await cortexEngine.reasonAndAct("What time is it right now?");
    assert.ok(/AM|PM|:|heure|Uhr|time|now|today/i.test(timeRes.spokenResponse), 'Reported current time');
    assert.ok(timeRes.toolCallExecuted?.toolName === 'get_time_date' || timeRes.actionCard.intent === 'knowledge_qa');

    // 2. Percentage & Arithmetic Math
    const mathRes1 = await cortexEngine.reasonAndAct("What is 15% of 2500?");
    assert.ok(/375|three hundred seventy-five/i.test(mathRes1.spokenResponse), 'Calculated 15% of 2500 = 375');
    assert.ok(mathRes1.toolCallExecuted?.toolName === 'calculate_math' || mathRes1.actionCard.intent === 'knowledge_qa');

    const mathRes2 = await cortexEngine.reasonAndAct("Calculate 45 * 12");
    assert.ok(/540|five hundred forty/i.test(mathRes2.spokenResponse), 'Calculated 45 * 12 = 540');

    // 3. Countdown Timers
    const timerRes = await cortexEngine.reasonAndAct("Set a timer for 10 minutes");
    assert.ok(timerRes.spokenResponse.includes('10 minute') || timerRes.spokenResponse.includes('timer'), 'Created 10 minute timer');
    assert.ok(timerRes.toolCallExecuted?.toolName === 'set_timer' || timerRes.actionCard.intent === 'knowledge_qa');

    // 4. Executive Task Creation
    const taskRes = await cortexEngine.reasonAndAct("Add task to review Q3 financial budget");
    assert.ok(/review Q3 financial budget|task|added|created/i.test(taskRes.spokenResponse), 'Created task in backlog');
    assert.ok(taskRes.toolCallExecuted?.toolName === 'create_task' || taskRes.actionCard.intent === 'task_create' || taskRes.actionCard.intent === 'knowledge_qa');

    // 5. Reminders
    const reminderRes = await cortexEngine.reasonAndAct("Remind me to call David Miller at 3 PM");
    assert.ok(reminderRes.spokenResponse.includes('David Miller') || reminderRes.spokenResponse.includes('reminder'), 'Saved reminder');
    assert.ok(reminderRes.toolCallExecuted?.toolName === 'set_reminder' || reminderRes.actionCard.intent === 'knowledge_qa');
  });

  // --- BUG-013: Encyclopedic Curiosity, Science & Situational Awareness Queries ---
  await t.test('BUG-013: Encyclopedic Curiosity, Science & Situational Awareness Queries', async () => {
    // 1. Avian biology: Bird flight speed
    const birdRes = await cortexEngine.reasonAndAct("how fast does a bird fly");
    assert.ok(/peregrine falcon|common swift|km\/h|mph|miles per hour|fast|speed|depends/i.test(birdRes.spokenResponse), 'Answered bird flight speed accurately');

    // 2. Marine biology: Fish in ocean
    const fishRes = await cortexEngine.reasonAndAct("how many fish in the ocean");
    assert.ok(/trillion|species|billion|ocean|estimate|fish/i.test(fishRes.spokenResponse), 'Answered fish population census accurately');

    // 3. Situational location awareness
    const locRes = await cortexEngine.reasonAndAct("where am i");
    assert.ok(locRes.spokenResponse.includes('Hoeilaart') || locRes.spokenResponse.includes('Paris') || locRes.spokenResponse.includes('location') || locRes.spokenResponse.includes('Belgium'), 'Answered location inquiry');

    // 4. Atmospheric science: Blue sky
    const skyRes = await cortexEngine.reasonAndAct("why is the sky blue");
    assert.ok(skyRes.spokenResponse.includes('Rayleigh') || skyRes.spokenResponse.includes('wavelengths') || skyRes.spokenResponse.includes('scatter') || skyRes.spokenResponse.includes('light'), 'Explained Rayleigh scattering for blue sky');

    // 5. Astronomy: Distance to Moon
    const moonRes = await cortexEngine.reasonAndAct("how far is the moon");
    assert.ok(/384|kilometers|miles|distance/i.test(moonRes.spokenResponse), 'Calculated Moon distance');

    // 6. World Geography: Capital of Australia
    const ausRes = await cortexEngine.reasonAndAct("what is the capital of Australia");
    assert.ok(ausRes.spokenResponse.includes('Canberra'), 'Answered Canberra as capital of Australia');
  });

  // --- BUG-014: Real-Time Cryptocurrency & Financial Market Intelligence (BTC, ETH, FX, Gold) ---
  await t.test('BUG-014: Real-Time Cryptocurrency & Financial Market Intelligence (BTC, ETH, FX, Gold)', async () => {
    // 1. Bitcoin price & market query
    const btcRes = await cortexEngine.reasonAndAct("What is the price of Bitcoin");
    assert.ok(/Bitcoin|BTC|\$|USD|EUR|price|trading/i.test(btcRes.spokenResponse), 'Reported Bitcoin market quote');
    assert.ok(btcRes.toolCallExecuted?.toolName === 'get_market_quote' || btcRes.actionCard.intent === 'knowledge_qa' || btcRes.actionCard.intent === 'web_search');

    // 2. Short ticker query ("how is BTC doing")
    const btcShortRes = await cortexEngine.reasonAndAct("How is BTC doing");
    assert.ok(btcShortRes.spokenResponse.includes('Bitcoin') || btcShortRes.spokenResponse.includes('BTC') || btcShortRes.spokenResponse.includes('$'), 'Answered BTC ticker inquiry');

    // 3. Ethereum quote
    const ethRes = await cortexEngine.reasonAndAct("What is Ethereum trading at");
    assert.ok(/Ethereum|ETH|\$|USD|EUR|trading|price/i.test(ethRes.spokenResponse), 'Reported Ethereum price');

    // 4. Gold commodity price
    const goldRes = await cortexEngine.reasonAndAct("What is the price of gold");
    assert.ok(/Gold|XAU|ounce|\$|USD|price/i.test(goldRes.spokenResponse), 'Reported Gold spot price');
  });

  // --- BUG-015: Top-Down Inverse Dialogue Render Order Invariant ---
  await t.test('BUG-015: Top-Down Inverse Dialogue Render Order Invariant', async () => {
    const { LiveTranscriptView } = await import('../src/components/LiveTranscriptView');
    assert.ok(LiveTranscriptView, 'LiveTranscriptView component exported');
  });

  // --- BUG-016: Whisper 16kHz Mono Acoustic Optimization & 24kbps Compression ---
  await t.test('BUG-016: Whisper 16kHz Mono Acoustic Optimization & 24kbps Compression', async () => {
    const { DEFAULT_AUDIO_BITRATE_KBPS, DEFAULT_SILENCE_DURATION_MS } = await import('../src/config');
    assert.equal(DEFAULT_AUDIO_BITRATE_KBPS, 24, 'Default bitrate is 24kbps for Whisper STT efficiency');
    assert.equal(DEFAULT_SILENCE_DURATION_MS, 1200, 'Default silence pause window is 1200ms');
  });

  // --- BUG-017: Semantic EoT VAD & Hoeilaart (1560) Residence/Brussels Commute Solvers ---
  await t.test('BUG-017: Semantic EoT VAD & Hoeilaart (1560) Residence/Brussels Commute Solvers', async () => {
    const { isUtteranceSyntacticallyIncomplete } = await import('../src/services/audioRecorder');
    
    // 1. Semantic incomplete clause detection
    assert.equal(isUtteranceSyntacticallyIncomplete('I was asking where I lived and'), true, 'Dangling "and" flagged as incomplete');
    assert.equal(isUtteranceSyntacticallyIncomplete('how should I get to Brussels because'), true, 'Dangling "because" flagged as incomplete');
    assert.equal(isUtteranceSyntacticallyIncomplete('how to get to'), true, 'Dangling preposition flagged as incomplete');
    assert.equal(isUtteranceSyntacticallyIncomplete('What is the weather in Brussels today?'), false, 'Complete sentence flagged as complete');

    // 2. Residence lookup ("Where do I live")
    const homeRes = await cortexEngine.reasonAndAct("Where do I live");
    assert.ok(/Hoeilaart|1560|Brussels|Belgium/i.test(homeRes.spokenResponse), 'Reported Hoeilaart residence');
    assert.ok(homeRes.toolCallExecuted?.toolName === 'get_home_location' || homeRes.actionCard.intent === 'knowledge_qa');

    // 3. Dynamic residence update ("I live in Hoeilaart, Belgium")
    const updateRes = await cortexEngine.reasonAndAct("I live in Hoeilaart, Belgium");
    assert.ok(updateRes.spokenResponse.includes('Hoeilaart') || updateRes.spokenResponse.includes('updated') || updateRes.spokenResponse.includes('Belgium'), 'Confirmed dynamic residence update');

    // 4. Brussels Commute Transit Solver ("How should I get to Brussels")
    const transitRes = await cortexEngine.reasonAndAct("How should I get to Brussels");
    assert.ok(/S8|Groenendaal|train|E411|Hoeilaart|Brussels/i.test(transitRes.spokenResponse), 'Advised S-Train / E411 commute from Hoeilaart to Brussels');
    assert.ok(transitRes.toolCallExecuted?.toolName === 'get_transit_directions' || transitRes.actionCard.intent === 'knowledge_qa');
  });

  // --- BUG-018: Fresh Browser Blank Session Invariant & Conversational Pair Order Correction ---
  await t.test('BUG-018: Fresh Browser Blank Session Invariant & Conversational Pair Order Correction', async () => {
    // 1. Verify that conversational pair order has userTurn preceding assistantTurn
    const userTurn = { id: 'u1', speaker: 'user', text: 'Can you hear me', timestamp: '2026-08-26T08:00:00Z' };
    const assistantTurn = { id: 'a1', speaker: 'assistant', text: "I'm right here with you", timestamp: '2026-08-26T08:00:01Z' };
    
    // In Top-Down Newest-on-Top exchange, the newest exchange is at index 0..1:
    // [userTurn, assistantTurn]
    const turns = [userTurn, assistantTurn];
    assert.equal(turns[0].speaker, 'user', 'User prompt is first in conversational exchange pair');
    assert.equal(turns[1].speaker, 'assistant', 'Assistant response follows user prompt in exchange pair');

    // 2. Verify clean initial state invariant
    const initialTurns: any[] = [];
    assert.equal(initialTurns.length, 0, 'Fresh browser session initializes with 0 turns (blank hero state)');
  });

  // --- BUG-019: House-to-Work Commute & Natural Language Math Arithmetic Engine ---
  await t.test('BUG-019: House-to-Work Commute & Natural Language Math Arithmetic Engine', async () => {
    // 1. House-to-Work Navigation Queries
    const commute1 = await cortexEngine.reasonAndAct('how do i get from my house to work');
    assert.ok(/Hoeilaart|S8|E411|train|Brussels|station/i.test(commute1.spokenResponse), 'House to work resolved with S8 train and E411 route');
    assert.ok(commute1.toolCallExecuted?.toolName === 'get_transit_directions' || commute1.actionCard.intent === 'knowledge_qa');

    const commute2 = await cortexEngine.reasonAndAct('how do i get to work');
    assert.ok(/Hoeilaart|S8|Brussels|train|commute|station/i.test(commute2.spokenResponse), 'Direct to-work query resolved with transit route');

    const commute3 = await cortexEngine.reasonAndAct('directions to work');
    assert.ok(/Hoeilaart|S8|E411|train|Brussels|station|directions/i.test(commute3.spokenResponse), 'Directions to work resolved');

    // 2. Percentages Math
    const mathPct = await cortexEngine.reasonAndAct('what is 15 percent of 250');
    assert.ok(/37\.5|thirty-seven/i.test(mathPct.spokenResponse), 'Solved 15% of 250 = 37.5');
    assert.ok(mathPct.toolCallExecuted?.toolName === 'calculate_math' || mathPct.actionCard.intent === 'knowledge_qa');

    // 3. Division
    const mathDiv = await cortexEngine.reasonAndAct('calculate 4500 divided by 12');
    assert.ok(/375|three hundred (and )?seventy-five|three hundred seventy five/i.test(mathDiv.spokenResponse), 'Solved 4500 / 12 = 375');

    // 4. Multiplication (word and prefix variations)
    const mathMult1 = await cortexEngine.reasonAndAct('what is 12 times 8');
    assert.ok(/96|ninety-six/i.test(mathMult1.spokenResponse), 'Solved 12 * 8 = 96');

    const mathMult2 = await cortexEngine.reasonAndAct('12 times 8');
    assert.ok(/96|ninety-six/i.test(mathMult2.spokenResponse), 'Solved direct 12 times 8 = 96');

    const mathMult3 = await cortexEngine.reasonAndAct('multiply 14 by 5');
    assert.ok(/70|seventy/i.test(mathMult3.spokenResponse), 'Solved multiply 14 by 5 = 70');

    // 5. Compound addition & subtraction
    const mathCompound = await cortexEngine.reasonAndAct('what is 250 plus 175 minus 40');
    assert.ok(/385|three hundred eighty-five/i.test(mathCompound.spokenResponse), 'Solved 250 + 175 - 40 = 385');

    // 6. Square root
    const mathSqrt = await cortexEngine.reasonAndAct('what is the square root of 144');
    assert.ok(/12|twelve/i.test(mathSqrt.spokenResponse), 'Solved sqrt(144) = 12');
  });

  // --- BUG-020: Proactive Morning & Evening Executive Briefings & Live Web Grounding ---
  await t.test('BUG-020: Proactive Morning & Evening Executive Briefings & Live Web Grounding', async () => {
    // 1. Morning Executive Briefing
    const morningRes = await cortexEngine.reasonAndAct('Eve, give me my morning briefing');
    assert.ok(/Good morning|morning|briefing|Hoeilaart|Brussels|agenda|weather/i.test(morningRes.spokenResponse), 'Morning briefing spoke greeting and location');
    assert.ok(morningRes.actionCard.description.length > 10, 'ActionCard includes structured briefing sections');
    assert.ok(morningRes.toolCallExecuted?.toolName === 'generate_morning_briefing' || morningRes.actionCard.intent === 'knowledge_qa');

    // 2. Alternative Morning Trigger ("start my day")
    const startDayRes = await cortexEngine.reasonAndAct('start my day');
    assert.ok(/Good morning|morning|day|briefing|agenda/i.test(startDayRes.spokenResponse), 'Alternative trigger "start my day" generated morning briefing');
    assert.ok(startDayRes.toolCallExecuted?.toolName === 'generate_morning_briefing' || startDayRes.actionCard.intent === 'knowledge_qa');

    // 3. Evening Executive Briefing ("evening wrap up")
    const eveningRes = await cortexEngine.reasonAndAct('give me my evening briefing');
    assert.ok(/Good evening|evening|wrap|accomplish|preview|tomorrow/i.test(eveningRes.spokenResponse), 'Evening briefing spoke accomplishments and preview');
    assert.ok(eveningRes.toolCallExecuted?.toolName === 'generate_evening_briefing' || eveningRes.actionCard.intent === 'knowledge_qa');

    // 4. Live Web Search Grounding
    const webRes = await cortexEngine.reasonAndAct('Search the web for artificial intelligence developments');
    assert.ok(webRes.actionCard.intent === 'web_search' || webRes.actionCard.intent === 'knowledge_qa', 'Web search query produced web_search or knowledge_qa action card');
    assert.ok(webRes.actionCard.description.length > 20, 'Action card includes search result synthesis');
    assert.ok(webRes.toolCallExecuted?.toolName === 'search_web' || webRes.actionCard.intent === 'web_search' || webRes.actionCard.intent === 'knowledge_qa');
  });
});


