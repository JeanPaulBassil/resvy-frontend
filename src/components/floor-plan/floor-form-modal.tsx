import { type Floor } from '@/types/floor';
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { generateId } from '@/lib/utils';

const floorSchema = z.object({
  name: z.string().min(1, 'Floor name is required').max(50, 'Floor name is too long'),
  type: z.enum(['INDOOR', 'OUTDOOR', 'BAR', 'CUSTOM'], {
    required_error: 'Please select a floor type',
  }),
});

type FloorFormData = z.infer<typeof floorSchema>;

interface FloorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingFloor: Floor | null;
  restaurantId: string;
  onSubmit: (floor: Floor) => void;
}

export default function FloorFormModal({
  isOpen,
  onClose,
  editingFloor,
  restaurantId,
  onSubmit,
}: FloorFormModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FloorFormData>({
    resolver: zodResolver(floorSchema),
    defaultValues: {
      name: editingFloor?.name || 'Main Dining',
      type: editingFloor?.type || 'INDOOR',
    },
  });

  const floorType = watch('type');

  const onFormSubmit = handleSubmit((data) => {
    if (editingFloor) {
      // Update existing floor
      const updatedFloor = {
        ...editingFloor,
        name: data.name,
        type: data.type,
      };
      onSubmit(updatedFloor);
    } else {
      // Create new floor
      const newFloor: Floor = {
        id: generateId(),
        name: data.name,
        type: data.type,
        color: data.type === 'INDOOR' ? '#f5f5f4' : 
               data.type === 'OUTDOOR' ? '#ecfdf5' :
               data.type === 'BAR' ? '#fef3c7' : '#f3e8ff',
        restaurantId,
      };
      onSubmit(newFloor);
    }
    reset();
    onClose();
  });

  const getFloorTypeIcon = (type: string) => {
    switch (type) {
      case 'INDOOR':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
            <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"></path>
            <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"></path>
          </svg>
        );
      case 'OUTDOOR':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
            <path d="M12 2v8"></path>
            <path d="M8 4c0 6 8 6 8 0"></path>
            <path d="M12 10v12"></path>
            <path d="M16 14c0 6-8 6-8 0"></path>
          </svg>
        );
      case 'BAR':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
            <path d="M8 22h8"></path>
            <path d="M12 11v11"></path>
            <path d="M20 2L4 9l8 3 8-3z"></path>
          </svg>
        );
      case 'CUSTOM':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      size="full"
      scrollBehavior='outside'
      classNames={{
        base: 'max-h-[90vh]',
        backdrop: 'bg-gradient-to-tr from-gray-900/60 to-gray-900/40 backdrop-blur-sm',
        wrapper: 'p-4',
      }}
    >
      <ModalContent>
        <form onSubmit={onFormSubmit}>
          <ModalHeader className="border-b bg-gradient-to-r from-[#75CAA6]/20 to-white">
            <div className="flex items-center gap-3">
              <div className="bg-[#75CAA6] p-2 rounded-lg shadow-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white"
                >
                  <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"></path>
                  <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"></path>
                  <path d="M12 3v6"></path>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingFloor ? 'Edit Floor' : 'Create New Floor'}
                </h2>
                <p className="text-sm text-gray-500">
                  {editingFloor
                    ? "Update your floor's details and appearance"
                    : 'Design a new space for your restaurant'}
                </p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="p-6">
            <div className="space-y-6">
              {/* Name Input with Animation */}
              <div className="space-y-2">
                <Input
                  radius="sm"
                  variant="bordered"
                  labelPlacement="outside"
                  {...register('name')}
                  label={
                    <label className='text-sm font-medium text-gray-700 flex items-center gap-2'>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-[#75CAA6]"
                      >
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                      </svg>
                      Floor Name
                    </label>
                  }
                  startContent={
                    <div className="p-1.5 rounded-md bg-[#75CAA6]/10">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#75CAA6]">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                      </svg>
                    </div>
                  }
                  placeholder="e.g., Main Dining, Outdoor Terrace"
                  errorMessage={errors.name?.message}
                  isInvalid={!!errors.name}
                />
              </div>

              {/* Floor Type Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#75CAA6]">
                    <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                    <path d="M3 9h18"></path>
                    <path d="M9 21V9"></path>
                  </svg>
                  Floor Type
                </label>
                {errors.type && (
                  <p className="text-xs text-danger mt-1">{errors.type.message}</p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {(['INDOOR', 'OUTDOOR', 'BAR', 'CUSTOM'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setValue('type', type)}
                      className={`relative p-4 rounded-xl border-2 transition-all duration-200 group ${
                        floorType === type
                          ? 'border-[#75CAA6] bg-[#75CAA6]/5'
                          : 'border-gray-200 hover:border-[#75CAA6]/30 hover:bg-[#75CAA6]/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          floorType === type ? 'bg-[#75CAA6]' : 'bg-gray-100 group-hover:bg-[#75CAA6]/20'
                        }`}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`w-6 h-6 ${floorType === type ? 'text-white' : 'text-gray-600'}`}>
                            {type === 'INDOOR' && (
                              <>
                                <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"></path>
                                <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"></path>
                              </>
                            )}
                            {type === 'OUTDOOR' && (
                              <>
                                <path d="M12 2v8"></path>
                                <path d="M8 4c0 6 8 6 8 0"></path>
                                <path d="M12 10v12"></path>
                                <path d="M16 14c0 6-8 6-8 0"></path>
                              </>
                            )}
                              {type === 'BAR' && (
                              <>
                                <path d="M8 22h8"></path>
                                <path d="M12 11v11"></path>
                                <path d="M20 2L4 9l8 3 8-3z"></path>
                              </>
                            )}
                            {type === 'CUSTOM' && (
                              <>
                                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </>
                            )}
                          </svg>
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-gray-900">
                            {type === 'INDOOR' && 'Indoor Space'}
                            {type === 'OUTDOOR' && 'Outdoor Space'}
                            {type === 'BAR' && 'Bar Area'}
                            {type === 'CUSTOM' && 'Custom Space'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {type === 'INDOOR' && 'Main dining area, private rooms'}
                            {type === 'OUTDOOR' && 'Patio, terrace, garden'}
                            {type === 'BAR' && 'Bar seating, high tables'}
                            {type === 'CUSTOM' && 'VIP area, events, special zones'}
                          </div>
                        </div>
                      </div>
                      {floorType === type && (
                        <div className="absolute top-2 right-2">
                          <div className="w-5 h-5 rounded-full bg-[#75CAA6] flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview Section */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#75CAA6]">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  Preview
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      floorType === 'INDOOR' ? 'bg-stone-100' : 
                      floorType === 'OUTDOOR' ? 'bg-green-100' :
                      floorType === 'BAR' ? 'bg-amber-100' :
                      'bg-purple-100'
                    }`}>
                      {getFloorTypeIcon(floorType)}
                    </div>
                    <span className="font-medium">{watch('name') || 'Your Floor Name'}</span>
                  </div>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="border-t bg-gray-50">
            <Button
              type="button"
              variant="flat"
              onClick={onClose}
              className="bg-white border border-gray-200"
              size="lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="primary"
              className="bg-[#75CAA6] hover:bg-[#75CAA6]/90 shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
              isLoading={isSubmitting}
              startContent={
                !isSubmitting && (
                  <div className="transition-transform duration-200 group-hover:scale-110">
                    {editingFloor ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6 9 17l-5-5"></path>
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14"></path>
                        <path d="M12 5v14"></path>
                      </svg>
                    )}
                  </div>
                )
              }
            >
              {editingFloor ? 'Update Floor' : 'Create Floor'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
} 