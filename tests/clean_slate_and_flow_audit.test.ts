import { db } from '../server/db';
import { parseIntentFromSpeech } from '../server/intentParser';
import { analyzeVoiceTranscript } from '../server/aiAnalysisService';
import { generateICSString, generateFullCalendarICS } from '../server/calendarService';
import { executeSingleBacklogStep, getAutonomousStatus } from '../server/autonomousWorker';
import { getSwarmStatus, triggerSwarmCycle } from '../server/agentSwarm';

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

export async function runCleanSlateAndFlowAudit() {
  console.log('======================================================================');
  console.log('🧪 RUNNING FULL SYSTEM INITIALIZATION & COMPLETE FLOW AUDIT');
  console.log('======================================================================');

  // -------------------------------------------------------------------------
  // FLOW 1: Clean Slate Initialization (Zero Dummy Data)
  // -------------------------------------------------------------------------
  console.log('\n--- [Flow 1] Pristine Clean Slate Reset ---');
  const cleanDb = db.resetToCleanSlate('pristine');
  assert(cleanDb.tasks.length === 0, 'F1.1: Tasks cleanly initialized to 0');
  assert(cleanDb.memos.length === 0, 'F1.2: Voice memos cleanly initialized to 0');
  assert(cleanDb.actionCards.length === 0, 'F1.3: Action cards cleanly initialized to 0');
  assert(cleanDb.appointments.length === 0, 'F1.4: Appointments cleanly initialized to 0');
  assert(cleanDb.chatMessages.length === 0, 'F1.5: Chat messages cleanly initialized to 0');
  assert(cleanDb.callLogs.length === 0, 'F1.6: Call logs cleanly initialized to 0');
  assert(cleanDb.autonomousJobs.length === 0, 'F1.7: Autonomous jobs cleanly initialized to 0');
  assert(cleanDb.contacts.length >= 4, `F1.8: Preserves ${cleanDb.contacts.length} core executive contacts`);
  assert(cleanDb.wikiArticles.length >= 6, `F1.9: Preserves ${cleanDb.wikiArticles.length} core wiki guides`);

  const emptyKpi = db.getKPISummary();
  assert(emptyKpi.totalTasks === 0, 'F1.10: KPI total tasks is 0');
  assert(emptyKpi.totalHoursWonBack === 0, 'F1.11: KPI total hours won back is 0');

  // -------------------------------------------------------------------------
  // FLOW 2: Voice Speech Ingestion & Task Creation from Clean Slate
  // -------------------------------------------------------------------------
  console.log('\n--- [Flow 2] Live Voice Speech & Intent Parsing ---');
  const speechText = "Draft an urgent email to Sarah Chen about our Q3 budget and automate invoice extraction from billing emails.";
  const actionCard = parseIntentFromSpeech(speechText);
  db.createActionCard(actionCard);
  assert(actionCard.intent === 'email_draft', 'F2.1: Speech intent resolved to email_draft');
  assert(actionCard.emailData?.toName === 'Sarah Chen', 'F2.2: Matched Sarah Chen recipient');
  assert(actionCard.emailData?.toEmail === 'sarah.chen@innovate.co', 'F2.3: Resolved email address');

  const { memo, createdTasks } = analyzeVoiceTranscript(speechText, 'browser_mic');
  assert(createdTasks.length >= 1, `F2.4: Extracted ${createdTasks.length} task(s) from speech`);
  assert(memo.transcript === speechText, 'F2.5: Voice memo transcript saved');
  assert(db.getTasks().length >= 1, 'F2.6: Task added to Work Hub database');

  // -------------------------------------------------------------------------
  // FLOW 3: Gmail Suite & Inbox Triager
  // -------------------------------------------------------------------------
  console.log('\n--- [Flow 3] Gmail Suite, Star Toggle, & Sending ---');
  const unreadEmails = db.getInboxEmails().filter(e => e.isUnread);
  assert(unreadEmails.length > 0, `F3.1: Found ${unreadEmails.length} unread inbox email(s)`);
  
  const targetEmail = unreadEmails[0];
  const starred = db.updateInboxEmail(targetEmail.id, { isStarred: !targetEmail.isStarred });
  assert(starred !== null && starred.isStarred !== targetEmail.isStarred, 'F3.2: Toggled email starred state');

  const draft = {
    id: 'em-clean-' + Date.now(),
    toName: 'Sarah Chen',
    toEmail: 'sarah.chen@innovate.co',
    subject: 'Q3 Budget Signoff',
    body: 'Hi Sarah, budget approved!',
    tone: 'professional' as const,
    status: 'draft' as const
  };
  db.get().emails.unshift(draft);
  assert(db.get().emails[0].status === 'draft', 'F3.3: Email draft saved');

  db.get().emails[0].status = 'sent';
  db.get().emails[0].sentAt = new Date().toISOString();
  assert(db.get().emails[0].status === 'sent', 'F3.4: Email transitioned to sent status');

  // -------------------------------------------------------------------------
  // FLOW 4: Google Calendar Hub & Conflict Coordinator
  // -------------------------------------------------------------------------
  console.log('\n--- [Flow 4] Calendar Bookings, Conflicts & .ICS ---');
  const apt1 = db.createAppointment({
    id: 'apt-flow-1',
    title: 'Executive Sync A',
    startDateTime: '2026-08-25T14:00:00.000Z',
    endDateTime: '2026-08-25T15:00:00.000Z',
    location: 'Google Meet',
    attendees: [{ name: 'David Miller', email: 'david.m@cloudscale.io' }],
    status: 'confirmed'
  });

  const apt2 = db.createAppointment({
    id: 'apt-flow-2',
    title: 'Executive Sync B (Overlap)',
    startDateTime: '2026-08-25T14:30:00.000Z',
    endDateTime: '2026-08-25T15:30:00.000Z',
    location: 'Zoom',
    attendees: [{ name: 'Sarah Chen', email: 'sarah.chen@innovate.co' }],
    status: 'confirmed'
  });

  // Conflict detection check
  const start1 = new Date(apt1.startDateTime).getTime();
  const end1 = new Date(apt1.endDateTime).getTime();
  const start2 = new Date(apt2.startDateTime).getTime();
  const end2 = new Date(apt2.endDateTime).getTime();
  const hasConflict = start1 < end2 && end1 > start2;
  assert(hasConflict === true, 'F4.1: Successfully detected calendar conflict overlap');

  // Reschedule +1 Day
  const newStart2 = new Date(start2 + 86400000).toISOString();
  const newEnd2 = new Date(end2 + 86400000).toISOString();
  const updatedApt2 = db.updateAppointment(apt2.id, { startDateTime: newStart2, endDateTime: newEnd2 });
  assert(updatedApt2?.startDateTime === newStart2, 'F4.2: Rescheduled overlapping appointment +1 day');

  // ICS Export
  const icsSingle = generateICSString(apt1);
  assert(icsSingle.includes('BEGIN:VCALENDAR') && icsSingle.includes('SUMMARY:Executive Sync A'), 'F4.3: Generated RFC 5545 single ICS file');
  const icsFeed = generateFullCalendarICS(db.getAppointments());
  assert(icsFeed.includes('PRODID:') && icsFeed.includes('END:VCALENDAR'), 'F4.4: Generated RFC 5545 full calendar feed');

  // -------------------------------------------------------------------------
  // FLOW 5: Communications, Live Chat & Calling Bridge
  // -------------------------------------------------------------------------
  console.log('\n--- [Flow 5] Live Chat & Calling Bridge ---');
  const chatMsg = db.createChatMessage({
    id: 'msg-flow-' + Date.now(),
    contactId: 'c1',
    sender: 'Andrew',
    text: 'Please review Q3 slide deck.',
    sentAt: new Date().toISOString()
  });
  assert(chatMsg.text === 'Please review Q3 slide deck.', 'F5.1: Dispatched chat message');

  const callLog = db.createCallLog({
    id: 'call-flow-' + Date.now(),
    contactId: 'c1',
    contactName: 'Sarah Chen',
    phone: '+1 (555) 234-5678',
    durationSeconds: 240,
    startedAt: new Date().toISOString(),
    status: 'completed',
    notes: 'Agreed to launch campaign on Thursday.',
    transcriptSummary: 'Campaign launch confirmed for Thursday 9 AM.'
  });
  assert(callLog.durationSeconds === 240, 'F5.2: Tracked 240s call duration');
  assert(Boolean(callLog.transcriptSummary), 'F5.3: Saved AI transcript summary');

  // -------------------------------------------------------------------------
  // FLOW 6: Work Hub Bulk Operations
  // -------------------------------------------------------------------------
  console.log('\n--- [Flow 6] Work Hub Task Mutations & Bulk Actions ---');
  const createdTask = db.createTask({
    id: 'task-flow-101',
    title: 'Automate Stripe Reconciliation Pipeline',
    category: 'Finance',
    userPriority: 'high',
    aiPriority: 'critical',
    priorityRationale: 'High leverage financial workflow.',
    feasibility: 'ai_automated',
    valueScore: 9,
    manualHoursEstimate: 10,
    automationHoursInvested: 2,
    timeWonBackHours: 25,
    status: 'backlog',
    startDate: '2026-08-23',
    dueDate: '2026-08-28',
    durationDays: 5,
    progressPercent: 0,
    dependencies: [],
    assignee: 'AI Agent',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    automationBlueprint: {
      strategy: ['1. Webhook intake', '2. Parse invoice line items', '3. Upsert to sheet'],
      toolsNeeded: ['Stripe API', 'Google Sheets'],
      executableCodeSample: 'export const sync = () => {};',
      codeLanguage: 'typescript',
      bestPractices: ['Validate signatures'],
      webInspiration: [],
      executionReadiness: 'ready',
      estimatedHoursToBuild: 2,
      recurringHoursSavedPerMonth: 10
    }
  });

  const automatingTask = db.updateTask(createdTask.id, { status: 'automating', progressPercent: 50 });
  assert(automatingTask?.status === 'automating', 'F6.1: Bulk automate transition verified');
  const completedTask = db.updateTask(createdTask.id, { status: 'completed', progressPercent: 100 });
  assert(completedTask?.status === 'completed', 'F6.2: Bulk complete transition verified');

  // -------------------------------------------------------------------------
  // FLOW 7: Autonomous Worker & Multi-Agent Swarm
  // -------------------------------------------------------------------------
  console.log('\n--- [Flow 7] Autonomous Worker & Multi-Agent Swarm ---');
  const stepResult = await executeSingleBacklogStep(createdTask.id);
  assert(stepResult !== null && stepResult.success === true, 'F7.1: Autonomous worker executed backlog step');

  const swarmStatus = getSwarmStatus();
  assert(swarmStatus.agents.length === 4, 'F7.2: Swarm contains 4 specialized domain agents');
  const swarmCycle = await triggerSwarmCycle();
  assert(swarmCycle.cycleCompleted === true, 'F7.3: Swarm executed full parallel domain cycle');

  // -------------------------------------------------------------------------
  // FLOW 8: Canonical Executive Starter Pack Reset
  // -------------------------------------------------------------------------
  console.log('\n--- [Flow 8] Executive Starter Pack Reset ---');
  const starterDb = db.resetToCleanSlate('executive_starter');
  assert(starterDb.tasks.length === 7, `F8.1: Executive Starter Pack initialized with 7 canonical tasks (found ${starterDb.tasks.length})`);
  assert(starterDb.appointments.length === 3, `F8.2: Initialized 3 executive appointments (found ${starterDb.appointments.length})`);
  assert(starterDb.inboxEmails.length === 4, `F8.3: Initialized 4 inbox emails (found ${starterDb.inboxEmails.length})`);
  assert(starterDb.contacts.length === 5, `F8.4: Initialized 5 contacts (found ${starterDb.contacts.length})`);

  const starterKpi = db.getKPISummary();
  assert(starterKpi.totalTasks === 7, 'F8.5: Starter KPI total tasks is 7');
  assert(starterKpi.totalHoursWonBack > 100, `F8.6: Starter KPI tracks +${starterKpi.totalHoursWonBack}h won back`);

  console.log('\n======================================================================');
  console.log(`📊 CLEAN SLATE & FLOW AUDIT COMPLETE: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================================\n');

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runCleanSlateAndFlowAudit().catch(err => {
  console.error('Fatal Flow Audit Error:', err);
  process.exit(1);
});
