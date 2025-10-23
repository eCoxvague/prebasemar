import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { kv } from '@vercel/kv';
import type {
  MarketCreatedPayload,
  MarketUpdatedPayload,
  MarketResolvedPayload,
  BetPlacedPayload,
  OddsUpdatedPayload,
} from '../kv/pubsub';

// Re-export types
export type {
  MarketCreatedPayload,
  MarketUpdatedPayload,
  MarketResolvedPayload,
  BetPlacedPayload,
  OddsUpdatedPayload,
};

// WebSocket event types
export enum WebSocketEvent {
  // Connection events
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ERROR = 'error',

  // Market events
  MARKET_CREATED = 'market:created',
  MARKET_UPDATED = 'market:updated',
  MARKET_RESOLVED = 'market:resolved',
  MARKET_CANCELLED = 'market:cancelled',

  // Betting events
  BET_PLACED = 'bet:placed',
  ODDS_UPDATED = 'odds:updated',

  // User events
  WINNINGS_CLAIMED = 'winnings:claimed',

  // Room events
  JOIN_MARKET = 'join:market',
  LEAVE_MARKET = 'leave:market',
}

// Additional payload types
export interface WinningsClaimedPayload {
  userId: string;
  amount: string;
  txHash: string;
}

// Vercel KV pub/sub channels
const PUBSUB_CHANNELS = {
  MARKET_UPDATES: 'channel:market:updates',
  BET_UPDATES: 'channel:bet:updates',
  ODDS_UPDATES: 'channel:odds:updates',
} as const;

let io: SocketIOServer | null = null;

/**
 * Initialize Socket.io server
 * @param httpServer - HTTP server instance
 * @returns Socket.io server instance
 */
export function initializeWebSocketServer(
  httpServer: HTTPServer
): SocketIOServer {
  if (io) {
    return io;
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Connection handler
  io.on(WebSocketEvent.CONNECT, (socket: Socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    // Handle market room joins
    socket.on(WebSocketEvent.JOIN_MARKET, (marketId: string) => {
      socket.join(`market:${marketId}`);
      console.log(`[WebSocket] Client ${socket.id} joined market:${marketId}`);
    });

    // Handle market room leaves
    socket.on(WebSocketEvent.LEAVE_MARKET, (marketId: string) => {
      socket.leave(`market:${marketId}`);
      console.log(`[WebSocket] Client ${socket.id} left market:${marketId}`);
    });

    // Handle disconnection
    socket.on(WebSocketEvent.DISCONNECT, () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });

    // Handle errors
    socket.on(WebSocketEvent.ERROR, (error: Error) => {
      console.error(`[WebSocket] Error from ${socket.id}:`, error);
    });
  });

  // Start listening to Vercel KV pub/sub channels
  startKVSubscriptions();

  return io;
}

/**
 * Get Socket.io server instance
 * @returns Socket.io server instance or null if not initialized
 */
export function getWebSocketServer(): SocketIOServer | null {
  return io;
}

/**
 * Start listening to Vercel KV pub/sub channels
 * Note: Vercel KV pub/sub works differently in serverless environments.
 * This implementation uses a polling mechanism to check for new messages.
 */
async function startKVSubscriptions(): Promise<void> {
  if (!io) return;

  console.log('[WebSocket] Starting KV pub/sub listeners');

  // In a serverless environment, we rely on the API routes to publish events
  // and the Socket.io server to broadcast them to connected clients.
  // The actual subscription happens through the broadcast functions.
  
  // For a traditional server setup, you would implement Redis pub/sub here.
  // For Vercel/serverless, the pattern is:
  // 1. API route publishes to KV
  // 2. API route also calls broadcast function
  // 3. Broadcast function emits to Socket.io clients
}

/**
 * Handle market update from KV pub/sub
 */
function handleMarketUpdate(data: any): void {
  if (!io) return;

  const { type, payload } = data;

  switch (type) {
    case 'created':
      io.emit(WebSocketEvent.MARKET_CREATED, payload);
      break;
    case 'updated':
      io.to(`market:${payload.marketId}`).emit(
        WebSocketEvent.MARKET_UPDATED,
        payload
      );
      break;
    case 'resolved':
      io.to(`market:${payload.marketId}`).emit(
        WebSocketEvent.MARKET_RESOLVED,
        payload
      );
      break;
    case 'cancelled':
      io.to(`market:${payload.marketId}`).emit(
        WebSocketEvent.MARKET_CANCELLED,
        payload
      );
      break;
  }
}

/**
 * Handle bet update from KV pub/sub
 */
function handleBetUpdate(data: any): void {
  if (!io) return;

  const { payload } = data;
  io.to(`market:${payload.marketId}`).emit(
    WebSocketEvent.BET_PLACED,
    payload
  );
}

/**
 * Handle odds update from KV pub/sub
 */
function handleOddsUpdate(data: any): void {
  if (!io) return;

  const { payload } = data;
  io.to(`market:${payload.marketId}`).emit(
    WebSocketEvent.ODDS_UPDATED,
    payload
  );
}

/**
 * Broadcast market created event
 */
export async function broadcastMarketCreated(
  payload: MarketCreatedPayload
): Promise<void> {
  if (!io) return;
  
  // Publish to KV for persistence/logging
  await kv.publish(
    PUBSUB_CHANNELS.MARKET_UPDATES,
    JSON.stringify({ type: 'created', payload })
  );
  
  // Emit directly to all connected clients
  io.emit(WebSocketEvent.MARKET_CREATED, payload);
}

/**
 * Broadcast market updated event
 */
export async function broadcastMarketUpdated(
  payload: MarketUpdatedPayload
): Promise<void> {
  if (!io) return;
  
  // Publish to KV for persistence/logging
  await kv.publish(
    PUBSUB_CHANNELS.MARKET_UPDATES,
    JSON.stringify({ type: 'updated', payload })
  );
  
  // Emit to clients in the specific market room
  io.to(`market:${payload.marketId}`).emit(
    WebSocketEvent.MARKET_UPDATED,
    payload
  );
}

/**
 * Broadcast market resolved event
 */
export async function broadcastMarketResolved(
  payload: MarketResolvedPayload
): Promise<void> {
  if (!io) return;
  
  // Publish to KV for persistence/logging
  await kv.publish(
    PUBSUB_CHANNELS.MARKET_UPDATES,
    JSON.stringify({ type: 'resolved', payload })
  );
  
  // Emit to clients in the specific market room
  io.to(`market:${payload.marketId}`).emit(
    WebSocketEvent.MARKET_RESOLVED,
    payload
  );
}

/**
 * Broadcast market cancelled event
 */
export async function broadcastMarketCancelled(
  marketId: string
): Promise<void> {
  if (!io) return;
  
  // Publish to KV for persistence/logging
  await kv.publish(
    PUBSUB_CHANNELS.MARKET_UPDATES,
    JSON.stringify({ type: 'cancelled', payload: { marketId } })
  );
  
  // Emit to clients in the specific market room
  io.to(`market:${marketId}`).emit(WebSocketEvent.MARKET_CANCELLED, {
    marketId,
  });
}

/**
 * Broadcast bet placed event
 */
export async function broadcastBetPlaced(
  payload: BetPlacedPayload
): Promise<void> {
  if (!io) return;
  
  // Publish to KV for persistence/logging
  await kv.publish(
    PUBSUB_CHANNELS.BET_UPDATES,
    JSON.stringify({ payload })
  );
  
  // Emit to clients in the specific market room
  io.to(`market:${payload.marketId}`).emit(WebSocketEvent.BET_PLACED, payload);
}

/**
 * Broadcast odds updated event
 */
export async function broadcastOddsUpdated(
  payload: OddsUpdatedPayload
): Promise<void> {
  if (!io) return;
  
  // Publish to KV for persistence/logging
  await kv.publish(
    PUBSUB_CHANNELS.ODDS_UPDATES,
    JSON.stringify({ payload })
  );
  
  // Emit to clients in the specific market room
  io.to(`market:${payload.marketId}`).emit(
    WebSocketEvent.ODDS_UPDATED,
    payload
  );
}

/**
 * Emit event to specific market room
 */
export function emitToMarket(
  marketId: string,
  event: WebSocketEvent,
  payload: any
): void {
  if (!io) return;
  io.to(`market:${marketId}`).emit(event, payload);
}

/**
 * Emit event to all connected clients
 */
export function emitToAll(event: WebSocketEvent, payload: any): void {
  if (!io) return;
  io.emit(event, payload);
}

/**
 * Get number of connected clients
 */
export function getConnectedClientsCount(): number {
  if (!io) return 0;
  return io.engine.clientsCount;
}

/**
 * Get number of clients in a specific market room
 */
export async function getMarketRoomSize(marketId: string): Promise<number> {
  if (!io) return 0;
  const room = io.sockets.adapter.rooms.get(`market:${marketId}`);
  return room ? room.size : 0;
}

/**
 * Close WebSocket server
 */
export function closeWebSocketServer(): void {
  if (io) {
    io.close();
    io = null;
    console.log('[WebSocket] Server closed');
  }
}
