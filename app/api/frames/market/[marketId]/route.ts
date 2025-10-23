import { NextRequest, NextResponse } from 'next/server';
import { validateFrameSignature, generateMarketFrame } from '@/lib/farcaster/frames';
import { getCachedMarket } from '@/lib/kv';

export const runtime = 'nodejs';

/**
 * POST /api/frames/market/[marketId]
 * Handle Frame button interactions
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { marketId: string } }
) {
  try {
    const { marketId } = params;
    const body = await request.json();

    // Validate Frame signature
    const validation = await validateFrameSignature(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid frame signature' },
        { status: 400 }
      );
    }

    // Get market details
    const market = await getCachedMarket(marketId);
    if (!market) {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      );
    }

    // Get button index from frame data
    const buttonIndex = body.untrustedData?.buttonIndex || 1;

    // Handle different button actions
    switch (buttonIndex) {
      case 1: // View Market
        return NextResponse.json({
          type: 'frame',
          frameUrl: `${process.env.NEXT_PUBLIC_APP_URL}/markets/${marketId}`,
        });

      case 2: // Place Bet
        return NextResponse.json({
          type: 'frame',
          frameUrl: `${process.env.NEXT_PUBLIC_APP_URL}/markets/${marketId}`,
        });

      case 3: // Share
        // Generate new frame for sharing
        const frame = generateMarketFrame(marketId, market.title);
        return NextResponse.json({
          type: 'frame',
          frame,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid button index' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Frame handler error:', error);
    return NextResponse.json(
      { error: error.message || 'Frame handler failed' },
      { status: 500 }
    );
  }
}
