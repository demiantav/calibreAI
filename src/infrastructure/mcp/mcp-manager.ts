import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../../shared/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MCP_SERVER_SCRIPT = path.resolve(
  __dirname,
  '../../domains/agent-core/mcp-connector/gmail-mcp-server.ts',
);
const NODE_OPTIONS = '--experimental-modules --es-module-specifier-resolution=node';

interface McpResponse {
  jsonrpc: string;
  id: number;
  result?: any;
  error?: any;
}

class McpManager {
  private static instance: McpManager;
  private mcpProcess: ChildProcessWithoutNullStreams | null = null;
  private isInitializedPromise: Promise<void> | null = null;
  private resolveInitialized: (() => void) | null = null;
  private rejectInitialized: ((reason?: any) => void) | null = null;
  private nextId = 1;
  private responseCallbacks: Map<
    number,
    { resolve: (value: any) => void; reject: (reason?: any) => void }
  > = new Map();
  private responseBuffer = '';

  private constructor() {
    this.isInitializedPromise = new Promise((resolve, reject) => {
      this.resolveInitialized = resolve;
      this.rejectInitialized = reject;
    });
    this.spawnServer();
  }

  public static getInstance(): McpManager {
    if (!McpManager.instance) {
      McpManager.instance = new McpManager();
    }
    return McpManager.instance;
  }

  private spawnServer(): void {
    console.log('[McpManager] Spawning MCP server process...');
    this.mcpProcess = spawn('npx', ['tsx', MCP_SERVER_SCRIPT], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NODE_OPTIONS,
        SUPABASE_URL: config.SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: config.SUPABASE_SERVICE_ROLE_KEY,
        GMAIL_CLIENT_ID: config.GMAIL_CLIENT_ID,
        GMAIL_CLIENT_SECRET: config.GMAIL_CLIENT_SECRET,
      },
    });

    this.mcpProcess.stdout.on('data', this.handleStdOut.bind(this));
    this.mcpProcess.stderr.on('data', this.handleStdErr.bind(this));
    this.mcpProcess.on('close', this.handleClose.bind(this));
    this.mcpProcess.on('error', this.handleError.bind(this));

    // Send MCP initialize request after a short delay to let the process start
    setTimeout(() => {
      if (this.mcpProcess?.stdin.writable) {
        const initRequest = JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'calibre-mcp-client', version: '1.0.0' },
          },
        }) + '\n';
        this.mcpProcess.stdin.write(initRequest);
      }
    }, 1000);
  }

  private handleStdOut(data: Buffer): void {
    this.responseBuffer += data.toString();
    const lines = this.responseBuffer.split('\n');
    this.responseBuffer = lines.pop() || '';

    for (let message of lines) {
      if (!message.trim()) continue;

      let parsed: McpResponse | null = null;
      try {
        parsed = JSON.parse(message);
      } catch {
        const start = message.indexOf('{');
        if (start >= 0) {
          let end = message.lastIndexOf('}');
          while (end >= start) {
            try {
              parsed = JSON.parse(message.substring(start, end + 1));
              break;
            } catch {
              end = message.lastIndexOf('}', end - 1);
            }
          }
        }
      }
      if (!parsed) continue;

      if (parsed.id && this.responseCallbacks.has(parsed.id)) {
        const { resolve, reject } = this.responseCallbacks.get(parsed.id)!;
        if (parsed.error) {
          console.error(`[McpManager] MCP tool error for ID ${parsed.id}:`, parsed.error);
          reject(new Error(`MCP Error: ${parsed.error.message || JSON.stringify(parsed.error)}`));
        } else {
          resolve(parsed.result);
        }
        this.responseCallbacks.delete(parsed.id);
      } else if (parsed.id === 1 && parsed.result && this.resolveInitialized) {
        console.log('[McpManager] MCP server initialized successfully.');
        this.resolveInitialized();
        this.resolveInitialized = null;
        this.rejectInitialized = null;
        if (this.mcpProcess?.stdin.writable) {
          const notif = JSON.stringify({
            jsonrpc: '2.0',
            method: 'notifications/initialized',
          }) + '\n';
          this.mcpProcess.stdin.write(notif);
        }
      } else if (parsed.error && this.rejectInitialized) {
        console.error('[McpManager] MCP server initialization failed:', parsed.error);
        this.rejectInitialized(
          new Error(`MCP Init Error: ${parsed.error.message || JSON.stringify(parsed.error)}`),
        );
        this.resolveInitialized = null;
        this.rejectInitialized = null;
      }
    }
  }

  private handleStdErr(data: Buffer): void {
    const errorMsg = data.toString();
    console.error(`[McpManager STDERR]: ${errorMsg}`);
    if (errorMsg.includes('ERR_MODULE_NOT_FOUND') && this.rejectInitialized) {
      this.rejectInitialized(new Error(`MCP Server failed to start: ${errorMsg}`));
      this.rejectInitialized = null;
      this.resolveInitialized = null;
    }
  }

  private handleError(error: Error): void {
    console.error('[McpManager] Process error:', error);
    if (this.rejectInitialized) {
      this.rejectInitialized(error);
      this.resolveInitialized = null;
      this.rejectInitialized = null;
    }
    this.responseCallbacks.forEach(({ reject }) => reject(error));
    this.responseCallbacks.clear();
    this.mcpProcess = null;
  }

  private handleClose(code: number | null): void {
    console.warn(`[McpManager] MCP process closed with code ${code}`);
    if (code !== 0 && this.rejectInitialized) {
      this.rejectInitialized(new Error(`MCP process exited unexpectedly with code ${code}`));
      this.resolveInitialized = null;
      this.rejectInitialized = null;
    }
    this.responseCallbacks.forEach(({ reject }) =>
      reject(new Error(`MCP process exited with code ${code}`)),
    );
    this.responseCallbacks.clear();
    this.mcpProcess = null;
  }

  public async ensureInitialized(): Promise<void> {
    if (!this.mcpProcess) {
      // If process was killed or never started, restart it.
      console.log('[McpManager] MCP process not running, respawning...');
      this.isInitializedPromise = new Promise((resolve, reject) => {
        this.resolveInitialized = resolve;
        this.rejectInitialized = reject;
      });
      this.spawnServer();
    }
    return this.isInitializedPromise!;
  }

  private recoverProcess(): void {
    console.warn('[McpManager] Recuperando proceso MCP...');
    if (this.mcpProcess) {
      this.mcpProcess.kill();
      this.mcpProcess = null;
    }
    this.isInitializedPromise = new Promise((resolve, reject) => {
      this.resolveInitialized = resolve;
      this.rejectInitialized = reject;
    });
    this.responseCallbacks.clear();
    this.spawnServer();
  }

  public async callTool(toolName: string, args: any, timeoutMs = 30000): Promise<any> {
    await this.ensureInitialized();

    const callId = this.nextId++;
    const payload =
      JSON.stringify({
        jsonrpc: '2.0',
        id: callId,
        method: 'tools/call',
        params: { name: toolName, arguments: args },
      }) + '\n';

    return new Promise((resolve, reject) => {
      const wrappedReject = (reason: any) => {
        clearTimeout(timeoutId);
        console.error(`[McpManager] callTool error en ${toolName}:`, reason);
        this.recoverProcess();
        reject(reason);
      };

      const resolveCleanup = (value: any) => {
        clearTimeout(timeoutId);
        resolve(value);
      };

      this.responseCallbacks.set(callId, { resolve: resolveCleanup, reject: wrappedReject });

      if (!this.mcpProcess || !this.mcpProcess.stdin) {
        this.responseCallbacks.delete(callId);
        this.recoverProcess();
        reject(new Error('MCP process not available or stdin not writable.'));
        return;
      }

      this.mcpProcess.stdin.write(payload);

      const timeoutId = setTimeout(() => {
        this.responseCallbacks.delete(callId);
        this.recoverProcess();
        reject(new Error(`MCP tool call '${toolName}' timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });
  }

  public async healthCheck(): Promise<boolean> {
    if (!this.mcpProcess || !this.isInitializedPromise) {
      return false;
    }
    try {
      // A simple way to check health is to attempt initialization again.
      // If it succeeds quickly, it's healthy. If it errors or times out, it's not.
      await Promise.race([
        this.ensureInitialized(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Health check timed out')), 5000),
        ),
      ]);
      return true;
    } catch (e) {
      console.error('[McpManager] Health check failed:', e);
      return false;
    }
  }

  public async shutdown(): Promise<void> {
    if (this.mcpProcess) {
      console.log('[McpManager] Shutting down MCP process...');
      this.mcpProcess.stdin.end();
      this.mcpProcess.kill();
      this.mcpProcess = null;
      this.isInitializedPromise = null;
      this.resolveInitialized = null;
      this.rejectInitialized = null;
      this.responseCallbacks.clear();
    }
  }
}

let _instance: McpManager | null = null;

function getInstance(): McpManager {
  if (!_instance) {
    _instance = McpManager.getInstance();
  }
  return _instance;
}

export const mcpManager = new Proxy<McpManager>({} as McpManager, {
  get(_, prop) {
    const instance = getInstance();
    const value = instance[prop as keyof McpManager];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});
