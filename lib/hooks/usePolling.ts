'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

export interface UsePollingOptions<T> {
  /**
   * Function to fetch data
   */
  fetchFn: () => Promise<T>;
  
  /**
   * Polling interval in milliseconds
   * @default 30000 (30 seconds)
   */
  interval?: number;
  
  /**
   * Whether polling is enabled
   * @default true
   */
  enabled?: boolean;
  
  /**
   * Callback when data is successfully fetched
   */
  onSuccess?: (data: T) => void;
  
  /**
   * Callback when fetch fails
   */
  onError?: (error: Error) => void;
  
  /**
   * Whether to fetch immediately on mount
   * @default true
   */
  fetchOnMount?: boolean;
  
  /**
   * Whether to continue polling on error
   * @default true
   */
  continueOnError?: boolean;
}

export interface UsePollingReturn<T> {
  /**
   * Current data
   */
  data: T | null;
  
  /**
   * Whether currently fetching
   */
  isLoading: boolean;
  
  /**
   * Last error if any
   */
  error: Error | null;
  
  /**
   * Last successful fetch timestamp
   */
  lastUpdate: Date | null;
  
  /**
   * Manually trigger a fetch
   */
  refetch: () => Promise<void>;
  
  /**
   * Start polling
   */
  start: () => void;
  
  /**
   * Stop polling
   */
  stop: () => void;
  
  /**
   * Whether polling is currently active
   */
  isPolling: boolean;
}

/**
 * Generic polling hook for fetching data at regular intervals
 * 
 * @example
 * ```tsx
 * const { data, isLoading, refetch } = usePolling({
 *   fetchFn: async () => {
 *     const res = await fetch('/api/data');
 *     return res.json();
 *   },
 *   interval: 30000, // 30 seconds
 *   onSuccess: (data) => console.log('Updated:', data),
 * });
 * ```
 */
export function usePolling<T>({
  fetchFn,
  interval = 30000,
  enabled = true,
  onSuccess,
  onError,
  fetchOnMount = true,
  continueOnError = true,
}: UsePollingOptions<T>): UsePollingReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isPolling, setIsPolling] = useState(enabled);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const fetch = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      
      if (!isMountedRef.current) return;
      
      setData(result);
      setLastUpdate(new Date());
      onSuccess?.(result);
    } catch (err) {
      if (!isMountedRef.current) return;
      
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
      
      if (!continueOnError) {
        stop();
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [fetchFn, onSuccess, onError, continueOnError]);

  const start = useCallback(() => {
    setIsPolling(true);
  }, []);

  const stop = useCallback(() => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetch();
  }, [fetch]);

  // Set up polling interval
  useEffect(() => {
    // If manually stopped or (not enabled and not manually started)
    if (!isPolling) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial fetch
    if (fetchOnMount) {
      fetch();
    }

    // Set up interval
    intervalRef.current = setInterval(fetch, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPolling, interval, fetch, fetchOnMount]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    lastUpdate,
    refetch,
    start,
    stop,
    isPolling,
  };
}
