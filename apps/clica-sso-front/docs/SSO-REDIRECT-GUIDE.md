# Sistema de SSO - Single Sign-On

## Como Funciona o Redirect Após Autenticação

### 1. Fluxo Básico

1. **Aplicação externa** redireciona usuário para login:
   ```
   https://accounts.clicatecnologia.com.br/login?callback=https://sua-app.com/auth/callback
   ```

2. **Usuário faz login** no sistema SSO

3. **Sistema SSO** redireciona de volta com token:
   ```
   https://sua-app.com/auth/callback?token=jwt_token&expires_in=3600
   ```

4. **Aplicação externa** valida o token e autentica o usuário

### 2. Parâmetros de URL Suportados

- `callback`: URL de retorno (padrão)
- `redirect_uri`: URL de retorno (alternativo, compatível com OAuth)

### 3. Segurança

O sistema possui validação de URLs permitidas. Domínios autorizados:
- `localhost` (desenvolvimento)
- `127.0.0.1` (desenvolvimento)
- `clicatecnologia.com.br` e subdomínios
- `app.clicatecnologia.com.br`
- `sistema.clicatecnologia.com.br`

### 4. Implementação na Aplicação de Destino

#### 4.1 Redirecionar para SSO

```javascript
function redirectToSSO() {
  const callbackUrl = encodeURIComponent('https://sua-app.com/auth/callback');
  const ssoUrl = `https://accounts.clicatecnologia.com.br/login?callback=${callbackUrl}`;
  window.location.href = ssoUrl;
}
```

#### 4.2 Processar Callback

```javascript
// Na página /auth/callback
function handleSSOCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const expiresIn = urlParams.get('expires_in');
  
  if (token) {
    // Salvar token
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_expires', Date.now() + (parseInt(expiresIn) * 1000));
    
    // Limpar URL
    const url = new URL(window.location.href);
    url.searchParams.delete('token');
    url.searchParams.delete('expires_in');
    window.history.replaceState({}, '', url.toString());
    
    // Redirecionar para dashboard
    window.location.href = '/dashboard';
  }
}
```

#### 4.3 Validar Token

```javascript
async function validateToken(token) {
  try {
    const response = await fetch('https://api.clicatecnologia.com.br/auth/validate', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch {
    return null;
  }
}
```

### 5. Exemplo Completo - React

```jsx
import { useEffect, useState } from 'react';

function SSOCallback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (token) {
          // Validar token
          const response = await fetch('https://api.clicatecnologia.com.br/auth/validate', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const userData = await response.json();
            
            // Salvar dados
            localStorage.setItem('auth_token', token);
            localStorage.setItem('user_data', JSON.stringify(userData));
            
            // Limpar URL e redirecionar
            window.history.replaceState({}, '', '/dashboard');
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
  
  if (loading) return <div>Processando autenticação...</div>;
  if (error) return <div>Erro: {error}</div>;
  return null;
}

export default SSOCallback;
```

### 6. Middleware de Autenticação

```javascript
function authMiddleware() {
  const token = localStorage.getItem('auth_token');
  const expires = localStorage.getItem('auth_expires');
  
  if (!token || !expires || Date.now() > parseInt(expires)) {
    // Token expirado, redirecionar para SSO
    const callbackUrl = encodeURIComponent(window.location.href);
    window.location.href = `https://accounts.clicatecnologia.com.br/login?callback=${callbackUrl}`;
    return false;
  }
  
  return true;
}
```

### 7. Endpoints da API

- **Login**: `https://accounts.clicatecnologia.com.br/login?callback=URL`
- **Validação**: `https://api.clicatecnologia.com.br/auth/validate`
- **Dados do usuário**: `https://api.clicatecnologia.com.br/auth/user`

### 8. Estrutura de Resposta do Token

Quando validado, o token retorna:

```json
{
  "id": "user-id",
  "email": "user@email.com",
  "name": "Nome do Usuário",
  "roles": ["user"],
  "exp": 1234567890
}
```

### 9. Tratamento de Erros

- Token inválido ou expirado: Redirecionar para SSO
- URL de callback inválida: Redirecionar para dashboard
- Erro de rede: Mostrar mensagem de erro
