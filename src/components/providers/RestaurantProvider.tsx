import { CreateRestaurantDto, Restaurant, restaurantApi } from '@/api/restaurant';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import React, { createContext, ReactNode, useContext, useEffect, useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';

interface RestaurantContextType {
  restaurants: Restaurant[];
  currentRestaurant: Restaurant | null;
  setCurrentRestaurant: (restaurant: Restaurant) => void;
  isLoading: boolean;
  error: string | null;
  refetchRestaurants: () => Promise<void>;
  addRestaurant: (data: CreateRestaurantDto) => Promise<Restaurant>;
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
  
  // Use exact path matching for auth pages
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  
  // Check logged in state
  const isLoggedIn = typeof window !== 'undefined' && localStorage.getItem('loggedIn') === 'true';
  
  // Log current state for debugging
  if (typeof window !== 'undefined') {
    console.log('RestaurantProvider - current path:', pathname);
    console.log('RestaurantProvider - isAuthPage:', isAuthPage);
    console.log('RestaurantProvider - isLoggedIn:', isLoggedIn);
  }
  
  // Only fetch restaurant data if we're on a non-auth page and logged in
  const shouldFetchData = !isAuthPage && isLoggedIn;
  
  const { data, isLoading, error, refetch } = useRestaurantData();
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);

  // Get the restaurants array from the data
  const restaurants = useMemo(() => data?.restaurants || [], [data?.restaurants]);

  // Create restaurant mutation
  const createRestaurantMutation = useMutation({
    mutationFn: (data: CreateRestaurantDto) => restaurantApi.createRestaurant(data)
  });

  // Add restaurant function
  const addRestaurant = async (data: CreateRestaurantDto): Promise<Restaurant> => {
    try {
      console.log('Creating new restaurant:', data.name);
      const newRestaurant = await createRestaurantMutation.mutateAsync(data);
      console.log('Restaurant created successfully:', newRestaurant.id);
      
      // Set flags in localStorage immediately
      localStorage.setItem('hasRestaurants', 'true');
      localStorage.setItem('currentRestaurantId', newRestaurant.id);
      
      // Set the current restaurant in state
      handleSetCurrentRestaurant(newRestaurant);
      
      // Force an immediate refresh of the restaurant data
      await refetch();
      
      // Update the local restaurants array to include the new restaurant
      // This helps in case the refetch doesn't immediately update the state
      const updatedRestaurants = [...restaurants, newRestaurant];
      
      console.log('Restaurant creation completed. Total restaurants:', updatedRestaurants.length);
      
      return newRestaurant;
    } catch (error) {
      console.error('Error creating restaurant:', error);
      throw error;
    }
  };

  // Only update current restaurant if we should fetch data
  useEffect(() => {
    if (!shouldFetchData) return;
    
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
  }, [restaurants, currentRestaurant, shouldFetchData]);

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
  };

  return <RestaurantContext.Provider value={value}>{children}</RestaurantContext.Provider>;
};
