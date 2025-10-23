import { NextRequest, NextResponse } from 'next/server';
import { invalidateMarketCache } from '@/lib/kv';

/**
 * POST /api/markets/invalidate-cache
 * Invalidate market cache after blockchain transactions
 * This should be called after successful market creation, resolution, or cancellation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { marketId } = body;

    // Invalidate specific market or all markets
    await invalidateMarketCache(marketId);

    return NextResponse.json({
      success: true,
      message: marketId 
        ? `Cache invalidated for market ${marketId}` 
        : 'All market cache invalidated',
    });
  } catch (error) {
    console.error('Error invalidating cache:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to invalidate cache',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
