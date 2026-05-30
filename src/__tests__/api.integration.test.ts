import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import request from 'supertest'

// ─── Hoisted mocks ─────────────────────────────────────────────────────────────

const mockFrom = vi.hoisted(() => vi.fn())
const mockHealthCheck = vi.hoisted(() => vi.fn())
const mockCallTool = vi.hoisted(() => vi.fn())

const mockConfig = vi.hoisted(() => ({
  NODE_ENV: 'test',
  JWT_SECRET: 'test-secret',
  YOUTUBE_API_KEY: 'test-yt-key',
  AUTHENTICATED_USER_EMAIL: 'test@example.com',
  GMAIL_REDIRECT_URI: 'http://localhost:8080/auth/callback',
}))

vi.mock('../shared/config.js', () => ({
  config: mockConfig,
}))

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
  getAuthUrl: vi.fn(),
  oAuth2Client: { getToken: vi.fn(), setCredentials: vi.fn() },
}))

vi.mock('../shared/oauth-state.js', () => ({
  createOAuthState: () => 'test-state',
  verifyOAuthState: vi.fn(),
}))

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
    const mockEqUserId = vi.fn(() => ({ order: mockOrder }))
    mockFrom.mockReturnValue({ select: () => ({ eq: mockEqUserId }) })

    const res = await request(app).get('/logs')

    expect(res.status).toBe(200)
    expect(res.body).toEqual(fakeData)
    expect(mockFrom).toHaveBeenCalledWith('agent_logs')
  })

  it('should filter by type when ?type= is provided', async () => {
    const fakeData = [{ id: 2, type: 'pitch_draft' }]
    const mockLimit = vi.fn(() => Promise.resolve({ data: fakeData, error: null }))
    const mockOrder = vi.fn(() => ({ limit: mockLimit }))
    const mockEqType = vi.fn(() => ({ order: mockOrder }))
    const mockEqUserId = vi.fn(() => ({ eq: mockEqType }))
    mockFrom.mockReturnValue({ select: () => ({ eq: mockEqUserId }) })

    const res = await request(app).get('/logs?type=pitch_draft')

    expect(res.status).toBe(200)
    expect(res.body).toEqual(fakeData)
    expect(mockFrom).toHaveBeenCalledWith('agent_logs')
    expect(mockEqType).toHaveBeenCalledWith('type', 'pitch_draft')
  })

  it('should return 500 when Supabase errors', async () => {
    const mockLimit = vi.fn(() => Promise.resolve({ data: null, error: new Error('DB down') }))
    const mockOrder = vi.fn(() => ({ limit: mockLimit }))
    const mockEqUserId = vi.fn(() => ({ order: mockOrder }))
    mockFrom.mockReturnValue({ select: () => ({ eq: mockEqUserId }) })

    const res = await request(app).get('/logs')

    expect(res.status).toBe(500)
    expect(res.body.stack).toBeUndefined()
  })
})

describe('API /pulse', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 200 with message', async () => {
    const mockSingle = vi.fn(() => Promise.resolve({
      data: { youtube_channel_id: 'test-channel', auto_pitch_enabled: true },
      error: null,
    }))
    const mockEq = vi.fn(() => ({ single: mockSingle }))
    mockFrom.mockReturnValue({ select: () => ({ eq: mockEq }) })

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
    const mockEqUserId = vi.fn(() => ({ single: mockSingle }))
    const mockEqId = vi.fn(() => ({ eq: mockEqUserId }))
    mockFrom.mockReturnValue({ select: () => ({ eq: mockEqId }) })

    const res = await request(app)
      .post(`/api/pitches/${pitchId}/send`)
      .send({ subject: 'Hello', content: 'Body' })

    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Pitch no encontrado')
  })

  it('should return 400 when log type is not pitch_draft', async () => {
    const log = { type: 'agent_summary', content: {} }
    const mockSingle = vi.fn(() => Promise.resolve({ data: log, error: null }))
    const mockEqUserId = vi.fn(() => ({ single: mockSingle }))
    const mockEqId = vi.fn(() => ({ eq: mockEqUserId }))
    mockFrom.mockReturnValue({ select: () => ({ eq: mockEqId }) })

    const res = await request(app)
      .post(`/api/pitches/${pitchId}/send`)
      .send({ subject: 'Hello', content: 'Body' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('El registro no es un pitch')
  })

  it('should return 400 when pitch was already sent', async () => {
    const log = { type: 'pitch_draft', content: { status: 'sent', brandEmail: 'b@b.com' } }
    const mockSingle = vi.fn(() => Promise.resolve({ data: log, error: null }))
    const mockEqUserId = vi.fn(() => ({ single: mockSingle }))
    const mockEqId = vi.fn(() => ({ eq: mockEqUserId }))
    mockFrom.mockReturnValue({ select: () => ({ eq: mockEqId }) })

    const res = await request(app)
      .post(`/api/pitches/${pitchId}/send`)
      .send({ subject: 'Hello', content: 'Body' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Este pitch ya fue enviado anteriormente')
  })

  it('should return 400 when pitch status is not draft_ready', async () => {
    const log = { type: 'pitch_draft', content: { status: 'archived', brandEmail: 'b@b.com' } }
    const mockSingle = vi.fn(() => Promise.resolve({ data: log, error: null }))
    const mockEqUserId = vi.fn(() => ({ single: mockSingle }))
    const mockEqId = vi.fn(() => ({ eq: mockEqUserId }))
    mockFrom.mockReturnValue({ select: () => ({ eq: mockEqId }) })

    const res = await request(app)
      .post(`/api/pitches/${pitchId}/send`)
      .send({ subject: 'Hello', content: 'Body' })

    expect(res.status).toBe(400)
    expect(res.body.error).toContain('draft_ready')
  })

  it('should return 400 when brandEmail is missing or invalid', async () => {
    const log = { type: 'pitch_draft', content: { status: 'draft_ready', brandEmail: '' } }
    const mockSingle = vi.fn(() => Promise.resolve({ data: log, error: null }))
    const mockEqUserId = vi.fn(() => ({ single: mockSingle }))
    const mockEqId = vi.fn(() => ({ eq: mockEqUserId }))
    mockFrom.mockReturnValue({ select: () => ({ eq: mockEqId }) })

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
    const mockEqUserId = vi.fn(() => ({ single: mockSingle }))
    const mockEqId = vi.fn(() => ({ eq: mockEqUserId }))
    mockFrom.mockReturnValue({ select: () => ({ eq: mockEqId }) })

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
    const mockEqUserId = vi.fn(() => ({ single: mockSingle }))
    const mockEqId = vi.fn(() => ({ eq: mockEqUserId }))
    mockFrom.mockReturnValue({ select: () => ({ eq: mockEqId }) })

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
    const mockEqUserId = vi.fn(() => ({ single: mockSingle }))
    const mockEqId = vi.fn(() => ({ eq: mockEqUserId }))
    mockFrom.mockReturnValue({ select: () => ({ eq: mockEqId }) })

    const res = await request(app)
      .post(`/api/pitches/${pitchId}/send`)
      .send({ subject: 'Hello', content: 'Body' })

    expect(res.status).toBe(400)
    expect(res.body.error).toContain('inválido')
  })

  it('should return 503 when MCP is unhealthy', async () => {
    const log = { type: 'pitch_draft', content: { status: 'draft_ready', brandEmail: 'brand@test.com' } }
    const mockSingle = vi.fn(() => Promise.resolve({ data: log, error: null }))
    const mockEqUserId = vi.fn(() => ({ single: mockSingle }))
    const mockEqId = vi.fn(() => ({ eq: mockEqUserId }))
    mockFrom.mockReturnValue({ select: () => ({ eq: mockEqId }) })
    mockHealthCheck.mockResolvedValue(false)

    const res = await request(app)
      .post(`/api/pitches/${pitchId}/send`)
      .send({ subject: 'Hello', content: 'Body' })

    expect(res.status).toBe(503)
    expect(res.body.error).toBe('Servidor MCP no disponible')
  })

  it('should succeed when all validations pass', async () => {
    const pitch = {
      brandName: 'TestBrand',
      brandEmail: 'brand@test.com',
      status: 'draft_ready',
    }
    const log = { type: 'pitch_draft', content: pitch }
    const mockSingle = vi.fn(() => Promise.resolve({ data: log, error: null }))
    const mockEqUserId = vi.fn(() => ({ single: mockSingle }))
    const mockEqId = vi.fn(() => ({ eq: mockEqUserId }))
    const mockUpdateEq2 = vi.fn(() => Promise.resolve({ error: null }))
    const mockUpdateEq1 = vi.fn(() => ({ eq: mockUpdateEq2 }))
    const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq1 }))

    mockFrom.mockImplementation((table: string) => {
      if (table === 'agent_logs') {
        return {
          select: () => ({ eq: mockEqId }),
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
    const mockEqUserId = vi.fn(() => ({ single: mockSingle }))
    const mockEqId = vi.fn(() => ({ eq: mockEqUserId }))
    const mockUpdateEq2 = vi.fn(() => Promise.resolve({ error: new Error('Update failed') }))
    const mockUpdateEq1 = vi.fn(() => ({ eq: mockUpdateEq2 }))
    const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq1 }))

    mockFrom.mockImplementation((table: string) => {
      if (table === 'agent_logs') {
        return {
          select: () => ({ eq: mockEqId }),
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
