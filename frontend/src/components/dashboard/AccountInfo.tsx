import React from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import type { Account } from '@/types/accounts';

interface AccountInfoProps {
  account: Account;
  onDeleteClick: () => void;
}

const AccountInfo: React.FC<AccountInfoProps> = ({ account, onDeleteClick }) => {
  return (
    <div className="bg-[#232b3b] rounded-xl shadow-lg p-6 mb-8 flex flex-col md:flex-row gap-6 md:gap-12">
      <div>
        <div className="text-gray-400 text-xs uppercase">Account Name</div>
        <div className="text-lg font-bold text-white">{account.name}</div>
      </div>
      <div>
        <div className="text-gray-400 text-xs uppercase">Type</div>
        <div className="text-base font-semibold text-gray-200">{account.type}</div>
      </div>
      <div>
        <div className="text-gray-400 text-xs uppercase">Currency</div>
        <div className="text-base font-semibold text-gray-200">{account.currency.code}</div>
      </div>
      <div>
        <div className="text-gray-400 text-xs uppercase">Status</div>
        <div className={`text-base font-semibold ${account.is_active ? 'text-green-400' : 'text-red-400'}`}>
          {account.is_active ? 'Active' : 'Inactive'}
        </div>
      </div>
      <div className="ml-auto flex items-center">
        <button
          className="p-2 rounded-full hover:bg-red-700 focus:outline-none"
          title="Delete Account"
          onClick={onDeleteClick}
        >
          <TrashIcon className="h-6 w-6 text-red-400" />
        </button>
      </div>
    </div>
  );
};

export default AccountInfo; 