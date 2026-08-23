import test from 'node:test';
import assert from 'node:assert/strict';
import { googleEcosystem } from '../server/googleEcosystem';
import { antigravityBridge } from '../server/antigravityBridge';
import { skillRegistry, parseSkillFromSpeech } from '../server/skillRegistry';
import { db } from '../server/db';

test('Antigravity Suite Bridge, Google Ecosystem & Self-Learning Engine Suite', async (t) => {

  await t.test('Module 1: Google Ecosystem Connector generates Google Meet link and Calendar URL', () => {
    const start = new Date(Date.now() + 86400000).toISOString();
    const end = new Date(Date.now() + 90000000).toISOString();
    
    const res = googleEcosystem.createGoogleCalendarEvent(
      'Strategic Architecture Sync with David',
      start,
      end,
      [{ name: 'David Miller', email: 'david.miller@apex.io' }],
      'Google Meet Virtual Bridge'
    );

    assert.ok(res.event.id.startsWith('apt-'), 'Calendar event generated unique ID');
    assert.ok(res.googleMeetUrl.includes('meet.google.com'), 'Generated valid Google Meet URL');
    assert.ok(res.googleCalendarUrl.includes('calendar.google.com'), 'Generated Google Calendar direct web URL');
    assert.equal(res.event.attendees[0].email, 'david.miller@apex.io');
  });

  await t.test('Module 2: Google Ecosystem syncs thoughts and tasks to Sheets & BigQuery warehouse', async () => {
    const tasks = db.getTasks();
    const thoughts = [
      {
        id: 'th-test-1',
        content: 'Protect morning deep work and automate email triage with AI swarm',
        category: 'Productivity',
        executiveSummary: 'Morning Deep Work Protocol',
        keyInsights: ['Insight 1', 'Insight 2'],
        actionSteps: ['Step 1', 'Step 2'],
        googleSyncStatus: 'synced' as const,
        antigravityExported: true,
        createdAt: new Date().toISOString()
      }
    ];

    const kpi = {
      totalHoursWonBack: 776,
      automationHoursInvested: 135.5,
      netROIHours: 640.5,
      roiMultiplier: 5.7,
      totalTasks: tasks.length,
      completedTasks: 2,
      ongoingTasks: 44,
      backlogTasks: 3,
      aiAutomatedCount: 42,
      humanOnlyCount: 4,
      hybridCount: 3,
      highValueCount: 49,
      completionRatePercent: 4
    };

    const res = await googleEcosystem.syncToSheetsAndBigQuery(thoughts, tasks, kpi);
    assert.equal(res.service, 'sheets');
    assert.equal(res.status, 'synced');
    assert.ok(res.recordsAffected >= 1);
    assert.ok(res.summary.includes('BigQuery'));
  });

  await t.test('Module 3: Antigravity Bridge compiles voice-learned skill to standard SKILL.md format', () => {
    const speech = "When I say 'Executive Triage', triage my inbox, check my calendar, and summarize high-priority tasks";
    const parsed = parseSkillFromSpeech(speech);
    assert.ok(parsed, 'Parsed skill from voice transcript');

    const created = skillRegistry.createSkill(parsed!);
    const exported = antigravityBridge.exportToAntigravitySkill(created);

    assert.equal(exported.skillName, 'executive-triage');
    assert.equal(exported.skillPath, '.agents/skills/executive-triage/SKILL.md');
    assert.ok(exported.skillContent.includes('---'), 'Contains YAML frontmatter');
    assert.ok(exported.skillContent.includes('name: executive-triage'));
    assert.ok(exported.skillContent.includes('Autonomous Execution Rules'));
    assert.ok(exported.skillContent.includes('sandbox-vm'));
    assert.ok(exported.ruleContent?.includes('When the user mentions "executive triage"'));
  });

  await t.test('Module 4: Antigravity Bridge creates Sandbox VM execution payload per AGENTS.md protocol', () => {
    const tasks = db.getTasks();
    const sampleTask = tasks[0];

    const job = antigravityBridge.createSandboxExecutionJob(sampleTask, sampleTask.automationBlueprint);
    assert.ok(job.id.startsWith('job-vm-'), 'Assigned unique VM job ID');
    assert.equal(job.targetEnvironment, 'sandbox-vm');
    assert.ok(job.outputLogs.some(l => l.includes('Air-Gapped Sandbox Protocol Active')));
    assert.ok(job.outputLogs.some(l => l.includes('10.211.55.6')));
  });

  await t.test('Module 5: Live GUI Activity Logger records telemetry events and supports filtering', async () => {
    const { logger } = await import('../src/services/loggerService');
    
    logger.log('info', 'wake_word', 'Test wake-word listener initialized');
    logger.log('success', 'wake_word', '🎯 Test Wake-Word DETECTED: "Hey Eve"');
    logger.log('info', 'speech_stt', 'Live STT: "What are 3 strategies for deep work?"');
    logger.log('success', 'ai_reasoning', 'Intent resolved to [knowledge_qa]: 3 Strategies for Deep Work');
    logger.log('info', 'tts_speech', 'Speaking aloud response to user');

    const entries = logger.getEntries();
    assert.ok(entries.length >= 5, 'Logger captured all 5 events');
    assert.equal(entries[0].category, 'tts_speech');
    assert.equal(entries[0].level, 'info');

    const successEntries = entries.filter(e => e.level === 'success');
    assert.ok(successEntries.length >= 2, 'Filtered success level entries');
  });

});
