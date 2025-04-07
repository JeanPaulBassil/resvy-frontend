'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

/**
 * Component for protecting routes based on user roles
 * @param children - Content to show if user has allowed role
 * @param allowedRoles - Array of roles that can access the route
 * @param redirectTo - Path to redirect to if user doesn't have allowed role
 */
export function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = '/dashboard',
}: ProtectedRouteProps) {
  const { user, userRole, isInitializing } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If authentication is still initializing, wait
    if (isInitializing) return;

    // If user is not authenticated, redirect to login
    if (!user) {
      router.replace('/login');
      return;
    }

    // If user doesn't have an allowed role, redirect
    if (!userRole || !allowedRoles.includes(userRole)) {
      router.replace(redirectTo);
    }
  }, [user, userRole, isInitializing, allowedRoles, redirectTo, router]);

  // While initializing or if user doesn't have allowed role, don't render anything
  if (isInitializing || !user || !userRole || !allowedRoles.includes(userRole)) {
    return null;
  }

  // If user has allowed role, render the children
  return <>{children}</>;
}

/**
 * Component for protecting admin-only routes
 */
export function AdminRoute({ children, redirectTo = '/dashboard' }: Omit<ProtectedRouteProps, 'allowedRoles'>) {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']} redirectTo={redirectTo}>
      {children}
    </ProtectedRoute>
  );
} 