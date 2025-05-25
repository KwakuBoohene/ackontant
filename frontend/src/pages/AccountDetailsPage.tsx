import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from '@tanstack/react-router';
import { useAccount } from '../hooks/useAccounts';
import { useTransactions, useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from '../hooks/useTransactions';
import { useDeleteAccount } from '../hooks/useAccounts';
import type { Transaction } from '../types/transaction';
import { formatCurrency } from '../utils/currency';
import DashboardLayout from '../layouts/DashboardLayout';
import { BanknotesIcon, CurrencyDollarIcon, ChartBarIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import Modal from '../components/modals/Modal';
import { useCategories, useCreateCategory } from '../hooks/useCategories';
import { useTags, useCreateTag } from '../hooks/useTags';
import type { Category } from '../types/category';
import type { Tag } from '../types/tag';

const cardColors = [
  'bg-gradient-to-r from-blue-700 to-blue-500',
  'bg-gradient-to-r from-purple-700 to-purple-500',
  'bg-gradient-to-r from-green-700 to-green-500',
];

const AccountDetailsPage: React.FC = () => {
  const { id } = useParams({ from: '/accounts/$id' });
  const { data: currentAccount, isLoading: isAccountLoading, error: accountError } = useAccount(id);
  const { data: transactions = [], isLoading: isTransactionsLoading, error: transactionsError } = useTransactions(id ? { account_id: id } : undefined);
  const { mutateAsync: createTransaction } = useCreateTransaction();
  const { mutateAsync: updateTransaction } = useUpdateTransaction();
  const { mutateAsync: deleteTransaction } = useDeleteTransaction();
  const { mutateAsync: deleteAccount } = useDeleteAccount();
  const navigate = useNavigate();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [form, setForm] = useState({
    amount: '',
    type: 'INCOME' as keyof import('../types/transaction').TransactionType,
    date: new Date().toISOString().slice(0, 10),
    description: '',
    category_id: '',
    tag_ids: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Debounce utility
  function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
      const handler = setTimeout(() => setDebouncedValue(value), delay);
      return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
  }

  // Category/tag search and creation state
  const [categorySearch, setCategorySearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newTagName, setNewTagName] = useState('');

  // Debounced search values
  const debouncedCategorySearch = useDebounce(categorySearch, 300);
  const debouncedTagSearch = useDebounce(tagSearch, 300);

  // Fetch categories/tags from backend using debounced search
  const { data: categories = [], isLoading: isLoadingCategories } = useCategories(debouncedCategorySearch || undefined);
  const { mutateAsync: createCategory } = useCreateCategory();
  const { data: tags = [], isLoading: isLoadingTags } = useTags(debouncedTagSearch || undefined);
  const { mutateAsync: createTag } = useCreateTag();

  // Dropdown visibility state
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);

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
    setCategorySearch('');
    setTagSearch('');
    setNewCategoryName('');
    setNewTagName('');
    setSubmitError(null);
  };

  // Add new category
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const newCat = await createCategory({
        name: newCategoryName,
        type: form.type,
        color: '#8884d8',
        icon: '',
        is_active: true
      });
      setForm(f => ({ ...f, category_id: newCat.id }));
      setNewCategoryName('');
      setCategorySearch('');
    } catch (err) {
      setSubmitError('Failed to add category');
    }
  };

  // Add new tag
  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const newTag = await createTag({
        name: newTagName,
        color: '#8884d8',
        is_active: true
      });
      setForm(f => ({ ...f, tag_ids: [...f.tag_ids, newTag.id] }));
      setNewTagName('');
      setTagSearch('');
    } catch (err) {
      setSubmitError('Failed to add tag');
    }
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAccount) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await createTransaction({
        account_id: currentAccount.id,
        type: form.type,
        amount: Number(form.amount),
        currency_id: currentAccount.currency.id,
        description: form.description,
        date: form.date,
        category_id: form.category_id || undefined,
        tag_ids: form.tag_ids.length ? form.tag_ids : undefined,
        is_recurring: false,
        is_archived: false
      });
      closeModal();
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to add transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open edit modal with transaction data
  const openEditModal = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setForm({
      amount: transaction.amount.toString(),
      type: transaction.type,
      date: transaction.date,
      description: transaction.description,
      category_id: transaction.category?.id || '',
      tag_ids: transaction.tags.map(t => t.id),
    });
    setIsModalOpen(true);
  };

  // Open delete modal
  const openDeleteModal = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setIsDeleteModalOpen(true);
  };

  // Handle delete confirm
  const handleDelete = async () => {
    if (!transactionToDelete) return;
    try {
      await deleteTransaction(transactionToDelete.id);
      setIsDeleteModalOpen(false);
      setTransactionToDelete(null);
    } catch (err) {
      // Optionally show error
    }
  };

  // Handle edit submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionToEdit || !currentAccount) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await updateTransaction({
        id: transactionToEdit.id,
        data: {
          account_id: currentAccount.id,
          type: form.type,
          amount: Number(form.amount),
          currency_id: currentAccount.currency.id,
          description: form.description,
          date: form.date,
          category_id: form.category_id || undefined,
          tag_ids: form.tag_ids.length ? form.tag_ids : undefined,
          is_recurring: transactionToEdit.is_recurring,
          is_archived: transactionToEdit.is_archived,
        },
      });
      setIsModalOpen(false);
      setTransactionToEdit(null);
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to update transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle account delete
  const handleDeleteAccount = async () => {
    if (!currentAccount) return;
    setIsDeletingAccount(true);
    setDeleteAccountError(null);
    try {
      await deleteAccount(currentAccount.id);
      setIsDeleteAccountModalOpen(false);
      navigate({ to: '/dashboard' });
    } catch (err: any) {
      setDeleteAccountError(err?.message || 'Failed to delete account');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);

  if (isAccountLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (accountError || transactionsError) {
    const errorMsg = (accountError instanceof Error ? accountError.message : accountError) || (transactionsError instanceof Error ? transactionsError.message : transactionsError);
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-red-400">
            {errorMsg}
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
          <div className="ml-auto flex items-center">
            <button
              className="p-2 rounded-full hover:bg-red-700 focus:outline-none"
              title="Delete Account"
              onClick={() => setIsDeleteAccountModalOpen(true)}
            >
              <TrashIcon className="h-6 w-6 text-red-400" />
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-[#232b3b] rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Transactions</h2>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              onClick={() => {
                setTransactionToEdit(null);
                setIsModalOpen(true);
              }}
            >
              Add Transaction
            </button>
          </div>

          {/* Transaction Modal (Create/Edit) */}
          <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setTransactionToEdit(null); }}>
            <h3 className="font-bold text-xl text-center mb-6 text-white">
              {transactionToEdit ? 'Edit Transaction' : 'Add Transaction'}
            </h3>
            <form onSubmit={transactionToEdit ? handleEditSubmit : handleSubmit} className="space-y-5">
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
                  {/* Dropdown */}
                  {showCategoryDropdown && isModalOpen && (
                    <div className="absolute left-0 right-0 mt-1 bg-[#232b3b] border border-gray-700 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      {isLoadingCategories ? (
                        <div className="p-2 text-gray-400 text-center">Loading...</div>
                      ) : (
                        <>
                          {categories.map((c: Category) => (
                            <div
                              key={c.id}
                              className={`px-4 py-2 cursor-pointer hover:bg-indigo-600 ${form.category_id === c.id ? 'bg-indigo-700 text-white' : 'text-gray-200'}`}
                              onClick={() => {
                                setForm(f => ({ ...f, category_id: c.id }));
                                setCategorySearch('');
                                setShowCategoryDropdown(false);
                              }}
                            >
                              {c.name}
                            </div>
                          ))}
                          {/* Add new option if not found in backend results and user has typed */}
                          {categorySearch.trim() && !categories.some((c: Category) => c.name.toLowerCase() === categorySearch.toLowerCase()) && (
                            <div
                              className="px-4 py-2 cursor-pointer text-indigo-400 hover:bg-indigo-700"
                              onClick={handleAddCategory}
                            >
                              + Add "{categorySearch}"
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  {/* Show selected category as chip */}
                  {form.category_id && (
                    <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-indigo-700 text-white text-xs">
                      {categories.find((c: Category) => c.id === form.category_id)?.name || 'Selected'}
                      <button
                        type="button"
                        className="ml-2 text-white hover:text-gray-300"
                        onClick={() => setForm(f => ({ ...f, category_id: '' }))}
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
                  {/* Dropdown */}
                  {showTagDropdown && isModalOpen && (
                    <div className="absolute left-0 right-0 mt-1 bg-[#232b3b] border border-gray-700 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      {isLoadingTags ? (
                        <div className="p-2 text-gray-400 text-center">Loading...</div>
                      ) : (
                        <>
                          {tags.map((t: Tag) => (
                            <div
                              key={t.id}
                              className={`px-4 py-2 cursor-pointer hover:bg-indigo-600 ${form.tag_ids.includes(t.id) ? 'bg-indigo-700 text-white' : 'text-gray-200'}`}
                              onClick={() => {
                                if (!form.tag_ids.includes(t.id)) {
                                  setForm(f => ({ ...f, tag_ids: [...f.tag_ids, t.id] }));
                                }
                                setTagSearch('');
                                setShowTagDropdown(false);
                              }}
                            >
                              {t.name}
                            </div>
                          ))}
                          {/* Add new option if not found in backend results and user has typed */}
                          {tagSearch.trim() && !tags.some((t: Tag) => t.name.toLowerCase() === tagSearch.toLowerCase()) && (
                            <div
                              className="px-4 py-2 cursor-pointer text-indigo-400 hover:bg-indigo-700"
                              onClick={handleAddTag}
                            >
                              + Add "{tagSearch}"
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  {/* Show selected tags as chips */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {form.tag_ids.map(tagId => {
                      const tag = tags.find((t: Tag) => t.id === tagId);
                      return (
                        <span key={tagId} className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-700 text-white text-xs">
                          {tag?.name || 'Tag'}
                          <button
                            type="button"
                            className="ml-2 text-white hover:text-gray-300"
                            onClick={() => setForm(f => ({ ...f, tag_ids: f.tag_ids.filter(id => id !== tagId) }))}
                          >
                            &times;
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
              {submitError && <div className="text-red-400 text-sm text-center">{submitError}</div>}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="btn btn-ghost px-6 py-2 rounded-lg text-gray-300 hover:text-white"
                  onClick={() => { setIsModalOpen(false); setTransactionToEdit(null); }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn px-6 py-2 rounded-lg bg-indigo-500 border-none text-white font-semibold hover:bg-indigo-600 shadow-md"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (transactionToEdit ? 'Updating...' : 'Adding...') : (transactionToEdit ? 'Update' : 'Save')}
                </button>
              </div>
            </form>
          </Modal>

          {/* Delete Confirmation Modal */}
          <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
            <div className="text-center">
              <TrashIcon className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Delete Transaction?</h3>
              <p className="text-gray-300 mb-6">Are you sure you want to delete this transaction? This action cannot be undone.</p>
              <div className="flex justify-center gap-4">
                <button
                  className="btn btn-ghost px-6 py-2 rounded-lg text-gray-300 hover:text-white"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn px-6 py-2 rounded-lg bg-red-600 border-none text-white font-semibold hover:bg-red-700 shadow-md"
                  onClick={handleDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </Modal>

          {/* Delete Account Modal */}
          <Modal isOpen={isDeleteAccountModalOpen} onClose={() => setIsDeleteAccountModalOpen(false)}>
            <div className="text-center">
              <TrashIcon className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Delete Account?</h3>
              <p className="text-gray-300 mb-4">
                Deleting this account will <span className="text-red-400 font-semibold">permanently delete all transactions</span> associated with it. This action cannot be undone.
              </p>
              {deleteAccountError && <div className="text-red-400 mb-2">{deleteAccountError}</div>}
              <div className="flex justify-center gap-4">
                <button
                  className="btn btn-ghost px-6 py-2 rounded-lg text-gray-300 hover:text-white"
                  onClick={() => setIsDeleteAccountModalOpen(false)}
                  disabled={isDeletingAccount}
                >
                  Cancel
                </button>
                <button
                  className="btn px-6 py-2 rounded-lg bg-red-600 border-none text-white font-semibold hover:bg-red-700 shadow-md"
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount}
                >
                  {isDeletingAccount ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
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
                    <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">Actions</th>
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
                      <td className="px-6 py-4 text-center flex gap-2 justify-center">
                        <button
                          className="p-1 rounded hover:bg-indigo-700"
                          onClick={() => openEditModal(transaction)}
                          title="Edit"
                        >
                          <PencilSquareIcon className="h-5 w-5 text-indigo-400" />
                        </button>
                        <button
                          className="p-1 rounded hover:bg-red-700"
                          onClick={() => openDeleteModal(transaction)}
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
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AccountDetailsPage; 