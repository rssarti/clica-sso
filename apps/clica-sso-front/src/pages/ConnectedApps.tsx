import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { connectedAppsService } from '../services/connectedAppsService';
import type { ConnectedApp, Product } from '../services/connectedAppsService';
import { authCookies } from '../utils/cookies';
import AuthenticatedLayout from '../components/AuthenticatedLayout';
import Icon from '../components/Icon';

const ConnectedApps = () => {
  const navigate = useNavigate();
  const [connectedApps, setConnectedApps] = useState<ConnectedApp[]>([]);
  const [marketplaceProducts, setMarketplaceProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'connected' | 'marketplace'>('connected');
  
  // Estados para o filtro
  const [statusFilters, setStatusFilters] = useState({
    active: true,
    pending: true,
    cancelled: true,
    suspended: true,
    expired: true
  });

  // Tradução de status
  const statusTranslations: Record<string, string> = {
    active: 'Ativo',
    pending: 'Pendente',
    cancelled: 'Cancelado',
    suspended: 'Suspenso',
    expired: 'Expirado'
  };

  // Aplicações filtradas
  const filteredConnectedApps = connectedApps.filter(app => 
    statusFilters[app.status as keyof typeof statusFilters]
  );

  const handleStatusFilterChange = (status: keyof typeof statusFilters) => {
    setStatusFilters(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [appsData, productsData] = await Promise.all([
        connectedAppsService.getConnectedApps(),
        connectedAppsService.getMarketplaceProducts(),
      ]);

      setConnectedApps(appsData);
      setMarketplaceProducts(productsData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar aplicações');
    } finally {
      setLoading(false);
    }
  };

  const handleAccessApp = (app: ConnectedApp) => {
    if (app.status !== 'active') {
      setError('Esta aplicação não está ativa');
      return;
    }

    // Simular redirecionamento para a aplicação externa
    const token = authCookies.getAuthToken();
    const appUrls: Record<string, string> = {
      'clicazap': `https://clicazap.com/auth?token=${token}`,
      'clicarango': `https://clicarango.com/auth?token=${token}`,
      'clica-analytics': `https://analytics.clica.com/auth?token=${token}`,
    };

    const url = appUrls[app.serviceType] || '#';
    if (url !== '#') {
      window.open(url, '_blank');
    } else {
      setError('URL da aplicação não configurada');
    }
  };

  // Funções para futuras implementações
  /*
  const handleUpgradeContract = async (contractId: number, planId: number) => {
    try {
      await connectedAppsService.upgradeContract(contractId, planId);
      setSuccessMessage('Contrato atualizado com sucesso!');
      loadConnectedApps();
    } catch (error) {
      console.error('Erro ao atualizar contrato:', error);
      setErrorMessage('Erro ao atualizar contrato');
    }
  };

  const handleCancelContract = async (contractId: number, reason: string) => {
    try {
      await connectedAppsService.cancelContract(contractId, reason);
      setSuccessMessage('Contrato cancelado com sucesso!');
      loadConnectedApps();
    } catch (error) {
      console.error('Erro ao cancelar contrato:', error);
      setErrorMessage('Erro ao cancelar contrato');
    }
  };
  */

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-google-blue"></div>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-normal text-google-gray-900 mb-2">Aplicações Conectadas</h1>
          <p className="text-google-gray-600">Gerencie suas aplicações e explore novos produtos</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-google-gray-200">
            {[
              { key: 'connected', label: 'Minhas Aplicações', icon: 'apps' as const },
              { key: 'marketplace', label: 'Marketplace', icon: 'business' as const },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-google-blue text-google-blue'
                    : 'border-transparent text-google-gray-500 hover:text-google-gray-700 hover:border-google-gray-300'
                }`}
              >
                <span className="mr-2">
                  <Icon name={tab.icon} className="text-base" />
                </span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white border border-google-gray-300 rounded-lg p-6">
          {activeTab === 'connected' && (
            <div>
              {/* Header com filtros */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-normal text-google-gray-900">Suas Aplicações</h2>
                
                {/* Filtros de Status */}
                <div className="flex items-center gap-4">
                  <span className="text-sm text-google-gray-600 font-medium">Filtrar por status:</span>
                  <div className="flex gap-3">
                    {Object.entries(statusFilters).map(([status, checked]) => (
                      <label key={status} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleStatusFilterChange(status as keyof typeof statusFilters)}
                          className="rounded border-google-gray-300 text-google-blue focus:ring-google-blue"
                        />
                        <span className="text-sm text-google-gray-700">
                          {statusTranslations[status]}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              {filteredConnectedApps.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">
                    <Icon name="apps" className="text-6xl text-google-gray-400" />
                  </div>
                  {connectedApps.length === 0 ? (
                    <>
                      <p className="text-google-gray-500 mb-4">Você ainda não possui aplicações conectadas</p>
                      <button
                        onClick={() => setActiveTab('marketplace')}
                        className="bg-google-blue text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Explorar Marketplace
                      </button>
                    </>
                  ) : (
                    <p className="text-google-gray-500 mb-4">Nenhuma aplicação encontrada com os filtros selecionados</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredConnectedApps.map((app) => (
                    <div key={app.id} className="border border-google-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-medium text-google-gray-900 mb-1">{app.name}</h3>
                          <p className="text-sm text-google-gray-600">{app.description}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${connectedAppsService.getStatusColor(app.status)}`}>
                          {connectedAppsService.getStatusText(app.status)}
                        </span>
                      </div>

                      {app.plan && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-md">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{app.plan.name}</span>
                            <span className="text-sm text-google-blue font-medium">
                              {connectedAppsService.formatCurrency(app.plan.price)}/{connectedAppsService.formatBillingCycle(app.plan.billingCycle)}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccessApp(app)}
                          disabled={app.status !== 'active'}
                          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            app.status === 'active'
                              ? 'bg-google-blue text-white hover:bg-blue-700'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <Icon name="dashboard" className="text-sm mr-1" />
                          Acessar
                        </button>
                        <button
                          onClick={() => {/* Implementar modal de gerenciamento */}}
                          className="px-4 py-2 border border-google-gray-300 rounded-md text-sm text-google-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Icon name="settings" className="text-sm mr-1" />
                          Gerenciar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'marketplace' && (
            <div>
              <h2 className="text-xl font-normal text-google-gray-900 mb-6">Marketplace de Aplicações</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {marketplaceProducts.map((product) => (
                  <div key={product.id} className="border border-google-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="mb-4">
                      {product.logoUrl && (
                        <img src={product.logoUrl} alt={product.name} className="w-12 h-12 mb-3" />
                      )}
                      <h3 className="font-medium text-google-gray-900 mb-2">{product.name}</h3>
                      <p className="text-sm text-google-gray-600 mb-3">{product.description}</p>
                      
                      {product.features && product.features.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-google-gray-700 mb-2">Principais recursos:</h4>
                          <ul className="text-sm text-google-gray-600 space-y-1">
                            {product.features.slice(0, 3).map((feature, index) => (
                              <li key={index} className="flex items-center">
                                <Icon name="success" className="text-green-600 text-xs mr-2" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="mt-auto">
                      <button
                        onClick={() => navigate(`/product/${product.slug}`)}
                        className="w-full px-4 py-2 border border-google-gray-300 rounded-md text-sm text-google-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Ver Detalhes
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default ConnectedApps;
