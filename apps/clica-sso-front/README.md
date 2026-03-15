# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# Clica SSO Frontend

Sistema de Single Sign-On (SSO) desenvolvido em React com TypeScript.

## Funcionalidades

- ✅ Tela de Login com validação
- ✅ Tela de Registro com validação de senha
- ✅ Suporte a callback URLs para redirecionamento
- ✅ Validação de tokens JWT
- ✅ **Sistema de Cookies seguros para autenticação**
- ✅ **Context API para estado global de autenticação**
- ✅ **Hooks customizados para facilitar uso**
- ✅ Interface responsiva
- ✅ Tratamento de erros

## Instalação

1. Clone o repositório
2. Instale as dependências:
   ```bash
   pnpm install
   ```

3. Configure as variáveis de ambiente:
   ```bash
   cp .env.example .env
   ```

4. Ajuste as URLs no arquivo `.env` conforme necessário

5. Execute o projeto:
   ```bash
   pnpm dev
   ```

## Autenticação com Cookies

O sistema utiliza cookies seguros para gerenciar autenticação:

### Uso Básico
```typescript
import { useAuth } from './hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  // Dados persistem automaticamente nos cookies
  // Sincronização entre abas
  // Expiração automática em 7 dias
}
```

### Context Global
```typescript
import { useAuthContext } from './hooks/useAuthContext';

// Em qualquer componente dentro do AuthProvider
const { user, token, logout } = useAuthContext();
```

📖 **Documentação completa**: [COOKIES.md](./COOKIES.md)

## Uso do SSO

### Para Aplicações Cliente

#### 1. Redirecionamento para Login
```
https://sso.example.com/login?callback=https://app1.example.com/dashboard
```

#### 2. Redirecionamento para Registro
```
https://sso.example.com/register?callback=https://app1.example.com/dashboard
```

#### 3. Recebimento do Token
Após o login/registro bem-sucedido, o usuário será redirecionado para:
```
https://app1.example.com/dashboard?token=jwt-token-aqui
```

#### 4. Validação do Token
Use o componente `TokenValidator` ou chame diretamente a API:

```typescript
import { authService } from './services/auth';

const token = new URLSearchParams(window.location.search).get('token');
if (token) {
  const validation = await authService.validateToken({ token });
  if (validation.valid) {
    // Usuário autenticado
    console.log('Usuário:', validation.user);
  }
}
```

## API Endpoints

### POST /auth/login
```json
{
  "email": "usuario@example.com",
  "password": "senha123"
}
```

**Resposta:**
```json
{
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "name": "Nome do Usuário",
    "email": "usuario@example.com"
  }
}
```

### POST /auth/register
```json
{
  "name": "Nome do Usuário",
  "email": "usuario@example.com",
  "password": "senha123",
  "confirmPassword": "senha123"
}
```

**Resposta:**
```json
{
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "name": "Nome do Usuário",
    "email": "usuario@example.com"
  }
}
```

### POST /auth/validate
```json
{
  "token": "jwt-token"
}
```

**Resposta:**
```json
{
  "valid": true,
  "user": {
    "id": "user-id",
    "name": "Nome do Usuário",
    "email": "usuario@example.com"
  }
}
```

## Componentes Principais

### Login (`/login`)
- Formulário de login com email e senha
- Validação de campos
- Redirecionamento automático via callback
- Tratamento de erros

### Register (`/register`)
- Formulário de registro completo
- Validação de confirmação de senha
- Redirecionamento automático via callback
- Tratamento de erros

### Dashboard (`/dashboard`)
- Página de exemplo para demonstrar o funcionamento
- Validação automática de token
- Exibição de informações do usuário
- Funcionalidade de logout

### TokenValidator
- Componente para validar tokens automaticamente
- Útil para integrar em aplicações cliente
- Gerencia estados de carregamento e erro

## Estrutura do Projeto

```
src/
├── components/
│   └── TokenValidator.tsx    # Validador de tokens
├── pages/
│   ├── Login.tsx            # Página de login
│   ├── Register.tsx         # Página de registro
│   └── Dashboard.tsx        # Dashboard exemplo
├── services/
│   └── auth.ts             # Serviços de autenticação
├── types/
│   └── auth.ts             # Tipos TypeScript
├── utils/
│   └── url.ts              # Utilitários para URLs
└── styles/
    └── auth.css            # Estilos das páginas
```

## Desenvolvimento

O projeto usa:
- React 19 com TypeScript
- React Router para navegação
- Axios para requisições HTTP
- CSS puro para estilização
- Vite como bundler

## Exemplo de Integração

Para integrar o SSO em uma aplicação existente:

```typescript
// Em sua aplicação cliente
import TokenValidator from './components/TokenValidator';

function App() {
  const handleValidToken = (user) => {
    // Usuário autenticado via SSO
    setCurrentUser(user);
  };

  const handleInvalidToken = () => {
    // Token inválido, redirecionar para SSO
    window.location.href = 'https://sso.example.com/login?callback=' + 
      encodeURIComponent(window.location.origin + '/dashboard');
  };

  return (
    <TokenValidator 
      onValidToken={handleValidToken}
      onInvalidToken={handleInvalidToken}
    >
      <YourApp />
    </TokenValidator>
  );
}
```

## Configuração do Backend

Certifique-se de que seu backend SSO suporte:
- CORS configurado corretamente
- Endpoints `/auth/login`, `/auth/register`, `/auth/validate`
- Tokens JWT com expiração adequada
- Validação de dados de entrada

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
