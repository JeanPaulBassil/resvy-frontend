import axiosInstance from './axios';

export interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  address: string;
  phone: string;
  email: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRestaurantDto {
  name: string;
  description?: string;
  address: string;
  phone: string;
  email: string;
}

export interface UpdateRestaurantDto {
  name?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
}

// Custom error class for unauthorized access
export class UnauthorizedAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedAccessError';
  }
}

// Helper function to extract data from response
const extractData = (response: any) => {
  // Check if response has a payload property
  if (response.data && response.data.payload !== undefined) {
    return response.data.payload;
  }
  // Otherwise return the data directly
  return response.data;
};

export const restaurantApi = {
  // Create a new restaurant
  createRestaurant: async (data: CreateRestaurantDto): Promise<Restaurant> => {
    try {
      const response = await axiosInstance.post<Restaurant>('/restaurants', data);
      return extractData(response);
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new UnauthorizedAccessError('You do not have permission to create a restaurant');
      }
      throw error;
    }
  },

  // Get all restaurants
  getRestaurants: async (): Promise<Restaurant[]> => {
    try {
      const response = await axiosInstance.get<Restaurant[]>('/restaurants');
      return extractData(response);
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new UnauthorizedAccessError('You do not have permission to view restaurants');
      }
      throw error;
    }
  },

  // Get restaurants owned by the current user
  getMyRestaurants: async (): Promise<Restaurant[]> => {
    try {
      // First check if the user is logged in to prevent unnecessary requests
      const isLoggedIn = localStorage.getItem('loggedIn') === 'true';
      const isAuthPage = typeof window !== 'undefined' && 
        (window.location.pathname.includes('/login') || 
         window.location.pathname.includes('/signup'));
      
      // Don't make the request if we're not logged in or we're on an auth page
      if (!isLoggedIn || isAuthPage) {
        console.log('User not logged in or on auth page, skipping my-restaurants request');
        return [];
      }
      
      console.log('Making API request to /restaurants/my-restaurants');
      const response = await axiosInstance.get<Restaurant[]>('/restaurants/my-restaurants');
      console.log('API response received successfully');
      return extractData(response);
    } catch (error: any) {
      console.error('Error in getMyRestaurants:', error.message);
      
      // Handle network errors
      if (error.message === 'Network Error') {
        console.error('Network error detected - unable to connect to the API server');
        console.error('Please check that the API server is running and accessible');
        console.error('API URL being used:', axiosInstance.defaults.baseURL);
        
        // Return empty array for network errors to prevent app from crashing
        console.log('Returning empty array due to network error');
        return [];
      }
      
      // Handle JSON parsing errors
      if (error.message && error.message.includes('Unexpected token')) {
        console.error('JSON parsing error detected - received non-JSON response');
        
        // If we have response data, log it for debugging
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response headers:', error.response.headers);
          console.error('Response data (first 100 chars):', 
            typeof error.response.data === 'string' 
              ? error.response.data.substring(0, 100) 
              : 'Non-string response');
        }
        
        // Return empty array instead of throwing
        console.log('Returning empty array due to parsing error');
        return [];
      }
      
      // Handle unauthorized errors
      if (error.response?.status === 403) {
        throw new UnauthorizedAccessError('You do not have permission to view your restaurants');
      }
      
      throw error;
    }
  },

  // Get a restaurant by ID
  getRestaurant: async (id: string): Promise<Restaurant> => {
    try {
      const response = await axiosInstance.get<Restaurant>(`/restaurants/${id}`);
      return extractData(response);
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new UnauthorizedAccessError('You do not have permission to view this restaurant');
      }
      throw error;
    }
  },

  // Update a restaurant
  updateRestaurant: async (id: string, data: UpdateRestaurantDto): Promise<Restaurant> => {
    try {
      const response = await axiosInstance.patch<Restaurant>(`/restaurants/${id}`, data);
      return extractData(response);
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new UnauthorizedAccessError('You do not have permission to update this restaurant');
      }
      throw error;
    }
  },

  // Delete a restaurant
  deleteRestaurant: async (id: string): Promise<Restaurant> => {
    try {
      const response = await axiosInstance.delete<Restaurant>(`/restaurants/${id}`);
      return extractData(response);
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new UnauthorizedAccessError('You do not have permission to delete this restaurant');
      }
      throw error;
    }
  },
}; 