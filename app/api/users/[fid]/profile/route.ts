import { NextRequest, NextResponse } from 'next/server';
import { fetchFarcasterProfile } from '@/lib/farcaster/hub';
import { getCachedUser, cacheUser, getCachedUserBets } from '@/lib/kv';
import {
  getMarketCounter,
  getUserBetsForMarket,
  getClaimableWinnings,
} from '@/lib/blockchain/contract';
import type { CachedUser } from '@/lib/kv/types';
import type { Address } from 'viem';

/**
 * GET /api/users/[fid]/profile
 * Get user profile with Farcaster data and basic statistics (cached)
 * Query params:
 * - walletAddress: User's wallet address (optional, for statistics)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { fid: string } }
) {
  try {
    const fid = parseInt(params.fid, 10);
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get('walletAddress');

    if (isNaN(fid)) {
      return NextResponse.json(
        { error: 'Invalid FID' },
        { status: 400 }
      );
    }

    // Try to get from cache first
    const cachedUser = await getCachedUser(fid);
    let profile: CachedUser;

    if (cachedUser) {
      profile = cachedUser;
    } else {
      // Fetch from Farcaster Hub if not in cache
      const fetchedProfile = await fetchFarcasterProfile(fid);
      if (!fetchedProfile) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Cache the user data
      const userToCache: CachedUser = {
        fid: fetchedProfile.fid,
        username: fetchedProfile.username,
        displayName: fetchedProfile.displayName,
        pfpUrl: fetchedProfile.pfpUrl,
        bio: fetchedProfile.bio,
        cachedAt: Date.now(),
      };

      await cacheUser(userToCache);
      profile = userToCache;
    }

    // Build response with Farcaster data
    const response: any = {
      user: {
        fid: profile.fid,
        username: profile.username,
        displayName: profile.displayName,
        pfpUrl: profile.pfpUrl,
        bio: profile.bio,
      },
      cached: !!cachedUser,
    };

    // If wallet address provided, fetch basic statistics from blockchain
    if (walletAddress) {
      try {
        // Get cached bets or fetch from blockchain
        let cachedBets = await getCachedUserBets(fid);
        
        if (!cachedBets) {
          // Fetch from blockchain (simplified - just count)
          const marketCounter = await getMarketCounter();
          let totalBets = 0;
          let totalWagered = 0n;
          let totalClaimable = 0n;

          for (let i = 0n; i < marketCounter; i++) {
            try {
              const userBets = await getUserBetsForMarket(i, walletAddress as Address);
              if (userBets && userBets.length > 0) {
                totalBets += userBets.length;
                for (const bet of userBets) {
                  totalWagered += bet.amount;
                }
                
                // Get claimable winnings
                const winnings = await getClaimableWinnings(i, walletAddress as Address);
                totalClaimable += winnings;
              }
            } catch (error) {
              // Continue to next market
            }
          }

          response.statistics = {
            totalBets,
            totalWagered: totalWagered.toString(),
            totalClaimable: totalClaimable.toString(),
          };
        } else {
          // Use cached data for quick stats
          const totalWagered = cachedBets.reduce(
            (sum, bet) => sum + BigInt(bet.amount),
            0n
          );

          response.statistics = {
            totalBets: cachedBets.length,
            totalWagered: totalWagered.toString(),
            totalClaimable: '0', // Would need to fetch from blockchain
          };
        }
      } catch (error) {
        console.error('Error fetching user statistics:', error);
        // Don't fail the request, just omit statistics
      }
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}
