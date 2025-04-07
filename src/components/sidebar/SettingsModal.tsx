import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Input,
  Switch,
  Divider,
} from '@heroui/react';
import React from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal = React.memo(({ isOpen, onClose }: SettingsModalProps) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      radius="sm" 
      size="lg"
      aria-labelledby="settings-modal-title"
    >
      <ModalContent>
        <ModalHeader id="settings-modal-title">Settings</ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Account Settings</h3>
              <div className="space-y-4">
                <Input
                  label="Display Name"
                  placeholder="Your display name"
                  defaultValue="John Doe"
                  variant="bordered"
                />
                <Input
                  label="Email"
                  placeholder="Your email"
                  defaultValue="john.doe@example.com"
                  type="email"
                  variant="bordered"
                  isReadOnly
                />
              </div>
            </div>
            
            <Divider />
            
            <div>
              <h3 className="text-lg font-medium mb-2">Preferences</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Dark Mode</p>
                    <p className="text-sm text-gray-500">Switch between light and dark themes</p>
                  </div>
                  <Switch defaultSelected />
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive email updates</p>
                  </div>
                  <Switch defaultSelected />
                </div>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} radius="sm">
            Cancel
          </Button>
          <Button color="primary" onPress={onClose} radius="sm">
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
});

export default SettingsModal; 