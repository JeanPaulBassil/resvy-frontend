'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { NonAdminOnly } from '@/components/auth/RoleBasedAccess';
import ReservationStats from '@/components/dashboard/ReservationStats';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRestaurant } from '@/components/providers/RestaurantProvider';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import PageHeader from '@/components/shared/PageHeader';

export default function DashboardPage() {
  const { user, userRole, isInitializing, refreshUserData } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectAttempts, setRedirectAttempts] = useState(0);

  // Access the restaurant data to check if user has restaurants
  const { hasRestaurants, isLoading: isLoadingRestaurant } = useRestaurant();

  // Also use our data hook to ensure restaurant provider has data
  useRestaurantData();

  // Automatically fetch user data if authenticated but no role
  useEffect(() => {
    const fetchRoleIfMissing = async () => {
      if (user && !userRole && !isRefreshing) {
        setIsRefreshing(true);
        await refreshUserData();
        setIsRefreshing(false);
      }
    };

    fetchRoleIfMissing();
  }, [user, userRole, refreshUserData, isRefreshing]);

  // Handle redirect to onboarding if user has no restaurants
  useEffect(() => {
    // Check if any modals are currently open by looking for modal overlays in the DOM
    const hasOpenModals = () => {
      const modalOverlays = document.querySelectorAll('[data-overlay="true"]');
      const modalBackdrops = document.querySelectorAll('.fixed.inset-0');
      const ariaModal = document.querySelectorAll('[role="dialog"]');
      return modalOverlays.length > 0 || modalBackdrops.length > 0 || ariaModal.length > 0;
    };

    // Only proceed if we have user data and restaurant data is done loading
    if (!isInitializing && !isLoadingRestaurant && user && userRole === 'USER') {
      console.log('Dashboard redirect check - user:', user.uid);
      console.log('Dashboard redirect check - loggedIn status:', localStorage.getItem('loggedIn'));
      console.log(
        'Dashboard redirect check - hasCreatedRestaurant:',
        localStorage.getItem('hasCreatedRestaurant')
      );
      console.log(
        'Dashboard redirect check - hasRestaurants:',
        hasRestaurants,
        'isRedirecting:',
        isRedirecting
      );

      // Check if modals are open before attempting to redirect
      const modalsOpen = hasOpenModals();
      console.log('Dashboard redirect check - modals open:', modalsOpen);

      // Only redirect if we haven't already tried too many times (prevent infinite loops)
      // AND no modals are currently open
      if (hasRestaurants === false && !isRedirecting && redirectAttempts < 2 && !modalsOpen) {
        console.log('User has no restaurants, redirecting to onboarding page...');
        setIsRedirecting(true);
        setRedirectAttempts((prev) => prev + 1);
        router.push('/onboarding');
      } else if (redirectAttempts >= 2) {
        console.log('Too many redirect attempts, showing dashboard anyway');
      } else if (modalsOpen) {
        console.log('Modals are open, skipping redirect to prevent modal close');
      }
    }
  }, [
    hasRestaurants,
    isInitializing,
    isLoadingRestaurant,
    isRedirecting,
    redirectAttempts,
    router,
    user,
    userRole,
  ]);

  if (isInitializing || isRefreshing || isLoadingRestaurant) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-gray-500">Setting up your dashboard</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="p-8">Please log in to access the dashboard.</div>;
  }

  // Show a message while redirecting
  if (isRedirecting) {
    return <div className="p-8">Redirecting to onboarding...</div>;
  }

  return (
    <div className="p-8">
      {/* Non-admin content */}
      <NonAdminOnly>
        <PageHeader 
          title="Dashboard" 
          subtitle="Overview of your restaurant's performance" 
          showRestaurant={true}
        />
        
        {/* Reservation Statistics */}
        <div className="bg-white rounded-lg">
          <ReservationStats />
        </div>
      </NonAdminOnly>
    </div>
  );
}
