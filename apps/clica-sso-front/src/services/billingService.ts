/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { authCookies } from '../utils/cookies';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Interfaces específicas para billing
export interface BillingPayment {
  id: number;
  amount: string | number;
  method: 'boleto' | 'pix' | 'credit_card' | 'debit_card' | 'bank_transfer';
  status: 'pending' | 'completed' | 'failed' | 'processing' | 'cancelled';
  dueDate: string;
  paidAt?: string;
  description?: string;
  contractId: number;
  pixQrCode?: string; // Campo do QR Code PIX
  boletoCode?: string; // Campo do código de barras do boleto
  metadata?: Record<string, any>; // Metadados do pagamento (ex: dados do banco_inter)
  contract: {
    id: number;
    name: string;
    serviceType: string;
    status: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BillingContract {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended' | 'expired' | 'cancelled';
  serviceType: string;
  value: string | number;
  startDate: string;
  endDate?: string;
  metadata?: Record<string, unknown>;
  payments?: BillingPayment[];
  createdAt: string;
  updatedAt: string;
}

export interface BillingStats {
  totalContracts: number;
  activeContracts: number;
  pendingPayments: number;
  totalRevenue: number;
  monthlyRevenue: number;
  upcomingPayments: number;
}

export interface BillingInvoice {
  id: number;
  paymentId: number;
  amount: number;
  status: 'pending' | 'paid' | 'issued' | 'overdue' | 'cancelled';
  issueDate: string;
  dueDate: string;
  paidAt?: string;
  invoiceNumber: string;
  description: string;
  contract: {
    id: number;
    name: string;
    serviceType: string;
  };
}

class BillingService {
  private getAuthHeaders() {
    const token = authCookies.getAuthToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  // Buscar todos os contratos do usuário (assinaturas)
  async getSubscriptions(): Promise<{ subscriptions: BillingContract[] }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/contracts/my-contracts-with-payments`, {
        headers: this.getAuthHeaders(),
      });

      const contracts: BillingContract[] = response.data.map((contract: any) => ({
        id: contract.id,
        name: contract.name,
        description: contract.description,
        status: contract.status,
        serviceType: contract.serviceType,
        value: contract.value,
        startDate: contract.startDate,
        endDate: contract.endDate,
        metadata: contract.metadata,
        payments: contract.payments?.map((payment: any) => ({
          id: payment.id,
          amount: payment.amount,
          method: payment.method,
          status: payment.status,
          dueDate: payment.dueDate,
          paidAt: payment.paidAt,
          description: payment.description,
          contractId: contract.id,
          pixQrCode: payment.pixQrCode,
          boletoCode: payment.boletoCode,
          metadata: payment.metadata,
          contract: {
            id: contract.id,
            name: contract.name,
            serviceType: contract.serviceType,
            status: contract.status,
          },
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
        })) || [],
        createdAt: contract.createdAt,
        updatedAt: contract.updatedAt,
      }));

      return { subscriptions: contracts };
    } catch (error) {
      console.error('Erro ao buscar contratos:', error);
      throw error;
    }
  }

  // Buscar todos os pagamentos do usuário
  async getPayments(): Promise<{ payments: BillingPayment[] }> {
    try {
      const contractsResponse = await axios.get(`${API_BASE_URL}/contracts/my-contracts-with-payments`, {
        headers: this.getAuthHeaders(),
      });

      const payments: BillingPayment[] = [];
      
      contractsResponse.data.forEach((contract: any) => {
        if (contract.payments && contract.payments.length > 0) {
          contract.payments.forEach((payment: any) => {
            payments.push({
              id: payment.id,
              amount: payment.amount,
              method: payment.method,
              status: payment.status,
              dueDate: payment.dueDate,
              paidAt: payment.paidAt,
              description: payment.description,
              contractId: contract.id,
              pixQrCode: payment.pixQrCode,
              boletoCode: payment.boletoCode,
              metadata: payment.metadata,
              contract: {
                id: contract.id,
                name: contract.name,
                serviceType: contract.serviceType,
                status: contract.status,
              },
              createdAt: payment.createdAt,
              updatedAt: payment.updatedAt,
            });
          });
        }
      });

      // Ordenar por data de criação (mais recente primeiro)
      payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return { payments };
    } catch (error) {
      console.error('Erro ao buscar pagamentos:', error);
      throw error;
    }
  }

  // Buscar faturas/invoices (baseado nos pagamentos pagos)
  async getInvoices(): Promise<{ invoices: BillingInvoice[] }> {
    try {
      const { payments } = await this.getPayments();
      
      const invoices: BillingInvoice[] = payments
        .filter(payment => payment.status === 'completed' || payment.paidAt)
        .map((payment) => ({
          id: payment.id,
          paymentId: payment.id,
          amount: typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount,
          status: 'paid' as const,
          issueDate: payment.createdAt,
          dueDate: payment.dueDate,
          paidAt: payment.paidAt,
          invoiceNumber: `INV-${new Date().getFullYear()}-${String(payment.id).padStart(6, '0')}`,
          description: payment.description || `Pagamento do contrato ${payment.contract.name}`,
          contract: payment.contract,
        }));

      return { invoices };
    } catch (error) {
      console.error('Erro ao buscar faturas:', error);
      throw error;
    }
  }

  // Buscar estatísticas de billing
  async getStats(): Promise<BillingStats> {
    try {
      const [{ subscriptions }, { payments }] = await Promise.all([
        this.getSubscriptions(),
        this.getPayments()
      ]);

      const totalContracts = subscriptions.length;
      const activeContracts = subscriptions.filter(s => s.status === 'active').length;
      const pendingPayments = payments.filter(p => p.status === 'pending').length;
      
      const paidPayments = payments.filter(p => p.status === 'completed' && p.paidAt);
      const totalRevenue = paidPayments.reduce((sum, payment) => {
        const amount = typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount;
        return sum + amount;
      }, 0);

      // Receita mensal (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const monthlyRevenue = paidPayments
        .filter(p => p.paidAt && new Date(p.paidAt) >= thirtyDaysAgo)
        .reduce((sum, payment) => {
          const amount = typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount;
          return sum + amount;
        }, 0);

      // Pagamentos próximos (próximos 7 dias)
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      
      const upcomingPayments = payments.filter(p => 
        p.status === 'pending' && 
        new Date(p.dueDate) <= sevenDaysFromNow
      ).length;

      return {
        totalContracts,
        activeContracts,
        pendingPayments,
        totalRevenue,
        monthlyRevenue,
        upcomingPayments,
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw error;
    }
  }

  // Cancelar contrato
  async cancelSubscription(contractId: string, reason?: string): Promise<BillingContract> {
    try {
      const response = await axios.patch(`${API_BASE_URL}/contracts/${contractId}`, {
        status: 'cancelled',
        metadata: { 
          cancellationReason: reason,
          cancelledAt: new Date().toISOString()
        }
      }, {
        headers: this.getAuthHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao cancelar contrato:', error);
      throw error;
    }
  }

  // Pausar contrato
  async pauseSubscription(contractId: string): Promise<BillingContract> {
    try {
      const response = await axios.patch(`${API_BASE_URL}/contracts/${contractId}`, {
        status: 'suspended',
        metadata: { 
          suspendedAt: new Date().toISOString()
        }
      }, {
        headers: this.getAuthHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao pausar contrato:', error);
      throw error;
    }
  }

  // Reativar contrato
  async resumeSubscription(contractId: string): Promise<BillingContract> {
    try {
      const response = await axios.patch(`${API_BASE_URL}/contracts/${contractId}`, {
        status: 'active'
      }, {
        headers: this.getAuthHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao reativar contrato:', error);
      throw error;
    }
  }

  // Tentar pagamento novamente (gerar novo boleto/PIX)
  async retryPayment(paymentId: string): Promise<BillingPayment> {
    try {
      // Buscar o pagamento atual para obter o contractId
      const payment = await this.getPaymentById(paymentId);
      
      // Gerar novo boleto/PIX para o contrato
      const response = await axios.post(`${API_BASE_URL}/billing/contract/${payment.contractId}/generate-boleto`, {}, {
        headers: this.getAuthHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao tentar pagamento novamente:', error);
      throw error;
    }
  }

  // Buscar pagamento por ID
  private async getPaymentById(paymentId: string): Promise<BillingPayment> {
    const { payments } = await this.getPayments();
    const payment = payments.find(p => p.id.toString() === paymentId);
    
    if (!payment) {
      throw new Error('Pagamento não encontrado');
    }
    
    return payment;
  }

  // Baixar PDF da fatura
  async downloadInvoicePDF(invoiceId: string): Promise<void> {
    try {
      const { invoices } = await this.getInvoices();
      const invoice = invoices.find(i => i.id.toString() === invoiceId);
      
      if (!invoice) {
        throw new Error('Fatura não encontrada');
      }

      // Usar o endpoint de download de boleto existente
      const response = await axios.get(
        `${API_BASE_URL}/contracts/${invoice.contract.id}/boleto/${invoice.paymentId}/pdf`,
        {
          headers: this.getAuthHeaders(),
          responseType: 'blob',
        }
      );

      // Criar link de download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fatura-${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar PDF da fatura:', error);
      throw error;
    }
  }
}

export const billingService = new BillingService();
