import { onRequest } from '../functions/api/[[route]]';
import { parseIntentFromSpeech } from '../server/intentParser';
import { db } from '../server/db';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: any) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`, details || '');
    failed++;
  }
}

export async function runVoiceAssistantExecutionAudit() {
  console.log('======================================================================');
  console.log('🎙️ RUNNING VOICE ASSISTANT EXECUTION & "HEY NOVA" CAPABILITY AUDIT');
  console.log('======================================================================');

  // -------------------------------------------------------------------------
  // TEST 1: Server-side Intent Parser: "send an email to my wife to say i loved her"
  // -------------------------------------------------------------------------
  console.log('\n--- [Test 1] Core Speech Parser: Wife Love Email ---');
  const speech1 = "send an email to my wife to say i loved her";
  const action1 = parseIntentFromSpeech(speech1);

  assert(action1.intent === 'email_draft', 'T1.1: Intent resolved to email_draft');
  assert(action1.emailData?.toName.includes('Emily') || action1.emailData?.toName.includes('Wife'), `T1.2: Recipient resolved to Emily/Wife (found ${action1.emailData?.toName})`);
  assert(action1.emailData?.toEmail === 'emily.baxter@personal.com', `T1.3: Recipient email is emily.baxter@personal.com (found ${action1.emailData?.toEmail})`);
  assert(action1.emailData?.subject.includes('❤️') || action1.emailData?.subject.includes('Love') || action1.emailData?.subject.includes('Thinking'), `T1.4: Subject is loving & personal (found "${action1.emailData?.subject}")`);
  assert(action1.emailData?.body.includes('love') || action1.emailData?.body.includes('loved'), 'T1.5: Body contains expression of love');
  assert(Boolean(action1.spokenResponse), `T1.6: Spoken response generated: "${action1.spokenResponse}"`);

  // -------------------------------------------------------------------------
  // TEST 2: Self-Learning Executive Memory ("Remember that...", "Recall...")
  // -------------------------------------------------------------------------
  console.log('\n--- [Test 2] Adaptive Executive Memory & Self-Learning ---');
  const memLearn = parseIntentFromSpeech("remember that Emily loves peonies and dark chocolate");
  assert(memLearn.intent === 'memory_learn', 'T2.1: Intent resolved to memory_learn');
  assert(memLearn.spokenResponse.includes('peonies') || memLearn.spokenResponse.includes('memory'), 'T2.2: Memory committed with spoken confirmation');

  const memRecall = parseIntentFromSpeech("what did i ask you to remember about Emily?");
  assert(memRecall.intent === 'memory_recall', 'T2.3: Intent resolved to memory_recall');
  assert(memRecall.spokenResponse.toLowerCase().includes('emily') || memRecall.spokenResponse.includes('peonies') || memRecall.spokenResponse.includes('chocolate'), 'T2.4: Recalled memory contains learned facts');

  // -------------------------------------------------------------------------
  // TEST 3: Timers, Alarms, Reminders & Calculations ("Hey Google" Suite)
  // -------------------------------------------------------------------------
  console.log('\n--- [Test 3] Timers, Reminders, Math & Weather ---');
  const timerAction = parseIntentFromSpeech("set a timer for 15 minutes");
  assert(timerAction.intent === 'timer_alarm', 'T3.1: Timer intent recognized');
  assert(timerAction.spokenResponse.includes('15 minutes'), 'T3.2: Timer duration formatted in spoken feedback');

  const reminderAction = parseIntentFromSpeech("remind me to review the quarterly financial ledger at 5 PM");
  assert(reminderAction.intent === 'reminder_create', 'T3.3: Reminder intent recognized');
  assert(reminderAction.title.includes('Reminder'), 'T3.4: Reminder card title generated');

  const calcAction = parseIntentFromSpeech("what is 15% of $850");
  assert(calcAction.intent === 'calc_query', 'T3.5: Calculation intent recognized');
  assert(calcAction.spokenResponse.includes('127.5'), 'T3.6: Math percentage accurately evaluated (127.5)');

  const weatherAction = parseIntentFromSpeech("what's the weather in Tokyo");
  assert(weatherAction.intent === 'weather_query', 'T3.7: Weather query intent recognized');
  assert(weatherAction.spokenResponse.toLowerCase().includes('tokyo') || weatherAction.spokenResponse.includes('sunny'), 'T3.8: Weather report generated');

  const noteAction = parseIntentFromSpeech("take a note: Verify Cloudflare Pages Edge Functions latency");
  assert(noteAction.intent === 'note_save', 'T3.9: Note save intent recognized');
  assert(noteAction.spokenResponse.includes('saved your note'), 'T3.10: Note saved confirmation spoken');

  // -------------------------------------------------------------------------
  // TEST 4: Cloudflare Pages Functions Edge API Gateway (/api/voice/process-text)
  // -------------------------------------------------------------------------
  console.log('\n--- [Test 4] Cloudflare Edge Functions (/api/voice/process-text) ---');
  const mockReq = new Request('https://executive-virtual-assistant.pages.dev/api/voice/process-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: "send an email to my wife saying i love you" })
  });

  const edgeRes = await onRequest({ request: mockReq, env: {} });
  assert(edgeRes.status === 200, `T4.1: Edge API returned HTTP 200 (got ${edgeRes.status})`);
  
  const edgeData: any = await edgeRes.json();
  assert(edgeData.actionCard?.intent === 'email_draft', 'T4.2: Edge API parsed email_draft intent');
  assert(edgeData.actionCard?.emailData?.toName.includes('Emily'), 'T4.3: Edge API resolved Emily Baxter');
  assert(edgeData.actionCard?.emailData?.toEmail === 'emily.baxter@personal.com', 'T4.4: Edge API resolved emily.baxter@personal.com');
  assert(edgeData.actionCard?.emailData?.status === 'sent', 'T4.5: Email status marked sent upon voice command');
  assert(edgeData.actionCard?.spokenResponse.includes('Emily') && edgeData.actionCard?.spokenResponse.includes('love'), `T4.6: Edge spoken response: "${edgeData.actionCard?.spokenResponse}"`);

  // -------------------------------------------------------------------------
  // TEST 5: Edge Health & Resource Endpoints
  // -------------------------------------------------------------------------
  console.log('\n--- [Test 5] Edge Health & Resources ---');
  const healthReq = new Request('https://executive-virtual-assistant.pages.dev/api/health', { method: 'GET' });
  const healthRes = await onRequest({ request: healthReq, env: {} });
  const healthData: any = await healthRes.json();
  assert(healthData.status === 'online', 'T5.1: Edge health check is online');

  const contactsReq = new Request('https://executive-virtual-assistant.pages.dev/api/comms/contacts', { method: 'GET' });
  const contactsRes = await onRequest({ request: contactsReq, env: {} });
  const contactsData: any = await contactsRes.json();
  assert(contactsData.some((c: any) => c.name === 'Emily Baxter'), 'T5.2: Edge contacts contains Emily Baxter');

  console.log('\n======================================================================');
  console.log(`📊 VOICE & GOOGLE ASSISTANT AUDIT COMPLETE: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================================\n');

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runVoiceAssistantExecutionAudit().catch(err => {
  console.error('Fatal Voice Audit Error:', err);
  process.exit(1);
});
