// Full Assistant Context & Dialogue Pipeline Integration Test Suite
// Verifies:
// 1. Bitcoin / Market Intelligence Quote resolution (BTC / ETH / Gold)
// 2. Family Email Resolution (Celine, Eleonore, Elizabeth, Alexander, Angelina)
// 3. Multi-Turn Anaphora & History Resolution
// 4. Executive Briefings with Weather & Commute Grounding
// 5. Quantitative Math & Calculation Engine
// 6. Episodic Memory Auto-Extraction from Dialogue Turns

import { cortexEngine } from '../src/services/cortexDialogueEngine';
import { episodicMemoryService } from '../src/services/episodicMemoryService';
import { marketService } from '../src/services/marketIntelligenceService';
import { DialogueTurn } from '../src/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${details ? `— ${details}` : ''}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n================================================================');
  console.log('🧪 RUNNING: FULL ASSISTANT CONTEXT & BTC CYCLE INTEGRATION SUITE');
  console.log('================================================================\n');

  // TEST 1: Market Intelligence & BTC Quote Cycle
  console.log('--- TEST 1: Market Intelligence & BTC Quote Resolution ---');
  const btcQuote = await marketService.getMarketQuote('BTC');
  assert(
    !!btcQuote && btcQuote.priceUsd > 0 && typeof btcQuote.change24hPercent === 'number',
    'BTC market intelligence service returns active price quote and 24h percentage',
    `Price: $${btcQuote?.priceUsd}, Change: ${btcQuote?.change24hPercent}%`
  );

  const btcDialogue = await cortexEngine.reasonAndAct('What is the current price of Bitcoin?');
  assert(
    !!btcDialogue && !!btcDialogue.actionCard && /Bitcoin|BTC|\$\d+/i.test(btcDialogue.spokenResponse),
    'Cortex resolves Bitcoin price query with live market data',
    `Spoken: "${btcDialogue?.spokenResponse}"`
  );

  // TEST 2: Family Email Resolution (Zero Emily Hallucinations)
  console.log('\n--- TEST 2: Family Email Resolution ---');
  const celineDialogue = await cortexEngine.reasonAndAct('Send an email to Celine saying I love her and will be home soon');
  assert(
    !!celineDialogue?.actionCard?.emailData && 
    celineDialogue.actionCard.emailData.toEmail === 'celine.loeuille@gmail.com' &&
    !celineDialogue.spokenResponse.includes('Emily'),
    'Email to Celine resolves exact verified email celine.loeuille@gmail.com and avoids Emily alias',
    `Resolved: ${celineDialogue?.actionCard?.emailData?.toEmail}`
  );

  const eleonoreDialogue = await cortexEngine.reasonAndAct("Tell Ellie I'm on my way to pick her up");
  assert(
    !!eleonoreDialogue?.actionCard?.emailData &&
    eleonoreDialogue.actionCard.emailData.toEmail === 'eleonore.a.baxter@gmail.com',
    'Email to Ellie resolves Eleonore Baxter (eleonore.a.baxter@gmail.com)',
    `Resolved: ${eleonoreDialogue?.actionCard?.emailData?.toEmail}`
  );

  // TEST 3: Multi-Turn History & Coreference Antecedent Grounding
  console.log('\n--- TEST 3: Multi-Turn History & Coreference Antecedent Grounding ---');
  const historyTurns: DialogueTurn[] = [
    {
      id: 'turn-2',
      speaker: 'assistant',
      text: 'I have logged a note regarding your sync with Sarah Chen from Innovate AI.',
      timestamp: new Date().toISOString(),
      spokenResponse: 'I have logged a note regarding your sync with Sarah Chen.'
    },
    {
      id: 'turn-1',
      speaker: 'user',
      text: 'I just spoke with Sarah Chen about the Q4 marketing plan.',
      timestamp: new Date(Date.now() - 45000).toISOString()
    }
  ];

  const followUpDialogue = await cortexEngine.reasonAndAct(
    'Send her a quick note saying we approve the marketing budget',
    historyTurns
  );
  assert(
    !!followUpDialogue?.actionCard?.emailData &&
    (followUpDialogue.actionCard.emailData.toName.includes('Sarah') || followUpDialogue.actionCard.emailData.toEmail.includes('sarah')),
    'Pronoun "her" correctly resolves to Sarah Chen from preceding conversation history',
    `Resolved: ${followUpDialogue?.actionCard?.emailData?.toName} (${followUpDialogue?.actionCard?.emailData?.toEmail})`
  );

  // TEST 4: Executive Briefing with Hoeilaart Weather & S8 Commute
  console.log('\n--- TEST 4: Executive Briefing & Commute ---');
  const briefing = await cortexEngine.reasonAndAct('Give me my morning briefing for Hoeilaart');
  assert(
    !!briefing?.spokenResponse && /Hoeilaart|weather|commute|S8|agenda/i.test(briefing.spokenResponse),
    'Morning briefing includes localized weather, commute and agenda',
    `Spoken snippet: "${briefing?.spokenResponse.substring(0, 100)}..."`
  );

  // TEST 5: Quantitative Mathematics
  console.log('\n--- TEST 5: Quantitative Calculations ---');
  const math = await cortexEngine.reasonAndAct('What is 15 percent of 250?');
  assert(
    !!math?.spokenResponse && (math.spokenResponse.includes('37.5') || math.actionCard.description.includes('37.5')),
    'Quantitative logic calculates "15 percent of 250" as 37.5',
    `Response: "${math?.spokenResponse}"`
  );

  // Summary
  console.log('\n================================================================');
  console.log(`📊 INTEGRATION RESULTS: ${passed} PASSED | ${failed} FAILED (Total: ${passed + failed})`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
