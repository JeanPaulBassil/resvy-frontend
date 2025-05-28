'use client';

import { Reservation, ReservationStatus } from '@/api/reservation';
import { useDeleteReservation } from '@/hooks/useReservation';
import {
  Avatar,
  Button,
  Chip,
  ChipProps,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Spinner,
  Tooltip,
} from '@heroui/react';
import { format, parseISO } from 'date-fns';
import {
  CalendarDays,
  Clock,
  Edit2,
  MoreVertical,
  Settings,
  Trash2,
  Users,
  MapPin,
  PhoneCall,
  Mail,
  AlertCircle,
} from 'lucide-react';
import { useState } from 'react';
import EditReservationModal from './EditReservationModal';
import StatusChangeModal from './StatusChangeModal';

// Helper to get status chip color
const getStatusColor = (status: ReservationStatus): ChipProps['color'] => {
  switch (status) {
    case ReservationStatus.PENDING:
      return 'warning';
    case ReservationStatus.CONFIRMED:
      return 'primary';
    case ReservationStatus.SEATED:
      return 'success';
    case ReservationStatus.COMPLETED:
      return 'default';
    case ReservationStatus.NO_SHOW:
      return 'danger';
    case ReservationStatus.CANCELLED:
      return 'danger';
    default:
      return 'default';
  }
};

const getStatusEmoji = (status: ReservationStatus): string => {
  switch (status) {
    case ReservationStatus.PENDING:
      return '⏳';
    case ReservationStatus.CONFIRMED:
      return '✅';
    case ReservationStatus.SEATED:
      return '🍽️';
    case ReservationStatus.COMPLETED:
      return '👍';
    case ReservationStatus.NO_SHOW:
      return '❌';
    case ReservationStatus.CANCELLED:
      return '🚫';
    default:
      return '';
  }
};

// Format date and time for display
const formatDateTime = (date: string, time: string) => {
  try {
    // Create a date object
    const dateTime = parseISO(time);

    // Format the time
    const formattedTime = format(dateTime, 'h:mm a');

    // Format the date
    const formattedDate = format(parseISO(date), 'EEE, MMM d');

    return { date: formattedDate, time: formattedTime };
  } catch (error) {
    console.error('Error formatting date/time:', error);
    return { date: 'Invalid date', time: 'Invalid time' };
  }
};

// Format guest name for display
const formatGuestName = (guest?: { name: string; phone: string }) => {
  if (!guest) return 'Unknown Guest';
  return guest.name;
};

interface ReservationListProps {
  reservations: Reservation[];
  isLoading: boolean;
  onRefresh: () => void;
  statusFilter?: string;
}

export default function ReservationList({
  reservations,
  isLoading,
  onRefresh,
  statusFilter = 'ALL',
}: ReservationListProps) {
  const deleteReservationMutation = useDeleteReservation();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [statusChangeModalOpen, setStatusChangeModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  // Handle delete reservation
  const handleDelete = async (id: string) => {
    try {
      await deleteReservationMutation.mutateAsync(id);
      onRefresh();
    } catch (error) {
      console.error('Error deleting reservation:', error);
    }
  };

  // Open edit reservation modal
  const handleOpenEditModal = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setEditModalOpen(true);
  };

  // Close edit reservation modal
  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedReservation(null);
  };

  // Handle edit reservation success
  const handleEditSuccess = () => {
    onRefresh();
    handleCloseEditModal();
  };

  // Open status change modal
  const handleOpenStatusChangeModal = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setStatusChangeModalOpen(true);
  };

  // Close status change modal
  const handleCloseStatusChangeModal = () => {
    setStatusChangeModalOpen(false);
    setSelectedReservation(null);
  };

  // Handle status change success
  const handleStatusChangeSuccess = () => {
    onRefresh();
    handleCloseStatusChangeModal();
  };

  // Filtered reservations
  const filteredReservations =
    statusFilter === 'ALL' ? reservations : reservations.filter((r) => r.status === statusFilter);

  // Empty state
  if (!isLoading && filteredReservations.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-b-xl">
        <div className="inline-flex justify-center items-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
          <CalendarDays className="h-8 w-8 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          No reservations found
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
          {statusFilter !== 'ALL'
            ? `No ${statusFilter.toLowerCase()} reservations found. Try changing the filter.`
            : 'No reservations found for the selected date.'}
        </p>
        <Button variant="flat" className="mt-4" color="primary" radius="full" onPress={onRefresh}>
          Refresh
        </Button>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12 bg-white dark:bg-gray-800 rounded-b-xl">
        <Spinner color="primary" size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-b-xl overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-1 gap-1 p-4">
        {filteredReservations.map((reservation) => {
          const { date, time } = formatDateTime(reservation.date, reservation.startTime);
          return (
            <div
              key={reservation.id}
              className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800 rounded-xl p-4 transition-all duration-200 hover:shadow-md group relative overflow-hidden"
            >
              {/* Status indicator strip */}
              <div 
                className={`absolute top-0 left-0 w-1 h-full ${
                  reservation.status === ReservationStatus.PENDING ? 'bg-amber-500' : 
                  reservation.status === ReservationStatus.CONFIRMED ? 'bg-blue-500' : 
                  reservation.status === ReservationStatus.SEATED ? 'bg-green-500' : 
                  reservation.status === ReservationStatus.COMPLETED ? 'bg-gray-400' : 
                  'bg-red-500'
                }`}
              ></div>
              
              {/* Card content */}
              <div className="flex flex-col gap-4 pl-3">
                {/* Guest info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar 
                    name={reservation.guest?.name || 'Guest'} 
                    size="lg" 
                    color="primary" 
                    className="hidden sm:flex"
                  />
                  <div className="overflow-hidden flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {formatGuestName(reservation.guest)}
                      </h3>
                      <Chip size="sm" variant="flat" color={getStatusColor(reservation.status)}>
                        {getStatusEmoji(reservation.status)} {reservation.status}
                      </Chip>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1 text-sm text-gray-500">
                      {/* Contact info */}
                      <div className="flex items-center gap-1">
                        <PhoneCall className="h-3 w-3" />
                        <span className="text-xs">{reservation.guest?.phone || 'No phone'}</span>
                      </div>
                      
                      {reservation.guest?.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="text-xs truncate max-w-[150px]">{reservation.guest.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Reservation details */}
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-1">
                    {/* Date & Time */}
                    <div className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800/60 px-3 py-2 rounded-lg min-h-[70px]">
                      <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-full text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col justify-center min-w-0">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Date & Time</div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium truncate">{date}</span>
                          <span className="text-sm font-medium">{time}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Party size */}
                    <div className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800/60 px-3 py-2 rounded-lg min-h-[70px]">
                      <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-full text-amber-600 dark:text-amber-400 mt-1 flex-shrink-0">
                        <Users className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Party Size</div>
                        <div className="text-sm font-medium">
                          {reservation.numberOfGuests} {reservation.numberOfGuests === 1 ? 'guest' : 'guests'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Table */}
                    <div className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800/60 px-3 py-2 rounded-lg min-h-[70px]">
                      <div className="p-2 bg-green-50 dark:bg-green-500/10 rounded-full text-green-600 dark:text-green-400 mt-1 flex-shrink-0">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col justify-center min-w-0">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Table</div>
                        <div className="text-sm font-medium truncate">
                          {reservation.table ? (
                            reservation.table.name
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">Unassigned</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Notes and Actions */}
                  <div className="flex items-center justify-between md:flex-col md:items-end gap-3">
                    {/* Notes (if present) */}
                    {reservation.note && (
                      <Tooltip content={reservation.note}>
                        <div className="flex items-center gap-1 text-gray-500 cursor-help">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-xs">Has notes</span>
                        </div>
                      </Tooltip>
                    )}
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Tooltip content="Edit reservation">
                        <Button
                          isIconOnly
                          variant="flat"
                          radius="full"
                          size="sm"
                          onPress={() => handleOpenEditModal(reservation)}
                          className="text-gray-500 hover:text-primary-500"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </Tooltip>
                      
                      <Tooltip content="Change status">
                        <Button
                          isIconOnly
                          variant="flat"
                          radius="full"
                          size="sm"
                          onPress={() => handleOpenStatusChangeModal(reservation)}
                          className="text-gray-500 hover:text-primary-500"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </Tooltip>
                      
                      <Dropdown>
                        <DropdownTrigger>
                          <Button isIconOnly size="sm" variant="flat" radius="full" className="text-gray-500">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Reservation Actions">
                          <DropdownItem 
                            key="delete"
                            className="text-danger"
                            color="danger"
                            startContent={<Trash2 className="h-4 w-4" />}
                            onPress={() => handleDelete(reservation.id)}
                          >
                            Delete
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Reservation Modal */}
      {selectedReservation && (
        <Modal
          isOpen={editModalOpen}
          onClose={handleCloseEditModal}
          placement="center"
          scrollBehavior="inside"
          size="full"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex items-center gap-3 pb-3 border-b bg-white">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Edit2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold">Edit Reservation</h2>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium text-gray-700">{selectedReservation.guest?.name || 'Guest'}</span>
                      {' • '}
                      {selectedReservation.guest?.phone || 'No phone'}
                    </p>
                  </div>
                  <Avatar
                    name={selectedReservation.guest?.name || 'Guest'}
                    size="sm"
                    color="primary"
                    className="border-2 border-white shadow-md"
                  />
                </ModalHeader>
                <ModalBody className="p-0">
                  <EditReservationModal
                    reservation={selectedReservation}
                    onClose={onClose}
                    onSuccess={handleEditSuccess}
                  />
                </ModalBody>
              </>
            )}
          </ModalContent>
        </Modal>
      )}

      {/* Status Change Modal */}
      {selectedReservation && (
        <StatusChangeModal
          isOpen={statusChangeModalOpen}
          onClose={handleCloseStatusChangeModal}
          onSuccess={handleStatusChangeSuccess}
          reservation={selectedReservation}
        />
      )}
    </div>
  );
}
