import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

// ─── Hoisted mocks ─────────────────────────────────────────────────────────────

const mockFrom = vi.hoisted(() => vi.fn())

const mockConfig = vi.hoisted(() => ({
  NODE_ENV: 'test',
  JWT_SECRET: 'test-secret',
  YOUTUBE_API_KEY: 'test-yt-key',
}))

vi.mock('../shared/config.js', () => ({
  config: mockConfig,
}))

vi.mock('../infrastructure/supabase/supabase-client.js', () => ({
  supabase: { from: mockFrom },
}))

vi.mock('../infrastructure/mcp/mcp-manager.js', () => ({
  mcpManager: {
    healthCheck: vi.fn(),
    callTool: vi.fn(),
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

// ─── Import app after mocks ────────────────────────────────────────────────────

import { app } from '../app.js'

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('PATCH /api/pitches/:id/status', () => {
  const pitchId = 'pitch-status-1'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 200 when changing draft_ready to sent', async () => {
    const pitch = { status: 'draft_ready', brandName: 'TestBrand', brandEmail: 'b@b.com' }
    const log = { type: 'pitch_draft', content: pitch }

    const mockSingle = vi.fn(() => Promise.resolve({ data: log, error: null }))
    const mockEqUserId = vi.fn(() => ({ single: mockSingle }))
    const mockEqId = vi.fn(() => ({ eq: mockEqUserId }))
    const mockUpdateEq2 = vi.fn(() => Promise.resolve({ error: null }))
    const mockUpdateEq1 = vi.fn(() => ({ eq: mockUpdateEq2 }))
    const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq1 }))

    mockFrom.mockImplementation(() => ({
      select: () => ({ eq: mockEqId }),
      update: mockUpdate,
    }))

    const res = await request(app)
      .patch(`/api/pitches/${pitchId}/status`)
      .send({ status: 'sent' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.status).toBe('sent')
  })

  it('should return 400 with invalid status', async () => {
    const res = await request(app)
      .patch(`/api/pitches/${pitchId}/status`)
      .send({ status: 'invalid_status' })

    expect(res.status).toBe(400)
    expect(res.body.error).toContain('inválido')
  })

  it('should return 404 when pitch does not exist', async () => {
    const mockSingle = vi.fn(() => Promise.resolve({ data: null, error: new Error('Not found') }))
    const mockEqUserId = vi.fn(() => ({ single: mockSingle }))
    const mockEqId = vi.fn(() => ({ eq: mockEqUserId }))
    mockFrom.mockImplementation(() => ({
      select: () => ({ eq: mockEqId }),
    }))

    const res = await request(app)
      .patch(`/api/pitches/${pitchId}/status`)
      .send({ status: 'sent' })

    expect(res.status).toBe(404)
    expect(res.body.error).toContain('no encontrado')
  })

  it('should return 400 when trying sent to draft_ready', async () => {
    const pitch = { status: 'sent', brandName: 'TestBrand', brandEmail: 'b@b.com' }
    const log = { type: 'pitch_draft', content: pitch }

    const mockSingle = vi.fn(() => Promise.resolve({ data: log, error: null }))
    const mockEqUserId = vi.fn(() => ({ single: mockSingle }))
    const mockEqId = vi.fn(() => ({ eq: mockEqUserId }))
    mockFrom.mockImplementation(() => ({
      select: () => ({ eq: mockEqId }),
    }))

    const res = await request(app)
      .patch(`/api/pitches/${pitchId}/status`)
      .send({ status: 'draft_ready' })

    expect(res.status).toBe(400)
    expect(res.body.error).toContain('sent a draft_ready')
  })

  it('should return 400 when log is not a pitch_draft', async () => {
    const log = { type: 'agent_summary', content: {} }
    const mockSingle = vi.fn(() => Promise.resolve({ data: log, error: null }))
    const mockEqUserId = vi.fn(() => ({ single: mockSingle }))
    const mockEqId = vi.fn(() => ({ eq: mockEqUserId }))
    mockFrom.mockImplementation(() => ({
      select: () => ({ eq: mockEqId }),
    }))

    const res = await request(app)
      .patch(`/api/pitches/${pitchId}/status`)
      .send({ status: 'sent' })

    expect(res.status).toBe(400)
    expect(res.body.error).toContain('pitch')
  })
})

describe('GET /api/leads', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 200 with leads array', async () => {
    const processedEmails = [
      { gmail_id: 'g1', brand_email: 'a@b.com', subject: 'Subject 1', snippet: 'Snippet 1', processed_at: '2026-01-01' },
      { gmail_id: 'g2', brand_email: 'c@d.com', subject: 'Subject 2', snippet: 'Snippet 2', processed_at: '2026-01-02' },
    ]
    const pitches = [
      { content: { gmailId: 'g1' } },
    ]

    mockFrom.mockImplementation((table: string) => {
      if (table === 'processed_emails') {
        const mockOrder = vi.fn(() => Promise.resolve({ data: processedEmails, error: null }))
        const mockEqOrder = vi.fn(() => ({ order: mockOrder }))
        return {
          select: () => ({ eq: mockEqOrder }),
        }
      }
      if (table === 'agent_logs') {
        const mockEqType = vi.fn(() => Promise.resolve({ data: pitches, error: null }))
        const mockEqUser = vi.fn(() => ({ eq: mockEqType }))
        return {
          select: () => ({ eq: mockEqUser }),
        }
      }
      return {}
    })

    const res = await request(app).get('/api/leads')

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBe(1)
    expect(res.body[0].id).toBe('g2')
  })

  it('should return 200 with empty array when no leads', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'processed_emails') {
        const mockOrder = vi.fn(() => Promise.resolve({ data: [], error: null }))
        const mockEqOrder = vi.fn(() => ({ order: mockOrder }))
        return { select: () => ({ eq: mockEqOrder }) }
      }
      if (table === 'agent_logs') {
        const mockEqType = vi.fn(() => Promise.resolve({ data: [], error: null }))
        const mockEqUser = vi.fn(() => ({ eq: mockEqType }))
        return { select: () => ({ eq: mockEqUser }) }
      }
      return {}
    })

    const res = await request(app).get('/api/leads')

    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })
})
