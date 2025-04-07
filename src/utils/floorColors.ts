import { FloorType } from '@/types/floor';

// Default colors for each floor type
export const defaultFloorColors: Record<FloorType, string> = {
  INDOOR: '#E3F2FD', // Light blue
  OUTDOOR: '#E8F5E9', // Light green
  BAR: '#FCE4EC', // Light pink
  CUSTOM: '#FFF3E0', // Light orange
};

// Get a color for a floor, using the default if none is provided
export const getFloorColor = (type: FloorType, color?: string | null): string => {
  return color || defaultFloorColors[type];
};

// Get a darker version of the floor color for borders or highlights
export const getDarkerFloorColor = (color: string): string => {
  // Convert hex to RGB
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  // Darken by reducing each component by 20%
  const darkerR = Math.floor(r * 0.8);
  const darkerG = Math.floor(g * 0.8);
  const darkerB = Math.floor(b * 0.8);

  // Convert back to hex
  return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
};

// Get a lighter version of the floor color for hover states
export const getLighterFloorColor = (color: string): string => {
  // Convert hex to RGB
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  // Lighten by increasing each component by 20%
  const lighterR = Math.min(255, Math.floor(r * 1.2));
  const lighterG = Math.min(255, Math.floor(g * 1.2));
  const lighterB = Math.min(255, Math.floor(b * 1.2));

  // Convert back to hex
  return `#${lighterR.toString(16).padStart(2, '0')}${lighterG.toString(16).padStart(2, '0')}${lighterB.toString(16).padStart(2, '0')}`;
}; 