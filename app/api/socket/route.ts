import { NextRequest, NextResponse } from 'next/server';

/**
 * WebSocket status endpoint
 * Returns information about the WebSocket server status
 */
export async function GET(request: NextRequest) {
  try {
    // Check if Socket.io is available
    const io = (global as any).io;

    if (!io) {
      return NextResponse.json(
        {
          status: 'unavailable',
          message: 'WebSocket server not initialized',
        },
        { status: 503 }
      );
    }

    // Get connection statistics
    const connectedClients = io.engine.clientsCount || 0;

    return NextResponse.json({
      status: 'available',
      connectedClients,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[WebSocket API] Error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to get WebSocket status',
      },
      { status: 500 }
    );
  }
}
