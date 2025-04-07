import {
  AssignTableDto,
  CreateReservationDto,
  Reservation,
  reservationApi,
  ReservationStatus,
  UpdateReservationDto,
} from '@/api/reservation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import useAppMutation from './useAppMutation';

// Query keys for React Query
export const reservationKeys = {
  all: ['reservations'] as const,
  lists: () => [...reservationKeys.all, 'list'] as const,
  list: (params?: {
    restaurantId?: string;
    date?: string;
    status?: ReservationStatus;
    shiftId?: string;
    searchQuery?: string;
  }) =>
    [
      ...reservationKeys.lists(),
      params?.restaurantId,
      params?.date,
      params?.status,
      params?.shiftId,
      params?.searchQuery,
    ] as const,
  byShift: () => [...reservationKeys.all, 'by-shift'] as const,
  shiftList: (shiftId: string, date?: string) =>
    [...reservationKeys.byShift(), shiftId, date] as const,
  details: () => [...reservationKeys.all, 'detail'] as const,
  detail: (id: string) => [...reservationKeys.details(), id] as const,
};

// Hook for fetching reservations with filters
export const useReservations = (params?: {
  restaurantId?: string;
  date?: string;
  status?: ReservationStatus;
  shiftId?: string;
  skip?: number;
  take?: number;
  searchQuery?: string;
}) => {
  // If restaurantId is missing and it's required for the query, we should not run the query
  const enabled = !!(
    params?.restaurantId ||
    (!params?.restaurantId && (params?.date || params?.status || params?.shiftId || params?.searchQuery))
  );

  return useQuery({
    queryKey: reservationKeys.list(params),
    queryFn: () => reservationApi.getReservations(params),
    enabled,
  });
};

// Hook for fetching reservations by shift
export const useReservationsByShift = (shiftId: string, date?: string) => {
  return useQuery({
    queryKey: reservationKeys.shiftList(shiftId, date),
    queryFn: () => reservationApi.getReservationsByShift(shiftId, date),
    enabled: !!shiftId,
  });
};

// Hook for fetching a single reservation
export const useReservation = (id: string) => {
  return useQuery({
    queryKey: reservationKeys.detail(id),
    queryFn: () => reservationApi.getReservation(id),
    enabled: !!id,
  });
};

// Hook for creating a reservation
export const useCreateReservation = () => {
  const queryClient = useQueryClient();

  return useAppMutation<Reservation, CreateReservationDto>({
    mutationFn: (data) => reservationApi.createReservation(data),
    successMessage: 'Reservation created successfully',
    errorMessage: (error) => `Failed to create reservation: ${error.message}`,
    onSuccessCallback: (newReservation) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: reservationKeys.list({
          restaurantId: newReservation.restaurantId,
          date: new Date(newReservation.date).toISOString().split('T')[0],
          shiftId: newReservation.shiftId || undefined,
        }),
      });

      // If there's a shift, invalidate shift-specific queries
      if (newReservation.shiftId) {
        queryClient.invalidateQueries({
          queryKey: reservationKeys.shiftList(
            newReservation.shiftId,
            new Date(newReservation.date).toISOString().split('T')[0]
          ),
        });
      }
    },
  });
};

// Hook for updating a reservation
export const useUpdateReservation = (id: string) => {
  const queryClient = useQueryClient();

  return useAppMutation<Reservation, UpdateReservationDto, Reservation>({
    mutationFn: (data) => reservationApi.updateReservation(id, data),
    successMessage: 'Reservation updated successfully',
    errorMessage: (error) => `Failed to update reservation: ${error.message}`,
    onSuccessCallback: (updatedReservation) => {
      // Update the reservation in the cache
      queryClient.setQueryData(reservationKeys.detail(id), updatedReservation);

      // Invalidate list queries that may contain this reservation
      queryClient.invalidateQueries({
        queryKey: reservationKeys.lists(),
      });
    },
    additionalInvalidateQueries: [reservationKeys.detail(id)],
  });
};

// Hook for assigning a table to a reservation
export const useAssignTable = (id: string) => {
  const queryClient = useQueryClient();

  return useAppMutation<Reservation, AssignTableDto, Reservation>({
    mutationFn: (data) => reservationApi.assignTable(id, data),
    successMessage: 'Table assigned successfully',
    errorMessage: (error) => `Failed to assign table: ${error.message}`,
    onSuccessCallback: (updatedReservation) => {
      // Update the reservation in the cache
      queryClient.setQueryData(reservationKeys.detail(id), updatedReservation);

      // Invalidate list queries that may contain this reservation
      queryClient.invalidateQueries({
        queryKey: reservationKeys.lists(),
      });
    },
    additionalInvalidateQueries: [reservationKeys.detail(id)],
  });
};

// Hook for deleting a reservation
export const useDeleteReservation = () => {
  const queryClient = useQueryClient();

  return useAppMutation<Reservation, string>({
    mutationFn: (id) => reservationApi.deleteReservation(id),
    successMessage: 'Reservation deleted successfully',
    errorMessage: (error) => `Failed to delete reservation: ${error.message}`,
    onSuccessCallback: (deletedReservation) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: reservationKeys.lists(),
      });

      // Remove the reservation from the cache
      queryClient.removeQueries({
        queryKey: reservationKeys.detail(deletedReservation.id),
      });
    },
  });
};
