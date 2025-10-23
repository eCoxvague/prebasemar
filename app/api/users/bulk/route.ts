import { NextRequest, NextResponse } from 'next/server';
import { fetchFarcasterProfiles } from '@/lib/farcaster/hub';
import { getCachedUser, cacheUsers } from '@/lib/kv';
import type { CachedUser } from '@/lib/kv/types';

/**
 * GET /api/users/bulk?fids=1,2,3
 * Get multiple user profiles with caching
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fidsParam = searchParams.get('fids');

    if (!fidsParam) {
      return NextResponse.json(
        { error: 'fids parameter required' },
        { status: 400 }
      );
    }

    // Parse FIDs
    const fids = fidsParam
      .split(',')
      .map((f) => parseInt(f.trim(), 10))
      .filter((f) => !isNaN(f));

    if (fids.length === 0) {
      return NextResponse.json(
        { error: 'No valid FIDs provided' },
        { status: 400 }
      );
    }

    // Limit to 50 users per request
    if (fids.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 users per request' },
        { status: 400 }
      );
    }

    // Check cache for each user
    const cachedUsers: Record<number, CachedUser> = {};
    const uncachedFids: number[] = [];

    for (const fid of fids) {
      const cached = await getCachedUser(fid);
      if (cached) {
        cachedUsers[fid] = cached;
      } else {
        uncachedFids.push(fid);
      }
    }

    // Fetch uncached users from Farcaster Hub
    let freshUsers: CachedUser[] = [];
    if (uncachedFids.length > 0) {
      const profiles = await fetchFarcasterProfiles(uncachedFids);
      freshUsers = profiles.map((profile) => ({
        fid: profile.fid,
        username: profile.username,
        displayName: profile.displayName,
        pfpUrl: profile.pfpUrl,
        bio: profile.bio,
        cachedAt: Date.now(),
      }));

      // Cache the fresh users
      if (freshUsers.length > 0) {
        await cacheUsers(freshUsers);
      }
    }

    // Combine cached and fresh users
    const allUsers = [
      ...Object.values(cachedUsers),
      ...freshUsers,
    ].map((user) => ({
      fid: user.fid,
      username: user.username,
      displayName: user.displayName,
      pfpUrl: user.pfpUrl,
      bio: user.bio,
    }));

    return NextResponse.json(
      {
        users: allUsers,
        total: allUsers.length,
        cached: Object.keys(cachedUsers).length,
        fresh: freshUsers.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching bulk user profiles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profiles' },
      { status: 500 }
    );
  }
}
