/**
 * Mock da API para testes durante o desenvolvimento
 * Substitua por sua implementação real de backend
 */

// Simula uma base de usuários em memória
const users: Array<{
  id: string;
  name: string;
  email: string;
  password: string;
}> = [
  {
    id: '1',
    name: 'Usuário Teste',
    email: 'teste@exemplo.com',
    password: '123456'
  }
];

// Simula geração de JWT (em produção, use uma biblioteca adequada)
const generateToken = (userId: string) => {
  const payload = {
    userId,
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
  };
  return btoa(JSON.stringify(payload));
};

// Simula validação de JWT
const validateToken = (token: string) => {
  try {
    const payload = JSON.parse(atob(token));
    if (payload.exp < Date.now()) {
      return null; // Token expirado
    }
    return payload.userId;
  } catch {
    return null; // Token inválido
  }
};

// Mock das funções da API
export const mockAPI = {
  async login(email: string, password: string) {
    // Simula delay da rede
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      throw new Error('Credenciais inválidas');
    }
    
    const token = generateToken(user.id);
    
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    };
  },

  async register(name: string, email: string, password: string) {
    // Simula delay da rede
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verifica se o email já existe
    if (users.find(u => u.email === email)) {
      throw new Error('Email já está em uso');
    }
    
    // Cria novo usuário
    const newUser = {
      id: String(users.length + 1),
      name,
      email,
      password
    };
    
    users.push(newUser);
    
    const token = generateToken(newUser.id);
    
    return {
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      }
    };
  },

  async validateToken(token: string) {
    // Simula delay da rede
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const userId = validateToken(token);
    
    if (!userId) {
      return { valid: false };
    }
    
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return { valid: false };
    }
    
    return {
      valid: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    };
  }
};

// Interceptador para substituir as chamadas reais da API
export const setupMockAPI = () => {
  // Aqui você pode usar uma biblioteca como MSW (Mock Service Worker)
  // ou simplesmente substituir as funções do authService
  console.log('🔧 Mock API ativado para desenvolvimento');
  console.log('👤 Usuário de teste: teste@exemplo.com / 123456');
};
