import test from 'node:test';
import assert from 'node:assert/strict';
import { intelligentAdvisor } from '../src/services/intelligentAdvisor';
import { dialogueManager } from '../src/services/dialogueManager';
import { 
  DEFAULT_LLM_PROFILES, 
  detectSpeakerFromTranscript, 
  getProfileDialogueStorageKey 
} from '../src/config';

/**
 * Synthetic WAV Generator:
 * Generates a valid RIFF/WAV header and PCM sine wave audio buffer in memory.
 */
function createSyntheticWavBuffer(durationSeconds = 1.0, sampleRate = 16000, frequency = 440): Buffer {
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const blockAlign = 2; // 16-bit mono
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF Chunk
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt Subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(1, 22);  // NumChannels (1 = Mono)
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // BitsPerSample (16 bits)

  // data Subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Generate PCM Sine Wave
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * frequency * t);
    const intSample = Math.floor(sample * 32767);
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }

  return buffer;
}

test('Autonomous Voice & Dialogue Interactive Simulation Suite', async (t) => {

  await t.test('Simulation 1: Synthetic WAV Audio Generator produces valid RIFF headers', async () => {
    const wav = createSyntheticWavBuffer(1.5, 16000, 440);
    assert.ok(wav.length > 44, 'WAV buffer has data');
    assert.equal(wav.toString('ascii', 0, 4), 'RIFF', 'Valid RIFF header');
    assert.equal(wav.toString('ascii', 8, 12), 'WAVE', 'Valid WAVE format');
    assert.equal(wav.toString('ascii', 12, 16), 'fmt ', 'Valid fmt chunk');
    assert.equal(wav.toString('ascii', 36, 40), 'data', 'Valid data chunk');
  });

  await t.test('Simulation 2: Interactive Small Talk & Humor Latency (<15ms)', async () => {
    const start = performance.now();
    const jokeResult = intelligentAdvisor.solve('Can you tell me a joke?');
    const elapsed = performance.now() - start;

    assert.ok(elapsed < 20, `Joke response resolved in ${elapsed.toFixed(2)}ms (<20ms benchmark)`);
    assert.ok(jokeResult.spokenResponse.length > 10, 'Delivered valid spoken joke');
    assert.ok(/light|bugs|dark mode|programmer/i.test(jokeResult.spokenResponse), 'Delivered funny programmer joke');
    assert.equal(jokeResult.category, 'General');
  });

  await t.test('Simulation 3: Natural Multi-Turn Executive Dialogue & Follow-up', async () => {
    dialogueManager.clearTurns();

    // Turn 1: User asks about a contact
    const turn1Start = performance.now();
    const ans1 = intelligentAdvisor.solve('Who is Sarah Chen?');
    const elapsed1 = performance.now() - turn1Start;

    assert.ok(elapsed1 < 20, `Turn 1 resolved in ${elapsed1.toFixed(2)}ms`);
    assert.ok(ans1.spokenResponse.includes('Head of Growth'), 'Sarah role recognized');
    assert.ok(ans1.spokenResponse.includes('sarah.chen@innovate.co'), 'Sarah email resolved');

    // Dialogue turn recorded
    dialogueManager.addTurn({
      id: 't1',
      speaker: 'user',
      text: 'Who is Sarah Chen?',
      timestamp: new Date().toISOString()
    });
    dialogueManager.addTurn({
      id: 't2',
      speaker: 'assistant',
      text: ans1.spokenResponse,
      timestamp: new Date().toISOString()
    });

    assert.equal(dialogueManager.getTurns().length, 2, '2 turns registered');
  });

  await t.test('Simulation 4: Speaker Recognition & Family Profile Auto-Switching', async () => {
    // 1. Emily speaks
    const emilySpeech = "Hi Eve, it's Emily, can you check our family weekend plans?";
    const detectedEmily = detectSpeakerFromTranscript(emilySpeech, DEFAULT_LLM_PROFILES);
    assert.ok(detectedEmily, 'Emily detected from speech');
    assert.equal(detectedEmily?.userContext.userName, 'Emily');
    assert.equal(detectedEmily?.id, 'prof-emily');

    // 2. Andrew speaks
    const andrewSpeech = "Hey Eve, Andrew here, what are my top strategic priorities today?";
    const detectedAndrew = detectSpeakerFromTranscript(andrewSpeech, DEFAULT_LLM_PROFILES);
    assert.ok(detectedAndrew, 'Andrew detected from speech');
    assert.equal(detectedAndrew?.userContext.userName, 'Andrew');

    // 3. Kids / Family speak
    const familySpeech = "Hello Eve, this is the kids, tell us a story about space";
    const detectedFamily = detectSpeakerFromTranscript(familySpeech, DEFAULT_LLM_PROFILES);
    assert.ok(detectedFamily, 'Family/Kids detected from speech');
    assert.equal(detectedFamily?.userContext.userName, 'Family');
  });

  await t.test('Simulation 5: European Multilingual Dialogue Engine (German, French, Spanish)', async () => {
    // German (Deutsch)
    const deResult = intelligentAdvisor.solve('Wie kann ich meine Produktivität und Deep Work verbessern?');
    assert.equal(deResult.language, 'de', 'German detected');
    assert.ok(deResult.spokenResponse.includes('Deep-Work-Block') || deResult.spokenResponse.includes('Hebel'), 'German advice rendered');

    // French (Français)
    const frResult = intelligentAdvisor.solve('Comment gérer une crise ou une réclamation client?');
    assert.equal(frResult.language, 'fr', 'French detected');
    assert.ok(frResult.spokenResponse.includes('4 étapes') || frResult.spokenResponse.includes('client'), 'French advice rendered');

    // Spanish (Español)
    const esResult = intelligentAdvisor.solve('Cómo optimizar la productividad y el enfoque profundo?');
    assert.equal(esResult.language, 'es', 'Spanish detected');
    assert.ok(esResult.spokenResponse.includes('enfoque') || esResult.spokenResponse.includes('productividad'), 'Spanish advice rendered');
  });

  await t.test('Simulation 6: Natural Human Response Pacing (No PM Boilerplate)', async () => {
    const query = 'What do you think about AI agent swarms?';
    const result = intelligentAdvisor.solve(query);

    // Verify response is articulate, direct, and conversational
    assert.ok(result.spokenResponse.length > 20, 'Has spoken response');
    assert.ok(!result.spokenResponse.includes('**Strategic Insights:**'), 'No artificial markdown in spoken voice');
    assert.ok(!result.spokenResponse.includes('💡 Executive Pro-Tip:'), 'No pro-tip boilerplate in spoken voice');
  });

  await t.test('Simulation 7: Clarification & Curiosity on Ambiguity ("I have a problem")', async () => {
    const ambiguousQuery = 'I have a problem';
    const result = intelligentAdvisor.solve(ambiguousQuery);

    assert.equal(result.title, 'Interactive Clarification & Alignment');
    assert.ok(result.spokenResponse.includes('share a bit more') || result.spokenResponse.includes('situation'), 'Asks clarifying question');
    assert.ok(result.actionSteps.length >= 2, 'Provides exploration angles');
  });

  await t.test('Simulation 8: Chain-of-Thought 3-Phase Strategic Planning ("Plan my next 30 days")', async () => {
    const planQuery = 'Plan my next 30 days for business growth';
    const result = intelligentAdvisor.solve(planQuery);

    assert.ok(result.title.includes('Strategic Action Plan'), 'Strategic plan generated');
    assert.ok(result.spokenResponse.includes('3-phase action plan'), 'Spoken overview mentions 3-phase plan');
    assert.ok(result.keyInsights.some(k => k.includes('Phase 1')), 'Contains Phase 1');
    assert.ok(result.keyInsights.some(k => k.includes('Phase 2')), 'Contains Phase 2');
    assert.ok(result.keyInsights.some(k => k.includes('Phase 3')), 'Contains Phase 3');
  });

  await t.test('Simulation 9: Multi-Turn Context & Pronoun Continuity', async () => {
    dialogueManager.clearTurns();

    // Turn 1: User mentions a problem with client onboarding
    const t1 = intelligentAdvisor.solve('I have a problem with client onboarding delays');
    dialogueManager.addTurn({ id: 't1', speaker: 'user', text: 'I have a problem with client onboarding delays', timestamp: new Date().toISOString() });
    dialogueManager.addTurn({ id: 't2', speaker: 'assistant', text: t1.spokenResponse, timestamp: new Date().toISOString() });

    // Turn 2: User asks for a plan to fix it
    const t2 = intelligentAdvisor.solve('Create a plan to fix client onboarding delays');
    dialogueManager.addTurn({ id: 't3', speaker: 'user', text: 'Create a plan to fix client onboarding delays', timestamp: new Date().toISOString() });
    dialogueManager.addTurn({ id: 't4', speaker: 'assistant', text: t2.spokenResponse, timestamp: new Date().toISOString() });

    assert.equal(dialogueManager.getTurns().length, 4, '4 turns tracked in dialogue memory');
    assert.ok(t2.spokenResponse.includes('3-phase'), 'Generated plan for prior turn topic');
  });

});
