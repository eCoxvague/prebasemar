import { NextRequest, NextResponse } from 'next/server';
import { invalidateMarketCache } from '@/lib/kv';
import { getMarketFromChain } from '@/lib/blockchain/contract';

/**
 * PATCH /api/markets/[id]/resolve
 * Resolve a market with the winning outcome
 * This endpoint validates the request and returns transaction data
 * The actual contract call is made from the client side
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const marketId = params.id;
    const body = await request.json();
    const { winningOutcomeId, walletAddress } = body;

    // Validation
    if (winningOutcomeId === undefined || !walletAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // Fetch market from blockchain to validate
    const chainMarket = await getMarketFromChain(BigInt(marketId));

    // Check if market exists
    if (!chainMarket || !chainMarket.creator) {
      return NextResponse.json(
        {
          success: false,
          error: 'Market not found',
        },
        { status: 404 }
      );
    }

    // Check if caller is the creator
    if (chainMarket.creator.toLowerCase() !== walletAddress.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Only market creator can resolve',
        },
        { status: 403 }
      );
    }

    // Check if market has ended
    const now = Math.floor(Date.now() / 1000);
    if (Number(chainMarket.endTime) > now) {
      return NextResponse.json(
        {
          success: false,
          error: 'Market has not ended yet',
        },
        { status: 400 }
      );
    }

    // Check if market is in correct status (Active = 0)
    if (Number(chainMarket.status) !== 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Market is not in active status',
        },
        { status: 400 }
      );
    }

    // Check if winning outcome is valid
    if (winningOutcomeId >= Number(chainMarket.outcomeCount)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid outcome ID',
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
        // Client will use this data to call the smart contract
        contractCall: {
          functionName: 'resolveMarket',
          args: [BigInt(marketId), BigInt(winningOutcomeId)],
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
