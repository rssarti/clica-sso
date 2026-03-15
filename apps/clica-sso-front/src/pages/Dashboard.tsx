import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TokenValidator from '../components/TokenValidator';
import AuthenticatedLayout from '../components/AuthenticatedLayout';
import Icon from '../components/Icon';
import { authCookies } from '../utils/cookies';
import { connectedAppsService } from '../services/connectedAppsService';
import type { ValidationResponse } from '../types/auth';

const Dashboard = () => {
  const [user, setUser] = useState<ValidationResponse['user'] | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectedAppsCount, setConnectedAppsCount] = useState(0);

  const handleValidToken = (userData: ValidationResponse['user']) => {
    setUser(userData);
    setIsAuthenticated(true);
    setIsLoading(false);
  };

  const handleInvalidToken = () => {
    setIsAuthenticated(false);
    setIsLoading(false);
    window.location.href = '/logout';
  };

    useEffect(() => {
    if (!isAuthenticated && !window.location.search.includes('token')) {
      const savedUser = authCookies.getUserData();
      if (savedUser) {
        setUser(savedUser);
        setIsAuthenticated(true);
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    }
  }, []); 

  useEffect(() => {
    if (user && isAuthenticated) {
      authCookies.refreshCookies();
      
      fetchConnectedApps();
    }
  }, [user, isAuthenticated]);

  const fetchConnectedApps = async () => {
    try {
      const apps = await connectedAppsService.getConnectedApps();
      const activeApps = apps.filter((app: any) => app.status === 'ativo');
      
      setConnectedApps(activeApps);
    } catch (error) {
      console.error('Erro ao buscar aplicações conectadas:', error);
    }
  };

  const DashboardContent = () => (
    <AuthenticatedLayout>
      <div className="max-w-dashboard mx-auto px-6 py-8 pt-10">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6 mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white font-medium text-2xl border-4 border-white shadow-lg">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-3xl lg:text-4xl font-normal text-google-gray-900 mb-2">
                Bem-vindo, {user?.name || 'Usuário'}!
              </h2>
              <p className="text-google-gray-600 leading-relaxed">
                Gerencie suas informações, privacidade e segurança para que nossos serviços funcione melhor para você.
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-2xl">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-google-gray-600">
              <Icon name="search" size="small" />
            </div>
            <input 
              type="text" 
              placeholder="Pesquisar no painel"
              className="w-full pl-12 pr-4 py-3 border border-google-gray-300 rounded-full text-base bg-white focus:outline-none focus:border-google-blue focus:ring-2 focus:ring-google-blue/20 transition-all"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          {['Minha senha', 'Dispositivos', 'Gerenciador de senhas', 'Minha atividade', 'E-mail'].map((action) => (
            <button key={action} className="bg-white border border-google-gray-300 rounded-2xl px-4 py-2 text-sm text-google-gray-700 hover:bg-google-gray-100 transition-colors">
              {action}
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Account Card */}
          <div className="bg-white border border-google-gray-300 rounded-lg p-6 hover:shadow-lg hover:border-google-gray-400 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-google-blue flex items-center justify-center text-white">
                <Icon name="account" size="medium" />
              </div>
              <h3 className="text-lg font-normal text-google-gray-900">Informações da Conta</h3>
            </div>
            <div className="mb-5">
              <p className="text-sm text-google-gray-600 leading-relaxed mb-4">
                Como membro, você tem acesso completo às funcionalidades.
              </p>
              <div className="bg-google-gray-100 rounded p-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-google-gray-600 font-medium">ID do usuário:</span>
                  <span className="text-google-gray-900">{user?.id}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-google-gray-600 font-medium">Email:</span>
                  <span className="text-google-gray-900">{user?.email}</span>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-google-gray-200">
              <Link 
                to="/account" 
                className="flex items-center gap-2 text-google-blue text-sm hover:text-google-blue-hover transition-colors"
              >
                Gerenciar conta
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M7 17L17 7"/>
                  <path d="M7 7h10v10"/>
                </svg>
              </Link>
            </div>
          </div>

          {/* Privacy Card */}
          <div className="bg-white border border-google-gray-300 rounded-lg p-6 hover:shadow-lg hover:border-google-gray-400 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center text-white">
                <Icon name="privacy" size="medium" />
              </div>
              <h3 className="text-lg font-normal text-google-gray-900">Privacidade e personalização</h3>
            </div>
            <div className="mb-5">
              <p className="text-sm text-google-gray-600 leading-relaxed">
                Veja os dados na sua Conta do Sistema e escolha qual atividade será salva para personalizar sua experiência.
              </p>
            </div>
            <div className="pt-4 border-t border-google-gray-200">
              <Link 
                to="/privacy" 
                className="flex items-center gap-2 text-google-blue text-sm hover:text-google-blue-hover transition-colors"
              >
                Gerenciar seus dados e sua privacidade
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M7 17L17 7"/>
                  <path d="M7 7h10v10"/>
                </svg>
              </Link>
            </div>
          </div>

          {/* Security Card */}
          <div className="bg-white border border-google-gray-300 rounded-lg p-6 hover:shadow-lg hover:border-google-gray-400 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-white">
                <Icon name="security" size="medium" />
              </div>
              <h3 className="text-lg font-normal text-google-gray-900">Segurança</h3>
            </div>
            <div className="mb-5">
              <p className="text-sm text-google-gray-600 leading-relaxed mb-3">
                Configurações e recomendações para ajudar a manter sua conta segura.
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs text-green-700 font-medium">Conta protegida</span>
              </div>
            </div>
            <div className="pt-4 border-t border-google-gray-200">
              <button className="flex items-center gap-2 text-google-blue text-sm hover:text-google-blue-hover transition-colors">
                Revisar configurações de segurança
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M7 17L17 7"/>
                  <path d="M7 7h10v10"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Apps Card */}
          <div className="bg-white border border-google-gray-300 rounded-lg p-6 hover:shadow-lg hover:border-google-gray-400 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white">
                <Icon name="apps" size="medium" />
              </div>
              <h3 className="text-lg font-normal text-google-gray-900">Aplicações conectadas</h3>
            </div>
            <div className="mb-5">
              <p className="text-sm text-google-gray-600 leading-relaxed mb-3">
                Gerencie as aplicações que têm acesso à sua conta.
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-normal text-google-gray-900">{connectedAppsCount}</span>
                <span className="text-xs text-google-gray-600">aplicações conectadas</span>
              </div>
            </div>
            <div className="pt-4 border-t border-google-gray-200">
              <Link 
                to="/connected-apps" 
                className="flex items-center gap-2 text-google-blue text-sm hover:text-google-blue-hover transition-colors"
              >
                Gerenciar aplicações
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M7 17L17 7"/>
                  <path d="M7 7h10v10"/>
                </svg>
              </Link>
            </div>
          </div>

          {/* Payments Card */}
          <div className="bg-white border border-google-gray-300 rounded-lg p-6 hover:shadow-lg hover:border-google-gray-400 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white">
                <Icon name="creditCard" size="medium" />
              </div>
              <h3 className="text-lg font-normal text-google-gray-900">Pagamentos e Assinaturas</h3>
            </div>
            <div className="mb-5">
              <p className="text-sm text-google-gray-600 leading-relaxed mb-3">
                Gerencie seus métodos de pagamento, assinaturas ativas, histórico de transações e notas fiscais.
              </p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-google-gray-600">Métodos salvos:</span>
                  <span className="text-google-gray-900 font-medium">2 cartões</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-google-gray-600">Assinaturas ativas:</span>
                  <span className="text-google-gray-900 font-medium">1 plano</span>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-google-gray-200">
              <Link 
                to="/billing" 
                className="flex items-center gap-2 text-google-blue text-sm hover:text-google-blue-hover transition-colors"
              >
                Gerenciar pagamentos
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M7 17L17 7"/>
                  <path d="M7 7h10v10"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );

  // Se não há token na URL e não está autenticado, redireciona para login
  if (!window.location.search.includes('token') && !isAuthenticated && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-google-gray-50">
        <div className="bg-white border border-google-gray-300 rounded-lg p-12 text-center max-w-md">
          <div className="mb-6 text-google-gray-600">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mx-auto">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <circle cx="12" cy="16" r="1"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h2 className="text-2xl font-normal text-google-gray-900 mb-4">Autenticação Necessária</h2>
          <p className="text-sm text-google-gray-600 mb-6 leading-relaxed">
            Você precisa estar logado para acessar esta página.
          </p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="bg-google-blue text-white rounded px-6 py-2.5 text-sm font-medium hover:bg-google-blue-hover transition-colors"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-google-gray-50">
        <div className="bg-white border border-google-gray-300 rounded-lg p-12 text-center max-w-md">
          <div className="mb-6 text-google-gray-600">
            <svg className="animate-spin h-12 w-12 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-normal text-google-gray-900 mb-2">Verificando autenticação...</h2>
          <p className="text-sm text-google-gray-600">Aguarde um momento.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Se há token na URL, usa o TokenValidator */}
      {window.location.search.includes('token') ? (
        <TokenValidator 
          onValidToken={handleValidToken}
          onInvalidToken={handleInvalidToken}
        >
          <DashboardContent />
        </TokenValidator>
      ) : (
        /* Se não há token na URL e está autenticado, renderiza direto */
        isAuthenticated ? <DashboardContent /> : null
      )}
    </>
  );
};

export default Dashboard;
