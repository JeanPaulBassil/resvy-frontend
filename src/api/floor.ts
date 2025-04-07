import axiosInstance from './axios';
import { Floor, CreateFloorDto, UpdateFloorDto } from '@/types/floor';
import { Table } from '@/types/table';
import { extractData } from './apiUtils';

export const floorApi = {
  // Get all floors for a restaurant
  getFloors: async (restaurantId: string): Promise<Floor[]> => {
    const response = await axiosInstance.get(`/floors?restaurantId=${restaurantId}`);
    return extractData<Floor[]>(response);
  },

  // Get a specific floor
  getFloor: async (floorId: string, restaurantId: string): Promise<Floor> => {
    const response = await axiosInstance.get(`/floors/${floorId}?restaurantId=${restaurantId}`);
    return extractData<Floor>(response);
  },

  // Create a new floor
  createFloor: async (data: CreateFloorDto, restaurantId: string): Promise<Floor> => {
    const response = await axiosInstance.post(`/floors?restaurantId=${restaurantId}`, data);
    return extractData<Floor>(response);
  },

  // Update a floor
  updateFloor: async (floorId: string, data: UpdateFloorDto, restaurantId: string): Promise<Floor> => {
    const response = await axiosInstance.patch(`/floors/${floorId}?restaurantId=${restaurantId}`, data);
    return extractData<Floor>(response);
  },

  // Delete a floor
  deleteFloor: async (floorId: string, restaurantId: string): Promise<Floor> => {
    const response = await axiosInstance.delete(`/floors/${floorId}?restaurantId=${restaurantId}`);
    return extractData<Floor>(response);
  },

  // Get all tables for a specific floor
  getTablesForFloor: async (floorId: string, restaurantId: string): Promise<Table[]> => {
    const response = await axiosInstance.get(`/floors/${floorId}/tables?restaurantId=${restaurantId}`);
    return extractData<Table[]>(response);
  }
}; 