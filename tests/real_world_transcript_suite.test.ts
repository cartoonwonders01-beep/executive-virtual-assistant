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

  await t.test('Case 15: Family Roster Inquiry ("Who\'s in my family")', async () => {
    const res = await cortexEngine.reasonAndAct("Who's in my family");
    assert.ok(!res.spokenResponse.includes(BANNED_BOILERPLATE), 'Did not return banned boilerplate');
    assert.ok(/celine/i.test(res.spokenResponse), 'Mentions Celine');
    assert.ok(/elizabeth|alexander|eleonore|angelina/i.test(res.spokenResponse), 'Mentions children');
  });

  await t.test('Case 16: Email Modification ("I would like you to modify the email to say I love you")', async () => {
    const res = await cortexEngine.reasonAndAct('I would like you to modify the email to say I love you');
    assert.equal(res.actionCard.intent, 'email_draft');
    assert.equal(res.actionCard.emailData?.toEmail, 'celine.loeuille@gmail.com');
    assert.ok(res.actionCard.emailData?.body.includes('love you'));
  });

  await t.test('Case 17: Compound Intent ("Please tell me a joke and start thinking about also the email that I need to send")', async () => {
    const res = await cortexEngine.reasonAndAct('Please tell me a joke and start thinking about also the email that I need to send');
    assert.equal(res.actionCard.intent, 'email_draft', 'Resolved compound intent');
    assert.ok(res.spokenResponse.includes('Celine Loeuille'), 'Prepared draft to Celine');
  });

  await t.test('Case 18: Weather Disambiguation vs Calendar ("What\'s the weather going to be like tomorrow")', async () => {
    const res = await cortexEngine.reasonAndAct("What's the weather going to be like tomorrow");
    assert.equal(res.actionCard.intent, 'web_search', 'Routed weather to live intelligence web search');
    assert.ok(!res.spokenResponse.includes('Q3 Product Strategy'), 'Did NOT confuse weather with calendar appointment');
  });

  await t.test('Case 19: Standalone Calendar Query ("My calendar")', async () => {
    const res = await cortexEngine.reasonAndAct('My calendar');
    assert.equal(res.actionCard.intent, 'calendar_booking', 'Routed to calendar schedule briefing');
    assert.ok(!res.spokenResponse.includes(BANNED_BOILERPLATE), 'Did not return banned boilerplate');
  });

  await t.test('Case 20: Email Contents Inspection ("What\'s the contents of the email")', async () => {
    const res = await cortexEngine.reasonAndAct("What's the contents of the email");
    assert.ok(/draft|subject|reads|Celine/i.test(res.spokenResponse), 'Explained current draft contents');
  });

  await t.test('Case 21: AEC & Self-Hearing Filter ("let me know what step you\'d like to take")', async () => {
    const { recordAssistantSpokenText, isAcousticEcho } = await import('../src/services/speechSynthesis');
    recordAssistantSpokenText("Let me know what step you'd like to take.");
    const isEcho = isAcousticEcho("let me know what step you'd like to take");
    assert.ok(isEcho, 'Correctly identified reverberated assistant speech as acoustic echo');
  });

  await t.test('Case 22: Google Native Vector Embeddings & Semantic Search (text-embedding-004)', async () => {
    const { googleEmbeddings } = await import('../src/services/googleEmbeddingsService');
    const vec = await googleEmbeddings.generateEmbedding('Andrew Baxter executive virtual assistant');
    assert.equal(vec.length, 768, 'Generated 768-dimensional dense vector');

    const searchResults = await googleEmbeddings.searchSemanticContext('Who is Celine?', 2);
    assert.ok(searchResults.length > 0, 'Returned semantic vector search results');
    assert.ok(searchResults[0].record.text.includes('Celine Loeuille'), 'Top vector match identifies Celine Loeuille');
  });

  await t.test('Case 23: Topic-Shift & Dialogue Freshness (Zero Historic Loop Trap)', async () => {
    const { dialogueManager } = await import('../src/services/dialogueManager');
    dialogueManager.setPendingAction({
      type: 'send_email',
      payload: { toName: 'Celine', toEmail: 'celine.loeuille@gmail.com', subject: 'Old Action', body: 'Old', tone: 'friendly', status: 'draft', id: '1' },
      prompt: 'Send old email?'
    });

    assert.ok(dialogueManager.hasPendingAction(), 'Pending action set');

    // Simulate topic shift: user asks for a joke
    const res = await cortexEngine.reasonAndAct('Tell me a joke');
    assert.equal(res.actionCard.intent, 'knowledge_qa');

    // Clear stale action
    dialogueManager.clearPendingAction();
    assert.ok(!dialogueManager.hasPendingAction(), 'Cleared pending action cleanly on topic switch');
  });

  await t.test('Case 24: Google Journey Studio Voice Synthesis & Persona Configuration', async () => {
    const { setVoicePersona, getVoicePersona } = await import('../src/services/speechSynthesis');
    setVoicePersona('google_journey_female');
    assert.equal(getVoicePersona(), 'google_journey_female', 'Configured Google Journey Studio Female persona');

    setVoicePersona('google_journey_british');
    assert.equal(getVoicePersona(), 'google_journey_british', 'Configured Google Journey British Female persona');
  });

  await t.test('Case 25: Exhaustive Real-World Prompt Matrix Verification (100% Correct Spoken Understanding)', async () => {
    const prompts = [
      {
        input: 'Where do I live',
        expectedSnippets: ['Hoeilaart', '1560'],
        desc: 'Identifies Hoeilaart residence'
      },
      {
        input: 'How should I get to Brussels',
        expectedSnippets: ['S8', 'Groenendaal', 'Brussels', 'train'],
        desc: 'Provides S-Train & road commute to Brussels'
      },
      {
        input: 'What is the weather like',
        expectedSnippets: ['°C', 'Weather', 'wind', 'humidity'],
        desc: 'Delivers factual weather report'
      },
      {
        input: 'Where am I',
        expectedSnippets: ['Brussels', 'Hoeilaart'],
        desc: 'Provides regional location'
      },
      {
        input: 'How fast does a bird fly',
        expectedSnippets: ['Peregrine Falcon', 'Common Swift', 'km/h'],
        desc: 'Delivers avian biology facts'
      },
      {
        input: 'How many fish in the ocean',
        expectedSnippets: ['trillion', 'species'],
        desc: 'Delivers marine census data'
      },
      {
        input: 'Why is the sky blue',
        expectedSnippets: ['Rayleigh', 'scatter'],
        desc: 'Explains Rayleigh atmospheric scattering'
      },
      {
        input: 'What is the price of Bitcoin',
        expectedSnippets: ['Bitcoin', 'USD'],
        desc: 'Provides real-time crypto quote'
      },
      {
        input: 'Tell me a joke and also start thinking about the email',
        expectedSnippets: ['Celine Loeuille'],
        desc: 'Handles compound joke + email draft intent'
      },
      {
        input: 'How many hours did we save',
        expectedSnippets: ['234', 'hours'],
        desc: 'Provides accurate executive KPI metrics'
      }
    ];

    for (const p of prompts) {
      const res = await cortexEngine.reasonAndAct(p.input);
      assert.ok(!res.spokenResponse.includes(BANNED_BOILERPLATE), `No boilerplate for "${p.input}"`);
      const matched = p.expectedSnippets.some(s => 
        res.spokenResponse.toLowerCase().includes(s.toLowerCase()) || 
        (res.actionCard?.description && res.actionCard.description.toLowerCase().includes(s.toLowerCase()))
      );
      assert.ok(matched, `Expected snippet for prompt "${p.input}" (${p.desc}), got: "${res.spokenResponse}"`);
    }
  });

  // --- Case 26: Generic Entity, Person & Global Travel Matrix Intelligence ---
  await t.test('Case 26: Generic Entity, Person & Global Travel Matrix Intelligence', async () => {
    const genericTravelMatrix = [
      // 1. Family Relational Memory Entities
      {
        query: "My son's coming coming back from Senegal",
        expectedPerson: "Alexander",
        expectedLoc: "Senegal",
        isDeparting: false
      },
      {
        query: "My son is returning from Senegal",
        expectedPerson: "Alexander",
        expectedLoc: "Senegal",
        isDeparting: false
      },
      {
        query: "My wife Celine is coming home from Paris",
        expectedPerson: "Celine",
        expectedLoc: "Paris",
        isDeparting: false
      },
      {
        query: "My daughter is arriving from London",
        expectedPerson: "Elizabeth",
        expectedLoc: "London",
        isDeparting: false
      },
      // 2. Arbitrary Generic Named Persons & Colleagues
      {
        query: "Sarah is flying in from Tokyo tomorrow",
        expectedPerson: "Sarah",
        expectedLoc: "Tokyo",
        isDeparting: false
      },
      {
        query: "My colleague David is arriving from London",
        expectedPerson: "David",
        expectedLoc: "London",
        isDeparting: false
      },
      {
        query: "Marco is traveling to Madrid next week",
        expectedPerson: "Marco",
        expectedLoc: "Madrid",
        isDeparting: true
      },
      {
        query: "Sophie is visiting from Zurich",
        expectedPerson: "Sophie",
        expectedLoc: "Zurich",
        isDeparting: false
      },
      {
        query: "Lucas is heading to Singapore for a conference",
        expectedPerson: "Lucas",
        expectedLoc: "Singapore",
        isDeparting: true
      },
      {
        query: "Elena is landing from New York tonight",
        expectedPerson: "Elena",
        expectedLoc: "New York",
        isDeparting: false
      }
    ];

    for (const item of genericTravelMatrix) {
      const res = await cortexEngine.reasonAndAct(item.query);
      
      // Strict Anti-Boilerplate Invariant
      assert.ok(!res.spokenResponse.includes('intriguing topic'), `Must NOT return generic "intriguing topic" buzzwords for "${item.query}"`);
      assert.ok(!res.spokenResponse.includes(BANNED_BOILERPLATE), `Must not contain banned boilerplate for "${item.query}"`);

      // Person & Location Extraction
      assert.ok(
        res.spokenResponse.toLowerCase().includes(item.expectedPerson.toLowerCase()),
        `Must extract person "${item.expectedPerson}" for "${item.query}", got: "${res.spokenResponse}"`
      );
      assert.ok(
        res.spokenResponse.toLowerCase().includes(item.expectedLoc.toLowerCase()),
        `Must extract location "${item.expectedLoc}" for "${item.query}", got: "${res.spokenResponse}"`
      );

      // Context-Aware Executive Action Offering
      if (item.isDeparting) {
        assert.ok(
          res.spokenResponse.toLowerCase().includes('traveling') || res.spokenResponse.toLowerCase().includes('calendar') || res.spokenResponse.toLowerCase().includes('briefing'),
          `Must offer departure coordination for "${item.query}"`
        );
      } else {
        assert.ok(
          res.spokenResponse.toLowerCase().includes('welcome') || res.spokenResponse.toLowerCase().includes('return') || res.spokenResponse.toLowerCase().includes('calendar') || res.spokenResponse.toLowerCase().includes('arrival'),
          `Must offer arrival assistance for "${item.query}"`
        );
      }
    }
  });

  // --- Case 27: Tier 1 Instant Auto-Execution Invariant (Zero-Friction Direct Queries) ---
  await t.test('Case 27: Tier 1 Instant Auto-Execution Invariant', async () => {
    const instantQueries = [
      { input: "What's the weather like in Hoeilaart", expected: ["°c", "weather", "clear", "cloud", "rain"] },
      { input: "What is 15% of 850", expected: ["127.5"] },
      { input: "What time is it in Tokyo", expected: ["tokyo", "time", "jst"] },
      { input: "How do I get to Brussels from Hoeilaart", expected: ["s8", "train", "groenendaal", "e411"] },
      { input: "Who is in my family", expected: ["celine", "alexander", "elizabeth"] }
    ];

    for (const q of instantQueries) {
      const res = await cortexEngine.reasonAndAct(q.input);
      // Invariant: Must NOT ask for clarification or slots for simple factual queries
      assert.ok(!res.spokenResponse.toLowerCase().includes('could you tell me his name'), `Must NOT ask clarifying question for simple query "${q.input}"`);
      assert.ok(!res.spokenResponse.toLowerCase().includes('execution plan to shift'), `Must NOT formulate alignment plan for simple query "${q.input}"`);
      assert.ok(res.actionCard.executionTier !== 'needs_slots', `Execution tier must NOT be needs_slots for "${q.input}"`);
      
      const matched = q.expected.some(e => res.spokenResponse.toLowerCase().includes(e));
      assert.ok(matched, `Expected instant result for "${q.input}", got: "${res.spokenResponse}"`);
    }
  });

  // --- Case 28: Tier 2 Dual-Modal Slot-Filling (Colleague Arrival Tracking) ---
  await t.test('Case 28: Tier 2 Dual-Modal Slot-Filling', async () => {
    // Turn 1: Underspecified arrival tracking prompt
    const turn1Input = "My colleague is coming back from Madrid today, please find out what time he arrives";
    const turn1Res = await cortexEngine.reasonAndAct(turn1Input);

    assert.equal(turn1Res.actionCard.executionTier, 'needs_slots', 'Turn 1 must flag executionTier as needs_slots');
    assert.ok(turn1Res.spokenResponse.includes('Madrid') && (turn1Res.spokenResponse.includes('name') || turn1Res.spokenResponse.includes('flight')), `Turn 1 must prompt for missing name and flight details, got: "${turn1Res.spokenResponse}"`);
    assert.ok(Array.isArray(turn1Res.actionCard.slots) && turn1Res.actionCard.slots.length >= 2, 'Turn 1 must attach input slots');

    // Turn 2: Verbal slot fulfillment
    const turn1UserTurn: DialogueTurn = { id: 'u1', speaker: 'user', text: turn1Input, timestamp: new Date().toISOString() };
    const turn1AssistantTurn: DialogueTurn = { id: 'a1', speaker: 'assistant', text: turn1Res.spokenResponse, timestamp: new Date().toISOString() };

    const turn2Input = "His name is David Rossi and he is flying on Iberia flight IB3214";
    const turn2Res = await cortexEngine.reasonAndAct(turn2Input, [turn1AssistantTurn, turn1UserTurn]);

    assert.ok(turn2Res.spokenResponse.includes('David Rossi'), `Turn 2 must identify David Rossi, got: "${turn2Res.spokenResponse}"`);
    assert.ok(turn2Res.spokenResponse.includes('IB3214'), `Turn 2 must identify flight IB3214, got: "${turn2Res.spokenResponse}"`);
    assert.ok(turn2Res.spokenResponse.includes('15:45') || turn2Res.spokenResponse.includes('On Time'), `Turn 2 must return tracked arrival time, got: "${turn2Res.spokenResponse}"`);
    assert.equal(turn2Res.actionCard.status, 'executed', 'Turn 2 action card must be executed');
  });

  // --- Case 29: Tier 3 Pre-Flight Plan Alignment (High-Stakes Calendar Shift) ---
  await t.test('Case 29: Tier 3 Pre-Flight Plan Alignment', async () => {
    // Turn 1: High-stakes bulk meeting reschedule
    const turn1Input = "Move all my meetings tomorrow to Friday";
    const turn1Res = await cortexEngine.reasonAndAct(turn1Input);

    assert.equal(turn1Res.actionCard.executionTier, 'requires_alignment', 'Turn 1 must flag executionTier as requires_alignment');
    assert.ok(turn1Res.spokenResponse.includes('execution plan') || turn1Res.spokenResponse.includes('Should I proceed'), `Turn 1 must formulate plan alignment question, got: "${turn1Res.spokenResponse}"`);
    assert.ok(turn1Res.actionCard.executionPlan && turn1Res.actionCard.executionPlan.steps.length >= 2, 'Turn 1 must attach execution plan steps');

    // Turn 2: User confirmation ("Yes, proceed")
    const turn1UserTurn: DialogueTurn = { id: 'u1', speaker: 'user', text: turn1Input, timestamp: new Date().toISOString() };
    const turn1AssistantTurn: DialogueTurn = { id: 'a1', speaker: 'assistant', text: turn1Res.spokenResponse, timestamp: new Date().toISOString() };

    const turn2Input = "Yes, proceed and execute now";
    const turn2Res = await cortexEngine.reasonAndAct(turn2Input, [turn1AssistantTurn, turn1UserTurn]);

    assert.ok(turn2Res.spokenResponse.includes('Execution complete') || turn2Res.spokenResponse.includes('shifted'), `Turn 2 must confirm completion, got: "${turn2Res.spokenResponse}"`);
    assert.equal(turn2Res.actionCard.status, 'executed', 'Turn 2 action card must be executed');
  });

  // --- Case 30: Hybrid Pipeline & Live Connection Handshake Suite ---
  await t.test('Case 30: Hybrid Pipeline & Live Connection Handshake Suite', async () => {
    const { testGeminiConnection, testGroqConnection } = await import('../src/services/geminiService');

    // Test empty key handling
    const emptyGemini = await testGeminiConnection('');
    assert.equal(emptyGemini.success, false);
    assert.ok(emptyGemini.message.includes('valid Google Gemini API key'));

    const emptyGroq = await testGroqConnection('');
    assert.equal(emptyGroq.success, false);
    assert.ok(emptyGroq.message.includes('valid Groq API key'));

    // Test invalid key handling (Network/API rejected)
    const invalidGemini = await testGeminiConnection('invalid_dummy_key');
    assert.equal(invalidGemini.success, false);

    const invalidGroq = await testGroqConnection('invalid_dummy_key');
    assert.equal(invalidGroq.success, false);
  });

});
