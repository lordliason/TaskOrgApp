import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from './Layout';

const mockUseAuthStore = vi.fn();
vi.mock('../store/authStore', () => ({
  useAuthStore: () => mockUseAuthStore(),
}));

describe('Layout', () => {
  beforeEach(() => {
    mockUseAuthStore.mockReturnValue({
      profile: { display_name: 'Test User' },
      organization: { name: 'Test Org' },
      logout: vi.fn().mockResolvedValue(undefined),
    });
  });

  it('renders organization name', () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );
    expect(screen.getByText('Test Org')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument();
  });

  it('renders fallback app name when organization is null', () => {
    mockUseAuthStore.mockReturnValue({
      profile: { display_name: 'Test User' },
      organization: null,
      logout: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );
    expect(screen.getByText('TaskOrgApp')).toBeInTheDocument();
  });
});
