import React from 'react';
import logoAckontant from '../assets/icons/logos/logo-ackontant.svg';

interface PageLayoutProps {
  children: React.ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#23223A] px-4">
      <img
        src={logoAckontant}
        alt="Ackontant Logo"
        className="w-16 h-16 mb-6 drop-shadow-lg mt-8"
        style={{ borderRadius: '50%' }}
      />
      {children}
    </div>
  );
} 