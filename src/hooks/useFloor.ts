import { floorApi } from '@/api/floor';
import { ServerError } from '@/api/utils';
import { useToast } from '@/contexts/ToastContext';
import { CreateFloorDto, UpdateFloorDto } from '@/types/floor';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Query keys for React Query
export const floorKeys = {
  all: ['floors'] as const,
  lists: () => [...floorKeys.all, 'list'] as const,
  list: (restaurantId: string) => [...floorKeys.lists(), restaurantId] as const,
  details: () => [...floorKeys.all, 'detail'] as const,
  detail: (floorId: string, restaurantId: string) =>
    [...floorKeys.details(), floorId, restaurantId] as const,
  tables: () => [...floorKeys.all, 'tables'] as const,
  floorTables: (floorId: string, restaurantId: string) =>
    [...floorKeys.tables(), floorId, restaurantId] as const,
};

// Hook for fetching all floors
export const useFloors = (restaurantId: string) => {
  return useQuery({
    queryKey: floorKeys.list(restaurantId),
    queryFn: () => floorApi.getFloors(restaurantId),
    enabled: !!restaurantId,
  });
};

// Hook for fetching a single floor
export const useFloor = (floorId: string, restaurantId: string) => {
  return useQuery({
    queryKey: floorKeys.detail(floorId, restaurantId),
    queryFn: () => floorApi.getFloor(floorId, restaurantId),
    enabled: !!floorId && !!restaurantId,
  });
};

// Hook for fetching tables for a specific floor
export const useFloorTables = (floorId: string, restaurantId: string) => {
  return useQuery({
    queryKey: floorKeys.floorTables(floorId, restaurantId),
    queryFn: () => floorApi.getTablesForFloor(floorId, restaurantId),
    enabled: !!floorId && !!restaurantId,
  });
};

// Hook for creating a floor
export const useCreateFloor = (restaurantId: string) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (data: CreateFloorDto) => {
      const floorResponse = await floorApi.createFloor(data, restaurantId);
      return floorResponse;
    },
    onSuccess: () => {
      // Invalidate the floors list query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: floorKeys.list(restaurantId) });
      toast.success('Floor created successfully');
    },
    onError: (error: ServerError) => {
      toast.error(error.message);
    },
  });
};

// Hook for updating a floor
export const useUpdateFloor = (floorId: string, restaurantId: string) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: UpdateFloorDto) => floorApi.updateFloor(floorId, data, restaurantId),
    onSuccess: (updatedFloor) => {
      // Update the floor in the cache
      queryClient.setQueryData(floorKeys.detail(floorId, restaurantId), updatedFloor);
      // Invalidate the floors list
      queryClient.invalidateQueries({ queryKey: floorKeys.list(restaurantId) });
      toast.success('Floor updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update floor: ' + error.message);
    },
  });
};

// Hook for deleting a floor
export const useDeleteFloor = (restaurantId: string) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (floorId: string) => floorApi.deleteFloor(floorId, restaurantId),
    onSuccess: () => {
      // Invalidate the floors list query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: floorKeys.list(restaurantId) });
      toast.success('Floor deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete floor: ' + error.message);
    },
  });
};
