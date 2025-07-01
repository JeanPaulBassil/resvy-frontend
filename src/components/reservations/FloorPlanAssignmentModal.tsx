'use client';

import { reservationApi } from '@/api/reservation';
import { useFloors } from '@/hooks/useFloor';
import { useReservations } from '@/hooks/useReservation';
import { useTables } from '@/hooks/useTable';
import { TableStatus } from '@/types/table';
import { Avatar, Badge, Button, Chip, Input, Tab, Tabs, Tooltip } from '@heroui/react';
import { format, parseISO } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronRight,
  CircleSlash,
  Clock,
  Coffee,
  Filter,
  Layers,
  LayoutGrid,
  Loader2,
  LogOut,
  Map,
  RefreshCcw,
  Search,
  ThumbsUp,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import FloorPlan from '../floor-plan/floor-plan';
import { useRestaurant } from '../providers/RestaurantProvider';

// CSS for iPad drag and drop improvements
const dragDropStyles = `
  @keyframes dropPulse {
    0% { box-shadow: 0 0 0 0 rgba(var(--primary), 0.7); }
    70% { box-shadow: 0 0 0 15px rgba(var(--primary), 0); }
    100% { box-shadow: 0 0 0 0 rgba(var(--primary), 0); }
  }
  
  .drag-over-highlight {
    background-color: rgba(var(--primary), 0.1) !important;
    transition: background-color 0.2s ease;
  }
  
  .drop-pulse-effect {
    animation: dropPulse 0.5s ease-out;
  }
  
  [data-touch-active="true"] {
    opacity: 0.8 !important;
    transform: scale(0.97) !important;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2) !important;
    transition: all 0.1s ease-out !important;
  }
  
  .touch-dragging {
    opacity: 0.85 !important;
    transform: scale(0.95) !important;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25) !important;
    border: 2px solid rgba(var(--primary), 0.7) !important;
    background-color: #fff !important;
  }
`;

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
  const [assignmentHistory, setAssignmentHistory] = useState<
    { id: string; action: 'assign' | 'unassign'; timestamp: number }[]
  >([]);
  const [isFullScreenMode, setIsFullScreenMode] = useState(false);

  // Fetch data
  const { data: floors = [], isLoading: isLoadingFloors } = useFloors(restaurantId);
  const { data: tables = [], isLoading: isLoadingTables } = useTables(restaurantId);
  const {
    data: reservations = [],
    isLoading: isLoadingReservations,
    refetch: refetchReservations,
  } = useReservations({
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
  const floorTables = tables.filter((table) => table.floorId === selectedFloorId);

  // Filter and sort reservations
  const filteredReservations = useMemo(() => {
    let result = [...reservations];

    // Apply tab filter
    if (selectedTab === 'unassigned') {
      result = result.filter((r) => !r.tableId);
    } else if (selectedTab === 'assigned') {
      result = result.filter((r) => r.tableId);
    }

    // Apply search filter if query exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
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
      const reservation = reservations.find((r) => r.id === reservationId);
      const table = tables.find((t) => t.id === tableId);

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
          setAssignmentHistory((prev) => [
            { id: reservationId, action: 'assign', timestamp: Date.now() },
            ...prev,
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
        setError(
          `Table ${table.name} can only seat ${table.capacity} guests, but this reservation is for ${reservation.numberOfGuests} guests.`
        );
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

      const reservation = reservations.find((r) => r.id === reservationId);

      // Use updateReservation instead of assignTable for removing table assignments
      await reservationApi.updateReservation(reservationId, { tableId: null });

      // Record in history
      setAssignmentHistory((prev) => [
        { id: reservationId, action: 'unassign', timestamp: Date.now() },
        ...prev,
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
      refetchReservations().catch((refetchError) =>
        console.error('Error refetching after unassign error:', refetchError)
      );
    }
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, reservationId: string) => {
    e.dataTransfer.setData('reservationId', reservationId);
    setDraggingReservationId(reservationId);

    // Set effectAllowed to 'move' to indicate a move operation
    e.dataTransfer.effectAllowed = 'move';

    // Add touch-friendly properties to make drag and drop work better on iPad
    if ('setDragImage' in e.dataTransfer) {
      if (e.currentTarget instanceof HTMLElement) {
        const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
        dragImage.style.opacity = '0.5';
        dragImage.style.transform = 'scale(0.75)';
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-1000px';
        document.body.appendChild(dragImage);

        // This improves the drag visualization on touch devices
        e.dataTransfer.setDragImage(dragImage, 20, 20);

        setTimeout(() => {
          document.body.removeChild(dragImage);
        }, 0);
      }
    }

    // Don't prevent default here as it breaks drag functionality
    // e.preventDefault() is not needed for drag start
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    // Explicitly set dropEffect to 'move' for better visual feedback on iOS/iPad
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }

    // Add a highlight effect on the element being dragged over
    if (e.currentTarget) {
      e.currentTarget.classList.add('drag-over-highlight');

      // Clear the highlight after a short delay
      setTimeout(() => {
        e.currentTarget.classList.remove('drag-over-highlight');
      }, 100);
    }

    e.preventDefault();
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    // Remove any remaining highlight effects
    if (e.currentTarget) {
      e.currentTarget.classList.remove('drag-over-highlight');
    }

    const reservationId = e.dataTransfer.getData('reservationId');
    if (!reservationId) return; // Safety check

    const tableElement = findTableElement(e.target as HTMLElement);
    if (tableElement) {
      const tableId = tableElement.getAttribute('data-table-id');
      if (tableId) {
        // Add a visual pulse effect to the table when dropping
        tableElement.classList.add('drop-pulse-effect');
        setTimeout(() => {
          tableElement.classList.remove('drop-pulse-effect');
        }, 500);

        handleDropOnTable(reservationId, tableId);
      }
    }

    // Reset dragging state
    setDraggingReservationId(null);
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
      // Parse the time string - handle timezone properly
      let dateTime: Date;
      
      if (time.endsWith('Z') || time.includes('+') || time.includes('-')) {
        // Has timezone info, parse as-is
        dateTime = parseISO(time);
      } else {
        // No timezone info - parse as local time by extracting components manually
        // This prevents any automatic timezone conversion
        const match = time.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
        if (match) {
          const [, year, month, day, hours, minutes, seconds] = match;
          dateTime = new Date(
            parseInt(year),
            parseInt(month) - 1, // Month is 0-indexed
            parseInt(day),
            parseInt(hours),
            parseInt(minutes),
            parseInt(seconds)
          );
        } else {
          // Fallback to regular parsing
          dateTime = new Date(time);
        }
      }

      const formattedTime = format(dateTime, 'h:mm a');
      const formattedDate = format(parseISO(date), 'EEE, MMM d');
      return { date: formattedDate, time: formattedTime };
    } catch {
      return { date: 'Invalid date', time: 'Invalid time' };
    }
  };

  // Add a touch event handler for reservation cards
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>, reservationId: string) => {
    if (!e.currentTarget.getAttribute('draggable')) return;

    // Mark element as being touched
    e.currentTarget.setAttribute('data-touch-active', 'true');

    // Store the reservation ID to drag
    setDraggingReservationId(reservationId);

    // For iPad compatibility, create an immediate visual feedback
    e.currentTarget.style.transform = 'scale(0.97)';
    e.currentTarget.style.opacity = '0.8';
    e.currentTarget.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.2)';

    // Get touch coordinates
    const touch = e.touches[0];
    const targetRect = e.currentTarget.getBoundingClientRect();

    // Calculate offset from the touch point to the element's top-left corner
    const offsetX = touch.clientX - targetRect.left;
    const offsetY = touch.clientY - targetRect.top;

    // Store original touch position and element for handling movement
    e.currentTarget.setAttribute('data-touch-start-x', touch.clientX.toString());
    e.currentTarget.setAttribute('data-touch-start-y', touch.clientY.toString());
    e.currentTarget.setAttribute('data-touch-offset-x', offsetX.toString());
    e.currentTarget.setAttribute('data-touch-offset-y', offsetY.toString());

    // Prevent default to avoid scrolling behavior
    e.preventDefault();
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    // Check if this element is being dragged
    if (e.currentTarget.getAttribute('data-touch-active') !== 'true') return;

    // Prevent scrolling
    e.preventDefault();

    // Get the current touch position
    const touch = e.touches[0];

    // Get the starting touch position and offsets from data attributes
    const startX = parseFloat(e.currentTarget.getAttribute('data-touch-start-x') || '0');
    const startY = parseFloat(e.currentTarget.getAttribute('data-touch-start-y') || '0');
    const offsetX = parseFloat(e.currentTarget.getAttribute('data-touch-offset-x') || '0');
    const offsetY = parseFloat(e.currentTarget.getAttribute('data-touch-offset-y') || '0');

    // Calculate the distance moved
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;

    // Only start visual dragging if we've moved at least 5px
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      // Visual indication we're dragging
      e.currentTarget.style.position = 'fixed';
      e.currentTarget.style.zIndex = '1000';
      e.currentTarget.style.pointerEvents = 'none';
      e.currentTarget.style.width = `${e.currentTarget.offsetWidth}px`;
      e.currentTarget.style.left = `${touch.clientX - offsetX}px`;
      e.currentTarget.style.top = `${touch.clientY - offsetY}px`;

      // Add dragging class for additional styling
      e.currentTarget.classList.add('touch-dragging');

      // Find potential drop targets under the touch point
      const elementsUnderTouch = document.elementsFromPoint(touch.clientX, touch.clientY);
      const tableElement = elementsUnderTouch.find((el) => el.hasAttribute('data-table-id'));

      // Highlight potential drop target
      if (tableElement) {
        tableElement.classList.add('drag-over-highlight');

        // Store the potential drop target
        e.currentTarget.setAttribute(
          'data-potential-drop-target',
          tableElement.getAttribute('data-table-id') || ''
        );

        // Clear previous highlights except for the current one
        document.querySelectorAll('.drag-over-highlight').forEach((el) => {
          if (el !== tableElement) {
            el.classList.remove('drag-over-highlight');
          }
        });
      } else {
        // No table under touch, clear potential drop target
        e.currentTarget.removeAttribute('data-potential-drop-target');

        // Clear all highlights
        document.querySelectorAll('.drag-over-highlight').forEach((el) => {
          el.classList.remove('drag-over-highlight');
        });
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    // If element wasn't being dragged, ignore
    if (e.currentTarget.getAttribute('data-touch-active') !== 'true') return;

    // Check if we have a drop target
    const tableId = e.currentTarget.getAttribute('data-potential-drop-target');
    const reservationId = draggingReservationId;

    // Clear all visual styling
    e.currentTarget.removeAttribute('data-touch-active');
    e.currentTarget.removeAttribute('data-touch-start-x');
    e.currentTarget.removeAttribute('data-touch-start-y');
    e.currentTarget.removeAttribute('data-touch-offset-x');
    e.currentTarget.removeAttribute('data-touch-offset-y');
    e.currentTarget.removeAttribute('data-potential-drop-target');
    e.currentTarget.classList.remove('touch-dragging');

    // Reset the element's position and style
    e.currentTarget.style.position = '';
    e.currentTarget.style.zIndex = '';
    e.currentTarget.style.left = '';
    e.currentTarget.style.top = '';
    e.currentTarget.style.width = '';
    e.currentTarget.style.transform = '';
    e.currentTarget.style.opacity = '';
    e.currentTarget.style.boxShadow = '';
    e.currentTarget.style.pointerEvents = '';

    // Clear any table highlights
    document.querySelectorAll('.drag-over-highlight').forEach((el) => {
      el.classList.remove('drag-over-highlight');
    });

    // If we have both a table ID and a reservation ID, handle the drop
    if (tableId && reservationId) {
      // Find the table element
      const tableElement = document.querySelector(`[data-table-id="${tableId}"]`) as HTMLElement;

      // Add pulse effect to the table
      if (tableElement) {
        tableElement.classList.add('drop-pulse-effect');
        setTimeout(() => {
          tableElement.classList.remove('drop-pulse-effect');
        }, 500);
      }

      // Handle the actual table assignment
      handleDropOnTable(reservationId, tableId);
    }

    // Reset dragging state
    setDraggingReservationId(null);
  };

  // Add document-level touch event handling for iPad
  useEffect(() => {
    // Only add these handlers when we're in dragging mode
    if (!draggingReservationId) return;

    const handleDocumentTouchMove = (e: TouchEvent) => {
      // If we're not dragging, don't do anything
      if (!draggingReservationId) return;

      // Find the currently dragged element
      const draggedElement = document.querySelector('[data-touch-active="true"]') as HTMLElement;
      if (!draggedElement) return;

      // Get touch data
      const touch = e.touches[0];

      // Get offset data
      const offsetX = parseFloat(draggedElement.getAttribute('data-touch-offset-x') || '0');
      const offsetY = parseFloat(draggedElement.getAttribute('data-touch-offset-y') || '0');

      // Update element position to follow touch
      draggedElement.style.position = 'fixed';
      draggedElement.style.zIndex = '1000';
      draggedElement.style.left = `${touch.clientX - offsetX}px`;
      draggedElement.style.top = `${touch.clientY - offsetY}px`;
      draggedElement.style.pointerEvents = 'none';

      // Find elements under the touch point
      const elementsUnderTouch = document.elementsFromPoint(touch.clientX, touch.clientY);
      const tableElement = elementsUnderTouch.find(
        (el) => el instanceof HTMLElement && el.hasAttribute('data-table-id')
      ) as HTMLElement | undefined;

      // Highlight potential drop target
      if (tableElement) {
        tableElement.classList.add('drag-over-highlight');

        // Store the target table ID on the dragged element
        draggedElement.setAttribute(
          'data-potential-drop-target',
          tableElement.getAttribute('data-table-id') || ''
        );

        // Remove highlights from other tables
        document.querySelectorAll('[data-table-id]').forEach((el) => {
          if (el !== tableElement) {
            el.classList.remove('drag-over-highlight');
          }
        });
      } else {
        // No table under touch, clear potential drop target
        draggedElement.removeAttribute('data-potential-drop-target');

        // Clear all highlights
        document.querySelectorAll('.drag-over-highlight').forEach((el) => {
          el.classList.remove('drag-over-highlight');
        });
      }

      // Prevent default to avoid scrolling
      e.preventDefault();
    };

    const handleDocumentTouchEnd = () => {
      // Find the dragged element
      const draggedElement = document.querySelector('[data-touch-active="true"]') as HTMLElement;
      if (!draggedElement) return;

      // Get the potential drop target
      const tableId = draggedElement.getAttribute('data-potential-drop-target');

      // Reset the element's styling
      draggedElement.removeAttribute('data-touch-active');
      draggedElement.removeAttribute('data-touch-start-x');
      draggedElement.removeAttribute('data-touch-start-y');
      draggedElement.removeAttribute('data-touch-offset-x');
      draggedElement.removeAttribute('data-touch-offset-y');
      draggedElement.removeAttribute('data-potential-drop-target');
      draggedElement.classList.remove('touch-dragging');

      draggedElement.style.position = '';
      draggedElement.style.zIndex = '';
      draggedElement.style.left = '';
      draggedElement.style.top = '';
      draggedElement.style.width = '';
      draggedElement.style.transform = '';
      draggedElement.style.opacity = '';
      draggedElement.style.boxShadow = '';
      draggedElement.style.pointerEvents = '';

      // Clear highlights
      document.querySelectorAll('.drag-over-highlight').forEach((el) => {
        el.classList.remove('drag-over-highlight');
      });

      // Handle the drop if we have a target table
      if (tableId && draggingReservationId) {
        // Find the table element
        const tableElement = document.querySelector(`[data-table-id="${tableId}"]`) as HTMLElement;

        // Add pulse effect
        if (tableElement) {
          tableElement.classList.add('drop-pulse-effect');
          setTimeout(() => {
            tableElement.classList.remove('drop-pulse-effect');
          }, 500);
        }

        // Process the drop
        handleDropOnTable(draggingReservationId, tableId);
      }

      // Reset dragging state
      setDraggingReservationId(null);
    };

    // Add event listeners to the document
    document.addEventListener('touchmove', handleDocumentTouchMove, { passive: false });
    document.addEventListener('touchend', handleDocumentTouchEnd);

    return () => {
      // Clean up
      document.removeEventListener('touchmove', handleDocumentTouchMove);
      document.removeEventListener('touchend', handleDocumentTouchEnd);
    };
  }, [draggingReservationId]);

  // Loading state
  if (isLoadingFloors || isLoadingTables || isLoadingReservations) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white dark:bg-gray-900">
        <div className="relative w-16 h-16">
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-primary/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Coffee className="h-6 w-6 text-primary" />
          </div>
        </div>
        <p className="mt-4 text-gray-600 dark:text-gray-300 animate-pulse">
          Loading floor plan data...
        </p>
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
    <div
      className={`flex flex-col h-full relative ${isFullScreenMode ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : ''}`}
    >
      {/* Apply the drag and drop styles */}
      <style jsx global>
        {dragDropStyles}
      </style>

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
          <Button size="sm" variant="flat" color="danger" onPress={onClose}>
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
              {floors.map((floor) => (
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
          style={{
            height: isFullScreenMode ? 'calc(100vh - 120px)' : 'calc(100vh - 200px)',
            touchAction: 'none', // Prevent default touch behaviors that interfere with drag/drop
          }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onTouchMove={(e) => {
            // Only prevent default if we're dragging a reservation
            if (draggingReservationId) {
              e.preventDefault();
            }
          }}
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

          {/* Table overlay for drop zones - Filter out hidden tables */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            {floorTables
              .filter((table) => !table.isHidden) // Exclude hidden tables (original tables that are part of a merge)
              .map((table) => (
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
                  padding: draggingReservationId ? '10px' : '0',
                  margin: draggingReservationId ? '-10px' : '0',
                  transition: 'all 0.2s ease-out',
                  touchAction: 'none',
                }}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onTouchMove={(e) => {
                  if (draggingReservationId) {
                    e.preventDefault();
                    e.currentTarget.classList.add('drag-over-highlight');

                    setTimeout(() => {
                      e.currentTarget.classList.remove('drag-over-highlight');
                    }, 100);
                  }
                }}
                onTouchStart={(e) => {
                  if (draggingReservationId) {
                    e.preventDefault();
                    e.currentTarget.classList.add('drag-over-highlight');
                  }
                }}
                onTouchEnd={(e) => {
                  if (draggingReservationId) {
                    e.preventDefault();
                    e.currentTarget.classList.remove('drag-over-highlight');

                    // Add visual feedback for a successful drop
                    e.currentTarget.classList.add('drop-pulse-effect');
                    setTimeout(() => {
                      e.currentTarget.classList.remove('drop-pulse-effect');
                    }, 500);

                    // Process the drop if we have a reservation being dragged
                    if (draggingReservationId) {
                      handleDropOnTable(draggingReservationId, table.id);
                    }
                  }
                }}
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
                  This floor doesn't have any tables yet. Please select another floor or add tables
                  to this floor.
                </p>
                <Button
                  color="primary"
                  size="sm"
                  onPress={() => {
                    if (floors.length > 1) {
                      // Select another floor if available
                      const otherFloor = floors.find((f) => f.id !== selectedFloorId);
                      if (otherFloor) {
                        setSelectedFloorId(otherFloor.id);
                      }
                    }
                  }}
                >
                  {floors.length > 1 ? 'Switch Floor' : 'Close'}
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
                onSelectionChange={(key) => setSelectedTab(key as string)}
                aria-label="Reservation filters"
              >
                <Tab
                  key="all"
                  title={
                    <div className="flex items-center gap-1.5">
                      <span>All</span>
                      <Badge size="sm" variant="flat" color="default">
                        {reservations.length}
                      </Badge>
                    </div>
                  }
                />
                <Tab
                  key="unassigned"
                  title={
                    <div className="flex items-center gap-1.5">
                      <span>Unassigned</span>
                      <Badge size="sm" variant="flat" color="warning">
                        {reservations.filter((r) => !r.tableId).length}
                      </Badge>
                    </div>
                  }
                />
                <Tab
                  key="assigned"
                  title={
                    <div className="flex items-center gap-1.5">
                      <span>Assigned</span>
                      <Badge size="sm" variant="flat" color="success">
                        {reservations.filter((r) => r.tableId).length}
                      </Badge>
                    </div>
                  }
                />
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
                    (h) => h.id === reservation.id && Date.now() - h.timestamp < 5000
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
                          ? 'bg-white dark:bg-gray-800 cursor-move touch-manipulation'
                          : 'bg-gray-50 dark:bg-gray-700'
                      } ${recentlyModified ? 'ring-2 ring-primary ring-opacity-50' : ''} ${
                        isUnassigned ? 'active:scale-95 will-change-transform' : ''
                      }`}
                      draggable={isUnassigned}
                      onDragStart={(e) => {
                        if (isUnassigned) {
                          const dragEvent = e as unknown as React.DragEvent<HTMLDivElement>;
                          handleDragStart(dragEvent, reservation.id);
                        }
                      }}
                      onTouchStart={(e) => isUnassigned && handleTouchStart(e, reservation.id)}
                      onTouchMove={(e) => isUnassigned && handleTouchMove(e)}
                      onTouchEnd={(e) => isUnassigned && handleTouchEnd(e)}
                      style={isUnassigned ? { touchAction: 'none' } : undefined}
                    >
                      {/* Add a drag handle indicator for unassigned reservations */}
                      {isUnassigned && (
                        <div className="absolute top-2 right-2 bg-gray-100 dark:bg-gray-700 rounded-full w-5 h-5 flex items-center justify-center opacity-70">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-500 dark:text-gray-400"
                          >
                            <path d="M15 3h4a2 2 0 0 1 2 2v4"></path>
                            <path d="M9 21H5a2 2 0 0 1-2-2v-4"></path>
                            <path d="M3 9 L21 9"></path>
                            <path d="M3 15 L21 15"></path>
                          </svg>
                        </div>
                      )}

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
                                <span className="text-sm font-medium">
                                  Table {reservation.table.name}
                                </span>
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

                        {isUnassigned && (
                          <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center">
                            <div className="flex items-center gap-1">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M5 9h14M5 15h14"></path>
                              </svg>
                              <span>Tap and drag to assign</span>
                            </div>
                          </div>
                        )}
                      </div>
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
