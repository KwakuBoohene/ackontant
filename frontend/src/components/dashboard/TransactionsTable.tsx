import React from 'react';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/currency';
import type { Transaction } from '@/types/transaction';

interface TransactionsTableProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  onEdit,
  onDelete,
}) => {
  if (transactions.length === 0) {
    return <p className="text-gray-400 text-center py-4">No transactions found</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-gray-200">
        <thead>
          <tr className="bg-[#1a2232]">
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Description</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Category</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Amount</th>
            <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#232b3b]">
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-[#20293a] transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                {new Date(transaction.date).toLocaleDateString()}
              </td>
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
              <td className="px-6 py-4 whitespace-nowrap">
                {formatCurrency(transaction.amount, transaction.currency)}
              </td>
              <td className="px-6 py-4 text-center flex gap-2 justify-center">
                <button
                  className="p-1 rounded hover:bg-indigo-700"
                  onClick={() => onEdit(transaction)}
                  title="Edit"
                >
                  <PencilSquareIcon className="h-5 w-5 text-indigo-400" />
                </button>
                <button
                  className="p-1 rounded hover:bg-red-700"
                  onClick={() => onDelete(transaction)}
                  title="Delete"
                >
                  <TrashIcon className="h-5 w-5 text-red-400" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionsTable; 