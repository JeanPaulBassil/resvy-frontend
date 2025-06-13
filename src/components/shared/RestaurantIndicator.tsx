'use client';

import { useRestaurant } from '@/components/providers/RestaurantProvider';
import { motion } from 'framer-motion';
import React from 'react';

interface RestaurantIndicatorProps {
  className?: string;
  variant?: 'default' | 'corner' | 'inline';
}

export default function RestaurantIndicator({ 
  className = '', 
  variant = 'default' 
}: RestaurantIndicatorProps) {
  const { currentRestaurant } = useRestaurant();

  if (!currentRestaurant) {
    return null;
  }

  const variants = {
    default: "fixed top-4 right-4 z-40",
    corner: "absolute top-4 right-4",
    inline: "inline-block"
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`${variants[variant]} ${className}`}
    >
      <div className="bg-white/80 backdrop-blur-md rounded-full px-4 py-2 shadow-lg border border-white/20 hover:bg-white/90 transition-all duration-200">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#75CAA6] animate-pulse"></div>
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
            {currentRestaurant.name}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
