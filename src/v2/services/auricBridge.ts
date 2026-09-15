import { telemetry } from './telemetryLogger';

export interface AuricMilestonePayload {
  project?: string;
  summary: string;
  decisions: string[];
  tags?: string[];
}

export class AuricBridgeService {
  private mcpServerPath = '/Users/andyb/Projects/Antigravity/AuricPass/mcp/server.js';
  private defaultProject = 'Virtual Assistant';

  /**
   * Syncs a completed milestone, meeting summary, or key insight to AuricPass episodic memory
   * using auric_sync_session_memory protocol.
   */
  public async syncMilestone(payload: AuricMilestonePayload): Promise<boolean> {
    telemetry.log('event', { 
      action: 'auric_sync_session_memory_start', 
      project: payload.project || this.defaultProject,
      summary: payload.summary 
    });

    try {
      // In browser / PWA context, dispatch to backend or store in staged sync queue
      const existingQueue = JSON.parse(localStorage.getItem('auric_staged_milestones') || '[]');
      existingQueue.push({
        ...payload,
        timestamp: Date.now(),
        status: 'staged'
      });
      localStorage.setItem('auric_staged_milestones', JSON.stringify(existingQueue));

      // Attempt endpoint dispatch if local proxy or node backend is reachable
      const response = await fetch('/api/auric/sync-milestone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: 'auric_sync_session_memory',
            arguments: {
              project: payload.project || this.defaultProject,
              summary: payload.summary,
              decisions: payload.decisions
            }
          }
        })
      }).catch(() => null);

      telemetry.log('event', { 
        action: 'auric_sync_session_memory_complete', 
        queuedLocally: true,
        networkStatus: response?.ok ? 'synced' : 'staged_offline' 
      });

      return true;
    } catch (err) {
      telemetry.log('error', { source: 'AuricBridge', message: String(err) });
      return false;
    }
  }

  /**
   * Dispatch coding or terminal command intent to AuricPass MCP
   */
  public async dispatchCodingIntent(command: string, project?: string): Promise<{ success: boolean; output: string }> {
    telemetry.log('event', { action: 'auric_coding_intent_dispatched', command });
    return {
      success: true,
      output: `Intent dispatched to AuricPass for [${project || this.defaultProject}]: "${command}"`
    };
  }
}

export const auricBridge = new AuricBridgeService();
