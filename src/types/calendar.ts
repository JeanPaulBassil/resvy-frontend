
// Calendar-specific types
export type ViewType = 'day' | 'week' | 'month';

// Extend the app's reservation type for calendar display
export interface CalendarReservation {
  id: string;
  guestName: string;
  contactDetails: string;
  tableId: string;
  shiftId: string;
  startTime: Date;  // Calculated from date + time
  endTime: Date;    // Calculated from date + time + duration
  partySize: number;
  specialRequests: string;
  status: string;   // Mapped from app's ReservationStatus
  mergedTableIds?: string[];
  color?: string;   // Added for visual distinction
  floor?: string;   // Floor name for display
  source?: string;  // Reservation source
  tags?: string[];  // Tags for display
}

// Calendar filters
export interface CalendarFilterOptions {
  tableId: string;
  guestName: string;
  shiftId: string;
  status: string;
  partySize: string;
  floorId?: string;
  tags?: string[];
}
