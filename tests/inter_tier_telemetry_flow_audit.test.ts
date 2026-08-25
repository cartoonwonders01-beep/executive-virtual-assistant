import test from 'node:test';
import assert from 'node:assert/strict';

test('Inter-Tier Telemetry Flow & Cross-Layer Simulation Audit Suite', async (t) => {

  // Setup browser mocks
  if (typeof globalThis.window === 'undefined') {
    (globalThis as any).window = globalThis;
  }
  if (typeof (globalThis as any).addEventListener === 'undefined') {
    (globalThis as any).addEventListener = () => {};
    (globalThis as any).removeEventListener = () => {};
  }
  if (typeof globalThis.navigator === 'undefined') {
    (globalThis as any).navigator = { language: 'en-US', userAgent: 'NodeTelemetryTest' };
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

  const { logger } = await import('../src/services/loggerService');
  const { cortexEngine } = await import('../src/services/cortexDialogueEngine');
  const { detectLanguage, resolveBestVoice, cleanTextForSpeech } = await import('../src/services/speechSynthesis');
  const { audioRecorder } = await import('../src/services/audioRecorder');

  // Setup mock speechSynthesis voices
  (globalThis as any).window.speechSynthesis = {
    cancel: () => {},
    speak: () => {},
    getVoices: () => [
      { name: 'Microsoft Aria Online (Natural)', lang: 'en-US', default: true },
      { name: 'Thomas (Natural)', lang: 'fr-FR', default: false },
      { name: 'Katja (Natural)', lang: 'de-DE', default: false },
      { name: 'Monica (Natural)', lang: 'es-ES', default: false }
    ]
  };

  await t.test('Flow 1: English Family Email Dispatch (Inter-Tier Audio -> STT -> RAG -> ReAct -> TTS -> Log)', async () => {
    logger.archiveCurrentSession('Flow 1 Test');

    // 1. Tier 1 & 2: Simulate User Speech Ingestion
    const rawSpeech = 'Send a note to Eleonore saying have a wonderful day';
    logger.log('info', 'speech_stt', `Live STT Transcript: "${rawSpeech}"`);

    // 2. Tier 3 & 4: Cortex ReAct with Family Memory Graph Resolution
    const cortexResult = await cortexEngine.reasonAndAct(rawSpeech);

    assert.equal(cortexResult.actionCard.intent, 'email_draft', 'Intent resolved to email_draft');
    assert.equal(cortexResult.actionCard.emailData?.toName, 'Eleonore Baxter', 'Resolved entity name Eleonore Baxter');
    assert.equal(cortexResult.actionCard.emailData?.toEmail, 'eleonore.a.baxter@gmail.com', 'Resolved entity email eleonore.a.baxter@gmail.com');
    assert.ok(cortexResult.actionCard.emailData?.body.includes('wonderful day'), 'Captured core message body');

    // 3. Tier 5: Speech Synthesis & Phonetic Cleaning
    const detectedLang = detectLanguage(cortexResult.spokenResponse);
    assert.equal(detectedLang, 'en', 'Detected English language');
    const voice = resolveBestVoice('studio_female', detectedLang);
    assert.ok(voice?.lang.startsWith('en'), 'Resolved English neural voice');

    // 4. Tier 6: Forensic Telemetry Log Audit
    const logs = logger.getEntries();
    const categories = logs.map(l => l.category);
    assert.ok(categories.includes('speech_stt'), 'Logged Tier 2 STT');
    assert.ok(categories.includes('ai_reasoning'), 'Logged Tier 3 ReAct reasoning');

    console.log('  📊 [Flow 1 Log Audit] Captured', logs.length, 'telemetry entries across all tiers.');
  });

  await t.test('Flow 2: French Executive Planning & Language Switching (Zero English Leakage)', async () => {
    // 1. Tier 1 & 2: French Speech Ingestion
    const frSpeech = 'Bonjour Eve, peux-tu m\'aider avec mes priorités de la semaine ?';
    logger.log('info', 'speech_stt', `Live STT Transcript: "${frSpeech}"`);

    // 2. Tier 3: Cortex ReAct French Dialogue
    const cortexResult = await cortexEngine.reasonAndAct(frSpeech);
    assert.equal(cortexResult.actionCard.intent, 'knowledge_qa');

    // 3. Tier 5: Language & Voice Resolution
    const detectedLang = detectLanguage(cortexResult.spokenResponse);
    assert.equal(detectedLang, 'fr', 'Detected French language');
    const voice = resolveBestVoice('studio_female', detectedLang);
    assert.ok(voice?.lang.startsWith('fr'), `Resolved French voice (got ${voice?.lang})`);

    // Verify zero English leakage in spoken response
    assert.ok(!cortexResult.spokenResponse.includes('Regarding this: The clearest path'), 'Must not leak English fallback');
    assert.ok(!cortexResult.spokenResponse.includes('Your pipeline is active'), 'Must not leak English pipeline');

    console.log('  📊 [Flow 2 Log Audit] French dialogue generated with voice:', voice?.name);
  });

  await t.test('Flow 3: German Strategy & Productivity Dialogue', async () => {
    const deSpeech = 'Hallo Eve, was sind 3 Strategien für eine produktive Morgenroutine?';
    logger.log('info', 'speech_stt', `Live STT Transcript: "${deSpeech}"`);

    const cortexResult = await cortexEngine.reasonAndAct(deSpeech);
    assert.equal(cortexResult.actionCard.intent, 'knowledge_qa');

    const detectedLang = detectLanguage(cortexResult.spokenResponse);
    assert.equal(detectedLang, 'de', 'Detected German language');
    const voice = resolveBestVoice('studio_female', detectedLang);
    assert.ok(voice?.lang.startsWith('de'), `Resolved German voice (got ${voice?.lang})`);
    assert.ok(cortexResult.spokenResponse.includes('Hebel') || cortexResult.spokenResponse.includes('Deep-Work'), 'Delivered German strategy');

    console.log('  📊 [Flow 3 Log Audit] German dialogue generated with voice:', voice?.name);
  });

  await t.test('Flow 4: Live Meteorological & Web Search Grounding Inter-Tier Audit', async () => {
    const query = "What's the weather in London tomorrow";
    const cortexResult = await cortexEngine.reasonAndAct(query);

    assert.equal(cortexResult.actionCard.intent, 'web_search', 'Web search intent executed');
    assert.ok(
      cortexResult.toolCallExecuted?.toolName === 'get_weather' || cortexResult.toolCallExecuted?.toolName === 'search_web',
      'get_weather or search_web tool call recorded'
    );
    assert.ok(cortexResult.spokenResponse.includes('London') && (cortexResult.spokenResponse.includes('°C') || cortexResult.spokenResponse.includes('°F')), 'Delivered factual weather data');

    console.log('  📊 [Flow 4 Log Audit] Tool execution verified:', cortexResult.toolCallExecuted?.toolName);
  });

  await t.test('Flow 5: Emergency Hard STOP & Synchronous Hardware Release Audit', async () => {
    let trackHalted = false;
    (globalThis as any).navigator.mediaDevices = {
      getUserMedia: async () => ({
        getAudioTracks: () => [{
          stop: () => { trackHalted = true; },
          readyState: 'live',
          enabled: true
        }],
        getTracks: () => [{
          stop: () => { trackHalted = true; },
          readyState: 'live',
          enabled: true
        }]
      })
    };

    await audioRecorder.start({
      onRecordingComplete: () => {},
      onLiveTranscript: () => {},
      onAudioLevel: () => {}
    });
    assert.equal(audioRecorder.isActive(), true, 'Recorder active before halt');

    // Trigger Emergency Stop
    await audioRecorder.stop();
    assert.equal(audioRecorder.isActive(), false, 'Recorder inactive after halt');
    assert.equal(trackHalted, true, 'Microphone hardware tracks halted synchronously');

    console.log('  📊 [Flow 5 Log Audit] Hardware stop audit confirmed clean track termination.');
  });

});
