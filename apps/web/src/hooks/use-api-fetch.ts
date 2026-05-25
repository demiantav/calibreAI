import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL, getAuthHeaders, getJsonHeaders } from '@/lib/api-config';

export interface ApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApiFetch<T>(
  endpoint: string,
  options?: RequestInit
): ApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use ref to avoid stale closure issues with options
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const fetchData = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    setIsLoading(true);
    setError(null);

    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const method = (optionsRef.current?.method || 'GET').toUpperCase();
      const authHeaders = ['POST', 'PATCH', 'PUT'].includes(method)
        ? getJsonHeaders()
        : getAuthHeaders();
      const mergedOptions: RequestInit = {
        ...optionsRef.current,
        headers: {
          ...authHeaders,
          ...optionsRef.current?.headers,
        },
        signal: controller.signal,
      };

      const response = await fetch(url, mergedOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to load data: ${response.status} ${response.statusText}`);
      }
      const json = await response.json();
      setData(json);
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
        setError(message);
      }
      // Keep stale data visible on error — don't clear it
    } finally {
      setIsLoading(false);
    }

    return controller;
  }, [endpoint]);

  useEffect(() => {
    let controller: AbortController | undefined;

    const run = async () => {
      controller = await fetchData();
    };
    run();

    return () => {
      if (controller) {
        controller.abort();
      }
    };
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch };
}
