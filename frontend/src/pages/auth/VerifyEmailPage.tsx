import React, { useState } from 'react';
import PageLayout from '../../components/PageLayout';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResend = () => {
    setLoading(true);
    setStatus('success');
    setMessage('Verification email resent. Please check your inbox.');
    setLoading(false);
  };

  return (
    <PageLayout>
      <div className="bg-white/10 rounded-xl shadow-lg p-8 w-full max-w-md text-center">
        <h2 className="text-2xl font-bold text-white mb-6">Verify your email</h2>
        {status === 'pending' && (
          <>
            <p className="text-white mb-4">A verification link has been sent to your email address.</p>
            <button
              onClick={handleResend}
              className="px-6 py-3 rounded bg-[#FFB32C] text-[#23223A] font-bold hover:bg-[#F15A99] hover:text-white transition"
              disabled={loading}
            >
              {loading ? 'Resending...' : 'Resend Verification Email'}
            </button>
          </>
        )}
        {status === 'success' && <div className="text-green-400 mb-4">{message}</div>}
        {status === 'error' && <div className="text-red-400 mb-4">{message}</div>}
      </div>
    </PageLayout>
  );
} 