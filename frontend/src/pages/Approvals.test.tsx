import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Approvals from './Approvals';
import * as AuthContext from '../context/AuthContext';
import apiClient from '../api/client';

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

function mockRole(role: string) {
  vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
    user: { id: 1, username: 'u', email: 'u@u.com', role, phone: '', department: '' },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  });
}

const mockTransfer = {
  id: 1, product: 1, from_inventory: 1, to_inventory: 2,
  quantity: 10, status: 'PENDING', requested_by: 2,
  reviewed_by: null, reason: 'Restock', reviewed_at: null,
  created_at: '2024-01-01T00:00:00Z',
};

const mockAdjustment = {
  id: 2, inventory: 1, adjustment_type: 'ADD',
  requested_quantity: 5, reason: 'Found items',
  status: 'PENDING', requested_by: 2,
  reviewed_by: null, reviewed_at: null,
  created_at: '2024-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.mocked(apiClient.get).mockImplementation((url: string) => {
    if (url.includes('transfer')) return Promise.resolve({ data: { results: [mockTransfer] } });
    return Promise.resolve({ data: { results: [mockAdjustment] } });
  });
  vi.mocked(apiClient.post).mockResolvedValue({ data: {} });
});

describe('Approvals page', () => {
  it('loads and displays pending transfer count', async () => {
    mockRole('ADMIN');
    render(<Approvals />);
    await waitFor(() => expect(screen.getByText('Pending Transfers')).toBeInTheDocument());
    const counts = screen.getAllByText('1');
    expect(counts.length).toBeGreaterThan(0);
  });

  it('SUPERVISOR sees Approve and Reject buttons', async () => {
    mockRole('SUPERVISOR');
    render(<Approvals />);
    await waitFor(() => expect(screen.getByText('Approve')).toBeInTheDocument());
    expect(screen.getByText('Reject')).toBeInTheDocument();
  });

  it('STAFF sees Awaiting approval instead of action buttons', async () => {
    mockRole('STAFF');
    render(<Approvals />);
    await waitFor(() => expect(screen.getByText('Awaiting approval')).toBeInTheDocument());
    expect(screen.queryByText('Approve')).not.toBeInTheDocument();
  });

  it('AUDITOR sees Awaiting approval and no action buttons', async () => {
    mockRole('AUDITOR');
    render(<Approvals />);
    await waitFor(() => expect(screen.getByText('Awaiting approval')).toBeInTheDocument());
    expect(screen.queryByText('Approve')).not.toBeInTheDocument();
  });

  it('clicking Approve calls the correct API endpoint', async () => {
    mockRole('ADMIN');
    render(<Approvals />);
    await waitFor(() => expect(screen.getByText('Approve')).toBeInTheDocument());
    await userEvent.click(screen.getByText('Approve'));
    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith('/inventory/transfer-requests/1/approve/')
    );
  });
});