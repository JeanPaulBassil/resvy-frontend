import { tableApi } from '@/api/table';
import { useToast } from '@/contexts/ToastContext';
import {
  CreateTableDto,
  MergeTablesDto,
  UpdateTableDto,
  UpdateTablePositionDto,
  UpdateTableStatusDto,
} from '@/types/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Query keys for React Query
export const tableKeys = {
  all: ['tables'] as const,
  lists: () => [...tableKeys.all, 'list'] as const,
  list: (restaurantId: string, floorId?: string) =>
    floorId
      ? ([...tableKeys.lists(), restaurantId, floorId] as const)
      : ([...tableKeys.lists(), restaurantId] as const),
  details: () => [...tableKeys.all, 'detail'] as const,
  detail: (tableId: string, restaurantId: string) =>
    [...tableKeys.details(), tableId, restaurantId] as const,
};

// Hook for fetching all tables
export const useTables = (restaurantId: string, floorId?: string) => {
  return useQuery({
    queryKey: tableKeys.list(restaurantId, floorId),
    queryFn: () => tableApi.getTables(restaurantId, floorId),
    enabled: !!restaurantId,
  });
};

// Hook for fetching a single table
export const useTable = (tableId: string, restaurantId: string) => {
  return useQuery({
    queryKey: tableKeys.detail(tableId, restaurantId),
    queryFn: () => tableApi.getTable(tableId, restaurantId),
    enabled: !!tableId && !!restaurantId,
  });
};

// Hook for creating a table
export const useCreateTable = (restaurantId: string, floorId?: string) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: CreateTableDto) => {
      return tableApi.createTable(data, restaurantId);
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: tableKeys.list(restaurantId, floorId) });
      toast.success('Table created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create table: ' + error.message);
    },
  });
};

// Hook for updating a table
export const useUpdateTable = (tableId: string, restaurantId: string, floorId?: string) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: UpdateTableDto) => tableApi.updateTable(tableId, data, restaurantId),
    onSuccess: (updatedTable) => {
      // Update the table in the cache
      queryClient.setQueryData(tableKeys.detail(tableId, restaurantId), updatedTable);
      // Invalidate the tables list
      queryClient.invalidateQueries({ queryKey: tableKeys.list(restaurantId, floorId) });
      toast.success('Table updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update table: ' + error.message);
    },
  });
};

// Hook for updating a table's position
export const useUpdateTablePosition = (tableId: string, restaurantId: string, floorId?: string) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: UpdateTablePositionDto) =>
      tableApi.updateTablePosition(tableId, data, restaurantId),
    onSuccess: (updatedTable) => {
      // Update the table in the cache
      queryClient.setQueryData(tableKeys.detail(tableId, restaurantId), updatedTable);
      // Invalidate the tables list
      queryClient.invalidateQueries({ queryKey: tableKeys.list(restaurantId, floorId) });
    },
    onError: (error: Error) => {
      toast.error('Failed to update table position: ' + error.message);
    },
  });
};

// Hook for updating a table's status
export const useUpdateTableStatus = (tableId: string, restaurantId: string, floorId?: string) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: UpdateTableStatusDto) =>
      tableApi.updateTableStatus(tableId, data, restaurantId),
    onSuccess: (updatedTable) => {
      // Update the table in the cache
      queryClient.setQueryData(tableKeys.detail(tableId, restaurantId), updatedTable);
      // Invalidate the tables list
      queryClient.invalidateQueries({ queryKey: tableKeys.list(restaurantId, floorId) });
      toast.success('Table status updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update table status: ' + error.message);
    },
  });
};

// Hook for deleting a table
export const useDeleteTable = (restaurantId: string, floorId?: string) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (tableId: string) => tableApi.deleteTable(tableId, restaurantId),
    onSuccess: () => {
      // Invalidate the tables list query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: tableKeys.list(restaurantId, floorId) });
      toast.success('Table deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete table: ' + error.message);
    },
  });
};

// Hook for merging tables
export const useMergeTables = (restaurantId: string, floorId?: string) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: MergeTablesDto) => tableApi.mergeTables(data, restaurantId),
    onSuccess: () => {
      // Invalidate the tables list query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: tableKeys.list(restaurantId, floorId) });
      toast.success('Tables merged successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to merge tables: ' + error.message);
    },
  });
};

// Hook for unmerging tables
export const useUnmergeTables = (restaurantId: string, floorId?: string) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (tableId: string) => tableApi.unmergeTables(tableId, restaurantId),
    onSuccess: () => {
      // Invalidate the tables list query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: tableKeys.list(restaurantId, floorId) });
      toast.success('Tables unmerged successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to unmerge tables: ' + error.message);
    },
  });
};
