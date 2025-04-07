'use client';

import { ReactNode } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';

interface RoleBasedAccessProps {
  children: ReactNode;
  allowedRoles: string[];
  fallback?: ReactNode;
}

/**
 * Component for role-based access control
 * @param children - Content to show if user has allowed role
 * @param allowedRoles - Array of roles that can access the content
 * @param fallback - Optional content to show if user doesn't have allowed role
 */
export function RoleBasedAccess({
  children,
  allowedRoles,
  fallback = null,
}: RoleBasedAccessProps) {
  const { userRole, isInitializing } = useAuth();

  // While initializing, don't render anything
  if (isInitializing) {
    return null;
  }

  // If user has one of the allowed roles, show the children
  if (userRole && allowedRoles.includes(userRole)) {
    return <>{children}</>;
  }

  // Otherwise show the fallback content (or null)
  return <>{fallback}</>;
}

/**
 * Component that only renders content for admin users
 */
export function AdminOnly({ children, fallback = null }: Omit<RoleBasedAccessProps, 'allowedRoles'>) {
  return (
    <RoleBasedAccess allowedRoles={['ADMIN']} fallback={fallback}>
      {children}
    </RoleBasedAccess>
  );
}

/**
 * Component that only renders content for non-admin users
 */
export function NonAdminOnly({ children, fallback = null }: Omit<RoleBasedAccessProps, 'allowedRoles'>) {
  const { userRole, isInitializing } = useAuth();

  // While initializing, don't render anything
  if (isInitializing) {
    return null;
  }

  // If user is not an admin, show the children
  if (userRole && userRole !== 'ADMIN') {
    return <>{children}</>;
  }

  // Otherwise show the fallback content (or null)
  return <>{fallback}</>;
} 