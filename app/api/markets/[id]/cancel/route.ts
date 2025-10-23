import { NextRequest, NextResponse } from 'next/server';
import { getMarketFromChain } from '@/lib/blockchain/contract';

/**
 * DELETE /api/markets/[id] (or POST /api/markets/[id]/cancel)
 * Cancel a market (only if no bets placed)
 * This endpoint validates the request and returns transaction data
 * The actual contract call is made from the client side
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const marketId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get('walletAddress');

    // Validation
    if (!walletAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Wallet address required',
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
          error: 'Only market creator can cancel',
        },
        { status: 403 }
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

    // Check if market has no bets
    if (chainMarket.totalPool > 0n) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot cancel market with bets',
        },
        { status: 400 }
      );
    }

    // Return transaction data for client to execute
    return NextResponse.json({
      success: true,
      data: {
        marketId,
        // Client will use this data to call the smart contract
        contractCall: {
          functionName: 'cancelMarket',
          args: [BigInt(marketId)],
        },
      },
    });
  } catch (error) {
    console.error(`Error cancelling market ${params.id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cancel market',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Also support POST for cancel action
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return DELETE(request, { params });
}
