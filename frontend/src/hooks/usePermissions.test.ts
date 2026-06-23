import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermissions } from './usePermissions';
import * as AuthContext from '../context/AuthContext';

function mockRole(role: string) {
  vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
    user: { id: 1, username: 'testuser', email: 'test@test.com', role, phone: '', department: '' },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  });
}

describe('usePermissions', () => {
  it('ADMIN has full access', () => {
    mockRole('ADMIN');
    const { result } = renderHook(() => usePermissions());
    expect(result.current.canEditProducts).toBe(true);
    expect(result.current.canEditInventory).toBe(true);
    expect(result.current.canApproveRequests).toBe(true);
    expect(result.current.canViewUsers).toBe(true);
    expect(result.current.canDeleteAny).toBe(true);
    expect(result.current.isReadOnly).toBe(false);
  });

  it('MANAGER can edit products and approve but not delete', () => {
    mockRole('MANAGER');
    const { result } = renderHook(() => usePermissions());
    expect(result.current.canEditProducts).toBe(true);
    expect(result.current.canApproveRequests).toBe(true);
    expect(result.current.canViewUsers).toBe(true);
    expect(result.current.canDeleteAny).toBe(true);
    expect(result.current.isReadOnly).toBe(false);
  });

  it('SUPERVISOR can approve but cannot edit products or manage users', () => {
    mockRole('SUPERVISOR');
    const { result } = renderHook(() => usePermissions());
    expect(result.current.canApproveRequests).toBe(true);
    expect(result.current.canEditInventory).toBe(true);
    expect(result.current.canEditProducts).toBe(false);
    expect(result.current.canViewUsers).toBe(false);
    expect(result.current.canDeleteAny).toBe(false);
  });

  it('STAFF can edit inventory and stock movements but not approve', () => {
    mockRole('STAFF');
    const { result } = renderHook(() => usePermissions());
    expect(result.current.canEditInventory).toBe(true);
    expect(result.current.canEditStockMovements).toBe(true);
    expect(result.current.canApproveRequests).toBe(false);
    expect(result.current.canEditProducts).toBe(false);
  });

  it('PICKER can only edit stock movements', () => {
    mockRole('PICKER');
    const { result } = renderHook(() => usePermissions());
    expect(result.current.canEditStockMovements).toBe(true);
    expect(result.current.canEditInventory).toBe(false);
    expect(result.current.canApproveRequests).toBe(false);
    expect(result.current.canViewApprovals).toBe(false);
  });

  it('AUDITOR is read-only and can view reports', () => {
    mockRole('AUDITOR');
    const { result } = renderHook(() => usePermissions());
    expect(result.current.isReadOnly).toBe(true);
    expect(result.current.canViewReports).toBe(true);
    expect(result.current.canEditInventory).toBe(false);
    expect(result.current.canViewApprovals).toBe(false);
  });

  it('VIEWER has no edit or report access', () => {
    mockRole('VIEWER');
    const { result } = renderHook(() => usePermissions());
    expect(result.current.isReadOnly).toBe(true);
    expect(result.current.canViewReports).toBe(false);
    expect(result.current.canEditProducts).toBe(false);
    expect(result.current.canViewUsers).toBe(false);
  });
});