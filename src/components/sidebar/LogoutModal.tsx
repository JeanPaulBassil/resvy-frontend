import {
  Button,
  Kbd,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react';
import React, { useEffect } from 'react';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LogoutModal = React.memo(({ isOpen, onClose, onConfirm }: LogoutModalProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isOpen && event.key === 'Enter') {
        onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} radius="sm" aria-labelledby="logout-modal-title">
      <ModalContent>
        <ModalHeader id="logout-modal-title">Confirm Logout</ModalHeader>
        <ModalBody>
          <p>Are you sure you want to logout?</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} radius="sm">
            Cancel
          </Button>
          <Button
            color="success"
            onPress={onConfirm}
            radius="sm"
            autoFocus
            className="text-white"
            endContent={<Kbd keys={['enter']} className="bg-transparent text-white"></Kbd>}
          >
            Logout
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
});

export default LogoutModal;
