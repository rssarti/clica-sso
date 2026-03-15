import { useEffect, useState } from 'react';
import { authService } from '../services/auth';
import { getTokenFromUrl, cleanUrlFromToken } from '../utils/url';
import type { ValidationResponse } from '../types/auth';

interface TokenValidatorProps {
  onValidToken: (user: ValidationResponse['user']) => void;
  onInvalidToken: () => void;
  children: React.ReactNode;
}

const TokenValidator = ({ onValidToken, onInvalidToken, children }: TokenValidatorProps) => {
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateToken = async () => {
      const token = getTokenFromUrl();
      
      if (!token) {
        setIsValidating(false);
        return;
      }

      try {
        const response = await authService.validateToken({ token });
        
        if (response.valid && response.user) {
          // Remove o token da URL
          cleanUrlFromToken();
          
          // Chama o callback com os dados do usuário
          onValidToken(response.user);
        } else {
          onInvalidToken();
        }
      } catch {
        setError('Erro ao validar token de autenticação.');
        onInvalidToken();
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [onValidToken, onInvalidToken]);

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-google-gray-600">Validando autenticação...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-red-300 rounded-lg shadow-sm p-8 text-center max-w-md w-full">
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-google-blue text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-google-blue focus:ring-offset-2 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default TokenValidator;
