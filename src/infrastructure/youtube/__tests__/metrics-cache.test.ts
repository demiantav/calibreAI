import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ─── Hoisted mocks ─────────────────────────────────────────────────────────────

const mockMaybeSingle = vi.hoisted(() => vi.fn())
const mockEq = vi.hoisted(() => vi.fn(() => ({ maybeSingle: mockMaybeSingle })))
const mockSelect = vi.hoisted(() => vi.fn(() => ({ eq: mockEq })))
const mockUpsert = vi.hoisted(() => vi.fn(() => ({ error: null })))
const mockFrom = vi.hoisted(() => vi.fn(() => ({ select: mockSelect, upsert: mockUpsert })))

vi.mock('../../supabase/supabase-client.js', () => ({
  supabase: { from: mockFrom },
}))

// ─── SUT ────────────────────────────────────────────────────────────────────────

import { getCachedMetrics, setCachedMetrics } from '../metrics-cache.js'

const TTL_MS = 60 * 60 * 1000
const CHANNEL_ID = 'UC_TEST_CHANNEL'

const sampleMetrics = {
  subscriberCount: 127500,
  totalViews: 4825000,
  lastVideoTitle: 'Test Video',
  lastVideoViews: 250000,
  lastVideoLikes: 42000,
  lastVideoComments: 3800,
  lastVideoId: 'dQw4w9WgXcQ',
  channelName: 'Test Creator',
  engagementRate: 2.86,
  algorithmVersion: 'v3',
}

// ─── getCachedMetrics ───────────────────────────────────────────────────────────

describe('getCachedMetrics', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-20T12:00:00Z'))
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function dbRow(overrides?: Partial<{ data: any; cached_at: string }>) {
    return {
      data: {
        data: sampleMetrics,
        cached_at: new Date(Date.now()).toISOString(),
        ...overrides,
      },
      error: null,
    }
  }

  it('should return cached data when age < TTL', async () => {
    mockMaybeSingle.mockResolvedValueOnce(
      dbRow({ cached_at: new Date(Date.now() - TTL_MS + 60000).toISOString() }),
    )

    const result = await getCachedMetrics(CHANNEL_ID)
    expect(result).toEqual(sampleMetrics)
    expect(mockFrom).toHaveBeenCalledWith('channel_metrics_cache')
    expect(mockEq).toHaveBeenCalledWith('channel_id', CHANNEL_ID)
  })

  it('should return null when cached data is expired (age > TTL)', async () => {
    mockMaybeSingle.mockResolvedValueOnce(
      dbRow({ cached_at: new Date(Date.now() - TTL_MS - 1).toISOString() }),
    )

    const result = await getCachedMetrics(CHANNEL_ID)
    expect(result).toBeNull()
  })

  it('should return cached data when age exactly equals TTL (not > TTL)', async () => {
    mockMaybeSingle.mockResolvedValueOnce(
      dbRow({ cached_at: new Date(Date.now() - TTL_MS).toISOString() }),
    )

    const result = await getCachedMetrics(CHANNEL_ID)
    expect(result).toEqual(sampleMetrics)
  })

  it('should return null when no data in DB', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })

    const result = await getCachedMetrics(CHANNEL_ID)
    expect(result).toBeNull()
  })

  it('should return null when maybeSingle returns error', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: new Error('DB error') })

    const result = await getCachedMetrics(CHANNEL_ID)
    expect(result).toBeNull()
  })

  it('should return null when maybeSingle throws', async () => {
    mockMaybeSingle.mockRejectedValueOnce(new Error('Network error'))

    const result = await getCachedMetrics(CHANNEL_ID)
    expect(result).toBeNull()
  })
})

// ─── setCachedMetrics ───────────────────────────────────────────────────────────

describe('setCachedMetrics', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-20T12:00:00Z'))
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should upsert metrics with channel_id and data', async () => {
    await setCachedMetrics(CHANNEL_ID, sampleMetrics)

    expect(mockUpsert).toHaveBeenCalledWith(
      {
        channel_id: CHANNEL_ID,
        data: sampleMetrics,
        cached_at: new Date().toISOString(),
      },
      { onConflict: 'channel_id' },
    )
  })

  it('should not throw when upsert returns an error', async () => {
    mockUpsert.mockResolvedValueOnce({ error: new Error('Permission denied') })

    await expect(setCachedMetrics(CHANNEL_ID, sampleMetrics)).resolves.toBeUndefined()
  })

  it('should not throw when upsert throws', async () => {
    mockUpsert.mockRejectedValueOnce(new Error('Network error'))

    await expect(setCachedMetrics(CHANNEL_ID, sampleMetrics)).resolves.toBeUndefined()
  })
})
