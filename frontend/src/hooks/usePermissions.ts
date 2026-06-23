import { useAuth } from '../context/AuthContext';

const ROLE_LEVEL: Record<string, number> = {
  ADMIN:      6,
  MANAGER:    5,
  SUPERVISOR: 4,
  STAFF:      3,
  PICKER:     2,
  AUDITOR:    1,
  VIEWER:     0,
};

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role ?? '';
  const level = ROLE_LEVEL[role] ?? 0;

  return {
    // Nav visibility
    canViewUsers:         level >= 5,   // ADMIN, MANAGER
    canViewApprovals:     level >= 3,   // ADMIN, MANAGER, SUPERVISOR, STAFF
    canViewReports:       level >= 1,   // AUDITOR and above
    canViewAnalytics:     level >= 2,   // PICKER and above

    // CRUD permissions
    canEditWarehouses:     level >= 5,  // ADMIN, MANAGER
    canEditZones:          level >= 5,
    canEditRacks:          level >= 5,
    canEditShelves:        level >= 5,
    canEditCategories:     level >= 5,
    canEditProducts:       level >= 5,
    canEditInventory:      level >= 3,  // ADMIN, MANAGER, SUPERVISOR, STAFF
    canEditStockMovements: level >= 2,  // ADMIN..PICKER
    canApproveRequests:    level >= 4,  // ADMIN, MANAGER, SUPERVISOR
    canDeleteAny:          level >= 5,  // ADMIN, MANAGER

    isReadOnly: role === 'AUDITOR' || role === 'VIEWER',
    role,
    level,
  };
}