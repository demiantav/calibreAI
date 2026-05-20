import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

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
