import test from 'node:test';
import assert from 'node:assert/strict';

test('Training Feedback Ground-Truth Regression Suite', async (t) => {
  const { cortexEngine } = await import('../src/services/cortexDialogueEngine');
  const { trainingFeedbackService } = await import('../src/services/trainingFeedbackService');

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
  const cases = trainingFeedbackService.getAllCases();

  assert.ok(cases.length > 0, 'Training cases loaded from repository');

  for (const tc of cases) {
    await t.test(`Replay Training Case: "${tc.originalTranscript}" -> [${tc.expectedIntent}]`, async () => {
      const query = tc.correctedTranscript || tc.originalTranscript;
      const res = await cortexEngine.reasonAndAct(query, [], undefined, GEMINI_API_KEY);

      assert.ok(res && res.actionCard, 'Cortex produced an action card');
      
      if (tc.expectedIntent) {
        assert.equal(
          res.actionCard.intent,
          tc.expectedIntent,
          `Intent matches expected ground truth: ${tc.expectedIntent} vs ${res.actionCard.intent}`
        );
      }

      if (tc.expectedIntent === 'email_draft' && tc.tags.includes('family')) {
        assert.ok(
          res.actionCard.emailData?.toEmail?.includes('baxter') || res.actionCard.emailData?.toEmail?.includes('celine'),
          'Family email mapped to correct Baxter roster email'
        );
      }
    });
  }
});
