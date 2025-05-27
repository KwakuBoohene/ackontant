import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar } from 'recharts';
import { useAuthStore } from '../stores/authStore';
import { useNavigate, Link } from '@tanstack/react-router';
import UserDropdown from '../components/UserDropdown';
import CreateAccountModal from '../components/modals/CreateAccountModal';
import { formatCurrency } from '../utils/currency';
import type { Account } from '@/types/accounts';
import { useAccounts } from '../hooks/useAccounts';
import AccountCard from '../components/dashboard/AccountCard';
import EmptyState from '../components/dashboard/EmptyState';
import LoadingState from '../components/dashboard/LoadingState';
import ErrorState from '../components/dashboard/ErrorState';

// Sample data for charts
const balanceData = [
  { date: 'May 01', balance: 180000 },
  { date: 'May 05', balance: 210000 },
  { date: 'May 10', balance: 200000 },
  { date: 'May 15', balance: 195000 },
  { date: 'May 20', balance: 187000 },
  { date: 'May 25', balance: 187500 },
  { date: 'May 31', balance: 187917 },
];

const incomeExpenseData = [
  { date: 'May 01', income: 7000, expense: 2000 },
  { date: 'May 05', income: 12000, expense: 4000 },
  { date: 'May 10', income: 8000, expense: 3000 },
  { date: 'May 15', income: 6000, expense: 5000 },
  { date: 'May 20', income: 9000, expense: 7000 },
  { date: 'May 25', income: 11000, expense: 6000 },
  { date: 'May 31', income: 13000, expense: 8000 },
];

const spendingCategories = [
  { name: 'Food', value: 4000 },
  { name: 'Rent', value: 7000 },
  { name: 'Transport', value: 2000 },
  { name: 'Entertainment', value: 1500 },
  { name: 'Other', value: 1000 },
];
const COLORS = ['#4f8cff', '#34c759', '#ff9500', '#ff3b30', '#8884d8'];

const savingsProgress = [
  { name: 'Saved', value: 65 },
  { name: 'Remaining', value: 35 },
];

const wallets = [
  { name: 'Chase Checking', balance: 12450.23, currency: 'USD' },
  { name: 'Barclays Savings', balance: 9876.54, currency: 'GBP' },
  { name: 'Ecobank Main', balance: 23456.78, currency: 'GHS' },
  { name: 'N26 Euro Account', balance: 3120.00, currency: 'EUR' },
  { name: 'Cash Wallet', balance: 450.00, currency: 'USD' },
  { name: 'MTN Mobile Money', balance: 1200.00, currency: 'GHS' },
  { name: 'Al Rajhi Bank', balance: 5000.00, currency: 'SAR' },
  { name: 'PayPal', balance: 320.50, currency: 'USD' },
  { name: 'Apple Cash', balance: 75.00, currency: 'USD' },
  { name: 'Crypto Wallet', balance: 0.45, currency: 'BTC' },
  { name: 'FNB ZAR Account', balance: 8000.00, currency: 'ZAR' },
  { name: 'Revolut', balance: 2100.00, currency: 'EUR' },
];

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/auth/login' });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;
  return <>{children}</>;
};

const DashboardPage: React.FC = () => {
  const { data: accounts = [], isLoading, error } = useAccounts();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white">Accounts</h1>
        {accounts.length > 0 && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark"
          >
            Add Account
          </button>
        )}
      </div>

      {accounts.length === 0 ? (
        <EmptyState onCreateClick={() => setIsCreateModalOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}

      <CreateAccountModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </DashboardLayout>
  );
};

export default (props: any) => (
  <ProtectedRoute>
    <DashboardPage {...props} />
  </ProtectedRoute>
); 