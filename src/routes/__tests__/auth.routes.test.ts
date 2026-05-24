import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

const mockConfig = vi.hoisted(() => ({ JWT_SECRET: 'test-secret' }))

vi.mock('../../shared/config.js', () => ({
  config: mockConfig,
}))

const mockUserRepository = vi.hoisted(() => ({
  findByEmail: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
}))

vi.mock('../../repositories/user.repository.js', () => ({
  userRepository: mockUserRepository,
}))

import { app } from '../../app.js'

function generateTestToken(userId = 'test-user', email = 'test@example.com') {
  return jwt.sign({ userId, email }, mockConfig.JWT_SECRET, { expiresIn: '7d' })
}

describe('PATCH /auth/me', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update auto_pitch_enabled with valid token', async () => {
    mockUserRepository.update.mockResolvedValueOnce({
      id: 'test-user',
      email: 'test@example.com',
      youtube_channel_id: 'UC-test',
      youtube_channel_name: 'TestChannel',
      onboarding_completed: true,
      onboarding_step: 3,
      auto_pitch_enabled: true,
    })

    const token = generateTestToken()
    const res = await request(app)
      .patch('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ auto_pitch_enabled: true })

    expect(res.status).toBe(200)
    expect(res.body.auto_pitch_enabled).toBe(true)
    expect(mockUserRepository.update).toHaveBeenCalledWith('test-user', { auto_pitch_enabled: true })
  })

  it('should return 401 when no token is provided', async () => {
    const res = await request(app)
      .patch('/auth/me')
      .send({ auto_pitch_enabled: true })

    expect(res.status).toBe(401)
    expect(res.body.error).toContain('No token provided')
  })

  it('should return 400 when body is invalid', async () => {
    const token = generateTestToken()
    const res = await request(app)
      .patch('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ auto_pitch_enabled: 'yes' })

    expect(res.status).toBe(400)
    expect(res.body.error).toContain('Datos inválidos')
  })

  it('should return 404 when user is not found', async () => {
    mockUserRepository.update.mockResolvedValueOnce(null)

    const token = generateTestToken()
    const res = await request(app)
      .patch('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ auto_pitch_enabled: false })

    expect(res.status).toBe(404)
    expect(res.body.error).toContain('Usuario no encontrado')
  })
})
