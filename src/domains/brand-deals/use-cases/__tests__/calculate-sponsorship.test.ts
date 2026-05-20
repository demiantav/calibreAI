import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Hoisted mocks ─────────────────────────────────────────────────────────────

const mockInsert = vi.hoisted(() => vi.fn(() => Promise.resolve({ error: null })))

vi.mock('../../../../infrastructure/supabase/supabase-client.js', () => ({
  supabase: {
    from: vi.fn(() => ({ insert: mockInsert })),
  },
}))

// Make model.generateContent throw so mock fallback is always used
vi.mock('../../../agent-core/reasoning/gemini-client.js', () => ({
  model: {
    generateContent: vi.fn(() => { throw new Error('Gemini not available') }),
  },
}))

// ─── SUT ────────────────────────────────────────────────────────────────────────

import { calculateSponsorshipUseCase } from '../calculate-sponsorship.js'

const baseInput = {
  creatorName: 'TestCreator',
  subscribers: 100000,
  totalViews: 10000000,
  lastVideoViews: 50000,
  niche: 'tech',
}

// ─── Tests ──────────────────────────────────────────────────────────────────────

describe('calculateSponsorshipUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('engagement rate calculation', () => {
    it('should use pre-calculated engagementRate when provided', async () => {
      await calculateSponsorshipUseCase({
        ...baseInput,
        engagementRate: 5.5,
        lastVideoLikes: 999999,
        lastVideoComments: 999999,
      })

      expect(mockInsert).toHaveBeenCalled()
      const insertArg = mockInsert.mock.calls[0][0] as any[]
      expect(insertArg[0].insights).toContain('5.50%')
    })

    it('should calculate engagement from likes+comments when not pre-calculated', async () => {
      await calculateSponsorshipUseCase({
        ...baseInput,
        lastVideoLikes: 5000,
        lastVideoComments: 500,
      })

      // engagement = (5000+500)/100000*100 = 5.5%
      const insertArg = mockInsert.mock.calls[0][0] as any[]
      expect(insertArg[0].insights).toContain('5.50%')
    })

    it('should calculate engagement from views when no likes/comments', async () => {
      await calculateSponsorshipUseCase({
        ...baseInput,
        lastVideoViews: 50000,
        lastVideoLikes: 0,
        lastVideoComments: 0,
      })

      // engagement = 50000/100000*100 = 50%
      const insertArg = mockInsert.mock.calls[0][0] as any[]
      expect(insertArg[0].insights).toContain('50.00%')
    })

    it('should display <0.01% for very small engagement', async () => {
      await calculateSponsorshipUseCase({
        ...baseInput,
        subscribers: 1000000,
        lastVideoLikes: 1,
        lastVideoComments: 0,
      })

      // engagement = 1/1000000*100 = 0.0001% → '<0.01%'
      const insertArg = mockInsert.mock.calls[0][0] as any[]
      expect(insertArg[0].insights).toContain('<0.01%')
    })
  })

  describe('mock fallback formula', () => {
    it('should produce correct forecast for 100k subs', async () => {
      const forecast = await calculateSponsorshipUseCase(baseInput)

      // baseRate = round(100000 * 0.002) = 200
      expect(forecast.mention.min).toBe(200)
      expect(forecast.mention.max).toBe(300) // 200 * 1.5
      expect(forecast.dedicated.min).toBe(400) // 200 * 2
      expect(forecast.dedicated.max).toBe(600) // 200 * 3
      expect(forecast.series.min).toBe(800) // 200 * 4
      expect(forecast.series.max).toBe(1200) // 200 * 6
    })

    it('should use estimatedCpm=8 for large creators (>500k subs)', async () => {
      const forecast = await calculateSponsorshipUseCase({
        ...baseInput,
        subscribers: 1000000,
      })

      expect(forecast.estimatedCpm).toBe(8)
    })

    it('should use estimatedCpm=5 for small creators (<500k subs)', async () => {
      const forecast = await calculateSponsorshipUseCase({
        ...baseInput,
        subscribers: 100000,
      })

      expect(forecast.estimatedCpm).toBe(5)
    })

    it('should handle 0 subscribers gracefully', async () => {
      const forecast = await calculateSponsorshipUseCase({
        ...baseInput,
        subscribers: 0,
      })

      expect(forecast.mention.min).toBe(0)
      expect(forecast.mention.max).toBe(0)
      expect(forecast.dedicated.min).toBe(0)
      expect(forecast.estimatedCpm).toBe(5)
    })

    it('should set marketContext for mock fallback', async () => {
      const forecast = await calculateSponsorshipUseCase(baseInput)

      expect(forecast.marketContext).toContain('Estimación basada en métricas generales')
    })
  })

  describe('forecast structure', () => {
    it('should use USD currency for all tiers', async () => {
      const forecast = await calculateSponsorshipUseCase(baseInput)

      expect(forecast.mention.currency).toBe('USD')
      expect(forecast.dedicated.currency).toBe('USD')
      expect(forecast.series.currency).toBe('USD')
    })

    it('should persist forecast to agent_logs', async () => {
      await calculateSponsorshipUseCase(baseInput)

      const insertArg = mockInsert.mock.calls[0][0] as any[]
      expect(insertArg[0].type).toBe('sponsorship_forecast')
      expect(insertArg[0].creator_name).toBe('TestCreator')
      expect(insertArg[0].content).toBeDefined()
    })
  })
})
