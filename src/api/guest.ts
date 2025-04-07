import { AxiosError, AxiosResponse } from 'axios';
import axiosInstance from './axios';

export interface Guest {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  tags: string[];
  notes: string | null;
  visitCount: number;
  lastVisit: string | null;
  preferredSeating: string | null;
  diningPreferences: string[];
  dietaryRestrictions: string[];
  allergies: string | null;
  isVip: boolean;
  restaurantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGuestDto {
  name: string;
  email?: string;
  phone: string;
  tags?: string[];
  notes?: string;
  preferredSeating?: string;
  diningPreferences?: string[];
  dietaryRestrictions?: string[];
  allergies?: string;
  isVip?: boolean;
}

export interface UpdateGuestDto {
  name?: string;
  email?: string;
  phone?: string;
  tags?: string[];
  notes?: string;
  preferredSeating?: string;
  diningPreferences?: string[];
  dietaryRestrictions?: string[];
  allergies?: string;
  isVip?: boolean;
}

// Custom error class for unauthorized access
export class UnauthorizedAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedAccessError';
  }
}

// Response structure from API
interface ApiResponse<T> {
  payload?: T;
}

// Helper function to extract data from response
const extractData = <T>(response: AxiosResponse<T | ApiResponse<T>>): T => {
  // Check if response has a payload property
  if (response.data && (response.data as ApiResponse<T>).payload !== undefined) {
    return (response.data as ApiResponse<T>).payload as T;
  }
  // Otherwise return the data directly
  return response.data as T;
};

export const guestApi = {
  // Create a new guest
  createGuest: async (restaurantId: string, data: CreateGuestDto): Promise<Guest> => {
    try {
      const response = await axiosInstance.post<Guest | ApiResponse<Guest>>(
        `/restaurants/${restaurantId}/guests`,
        data
      );
      return extractData<Guest>(response);
    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status === 403) {
        throw new UnauthorizedAccessError(
          'You do not have permission to create a guest for this restaurant'
        );
      }
      throw error;
    }
  },

  // Get all guests for a restaurant
  getGuests: async (restaurantId: string): Promise<Guest[]> => {
    try {
      const response = await axiosInstance.get<Guest[] | ApiResponse<Guest[]>>(
        `/restaurants/${restaurantId}/guests`
      );
      return extractData<Guest[]>(response);
    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status === 403) {
        throw new UnauthorizedAccessError(
          'You do not have permission to view guests for this restaurant'
        );
      }
      throw error;
    }
  },

  // Get a guest by ID
  getGuest: async (restaurantId: string, guestId: string): Promise<Guest> => {
    try {
      const response = await axiosInstance.get<Guest | ApiResponse<Guest>>(
        `/restaurants/${restaurantId}/guests/${guestId}`
      );
      return extractData<Guest>(response);
    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status === 403) {
        throw new UnauthorizedAccessError('You do not have permission to view this guest');
      }
      throw error;
    }
  },

  // Update a guest
  updateGuest: async (
    restaurantId: string,
    guestId: string,
    data: UpdateGuestDto
  ): Promise<Guest> => {
    try {
      const response = await axiosInstance.patch<Guest | ApiResponse<Guest>>(
        `/restaurants/${restaurantId}/guests/${guestId}`,
        data
      );
      return extractData<Guest>(response);
    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status === 403) {
        throw new UnauthorizedAccessError('You do not have permission to update this guest');
      }
      throw error;
    }
  },

  // Delete a guest
  deleteGuest: async (restaurantId: string, guestId: string): Promise<Guest> => {
    try {
      const response = await axiosInstance.delete<Guest | ApiResponse<Guest>>(
        `/restaurants/${restaurantId}/guests/${guestId}`
      );
      return extractData<Guest>(response);
    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status === 403) {
        throw new UnauthorizedAccessError('You do not have permission to delete this guest');
      }
      throw error;
    }
  },

  // Record a guest visit
  recordGuestVisit: async (restaurantId: string, guestId: string): Promise<Guest> => {
    try {
      const response = await axiosInstance.post<Guest | ApiResponse<Guest>>(
        `/restaurants/${restaurantId}/guests/${guestId}/record-visit`
      );
      return extractData<Guest>(response);
    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status === 403) {
        throw new UnauthorizedAccessError(
          'You do not have permission to record a visit for this guest'
        );
      }
      throw error;
    }
  },
};
