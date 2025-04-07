import React from 'react';
import { 
  Button, 
  Chip, 
  Input, 
  Modal, 
  ModalBody, 
  ModalContent, 
  ModalFooter, 
  ModalHeader 
} from '@heroui/react';
import { Shift, CreateShiftDto } from '@/types/shift';

interface FormErrors {
  name?: string;
  startTime?: string;
  endTime?: string;
  days?: string;
}

interface ShiftFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  selectedShift: Shift | null;
  formData: CreateShiftDto;
  setFormData: (data: CreateShiftDto) => void;
  errors: FormErrors;
  colorOptions: Array<{ value: string; label: string }>;
}

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ShiftFormModal({
  isOpen,
  onClose,
  onSubmit,
  selectedShift,
  formData,
  setFormData,
  errors,
  colorOptions
}: ShiftFormModalProps) {
  const handleToggleDay = (day: string) => {
    if (formData.days.includes(day)) {
      setFormData({
        ...formData,
        days: formData.days.filter(d => d !== day)
      });
    } else {
      setFormData({
        ...formData,
        days: [...formData.days, day]
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent>
        <ModalHeader>
          <h3 className="text-xl font-semibold">{selectedShift ? 'Edit Shift' : 'Create New Shift'}</h3>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift Name</label>
              <Input
                placeholder="e.g., Breakfast, Lunch, Dinner"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                isInvalid={!!errors.name}
                errorMessage={errors.name}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  isInvalid={!!errors.startTime}
                  errorMessage={errors.startTime}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  isInvalid={!!errors.endTime}
                  errorMessage={errors.endTime}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Days of Week</label>
              <div className="flex flex-wrap gap-2">
                {weekdays.map(day => (
                  <Chip
                    key={day}
                    variant={formData.days.includes(day) ? "solid" : "bordered"}
                    color={formData.days.includes(day) ? "primary" : "default"}
                    className={formData.days.includes(day) ? "bg-[#75CAA6]" : ""}
                    onClick={() => handleToggleDay(day)}
                  >
                    {day.substring(0, 3)}
                  </Chip>
                ))}
              </div>
              {errors.days && (
                <p className="text-xs text-red-500 mt-1">{errors.days}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift Color</label>
              <div className="flex flex-wrap gap-3 mt-2">
                {colorOptions.map(color => (
                  <div
                    key={color.value}
                    className={`w-8 h-8 rounded-full cursor-pointer transition-all ${
                      formData.color === color.value 
                        ? 'ring-2 ring-offset-2 ring-[#75CAA6] scale-110' 
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            color="primary" 
            className="bg-[#75CAA6] hover:bg-[#5fb992]"
            onClick={onSubmit}
          >
            {selectedShift ? 'Save Changes' : 'Create Shift'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 