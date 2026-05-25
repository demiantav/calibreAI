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

  it('runDailyDigest should handle DB errors gracefully', async () => {
    const { runDailyDigest } = await import('../digest-service.js');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await runDailyDigest();

    // When DB column doesn't exist yet (migration not run), it logs an error
    expect(consoleSpy).toHaveBeenCalledWith(
      '[DigestService] Error fetching users:',
      expect.any(Object)
    );
    consoleSpy.mockRestore();
  });
});
