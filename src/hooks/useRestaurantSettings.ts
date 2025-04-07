import { restaurantApi, UpdateRestaurantDto } from '@/api/restaurant';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/contexts/ToastContext';
import { useRestaurant } from '@/components/providers/RestaurantProvider';

// Create hook for restaurant settings operations
export const useRestaurantSettings = () => {
  const toast = useToast();
  const { currentRestaurant, refetchRestaurants } = useRestaurant();

  // Get the restaurant ID
  const restaurantId = currentRestaurant?.id || '';

  // Update restaurant mutation
  const updateRestaurantMutation = useMutation({
    mutationFn: (data: UpdateRestaurantDto) => 
      restaurantApi.updateRestaurant(restaurantId, data),
    onSuccess: async () => {
      // Refetch restaurants to update the list and current restaurant
      await refetchRestaurants();
      toast.success('Restaurant updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update restaurant: ${error.message}`);
    },
  });

  // Delete restaurant mutation
  const deleteRestaurantMutation = useMutation({
    mutationFn: () => restaurantApi.deleteRestaurant(restaurantId),
    onSuccess: async () => {
      await refetchRestaurants();
      toast.success('Restaurant deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete restaurant: ${error.message}`);
    },
  });

  return {
    updateRestaurant: updateRestaurantMutation.mutate,
    updateRestaurantAsync: updateRestaurantMutation.mutateAsync,
    isUpdating: updateRestaurantMutation.isPending,
    updateError: updateRestaurantMutation.error,
    
    deleteRestaurant: deleteRestaurantMutation.mutate,
    deleteRestaurantAsync: deleteRestaurantMutation.mutateAsync,
    isDeleting: deleteRestaurantMutation.isPending,
    deleteError: deleteRestaurantMutation.error,
  };
}; 