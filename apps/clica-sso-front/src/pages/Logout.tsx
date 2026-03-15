import { useEffect, useState } from 'react';
import { authCookies } from '../utils/cookies';

const Logout = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(true);

  useEffect(() => {
    const performLogout = async () => {
      try {
        authCookies.clearAuthData();
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setIsLoggingOut(false);
        
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        
      } catch (error) {
        console.error('Erro durante o logout:', error);
        setIsLoggingOut(false);
        
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    };

    performLogout();
  }, []);

  return (
    <div className="min-h-screen bg-google-gray-50 flex items-center justify-center">
      <div className="bg-white border border-google-gray-300 rounded-lg p-12 text-center max-w-md w-full shadow-sm">
        <div className="mb-6">
          {isLoggingOut ? (
            // Ícone de loading
            <svg className="animate-spin h-12 w-12 mx-auto text-google-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            // Ícone de sucesso
            <svg className="h-12 w-12 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          )}
        </div>
        
        <h2 className="text-2xl font-normal text-google-gray-900 mb-4">
          {isLoggingOut ? 'Fazendo logout...' : 'Logout realizado com sucesso!'}
        </h2>
        
        <p className="text-sm text-google-gray-600 mb-6 leading-relaxed">
          {isLoggingOut 
            ? 'Estamos limpando seus dados de autenticação...' 
            : 'Você será redirecionado para a página de login em instantes.'
          }
        </p>

        {/* Informações de debug (apenas em desenvolvimento) */}
        {import.meta.env.DEV && (
          <div className="bg-google-gray-100 rounded p-3 mb-4 text-left">
            <h3 className="text-xs font-medium text-google-gray-700 mb-2">Debug Info (DEV):</h3>
            <div className="space-y-1 text-xs text-google-gray-600">
              <div>• Cookies limpos: {!authCookies.isAuthenticated() ? '✅' : '❌'}</div>
              <div>• Token removido: {!authCookies.getAuthToken() ? '✅' : '❌'}</div>
              <div>• Dados do usuário removidos: {!authCookies.getUserData() ? '✅' : '❌'}</div>
            </div>
          </div>
        )}

        {!isLoggingOut && (
          <div className="space-y-3">
            <button 
              onClick={() => window.location.href = '/login'}
              className="w-full bg-google-blue text-white rounded px-4 py-2.5 text-sm font-medium hover:bg-google-blue-hover transition-colors"
            >
              Ir para Login
            </button>
            
            {/* Botão adicional para forçar reload completo (útil em desenvolvimento) */}
            {import.meta.env.DEV && (
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-google-gray-200 text-google-gray-700 rounded px-4 py-2.5 text-sm font-medium hover:bg-google-gray-300 transition-colors"
              >
                Recarregar Página (DEV)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Logout;
