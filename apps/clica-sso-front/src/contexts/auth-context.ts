import { createContext } from 'react';
import type { AuthResponse } from '../types/auth';

export interface AuthContextType {
  user: AuthResponse['user'] | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (authData: AuthResponse) => void;
  logout: () => void;
  refreshAuth: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);
