import { create } from 'zustand';
import api from '../services/api';

export type AccountType = 'BANK' | 'CASH' | 'MOBILE' | 'CREDIT' | 'OTHER';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: {
    id: string;
    code: string;
    name: string;
    symbol: string;
  };
  initial_balance: number;
  current_balance: number;
  base_currency_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountFormData {
  name: string;
  type: AccountType;
  currency: string;
  initial_balance: number;
}

interface AccountState {
  accounts: Account[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchAccounts: () => Promise<void>;
  createAccount: (data: AccountFormData) => Promise<Account>;
  clearError: () => void;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  isLoading: false,
  error: null,

  fetchAccounts: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.get('/accounts/');
      // Handle both array and paginated response formats
      const accounts = Array.isArray(response.data) ? response.data : response.data.results || [];
      set({ accounts, isLoading: false });
    } catch (error) {
      console.error('Error fetching accounts:', error);
      set({ error: 'Failed to fetch accounts', isLoading: false });
    }
  },

  createAccount: async (data: AccountFormData) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.post('/accounts/', data);
      set(state => ({
        accounts: [...state.accounts, response.data],
        isLoading: false
      }));
      return response.data;
    } catch (error) {
      console.error('Error creating account:', error);
      set({ error: 'Failed to create account', isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
})); 