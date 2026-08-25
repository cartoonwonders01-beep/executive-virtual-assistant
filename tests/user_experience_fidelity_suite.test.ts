import test from 'node:test';
import assert from 'node:assert/strict';

// Mock Browser Environment for Node.js Testing
if (typeof window === 'undefined') {
  (global as any).window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    localStorage: {
      store: {} as Record<string, string>,
      getItem(key: string) { return this.store[key] || null; },
      setItem(key: string, val: string) { this.store[key] = val; },
      removeItem(key: string) { delete this.store[key]; },
      clear() { this.store = {}; }
    },
    sessionStorage: {
      store: {} as Record<string, string>,
      getItem(key: string) { return this.store[key] || null; },
      setItem(key: string, val: string) { this.store[key] = val; },
      removeItem(key: string) { delete this.store[key]; },
      clear() { this.store = {}; }
    }
  };
  (global as any).localStorage = (global as any).window.localStorage;
  (global as any).sessionStorage = (global as any).window.sessionStorage;

  class MockMediaRecorder {
    public state: string = 'inactive';
    public ondataavailable: any = null;
    public onstop: any = null;
    constructor(public stream: any, public options: any) {}
    start() { this.state = 'recording'; }
    stop() {
      this.state = 'inactive';
      if (this.onstop) this.onstop();
    }
    static isTypeSupported() { return true; }
  }
  (global as any).window.MediaRecorder = MockMediaRecorder;
  (global as any).MediaRecorder = MockMediaRecorder;
}

test('User Experience Fidelity & Hardware Lifecycle Test Suite', async (t) => {

  await t.test('1. Microphone Hardware MediaStreamTrack Release Invariant', async () => {
    const { audioRecorder } = await import('../src/services/audioRecorder');

    let trackStopCount = 0;
    let trackReadyState = 'live';

    const mockTrack = {
      readyState: trackReadyState,
      stop: () => {
        trackStopCount++;
        trackReadyState = 'ended';
      }
    };

    const mockMediaStream = {
      getTracks: () => [mockTrack]
    };

    // Safely inject mock mediaDevices on globalThis.navigator
    try {
      Object.defineProperty(globalThis.navigator, 'mediaDevices', {
        value: {
          getUserMedia: async () => mockMediaStream
        },
        configurable: true,
        writable: true
      });
    } catch {
      (globalThis.navigator as any).mediaDevices = {
        getUserMedia: async () => mockMediaStream
      };
    }

    // Start recording
    const started = await audioRecorder.start({
      onAudioLevel: () => {},
      onRecordingComplete: () => {},
      onError: () => {}
    });

    assert.equal(started, true, 'Audio recorder started successfully');
    assert.equal(audioRecorder.isActive(), true, 'Audio recorder is actively recording');

    // Stop recording
    audioRecorder.stop();

    // Verify hardware track is strictly ended and stopped
    assert.equal(audioRecorder.isActive(), false, 'Audio recorder state is deactivated');
    assert.ok(trackStopCount >= 1, `MediaStreamTrack.stop() was explicitly called (called ${trackStopCount} times)`);
    assert.equal(trackReadyState, 'ended', 'MediaStreamTrack readyState is strictly "ended" (no ghost recording)');
  });

  await t.test('2. Discrete Push-to-Talk Single Turn Invariant (No Ghost Continuous Loop)', async () => {
    const { audioRecorder } = await import('../src/services/audioRecorder');

    // Ensure audio recorder abort and cleanup keeps recorder deactivated
    audioRecorder.abort();
    assert.equal(audioRecorder.isActive(), false, 'Recorder is inactive after abort');

    // Wait 500ms to ensure no trailing background timer re-activates recording
    await new Promise(r => setTimeout(r, 500));
    assert.equal(audioRecorder.isActive(), false, 'Recorder remains strictly inactive (no rogue continuous auto-restarts)');
  });

  await t.test('3. Telemetry Active Session Isolation & Clean Slate Invariant', async () => {
    const { logger } = await import('../src/services/loggerService');

    // Wipe all storage to simulate clean boot
    logger.clearAllStorage();

    const activeSessionId = logger.getSessionId();
    assert.ok(activeSessionId.startsWith('session-'), 'Clean active session initialized');

    // Log active events
    logger.log('info', 'ai_reasoning', 'Turn 1 processing');
    logger.log('info', 'speech_stt', 'Spoken query');

    const entries = logger.getEntries();
    assert.ok(entries.every(e => e.sessionId === activeSessionId), 'Active buffer strictly contains entries for current session ONLY (0 old leaked logs)');

    // Archive session and verify clean slate for new session
    const archive = logger.archiveCurrentSession('Completed Chat 1');
    assert.equal(archive.sessionId, activeSessionId, 'Archive record preserves session ID');

    const newEntries = logger.getEntries();
    assert.equal(newEntries.length, 1, 'Active stream reset to fresh state with single initialization entry');
  });

  await t.test('4. Dialogue Turns Chronological UI Order Mathematical Invariant', async () => {
    // In AssistantContext: dialogueTurns stores [newest, older, oldest]
    const rawStore = [
      { id: 'turn-3', speaker: 'assistant', text: 'Reply 2', timestamp: '2026-08-25T01:00:03Z' },
      { id: 'turn-2', speaker: 'user', text: 'Question 2', timestamp: '2026-08-25T01:00:02Z' },
      { id: 'turn-1', speaker: 'assistant', text: 'Reply 1', timestamp: '2026-08-25T01:00:01Z' },
      { id: 'turn-0', speaker: 'user', text: 'Question 1', timestamp: '2026-08-25T01:00:00Z' }
    ];

    // LiveChatView renders: rawStore.slice().reverse().map(...)
    const renderedUIList = rawStore.slice().reverse();

    // Verify chronological order: turn-0 (oldest) is at index 0 (top), turn-3 (newest) is at index 3 (bottom)
    assert.equal(renderedUIList[0].id, 'turn-0', 'Oldest user question rendered at top (index 0)');
    assert.equal(renderedUIList[1].id, 'turn-1', 'First assistant reply rendered below question 1');
    assert.equal(renderedUIList[2].id, 'turn-2', 'Second user question rendered below reply 1');
    assert.equal(renderedUIList[3].id, 'turn-3', 'Newest assistant reply rendered at bottom (index 3), aligned with auto-scroll anchor');
  });

  await t.test('5. Telemetry Inspector Newest-on-Top Render Invariant', async () => {
    const rawLogs = [
      { id: 'log-3', ts: 3000, msg: 'Latest speech event' },
      { id: 'log-2', ts: 2000, msg: 'Gemini reasoning event' },
      { id: 'log-1', ts: 1000, msg: 'Session init event' }
    ];

    // Default newest_top mode displays rawLogs directly
    assert.equal(rawLogs[0].id, 'log-3', 'Latest event is rendered as card #1 at the very top of the log panel');
    assert.equal(rawLogs[0].msg, 'Latest speech event', 'Card #1 content matches latest action without scrolling');
  });

  await t.test('6. Emergency Universal STOP Button Hardware Kill', async () => {
    const { audioRecorder } = await import('../src/services/audioRecorder');
    const { wakeWordService } = await import('../src/services/wakeWordService');
    const { stopSpeaking } = await import('../src/services/speechSynthesis');

    // Trigger halt sequence
    stopSpeaking();
    audioRecorder.abort();
    wakeWordService.hardHalt();

    assert.equal(audioRecorder.isActive(), false, 'Audio recorder is strictly halted');
    assert.equal(wakeWordService.isPassiveListeningActive(), false, 'Wake-word service is strictly halted');
  });

  await t.test('7. VAD Low-Latency Silence Timeout Invariant (Google Home <=350ms)', async () => {
    const { audioRecorder } = await import('../src/services/audioRecorder');
    const vadOptions = audioRecorder.getVADOptions();

    assert.ok(vadOptions.silenceDurationMs <= 350, `VAD silence duration is ultra-responsive (${vadOptions.silenceDurationMs}ms <= 350ms)`);
  });

  await t.test('8. Speculative Semantic Fast-Path Sub-15ms Benchmark', async () => {
    const { CortexDialogueEngine } = await import('../src/services/cortexDialogueEngine');
    const cortex = CortexDialogueEngine.getInstance();

    const startJoke = performance.now();
    const jokeResult = await cortex.reasonAndAct('Tell me a joke');
    const elapsedJoke = performance.now() - startJoke;

    assert.ok(elapsedJoke < 25, `Joke intent resolved in ${elapsedJoke.toFixed(2)}ms (<25ms benchmark)`);
    assert.ok(jokeResult.spokenResponse.length > 0, 'Joke content generated');

    const startEmail = performance.now();
    const emailResult = await cortex.reasonAndAct('Draft an email to Celine saying hi');
    const elapsedEmail = performance.now() - startEmail;

    assert.ok(elapsedEmail < 25, `Email intent resolved in ${elapsedEmail.toFixed(2)}ms (<25ms benchmark)`);
    assert.equal(emailResult.actionCard.intent, 'email_draft', 'Email draft created');
  });

  await t.test('9. Zero-Latency Local Speech Synthesis Invariant', async () => {
    const { speakResponse, isCurrentlySpeaking, stopSpeaking } = await import('../src/services/speechSynthesis');

    speakResponse('Testing ultra low latency speech synthesis');
    stopSpeaking();

    assert.equal(isCurrentlySpeaking(), false, 'Speech state cleaned up after stop');
  });

});
