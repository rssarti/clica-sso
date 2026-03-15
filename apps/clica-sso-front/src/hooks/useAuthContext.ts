import { useContext } from 'react';
import { AuthContext } from '../contexts/auth-context';

/**
 * Hook para usar o contexto de autenticação
 */
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuthContext deve ser usado dentro de um AuthProvider');
  }
  
  return context;
};
