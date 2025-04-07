'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, memo } from 'react';

import RootLoading from '@/app/loading';

import { useAuth } from './AuthProvider';

// Component to render when on the unauthorized page - memoized to prevent re-renders
const UnauthorizedContent = memo(({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
});

UnauthorizedContent.displayName = 'UnauthorizedContent';

// Component to handle normal auth flow - memoized to prevent re-renders
const AuthContent = memo(({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isInitializing, user, userRole } = useAuth();
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    if (!isInitializing) {
      const isAuthPage = pathname === '/login' || pathname === '/signup';
      const isAdminPage = pathname.startsWith('/admin');
      
      // Check if we're coming from the unauthorized page to the login page
      const comingFromUnauthorized = typeof window !== 'undefined' && 
        sessionStorage.getItem('comingFromUnauthorized') === 'true';
      
      // If we're coming from unauthorized to login, allow access without a user
      if (comingFromUnauthorized && pathname === '/login') {
        sessionStorage.removeItem('comingFromUnauthorized');
        setIsReady(true);
        return;
      }
      
      if (!user && !isAuthPage) {
        router.replace('/login');
      } else if (user && isAuthPage) {
        router.replace('/');
      } else if (user && userRole === 'ADMIN' && pathname === '/') {
        // Redirect admin users from home page to clients page
        router.replace('/admin/clients');
      } else if (user && userRole !== 'ADMIN' && isAdminPage) {
        // Redirect non-admin users from admin pages to dashboard
        router.replace('/dashboard');
      } else {
        setIsReady(true); // Only allow rendering after checking auth
      }
    }
  }, [isInitializing, user, pathname, router, userRole]);
  
  if (isInitializing || !isReady) {
    return <RootLoading />;
  }

  return <>{children}</>;
});

AuthContent.displayName = 'AuthContent';

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isUnauthorizedPage, setIsUnauthorizedPage] = useState(false);
  
  // Check if we're on the unauthorized page - do this once on mount
  useEffect(() => {
    const checkUnauthorizedPage = () => {
      const isUnauthorized = pathname === '/unauthorized' || 
        (typeof window !== 'undefined' && sessionStorage.getItem('onUnauthorizedPage') === 'true');
      setIsUnauthorizedPage(isUnauthorized);
    };
    
    checkUnauthorizedPage();
  }, [pathname]);
  
  // Show a simple loading state until we determine if we're on the unauthorized page
  if (pathname === '/unauthorized') {
    return <UnauthorizedContent>{children}</UnauthorizedContent>;
  }
  
  // Render different components based on path
  if (isUnauthorizedPage) {
    return <UnauthorizedContent>{children}</UnauthorizedContent>;
  }
  
  return <AuthContent>{children}</AuthContent>;
}
