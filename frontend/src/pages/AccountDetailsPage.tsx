import React, { useEffect } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { useAccountStore } from '../stores/accountStore';
import { useTransactionStore } from '../stores/transactionStore';
import type { Transaction } from '../stores/transactionStore';
import { formatCurrency } from '../utils/currency';

const AccountDetailsPage: React.FC = () => {
  const { id } = useParams({ from: '/accounts/$id' });
  const { currentAccount, fetchAccount, isLoading: isAccountLoading, error: accountError } = useAccountStore();
  const { transactions, fetchTransactions, isLoading: isTransactionsLoading, error: transactionsError } = useTransactionStore();

  useEffect(() => {
    if (id) {
      fetchAccount(id);
      fetchTransactions({ account_id: id });
    }
  }, [id, fetchAccount, fetchTransactions]);

  if (isAccountLoading || isTransactionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (accountError || transactionsError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">
          {accountError || transactionsError}
        </div>
      </div>
    );
  }

  if (!currentAccount) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Account not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link to="/dashboard" className="text-primary hover:text-primary-dark">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h1 className="text-2xl font-bold mb-4">{currentAccount.name}</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-gray-600">Type</p>
            <p className="font-semibold">{currentAccount.type}</p>
          </div>
          <div>
            <p className="text-gray-600">Currency</p>
            <p className="font-semibold">{currentAccount.currency.code}</p>
          </div>
          <div>
            <p className="text-gray-600">Status</p>
            <p className="font-semibold">{currentAccount.is_active ? 'Active' : 'Inactive'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Balances</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-gray-600">Current Balance</p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(currentAccount.current_balance, currentAccount.currency)}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Initial Balance</p>
            <p className="text-2xl font-bold">
              {formatCurrency(currentAccount.initial_balance, currentAccount.currency)}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Base Currency Balance</p>
            <p className="text-2xl font-bold">
              {formatCurrency(currentAccount.base_currency_balance, currentAccount.currency)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Transactions</h2>
          <button className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark">
            Add Transaction
          </button>
        </div>

        {transactions.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No transactions found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction: Transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4">
                      {transaction.category}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.type === 'INCOME' ? 'bg-green-100 text-green-800' :
                        transaction.type === 'EXPENSE' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountDetailsPage; 