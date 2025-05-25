import React, { useState } from 'react';
import type { PasswordResetData, AuthError } from '../../types/auth';
import PageLayout from '../../layouts/PageLayout';

export default function ResetPasswordPage() {
  const [form, setForm] = useState<PasswordResetData>({ email: '', password: '', token: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<AuthError | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // TODO: Get token from query string
  // For now, leave as empty string

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== confirmPassword) {
      setError({ code: 'MISMATCH', message: 'Passwords do not match' });
      return;
    }
    setLoading(true);
    setSuccess(true);
    setLoading(false);
  };

  return (
    <PageLayout>
      <div className="bg-white/10 rounded-xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Reset your password</h2>
        {success ? (
          <div className="mb-4 text-green-400 text-center">
            Your password has been reset. You can now <a href="/auth/login" className="underline text-[#FFB32C]">sign in</a>.
          </div>
        ) : (
          <>
            {error && <div className="mb-4 text-red-400 text-center">{error.message}</div>}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="password"
                name="password"
                placeholder="New Password"
                value={form.password || ''}
                onChange={handleChange}
                className="px-4 py-3 rounded bg-white/80 text-[#23223A] focus:outline-none"
                required
              />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={handleConfirmChange}
                className="px-4 py-3 rounded bg-white/80 text-[#23223A] focus:outline-none"
                required
              />
              <button
                type="submit"
                className="w-full py-3 rounded bg-[#FFB32C] text-[#23223A] font-bold hover:bg-[#F15A99] hover:text-white transition"
                disabled={loading}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </PageLayout>
  );
} 