import { describe, it, expect, vi, beforeEach } from 'vitest'
import jwt from 'jsonwebtoken'
import type { Request, Response } from 'express'

const mockConfig = vi.hoisted(() => ({ NODE_ENV: 'development', JWT_SECRET: 'test-secret' }))

vi.mock('../shared/config.js', () => ({
  config: mockConfig,
}))

import { authMiddleware } from '../shared/auth-middleware.js'

function mockReq(headers: Record<string, string | undefined>): Partial<Request> {
  return { headers: headers as any }
}

function mockRes(): { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> } {
  const json = vi.fn()
  const status = vi.fn(() => ({ json }))
  return { status, json }
}

function generateTestToken() {
  return jwt.sign({ userId: 'test-user', email: 'test@example.com' }, mockConfig.JWT_SECRET)
}

describe('jwtAuthMiddleware (via authMiddleware export)', () => {
  beforeEach(() => {
    mockConfig.NODE_ENV = 'development'
    mockConfig.JWT_SECRET = 'test-secret'
  })

  it('should call next() when valid Bearer token is provided', () => {
    const token = generateTestToken()
    const req = mockReq({ authorization: `Bearer ${token}` }) as Request
    const res = mockRes() as unknown as Response
    const next = vi.fn()

    authMiddleware(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect((req as any).user).toEqual({ userId: 'test-user', email: 'test@example.com' })
  })

  it('should return 401 when Authorization header is missing', () => {
    const req = mockReq({}) as Request
    const { status, json } = mockRes()
    const res = { status, json } as unknown as Response
    const next = vi.fn()

    authMiddleware(req, res, next)

    expect(status).toHaveBeenCalledWith(401)
    expect(json).toHaveBeenCalledWith({ error: expect.stringContaining('No autorizado') })
    expect(next).not.toHaveBeenCalled()
  })

  it('should return 401 when token is invalid', () => {
    const req = mockReq({ authorization: 'Bearer invalid-token' }) as Request
    const { status, json } = mockRes()
    const res = { status, json } as unknown as Response
    const next = vi.fn()

    authMiddleware(req, res, next)

    expect(status).toHaveBeenCalledWith(401)
    expect(json).toHaveBeenCalledWith({ error: expect.stringContaining('token') })
    expect(next).not.toHaveBeenCalled()
  })

  it('should call next() in test mode regardless of token', () => {
    mockConfig.NODE_ENV = 'test'
    const req = mockReq({}) as Request
    const res = mockRes() as unknown as Response
    const next = vi.fn()

    authMiddleware(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
  })
})
