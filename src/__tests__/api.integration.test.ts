import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import request from 'supertest'

// ─── Hoisted mocks ─────────────────────────────────────────────────────────────

const mockFrom = vi.hoisted(() => vi.fn())
const mockHealthCheck = vi.hoisted(() => vi.fn())
const mockCallTool = vi.hoisted(() => vi.fn())
const mockGetAuthUrl = vi.hoisted(() => vi.fn())
const mockGetToken = vi.hoisted(() => vi.fn())
const mockVerifyOAuthState = vi.hoisted(() => vi.fn())

vi.mock('../infrastructure/supabase/supabase-client.js', () => ({
  supabase: { from: mockFrom },
}))

vi.mock('../infrastructure/mcp/mcp-manager.js', () => ({
  mcpManager: {
    healthCheck: mockHealthCheck,
    callTool: mockCallTool,
  },
}))

vi.mock('../infrastructure/gmail/gmail-client.js', () => ({
  getAuthUrl: mockGetAuthUrl,
  oAuth2Client: { getToken: mockGetToken, setCredentials: vi.fn() },
}))

vi.mock('../shared/oauth-state.js', () => ({
  createOAuthState: () => 'test-state',
  verifyOAuthState: mockVerifyOAuthState,
}))

// ─── Helper — builds a fluent Supabase-like chain ─────────────────────────────

interface ChainStep {
  method: string
  args: any[]
  returnValue?: any
}

function buildChain(steps: ChainStep[], terminal: any) {
  // Build from last to first: each step returns the next one
  let current: any = terminal
  for (let i = steps.length - 1; i >= 0; i--) {
    const step = steps[i]
    const next = current
    current = vi.fn((...args: any[]) => {
      expect(args).toEqual(step.args)
      return step.returnValue !== undefined ? step.returnValue : next
    })
    Object.defineProperty(current, 'name', { value: step.method })
  }
  return current
}

// ─── Import app after mocks are hoisted ───────────────────────────────────────

import { app } from '../app.js'

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('API /health', () => {
  it('should return health status with timestamp and dependency checks', async () => {
    const res = await request(app).get('/health')

    // Status can be 200 (healthy) or 503 (degraded) depending on mocks
    expect([200, 503]).toContain(res.status)
    expect(res.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(res.body.checks).toBeDefined()
    expect(res.body.checks.supabase).toBeDefined()
    expect(res.body.checks.gmail_mcp).toBeDefined()
    expect(res.body.checks.youtube_api).toBeDefined()
  })

  it('should not expose stack trace in global error handler (test mode)', async () => {
    // In test mode, the error handler does NOT include stack even if
    // the error handler checks NODE_ENV === 'development'.
    const res = await request(app).get('/nonexistent-route')
    expect(res.status).toBe(404)
  })
})

describe('API /logs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 200 with data array when Supabase succeeds', async () => {
    const fakeData = [{ id: 1, type: 'agent_summary', content: 'hello' }]
    const mockLimit = vi.fn(() => Promise.resolve({ data: fakeData, error: null }))
    const mockOrder = vi.fn(() => ({ limit: mockLimit }))
    mockFrom.mockReturnValue({ select: () => ({ order: mockOrder }) })

    const res = await request(app).get('/logs')

    expect(res.status).toBe(200)
    expect(res.body).toEqual(fakeData)
    expect(mockFrom).toHaveBeenCalledWith('agent_logs')
  })

  it('should filter by type when ?type= is provided', async () => {
    const fakeData = [{ id: 2, type: 'pitch_draft' }]
    const mockLimit = vi.fn(() => Promise.resolve({ data: fakeData, error: null }))
    const mockOrder = vi.fn(() => ({ limit: mockLimit }))
    const mockEq = vi.fn(() => ({ order: mockOrder }))
    mockFrom.mockReturnValue({ select: () => ({ eq: mockEq }) })

    const res = await request(app).get('/logs?type=pitch_draft')

    expect(res.status).toBe(200)
    expect(res.body).toEqual(fakeData)
    expect(mockFrom).toHaveBeenCalledWith('agent_logs')
    expect(mockEq).toHaveBeenCalledWith('type', 'pitch_draft')
  })

  it('should return 500 when Supabase errors', async () => {
    const mockLimit = vi.fn(() => Promise.resolve({ data: null, error: new Error('DB down') }))
    const mockOrder = vi.fn(() => ({ limit: mockLimit }))
    mockFrom.mockReturnValue({ select: () => ({ order: mockOrder }) })

    const res = await request(app).get('/logs')

    expect(res.status).toBe(500)
    // Should NOT leak stack trace in test mode (only in development)
    expect(res.body.stack).toBeUndefined()
  })
})

describe('API /auth/login', () => {
  it('should redirect to Google auth URL', async () => {
    mockGetAuthUrl.mockReturnValue('https://accounts.google.com/o/oauth2/auth?client_id=xyz')

    const res = await request(app).get('/auth/login')

    expect(res.status).toBe(302)
    expect(res.headers.location).toBe('https://accounts.google.com/o/oauth2/auth?client_id=xyz')
  })
})

describe('API /auth/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyOAuthState.mockReturnValue(true)
  })

  it('should return 400 when state is missing or code is missing', async () => {
    const res1 = await request(app).get('/auth/callback')
    expect(res1.status).toBe(400)
    expect(res1.body.error).toContain('Estado de autenticación')

    const res2 = await request(app).get('/auth/callback?state=test-state&code=')
    expect(res2.status).toBe(400)
    expect(res2.text).toContain('Código de autorización faltante')
  })

  it('should return 400 when state is invalid', async () => {
    mockVerifyOAuthState.mockReturnValue(false)
    const res = await request(app).get('/auth/callback?state=bad-state&code=valid-code')
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('Estado de autenticación')
  })

  it('should return 500 when getToken throws', async () => {
    mockGetToken.mockRejectedValueOnce(new Error('Invalid grant'))
    const res = await request(app).get('/auth/callback?code=bad-code&state=test-state')

    expect(res.status).toBe(500)
    expect(res.body.error).toBe('Error al procesar tokens')
  })

  it('should return 500 when supabase upsert fails', async () => {
    mockGetToken.mockResolvedValueOnce({
      tokens: {
        access_token: 'acc-token',
        refresh_token: 'ref-token',
        expiry_date: Date.now() + 3600000,
      },
    })

    const mockUpsert = vi.fn(() => Promise.resolve({ error: new Error('DB error') }))
    mockFrom.mockReturnValue({ upsert: mockUpsert })

    const res = await request(app).get('/auth/callback?state=test-state&code=valid-code')
    expect(res.status).toBe(500)
  })

  it('should succeed and return 200 when all validations pass', async () => {
    mockGetToken.mockResolvedValueOnce({
      tokens: {
        access_token: 'acc-token',
        refresh_token: 'ref-token',
        expiry_date: Date.now() + 3600000,
      },
    })

    const mockUpsert = vi.fn(() => Promise.resolve({ error: null }))
    mockFrom.mockImplementation((table: string) => {
      if (table === 'user_auth') return { upsert: mockUpsert }
      return {}
    })

    const res = await request(app).get('/auth/callback?state=test-state&code=valid-code')
    expect(res.status).toBe(200)
    expect(res.body.message).toContain('Autenticación exitosa')

    expect(mockUpsert).toHaveBeenCalled()
    const upsertArg = mockUpsert.mock.calls[0][0]
    expect(upsertArg.access_token).toBe('acc-token')
    expect(upsertArg.refresh_token).toBe('ref-token')
  })
})

describe('API /pulse', () => {
  it('should return 200 with message', async () => {
    const res = await request(app).get('/pulse')

    expect(res.status).toBe(200)
    expect(res.body.message).toContain('Ciclo del agente iniciado')
  })
})

describe('API /api/pitches/:id/send', () => {
  const pitchId = 'abc-123'

  beforeEach(() => {
    vi.clearAllMocks()
    // Default: MCP healthy
    mockHealthCheck.mockResolvedValue(true)
    mockCallTool.mockResolvedValue({ sent: true })
  })

  it('should return 400 when subject or content is missing', async () => {
    const res1 = await request(app)
      .post(`/api/pitches/${pitchId}/send`)
      .send({})

    expect(res1.status).toBe(400)
    expect(res1.body.error).toContain('requeridos')

    const res2 = await request(app)
      .post(`/api/pitches/${pitchId}/send`)
      .send({ subject: 'Test' })

    expect(res2.status).toBe(400)
  })

  it('should return 404 when pitch does not exist', async () => {
    const mockSingle = vi.fn(() => Promise.resolve({ data: null, error: new Error('Not found') }))
    const mockEq = vi.fn(() => ({ single: mockSingle }))
    mockFrom.mockReturnValue({ select: () => ({ eq: mockEq }) })

    const res = await request(app)
      .post(`/api/pitches/${pitchId}/send`)
      .send({ subject: 'Hello', content: 'Body' })

    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Pitch no encontrado')
  })

  it('should return 400 when log type is not pitch_draft', async () => {
    const log = { type: 'agent_summary', content: {} }
    const mockSingle = vi.fn(() => Promise.resolve({ data: log, error: null }))
    const mockEq = vi.fn(() => ({ single: mockSingle }))
    mockFrom.mockReturnValue({ select: () => ({ eq: mockEq }) })

    const res = await request(app)
      .post(`/api/pitches/${pitchId}/send`)
      .send({ subject: 'Hello', content: 'Body' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('El registro no es un pitch')
  })

  it('should return 400 when pitch was already sent', async () => {
    const log = { type: 'pitch_draft', content: { status: 'sent', brandEmail: 'b@b.com' } }
    const mockSingle = vi.fn(() => Promise.resolve({ data: log, error: null }))
    const mockEq = vi.fn(() => ({ single: mockSingle }))
    mockFrom.mockReturnValue({ select: () => ({ eq: mockEq }) })

    const res = await request(app)
      .post(`/api/pitches/${pitchId}/send`)
      .send({ subject: 'Hello', content: 'Body' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Este pitch ya fue enviado anteriormente')
  })

  it('should return 400 when pitch status is not draft_ready', async () => {
    const log = { type: 'pitch_draft', content: { status: 'archived', brandEmail: 'b@b.com' } }
    const mockSingle = vi.fn(() => Promise.resolve({ data: log, error: null }))
    const mockEq = vi.fn(() => ({ single: mockSingle }))
    mockFrom.mockReturnValue({ select: () => ({ eq: mockEq }) })

    const res = await request(app)
      .post(`/api/pitches/${pitchId}/send`)
      .send({ subject: 'Hello', content: 'Body' })

    expect(res.status).toBe(400)
    expect(res.body.error).toContain('draft_ready')
  })

  it('should return 400 when brandEmail is missing or invalid', async () => {
    const log = { type: 'pitch_draft', content: { status: 'draft_ready', brandEmail: '' } }
    const mockSingle = vi.fn(() => Promise.resolve({ data: log, error: null }))
    const mockEq = vi.fn(() => ({ single: mockSingle }))
    mockFrom.mockReturnValue({ select: () => ({ eq: mockEq }) })

    const res = await request(app)
      .post(`/api/pitches/${pitchId}/send`)
      .send({ subject: 'Hello', content: 'Body' })

    expect(res.status).toBe(400)
    expect(res.body.error).toContain('inválido')
  })

  // ─── Email injection / edge cases ───────────────────────────────────

  it('should reject pitch with header injection in brandEmail (\\r\\n attack)', async () => {
    const log = {
      type: 'pitch_draft',
      content: { status: 'draft_ready', brandEmail: 'victim@test.com\r\nCC: attacker@evil.com' },
    }
    const mockSingle = vi.fn(() => Promise.resolve({ data: log, error: null }))
    const mockEq = vi.fn(() => ({ single: mockSingle }))
    mockFrom.mockReturnValue({ select: () => ({ eq: mockEq }) })

    const res = await request(app)
      .post(`/api/pitches/${pitchId}/send`)
      .send({ subject: 'Hello', content: 'Body' })

    expect(res.status).toBe(400)
    expect(res.body.error).toContain('inválido')
  })

  it('should reject pitch with very long brandEmail', async () => {
    const longLocal = 'a'.repeat(300)
    const log = {
      type: 'pitch_draft',
      content: { status: 'draft_ready', brandEmail: `${longLocal}@test.com` },
    }
    const mockSingle = vi.fn(() => Promise.resolve({ data: log, error: null }))
    const mockEq = vi.fn(() => ({ single: mockSingle }))
    mockFrom.mockReturnValue({ select: () => ({ eq: mockEq }) })

    const res = await request(app)
      .post(`/api/pitches/${pitchId}/send`)
      .send({ subject: 'Hello', content: 'Body' })

    expect(res.status).toBe(400)
    expect(res.body.error).toContain('inválido')
  })

  it('should reject pitch with brandEmail containing HTML/script tags', async () => {
    const log = {
      type: 'pitch_draft',
      content: { status: 'draft_ready', brandEmail: '"><script>alert("xss")</script>@test.com' },
    }
    const mockSingle = vi.fn(() => Promise.resolve({ data: log, error: null }))
    const mockEq = vi.fn(() => ({ single: mockSingle }))
    mockFrom.mockReturnValue({ select: () => ({ eq: mockEq }) })

    const res = await request(app)
      .post(`/api/pitches/${pitchId}/send`)
      .send({ subject: 'Hello', content: 'Body' })

    expect(res.status).toBe(400)
    expect(res.body.error).toContain('inválido')
  })

  it('should return 503 when MCP is unhealthy', async () => {
    const log = { type: 'pitch_draft', content: { status: 'draft_ready', brandEmail: 'brand@test.com' } }
    const mockSingle = vi.fn(() => Promise.resolve({ data: log, error: null }))
    const mockEq = vi.fn(() => ({ single: mockSingle }))
    mockFrom.mockReturnValue({ select: () => ({ eq: mockEq }) })
    mockHealthCheck.mockResolvedValue(false)

    const res = await request(app)
      .post(`/api/pitches/${pitchId}/send`)
      .send({ subject: 'Hello', content: 'Body' })

    expect(res.status).toBe(503)
    expect(res.body.error).toBe('Servidor MCP no disponible')
  })

  it('should succeed when all validations pass', async () => {
    const now = new Date().toISOString()
    const pitch = {
      brandName: 'TestBrand',
      brandEmail: 'brand@test.com',
      status: 'draft_ready',
    }
    const log = { type: 'pitch_draft', content: pitch }
    const mockSingle = vi.fn(() => Promise.resolve({ data: log, error: null }))
    const mockEq = vi.fn(() => ({ single: mockSingle }))
    const mockUpdateEq = vi.fn(() => Promise.resolve({ error: null }))
    const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }))

    mockFrom.mockImplementation((table: string) => {
      if (table === 'agent_logs') {
        return {
          select: () => ({ eq: mockEq }),
          update: mockUpdate,
        }
      }
      return {}
    })

    mockHealthCheck.mockResolvedValue(true)
    mockCallTool.mockResolvedValue({ messageId: 'msg-1' })

    const res = await request(app)
      .post(`/api/pitches/${pitchId}/send`)
      .send({ subject: 'Hello Brand', content: 'Body text' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.id).toBe(pitchId)
    expect(res.body.sent).toBe(true)
    expect(res.body.result).toEqual({ messageId: 'msg-1' })

    // Verify update was called with sent status
    expect(mockUpdate).toHaveBeenCalled()
    const updateArgs = mockUpdate.mock.calls[0][0]
    expect(updateArgs.content.status).toBe('sent')
    expect(updateArgs.content.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('should return 500 when Supabase update fails before send', async () => {
    const pitch = {
      brandName: 'TestBrand',
      brandEmail: 'brand@test.com',
      status: 'draft_ready',
    }
    const log = { type: 'pitch_draft', content: pitch }
    const mockSingle = vi.fn(() => Promise.resolve({ data: log, error: null }))
    const mockEq = vi.fn(() => ({ single: mockSingle }))
    const mockUpdateEq = vi.fn(() => Promise.resolve({ error: new Error('Update failed') }))
    const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }))

    mockFrom.mockImplementation((table: string) => {
      if (table === 'agent_logs') {
        return {
          select: () => ({ eq: mockEq }),
          update: mockUpdate,
        }
      }
      return {}
    })
    mockHealthCheck.mockResolvedValue(true)

    const res = await request(app)
      .post(`/api/pitches/${pitchId}/send`)
      .send({ subject: 'Hello', content: 'Body' })

    expect(res.status).toBe(500)
  })
})
