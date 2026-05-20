import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EventEmitter } from 'events'

// ─── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('child_process', () => ({
  spawn: vi.fn(),
}))

vi.mock('../../../shared/config.js', () => ({
  config: {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role',
    GMAIL_CLIENT_ID: 'test-client-id',
    GMAIL_CLIENT_SECRET: 'test-client-secret',
  },
}))

import { spawn } from 'child_process'
import { McpManager } from '../mcp-manager.js'

// ─── Helpers ────────────────────────────────────────────────────────────────

function createMockProcess() {
  const proc = new EventEmitter() as any
  proc.stdin = { write: vi.fn(), end: vi.fn(), writable: true }
  proc.stdout = new EventEmitter()
  proc.stderr = new EventEmitter()
  proc.kill = vi.fn()
  return proc
}

function makeFreshInstance(proc?: any): McpManager {
  const p = proc ?? createMockProcess()
  vi.mocked(spawn).mockReturnValue(p)
  return new (McpManager as any)() as McpManager
}

/**
 * Create an instance and complete the init handshake:
 * 1. Advance timers to send the initialize request
 * 2. Emit the init response on stdout
 * After this, the instance is fully initialized and ready for callTool etc.
 */
function makeInitializedInstance(proc: any, advanceTimers = true): McpManager {
  const inst = makeFreshInstance(proc)
  if (advanceTimers) {
    vi.advanceTimersByTime(1000)
    // Clear the init request from write mock so callTool assertions are clean
    proc.stdin.write.mockClear()
  }
  // Emit init response (id=1)
  proc.stdout.emit(
    'data',
    Buffer.from(
      JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        result: { protocolVersion: '2024-11-05' },
      }) + '\n',
    ),
  )
  // Clear write mock again (notifications/initialized is sent after init)
  if (advanceTimers) {
    proc.stdin.write.mockClear()
  }
  return inst
}

/**
 * Create an instance where init is manually resolved (no setTimeout/event loop needed).
 * This allows callTool's `await ensureInitialized()` to resolve synchronously.
 */
function makeInstanceManuallyInitialized(proc: any): McpManager {
  const inst = makeFreshInstance(proc)
  const resolveInit = (inst as any).resolveInitialized as (() => void) | null
  if (resolveInit) {
    resolveInit()
    ;(inst as any).resolveInitialized = null
    ;(inst as any).rejectInitialized = null
  }
  return inst
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('McpManager', () => {
  let mockProc: any

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: false })
    mockProc = createMockProcess()
    vi.mocked(spawn).mockReset()
    vi.mocked(spawn).mockReturnValue(mockProc)
    ;(McpManager as any).instance = null
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── Constructor & spawnServer ──────────────────────────────────────────

  describe('constructor & spawnServer', () => {
    it('calls spawn with npx tsx and env vars', () => {
      makeFreshInstance(mockProc)

      expect(spawn).toHaveBeenCalledWith(
        'npx',
        ['tsx', expect.stringContaining('gmail-mcp-server')],
        expect.objectContaining({
          stdio: ['pipe', 'pipe', 'pipe'],
          env: expect.objectContaining({
            NODE_OPTIONS: expect.stringContaining('experimental-modules'),
            SUPABASE_URL: 'https://test.supabase.co',
          }),
        }),
      )
    })

    it('attaches stdout, stderr, close, and error handlers', () => {
      makeFreshInstance(mockProc)

      expect(mockProc.stdout.listenerCount('data')).toBeGreaterThanOrEqual(1)
      expect(mockProc.stderr.listenerCount('data')).toBeGreaterThanOrEqual(1)
      expect(mockProc.listenerCount('close')).toBeGreaterThanOrEqual(1)
      expect(mockProc.listenerCount('error')).toBeGreaterThanOrEqual(1)
    })

    it('schedules initialize request 1 second after spawn', () => {
      makeFreshInstance(mockProc)

      expect(mockProc.stdin.write).not.toHaveBeenCalled()

      vi.advanceTimersByTime(1000)

      expect(mockProc.stdin.write).toHaveBeenCalledWith(
        expect.stringContaining('"method":"initialize"'),
      )
    })

    it('does not send init request if stdin not writable', () => {
      mockProc.stdin.writable = false
      makeFreshInstance(mockProc)

      vi.advanceTimersByTime(1000)

      expect(mockProc.stdin.write).not.toHaveBeenCalled()
    })

    it('resolves init promise on valid init response', () => {
      const inst = makeFreshInstance(mockProc)
      vi.advanceTimersByTime(1000)

      mockProc.stdout.emit(
        'data',
        Buffer.from(
          JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            result: { protocolVersion: '2024-11-05' },
          }) + '\n',
        ),
      )

      return expect(
        (inst as any).isInitializedPromise,
      ).resolves.toBeUndefined()
    })
  })

  // ── handleStdOut ─────────────────────────────────────────────────────────

  describe('handleStdOut', () => {
    it('resolves callback for valid JSON-RPC result response', async () => {
      const inst = makeFreshInstance(mockProc)
      vi.advanceTimersByTime(1000)
      mockProc.stdin.write.mockClear()

      return new Promise<void>(resolveTest => {
        const cb = {
          resolve: vi.fn((val: any) => {
            expect(val).toEqual({ success: true })
            expect(cb.reject).not.toHaveBeenCalled()
            resolveTest()
          }),
          reject: vi.fn(),
        }
        ;(inst as any).responseCallbacks.set(42, cb)

        mockProc.stdout.emit(
          'data',
          Buffer.from(
            JSON.stringify({
              jsonrpc: '2.0',
              id: 42,
              result: { success: true },
            }) + '\n',
          ),
        )
      })
    })

    it('rejects callback for JSON-RPC error response', async () => {
      const inst = makeFreshInstance(mockProc)
      vi.advanceTimersByTime(1000)
      mockProc.stdin.write.mockClear()

      return new Promise<void>(resolveTest => {
        const cb = {
          resolve: vi.fn(),
          reject: vi.fn((err: Error) => {
            expect(err.message).toContain('tool error')
            expect(cb.resolve).not.toHaveBeenCalled()
            resolveTest()
          }),
        }
        ;(inst as any).responseCallbacks.set(42, cb)

        mockProc.stdout.emit(
          'data',
          Buffer.from(
            JSON.stringify({
              jsonrpc: '2.0',
              id: 42,
              error: { code: -1, message: 'tool error' },
            }) + '\n',
          ),
        )
      })
    })

    it('resolves init promise and sends notifications/initialized on id=1 success', () => {
      const inst = makeFreshInstance(mockProc)
      vi.advanceTimersByTime(1000)
      mockProc.stdin.write.mockClear()

      mockProc.stdout.emit(
        'data',
        Buffer.from(
          JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            result: { protocolVersion: '2024-11-05' },
          }) + '\n',
        ),
      )

      expect(mockProc.stdin.write).toHaveBeenCalledWith(
        expect.stringContaining('notifications/initialized'),
      )
      expect((inst as any).resolveInitialized).toBeNull()
    })

    it('rejects init promise on initialize error', async () => {
      const inst = makeFreshInstance(mockProc)

      mockProc.stdout.emit(
        'data',
        Buffer.from(
          JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            error: { code: -32000, message: 'init failed' },
          }) + '\n',
        ),
      )

      await expect((inst as any).isInitializedPromise).rejects.toThrow(
        'MCP Init Error: init failed',
      )
    })

    it('handles multiple JSON messages in a single buffer', async () => {
      const inst = makeFreshInstance(mockProc)
      vi.advanceTimersByTime(1000)
      mockProc.stdin.write.mockClear()

      return new Promise<void>(resolveTest => {
        const cb1 = { resolve: vi.fn(), reject: vi.fn() }
        const cb2 = {
          resolve: vi.fn((val: any) => {
            expect(val).toEqual({ result: 'second' })
            expect(cb1.resolve).toHaveBeenCalledWith({ result: 'first' })
            resolveTest()
          }),
          reject: vi.fn(),
        }

        ;(inst as any).responseCallbacks.set(10, cb1)
        ;(inst as any).responseCallbacks.set(20, cb2)

        const payload =
          JSON.stringify({
            jsonrpc: '2.0',
            id: 10,
            result: { result: 'first' },
          }) +
          '\n' +
          JSON.stringify({
            jsonrpc: '2.0',
            id: 20,
            result: { result: 'second' },
          }) +
          '\n'

        mockProc.stdout.emit('data', Buffer.from(payload))
      })
    })

    it('recovers JSON embedded in noisy output via fallback extraction', async () => {
      const inst = makeFreshInstance(mockProc)
      vi.advanceTimersByTime(1000)
      mockProc.stdin.write.mockClear()

      return new Promise<void>(resolveTest => {
        const cb = {
          resolve: vi.fn((val: any) => {
            expect(val).toEqual({ ok: true })
            resolveTest()
          }),
          reject: vi.fn(),
        }
        ;(inst as any).responseCallbacks.set(99, cb)

        // Must end with \n for the line-split parser to process it
        mockProc.stdout.emit(
          'data',
          Buffer.from(
            'noise [INFO] {"jsonrpc":"2.0","id":99,"result":{"ok":true}} junk\n',
          ),
        )
      })
    })

    it('ignores empty lines and whitespace-only lines', () => {
      const inst = makeFreshInstance(mockProc)

      expect(() => {
        mockProc.stdout.emit('data', Buffer.from('\n\n  \n'))
      }).not.toThrow()
    })

    it('ignores messages with no registered callback', () => {
      const inst = makeFreshInstance(mockProc)
      vi.advanceTimersByTime(1000)

      expect(() => {
        mockProc.stdout.emit(
          'data',
          Buffer.from(
            JSON.stringify({ jsonrpc: '2.0', id: 999, result: {} }) + '\n',
          ),
        )
      }).not.toThrow()
    })
  })

  // ── handleStdErr ─────────────────────────────────────────────────────────

  describe('handleStdErr', () => {
    it('detects ERR_MODULE_NOT_FOUND and rejects init', async () => {
      const inst = makeFreshInstance(mockProc)

      mockProc.stderr.emit(
        'data',
        Buffer.from('Error [ERR_MODULE_NOT_FOUND]: Cannot find module'),
      )

      await expect((inst as any).isInitializedPromise).rejects.toThrow(
        'MCP Server failed to start',
      )
    })

    it('ignores non-critical stderr output', () => {
      const inst = makeFreshInstance(mockProc)

      expect(() => {
        mockProc.stderr.emit(
          'data',
          Buffer.from('Warning: some deprecation notice'),
        )
      }).not.toThrow()
    })

    it('ignores ERR_MODULE_NOT_FOUND when init already resolved', () => {
      const inst = makeFreshInstance(mockProc)
      vi.advanceTimersByTime(1000)
      // Complete init
      mockProc.stdout.emit(
        'data',
        Buffer.from(
          JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            result: { protocolVersion: '2024-11-05' },
          }) + '\n',
        ),
      )

      expect(() => {
        mockProc.stderr.emit(
          'data',
          Buffer.from('Error [ERR_MODULE_NOT_FOUND]: late failure'),
        )
      }).not.toThrow()
    })
  })

  // ── handleClose ──────────────────────────────────────────────────────────

  describe('handleClose', () => {
    it('rejects pending callbacks and clears state on non-zero exit', () => {
      const inst = makeFreshInstance(mockProc)
      vi.advanceTimersByTime(1000)
      // Complete init so rejectInitialized is null
      mockProc.stdout.emit(
        'data',
        Buffer.from(
          JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            result: { protocolVersion: '2024-11-05' },
          }) + '\n',
        ),
      )

      const reject = vi.fn()
      ;(inst as any).responseCallbacks.set(1, {
        resolve: vi.fn(),
        reject,
      })

      mockProc.emit('close', 1)

      expect(reject).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('code 1'),
        }),
      )
      expect((inst as any).responseCallbacks.size).toBe(0)
      expect((inst as any).mcpProcess).toBeNull()
    })

    it('rejects init promise on non-zero exit during init', async () => {
      const inst = makeFreshInstance(mockProc)

      mockProc.emit('close', 1)

      await expect((inst as any).isInitializedPromise).rejects.toThrow(
        'exited unexpectedly',
      )
    })

    it('clears process state but keeps init unresolved on exit code 0 (clean shutdown)', () => {
      const inst = makeFreshInstance(mockProc)

      mockProc.emit('close', 0)

      expect((inst as any).mcpProcess).toBeNull()
      // resolveInitialized is still set because code 0 doesn't trigger rejection
      expect((inst as any).resolveInitialized).not.toBeNull()
    })
  })

  // ── handleError ──────────────────────────────────────────────────────────

  describe('handleError', () => {
    it('rejects init promise on process error', async () => {
      const inst = makeFreshInstance(mockProc)

      mockProc.emit('error', new Error('spawn failed'))

      await expect((inst as any).isInitializedPromise).rejects.toThrow(
        'spawn failed',
      )
    })

    it('rejects all pending callbacks and clears state on process error after init', () => {
      const inst = makeInitializedInstance(mockProc)

      const reject1 = vi.fn()
      const reject2 = vi.fn()
      ;(inst as any).responseCallbacks.set(1, {
        resolve: vi.fn(),
        reject: reject1,
      })
      ;(inst as any).responseCallbacks.set(2, {
        resolve: vi.fn(),
        reject: reject2,
      })

      mockProc.emit('error', new Error('broken pipe'))

      expect(reject1).toHaveBeenCalled()
      expect(reject2).toHaveBeenCalled()
      expect((inst as any).responseCallbacks.size).toBe(0)
      expect((inst as any).mcpProcess).toBeNull()
    })
  })

  // ── callTool ─────────────────────────────────────────────────────────────

  describe('callTool', () => {
    describe('with real timers (success/error/stdin-null flows)', () => {
      let inst: McpManager

      beforeEach(() => {
        // Use real timers for these tests - init is manually resolved
        vi.useRealTimers()
        inst = makeInstanceManuallyInitialized(mockProc)
      })

      it('sends a tools/call request and resolves on response', async () => {
        const promise = inst.callTool('send_email', { to: 'test@example.com' })

        // Let microtask queue drain so callTool passes await ensureInitialized()
        await new Promise(r => setTimeout(r, 0))

        expect(mockProc.stdin.write).toHaveBeenCalledWith(
          expect.stringContaining('"method":"tools/call"'),
        )
        expect(mockProc.stdin.write).toHaveBeenCalledWith(
          expect.stringContaining('send_email'),
        )

        // First callTool uses id=1 (nextId starts at 1, init hardcoded id=1 doesn't consume it)
        mockProc.stdout.emit(
          'data',
          Buffer.from(
            JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              result: { sent: true, messageId: 'abc123' },
            }) + '\n',
          ),
        )

        const result = await promise
        expect(result).toEqual({ sent: true, messageId: 'abc123' })
      })

      it('rejects when process stdin is not available', async () => {
        ;(inst as any).mcpProcess.stdin = null
        // Prevent recoverProcess from spawning a real process
        vi.spyOn(inst as any, 'recoverProcess').mockImplementation(() => {})

        await expect(inst.callTool('bad_tool', {})).rejects.toThrow('not available')
      })

      it('rejects on error response from server', async () => {
        const promise = inst.callTool('failing_tool', {})

        await new Promise(r => setTimeout(r, 0))

        // First callTool uses id=1
        mockProc.stdout.emit(
          'data',
          Buffer.from(
            JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              error: { code: -32600, message: 'Invalid params' },
            }) + '\n',
          ),
        )

        await expect(promise).rejects.toThrow('Invalid params')
      })

      it('increments callId for sequential calls', async () => {
        inst.callTool('tool_a', {})
        inst.callTool('tool_b', {})

        await new Promise(r => setTimeout(r, 0))

        // First call gets id=1, second gets id=2
        expect(mockProc.stdin.write).toHaveBeenCalledWith(
          expect.stringContaining('"id":1'),
        )
        expect(mockProc.stdin.write).toHaveBeenCalledWith(
          expect.stringContaining('"id":2'),
        )
      })
    })

    describe('with fake timers (timeout flows)', () => {
      it('times out after timeoutMs with no response', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: false })
        const timed = makeInstanceManuallyInitialized(mockProc)

        const promise = timed.callTool('slow_tool', {}, 1000)

        // Use async version to properly flush microtasks
        await vi.advanceTimersByTimeAsync(0)

        // Verify stdin.write was called (tool request sent)
        expect(mockProc.stdin.write).toHaveBeenCalledWith(
          expect.stringContaining('slow_tool'),
        )

        // Advance past the timeout
        vi.advanceTimersByTime(1000)

        await expect(promise).rejects.toThrow('timed out after 1000ms')

        vi.useRealTimers()
      })

      it('triggers recoverProcess on timeout', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: false })
        const timed = makeInstanceManuallyInitialized(mockProc)

        const recoverSpy = vi.spyOn(timed as any, 'recoverProcess')

        const promise = timed.callTool('slow_tool', {}, 500)
        await vi.advanceTimersByTimeAsync(0)
        vi.advanceTimersByTime(500)

        await expect(promise).rejects.toThrow('timed out')
        expect(recoverSpy).toHaveBeenCalled()

        vi.useRealTimers()
        recoverSpy.mockRestore()
      })
    })
  })

  // ── healthCheck ──────────────────────────────────────────────────────────

  describe('healthCheck', () => {
    it('returns true when process is initialized', async () => {
      const inst = makeInitializedInstance(mockProc)

      const result = await inst.healthCheck()
      expect(result).toBe(true)
    })

    it('returns false when no process exists', async () => {
      const inst = makeFreshInstance(mockProc)
      ;(inst as any).mcpProcess = null
      ;(inst as any).isInitializedPromise = null

      const result = await inst.healthCheck()
      expect(result).toBe(false)
    })

    it('returns false when health check times out', async () => {
      const inst = makeFreshInstance(mockProc)

      const healthPromise = inst.healthCheck()
      vi.advanceTimersByTime(5000)

      const result = await healthPromise
      expect(result).toBe(false)
    })
  })

  // ── shutdown ─────────────────────────────────────────────────────────────

  describe('shutdown', () => {
    it('kills process and clears all internal state', async () => {
      const inst = makeFreshInstance(mockProc)
      vi.advanceTimersByTime(1000)

      await inst.shutdown()

      expect(mockProc.stdin.end).toHaveBeenCalled()
      expect(mockProc.kill).toHaveBeenCalled()
      expect((inst as any).mcpProcess).toBeNull()
      expect((inst as any).isInitializedPromise).toBeNull()
      expect((inst as any).responseCallbacks.size).toBe(0)
    })

    it('is a no-op when no process is running', async () => {
      const inst = makeFreshInstance(mockProc)
      ;(inst as any).mcpProcess = null

      await expect(inst.shutdown()).resolves.toBeUndefined()
    })
  })

  // ── ensureInitialized ────────────────────────────────────────────────────

  describe('ensureInitialized', () => {
    it('respawns process when mcpProcess is null', () => {
      const inst = makeFreshInstance(mockProc)
      vi.advanceTimersByTime(1000)
      ;(inst as any).mcpProcess = null

      inst.ensureInitialized()

      expect(spawn).toHaveBeenCalledTimes(2)
    })

    it('returns a promise that resolves to undefined when process is alive', async () => {
      const inst = makeFreshInstance(mockProc)
      vi.advanceTimersByTime(1000)

      // Complete init so the promise resolves
      mockProc.stdout.emit(
        'data',
        Buffer.from(
          JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            result: { protocolVersion: '2024-11-05' },
          }) + '\n',
        ),
      )

      // ensureInitialized returns a Promise (wrapped by async) that resolves
      const result = await inst.ensureInitialized()
      expect(result).toBeUndefined()
    })
  })

  // ── recoverProcess ───────────────────────────────────────────────────────

  describe('recoverProcess', () => {
    it('kills old process, creates new init promise, clears callbacks, spawns new process', () => {
      const inst = makeFreshInstance(mockProc)
      vi.advanceTimersByTime(1000)
      // Add a pending callback
      ;(inst as any).responseCallbacks.set(7, {
        resolve: vi.fn(),
        reject: vi.fn(),
      })

      const newProc = createMockProcess()
      vi.mocked(spawn).mockReturnValue(newProc)

      ;(inst as any).recoverProcess()

      expect(mockProc.kill).toHaveBeenCalled()
      // New process was spawned
      expect(spawn).toHaveBeenCalledTimes(2)
      // Pending callbacks cleared
      expect((inst as any).responseCallbacks.size).toBe(0)
      // New process is set
      expect((inst as any).mcpProcess).not.toBeNull()
      expect((inst as any).mcpProcess).toBe(newProc)
    })
  })

  // ── getInstance / Singleton ──────────────────────────────────────────────

  describe('getInstance', () => {
    it('returns the same instance on multiple calls', () => {
      const a = McpManager.getInstance()
      const b = McpManager.getInstance()

      expect(a).toBe(b)
    })

    it('does not spawn process until getInstance is called', () => {
      ;(McpManager as any).instance = null

      expect(spawn).not.toHaveBeenCalled()

      McpManager.getInstance()

      expect(spawn).toHaveBeenCalledTimes(1)
    })
  })
})
