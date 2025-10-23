// Server-side exports
export {
  initializeWebSocketServer,
  getWebSocketServer,
  broadcastMarketCreated,
  broadcastMarketUpdated,
  broadcastMarketResolved,
  broadcastMarketCancelled,
  broadcastBetPlaced,
  broadcastOddsUpdated,
  emitToMarket,
  emitToAll,
  getConnectedClientsCount,
  getMarketRoomSize,
  closeWebSocketServer,
  WebSocketEvent,
  type MarketCreatedPayload,
  type MarketUpdatedPayload,
  type MarketResolvedPayload,
  type BetPlacedPayload,
  type OddsUpdatedPayload,
  type WinningsClaimedPayload,
} from './server';

// Client-side exports
export {
  createWebSocketClient,
  useWebSocket,
  useMarketUpdates,
  useOddsUpdates,
  useBetPlaced,
  useMarketResolution,
  useMarketEvents,
  useWinningsClaimed,
  ConnectionState,
} from './client';
