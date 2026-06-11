import { useEffect, useRef, useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../api/client';
import { WS_BASE_URL } from '../utils/constants';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  send: (message: WebSocketMessage) => void;
  subscribe: (
    type: string,
    handler: (message: WebSocketMessage) => void
  ) => () => void;
}

export const useWebSocket = (
  path: string,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn => {
  const {
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    onOpen,
    onClose,
    onError,
    onMessage,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const handlersRef = useRef<Map<string, Set<(msg: WebSocketMessage) => void>>>(
    new Map()
  );
  const [isConnected, setIsConnected] = useState(false);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) {
      console.error('No auth token for WebSocket');
      return;
    }

    const url = `${WS_BASE_URL}${path}?token=${token}`;
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      reconnectCountRef.current = 0;
      onOpen?.();
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected', event.code);
      setIsConnected(false);
      wsRef.current = null;
      onClose?.();

      // Attempt reconnection
      if (
        reconnectCountRef.current < reconnectAttempts &&
        event.code !== 1000 // Normal closure
      ) {
        reconnectCountRef.current++;
        setTimeout(connect, reconnectInterval);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      onError?.(error);
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        onMessage?.(message);

        // Dispatch to type-specific handlers
        const handlers = handlersRef.current.get(message.type);
        if (handlers) {
          handlers.forEach((handler) => handler(message));
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    wsRef.current = ws;
  }, [
    path,
    reconnectAttempts,
    reconnectInterval,
    onOpen,
    onClose,
    onError,
    onMessage,
  ]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Send message
  const send = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent');
    }
  }, []);

  // Subscribe to message type
  const subscribe = useCallback(
    (type: string, handler: (message: WebSocketMessage) => void) => {
      if (!handlersRef.current.has(type)) {
        handlersRef.current.set(type, new Set());
      }
      handlersRef.current.get(type)!.add(handler);

      // Return unsubscribe function
      return () => {
        handlersRef.current.get(type)?.delete(handler);
      };
    },
    []
  );

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    connect,
    disconnect,
    send,
    subscribe,
  };
};

