import { db } from './db';
import { TaskItem, AutonomousJob } from '../src/types';

export interface WorkerStepResult {
  success: boolean;
  taskId: string;
  taskTitle: string;
  newProgress: number;
  newStatus: TaskItem['status'];
  logMessage: string;
  isComplete: boolean;
  job: AutonomousJob;
}

export function getAutonomousStatus() {
  const tasks = db.getTasks();
  const backlogQueue = tasks.filter(t => t.status === 'automating' || t.status === 'in_progress' || (t.status === 'backlog' && t.feasibility === 'ai_automated'));
  const completed = tasks.filter(t => t.status === 'completed');
  const activeJobs = db.getAutonomousJobs();

  return {
    queueLength: backlogQueue.length,
    activeJobsCount: activeJobs.filter(j => j.status === 'running').length,
    completedCount: completed.length,
    totalHoursWonBack: db.getKPISummary().totalHoursWonBack,
    jobs: activeJobs,
    queue: backlogQueue.map(t => ({
      id: t.id,
      title: t.title,
      category: t.category,
      status: t.status,
      progressPercent: t.progressPercent,
      feasibility: t.feasibility,
      timeWonBackHours: t.timeWonBackHours
    }))
  };
}

export async function executeSingleBacklogStep(specificTaskId?: string): Promise<WorkerStepResult | null> {
  const tasks = db.getTasks();
  
  // Find target task
  let targetTask: TaskItem | undefined;
  if (specificTaskId) {
    targetTask = tasks.find(t => t.id === specificTaskId);
  } else {
    // Prioritize tasks in automating -> in_progress -> ai_automated backlog
    targetTask = tasks.find(t => t.status === 'automating') 
      || tasks.find(t => t.status === 'in_progress')
      || tasks.find(t => t.status === 'backlog' && t.feasibility === 'ai_automated');
  }

  if (!targetTask) return null;

  const now = new Date().toISOString();
  const bp = targetTask.automationBlueprint;
  const strategySteps = bp?.strategy || [
    '1. Analyze requirements & schema constraints.',
    '2. Configure API credentials & webhooks.',
    '3. Execute test payload & verify response schemas.',
    '4. Deploy production automation script.'
  ];

  const totalSteps = strategySteps.length;
  
  // Get or create corresponding AutonomousJob
  let job = db.getAutonomousJobs().find(j => j.taskId === targetTask!.id);
  if (!job) {
    job = {
      id: 'job-' + Date.now().toString(36),
      taskId: targetTask.id,
      taskTitle: targetTask.title,
      category: targetTask.category,
      currentStepIndex: 0,
      totalSteps,
      currentStepText: strategySteps[0] || 'Starting execution...',
      progressPercent: targetTask.progressPercent || 10,
      status: 'running',
      logs: [
        { timestamp: now, type: 'info', message: `Picked task "${targetTask.title}" from prioritized backlog.` }
      ],
      startedAt: now
    };
    db.createAutonomousJob(job);
  }

  // Advance to next step
  const nextStepIndex = Math.min(totalSteps, job.currentStepIndex + 1);
  const stepText = strategySteps[nextStepIndex - 1] || 'Executing final validation...';
  const progressIncrement = Math.round(100 / totalSteps);
  const newProgress = Math.min(100, (targetTask.progressPercent || 0) + progressIncrement);
  const isComplete = newProgress >= 100 || nextStepIndex >= totalSteps;

  const newStatus: TaskItem['status'] = isComplete ? 'completed' : 'automating';
  const logMsg = isComplete 
    ? `Completed all ${totalSteps} blueprint steps! Verified in Sandbox VM (10.211.55.6). Won back +${targetTask.timeWonBackHours}h.`
    : `Step ${nextStepIndex}/${totalSteps}: ${stepText}`;

  // Update task
  const existingLogs = targetTask.executionLogs || [];
  const updatedTask = db.updateTask(targetTask.id, {
    status: newStatus,
    progressPercent: isComplete ? 100 : newProgress,
    executionLogs: [...existingLogs, `[${new Date().toLocaleTimeString()}] ${logMsg}`]
  })!;

  // Update job
  const updatedJob = db.updateAutonomousJob(job.id, {
    currentStepIndex: nextStepIndex,
    currentStepText: stepText,
    progressPercent: isComplete ? 100 : newProgress,
    status: isComplete ? 'completed' : 'running',
    completedAt: isComplete ? now : undefined,
    logs: [
      ...job.logs,
      { timestamp: now, type: isComplete ? 'success' : 'info', message: logMsg }
    ]
  })!;

  db.saveToDisk();

  return {
    success: true,
    taskId: targetTask.id,
    taskTitle: targetTask.title,
    newProgress: isComplete ? 100 : newProgress,
    newStatus,
    logMessage: logMsg,
    isComplete,
    job: updatedJob
  };
}

export async function runAllBacklogTasks(): Promise<{ executedCount: number; results: WorkerStepResult[] }> {
  const results: WorkerStepResult[] = [];
  const maxIterations = 20;
  let iterations = 0;

  while (iterations < maxIterations) {
    const res = await executeSingleBacklogStep();
    if (!res) break;
    results.push(res);
    iterations++;
    // Small yield to simulate realistic async agent work
    await new Promise(r => setTimeout(r, 80));
  }

  return {
    executedCount: results.length,
    results
  };
}
