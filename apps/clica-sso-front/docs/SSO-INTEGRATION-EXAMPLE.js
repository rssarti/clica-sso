/**
 * EXEMPLO DE USO - Aplicação de Destino
 * 
 * Como implementar o SSO na sua aplicação que vai receber o redirect
 */

// 1. ENVIANDO USUÁRIO PARA AUTENTICAÇÃO
// Em sua aplicação, quando precisar autenticar:
function redirectToSSO() {
  const callbackUrl = encodeURIComponent('https://sua-app.com/auth/callback');
  const ssoUrl = `https://accounts.clicatecnologia.com.br/login?callback=${callbackUrl}`;
  window.location.href = ssoUrl;
}

// 2. RECEBENDO O TOKEN DE VOLTA
// Na página /auth/callback da sua aplicação:
function handleSSOCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const expiresIn = urlParams.get('expires_in');
  
  if (token) {
    // Salva o token (localStorage, cookies, etc.)
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_expires', Date.now() + (parseInt(expiresIn || '3600') * 1000));
    
    // Limpa a URL
    const url = new URL(window.location.href);
    url.searchParams.delete('token');
    url.searchParams.delete('expires_in');
    window.history.replaceState({}, '', url.toString());
    
    // Redireciona para a página principal da aplicação
    window.location.href = '/dashboard';
  } else {
    // Erro na autenticação
    window.location.href = '/login?error=auth_failed';
  }
}

// 3. VALIDANDO O TOKEN
// Para validar se o token é válido:
async function validateToken(token: string) {
  try {
    const response = await fetch('https://api.clicatecnologia.com.br/auth/validate', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const userData = await response.json();
      return userData;
    }
    return null;
  } catch {
    return null;
  }
}

// 4. MIDDLEWARE PARA ROTAS PROTEGIDAS
// Exemplo de middleware para verificar autenticação:
function authMiddleware() {
  const token = localStorage.getItem('auth_token');
  const expires = localStorage.getItem('auth_expires');
  
  if (!token || !expires || Date.now() > parseInt(expires)) {
    // Token expirado ou não existe, redireciona para SSO
    redirectToSSO();
    return false;
  }
  
  return true;
}

// 5. EXEMPLO DE COMPONENTE REACT
import { useEffect, useState } from 'react';

function SSOCallback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (token) {
          // Valida o token com o backend
          const userData = await validateToken(token);
          
          if (userData) {
            // Salva os dados do usuário
            localStorage.setItem('auth_token', token);
            localStorage.setItem('user_data', JSON.stringify(userData));
            
            // Limpa a URL
            window.history.replaceState({}, '', '/dashboard');
            
            // Redireciona
            window.location.href = '/dashboard';
          } else {
            setError('Token inválido');
          }
        } else {
          setError('Token não encontrado');
        }
      } catch {
        setError('Erro ao processar autenticação');
      } finally {
        setLoading(false);
      }
    };
    
    handleCallback();
  }, []);
  
  if (loading) {
    return <div>Processando autenticação...</div>;
  }
  
  if (error) {
    return (
      <div>
        <h2>Erro na Autenticação</h2>
        <p>{error}</p>
        <button onClick={redirectToSSO}>Tentar Novamente</button>
      </div>
    );
  }
  
  return null;
}

export default SSOCallback;
