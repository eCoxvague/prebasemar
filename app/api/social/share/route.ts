import { NextRequest, NextResponse } from 'next/server';
import { publishCast } from '@/lib/farcaster/neynar';
import { getCachedMarket } from '@/lib/kv';

export const runtime = 'nodejs';

interface ShareMarketRequest {
  marketId: string;
  fid?: number;
  customText?: string;
}

interface ShareBetRequest {
  marketId: string;
  outcomeId: number;
  amount: string;
  fid?: number;
}

interface ShareWinRequest {
  marketId: string;
  winnings: string;
  fid?: number;
}

/**
 * POST /api/social/share
 * Share market, bet, or win on Farcaster
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...data } = body;

    // Get signer UUID from environment
    const signerUuid = process.env.FARCASTER_SIGNER_UUID;
    if (!signerUuid) {
      return NextResponse.json(
        { error: 'Farcaster signer not configured' },
        { status: 500 }
      );
    }

    switch (type) {
      case 'market':
        const result = await shareMarket(data as ShareMarketRequest, signerUuid);
        return NextResponse.json(result);

      case 'bet':
        const betResult = await shareBet(data as ShareBetRequest, signerUuid);
        return NextResponse.json(betResult);

      case 'win':
        const winResult = await shareWin(data as ShareWinRequest, signerUuid);
        return NextResponse.json(winResult);

      default:
        return NextResponse.json(
          { error: 'Invalid share type. Must be: market, bet, or win' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Share API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to share on Farcaster' },
      { status: 500 }
    );
  }
}

/**
 * Share a market on Farcaster
 */
async function shareMarket(data: ShareMarketRequest, signerUuid: string) {
  const { marketId, customText } = data;

  // Get market details from cache
  const market = await getCachedMarket(marketId);
  if (!market) {
    throw new Error('Market not found');
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const marketUrl = `${appUrl}/markets/${marketId}`;

  // Create cast text
  const castText = customText || 
    `🎯 New Prediction Market: ${market.title}\n\n` +
    `${market.outcomes.map((o, i) => `${i + 1}. ${o.name}`).join('\n')}\n\n` +
    `Place your bets now! 👇`;

  // Publish cast
  const result = await publishCast({
    text: castText,
    embeds: [{ url: marketUrl }],
    signerUuid,
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to publish cast');
  }

  return {
    success: true,
    castHash: result.cast?.hash,
    castUrl: `https://warpcast.com/~/conversations/${result.cast?.hash}`,
  };
}

/**
 * Share a bet on Farcaster
 */
async function shareBet(data: ShareBetRequest, signerUuid: string) {
  const { marketId, outcomeId, amount } = data;

  // Get market details from cache
  const market = await getCachedMarket(marketId);
  if (!market) {
    throw new Error('Market not found');
  }

  const outcome = market.outcomes.find(o => o.outcomeId === outcomeId);
  if (!outcome) {
    throw new Error('Outcome not found');
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const marketUrl = `${appUrl}/markets/${marketId}`;

  // Format amount (assuming it's in wei)
  const amountInEth = (parseFloat(amount) / 1e18).toFixed(4);

  // Create cast text
  const castText = 
    `🎲 Just placed a bet!\n\n` +
    `Market: ${market.title}\n` +
    `Prediction: ${outcome.name}\n` +
    `Amount: ${amountInEth} ETH\n\n` +
    `Join me! 👇`;

  // Publish cast
  const result = await publishCast({
    text: castText,
    embeds: [{ url: marketUrl }],
    signerUuid,
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to publish cast');
  }

  return {
    success: true,
    castHash: result.cast?.hash,
    castUrl: `https://warpcast.com/~/conversations/${result.cast?.hash}`,
  };
}

/**
 * Share a win on Farcaster
 */
async function shareWin(data: ShareWinRequest, signerUuid: string) {
  const { marketId, winnings } = data;

  // Get market details from cache
  const market = await getCachedMarket(marketId);
  if (!market) {
    throw new Error('Market not found');
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const marketUrl = `${appUrl}/markets/${marketId}`;

  // Format winnings (assuming it's in wei)
  const winningsInEth = (parseFloat(winnings) / 1e18).toFixed(4);

  // Create cast text
  const castText = 
    `🎉 I won!\n\n` +
    `Market: ${market.title}\n` +
    `Winnings: ${winningsInEth} ETH\n\n` +
    `Think you can predict better? Try your luck! 👇`;

  // Publish cast
  const result = await publishCast({
    text: castText,
    embeds: [{ url: marketUrl }],
    signerUuid,
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to publish cast');
  }

  return {
    success: true,
    castHash: result.cast?.hash,
    castUrl: `https://warpcast.com/~/conversations/${result.cast?.hash}`,
  };
}
