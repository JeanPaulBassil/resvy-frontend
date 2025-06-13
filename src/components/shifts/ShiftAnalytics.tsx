'use client';

import { useRestaurant } from '@/components/providers/RestaurantProvider';
import { useReservations } from '@/hooks/useReservation';
import { useShifts } from '@/hooks/useShift';
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Chip, 
  Progress, 
  Skeleton,
  Select,
  SelectItem,
  Avatar
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';
import { Clock, Users, Calendar, TrendingUp } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

interface ShiftStats {
  shiftId: string;
  shiftName: string;
  shiftTime: string;
  shiftColor: string;
  reservationCount: number;
  guestCount: number;
  isActive: boolean;
}

interface ShiftAnalyticsProps {
  selectedDate?: string;
  className?: string;
}

export default function ShiftAnalytics({ selectedDate, className = '' }: ShiftAnalyticsProps) {
  const { currentRestaurant } = useRestaurant();
  const restaurantId = currentRestaurant?.id || '';
  
  // Date range selection
  const [dateRange, setDateRange] = useState<string>('today');
  
  // Calculate date range based on selection
  const { startDate, endDate, displayLabel } = useMemo(() => {
    const today = new Date();
    let start: Date, end: Date, label: string;
    
    if (selectedDate) {
      start = end = new Date(selectedDate);
      label = format(start, 'MMMM d, yyyy');
    } else {
      switch (dateRange) {
        case 'today':
          start = end = today;
          label = 'Today';
          break;
        case 'tomorrow':
          start = end = addDays(today, 1);
          label = 'Tomorrow';
          break;
        case 'week':
          start = today;
          end = addDays(today, 6);
          label = 'Next 7 Days';
          break;
        default:
          start = end = today;
          label = 'Today';
      }
    }
    
    return {
      startDate: format(startOfDay(start), 'yyyy-MM-dd'),
      endDate: format(endOfDay(end), 'yyyy-MM-dd'),
      displayLabel: label
    };
  }, [dateRange, selectedDate]);

  // Fetch data
  const { data: shifts = [], isLoading: isLoadingShifts } = useShifts(restaurantId);
  const { data: reservations = [], isLoading: isLoadingReservations } = useReservations({
    restaurantId,
    date: startDate,
  });

  // Calculate shift statistics
  const shiftStats = useMemo((): ShiftStats[] => {
    if (!shifts.length || !reservations.length) {
      return shifts.map(shift => ({
        shiftId: shift.id,
        shiftName: shift.name,
        shiftTime: `${shift.startTime} - ${shift.endTime}`,
        shiftColor: shift.color,
        reservationCount: 0,
        guestCount: 0,
        isActive: shift.active,
      }));
    }

    const stats: ShiftStats[] = [];
    
    shifts.forEach(shift => {
      // Filter reservations for this shift
      const shiftReservations = reservations.filter(reservation => 
        reservation.shiftId === shift.id
      );
      
      const reservationCount = shiftReservations.length;
      const guestCount = shiftReservations.reduce((total, reservation) => 
        total + reservation.numberOfGuests, 0
      );
      
      stats.push({
        shiftId: shift.id,
        shiftName: shift.name,
        shiftTime: `${shift.startTime} - ${shift.endTime}`,
        shiftColor: shift.color,
        reservationCount,
        guestCount,
        isActive: shift.active,
      });
    });

    // Sort by shift start time
    return stats.sort((a, b) => a.shiftTime.localeCompare(b.shiftTime));
  }, [shifts, reservations]);

  // Calculate totals
  const totals = useMemo(() => {
    return shiftStats.reduce((acc, shift) => ({
      reservations: acc.reservations + shift.reservationCount,
      guests: acc.guests + shift.guestCount,
    }), { reservations: 0, guests: 0 });
  }, [shiftStats]);

  // Find most active shift
  const mostActiveShift = useMemo(() => {
    if (!shiftStats.length) return null;
    return shiftStats.reduce((max, shift) => 
      shift.reservationCount > max.reservationCount ? shift : max
    );
  }, [shiftStats]);

  const isLoading = isLoadingShifts || isLoadingReservations;

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Skeleton className="h-20 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`space-y-6 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Shift Analytics
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {displayLabel} • {totals.reservations} reservations, {totals.guests} guests
          </p>
        </div>
        
                 {!selectedDate && (
           <Select
             label="Date Range"
             selectedKeys={[dateRange]}
             onSelectionChange={(keys) => setDateRange(Array.from(keys)[0] as string)}
             className="w-48"
             size="sm"
           >
             <SelectItem key="today">Today</SelectItem>
             <SelectItem key="tomorrow">Tomorrow</SelectItem>
             <SelectItem key="week">Next 7 Days</SelectItem>
           </Select>
         )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Reservations */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800/30">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {totals.reservations}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Total Reservations
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Total Guests */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800/30">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {totals.guests}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Total Guests
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Most Active Shift */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800/30">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                  {mostActiveShift?.shiftName || 'N/A'}
                </p>
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  Most Active Shift
                  {mostActiveShift && (
                    <span className="block">{mostActiveShift.reservationCount} reservations</span>
                  )}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Shift Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Shift Breakdown
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {shiftStats.map((shift, index) => (
            <motion.div
              key={shift.shiftId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <Avatar
                        className="w-10 h-10"
                        style={{ backgroundColor: shift.shiftColor }}
                        name={shift.shiftName.substring(0, 2).toUpperCase()}
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {shift.shiftName}
                        </h4>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{shift.shiftTime}</span>
                        </div>
                      </div>
                    </div>
                    <Chip
                      size="sm"
                      color={shift.isActive ? "success" : "default"}
                      variant="flat"
                    >
                      {shift.isActive ? "Active" : "Inactive"}
                    </Chip>
                  </div>
                </CardHeader>
                
                <CardBody className="pt-0">
                  <div className="space-y-4">
                    {/* Reservations */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Reservations
                        </span>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          {shift.reservationCount}
                        </span>
                      </div>
                      <Progress
                        value={(shift.reservationCount / Math.max(totals.reservations, 1)) * 100}
                        color="primary"
                        size="sm"
                        className="max-w-full"
                      />
                    </div>

                    {/* Guests */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Guests
                        </span>
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                          {shift.guestCount}
                        </span>
                      </div>
                      <Progress
                        value={(shift.guestCount / Math.max(totals.guests, 1)) * 100}
                        color="success"
                        size="sm"
                        className="max-w-full"
                      />
                    </div>

                    {/* Average guests per reservation */}
                    {shift.reservationCount > 0 && (
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Avg. guests per reservation
                          </span>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {(shift.guestCount / shift.reservationCount).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>

        {shiftStats.length === 0 && (
          <Card>
            <CardBody className="text-center py-8">
              <Icon 
                icon="solar:chart-line-linear" 
                className="mx-auto h-12 w-12 text-gray-400 mb-4" 
              />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Shifts Found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Create shifts to see analytics for your restaurant.
              </p>
            </CardBody>
          </Card>
        )}
      </div>
    </motion.div>
  );
} 