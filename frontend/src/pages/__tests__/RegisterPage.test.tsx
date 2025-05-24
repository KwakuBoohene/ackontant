import { render, screen, fireEvent } from '@testing-library/react';
import RegisterPage from '../auth/RegisterPage';
import PageLayout from '../../components/PageLayout';
import "@testing-library/jest-dom";

describe('RegisterPage', () => {
  it('renders registration form', () => {
    render(
      <PageLayout>
        <RegisterPage />
      </PageLayout>
    );
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows error on failed registration', async () => {
    render(
      <PageLayout>
        <RegisterPage />
      </PageLayout>
    );
    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText(/registration failed/i)).toBeInTheDocument();
  });
}); 