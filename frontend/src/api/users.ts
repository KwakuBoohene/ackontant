import api from '../services/api';
import type { User } from '../types/auth';

export interface UserProfile extends User {
  first_name: string;
  last_name: string;
  base_currency: {
    id: string;
    code: string;
    name: string;
  };
}

export const getProfile = async (): Promise<UserProfile> => {
  const response = await api.get('/users/me/');
  return response.data;
};

export const updateProfile = async (data: Partial<UserProfile>): Promise<UserProfile> => {
  const response = await api.patch('/users/me/', data);
  return response.data;
}; 