import { render, screen, fireEvent } from '@testing-library/react';
import ForgotPasswordPage from '../auth/ForgotPasswordPage';
import PageLayout from '../../layouts/PageLayout';
import "@testing-library/jest-dom";

describe('ForgotPasswordPage', () => {
  it('renders forgot password form', () => {
    render(
      <PageLayout>
        <ForgotPasswordPage />
      </PageLayout>
    );
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('shows success message after submitting form', async () => {
    render(
      <PageLayout>
        <ForgotPasswordPage />
      </PageLayout>
    );
    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));
    expect(await screen.findByText(/if an account exists/i)).toBeInTheDocument();
  });
}); 