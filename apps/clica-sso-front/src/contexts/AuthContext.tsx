import React from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { AuthContext } from './auth-context';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provider de autenticação que gerencia o estado global da autenticação
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Componente HOC para proteger rotas que requerem autenticação
 */
interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback = <div>Carregando...</div>,
  redirectTo = '/logout'
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!isAuthenticated) {
    // Redireciona para a página de login
    window.location.href = redirectTo;
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
