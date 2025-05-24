import { render, screen, fireEvent } from '@testing-library/react';
import ResetPasswordPage from '../auth/ResetPasswordPage';
import PageLayout from '../../components/PageLayout';
import "@testing-library/jest-dom";

describe('ResetPasswordPage', () => {
  it('renders reset password form', () => {
    render(
      <PageLayout>
        <ResetPasswordPage />
      </PageLayout>
    );
    expect(screen.getByPlaceholderText(/new password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/confirm new password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  });

  it('shows success message after resetting password', async () => {
    render(
      <PageLayout>
        <ResetPasswordPage />
      </PageLayout>
    );
    fireEvent.change(screen.getByPlaceholderText(/new password/i), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByPlaceholderText(/confirm new password/i), { target: { value: 'newpass123' } });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    expect(await screen.findByText(/your password has been reset/i)).toBeInTheDocument();
  });
}); 