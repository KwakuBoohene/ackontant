import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from '@tanstack/react-router';

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
  const { isAuthenticated } = useAuth();
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
  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 32 }}>
        {wallets.map((wallet, idx) => (
          <div key={idx} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #0001', padding: 20, minWidth: 200, flex: '1 0 200px' }}>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{wallet.name}</div>
            <div style={{ color: '#34c759', fontWeight: 700, fontSize: 20, marginTop: 8 }}>
              {wallet.balance.toLocaleString()} {wallet.currency}
            </div>
          </div>
        ))}
      </div>
      <h2 style={{ margin: '32px 0 16px 0' }}>Overview</h2>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 32 }}>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #0001', padding: 24, flex: 1, minWidth: 320 }}>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>Account Balance</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={balanceData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="balance" stroke="#4f8cff" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #0001', padding: 24, flex: 1, minWidth: 320 }}>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>Income & Expenses</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={incomeExpenseData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="income" fill="#34c759" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" fill="#ff3b30" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #0001', padding: 24, flex: 1, minWidth: 320 }}>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>Spending by Category</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={spendingCategories} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                {spendingCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #0001', padding: 24, flex: 1, minWidth: 320 }}>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>Savings Progress</div>
          <ResponsiveContainer width="100%" height={220}>
            <RadialBarChart cx="50%" cy="50%" innerRadius={60} outerRadius={90} barSize={18} data={savingsProgress} startAngle={90} endAngle={-270} >
              <RadialBar background dataKey="value" cornerRadius={10} >
                {savingsProgress.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </RadialBar>
              <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
              <Tooltip />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default (props: any) => (
  <ProtectedRoute>
    <DashboardPage {...props} />
  </ProtectedRoute>
); 