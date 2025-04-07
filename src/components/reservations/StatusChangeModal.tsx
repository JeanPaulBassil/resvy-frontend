'use client';

import { Reservation, ReservationStatus, UpdateReservationDto } from '@/api/reservation';
import { useUpdateReservation } from '@/hooks/useReservation';
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Textarea,
  Chip,
  Divider,
} from '@heroui/react';
import { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle, Users, Coffee, XCircle, Slash } from 'lucide-react';

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  reservation: Reservation | null;
}

// Define status card data
interface StatusOption {
  status: ReservationStatus;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const statusOptions: StatusOption[] = [
  {
    status: ReservationStatus.PENDING,
    label: 'Pending',
    description: 'Awaiting confirmation',
    icon: <Clock className="h-5 w-5" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-500/10',
  },
  {
    status: ReservationStatus.CONFIRMED,
    label: 'Confirmed',
    description: 'Ready for arrival',
    icon: <CheckCircle className="h-5 w-5" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-500/10',
  },
  {
    status: ReservationStatus.SEATED,
    label: 'Seated',
    description: 'Currently dining',
    icon: <Users className="h-5 w-5" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-500/10',
  },
  {
    status: ReservationStatus.COMPLETED,
    label: 'Completed',
    description: 'Finished dining',
    icon: <Coffee className="h-5 w-5" />,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 dark:bg-gray-500/10',
  },
  {
    status: ReservationStatus.NO_SHOW,
    label: 'No Show',
    description: 'Did not arrive',
    icon: <XCircle className="h-5 w-5" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-500/10',
  },
  {
    status: ReservationStatus.CANCELLED,
    label: 'Cancelled',
    description: 'Reservation cancelled',
    icon: <Slash className="h-5 w-5" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-500/10',
  },
];

export default function StatusChangeModal({
  isOpen,
  onClose,
  onSuccess,
  reservation,
}: StatusChangeModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<ReservationStatus | null>(
    reservation?.status || null
  );
  const [notes, setNotes] = useState('');
  const updateReservation = useUpdateReservation(reservation?.id || '');

  // Update status when reservation changes
  useEffect(() => {
    if (reservation) {
      setSelectedStatus(reservation.status);
      setNotes('');
    }
  }, [reservation]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!reservation || !selectedStatus) return;

    try {
      const data: UpdateReservationDto = {
        status: selectedStatus,
      };

      // If notes were added, include them
      if (notes) {
        data.note = notes;
      }

      await updateReservation.mutateAsync(data);
      onSuccess();
    } catch (error) {
      console.error('Error updating reservation status:', error);
    }
  };

  if (!reservation) return null;

  // Format party information
  const partyInfo = `${reservation.guest?.name || 'Guest'} - Party of ${reservation.numberOfGuests}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} placement="center" size="md">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 pb-2">
              <h3 className="text-xl">Change Reservation Status</h3>
              <div className="text-sm text-gray-500 flex gap-2 items-center">
                <span>{partyInfo}</span>
                <Chip size="sm" variant="flat" color="primary">{reservation.table?.name || 'No table'}</Chip>
              </div>
            </ModalHeader>
            
            <Divider />
            
            <ModalBody>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Choose a New Status
                    </h3>
                    <Chip 
                      size="sm" 
                      variant="flat" 
                      color={
                        reservation.status === ReservationStatus.PENDING ? 'warning' :
                        reservation.status === ReservationStatus.CONFIRMED ? 'primary' :
                        reservation.status === ReservationStatus.SEATED ? 'success' :
                        reservation.status === ReservationStatus.COMPLETED ? 'default' :
                        'danger'
                      }
                    >
                      Current: {reservation.status}
                    </Chip>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {statusOptions.map((option) => (
                      <div 
                        key={option.status}
                        className={`
                          p-3 rounded-lg cursor-pointer transition-all duration-200 border-2
                          ${option.status === selectedStatus 
                            ? `border-primary-400 dark:border-primary-600 shadow-sm ${option.bgColor}` 
                            : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700 bg-gray-50 dark:bg-gray-800/60'}
                        `}
                        onClick={() => setSelectedStatus(option.status)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`rounded-full p-2 ${option.bgColor} ${option.color}`}>
                            {option.icon}
                          </div>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-gray-500">{option.description}</div>
                          </div>
                          {option.status === selectedStatus && (
                            <div className="ml-auto">
                              <CheckCircle className="h-5 w-5 text-primary-500" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Notes (Optional)
                    </h3>
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                  </div>
                  <Textarea
                    placeholder="Add any notes about this status change"
                    value={notes}
                    onValueChange={setNotes}
                    radius="sm"
                    variant="flat"
                    rows={3}
                    classNames={{
                      inputWrapper: 'bg-gray-50/50 dark:bg-gray-800/30 shadow-sm',
                      input: 'text-sm',
                    }}
                  />
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                Cancel
              </Button>
              <Button 
                color="primary" 
                onPress={handleSubmit}
                isLoading={updateReservation.isPending}
                isDisabled={!selectedStatus || selectedStatus === reservation.status}
              >
                {updateReservation.isPending ? 'Updating...' : 'Update Status'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
} 