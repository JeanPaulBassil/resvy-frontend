import axiosInstance from './axios';
import { 
  Shift, 
  CreateShiftDto, 
  UpdateShiftDto 
} from '@/types/shift';
import { extractData } from './apiUtils';

export const shiftApi = {
  // Get all shifts for a restaurant
  getShifts: async (restaurantId: string): Promise<Shift[]> => {
    const response = await axiosInstance.get(`/shifts?restaurantId=${restaurantId}`);
    return extractData<Shift[]>(response);
  },

  // Get a specific shift
  getShift: async (shiftId: string, restaurantId: string): Promise<Shift> => {
    const response = await axiosInstance.get(`/shifts/${shiftId}?restaurantId=${restaurantId}`);
    return extractData<Shift>(response);
  },

  // Create a new shift
  createShift: async (data: CreateShiftDto, restaurantId: string): Promise<Shift> => {
    const response = await axiosInstance.post(`/shifts?restaurantId=${restaurantId}`, data);
    return extractData<Shift>(response);
  },

  // Update a shift
  updateShift: async (shiftId: string, data: UpdateShiftDto, restaurantId: string): Promise<Shift> => {
    const response = await axiosInstance.patch(`/shifts/${shiftId}?restaurantId=${restaurantId}`, data);
    return extractData<Shift>(response);
  },

  // Toggle shift active status
  toggleShiftActive: async (shiftId: string, active: boolean, restaurantId: string): Promise<Shift> => {
    const response = await axiosInstance.patch(
      `/shifts/${shiftId}/active?restaurantId=${restaurantId}`, 
      { active }
    );
    return extractData<Shift>(response);
  },

  // Delete a shift
  deleteShift: async (shiftId: string, restaurantId: string): Promise<void> => {
    const response = await axiosInstance.delete(`/shifts/${shiftId}?restaurantId=${restaurantId}`);
    return extractData<void>(response);
  }
}; 