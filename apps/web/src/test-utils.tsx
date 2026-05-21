import { type ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render, type RenderResult } from '@testing-library/react'
import { ThemeProvider } from '@/lib/theme'
import { PulseProvider } from '@/lib/pulse-context'

export function renderWithProviders(ui: ReactElement): RenderResult {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <PulseProvider>
          {ui}
        </PulseProvider>
      </ThemeProvider>
    </MemoryRouter>
  )
}

// ─── Legacy helpers (backward-compatible wrappers around createMockFetch) ───

export function mockFetchResponse(data: any, status = 200) {
  const fn = vi.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
    })
  )
  vi.stubGlobal('fetch', fn)
  return fn
}

export function mockFetchNetworkError() {
  const fn = vi.fn(() => Promise.reject(new Error('Network error')))
  vi.stubGlobal('fetch', fn)
  return fn
}

// ─── createMockFetch — robust mock builder for component tests ───

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

interface MockResponse {
  body: any
  status: number
  delayMs: number
  isError: boolean
}

interface CallRecord {
  url: string
  method: string
  body: any
  headers: HeadersInit
}

class MockFetchBuilder {
  private routes = new Map<string, MockResponse[]>()
  private callLog: CallRecord[] = []
  private globalDelay = 0

  private makeKey(method: HttpMethod, urlPattern: string): string {
    return `${method.toLowerCase()}:${urlPattern.toLowerCase()}`
  }

  private matchUrl(pattern: string, actualUrl: string): boolean {
    const p = pattern.toLowerCase()
    const a = actualUrl.toLowerCase()
    // Full match or partial (pattern is a substring)
    return a === p || a.includes(p)
  }

  private findMatchingResponse(method: HttpMethod, url: string): MockResponse | undefined {
    // Try exact key first, then fallback to partial matching
    const exactKey = this.makeKey(method, url)
    const exactQueue = this.routes.get(exactKey)
    if (exactQueue && exactQueue.length > 0) {
      const response = exactQueue.shift()!
      if (exactQueue.length === 0) this.routes.delete(exactKey)
      return response
    }

    // Partial matching by iterating registered patterns
    for (const [key, queue] of this.routes.entries()) {
      if (!key.startsWith(`${method}:`.toLowerCase())) continue
      const pattern = key.slice(method.length + 1)
      if (this.matchUrl(pattern, url) && queue.length > 0) {
        const response = queue.shift()!
        if (queue.length === 0) this.routes.delete(key)
        return response
      }
    }

    return undefined
  }

  private addResponse(method: HttpMethod, urlPattern: string, body: any, status = 200, delayMs = 0, isError = false) {
    const key = this.makeKey(method, urlPattern)
    const queue = this.routes.get(key) || []
    queue.push({ body, status, delayMs: delayMs || this.globalDelay, isError })
    this.routes.set(key, queue)
    return this
  }

  // ── Builder methods ──

  get(urlPattern: string, ...bodies: any[]) {
    bodies.forEach((b) => this.addResponse('GET', urlPattern, b, 200, 0, b instanceof Error))
    return this
  }

  post(urlPattern: string, ...bodies: any[]) {
    bodies.forEach((b) => this.addResponse('POST', urlPattern, b, 200, 0, b instanceof Error))
    return this
  }

  put(urlPattern: string, ...bodies: any[]) {
    bodies.forEach((b) => this.addResponse('PUT', urlPattern, b, 200, 0, b instanceof Error))
    return this
  }

  delete(urlPattern: string, ...bodies: any[]) {
    bodies.forEach((b) => this.addResponse('DELETE', urlPattern, b, 200, 0, b instanceof Error))
    return this
  }

  status(method: HttpMethod, urlPattern: string, statusCode: number, body: any = {}) {
    this.addResponse(method, urlPattern, body, statusCode, 0, false)
    return this
  }

  networkError(method: HttpMethod, urlPattern: string) {
    this.addResponse(method, urlPattern, new Error('Network error'), 0, 0, true)
    return this
  }

  delay(urlPattern: string, ms: number) {
    // Applies to the next response added for this URL (any method)
    // Simplification: we'll apply delay globally or per-response
    this.globalDelay = ms
    return this
  }

  // ── Install & assertions ──

  install() {
    const self = this
    const handler = vi.fn(async (url: string, init?: RequestInit) => {
      const method = (init?.method || 'GET').toUpperCase() as HttpMethod
      const response = self.findMatchingResponse(method, url)

      self.callLog.push({
        url,
        method,
        body: init?.body,
        headers: init?.headers || {},
      })

      if (!response) {
        // No mock configured — return 404 to fail loudly in tests
        return Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: 'No mock configured for ' + url }),
        })
      }

      if (response.delayMs > 0) {
        await new Promise((r) => setTimeout(r, response.delayMs))
      }

      if (response.isError) {
        return Promise.reject(response.body)
      }

      return Promise.resolve({
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        json: () => Promise.resolve(response.body),
      })
    })

    vi.stubGlobal('fetch', handler)
    return self
  }

  // ── Assertions ──

  get calls(): ReadonlyArray<CallRecord> {
    return this.callLog
  }

  get callCount(): number {
    return this.callLog.length
  }

  called(urlPattern: string, method?: HttpMethod): boolean {
    return this.callLog.some(
      (c) =>
        c.url.toLowerCase().includes(urlPattern.toLowerCase()) &&
        (!method || c.method === method)
    )
  }

  callCountFor(urlPattern: string, method?: HttpMethod): number {
    return this.callLog.filter(
      (c) =>
        c.url.toLowerCase().includes(urlPattern.toLowerCase()) &&
        (!method || c.method === method)
    ).length
  }

  lastCall(): CallRecord | undefined {
    return this.callLog[this.callLog.length - 1]
  }

  bodyOf(index: number): any {
    return this.callLog[index]?.body
  }

  reset() {
    this.callLog = []
    this.routes.clear()
    this.globalDelay = 0
  }
}

export function createMockFetch(): MockFetchBuilder {
  return new MockFetchBuilder()
}
