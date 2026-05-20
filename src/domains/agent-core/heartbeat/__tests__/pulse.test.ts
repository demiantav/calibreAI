import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ─── Hoisted mocks for runDegradedMode ──────────────────────────────────────

const mockSupabaseInsert = vi.hoisted(() =>
  vi.fn(() => Promise.resolve({ error: null })),
)
const mockSupabaseMaybeSingle = vi.hoisted(() =>
  vi.fn(() => Promise.resolve({ data: null, error: null })),
)

vi.mock('../../../../infrastructure/supabase/supabase-client.js', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: mockSupabaseMaybeSingle })) })),
      insert: mockSupabaseInsert,
    })),
  },
}))

vi.mock('../../../../shared/config.js', () => ({
  config: {
    CREATOR_NAME: 'TestCreator',
    YOUTUBE_CHANNEL_ID: 'UC-test',
    AUTHENTICATED_USER_EMAIL: 'test@example.com',
  },
}))

const mockGetYouTubeMetrics = vi.hoisted(() => vi.fn())
const mockGetPreviousInsights = vi.hoisted(() => vi.fn())
const mockUpdateLiveMediaKit = vi.hoisted(() => vi.fn())
const mockListEmails = vi.hoisted(() => vi.fn())
const mockGenerateAndDraftPitch = vi.hoisted(() => vi.fn())
const mockCalculateSponsorshipValue = vi.hoisted(() => vi.fn())

vi.mock('../../reasoning/tool-executor.js', () => ({
  executeToolCall: vi.fn(),
  functionsImplementations: {
    getYouTubeMetrics: mockGetYouTubeMetrics,
    getPreviousInsights: mockGetPreviousInsights,
    updateLiveMediaKit: mockUpdateLiveMediaKit,
    listEmails: mockListEmails,
    generateAndDraftPitch: mockGenerateAndDraftPitch,
    calculateSponsorshipValue: mockCalculateSponsorshipValue,
  },
}))

import { runDegradedMode } from '../pulse.js'

// ─── Function under test (matches iterative version in pulse.ts) ─────────────

const sendMessageWithRetry = async (chat: any, message: any, retries = 3): Promise<any> => {
  let attempt = 0;
  while (true) {
    try {
      return await chat.sendMessage(message);
    } catch (error: any) {
      if (error.status !== 429 || attempt >= retries) {
        throw error;
      }
      attempt++;
      const retryDetail = error.errorDetails?.find((d: any) => d.retryInfo?.retryDelay);
      const waitTime = retryDetail
        ? parseFloat(retryDetail.retryInfo.retryDelay) * 1000
        : 15000;
      await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 30000)));
    }
  }
};

// ─── Tests ──────────────────────────────────────────────────────────────────────

describe('sendMessageWithRetry', () => {
  let chat: { sendMessage: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    vi.useFakeTimers()
    chat = { sendMessage: vi.fn() }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return result when sendMessage succeeds on first try', async () => {
    chat.sendMessage.mockResolvedValueOnce('success')

    const promise = sendMessageWithRetry(chat, 'hello')
    const result = await promise

    expect(result).toBe('success')
    expect(chat.sendMessage).toHaveBeenCalledTimes(1)
    expect(chat.sendMessage).toHaveBeenCalledWith('hello')
  })

  it('should retry on 429 and succeed on second attempt', async () => {
    chat.sendMessage
      .mockRejectedValueOnce({ status: 429, errorDetails: [{ retryInfo: { retryDelay: '1s' } }] })
      .mockResolvedValueOnce('success')

    const promise = sendMessageWithRetry(chat, 'hello')

    // Advance past the 1s retry delay
    await vi.advanceTimersByTimeAsync(1000)

    const result = await promise
    expect(result).toBe('success')
    expect(chat.sendMessage).toHaveBeenCalledTimes(2)
  })

  it('should use default 15s wait when 429 has no retryDelay', async () => {
    chat.sendMessage
      .mockRejectedValueOnce({ status: 429, errorDetails: [] })
      .mockResolvedValueOnce('success')

    const promise = sendMessageWithRetry(chat, 'hello')
    await vi.advanceTimersByTimeAsync(15000)

    const result = await promise
    expect(result).toBe('success')
    expect(chat.sendMessage).toHaveBeenCalledTimes(2)
  })

  it('should cap retryDelay at 30s when server requests more', async () => {
    chat.sendMessage
      .mockRejectedValueOnce({ status: 429, errorDetails: [{ retryInfo: { retryDelay: '60s' } }] })
      .mockResolvedValueOnce('success')

    const promise = sendMessageWithRetry(chat, 'hello')
    await vi.advanceTimersByTimeAsync(30000) // capped, not 60s

    const result = await promise
    expect(result).toBe('success')
    expect(chat.sendMessage).toHaveBeenCalledTimes(2)
  })

  it('should throw when retries are 0 and 429 occurs (no retry left)', async () => {
    chat.sendMessage.mockRejectedValue({ status: 429 })

    await expect(sendMessageWithRetry(chat, 'hello', 0)).rejects.toEqual({ status: 429 })
    expect(chat.sendMessage).toHaveBeenCalledTimes(1)
  })

  it('should throw after exhausting all 3 retries', async () => {
    vi.useRealTimers()

    const error429 = { status: 429, errorDetails: [{ retryInfo: { retryDelay: '0.001s' } }] }
    chat.sendMessage.mockRejectedValue(error429)

    await expect(sendMessageWithRetry(chat, 'hello', 3)).rejects.toEqual(error429)
    expect(chat.sendMessage).toHaveBeenCalledTimes(4)
  }, 10000)

  it('should throw immediately on non-429 error', async () => {
    const authError = { status: 401, message: 'Unauthorized' }
    chat.sendMessage.mockRejectedValueOnce(authError)

    await expect(sendMessageWithRetry(chat, 'hello')).rejects.toEqual(authError)
    expect(chat.sendMessage).toHaveBeenCalledTimes(1)
  })

  it('should throw immediately on 500 error', async () => {
    const serverError = new Error('Internal server error')
    chat.sendMessage.mockRejectedValueOnce(serverError)

    await expect(sendMessageWithRetry(chat, 'hello')).rejects.toThrow('Internal server error')
    expect(chat.sendMessage).toHaveBeenCalledTimes(1)
  })
})

// ─── runDegradedMode smoke tests ────────────────────────────────────────────

function baseMetrics(overrides: Record<string, any> = {}) {
  return {
    subscriberCount: 150000,
    totalViews: 5000000,
    lastVideoViews: 120000,
    lastVideoLikes: 8500,
    lastVideoComments: 1200,
    engagementRate: 6.5,
    channelName: 'TestChannel',
    ...overrides,
  }
}

function sponsorshipForecast() {
  return {
    mention: { min: 900, max: 1300, currency: 'USD' },
    dedicated: { min: 2600, max: 3500, currency: 'USD' },
    series: { min: 6200, max: 8000, currency: 'USD' },
  }
}

describe('runDegradedMode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: all tools succeed
    mockGetYouTubeMetrics.mockResolvedValueOnce(baseMetrics())
    mockGetPreviousInsights.mockResolvedValueOnce([{
      content: { subscribers: 140000, totalViews: 4800000 },
    }])
    mockUpdateLiveMediaKit.mockResolvedValueOnce({ status: 'ok' })
    mockListEmails.mockResolvedValueOnce({
      content: [{ text: JSON.stringify([]) }],
    })
    mockCalculateSponsorshipValue.mockResolvedValueOnce(sponsorshipForecast())
  })

  it('generates and persists summary when all tools succeed', async () => {
    await runDegradedMode('UC-test')

    const insertCall = mockSupabaseInsert.mock.calls[0]?.[0]?.[0]
    expect(insertCall.type).toBe('agent_summary')
    expect(insertCall.creator_name).toBe('TestCreator')
    expect(insertCall.content.text).toContain('150,000')
    expect(insertCall.content.text).toContain('5,000,000')
    expect(insertCall.content.text).toContain('6.50%')
    expect(insertCall.content.text).toContain('sólido') // engagement >5%
    expect(insertCall.content.text).toContain('$900')
    expect(insertCall.content.text).toContain('$2600')
    expect(insertCall.content.text).toContain('Creciste')
    expect(insertCall.insights).toContain('150,000 subs')
  })

  it('inserts agent_error when YouTube metrics fail', async () => {
    // Override: YouTube fails
    mockGetYouTubeMetrics.mockReset()
    mockGetYouTubeMetrics.mockRejectedValueOnce(new Error('API error'))

    await runDegradedMode('UC-test')

    const errorCall = mockSupabaseInsert.mock.calls[0]?.[0]?.[0]
    expect(errorCall.type).toBe('agent_error')
    expect(errorCall.content.text).toContain('no pudo obtener métricas')
    // No further inserts (early return)
    expect(mockSupabaseInsert).toHaveBeenCalledTimes(1)
  })

  it('generates summary with fallbacks when emails and sponsorship fail', async () => {
    // Override: emails and sponsorship fail, low engagement
    mockGetYouTubeMetrics.mockReset()
    mockGetYouTubeMetrics.mockResolvedValueOnce(baseMetrics({
      subscriberCount: 50000,
      totalViews: 1000000,
      lastVideoViews: 30000,
      lastVideoLikes: 200,
      lastVideoComments: 50,
      engagementRate: 2.5,
    }))
    mockGetPreviousInsights.mockReset()
    mockGetPreviousInsights.mockResolvedValueOnce(null)
    mockListEmails.mockReset()
    mockListEmails.mockRejectedValueOnce(new Error('Gmail API down'))
    mockCalculateSponsorshipValue.mockReset()
    mockCalculateSponsorshipValue.mockRejectedValueOnce(new Error('Gemini 429'))

    await runDegradedMode('UC-test')

    const insertCall = mockSupabaseInsert.mock.calls[0]?.[0]?.[0]
    expect(insertCall.type).toBe('agent_summary')
    // Fallback rates used (defaults: 850/1200/2500/6000)
    expect(insertCall.content.text).toContain('$850')
    expect(insertCall.content.text).toContain('$2500')
    expect(insertCall.content.text).toContain('$6000')
    // Low engagement tier
    expect(insertCall.content.text).toContain('fase de crecimiento')
    // No previous insights → primer análisis
    expect(insertCall.content.text).toContain('primer análisis')
    // No pitches
    expect(insertCall.content.text).toContain('No se detectaron')
    expect(insertCall.insights).toContain('0 pitches')
  })

  it('detects brand emails, generates pitches, and includes brand names in summary', async () => {
    // Override: emails contain one brand email and one non-brand
    mockListEmails.mockReset()
    mockListEmails.mockResolvedValueOnce({
      content: [{
        text: JSON.stringify([
          { id: 'g1', subject: 'Colaboración', snippet: 'marca', from: '"Nike" <nike@test.com>' },
          { id: 'g2', subject: 'hello', snippet: 'casual chat', from: 'friend@gmail.com' },
        ]),
      }],
    })

    await runDegradedMode('UC-test')

    // Only the brand email triggers a pitch
    expect(mockGenerateAndDraftPitch).toHaveBeenCalledTimes(1)
    expect(mockGenerateAndDraftPitch).toHaveBeenCalledWith({
      creatorName: 'TestCreator',
      gmailId: 'g1',
    })

    const insertCall = mockSupabaseInsert.mock.calls[0]?.[0]?.[0]
    expect(insertCall.type).toBe('agent_summary')
    expect(insertCall.content.text).toContain('Nike')
    expect(insertCall.content.text).toContain('1 oportunidad')
    expect(insertCall.insights).toContain('1 pitches')
  })
})
