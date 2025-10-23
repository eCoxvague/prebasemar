'use client';

import { useCallback, useMemo } from 'react';
import { usePolling } from './usePolling';
import type { CachedOutcome } from '@/lib/kv/types';

interface OddsData {
  marketId: string;
  odds: number[];
  outcomes: Array<{
    outcomeId: number;
    name: string;
    odds: number;
    totalBets: string;
  }>;
  cachedAt: number;
  impact?: number[];
  slippage?: number;
  potentialWinnings?: string;
}

export interface UseMarketOddsOptions {
  /**
   * Market ID to fetch odds for
   */
  marketId: string;
  
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
   * Callback when odds are updated
   */
  onUpdate?: (odds: OddsData) => void;
  
  /**
   * Optional bet amount for impact calculation (in wei)
   */
  betAmount?: string;
  
  /**
   * Optional outcome ID for impact calculation
   */
  outcomeId?: number;
}

export interface UseMarketOddsReturn {
  /**
   * Current odds data
   */
  odds: number[] | null;
  
  /**
   * Outcomes with odds
   */
  outcomes: CachedOutcome[] | null;
  
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
   * Manually trigger a refresh
   */
  refresh: () => Promise<void>;
  
  /**
   * Start polling
   */
  startPolling: () => void;
  
  /**
   * Stop polling
   */
  stopPolling: () => void;
  
  /**
   * Whether polling is currently active
   */
  isPolling: boolean;
  
  /**
   * Odds impact data (if betAmount and outcomeId provided)
   */
  impact: {
    newOdds: number[];
    slippage: number;
    potentialWinnings: string;
  } | null;
}

/**
 * Hook for polling market odds with automatic updates
 * 
 * @example
 * ```tsx
 * const { odds, outcomes, refresh, isLoading } = useMarketOdds({
 *   marketId: '123',
 *   interval: 30000, // 30 seconds
 *   onUpdate: (data) => console.log('Odds updated:', data),
 * });
 * ```
 */
export function useMarketOdds({
  marketId,
  interval = 30000,
  enabled = true,
  onUpdate,
  betAmount,
  outcomeId,
}: UseMarketOddsOptions): UseMarketOddsReturn {
  const fetchOdds = useCallback(async () => {
    const params = new URLSearchParams();
    if (betAmount) params.set('betAmount', betAmount);
    if (outcomeId !== undefined) params.set('outcomeId', outcomeId.toString());
    
    const url = `/api/odds/${marketId}${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch odds');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch odds');
    }
    
    return result.data;
  }, [marketId, betAmount, outcomeId]);

  const {
    data,
    isLoading,
    error,
    lastUpdate,
    refetch,
    start,
    stop,
    isPolling,
  } = usePolling<OddsData>({
    fetchFn: fetchOdds,
    interval,
    enabled: enabled && !!marketId,
    onSuccess: onUpdate,
    fetchOnMount: true,
    continueOnError: true,
  });

  const outcomes = useMemo(() => {
    if (!data?.outcomes) return null;
    
    return data.outcomes.map(outcome => ({
      outcomeId: outcome.outcomeId,
      name: outcome.name,
      odds: outcome.odds,
      totalBets: outcome.totalBets,
    })) as CachedOutcome[];
  }, [data]);

  const impact = useMemo(() => {
    if (!data?.impact || !data?.slippage || !data?.potentialWinnings) {
      return null;
    }
    
    return {
      newOdds: data.impact,
      slippage: data.slippage,
      potentialWinnings: data.potentialWinnings,
    };
  }, [data]);

  return {
    odds: data?.odds || null,
    outcomes,
    isLoading,
    error,
    lastUpdate,
    refresh: refetch,
    startPolling: start,
    stopPolling: stop,
    isPolling,
    impact,
  };
}

/**
 * Hook for manually refreshing odds (bypasses cache)
 */
export function useRefreshOdds(marketId: string) {
  const refresh = useCallback(async () => {
    const response = await fetch(`/api/odds/${marketId}/refresh`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to refresh odds');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to refresh odds');
    }
    
    return result.data;
  }, [marketId]);

  return { refresh };
}
