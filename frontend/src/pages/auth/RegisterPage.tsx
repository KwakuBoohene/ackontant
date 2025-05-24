import React, { useState } from 'react';
import type { RegisterFormData, AuthError } from '../../types/auth';
import PageLayout from '../../components/PageLayout';

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [error, setError] = useState<AuthError | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError({ code: 'INVALID', message: 'Registration failed' });
    setLoading(false);
  };

  return (
    <PageLayout>
      <div className="bg-white/10 rounded-xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Create your Ackontant account</h2>
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
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={handleChange}
            className="px-4 py-3 rounded bg-white/80 text-[#23223A] focus:outline-none"
            required
          />
          <label className="flex items-center gap-2 text-white text-sm">
            <input
              type="checkbox"
              name="acceptTerms"
              checked={form.acceptTerms}
              onChange={handleChange}
              required
            />
            I accept the <a href="#" className="text-[#FFB32C] underline">terms and conditions</a>
          </label>
          <button
            type="submit"
            className="w-full py-3 rounded bg-[#FFB32C] text-[#23223A] font-bold hover:bg-[#F15A99] hover:text-white transition"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <div className="flex justify-center mt-4 text-sm">
          <a href="/auth/login" className="text-[#FFB32C] hover:underline">Already have an account? Sign in</a>
        </div>
      </div>
    </PageLayout>
  );
} 