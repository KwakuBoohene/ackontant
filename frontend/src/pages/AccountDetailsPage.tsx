import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useAccount, useDeleteAccount } from '../hooks/useAccounts';
import { useTransactions, useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from '../hooks/useTransactions';
import { useCategories, useCreateCategory } from '../hooks/useCategories';
import { useTags, useCreateTag } from '../hooks/useTags';
import type { Transaction, TransactionType, TransactionFormData } from '../types/transaction';
import SummaryCards from '../components/dashboard/SummaryCards';
import AccountInfo from '../components/dashboard/AccountInfo';
import TransactionForm from '../components/dashboard/TransactionForm';
import TransactionsTable from '../components/dashboard/TransactionsTable';
import DeleteConfirmationModal from '../components/dashboard/DeleteConfirmationModal';
import LoadingState from '../components/dashboard/LoadingState';
import ErrorState from '../components/dashboard/ErrorState';

const AccountDetailsPage: React.FC = () => {
  const params = useParams({ from: '/accounts/$id' });
  const accountId = params?.id;
  const navigate = useNavigate();
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [form, setForm] = useState({
    amount: '',
    type: 'EXPENSE' as keyof TransactionType,
    date: new Date().toISOString().split('T')[0],
    description: '',
    category_id: '',
    tag_ids: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    data: account,
    isLoading: isAccountLoading,
    error: accountError,
    isError: isAccountError,
  } = useAccount(accountId);

 

 
  const { mutateAsync: deleteAccount } = useDeleteAccount();

  const {
    data: transactions = [],
    isLoading: isTransactionsLoading,
    error: transactionsError,
  } = useTransactions({account_id:accountId||''});

  const { mutateAsync: createTransaction } = useCreateTransaction();
  const { mutateAsync: updateTransaction } = useUpdateTransaction();
  const { mutateAsync: deleteTransaction } = useDeleteTransaction();

  const {
    data: categories = [],
    isLoading: isCategoriesLoading,
    error: categoriesError,
  } = useCategories();

  const { mutateAsync: createCategory } = useCreateCategory();

  const {
    data: tags = [],
    isLoading: isTagsLoading,
    error: tagsError,
  } = useTags();

  const { mutateAsync: createTag } = useCreateTag();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const transactionData: TransactionFormData = {
        account_id: account.id,
        currency_id: account.currency.id,
        amount: parseFloat(form.amount),
        type: form.type,
        date: form.date,
        description: form.description,
        category_id: form.category_id || null,
        tag_ids: form.tag_ids,
      };

      if (selectedTransaction) {
        await updateTransaction({
          id: selectedTransaction.id,
          data: transactionData,
        });
      } else {
        await createTransaction(transactionData);
      }

      setIsTransactionModalOpen(false);
      setSelectedTransaction(null);
      setForm({
        amount: '',
        type: 'EXPENSE',
        date: new Date().toISOString().split('T')[0],
        description: '',
        category_id: '',
        tag_ids: [],
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (transaction: Transaction) => {
    try {
      await deleteTransaction(transaction.id);
      setIsDeleteModalOpen(false);
      setSelectedTransaction(null);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!account) return;
    try {
      await deleteAccount(account.id);
      navigate({ to: '/dashboard' });
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  };

  if (isAccountLoading || isTransactionsLoading || isCategoriesLoading || isTagsLoading) {
    return <LoadingState />;
  }

  const pageError = accountError || transactionsError || categoriesError || tagsError;
  if (pageError) {
    console.error('Page Error:', pageError);
    return <ErrorState error={pageError instanceof Error ? pageError : new Error(String(pageError))} />;
  }

  if (!account) {
    console.error('Account not found. Account ID:', accountId);
    return <ErrorState error={`Account not found. Please check if the account ID (${accountId}) is correct.`} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <AccountInfo account={account} onDeleteClick={() => setIsDeleteModalOpen(true)} />
      </div>

      <div className="mb-8">
        <SummaryCards account={account} />
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Transactions</h2>
          <button
            onClick={() => {
              setSelectedTransaction(null);
              setForm({
                amount: '',
                type: 'EXPENSE',
                date: new Date().toISOString().split('T')[0],
                description: '',
                category_id: '',
                tag_ids: [],
              });
              setIsTransactionModalOpen(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Add Transaction
          </button>
        </div>
        <TransactionsTable
          transactions={transactions}
          onEdit={(transaction) => {
            setSelectedTransaction(transaction);
            setForm({
              amount: transaction.amount.toString(),
              type: transaction.type,
              date: new Date(transaction.date).toISOString().split('T')[0],
              description: transaction.description,
              category_id: transaction.category?.id || '',
              tag_ids: transaction.tags.map(tag => tag.id),
            });
            setIsTransactionModalOpen(true);
          }}
          onDelete={(transaction) => {
            setSelectedTransaction(transaction);
            setIsDeleteModalOpen(true);
          }}
        />
      </div>

      <TransactionForm
        onSubmit={handleSubmit}
        onCancel={() => {
          setIsTransactionModalOpen(false);
          setSelectedTransaction(null);
          setForm({
            amount: '',
            type: 'EXPENSE',
            date: new Date().toISOString().split('T')[0],
            description: '',
            category_id: '',
            tag_ids: [],
          });
        }}
        form={form}
        setForm={setForm}
        categories={categories}
        tags={tags}
        isLoadingCategories={isCategoriesLoading}
        isLoadingTags={isTagsLoading}
        isSubmitting={isSubmitting}
        error={formError}
        isEditing={!!selectedTransaction}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedTransaction(null);
        }}
        onConfirm={() => {
          if (selectedTransaction) {
            handleDeleteTransaction(selectedTransaction);
          } else {
            handleDeleteAccount();
          }
        }}
        title={selectedTransaction ? 'Delete Transaction' : 'Delete Account'}
        message={
          selectedTransaction
            ? 'Are you sure you want to delete this transaction? This action cannot be undone.'
            : 'Are you sure you want to delete this account? This will also delete all associated transactions. This action cannot be undone.'
        }
      />
    </div>
  );
};

export default AccountDetailsPage; 