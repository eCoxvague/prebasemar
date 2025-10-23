import { NextRequest, NextResponse } from 'next/server';
import {
  verifyFarcasterSignature,
  parseFarcasterUser,
  type FarcasterAuthResponse,
} from '@/lib/auth/farcaster';
import { setUserSession } from '@/lib/kv';
import { fetchFarcasterProfile } from '@/lib/farcaster/hub';
import type { UserSession } from '@/lib/kv/types';

/**
 * POST /api/auth/farcaster
 * Authenticate user with Farcaster
 */
export async function POST(request: NextRequest) {
  try {
    const body: FarcasterAuthResponse = await request.json();

    const { message, signature, fid, username, displayName, pfpUrl, bio } =
      body;

    // Validate required fields
    if (!message || !signature || !fid) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify signature
    const isValid = await verifyFarcasterSignature(message, signature, fid);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Fetch fresh user data from Farcaster Hub
    const profile = await fetchFarcasterProfile(fid);
    if (!profile) {
      return NextResponse.json(
        { error: 'User not found on Farcaster' },
        { status: 404 }
      );
    }

    // Create session
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    const session: UserSession = {
      fid: profile.fid,
      username: profile.username,
      displayName: profile.displayName,
      pfpUrl: profile.pfpUrl,
      expiresAt,
    };

    // Store session in Vercel KV
    await setUserSession(fid, session);

    // Return session data
    return NextResponse.json(
      {
        success: true,
        user: {
          fid: profile.fid,
          username: profile.username,
          displayName: profile.displayName,
          pfpUrl: profile.pfpUrl,
          bio: profile.bio,
        },
        expiresAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Farcaster auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
