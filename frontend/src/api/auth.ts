import api from '../services/api';
import type { LoginFormData, RegisterFormData, User } from '../types/auth';

const API_URL = '/auth';

export interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
}

export const authApi = {
  // Login user
  login: async (credentials: LoginFormData): Promise<AuthResponse> => {
    const { data } = await api.post(`${API_URL}/login/`, credentials);
    return data;
  },

  // Register new user
  register: async (userData: RegisterFormData): Promise<AuthResponse> => {
    const { data } = await api.post(`${API_URL}/register/`, userData);
    return data;
  },

  // Logout user
  logout: async (refreshToken: string): Promise<void> => {
    await api.post(`${API_URL}/logout/`, { refresh: refreshToken });
  },

  // Verify email
  verifyEmail: async (token: string): Promise<void> => {
    await api.post(`${API_URL}/verify-email/`, { token });
  },

  // Request password reset
  requestPasswordReset: async (email: string): Promise<void> => {
    await api.post(`${API_URL}/request-password-reset/`, { email });
  },

  // Reset password
  resetPassword: async (token: string, password: string): Promise<void> => {
    await api.post(`${API_URL}/reset-password/`, { token, password });
  },
}; 