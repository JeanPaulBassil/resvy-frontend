export enum TableStatus {
  AVAILABLE = "AVAILABLE",
  OCCUPIED = "OCCUPIED",
  RESERVED = "RESERVED",
}

export interface Table {
  id: string;
  name: string;
  capacity: number;
  x: number;
  y: number;
  status: TableStatus;
  restaurantId: string;
  floorId: string | null;
  mergedTableIds: string[];
  parentTableId: string | null;
  createdAt: string;
  updatedAt: string;
  isHidden?: boolean;
  isMerged?: boolean;
}

export interface CreateTableDto {
  name: string;
  capacity: number;
  x?: number;
  y?: number;
  status?: TableStatus;
  floorId?: string;
}

export interface UpdateTableDto {
  name?: string;
  capacity?: number;
  x?: number;
  y?: number;
  status?: TableStatus;
  floorId?: string;
  mergedTableIds?: string[];
  parentTableId?: string;
}

export interface UpdateTablePositionDto {
  x: number;
  y: number;
}

export interface UpdateTableStatusDto {
  status: TableStatus;
}

export interface MergeTablesDto {
  tableIds: string[];
}

// Utility function to get table color based on status
export const getTableColor = (status: TableStatus): string => {
  switch (status) {
    case TableStatus.AVAILABLE:
      return "#10b981"; // green
    case TableStatus.OCCUPIED:
      return "#ef4444"; // red
    case TableStatus.RESERVED:
      return "#3b82f6"; // blue
    default:
      return "#f5f5f4"; // default gray
  }
}; 
