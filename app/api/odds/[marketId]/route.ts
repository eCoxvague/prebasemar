import { NextRequest, NextResponse } from 'next/server';
import { getCachedMarket } from '@/lib/kv';
import {
  getOddsWithCache,
  getOddsFromBlockchain,
  calculateOddsImpact,
  calculateSlippage,
  calculatePotentialWinnings,
} from '@/lib/blockchain/oddsCalculation';
import { getMarketFromChain, getMarketOutcomes } from '@/lib/blockchain/contract';
import { transformMarketData } from '@/lib/blockchain/marketHelpers';

interface RouteParams {
  params: {
    marketId: string;
  };
}

/**
 * GET /api/odds/[marketId]
 * Get current odds for a market with caching (30s TTL)
 * Query params:
 * - betAmount: Optional amount to calculate impact (in wei)
 * - outcomeId: Optional outcome ID for impact calculation
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { marketId } = params;
    const searchParams = request.nextUrl.searchParams;
    const betAmount = searchParams.get('betAmount');
    const outcomeId = searchParams.get('outcomeId');

    // Get market data (from cache or blockchain)
    let market = await getCachedMarket(marketId);

    if (!market) {
      // Fetch from blockchain
      const chainMarket = await getMarketFromChain(BigInt(marketId));
      const outcomes = await getMarketOutcomes(BigInt(marketId));
      market = transformMarketData(chainMarket, outcomes);
    }

    if (!market) {
      return NextResponse.json(
        {
          success: false,
          error: 'Market not found',
        },
        { status: 404 }
      );
    }

    // Get odds with cache
    const odds = await getOddsWithCache(marketId, market.outcomes);

    // If betAmount and outcomeId provided, calculate impact
    let impact = null;
    let slippage = null;
    let potentialWinnings = null;

    if (betAmount && outcomeId !== null) {
      const betAmountBigInt = BigInt(betAmount);
      const outcomeIdNum = parseInt(outcomeId);

      if (outcomeIdNum >= 0 && outcomeIdNum < market.outcomes.length) {
        // Calculate odds impact
        impact = calculateOddsImpact(
          market.outcomes,
          outcomeIdNum,
          betAmountBigInt
        );

        // Calculate slippage
        const currentLiquidity = BigInt(market.outcomes[outcomeIdNum].totalBets);
        slippage = calculateSlippage(betAmountBigInt, currentLiquidity);

        // Calculate potential winnings
        potentialWinnings = calculatePotentialWinnings(
          betAmountBigInt,
          odds[outcomeIdNum]
        ).toString();
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        marketId,
        odds,
        outcomes: market.outcomes.map((outcome, index) => ({
          outcomeId: outcome.outcomeId,
          name: outcome.name,
          odds: odds[index],
          totalBets: outcome.totalBets,
        })),
        impact,
        slippage,
        potentialWinnings,
        cachedAt: Date.now(),
      },
    });
  } catch (error) {
    console.error('Error fetching odds:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch odds',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/odds/[marketId]/refresh
 * Force refresh odds from blockchain (bypasses cache)
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { marketId } = params;

    // Fetch fresh odds from blockchain
    const odds = await getOddsFromBlockchain(marketId);

    return NextResponse.json({
      success: true,
      data: {
        marketId,
        odds,
        refreshedAt: Date.now(),
      },
    });
  } catch (error) {
    console.error('Error refreshing odds:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to refresh odds',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
