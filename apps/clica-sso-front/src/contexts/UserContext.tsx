import { createContext, useState, useEffect, type ReactNode } from 'react';
import { authCookies } from '../utils/cookies';
import { profileService } from '../services/profileService';

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export { UserContext };

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      setLoading(true);
      const token = authCookies.getAuthToken();
      
      if (!token) {
        setUser(null);
        return;
      }

      const profile = await profileService.getProfile();
      
      if (profile) {
        setUser({
          id: profile.id.toString(),
          name: profile.name,
          email: profile.email,
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};
