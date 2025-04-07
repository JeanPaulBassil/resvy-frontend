export type FloorType = "INDOOR" | "OUTDOOR" | "BAR" | "CUSTOM";

export interface Floor {
  id: string;
  name: string;
  type: FloorType;
  color?: string;
  restaurantId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFloorDto {
  name: string;
  type: FloorType;
  color?: string;
}

export interface UpdateFloorDto {
  name?: string;
  type?: FloorType;
  color?: string;
} 