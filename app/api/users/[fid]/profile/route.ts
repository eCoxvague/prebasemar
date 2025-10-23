import { NextRequest, NextResponse } from 'next/server';
import { fetchFarcasterProfile } from '@/lib/farcaster/hub';
import { getCachedUser, cacheUser } from '@/lib/kv';
import type { CachedUser } from '@/lib/kv/types';

/**
 * GET /api/users/[fid]/profile
 * Get user profile with caching
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { fid: string } }
) {
  try {
    const fid = parseInt(params.fid, 10);

    if (isNaN(fid)) {
      return NextResponse.json(
        { error: 'Invalid FID' },
        { status: 400 }
      );
    }

    // Try to get from cache first
    const cachedUser = await getCachedUser(fid);
    if (cachedUser) {
      return NextResponse.json(
        {
          user: {
            fid: cachedUser.fid,
            username: cachedUser.username,
            displayName: cachedUser.displayName,
            pfpUrl: cachedUser.pfpUrl,
            bio: cachedUser.bio,
          },
          cached: true,
          cachedAt: cachedUser.cachedAt,
        },
        { status: 200 }
      );
    }

    // Fetch from Farcaster Hub if not in cache
    const profile = await fetchFarcasterProfile(fid);
    if (!profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Cache the user data
    const userToCache: CachedUser = {
      fid: profile.fid,
      username: profile.username,
      displayName: profile.displayName,
      pfpUrl: profile.pfpUrl,
      bio: profile.bio,
      cachedAt: Date.now(),
    };

    await cacheUser(userToCache);

    return NextResponse.json(
      {
        user: {
          fid: profile.fid,
          username: profile.username,
          displayName: profile.displayName,
          pfpUrl: profile.pfpUrl,
          bio: profile.bio,
          followerCount: profile.followerCount,
          followingCount: profile.followingCount,
        },
        cached: false,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}
