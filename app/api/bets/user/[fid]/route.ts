import { NextRequest, NextResponse } from 'next/server';
import {
  getCachedUserBets,
  cacheUserBets,
  getCachedMarket,
  cacheMarket,
} from '@/lib/kv';
import {
  getMarketCounter,
  getMarketFromChain,
  getUserBetsForMarket,
  getMarketOutcomes,
} from '@/lib/blockchain/contract';
import { transformMarketData } from '@/lib/blockchain/marketHelpers';
import type { CachedUserBets, CachedMarket } from '@/lib/kv/types';
import type { Address } from 'viem';

interface RouteParams {
  params: {
    fid: string;
  };
}

/**
 * GET /api/bets/user/[fid]
 * Get all bets for a user (blockchain read + cache)
 * Query params:
 * - walletAddress: User's wallet address (required)
 * - status: Filter by market status (optional: 'active', 'resolved', 'all')
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { fid } = params;
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get('walletAddress');
    const statusFilter = searchParams.get('status') || 'all';

    if (!walletAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Wallet address is required',
        },
        { status: 400 }
      );
    }

    const fidNumber = parseInt(fid);
    if (isNaN(fidNumber)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid FID',
        },
        { status: 400 }
      );
    }

    // Try to get from cache first
    let cachedBets = await getCachedUserBets(fidNumber);

    // If cache miss or we need fresh data, fetch from blockchain
    if (!cachedBets) {
      console.log(`Cache miss - fetching bets for user ${fid} from blockchain`);
      
      const allBets: CachedUserBets[] = [];
      const marketCounter = await getMarketCounter();

      // Iterate through all markets to find user's bets
      for (let i = 0n; i < marketCounter; i++) {
        try {
          const userBets = await getUserBetsForMarket(i, walletAddress as Address);
          
          if (userBets && userBets.length > 0) {
            // Transform bets to cached format
            for (const bet of userBets) {
              allBets.push({
                marketId: i.toString(),
                outcomeId: Number(bet.outcomeId),
                amount: bet.amount.toString(),
                timestamp: Number(bet.timestamp) * 1000, // Convert to milliseconds
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching bets for market ${i}:`, error);
          // Continue to next market
        }
      }

      // Cache the results
      await cacheUserBets(fidNumber, allBets);
      cachedBets = allBets;
    }

    // Fetch market details for each bet
    const betsWithMarketDetails = await Promise.all(
      cachedBets.map(async (bet) => {
        let market = await getCachedMarket(bet.marketId);
        
        if (!market) {
          // Fetch from blockchain if not cached
          try {
            const chainMarket = await getMarketFromChain(BigInt(bet.marketId));
            const outcomes = await getMarketOutcomes(BigInt(bet.marketId));
            market = transformMarketData(chainMarket, outcomes);
            await cacheMarket(bet.marketId, market);
          } catch (error) {
            console.error(`Error fetching market ${bet.marketId}:`, error);
            return null;
          }
        }

        return {
          ...bet,
          market,
        };
      })
    );

    // Filter out null values (markets that failed to fetch)
    const validBets = betsWithMarketDetails.filter((bet) => bet !== null);

    // Apply status filter
    let filteredBets = validBets;
    if (statusFilter !== 'all') {
      const statusMap: Record<string, number> = {
        active: 0,
        closed: 1,
        resolved: 2,
        cancelled: 3,
        disputed: 4,
      };

      const statusNum = statusMap[statusFilter.toLowerCase()];
      if (statusNum !== undefined) {
        filteredBets = validBets.filter((bet) => bet?.market?.status === statusNum);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        fid: fidNumber,
        walletAddress,
        bets: filteredBets,
        total: filteredBets.length,
      },
    });
  } catch (error) {
    console.error('Error fetching user bets:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch user bets',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
