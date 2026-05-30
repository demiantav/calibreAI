import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../shared/config.js', () => ({
  config: {
    NODE_ENV: 'test',
    JWT_SECRET: 'test-secret-that-is-at-least-32-chars-long',
    GEMINI_API_KEY: 'test',
    YOUTUBE_API_KEY: 'test',
    GMAIL_CLIENT_ID: 'test',
    GMAIL_CLIENT_SECRET: 'test',
    SUPABASE_URL: 'http://localhost:54321',
    SUPABASE_SERVICE_ROLE_KEY: 'test',
  },
}));

vi.mock('../../../../infrastructure/supabase/supabase-client.js', () => ({
  supabase: { from: vi.fn() },
}));

describe('auditContractUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be importable', async () => {
    const { auditContractUseCase } = await import('../audit-contract.js');
    expect(typeof auditContractUseCase).toBe('function');
  });
});
