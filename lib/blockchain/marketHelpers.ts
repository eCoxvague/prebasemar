import type { Address } from 'viem';
import type { CachedMarket, CachedOutcome } from '@/lib/kv/types';
import { mapMarketStatus, calculateOdds } from './contract';

/**
 * Transform blockchain market data to cached market format
 */
export function transformMarketData(
  chainMarket: any,
  chainOutcomes: any[]
): CachedMarket {
  const odds = calculateOdds(chainOutcomes);
  
  const outcomes: CachedOutcome[] = chainOutcomes.map((outcome, index) => ({
    outcomeId: Number(outcome.id),
    name: outcome.name,
    totalBets: outcome.totalBets.toString(),
    odds: odds[index],
  }));

  // Count unique bettors (this is simplified - in production you'd track this better)
  const participantCount = 0; // Will be calculated from events or separate tracking

  return {
    marketId: chainMarket.id.toString(),
    title: chainMarket.title,
    description: '', // Not stored on-chain, would come from IPFS or separate storage
    category: '', // Not stored on-chain, would come from metadata
    creator: chainMarket.creator.toLowerCase(),
    endTime: Number(chainMarket.endTime),
    status: Number(chainMarket.status),
    totalPool: chainMarket.totalPool.toString(),
    participantCount,
    outcomes,
    cachedAt: Date.now(),
  };
}

/**
 * Filter markets by status
 */
export function filterMarketsByStatus(
  markets: CachedMarket[],
  status?: string
): CachedMarket[] {
  if (!status) return markets;
  
  const statusMap: Record<string, number> = {
    active: 0,
    closed: 1,
    resolved: 2,
    cancelled: 3,
    disputed: 4,
  };

  const statusNum = statusMap[status.toLowerCase()];
  if (statusNum === undefined) return markets;

  return markets.filter((m) => m.status === statusNum);
}

/**
 * Filter markets by category
 */
export function filterMarketsByCategory(
  markets: CachedMarket[],
  category?: string
): CachedMarket[] {
  if (!category) return markets;
  return markets.filter(
    (m) => m.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Search markets by title
 */
export function searchMarkets(
  markets: CachedMarket[],
  search?: string
): CachedMarket[] {
  if (!search) return markets;
  const searchLower = search.toLowerCase();
  return markets.filter((m) =>
    m.title.toLowerCase().includes(searchLower)
  );
}

/**
 * Sort markets
 */
export function sortMarkets(
  markets: CachedMarket[],
  sortBy: 'newest' | 'ending-soon' | 'popular' = 'newest'
): CachedMarket[] {
  const sorted = [...markets];

  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) => b.cachedAt - a.cachedAt);
    case 'ending-soon':
      return sorted.sort((a, b) => a.endTime - b.endTime);
    case 'popular':
      return sorted.sort(
        (a, b) => BigInt(b.totalPool) > BigInt(a.totalPool) ? 1 : -1
      );
    default:
      return sorted;
  }
}

/**
 * Paginate markets
 */
export function paginateMarkets(
  markets: CachedMarket[],
  page: number = 1,
  limit: number = 20
): { markets: CachedMarket[]; total: number; page: number; totalPages: number } {
  const start = (page - 1) * limit;
  const end = start + limit;
  
  return {
    markets: markets.slice(start, end),
    total: markets.length,
    page,
    totalPages: Math.ceil(markets.length / limit),
  };
}

/**
 * Check if market is active and accepting bets
 */
export function isMarketActive(market: CachedMarket): boolean {
  return market.status === 0 && market.endTime > Date.now() / 1000;
}

/**
 * Check if market has ended
 */
export function hasMarketEnded(market: CachedMarket): boolean {
  return market.endTime <= Date.now() / 1000;
}

/**
 * Get time remaining for market (in seconds)
 */
export function getTimeRemaining(market: CachedMarket): number {
  const now = Date.now() / 1000;
  return Math.max(0, market.endTime - now);
}
