import { CreateRestaurantDto, Restaurant, restaurantApi } from '@/api/restaurant';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import React, { createContext, ReactNode, useContext, useEffect, useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface RestaurantContextType {
  restaurants: Restaurant[];
  currentRestaurant: Restaurant | null;
  setCurrentRestaurant: (restaurant: Restaurant) => void;
  isLoading: boolean;
  error: string | null;
  refetchRestaurants: () => Promise<void>;
  addRestaurant: (data: CreateRestaurantDto) => Promise<Restaurant>;
  hasRestaurants: boolean;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};

export const RestaurantProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isLoggedIn = typeof window !== 'undefined' && localStorage.getItem('loggedIn') === 'true';
  
  // Only fetch restaurant data if we're on a non-auth page and logged in
  const shouldFetchData = !isAuthPage && isLoggedIn;
  
  const { data, isLoading, error, refetch } = useRestaurantData();
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);
  const [manuallySetRestaurant, setManuallySetRestaurant] = useState<Restaurant | null>(null);
  const queryClient = useQueryClient();

  // Get the restaurants array from the data
  const restaurants = useMemo(() => data?.restaurants || [], [data?.restaurants]);
  const hasRestaurants = useMemo(() => {
    // If we have manually set a restaurant (e.g. after creation but before cache updates)
    // then we definitely have restaurants
    if (manuallySetRestaurant) return true;
    
    // Check localStorage for the hasCreatedRestaurant flag as a backup
    // This helps when the user has created a restaurant but the API cache hasn't updated yet
    const hasCreatedRestaurantFlag = typeof window !== 'undefined' && 
      localStorage.getItem('hasCreatedRestaurant') === 'true';
    
    if (hasCreatedRestaurantFlag) return true;
    
    // Otherwise check the data
    return data?.hasRestaurants || false;
  }, [data?.hasRestaurants, manuallySetRestaurant]);

  // Create restaurant mutation
  const createRestaurantMutation = useMutation({
    mutationFn: (data: CreateRestaurantDto) => restaurantApi.createRestaurant(data),
    onSuccess: () => {
      // Invalidate the restaurants query to force a refetch
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    }
  });

  // Add restaurant function
  const addRestaurant = async (data: CreateRestaurantDto): Promise<Restaurant> => {
    const newRestaurant = await createRestaurantMutation.mutateAsync(data);
    
    // Set it as the manually created restaurant to handle state before cache updates
    setManuallySetRestaurant(newRestaurant);
    
    // If this is the first restaurant or there's no current one, set it as current
    if (restaurants.length === 0 || !currentRestaurant) {
      handleSetCurrentRestaurant(newRestaurant);
    }
    
    // Also force a refetch
    await refetch();
    
    return newRestaurant;
  };

  // Only update current restaurant if we should fetch data
  useEffect(() => {
    if (!shouldFetchData) return;
    
    // If we have a manually set restaurant and our cache has updated with restaurants
    // then we can clear the manual flag since it's in the official cache now
    if (manuallySetRestaurant && restaurants.length > 0) {
      setManuallySetRestaurant(null);
    }
    
    if (restaurants.length > 0 && !currentRestaurant) {
      // Check if we have a saved restaurant ID in localStorage
      const savedRestaurantId = localStorage.getItem('currentRestaurantId');

      if (savedRestaurantId) {
        const savedRestaurant = restaurants.find((r: Restaurant) => r.id === savedRestaurantId);
        if (savedRestaurant) {
          setCurrentRestaurant(savedRestaurant);
        } else {
          setCurrentRestaurant(restaurants[0]);
          localStorage.setItem('currentRestaurantId', restaurants[0].id);
        }
      } else {
        setCurrentRestaurant(restaurants[0]);
        localStorage.setItem('currentRestaurantId', restaurants[0].id);
      }
    }
  }, [restaurants, currentRestaurant, shouldFetchData, manuallySetRestaurant]);

  // Update localStorage when current restaurant changes
  const handleSetCurrentRestaurant = (restaurant: Restaurant) => {
    setCurrentRestaurant(restaurant);
    localStorage.setItem('currentRestaurantId', restaurant.id);
  };

  // Wrap refetch in a function that returns void
  const refetchRestaurants = async () => {
    await refetch();
  };

  const value: RestaurantContextType = {
    restaurants,
    currentRestaurant,
    setCurrentRestaurant: handleSetCurrentRestaurant,
    isLoading,
    error: error ? String(error) : null,
    refetchRestaurants,
    addRestaurant,
    hasRestaurants,
  };

  return <RestaurantContext.Provider value={value}>{children}</RestaurantContext.Provider>;
};
