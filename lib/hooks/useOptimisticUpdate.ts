'use client';

import { useState, useCallback, useRef } from 'react';

export interface OptimisticUpdateOptions<T> {
  /**
   * Function to perform the actual update
   */
  updateFn: () => Promise<T>;
  
  /**
   * Function to apply optimistic update to current data
   */
  optimisticFn: (currentData: T | null) => T;
  
  /**
   * Callback on successful update
   */
  onSuccess?: (data: T) => void;
  
  /**
   * Callback on error (with rollback data)
   */
  onError?: (error: Error, rollbackData: T | null) => void;
  
  /**
   * Callback on rollback
   */
  onRollback?: (data: T | null) => void;
}

export interface OptimisticUpdateReturn<T> {
  /**
   * Current data (optimistic or actual)
   */
  data: T | null;
  
  /**
   * Whether an update is in progress
   */
  isUpdating: boolean;
  
  /**
   * Whether showing optimistic data
   */
  isOptimistic: boolean;
  
  /**
   * Last error if any
   */
  error: Error | null;
  
  /**
   * Execute the optimistic update
   */
  execute: () => Promise<void>;
  
  /**
   * Manually set data
   */
  setData: (data: T | null) => void;
  
  /**
   * Reset to initial state
   */
  reset: () => void;
}

/**
 * Hook for optimistic UI updates
 * 
 * Immediately updates the UI with predicted data, then performs the actual
 * update in the background. Rolls back on error.
 * 
 * @example
 * ```tsx
 * const { data, execute, isOptimistic } = useOptimisticUpdate({
 *   updateFn: async () => {
 *     const res = await fetch('/api/bet', { method: 'POST', ... });
 *     return res.json();
 *   },
 *   optimisticFn: (current) => ({
 *     ...current,
 *     totalBets: current.totalBets + betAmount,
 *   }),
 *   onSuccess: (data) => console.log('Update confirmed:', data),
 *   onError: (error) => console.error('Update failed, rolled back:', error),
 * });
 * 
 * // In your component
 * <button onClick={execute}>Place Bet</button>
 * {isOptimistic && <span>Confirming...</span>}
 * ```
 */
export function useOptimisticUpdate<T>({
  updateFn,
  optimisticFn,
  onSuccess,
  onError,
  onRollback,
}: OptimisticUpdateOptions<T>): OptimisticUpdateReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOptimistic, setIsOptimistic] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const rollbackDataRef = useRef<T | null>(null);

  const execute = useCallback(async () => {
    setIsUpdating(true);
    setError(null);
    
    // Store current data for potential rollback
    rollbackDataRef.current = data;
    
    // Apply optimistic update
    const optimisticData = optimisticFn(data);
    setData(optimisticData);
    setIsOptimistic(true);
    
    try {
      // Perform actual update
      const result = await updateFn();
      
      // Update with actual data
      setData(result);
      setIsOptimistic(false);
      onSuccess?.(result);
    } catch (err) {
      // Rollback on error
      const error = err instanceof Error ? err : new Error('Update failed');
      setError(error);
      setData(rollbackDataRef.current);
      setIsOptimistic(false);
      onError?.(error, rollbackDataRef.current);
      onRollback?.(rollbackDataRef.current);
      throw error;
    } finally {
      setIsUpdating(false);
      rollbackDataRef.current = null;
    }
  }, [data, updateFn, optimisticFn, onSuccess, onError, onRollback]);

  const reset = useCallback(() => {
    setData(null);
    setIsUpdating(false);
    setIsOptimistic(false);
    setError(null);
    rollbackDataRef.current = null;
  }, []);

  return {
    data,
    isUpdating,
    isOptimistic,
    error,
    execute,
    setData,
    reset,
  };
}

/**
 * Hook for optimistic list updates (add/remove items)
 */
export function useOptimisticList<T extends { id: string | number }>(
  initialData: T[] = []
) {
  const [items, setItems] = useState<T[]>(initialData);
  const [optimisticIds, setOptimisticIds] = useState<Set<string | number>>(
    new Set()
  );

  const addOptimistic = useCallback((item: T) => {
    setItems((prev) => [...prev, item]);
    setOptimisticIds((prev) => new Set(prev).add(item.id));
  }, []);

  const removeOptimistic = useCallback((id: string | number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setOptimisticIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const confirmOptimistic = useCallback((id: string | number, actualData?: T) => {
    if (actualData) {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? actualData : item))
      );
    }
    setOptimisticIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const rollbackOptimistic = useCallback((id: string | number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setOptimisticIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const isOptimistic = useCallback(
    (id: string | number) => optimisticIds.has(id),
    [optimisticIds]
  );

  return {
    items,
    setItems,
    addOptimistic,
    removeOptimistic,
    confirmOptimistic,
    rollbackOptimistic,
    isOptimistic,
    hasOptimistic: optimisticIds.size > 0,
  };
}
