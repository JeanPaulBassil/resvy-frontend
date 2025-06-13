'use client';

import { useRestaurant } from '@/components/providers/RestaurantProvider';
import { motion } from 'framer-motion';
import React from 'react';

interface RestaurantBadgeProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md';
}

export default function RestaurantBadge({ 
  className = '', 
  size = 'sm' 
}: RestaurantBadgeProps) {
  const { currentRestaurant } = useRestaurant();

  if (!currentRestaurant) {
    return null;
  }

  const sizeClasses = {
    xs: "px-2 py-1 text-xs",
    sm: "px-3 py-1.5 text-sm", 
    md: "px-4 py-2 text-base"
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`inline-flex items-center gap-1 bg-[#75CAA6]/10 text-[#75CAA6] rounded-full font-medium backdrop-blur-sm border border-[#75CAA6]/20 ${sizeClasses[size]} ${className}`}
    >
      <div className="w-1.5 h-1.5 rounded-full bg-[#75CAA6]"></div>
      <span className="truncate max-w-[120px]">
        {currentRestaurant.name}
      </span>
    </motion.div>
  );
} 