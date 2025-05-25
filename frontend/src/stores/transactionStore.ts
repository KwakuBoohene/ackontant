import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';
import type { Transaction, TransactionFormData, TransactionFilters, TransactionType } from '../types/transaction';

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchTransactions: (filters?: TransactionFilters) => Promise<void>;
  createTransaction: (data: TransactionFormData) => Promise<void>;
  clearError: () => void;
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set) => ({
      transactions: [],
      isLoading: false,
      error: null,

      fetchTransactions: async (filters = {}) => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.get('/transactions/transactions/', { params: filters });
          const transactions = Array.isArray(response.data) ? response.data : response.data.results || [];
          set({ transactions, isLoading: false });
        } catch (error) {
          console.error('Error fetching transactions:', error);
          set({ error: 'Failed to fetch transactions', isLoading: false });
        }
      },

      createTransaction: async (data: TransactionFormData) => {
        try {
          set({ isLoading: true, error: null });
          await api.post('/transactions/transactions/', data);
          const response = await api.get('/transactions/transactions/');
          const transactions = Array.isArray(response.data) ? response.data : response.data.results || [];
          set({ transactions, isLoading: false });
        } catch (error) {
          console.error('Error creating transaction:', error);
          set({ error: 'Failed to create transaction', isLoading: false });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'transaction-storage',
      partialize: (state) => ({
        transactions: state.transactions,
      }),
    }
  )
); 