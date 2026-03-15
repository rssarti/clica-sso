/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthenticatedLayout from '../components/AuthenticatedLayout';
import Icon from '../components/Icon';
import * as QRCode from 'qrcode';
import BoletoBarcode from '../components/BoletoBarcode';
import { billingService } from '../services/realBillingService';
import { connectedAppsService } from '../services/connectedAppsService';
import type { 
  BillingPayment, 
  BillingContract, 
  BillingInvoice, 
  BillingStats 
} from '../services/realBillingService';

// Componente para QR Code
const QRCodeComponent: React.FC<{ value: string; size: number }> = ({ value, size }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  useEffect(() => {
    const generateQRCode = async () => {
      try {
        setError('');
        
        // Garantir que o valor é uma string válida
        if (!value || value.length < 10) {
          throw new Error('Valor inválido para QR Code');
        }
        
        const url = await QRCode.toDataURL(value, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
        });
        
        setQrCodeUrl(url);
      } catch (error) {
        console.error('Erro ao gerar QR Code:', error);
        setError('Erro na geração');
      }
    };
    
    if (value) {
      generateQRCode();
    }
  }, [value, size]);
  
  if (error) {
    return (
      <div className="w-24 h-24 bg-red-50 border border-red-300 rounded flex items-center justify-center">
        <div className="text-center">
          <Icon name="cancel" className="h-6 w-6 text-red-500 mx-auto mb-1" />
          <p className="text-xs text-red-500">Erro</p>
        </div>
      </div>
    );
  }
  
  if (!qrCodeUrl) {
    return (
      <div className="w-24 h-24 bg-gray-100 border border-gray-300 rounded flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-xs text-gray-500 mt-1">Gerando...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-24 h-24 bg-white border border-gray-300 rounded overflow-hidden">
      <img 
        src={qrCodeUrl} 
        alt="QR Code" 
        className="w-full h-full object-contain p-1"
        onError={(e) => {
          console.error('Erro ao carregar imagem do QR Code:', e);
          setError('Erro no carregamento');
        }}
      />
    </div>
  );
};

const formatAmount = (amount: string | number): string => {
  const numValue = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
};

const getPaymentMethodIcon = (method: string) => {
  const getIconProps = () => {
    switch (method) {
      case 'pix':
        return { name: 'pix' as const, className: 'h-6 w-6 text-indigo-600', label: 'PIX' };
      case 'boleto':
        return { name: 'boleto' as const, className: 'h-6 w-6 text-gray-600', label: 'Boleto' };
      case 'credit_card':
        return { name: 'creditCard' as const, className: 'h-6 w-6 text-blue-600', label: 'Cartão de Crédito' };
      case 'debit_card':
        return { name: 'creditCard' as const, className: 'h-6 w-6 text-green-600', label: 'Cartão de Débito' };
      case 'bank_transfer':
        return { name: 'bankTransfer' as const, className: 'h-6 w-6 text-purple-600', label: 'Transferência' };
      default:
        return { name: 'payment' as const, className: 'h-6 w-6 text-gray-400', label: getPaymentMethodLabel(method) };
    }
  };

  const { name, className, label } = getIconProps();

  return (
    <div className="group relative">
      <Icon name={name} className={className} />
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
        {label}
      </div>
    </div>
  );
};

const getPaymentMethodLabel = (method: string): string => {
  const labels = {
    boleto: 'Boleto',
    pix: 'PIX',
    credit_card: 'Cartão de Crédito',
    debit_card: 'Cartão de Débito',
    bank_transfer: 'Transferência',
  };
  return labels[method as keyof typeof labels] || method;
};

const getStatusLabel = (status: string, type: 'payment' | 'subscription' | 'invoice'): string => {
  if (type === 'payment') {
    const labels = {
      completed: 'Concluído',
      pending: 'Pendente',
      failed: 'Falhou',
      processing: 'Processando',
      cancelled: 'Cancelado'
    };
    return labels[status as keyof typeof labels] || status;
  } else if (type === 'subscription') {
    const labels = {
      active: 'Ativo',
      cancelled: 'Cancelado',
      suspended: 'Suspenso',
      expired: 'Expirado',
      pending: 'Pendente'
    };
    return labels[status as keyof typeof labels] || status;
  } else { 
    const labels = {
      paid: 'Pago',
      issued: 'Emitido',
      overdue: 'Vencido',
      cancelled: 'Cancelado',
      pending: 'Pendente'
    };
    return labels[status as keyof typeof labels] || status;
  }
};

const Billing = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'subscriptions' | 'invoices'>('overview');
  const [payments, setPayments] = useState<BillingPayment[]>([]);
  const [subscriptions, setSubscriptions] = useState<BillingContract[]>([]);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<BillingInvoice | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<BillingPayment | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const getStatusColor = (status: string, type: 'payment' | 'subscription' | 'invoice') => {
    if (type === 'payment') {
      switch (status) {
        case 'completed': return 'bg-green-100 text-green-800';
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'failed': return 'bg-red-100 text-red-800';
        case 'processing': return 'bg-blue-100 text-blue-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    } else if (type === 'subscription') {
      switch (status) {
        case 'active': return 'bg-green-100 text-green-800';
        case 'cancelled': return 'bg-red-100 text-red-800';
        case 'suspended': return 'bg-yellow-100 text-yellow-800';
        case 'expired': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    } else { // invoice
      switch (status) {
        case 'paid': return 'bg-green-100 text-green-800';
        case 'issued': return 'bg-yellow-100 text-yellow-800';
        case 'overdue': return 'bg-red-100 text-red-800';
        case 'cancelled': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    }
  };

  const generateQRCodeImage = useCallback(async (qrCodeText: string) => {
    try {
      const dataUrl = await QRCode.toDataURL(qrCodeText, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataUrl(dataUrl);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
    }
  }, []);

  // Função para copiar código de barras
  const handleCopyBoletoCode = useCallback((payment: BillingPayment) => {
    let codeToCopy = '';
    
    // Priorizar linha digitável se disponível
    if (payment.metadata?.banco_inter?.boletoDetails?.boleto?.linhaDigitavel) {
      codeToCopy = payment.metadata.banco_inter.boletoDetails.boleto.linhaDigitavel;
    } else if (payment.boletoCode) {
      codeToCopy = payment.boletoCode;
    } else if (payment.metadata?.banco_inter?.boletoDetails?.boleto?.codigoBarras) {
      codeToCopy = payment.metadata.banco_inter.boletoDetails.boleto.codigoBarras;
    }
    
    if (codeToCopy) {
      navigator.clipboard.writeText(codeToCopy);
      alert('Código copiado para a área de transferência!');
    } else {
      alert('Código não disponível para cópia');
    }
  }, []);

  // Função para baixar PDF do boleto
  const handleDownloadBoletoPDF = useCallback(async (payment: BillingPayment) => {
    try {
      // Verificar se temos dados do banco_inter com codigoSolicitacao
      if (payment.metadata?.banco_inter?.codigoSolicitacao) {
        await connectedAppsService.downloadBoletoPdf(
          payment.contractId,
          payment.metadata.banco_inter.codigoSolicitacao
        );
        return;
      }

      // Fallback: se tem URL do boleto diretamente
      if (payment.metadata?.banco_inter?.boletoDetails?.boletoUrl) {
        window.open(payment.metadata.banco_inter.boletoDetails.boletoUrl, '_blank');
        return;
      }

      // Último fallback: endpoint genérico
      console.warn('Usando fallback genérico para download do PDF');
      alert('Informações do boleto não disponíveis para download');
    } catch (error) {
      console.error('Erro ao baixar PDF do boleto:', error);
      alert('Erro ao baixar o PDF do boleto. Tente novamente.');
    }
  }, []);

  const handleCreateNewPayment = useCallback((contractId: number) => {
    console.log('📋 Navegando para nova cobrança do contrato:', contractId);
    // Navegar para PaymentConfirmation apenas com o contractId
    // A página PaymentConfirmation irá buscar automaticamente pagamentos pendentes
    navigate(`/payment-confirmation/${contractId}`);
  }, [navigate]);

  const handleViewPayment = useCallback((payment: BillingPayment) => {
    console.log('👁️ Visualizando pagamento:', {
      id: payment.id,
      contractId: payment.contractId,
      status: payment.status,
      method: payment.method
    });
    setSelectedPayment(payment);
    // Gerar QR Code se for PIX, tiver o código e não estiver cancelado
    if (payment.method === 'pix' && payment.status !== 'cancelled') {
      console.log('Pagamento PIX detectado:', payment);
      // Se não houver pixQrCode, vamos gerar um código de exemplo para teste
      const qrCodeText = payment.pixQrCode || `00020126580014BR.GOV.BCB.PIX0136${payment.id}-clica-sso-payment-${Date.now()}520400005303986540${parseFloat(payment.amount.toString()).toFixed(2)}5802BR5925CLICA SSO PAYMENTS LTDA6009SAO PAULO62070503***6304`;
      console.log('Gerando QR Code com texto:', qrCodeText);
      generateQRCodeImage(qrCodeText);
    } else {
      setQrCodeDataUrl(null);
    }
  }, [generateQRCodeImage]);

  useEffect(() => {
    const loadBillingData = async () => {
      setLoading(true);
      try {
        const [paymentsData, subscriptionsData, invoicesData, statsData] = await Promise.all([
          billingService.getPayments(),
          billingService.getSubscriptions(),
          billingService.getInvoices(),
          billingService.getStats()
        ]);

        setPayments(paymentsData.payments);
        setSubscriptions(subscriptionsData.subscriptions);
        setInvoices(invoicesData.invoices);
        setStats(statsData);
      } catch (error) {
        console.error('Erro ao carregar dados de cobrança:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBillingData();
  }, []);

  const handleSubscriptionAction = async (action: 'cancel' | 'pause' | 'resume', subscriptionId: number, reason?: string) => {
    setActionLoading(`${action}-${subscriptionId}`);
    try {
      const currentSub = subscriptions.find(s => s.id === subscriptionId);
      if (!currentSub) return;

      const updatedSub: BillingContract = {
        ...currentSub,
        status: action === 'cancel' ? 'cancelled' : action === 'pause' ? 'suspended' : 'active'
      };

      setSubscriptions(prev => prev.map(sub =>
        sub.id === subscriptionId ? updatedSub : sub
      ));
    } catch (error) {
      console.error('Erro ao atualizar assinatura:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRetryPayment = async (paymentId: number) => {
    setActionLoading(`retry-${paymentId}`);
    try {
      const currentPayment = payments.find(p => p.id === paymentId);
      if (!currentPayment) return;
      
      const updatedPayment: BillingPayment = {
        ...currentPayment,
        status: 'pending'
      };
      
      setPayments(prev => prev.map(payment => 
        payment.id === paymentId ? updatedPayment : payment
      ));
    } catch (error) {
      console.error('Erro ao tentar pagamento novamente:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadInvoice = async (invoiceId: number) => {
    setActionLoading(`download-${invoiceId}`);
    try {
      console.log('Download da fatura:', invoiceId);
    } catch (error) {
      console.error('Erro ao baixar nota fiscal:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendInvoiceEmail = async (invoiceId: number, email?: string) => {
    setActionLoading(`email-${invoiceId}`);
    try {
      console.log('Enviando fatura por email:', invoiceId, email);
    } catch (error) {
      console.error('Erro ao enviar nota fiscal por email:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Cobrança</h1>
          <p className="mt-2 text-gray-600">Gerencie seus pagamentos, assinaturas e faturas</p>
        </div>

        {/* Navegação */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: 'Resumo', icon: 'dashboard' as const },
              { key: 'payments', label: 'Pagamentos', icon: 'payment' as const },
              { key: 'subscriptions', label: 'Assinaturas', icon: 'subscriptions' as const },
              { key: 'invoices', label: 'Faturas', icon: 'receipt' as const }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as 'overview' | 'payments' | 'subscriptions' | 'invoices')}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon name={tab.icon} className="mr-2 h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Conteúdo das abas */}
        {activeTab === 'overview' && (
          <>
            {/* Cards de estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon name="payment" className="h-8 w-8 text-indigo-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Último Pagamento</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {payments.length > 0 ? formatAmount(payments[0].amount) : 'Nenhum'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon name="subscriptions" className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Assinaturas Ativas</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {subscriptions.filter(s => s.status === 'active').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon name="receipt" className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Faturas Pendentes</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {invoices.filter(i => i.status === 'issued').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon name="trending" className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Pago</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats ? formatAmount(stats.totalRevenue) : 'R$ 0,00'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Histórico Recente */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Últimos Pagamentos */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Últimos Pagamentos</h3>
                  <div className="space-y-4">
                    {payments.slice(0, 5).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between border-b border-gray-200 pb-4 last:border-b-0">
                        <div className="flex items-center space-x-3 flex-1">
                          {getPaymentMethodIcon(payment.method || '')}
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {getPaymentMethodLabel(payment.method || '')}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(payment.createdAt || '').toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status, 'payment')}`}>
                            {getStatusLabel(payment.status, 'payment')}
                          </span>
                          <p className="text-sm font-medium text-gray-900">
                            {formatAmount(payment.amount)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {payments.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">Nenhum pagamento encontrado</p>
                    )}
                    {payments.length > 5 && (
                      <button 
                        onClick={() => setActiveTab('payments')}
                        className="w-full text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium mt-4"
                      >
                        Ver todos os pagamentos
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Assinaturas Ativas */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Assinaturas Ativas</h3>
                  <div className="space-y-4">
                    {subscriptions.filter(s => s.status === 'active').slice(0, 5).map((subscription) => (
                      <div key={subscription.id} className="flex items-center justify-between border-b border-gray-200 pb-4 last:border-b-0">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{subscription.name}</p>
                          <p className="text-sm text-gray-500">{subscription.serviceType}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(subscription.status, 'subscription')}`}>
                            {getStatusLabel(subscription.status, 'subscription')}
                          </span>
                          <p className="text-sm font-medium text-gray-900">
                            {formatAmount(subscription.value)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {subscriptions.filter(s => s.status === 'active').length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">Nenhuma assinatura ativa</p>
                    )}
                    {subscriptions.filter(s => s.status === 'active').length > 5 && (
                      <button 
                        onClick={() => setActiveTab('subscriptions')}
                        className="w-full text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium mt-4"
                      >
                        Ver todas as assinaturas
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'payments' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Histórico de Pagamentos</h3>
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(payment.createdAt || '').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatAmount(payment.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex justify-center">
                            {getPaymentMethodIcon(payment.method || '')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status, 'payment')}`}>
                            {getStatusLabel(payment.status, 'payment')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleViewPayment(payment)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Visualizar
                          </button>
                          {payment.status === 'failed' && (
                            <button
                              onClick={() => handleRetryPayment(payment.id)}
                              disabled={actionLoading === `retry-${payment.id}`}
                              className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                            >
                              {actionLoading === `retry-${payment.id}` ? 'Tentando...' : 'Tentar Novamente'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            {subscriptions.map((subscription) => (
              <div key={subscription.id} className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900">{subscription.name}</h4>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <span className="font-medium">Valor:</span> {formatAmount(subscription.value)}
                        </div>
                        <div>
                          <span className="font-medium">Tipo:</span> {subscription.serviceType}
                        </div>
                        {subscription.endDate && 
                         (subscription.status === 'cancelled' || subscription.status === 'expired') && 
                         !isNaN(new Date(subscription.endDate).getTime()) && (
                          <div>
                            <span className="font-medium">Data final:</span> {new Date(subscription.endDate).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(subscription.status, 'subscription')}`}>
                        {getStatusLabel(subscription.status, 'subscription')}
                      </span>
                      {subscription.status === 'active' && (
                        <button
                          onClick={() => handleSubscriptionAction('pause', subscription.id)}
                          disabled={actionLoading === `pause-${subscription.id}`}
                          className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 disabled:opacity-50"
                        >
                          {actionLoading === `pause-${subscription.id}` ? 'Pausando...' : 'Pausar'}
                        </button>
                      )}
                      {subscription.status === 'active' && (
                        <button
                          onClick={() => handleSubscriptionAction('cancel', subscription.id)}
                          disabled={actionLoading === `cancel-${subscription.id}`}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                        >
                          {actionLoading === `cancel-${subscription.id}` ? 'Cancelando...' : 'Cancelar'}
                        </button>
                      )}
                      {subscription.status === 'suspended' && (
                        <button
                          onClick={() => handleSubscriptionAction('resume', subscription.id)}
                          disabled={actionLoading === `resume-${subscription.id}`}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                        >
                          {actionLoading === `resume-${subscription.id}` ? 'Retomando...' : 'Retomar'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Faturas</h3>
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          #{invoice.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(invoice.issueDate || '').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatAmount(invoice.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status, 'invoice')}`}>
                            {getStatusLabel(invoice.status, 'invoice')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleDownloadInvoice(invoice.id)}
                            disabled={actionLoading === `download-${invoice.id}`}
                            className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                          >
                            {actionLoading === `download-${invoice.id}` ? 'Baixando...' : 'Download'}
                          </button>
                          <button
                            onClick={() => handleSendInvoiceEmail(invoice.id)}
                            disabled={actionLoading === `email-${invoice.id}`}
                            className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50 ml-2"
                          >
                            {actionLoading === `email-${invoice.id}` ? 'Enviando...' : 'Enviar Email'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal de visualização de pagamento */}
        {selectedPayment && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Detalhes do Pagamento</h3>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Icon name="close" className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Layout em colunas para boleto */}
                {selectedPayment.method === 'boleto' ? (
                  <div className="grid grid-cols-2 gap-6">
                    {/* Coluna da esquerda - Dados do pagamento */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Valor</label>
                        <p className="mt-1 text-lg font-semibold text-gray-900">{formatAmount(selectedPayment.amount)}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Data</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date(selectedPayment.createdAt || '').toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedPayment.status, 'payment')}`}>
                          {getStatusLabel(selectedPayment.status, 'payment')}
                        </span>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Método de Pagamento</label>
                        <div className="mt-2 flex items-center space-x-2">
                          {getPaymentMethodIcon(selectedPayment.method || '')}
                          <span className="text-sm text-gray-900">{getPaymentMethodLabel(selectedPayment.method || '')}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Coluna da direita - QR Code */}
                    <div className="flex flex-col items-center justify-start">
                      <label className="block text-sm font-medium text-gray-700 mb-3">PIX Pagamento Imediato</label>
                      {selectedPayment.status === 'cancelled' ? (
                        <div className="bg-red-50 p-4 border-2 border-red-200 rounded-lg flex items-center justify-center w-32 h-32">
                          <div className="text-center">
                            <Icon name="cancel" className="h-8 w-8 text-red-600 mx-auto mb-1" />
                            <p className="text-xs text-red-600">Cancelado</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white p-3 border-2 border-gray-300 rounded-lg">
                          {(() => {
                            // Verificar se tem dados do banco_inter para QR Code do boleto
                            const boletoData = selectedPayment.metadata?.banco_inter?.boletoDetails?.boleto;
                            
                            // Usar o pixQrCode como dados para gerar o QR Code
                            if (selectedPayment.pixQrCode) {
                              return <QRCodeComponent value={selectedPayment.pixQrCode} size={96} />;
                            }
                            
                            // Fallback: usar linha digitável se disponível
                            const boletoCode = boletoData?.linhaDigitavel || boletoData?.codigoBarras || selectedPayment.boletoCode;
                            if (boletoCode) {
                              return <QRCodeComponent value={boletoCode} size={96} />;
                            }
                            
                            // Fallback visual se não houver dados
                            return (
                              <div className="w-24 h-24 bg-gray-100 border border-gray-300 rounded flex items-center justify-center">
                                <div className="text-center">
                                  <Icon name="receipt" className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                                  <p className="text-xs text-gray-500">N/A</p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 text-center mt-2 max-w-[120px]">
                        Escaneie para pagar
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Layout normal para outros métodos */
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Valor</label>
                      <p className="mt-1 text-lg font-semibold text-gray-900">{formatAmount(selectedPayment.amount)}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Data</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(selectedPayment.createdAt || '').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedPayment.status, 'payment')}`}>
                        {getStatusLabel(selectedPayment.status, 'payment')}
                      </span>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Método de Pagamento</label>
                      <div className="mt-2 flex items-center space-x-2">
                        {getPaymentMethodIcon(selectedPayment.method || '')}
                        <span className="text-sm text-gray-900">{getPaymentMethodLabel(selectedPayment.method || '')}</span>
                      </div>
                    </div>
                  </>
                )}

                {/* PIX QR Code */}
                {selectedPayment.method === 'pix' && (
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">QR Code PIX</label>
                    {selectedPayment.status === 'cancelled' ? (
                      <div className="flex flex-col items-center space-y-3">
                        <div className="bg-red-50 p-4 border-2 border-red-200 rounded-lg flex items-center justify-center w-48 h-48">
                          <div className="text-center">
                            <Icon name="cancel" className="h-12 w-12 text-red-600 mx-auto mb-2" />
                            <p className="text-sm text-red-600 font-medium">Pagamento Cancelado</p>
                            <p className="text-xs text-red-500 mt-1">Este QR Code não é mais válido</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 text-center max-w-xs">
                          O pagamento foi cancelado. Crie uma nova cobrança para gerar um novo QR Code.
                        </p>
                        <div className="w-full">
                          <button 
                            onClick={() => handleCreateNewPayment(selectedPayment.contractId)}
                            className="w-full bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 transition-colors"
                          >
                            Criar Nova Cobrança
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-3">
                        {qrCodeDataUrl ? (
                          <div className="bg-white p-4 border-2 border-gray-300 rounded-lg shadow-sm">
                            <img 
                              src={qrCodeDataUrl} 
                              alt="QR Code PIX" 
                              className="w-48 h-48 object-contain"
                            />
                          </div>
                        ) : (
                          <div className="bg-gray-100 p-4 border-2 border-gray-300 rounded-lg flex items-center justify-center w-48 h-48">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                              <p className="text-sm text-gray-600">Gerando QR Code...</p>
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 text-center max-w-xs">
                          Escaneie o QR Code com o app do seu banco para pagar via PIX
                        </p>
                        {selectedPayment.pixQrCode || qrCodeDataUrl ? (
                          <div className="w-full">
                            <button 
                              onClick={() => {
                                const textToCopy = selectedPayment.pixQrCode || `PIX-${selectedPayment.id}-${Date.now()}`;
                                navigator.clipboard.writeText(textToCopy);
                                alert('Código PIX copiado para a área de transferência!');
                              }}
                              className="w-full bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 transition-colors"
                            >
                              Copiar Código PIX
                            </button>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                )}

                {/* Código de Barras para Boleto */}
                {selectedPayment.method === 'boleto' && (
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Código de Barras</label>
                    {selectedPayment.status === 'cancelled' ? (
                      <div className="flex flex-col items-center space-y-3">
                        <div className="bg-red-50 p-4 border-2 border-red-200 rounded-lg flex items-center justify-center w-full min-h-[100px]">
                          <div className="text-center">
                            <Icon name="cancel" className="h-12 w-12 text-red-600 mx-auto mb-2" />
                            <p className="text-sm text-red-600 font-medium">Boleto Cancelado</p>
                            <p className="text-xs text-red-500 mt-1">Este código de barras não é mais válido</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 text-center">
                          O boleto foi cancelado. Crie uma nova cobrança para gerar um novo boleto.
                        </p>
                        <button 
                          onClick={() => handleCreateNewPayment(selectedPayment.contractId)}
                          className="w-full bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 transition-colors"
                        >
                          Criar Nova Cobrança
                        </button>
                      </div>
                    ) : (
                      <>
                        {(() => {
                          // Debug logs para entender os dados disponíveis
                          console.log('🔍 Dados do payment selecionado:', selectedPayment);
                          console.log('📊 Metadata:', selectedPayment.metadata);
                          console.log('🏦 Banco Inter:', selectedPayment.metadata?.banco_inter);
                          console.log('📄 BoletoCode:', selectedPayment.boletoCode);
                          
                          // Verificar se tem dados do banco_inter
                          if (selectedPayment.metadata?.banco_inter?.boletoDetails?.boleto) {
                            const boletoData = selectedPayment.metadata.banco_inter.boletoDetails.boleto;
                            console.log('✅ Usando dados do banco_inter:', boletoData);
                            return (
                              <BoletoBarcode 
                                codigoBarras={boletoData.codigoBarras}
                                linhaDigitavel={boletoData.linhaDigitavel}
                              />
                            );
                          }
                          
                          // Se tem pelo menos um boletoCode, usar fallback
                          if (selectedPayment.boletoCode) {
                            console.log('⚠️ Usando fallback com boletoCode:', selectedPayment.boletoCode);
                            return (
                              <div className="bg-white p-4 border-2 border-gray-300 rounded-lg">
                                <div className="w-full">
                                  <svg 
                                    width="100%" 
                                    height="80" 
                                    viewBox="0 0 400 80" 
                                    className="w-[90vw] max-w-full mx-auto"
                                    preserveAspectRatio="none"
                                  >
                                    <g fill="black">
                                      {Array.from({length: 44}, (_, i) => {
                                        const xPosition = (i * 400) / 44;
                                        const digit = (i * 3 + 7) % 10;
                                        const width = digit % 2 === 0 ? 6 : 9;
                                        const height = digit % 3 === 0 ? 60 : digit % 2 === 0 ? 50 : 55;
                                        const y = (80 - height) / 2;
                                        return (
                                          <rect 
                                            key={i} 
                                            x={xPosition} 
                                            y={y} 
                                            width={width} 
                                            height={height}
                                          />
                                        );
                                      })}
                                    </g>
                                  </svg>
                                </div>
                                <p className="text-xs text-gray-600 mt-3 text-center font-mono tracking-wider break-all px-4">
                                  {selectedPayment.boletoCode}
                                </p>
                                <p className="text-xs text-gray-400 mt-2 text-center">
                                  Aponte a câmera do seu celular para o código acima para efetuar o pagamento
                                </p>
                              </div>
                            );
                          }
                          
                          // Se é método boleto mas não tem códigos, gerar códigos sintéticos para demo
                          if (selectedPayment.method === 'boleto') {
                            console.log('🔧 Gerando código sintético para demo');
                            const syntheticBarcode = '07796118300000039900001112088121190402012762';
                            const syntheticLine = '07790001161208812119404020127629611830000003990';
                            return (
                              <BoletoBarcode 
                                codigoBarras={syntheticBarcode}
                                linhaDigitavel={syntheticLine}
                              />
                            );
                          }
                          
                          // Caso contrário, mostrar indisponível
                          console.log('❌ Nenhum código disponível');
                          return (
                            <div className="bg-gray-50 p-4 border-2 border-gray-200 rounded-lg">
                              <p className="text-gray-500 text-center">Código de barras não disponível</p>
                              <p className="text-xs text-gray-400 text-center mt-1">
                                Método: {selectedPayment.method} | Status: {selectedPayment.status}
                              </p>
                            </div>
                          );
                        })()}
                        <div className="mt-2 flex space-x-2">
                          <button 
                            onClick={() => handleCopyBoletoCode(selectedPayment)}
                            className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded text-sm hover:bg-indigo-700"
                          >
                            Copiar Código
                          </button>
                          <button 
                            onClick={() => handleDownloadBoletoPDF(selectedPayment)}
                            className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700"
                          >
                            Baixar PDF
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Informações do Cartão (dados mascarados) */}
                {(selectedPayment.method === 'credit_card' || selectedPayment.method === 'debit_card') && (
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Informações do {selectedPayment.method === 'credit_card' ? 'Cartão de Crédito' : 'Cartão de Débito'}
                    </label>
                    {selectedPayment.status === 'cancelled' ? (
                      <div className="bg-red-50 p-4 border-2 border-red-200 rounded-lg">
                        <div className="text-center">
                          <Icon name="cancel" className="h-8 w-8 text-red-600 mx-auto mb-2" />
                          <p className="text-sm text-red-600 font-medium">Pagamento Cancelado</p>
                          <p className="text-xs text-red-500 mt-1">Esta transação foi cancelada</p>
                        </div>
                        <button 
                          onClick={() => handleCreateNewPayment(selectedPayment.contractId)}
                          className="w-full mt-3 bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 transition-colors"
                        >
                          Criar Nova Cobrança
                        </button>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm text-gray-600">**** **** **** 1234</p>
                        <p className="text-xs text-gray-500 mt-1">Processado com segurança</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Transferência Bancária Cancelada */}
                {selectedPayment.method === 'bank_transfer' && selectedPayment.status === 'cancelled' && (
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Transferência Bancária</label>
                    <div className="bg-red-50 p-4 border-2 border-red-200 rounded-lg">
                      <div className="text-center">
                        <Icon name="cancel" className="h-8 w-8 text-red-600 mx-auto mb-2" />
                        <p className="text-sm text-red-600 font-medium">Transferência Cancelada</p>
                        <p className="text-xs text-red-500 mt-1">Esta transferência foi cancelada</p>
                      </div>
                      <button 
                        onClick={() => handleCreateNewPayment(selectedPayment.contractId)}
                        className="w-full mt-3 bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 transition-colors"
                      >
                        Criar Nova Cobrança
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
};

export default Billing;
