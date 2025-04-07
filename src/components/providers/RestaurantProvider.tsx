import { Restaurant } from '@/api/restaurant';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import React, { createContext, ReactNode, useContext, useEffect, useState, useMemo } from 'react';

interface RestaurantContextType {
  restaurants: Restaurant[];
  currentRestaurant: Restaurant | null;
  setCurrentRestaurant: (restaurant: Restaurant) => void;
  isLoading: boolean;
  error: string | null;
  refetchRestaurants: () => Promise<void>;
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
  const { data, isLoading, error, refetch } = useRestaurantData();
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);

  // Get the restaurants array from the data
  const restaurants = useMemo(() => data?.restaurants || [], [data?.restaurants]);

  // Set current restaurant when restaurants data changes
  useEffect(() => {
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
  }, [restaurants, currentRestaurant]);

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
  };

  return <RestaurantContext.Provider value={value}>{children}</RestaurantContext.Provider>;
};
