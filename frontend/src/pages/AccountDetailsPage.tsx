import React, { useEffect, useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { useAccountStore } from '../stores/accountStore';
import { useTransactionStore } from '../stores/transactionStore';
import type { Transaction } from '../types/transaction';
import { formatCurrency } from '../utils/currency';
import DashboardLayout from '../layouts/DashboardLayout';
import { BanknotesIcon, CurrencyDollarIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import Modal from '../components/modals/Modal';

const cardColors = [
  'bg-gradient-to-r from-blue-700 to-blue-500',
  'bg-gradient-to-r from-purple-700 to-purple-500',
  'bg-gradient-to-r from-green-700 to-green-500',
];

const AccountDetailsPage: React.FC = () => {
  const { id } = useParams({ from: '/accounts/$id' });
  const { currentAccount, fetchAccount, isLoading: isAccountLoading, error: accountError } = useAccountStore();
  const { transactions, fetchTransactions, isLoading: isTransactionsLoading, error: transactionsError, createTransaction } = useTransactionStore();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    amount: '',
    type: 'INCOME' as keyof import('../types/transaction').TransactionType,
    date: new Date().toISOString().slice(0, 10),
    description: '',
    category_id: '',
    tag_ids: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchAccount(id);
      fetchTransactions({ account_id: id });
    }
  }, [id, fetchAccount, fetchTransactions]);

  // Reset form on close
  const closeModal = () => {
    setIsModalOpen(false);
    setForm({
      amount: '',
      type: 'INCOME' as keyof import('../types/transaction').TransactionType,
      date: new Date().toISOString().slice(0, 10),
      description: '',
      category_id: '',
      tag_ids: [],
    });
    setSubmitError(null);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAccount) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await createTransaction({
        account: currentAccount.id,
        type: form.type,
        amount: Number(form.amount),
        currency: currentAccount.currency.id,
        description: form.description,
        date: form.date,
        category_id: form.category_id || undefined,
        tag_ids: form.tag_ids.length ? form.tag_ids : undefined,
      });
      closeModal();
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to add transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAccountLoading || isTransactionsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (accountError || transactionsError) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-red-400">
            {accountError || transactionsError}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!currentAccount) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-gray-400">Account not found</div>
        </div>
      </DashboardLayout>
    );
  }

  // Summary card data
  const summaryCards = [
    {
      label: 'Current Balance',
      value: formatCurrency(currentAccount.current_balance, currentAccount.currency),
      icon: <BanknotesIcon className="h-8 w-8 text-white opacity-80" />, color: cardColors[0],
    },
    {
      label: 'Initial Balance',
      value: formatCurrency(currentAccount.initial_balance, currentAccount.currency),
      icon: <CurrencyDollarIcon className="h-8 w-8 text-white opacity-80" />, color: cardColors[1],
    },
    {
      label: 'Base Currency Balance',
      value: formatCurrency(currentAccount.base_currency_balance, currentAccount.currency),
      icon: <ChartBarIcon className="h-8 w-8 text-white opacity-80" />, color: cardColors[2],
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-2 md:px-0 py-6">
        <div className="mb-6">
          <Link to="/dashboard" className="text-blue-400 hover:underline flex items-center gap-1">
            <span className="text-lg">←</span> Back to Dashboard
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {summaryCards.map((card, idx) => (
            <div
              key={card.label}
              className={`rounded-xl shadow-lg p-6 flex items-center gap-4 ${card.color} bg-opacity-90`}
            >
              <div className="flex-shrink-0">{card.icon}</div>
              <div>
                <div className="text-gray-200 text-sm font-medium mb-1">{card.label}</div>
                <div className="text-2xl font-bold text-white">{card.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Account Info */}
        <div className="bg-[#232b3b] rounded-xl shadow-lg p-6 mb-8 flex flex-col md:flex-row gap-6 md:gap-12">
          <div>
            <div className="text-gray-400 text-xs uppercase">Account Name</div>
            <div className="text-lg font-bold text-white">{currentAccount.name}</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs uppercase">Type</div>
            <div className="text-base font-semibold text-gray-200">{currentAccount.type}</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs uppercase">Currency</div>
            <div className="text-base font-semibold text-gray-200">{currentAccount.currency.code}</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs uppercase">Status</div>
            <div className={`text-base font-semibold ${currentAccount.is_active ? 'text-green-400' : 'text-red-400'}`}>{currentAccount.is_active ? 'Active' : 'Inactive'}</div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-[#232b3b] rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Transactions</h2>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              onClick={() => setIsModalOpen(true)}
            >
              Add Transaction
            </button>
          </div>

          {/* DaisyUI Modal */}
          <Modal isOpen={isModalOpen} onClose={closeModal}>
            <h3 className="font-bold text-xl text-center mb-6 text-white">Add Transaction</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block mb-1 text-gray-300">Amount</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 rounded-lg bg-[#232b3b] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-300">Type</label>
                <select
                  className="w-full px-4 py-2 rounded-lg bg-[#232b3b] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value as keyof import('../types/transaction').TransactionType })}
                  required
                >
                  <option value="INCOME">Income</option>
                  <option value="EXPENSE">Expense</option>
                  <option value="TRANSFER">Transfer</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 text-gray-300">Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 rounded-lg bg-[#232b3b] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-300">Description</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-lg bg-[#232b3b] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>
              {/* Category and tags can be added here if available */}
              {submitError && <div className="text-red-400 text-sm text-center">{submitError}</div>}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="btn btn-ghost px-6 py-2 rounded-lg text-gray-300 hover:text-white"
                  onClick={closeModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn px-6 py-2 rounded-lg bg-indigo-500 border-none text-white font-semibold hover:bg-indigo-600 shadow-md"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Adding...' : 'Save'}
                </button>
              </div>
            </form>
          </Modal>

          {transactions.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No transactions found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-gray-200">
                <thead>
                  <tr className="bg-[#1a2232]">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232b3b]">
                  {transactions.map((transaction: Transaction) => (
                    <tr key={transaction.id} className="hover:bg-[#20293a] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(transaction.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">{transaction.description}</td>
                      <td className="px-6 py-4">{transaction.category?.name || 'Uncategorized'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.type === 'INCOME'
                            ? 'bg-green-900 text-green-300'
                            : transaction.type === 'EXPENSE'
                            ? 'bg-red-900 text-red-300'
                            : 'bg-blue-900 text-blue-300'
                        }`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(transaction.amount, transaction.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AccountDetailsPage; 