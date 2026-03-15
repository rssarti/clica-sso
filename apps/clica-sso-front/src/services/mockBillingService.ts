import type { Payment, Subscription, Invoice, BillingStats } from '../types/billing';

// Mock data para desenvolvimento
const mockPayments: Payment[] = [
  {
    id: '1',
    amount: 99.90,
    currency: 'BRL',
    status: 'completed',
    paymentMethod: 'credit_card',
    description: 'Assinatura Premium - Janeiro 2024',
    payer: {
      id: 'user-1',
      name: 'João Silva',
      email: 'joao@exemplo.com'
    },
    provider: 'stripe',
    transactionId: 'pi_1234567890',
    metadata: {
      gateway: 'stripe',
      subscription_id: 'sub-1',
      plan_name: 'Premium'
    },
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    amount: 49.90,
    currency: 'BRL',
    status: 'pending',
    paymentMethod: 'bank_transfer',
    description: 'Assinatura Básica - Janeiro 2024',
    payer: {
      id: 'user-2',
      name: 'Maria Santos',
      email: 'maria@exemplo.com'
    },
    provider: 'mercadopago',
    transactionId: 'mp_9876543210',
    metadata: {
      gateway: 'mercadopago',
      subscription_id: 'sub-2',
      plan_name: 'Básico'
    },
    createdAt: '2024-01-16T14:20:00Z',
    updatedAt: '2024-01-16T14:20:00Z'
  },
  {
    id: '3',
    amount: 199.90,
    currency: 'BRL',
    status: 'failed',
    paymentMethod: 'credit_card',
    description: 'Assinatura Enterprise - Janeiro 2024',
    payer: {
      id: 'user-3',
      name: 'Carlos Oliveira',
      email: 'carlos@empresa.com'
    },
    provider: 'stripe',
    transactionId: 'pi_failed123',
    failureReason: 'Cartão recusado',
    metadata: {
      gateway: 'stripe',
      subscription_id: 'sub-3',
      plan_name: 'Enterprise'
    },
    createdAt: '2024-01-17T09:15:00Z',
    updatedAt: '2024-01-17T09:15:00Z'
  }
];

const mockSubscriptions: Subscription[] = [
  {
    id: 'sub-1',
    userId: 'user-1',
    planId: 'plan-premium',
    planName: 'Premium',
    amount: 99.90,
    currency: 'BRL',
    status: 'active',
    billingCycle: 'monthly',
    startDate: '2024-01-01T00:00:00Z',
    nextBillingDate: '2024-02-01T00:00:00Z',
    paymentMethod: 'credit_card',
    provider: 'stripe',
    subscriptionId: 'sub_stripe_premium_123',
    features: [
      'Acesso completo ao sistema',
      'Suporte prioritário',
      'Relatórios avançados',
      'API ilimitada'
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'sub-2',
    userId: 'user-2',
    planId: 'plan-basic',
    planName: 'Básico',
    amount: 49.90,
    currency: 'BRL',
    status: 'active',
    billingCycle: 'monthly',
    startDate: '2024-01-01T00:00:00Z',
    nextBillingDate: '2024-02-01T00:00:00Z',
    paymentMethod: 'bank_transfer',
    provider: 'mercadopago',
    subscriptionId: 'sub_mp_basic_456',
    features: [
      'Acesso básico ao sistema',
      'Suporte por email',
      '1000 requisições/mês'
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-16T14:20:00Z'
  },
  {
    id: 'sub-3',
    userId: 'user-3',
    planId: 'plan-enterprise',
    planName: 'Enterprise',
    amount: 199.90,
    currency: 'BRL',
    status: 'cancelled',
    billingCycle: 'monthly',
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-01-31T23:59:59Z',
    paymentMethod: 'credit_card',
    provider: 'stripe',
    subscriptionId: 'sub_stripe_enterprise_789',
    cancellationReason: 'Solicitação do cliente',
    features: [
      'Todas as funcionalidades',
      'Suporte 24/7',
      'Implementação dedicada',
      'SLA garantido'
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-17T09:15:00Z'
  }
];

const mockInvoices: Invoice[] = [
  {
    id: 'inv-1',
    number: '000001',
    series: 'NFS-e',
    amount: 99.90,
    taxes: [
      { type: 'ISS', rate: 5, amount: 4.99 },
      { type: 'PIS', rate: 1.65, amount: 1.64 }
    ],
    totalAmount: 106.53,
    currency: 'BRL',
    status: 'paid',
    issueDate: '2024-01-15T10:30:00Z',
    dueDate: '2024-01-25T23:59:59Z',
    paidAt: '2024-01-15T10:30:00Z',
    items: [
      {
        id: 'item-1',
        description: 'Assinatura Premium - Janeiro 2024',
        quantity: 1,
        unitPrice: 99.90,
        totalPrice: 99.90
      }
    ],
    payer: {
      name: 'João Silva',
      email: 'joao@exemplo.com',
      document: '12345678901',
      address: {
        street: 'Rua das Flores',
        number: '123',
        complement: 'Apt 101',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
        country: 'Brasil'
      }
    },
    issuer: {
      name: 'Clica Tech LTDA',
      email: 'financeiro@clica.tech',
      document: '12345678000199',
      logo: '/logo-clica.png',
      address: {
        street: 'Av. Paulista',
        number: '1000',
        complement: 'Sala 500',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310-100',
        country: 'Brasil'
      }
    },
    paymentId: '1',
    notes: 'Obrigado pela sua preferência! Em caso de dúvidas, entre em contato conosco.',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'inv-2',
    number: '000002',
    series: 'NF',
    amount: 49.90,
    taxes: [
      { type: 'ISS', rate: 5, amount: 2.49 }
    ],
    totalAmount: 52.39,
    currency: 'BRL',
    status: 'issued',
    issueDate: '2024-01-16T14:20:00Z',
    dueDate: '2024-01-26T23:59:59Z',
    items: [
      {
        id: 'item-2',
        description: 'Assinatura Básica - Janeiro 2024',
        quantity: 1,
        unitPrice: 49.90,
        totalPrice: 49.90
      }
    ],
    payer: {
      name: 'Maria Santos',
      email: 'maria@exemplo.com',
      document: '98765432100',
      address: {
        street: 'Rua dos Jardins',
        number: '456',
        neighborhood: 'Vila Madalena',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '05433-000',
        country: 'Brasil'
      }
    },
    issuer: {
      name: 'Clica Tech LTDA',
      email: 'financeiro@clica.tech',
      document: '12345678000199',
      logo: '/logo-clica.png',
      address: {
        street: 'Av. Paulista',
        number: '1000',
        complement: 'Sala 500',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310-100',
        country: 'Brasil'
      }
    },
    paymentId: '2',
    createdAt: '2024-01-16T14:20:00Z',
    updatedAt: '2024-01-16T14:20:00Z'
  }
];

const mockStats: BillingStats = {
  totalRevenue: 8545.30,
  monthlyRevenue: 1549.70,
  totalSubscriptions: 45,
  activeSubscriptions: 38,
  pendingPayments: 5,
  overdueInvoices: 2,
  revenueGrowth: 12.5,
  subscriptionGrowth: 8.3
};

// Simulação de delay de rede
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockBillingService = {
  // Pagamentos
  getPayments: async (filters?: {
    status?: Payment['status'];
    paymentMethod?: Payment['paymentMethod'];
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    await delay(800);
    
    let filteredPayments = [...mockPayments];
    
    if (filters?.status) {
      filteredPayments = filteredPayments.filter(p => p.status === filters.status);
    }
    
    if (filters?.paymentMethod) {
      filteredPayments = filteredPayments.filter(p => p.paymentMethod === filters.paymentMethod);
    }
    
    return {
      payments: filteredPayments,
      total: filteredPayments.length,
      page: filters?.page || 1,
      totalPages: Math.ceil(filteredPayments.length / (filters?.limit || 10))
    };
  },

  getPayment: async (id: string) => {
    await delay(500);
    const payment = mockPayments.find(p => p.id === id);
    if (!payment) throw new Error('Pagamento não encontrado');
    return payment;
  },

  retryPayment: async (id: string) => {
    await delay(1000);
    const payment = mockPayments.find(p => p.id === id);
    if (!payment) throw new Error('Pagamento não encontrado');
    
    // Simula retry
    payment.status = 'processing';
    payment.updatedAt = new Date().toISOString();
    return payment;
  },

  // Assinaturas
  getSubscriptions: async (filters?: {
    status?: Subscription['status'];
    planId?: string;
    page?: number;
    limit?: number;
  }) => {
    await delay(800);
    
    let filteredSubscriptions = [...mockSubscriptions];
    
    if (filters?.status) {
      filteredSubscriptions = filteredSubscriptions.filter(s => s.status === filters.status);
    }
    
    if (filters?.planId) {
      filteredSubscriptions = filteredSubscriptions.filter(s => s.planId === filters.planId);
    }
    
    return {
      subscriptions: filteredSubscriptions,
      total: filteredSubscriptions.length,
      page: filters?.page || 1,
      totalPages: Math.ceil(filteredSubscriptions.length / (filters?.limit || 10))
    };
  },

  getSubscription: async (id: string) => {
    await delay(500);
    const subscription = mockSubscriptions.find(s => s.id === id);
    if (!subscription) throw new Error('Assinatura não encontrada');
    return subscription;
  },

  cancelSubscription: async (id: string, reason?: string) => {
    await delay(1000);
    const subscription = mockSubscriptions.find(s => s.id === id);
    if (!subscription) throw new Error('Assinatura não encontrada');
    
    subscription.status = 'cancelled';
    subscription.endDate = new Date().toISOString();
    subscription.cancellationReason = reason;
    subscription.updatedAt = new Date().toISOString();
    return subscription;
  },

  pauseSubscription: async (id: string) => {
    await delay(1000);
    const subscription = mockSubscriptions.find(s => s.id === id);
    if (!subscription) throw new Error('Assinatura não encontrada');
    
    subscription.status = 'paused';
    subscription.updatedAt = new Date().toISOString();
    return subscription;
  },

  resumeSubscription: async (id: string) => {
    await delay(1000);
    const subscription = mockSubscriptions.find(s => s.id === id);
    if (!subscription) throw new Error('Assinatura não encontrada');
    
    subscription.status = 'active';
    subscription.updatedAt = new Date().toISOString();
    return subscription;
  },

  // Notas Fiscais
  getInvoices: async (filters?: {
    status?: Invoice['status'];
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    await delay(800);
    
    let filteredInvoices = [...mockInvoices];
    
    if (filters?.status) {
      filteredInvoices = filteredInvoices.filter(i => i.status === filters.status);
    }
    
    return {
      invoices: filteredInvoices,
      total: filteredInvoices.length,
      page: filters?.page || 1,
      totalPages: Math.ceil(filteredInvoices.length / (filters?.limit || 10))
    };
  },

  getInvoice: async (id: string) => {
    await delay(500);
    const invoice = mockInvoices.find(i => i.id === id);
    if (!invoice) throw new Error('Nota fiscal não encontrada');
    return invoice;
  },

  downloadInvoicePDF: async (id: string) => {
    await delay(2000);
    
    // Simula download de PDF
    const invoice = mockInvoices.find(i => i.id === id);
    if (!invoice) throw new Error('Nota fiscal não encontrada');
    
    const blob = new Blob(['PDF Mock Content'], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `nota-fiscal-${invoice.series}-${invoice.number}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return { success: true, message: 'PDF baixado com sucesso' };
  },

  sendInvoiceEmail: async (id: string, email?: string) => {
    await delay(1500);
    
    const invoice = mockInvoices.find(i => i.id === id);
    if (!invoice) throw new Error('Nota fiscal não encontrada');
    
    return { 
      success: true, 
      message: `Nota fiscal enviada para ${email || invoice.payer.email}` 
    };
  },

  // Estatísticas
  getStats: async () => {
    await delay(1000);
    return mockStats;
  },

  getRevenueReport: async (period: 'monthly' | 'yearly', year?: number) => {
    await delay(1200);
    
    // Mock de relatório de receita
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    
    // Usar os parâmetros para evitar warning de lint
    const baseRevenue = period === 'yearly' ? 50000 : 5000;
    const currentYear = year || new Date().getFullYear();
    
    return months.map((month) => ({
      period: month,
      revenue: Math.random() * 10000 + baseRevenue,
      subscriptions: Math.floor(Math.random() * 50) + 20,
      payments: Math.floor(Math.random() * 100) + 50,
      year: currentYear
    }));
  }
};

export default mockBillingService;
