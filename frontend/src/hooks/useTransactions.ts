import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionApi } from '../api/transactions';
import type { Transaction, TransactionFormData } from '../types/transaction';

export const useTransactions = (params?: {
  account_id?: string;
  start_date?: string;
  end_date?: string;
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  category?: string;
  tag_ids?: string[];
  search?: string;
  ordering?: string;
}) => {
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: () => transactionApi.getTransactions(params),
  });
};

export const useTransaction = (id: string) => {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: () => transactionApi.getTransaction(id),
    enabled: !!id,
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TransactionFormData) => transactionApi.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TransactionFormData> }) =>
      transactionApi.updateTransaction(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction', id] });
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transactionApi.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

export const useTransactionStats = (params?: {
  start_date?: string;
  end_date?: string;
}) => {
  return useQuery({
    queryKey: ['transactionStats', params],
    queryFn: () => transactionApi.getTransactionStats(params),
  });
}; 