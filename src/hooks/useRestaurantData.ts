'use client';

import { useQuery } from '@tanstack/react-query';
import { restaurantApi } from '@/api/restaurant';
import { useApiError } from '@/components/providers/ApiErrorProvider';

export function useRestaurantData() {
  const { setConnectionError } = useApiError();

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
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
} 