import { weatherService } from '../../services/weatherService';
import { executiveProfile } from '../brain/executiveProfile';
import { eveVectorStore } from '../brain/eveVectorStore';
import { telemetry } from './telemetryLogger';

export interface BriefingResult {
  spokenBriefing: string;
  weatherSummary: string;
  activeProjects: string[];
  pendingTasks: string[];
  timestamp: number;
}

export class BriefingEngine {
  async generateMorningBriefing(): Promise<BriefingResult> {
    telemetry.log('event', { action: 'generating_morning_briefing' });

    // 1. Fetch live meteorological status
    let weatherSummary = "Mild with partly cloudy skies and comfortable temperatures.";
    try {
      const weatherReport = await weatherService.getWeather('Hoeilaart');
      weatherSummary = weatherReport.spokenSummary;
    } catch {
      weatherSummary = "In Hoeilaart and Brussels, it is mild with partly cloudy skies.";
    }

    // 2. Fetch ground-truth profile
    const profile = executiveProfile.getProfile();
    const activeProjects = Object.entries(profile.active_projects).map(([k, v]) => `${k} (${v})`);

    // 3. Retrieve recent pending tasks/deliverables
    const taskMemories = eveVectorStore.search('task decision priority', 3);
    const pendingTasks = taskMemories.map(m => m.item.text);

    // 4. Compose spoken executive briefing
    const now = new Date();
    const timeGreeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
    
    let spoken = `${timeGreeting} Andrew. ${weatherSummary}`;
    if (activeProjects.length > 0) {
      spoken += ` Primary focus areas are ${Object.keys(profile.active_projects).slice(0, 2).join(' and ')}.`;
    }
    if (pendingTasks.length > 0) {
      spoken += ` You have key active notes: ${pendingTasks.slice(0, 2).join('; ')}.`;
    }
    spoken += ` I am standing by for your next instruction.`;

    telemetry.log('event', { action: 'morning_briefing_ready', pendingCount: pendingTasks.length });

    return {
      spokenBriefing: spoken,
      weatherSummary,
      activeProjects,
      pendingTasks,
      timestamp: Date.now()
    };
  }
}

export const briefingEngine = new BriefingEngine();
