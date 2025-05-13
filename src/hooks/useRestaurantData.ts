'use client';

import { useQuery } from '@tanstack/react-query';
import { restaurantApi } from '@/api/restaurant';
import { useApiError } from '@/components/providers/ApiErrorProvider';
import { usePathname } from 'next/navigation';

export function useRestaurantData() {
  const { setConnectionError } = useApiError();
  const pathname = usePathname();
  
  // Check if we're on an auth page (login or signup ONLY) - use exact path matching
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  
  // Check if user is logged in
  const isLoggedIn = typeof window !== 'undefined' && localStorage.getItem('loggedIn') === 'true';
  
  // Log current state for debugging
  if (typeof window !== 'undefined') {
    console.log('useRestaurantData - current path:', pathname);
    console.log('useRestaurantData - isAuthPage:', isAuthPage);
    console.log('useRestaurantData - isLoggedIn:', isLoggedIn);
  }
  
  // Only fetch data if we're not on an auth page and we're logged in
  const enabled = !isAuthPage && isLoggedIn;

  return useQuery({
    queryKey: ['restaurants'],
    queryFn: async () => {
      try {
        console.log('Fetching restaurants data via useRestaurantData hook');
        const restaurants = await restaurantApi.getMyRestaurants();
        console.log('useRestaurantData: Got', restaurants.length, 'restaurants');
        
        // If we have restaurants, update localStorage flags
        if (restaurants.length > 0) {
          localStorage.setItem('hasRestaurants', 'true');
          // If we don't have a current restaurant set, use the first one
          if (!localStorage.getItem('currentRestaurantId')) {
            localStorage.setItem('currentRestaurantId', restaurants[0].id);
          }
        } else {
          // Clear flags if no restaurants were found
          console.log('No restaurants found, clearing localStorage flags');
          localStorage.removeItem('hasRestaurants');
          localStorage.removeItem('currentRestaurantId');
        }
        
        return {
          restaurants,
          hasRestaurants: restaurants.length > 0,
        };
      } catch (error: unknown) {
        console.error('Error fetching restaurants:', error);
        
        // Check for network errors
        if (error instanceof Error && (error.message === 'Network Error' || error.message === 'ECONNABORTED')) {
          setConnectionError(true);
        }
        
        throw error;
      }
    },
    enabled,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    // Reduced staleTime to ensure more frequent refreshes in production
    staleTime: 30000, // 30 seconds
    // Set a reasonable cache time
    gcTime: 5 * 60 * 1000, // 5 minutes
    // Ensure we refetch when the component is remounted
    refetchOnMount: true
  });
} 