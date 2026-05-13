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
      stdio: ['pipe', 'pipe', 'pipe'], // stdin, stdout, stderr
      env: {
        ...process.env,
        NODE_OPTIONS,
        // Pass necessary env vars for MCP server authentication/connection
        SUPABASE_URL: config.SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: config.SUPABASE_SERVICE_ROLE_KEY,
        GMAIL_CLIENT_ID: config.GMAIL_CLIENT_ID,
        GMAIL_CLIENT_SECRET: config.GMAIL_CLIENT_SECRET,
        // Ensure the user email used in ensureAuthenticated is available if needed, or hardcode/load it.
        // For now, hardcoded in gmail-mcp-server.ts, but could be passed here too.
      },
    });

    this.mcpProcess.stdout.on('data', this.handleStdOut.bind(this));
    this.mcpProcess.stderr.on('data', this.handleStdErr.bind(this));
    this.mcpProcess.on('close', this.handleClose.bind(this));
    this.mcpProcess.on('error', this.handleError.bind(this));
  }

  private handleStdOut(data: Buffer): void {
    this.responseBuffer += data.toString();
    const messages = this.responseBuffer
      .split(
        `
`,
      )
      .filter(Boolean); // Corregido el literal de cadena usando template literal
    this.responseBuffer = messages.pop() || '';

    for (const message of messages) {
      try {
        const parsed: McpResponse = JSON.parse(message);
        if (parsed.id && this.responseCallbacks.has(parsed.id)) {
          const { resolve, reject } = this.responseCallbacks.get(parsed.id)!;
          if (parsed.error) {
            console.error(`[McpManager] MCP tool error for ID ${parsed.id}:`, parsed.error);
            reject(
              new Error(`MCP Error: ${parsed.error.message || JSON.stringify(parsed.error)}`),
            );
          } else {
            resolve(parsed.result);
          }
          this.responseCallbacks.delete(parsed.id);
        } else if (parsed.id === 1 && parsed.result && this.resolveInitialized) {
          // Initialization successful
          console.log('[McpManager] MCP server initialized successfully.');
          this.resolveInitialized();
          this.resolveInitialized = null;
          this.rejectInitialized = null;
        } else if (parsed.error && this.rejectInitialized) {
          // Initialization failed
          console.error('[McpManager] MCP server initialization failed:', parsed.error);
          this.rejectInitialized(
            new Error(`MCP Init Error: ${parsed.error.message || JSON.stringify(parsed.error)}`),
          );
          this.resolveInitialized = null;
          this.rejectInitialized = null;
        }
      } catch (e) {
        // Not a valid JSON message, likely console logs from the server itself.
        // console.log('[McpManager] Non-JSON stdout:', message);
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
    // If we get a critical error, reject any pending calls
    this.responseCallbacks.forEach(({ reject }) =>
      reject(new Error(`MCP process error: ${errorMsg}`)),
    );
    this.responseCallbacks.clear();
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

  public async callTool(toolName: string, args: any, timeoutMs = 30000): Promise<any> {
    await this.ensureInitialized();

    const callId = this.nextId++;
    const payload =
      JSON.stringify({
        jsonrpc: '2.0',
        id: callId,
        method: toolName,
        params: args,
      }) +
      `
`;

    return new Promise((resolve, reject) => {
      this.responseCallbacks.set(callId, { resolve, reject });

      if (this.mcpProcess && this.mcpProcess.stdin) {
        this.mcpProcess.stdin.write(payload);
      } else {
        const error = new Error('MCP process not available or stdin not writable.');
        reject(error);
        this.responseCallbacks.delete(callId);
      }

      const timeoutId = setTimeout(() => {
        const err = new Error(`MCP tool call '${toolName}' timed out after ${timeoutMs}ms`);
        reject(err);
        this.responseCallbacks.delete(callId);
        // Potentially kill the process if it's consistently timing out
      }, timeoutMs);

      // Clean up timeout when promise settles
      const originalResolve = resolve;
      const originalReject = reject;
      resolve = (value) => {
        clearTimeout(timeoutId);
        originalResolve(value);
      };
      reject = (reason) => {
        clearTimeout(timeoutId);
        originalReject(reason);
      };
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

export const mcpManager = McpManager.getInstance();
