import axios from 'axios';
import type { RegisterFormData, User } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface RegisterResponse {
  id: string;
  email: string;
  is_email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export const register = async (data: RegisterFormData): Promise<RegisterResponse> => {
  const response = await axios.post(`${API_BASE_URL}/auth/register/`, data);
  return response.data;
}; 