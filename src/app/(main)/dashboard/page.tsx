'use client';

import { useEffect, useState } from 'react';

import { NonAdminOnly } from '@/components/auth/RoleBasedAccess';
import { useAuth } from '@/components/providers/AuthProvider';
import ReservationStats from '@/components/dashboard/ReservationStats';
import { useRestaurantData } from '@/hooks/useRestaurantData';

export default function DashboardPage() {
  const { user, userRole, isInitializing, refreshUserData } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Use our new hook to fetch restaurant data
  // We're not using the data directly here, but the hook is still needed
  // for the RestaurantProvider to work properly
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
  // useEffect(() => {
  //   const hasRestaurants = restaurantData?.hasRestaurants;
    
  //   console.log('Redirect check - hasRestaurants:', hasRestaurants, 'isRedirecting:', isRedirecting, 'redirectAttempts:', redirectAttempts);
    
  //   // Only redirect if we haven't already tried too many times (prevent infinite loops)
  //   if (userRole === 'USER' && hasRestaurants === false && !isRedirecting && redirectAttempts < 2) {
  //     console.log('Redirecting to onboarding page...');
  //     setIsRedirecting(true);
  //     setRedirectAttempts(prev => prev + 1);
  //     router.push('/onboarding');
  //   } else if (redirectAttempts >= 2) {
  //     console.log('Too many redirect attempts, showing dashboard anyway');
  //   }
  // }, [userRole, restaurantData, router, isRedirecting, redirectAttempts]);

  if (isInitializing || isRefreshing) {
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
  // if (isRedirecting) {
  //   return <div className="p-8">Redirecting to onboarding...</div>;
  // }

  return (
    <div className="p-8">
      {/* Non-admin content */}
      <NonAdminOnly>
        {/* Reservation Statistics */}
        <div className="bg-white rounded-lg">
          <ReservationStats />
        </div>
      </NonAdminOnly>
    </div>
  );
} 