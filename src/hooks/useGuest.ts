import { CreateGuestDto, Guest, guestApi, UpdateGuestDto } from '@/api/guest';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import useAppMutation from './useAppMutation';

// Query keys for React Query
export const guestKeys = {
  all: ['guests'] as const,
  lists: () => [...guestKeys.all, 'list'] as const,
  list: (restaurantId: string) => [...guestKeys.lists(), restaurantId] as const,
  details: () => [...guestKeys.all, 'detail'] as const,
  detail: (guestId: string, restaurantId: string) =>
    [...guestKeys.details(), guestId, restaurantId] as const,
};

// Hook for fetching all guests for a restaurant
export const useGuests = (restaurantId: string) => {
  return useQuery({
    queryKey: guestKeys.list(restaurantId),
    queryFn: () => {
        console.log("Hellos i ram!");
        return guestApi.getGuests(restaurantId);
    },
    enabled: !!restaurantId,
  });
};

// Hook for fetching a single guest
export const useGuest = (guestId: string, restaurantId: string) => {
  return useQuery({
    queryKey: guestKeys.detail(guestId, restaurantId),
    queryFn: () => guestApi.getGuest(restaurantId, guestId),
    enabled: !!guestId && !!restaurantId,
  });
};

// Hook for creating a guest
export const useCreateGuest = (restaurantId: string) => {
  return useAppMutation<Guest, CreateGuestDto>({
    mutationFn: (data) => guestApi.createGuest(restaurantId, data),
    queryKey: guestKeys.list(restaurantId),
    successMessage: 'Guest created successfully',
    errorMessage: (error) => `Failed to create guest: ${error.message}`,
  });
};

// Hook for updating a guest
export const useUpdateGuest = (guestId: string, restaurantId: string) => {
  const queryClient = useQueryClient();

  return useAppMutation<Guest, UpdateGuestDto, Guest>({
    mutationFn: (data) => guestApi.updateGuest(restaurantId, guestId, data),
    queryKey: guestKeys.list(restaurantId),
    successMessage: 'Guest updated successfully',
    errorMessage: (error) => `Failed to update guest: ${error.message}`,
    onSuccessCallback: (updatedGuest) => {
      // Update the guest in the cache
      queryClient.setQueryData(guestKeys.detail(guestId, restaurantId), updatedGuest);
    },
    optimisticUpdate: {
      type: 'update',
      matchItem: (item) => item.id === guestId,
      data: (variables) => variables,
    },
    additionalInvalidateQueries: [guestKeys.detail(guestId, restaurantId)],
  });
};

// Hook for deleting a guest
export const useDeleteGuest = (restaurantId: string) => {
  return useAppMutation<Guest, string>({
    mutationFn: (guestId) => guestApi.deleteGuest(restaurantId, guestId),
    queryKey: guestKeys.list(restaurantId),
    successMessage: 'Guest deleted successfully',
    errorMessage: (error) => `Failed to delete guest: ${error.message}`,
  });
};

// Hook for recording a guest visit
export const useRecordGuestVisit = (restaurantId: string) => {
  const queryClient = useQueryClient();

  return useAppMutation<Guest, string>({
    mutationFn: (guestId) => guestApi.recordGuestVisit(restaurantId, guestId),
    queryKey: guestKeys.list(restaurantId),
    successMessage: 'Visit recorded successfully',
    errorMessage: (error) => `Failed to record visit: ${error.message}`,
    onSuccessCallback: (updatedGuest) => {
      // Update the guest in the cache
      queryClient.setQueryData(guestKeys.detail(updatedGuest.id, restaurantId), updatedGuest);
    },
  });
};
