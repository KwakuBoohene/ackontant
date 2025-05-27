import React from 'react';
import { Link } from '@tanstack/react-router';
import { formatCurrency } from '../../utils/currency';
import type { Account } from '@/types/accounts';

interface AccountCardProps {
  account: Account;
}

const AccountCard: React.FC<AccountCardProps> = ({ account }) => {
  return (
    <Link
      to="/accounts/$id"
      params={{ id: account.id }}
      className="bg-[#1e293b] rounded-lg p-6 shadow-lg hover:bg-[#1e293b]/90 transition-colors cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{account.name}</h3>
          <p className="text-gray-400 text-sm">{account.type}</p>
        </div>
        <span className="text-[#FFB32C] text-sm">{account.currency.code}</span>
      </div>
      <div className="space-y-2">
        <div>
          <p className="text-gray-400 text-sm">Current Balance</p>
          <p className="text-white text-xl font-semibold">
            {formatCurrency(account.current_balance, account.currency)}
          </p>
        </div>
        <div>
          <p className="text-gray-400 text-sm">Base Currency Balance</p>
          <p className="text-white text-lg">
            {formatCurrency(account.base_currency_balance, account.currency)}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default AccountCard; 