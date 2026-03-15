import { useState, useEffect } from 'react';
import { authCookies } from '../utils/cookies';
import type { AuthResponse } from '../types/auth';

interface UseAuthReturn {
  user: AuthResponse['user'] | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (authData: AuthResponse) => void;
  logout: () => void;
  refreshAuth: () => void;
}

/**
 * Hook customizado para gerenciar autenticação com cookies
 */
export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carrega dados de autenticação dos cookies na inicialização
  useEffect(() => {
    const loadAuthData = () => {
      try {
        const authData = authCookies.getAuthData();
        if (authData) {
          setUser(authData.user);
          setToken(authData.access_token);
        }
      } catch (error) {
        console.error('Erro ao carregar dados de autenticação:', error);
        // Limpa cookies corrompidos
        authCookies.clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthData();
  }, []);

  /**
   * Faz login salvando dados nos cookies
   */
  const login = (authData: AuthResponse) => {
    try {
      authCookies.setAuthData(authData);
      setUser(authData.user);
      setToken(authData.access_token);
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  };

  /**
   * Faz logout limpando todos os dados
   */
  const logout = () => {
    try {
      authCookies.clearAuthData();
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  /**
   * Atualiza/renova os dados de autenticação
   */
  const refreshAuth = () => {
    try {
      const authData = authCookies.getAuthData();
      if (authData) {
        setUser(authData.user);
        setToken(authData.access_token);
        // Renova os cookies
        authCookies.refreshCookies();
      } else {
        // Se não há dados, faz logout
        logout();
      }
    } catch (error) {
      console.error('Erro ao atualizar autenticação:', error);
      logout();
    }
  };

  const isAuthenticated = !!(user && token);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshAuth,
  };
};
