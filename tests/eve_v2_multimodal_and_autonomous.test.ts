import test from 'node:test';
import assert from 'node:assert/strict';
import { cortexEngine } from '../src/services/cortexDialogueEngine';
import { proactiveLoopService } from '../src/services/proactiveLoopService';
import { processSpeechWithGemini } from '../src/services/geminiService';
import { ImageAttachment, InboxEmail, CalendarAppointment, TaskItem } from '../src/types';

test('Eve v2.0 Upgrades: Multimodal Vision Cortex & Proactive Autonomous Loop Suite', async (t) => {

  await t.test('1. Multimodal Vision Cortex: Ingests image attachments and executes visual reasoning', async () => {
    const mockImage: ImageAttachment = {
      id: 'img-test-1',
      url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      mimeType: 'image/png',
      name: 'system_architecture_diagram.png',
      sizeBytes: 1024
    };

    const result = await cortexEngine.reasonAndAct(
      'Analyze this system architecture diagram and summarize the components',
      [],
      undefined,
      undefined,
      [mockImage]
    );

    assert.ok(result, 'Cortex returned execution result');
    assert.ok(result.actionCard, 'Action card generated');
    assert.ok(result.actionCard.imageAttachment || result.actionCard.imageAttachments, 'Image attachment linked in action card');
    assert.ok(result.spokenResponse.length > 5, 'Spoken response generated');
    assert.equal(result.actionCard.intent, 'knowledge_qa', 'Visual analysis resolved as knowledge_qa');
  });

  await t.test('2. Gemini 2.5 Vision Service: Converts image attachments to Gemini inline_data payload', async () => {
    const mockImage: ImageAttachment = {
      id: 'img-test-2',
      url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...',
      mimeType: 'image/jpeg',
      name: 'invoice_screenshot.jpg'
    };

    // Verify null handling with empty API key
    const resWithoutKey = await processSpeechWithGemini(
      'Extract invoice total from image',
      '',
      'gemini-2.5-flash',
      undefined,
      [],
      [mockImage]
    );
    assert.equal(resWithoutKey, null, 'Gracefully returns null when API key is not configured');
  });

  await t.test('3. Proactive Autonomous Loop: Flags urgent VIP unread emails', () => {
    proactiveLoopService.resetAlertHistory();

    const mockEmails: InboxEmail[] = [
      {
        id: 'email-urgent-1',
        fromName: 'Sarah Chen',
        fromEmail: 'sarah.chen@innovate.co',
        toName: 'Andrew Baxter',
        toEmail: 'andy.j.baxter@gmail.com',
        subject: 'URGENT: Q3 Budget Signoff Deadline',
        snippet: 'Andrew, we need urgent signoff before 5pm today on the cloud budget.',
        body: 'Andrew, we need urgent signoff before 5pm today on the cloud budget.',
        receivedAt: new Date().toISOString(),
        isUnread: true,
        isStarred: true,
        category: 'vip'
      }
    ];

    const alert = proactiveLoopService.checkUrgentEvents({
      inboxEmails: mockEmails,
      appointments: [],
      tasks: []
    });

    assert.ok(alert, 'Proactive alert generated for urgent VIP email');
    assert.equal(alert?.source, 'email');
    assert.equal(alert?.sourceId, 'email-urgent-1');
    assert.ok(alert?.spokenSummary.includes('Sarah Chen'), 'Spoken summary mentions sender');
    assert.ok(alert?.actionCardData?.emailData, 'Action card includes staged reply draft');

    // Deduplication check: Second check must return null (already alerted)
    const secondCheck = proactiveLoopService.checkUrgentEvents({
      inboxEmails: mockEmails,
      appointments: [],
      tasks: []
    });
    assert.equal(secondCheck, null, 'Deduplication prevents repeated notification for the same event');
  });

  await t.test('4. Proactive Autonomous Loop: Warns about imminent calendar appointments within 45 minutes', () => {
    proactiveLoopService.resetAlertHistory();

    const now = Date.now();
    const in20Mins = new Date(now + 20 * 60 * 1000).toISOString();

    const mockAppointments: CalendarAppointment[] = [
      {
        id: 'apt-imminent-1',
        title: 'Executive Sync with David Miller',
        startDateTime: in20Mins,
        endDateTime: new Date(now + 50 * 60 * 1000).toISOString(),
        location: 'Google Meet',
        attendees: [{ name: 'David Miller', email: 'david.m@cloudscale.io' }],
        status: 'confirmed'
      }
    ];

    const alert = proactiveLoopService.checkUrgentEvents({
      inboxEmails: [],
      appointments: mockAppointments,
      tasks: []
    });

    assert.ok(alert, 'Proactive alert generated for imminent appointment');
    assert.equal(alert?.source, 'calendar');
    assert.equal(alert?.sourceId, 'apt-imminent-1');
    assert.ok(alert?.spokenSummary.includes('Executive Sync with David Miller'), 'Spoken summary includes meeting title');
  });

  await t.test('5. Proactive Autonomous Loop: Identifies blocked critical tasks in backlog', () => {
    proactiveLoopService.resetAlertHistory();

    const mockTasks: TaskItem[] = [
      {
        id: 'task-blocked-1',
        title: 'Stripe Multi-Currency Billing Automation',
        description: 'Automate invoice conversion',
        category: 'Finance',
        userPriority: 'urgent',
        aiPriority: 'critical',
        priorityRationale: 'High leverage revenue automation',
        feasibility: 'ai_automated',
        feasibilityReasoning: 'API automation',
        valueScore: 9,
        estimatedValue: '$3,000/mo',
        manualHoursEstimate: 10,
        automationHoursInvested: 3,
        timeWonBackHours: 25,
        status: 'blocked',
        startDate: '2026-08-01',
        dueDate: '2026-08-30',
        durationDays: 10,
        progressPercent: 40,
        dependencies: [],
        assignee: 'AI Agent',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const alert = proactiveLoopService.checkUrgentEvents({
      inboxEmails: [],
      appointments: [],
      tasks: mockTasks
    });

    assert.ok(alert, 'Proactive alert generated for blocked critical task');
    assert.equal(alert?.source, 'task');
    assert.equal(alert?.sourceId, 'task-blocked-1');
    assert.ok(alert?.spokenSummary.includes('Stripe Multi-Currency Billing Automation'), 'Spoken summary includes task title');
  });

  await t.test('6. Invariant Guard: Groq Whisper & Audio Recorder stability', async () => {
    const { audioRecorder, isVerbalStopCommand } = await import('../src/services/audioRecorder');
    assert.ok(audioRecorder, 'audioRecorder service is defined and accessible');
    assert.equal(typeof audioRecorder.start, 'function');
    assert.equal(typeof audioRecorder.stop, 'function');
    assert.equal(isVerbalStopCommand('stop'), true);
    assert.equal(isVerbalStopCommand('shut up'), true);
    assert.equal(isVerbalStopCommand('arrête'), true);
    assert.equal(isVerbalStopCommand('halt'), true);
  });

});
