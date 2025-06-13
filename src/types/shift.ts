/**
 * Shift types for the application
 */

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  days: string[];
  color: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface UpcomingShift {
  id: string;
  shiftId: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  color: string;
  reservations: number;
  guests: number;
}

export interface CreateShiftDto {
  name: string;
  startTime: string;
  endTime: string;
  days: string[];
  color: string;
}

export interface UpdateShiftDto {
  name?: string;
  startTime?: string;
  endTime?: string;
  days?: string[];
  color?: string;
  active?: boolean;
}

export interface ShiftReservationCount {
  shiftId: string;
  date: string;
  count: number;
  guestCount: number;
} 