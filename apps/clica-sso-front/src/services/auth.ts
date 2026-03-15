import api from './api';
import type { LoginData, RegisterData, AuthResponse, RegisterResponse, ValidationRequest, ValidationResponse } from '../types/auth';

export const authService = {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  async register(data: RegisterData): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>('/users/register', data);
    return response.data;
  },

  async validateToken(data: ValidationRequest): Promise<ValidationResponse> {
    const response = await api.post<ValidationResponse>('/auth/validate', data);
    return response.data;
  },
};

export default api;
