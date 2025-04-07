import React from 'react';
import { 
  Button, 
  Modal, 
  ModalBody, 
  ModalContent, 
  ModalFooter, 
  ModalHeader 
} from '@heroui/react';
import { Shift } from '@/types/shift';

interface DeleteShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  shift: Shift | null;
}

export default function DeleteShiftModal({
  isOpen,
  onClose,
  onDelete,
  shift
}: DeleteShiftModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalContent>
        <ModalHeader>
          <h3 className="text-xl font-semibold">Delete Shift</h3>
        </ModalHeader>
        <ModalBody>
          <p>
            Are you sure you want to delete the <strong>{shift?.name}</strong> shift? 
            This action cannot be undone.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Note: Deleting this shift will remove it from all future schedules.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            color="danger" 
            onClick={onDelete}
          >
            Delete Shift
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 