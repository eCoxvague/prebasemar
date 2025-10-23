import { NextRequest, NextResponse } from 'next/server';
import {
  getCachedLeaderboard,
  cacheLeaderboard,
} from '@/lib/kv';
import {
  getMockLeaderboard,
  getTopUsers,
  getUserRank,
} from '@/lib/blockchain/leaderboard';

/**
 * GET /api/leaderboard
 * Fetch leaderboard data
 * Uses blockchain data with Vercel KV cache (10min TTL)
 * 
 * Query params:
 * - limit: number of entries to return (default: 10, max: 100)
 * - fid: optional user FID to get their rank
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '10'),
      100
    );
    const fid = searchParams.get('fid')
      ? parseInt(searchParams.get('fid')!)
      : undefined;

    // Try to get from cache first
    let leaderboard = await getCachedLeaderboard();

    // If cache miss, calculate from blockchain
    if (!leaderboard) {
      console.log('Cache miss - calculating leaderboard from blockchain');
      
      // For MVP, use mock data
      // In production, you'd use: calculateLeaderboardFromChain()
      leaderboard = await getMockLeaderboard();

      // Cache the results
      if (leaderboard.length > 0) {
        await cacheLeaderboard(leaderboard);
      }
    }

    // Get top users
    const topUsers = getTopUsers(leaderboard, limit);

    // Get user rank if FID provided
    let userRank = null;
    let userEntry = null;
    if (fid) {
      userRank = getUserRank(leaderboard, fid);
      userEntry = leaderboard.find((e) => e.fid === fid);
    }

    return NextResponse.json({
      success: true,
      data: {
        leaderboard: topUsers,
        total: leaderboard.length,
        userRank,
        userEntry,
      },
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch leaderboard',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
