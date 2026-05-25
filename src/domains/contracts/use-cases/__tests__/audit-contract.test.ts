import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('auditContractUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be importable', async () => {
    const { auditContractUseCase } = await import('../audit-contract.js');
    expect(typeof auditContractUseCase).toBe('function');
  });
});
