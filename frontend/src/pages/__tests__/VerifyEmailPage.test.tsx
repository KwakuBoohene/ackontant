import { render, screen, fireEvent } from '@testing-library/react';
import VerifyEmailPage from '../auth/VerifyEmailPage';
import PageLayout from '../../layouts/PageLayout';
import "@testing-library/jest-dom";

describe('VerifyEmailPage', () => {
  it('renders verification message', () => {
    render(
      <PageLayout>
        <VerifyEmailPage />
      </PageLayout>
    );
    expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
    expect(screen.getByText(/verification link has been sent/i)).toBeInTheDocument();
  });

  it('allows resending verification email', async () => {
    render(
      <PageLayout>
        <VerifyEmailPage />
      </PageLayout>
    );
    fireEvent.click(screen.getByRole('button', { name: /resend verification email/i }));
    expect(await screen.findByText(/verification email resent/i)).toBeInTheDocument();
  });
}); 