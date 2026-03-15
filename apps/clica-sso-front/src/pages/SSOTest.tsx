import { useState } from 'react';

/**
 * Componente para testar o sistema de SSO
 * Acesse em: /sso-test
 */
const SSOTest = () => {
  const [callbackUrl, setCallbackUrl] = useState('https://app.exemplo.com/auth/callback');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
  };

  const testSSO = () => {
    addLog('Iniciando teste de SSO...');
    addLog(`URL de callback configurada: ${callbackUrl}`);
    
    const encodedCallback = encodeURIComponent(callbackUrl);
    const ssoUrl = `${window.location.origin}/login?callback=${encodedCallback}`;
    
    addLog(`Redirecionando para: ${ssoUrl}`);
    
    // Simula o que uma aplicação externa faria
    window.location.href = ssoUrl;
  };

  const testCurrentUrl = () => {
    addLog('Testando URL atual...');
    
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const callback = urlParams.get('callback');
    
    addLog(`Token encontrado: ${token ? 'Sim' : 'Não'}`);
    addLog(`Callback encontrado: ${callback || 'Não'}`);
    
    if (token) {
      addLog(`Token: ${token.substring(0, 20)}...`);
      
      // Simula validação do token
      fetch('/api/auth/validate', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (response.ok) {
          addLog('✅ Token válido!');
          return response.json();
        } else {
          addLog('❌ Token inválido');
        }
      })
      .then(userData => {
        if (userData) {
          addLog(`Dados do usuário: ${JSON.stringify(userData, null, 2)}`);
        }
      })
      .catch(err => {
        addLog(`Erro ao validar token: ${err.message}`);
      });
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Teste do Sistema SSO</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuração */}
        <div className="bg-white border border-gray-300 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Configuração do Teste</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL de Callback (sua aplicação):
            </label>
            <input
              type="url"
              value={callbackUrl}
              onChange={(e) => setCallbackUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://sua-app.com/auth/callback"
            />
            <p className="text-xs text-gray-500 mt-1">
              Esta seria a URL da sua aplicação que receberia o token
            </p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={testSSO}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              🚀 Testar SSO Login
            </button>
            
            <button
              onClick={testCurrentUrl}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
            >
              🔍 Analisar URL Atual
            </button>
            
            <button
              onClick={clearLogs}
              className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
            >
              🗑️ Limpar Logs
            </button>
          </div>
        </div>
        
        {/* Logs */}
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Logs do Teste</h2>
          
          <div className="bg-black text-green-400 p-4 rounded-md font-mono text-sm h-80 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">Aguardando logs...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Documentação */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-blue-800">Como usar em sua aplicação</h2>
        
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold text-blue-700">1. Redirecionar para SSO:</h3>
            <code className="block bg-blue-100 p-2 rounded mt-1">
              window.location.href = "https://accounts.clicatecnologia.com.br/login?callback=" + encodeURIComponent("https://sua-app.com/callback");
            </code>
          </div>
          
          <div>
            <h3 className="font-semibold text-blue-700">2. Processar callback:</h3>
            <code className="block bg-blue-100 p-2 rounded mt-1">
              const token = new URLSearchParams(window.location.search).get('token');
            </code>
          </div>
          
          <div>
            <h3 className="font-semibold text-blue-700">3. Validar token:</h3>
            <code className="block bg-blue-100 p-2 rounded mt-1">
              fetch('/api/auth/validate', {'{'}headers: {'{'}Authorization: `Bearer ${'${token}'}`{'}'}{'}'})
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SSOTest;
