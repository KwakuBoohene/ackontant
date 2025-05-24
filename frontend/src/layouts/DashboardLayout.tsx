import React from 'react';
import ackontantLogo from '../assets/icons/logos/logo-ackontant.svg';
import UserDropdown from '../components/UserDropdown';

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex min-h-screen">
      <aside className="w-[220px] bg-[#181f2a] text-white min-h-screen flex flex-col items-center p-8">
        <img 
          src={ackontantLogo} 
          alt="Ackontant Logo" 
          className="w-12 h-12 mb-6"
        />
        <nav className="w-full mt-8 flex flex-col gap-4">
          <a 
            href="/dashboard" 
            className="text-white no-underline font-medium text-base px-4 py-2 rounded-lg transition-colors hover:bg-[#263043]"
          >
            Dashboard
          </a>
          <a 
            href="#" 
            className="text-white no-underline font-medium text-base px-4 py-2 rounded-lg transition-colors hover:bg-[#263043]"
          >
            Wallets
          </a>
          <a 
            href="#" 
            className="text-white no-underline font-medium text-base px-4 py-2 rounded-lg transition-colors hover:bg-[#263043]"
          >
            Transactions
          </a>
          <a 
            href="#" 
            className="text-white no-underline font-medium text-base px-4 py-2 rounded-lg transition-colors hover:bg-[#263043]"
          >
            Reports
          </a>
        </nav>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center px-8 justify-end">
          <UserDropdown />
        </header>
        <main className="flex-1 bg-[#f7f9fb] p-8 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 