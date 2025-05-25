import api from '../services/api';
import type { Account, AccountFormData } from '../types/accounts';

const API_URL = '/accounts';

export const accountApi = {
  // Get all accounts
  getAccounts: async (): Promise<Account[]> => {
    const { data } = await api.get(API_URL);
    return Array.isArray(data) ? data : data.results || [];
  },

  // Get account by ID
  getAccount: async (id: string): Promise<Account> => {
    const { data } = await api.get(`${API_URL}/${id}/`);
    return data;
  },

  // Create new account
  createAccount: async (accountData: AccountFormData): Promise<Account> => {
    const { data } = await api.post(API_URL, accountData);
    return data;
  },

  // Update account
  updateAccount: async (id: string, accountData: Partial<AccountFormData>): Promise<Account> => {
    const { data } = await api.put(`${API_URL}/${id}/`, accountData);
    return data;
  },

  // Delete account
  deleteAccount: async (id: string): Promise<void> => {
    await api.delete(`${API_URL}/${id}/`);
  },
}; 