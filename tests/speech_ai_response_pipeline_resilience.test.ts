import test from 'node:test';
import assert from 'node:assert/strict';
import { cortexEngine } from '../src/services/cortexDialogueEngine';
import { intelligentAdvisor } from '../src/services/intelligentAdvisor';
import { prewarmAudioContext, cleanTextForSpeech } from '../src/services/speechSynthesis';

test('Speech-to-AI Response Pipeline Resilience & Autoplay Unlocking Suite', async (t) => {

  // Test 1: Simulating Stalled / Invalid Gemini API Key -> Instant Fallback without Hanging
  await t.test('Case 1: Stalled or Rejected Gemini Inference Triggers Instant Local Fallback', async () => {
    const start = Date.now();
    // Pass an intentionally invalid/failing key to test resilience and fallback speed
    const result = await cortexEngine.reasonAndAct(
      'What are 3 critical metrics for evaluating SaaS sales efficiency?',
      [],
      undefined,
      'INVALID_MOCK_STALLED_KEY'
    );
    const elapsedMs = Date.now() - start;

    assert.ok(elapsedMs < 6000, `Completed fallback within timeout window (${elapsedMs}ms)`);
    assert.ok(result.spokenResponse && result.spokenResponse.length > 10, 'Generated spoken response');
    assert.ok(result.actionCard, 'Generated structured action card');
    assert.ok(!result.spokenResponse.includes('undefined'), 'Spoken response is valid string');
  });

  // Test 2: Clean Phonetics & Markdown Stripping for Audio Synthesis
  await t.test('Case 2: Clean Text for Speech Strips Emojis and Markdown without Truncation', () => {
    const rawText = "### 🚀 Executive Briefing\n\n• **Goal**: Achieve 100% test coverage.\nCheck [docs](https://example.com).";
    const cleaned = cleanTextForSpeech(rawText);

    assert.ok(!cleaned.includes('###'), 'Stripped headers');
    assert.ok(!cleaned.includes('**'), 'Stripped bold markdown');
    assert.ok(!cleaned.includes('🚀'), 'Stripped emoji');
    assert.ok(!cleaned.includes('https://'), 'Stripped raw URLs');
    assert.ok(cleaned.includes('Achieve 100% test coverage'), 'Preserved core speech content');
    assert.ok(cleaned.includes('docs'), 'Preserved link label');
  });

  // Test 3: High-IQ Reasoning Guarantee on Direct Questions
  await t.test('Case 3: Direct User Questions Receive Actionable High-IQ Solution', () => {
    const query = 'How do I handle a difficult client escalation?';
    const solution = intelligentAdvisor.solve(query);

    assert.ok(solution.spokenResponse.length > 20, 'Has spoken response');
    assert.ok(solution.title.length > 5, 'Has solution title');
    assert.ok(solution.spokenResponse.includes('A.C.T.S.') || solution.summary.includes('escalation'), 'Contains structured framework');
  });

  // Test 4: AudioContext Pre-warming Execution Safety
  await t.test('Case 4: prewarmAudioContext executes safely in non-browser environment without throwing', () => {
    assert.doesNotThrow(() => {
      prewarmAudioContext();
    }, 'Pre-warm runs safely without throwing');
  });

  // Test 5: End-to-End Speech Prompt Intent Resolution Guarantee
  await t.test('Case 5: Family Email Intent from Real Speech generates complete emailData and spokenResponse', async () => {
    const result = await cortexEngine.reasonAndAct('Send an email to Celine saying I love her very much');
    
    assert.equal(result.actionCard.intent, 'email_draft', 'Resolved email draft');
    assert.equal(result.actionCard.emailData?.toEmail, 'celine.loeuille@gmail.com', 'Routed to celine.loeuille@gmail.com');
    assert.ok(result.spokenResponse.length > 10, 'Has spoken audio response text');
    assert.ok(result.actionCard.description.length > 20, 'Has structured description');
  });

});
