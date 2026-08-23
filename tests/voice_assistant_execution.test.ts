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
  console.log('🎙️ RUNNING VOICE ASSISTANT EXECUTION & WIFE EMAIL PROOF AUDIT');
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
  // TEST 2: Cloudflare Pages Functions Edge API Gateway (/api/voice/process-text)
  // -------------------------------------------------------------------------
  console.log('\n--- [Test 2] Cloudflare Edge Functions (/api/voice/process-text) ---');
  const mockReq = new Request('https://executive-virtual-assistant.pages.dev/api/voice/process-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: "send an email to my wife saying i love you" })
  });

  const edgeRes = await onRequest({ request: mockReq, env: {} });
  assert(edgeRes.status === 200, `T2.1: Edge API returned HTTP 200 (got ${edgeRes.status})`);
  
  const edgeData: any = await edgeRes.json();
  assert(edgeData.actionCard?.intent === 'email_draft', 'T2.2: Edge API parsed email_draft intent');
  assert(edgeData.actionCard?.emailData?.toName.includes('Emily'), 'T2.3: Edge API resolved Emily Baxter');
  assert(edgeData.actionCard?.emailData?.toEmail === 'emily.baxter@personal.com', 'T2.4: Edge API resolved emily.baxter@personal.com');
  assert(edgeData.actionCard?.emailData?.status === 'sent', 'T2.5: Email status marked sent upon voice command');
  assert(edgeData.actionCard?.spokenResponse.includes('Emily') && edgeData.actionCard?.spokenResponse.includes('love'), `T2.6: Edge spoken response: "${edgeData.actionCard?.spokenResponse}"`);

  // -------------------------------------------------------------------------
  // TEST 3: Edge Health & Resource Endpoints
  // -------------------------------------------------------------------------
  console.log('\n--- [Test 3] Edge Health & Resources ---');
  const healthReq = new Request('https://executive-virtual-assistant.pages.dev/api/health', { method: 'GET' });
  const healthRes = await onRequest({ request: healthReq, env: {} });
  const healthData: any = await healthRes.json();
  assert(healthData.status === 'online', 'T3.1: Edge health check is online');

  const contactsReq = new Request('https://executive-virtual-assistant.pages.dev/api/comms/contacts', { method: 'GET' });
  const contactsRes = await onRequest({ request: contactsReq, env: {} });
  const contactsData: any = await contactsRes.json();
  assert(contactsData.some((c: any) => c.name === 'Emily Baxter'), 'T3.2: Edge contacts contains Emily Baxter');

  console.log('\n======================================================================');
  console.log(`📊 VOICE AUDIT COMPLETE: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================================\n');

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runVoiceAssistantExecutionAudit().catch(err => {
  console.error('Fatal Voice Audit Error:', err);
  process.exit(1);
});
