/**
 * RBAC (Role-Based Access Control) utilities
 * Ported from Web: Apartment01/src/lib/rbac.ts — keep in sync.
 */

export type UserRole = 'user' | 'collaborator' | 'admin' | 'landlord';

export type Permission =
  | 'view_full_address'
  | 'view_commission'
  | 'manage_apartments'
  | 'approve_collaborators'
  | 'view_analytics'
  | 'manage_notifications'
  | 'submit_apartments';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: [],
  collaborator: ['view_commission'],
  landlord: ['submit_apartments'],
  admin: [
    'view_full_address',
    'view_commission',
    'manage_apartments',
    'approve_collaborators',
    'view_analytics',
    'manage_notifications',
    'submit_apartments',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function hasRole(
  role: UserRole | null | undefined,
  targetRole: UserRole,
): boolean {
  return role === targetRole;
}

export function hasMinimumRole(
  role: UserRole | null | undefined,
  minRequiredRole: UserRole,
): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    user: 0,
    collaborator: 1,
    landlord: 1,
    admin: 2,
  };

  if (!role) return false;
  return roleHierarchy[role] >= roleHierarchy[minRequiredRole];
}

export function isAdmin(role: UserRole | null | undefined): boolean {
  return role === 'admin';
}

export function isCollaborator(role: UserRole | null | undefined): boolean {
  return role === 'collaborator';
}

export function isRegularUser(role: UserRole | null | undefined): boolean {
  return role === 'user';
}

export function isLandlord(role: UserRole | null | undefined): boolean {
  return role === 'landlord';
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    user: 'Khách hàng',
    collaborator: 'Cộng tác viên',
    landlord: 'Chủ nhà',
    admin: 'Quản trị viên',
  };
  return labels[role];
}

/** Normalize Firestore role string into a known UserRole (default: user). */
export function normalizeUserRole(
  role: string | null | undefined,
): UserRole {
  if (
    role === 'user' ||
    role === 'collaborator' ||
    role === 'admin' ||
    role === 'landlord'
  ) {
    return role;
  }
  return 'user';
}
