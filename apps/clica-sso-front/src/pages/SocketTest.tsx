import React, { useState } from 'react';
import { useSocketContext } from '../hooks/useSocketContext';
import { authCookies } from '../utils/cookies';

const SocketTest: React.FC = () => {
  const { isConnected, socket, notifications, clearNotifications } = useSocketContext();
  const [testMessage, setTestMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [paymentAmount, setPaymentAmount] = useState('50.00');
  const [systemMessage, setSystemMessage] = useState('Mensagem do sistema de teste');

  const sendTestNotification = async () => {
    if (!testMessage.trim()) return;

    try {
      const token = authCookies.getAuthToken();
      
      const response = await fetch('http://localhost:3000/test/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: notificationType,
          message: testMessage,
        }),
      });

      const result = await response.json();
      console.log('Resposta do teste:', result);
      
      if (result.success) {
        setTestMessage('');
        alert('Notificação enviada com sucesso!');
      } else {
        alert('Erro ao enviar notificação: ' + result.message);
      }
    } catch (error) {
      console.error('Erro ao enviar notificação de teste:', error);
      alert('Erro ao enviar notificação de teste');
    }
  };

  const sendPaymentNotification = async () => {
    try {
      const token = authCookies.getAuthToken();
      
      // Primeiro pegamos o ID do usuário atual
      const profileResponse = await fetch('http://localhost:3000/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const profile = await profileResponse.json();
      const userId = profile.id;

      const response = await fetch(`http://localhost:3000/test/payment-notification/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: Date.now(),
          amount: parseFloat(paymentAmount),
        }),
      });

      const result = await response.json();
      console.log('Resposta do pagamento:', result);
      
      if (result.success) {
        alert('Notificação de pagamento enviada!');
      } else {
        alert('Erro ao enviar notificação de pagamento: ' + result.message);
      }
    } catch (error) {
      console.error('Erro ao enviar notificação de pagamento:', error);
      alert('Erro ao enviar notificação de pagamento');
    }
  };

  const sendSystemMessage = async () => {
    if (!systemMessage.trim()) return;

    try {
      const token = authCookies.getAuthToken();
      
      const response = await fetch('http://localhost:3000/test/system-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: systemMessage,
        }),
      });

      const result = await response.json();
      console.log('Resposta da mensagem do sistema:', result);
      
      if (result.success) {
        setSystemMessage('');
        alert('Mensagem do sistema enviada!');
      } else {
        alert('Erro ao enviar mensagem do sistema: ' + result.message);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem do sistema:', error);
      alert('Erro ao enviar mensagem do sistema');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Teste Socket.IO - Notificações em Tempo Real
        </h1>

        {/* Status da Conexão */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Status da Conexão</h2>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`font-medium ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          {socket && (
            <div className="mt-2 text-sm text-gray-600">
              Socket ID: {socket.id}
            </div>
          )}
        </div>

        {/* Enviar Notificação de Teste */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Enviar Notificação de Teste</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Notificação
              </label>
              <select
                value={notificationType}
                onChange={(e) => setNotificationType(e.target.value as 'info' | 'success' | 'warning' | 'error')}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="info">Info</option>
                <option value="success">Sucesso</option>
                <option value="warning">Aviso</option>
                <option value="error">Erro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensagem
              </label>
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Digite sua mensagem de teste..."
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={sendTestNotification}
              disabled={!isConnected || !testMessage.trim()}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Enviar Notificação
            </button>
          </div>
        </div>

        {/* Enviar Notificação de Pagamento */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Simular Pagamento Recebido</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor do Pagamento (R$)
              </label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                step="0.01"
                min="0"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <button
              onClick={sendPaymentNotification}
              disabled={!isConnected}
              className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Simular Pagamento
            </button>
          </div>
        </div>

        {/* Enviar Mensagem do Sistema */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Mensagem do Sistema</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensagem para Todos os Usuários
              </label>
              <input
                type="text"
                value={systemMessage}
                onChange={(e) => setSystemMessage(e.target.value)}
                placeholder="Digite a mensagem do sistema..."
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <button
              onClick={sendSystemMessage}
              disabled={!isConnected || !systemMessage.trim()}
              className="bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Enviar para Todos
            </button>
          </div>
        </div>

        {/* Lista de Notificações */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Notificações Recebidas ({notifications.length})</h2>
            {notifications.length > 0 && (
              <button
                onClick={clearNotifications}
                className="text-sm text-red-600 hover:text-red-800 underline"
              >
                Limpar Todas
              </button>
            )}
          </div>
          
          {notifications.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhuma notificação recebida ainda. Use os botões acima para testar!
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notifications.map((notification, index) => (
                <div
                  key={`${notification.timestamp}-${index}`}
                  className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-md"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-blue-900">{notification.title}</p>
                      <p className="text-blue-800 mt-1">{notification.message}</p>
                      <p className="text-blue-600 text-sm mt-2">
                        {new Date(notification.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {notification.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SocketTest;
