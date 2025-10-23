import { NextRequest, NextResponse } from 'next/server';
import {
  getCachedMarkets,
  cacheMarkets,
} from '@/lib/kv';
import {
  getAllMarketsFromChain,
} from '@/lib/blockchain/contract';
import {
  transformMarketData,
  filterMarketsByStatus,
  filterMarketsByCategory,
  searchMarkets,
  sortMarkets,
  paginateMarkets,
} from '@/lib/blockchain/marketHelpers';

/**
 * GET /api/markets
 * Fetch all markets with optional filtering, sorting, and pagination
 * Uses blockchain as source of truth with Vercel KV cache (5min TTL)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const sortBy = (searchParams.get('sort') as 'newest' | 'ending-soon' | 'popular') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Try to get from cache first
    let markets = await getCachedMarkets();

    // If cache miss, fetch from blockchain
    if (!markets) {
      console.log('Cache miss - fetching markets from blockchain');
      const chainMarkets = await getAllMarketsFromChain();
      
      markets = chainMarkets.map((chainMarket) =>
        transformMarketData(chainMarket, chainMarket.outcomes)
      );

      // Cache the results
      await cacheMarkets(markets);
    }

    // Apply filters
    let filteredMarkets = markets;
    
    if (status) {
      filteredMarkets = filterMarketsByStatus(filteredMarkets, status);
    }
    
    if (category) {
      filteredMarkets = filterMarketsByCategory(filteredMarkets, category);
    }
    
    if (search) {
      filteredMarkets = searchMarkets(filteredMarkets, search);
    }

    // Sort markets
    const sortedMarkets = sortMarkets(filteredMarkets, sortBy);

    // Paginate results
    const paginatedResult = paginateMarkets(sortedMarkets, page, limit);

    return NextResponse.json({
      success: true,
      data: paginatedResult,
    });
  } catch (error) {
    console.error('Error fetching markets:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch markets',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/markets
 * Create a new market (smart contract call + cache invalidation)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, outcomes, endTime, category, walletAddress } = body;

    // Validation
    if (!title || !outcomes || !endTime || !walletAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    if (outcomes.length < 2 || outcomes.length > 5) {
      return NextResponse.json(
        {
          success: false,
          error: 'Must have 2-5 outcomes',
        },
        { status: 400 }
      );
    }

    const endTimeTimestamp = new Date(endTime).getTime() / 1000;
    if (endTimeTimestamp <= Date.now() / 1000) {
      return NextResponse.json(
        {
          success: false,
          error: 'End time must be in the future',
        },
        { status: 400 }
      );
    }

    // Return transaction data for client to execute
    // The actual contract call will be made from the client side
    return NextResponse.json({
      success: true,
      data: {
        title,
        description,
        outcomes,
        endTime: endTimeTimestamp,
        category,
        // Client will use this data to call the smart contract
        contractCall: {
          functionName: 'createMarket',
          args: [title, outcomes, Math.floor(endTimeTimestamp)],
        },
      },
    });
  } catch (error) {
    console.error('Error creating market:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create market',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
