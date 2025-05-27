import React from 'react';
import { BanknotesIcon, CurrencyDollarIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/currency';
import type { Account } from '@/types/accounts';

interface SummaryCardsProps {
  account: Account;
}

const cardColors = [
  'bg-gradient-to-r from-blue-700 to-blue-500',
  'bg-gradient-to-r from-purple-700 to-purple-500',
  'bg-gradient-to-r from-green-700 to-green-500',
];

const SummaryCards: React.FC<SummaryCardsProps> = ({ account }) => {
  const summaryCards = [
    {
      label: 'Current Balance',
      value: formatCurrency(account.current_balance, account.currency),
      icon: <BanknotesIcon className="h-8 w-8 text-white opacity-80" />,
      color: cardColors[0],
    },
    {
      label: 'Initial Balance',
      value: formatCurrency(account.initial_balance, account.currency),
      icon: <CurrencyDollarIcon className="h-8 w-8 text-white opacity-80" />,
      color: cardColors[1],
    },
    {
      label: 'Base Currency Balance',
      value: formatCurrency(account.base_currency_balance, account.currency),
      icon: <ChartBarIcon className="h-8 w-8 text-white opacity-80" />,
      color: cardColors[2],
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {summaryCards.map((card) => (
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
  );
};

export default SummaryCards; 