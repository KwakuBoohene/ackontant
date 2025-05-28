import React, { useState, useEffect } from 'react';
import type { Category } from '../../types/category';
import type { Tag } from '../../types/tag';
import type { TransactionType } from '../../types/transaction';
import type { Account } from '../../types/accounts';

interface TransactionFormProps {
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onCancel: () => void;
  form: {
    amount: string;
    type: keyof TransactionType;
    date: string;
    description: string;
    category_id: string;
    tag_ids: string[];
    source_account_id?: string;
    destination_account_id?: string;
    source_currency_id?: string;
    destination_currency_id?: string;
  };
  setForm: (form: any) => void;
  categories: Category[];
  tags: Tag[];
  accounts: Account[];
  isLoadingCategories: boolean;
  isLoadingTags: boolean;
  isSubmitting: boolean;
  error: string | null;
  isEditing: boolean;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  onSubmit,
  onCancel,
  form,
  setForm,
  categories,
  tags,
  accounts,
  isLoadingCategories,
  isLoadingTags,
  isSubmitting,
  error,
  isEditing,
}) => {
  const [categorySearch, setCategorySearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  // Debounce utility
  function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
      const handler = setTimeout(() => setDebouncedValue(value), delay);
      return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
  }

  const debouncedCategorySearch = useDebounce(categorySearch, 300);
  const debouncedTagSearch = useDebounce(tagSearch, 300);

  const isTransfer = form.type === 'TRANSFER';

  return (
    <form onSubmit={onSubmit} className="space-y-5">
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
          onChange={e => setForm({ ...form, type: e.target.value })}
          required
        >
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Expense</option>
          <option value="TRANSFER">Transfer</option>
        </select>
      </div>

      {isTransfer ? (
        <>
          <div>
            <label className="block mb-1 text-gray-300">From Account</label>
            <select
              className="w-full px-4 py-2 rounded-lg bg-[#232b3b] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.source_account_id}
              onChange={e => setForm({ ...form, source_account_id: e.target.value })}
              required
            >
              <option value="">Select Account</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.currency.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-gray-300">To Account</label>
            <select
              className="w-full px-4 py-2 rounded-lg bg-[#232b3b] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.destination_account_id}
              onChange={e => setForm({ ...form, destination_account_id: e.target.value })}
              required
            >
              <option value="">Select Account</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.currency.code})
                </option>
              ))}
            </select>
          </div>
        </>
      ) : (
        <>
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
          <div>
            <label className="block mb-1 text-gray-300">Category</label>
            <div className="relative">
              <input
                type="text"
                className="w-full px-4 py-2 rounded-lg bg-[#232b3b] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Search or add category..."
                value={categorySearch}
                onChange={e => {
                  setCategorySearch(e.target.value);
                  setNewCategoryName(e.target.value);
                }}
                onFocus={() => setShowCategoryDropdown(true)}
                onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 150)}
              />
              {showCategoryDropdown && (
                <div className="absolute left-0 right-0 mt-1 bg-[#232b3b] border border-gray-700 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {isLoadingCategories ? (
                    <div className="p-2 text-gray-400 text-center">Loading...</div>
                  ) : (
                    <>
                      {categories.map((category) => (
                        <div
                          key={category.id}
                          className={`px-4 py-2 cursor-pointer hover:bg-indigo-600 ${form.category_id === category.id ? 'bg-indigo-700 text-white' : 'text-gray-200'}`}
                          onClick={() => {
                            setForm((f: any) => ({ ...f, category_id: category.id }));
                            setCategorySearch('');
                            setShowCategoryDropdown(false);
                          }}
                        >
                          {category.name}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
              {form.category_id && (
                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-indigo-700 text-white text-xs">
                  {categories.find(c => c.id === form.category_id)?.name || 'Selected'}
                  <button
                    type="button"
                    className="ml-2 text-white hover:text-gray-300"
                    onClick={() => setForm((f: any) => ({ ...f, category_id: '' }))}
                  >
                    &times;
                  </button>
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block mb-1 text-gray-300">Tags</label>
            <div className="relative">
              <input
                type="text"
                className="w-full px-4 py-2 rounded-lg bg-[#232b3b] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Search or add tags..."
                value={tagSearch}
                onChange={e => {
                  setTagSearch(e.target.value);
                  setNewTagName(e.target.value);
                }}
                onFocus={() => setShowTagDropdown(true)}
                onBlur={() => setTimeout(() => setShowTagDropdown(false), 150)}
              />
              {showTagDropdown && (
                <div className="absolute left-0 right-0 mt-1 bg-[#232b3b] border border-gray-700 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {isLoadingTags ? (
                    <div className="p-2 text-gray-400 text-center">Loading...</div>
                  ) : (
                    <>
                      {tags.map((tag) => (
                        <div
                          key={tag.id}
                          className={`px-4 py-2 cursor-pointer hover:bg-indigo-600 ${form.tag_ids.includes(tag.id) ? 'bg-indigo-700 text-white' : 'text-gray-200'}`}
                          onClick={() => {
                            if (!form.tag_ids.includes(tag.id)) {
                              setForm((f: any) => ({ ...f, tag_ids: [...f.tag_ids, tag.id] }));
                            }
                            setTagSearch('');
                            setShowTagDropdown(false);
                          }}
                        >
                          {tag.name}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {form.tag_ids.map(tagId => {
                  const tag = tags.find(t => t.id === tagId);
                  return (
                    <span key={tagId} className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-700 text-white text-xs">
                      {tag?.name || 'Tag'}
                      <button
                        type="button"
                        className="ml-2 text-white hover:text-gray-300"
                        onClick={() => setForm((f: any) => ({ ...f, tag_ids: f.tag_ids.filter((id: string) => id !== tagId) }))}
                      >
                        &times;
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {error && <div className="text-red-400 text-sm text-center">{error}</div>}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          className="btn btn-ghost px-6 py-2 rounded-lg text-gray-300 hover:text-white"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn px-6 py-2 rounded-lg bg-indigo-500 border-none text-white font-semibold hover:bg-indigo-600 shadow-md"
          disabled={isSubmitting}
        >
          {isSubmitting ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update' : 'Save')}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm; 