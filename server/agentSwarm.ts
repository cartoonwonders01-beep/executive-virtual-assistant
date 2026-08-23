import { db } from './db';
import { SwarmAgent, SwarmStatus, AgentActivityLog, SwarmAgentId, TaskItem } from '../src/types';
import { executeSingleBacklogStep } from './autonomousWorker';

const SWARM_AGENTS: SwarmAgent[] = [
  {
    id: 'chief_of_staff',
    name: 'Executive Chief of Staff',
    role: 'Calendar conflict coordinator & VIP triage',
    avatar: '👔',
    status: 'idle',
    assignedDomain: 'Business & Strategy',
    tasksCompletedCount: 14,
    hoursWonBack: 180,
    efficiencyRating: '99.2%',
    lastActiveAt: new Date().toISOString(),
    recentLog: 'Resolved 2 calendar overlaps; synchronized BigQuery ledger.'
  },
  {
    id: 'finance_agent',
    name: 'Financial OCR & Invoicing Agent',
    role: 'Billing email parser & Stripe ledger reconciliation',
    avatar: '💼',
    status: 'idle',
    assignedDomain: 'Finance',
    tasksCompletedCount: 22,
    hoursWonBack: 264,
    efficiencyRating: '98.8%',
    lastActiveAt: new Date().toISOString(),
    recentLog: 'Parsed 12 supplier PDFs into Google Sheets accounting table.'
  },
  {
    id: 'tech_agent',
    name: 'Tech & Cloud DevOps Agent',
    role: 'Playwright competitor scrapers & sandbox script runner',
    avatar: '💻',
    status: 'idle',
    assignedDomain: 'Tech/Dev',
    tasksCompletedCount: 31,
    hoursWonBack: 420,
    efficiencyRating: '99.5%',
    lastActiveAt: new Date().toISOString(),
    recentLog: 'Executed Playwright scraper on Linux Sandbox VM (10.211.55.6).'
  },
  {
    id: 'growth_agent',
    name: 'Growth & Stakeholder Agent',
    role: 'Executive weekly digests & client intake pipelines',
    avatar: '📈',
    status: 'idle',
    assignedDomain: 'Marketing & Sales',
    tasksCompletedCount: 18,
    hoursWonBack: 196,
    efficiencyRating: '97.6%',
    lastActiveAt: new Date().toISOString(),
    recentLog: 'Compiled Friday investor digest from Git and Stripe metrics.'
  }
];

let activityLogs: AgentActivityLog[] = [
  {
    id: 'log-1',
    agentId: 'tech_agent',
    agentName: 'Tech & Cloud DevOps Agent',
    actionType: 'scraper_run',
    message: 'Executed Playwright headless browser check on sandbox VM. 0 errors.',
    timestamp: new Date(Date.now() - 300000).toISOString()
  },
  {
    id: 'log-2',
    agentId: 'finance_agent',
    agentName: 'Financial OCR & Invoicing Agent',
    actionType: 'invoice_parse',
    message: 'Extracted PDF line items and updated monthly VAT ledger.',
    timestamp: new Date(Date.now() - 600000).toISOString()
  }
];

export function getSwarmStatus(): SwarmStatus {
  const tasks = db.getTasks();
  const activeTasks = tasks.filter(t => t.status === 'automating' || t.status === 'in_progress');
  const totalHours = db.getKPISummary().totalHoursWonBack;

  // Update current task titles on agents
  SWARM_AGENTS.forEach(agent => {
    const matchedTask = activeTasks.find(t => t.category === agent.assignedDomain);
    if (matchedTask) {
      agent.currentTaskTitle = matchedTask.title;
      agent.currentTaskId = matchedTask.id;
      agent.status = 'active';
    } else {
      agent.currentTaskTitle = undefined;
      agent.currentTaskId = undefined;
      agent.status = 'idle';
    }
  });

  return {
    isRunning: true,
    agents: SWARM_AGENTS,
    activeTasksCount: activeTasks.length,
    totalHoursWonBack: totalHours,
    recentLogs: activityLogs.slice(0, 15)
  };
}

export async function triggerSwarmCycle(): Promise<{
  cycleCompleted: boolean;
  newLogs: AgentActivityLog[];
  completedCount: number;
}> {
  const newLogs: AgentActivityLog[] = [];
  let completedCount = 0;

  for (const agent of SWARM_AGENTS) {
    const tasks = db.getTasks();
    const targetTask = tasks.find(
      t => t.category === agent.assignedDomain && (t.status === 'automating' || t.status === 'in_progress' || (t.status === 'backlog' && t.feasibility === 'ai_automated'))
    );

    if (targetTask) {
      agent.status = 'active';
      const stepRes = await executeSingleBacklogStep(targetTask.id);
      if (stepRes && stepRes.success) {
        agent.tasksCompletedCount += stepRes.isComplete ? 1 : 0;
        agent.hoursWonBack += stepRes.isComplete ? targetTask.timeWonBackHours : 0;
        agent.lastActiveAt = new Date().toISOString();
        agent.recentLog = stepRes.logMessage;

        const newLog: AgentActivityLog = {
          id: 'log-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5),
          agentId: agent.id,
          agentName: agent.name,
          actionType: 'task_exec',
          message: `[${agent.assignedDomain}] ${stepRes.logMessage}`,
          timestamp: new Date().toISOString()
        };

        newLogs.unshift(newLog);
        activityLogs.unshift(newLog);
        if (stepRes.isComplete) completedCount++;
      }
    }
  }

  return {
    cycleCompleted: true,
    newLogs,
    completedCount
  };
}
