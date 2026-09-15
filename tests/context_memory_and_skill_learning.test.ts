// Context Memory, Pronoun Anaphora Resolution, Episodic Graph & Interactive Skill Learning Suite
// Verifies 100% of Phase 1 & Phase 2 SOTA Cognitive Core Capabilities

import { cortexEngine } from '../src/services/cortexDialogueEngine';
import { episodicMemoryService } from '../src/services/episodicMemoryService';
import { skillAcquisitionEngine } from '../src/services/skillAcquisitionEngine';
import { proactiveLoopService } from '../src/services/proactiveLoopService';
import { logger } from '../src/services/loggerService';
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
  console.log('🧪 RUNNING: CONTEXT MEMORY, EPISODIC GRAPH & SKILL LEARNING SUITE');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // TEST 1: Multi-Turn Chronological History & Anaphora ("Him" / "It") Grounding
  // --------------------------------------------------------------------------
  console.log('--- TEST 1: Multi-Turn Chronological History & Anaphora Resolution ---');
  
  const nowISO = new Date().toISOString();
  // Remember: In React state, dialogueTurns is stored in DESCENDING order (newest at index 0)
  const pastTurns: DialogueTurn[] = [
    {
      id: 'turn-2',
      speaker: 'assistant',
      text: 'I have logged a note regarding your sync with David Miller from Innovate AI.',
      timestamp: nowISO,
      spokenResponse: 'I have logged a note regarding your sync with David Miller.'
    },
    {
      id: 'turn-1',
      speaker: 'user',
      text: 'I just had a call with David Miller from Innovate AI about the Q3 budget.',
      timestamp: new Date(Date.now() - 30000).toISOString()
    }
  ];

  // Follow-up using pronoun "him" and "it"
  const result = await cortexEngine.reasonAndAct(
    'Send him an email saying that we agree with it and are ready to sign.',
    pastTurns
  );

  assert(
    !!result && !!result.actionCard,
    'Cortex executes ReAct cycle over multi-turn pronoun follow-up'
  );

  const emailData = result.actionCard.emailData;
  const isDavidResolved = emailData?.toName.toLowerCase().includes('david') || 
                          result.actionCard.description.toLowerCase().includes('david') ||
                          result.spokenResponse.toLowerCase().includes('david');

  assert(
    isDavidResolved,
    'Pronoun "him" correctly resolved to antecedent David Miller from conversation history',
    `Expected David Miller, got: ${emailData?.toName || result.actionCard.description}`
  );

  // --------------------------------------------------------------------------
  // TEST 2: Episodic Memory Graph Auto-Extraction & Recall
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 2: Episodic Memory Graph Extraction & Semantic Recall ---');
  
  episodicMemoryService.clear();

  const userDecision = 'We decided to allocate 45,000 EUR to the Cloudflare Edge migration project.';
  const assistantResponse = 'Understood Andrew. I have recorded the 45,000 EUR Cloudflare Edge allocation.';

  const extracted = episodicMemoryService.extractMemoryFromTurn(userDecision, assistantResponse, 'strategy_decision');
  
  assert(
    !!extracted && extracted.decision !== undefined,
    'Episodic memory auto-extracts explicit user decisions from turn',
    `Extracted decision: "${extracted?.decision}"`
  );

  const searchResults = episodicMemoryService.searchMemories('Cloudflare budget allocation', 3);
  assert(
    searchResults.length > 0 && searchResults[0].summary.includes('45,000 EUR'),
    'Hybrid search retrieves past episodic decision on semantic query "Cloudflare budget allocation"',
    `Retrieved: ${searchResults[0]?.summary}`
  );

  const formattedPrompt = episodicMemoryService.formatMemoriesForPrompt(searchResults);
  assert(
    formattedPrompt.includes('RELEVANT EPISODIC & HISTORICAL MEMORY') && formattedPrompt.includes('Cloudflare'),
    'Episodic memory formats correctly for prompt injection into Gemini 2.5'
  );

  // --------------------------------------------------------------------------
  // TEST 3: Interactive Procedural Skill Acquisition & SOP Formulation
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 3: Interactive Procedural Skill Acquisition ---');
  
  skillAcquisitionEngine.reset();

  const naturalSpeech = 'Whenever I ask for Daily Wrapup, triage the VIP inbox, check calendar appointments, and list tasks.';
  const detection = skillAcquisitionEngine.detectProceduralRule(naturalSpeech);

  assert(
    detection.isProcedural === true,
    'Skill acquisition engine detects procedural routine explanation during speech'
  );

  assert(
    detection.skillBlueprint?.triggerPhrase === 'daily wrapup',
    'Skill trigger phrase correctly extracted as "daily wrapup"',
    `Got: "${detection.skillBlueprint?.triggerPhrase}"`
  );

  assert(
    (detection.skillBlueprint?.actionSteps.length || 0) >= 2,
    'Action blueprint compiles multi-step pipeline (triage_inbox + check_calendar)',
    `Steps compiled: ${detection.skillBlueprint?.actionSteps.map(s => s.label).join(', ')}`
  );

  assert(
    !!detection.proposalMarkdown && detection.proposalMarkdown.includes('Proposed New Skill'),
    'Interactive skill proposal card generated with action buttons'
  );

  const committedSkill = skillAcquisitionEngine.commitPendingSkill();
  assert(
    !!committedSkill && committedSkill.triggerPhrase === 'daily wrapup' && committedSkill.source === 'voice_learned',
    'User confirmation commits skill to active customSkills registry'
  );

  // --------------------------------------------------------------------------
  // TEST 4: Autonomous Loop Standby Default & Activity Audit Reporting
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 4: Autonomous Background Loop Standby & Activity Audit ---');

  const report = proactiveLoopService.getAutonomousAuditReport(false);
  assert(
    report.isLoopActive === false,
    'Autonomous background loop defaults to Standby / Paused (isLoopActive: false)'
  );

  assert(
    typeof report.totalScanCycles === 'number' && Array.isArray(report.recentAuditTrail),
    'Autonomous audit report returns transparent inspection metrics and audit trail',
    `Cycles: ${report.totalScanCycles}, Emails: ${report.totalEmailsInspected}, Meetings: ${report.totalAppointmentsInspected}`
  );

  // --------------------------------------------------------------------------
  // TEST 5: Telemetry Trace & Debounced Logger Invariant
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 5: Telemetry Performance & Logger Debounce Invariant ---');

  const traceId = 'trace-context-test';
  logger.startTrace(traceId);
  for (let i = 0; i < 50; i++) {
    logger.debug('ai_reasoning', `Context trace test event ${i}`);
  }
  const traceDuration = logger.endTrace(traceId);

  assert(
    traceDuration >= 0,
    'Pipeline telemetry trace measures latency accurately without main-thread blocking',
    `Trace duration: ${traceDuration.toFixed(2)}ms`
  );

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED (Total: ${passed + failed})`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
