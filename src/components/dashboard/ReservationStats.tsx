'use client';

import {
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Progress,
  Spinner,
  Modal,
  ModalContent,
  ModalBody,
  ModalHeader,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRestaurant } from '@/components/providers/RestaurantProvider';
import { useReservations } from '@/hooks/useReservation';
import { useTables } from '@/hooks/useTable';
import { useShifts } from '@/hooks/useShift';
import { useGuests } from '@/hooks/useGuest';
import { format, isSameDay, parseISO, subDays } from 'date-fns';
import { ReservationStatus } from '@/api/reservation';
import { TableStatus } from '@/types/table';
import { Clock, Users } from 'lucide-react';
import AddReservationModal from '../reservations/AddReservationModal';
import FloorPlanAssignmentModal from '../reservations/FloorPlanAssignmentModal';
import AddGuestModal from '../guests/AddGuestModal';
import ShiftAnalytics from '../shifts/ShiftAnalytics';

export default function ReservationStats() {
  // State for modals
  const [isAddReservationModalOpen, setIsAddReservationModalOpen] = useState(false);
  const [isTableAssignmentModalOpen, setIsTableAssignmentModalOpen] = useState(false);
  const [isAddGuestModalOpen, setIsAddGuestModalOpen] = useState(false);

  // Get user information from auth context
  const { user, isInitializing } = useAuth();
  const { currentRestaurant } = useRestaurant();
  
  // Format username from user data
  const username = !isInitializing && user ? 
    (user.displayName || (user.email ? user.email.split('@')[0] : 'Guest')) : 
    'Guest';

  // Get current date as string (YYYY-MM-DD)
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => format(today, 'yyyy-MM-dd'), [today]);
  
  // Fetch all data needed for the dashboard
  const { data: reservations, isLoading: isLoadingReservations, refetch: refetchReservations } = useReservations({
    restaurantId: currentRestaurant?.id,
    date: todayStr,
  });
  
  const { data: tables = [], isLoading: isLoadingTables } = useTables(currentRestaurant?.id || '');
  
  const { data: shifts = [], isLoading: isLoadingShifts } = useShifts(currentRestaurant?.id || '');
  
  const { data: allGuests = [], isLoading: isLoadingGuests } = useGuests(currentRestaurant?.id || '');
  
  // Calculate current active shift based on time
  const currentShift = useMemo(() => {
    if (!shifts || shifts.length === 0) return null;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const dayOfWeek = now.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[dayOfWeek];
    
    // Find a shift that is active for today and includes the current time
    return shifts.find(shift => {
      if (!shift.active || !shift.days.includes(todayName)) return false;
      
      const startTimeParts = shift.startTime.split(':').map(Number);
      const endTimeParts = shift.endTime.split(':').map(Number);
      
      // Convert to minutes for easy comparison
      const startMinutes = startTimeParts[0] * 60 + startTimeParts[1];
      const endMinutes = endTimeParts[0] * 60 + endTimeParts[1];
      const currentMinutesTotal = currentHour * 60 + currentMinutes;
      
      // Handle overnight shifts (e.g., 22:00 - 02:00)
      if (endMinutes < startMinutes) {
        return currentMinutesTotal >= startMinutes || currentMinutesTotal <= endMinutes;
      }
      
      return currentMinutesTotal >= startMinutes && currentMinutesTotal <= endMinutes;
    });
  }, [shifts]);
  
  // Format shift times for display
  const formatShiftTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const isPM = hours >= 12;
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
  };
  
  // Calculate weekly reservation data for charts
  const weeklyReservationData = useMemo(() => {
    if (!reservations) return [];
    
    // Create array for the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(today, 6 - i);
      const dayName = format(date, 'EEE');
      const dateStr = format(date, 'yyyy-MM-dd');
      
      return {
        date,
        dateStr,
        day: dayName,
        reservationCount: 0,
        guestCount: 0,
      };
    });
    
    // Count reservations for each day
    reservations.forEach(reservation => {
      const reservationDate = parseISO(reservation.date);
      const dateStr = format(reservationDate, 'yyyy-MM-dd');
      
      const dayData = last7Days.find(d => d.dateStr === dateStr);
      if (dayData) {
        dayData.reservationCount++;
        dayData.guestCount += reservation.numberOfGuests;
      }
    });
    
    return last7Days;
  }, [reservations, today]);
  
  // Calculate today's stats
  const todayStats = useMemo(() => {
    if (!reservations) return { total: 0, pendingCount: 0, confirmedCount: 0, seatedCount: 0, completedCount: 0, allConfirmedCount: 0 };
    
    // Filter reservations for today
    const todayReservations = reservations || [];
    
    const pendingCount = todayReservations.filter(r => r.status === ReservationStatus.PENDING).length;
    const confirmedCount = todayReservations.filter(r => r.status === ReservationStatus.CONFIRMED).length;
    const seatedCount = todayReservations.filter(r => r.status === ReservationStatus.SEATED).length;
    const completedCount = todayReservations.filter(r => r.status === ReservationStatus.COMPLETED).length;
    
    // All confirmed count includes CONFIRMED, SEATED, and COMPLETED statuses
    const allConfirmedCount = confirmedCount + seatedCount + completedCount;
    
    return {
      total: todayReservations.length,
      pendingCount,
      confirmedCount,
      seatedCount,
      completedCount,
      allConfirmedCount,
    };
  }, [reservations]);
  
  // Calculate table availability
  const tableAvailability = useMemo(() => {
    if (!tables || tables.length === 0) return { available: 0, total: 0 };
    
    const availableTables = tables.filter(table => table.status === TableStatus.AVAILABLE);
    
    return {
      available: availableTables.length,
      total: tables.length,
    };
  }, [tables]);
  
  // Get frequent guests (sorted by visit count)
  const frequentGuests = useMemo(() => {
    if (!allGuests || allGuests.length === 0) return [];
    
    // Sort by visit count (descending)
    return [...allGuests]
      .filter(guest => guest.visitCount > 0)
      .sort((a, b) => b.visitCount - a.visitCount)
      .slice(0, 5);
  }, [allGuests]);
  
  // Calculate recent guests (visited in the last 30 days)
  const recentGuests = useMemo(() => {
    if (!allGuests || allGuests.length === 0) return [];
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return allGuests
      .filter(guest => guest.lastVisit && new Date(guest.lastVisit) >= thirtyDaysAgo)
      .slice(0, 5);
  }, [allGuests]);
  
  // Calculate new guests this week
  const newGuestsThisWeek = useMemo(() => {
    if (!allGuests || allGuests.length === 0) return 0;
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return allGuests.filter(guest => {
      const createdAt = new Date(guest.createdAt);
      return createdAt >= oneWeekAgo;
    }).length;
  }, [allGuests]);
  
  // Get upcoming reservations (sorted by time)
  const upcomingReservations = useMemo(() => {
    if (!reservations) return [];
    
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    
    // Filter for today's reservations (confirmed or pending)
    return reservations
      .filter(r => {
        if (!r || !r.id || !r.startTime) return false; // Skip invalid reservations
        
        try {
          const reservationDate = new Date(r.date);
          
          // Include all of today's reservations that are pending or confirmed
          return isSameDay(reservationDate, today) && 
                 (r.status === ReservationStatus.CONFIRMED || r.status === ReservationStatus.PENDING);
        } catch (error) {
          console.error("Error processing reservation:", error);
          return false;
        }
      })
      .sort((a, b) => {
        try {
          return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        } catch {
          return 0;
        }
      })
      .slice(0, 5);
  }, [reservations, today]);
  
  // Loading state
  if (isLoadingReservations || isLoadingTables || isLoadingShifts || isLoadingGuests) {
    return (
      <div className="w-full min-h-[500px] flex items-center justify-center">
        <div className="text-center">
          <Spinner color="primary" size="lg" className="mb-4" />
          <p className="text-gray-500">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden">
      <div className="h-full overflow-y-auto overflow-x-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 px-4">
          <div className="flex items-center gap-3">
            <Avatar
              name={username}
              size="lg"
              className="bg-primary-100 text-primary-500"
              src={user?.photoURL || undefined}
            />
            <div>
              <h1 className="text-xl md:text-2xl font-semibold">Welcome, {username}</h1>
              <p className="text-default-500 text-sm">Restaurant Manager</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Command Menu Dropdown */}
            <Dropdown placement="bottom-end" radius="sm">
              <DropdownTrigger>
                <Button
                  variant="flat"
                  color="success"
                  endContent={<Icon icon="solar:alt-arrow-down-bold" width={16} />}
                  startContent={<Icon icon="solar:command-square-bold" width={18} />}
                  radius="sm"
                  size="sm"
                >
                  Quick Actions
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Quick Actions" className="min-w-[240px]">
                <DropdownItem
                  key="new-reservation"
                  description="Create a new reservation"
                  startContent={
                    <Icon icon="solar:calendar-add-bold" className="text-primary-500" width={20} />
                  }
                  onPress={() => setIsAddReservationModalOpen(true)}
                >
                  Add New Reservation
                </DropdownItem>
                
                <DropdownItem
                  key="table-assignment"
                  description="Assign tables to reservations"
                  startContent={
                    <Icon icon="mdi:table-furniture" className="text-success-500" width={20} />
                  }
                  onPress={() => setIsTableAssignmentModalOpen(true)}
                >
                  Table Assignment
                </DropdownItem>
                
                <DropdownItem
                  key="add-guest"
                  description="Add a new guest to the system"
                  startContent={
                    <Icon icon="solar:user-plus-bold" className="text-warning-500" width={20} />
                  }
                  onPress={() => setIsAddGuestModalOpen(true)}
                >
                  Add New Guest
                </DropdownItem>
                
                <DropdownItem
                  key="today-view"
                  description="View all of today's reservations"
                  startContent={
                    <Icon icon="solar:list-bold" className="text-default-500" width={20} />
                  }
                  as={Link}
                  href="/reservations"
                >
                  Today's Reservations
                </DropdownItem>
                
                <DropdownItem
                  key="floor-plan"
                  description="View and manage your restaurant floor plan"
                  startContent={
                    <Icon icon="mdi:floor-plan" className="text-indigo-500" width={20} />
                  }
                  as={Link}
                  href="/floor-plan"
                >
                  Floor Plans
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>

            {currentShift && (
              <>
                <Badge color="primary" content={currentShift.active ? "Active" : "Inactive"} placement="top-right">
                  <Icon className="text-primary-500" icon="mdi:account-group" width={20} />
                </Badge>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-default-600">
                    Current Shift: {currentShift.name}
                  </span>
                  <span className="text-xs text-default-400">
                    {formatShiftTime(currentShift.startTime)} - {formatShiftTime(currentShift.endTime)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Reservation KPIs with charts and Table Availability */}
        <dl className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4 px-4">
          {/* Today's Reservations Card */}
          <Card className="dark:border-default-100">
            <section className="flex flex-col flex-nowrap">
              <div className="flex flex-col justify-between gap-y-2 px-3 pt-3">
                <div className="flex flex-col gap-y-2">
                  <div className="flex flex-col gap-y-0">
                    <dt className="text-sm font-medium text-default-600">Today's Reservations</dt>
                    <dt className="text-tiny font-normal text-default-400">Total bookings for today</dt>
                  </div>
                  <div className="flex items-baseline gap-x-2">
                    <dd className="text-lg font-semibold text-default-700">{todayStats.total}</dd>
                    <Chip
                      classNames={{
                        content: 'font-medium text-xs',
                      }}
                      color="success"
                      radius="sm"
                      size="sm"
                      startContent={<Icon height={14} icon={'solar:arrow-right-up-linear'} width={14} />}
                      variant="flat"
                    >
                      <span>{todayStats.allConfirmedCount} confirmed+</span>
                    </Chip>
                  </div>
                </div>
              </div>
              <div className="min-h-20 w-full">
                <ResponsiveContainer className="[&_.recharts-surface]:outline-none">
                  <AreaChart
                    accessibilityLayer
                    className="translate-y-1 scale-105"
                    data={weeklyReservationData}
                  >
                    <defs>
                      <linearGradient id={'colorUv0'} x1="0" x2="0" y1="0" y2="1">
                        <stop offset="10%" stopColor="hsl(var(--heroui-success))" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(var(--heroui-success))" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <YAxis
                      domain={[0, 'auto']}
                      hide={true}
                    />
                    <Area
                      dataKey="reservationCount"
                      fill={'url(#colorUv0)'}
                      stroke={'hsl(var(--heroui-success))'}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <Dropdown
                classNames={{
                  content: 'min-w-[120px]',
                }}
                placement="bottom-end"
              >
                <DropdownTrigger>
                  <Button
                    isIconOnly
                    className="absolute right-2 top-2 w-auto rounded-full"
                    size="sm"
                    variant="light"
                  >
                    <Icon height={16} icon="solar:menu-dots-bold" width={16} />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  itemClasses={{
                    title: 'text-tiny',
                  }}
                  variant="flat"
                >
                  <DropdownItem key="view-details" as={Link} href="/reservations">View All Reservations</DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </section>
          </Card>
          
          {/* Guest Count Card */}
          <Card className="dark:border-default-100">
            <section className="flex flex-col flex-nowrap">
              <div className="flex flex-col justify-between gap-y-2 px-3 pt-3">
                <div className="flex flex-col gap-y-2">
                  <div className="flex flex-col gap-y-0">
                    <dt className="text-sm font-medium text-default-600">Guest Count</dt>
                    <dt className="text-tiny font-normal text-default-400">Total guests today</dt>
                  </div>
                  <div className="flex items-baseline gap-x-2">
                    <dd className="text-lg font-semibold text-default-700">
                      {weeklyReservationData.length > 0 
                        ? weeklyReservationData[weeklyReservationData.length - 1].guestCount 
                        : 0}
                    </dd>
                    <Chip
                      classNames={{
                        content: 'font-medium text-xs',
                      }}
                      color="primary"
                      radius="sm"
                      size="sm"
                      startContent={<Icon height={14} icon={'solar:arrow-right-up-linear'} width={14} />}
                      variant="flat"
                    >
                      <span>{todayStats.seatedCount} seated</span>
                    </Chip>
                  </div>
                </div>
              </div>
              <div className="min-h-20 w-full">
                <ResponsiveContainer className="[&_.recharts-surface]:outline-none">
                  <AreaChart
                    accessibilityLayer
                    className="translate-y-1 scale-105"
                    data={weeklyReservationData}
                  >
                    <defs>
                      <linearGradient id={'colorUv1'} x1="0" x2="0" y1="0" y2="1">
                        <stop offset="10%" stopColor="hsl(var(--heroui-primary))" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(var(--heroui-primary))" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <YAxis
                      domain={[0, 'auto']}
                      hide={true}
                    />
                    <Area
                      dataKey="guestCount"
                      fill={'url(#colorUv1)'}
                      stroke={'hsl(var(--heroui-primary))'}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <Dropdown
                classNames={{
                  content: 'min-w-[120px]',
                }}
                placement="bottom-end"
              >
                <DropdownTrigger>
                  <Button
                    isIconOnly
                    className="absolute right-2 top-2 w-auto rounded-full"
                    size="sm"
                    variant="light"
                  >
                    <Icon height={16} icon="solar:menu-dots-bold" width={16} />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  itemClasses={{
                    title: 'text-tiny',
                  }}
                  variant="flat"
                >
                  <DropdownItem key="view-details" as={Link} href="/guests">View Guest Data</DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </section>
          </Card>

          {/* Table Availability Card */}
          <Card className="flex flex-col p-3 dark:border-default-100">
            <div className="flex h-7 w-7 items-center justify-center rounded-md border p-0.5 border-success-200 bg-success-50 dark:border-success-100">
              <Icon className="text-success-500" icon="mdi:table-furniture" width={18} />
            </div>

            <div className="pt-1">
              <dt className="my-2 text-sm font-medium text-default-500">Tables Available</dt>
              <dd className="text-lg font-semibold text-default-700">
                {tableAvailability.available}{' '}
                <span className="text-sm text-default-400">of {tableAvailability.total}</span>
              </dd>
            </div>
            <Progress
              aria-label="status"
              className="mt-2"
              color="success"
              value={(tableAvailability.available / tableAvailability.total) * 100}
              size="sm"
            />
            <Dropdown
              classNames={{
                content: 'min-w-[120px]',
              }}
              placement="bottom-end"
            >
              <DropdownTrigger>
                <Button
                  isIconOnly
                  className="absolute right-2 top-2 w-auto rounded-full"
                  size="sm"
                  variant="light"
                >
                  <Icon height={16} icon="solar:menu-dots-bold" width={16} />
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                itemClasses={{
                  title: 'text-tiny',
                }}
                variant="flat"
              >
                <DropdownItem key="view-details" as={Link} href="/tables">View Tables</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </Card>
        </dl>

        {/* Bottom section with Upcoming Reservations Table and Guest Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-4 px-4">
          {/* Upcoming Reservations Table */}
          <div className="lg:col-span-2">
            <Card className="dark:border-default-100 h-full">
              <div className="flex justify-between items-center p-3 border-b border-default-100">
                <h3 className="text-base font-semibold">Upcoming Reservations</h3>
                <Link
                  href="/reservations"
                  className="text-primary-500 text-xs font-medium flex items-center gap-1 hover:underline"
                >
                  View All
                  <Icon icon="solar:arrow-right-linear" width={14} />
                </Link>
              </div>

              <div className="p-4">
                {upcomingReservations.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingReservations.slice(0, 5).map(reservation => {
                      if (!reservation?.id) return null;
                      
                      // Safely format time
                      let formattedTime = "N/A";
                      try {
                        formattedTime = format(new Date(reservation.startTime), 'h:mm a');
                      } catch (error) {
                        console.error("Error formatting time:", error);
                      }
                      
                      return (
                        <div key={reservation.id} className="flex items-center justify-between p-2 border rounded-lg bg-white dark:bg-gray-800">
                          <div className="flex items-center gap-2">
                            <Avatar name={reservation.guest?.name || 'Guest'} size="sm" className="text-primary-500" />
                            <div>
                              <div className="font-medium text-sm">{reservation.guest?.name || 'Guest'}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {formattedTime}
                                <span className="mx-1">•</span>
                                <Users className="h-3 w-3" /> {reservation.numberOfGuests || 0}
                                <span className="mx-1">•</span>
                                {reservation.table ? (
                                  <span>Table {reservation.table.name}</span>
                                ) : (
                                  <span className="text-amber-500">Not assigned</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Chip
                              size="sm"
                              color={reservation.status === ReservationStatus.CONFIRMED ? 'success' : 'warning'}
                              variant="flat"
                              className="text-xs"
                            >
                              {reservation.status === ReservationStatus.CONFIRMED ? 'Confirmed' : 'Pending'}
                            </Chip>
                            <Button isIconOnly size="sm" variant="light" as={Link} href="/reservations">
                              <Icon icon="solar:pen-linear" width={14} />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="mb-2 text-base">No upcoming reservations</div>
                    <p className="text-xs">No upcoming reservations for today</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Guest Insights Card */}
          <div className="lg:col-span-1">
            <Card className="dark:border-default-100 h-full">
              <div className="flex justify-between items-center p-3 border-b border-default-100">
                <h3 className="text-base font-semibold">Guest Insights</h3>
                <Button isIconOnly size="sm" variant="light" className="text-default-500">
                  <Icon icon="solar:info-circle-linear" width={16} />
                </Button>
              </div>

              <div className="p-3 flex flex-col gap-4">
                {/* Recent Guests */}
                <div className="flex items-start gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md border p-0.5 border-primary-200 bg-primary-50 dark:border-primary-100">
                    <Icon
                      className="text-primary-500"
                      icon="solar:users-group-rounded-bold"
                      width={18}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-default-700">Recent Guests</h4>
                    <p className="text-xs text-default-500 mb-1">
                      Repeat customers in the last month
                    </p>
                    {recentGuests.length > 0 ? (
                      <div className="flex -space-x-2 overflow-hidden mt-2">
                        {recentGuests.slice(0, 4).map((guest) => (
                          <Avatar key={guest.id} name={guest.name} size="sm" />
                        ))}
                        {recentGuests.length > 4 && (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-default-100 text-default-600 text-xs">
                            +{recentGuests.length - 4}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-default-400 mt-2">No recent guests found</p>
                    )}
                  </div>
                </div>

                {/* Frequent Guests */}
                <div className="flex items-start gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md border p-0.5 border-success-200 bg-success-50 dark:border-success-100">
                    <Icon className="text-success-500" icon="solar:medal-ribbon-bold" width={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-default-700">Frequent Guests</h4>
                    <p className="text-xs text-default-500 mb-1">
                      Guests who visit often (loyalty tracking)
                    </p>
                    <div className="flex flex-col gap-2 mt-2">
                      {frequentGuests.length > 0 ? (
                        frequentGuests.slice(0, 2).map((guest) => (
                          <div key={guest.id} className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Avatar name={guest.name} size="sm" />
                              <span className="text-xs font-medium">{guest.name}</span>
                            </div>
                            <Chip size="sm" color="success" variant="flat" className="text-xs">
                              {guest.visitCount} visits
                            </Chip>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-default-400">No frequent guests yet</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* New Guests */}
                <div className="flex items-start gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md border p-0.5 border-warning-200 bg-warning-50 dark:border-warning-100">
                    <Icon className="text-warning-500" icon="solar:user-plus-bold" width={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-default-700">New Guests</h4>
                    <p className="text-xs text-default-500 mb-1">First-time visitors this week</p>
                    <div className="mt-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-default-600">New guests</span>
                        <span className="text-xs font-medium">{newGuestsThisWeek}</span>
                      </div>
                      <Progress
                        aria-label="New guests"
                        value={newGuestsThisWeek > 0 ? 100 : 0}
                        color="warning"
                        size="sm"
                        className="max-w-md"
                      />
                      {newGuestsThisWeek > 0 && (
                        <p className="text-xs text-success-500 mt-1 flex items-center gap-1">
                          <Icon icon="solar:arrow-up-bold" width={12} />
                          <span>New guests added this week</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
        
        {/* Shift Analytics Section */}
        <div className="mt-8">
          <ShiftAnalytics selectedDate={todayStr} />
        </div>
      </div>
      
      {/* Modals */}
      <Modal
        isOpen={isAddReservationModalOpen}
        onClose={() => setIsAddReservationModalOpen(false)}
        placement="center"
        scrollBehavior="inside"
        size="5xl"
        classNames={{
          base: 'max-w-5xl',
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">New Reservation</ModalHeader>
              <ModalBody className="p-0">
                <AddReservationModal
                  onClose={onClose}
                  onSuccess={() => {
                    setIsAddReservationModalOpen(false);
                    // Refresh data
                    refetchReservations?.();
                  }}
                  selectedGuest={null}
                />
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
      
      <Modal
        isOpen={isTableAssignmentModalOpen}
        onClose={() => setIsTableAssignmentModalOpen(false)}
        size="full"
        hideCloseButton
        classNames={{
          base: 'w-full h-full m-0',
          body: 'p-0',
        }}
      >
        <ModalContent>
          {(onClose) => (
            <FloorPlanAssignmentModal
              onClose={onClose}
              onSuccess={() => {
                setIsTableAssignmentModalOpen(false);
                // Refresh data
                refetchReservations?.();
              }}
              date={todayStr}
            />
          )}
        </ModalContent>
      </Modal>
      
      {/* Add Guest Modal */}
      {isAddGuestModalOpen && (
        <AddGuestModal
          isOpen={isAddGuestModalOpen}
          onClose={() => setIsAddGuestModalOpen(false)}
        />
      )}
    </div>
  );
}
