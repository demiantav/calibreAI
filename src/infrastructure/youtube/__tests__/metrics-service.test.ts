import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  parseISODuration,
  isShort,
  isDurable,
  hoursSince,
  selectBestVideo,
  type VideoCandidate,
} from '../metrics-service.js'

// ─── Helpers ────────────────────────────────────────────────────────────────────

function makeVideo(overrides: Partial<VideoCandidate> & { publishedAt: string }): VideoCandidate {
  return {
    id: 'test-id',
    title: 'Test Video',
    duration: 'PT10M',
    views: 1000,
    likes: 100,
    comments: 10,
    ...overrides,
  }
}

// ─── parseISODuration ───────────────────────────────────────────────────────────

describe('parseISODuration', () => {
  it('should parse PT1H30M15S to 5415 seconds', () => {
    expect(parseISODuration('PT1H30M15S')).toBe(5415)
  })

  it('should parse PT30M to 1800 seconds (only minutes)', () => {
    expect(parseISODuration('PT30M')).toBe(1800)
  })

  it('should parse PT15S to 15 seconds (only seconds)', () => {
    expect(parseISODuration('PT15S')).toBe(15)
  })

  it('should parse PT1H to 3600 seconds (only hours)', () => {
    expect(parseISODuration('PT1H')).toBe(3600)
  })

  it('should parse PT1H30M to 5400 seconds (hours + minutes)', () => {
    expect(parseISODuration('PT1H30M')).toBe(5400)
  })

  it('should parse PT1M30S to 90 seconds (minutes + seconds)', () => {
    expect(parseISODuration('PT1M30S')).toBe(90)
  })

  it('should parse PT1H0M0S to 3600 seconds (explicit zeros)', () => {
    expect(parseISODuration('PT1H0M0S')).toBe(3600)
  })

  it('should return 0 for PT0S (zero duration)', () => {
    expect(parseISODuration('PT0S')).toBe(0)
  })

  it('should return 0 for PT0H0M0S (all zeros)', () => {
    expect(parseISODuration('PT0H0M0S')).toBe(0)
  })

  it('should return 0 for bare PT (regex matches with optional groups)', () => {
    expect(parseISODuration('PT')).toBe(0)
  })

  it('should return Infinity for empty string', () => {
    expect(parseISODuration('')).toBe(Infinity)
  })

  it('should parse large PT100H to 360000 seconds', () => {
    expect(parseISODuration('PT100H')).toBe(360000)
  })

  it('should parse PT999S to 999 seconds', () => {
    expect(parseISODuration('PT999S')).toBe(999)
  })

  it('should return Infinity for P1DT2H (days not supported)', () => {
    expect(parseISODuration('P1DT2H')).toBe(Infinity)
  })

  it('should return Infinity for random string without PT prefix', () => {
    expect(parseISODuration('foobar')).toBe(Infinity)
  })
})

// ─── isShort ────────────────────────────────────────────────────────────────────

describe('isShort', () => {
  it('should return true for PT15S', () => {
    expect(isShort('PT15S')).toBe(true)
  })

  it('should return true for PT59S (just under boundary)', () => {
    expect(isShort('PT59S')).toBe(true)
  })

  it('should return true for PT60S (exactly at boundary)', () => {
    expect(isShort('PT60S')).toBe(true)
  })

  it('should return false for PT61S (just over boundary)', () => {
    expect(isShort('PT61S')).toBe(false)
  })

  it('should return true for PT1M (60 seconds)', () => {
    expect(isShort('PT1M')).toBe(true)
  })

  it('should return false for PT1M1S (61 seconds)', () => {
    expect(isShort('PT1M1S')).toBe(false)
  })

  it('should return true for PT0S (zero seconds)', () => {
    expect(isShort('PT0S')).toBe(true)
  })

  it('should return false for PT10M (10 minutes)', () => {
    expect(isShort('PT10M')).toBe(false)
  })

  it('should return false for Infinity (malformed duration is not short)', () => {
    expect(isShort('foobar')).toBe(false)
    expect(isShort('')).toBe(false)
    expect(isShort('P1DT2H')).toBe(false)
  })
})

// ─── isDurable ──────────────────────────────────────────────────────────────────

describe('isDurable', () => {
  it('should return true for a video longer than 60s', () => {
    expect(isDurable(makeVideo({ duration: 'PT61S', publishedAt: new Date().toISOString() }))).toBe(true)
  })

  it('should return false for a video of exactly 60s', () => {
    expect(isDurable(makeVideo({ duration: 'PT60S', publishedAt: new Date().toISOString() }))).toBe(false)
  })

  it('should return false for a 15s short', () => {
    expect(isDurable(makeVideo({ duration: 'PT15S', publishedAt: new Date().toISOString() }))).toBe(false)
  })

  it('should return true for a 10-minute video', () => {
    expect(isDurable(makeVideo({ duration: 'PT10M', publishedAt: new Date().toISOString() }))).toBe(true)
  })

  it('should return true for Infinity duration (malformed treated as non-short)', () => {
    expect(isDurable(makeVideo({ duration: 'foobar', publishedAt: new Date().toISOString() }))).toBe(true)
    expect(isDurable(makeVideo({ duration: 'P1DT2H', publishedAt: new Date().toISOString() }))).toBe(true)
  })
})

// ─── hoursSince ─────────────────────────────────────────────────────────────────

describe('hoursSince', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-20T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return 24 for a video published exactly 24h ago', () => {
    const v = makeVideo({ publishedAt: '2026-05-19T12:00:00Z' })
    expect(hoursSince(v)).toBe(24)
  })

  it('should return 2 for a video published 2h ago', () => {
    const v = makeVideo({ publishedAt: '2026-05-20T10:00:00Z' })
    expect(hoursSince(v)).toBe(2)
  })

  it('should return 0.5 for a video published 30min ago', () => {
    const v = makeVideo({ publishedAt: '2026-05-20T11:30:00Z' })
    expect(hoursSince(v)).toBe(0.5)
  })

  it('should return 48 for a video published 48h ago', () => {
    const v = makeVideo({ publishedAt: '2026-05-18T12:00:00Z' })
    expect(hoursSince(v)).toBe(48)
  })

  it('should return 0 for a video published at the same time as now', () => {
    const v = makeVideo({ publishedAt: '2026-05-20T12:00:00Z' })
    expect(hoursSince(v)).toBe(0)
  })

  it('should return a negative value for a future date', () => {
    const v = makeVideo({ publishedAt: '2026-05-21T12:00:00Z' })
    expect(hoursSince(v)).toBe(-24)
  })
})

// ─── selectBestVideo ────────────────────────────────────────────────────────────

describe('selectBestVideo', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-20T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return null for an empty array', () => {
    expect(selectBestVideo([])).toBeNull()
  })

  it('should return the only video when there is a single non-short', () => {
    const v = makeVideo({ publishedAt: '2026-05-19T12:00:00Z' })
    expect(selectBestVideo([v])).toBe(v)
  })

  it('should return the only video when there is a single short', () => {
    const v = makeVideo({ duration: 'PT15S', publishedAt: '2026-05-20T11:00:00Z' })
    expect(selectBestVideo([v])).toBe(v)
  })

  it('should pick the most recent short when only shorts exist', () => {
    const newer = makeVideo({
      id: 'short-newer',
      duration: 'PT30S',
      publishedAt: '2026-05-20T11:00:00Z',
      views: 1000,
      likes: 50,
      comments: 20,
    })
    const older = makeVideo({
      id: 'short-older',
      duration: 'PT15S',
      publishedAt: '2026-05-20T10:00:00Z',
      views: 5000,
      likes: 10,
      comments: 2,
    })
    expect(selectBestVideo([newer, older])!.id).toBe('short-newer')
  })

  it('should pick the most recent non-short even when a mature one exists', () => {
    const recent = makeVideo({
      id: 'recent',
      publishedAt: '2026-05-20T10:00:00Z',
      views: 10000,
    })
    const mature = makeVideo({
      id: 'mature',
      publishedAt: '2026-05-18T12:00:00Z',
      views: 5000,
    })
    expect(selectBestVideo([recent, mature])!.id).toBe('recent')
  })

  it('should pick the most recent non-short when no mature videos exist', () => {
    // YouTube API returns videos ordered by date desc (newest first)
    const newer = makeVideo({
      id: 'one-hour-newer',
      publishedAt: '2026-05-20T11:00:00Z',
      views: 200,
    })
    const older = makeVideo({
      id: 'three-hours-older',
      publishedAt: '2026-05-20T09:00:00Z',
      views: 1000,
    })
    expect(selectBestVideo([newer, older])!.id).toBe('one-hour-newer')
  })

  it('should pick the most recent non-short even when all are < 1h old', () => {
    const newer = makeVideo({
      id: 'recent-newer',
      publishedAt: '2026-05-20T11:45:00Z',
      views: 3000,
    })
    const older = makeVideo({
      id: 'recent-older',
      publishedAt: '2026-05-20T11:30:00Z',
      views: 500,
    })
    expect(selectBestVideo([newer, older])!.id).toBe('recent-newer')
  })

  it('should fall back to the most recent short when no non-shorts exist', () => {
    const newer = makeVideo({
      id: 's2',
      duration: 'PT30S',
      publishedAt: '2026-05-20T11:00:00Z',
      likes: 20,
      comments: 10,
    })
    const older = makeVideo({
      id: 's1',
      duration: 'PT15S',
      publishedAt: '2026-05-20T10:00:00Z',
      likes: 5,
      comments: 1,
    })
    expect(selectBestVideo([newer, older])!.id).toBe('s2')
  })

  it('should ignore shorts when deciding among non-shorts', () => {
    const short = makeVideo({
      id: 'short',
      duration: 'PT15S',
      publishedAt: '2026-05-19T10:00:00Z',
      views: 999999,
      likes: 999,
      comments: 999,
    })
    const mature = makeVideo({
      id: 'mature',
      publishedAt: '2026-05-18T12:00:00Z',
      views: 5000,
    })
    expect(selectBestVideo([short, mature])!.id).toBe('mature')
  })

  it('should return the most recent non-short regardless of maturity', () => {
    const older = makeVideo({
      id: 'mature-1',
      publishedAt: '2026-05-17T12:00:00Z',
      views: 100,
    })
    const newer = makeVideo({
      id: 'mature-2',
      publishedAt: '2026-05-18T12:00:00Z',
      views: 999999,
    })
    expect(selectBestVideo([newer, older])!.id).toBe('mature-2')
  })

  it('should correctly handle boundary where hoursSince is exactly 24 (not > 24)', () => {
    const exactly24h = makeVideo({
      id: 'exactly-24h',
      publishedAt: '2026-05-19T12:00:00Z',
      views: 100,
    })
    const recentHigh = makeVideo({
      id: 'recent-2h',
      publishedAt: '2026-05-20T10:00:00Z',
      views: 50000,
    })
    // exactly24h is not > 24, so no mature videos. Falls to most recent non-short.
    // The array order determines recency: exactly24h is first (older), recentHigh is second (newer)
    expect(selectBestVideo([exactly24h, recentHigh])!.id).toBe('exactly-24h')
  })

  it('should treat videos with Infinity duration (malformed) as non-shorts', () => {
    const infiniteDur = makeVideo({
      id: 'infinite',
      duration: 'foobar',
      publishedAt: '2026-05-18T12:00:00Z',
      views: 99999,
    })
    const short = makeVideo({
      id: 'short',
      duration: 'PT15S',
      publishedAt: '2026-05-20T11:00:00Z',
      likes: 999,
    })
    // Infinite duration is not isShort → treated as durable, so it wins
    expect(selectBestVideo([short, infiniteDur])!.id).toBe('infinite')
  })

  it('should handle mix of shorts, recent non-shorts, and mature non-shorts', () => {
    const short = makeVideo({
      id: 'short',
      duration: 'PT15S',
      publishedAt: '2026-05-20T11:00:00Z',
    })
    const recentLow = makeVideo({
      id: 'recent-low',
      publishedAt: '2026-05-20T08:00:00Z',
      views: 500,
    })
    const mature = makeVideo({
      id: 'mature',
      publishedAt: '2026-05-17T12:00:00Z',
      views: 200,
    })
    // Most recent non-short is recent-low (08:00 today), mature is older
    expect(selectBestVideo([short, recentLow, mature])!.id).toBe('recent-low')
  })
})
