import { telemetry } from './telemetryLogger';
import { toolDispatcher } from './toolDispatcher';

export interface LocalCommandResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface LocalFileResult {
  success: boolean;
  content: string;
  size: number;
  error?: string;
}

export interface LoopbackStatus {
  connected: boolean;
  port: number;
  version?: string;
  latencyMs?: number;
  error?: string;
}

export class LoopbackBridge {
  private port: number = 4040;
  private mockHandler: ((action: string, payload: any) => Promise<any>) | null = null;

  constructor() {
    this.registerTools();
  }

  public setPort(port: number): void {
    this.port = port;
  }

  public getPort(): number {
    return this.port;
  }

  public setMockHandler(handler: ((action: string, payload: any) => Promise<any>) | null): void {
    this.mockHandler = handler;
  }

  private getBaseUrl(): string {
    return `http://127.0.0.1:${this.port}`;
  }

  private registerTools(): void {
    toolDispatcher.registerTool(
      {
        name: 'execute_local_shell',
        description: 'Executes a verified developer command on the local desktop via the loopback daemon.',
        parameters: {
          type: 'object',
          properties: {
            command: { type: 'string', description: 'The shell command to execute' }
          },
          required: ['command']
        }
      },
      async (args) => {
        return this.executeLocalCommand(args.command);
      }
    );

    toolDispatcher.registerTool(
      {
        name: 'read_local_workspace_file',
        description: 'Reads a local file path on the host machine via the sovereign loopback daemon.',
        parameters: {
          type: 'object',
          properties: {
            filePath: { type: 'string', description: 'Absolute or relative file path to read' }
          },
          required: ['filePath']
        }
      },
      async (args) => {
        return this.readLocalFile(args.filePath);
      }
    );
  }

  /**
   * Health check to ping the sovereign loopback daemon.
   */
  public async checkConnection(): Promise<LoopbackStatus> {
    if (this.mockHandler) {
      return this.mockHandler('ping', {});
    }

    const start = Date.now();
    try {
      const res = await fetch(`${this.getBaseUrl()}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(1500)
      });
      if (res.ok) {
        const data = await res.json();
        return {
          connected: true,
          port: this.port,
          version: data.version || '1.0.0',
          latencyMs: Date.now() - start
        };
      }
      return { connected: false, port: this.port, error: `HTTP ${res.status}` };
    } catch (err) {
      return { connected: false, port: this.port, error: 'Daemon offline or unreachable' };
    }
  }

  /**
   * Executes a command via the loopback daemon.
   */
  public async executeLocalCommand(command: string, timeoutMs: number = 10000): Promise<LocalCommandResult> {
    telemetry.log('event', { action: 'executing_local_command', command });

    if (this.mockHandler) {
      return this.mockHandler('exec', { command, timeoutMs });
    }

    try {
      const res = await fetch(`${this.getBaseUrl()}/api/exec`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, timeoutMs }),
        signal: AbortSignal.timeout(timeoutMs + 1000)
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      return {
        success: data.exitCode === 0,
        exitCode: data.exitCode,
        stdout: data.stdout || '',
        stderr: data.stderr || ''
      };
    } catch (err) {
      telemetry.log('error', { source: 'LoopbackBridge', message: String(err) });
      return {
        success: false,
        exitCode: -1,
        stdout: '',
        stderr: `Local loopback execution failed: ${String(err)}`
      };
    }
  }

  /**
   * Reads a file on the local host machine.
   */
  public async readLocalFile(filePath: string): Promise<LocalFileResult> {
    if (this.mockHandler) {
      return this.mockHandler('readFile', { filePath });
    }

    try {
      const res = await fetch(`${this.getBaseUrl()}/api/file?path=${encodeURIComponent(filePath)}`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      return {
        success: true,
        content: data.content || '',
        size: data.size || 0
      };
    } catch (err) {
      return {
        success: false,
        content: '',
        size: 0,
        error: String(err)
      };
    }
  }
}

export const loopbackBridge = new LoopbackBridge();
