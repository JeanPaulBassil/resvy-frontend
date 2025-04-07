import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Shift, CreateShiftDto, UpdateShiftDto } from '@/types/shift';
import { shiftApi } from '@/api/shift';
import { useToast } from '@/contexts/ToastContext';

// React Query keys
export const shiftKeys = {
  all: ['shifts'] as const,
  lists: () => [...shiftKeys.all, 'list'] as const,
  list: (restaurantId: string) => [...shiftKeys.lists(), restaurantId] as const,
  details: () => [...shiftKeys.all, 'detail'] as const,
  detail: (shiftId: string) => [...shiftKeys.details(), shiftId] as const,
};

// Hooks
export const useShifts = (restaurantId: string) => {
  return useQuery({
    queryKey: shiftKeys.list(restaurantId),
    queryFn: () => shiftApi.getShifts(restaurantId),
    enabled: !!restaurantId,
  });
};

export const useShift = (shiftId: string, restaurantId: string) => {
  return useQuery({
    queryKey: shiftKeys.detail(shiftId),
    queryFn: () => shiftApi.getShift(shiftId, restaurantId),
    enabled: !!shiftId && !!restaurantId,
  });
};

export const useCreateShift = (restaurantId: string) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: (data: CreateShiftDto) => shiftApi.createShift(data, restaurantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shiftKeys.list(restaurantId) });
      toast.success('Shift created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create shift: ' + error.message);
    },
  });
};

export const useUpdateShift = (shiftId: string, restaurantId: string) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: (data: UpdateShiftDto) => shiftApi.updateShift(shiftId, data, restaurantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shiftKeys.list(restaurantId) });
      queryClient.invalidateQueries({ queryKey: shiftKeys.detail(shiftId) });
      toast.success('Shift updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update shift: ' + error.message);
    },
  });
};

export const useToggleShiftActive = (shiftId: string, restaurantId: string) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: (active: boolean) => shiftApi.toggleShiftActive(shiftId, active, restaurantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shiftKeys.list(restaurantId) });
      queryClient.invalidateQueries({ queryKey: shiftKeys.detail(shiftId) });
      toast.success('Shift status updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update shift status: ' + error.message);
    },
  });
};

export const useDeleteShift = (restaurantId: string) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: (shiftId: string) => shiftApi.deleteShift(shiftId, restaurantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shiftKeys.list(restaurantId) });
      toast.success('Shift deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete shift: ' + error.message);
    },
  });
};

// Direct functions for event handlers
export const toggleShiftActiveDirectly = async (
  shiftId: string, 
  active: boolean, 
  restaurantId: string
): Promise<Shift> => {
  return shiftApi.toggleShiftActive(shiftId, active, restaurantId);
};

export const updateShiftDirectly = async (
  shiftId: string,
  data: UpdateShiftDto,
  restaurantId: string
): Promise<Shift> => {
  return shiftApi.updateShift(shiftId, data, restaurantId);
}; 