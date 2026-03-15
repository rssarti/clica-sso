import axios from 'axios';
import { authCookies } from '../utils/cookies';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface ConnectedApp {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'suspended' | 'expired';
  serviceType: string;
  value: number;
  startDate: string;
  endDate?: string;
  metadata?: Record<string, unknown>;
  plan?: {
    id: number;
    name: string;
    price: number;
    billingCycle: string;
    features?: string[];
    limits?: Record<string, number>;
  };
  lastPayment?: {
    id: number;
    amount: number;
    date: string;
    status: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  slug: string;
  name: string;
  description: string;
  longDescription?: string;
  category: string;
  status: string;
  logoUrl?: string;
  websiteUrl?: string;
  features?: string[];
  metadata?: Record<string, unknown>;
  plans?: Plan[];
}

export interface Plan {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  originalPrice?: number;
  billingCycle: 'monthly' | 'quarterly' | 'annual';
  trialDays: number;
  status: string;
  features?: string[];
  limits?: Record<string, number>;
  metadata?: Record<string, unknown>;
  isPopular: boolean;
  sortOrder: number;
}

export interface ContractVerification {
  id: number;
  isValid: boolean;
  status: string;
  user: {
    id: number;
    email: string;
    name: string;
  };
  plan?: Plan;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

export interface ContractUsage {
  contractId: number;
  limits: Record<string, number>;
  currentUsage: Record<string, number>;
  percentUsed: Record<string, number>;
}

class ConnectedAppsService {
  private getAuthHeaders() {
    const token = authCookies.getAuthToken();
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
  }

  // ============================================
  // CONTRATOS E APLICAÇÕES CONECTADAS
  // ============================================

  async getConnectedApps(): Promise<ConnectedApp[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/contracts/my-contracts-with-payments`, this.getAuthHeaders());
      
      // Convert contracts to connected apps format
      const connectedApps: ConnectedApp[] = response.data.map((contract: {
        id: string;
        name: string;
        description: string;
        status: string;
        startDate: string;
      }) => ({
        id: contract.id,
        name: contract.name,
        description: contract.description,
        status: contract.status,
        connectedAt: contract.startDate,
        permissions: []
      }));
      
      return connectedApps;
    } catch (error) {
      console.error('❌ Error fetching connected apps:', error);
      return [];
    }
  }

  async verifyContract(contractId: number): Promise<ContractVerification> {
    if (!contractId || isNaN(Number(contractId))) {
      throw new Error('Contract ID is required and must be a valid number');
    }
    const response = await axios.get(
      `${API_BASE_URL}/contracts/${contractId}/verify`,
      this.getAuthHeaders()
    );
    return response.data;
  }

  async getContractFeatures(contractId: number) {
    if (!contractId || isNaN(Number(contractId))) {
      throw new Error('Contract ID is required and must be a valid number');
    }
    const response = await axios.get(
      `${API_BASE_URL}/contracts/${contractId}/features`,
      this.getAuthHeaders()
    );
    return response.data;
  }

  async getContractUsage(contractId: number): Promise<ContractUsage> {
    if (!contractId || isNaN(Number(contractId))) {
      throw new Error('Contract ID is required and must be a valid number');
    }
    const response = await axios.get(
      `${API_BASE_URL}/contracts/${contractId}/usage`,
      this.getAuthHeaders()
    );
    return response.data;
  }

  async updateUsage(contractId: number, usageData: Record<string, number>) {
    if (!contractId || isNaN(Number(contractId))) {
      throw new Error('Contract ID is required and must be a valid number');
    }
    const response = await axios.put(
      `${API_BASE_URL}/contracts/${contractId}/usage`,
      usageData,
      this.getAuthHeaders()
    );
    return response.data;
  }

  async upgradeContract(contractId: number, planId: number) {
    if (!contractId || isNaN(Number(contractId))) {
      throw new Error('Contract ID is required and must be a valid number');
    }
    if (!planId || isNaN(Number(planId))) {
      throw new Error('Plan ID is required and must be a valid number');
    }
    const response = await axios.put(
      `${API_BASE_URL}/contracts/${contractId}/upgrade`,
      { planId },
      this.getAuthHeaders()
    );
    return response.data;
  }

  async downgradeContract(contractId: number, planId: number) {
    if (!contractId || isNaN(Number(contractId))) {
      throw new Error('Contract ID is required and must be a valid number');
    }
    if (!planId || isNaN(Number(planId))) {
      throw new Error('Plan ID is required and must be a valid number');
    }
    const response = await axios.put(
      `${API_BASE_URL}/contracts/${contractId}/downgrade`,
      { planId },
      this.getAuthHeaders()
    );
    return response.data;
  }

  async cancelContract(contractId: number, reason: string) {
    if (!contractId || isNaN(Number(contractId))) {
      throw new Error('Contract ID is required and must be a valid number');
    }
    const response = await axios.delete(
      `${API_BASE_URL}/contracts/${contractId}/cancel`,
      {
        ...this.getAuthHeaders(),
        data: { reason },
      }
    );
    return response.data;
  }

  // ============================================
  // PRODUTOS E MARKETPLACE
  // ============================================

  async getMarketplaceProducts(): Promise<Product[]> {
    const response = await axios.get(
      `${API_BASE_URL}/products/marketplace/available`,
      this.getAuthHeaders()
    );
    return response.data;
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    const response = await axios.get(
      `${API_BASE_URL}/products/categories/${category}`,
      this.getAuthHeaders()
    );
    return response.data;
  }

  async getProductPlans(productId: number) {
    if (!productId || isNaN(Number(productId))) {
      throw new Error('Product ID is required and must be a valid number');
    }
    const response = await axios.get(
      `${API_BASE_URL}/products/${productId}/plans`,
      this.getAuthHeaders()
    );
    return response.data;
  }

  async getProductBySlug(slug: string): Promise<Product> {
    const response = await axios.get(
      `${API_BASE_URL}/products/slug/${slug}`,
      this.getAuthHeaders()
    );
    return response.data;
  }

  // ============================================
  // CONTRATAÇÃO
  // ============================================

  async createContractFromPlan(planId: number, metadata?: Record<string, unknown>) {
    if (!planId || isNaN(Number(planId))) {
      throw new Error('Plan ID is required and must be a valid number');
    }
    const response = await axios.post(
      `${API_BASE_URL}/contracts/from-plan`,
      {
        planId,
        metadata,
        status: 'pending', // Contrato fica pendente até escolher forma de pagamento
      },
      this.getAuthHeaders()
    );
    return response.data;
  }

  async confirmPaymentMethod(contractId: number, paymentMethod: 'boleto' | 'pix', paymentData?: Record<string, unknown>) {
    if (!contractId || isNaN(Number(contractId))) {
      throw new Error('Contract ID is required and must be a valid number');
    }
    const response = await axios.post(
      `${API_BASE_URL}/contracts/${contractId}/payment-method`,
      {
        paymentMethod,
        paymentData,
      },
      this.getAuthHeaders()
    );
    return response.data;
  }

  async generatePaymentQR(contractId: number) {
    if (!contractId || isNaN(Number(contractId))) {
      throw new Error('Contract ID is required and must be a valid number');
    }
    const response = await axios.post(
      `${API_BASE_URL}/contracts/${contractId}/generate-payment`,
      {},
      this.getAuthHeaders()
    );
    return response.data;
  }

  async getPendingPayments(contractId: number) {
    if (!contractId || isNaN(Number(contractId))) {
      throw new Error('Contract ID is required and must be a valid number');
    }
    const response = await axios.get(
      `${API_BASE_URL}/contracts/${contractId}/pending-payments`,
      this.getAuthHeaders()
    );
    return response.data;
  }

  async generateBoleto(contractId: number) {
    if (!contractId || isNaN(Number(contractId))) {
      throw new Error('Contract ID is required and must be a valid number');
    }
    const response = await axios.post(
      `${API_BASE_URL}/contracts/${contractId}/generate-boleto`,
      {},
      this.getAuthHeaders()
    );
    return response.data;
  }

  async downloadBoletoPdf(contractId: number, codigoSolicitacao: string) {
    if (!contractId || isNaN(Number(contractId))) {
      throw new Error('Contract ID is required and must be a valid number');
    }
    if (!codigoSolicitacao) {
      throw new Error('Código de solicitação é obrigatório');
    }
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/contracts/${contractId}/boleto/${codigoSolicitacao}/pdf`,
        {
          ...this.getAuthHeaders(),
          responseType: 'blob', // Importante para download de arquivo
        }
      );

      // Criar um blob e fazer o download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Criar um link temporário para download
      const link = document.createElement('a');
      link.href = url;
      link.download = `boleto-${codigoSolicitacao}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Limpar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao baixar PDF do boleto:', error);
      throw new Error('Erro ao baixar PDF do boleto');
    }
  }

  // ============================================
  // UTILITÁRIOS
  // ============================================

  getAppAccessUrl(product: Product, token?: string): string {
    const urls: Record<string, string> = {
      'clicazap': 'https://clicazap.com',
      'clicarango': 'https://clicarango.com',
      'clica-analytics': 'https://analytics.clica.com',
    };

    const baseUrl = urls[product.slug] || product.websiteUrl || '#';
    
    if (token) {
      return `${baseUrl}/auth?token=${token}`;
    }
    
    return baseUrl;
  }

  formatCurrency(amount: number, currency: string = 'BRL'): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  formatBillingCycle(cycle: string): string {
    const cycles: Record<string, string> = {
      'monthly': 'Mensal',
      'quarterly': 'Trimestral',
      'annual': 'Anual',
    };
    return cycles[cycle] || cycle;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'active': 'text-green-600 bg-green-100',
      'pending': 'text-blue-600 bg-blue-100',
      'cancelled': 'text-red-600 bg-red-100',
      'suspended': 'text-yellow-600 bg-yellow-100',
      'expired': 'text-red-600 bg-red-100',
      'inactive': 'text-gray-600 bg-gray-100',
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  }

  getStatusText(status: string): string {
    const texts: Record<string, string> = {
      'active': 'Ativo',
      'pending': 'Pendente',
      'cancelled': 'Cancelado',
      'suspended': 'Suspenso',
      'expired': 'Expirado',
      'inactive': 'Inativo',
    };
    return texts[status] || status;
  }
}

export const connectedAppsService = new ConnectedAppsService();
