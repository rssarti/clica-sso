import axios from 'axios';
import type { UserProfile, UpdateUserProfileDto } from '../types/profile';
import { authCookies } from '../utils/cookies';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ProfileService {
  private getAuthHeaders() {
    const token = authCookies.getAuthToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async getProfile(): Promise<UserProfile> {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/profile`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Token inválido ou expirado, redireciona para login
        window.location.href = '/logout';
      }
      throw new Error('Erro ao carregar informações do perfil');
    }
  }

  async updateProfile(data: UpdateUserProfileDto): Promise<UserProfile> {
    try {
      const response = await axios.put(`${API_BASE_URL}/users/profile`, data, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw new Error('Erro ao atualizar informações do perfil');
    }
  }
}

export const profileService = new ProfileService();
