import axios from 'axios';
import { authCookies } from '../utils/cookies';
import type { 
  PrivacySettings, 
  PrivacyHistoryEntry, 
  DataExportRequest, 
  AccountDeletionRequest,
  UpdatePrivacySettingsDto 
} from '../types/privacy';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class PrivacyService {
  private redirecting = false; // Flag para evitar redirecionamentos múltiplos

  private getAuthHeaders() {
    const token = authCookies.getAuthToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private handleAuthError() {
    if (!this.redirecting) {
      this.redirecting = true;
      authCookies.clearAuthData();
      window.location.href = '/login';
    }
  }

  // Configurações de Privacidade
  async getPrivacySettings(): Promise<PrivacySettings> {
    try {
      const response = await axios.get(`${API_BASE_URL}/privacy/settings`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar configurações de privacidade:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        this.handleAuthError();
      }
      throw new Error('Erro ao carregar configurações de privacidade');
    }
  }

  async updatePrivacySettings(settings: UpdatePrivacySettingsDto): Promise<PrivacySettings> {
    try {
      const response = await axios.patch(`${API_BASE_URL}/privacy/settings`, settings, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar configurações de privacidade:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        this.handleAuthError();
      }
      throw new Error('Erro ao atualizar configurações de privacidade');
    }
  }

  // Histórico de Privacidade
  async getPrivacyHistory(page: number = 1, limit: number = 10): Promise<{
    data: PrivacyHistoryEntry[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/privacy/history?page=${page}&limit=${limit}`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar histórico de privacidade:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = '/login';
      }
      throw new Error('Erro ao carregar histórico de privacidade');
    }
  }

  // Exportação de Dados
  async requestDataExport(requestReason?: string): Promise<DataExportRequest> {
    try {
      const response = await axios.post(`${API_BASE_URL}/privacy/data-export`, 
        { requestReason }, 
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao solicitar exportação de dados:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = '/login';
      }
      throw new Error('Erro ao solicitar exportação de dados');
    }
  }

  async getDataExportRequests(): Promise<DataExportRequest[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/privacy/data-export`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar solicitações de exportação:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = '/login';
      }
      throw new Error('Erro ao carregar solicitações de exportação');
    }
  }

  async downloadDataExport(requestId: string): Promise<void> {
    try {
      const response = await axios.get(`${API_BASE_URL}/privacy/data-export/${requestId}/download`, {
        headers: this.getAuthHeaders(),
        responseType: 'blob',
      });
      
      // Criar download do arquivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dados-pessoais-${new Date().toISOString().split('T')[0]}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar exportação de dados:', error);
      throw new Error('Erro ao baixar arquivo de dados');
    }
  }

  // Exclusão de Conta
  async requestAccountDeletion(reason?: string): Promise<AccountDeletionRequest> {
    try {
      const response = await axios.post(`${API_BASE_URL}/privacy/account-deletion`, 
        { reason }, 
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao solicitar exclusão de conta:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = '/login';
      }
      throw new Error('Erro ao solicitar exclusão de conta');
    }
  }

  async getAccountDeletionRequests(): Promise<AccountDeletionRequest[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/privacy/account-deletion`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar solicitações de exclusão:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = '/login';
      }
      throw new Error('Erro ao carregar solicitações de exclusão');
    }
  }

  async cancelAccountDeletionRequest(requestId: string): Promise<AccountDeletionRequest> {
    try {
      const response = await axios.delete(`${API_BASE_URL}/privacy/account-deletion/${requestId}`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao cancelar exclusão de conta:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = '/login';
      }
      throw new Error('Erro ao cancelar exclusão de conta');
    }
  }
}

export const privacyService = new PrivacyService();
