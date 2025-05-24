import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export interface AccountType {
  CHECKING: 'Checking';
  SAVINGS: 'Savings';
  BANK: 'Bank';
  CREDIT_CARD: 'Credit Card';
  INVESTMENT: 'Investment';
  CASH: 'Cash';
}

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  decimal_places: number;
}

export interface Account {
  id: string;
  user: string;
  name: string;
  type: keyof AccountType;
  currency: Currency;
  initial_balance: number;
  current_balance: number;
  base_currency_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountFormData {
  name: string;
  type: keyof AccountType;
  currency_id: string;
  initial_balance: number;
}

interface AccountState {
  accounts: Account[];
  currentAccount: Account | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchAccounts: () => Promise<void>;
  fetchAccount: (id: string) => Promise<void>;
  createAccount: (data: AccountFormData) => Promise<void>;
  clearError: () => void;
}

export const useAccountStore = create<AccountState>()(
  persist(
    (set) => ({
      accounts: [],
      currentAccount: null,
      isLoading: false,
      error: null,

      fetchAccounts: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.get('/accounts/');
          const accounts = Array.isArray(response.data) ? response.data : response.data.results || [];
          set({ accounts, isLoading: false });
        } catch (error) {
          console.error('Error fetching accounts:', error);
          set({ error: 'Failed to fetch accounts', isLoading: false });
        }
      },

      fetchAccount: async (id: string) => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.get(`/accounts/${id}/`);
          set({ currentAccount: response.data, isLoading: false });
        } catch (error) {
          console.error('Error fetching account:', error);
          set({ error: 'Failed to fetch account', isLoading: false });
        }
      },

      createAccount: async (data: AccountFormData) => {
        try {
          set({ isLoading: true, error: null });
          await api.post('/accounts/', data);
          const response = await api.get('/accounts/');
          const accounts = Array.isArray(response.data) ? response.data : response.data.results || [];
          set({ accounts, isLoading: false });
        } catch (error) {
          console.error('Error creating account:', error);
          set({ error: 'Failed to create account', isLoading: false });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'account-storage',
      partialize: (state) => ({
        accounts: state.accounts,
        currentAccount: state.currentAccount,
      }),
    }
  )
); 