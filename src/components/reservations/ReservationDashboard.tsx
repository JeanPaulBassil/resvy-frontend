'use client';

import { Guest } from '@/api/guest';
import { ReservationStatus } from '@/api/reservation';
import { useReservations } from '@/hooks/useReservation';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  DatePicker,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Tab,
  Tabs,
  Tooltip,
} from '@heroui/react';
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
import { format } from 'date-fns';
import { 
  Filter, 
  LayoutGrid, 
  Plus, 
  RefreshCw, 
  Search, 
  Users, 
  X,
  CalendarClock,
  Calendar as CalendarIcon,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { useRestaurant } from '../providers/RestaurantProvider';
import AddReservationModal from './AddReservationModal';
import ReservationList from './ReservationList';
import FloorPlanAssignmentModal from './FloorPlanAssignmentModal';
import SmsTestButton from '../debug/SmsTestButton';

type StatusFilter = ReservationStatus | 'ALL';

export default function ReservationDashboard() {
  const { currentRestaurant } = useRestaurant();
  const restaurantId = currentRestaurant?.id;
  const toast = useToast();

  // State for filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [dateFilter, setDateFilter] = useState<CalendarDate | null>(today(getLocalTimeZone()));
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [isFloorPlanModalOpen, setIsFloorPlanModalOpen] = useState(false);

  // Convert CalendarDate to string format for the API
  const dateString = dateFilter ? format(new Date(dateFilter.toString()), 'yyyy-MM-dd') : undefined;

  // Fetch reservations with filters (without searchQuery since it might not be supported by the backend)
  const {
    data: allReservations,
    isLoading: isLoadingReservations,
    refetch: refetchReservations,
  } = useReservations({
    restaurantId: restaurantId,
    date: dateString,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  });

  // Client-side filtering for search
  const reservations = useMemo(() => {
    if (!allReservations) return [];
    
    // If no search query, return all reservations
    if (!searchQuery) return allReservations;
    
    const normalizedQuery = searchQuery.toLowerCase().trim();
    
    // Filter reservations client-side based on search query
    return allReservations.filter(reservation => {
      // Search in guest info
      const guestName = reservation.guest?.name?.toLowerCase() || '';
      const guestPhone = reservation.guest?.phone?.toLowerCase() || '';
      const guestEmail = reservation.guest?.email?.toLowerCase() || '';
      
      // Search in table info
      const tableName = reservation.table?.name?.toLowerCase() || '';
      
      // Search in notes
      const notes = reservation.note?.toLowerCase() || '';
      
      // Return true if any of the fields contain the search query
      return (
        guestName.includes(normalizedQuery) ||
        guestPhone.includes(normalizedQuery) ||
        guestEmail.includes(normalizedQuery) ||
        tableName.includes(normalizedQuery) ||
        notes.includes(normalizedQuery)
      );
    });
  }, [allReservations, searchQuery]);

  // Formatted date display
  const formattedDate = dateFilter
    ? format(new Date(dateFilter.toString()), 'EEEE, MMMM d, yyyy')
    : 'All dates';

  // Handle date change
  const handleDateChange = (value: CalendarDate | null) => {
    setDateFilter(value);
  };

  // Handle search query change with debouncing
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    console.log('Search query changed to:', value);
    
    // Log the filtered results count (for debugging)
    if (allReservations) {
      const filtered = allReservations.filter(reservation => {
        const normalizedQuery = value.toLowerCase().trim();
        const guestName = reservation.guest?.name?.toLowerCase() || '';
        const guestPhone = reservation.guest?.phone?.toLowerCase() || '';
        return guestName.includes(normalizedQuery) || guestPhone.includes(normalizedQuery);
      });
      console.log(`Search found ${filtered.length} matches out of ${allReservations.length} reservations`);
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setStatusFilter('ALL');
    setDateFilter(today(getLocalTimeZone()));
    setSearchQuery('');
    
    // Show toast notification
    toast.success('Filters have been reset');
    
    // After resetting filters, refresh the data
    setTimeout(() => {
      refetchReservations();
    }, 100);
  };

  // Close the add reservation modal
  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setSelectedGuest(null);
  };

  // Open/close floor plan assignment modal
  const handleOpenFloorPlanModal = () => {
    console.log('Opening floor plan modal with date:', dateString);
    setIsFloorPlanModalOpen(true);
  };

  const handleCloseFloorPlanModal = () => {
    setIsFloorPlanModalOpen(false);
    refetchReservations();
  };

  // Refresh reservations - ensure this method is comprehensive
  const handleRefresh = () => {
    console.log('Refreshing reservations data...');
    
    // Show loading toast
    toast.info('Refreshing reservations...');
    
    // Perform the refresh
    refetchReservations()
      .then(() => {
        toast.success('Reservations refreshed successfully!');
      })
      .catch(error => {
        console.error('Error refreshing reservations:', error);
        toast.error('Failed to refresh reservations');
      });
  };

  // Count reservations by status
  const counts = {
    total: reservations?.length || 0,
    pending: reservations?.filter((r) => r.status === ReservationStatus.PENDING).length || 0,
    confirmed: reservations?.filter((r) => r.status === ReservationStatus.CONFIRMED).length || 0,
    seated: reservations?.filter((r) => r.status === ReservationStatus.SEATED).length || 0,
    completed: reservations?.filter((r) => r.status === ReservationStatus.COMPLETED).length || 0,
    noShow: reservations?.filter((r) => r.status === ReservationStatus.NO_SHOW).length || 0,
    cancelled: reservations?.filter((r) => r.status === ReservationStatus.CANCELLED).length || 0,
  };

  // Function to reset date to today
  const handleBackToToday = () => {
    const todayDate = today(getLocalTimeZone());
    setDateFilter(todayDate);
  };

  if (!restaurantId) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Please select a restaurant to view reservations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with title and add button */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/20 p-6 rounded-xl shadow-sm border border-primary-200 dark:border-primary-800/30">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Reservations</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            <span>Manage your restaurant's reservations efficiently</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Tooltip content="Refresh reservations">
            <Button
              color="default"
              variant="flat"
              radius="full"
              isIconOnly
              startContent={<RefreshCw className="h-4 w-4" />}
              onPress={handleRefresh}
              isLoading={isLoadingReservations}
              className="sm:order-3"
            />
          </Tooltip>
          <Tooltip content="Table assignment">
            <Button
              color="primary"
              variant="flat"
              radius="full"
              startContent={<LayoutGrid className="h-4 w-4" />}
              onPress={handleOpenFloorPlanModal}
              className="hidden sm:flex"
            >
              Table Assignment
            </Button>
          </Tooltip>
          <Button
            color="success"
            radius="full"
            className="text-white"
            startContent={<Plus className="h-4 w-4" />}
            onPress={() => setIsAddModalOpen(true)}
          >
            Add Reservation
          </Button>
        </div>
      </div>

      {/* Stats overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-white shadow-sm dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardBody className="py-4 flex flex-col items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total</p>
            <p className="text-3xl font-semibold">{counts.total}</p>
            <span className="text-xs mt-2 flex items-center gap-1 text-gray-500">
              <Users className="h-3 w-3" /> Today's reservations
            </span>
          </CardBody>
        </Card>
        
        <Card className="bg-white shadow-sm dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardBody className="py-4 flex flex-col items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Pending</p>
            <p className="text-3xl font-semibold text-amber-500">{counts.pending}</p>
            <Badge color="warning" variant="flat" size="sm" className="mt-2">
              Need confirmation
            </Badge>
          </CardBody>
        </Card>
        
        <Card className="bg-white shadow-sm dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardBody className="py-4 flex flex-col items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Confirmed</p>
            <p className="text-3xl font-semibold text-blue-500">{counts.confirmed}</p>
            <Badge color="primary" variant="flat" size="sm" className="mt-2">
              Ready for service
            </Badge>
          </CardBody>
        </Card>
        
        <Card className="bg-white shadow-sm dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardBody className="py-4 flex flex-col items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Seated</p>
            <p className="text-3xl font-semibold text-green-500">{counts.seated}</p>
            <Badge color="success" variant="flat" size="sm" className="mt-2">
              Currently dining
            </Badge>
          </CardBody>
        </Card>
        
        <Card className="bg-white shadow-sm dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardBody className="py-4 flex flex-col items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Completed</p>
            <p className="text-3xl font-semibold">{counts.completed}</p>
            <Badge color="default" variant="flat" size="sm" className="mt-2">
              Finished dining
            </Badge>
          </CardBody>
        </Card>
        
        <Card className="bg-white shadow-sm dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardBody className="py-4 flex flex-col items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Cancelled/No Show</p>
            <p className="text-3xl font-semibold text-red-500">{counts.cancelled + counts.noShow}</p>
            <Badge color="danger" variant="flat" size="sm" className="mt-2">
              Not fulfilled
            </Badge>
          </CardBody>
        </Card>
      </div>

      {/* Simplified filters section */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="pb-4 pt-4 px-6 flex-col sm:flex-row sm:items-center gap-4 bg-gray-50 dark:bg-gray-800/60">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          <div className="flex flex-wrap gap-3 w-full">
            {/* Date selector with improved visibility */}
            <div className="flex-grow max-w-[200px]">
              <DatePicker
                value={dateFilter}
                onChange={handleDateChange}
                classNames={{
                  label: 'text-xs',
                  inputWrapper: 'h-10',
                }}
                popoverProps={{
                  classNames: {
                    content: 'p-0 shadow-xl border border-gray-200 dark:border-gray-700',
                  },
                  placement: "bottom-start",
                  offset: 5,
                }}
              />
            </div>

            {/* Search input */}
            <div className="flex-grow relative">
              <Input
                value={searchQuery}
                onValueChange={handleSearchChange}
                placeholder="Search by guest name, phone, email..."
                startContent={<Search className="text-gray-400 h-4 w-4" />}
                isClearable
                onClear={() => setSearchQuery('')}
                classNames={{
                  inputWrapper: 'h-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600',
                }}
              />
            </div>

            {/* Reset filters button */}
            <Button
              variant="flat"
              radius="full"
              size="sm"
              onPress={resetFilters}
              startContent={<X className="h-4 w-4" />}
              className="h-10 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              Reset
            </Button>

            {/* SMS Test Button */}
            <SmsTestButton />
          </div>
        </CardHeader>

        <CardBody className="p-0">
          {/* Tabs for reservation status with improved UI */}
          <Tabs
            aria-label="Reservation Status"
            selectedKey={statusFilter}
            onSelectionChange={(key) => setStatusFilter(key as StatusFilter)}
            color="primary"
            variant="underlined"
            classNames={{
              tab: 'px-6 h-12 data-[selected=true]:text-primary-500 data-[selected=true]:font-medium',
              tabList: 'px-6 bg-white dark:bg-gray-800/60',
              cursor: 'bg-primary-500',
              panel: 'p-0',
            }}
          >
            <Tab
              key="ALL"
              title={
                <div className="flex items-center gap-2">
                  <span>All</span>
                  <Badge color="default" size="sm" variant="flat">{counts.total}</Badge>
                </div>
              }
            />
            <Tab
              key={ReservationStatus.PENDING}
              title={
                <div className="flex items-center gap-2">
                  <span>Pending</span>
                  <Badge color="warning" size="sm" variant="flat">{counts.pending}</Badge>
                </div>
              }
            />
            <Tab
              key={ReservationStatus.CONFIRMED}
              title={
                <div className="flex items-center gap-2">
                  <span>Confirmed</span>
                  <Badge color="primary" size="sm" variant="flat">{counts.confirmed}</Badge>
                </div>
              }
            />
            <Tab
              key={ReservationStatus.SEATED}
              title={
                <div className="flex items-center gap-2">
                  <span>Seated</span>
                  <Badge color="success" size="sm" variant="flat">{counts.seated}</Badge>
                </div>
              }
            />
            <Tab
              key={ReservationStatus.COMPLETED}
              title={
                <div className="flex items-center gap-2">
                  <span>Completed</span>
                  <Badge color="default" size="sm" variant="flat">{counts.completed}</Badge>
                </div>
              }
            />
            <Tab
              key={ReservationStatus.NO_SHOW}
              title={
                <div className="flex items-center gap-2">
                  <span>No Show</span>
                  <Badge color="danger" size="sm" variant="flat">{counts.noShow}</Badge>
                </div>
              }
            />
            <Tab
              key={ReservationStatus.CANCELLED}
              title={
                <div className="flex items-center gap-2">
                  <span>Cancelled</span>
                  <Badge color="danger" size="sm" variant="flat">{counts.cancelled}</Badge>
                </div>
              }
            />
          </Tabs>

          {/* Date info banner */}
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/30 border-y border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{formattedDate}</span>
              </div>
              
              {/* Back to Today button */}
              {dateFilter && format(new Date(dateFilter.toString()), 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd') && (
                <Button
                  size="sm"
                  radius="full"
                  variant="flat"
                  color="primary"
                  className="h-8 px-3 text-xs font-medium border border-primary-200 bg-primary-50/50 hover:bg-primary-100/50 dark:border-primary-800 dark:bg-primary-900/20 dark:hover:bg-primary-800/30"
                  startContent={<CalendarIcon className="h-3.5 w-3.5" />}
                  onPress={handleBackToToday}
                >
                  Back to Today
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {searchQuery && (
                <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 py-1 px-2 rounded-full flex items-center gap-1">
                  <Search className="h-3 w-3" />
                  Search: {searchQuery}
                </span>
              )}
              {counts.total > 0 ? (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {counts.pending + counts.confirmed} upcoming · {counts.seated} currently seated
                </span>
              ) : dateFilter ? (
                <span className="text-xs flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-3 w-3" />
                  No reservations found for this date
                </span>
              ) : (
                <span className="text-xs flex items-center gap-1 text-gray-500 dark:text-gray-400">
                  <CheckCircle className="h-3 w-3 text-green-500" /> 
                  All reservations shown
                </span>
              )}
            </div>
          </div>

          {/* Reservation list */}
          <div className="p-0">
            <ReservationList
              reservations={reservations || []}
              isLoading={isLoadingReservations}
              onRefresh={refetchReservations}
            />
          </div>
        </CardBody>
      </Card>

      <Modal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        placement="bottom"
        scrollBehavior="outside"
        size="full"
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
                    refetchReservations();
                    handleCloseAddModal();
                  }}
                  selectedGuest={selectedGuest}
                />
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Floor Plan Assignment Modal */}
      <Modal
        isOpen={isFloorPlanModalOpen}
        onClose={handleCloseFloorPlanModal}
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
                refetchReservations();
              }}
              date={dateString}
            />
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
