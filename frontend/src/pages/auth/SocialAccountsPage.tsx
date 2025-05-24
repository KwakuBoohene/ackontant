import React, { useState } from 'react';
import type { SocialAccount, SocialProvider } from '../../types/auth';
import PageLayout from '../../components/PageLayout';

const allProviders: SocialProvider[] = ['GOOGLE', 'FACEBOOK', 'GITHUB', 'APPLE'];

const initialAccounts: SocialAccount[] = [
  { provider: 'GOOGLE', providerUserId: '123', email: 'user@gmail.com', isConnected: true },
  { provider: 'FACEBOOK', providerUserId: '', email: '', isConnected: false },
  { provider: 'GITHUB', providerUserId: '', email: '', isConnected: false },
  { provider: 'APPLE', providerUserId: '', email: '', isConnected: false },
];

export default function SocialAccountsPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>(initialAccounts);
  const [loading, setLoading] = useState<SocialProvider | null>(null);

  const handleConnect = (provider: SocialProvider) => {
    setLoading(provider);
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.provider === provider ? { ...acc, isConnected: true, email: 'user@example.com', providerUserId: 'mockid' } : acc
      )
    );
    setLoading(null);
  };

  const handleDisconnect = (provider: SocialProvider) => {
    setLoading(provider);
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.provider === provider ? { ...acc, isConnected: false, email: '', providerUserId: '' } : acc
      )
    );
    setLoading(null);
  };

  return (
    <PageLayout>
      <div className="bg-white/10 rounded-xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Social Accounts</h2>
        <div className="flex flex-col gap-4">
          {accounts.map((acc) => (
            <div key={acc.provider} className="flex items-center justify-between bg-white/20 rounded p-3">
              <div className="flex items-center gap-3">
                {/* Placeholder icon */}
                <span className="text-xl font-bold text-[#23223A] bg-white/80 rounded-full w-8 h-8 flex items-center justify-center">
                  {acc.provider[0]}
                </span>
                <span className="text-white font-semibold">{acc.provider}</span>
                {acc.isConnected && <span className="text-green-400 text-xs ml-2">Connected</span>}
              </div>
              {acc.isConnected ? (
                <button
                  onClick={() => handleDisconnect(acc.provider)}
                  className="px-4 py-2 rounded bg-[#F15A99] text-white font-bold hover:bg-[#FFB32C] hover:text-[#23223A] transition text-sm"
                  disabled={loading === acc.provider}
                >
                  {loading === acc.provider ? 'Disconnecting...' : 'Disconnect'}
                </button>
              ) : (
                <button
                  onClick={() => handleConnect(acc.provider)}
                  className="px-4 py-2 rounded bg-[#FFB32C] text-[#23223A] font-bold hover:bg-[#F15A99] hover:text-white transition text-sm"
                  disabled={loading === acc.provider}
                >
                  {loading === acc.provider ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
} 