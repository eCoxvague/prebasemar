import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  WebSocketEvent,
  MarketCreatedPayload,
  MarketUpdatedPayload,
  MarketResolvedPayload,
  BetPlacedPayload,
  OddsUpdatedPayload,
  WinningsClaimedPayload,
} from './server';

// WebSocket connection state
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

// WebSocket client configuration
interface WebSocketClientConfig {
  url?: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

/**
 * Create and manage WebSocket client connection
 */
export function createWebSocketClient(
  config: WebSocketClientConfig = {}
): Socket {
  const {
    url = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    autoConnect = true,
    reconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
  } = config;

  const socket = io(url, {
    autoConnect,
    reconnection,
    reconnectionAttempts,
    reconnectionDelay,
    transports: ['websocket', 'polling'],
  });

  return socket;
}

/**
 * Hook for managing WebSocket connection
 */
export function useWebSocket(config?: WebSocketClientConfig) {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.DISCONNECTED
  );
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Create socket connection
    const socket = createWebSocketClient(config);
    socketRef.current = socket;

    // Connection event handlers
    socket.on(WebSocketEvent.CONNECT, () => {
      console.log('[WebSocket] Connected to server');
      setConnectionState(ConnectionState.CONNECTED);
    });

    socket.on(WebSocketEvent.DISCONNECT, () => {
      console.log('[WebSocket] Disconnected from server');
      setConnectionState(ConnectionState.DISCONNECTED);
    });

    socket.on(WebSocketEvent.ERROR, (error: Error) => {
      console.error('[WebSocket] Connection error:', error);
      setConnectionState(ConnectionState.ERROR);
    });

    socket.on('connect_error', (error: Error) => {
      console.error('[WebSocket] Connection error:', error);
      setConnectionState(ConnectionState.ERROR);
    });

    socket.on('reconnect_attempt', () => {
      console.log('[WebSocket] Attempting to reconnect...');
      setConnectionState(ConnectionState.CONNECTING);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current && !socketRef.current.connected) {
      socketRef.current.connect();
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  }, []);

  return {
    socket: socketRef.current,
    connectionState,
    isConnected: connectionState === ConnectionState.CONNECTED,
    connect,
    disconnect,
  };
}

/**
 * Hook for subscribing to market updates
 */
export function useMarketUpdates(marketId: string | null) {
  const { socket, isConnected } = useWebSocket();
  const [marketData, setMarketData] = useState<MarketUpdatedPayload | null>(
    null
  );

  useEffect(() => {
    if (!socket || !isConnected || !marketId) return;

    // Join market room
    socket.emit(WebSocketEvent.JOIN_MARKET, marketId);

    // Listen for market updates
    const handleMarketUpdated = (payload: MarketUpdatedPayload) => {
      if (payload.marketId === marketId) {
        setMarketData(payload);
      }
    };

    socket.on(WebSocketEvent.MARKET_UPDATED, handleMarketUpdated);

    // Cleanup
    return () => {
      socket.off(WebSocketEvent.MARKET_UPDATED, handleMarketUpdated);
      socket.emit(WebSocketEvent.LEAVE_MARKET, marketId);
    };
  }, [socket, isConnected, marketId]);

  return marketData;
}

/**
 * Hook for subscribing to odds updates
 */
export function useOddsUpdates(
  marketId: string | null,
  onOddsUpdate?: (payload: OddsUpdatedPayload) => void
) {
  const { socket, isConnected } = useWebSocket();
  const [odds, setOdds] = useState<number[] | null>(null);

  useEffect(() => {
    if (!socket || !isConnected || !marketId) return;

    // Join market room
    socket.emit(WebSocketEvent.JOIN_MARKET, marketId);

    // Listen for odds updates
    const handleOddsUpdated = (payload: OddsUpdatedPayload) => {
      if (payload.marketId === marketId) {
        setOdds(payload.odds);
        onOddsUpdate?.(payload);
      }
    };

    socket.on(WebSocketEvent.ODDS_UPDATED, handleOddsUpdated);

    // Cleanup
    return () => {
      socket.off(WebSocketEvent.ODDS_UPDATED, handleOddsUpdated);
      socket.emit(WebSocketEvent.LEAVE_MARKET, marketId);
    };
  }, [socket, isConnected, marketId, onOddsUpdate]);

  return odds;
}

/**
 * Hook for subscribing to bet placed events
 */
export function useBetPlaced(
  marketId: string | null,
  onBetPlaced?: (payload: BetPlacedPayload) => void
) {
  const { socket, isConnected } = useWebSocket();
  const [lastBet, setLastBet] = useState<BetPlacedPayload | null>(null);

  useEffect(() => {
    if (!socket || !isConnected || !marketId) return;

    // Join market room
    socket.emit(WebSocketEvent.JOIN_MARKET, marketId);

    // Listen for bet placed events
    const handleBetPlaced = (payload: BetPlacedPayload) => {
      if (payload.marketId === marketId) {
        setLastBet(payload);
        onBetPlaced?.(payload);
      }
    };

    socket.on(WebSocketEvent.BET_PLACED, handleBetPlaced);

    // Cleanup
    return () => {
      socket.off(WebSocketEvent.BET_PLACED, handleBetPlaced);
      socket.emit(WebSocketEvent.LEAVE_MARKET, marketId);
    };
  }, [socket, isConnected, marketId, onBetPlaced]);

  return lastBet;
}

/**
 * Hook for subscribing to market resolution events
 */
export function useMarketResolution(
  marketId: string | null,
  onMarketResolved?: (payload: MarketResolvedPayload) => void
) {
  const { socket, isConnected } = useWebSocket();
  const [resolution, setResolution] = useState<MarketResolvedPayload | null>(
    null
  );

  useEffect(() => {
    if (!socket || !isConnected || !marketId) return;

    // Join market room
    socket.emit(WebSocketEvent.JOIN_MARKET, marketId);

    // Listen for market resolved events
    const handleMarketResolved = (payload: MarketResolvedPayload) => {
      if (payload.marketId === marketId) {
        setResolution(payload);
        onMarketResolved?.(payload);
      }
    };

    socket.on(WebSocketEvent.MARKET_RESOLVED, handleMarketResolved);

    // Cleanup
    return () => {
      socket.off(WebSocketEvent.MARKET_RESOLVED, handleMarketResolved);
      socket.emit(WebSocketEvent.LEAVE_MARKET, marketId);
    };
  }, [socket, isConnected, marketId, onMarketResolved]);

  return resolution;
}

/**
 * Hook for subscribing to all market events (created, updated, resolved)
 */
export function useMarketEvents(callbacks?: {
  onMarketCreated?: (payload: MarketCreatedPayload) => void;
  onMarketUpdated?: (payload: MarketUpdatedPayload) => void;
  onMarketResolved?: (payload: MarketResolvedPayload) => void;
  onMarketCancelled?: (payload: { marketId: string }) => void;
}) {
  const { socket, isConnected } = useWebSocket();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for market created events
    if (callbacks?.onMarketCreated) {
      socket.on(WebSocketEvent.MARKET_CREATED, callbacks.onMarketCreated);
    }

    // Listen for market updated events
    if (callbacks?.onMarketUpdated) {
      socket.on(WebSocketEvent.MARKET_UPDATED, callbacks.onMarketUpdated);
    }

    // Listen for market resolved events
    if (callbacks?.onMarketResolved) {
      socket.on(WebSocketEvent.MARKET_RESOLVED, callbacks.onMarketResolved);
    }

    // Listen for market cancelled events
    if (callbacks?.onMarketCancelled) {
      socket.on(WebSocketEvent.MARKET_CANCELLED, callbacks.onMarketCancelled);
    }

    // Cleanup
    return () => {
      if (callbacks?.onMarketCreated) {
        socket.off(WebSocketEvent.MARKET_CREATED, callbacks.onMarketCreated);
      }
      if (callbacks?.onMarketUpdated) {
        socket.off(WebSocketEvent.MARKET_UPDATED, callbacks.onMarketUpdated);
      }
      if (callbacks?.onMarketResolved) {
        socket.off(WebSocketEvent.MARKET_RESOLVED, callbacks.onMarketResolved);
      }
      if (callbacks?.onMarketCancelled) {
        socket.off(
          WebSocketEvent.MARKET_CANCELLED,
          callbacks.onMarketCancelled
        );
      }
    };
  }, [socket, isConnected, callbacks]);
}

/**
 * Hook for subscribing to winnings claimed events
 */
export function useWinningsClaimed(
  userId: string | null,
  onWinningsClaimed?: (payload: WinningsClaimedPayload) => void
) {
  const { socket, isConnected } = useWebSocket();
  const [lastClaim, setLastClaim] = useState<WinningsClaimedPayload | null>(
    null
  );

  useEffect(() => {
    if (!socket || !isConnected || !userId) return;

    // Listen for winnings claimed events
    const handleWinningsClaimed = (payload: WinningsClaimedPayload) => {
      if (payload.userId === userId) {
        setLastClaim(payload);
        onWinningsClaimed?.(payload);
      }
    };

    socket.on(WebSocketEvent.WINNINGS_CLAIMED, handleWinningsClaimed);

    // Cleanup
    return () => {
      socket.off(WebSocketEvent.WINNINGS_CLAIMED, handleWinningsClaimed);
    };
  }, [socket, isConnected, userId, onWinningsClaimed]);

  return lastClaim;
}
