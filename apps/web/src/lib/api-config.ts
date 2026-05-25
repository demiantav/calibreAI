/**
 * API Configuration
 * Uses Vite env variable VITE_API_URL, falls back to localhost for dev.
 * In production, set VITE_API_URL to the deployed backend URL.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

/**
 * Get the default auth headers for API requests (no Content-Type).
 * Use getJsonHeaders() for POST/PATCH/PUT requests that send a JSON body.
 */
export function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {};
  const token = typeof window !== 'undefined' ? localStorage.getItem('calibre-jwt') : null;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Get headers for requests with a JSON body (POST/PATCH/PUT).
 * Includes Content-Type + JWT Authorization.
 */
export function getJsonHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
  };
}

/**
 * @deprecated Use getAuthHeaders() for GET/DELETE, getJsonHeaders() for POST/PATCH/PUT.
 * This alias avoids Content-Type on GET requests (which was causing CORS preflight edge cases).
 */
export function getApiHeaders(): HeadersInit {
  return getAuthHeaders();
}
