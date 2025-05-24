import React, { useState } from 'react';
import type { PasswordResetData, AuthError } from '../../types/auth';
import PageLayout from '../../components/PageLayout';

export default function ForgotPasswordPage() {
  const [form, setForm] = useState<PasswordResetData>({ email: '' });
  const [error, setError] = useState<AuthError | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Call forgot password API
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1000);
  };

  return (
    <PageLayout>
      <div className="bg-white/10 rounded-xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Forgot your password?</h2>
        {sent ? (
          <div className="mb-4 text-green-400 text-center">
            If an account exists for this email, a reset link has been sent.
          </div>
        ) : (
          <>
            {error && <div className="mb-4 text-red-400 text-center">{error.message}</div>}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                className="px-4 py-3 rounded bg-white/80 text-[#23223A] focus:outline-none"
                required
              />
              <button
                type="submit"
                className="w-full py-3 rounded bg-[#FFB32C] text-[#23223A] font-bold hover:bg-[#F15A99] hover:text-white transition"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}
        <div className="flex justify-center mt-4 text-sm">
          <a href="/auth/login" className="text-[#FFB32C] hover:underline">Back to login</a>
        </div>
      </div>
    </PageLayout>
  );
} 