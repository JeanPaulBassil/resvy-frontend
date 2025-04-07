import { Skeleton } from '@heroui/react';
import React from 'react';

interface SkeletonTextProps {
  /**
   * Number of lines to show
   * @default 1
   */
  lines?: number;
  /**
   * Width for each line (can be number for pixels or string for other units)
   * If array, each line will use corresponding width
   * @default "100%"
   */
  width?: number | string | (number | string)[];
  /**
   * Height of each line
   * @default 20
   */
  height?: number;
  /**
   * Whether the component is in loading state
   */
  isLoading: boolean;
  /**
   * Text to show when not loading
   */
  children: React.ReactNode;
  /**
   * Optional className for the container
   */
  className?: string;
  /**
   * Gap between lines
   * @default 8
   */
  gap?: number;
}

export default function SkeletonText({
  lines = 1,
  width = '100%',
  height = 20,
  isLoading,
  children,
  className = '',
  gap = 8,
}: SkeletonTextProps) {
  return (
    <div className={className}>
      <div
        className={`transition-opacity duration-200 absolute w-full ${
          isLoading ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex flex-col" style={{ gap }}>
          {Array.from({ length: lines }).map((_, index) => {
            const lineWidth = Array.isArray(width) ? width[index] || width[0] : width;
            return (
              <Skeleton
                key={index}
                className="rounded-md mb-2 opacity-30"
                style={{
                  width: typeof lineWidth === 'number' ? `${lineWidth - 2}px` : lineWidth,
                  height,
                }}
              />
            );
          })}
        </div>
      </div>
      <div className={`transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </div>
    </div>
  );
}
