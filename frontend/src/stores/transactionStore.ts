import { create } from 'zustand';
import api from '../services/api';
import type { Currency } from './accountStore';

export interface TransactionType {
  INCOME: 'Income';
  EXPENSE: 'Expense';
  TRANSFER: 'Transfer';
}

export interface Transaction {
  id: string;
  user: string;
  account: {
    id: string;
    name: string;
  };
  amount: number;
  currency: Currency;
  type: keyof TransactionType;
  category: string;
  description: string;
  date: string;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransactionFilters {
  account_id?: string;
  type?: keyof TransactionType;
  category?: string;
  start_date?: string;
  end_date?: string;
}

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchTransactions: (filters?: TransactionFilters) => Promise<void>;
  createTransaction: (data: any) => Promise<void>;
  clearError: () => void;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: [],
  isLoading: false,
  error: null,

  fetchTransactions: async (filters = {}) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.get('/transactions/', { params: filters });
      const transactions = Array.isArray(response.data) ? response.data : response.data.results || [];
      set({ transactions, isLoading: false });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      set({ error: 'Failed to fetch transactions', isLoading: false });
    }
  },

  createTransaction: async (data) => {
    try {
      set({ isLoading: true, error: null });
      await api.post('/transactions/', data);
      const response = await api.get('/transactions/');
      const transactions = Array.isArray(response.data) ? response.data : response.data.results || [];
      set({ transactions, isLoading: false });
    } catch (error) {
      console.error('Error creating transaction:', error);
      set({ error: 'Failed to create transaction', isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
})); 