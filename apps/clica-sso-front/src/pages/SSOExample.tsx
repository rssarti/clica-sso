import { useEffect, useState } from 'react';
import TokenValidator from '../components/TokenValidator';
import { authCookies } from '../utils/cookies';
import type { ValidationResponse } from '../types/auth';

/**
 * Exemplo de como integrar o SSO em uma aplicação cliente
 * Este componente deve ser usado na aplicação de destino (não no SSO)
 */
const SSOExample = () => {
  const [user, setUser] = useState<ValidationResponse['user'] | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleValidToken = (userData: ValidationResponse['user']) => {
    setUser(userData);
    setIsAuthenticated(true);
    
    // Aqui você pode salvar o usuário no seu estado global (Redux, Zustand, etc.)
    console.log('Usuário autenticado via SSO:', userData);
  };

  const handleInvalidToken = () => {
    setIsAuthenticated(false);
    
    // Redireciona para o SSO com a URL atual como callback
    const currentUrl = window.location.origin + window.location.pathname;
    const ssoUrl = 'http://localhost:5173'; // URL do seu SSO
    const loginUrl = `${ssoUrl}/login?callback=${encodeURIComponent(currentUrl)}`;
    
    window.location.href = loginUrl;
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    
    // Limpa cookies de autenticação
    authCookies.clearAuthData();
    
    // Opcionalmente, redireciona para o SSO
    const ssoUrl = 'http://localhost:5173';
    window.location.href = `${ssoUrl}/login`;
  };

  // Verifica se há usuário salvo nos cookies
  useEffect(() => {
    if (!isAuthenticated && !window.location.search.includes('token')) {
      const savedUser = authCookies.getUserData();
      if (savedUser) {
        setUser(savedUser);
        setIsAuthenticated(true);
      }
    }
  }, [isAuthenticated]);

  // Renova os cookies quando autenticado
  useEffect(() => {
    if (user && isAuthenticated) {
      authCookies.refreshCookies();
    }
  }, [user, isAuthenticated]);

  const AppContent = () => (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #ccc',
        paddingBottom: '10px',
        marginBottom: '20px'
      }}>
        <h1>Aplicação Cliente - SSO</h1>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span>Olá, {user.name}!</span>
            <button 
              onClick={handleLogout}
              style={{
                background: '#e53e3e',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Sair
            </button>
          </div>
        )}
      </header>

      <main>
        <div style={{
          background: '#f0f8ff',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #b0d4f1',
          marginBottom: '20px'
        }}>
          <h2>✅ Autenticação SSO Funcionando!</h2>
          <p>Este é um exemplo de como integrar o SSO em sua aplicação.</p>
          
          {user && (
            <div style={{ marginTop: '15px' }}>
              <h3>Dados do usuário autenticado:</h3>
              <ul>
                <li><strong>ID:</strong> {user.id}</li>
                <li><strong>Nome:</strong> {user.name}</li>
                <li><strong>Email:</strong> {user.email}</li>
              </ul>
            </div>
          )}
        </div>

        <div style={{
          background: '#fff3cd',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #ffeaa7'
        }}>
          <h3>Como funciona:</h3>
          <ol>
            <li>Usuário acessa sua aplicação</li>
            <li>Se não estiver autenticado, é redirecionado para o SSO</li>
            <li>Após login/registro, retorna com um token</li>
            <li>Token é validado automaticamente</li>
            <li>Usuário fica logado na aplicação</li>
          </ol>
        </div>
      </main>
    </div>
  );

  // Se não há token na URL e não está autenticado, redireciona para SSO
  if (!window.location.search.includes('token') && !isAuthenticated) {
    return (
      <div style={{ 
        padding: '50px', 
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h2>🔒 Acesso Restrito</h2>
        <p>Você precisa estar logado para acessar esta aplicação.</p>
        <button 
          onClick={() => handleInvalidToken()}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          Fazer Login via SSO
        </button>
      </div>
    );
  }

  return (
    <TokenValidator 
      onValidToken={handleValidToken}
      onInvalidToken={handleInvalidToken}
    >
      <AppContent />
    </TokenValidator>
  );
};

export default SSOExample;
