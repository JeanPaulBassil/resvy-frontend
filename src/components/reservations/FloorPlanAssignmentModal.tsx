'use client';

import { reservationApi } from '@/api/reservation';
import { useReservations } from '@/hooks/useReservation';
import { useTables } from '@/hooks/useTable';
import { useFloors } from '@/hooks/useFloor';
import { TableStatus } from '@/types/table';
import {
  Button,
  Chip,
  Tooltip,
  Avatar,
  Badge,
  Tabs,
  Tab,
  Input,
} from '@heroui/react';
import { useState, useEffect, useMemo } from 'react';
import { useRestaurant } from '../providers/RestaurantProvider';
import FloorPlan from '../floor-plan/floor-plan';
import { format, parseISO } from 'date-fns';
import { 
  CalendarDays, Clock, Users, Check, X, AlertTriangle, Search, 
  RefreshCcw, ChevronRight, Filter, Map, Layers, LayoutGrid, 
  ThumbsUp, LogOut, CircleSlash, Loader2, Coffee
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloorPlanAssignmentModalProps {
  onClose: () => void;
  onSuccess: () => void;
  date?: string; // Optional date filter
}

export default function FloorPlanAssignmentModal({
  onClose,
  onSuccess,
  date,
}: FloorPlanAssignmentModalProps) {
  const { currentRestaurant } = useRestaurant();
  const restaurantId = currentRestaurant?.id || '';
  const [selectedFloorId, setSelectedFloorId] = useState<string>('');
  const [selectedTableIds, _setSelectedTableIds] = useState<string[]>([]);
  const [draggingReservationId, setDraggingReservationId] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [assignmentHistory, setAssignmentHistory] = useState<{id: string, action: 'assign' | 'unassign', timestamp: number}[]>([]);
  const [isFullScreenMode, setIsFullScreenMode] = useState(false);
  
  // Fetch data
  const { data: floors = [], isLoading: isLoadingFloors } = useFloors(restaurantId);
  const { data: tables = [], isLoading: isLoadingTables } = useTables(restaurantId);
  const { data: reservations = [], isLoading: isLoadingReservations, refetch: refetchReservations } = useReservations({
    restaurantId,
    date,
  });
  
  // Set active floor when floors are loaded
  useEffect(() => {
    if (floors.length > 0 && !selectedFloorId) {
      setSelectedFloorId(floors[0].id);
    }
  }, [floors, selectedFloorId]);
  
  // Filter tables by floor
  const floorTables = tables.filter(table => table.floorId === selectedFloorId);
  
  // Filter and sort reservations
  const filteredReservations = useMemo(() => {
    let result = [...reservations];
    
    // Apply tab filter
    if (selectedTab === 'unassigned') {
      result = result.filter(r => !r.tableId);
    } else if (selectedTab === 'assigned') {
      result = result.filter(r => r.tableId);
    }
    
    // Apply search filter if query exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.guest?.name?.toLowerCase().includes(query) ||
        r.guest?.phone?.toLowerCase().includes(query) ||
        r.id.toLowerCase().includes(query) ||
        (r.table?.name && r.table.name.toLowerCase().includes(query))
      );
    }
    
    // Sort by time
    result.sort((a, b) => {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
    
    return result;
  }, [reservations, selectedTab, searchQuery]);
  
  // Handle table selection when a reservation is being dragged
  const handleTableSelection = (tableId: string) => {
    if (draggingReservationId) {
      handleDropOnTable(draggingReservationId, tableId);
    }
  };
  
  // Handle dropping a reservation onto a table
  const handleDropOnTable = async (reservationId: string, tableId: string) => {
    try {
      // Reset dragging state
      setDraggingReservationId(null);
      
      // Find the reservation and table
      const reservation = reservations.find(r => r.id === reservationId);
      const table = tables.find(t => t.id === tableId);
      
      // Early exit if reservation or table not found
      if (!reservation || !table) {
        console.error('Reservation or table not found');
        setError('Reservation or table not found');
        return;
      }
      
      // Check if the table has enough capacity
      if (table.capacity >= reservation.numberOfGuests) {
        console.log(`Assigning reservation ${reservationId} to table ${tableId}`);
        
        // Show assignment in progress
        setIsAssigning(true);
        
        try {
          // Use the API client directly
          await reservationApi.assignTable(reservationId, { tableId });
          
          // Record in history
          setAssignmentHistory(prev => [
            { id: reservationId, action: 'assign', timestamp: Date.now() },
            ...prev
          ]);
          
          // Show success message
          setSuccess(`Assigned ${reservation.guest?.name || 'Guest'} to Table ${table.name}`);
          
          // Refresh the data
          await refetchReservations();
          onSuccess();
        } catch (error) {
          console.error('Error assigning table through API:', error);
          setError('Error assigning table. Please try again.');
        } finally {
          setIsAssigning(false);
        }
      } else {
        console.error('Table does not have enough capacity');
        setError(`Table ${table.name} can only seat ${table.capacity} guests, but this reservation is for ${reservation.numberOfGuests} guests.`);
      }
    } catch (error) {
      console.error('Error in handleDropOnTable:', error);
      setIsAssigning(false);
      setError('An unexpected error occurred. Please try again.');
    }
  };
  
  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);
  
  // Handle unassigning a table
  const handleUnassignTable = async (reservationId: string) => {
    try {
      setIsAssigning(true);
      console.log(`Unassigning table from reservation ${reservationId}`);
      
      const reservation = reservations.find(r => r.id === reservationId);
      
      // Use updateReservation instead of assignTable for removing table assignments
      await reservationApi.updateReservation(reservationId, { tableId: null });
      
      // Record in history
      setAssignmentHistory(prev => [
        { id: reservationId, action: 'unassign', timestamp: Date.now() },
        ...prev
      ]);
      
      // Show success message
      setSuccess(`Unassigned ${reservation?.guest?.name || 'Guest'} from table`);
      
      // Add a small delay before refetching to ensure API has time to update
      setTimeout(async () => {
        try {
          await refetchReservations();
          onSuccess();
        } catch (refetchError) {
          console.error('Error refetching after unassign:', refetchError);
          setError('Failed to refresh data after unassigning table.');
        } finally {
          setIsAssigning(false);
        }
      }, 500);
    } catch (error) {
      console.error('Error unassigning table:', error);
      setIsAssigning(false);
      setError('Failed to unassign table. Please try again.');
      // If there's an error, still try to refetch to ensure UI is in sync
      refetchReservations().catch(refetchError => 
        console.error('Error refetching after unassign error:', refetchError)
      );
    }
  };
  
  // Handle drag start
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, reservationId: string) => {
    e.dataTransfer.setData('reservationId', reservationId);
    setDraggingReservationId(reservationId);
    
    if (e.currentTarget instanceof HTMLElement) {
      const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
      dragImage.style.opacity = '0.5';
      dragImage.style.transform = 'scale(0.75)';
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-1000px';
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 20, 20);
      
      setTimeout(() => {
        document.body.removeChild(dragImage);
      }, 0);
    }
  };
  
  // Handle drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  // Handle drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const reservationId = e.dataTransfer.getData('reservationId');
    
    const tableElement = findTableElement(e.target as HTMLElement);
    if (tableElement) {
      const tableId = tableElement.getAttribute('data-table-id');
      if (tableId) {
        handleDropOnTable(reservationId, tableId);
      }
    }
  };
  
  // Find the table element from a child element
  const findTableElement = (element: HTMLElement | null): HTMLElement | null => {
    if (!element) return null;
    
    // Check if this element has the data-table-id attribute
    if (element.hasAttribute('data-table-id')) {
      return element;
    }
    
    // Try parent element
    if (element.parentElement) {
      return findTableElement(element.parentElement);
    }
    
    return null;
  };
  
  // Format date and time for display
  const formatDateTime = (date: string, time: string) => {
    try {
      const dateTime = parseISO(time);
      const formattedTime = format(dateTime, 'h:mm a');
      const formattedDate = format(parseISO(date), 'EEE, MMM d');
      return { date: formattedDate, time: formattedTime };
    } catch {
      return { date: 'Invalid date', time: 'Invalid time' };
    }
  };
  
  // Loading state
  if (isLoadingFloors || isLoadingTables || isLoadingReservations) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white dark:bg-gray-900">
        <div className="relative w-16 h-16">
          <motion.div 
            className="absolute inset-0 rounded-full border-4 border-primary/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Coffee className="h-6 w-6 text-primary" />
          </div>
        </div>
        <p className="mt-4 text-gray-600 dark:text-gray-300 animate-pulse">Loading floor plan data...</p>
      </div>
    );
  }
  
  // Show assignment loading overlay instead of full screen replacement
  const loadingOverlay = isAssigning && (
    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg flex items-center gap-3">
        <Loader2 className="h-5 w-5 text-primary animate-spin" />
        <p>Updating table assignment...</p>
      </div>
    </div>
  );
  
  return (
    <div className={`flex flex-col h-full relative ${isFullScreenMode ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : ''}`}>
      {loadingOverlay}
      
      {/* Notifications */}
      <AnimatePresence>
        {error && (
          <motion.div 
            className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 min-w-[300px] max-w-md">
              <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0" />
              <span className="flex-1">{error}</span>
              <button 
                className="text-red-400 hover:text-red-600 dark:text-red-300 dark:hover:text-red-100" 
                onClick={() => setError(null)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
        
        {success && (
          <motion.div 
            className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 min-w-[300px] max-w-md">
              <ThumbsUp className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0" />
              <span className="flex-1">{success}</span>
              <button 
                className="text-green-400 hover:text-green-600 dark:text-green-300 dark:hover:text-green-100" 
                onClick={() => setSuccess(null)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-lg">
            <Map className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Table Assignment</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {date ? format(new Date(date), 'EEEE, MMMM d, yyyy') : 'All reservations'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip content="Toggle fullscreen mode">
            <Button
              size="sm"
              variant="flat"
              color="default"
              className="h-9 w-9 p-0 min-w-0"
              onPress={() => setIsFullScreenMode(!isFullScreenMode)}
            >
              {isFullScreenMode ? (
                <LogOut className="h-4 w-4" />
              ) : (
                <LayoutGrid className="h-4 w-4" />
              )}
            </Button>
          </Tooltip>
          <Tooltip content="Refresh data">
            <Button
              size="sm"
              variant="flat"
              color="default"
              className="h-9 w-9 p-0 min-w-0"
              onPress={() => refetchReservations()}
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </Tooltip>
          <Button 
            size="sm"
            variant="flat" 
            color="danger" 
            onPress={onClose}
          >
            Close
          </Button>
        </div>
      </div>
      
      {/* Floor selector */}
      {floors.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Floor:</span>
            <div className="flex gap-1">
              {floors.map(floor => (
                <Button
                  key={floor.id}
                  size="sm"
                  variant={selectedFloorId === floor.id ? 'solid' : 'flat'}
                  color={selectedFloorId === floor.id ? 'primary' : 'default'}
                  onPress={() => setSelectedFloorId(floor.id)}
                  className={selectedFloorId === floor.id ? '' : 'bg-white dark:bg-gray-700'}
                >
                  {floor.name}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <span>Tip:</span>
            <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">Drag & Drop</span>
            <span>reservations onto tables</span>
          </div>
        </div>
      )}
      
      <div className="flex flex-1 overflow-hidden">
        {/* Floor Plan */}
        <motion.div 
          className="flex-1 border rounded-lg m-2 overflow-hidden relative bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900"
          layout
          style={{ height: isFullScreenMode ? 'calc(100vh - 120px)' : 'calc(100vh - 200px)' }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Indicators for dropping */}
          <AnimatePresence>
            {draggingReservationId && (
              <motion.div 
                className="absolute inset-0 bg-primary/5 dark:bg-primary/10 z-10 pointer-events-none flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-white dark:bg-gray-800 bg-opacity-80 dark:bg-opacity-80 backdrop-blur-sm py-2 px-4 rounded-full shadow-lg">
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <ChevronRight className="h-4 w-4" />
                    <span>Drop on a table to assign</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Table overlay for drop zones */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            {floorTables.map(table => (
              <div
                key={table.id}
                data-table-id={table.id}
                className={`absolute rounded-lg border-2 transition-all duration-200 pointer-events-auto ${
                  draggingReservationId ? 'opacity-60 cursor-pointer scale-105' : 'opacity-0'
                } ${
                  table.status === TableStatus.AVAILABLE 
                    ? 'border-emerald-500 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30' 
                    : 'border-red-500 hover:bg-red-100/50 dark:hover:bg-red-900/30'
                }`}
                style={{
                  left: `${table.x}px`,
                  top: `${table.y}px`,
                  width: '80px',
                  height: '80px',
                }}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              />
            ))}
          </div>
          
          {/* Floor plan */}
          <FloorPlan
            tables={floorTables}
            selectedTableIds={draggingReservationId ? [] : selectedTableIds}
            onSelectTable={handleTableSelection}
            onUpdateTablePosition={() => {}}
            onEditTable={() => {}}
            onMergeTables={() => {}}
            floorColor="#f8fafc" // Light slate color
          />
          
          {/* Empty state */}
          {floorTables.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white dark:bg-gray-800 bg-opacity-90 dark:bg-opacity-90 p-6 rounded-xl shadow-lg max-w-md text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <Map className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-bold mb-2">No Tables on This Floor</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  This floor doesn't have any tables yet. Please select another floor or add tables to this floor.
                </p>
                <Button
                  color="primary"
                  size="sm"
                  onPress={() => {
                    if (floors.length > 1) {
                      // Select another floor if available
                      const otherFloor = floors.find(f => f.id !== selectedFloorId);
                      if (otherFloor) {
                        setSelectedFloorId(otherFloor.id);
                      }
                    }
                  }}
                >
                  {floors.length > 1 ? "Switch Floor" : "Close"}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
        
        {/* Reservations sidebar */}
        <motion.div 
          className="w-80 border-l dark:border-gray-700 overflow-hidden flex flex-col bg-white dark:bg-gray-800"
          layout
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-700">
            <div className="mb-3">
              <Tabs 
                variant="underlined"
                size="sm"
                color="primary"
                selectedKey={selectedTab}
                onSelectionChange={key => setSelectedTab(key as string)}
                aria-label="Reservation filters"
              >
                <Tab key="all" title={
                  <div className="flex items-center gap-1.5">
                    <span>All</span>
                    <Badge size="sm" variant="flat" color="default">{reservations.length}</Badge>
                  </div>
                }/>
                <Tab key="unassigned" title={
                  <div className="flex items-center gap-1.5">
                    <span>Unassigned</span>
                    <Badge size="sm" variant="flat" color="warning">{reservations.filter(r => !r.tableId).length}</Badge>
                  </div>
                }/>
                <Tab key="assigned" title={
                  <div className="flex items-center gap-1.5">
                    <span>Assigned</span>
                    <Badge size="sm" variant="flat" color="success">{reservations.filter(r => r.tableId).length}</Badge>
                  </div>
                }/>
              </Tabs>
            </div>
            
            <div className="relative">
              <Input
                placeholder="Search by guest name or table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="sm"
                radius="lg"
                startContent={<Search className="h-4 w-4 text-gray-400" />}
                endContent={
                  searchQuery && (
                    <button onClick={() => setSearchQuery('')}>
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  )
                }
                className="bg-white dark:bg-gray-700"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3">
            <AnimatePresence initial={false}>
              {filteredReservations.length === 0 && (
                <motion.div 
                  className="text-center py-12 text-gray-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <Filter className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="font-medium">No reservations found</p>
                  <p className="text-sm mt-1">Try adjusting your filters</p>
                  <Button 
                    size="sm" 
                    variant="flat" 
                    color="primary" 
                    className="mt-3"
                    onPress={() => {
                      setSelectedTab('all');
                      setSearchQuery('');
                    }}
                  >
                    Reset filters
                  </Button>
                </motion.div>
              )}
              
              <div className="space-y-3">
                {filteredReservations.map((reservation) => {
                  const { date, time } = formatDateTime(reservation.date, reservation.startTime);
                  const isUnassigned = !reservation.tableId;
                  
                  // Determine if this was recently modified
                  const recentlyModified = assignmentHistory.some(
                    h => h.id === reservation.id && (Date.now() - h.timestamp < 5000)
                  );
                  
                  return (
                    <motion.div
                      key={reservation.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className={`rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden ${
                        isUnassigned 
                          ? 'bg-white dark:bg-gray-800 cursor-move' 
                          : 'bg-gray-50 dark:bg-gray-700'
                      } ${
                        recentlyModified 
                          ? 'ring-2 ring-primary ring-opacity-50' 
                          : ''
                      }`}
                      draggable={isUnassigned}
                      onDragStart={(e) => {
                        if (isUnassigned) {
                          const dragEvent = e as unknown as React.DragEvent<HTMLDivElement>;
                          handleDragStart(dragEvent, reservation.id);
                        }
                      }}
                    >
                      <div className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar 
                            name={reservation.guest?.name || 'Guest'} 
                            size="sm" 
                            color="primary" 
                            className="border-2 border-white dark:border-gray-700 shadow-sm"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {reservation.guest?.name || 'Guest'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {reservation.guest?.phone || 'No phone'}
                            </p>
                          </div>
                          
                          {isUnassigned ? (
                            <Chip 
                              color="warning" 
                              variant="flat" 
                              size="sm"
                              startContent={<AlertTriangle className="h-3 w-3" />}
                            >
                              Unassigned
                            </Chip>
                          ) : (
                            <Chip 
                              color="success" 
                              variant="flat" 
                              size="sm"
                              startContent={<Check className="h-3 w-3" />}
                            >
                              Assigned
                            </Chip>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                          <div className="flex flex-col">
                            <span className="text-gray-500 dark:text-gray-400 mb-0.5 flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" /> Date
                            </span>
                            <span className="font-medium">{date}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-gray-500 dark:text-gray-400 mb-0.5 flex items-center gap-1">
                              <Clock className="h-3 w-3" /> Time
                            </span>
                            <span className="font-medium">{time}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-gray-500 dark:text-gray-400 mb-0.5 flex items-center gap-1">
                              <Users className="h-3 w-3" /> Guests
                            </span>
                            <span className="font-medium">{reservation.numberOfGuests}</span>
                          </div>
                        </div>
                        
                        {!isUnassigned && reservation.table && (
                          <div className="mt-2 bg-white dark:bg-gray-800 rounded-md p-2 border border-gray-100 dark:border-gray-600">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="text-sm font-medium">Table {reservation.table.name}</span>
                              </div>
                              <Tooltip content="Unassign table">
                                <Button 
                                  size="sm" 
                                  color="danger"
                                  variant="flat"
                                  isIconOnly
                                  className="h-6 w-6 min-w-0 p-0"
                                  onPress={() => handleUnassignTable(reservation.id)}
                                >
                                  <CircleSlash className="h-3 w-3" />
                                </Button>
                              </Tooltip>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Capacity: {reservation.table.capacity} guests
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {isUnassigned && (
                        <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center">
                          <div className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 9h14M5 15h14"></path>
                              <path d="M5 5v14h14V5z"></path>
                            </svg>
                            <span>Drag to assign to a table</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          </div>
          
          <div className="p-3 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
            <Button 
              color="primary" 
              className="w-full font-medium"
              onPress={onClose}
              startContent={<Check className="h-4 w-4" />}
            >
              Complete Table Assignment
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 