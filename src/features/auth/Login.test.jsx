import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';

const mockUseAuthStore = vi.fn();
vi.mock('../../store/authStore', () => ({
  useAuthStore: () => mockUseAuthStore(),
}));

describe('Login', () => {
  beforeEach(() => {
    mockUseAuthStore.mockReturnValue({
      login: vi.fn().mockResolvedValue({ success: false }),
      isLoading: false,
      error: null,
      clearError: vi.fn(),
    });
  });

  it('renders login form with email and password fields', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders error message when error is present', () => {
    mockUseAuthStore.mockReturnValue({
      login: vi.fn(),
      isLoading: false,
      error: 'Invalid credentials',
      clearError: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });
});
