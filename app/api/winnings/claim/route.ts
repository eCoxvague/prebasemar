import { NextRequest, NextResponse } from 'next/server';
import {
  getClaimableWinnings,
  getMarketFromChain,
} from '@/lib/blockchain/contract';
import type { Address } from 'viem';

/**
 * POST /api/winnings/claim
 * Validate and prepare claim winnings transaction
 * The actual contract call is made from the client side
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { marketId, walletAddress } = body;

    // Validation
    if (!marketId || !walletAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          details: {
            marketId: !marketId ? 'Market ID is required' : undefined,
            walletAddress: !walletAddress
              ? 'Wallet address is required'
              : undefined,
          },
        },
        { status: 400 }
      );
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid wallet address format',
        },
        { status: 400 }
      );
    }

    const address = walletAddress as Address;
    const marketIdBigInt = BigInt(marketId);

    // Fetch market from blockchain to validate
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

    // Check if market is resolved
    const status = Number(chainMarket.status);
    if (status !== 2) {
      return NextResponse.json(
        {
          success: false,
          error: 'Market is not resolved',
          details: {
            status,
            message: 'Only resolved markets can have winnings claimed',
          },
        },
        { status: 400 }
      );
    }

    // Check claimable winnings
    const claimableAmount = await getClaimableWinnings(
      marketIdBigInt,
      address
    );

    if (claimableAmount === 0n) {
      return NextResponse.json(
        {
          success: false,
          error: 'No winnings to claim',
          details: {
            claimableAmount: '0',
            message: 'You have no claimable winnings for this market',
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
        walletAddress: address,
        claimableAmount: claimableAmount.toString(),
        marketTitle: chainMarket.title,
        // Client will use this data to call the smart contract
        contractCall: {
          functionName: 'claimWinnings',
          args: [marketIdBigInt],
        },
      },
    });
  } catch (error) {
    console.error('Error preparing claim winnings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to prepare claim winnings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/winnings/claim/confirm
 * Confirm winnings claim
 * Called after successful transaction confirmation
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { marketId, walletAddress, txHash } = body;

    if (!marketId || !walletAddress || !txHash) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // Log successful claim (in production, you might want to track this)
    console.log(
      `Winnings claimed: Market ${marketId}, User ${walletAddress}, Tx ${txHash}`
    );

    return NextResponse.json({
      success: true,
      message: 'Winnings claim confirmed',
      data: {
        marketId,
        walletAddress,
        txHash,
      },
    });
  } catch (error) {
    console.error('Error confirming winnings claim:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to confirm winnings claim',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
