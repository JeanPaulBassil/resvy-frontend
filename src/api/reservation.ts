import { AxiosError } from 'axios';
import { extractData } from './apiUtils';
import axiosInstance from './axios';
import { ResponseError, ServerError } from './utils';

export interface Reservation {
  id: string;
  tableId: string | null;
  guestId: string;
  restaurantId: string;
  date: string;
  startTime: string;
  endTime: string | null;
  numberOfGuests: number;
  note: string | null;
  status: ReservationStatus;
  source: ReservationSource;
  shiftId: string | null;
  createdAt: string;
  updatedAt: string;
  guest?: {
    id: string;
    name: string;
    email: string | null;
    phone: string;
  };
  table?: {
    id: string;
    name: string;
    capacity: number;
  };
  shift?: {
    id: string;
    name: string;
  };
}

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SEATED = 'SEATED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
  CANCELLED = 'CANCELLED',
}

export enum ReservationSource {
  PHONE = 'PHONE',
  ONLINE = 'ONLINE',
  WALK_IN = 'WALK_IN',
  OTHER = 'OTHER',
}

export interface CreateReservationDto {
  tableId?: string;
  guestId: string;
  restaurantId: string;
  date: string;
  startTime: string;
  endTime?: string;
  numberOfGuests: number;
  note?: string;
  status?: ReservationStatus;
  source?: ReservationSource;
  shiftId?: string;
}

export interface UpdateReservationDto {
  tableId?: string | null;
  date?: string;
  startTime?: string;
  endTime?: string;
  numberOfGuests?: number;
  note?: string;
  status?: ReservationStatus;
  source?: ReservationSource;
  shiftId?: string | null;
}

export interface AssignTableDto {
  tableId: string | null;
  notes?: string;
}

// Helper to create error response object
const createErrorResponse = (message: string): ResponseError => {
  return {
    error: {
      name: 'AuthorizationError',
      message,
      status: 403,
    },
    timestamp: new Date().toISOString(),
  };
};

export const reservationApi = {
  // Create a new reservation
  createReservation: async (data: CreateReservationDto): Promise<Reservation> => {
    try {
      const response = await axiosInstance.post('/reservations', data);
      return extractData(response);
    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status === 403) {
        throw new ServerError(
          createErrorResponse('You do not have permission to create a reservation')
        );
      }
      throw error;
    }
  },

  // Get all reservations with optional filters
  getReservations: async (params?: {
    restaurantId?: string;
    date?: string;
    status?: ReservationStatus;
    shiftId?: string;
    skip?: number;
    take?: number;
    searchQuery?: string;
  }): Promise<Reservation[]> => {
    try {
      const response = await axiosInstance.get('/reservations', { params });
      return extractData(response);
    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status === 403) {
        throw new ServerError(
          createErrorResponse('You do not have permission to view reservations')
        );
      }
      throw error;
    }
  },

  // Get reservations by shift
  getReservationsByShift: async (shiftId: string, date?: string): Promise<Reservation[]> => {
    try {
      const response = await axiosInstance.get(`/reservations/by-shift/${shiftId}`, {
        params: { date },
      });
      return extractData(response);
    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status === 403) {
        throw new ServerError(
          createErrorResponse('You do not have permission to view reservations for this shift')
        );
      }
      throw error;
    }
  },

  // Get a reservation by ID
  getReservation: async (id: string): Promise<Reservation> => {
    try {
      const response = await axiosInstance.get(`/reservations/${id}`);
      return extractData(response);
    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status === 403) {
        throw new ServerError(
          createErrorResponse('You do not have permission to view this reservation')
        );
      }
      throw error;
    }
  },

  // Update a reservation
  updateReservation: async (id: string, data: UpdateReservationDto): Promise<Reservation> => {
    try {
      const response = await axiosInstance.patch(`/reservations/${id}`, data);
      return extractData(response);
    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status === 403) {
        throw new ServerError(
          createErrorResponse('You do not have permission to update this reservation')
        );
      }
      throw error;
    }
  },

  // Assign a table to a reservation
  assignTable: async (id: string, data: AssignTableDto): Promise<Reservation> => {
    try {
      const response = await axiosInstance.patch(`/reservations/${id}/assign-table`, data);
      return extractData(response);
    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status === 403) {
        throw new ServerError(
          createErrorResponse('You do not have permission to assign a table to this reservation')
        );
      }
      throw error;
    }
  },

  // Delete a reservation
  deleteReservation: async (id: string): Promise<Reservation> => {
    try {
      const response = await axiosInstance.delete(`/reservations/${id}`);
      return extractData(response);
    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status === 403) {
        throw new ServerError(
          createErrorResponse('You do not have permission to delete this reservation')
        );
      }
      throw error;
    }
  },
};
