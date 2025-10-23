'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { createWebSocketClient, ConnectionState } from '../websocket/client';
import { WebSocketEvent } from '../websocket/server';

interface WebSocketContextValue {
  socket: Socket | null;
  connectionState: ConnectionState;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextValue>({
  socket: null,
  connectionState: ConnectionState.DISCONNECTED,
  isConnected: false,
});

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error(
      'useWebSocketContext must be used within WebSocketProvider'
    );
  }
  return context;
}

interface WebSocketProviderProps {
  children: React.ReactNode;
  autoConnect?: boolean;
}

export function WebSocketProvider({
  children,
  autoConnect = true,
}: WebSocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.DISCONNECTED
  );

  useEffect(() => {
    // Create socket connection
    const newSocket = createWebSocketClient({ autoConnect });
    setSocket(newSocket);

    // Connection event handlers
    newSocket.on(WebSocketEvent.CONNECT, () => {
      console.log('[WebSocket] Connected to server');
      setConnectionState(ConnectionState.CONNECTED);
    });

    newSocket.on(WebSocketEvent.DISCONNECT, () => {
      console.log('[WebSocket] Disconnected from server');
      setConnectionState(ConnectionState.DISCONNECTED);
    });

    newSocket.on(WebSocketEvent.ERROR, (error: Error) => {
      console.error('[WebSocket] Connection error:', error);
      setConnectionState(ConnectionState.ERROR);
    });

    newSocket.on('connect_error', (error: Error) => {
      console.error('[WebSocket] Connection error:', error);
      setConnectionState(ConnectionState.ERROR);
    });

    newSocket.on('reconnect_attempt', () => {
      console.log('[WebSocket] Attempting to reconnect...');
      setConnectionState(ConnectionState.CONNECTING);
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [autoConnect]);

  const value: WebSocketContextValue = {
    socket,
    connectionState,
    isConnected: connectionState === ConnectionState.CONNECTED,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}
