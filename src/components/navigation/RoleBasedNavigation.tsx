'use client';

import { useAuth } from '@/components/providers/AuthProvider';

export function RoleBasedNavigation() {
  const { user, isInitializing } = useAuth();

  if (isInitializing || !user) {
    return null;
  }

  // We're not showing any navigation items here anymore
  return null;
} 