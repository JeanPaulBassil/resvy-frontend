import { type Floor } from '@/types/floor';
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react';
import { Icon } from '@iconify/react';

interface FloorDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  floor: Floor | null;
  onConfirmDelete: (floorId: string) => void;
  isLastFloor: boolean;
}

export default function FloorDeleteModal({
  isOpen,
  onClose,
  floor,
  onConfirmDelete,
  isLastFloor,
}: FloorDeleteModalProps) {
  const handleConfirmDelete = () => {
    if (floor) {
      onConfirmDelete(floor.id);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      size="sm"
    >
      <ModalContent>
        <ModalHeader className="border-b">
          <h3 className="text-lg font-semibold text-danger">Delete Floor</h3>
        </ModalHeader>
        <ModalBody className="py-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-danger">
              <Icon icon="solar:danger-triangle-linear" width={20} />
              <span className="font-medium">This action cannot be undone</span>
            </div>
            <p>
              Are you sure you want to delete the floor "{floor?.name}"? This will also
              delete all tables on this floor.
            </p>
            {isLastFloor && (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-sm">
                <div className="flex items-center gap-2">
                  <Icon icon="solar:info-circle-linear" width={16} />
                  <span>You cannot delete the last floor. Please create another floor first.</span>
                </div>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter className="border-t">
          <Button
            variant="flat"
            onClick={onClose}
            className="bg-white border border-gray-200"
          >
            Cancel
          </Button>
          <Button 
            color="danger" 
            onClick={handleConfirmDelete}
            isDisabled={isLastFloor}
          >
            Delete Floor
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 