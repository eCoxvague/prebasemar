import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/kv';

/**
 * Authentication middleware for API routes
 * Checks if user has a valid session
 */
export async function requireAuth(
  request: NextRequest,
  handler: (request: NextRequest, fid: number) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Get FID from header or query param
    const fidHeader = request.headers.get('x-farcaster-fid');
    const searchParams = request.nextUrl.searchParams;
    const fidParam = searchParams.get('fid');

    const fidStr = fidHeader || fidParam;

    if (!fidStr) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const fid = parseInt(fidStr, 10);
    if (isNaN(fid)) {
      return NextResponse.json(
        { error: 'Invalid FID' },
        { status: 400 }
      );
    }

    // Check if session exists and is valid
    const session = await getUserSession(fid);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 401 }
      );
    }

    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    // Call the handler with the authenticated FID
    return await handler(request, fid);
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

/**
 * Optional authentication middleware
 * Passes FID to handler if authenticated, otherwise passes null
 */
export async function optionalAuth(
  request: NextRequest,
  handler: (request: NextRequest, fid: number | null) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const fidHeader = request.headers.get('x-farcaster-fid');
    const searchParams = request.nextUrl.searchParams;
    const fidParam = searchParams.get('fid');

    const fidStr = fidHeader || fidParam;

    if (!fidStr) {
      return await handler(request, null);
    }

    const fid = parseInt(fidStr, 10);
    if (isNaN(fid)) {
      return await handler(request, null);
    }

    const session = await getUserSession(fid);
    if (!session || session.expiresAt < Date.now()) {
      return await handler(request, null);
    }

    return await handler(request, fid);
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    return await handler(request, null);
  }
}
