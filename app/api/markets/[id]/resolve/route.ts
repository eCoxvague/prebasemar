import { NextRequest, NextResponse } from 'next/server';
import {
  getMarketFromChain,
  mapMarketStatus,
} from '@/lib/blockchain/contract';
import {
  invalidateMarketCache,
  invalidateOddsCache,
} from '@/lib/kv';

/**
 * PATCH /api/markets/[id]/resolve
 * Resolve a market with the winning outcome
 * This endpoint validates the resolution request and returns transaction data
 * The actual contract call is made from the client side
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const marketId = params.id;
    const body = await request.json();
    const { winningOutcomeId, creatorAddress } = body;

    // Validation
    if (winningOutcomeId === undefined || !creatorAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          details: {
            winningOutcomeId:
              winningOutcomeId === undefined
                ? 'Winning outcome ID is required'
                : undefined,
            creatorAddress: !creatorAddress
              ? 'Creator address is required'
              : undefined,
          },
        },
        { status: 400 }
      );
    }

    // Fetch market from blockchain to validate
    const marketIdBigInt = BigInt(marketId);
    const chainMarket = await getMarketFromChain(marketIdBigInt);

    if (!chainMarket) {
      return NextResponse.json(
        {
          success: false,
          error: 'Market not found',
        },
        { status: 404 }
      );
    }

    // Verify creator
    const marketCreator = chainMarket.creator.toLowerCase();
    const requestCreator = creatorAddress.toLowerCase();
    
    if (marketCreator !== requestCreator) {
      return NextResponse.json(
        {
          success: false,
          error: 'Only the market creator can resolve this market',
          details: {
            marketCreator,
            requestCreator,
          },
        },
        { status: 403 }
      );
    }

    // Check if market is active
    const status = Number(chainMarket.status);
    if (status !== 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Market is not active',
          details: {
            status: mapMarketStatus(status),
          },
        },
        { status: 400 }
      );
    }

    // Check if market has ended
    const endTime = Number(chainMarket.endTime);
    const now = Math.floor(Date.now() / 1000);
    if (endTime > now) {
      return NextResponse.json(
        {
          success: false,
          error: 'Market has not ended yet',
          details: {
            endTime,
            currentTime: now,
            timeRemaining: endTime - now,
          },
        },
        { status: 400 }
      );
    }

    // Validate winning outcome ID
    const outcomeCount = Number(chainMarket.outcomeCount);
    if (winningOutcomeId < 0 || winningOutcomeId >= outcomeCount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid winning outcome ID',
          details: {
            winningOutcomeId,
            maxOutcomeId: outcomeCount - 1,
          },
        },
        { status: 400 }
      );
    }

    // Return transaction data for client to execute
    return NextResponse.json({
      success: true,
      data: {
        marketId,
        winningOutcomeId,
        totalPool: chainMarket.totalPool.toString(),
        // Client will use this data to call the smart contract
        contractCall: {
          functionName: 'resolveMarket',
          args: [marketIdBigInt, winningOutcomeId],
        },
        // Cache invalidation data
        cacheInvalidation: {
          marketId,
        },
      },
    });
  } catch (error) {
    console.error(`Error resolving market ${params.id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to resolve market',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/markets/[id]/resolve/confirm
 * Confirm market resolution and invalidate cache
 * Called after successful transaction confirmation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const marketId = params.id;
    const body = await request.json();
    const { txHash } = body;

    if (!txHash) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transaction hash is required',
        },
        { status: 400 }
      );
    }

    // Invalidate caches
    await Promise.all([
      invalidateMarketCache(marketId),
      invalidateOddsCache(marketId),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Market resolution confirmed and cache invalidated',
      data: {
        marketId,
        txHash,
      },
    });
  } catch (error) {
    console.error(`Error confirming market resolution ${params.id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to confirm market resolution',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
