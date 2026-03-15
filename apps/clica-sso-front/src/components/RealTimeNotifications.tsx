import React, { useState } from 'react';
import { useSocketContext } from '../hooks/useSocketContext';

interface NotificationData {
  type: 'payment' | 'system' | 'general';
  title: string;
  message: string;
  timestamp: Date;
  data?: unknown;
}

const NotificationItem: React.FC<{
  notification: NotificationData;
  index: number;
  onRemove: (index: number) => void;
}> = ({ notification, index, onRemove }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'payment':
        return '💰';
      case 'system':
        return '📢';
      default:
        return '🔔';
    }
  };

  const getTypeColor = () => {
    switch (notification.type) {
      case 'payment':
        return 'bg-green-100 border-green-500 text-green-800';
      case 'system':
        return 'bg-blue-100 border-blue-500 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  return (
    <div className={`border-l-4 p-4 mb-3 rounded-lg ${getTypeColor()}`}>
      <div className="flex justify-between items-start">
        <div className="flex items-start space-x-3">
          <span className="text-xl">{getIcon()}</span>
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{notification.title}</h4>
            <p className="text-sm mt-1">{notification.message}</p>
            <span className="text-xs opacity-75">
              {notification.timestamp.toLocaleTimeString()}
            </span>
          </div>
        </div>
        <button
          onClick={() => onRemove(index)}
          className="ml-4 text-lg leading-none opacity-50 hover:opacity-100 transition-opacity"
          title="Remover notificação"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export const RealTimeNotifications: React.FC = () => {
  const { isConnected, notifications, clearNotifications, removeNotification } = useSocketContext();
  const [isOpen, setIsOpen] = useState(false);

  if (!notifications.length) {
    return null;
  }

  return (
    <>
      {/* Botão de notificações */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative bg-white shadow-lg rounded-full p-3 border-2 transition-all ${
            isConnected ? 'border-green-500' : 'border-red-500'
          }`}
          title={isConnected ? 'Conectado - Socket.IO' : 'Desconectado - Socket.IO'}
        >
          <span className="text-xl">🔔</span>
          {notifications.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
              {notifications.length > 9 ? '9+' : notifications.length}
            </span>
          )}
        </button>
      </div>

      {/* Painel de notificações */}
      {isOpen && (
        <div className="fixed top-16 right-4 z-40 w-96 max-w-screen bg-white shadow-xl rounded-lg border">
          <div className="p-4 border-b bg-gray-50 rounded-t-lg">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">
                Notificações em Tempo Real
                <span className={`ml-2 inline-block w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}></span>
              </h3>
              <div className="flex space-x-2">
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="text-sm text-gray-600 hover:text-gray-800 underline"
                  >
                    Limpar todas
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-lg leading-none text-gray-600 hover:text-gray-800"
                >
                  ×
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto p-4">
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Nenhuma notificação ainda...
              </p>
            ) : (
              <div>
                {notifications.map((notification, index) => (
                  <NotificationItem
                    key={`${notification.timestamp.getTime()}-${index}`}
                    notification={notification}
                    index={index}
                    onRemove={removeNotification}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="p-3 border-t bg-gray-50 rounded-b-lg text-center">
            <span className="text-xs text-gray-600">
              Status: {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
            </span>
          </div>
        </div>
      )}

      {/* Overlay para fechar */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
