import api from '../services/api';
import type { User } from '../types/auth';

export type UserProfile = User;

export const getProfile = async (): Promise<UserProfile> => {
  const response = await api.get('/users/me/');
  return response.data;
};

export const updateProfile = async (data: Partial<UserProfile>): Promise<UserProfile> => {
  const response = await api.patch('/users/update_me/', data);
  return response.data;
}; 