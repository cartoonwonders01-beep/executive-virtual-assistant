import test from 'node:test';
import assert from 'node:assert/strict';
import { cortexEngine } from '../src/services/cortexDialogueEngine';

test('Audio & Speech End-to-End Replay & Cognitive Verification Suite', async (t) => {
  const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

  // 1. Verify Groq Whisper Cloud Direct API Connectivity
  await t.test('Step 1: Groq Whisper Cloud API Connectivity & Model Availability', async () => {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'User-Agent': 'VirtualAssistant/1.0'
      }
    });
    assert.equal(res.status, 200, 'Groq API returned HTTP 200');
    const data = await res.json() as any;
    const models = (data.data || []).map((m: any) => m.id);
    assert.ok(models.includes('whisper-large-v3') || models.includes('whisper-large-v3-turbo'), 'Groq Whisper models available');
  });

  // 2. Real-World Audio Utterance 1: Greeting & Strategy
  await t.test('Step 2: Real-World Utterance ("Good evening how are you")', async () => {
    const result = await cortexEngine.reasonAndAct('Good evening how are you', [], undefined, GEMINI_API_KEY);
    assert.ok(result.spokenResponse.length > 10, 'Generated natural spoken response');
    assert.ok(!result.spokenResponse.includes('neural engines are primed'), 'Did not return canned robotic boilerplate');
  });

  // 3. Real-World Audio Utterance 2: Family Travel & Senegal Arrival
  await t.test('Step 3: Real-World Utterance ("My son is coming back from Senegal")', async () => {
    const result = await cortexEngine.reasonAndAct('My son is coming back from Senegal', [], undefined, GEMINI_API_KEY);
    assert.ok(result.spokenResponse.toLowerCase().includes('alexander') || result.spokenResponse.toLowerCase().includes('senegal') || result.spokenResponse.toLowerCase().includes('welcome') || result.spokenResponse.toLowerCase().includes('arrival'), 'Recognized family travel context');
    assert.ok(!result.spokenResponse.includes('intriguing topic'), 'Did not return canned template');
  });

  // 4. Real-World Audio Utterance 3: Email to Wife Celine
  await t.test('Step 4: Real-World Utterance ("Send an email to Celine saying I love her")', async () => {
    const result = await cortexEngine.reasonAndAct('Send an email to Celine saying I love her', [], undefined, GEMINI_API_KEY);
    assert.equal(result.actionCard.intent, 'email_draft', 'Resolved email draft intent');
    assert.equal(result.actionCard.emailData?.toEmail, 'celine.loeuille@gmail.com', 'Routed to celine.loeuille@gmail.com');
    assert.ok(result.actionCard.emailData?.body.toLowerCase().includes('love'), 'Email body contains message');
  });

  // 5. Real-World Audio Utterance 4: House to Work Commute
  await t.test('Step 5: Real-World Utterance ("How do I get from my house to work?")', async () => {
    const result = await cortexEngine.reasonAndAct('How do I get from my house to work?', [], undefined, GEMINI_API_KEY);
    assert.ok(result.spokenResponse.includes('S8') || result.spokenResponse.includes('train') || result.spokenResponse.includes('E411') || result.spokenResponse.includes('Hoeilaart'), 'Provided accurate commute directions from Hoeilaart');
  });

  // 6. Real-World Audio Utterance 5: Natural Language Math
  await t.test('Step 6: Real-World Utterance ("What is 15 percent of 250?")', async () => {
    const result = await cortexEngine.reasonAndAct('What is 15 percent of 250?', [], undefined, GEMINI_API_KEY);
    assert.ok(result.spokenResponse.includes('37.5'), 'Accurately computed 15% of 250 = 37.5');
  });

  // 7. Real-World Audio Utterance 6: Proactive Morning Briefing
  await t.test('Step 7: Real-World Utterance ("Eve, give me my morning briefing")', async () => {
    const result = await cortexEngine.reasonAndAct('Eve, give me my morning briefing', [], undefined, GEMINI_API_KEY);
    assert.ok(result.spokenResponse.includes('Good morning'), 'Generated morning briefing');
    assert.ok(result.actionCard.description.includes('Weather') || result.actionCard.description.includes('Agenda'), 'Structured briefing description present');
  });

  // 8. Real-World Audio Utterance 7: Live Web Grounding
  await t.test('Step 8: Real-World Utterance ("Search the web for artificial intelligence in Europe 2026")', async () => {
    const result = await cortexEngine.reasonAndAct('Search the web for artificial intelligence in Europe 2026', [], undefined, GEMINI_API_KEY);
    assert.ok(result.actionCard.intent === 'web_search' || result.actionCard.intent === 'knowledge_qa', 'Resolved web research');
    assert.ok(result.actionCard.description.length > 50, 'Provided detailed web intelligence');
  });
});
