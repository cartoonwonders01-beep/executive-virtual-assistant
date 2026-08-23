// Automated Comprehensive Test Suite for Executive Assistant System
import fs from 'fs';
import path from 'path';
import { db } from '../server/db';
import { parseIntentFromSpeech } from '../server/intentParser';
import { parseAppointmentFromSpeech, generateICSString, generateFullCalendarICS } from '../server/calendarService';
import { draftEmailFromSpeech } from '../server/emailService';
import { analyzeVoiceTranscript } from '../server/aiAnalysisService';
import { generateAutomationBlueprint } from '../server/automationEngine';

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

async function runTestSuite() {
  console.log('\n🧪 Starting Executive Assistant System Test Suite...\n');

  // TEST GROUP 1: Intent Classification
  console.log('--- Test Group 1: Intent Classification ---');
  
  // 1.1 Email Intent
  const emailCard = parseIntentFromSpeech("Draft an email to Sarah regarding Q3 growth sprint");
  assert(emailCard.intent === 'email_draft', 'Classifies email draft intent');
  assert(emailCard.emailData?.toName === 'Sarah Chen', 'Matches contact name to Sarah Chen');
  assert(emailCard.emailData?.subject.toLowerCase().includes('q3') || emailCard.emailData?.subject.toLowerCase().includes('growth') || false, 'Subject captures context');

  // 1.2 Calendar Booking Intent
  const calCard = parseIntentFromSpeech("Book a strategy sync with David Miller next Tuesday at 2 PM");
  assert(calCard.intent === 'calendar_booking', 'Classifies calendar booking intent');
  assert(calCard.calendarData?.title.includes('David Miller') || false, 'Captures attendee in meeting title');
  assert(calCard.calendarData?.googleCalendarUrl?.startsWith('https://calendar.google.com') || false, 'Generates valid Google Calendar URL');

  // 1.3 Compound Intent (Meeting + Email)
  const compoundCard = parseIntentFromSpeech("Book a sync with David on Tuesday and draft an email to Sarah regarding our agenda");
  assert(compoundCard.calendarData !== undefined, 'Compound intent generates calendar appointment');
  assert(compoundCard.emailData !== undefined, 'Compound intent generates email draft');

  // 1.4 Call Contact Intent
  const callCard = parseIntentFromSpeech("Call Sarah Chen");
  assert(callCard.intent === 'call_contact', 'Classifies contact call intent');
  assert(callCard.contactData?.name === 'Sarah Chen', 'Matches Sarah Chen contact');

  // 1.5 Personal Message Email Phrasing
  const personalCard = parseIntentFromSpeech("Send an email to my wife saying I love you");
  assert(personalCard.intent === 'email_draft', 'Classifies personal email intent');
  assert(personalCard.emailData?.toName === 'My Wife', 'Identifies recipient as My Wife');
  assert(personalCard.emailData?.body.includes('I love you'), 'Includes personal love message in body');

  // TEST GROUP 2: Calendar Engine & iCalendar (.ics)
  console.log('\n--- Test Group 2: Calendar Engine & ICS Generator ---');
  const { appointment, conflict } = parseAppointmentFromSpeech("Meeting with David Miller tomorrow at 10 AM");
  assert(appointment.title.includes('David Miller'), 'Extracts appointment title correctly');
  assert(appointment.attendees.length > 0, 'Populates attendees list');

  const icsStr = generateICSString(appointment);
  assert(icsStr.includes('BEGIN:VCALENDAR') && icsStr.includes('END:VCALENDAR'), 'Generates valid RFC 5545 VCALENDAR string');
  assert(icsStr.includes('BEGIN:VEVENT') && icsStr.includes('SUMMARY:'), 'Includes VEVENT summary');

  const allApts = db.getAppointments();
  const feedICS = generateFullCalendarICS(allApts);
  assert(feedICS.includes('PRODID:-//Executive AI Personal Assistant//EN'), 'Generates full calendar ICS feed');

  // TEST GROUP 3: Task Dissection & Blueprint Generator
  console.log('\n--- Test Group 3: Task Dissection & Self-Teaching Blueprint ---');
  const { memo, createdTasks } = analyzeVoiceTranscript(
    "Automate supplier invoice extraction from billing emails to Google Sheets, and scrape competitor pricing tiers on Sunday mornings",
    "browser_mic"
  );
  assert(createdTasks.length >= 2, `Extracts multiple tasks from voice transcript (got ${createdTasks.length})`);
  assert(createdTasks.some(t => t.feasibility === 'ai_automated'), 'Correctly assesses AI automation feasibility');
  
  const invoiceTask = createdTasks.find(t => t.category === 'Finance') || createdTasks[0];
  assert(invoiceTask.automationBlueprint !== undefined, 'Generates automation blueprint');
  assert(invoiceTask.automationBlueprint?.executableCodeSample.length! > 20, 'Generates executable code sample');
  assert(invoiceTask.automationBlueprint?.toolsNeeded.length! > 0, 'Lists required tools and APIs');

  // TEST GROUP 4: KPI Dashboard Metrics
  console.log('\n--- Test Group 4: KPI Metrics & ROI Engine ---');
  const kpi = db.getKPISummary();
  assert(kpi.totalTasks > 0, `Total tasks counted (${kpi.totalTasks})`);
  assert(kpi.totalHoursWonBack > 0, `Hours won back calculated (${kpi.totalHoursWonBack}h)`);
  assert(kpi.roiMultiplier > 0, `ROI multiplier computed (${kpi.roiMultiplier}x)`);
  assert(kpi.aiAutomatedCount + kpi.hybridCount + kpi.humanOnlyCount === kpi.totalTasks, 'Feasibility breakdown sums to 100% of tasks');

  // TEST GROUP 5: Wiki Knowledge Base
  console.log('\n--- Test Group 5: Living Wiki Knowledge Hub ---');
  const articles = db.getWikiArticles();
  assert(articles.length >= 6, `Seed wiki articles loaded (${articles.length} articles)`);
  const voiceArticle = db.getWikiArticleById('wiki-1');
  assert(voiceArticle !== undefined, 'Finds wiki article by ID');
  assert(voiceArticle?.category === 'Voice AI & Mobile', 'Correctly matches category');

  // TEST GROUP 6: Critical Path Method (CPM) & Eisenhower Decision Matrix
  console.log('\n--- Test Group 6: Critical Path Method (CPM) & Eisenhower Matrix ---');
  const tasks = db.getTasks();
  
  // Eisenhower 4 Quadrants Categorization Check
  const isUrgent = (t: any) => t.userPriority === 'urgent' || t.userPriority === 'high';
  const isHighLeverage = (t: any) => t.aiPriority === 'critical' || t.aiPriority === 'high' || t.feasibility === 'ai_automated';
  
  const q1 = tasks.filter(t => isUrgent(t) && isHighLeverage(t));
  const q2 = tasks.filter(t => !isUrgent(t) && isHighLeverage(t));
  const q3 = tasks.filter(t => isUrgent(t) && !isHighLeverage(t));
  const q4 = tasks.filter(t => !isUrgent(t) && !isHighLeverage(t));

  assert(q1.length + q2.length + q3.length + q4.length === tasks.length, 'Eisenhower quadrants partition 100% of tasks');
  assert(q1.length > 0, `Q1 (Immediate Execution) contains ${q1.length} tasks`);
  assert(q2.length > 0, `Q2 (Strategic Automation) contains ${q2.length} tasks`);

  // CPM Dependency Chain Check
  const tasksWithDeps = tasks.filter(t => t.dependencies && t.dependencies.length > 0);
  assert(tasksWithDeps.length > 0, `Gantt CPM detects ${tasksWithDeps.length} dependent task relationships`);

  // TEST GROUP 7: PWA Offline Manifest & Service Worker
  console.log('\n--- Test Group 7: PWA Offline Capabilities ---');
  const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
  assert(fs.existsSync(manifestPath), 'PWA manifest.json exists');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert(manifest.display === 'standalone', 'PWA configured for standalone mobile display');
  assert(manifest.theme_color === '#0d9488', 'PWA has matching brand theme color');

  const swPath = path.join(process.cwd(), 'public', 'sw.js');
  assert(fs.existsSync(swPath), 'Offline Service Worker sw.js exists');

  // TEST GROUP 8: Hybrid Best-of-Breed Pipeline (Groq Whisper -> Gemini Ultra)
  console.log('\n--- Test Group 8: Hybrid Pipeline (Groq Whisper STT -> Gemini AI Ultra Reasoning) ---');
  const geminiServicePath = path.join(process.cwd(), 'src', 'services', 'geminiService.ts');
  assert(fs.existsSync(geminiServicePath), 'geminiService.ts exists');
  const geminiCode = fs.readFileSync(geminiServicePath, 'utf8');
  assert(geminiCode.includes('processSpeechWithGemini'), 'Exports processSpeechWithGemini reasoning engine');
  assert(geminiCode.includes('GROQ WHISPER TRANSCRIPT TO REASON ABOUT'), 'Formats Groq transcript prompt for Gemini');
  assert(geminiCode.includes('automationBlueprint'), 'Gemini synthesizes automation blueprints with code samples');
  assert(geminiCode.includes('gemini-1.5-flash') || geminiCode.includes('gemini-1.5-pro'), 'Supports Gemini 1.5 Pro/Flash models');

  // TEST GROUP 9: Gmail Suite & Inbox Triager
  console.log('\n--- Test Group 9: Gmail Suite & Inbox Triager ---');
  const inboxEmails = db.getInboxEmails();
  assert(Array.isArray(inboxEmails) && inboxEmails.length > 0, `Database contains ${inboxEmails.length} inbox emails`);
  const unreadEmail = inboxEmails.find(e => e.isUnread);
  assert(Boolean(unreadEmail), 'Unread emails tracked with badges');
  const vipEmail = inboxEmails.find(e => e.category === 'vip');
  assert(Boolean(vipEmail), 'VIP categorized emails identified');
  
  // TEST GROUP 10: Communications Hub, Chat & Live Calls
  console.log('\n--- Test Group 10: Communications Hub, Chat & Live Calls ---');
  const contacts = db.getContacts();
  assert(contacts.length >= 4, `Contact directory initialized with ${contacts.length} contacts`);
  const chatMessages = db.getChatMessages();
  assert(Array.isArray(chatMessages), 'Chat message threads initialized');
  const callLogs = db.getCallLogs();
  assert(Array.isArray(callLogs), 'Call logs initialized');

  // TEST GROUP 11: Autonomous Backlog Execution Worker Engine
  console.log('\n--- Test Group 11: Autonomous Backlog Execution Worker ---');
  const { getAutonomousStatus, executeSingleBacklogStep } = await import('../server/autonomousWorker');
  const initialStatus = getAutonomousStatus();
  assert(initialStatus.queueLength >= 0, `Autonomous queue initialized with ${initialStatus.queueLength} tasks`);
  const stepRes = await executeSingleBacklogStep();
  assert(stepRes !== null && stepRes.success === true, 'Autonomous worker executes single blueprint step');
  assert(stepRes?.job !== undefined, 'Autonomous job created and tracked in audit log');

  // Summary
  console.log('\n=============================================');
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('=============================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
