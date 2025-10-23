/**
 * Utilities for cache-based updates and optimistic UI
 */

import {
  invalidateMarketCache,
  invalidateOddsCache,
  invalidateUserBetsCache,
  cacheMarket,
  cacheOdds,
} from '@/lib/kv';
import type { CachedMarket, CachedOutcome } from '@/lib/kv/types';

/**
 * Update market cache after a bet is placed
 */
export async function updateMarketCacheAfterBet(
  marketId: string,
  outcomeId: number,
  betAmount: bigint,
  currentMarket: CachedMarket
): Promise<CachedMarket> {
  // Calculate new totals
  const updatedOutcomes = currentMarket.outcomes.map((outcome) => {
    if (outcome.outcomeId === outcomeId) {
      return {
        ...outcome,
        totalBets: (BigInt(outcome.totalBets) + betAmount).toString(),
      };
    }
    return outcome;
  });

  const newTotalPool = (
    BigInt(currentMarket.totalPool) + betAmount
  ).toString();

  const updatedMarket: CachedMarket = {
    ...currentMarket,
    totalPool: newTotalPool,
    participantCount: currentMarket.participantCount + 1,
    outcomes: updatedOutcomes,
    cachedAt: Date.now(),
  };

  // Update cache
  await cacheMarket(marketId, updatedMarket);

  // Invalidate odds cache to force recalculation
  await invalidateOddsCache(marketId);

  return updatedMarket;
}

/**
 * Calculate optimistic odds after a bet
 * Uses simplified constant product formula
 */
export function calculateOptimisticOdds(
  outcomes: CachedOutcome[],
  betOutcomeId: number,
  betAmount: bigint
): number[] {
  const totalPool = outcomes.reduce(
    (sum, outcome) => sum + BigInt(outcome.totalBets),
    0n
  );

  const newTotalPool = totalPool + betAmount;

  return outcomes.map((outcome, index) => {
    let newLiquidity = BigInt(outcome.totalBets);
    
    if (index === betOutcomeId) {
      newLiquidity += betAmount;
    }

    if (newLiquidity === 0n) {
      return outcomes.length; // Equal odds if no bets
    }

    // Odds = totalPool / outcomeLiquidity
    const odds = Number(newTotalPool) / Number(newLiquidity);
    
    // Apply minimum odds of 1.01
    return Math.max(odds, 1.01);
  });
}

/**
 * Invalidate all caches related to a market
 */
export async function invalidateMarketCaches(
  marketId: string,
  userFid?: number
): Promise<void> {
  await Promise.all([
    invalidateMarketCache(marketId),
    invalidateOddsCache(marketId),
    userFid ? invalidateUserBetsCache(userFid) : Promise.resolve(),
  ]);
}

/**
 * Optimistically update odds in cache
 */
export async function updateOddsCache(
  marketId: string,
  newOdds: number[]
): Promise<void> {
  await cacheOdds(marketId, newOdds);
}

/**
 * Create optimistic market update for UI
 */
export function createOptimisticMarketUpdate(
  currentMarket: CachedMarket,
  outcomeId: number,
  betAmount: bigint
): CachedMarket {
  const updatedOutcomes = currentMarket.outcomes.map((outcome) => {
    if (outcome.outcomeId === outcomeId) {
      const newTotalBets = (BigInt(outcome.totalBets) + betAmount).toString();
      const newOdds = calculateOptimisticOdds(
        currentMarket.outcomes,
        outcomeId,
        betAmount
      );
      
      return {
        ...outcome,
        totalBets: newTotalBets,
        odds: newOdds[outcomeId],
      };
    }
    return outcome;
  });

  return {
    ...currentMarket,
    totalPool: (BigInt(currentMarket.totalPool) + betAmount).toString(),
    participantCount: currentMarket.participantCount + 1,
    outcomes: updatedOutcomes,
    cachedAt: Date.now(),
  };
}

/**
 * Batch invalidate multiple market caches
 */
export async function batchInvalidateMarkets(
  marketIds: string[]
): Promise<void> {
  await Promise.all(
    marketIds.map((id) => invalidateMarketCaches(id))
  );
}

/**
 * Check if cache is stale
 */
export function isCacheStale(
  cachedAt: number,
  maxAge: number = 30000 // 30 seconds default
): boolean {
  return Date.now() - cachedAt > maxAge;
}

/**
 * Get cache freshness indicator
 */
export function getCacheFreshness(cachedAt: number): {
  isFresh: boolean;
  age: number;
  ageText: string;
} {
  const age = Date.now() - cachedAt;
  const seconds = Math.floor(age / 1000);
  
  let ageText: string;
  if (seconds < 60) {
    ageText = `${seconds}s ago`;
  } else {
    const minutes = Math.floor(seconds / 60);
    ageText = `${minutes}m ago`;
  }

  return {
    isFresh: age < 30000, // Fresh if less than 30s old
    age,
    ageText,
  };
}
