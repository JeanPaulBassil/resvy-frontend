'use client';

import { useQuery } from '@tanstack/react-query';
import { restaurantApi } from '@/api/restaurant';
import { useApiError } from '@/components/providers/ApiErrorProvider';
import { usePathname } from 'next/navigation';

export function useRestaurantData() {
  const { setConnectionError } = useApiError();
  const pathname = usePathname();
  
  // Check if we're on an auth page or not logged in
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isLoggedIn = typeof window !== 'undefined' && localStorage.getItem('loggedIn') === 'true';
  
  // Only fetch data if we're not on an auth page and we're logged in
  const enabled = !isAuthPage && isLoggedIn;

  return useQuery({
    queryKey: ['restaurants'],
    queryFn: async () => {
      try {
        const restaurants = await restaurantApi.getMyRestaurants();
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
  });
} 