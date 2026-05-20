const pendingStates = new Map<string, number>();
const STATE_TTL_MS = 5 * 60 * 1000;

function cleanupExpired(): void {
  const now = Date.now();
  for (const [key, expires] of pendingStates) {
    if (now > expires) pendingStates.delete(key);
  }
}

export function createOAuthState(): string {
  cleanupExpired();
  const state = crypto.randomUUID();
  pendingStates.set(state, Date.now() + STATE_TTL_MS);
  return state;
}

export function verifyOAuthState(state: string): boolean {
  cleanupExpired();
  const expires = pendingStates.get(state);
  if (!expires) return false;
  pendingStates.delete(state);
  return Date.now() <= expires;
}
