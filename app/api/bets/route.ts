import { NextRequest, NextResponse } from 'next/server';
import {
  invalidateMarketCache,
  invalidateOddsCache,
  invalidateUserBetsCache,
  addBetToCache,
} from '@/lib/kv';
import { getMarketFromChain, mapMarketStatus } from '@/lib/blockchain/contract';
import { isMarketActive } from '@/lib/blockchain/marketHelpers';
import type { CachedUserBets } from '@/lib/kv/types';

/**
 * POST /api/bets
 * Place a bet on a market outcome
 * This endpoint validates the bet and returns transaction data for client execution
 * After transaction confirmation, cache is invalidated
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { marketId, outcomeId, amount, walletAddress, fid } = body;

    // Validation
    if (!marketId || outcomeId === undefined || !amount || !walletAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          details: {
            marketId: !marketId ? 'Market ID is required' : undefined,
            outcomeId: outcomeId === undefined ? 'Outcome ID is required' : undefined,
            amount: !amount ? 'Amount is required' : undefined,
            walletAddress: !walletAddress ? 'Wallet address is required' : undefined,
          },
        },
        { status: 400 }
      );
    }

    // Validate amount is positive
    const betAmount = BigInt(amount);
    if (betAmount <= 0n) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bet amount must be greater than 0',
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
    if (endTime <= now) {
      return NextResponse.json(
        {
          success: false,
          error: 'Market has ended',
          details: {
            endTime,
            currentTime: now,
          },
        },
        { status: 400 }
      );
    }

    // Validate outcome ID
    const outcomeCount = Number(chainMarket.outcomeCount);
    if (outcomeId < 0 || outcomeId >= outcomeCount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid outcome ID',
          details: {
            outcomeId,
            maxOutcomeId: outcomeCount - 1,
          },
        },
        { status: 400 }
      );
    }

    // Return transaction data for client to execute
    // The actual contract call will be made from the client side
    return NextResponse.json({
      success: true,
      data: {
        marketId,
        outcomeId,
        amount: amount.toString(),
        // Client will use this data to call the smart contract
        contractCall: {
          functionName: 'placeBet',
          args: [marketIdBigInt, outcomeId],
          value: betAmount.toString(),
        },
        // Cache invalidation endpoints to call after transaction confirmation
        cacheInvalidation: {
          marketId,
          fid,
        },
      },
    });
  } catch (error) {
    console.error('Error placing bet:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to place bet',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/bets/confirm
 * Confirm bet placement and invalidate cache
 * Called after successful transaction confirmation
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { marketId, outcomeId, amount, fid, txHash } = body;

    if (!marketId || !txHash) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // Invalidate caches
    await Promise.all([
      invalidateMarketCache(marketId),
      invalidateOddsCache(marketId),
      fid ? invalidateUserBetsCache(fid) : Promise.resolve(),
    ]);

    // Optionally add bet to user's cache
    if (fid && outcomeId !== undefined && amount) {
      const bet: CachedUserBets = {
        marketId,
        outcomeId,
        amount: amount.toString(),
        timestamp: Date.now(),
      };
      await addBetToCache(fid, bet);
    }

    return NextResponse.json({
      success: true,
      message: 'Bet confirmed and cache invalidated',
    });
  } catch (error) {
    console.error('Error confirming bet:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to confirm bet',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
