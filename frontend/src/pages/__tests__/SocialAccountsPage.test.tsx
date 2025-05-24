import { render, screen, fireEvent } from '@testing-library/react';
import SocialAccountsPage from '../auth/SocialAccountsPage';
import PageLayout from '../../components/PageLayout';
import "@testing-library/jest-dom";

describe('SocialAccountsPage', () => {
  it('renders social accounts list', () => {
    render(
      <PageLayout>
        <SocialAccountsPage />
      </PageLayout>
    );
    expect(screen.getByText(/social accounts/i)).toBeInTheDocument();
    expect(screen.getByText(/google/i)).toBeInTheDocument();
    expect(screen.getByText(/facebook/i)).toBeInTheDocument();
    expect(screen.getByText(/github/i)).toBeInTheDocument();
    expect(screen.getByText(/apple/i)).toBeInTheDocument();
  });

  it('allows connecting a social account', async () => {
    render(
      <PageLayout>
        <SocialAccountsPage />
      </PageLayout>
    );
    const connectButtons = screen.getAllByText(/connect/i);
    fireEvent.click(connectButtons[1]); // Click connect for Facebook
    expect(await screen.findByText(/connecting/i)).toBeInTheDocument();
  });
}); 