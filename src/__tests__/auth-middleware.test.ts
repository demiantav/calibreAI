import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response } from 'express'

const mockConfig = vi.hoisted(() => ({ NODE_ENV: 'development', AUTH_API_KEY: '' }))

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

describe('authMiddleware', () => {
  beforeEach(() => {
    mockConfig.NODE_ENV = 'development'
    mockConfig.AUTH_API_KEY = ''
  })

  it('should call next() when no AUTH_API_KEY is configured', () => {
    const req = mockReq({}) as Request
    const res = mockRes() as unknown as Response
    const next = vi.fn()

    authMiddleware(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
  })

  it('should call next() when x-api-key matches', () => {
    mockConfig.AUTH_API_KEY = 'secret-key'
    const req = mockReq({ 'x-api-key': 'secret-key' }) as Request
    const res = mockRes() as unknown as Response
    const next = vi.fn()

    authMiddleware(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
  })

  it('should return 401 when x-api-key is missing', () => {
    mockConfig.AUTH_API_KEY = 'secret-key'
    const req = mockReq({}) as Request
    const { status, json } = mockRes()
    const res = { status, json } as unknown as Response
    const next = vi.fn()

    authMiddleware(req, res, next)

    expect(status).toHaveBeenCalledWith(401)
    expect(json).toHaveBeenCalledWith({ error: expect.stringContaining('No autorizado') })
    expect(next).not.toHaveBeenCalled()
  })

  it('should return 401 when x-api-key is wrong', () => {
    mockConfig.AUTH_API_KEY = 'secret-key'
    const req = mockReq({ 'x-api-key': 'wrong-key' }) as Request
    const { status, json } = mockRes()
    const res = { status, json } as unknown as Response
    const next = vi.fn()

    authMiddleware(req, res, next)

    expect(status).toHaveBeenCalledWith(401)
    expect(json).toHaveBeenCalledWith({ error: expect.stringContaining('No autorizado') })
    expect(next).not.toHaveBeenCalled()
  })

  it('should call next() in test mode regardless of AUTH_API_KEY', () => {
    mockConfig.NODE_ENV = 'test'
    mockConfig.AUTH_API_KEY = 'secret-key'
    const req = mockReq({}) as Request
    const res = mockRes() as unknown as Response
    const next = vi.fn()

    authMiddleware(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
  })
})
