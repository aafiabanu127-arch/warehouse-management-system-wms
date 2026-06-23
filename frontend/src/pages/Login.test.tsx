import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';
import * as AuthContext from '../context/AuthContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function mockAuth(overrides = {}) {
  vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  });
}

describe('Login page', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('renders username and password fields and a submit button', () => {
    mockAuth();
    render(<MemoryRouter><Login /></MemoryRouter>);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in|log in|login/i })).toBeInTheDocument();
  });

  it('calls login with entered credentials on submit', async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    mockAuth({ login });
    render(<MemoryRouter><Login /></MemoryRouter>);

    await userEvent.type(screen.getByLabelText(/username/i), 'admin');
    await userEvent.type(screen.getByLabelText(/password/i), 'pass123');
    await userEvent.click(screen.getByRole('button', { name: /sign in|log in|login/i }));

    await waitFor(() => expect(login).toHaveBeenCalledWith('admin', 'pass123'));
  });

  it('shows an error message when login fails', async () => {
    const login = vi.fn().mockRejectedValue(new Error('invalid'));
    mockAuth({ login });
    render(<MemoryRouter><Login /></MemoryRouter>);

    await userEvent.type(screen.getByLabelText(/username/i), 'wrong');
    await userEvent.type(screen.getByLabelText(/password/i), 'bad');
    await userEvent.click(screen.getByRole('button', { name: /sign in|log in|login/i }));

    await waitFor(() =>
      expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument()
    );
  });

  it('redirects to dashboard after successful login', async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    mockAuth({ login });
    render(<MemoryRouter><Login /></MemoryRouter>);

    await userEvent.type(screen.getByLabelText(/username/i), 'admin');
    await userEvent.type(screen.getByLabelText(/password/i), 'pass123');
    await userEvent.click(screen.getByRole('button', { name: /sign in|log in|login/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'));
  });
});