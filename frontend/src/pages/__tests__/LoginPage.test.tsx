import { render, screen, fireEvent } from '@testing-library/react';
import LoginPage from '../../pages/auth/LoginPage';
import PageLayout from '../../components/PageLayout';
import "@testing-library/jest-dom";

describe('LoginPage', () => {
  it('renders login form', () => {
    render(
      <PageLayout>
        <LoginPage />
      </PageLayout>
    );
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows error on invalid login', async () => {
    render(
      <PageLayout>
        <LoginPage />
      </PageLayout>
    );
    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });
}); 