import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

// ─── Hoisted mocks ─────────────────────────────────────────────────────────────

const mockFindByEmail = vi.hoisted(() => vi.fn())
const mockCreate = vi.hoisted(() => vi.fn())
const mockFindById = vi.hoisted(() => vi.fn())

const mockConfig = vi.hoisted(() => ({
  NODE_ENV: 'test',
  JWT_SECRET: 'test-secret',
  YOUTUBE_API_KEY: 'test-yt-key',
}))

vi.mock('../shared/config.js', () => ({
  config: mockConfig,
}))

vi.mock('../repositories/user.repository.js', () => ({
  userRepository: {
    findByEmail: mockFindByEmail,
    create: mockCreate,
    findById: mockFindById,
    update: vi.fn(),
  },
}))

vi.mock('../infrastructure/supabase/supabase-client.js', () => ({
  supabase: { from: vi.fn() },
}))

vi.mock('../infrastructure/mcp/mcp-manager.js', () => ({
  mcpManager: { healthCheck: vi.fn(), callTool: vi.fn() },
}))

vi.mock('../infrastructure/gmail/gmail-client.js', () => ({
  getAuthUrl: vi.fn(),
  oAuth2Client: { getToken: vi.fn(), setCredentials: vi.fn() },
}))

// ─── Import app after mocks ────────────────────────────────────────────────────

import { app } from '../app.js'

// ─── Helpers ───────────────────────────────────────────────────────────────────

const TEST_SECRET = 'test-secret'

function generateToken(userId: string, email: string) {
  return jwt.sign({ userId, email }, TEST_SECRET, { expiresIn: '7d' })
}

const fakeUser = {
  id: 'user-123',
  email: 'test@example.com',
  password_hash: '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01',
  youtube_channel_id: null,
  youtube_channel_url: null,
  youtube_channel_name: null,
  gmail_access_token: null,
  gmail_refresh_token: null,
  gmail_expires_at: null,
  auto_pitch_enabled: false,
  onboarding_completed: false,
  onboarding_step: 1,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 201 with token and user on success', async () => {
    mockFindByEmail.mockResolvedValue(null)
    mockCreate.mockResolvedValue(fakeUser)

    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'test@example.com', password: 'password123' })

    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe('test@example.com')
    expect(res.body.user.id).toBe('user-123')
    expect(mockCreate).toHaveBeenCalled()
  })

  it('should return 409 when email already exists', async () => {
    mockFindByEmail.mockResolvedValue(fakeUser)

    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'test@example.com', password: 'password123' })

    expect(res.status).toBe(409)
    expect(res.body.error).toContain('exists')
  })

  it('should return 400 when email is invalid', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'not-an-email', password: 'password123' })

    expect(res.status).toBe(400)
  })

  it('should return 400 when password is shorter than 6 characters', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'test@example.com', password: '12345' })

    expect(res.status).toBe(400)
  })
})

describe('POST /auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 200 with token and user on success', async () => {
    // bcrypt hash of 'password123'
    const bcrypt = await import('bcryptjs')
    const hash = await bcrypt.hash('password123', 10)
    const userWithHash = { ...fakeUser, password_hash: hash }

    mockFindByEmail.mockResolvedValue(userWithHash)

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })

    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe('test@example.com')
  })

  it('should return 401 with invalid credentials', async () => {
    mockFindByEmail.mockResolvedValue(null)

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' })

    expect(res.status).toBe(401)
    expect(res.body.error).toContain('Invalid credentials')
  })

  it('should return 401 for legacy user with placeholder password', async () => {
    const legacyUser = { ...fakeUser, password_hash: 'LEGACY_MUST_SET_PASSWORD' }
    mockFindByEmail.mockResolvedValue(legacyUser)

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'anypassword' })

    expect(res.status).toBe(401)
    expect(res.body.error).toContain('reset your password')
  })
})

describe('GET /auth/me', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 200 with user data when token is valid', async () => {
    mockFindById.mockResolvedValue(fakeUser)
    const token = generateToken('user-123', 'test@example.com')

    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.email).toBe('test@example.com')
    expect(res.body.id).toBe('user-123')
  })

  it('should return 401 without token', async () => {
    const res = await request(app).get('/auth/me')

    expect(res.status).toBe(401)
  })

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', 'Bearer invalid-token-here')

    expect(res.status).toBe(401)
  })

  it('should return 404 when user not found', async () => {
    mockFindById.mockResolvedValue(null)
    const token = generateToken('user-123', 'test@example.com')

    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
    expect(res.body.error).toContain('no encontrado')
  })
})
