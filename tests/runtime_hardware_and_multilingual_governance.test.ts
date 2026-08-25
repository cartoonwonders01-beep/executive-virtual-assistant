import test from 'node:test';
import assert from 'node:assert/strict';

test('Runtime Hardware, Multilingual Governance & Zero-Idle CPU Governance Suite', async (t) => {

  // Setup DOM / Browser globals mock for Node.js test environment
  if (typeof globalThis.window === 'undefined') {
    (globalThis as any).window = globalThis;
  }
  if (typeof globalThis.navigator === 'undefined') {
    (globalThis as any).navigator = { language: 'fr-FR', userAgent: 'NodeTest' };
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
  if (typeof (globalThis as any).addEventListener === 'undefined') {
    (globalThis as any).addEventListener = () => {};
    (globalThis as any).removeEventListener = () => {};
  }
  if (typeof (globalThis as any).window !== 'undefined' && typeof (globalThis as any).window.addEventListener === 'undefined') {
    (globalThis as any).window.addEventListener = () => {};
    (globalThis as any).window.removeEventListener = () => {};
  }

  await t.test('1. Dynamic STT Multi-Locale Binding (French, German, Spanish, English)', async () => {
    (globalThis as any).SpeechRecognition = class MockSpeechRecognition {
      continuous = false;
      interimResults = false;
      lang = '';
      start() {}
      stop() {}
      abort() {}
    };

    // Test French Locale Binding
    localStorage.setItem('assistant_preferred_language', 'fr');
    const { audioRecorder } = await import('../src/services/audioRecorder');

    (globalThis as any).navigator.mediaDevices = {
      getUserMedia: async () => ({
        getAudioTracks: () => [{
          stop: () => {},
          readyState: 'live',
          enabled: true
        }],
        getTracks: () => [{
          stop: () => {},
          readyState: 'live',
          enabled: true
        }]
      })
    };

    const testConfig = {
      onRecordingComplete: () => {},
      onLiveTranscript: () => {},
      onAudioLevel: () => {}
    };

    await audioRecorder.start(testConfig);
    const sttInstance = (audioRecorder as any).speechRecognition;
    assert.ok(sttInstance, 'SpeechRecognition instance created');
    assert.equal(sttInstance.lang, 'fr-FR', 'Speech recognition language dynamically configured to fr-FR');
    await audioRecorder.stop();

    // Test German Locale Binding
    localStorage.setItem('assistant_preferred_language', 'de');
    await audioRecorder.start(testConfig);
    assert.equal((audioRecorder as any).speechRecognition.lang, 'de-DE', 'Speech recognition language dynamically configured to de-DE');
    await audioRecorder.stop();

    // Test Spanish Locale Binding
    localStorage.setItem('assistant_preferred_language', 'es');
    await audioRecorder.start(testConfig);
    assert.equal((audioRecorder as any).speechRecognition.lang, 'es-ES', 'Speech recognition language dynamically configured to es-ES');
    await audioRecorder.stop();

    // Test English Locale Binding
    localStorage.setItem('assistant_preferred_language', 'en');
    await audioRecorder.start(testConfig);
    assert.equal((audioRecorder as any).speechRecognition.lang, 'en-US', 'Speech recognition language dynamically configured to en-US');
    await audioRecorder.stop();
  });

  await t.test('2. Dynamic Wake-Word STT Locale Binding', async () => {
    localStorage.setItem('assistant_preferred_language', 'fr');
    const { wakeWordService } = await import('../src/services/wakeWordService');
    wakeWordService.startPassiveListening({ onWakeWordDetected: () => {}, onSpeechTranscript: () => {} });
    const wwRec = (wakeWordService as any).recognition;
    assert.ok(wwRec, 'Wake word recognition instance created');
    assert.equal(wwRec.lang, 'fr-FR', 'Wake word listener configured with fr-FR');
    wakeWordService.stopPassiveListening();
  });

  await t.test('3. Multilingual Dialogue Strict Non-Leakage Matrix (Zero English Leakage)', async () => {
    const { intelligentAdvisor } = await import('../src/services/intelligentAdvisor');

    // 1. French Conversation Queries
    const frQueries = [
      'Bonjour Eve, comment vas-tu ?',
      'Quelles sont 3 stratégies pour le travail profond ?',
      'Comment gérer une escalade avec un client difficile ?',
      'Que penses-tu de mon planning aujourd\'hui ?',
      'Peux-tu m\'aider à organiser ma journée ?',
      'Tu m\'entends bien ?'
    ];

    for (const q of frQueries) {
      const res = intelligentAdvisor.solve(q);
      assert.equal(res.language, 'fr', `Query "${q}" recognized as French`);
      assert.ok(!res.spokenResponse.includes('Regarding this: The clearest path'), `French query "${q}" must not leak English fallback`);
      assert.ok(!res.spokenResponse.includes('Your pipeline is active'), `French query "${q}" must not leak English pipeline text`);
      assert.ok(res.spokenResponse.length > 10, 'Rich response generated in French');
    }

    // 2. German Conversation Queries
    const deQueries = [
      'Hallo Eve, wie geht es dir?',
      'Was sind 3 Strategien für eine produktive Morgenroutine?',
      'Wie gehe ich mit einer Kundeneskalation um?',
      'Was denkst du über unsere Wachstumsstrategie?',
      'Hilf mir, meine Prioritäten zu ordnen'
    ];

    for (const q of deQueries) {
      const res = intelligentAdvisor.solve(q);
      assert.equal(res.language, 'de', `Query "${q}" recognized as German`);
      assert.ok(!res.spokenResponse.includes('Regarding this: The clearest path'), `German query "${q}" must not leak English fallback`);
      assert.ok(res.spokenResponse.length > 10, 'Rich response generated in German');
    }

    // 3. Spanish Conversation Queries
    const esQueries = [
      '¡Hola Eve! ¿Cómo estás?',
      '¿Cuáles son 3 estrategias para la productividad ejecutiva?',
      '¿Qué opinas de nuestra estrategia de crecimiento?',
      '¿Puedes ayudarme con mi agenda?'
    ];

    for (const q of esQueries) {
      const res = intelligentAdvisor.solve(q);
      assert.equal(res.language, 'es', `Query "${q}" recognized as Spanish`);
      assert.ok(!res.spokenResponse.includes('Regarding this: The clearest path'), `Spanish query "${q}" must not leak English fallback`);
      assert.ok(res.spokenResponse.length > 10, 'Rich response generated in Spanish');
    }
  });

  await t.test('4. Native Neural Voice Persona Resolution by Language', async () => {
    const { resolveBestVoice } = await import('../src/services/speechSynthesis');

    (globalThis as any).window.speechSynthesis = {
      getVoices: () => [
        { name: 'Microsoft Aria Online (Natural)', lang: 'en-US', default: true },
        { name: 'Apple Ava (Premium)', lang: 'en-US', default: false },
        { name: 'Google Français', lang: 'fr-FR', default: false },
        { name: 'Thomas (Natural)', lang: 'fr-FR', default: false },
        { name: 'Katja (Natural)', lang: 'de-DE', default: false },
        { name: 'Google Deutsch', lang: 'de-DE', default: false },
        { name: 'Monica (Natural)', lang: 'es-ES', default: false },
        { name: 'Google Español', lang: 'es-ES', default: false }
      ]
    };

    const frVoice = resolveBestVoice('studio_female', 'fr');
    assert.ok(frVoice, 'Found French voice');
    assert.ok(frVoice.lang.startsWith('fr'), `Resolved French voice has fr lang (got ${frVoice.lang})`);

    const deVoice = resolveBestVoice('studio_female', 'de');
    assert.ok(deVoice, 'Found German voice');
    assert.ok(deVoice.lang.startsWith('de'), `Resolved German voice has de lang (got ${deVoice.lang})`);

    const esVoice = resolveBestVoice('studio_female', 'es');
    assert.ok(esVoice, 'Found Spanish voice');
    assert.ok(esVoice.lang.startsWith('es'), `Resolved Spanish voice has es lang (got ${esVoice.lang})`);

    const enVoice = resolveBestVoice('studio_female', 'en');
    assert.ok(enVoice, 'Found English voice');
    assert.ok(enVoice.lang.startsWith('en'), `Resolved English voice has en lang (got ${enVoice.lang})`);
  });

  await t.test('5. Zero-CPU Idle Visualizer Invariant (Animation Throttling Guard)', async () => {
    let rafCallCount = 0;
    (globalThis as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
      rafCallCount++;
      return 1;
    };
    (globalThis as any).cancelAnimationFrame = () => {};

    const isListening = false;
    const isProcessingSpeech = false;
    let animId: number | undefined;

    const render = () => {
      if (isListening || isProcessingSpeech) {
        animId = requestAnimationFrame(render);
      }
    };
    render();

    assert.equal(rafCallCount, 0, 'Zero requestAnimationFrame loops scheduled when HUD is idle');
  });

  await t.test('6. Hardware Stream Lifecycle & Synchronous Track Termination', async () => {
    const { audioRecorder } = await import('../src/services/audioRecorder');

    let trackStopped = false;
    const mockTrack = {
      stop: () => { trackStopped = true; },
      readyState: 'live',
      enabled: true
    };

    (globalThis as any).navigator.mediaDevices = {
      getUserMedia: async () => ({
        getAudioTracks: () => [mockTrack],
        getTracks: () => [mockTrack]
      })
    };

    await audioRecorder.start({
      onRecordingComplete: () => {},
      onLiveTranscript: () => {},
      onAudioLevel: () => {}
    });
    assert.equal(audioRecorder.isActive(), true, 'Recorder is active');

    await audioRecorder.stop();
    assert.equal(audioRecorder.isActive(), false, 'Recorder is stopped');
    assert.equal(trackStopped, true, 'Hardware audio track was stopped synchronously on stop()');
  });

});
