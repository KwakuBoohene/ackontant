import { render, screen } from '@testing-library/react';
import LandingPage from '../LandingPage';
import "@testing-library/jest-dom";

// Mock the useNavigate hook
jest.mock('@tanstack/react-router', () => ({
  useNavigate: () => jest.fn(),
}));

describe('LandingPage', () => {
  it('renders landing page content', () => {
    render(<LandingPage />);
    
    // Check main sections
    expect(screen.getByText(/accounting for akonta/i)).toBeInTheDocument();
    expect(screen.getByText(/manage, track, and understand your finances/i)).toBeInTheDocument();
    expect(screen.getByText(/features our users love/i)).toBeInTheDocument();
    expect(screen.getByText(/why people use ackontant/i)).toBeInTheDocument();
    
    // Check features
    expect(screen.getByText(/all accounts in one place/i)).toBeInTheDocument();
    expect(screen.getByText(/smart budgets/i)).toBeInTheDocument();
    expect(screen.getByText(/insightful analytics/i)).toBeInTheDocument();
    expect(screen.getByText(/secure & private/i)).toBeInTheDocument();
    
    // Check CTA buttons
    expect(screen.getAllByText(/get started/i)).toHaveLength(2);
  });

  it('renders testimonials', () => {
    render(<LandingPage />);
    expect(screen.getByText(/roy/i)).toBeInTheDocument();
    expect(screen.getByText(/harnet/i)).toBeInTheDocument();
    expect(screen.getByText(/paolo/i)).toBeInTheDocument();
  });
}); 