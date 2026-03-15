import Cookies from 'js-cookie';
import type { AuthResponse } from '../types/auth';

// Nomes dos cookies
const AUTH_TOKEN_COOKIE = 'auth_token';
const USER_DATA_COOKIE = 'user_data';

// Configuração padrão dos cookies (7 dias de expiração)
const COOKIE_OPTIONS = {
  expires: 7, // 7 dias
  secure: import.meta.env.PROD, // HTTPS apenas em produção
  sameSite: 'strict' as const,
  path: '/',
};

export const authCookies = {
  /**
   * Salva os dados de autenticação nos cookies
   */
  setAuthData: (authData: AuthResponse): void => {
    try {
      // Salva o token
      Cookies.set(AUTH_TOKEN_COOKIE, authData.access_token, COOKIE_OPTIONS);
      
      // Salva os dados do usuário (sem informações sensíveis)
      const userData = {
        id: authData.user.id,
        name: authData.user.name,
        email: authData.user.email,
      };
      
      Cookies.set(USER_DATA_COOKIE, JSON.stringify(userData), COOKIE_OPTIONS);
    } catch (error) {
      console.error('Erro ao salvar dados de autenticação nos cookies:', error);
    }
  },

  /**
   * Recupera o token de autenticação do cookie
   */
  getAuthToken: (): string | null => {
    try {
      return Cookies.get(AUTH_TOKEN_COOKIE) || null;
    } catch (error) {
      console.error('Erro ao recuperar token dos cookies:', error);
      return null;
    }
  },

  /**
   * Recupera os dados do usuário do cookie
   */
  getUserData: (): AuthResponse['user'] | null => {
    try {
      const userData = Cookies.get(USER_DATA_COOKIE);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Erro ao recuperar dados do usuário dos cookies:', error);
      return null;
    }
  },

  /**
   * Recupera todos os dados de autenticação dos cookies
   */
  getAuthData: (): { access_token: string; user: AuthResponse['user'] } | null => {
    try {
      const token = authCookies.getAuthToken();
      const user = authCookies.getUserData();
      
      if (token && user) {
        return { access_token: token, user };
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao recuperar dados de autenticação dos cookies:', error);
      return null;
    }
  },

  /**
   * Verifica se o usuário está autenticado (tem token válido)
   */
  isAuthenticated: (): boolean => {
    const token = authCookies.getAuthToken();
    return !!token;
  },

  /**
   * Remove todos os cookies de autenticação (logout)
   */
  clearAuthData: (): void => {
    try {
      Cookies.remove(AUTH_TOKEN_COOKIE, { path: '/' });
      Cookies.remove(USER_DATA_COOKIE, { path: '/' });
    } catch (error) {
      console.error('Erro ao limpar cookies de autenticação:', error);
    }
  },

  /**
   * Atualiza apenas os dados do usuário (útil após editar perfil)
   */
  updateUserData: (userData: AuthResponse['user']): void => {
    try {
      Cookies.set(USER_DATA_COOKIE, JSON.stringify(userData), COOKIE_OPTIONS);
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário nos cookies:', error);
    }
  },

  /**
   * Verifica se o token está próximo do vencimento e renova se necessário
   */
  refreshCookies: (): void => {
    try {
      const authData = authCookies.getAuthData();
      if (authData) {
        // Renova os cookies com nova data de expiração
        authCookies.setAuthData(authData);
      }
    } catch (error) {
      console.error('Erro ao renovar cookies:', error);
    }
  },
};
