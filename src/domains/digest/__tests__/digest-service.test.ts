import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('DigestService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be importable', async () => {
    const { generateAndSendDigest, runDailyDigest } = await import('../digest-service.js');
    expect(typeof generateAndSendDigest).toBe('function');
    expect(typeof runDailyDigest).toBe('function');
  });
});
