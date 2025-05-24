import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import logoAckontant from '../assets/icons/logos/logo-ackontant.svg';

const colors = {
  yellow: '#FFB32C',
  blue: '#2A4D7A',
  green: '#7AC143',
  pink: '#F15A99',
  cyan: '#4EC6E0',
};

const features = [
  {
    title: 'All Accounts in One Place',
    description: 'Connect your bank, e-wallets, and crypto for a complete overview.',
    icon: '💳',
  },
  {
    title: 'Smart Budgets',
    description: 'Set budgets and track your spending to reach your goals.',
    icon: '📊',
  },
  {
    title: 'Insightful Analytics',
    description: 'Visualize your cash flow and understand your financial habits.',
    icon: '📈',
  },
  {
    title: 'Secure & Private',
    description: 'Your data is encrypted and protected with industry standards.',
    icon: '🔒',
  },
];

const testimonials = [
  {
    quote: 'Ackontant makes it super easy to control my money and develop healthy spending habits.',
    name: 'Roy',
  },
  {
    quote: 'I love the simplicity and intuitive design. I always know where my money goes.',
    name: 'Harnet',
  },
  {
    quote: 'The cross-platform sync keeps me in control of my finances everywhere.',
    name: 'Paolo',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#23223A] flex flex-col">
      {/* Hero Section */}
      <header className="flex flex-col items-center justify-center py-16 px-4 text-center bg-[#23223A]">
        <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight">Accounting for Akonta</h1>
        <p className="text-xl text-[#FFB32C] mb-8 max-w-2xl mx-auto font-medium">
          Manage, track, and understand your finances with Ackontant. All your accounts, budgets, and insights in one beautiful app.
        </p>
        <button
          className="px-10 py-4 rounded-full text-lg font-bold shadow-lg transition bg-[#FFB32C] text-[#23223A] hover:bg-[#F15A99] hover:text-white mb-4"
          onClick={() => navigate({ to: '/auth/register' })}
        >
          Get Started
        </button>
        <div className="flex gap-3 mt-4">
          <span className="w-4 h-4 rounded-full" style={{ background: colors.pink }} />
          <span className="w-4 h-4 rounded-full" style={{ background: colors.blue }} />
          <span className="w-4 h-4 rounded-full" style={{ background: colors.cyan }} />
          <span className="w-4 h-4 rounded-full" style={{ background: colors.green }} />
          <span className="w-4 h-4 rounded-full" style={{ background: colors.yellow }} />
        </div>
      </header>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white/5 flex flex-col items-center">
        <h2 className="text-3xl font-bold text-white mb-8">Features Our Users Love</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
          {features.map((feature) => (
            <div key={feature.title} className="bg-[#23223A] border border-[#FFB32C] rounded-xl p-6 flex items-start gap-4 shadow-md">
              <span className="text-3xl">{feature.icon}</span>
              <div>
                <h3 className="text-xl font-semibold text-white mb-1">{feature.title}</h3>
                <p className="text-[#FFB32C]">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4 flex flex-col items-center bg-[#2A4D7A]">
        <h2 className="text-3xl font-bold text-white mb-8">Why People Use Ackontant</h2>
        <div className="flex flex-col md:flex-row gap-8 max-w-4xl w-full justify-center">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-white/10 rounded-xl p-6 shadow-lg flex-1">
              <p className="text-lg text-white italic mb-4">“{t.quote}”</p>
              <p className="text-[#FFB32C] font-bold">{t.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action Footer */}
      <footer className="py-10 flex flex-col items-center bg-[#23223A] border-t border-[#FFB32C] mt-auto">
        <h3 className="text-2xl font-bold text-white mb-2">Ready to take control of your finances?</h3>
        <button
          className="px-8 py-3 rounded-full text-lg font-semibold shadow-md transition bg-[#FFB32C] text-[#23223A] hover:bg-[#F15A99] hover:text-white"
          onClick={() => navigate({ to: '/auth/register' })}
        >
          Get Started
        </button>
      </footer>
    </div>
  );
} 