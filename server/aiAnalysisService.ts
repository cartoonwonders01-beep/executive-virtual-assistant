import { TaskItem, VoiceMemo } from '../src/types';
import { db } from './db';
import { generateAutomationBlueprint } from './automationEngine';

export function analyzeVoiceTranscript(transcript: string, source: VoiceMemo['source'] = 'browser_mic'): {
  memo: VoiceMemo;
  createdTasks: TaskItem[];
} {
  const memoId = 'memo-' + Date.now().toString(36);
  const nowStr = new Date().toISOString();

  // Split transcript into discrete sentences or logical task clauses
  const rawSentences = transcript
    .split(/(?<=[.!?])\s+|(?:\s*,\s*|\s+)and\s+(?:also\s+|then\s+)?(?=(?:scrape|automate|build|schedule|draft|set up|call|create|check|review|send)\b)|(?<=\b(?:also|and then|another thing|next item|in addition|plus)\b[,:\s]+)/i)
    .map(s => s.trim())
    .filter(s => s.length > 15);

  const sentences = rawSentences.length > 0 ? rawSentences : [transcript];
  const createdTasks: TaskItem[] = [];
  const taskIds: string[] = [];

  for (let i = 0; i < sentences.length; i++) {
    const text = sentences[i];
    const textLower = text.toLowerCase();

    // Skip purely conversational filler
    if (/^(hi|hello|hey assistant|testing|good morning|thanks|okay)\b/i.test(text) && text.length < 30) {
      continue;
    }

    // Determine category
    let category: TaskItem['category'] = 'Tech/Dev';
    if (/invoice|receipt|finance|tax|accounting|revenue|stripe|billing|cost/i.test(textLower)) category = 'Finance';
    else if (/marketing|sales|lead|growth|campaign|funnel|ad\b/i.test(textLower)) category = 'Marketing & Sales';
    else if (/client|customer|deal|contract|partner|onboard/i.test(textLower)) category = 'Client Projects';
    else if (/strategy|business|competitor|pricing|roadmap|investor/i.test(textLower)) category = 'Business & Strategy';
    else if (/personal|health|gym|doctor|home|grocer|workout|sleep/i.test(textLower)) category = 'Personal & Health';
    else if (/admin|ops|vendor|legal|facility|clean/i.test(textLower)) category = 'Operations & Admin';

    // Feasibility & Dual Priority
    let feasibility: TaskItem['feasibility'] = 'ai_automated';
    let feasibilityReasoning = 'Task can be automated end-to-end with code scripts, APIs, or AI scrapers.';
    let assignee: TaskItem['assignee'] = 'AI Agent';
    let manualHours = 8;
    let autoInvest = 3;
    let hoursWon = 16;

    if (/meet|call|talk|personally|negotiat|doctor|physical|dinner|lunch|sign\b/i.test(textLower)) {
      feasibility = 'human_only';
      feasibilityReasoning = 'Requires human physical presence, executive relationship nuance, or legal signature.';
      assignee = 'Andrew';
      manualHours = 4;
      autoInvest = 0.5;
      hoursWon = 4;
    } else if (/draft|review|approve|collaborat|signoff|check/i.test(textLower)) {
      feasibility = 'hybrid';
      feasibilityReasoning = 'AI produces 90% of the draft/analysis; human reviews and executes final approval.';
      assignee = 'Hybrid';
      manualHours = 6;
      autoInvest = 1.5;
      hoursWon = 10;
    }

    const blueprint = generateAutomationBlueprint(text, text, category);
    const taskId = 'task-' + Date.now().toString(36) + '-' + (i + 1);

    const taskTitle = text.length > 65 ? text.substring(0, 62) + '...' : text;

    const task: TaskItem = {
      id: taskId,
      memoId,
      title: taskTitle,
      description: text,
      category,
      userPriority: /urgent|asap|critical|emergency|immediately/i.test(textLower) ? 'urgent' : /high|important|vital/i.test(textLower) ? 'high' : 'medium',
      aiPriority: feasibility === 'ai_automated' ? 'critical' : 'high',
      priorityRationale: `Evaluated high ROI leverage (${blueprint.recurringHoursSavedPerMonth}h/mo recurring savings against ${blueprint.estimatedHoursToBuild}h automated setup).`,
      feasibility,
      feasibilityReasoning,
      valueScore: Math.floor(Math.random() * 3) + 7, // 7 to 9
      estimatedValue: `$${(blueprint.recurringHoursSavedPerMonth * 120).toLocaleString()}/mo Impact`,
      manualHoursEstimate: manualHours,
      automationHoursInvested: autoInvest,
      timeWonBackHours: hoursWon,
      status: feasibility === 'ai_automated' ? 'in_progress' : 'backlog',
      startDate: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dueDate: new Date(Date.now() + (i + 5) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      durationDays: 5,
      progressPercent: feasibility === 'ai_automated' ? 30 : 0,
      dependencies: i > 0 && createdTasks[i - 1] ? [createdTasks[i - 1].id] : [],
      assignee,
      automationBlueprint: blueprint,
      createdAt: nowStr,
      updatedAt: nowStr
    };

    db.createTask(task);
    createdTasks.push(task);
    taskIds.push(taskId);
  }

  // Create VoiceMemo record
  const memo: VoiceMemo = {
    id: memoId,
    title: `Voice Memo: ${createdTasks[0]?.title.substring(0, 40) || 'Audio Note'}`,
    durationSeconds: Math.max(15, Math.round(transcript.split(' ').length * 0.4)),
    recordedAt: nowStr,
    transcript,
    status: 'analyzed',
    extractedTaskIds: taskIds,
    extractedActionCardIds: [],
    summary: `Extracted ${createdTasks.length} actionable items across ${[...new Set(createdTasks.map(t => t.category))].join(', ')}.`,
    source
  };

  db.createMemo(memo);

  return { memo, createdTasks };
}
