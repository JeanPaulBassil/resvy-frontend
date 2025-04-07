import axiosInstance from './axios';
import { 
  Table, 
  CreateTableDto, 
  UpdateTableDto, 
  UpdateTablePositionDto, 
  UpdateTableStatusDto, 
  MergeTablesDto 
} from '@/types/table';
import { extractData } from './apiUtils';

export const tableApi = {
  // Get all tables for a restaurant (optionally filtered by floor)
  getTables: async (restaurantId: string, floorId?: string): Promise<Table[]> => {
    const url = floorId 
      ? `/tables?restaurantId=${restaurantId}&floorId=${floorId}`
      : `/tables?restaurantId=${restaurantId}`;
    const response = await axiosInstance.get(url);
    return extractData<Table[]>(response);
  },

  // Get a specific table
  getTable: async (tableId: string, restaurantId: string): Promise<Table> => {
    const response = await axiosInstance.get(`/tables/${tableId}?restaurantId=${restaurantId}`);
    return extractData<Table>(response);
  },

  // Create a new table
  createTable: async (data: CreateTableDto, restaurantId: string): Promise<Table> => {
    const response = await axiosInstance.post(`/tables?restaurantId=${restaurantId}`, data);
    return extractData<Table>(response);
  },

  // Update a table
  updateTable: async (tableId: string, data: UpdateTableDto, restaurantId: string): Promise<Table> => {
    const response = await axiosInstance.patch(`/tables/${tableId}?restaurantId=${restaurantId}`, data);
    return extractData<Table>(response);
  },

  // Update a table's position
  updateTablePosition: async (tableId: string, data: UpdateTablePositionDto, restaurantId: string): Promise<Table> => {
    const response = await axiosInstance.patch(`/tables/${tableId}/position?restaurantId=${restaurantId}`, data);
    return extractData<Table>(response);
  },

  // Update a table's status
  updateTableStatus: async (tableId: string, data: UpdateTableStatusDto, restaurantId: string): Promise<Table> => {
    const response = await axiosInstance.patch(`/tables/${tableId}/status?restaurantId=${restaurantId}`, data);
    return extractData<Table>(response);
  },

  // Delete a table
  deleteTable: async (tableId: string, restaurantId: string): Promise<Table> => {
    const response = await axiosInstance.delete(`/tables/${tableId}?restaurantId=${restaurantId}`);
    return extractData<Table>(response);
  },

  // Merge multiple tables
  mergeTables: async (data: MergeTablesDto, restaurantId: string): Promise<Table> => {
    const response = await axiosInstance.post(`/tables/merge?restaurantId=${restaurantId}`, data);
    return extractData<Table>(response);
  },

  // Unmerge a merged table
  unmergeTables: async (tableId: string, restaurantId: string): Promise<Table[]> => {
    const response = await axiosInstance.post(`/tables/${tableId}/unmerge?restaurantId=${restaurantId}`);
    return extractData<Table[]>(response);
  }
}; 