export type ReservationStatus = "confirmed" | "pending" | "checked-in" | "canceled"

export interface Reservation {
  id: string
  guestName: string
  contactDetails: string
  tableId: string
  shiftId: string
  startTime: Date
  endTime: Date
  partySize: number
  specialRequests: string
  status: ReservationStatus
  mergedTableIds?: string[] // IDs of tables that are merged for this reservation
}

export interface Table {
  id: string
  number: number
  capacity: number
  canMerge?: string[] // IDs of tables that can be merged with this one
}

export interface Shift {
  id: string
  name: string
  startTime: string
  endTime: string
}

export type ViewType = "day" | "week" | "month" 