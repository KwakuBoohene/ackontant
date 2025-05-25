
import api from '../services/api';
import type { Transaction, TransactionFormData } from '../types/transaction';

const API_URL = '/transactions';

export const transactionApi = {
  // Get all transactions with optional filters
  getTransactions: async (params?: {
    account_id?: string;
    start_date?: string;
    end_date?: string;
    type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    category?: string;
    tag_ids?: string[];
    search?: string;
    ordering?: string;
  }): Promise<Transaction[]> => {
    const { data } = await api.get(API_URL, { params });
    return data;
  },

  // Get transaction by ID
  getTransaction: async (id: string): Promise<Transaction> => {
    const { data } = await api.get(`${API_URL}/${id}`);
    return data;
  },

  // Create new transaction
  createTransaction: async (transactionData: TransactionFormData): Promise<Transaction> => {
    const { data } = await api.post(API_URL, transactionData);
    return data;
  },

  // Update transaction
  updateTransaction: async (id: string, transactionData: Partial<TransactionFormData>): Promise<Transaction> => {
    const { data } = await api.put(`${API_URL}/${id}`, transactionData);
    return data;
  },

  // Delete transaction
  deleteTransaction: async (id: string): Promise<void> => {
    await api.delete(`${API_URL}/${id}`);
  },

  // Get transaction statistics
  getTransactionStats: async (params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<{
    total_income: number;
    total_expenses: number;
    net_amount: number;
    top_categories: Array<{ category__name: string; total: number }>;
  }> => {
    const { data } = await api.get(`${API_URL}/stats`, { params });
    return data;
  },
}; 