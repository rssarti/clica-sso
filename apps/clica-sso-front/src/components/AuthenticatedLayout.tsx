import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import UserAvatar from './UserAvatar';

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

const AuthenticatedLayout = ({ children }: AuthenticatedLayoutProps) => {
  const location = useLocation();

  const isActivePage = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-google-gray-50 font-inter flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-google-gray-300 sticky top-0 z-50">
        <div className="max-w-dashboard mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center">
              <img src={'/images/logo.svg'} alt="Clica Logo" className="h-8" />
            </Link>
            
            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center gap-6">
              <Link 
                to="/dashboard" 
                className={`text-sm transition-colors ${
                  isActivePage('/dashboard') 
                    ? 'text-google-blue font-medium' 
                    : 'text-google-gray-700 hover:text-google-blue'
                }`}
              >
                Painel
              </Link>
              <Link 
                to="/account" 
                className={`text-sm transition-colors ${
                  isActivePage('/account') 
                    ? 'text-google-blue font-medium' 
                    : 'text-google-gray-700 hover:text-google-blue'
                }`}
              >
                Minha Conta
              </Link>
              <Link 
                to="/privacy" 
                className={`text-sm transition-colors ${
                  isActivePage('/privacy') 
                    ? 'text-google-blue font-medium' 
                    : 'text-google-gray-700 hover:text-google-blue'
                }`}
              >
                Privacidade
              </Link>
              <Link 
                to="/billing" 
                className={`text-sm transition-colors ${
                  isActivePage('/billing') 
                    ? 'text-google-blue font-medium' 
                    : 'text-google-gray-700 hover:text-google-blue'
                }`}
              >
                Cobrança
              </Link>
              <Link 
                to="/connected-apps" 
                className={`text-sm transition-colors ${
                  isActivePage('/connected-apps') 
                    ? 'text-google-blue font-medium' 
                    : 'text-google-gray-700 hover:text-google-blue'
                }`}
              >
                Apps Conectados
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Mobile Menu */}
            <div className="md:hidden">
              <select 
                value={location.pathname} 
                onChange={(e) => window.location.href = e.target.value}
                className="text-sm border border-google-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-google-blue"
              >
                <option value="/dashboard">Painel</option>
                <option value="/account">Minha Conta</option>
                <option value="/privacy">Privacidade</option>
                <option value="/billing">Cobrança</option>
                <option value="/connected-apps">Apps Conectados</option>
              </select>
            </div>
            
            {/* User Avatar with Dropdown */}
            <UserAvatar />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-google-gray-300 mt-auto">
        <div className="max-w-dashboard mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-6">
              <img src={'/images/logo.svg'} alt="Clica Logo" className="h-6" />
              <p className="text-sm text-google-gray-600">
                © 2025 Clica. Todos os direitos reservados.
              </p>
            </div>
            
            <div className="flex items-center gap-6">
              <Link 
                to="/privacy" 
                className="text-sm text-google-gray-600 hover:text-google-blue transition-colors"
              >
                Privacidade
              </Link>
              <Link 
                to="/terms" 
                className="text-sm text-google-gray-600 hover:text-google-blue transition-colors"
              >
                Termos
              </Link>
              <Link 
                to="/help" 
                className="text-sm text-google-gray-600 hover:text-google-blue transition-colors"
              >
                Ajuda
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AuthenticatedLayout;
