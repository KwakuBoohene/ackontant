import React, { useState, useEffect } from 'react';
import { useAccountStore } from '../../stores/accountStore';
import { useCurrencyStore } from '../../stores/currencyStore';
import type { AccountFormData } from '../../types/accounts';
import Modal from './Modal';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateAccountModal: React.FC<CreateAccountModalProps> = ({ isOpen, onClose }) => {
  const createAccount = useAccountStore(state => state.createAccount);
  const { currencies, fetchCurrencies, isLoading: isLoadingCurrencies } = useCurrencyStore();
  const [formData, setFormData] = useState<AccountFormData>({
    name: '',
    type: 'BANK',
    currency_id: '',
    initial_balance: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCurrencies();
    }
  }, [isOpen, fetchCurrencies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await createAccount(formData);
      onClose();
    } catch (err) {
      setError('Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold text-center mb-6 text-white">Create New Account</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block mb-1 text-gray-300">Account Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 rounded-lg bg-[#232b3b] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
            required
          />
        </div>
        <div>
          <label className="block mb-1 text-gray-300">Account Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            className="w-full px-4 py-2 rounded-lg bg-[#232b3b] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
            required
          >
            <option value="BANK">Bank Account</option>
            <option value="CASH">Cash</option>
            <option value="MOBILE">Mobile Money</option>
            <option value="CREDIT">Credit Card</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 text-gray-300">Currency</label>
          <select
            value={formData.currency_id}
            onChange={(e) => setFormData({ ...formData, currency_id: e.target.value })}
            className="w-full px-4 py-2 rounded-lg bg-[#232b3b] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
            required
            disabled={isLoadingCurrencies}
          >
            <option value="">Select Currency</option>
            {currencies.map((currency) => (
              <option key={currency.id} value={currency.id}>
                {currency.code} - {currency.name}
              </option>
            ))}
          </select>
          {isLoadingCurrencies && (
            <p className="text-sm text-gray-500 mt-1">Loading currencies...</p>
          )}
        </div>
        <div>
          <label className="block mb-1 text-gray-300">Initial Balance</label>
          <input
            type="number"
            step="0.01"
            value={formData.initial_balance}
            onChange={(e) => setFormData({ ...formData, initial_balance: parseFloat(e.target.value) })}
            className="w-full px-4 py-2 rounded-lg bg-[#232b3b] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
            required
          />
        </div>
        {error && (
          <div className="text-red-400 text-sm text-center">{error}</div>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost px-6 py-2 rounded-lg text-gray-300 hover:text-white"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isLoadingCurrencies}
            className="btn px-6 py-2 rounded-lg bg-yellow-400 border-none text-[#232b3b] font-semibold hover:bg-yellow-500 shadow-md disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Account'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateAccountModal; 