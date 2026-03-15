import React, { createContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import { Socket } from 'socket.io-client';

interface NotificationData {
  type: 'payment' | 'system' | 'general';
  title: string;
  message: string;
  timestamp: Date;
  data?: unknown;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  notifications: NotificationData[];
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
  sendMessage: (room: string, message: string, data?: unknown) => void;
  clearNotifications: () => void;
  removeNotification: (index: number) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const {
    socket,
    isConnected,
    notifications,
    joinRoom,
    leaveRoom,
    sendMessage,
    clearNotifications,
    removeNotification,
  } = useSocket(import.meta.env.VITE_SOCKET_IO || 'http://localhost:3000');

  useEffect(() => {
    if (isConnected && user?.id) {
      // Juntar-se à sala do usuário para receber notificações específicas
      joinRoom(`user_${user.id}`);
      
      // Juntar-se à sala geral para mensagens do sistema
      joinRoom('general');

      console.log(`🔗 Usuário ${user.id} conectado às salas: user_${user.id}, general`);
    }
  }, [isConnected, user?.id, joinRoom]);

  const value: SocketContextType = {
    socket,
    isConnected,
    notifications,
    joinRoom,
    leaveRoom,
    sendMessage,
    clearNotifications,
    removeNotification,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export { SocketContext };
