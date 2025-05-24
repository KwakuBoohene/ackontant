import React, { useState } from 'react';
import type { LoginFormData, AuthError } from '../../types/auth';
import PageLayout from '../../components/PageLayout';

export default function LoginPage() {
  const [form, setForm] = useState<LoginFormData>({ email: '', password: '' });
  const [error, setError] = useState<AuthError | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError({ code: 'INVALID', message: 'Invalid credentials' });
    setLoading(false);
  };

  return (
    <PageLayout>
      <div className="bg-white/10 rounded-xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Sign in to Ackontant</h2>
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
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="px-4 py-3 rounded bg-white/80 text-[#23223A] focus:outline-none"
            required
          />
          <button
            type="submit"
            className="w-full py-3 rounded bg-[#FFB32C] text-[#23223A] font-bold hover:bg-[#F15A99] hover:text-white transition"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="flex justify-between mt-4 text-sm">
          <a href="/auth/forgot-password" className="text-[#FFB32C] hover:underline">Forgot password?</a>
          <a href="/auth/register" className="text-[#FFB32C] hover:underline">Create account</a>
        </div>
      </div>
    </PageLayout>
  );
} 