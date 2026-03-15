import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import { authCookies } from '../utils/cookies';
import { useUser } from '../hooks/useUser';

const UserAvatar = () => {
  const { user } = useUser();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    // Em desenvolvimento, usa a página de logout com debug
    if (import.meta.env.DEV) {
      window.location.href = '/logout';
    } else {
      // Em produção, faz logout direto
      authCookies.clearAuthData();
      window.location.href = '/login';
    }
  };

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={toggleDropdown}
        className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white font-medium text-sm hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {user?.name?.charAt(0).toUpperCase() || 'U'}
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white font-medium">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name || 'Usuário'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || 'email@exemplo.com'}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <Link
              to="/account"
              onClick={() => setIsDropdownOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Icon name="account" size="small" />
              <span>Meu Perfil</span>
            </Link>
            
            <Link
              to="/billing"
              onClick={() => setIsDropdownOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Icon name="receipt" size="small" />
              <span>Cobrança</span>
            </Link>
            
            <Link
              to="/privacy"
              onClick={() => setIsDropdownOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Icon name="security" size="small" />
              <span>Privacidade</span>
            </Link>
            
            <div className="border-t border-gray-100 mt-1 pt-1">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
              >
                <Icon name="logout" size="small" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
