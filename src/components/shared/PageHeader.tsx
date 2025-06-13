'use client';

import { motion } from 'framer-motion';
import React from 'react';
import RestaurantIndicator from './RestaurantIndicator';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showRestaurant?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export default function PageHeader({ 
  title, 
  subtitle, 
  showRestaurant = false,
  children,
  className = ''
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`mb-6 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {title}
            </h1>
            {showRestaurant && (
              <RestaurantIndicator variant="inline" className="ml-2" />
            )}
          </div>
          {subtitle && (
            <p className="text-gray-600 text-sm md:text-base">
              {subtitle}
            </p>
          )}
        </div>
        {children && (
          <div className="flex-shrink-0">
            {children}
          </div>
        )}
      </div>
    </motion.div>
  );
} 