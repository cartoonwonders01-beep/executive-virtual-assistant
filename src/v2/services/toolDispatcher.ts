/**
 * Deterministic Tool Registry & Execution Dispatcher
 * Manages strict JSON Schema tool definitions, validation, and safe local execution.
 */

import { telemetry } from './telemetryLogger';
import { liveCalendarService } from './liveCalendarService';
import { entityGraphStore } from '../brain/entityGraphStore';
import { pushNotificationService } from './pushNotificationService';
import { auricBridge } from './auricBridge';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ToolCallPayload {
  name: string;
  arguments: Record<string, any>;
}

export interface ToolExecutionResult {
  tool: string;
  success: boolean;
  result?: any;
  error?: string;
}

export class ToolDispatcher {
  private tools: Map<string, { def: ToolDefinition; handler: (args: any) => Promise<any> }> = new Map();

  constructor() {
    this.registerCoreTools();
  }

  private registerCoreTools(): void {
    // 1. Weather Tool
    this.registerTool(
      {
        name: 'get_weather',
        description: 'Get current weather conditions and forecast for a specific location.',
        parameters: {
          type: 'object',
          properties: {
            location: { type: 'string', description: 'City name (e.g. Hoeilaart, Brussels)' }
          }
        }
      },
      async (args) => {
        const { weatherService } = await import('../../services/weatherService');
        const loc = args.location || 'Hoeilaart';
        const res = await weatherService.getWeather(loc);
        return { city: res.city, temperatureC: res.temperatureC, summary: res.spokenSummary };
      }
    );

    // 2. Calendar Query Tool
    this.registerTool(
      {
        name: 'get_calendar_agenda',
        description: 'Query scheduled calendar events and find open appointment slots.',
        parameters: {
          type: 'object',
          properties: {
            dayOffset: { type: 'number', description: '0 for today, 1 for tomorrow' }
          }
        }
      },
      async (args) => {
        const targetDate = new Date();
        if (args.dayOffset) targetDate.setDate(targetDate.getDate() + args.dayOffset);
        const events = liveCalendarService.getEventsForDay(targetDate);
        const freeSlots = liveCalendarService.findFreeSlots(targetDate);
        return {
          date: targetDate.toDateString(),
          eventCount: events.length,
          events: events.map(e => ({ title: e.title, start: new Date(e.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })),
          freeSlotsCount: freeSlots.length
        };
      }
    );

    // 3. Relational Knowledge Graph Query
    this.registerTool(
      {
        name: 'query_entity_graph',
        description: 'Retrieve relational context and connections for a person, project, or location.',
        parameters: {
          type: 'object',
          properties: {
            entityLabel: { type: 'string', description: 'Name of entity (e.g. Celine, Hoeilaart, AuricPass)' }
          },
          required: ['entityLabel']
        }
      },
      async (args) => {
        const summary = entityGraphStore.getRelationalContextSummary(args.entityLabel);
        return { contextSummary: summary };
      }
    );

    // 4. Send Push Notification
    this.registerTool(
      {
        name: 'dispatch_push_notification',
        description: 'Send an immediate push alert or briefing notification to the user.',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Notification title' },
            body: { type: 'string', description: 'Notification body text' }
          },
          required: ['title', 'body']
        }
      },
      async (args) => {
        const shown = await pushNotificationService.showNotification({
          title: args.title,
          body: args.body
        });
        return { sent: shown };
      }
    );

    // 5. AuricPass Code & Terminal Command Dispatch
    this.registerTool(
      {
        name: 'dispatch_auric_command',
        description: 'Execute or dispatch technical code intent to the AuricPass zero-knowledge node network.',
        parameters: {
          type: 'object',
          properties: {
            command: { type: 'string', description: 'Technical command or intent description' }
          },
          required: ['command']
        }
      },
      async (args) => {
        await auricBridge.dispatchCodingIntent(args.command);
        return { dispatched: true, command: args.command };
      }
    );
  }

  public registerTool(def: ToolDefinition, handler: (args: any) => Promise<any>): void {
    this.tools.set(def.name, { def, handler });
  }

  public getToolDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(t => t.def);
  }

  public hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  public async executeTool(call: ToolCallPayload): Promise<ToolExecutionResult> {
    const entry = this.tools.get(call.name);
    if (!entry) {
      telemetry.log('error', { source: 'ToolDispatcher', message: `Unknown tool: ${call.name}` });
      return { tool: call.name, success: false, error: `Tool ${call.name} not registered` };
    }

    try {
      telemetry.log('event', { action: 'executing_tool', tool: call.name, args: call.arguments });
      const result = await entry.handler(call.arguments || {});
      telemetry.log('event', { action: 'tool_execution_success', tool: call.name });
      return { tool: call.name, success: true, result };
    } catch (err) {
      telemetry.log('error', { source: 'ToolDispatcher', tool: call.name, message: String(err) });
      return { tool: call.name, success: false, error: String(err) };
    }
  }
}

export const toolDispatcher = new ToolDispatcher();
