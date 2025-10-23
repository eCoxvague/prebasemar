import { NextRequest, NextResponse } from 'next/server';
import { getNeynarClient } from '@/lib/farcaster/neynar';
import { getCachedMarket } from '@/lib/kv';

export const runtime = 'nodejs';

export interface Activity {
  id: string;
  type: 'market_created' | 'bet_placed' | 'market_resolved' | 'winnings_claimed';
  user: {
    fid: number;
    username: string;
    displayName: string;
    pfpUrl: string;
  };
  market: {
    id: string;
    title: string;
  };
  details?: {
    outcome?: string;
    amount?: string;
    winnings?: string;
  };
  timestamp: number;
  castHash?: string;
}

/**
 * GET /api/social/feed
 * Get social feed of follower activities
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fid = searchParams.get('fid');
    const limit = parseInt(searchParams.get('limit') || '25');

    if (!fid) {
      return NextResponse.json(
        { error: 'FID parameter is required' },
        { status: 400 }
      );
    }

    // Get user's followers from Neynar
    const client = getNeynarClient();
    const followersData = await client.fetchUserFollowers({
      fid: parseInt(fid),
      limit: 100,
    });

    const followerFids = followersData.users.map((user: any) => user.fid);

    // Get recent casts from followers that mention markets
    const activities: Activity[] = [];

    // Fetch recent casts from followers
    for (const followerFid of followerFids.slice(0, 20)) {
      try {
        const casts = await client.fetchCastsForUser({
          fid: followerFid,
          limit: 5,
        });

        for (const cast of casts.casts) {
          // Check if cast mentions a market
          const marketMatch = cast.text.match(/markets\/([a-zA-Z0-9]+)/);
          if (marketMatch) {
            const marketId = marketMatch[1];
            const market = await getCachedMarket(marketId);

            if (market) {
              // Determine activity type from cast text
              let activityType: Activity['type'] = 'market_created';
              const details: Activity['details'] = {};

              if (cast.text.includes('placed a bet') || cast.text.includes('Just placed')) {
                activityType = 'bet_placed';
                const amountMatch = cast.text.match(/(\d+\.?\d*)\s*ETH/);
                if (amountMatch) {
                  details.amount = amountMatch[1];
                }
              } else if (cast.text.includes('won') || cast.text.includes('Winnings')) {
                activityType = 'winnings_claimed';
                const winningsMatch = cast.text.match(/(\d+\.?\d*)\s*ETH/);
                if (winningsMatch) {
                  details.winnings = winningsMatch[1];
                }
              } else if (cast.text.includes('New Prediction Market')) {
                activityType = 'market_created';
              }

              activities.push({
                id: cast.hash,
                type: activityType,
                user: {
                  fid: cast.author.fid,
                  username: cast.author.username,
                  displayName: cast.author.display_name || cast.author.username,
                  pfpUrl: cast.author.pfp_url || '',
                },
                market: {
                  id: marketId,
                  title: market.title,
                },
                details,
                timestamp: new Date(cast.timestamp).getTime(),
                castHash: cast.hash,
              });
            }
          }
        }
      } catch (error) {
        console.error(`Failed to fetch casts for FID ${followerFid}:`, error);
        // Continue with other followers
      }
    }

    // Sort by timestamp (most recent first)
    activities.sort((a, b) => b.timestamp - a.timestamp);

    // Limit results
    const limitedActivities = activities.slice(0, limit);

    return NextResponse.json({
      activities: limitedActivities,
      total: activities.length,
    });
  } catch (error: any) {
    console.error('Social feed error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch social feed' },
      { status: 500 }
    );
  }
}
