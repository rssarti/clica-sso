/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  autoConnect?: boolean;
  namespace?: string;
}

interface NotificationData {
  type: 'payment' | 'system' | 'general';
  title: string;
  message: string;
  timestamp: Date;
  data?: any;
}

export const useSocket = (url: string = import.meta.env.VITE_SOCKET_IO || 'http://localhost:3000', options: UseSocketOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const { autoConnect = true, namespace = '' } = options;

  useEffect(() => {
    if (!autoConnect) return;

    // Criar conexão Socket.IO
    const socket = io(`${url}`, {
      path: import.meta.env.VITE_SOCKET_PATCH || '/socket.io/',
      transports: ['websocket', 'polling'],
      secure: true,
    });

    socketRef.current = socket;

    // Event listeners
    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão Socket.IO:', error);
      setIsConnected(false);
    });

    // Listeners para notificações
    socket.on('notification', (data: NotificationData) => {
      setNotifications(prev => [data, ...prev].slice(0, 50)); // Manter apenas últimas 50
    });

    socket.on('payment_received', (data: any) => {
      const notification: NotificationData = {
        type: 'payment',
        title: 'Pagamento Recebido',
        message: `Pagamento de R$ ${data.amount} foi confirmado!`,
        timestamp: new Date(),
        data,
      };
      setNotifications(prev => [notification, ...prev].slice(0, 50));
    });

    socket.on('system_message', (data: any) => {
      const notification: NotificationData = {
        type: 'system',
        title: 'Sistema',
        message: data.message,
        timestamp: new Date(),
        data,
      };
      setNotifications(prev => [notification, ...prev].slice(0, 50));
    });

    // Cleanup
    return () => {
      socket.disconnect();
    };
  }, [url, namespace, autoConnect]);

  // Métodos auxiliares
  const connect = () => {
    if (socketRef.current && !isConnected) {
      socketRef.current.connect();
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  const emit = (event: string, data?: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    }
  };

  const joinRoom = (room: string) => {
    emit('join_room', { room });
  };

  const leaveRoom = (room: string) => {
    emit('leave_room', { room });
  };

  const sendMessage = (room: string, message: string, data?: any) => {
    emit('message_to_room', { room, message, data });
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const removeNotification = (index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  return {
    socket: socketRef.current,
    isConnected,
    notifications,
    connect,
    disconnect,
    emit,
    joinRoom,
    leaveRoom,
    sendMessage,
    clearNotifications,
    removeNotification,
  };
};
