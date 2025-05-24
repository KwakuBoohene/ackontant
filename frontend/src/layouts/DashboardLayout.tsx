import React from 'react';
import ackontantLogo from '../assets/icons/logos/logo-ackontant.svg';

const sidebarStyle: React.CSSProperties = {
  width: 220,
  background: '#181f2a',
  color: '#fff',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '2rem 1rem',
  boxSizing: 'border-box',
};

const logoStyle: React.CSSProperties = {
  width: 48,
  height: 48,
  marginBottom: 24,
};

const navStyle: React.CSSProperties = {
  width: '100%',
  marginTop: 32,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const navItemStyle: React.CSSProperties = {
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 500,
  fontSize: 16,
  padding: '8px 16px',
  borderRadius: 8,
  transition: 'background 0.2s',
};

const activeNavItemStyle: React.CSSProperties = {
  background: '#263043',
};

const topBarStyle: React.CSSProperties = {
  height: 64,
  background: '#fff',
  borderBottom: '1px solid #eee',
  display: 'flex',
  alignItems: 'center',
  padding: '0 2rem',
  justifyContent: 'flex-end',
};

const mainContentStyle: React.CSSProperties = {
  flex: 1,
  background: '#f7f9fb',
  padding: '2rem',
  minHeight: 'calc(100vh - 64px)',
};

const layoutStyle: React.CSSProperties = {
  display: 'flex',
  minHeight: '100vh',
};

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div style={layoutStyle}>
      <aside style={sidebarStyle}>
        <img src={ackontantLogo} alt="Ackontant Logo" style={logoStyle} />
        <nav style={navStyle}>
          <a href="/dashboard" style={navItemStyle}>Dashboard</a>
          <a href="#" style={navItemStyle}>Wallets</a>
          <a href="#" style={navItemStyle}>Transactions</a>
          <a href="#" style={navItemStyle}>Reports</a>
        </nav>
      </aside>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={topBarStyle}>
          {/* Placeholder for user info, notifications, etc. */}
          <span style={{ color: '#333', fontWeight: 500 }}>Welcome, User</span>
        </header>
        <main style={mainContentStyle}>{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout; 