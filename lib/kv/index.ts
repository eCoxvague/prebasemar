import { kv } from '@vercel/kv';
import type {
  UserSession,
  CachedUser,
  CachedMarket,
  CachedUserBets,
  LeaderboardEntry,
} from './types';

// Re-export pub/sub functions
export * from './pubsub';

// TTL constants (in seconds)
const TTL = {
  SESSION: 86400, // 24 hours
  USER: 3600, // 1 hour
  MARKET: 300, // 5 minutes
  ODDS: 30, // 30 seconds
  LEADERBOARD: 600, // 10 minutes
} as const;

// ============================================================================
// Session Management Functions
// ============================================================================

/**
 * Store user session in KV
 * @param fid - Farcaster ID
 * @param session - User session data
 */
export async function setUserSession(
  fid: number,
  session: UserSession
): Promise<void> {
  await kv.set(`session:${fid}`, session, { ex: TTL.SESSION });
}

/**
 * Retrieve user session from KV
 * @param fid - Farcaster ID
 * @returns User session or null if not found/expired
 */
export async function getUserSession(
  fid: number
): Promise<UserSession | null> {
  return await kv.get<UserSession>(`session:${fid}`);
}

/**
 * Delete user session from KV (logout)
 * @param fid - Farcaster ID
 */
export async function deleteUserSession(fid: number): Promise<void> {
  await kv.del(`session:${fid}`);
}

/**
 * Check if user session exists and is valid
 * @param fid - Farcaster ID
 * @returns true if session exists and is not expired
 */
export async function hasValidSession(fid: number): Promise<boolean> {
  const session = await getUserSession(fid);
  if (!session) return false;
  return session.expiresAt > Date.now();
}

// ============================================================================
// User Cache Functions
// ============================================================================

/**
 * Cache Farcaster user data
 * @param user - User data to cache
 */
export async function cacheUser(user: CachedUser): Promise<void> {
  await kv.set(`user:${user.fid}`, user, { ex: TTL.USER });
}

/**
 * Get cached user data
 * @param fid - Farcaster ID
 * @returns Cached user data or null if not found
 */
export async function getCachedUser(fid: number): Promise<CachedUser | null> {
  return await kv.get<CachedUser>(`user:${fid}`);
}

/**
 * Invalidate user cache
 * @param fid - Farcaster ID
 */
export async function invalidateUserCache(fid: number): Promise<void> {
  await kv.del(`user:${fid}`);
}

/**
 * Cache multiple users at once
 * @param users - Array of users to cache
 */
export async function cacheUsers(users: CachedUser[]): Promise<void> {
  const pipeline = kv.pipeline();
  users.forEach((user) => {
    pipeline.set(`user:${user.fid}`, user, { ex: TTL.USER });
  });
  await pipeline.exec();
}

// ============================================================================
// Market Cache Functions
// ============================================================================

/**
 * Cache market list
 * @param markets - Array of markets to cache
 */
export async function cacheMarkets(markets: CachedMarket[]): Promise<void> {
  await kv.set('markets:list', markets, { ex: TTL.MARKET });
}

/**
 * Get cached market list
 * @returns Array of cached markets or null if not found
 */
export async function getCachedMarkets(): Promise<CachedMarket[] | null> {
  return await kv.get<CachedMarket[]>('markets:list');
}

/**
 * Cache individual market
 * @param marketId - Market ID
 * @param market - Market data to cache
 */
export async function cacheMarket(
  marketId: string,
  market: CachedMarket
): Promise<void> {
  await kv.set(`market:${marketId}`, market, { ex: TTL.MARKET });
}

/**
 * Get cached market by ID
 * @param marketId - Market ID
 * @returns Cached market or null if not found
 */
export async function getCachedMarket(
  marketId: string
): Promise<CachedMarket | null> {
  return await kv.get<CachedMarket>(`market:${marketId}`);
}

/**
 * Invalidate market cache
 * @param marketId - Optional market ID. If not provided, invalidates all markets
 */
export async function invalidateMarketCache(marketId?: string): Promise<void> {
  if (marketId) {
    await kv.del(`market:${marketId}`, 'markets:list');
  } else {
    await kv.del('markets:list');
  }
}

/**
 * Cache multiple markets at once
 * @param markets - Object mapping market IDs to market data
 */
export async function cacheMultipleMarkets(
  markets: Record<string, CachedMarket>
): Promise<void> {
  const pipeline = kv.pipeline();
  Object.entries(markets).forEach(([marketId, market]) => {
    pipeline.set(`market:${marketId}`, market, { ex: TTL.MARKET });
  });
  await pipeline.exec();
}

// ============================================================================
// User Bets Cache Functions
// ============================================================================

/**
 * Cache user's bets
 * @param fid - Farcaster ID
 * @param bets - Array of user bets
 */
export async function cacheUserBets(
  fid: number,
  bets: CachedUserBets[]
): Promise<void> {
  await kv.set(`user:${fid}:bets`, bets, { ex: TTL.MARKET });
}

/**
 * Get cached user bets
 * @param fid - Farcaster ID
 * @returns Array of cached bets or null if not found
 */
export async function getCachedUserBets(
  fid: number
): Promise<CachedUserBets[] | null> {
  return await kv.get<CachedUserBets[]>(`user:${fid}:bets`);
}

/**
 * Invalidate user bets cache
 * @param fid - Farcaster ID
 */
export async function invalidateUserBetsCache(fid: number): Promise<void> {
  await kv.del(`user:${fid}:bets`);
}

/**
 * Add a new bet to user's cached bets
 * @param fid - Farcaster ID
 * @param bet - New bet to add
 */
export async function addBetToCache(
  fid: number,
  bet: CachedUserBets
): Promise<void> {
  const existingBets = (await getCachedUserBets(fid)) || [];
  existingBets.push(bet);
  await cacheUserBets(fid, existingBets);
}

// ============================================================================
// Odds Cache Functions
// ============================================================================

/**
 * Cache market odds (very short TTL for real-time feel)
 * @param marketId - Market ID
 * @param odds - Array of odds for each outcome
 */
export async function cacheOdds(
  marketId: string,
  odds: number[]
): Promise<void> {
  await kv.set(`odds:${marketId}`, odds, { ex: TTL.ODDS });
}

/**
 * Get cached odds
 * @param marketId - Market ID
 * @returns Array of odds or null if not found
 */
export async function getCachedOdds(
  marketId: string
): Promise<number[] | null> {
  return await kv.get<number[]>(`odds:${marketId}`);
}

/**
 * Invalidate odds cache
 * @param marketId - Market ID
 */
export async function invalidateOddsCache(marketId: string): Promise<void> {
  await kv.del(`odds:${marketId}`);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Clear all cache for a specific market (market data, odds, and related user bets)
 * @param marketId - Market ID
 */
export async function clearMarketCache(marketId: string): Promise<void> {
  await kv.del(`market:${marketId}`, `odds:${marketId}`, 'markets:list');
}

/**
 * Clear all user-related cache
 * @param fid - Farcaster ID
 */
export async function clearUserCache(fid: number): Promise<void> {
  await kv.del(`session:${fid}`, `user:${fid}`, `user:${fid}:bets`);
}

/**
 * Get cache statistics (useful for debugging)
 * @returns Object with cache hit/miss information
 */
export async function getCacheStats(): Promise<{
  sessionCount: number;
  userCount: number;
  marketCount: number;
}> {
  // Note: This is a simplified version. In production, you might want to
  // implement more sophisticated cache statistics tracking
  const keys = await kv.keys('*');
  return {
    sessionCount: keys.filter((k) => k.startsWith('session:')).length,
    userCount: keys.filter((k) => k.startsWith('user:') && !k.includes(':bets'))
      .length,
    marketCount: keys.filter((k) => k.startsWith('market:')).length,
  };
}

/**
 * Flush all cache (use with caution!)
 */
export async function flushAllCache(): Promise<void> {
  await kv.flushdb();
}

// ============================================================================
// Leaderboard Cache Functions
// ============================================================================

/**
 * Cache leaderboard data
 * @param entries - Array of leaderboard entries
 */
export async function cacheLeaderboard(
  entries: LeaderboardEntry[]
): Promise<void> {
  await kv.set('leaderboard:all', entries, { ex: TTL.LEADERBOARD });
}

/**
 * Get cached leaderboard
 * @returns Array of leaderboard entries or null if not found
 */
export async function getCachedLeaderboard(): Promise<LeaderboardEntry[] | null> {
  return await kv.get<LeaderboardEntry[]>('leaderboard:all');
}

/**
 * Invalidate leaderboard cache
 */
export async function invalidateLeaderboardCache(): Promise<void> {
  await kv.del('leaderboard:all');
}
