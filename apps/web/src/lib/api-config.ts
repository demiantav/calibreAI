/**
 * API Configuration
 * Uses Vite env variable VITE_API_URL, falls back to localhost for dev.
 * In production, set VITE_API_URL to the deployed backend URL.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

/**
 * Get the default headers for API requests.
 * Includes x-api-key when available in localStorage.
 */
export function getApiHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const apiKey = typeof window !== 'undefined' ? localStorage.getItem('calibre-api-key') : null;
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }
  return headers;
}
