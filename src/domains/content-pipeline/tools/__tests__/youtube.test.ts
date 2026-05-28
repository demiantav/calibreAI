import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Hoisted mocks ──────────────────────────────────────────────────────────────
// Paths are relative to THIS test file (__tests__/), NOT to the source file.

vi.mock('../../../../infrastructure/youtube/metrics-cache.js', () => ({
  getCachedMetrics: vi.fn(),
  setCachedMetrics: vi.fn(() => Promise.resolve()),
}))

vi.mock('../../../../infrastructure/youtube/metrics-service.js', () => ({
  getRealYouTubeMetrics: vi.fn(),
}))

vi.mock('../youtube-mock.js', () => ({
  getMockYouTubeMetrics: vi.fn(),
}))

// ─── SUT ────────────────────────────────────────────────────────────────────────

import { fetchYouTubeChannelStats } from '../youtube.js'

const { getCachedMetrics, setCachedMetrics } = await import(
  '../../../../infrastructure/youtube/metrics-cache.js'
)
const { getRealYouTubeMetrics } = await import(
  '../../../../infrastructure/youtube/metrics-service.js'
)
const { getMockYouTubeMetrics } = await import('../youtube-mock.js')

const CHANNEL_ID = 'UC_TEST_CHANNEL'

const sampleMetrics = {
  subscriberCount: 127500,
  totalViews: 4825000,
  lastVideoTitle: 'Test Video',
  lastVideoViews: 250000,
  lastVideoLikes: 42000,
  lastVideoComments: 3800,
  channelName: 'Test Creator',
  engagementRate: 2.86,
  algorithmVersion: 'v3',
}

const mockMetrics = {
  subscriberCount: 1600000,
  totalViews: 480000000,
  lastVideoTitle: 'Mock Video',
  lastVideoViews: 250000,
  lastVideoLikes: 42000,
  lastVideoComments: 3800,
  channelName: 'midudev',
  engagementRate: 2.86,
  algorithmVersion: 'v3',
}

// ─── Tests ──────────────────────────────────────────────────────────────────────

describe('fetchYouTubeChannelStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(setCachedMetrics).mockResolvedValue(undefined)
  })

  it('should return cached data when available', async () => {
    vi.mocked(getCachedMetrics).mockResolvedValueOnce(sampleMetrics)

    const result = await fetchYouTubeChannelStats(CHANNEL_ID)

    expect(result).toEqual(sampleMetrics)
    expect(getCachedMetrics).toHaveBeenCalledWith(CHANNEL_ID)
    expect(getRealYouTubeMetrics).not.toHaveBeenCalled()
    expect(getMockYouTubeMetrics).not.toHaveBeenCalled()
  })

  it('should call real API when cache misses and return API data', async () => {
    vi.mocked(getCachedMetrics).mockResolvedValueOnce(null)
    vi.mocked(getRealYouTubeMetrics).mockResolvedValueOnce(sampleMetrics)

    const result = await fetchYouTubeChannelStats(CHANNEL_ID)

    expect(result).toEqual(sampleMetrics)
    expect(getRealYouTubeMetrics).toHaveBeenCalledWith(CHANNEL_ID)
    expect(setCachedMetrics).toHaveBeenCalledWith(CHANNEL_ID, sampleMetrics)
  })

  it('should fall back to mock when real API throws quota error', async () => {
    vi.mocked(getCachedMetrics).mockResolvedValueOnce(null)
    vi.mocked(getRealYouTubeMetrics).mockRejectedValueOnce(new Error('API quotaExceeded'))
    vi.mocked(getMockYouTubeMetrics).mockResolvedValueOnce(mockMetrics)

    const result = await fetchYouTubeChannelStats(CHANNEL_ID)

    expect(result).toEqual(mockMetrics)
    expect(getRealYouTubeMetrics).toHaveBeenCalledWith(CHANNEL_ID)
    expect(getMockYouTubeMetrics).toHaveBeenCalledWith(CHANNEL_ID)
  })

  it('should fall back to mock when real API throws 403 error', async () => {
    vi.mocked(getCachedMetrics).mockResolvedValueOnce(null)
    vi.mocked(getRealYouTubeMetrics).mockRejectedValueOnce(new Error('403 Forbidden'))
    vi.mocked(getMockYouTubeMetrics).mockResolvedValueOnce(mockMetrics)

    const result = await fetchYouTubeChannelStats(CHANNEL_ID)
    expect(result).toEqual(mockMetrics)
  })

  it('should fall back to mock when real API throws generic error', async () => {
    vi.mocked(getCachedMetrics).mockResolvedValueOnce(null)
    vi.mocked(getRealYouTubeMetrics).mockRejectedValueOnce(new Error('Network error'))
    vi.mocked(getMockYouTubeMetrics).mockResolvedValueOnce(mockMetrics)

    const result = await fetchYouTubeChannelStats(CHANNEL_ID)
    expect(result).toEqual(mockMetrics)
  })

  it('should still return API data even if cache save fails', async () => {
    vi.mocked(getCachedMetrics).mockResolvedValueOnce(null)
    vi.mocked(getRealYouTubeMetrics).mockResolvedValueOnce(sampleMetrics)
    vi.mocked(setCachedMetrics).mockRejectedValueOnce(new Error('DB error'))

    const result = await fetchYouTubeChannelStats(CHANNEL_ID)

    expect(result).toEqual(sampleMetrics)
    expect(setCachedMetrics).toHaveBeenCalledWith(CHANNEL_ID, sampleMetrics)
  })

  it('should fall back to mock when error.message contains 403', async () => {
    vi.mocked(getCachedMetrics).mockResolvedValueOnce(null)
    vi.mocked(getRealYouTubeMetrics).mockRejectedValueOnce(new Error('403 Forbidden'))
    vi.mocked(getMockYouTubeMetrics).mockResolvedValueOnce(mockMetrics)

    const result = await fetchYouTubeChannelStats(CHANNEL_ID)
    expect(result).toEqual(mockMetrics)
  })

  it('should still fall back to mock even when error is not quota/403 (always falls back)', async () => {
    // The function always returns mock data on ANY error; the isQuotaError flag
    // only affects the log message, not the behavior.
    vi.mocked(getCachedMetrics).mockResolvedValueOnce(null)
    vi.mocked(getRealYouTubeMetrics).mockRejectedValueOnce(
      Object.assign(new Error('server error'), { toString: () => 'TypeError: 10403 network failure' }),
    )
    vi.mocked(getMockYouTubeMetrics).mockResolvedValueOnce(mockMetrics)

    const result = await fetchYouTubeChannelStats(CHANNEL_ID)
    expect(result).toEqual(mockMetrics)
  })
})
