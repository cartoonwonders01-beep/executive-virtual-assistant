import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from './db';
import { parseIntentFromSpeech } from './intentParser';
import { analyzeVoiceTranscript } from './aiAnalysisService';
import { transcribeAudioFile } from './audioService';
import { generateICSString, generateFullCalendarICS } from './calendarService';
import { executeSingleBacklogStep, runAllBacklogTasks, getAutonomousStatus } from './autonomousWorker';
import { getSwarmStatus, triggerSwarmCycle } from './agentSwarm';
import { InboxEmail, ChatMessage, CallLog } from '../src/types';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Configure Multer for audio uploads
const upload = multer({
  dest: path.join(process.cwd(), 'uploads'),
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MB
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Executive AI Personal Assistant & Work Hub',
    timestamp: new Date().toISOString(),
    sandboxVm: '10.211.55.6'
  });
});

// KPI Summary
app.get('/api/kpi', (req, res) => {
  res.json(db.getKPISummary());
});

// Tasks CRUD
app.get('/api/tasks', (req, res) => {
  res.json(db.getTasks());
});

app.post('/api/tasks', (req, res) => {
  const task = db.createTask(req.body);
  res.status(201).json(task);
});

app.put('/api/tasks/:id', (req, res) => {
  const updated = db.updateTask(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Task not found' });
  res.json(updated);
});

app.delete('/api/tasks/:id', (req, res) => {
  db.deleteTask(req.params.id);
  res.json({ success: true });
});

// Voice Memos
app.get('/api/memos', (req, res) => {
  res.json(db.getMemos());
});

// Voice Speech-to-Intent (Live Web Speech / Mobile HUD trigger)
app.post('/api/voice/process-text', (req, res) => {
  const { text, source } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Speech text is required' });
  }

  // 1. Generate Action Card via Intent Parser
  const actionCard = parseIntentFromSpeech(text);
  db.createActionCard(actionCard);

  // 2. Also analyze transcript to extract tasks if it has multiple ideas
  const { memo, createdTasks } = analyzeVoiceTranscript(text, source || 'browser_mic');

  res.json({
    actionCard,
    memo,
    createdTasks,
    kpi: db.getKPISummary()
  });
});

// Direct Audio Blob Transcription (Real-Time MediaRecorder from PWA / Phone)
app.post('/api/voice/transcribe-audio', upload.single('audio'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No audio stream provided' });
    }

    const groqKey = (req.headers['x-groq-api-key'] as string) || (req.body?.groqKey as string);
    const transcript = await transcribeAudioFile(file.path, file.originalname, groqKey);

    // 1. Process intent
    const actionCard = parseIntentFromSpeech(transcript);
    db.createActionCard(actionCard);

    // 2. Dissect tasks
    const { memo, createdTasks } = analyzeVoiceTranscript(transcript, 'browser_mic');
    memo.audioUrl = `/uploads/${file.filename}`;
    db.saveToDisk();

    res.json({
      transcript,
      actionCard,
      memo,
      createdTasks,
      kpi: db.getKPISummary()
    });
  } catch (err: any) {
    console.error('Error in transcribe-audio:', err);
    res.status(500).json({ error: err.message || 'Audio transcription failed' });
  }
});

// Audio File Upload (Desktop or PWA File Ingestion)
app.post('/api/voice/upload', upload.single('audio'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const groqKey = (req.headers['x-groq-api-key'] as string) || (req.body?.groqKey as string);
    const transcript = await transcribeAudioFile(file.path, file.originalname, groqKey);
    const { memo, createdTasks } = analyzeVoiceTranscript(transcript, 'file_upload');
    memo.audioUrl = `/uploads/${file.filename}`;
    db.saveToDisk();

    res.json({
      transcript,
      memo,
      createdTasks,
      kpi: db.getKPISummary()
    });
  } catch (err: any) {
    console.error('Error handling audio upload:', err);
    res.status(500).json({ error: err.message || 'Audio processing failed' });
  }
});

// Mobile Ingest Webhook (for iOS Shortcuts, Apple Watch, Android Intents)
app.post('/api/voice/ingest', upload.single('audio'), async (req, res) => {
  try {
    let transcript = req.body.transcript;
    let audioUrl: string | undefined;

    if (req.file) {
      transcript = await transcribeAudioFile(req.file.path, req.file.originalname);
      audioUrl = `/uploads/${req.file.filename}`;
    }

    if (!transcript) {
      return res.status(400).json({ error: 'Transcript or audio file required' });
    }

    // Process intent & extract tasks
    const actionCard = parseIntentFromSpeech(transcript);
    db.createActionCard(actionCard);

    const { memo, createdTasks } = analyzeVoiceTranscript(transcript, 'ios_shortcut');
    if (audioUrl) memo.audioUrl = audioUrl;
    db.saveToDisk();

    res.json({
      status: 'ingested',
      spokenResponse: actionCard.spokenResponse,
      actionCard,
      createdTasksCount: createdTasks.length,
      kpi: db.getKPISummary()
    });
  } catch (err: any) {
    console.error('Error on mobile voice webhook:', err);
    res.status(500).json({ error: err.message });
  }
});

// Action Cards
app.get('/api/action-cards', (req, res) => {
  res.json(db.getActionCards());
});

app.post('/api/action-cards/:id/execute', (req, res) => {
  const card = db.getActionCards().find(c => c.id === req.params.id);
  if (!card) return res.status(404).json({ error: 'Card not found' });

  // Update status
  const updated = db.updateActionCard(card.id, { status: 'executed' });
  res.json({ success: true, card: updated });
});

// Calendar Appointments
app.get('/api/appointments', (req, res) => {
  res.json(db.getAppointments());
});

// Single Appointment .ics Download
app.get('/api/appointments/:id/ics', (req, res) => {
  const apt = db.getAppointments().find(a => a.id === req.params.id);
  if (!apt) return res.status(404).send('Appointment not found');

  const icsData = generateICSString(apt);
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="appointment_${apt.id}.ics"`);
  res.send(icsData);
});

// Full Calendar Feed .ics Export
app.get('/api/appointments/feed.ics', (req, res) => {
  const icsData = generateFullCalendarICS(db.getAppointments());
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="executive_calendar.ics"');
  res.send(icsData);
});

app.post('/api/appointments', (req, res) => {
  const apt = db.createAppointment(req.body);
  res.status(201).json(apt);
});

app.put('/api/appointments/:id', (req, res) => {
  const updated = db.updateAppointment(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Appointment not found' });
  res.json(updated);
});

// =========================================================================
// GMAIL SUITE API
// =========================================================================
app.get('/api/gmail/inbox', (req, res) => {
  res.json(db.getInboxEmails());
});

app.get('/api/gmail/inbox/:id', (req, res) => {
  const email = db.getInboxEmailById(req.params.id);
  if (!email) return res.status(404).json({ error: 'Email not found' });
  res.json(email);
});

app.post('/api/gmail/send', (req, res) => {
  const { toName, toEmail, subject, body, tone } = req.body;
  if (!toEmail || !subject || !body) {
    return res.status(400).json({ error: 'toEmail, subject, and body are required' });
  }

  const newDraft = {
    id: 'em-' + Date.now().toString(36),
    toName: toName || toEmail.split('@')[0],
    toEmail,
    subject,
    body,
    tone: tone || 'professional',
    status: 'sent' as const,
    sentAt: new Date().toISOString()
  };

  db.get().emails.unshift(newDraft);
  db.saveToDisk();

  res.status(201).json({
    success: true,
    email: newDraft,
    message: `Email successfully sent to ${toName || toEmail}`
  });
});

app.post('/api/gmail/triage', (req, res) => {
  const unread = db.getInboxEmails().filter(e => e.isUnread);
  const summaryBullets = unread.map(e => `• [${e.category.toUpperCase()}] ${e.fromName}: "${e.subject}" — ${e.snippet.substring(0, 70)}...`);
  
  res.json({
    unreadCount: unread.length,
    triageSummary: summaryBullets.length > 0 ? summaryBullets.join('\n') : 'All inbox items triaged! 0 unread emails remaining.',
    emails: unread
  });
});

app.patch('/api/gmail/inbox/:id/read', (req, res) => {
  const isUnread = req.body.isUnread !== undefined ? req.body.isUnread : false;
  const updated = db.updateInboxEmail(req.params.id, { isUnread });
  if (!updated) return res.status(404).json({ error: 'Email not found' });
  res.json(updated);
});

app.patch('/api/gmail/inbox/:id/star', (req, res) => {
  const email = db.getInboxEmailById(req.params.id);
  if (!email) return res.status(404).json({ error: 'Email not found' });
  const updated = db.updateInboxEmail(req.params.id, { isStarred: !email.isStarred });
  res.json(updated);
});

app.delete('/api/gmail/inbox/:id', (req, res) => {
  const deleted = db.deleteInboxEmail(req.params.id);
  res.json({ success: deleted });
});

// =========================================================================
// COMMUNICATIONS: CONTACTS, CHAT & CALLS API
// =========================================================================
app.get('/api/comms/contacts', (req, res) => {
  res.json(db.getContacts());
});

app.post('/api/comms/contacts', (req, res) => {
  const contact = db.createContact(req.body);
  res.status(201).json(contact);
});

app.get('/api/comms/messages', (req, res) => {
  const contactId = req.query.contactId as string | undefined;
  res.json(db.getChatMessages(contactId));
});

app.post('/api/comms/messages', (req, res) => {
  const { contactId, text, sender } = req.body;
  if (!contactId || !text) {
    return res.status(400).json({ error: 'contactId and text are required' });
  }

  const userMsg: ChatMessage = {
    id: 'msg-' + Date.now().toString(36),
    contactId,
    sender: sender || 'Andrew',
    text,
    sentAt: new Date().toISOString()
  };

  db.createChatMessage(userMsg);

  // Generate automated realistic contact reply
  const contact = db.getContactById(contactId);
  let replyText = `Thanks Andrew! Received your update regarding "${text.substring(0, 30)}...". Coordinating next steps now.`;
  if (contact?.name.includes('Sarah')) {
    replyText = `Thanks Andrew! I have updated our growth metrics. Talk soon on our scheduled sync.`;
  } else if (contact?.name.includes('David')) {
    replyText = `Got it! Deploying the latest sandbox test script now.`;
  } else if (contact?.name.includes('Emily')) {
    replyText = `Love you too! See you tonight at home ❤️`;
  }

  const autoReply: ChatMessage = {
    id: 'msg-' + (Date.now() + 10).toString(36),
    contactId,
    sender: 'Contact',
    text: replyText,
    sentAt: new Date(Date.now() + 1000).toISOString()
  };

  db.createChatMessage(autoReply);

  res.status(201).json({
    userMessage: userMsg,
    replyMessage: autoReply
  });
});

app.get('/api/comms/calls', (req, res) => {
  res.json(db.getCallLogs());
});

app.post('/api/comms/calls', (req, res) => {
  const { contactId, contactName, phone, durationSeconds, notes, transcriptSummary } = req.body;
  const newCall: CallLog = {
    id: 'call-' + Date.now().toString(36),
    contactId: contactId || 'c1',
    contactName: contactName || 'Contact',
    phone: phone || '+1 (555) 000-0000',
    durationSeconds: durationSeconds || 60,
    startedAt: new Date().toISOString(),
    status: 'completed',
    notes: notes || 'Direct voice call completed.',
    transcriptSummary: transcriptSummary || 'Live call conversation transcribed by assistant.'
  };

  db.createCallLog(newCall);
  res.status(201).json(newCall);
});

// =========================================================================
// AUTONOMOUS BACKLOG WORKER API
// =========================================================================
app.get('/api/autonomous/status', (req, res) => {
  res.json(getAutonomousStatus());
});

app.post('/api/autonomous/step', async (req, res) => {
  const taskId = req.body?.taskId as string | undefined;
  const result = await executeSingleBacklogStep(taskId);
  if (!result) {
    return res.json({ success: false, message: 'No active backlog tasks available for autonomous execution.' });
  }
  res.json(result);
});

app.post('/api/autonomous/run-all', async (req, res) => {
  const result = await runAllBacklogTasks();
  res.json(result);
});

// =========================================================================
// MULTI-AGENT SWARM API
// =========================================================================
app.get('/api/swarm/status', (req, res) => {
  res.json(getSwarmStatus());
});

app.post('/api/swarm/cycle', async (req, res) => {
  const result = await triggerSwarmCycle();
  res.json(result);
});

// =========================================================================
// SYSTEM RESET & CLEAN INITIALIZATION API
// =========================================================================
app.post('/api/system/reset', (req, res) => {
  const mode = (req.body?.mode as 'pristine' | 'executive_starter') || 'executive_starter';
  const cleanDb = db.resetToCleanSlate(mode);
  res.json({
    success: true,
    mode,
    message: mode === 'pristine' 
      ? 'System initialized to pristine clean slate (0 tasks, 0 test memos).' 
      : 'System initialized to canonical Executive Starter Pack.',
    tasksCount: cleanDb.tasks.length,
    contactsCount: cleanDb.contacts.length,
    appointmentsCount: cleanDb.appointments.length
  });
});

// Tasks CSV Export
app.get('/api/tasks/export/csv', (req, res) => {
  const tasks = db.getTasks();
  const headers = ['ID', 'Title', 'Category', 'User Priority', 'AI Priority', 'Feasibility', 'Status', 'Start Date', 'Due Date', 'Hours Won Back', 'Value Score'];
  const rows = tasks.map(t => [
    t.id,
    `"${(t.title || '').replace(/"/g, '""')}"`,
    `"${t.category}"`,
    t.userPriority,
    t.aiPriority,
    t.feasibility,
    t.status,
    t.startDate,
    t.dueDate,
    t.timeWonBackHours,
    t.valueScore
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="monday_work_hub.csv"');
  res.send(csvContent);
});

// Contacts & Email Drafts
app.get('/api/contacts', (req, res) => {
  res.json(db.getContacts());
});

app.get('/api/emails', (req, res) => {
  res.json(db.get().emails);
});

app.post('/api/emails/:id/send', (req, res) => {
  const emails = db.get().emails;
  const em = emails.find(e => e.id === req.params.id);
  if (!em) return res.status(404).json({ error: 'Email draft not found' });

  em.status = 'sent';
  em.sentAt = new Date().toISOString();
  db.saveToDisk();
  res.json({ success: true, email: em, message: `Email sent to ${em.toEmail}` });
});

// Wiki Knowledge Base CRUD
app.get('/api/wiki', (req, res) => {
  res.json(db.getWikiArticles());
});

app.get('/api/wiki/:id', (req, res) => {
  const article = db.getWikiArticleById(req.params.id);
  if (!article) return res.status(404).json({ error: 'Wiki article not found' });
  res.json(article);
});

app.post('/api/wiki', (req, res) => {
  const { title, category, summary, content, tags, author } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const newArticle: any = {
    id: 'wiki-' + Date.now().toString(36),
    slug: slug || 'article-' + Date.now().toString(36),
    title,
    category: category || 'System Architecture',
    summary: summary || title,
    content,
    tags: tags || ['Guide'],
    lastUpdated: new Date().toISOString(),
    author: author || 'Andrew'
  };

  const created = db.createWikiArticle(newArticle);
  res.status(201).json(created);
});

app.put('/api/wiki/:id', (req, res) => {
  const updated = db.updateWikiArticle(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Wiki article not found' });
  res.json(updated);
});

app.delete('/api/wiki/:id', (req, res) => {
  const deleted = db.deleteWikiArticle(req.params.id);
  res.json({ success: deleted });
});

app.listen(PORT, () => {
  console.log(`⚡ Executive Assistant Server running on http://localhost:${PORT}`);
});
