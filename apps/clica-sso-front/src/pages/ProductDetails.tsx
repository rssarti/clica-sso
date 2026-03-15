import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { connectedAppsService } from '../services/connectedAppsService';
import type { Product, Plan } from '../services/connectedAppsService';
import AuthenticatedLayout from '../components/AuthenticatedLayout';
import Icon from '../components/Icon';

const ProductDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const productData = await connectedAppsService.getProductBySlug(slug!);
        setProduct(productData);
        
        // Selecionar o primeiro plano como padrão
        if (productData.plans && productData.plans.length > 0) {
          setSelectedPlan(productData.plans[0]);
        }
      } catch (err) {
        console.error('Erro ao carregar produto:', err);
        setError('Produto não encontrado');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadProduct();
    }
  }, [slug]);

  const handleContractPlan = async (planId: number) => {
    if (!planId) {
      setError('Selecione um plano para contratar');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const contractResponse = await connectedAppsService.createContractFromPlan(planId);
      
      // Redirecionar para página de confirmação de pagamento
      navigate(`/payment-confirmation/${contractResponse.id}`, {
        state: {
          plan: selectedPlan,
          product: product,
        }
      });
    } catch (err) {
      console.error('Erro ao contratar plano:', err);
      setError('Erro ao contratar plano. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-google-blue"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error || !product) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <Icon name="error" className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800">{error || 'Produto não encontrado'}</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/connected-apps')}
            className="px-4 py-2 bg-google-blue text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Voltar para Aplicações
          </button>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/connected-apps')}
            className="flex items-center text-google-gray-600 hover:text-google-gray-800 mb-4"
          >
            <Icon name="arrowBack" className="w-4 h-4 mr-1" />
            Voltar para Aplicações
          </button>
          
          <div className="flex items-start gap-4">
            {product.logoUrl && (
              <img
                src={product.logoUrl}
                alt={product.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-google-gray-900 mb-2">
                {product.name}
              </h1>
              <p className="text-google-gray-600 mb-2">{product.description}</p>
              <div className="flex items-center gap-4 text-sm text-google-gray-500">
                <span className="capitalize">{product.category}</span>
                <span className="capitalize">{product.status}</span>
                {product.websiteUrl && (
                  <a
                    href={product.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-google-blue hover:underline"
                  >
                    Site oficial
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <Icon name="error" className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações do Produto */}
          <div className="lg:col-span-2">
            {product.longDescription && (
              <div className="bg-white rounded-lg border border-google-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Sobre o {product.name}</h2>
                <p className="text-google-gray-700 whitespace-pre-line">
                  {product.longDescription}
                </p>
              </div>
            )}

            {product.features && product.features.length > 0 && (
              <div className="bg-white rounded-lg border border-google-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4">Funcionalidades</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {product.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <Icon name="success" className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                      <span className="text-sm text-google-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Planos */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-google-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Planos Disponíveis</h2>
              
              {!product.plans || product.plans.length === 0 ? (
                <p className="text-google-gray-500 text-sm">Nenhum plano disponível no momento.</p>
              ) : (
                <div className="space-y-4">
                  {product.plans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedPlan?.id === plan.id
                          ? 'border-google-blue bg-blue-50'
                          : 'border-google-gray-200 hover:border-google-gray-300'
                      }`}
                      onClick={() => setSelectedPlan(plan)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-google-gray-900">{plan.name}</h3>
                          {plan.description && (
                            <p className="text-sm text-google-gray-600 mt-1">{plan.description}</p>
                          )}
                        </div>
                        {plan.isPopular && (
                          <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">
                            Popular
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-3">
                        <div className="flex items-baseline">
                          <span className="text-2xl font-bold text-google-gray-900">
                            {connectedAppsService.formatCurrency(plan.price)}
                          </span>
                          <span className="text-sm text-google-gray-500 ml-1">
                            /{connectedAppsService.formatBillingCycle(plan.billingCycle)}
                          </span>
                        </div>
                        {plan.originalPrice && plan.originalPrice > plan.price && (
                          <span className="text-sm text-google-gray-500 line-through">
                            {connectedAppsService.formatCurrency(plan.originalPrice)}
                          </span>
                        )}
                      </div>

                      {plan.features && plan.features.length > 0 && (
                        <div className="mt-3">
                          <ul className="text-sm text-google-gray-600 space-y-1">
                            {plan.features.slice(0, 3).map((feature, index) => (
                              <li key={index} className="flex items-center">
                                <Icon name="success" className="w-3 h-3 text-green-600 mr-1" />
                                {feature}
                              </li>
                            ))}
                            {plan.features.length > 3 && (
                              <li className="text-google-gray-500">
                                +{plan.features.length - 3} outras funcionalidades
                              </li>
                            )}
                          </ul>
                        </div>
                      )}

                      {plan.trialDays > 0 && (
                        <div className="mt-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            {plan.trialDays} dias grátis
                          </span>
                        </div>
                      )}
                    </div>
                  ))}

                  {selectedPlan && (
                    <button
                      onClick={() => handleContractPlan(selectedPlan.id)}
                      disabled={loading}
                      className="w-full px-4 py-3 bg-google-blue text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Contratando...' : `Contratar ${selectedPlan.name}`}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default ProductDetails;
