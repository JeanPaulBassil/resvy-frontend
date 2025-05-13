'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { NonAdminOnly } from '@/components/auth/RoleBasedAccess';
import { useAuth } from '@/components/providers/AuthProvider';
import ReservationStats from '@/components/dashboard/ReservationStats';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { useRestaurant } from '@/components/providers/RestaurantProvider';

export default function DashboardPage() {
  const { user, userRole, isInitializing, refreshUserData } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectAttempts, setRedirectAttempts] = useState(0);
  
  // Use our hooks to fetch restaurant data
  useRestaurantData();
  const { restaurants, isLoading: isLoadingRestaurants } = useRestaurant();

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
    // Only proceed if we've finished loading both user and restaurant data
    if (isInitializing || isLoadingRestaurants || isRedirecting) {
      return;
    }
    
    console.log('Redirect check - restaurants:', restaurants.length, 'isRedirecting:', isRedirecting, 'redirectAttempts:', redirectAttempts);
    
    // Check localStorage for restaurant data (fallback)
    const hasRestaurantsInStorage = localStorage.getItem('hasRestaurants') === 'true';
    const currentRestaurantId = localStorage.getItem('currentRestaurantId');
    
    console.log('localStorage check - hasRestaurants:', hasRestaurantsInStorage, 'currentRestaurantId:', currentRestaurantId);
    
    // Only redirect if we haven't already tried too many times (prevent infinite loops)
    // AND we don't have restaurants in React state OR localStorage
    const noRestaurants = restaurants.length === 0 && !hasRestaurantsInStorage;
    
    if (userRole === 'USER' && noRestaurants && !isRedirecting && redirectAttempts < 2) {
      console.log('No restaurants found in state or localStorage, redirecting to onboarding page...');
      setIsRedirecting(true);
      setRedirectAttempts(prev => prev + 1);
      router.push('/onboarding');
    } else if (redirectAttempts >= 2) {
      console.log('Too many redirect attempts, showing dashboard anyway');
    } else if (hasRestaurantsInStorage && currentRestaurantId) {
      console.log('Found restaurant data in localStorage, staying on dashboard');
    }
  }, [userRole, restaurants, router, isRedirecting, redirectAttempts, isInitializing, isLoadingRestaurants]);

  if (isInitializing || isRefreshing || isLoadingRestaurants) {
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
        {/* Reservation Statistics */}
        <div className="bg-white rounded-lg">
          <ReservationStats />
        </div>
      </NonAdminOnly>
    </div>
  );
} 