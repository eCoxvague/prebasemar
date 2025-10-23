import { getAllMarketsFromChain, mapMarketStatus } from './contract';
import { getCachedUser, cacheUser } from '@/lib/kv';
import type { LeaderboardEntry } from '@/lib/kv/types';

/**
 * Calculate leaderboard from blockchain data
 * This is a simplified version that works without a database
 */
export async function calculateLeaderboardFromChain(): Promise<LeaderboardEntry[]> {
  try {
    // Fetch all markets from blockchain
    const markets = await getAllMarketsFromChain();

    // Map to track user statistics
    const userStatsMap = new Map<
      string,
      {
        fid: number;
        totalWagered: bigint;
        totalWon: bigint;
        totalBets: number;
        wonBets: number;
        bets: Array<{
          marketId: bigint;
          amount: bigint;
          won: boolean;
        }>;
      }
    >();

    // Process each market
    for (const market of markets) {
      const marketId = market.id;
      const status = Number(market.status);
      const winningOutcome = market.winningOutcome
        ? Number(market.winningOutcome)
        : undefined;

      // Get all bets for this market from events
      // Note: In a real implementation, you'd query blockchain events
      // For MVP, we'll use a simplified approach with market data
      
      // Skip if market not resolved
      if (status !== 2 || winningOutcome === undefined) {
        continue;
      }

      // Process outcomes to find bettors
      // This is simplified - in production you'd query BetPlaced events
      for (let i = 0; i < market.outcomes.length; i++) {
        const outcome = market.outcomes[i];
        const totalBets = BigInt(outcome.totalBets);

        if (totalBets > 0n) {
          // For MVP, we'll create aggregate stats
          // In production, you'd track individual bets via events
          const won = i === winningOutcome;
          
          // This is a placeholder - you'd need to track actual user addresses
          // from BetPlaced events in a real implementation
        }
      }
    }

    // Convert map to array and calculate rankings
    const leaderboardEntries: LeaderboardEntry[] = [];

    for (const [userKey, stats] of userStatsMap.entries()) {
      const winRate = stats.totalBets > 0 ? (stats.wonBets / stats.totalBets) * 100 : 0;

      // Try to get user data from cache
      let userData = await getCachedUser(stats.fid);
      
      if (!userData) {
        // If not in cache, create minimal user data
        userData = {
          fid: stats.fid,
          username: `user${stats.fid}`,
          displayName: `User ${stats.fid}`,
          pfpUrl: '',
          cachedAt: Date.now(),
        };
        await cacheUser(userData);
      }

      leaderboardEntries.push({
        fid: stats.fid,
        username: userData.username,
        displayName: userData.displayName,
        pfpUrl: userData.pfpUrl,
        totalWagered: stats.totalWagered.toString(),
        totalWon: stats.totalWon.toString(),
        totalBets: stats.totalBets,
        wonBets: stats.wonBets,
        winRate: Math.round(winRate * 100) / 100,
        rank: 0, // Will be set after sorting
      });
    }

    // Sort by total won (descending)
    leaderboardEntries.sort((a, b) => {
      const aWon = BigInt(a.totalWon);
      const bWon = BigInt(b.totalWon);
      if (aWon > bWon) return -1;
      if (aWon < bWon) return 1;
      return 0;
    });

    // Assign ranks
    leaderboardEntries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return leaderboardEntries;
  } catch (error) {
    console.error('Error calculating leaderboard:', error);
    return [];
  }
}

/**
 * Get mock leaderboard data for MVP
 * This is a simplified version that returns sample data
 * In production, you'd calculate from actual blockchain events
 */
export async function getMockLeaderboard(): Promise<LeaderboardEntry[]> {
  // For MVP, return empty array or sample data
  // This will be populated as users place bets
  return [
    {
      fid: 1,
      username: 'alice',
      displayName: 'Alice',
      pfpUrl: 'https://i.pravatar.cc/150?img=1',
      totalWagered: '1000000000000000000', // 1 ETH
      totalWon: '1500000000000000000', // 1.5 ETH
      totalBets: 10,
      wonBets: 6,
      winRate: 60,
      rank: 1,
    },
    {
      fid: 2,
      username: 'bob',
      displayName: 'Bob',
      pfpUrl: 'https://i.pravatar.cc/150?img=2',
      totalWagered: '800000000000000000', // 0.8 ETH
      totalWon: '1200000000000000000', // 1.2 ETH
      totalBets: 8,
      wonBets: 5,
      winRate: 62.5,
      rank: 2,
    },
    {
      fid: 3,
      username: 'charlie',
      displayName: 'Charlie',
      pfpUrl: 'https://i.pravatar.cc/150?img=3',
      totalWagered: '500000000000000000', // 0.5 ETH
      totalWon: '600000000000000000', // 0.6 ETH
      totalBets: 5,
      wonBets: 3,
      winRate: 60,
      rank: 3,
    },
  ];
}

/**
 * Calculate user rank from leaderboard
 */
export function getUserRank(
  leaderboard: LeaderboardEntry[],
  fid: number
): number | null {
  const entry = leaderboard.find((e) => e.fid === fid);
  return entry ? entry.rank : null;
}

/**
 * Get top N users from leaderboard
 */
export function getTopUsers(
  leaderboard: LeaderboardEntry[],
  limit: number = 10
): LeaderboardEntry[] {
  return leaderboard.slice(0, limit);
}
