// Vercel KV Data Types

/**
 * User session data stored in KV (JWT alternative)
 * TTL: 24 hours
 */
export interface UserSession {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  walletAddress?: string;
  expiresAt: number;
}

/**
 * Cached Farcaster user data
 * TTL: 1 hour
 */
export interface CachedUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio?: string;
  cachedAt: number;
}

/**
 * Cached market data from blockchain
 * TTL: 5 minutes
 */
export interface CachedMarket {
  marketId: string;
  title: string;
  description: string;
  category: string;
  creator: string;
  endTime: number;
  status: number;
  totalPool: string;
  participantCount: number;
  outcomes: CachedOutcome[];
  cachedAt: number;
}

/**
 * Cached outcome data for a market
 */
export interface CachedOutcome {
  outcomeId: number;
  name: string;
  totalBets: string;
  odds: number;
}

/**
 * User's active bets cache
 * TTL: 5 minutes
 */
export interface CachedUserBets {
  marketId: string;
  outcomeId: number;
  amount: string;
  timestamp: number;
}

/**
 * Leaderboard entry (calculated from blockchain data)
 * TTL: 10 minutes
 */
export interface LeaderboardEntry {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  totalWagered: string;
  totalWon: string;
  totalBets: number;
  wonBets: number;
  winRate: number;
  rank: number;
}

/**
 * KV Keys Structure:
 * - session:{fid} → UserSession (TTL: 24h)
 * - user:{fid} → CachedUser (TTL: 1h)
 * - markets:list → CachedMarket[] (TTL: 5min)
 * - market:{id} → CachedMarket (TTL: 5min)
 * - user:{fid}:bets → CachedUserBets[] (TTL: 5min)
 * - odds:{marketId} → number[] (TTL: 30s)
 * - leaderboard:all → LeaderboardEntry[] (TTL: 10min)
 */
