import { NextRequest, NextResponse } from 'next/server';
import { getUserSession, deleteUserSession } from '@/lib/kv';

/**
 * GET /api/auth/session
 * Get current user session
 */
export async function GET(request: NextRequest) {
  try {
    // Get FID from query params or cookie
    const searchParams = request.nextUrl.searchParams;
    const fidParam = searchParams.get('fid');

    if (!fidParam) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const fid = parseInt(fidParam, 10);
    if (isNaN(fid)) {
      return NextResponse.json(
        { error: 'Invalid FID' },
        { status: 400 }
      );
    }

    // Get session from KV
    const session = await getUserSession(fid);

    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      await deleteUserSession(fid);
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Return session data
    return NextResponse.json(
      {
        user: {
          fid: session.fid,
          username: session.username,
          displayName: session.displayName,
          pfpUrl: session.pfpUrl,
          walletAddress: session.walletAddress,
        },
        expiresAt: session.expiresAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/session
 * Logout user (delete session)
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fidParam = searchParams.get('fid');

    if (!fidParam) {
      return NextResponse.json(
        { error: 'FID required' },
        { status: 400 }
      );
    }

    const fid = parseInt(fidParam, 10);
    if (isNaN(fid)) {
      return NextResponse.json(
        { error: 'Invalid FID' },
        { status: 400 }
      );
    }

    // Delete session from KV
    await deleteUserSession(fid);

    return NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
