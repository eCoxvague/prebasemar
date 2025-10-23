import { NextRequest, NextResponse } from 'next/server';
import {
  getCachedMarket,
  cacheMarket,
} from '@/lib/kv';
import {
  getMarketFromChain,
  getMarketOutcomes,
} from '@/lib/blockchain/contract';
import { transformMarketData } from '@/lib/blockchain/marketHelpers';

/**
 * GET /api/markets/[id]
 * Fetch a single market by ID
 * Uses blockchain as source of truth with Vercel KV cache (5min TTL)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const marketId = params.id;

    // Try to get from cache first
    let market = await getCachedMarket(marketId);

    // If cache miss, fetch from blockchain
    if (!market) {
      console.log(`Cache miss - fetching market ${marketId} from blockchain`);
      
      const chainMarket = await getMarketFromChain(BigInt(marketId));
      const chainOutcomes = await getMarketOutcomes(BigInt(marketId));

      market = transformMarketData(chainMarket, chainOutcomes);

      // Cache the result
      await cacheMarket(marketId, market);
    }

    return NextResponse.json({
      success: true,
      data: market,
    });
  } catch (error) {
    console.error(`Error fetching market ${params.id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch market',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
