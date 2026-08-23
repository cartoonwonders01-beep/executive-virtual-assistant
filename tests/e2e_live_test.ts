// Live End-to-End HTTP Integration Test Runner
// Tests every live endpoint and functional component of the running Executive Assistant

const BASE_URL = 'http://localhost:3001';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

async function runLiveE2ETests() {
  console.log('\n🚀 Executing Live End-to-End System Audit on Sandbox VM...\n');

  // 1. Health Probe
  console.log('--- 1. Health & Server Status ---');
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  const health = await healthRes.json();
  assert(healthRes.status === 200, 'Health endpoint responds with HTTP 200');
  assert(health.status === 'online', 'System status is online');
  assert(health.system.includes('Executive AI Personal Assistant'), 'System title is accurate');

  // 2. KPI Metrics & Financial Engine
  console.log('\n--- 2. KPI Metrics & Financial Won Value Engine ---');
  const kpiRes = await fetch(`${BASE_URL}/api/kpi`);
  const kpi = await kpiRes.json();
  assert(kpiRes.status === 200, 'KPI endpoint responds with HTTP 200');
  assert(kpi.totalTasks > 0, `Total tasks counted: ${kpi.totalTasks}`);
  assert(kpi.totalHoursWonBack > 0, `Total hours won back: ${kpi.totalHoursWonBack}h`);
  assert(kpi.roiMultiplier > 0, `ROI multiplier: ${kpi.roiMultiplier}x`);
  assert(kpi.aiAutomatedCount + kpi.hybridCount + kpi.humanOnlyCount === kpi.totalTasks, 'Feasibility counts sum to 100%');

  // 3. Monday.com Work Hub Tasks
  console.log('\n--- 3. Monday.com Work Hub Tasks & Blueprints ---');
  const tasksRes = await fetch(`${BASE_URL}/api/tasks`);
  const tasks = await tasksRes.json();
  assert(tasksRes.status === 200, 'Tasks endpoint responds with HTTP 200');
  assert(Array.isArray(tasks) && tasks.length > 0, `Tasks loaded: ${tasks.length} tasks`);
  
  const techTask = tasks.find((t: any) => t.category === 'Tech/Dev');
  assert(techTask !== undefined, 'Found Tech/Dev tasks');
  assert(techTask.automationBlueprint !== undefined, 'Task contains automation blueprint');
  assert(techTask.automationBlueprint.executableCodeSample.length > 20, 'Blueprint contains executable code');

  // 4. Voice Ingestion & Intent Parsing
  console.log('\n--- 4. Voice Speech Ingestion & Multi-Intent Parsing ---');
  // 4.1 Meeting Booking
  const meetingRes = await fetch(`${BASE_URL}/api/voice/process-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'Book strategy session with David Miller next Tuesday at 2 PM' })
  });
  const meetingResult = await meetingRes.json();
  assert(meetingRes.status === 200, 'Voice transcript submission returns HTTP 200');
  assert(meetingResult.actionCard.intent === 'calendar_booking', 'Classifies calendar booking');
  assert(meetingResult.actionCard.calendarData.googleCalendarUrl.includes('calendar.google.com'), 'Generates Google Calendar URL');

  // 4.2 Compound Multi-Intent (Meeting + Email)
  const compoundRes = await fetch(`${BASE_URL}/api/voice/process-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'Schedule sync with David next Wednesday at 3 PM and draft an email to Sarah regarding Q3 growth sprint' })
  });
  const compoundResult = await compoundRes.json();
  assert(compoundResult.actionCard.calendarData !== undefined, 'Compound intent generates calendar appointment');
  assert(compoundResult.actionCard.emailData !== undefined, 'Compound intent generates email draft');

  // 5. Calendar RFC 5545 .ics Exporter
  console.log('\n--- 5. Calendar Engine & RFC 5545 iCalendar Exporter ---');
  const aptsRes = await fetch(`${BASE_URL}/api/appointments`);
  const apts = await aptsRes.json();
  assert(apts.length > 0, `Appointments listed: ${apts.length} appointments`);

  // Single .ics download
  const sampleAptId = apts[0].id;
  const singleIcsRes = await fetch(`${BASE_URL}/api/appointments/${sampleAptId}/ics`);
  const singleIcsText = await singleIcsRes.text();
  assert(singleIcsRes.status === 200, 'Single .ics endpoint returns HTTP 200');
  assert(singleIcsText.includes('BEGIN:VCALENDAR') && singleIcsText.includes('END:VCALENDAR'), 'Single .ics has valid VCALENDAR envelope');
  assert(singleIcsText.includes('BEGIN:VEVENT'), 'Single .ics includes VEVENT block');

  // Full Feed .ics download
  const feedIcsRes = await fetch(`${BASE_URL}/api/appointments/feed.ics`);
  const feedIcsText = await feedIcsRes.text();
  assert(feedIcsRes.status === 200, 'Calendar feed .ics returns HTTP 200');
  assert(feedIcsText.includes('PRODID:-//Executive AI Personal Assistant//EN'), 'Feed .ics has valid PRODID header');

  // 6. CSV Export
  console.log('\n--- 6. Monday.com Work Hub CSV Export ---');
  const csvRes = await fetch(`${BASE_URL}/api/tasks/export/csv`);
  const csvText = await csvRes.text();
  assert(csvRes.status === 200, 'CSV export endpoint returns HTTP 200');
  assert(csvText.includes('ID,Title,Category,User Priority,AI Priority,Feasibility'), 'CSV has correct table headers');
  assert(csvText.split('\n').length > 5, `CSV contains multiple rows (got ${csvText.split('\n').length} lines)`);

  // 7. Living Wiki Knowledge Hub
  console.log('\n--- 7. Living Wiki Knowledge Hub ---');
  const wikiRes = await fetch(`${BASE_URL}/api/wiki`);
  const wikiArticles = await wikiRes.json();
  assert(wikiRes.status === 200, 'Wiki endpoint returns HTTP 200');
  assert(wikiArticles.length >= 6, `Wiki articles count: ${wikiArticles.length}`);

  // 8. Mobile Ingest Webhook (iOS Shortcuts / Apple Watch)
  console.log('\n--- 8. Mobile Webhook Ingestion (POST /api/voice/ingest) ---');
  const ingestRes = await fetch(`${BASE_URL}/api/voice/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript: 'Automate weekly competitor price scraping and send telegram alert' })
  });
  const ingestResult = await ingestRes.json();
  assert(ingestRes.status === 200, 'Mobile ingest webhook returns HTTP 200');
  assert(ingestResult.status === 'ingested', 'Ingest status confirmed');
  assert(ingestResult.createdTasksCount > 0, 'Tasks created from mobile webhook');

  // Summary
  console.log('\n======================================================');
  console.log(`📊 LIVE SYSTEM AUDIT RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runLiveE2ETests().catch(err => {
  console.error('Fatal live test error:', err);
  process.exit(1);
});
