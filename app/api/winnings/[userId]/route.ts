import { NextRequest, NextResponse } from 'next/server';
import {
  getClaimableWinnings,
  getMarketCounter,
  getMarketFromChain,
} from '@/lib/blockchain/contract';
import type { Address } from 'viem';

/**
 * GET /api/winnings/[userId]
 * Get claimable winnings for a user across all markets
 * userId can be either a wallet address or FID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('address');

    // Validate wallet address
    if (!walletAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Wallet address is required',
          details: {
            message: 'Please provide wallet address as query parameter',
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

    // Get total number of markets
    const marketCounter = await getMarketCounter();

    // Fetch claimable winnings from all resolved markets
    const winningsData: {
      marketId: string;
      amount: string;
      marketTitle: string;
      status: number;
    }[] = [];

    let totalClaimable = 0n;
    let totalClaimed = 0n;
    let pendingMarkets = 0;

    for (let i = 0n; i < marketCounter; i++) {
      try {
        const market = await getMarketFromChain(i);
        const marketStatus = Number(market.status);

        // Check if market is resolved (status = 2)
        if (marketStatus === 2) {
          const claimable = await getClaimableWinnings(i, address);

          if (claimable > 0n) {
            winningsData.push({
              marketId: i.toString(),
              amount: claimable.toString(),
              marketTitle: market.title,
              status: marketStatus,
            });
            totalClaimable += claimable;
          }
        } else if (marketStatus === 0 || marketStatus === 1) {
          // Market is active or closed but not resolved
          pendingMarkets++;
        }
      } catch (error) {
        console.error(`Error fetching winnings for market ${i}:`, error);
        // Continue to next market
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        userId,
        walletAddress: address,
        totalClaimable: totalClaimable.toString(),
        totalClaimed: totalClaimed.toString(),
        pendingMarkets,
        winnings: winningsData,
        summary: {
          claimableCount: winningsData.length,
          totalMarketsChecked: Number(marketCounter),
        },
      },
    });
  } catch (error) {
    console.error(`Error fetching winnings for user ${params.userId}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch winnings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
