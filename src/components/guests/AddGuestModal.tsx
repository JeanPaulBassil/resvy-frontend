'use client';

import { CreateGuestDto } from '@/api/guest';
import { useCreateGuest } from '@/hooks/useGuest';
import { classNames } from '@/lib/utils';
import {
  Avatar,
  Button,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Progress,
  Textarea,
} from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Mail, Phone, Save, User } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRestaurant } from '@/components/providers/RestaurantProvider';

// Available tags for the form
const availableTags = ['VIP', 'Regular', 'First-time', 'Vegetarian', 'Birthday'];

// Define type for chip colors
type ChipColorType = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

// Define tag color mapping
const getTagColor = (tag: string): ChipColorType => {
  const colorMap: Record<string, ChipColorType> = {
    VIP: 'warning',
    Regular: 'primary',
    'First-time': 'success',
    Vegetarian: 'secondary',
    Birthday: 'danger',
  };

  return colorMap[tag] || 'default';
};

// Form validation schema
const guestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().min(1, 'Phone number is required'),
  notes: z.string().optional(),
});

type GuestFormValues = z.infer<typeof guestSchema>;

interface AddGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddGuestModal({ isOpen, onClose }: AddGuestModalProps) {
  const { currentRestaurant } = useRestaurant();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [step, setStep] = useState<'details' | 'tags' | 'notes'>('details');

  // Initialize the create guest mutation
  const createGuestMutation = useCreateGuest(currentRestaurant?.id || '');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<GuestFormValues>({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      notes: '',
    },
  });

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const onSubmit = async (data: GuestFormValues) => {
    try {
      // Check if we have a restaurant id
      if (!currentRestaurant?.id) {
        console.error('No restaurant selected');
        return;
      }
      
      // Prepare the data according to CreateGuestDto
      const guestData: CreateGuestDto = {
        name: data.name,
        phone: data.phone,
        email: data.email || undefined,
        notes: data.notes || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      };

      // Submit using the mutation
      await createGuestMutation.mutateAsync(guestData);

      // Reset form and close modal on success
      reset();
      setSelectedTags([]);
      setStep('details');
      onClose();
    } catch (error) {
      // Error handling is managed by the mutation hook
      console.error('Error creating guest:', error);
    }
  };

  const watchedName = watch('name');

  // Calculate progress step
  const getStepProgress = () => {
    switch (step) {
      case 'details':
        return 33;
      case 'tags':
        return 66;
      case 'notes':
        return 100;
      default:
        return 33;
    }
  };

  // Determine if the current step is valid to enable the "Next" button
  const isCurrentStepValid = () => {
    if (step === 'details') {
      const name = watch('name');
      const phone = watch('phone');
      const email = watch('email');

      // Name and phone are required
      if (!name || !phone) return false;

      // If email is provided, it must be valid
      if (email && errors.email) return false;

      return true;
    }

    // Other steps don't have required fields
    return true;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      placement="center"
      scrollBehavior="inside"
      classNames={{
        base: 'max-w-md',
        wrapper: 'z-50',
        body: 'p-0',
        closeButton:
          'top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
        backdrop: 'bg-gray-900/60 backdrop-blur-sm',
      }}
      motionProps={{
        variants: {
          enter: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
              duration: 0.3,
              ease: [0.36, 0.66, 0.4, 1],
            },
          },
          exit: {
            opacity: 0,
            y: 20,
            scale: 0.95,
            transition: {
              duration: 0.2,
            },
          },
        },
      }}
    >
      <ModalContent>
        <ModalHeader className="pt-6 px-6 pb-0 flex flex-col items-center text-center">
          <Avatar
            name={watchedName || 'New Guest'}
            className="h-16 w-16 bg-success-50 text-success-500 dark:bg-success-900/20 dark:text-success-400 text-xl mb-3"
            showFallback
            isBordered
            color="success"
          />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {watchedName ? watchedName : 'Add New Guest'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
            {step === 'details' && 'Enter basic contact information'}
            {step === 'tags' && 'Add categories to organize your guests'}
            {step === 'notes' && 'Add any special notes or preferences'}
          </p>
          <Progress
            size="sm"
            value={getStepProgress()}
            color="success"
            className="w-full max-w-xs mb-2"
            aria-label="Form progress"
          />
        </ModalHeader>

        <ModalBody>
          <form id="add-guest-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="px-6 pt-4 pb-2">
              {/* Animated step content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {/* Step 1: Basic Details */}
                  {step === 'details' && (
                    <div className="space-y-10 mb-8">
                      <div>
                        <Input
                          label="Full Name"
                          labelPlacement="outside"
                          placeholder="John Smith"
                          startContent={<User className="text-gray-400 h-4 w-4" />}
                          isRequired
                          isInvalid={!!errors.name}
                          errorMessage={errors.name?.message}
                          radius="sm"
                          variant="flat"
                          isDisabled={createGuestMutation.isPending}
                          {...register('name')}
                        />
                      </div>

                      <div>
                        <Input
                          label="Phone Number"
                          labelPlacement="outside"
                          placeholder="+1 (555) 123-4567"
                          startContent={<Phone className="text-gray-400 h-4 w-4" />}
                          isRequired
                          isInvalid={!!errors.phone}
                          errorMessage={errors.phone?.message}
                          radius="sm"
                          variant="flat"
                          isDisabled={createGuestMutation.isPending}
                          {...register('phone')}
                        />
                      </div>

                      <div>
                        <Input
                          label="Email Address"
                          labelPlacement="outside"
                          placeholder="john.smith@example.com"
                          startContent={<Mail className="text-gray-400 h-4 w-4" />}
                          isInvalid={!!errors.email}
                          errorMessage={errors.email?.message}
                          radius="sm"
                          variant="flat"
                          isDisabled={createGuestMutation.isPending}
                          {...register('email')}
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 2: Tags */}
                  {step === 'tags' && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Select all relevant categories for this guest:
                      </p>

                      <div className="flex flex-wrap gap-2 p-4 bg-gray-50/70 dark:bg-gray-800/20 rounded-lg shadow-sm">
                        {availableTags.map((tag) => (
                          <Chip
                            key={tag}
                            variant={selectedTags.includes(tag) ? 'solid' : 'flat'}
                            color={selectedTags.includes(tag) ? getTagColor(tag) : 'default'}
                            radius="sm"
                            startContent={
                              selectedTags.includes(tag) ? <Check className="h-3 w-3" /> : undefined
                            }
                            className={classNames(
                              'cursor-pointer transition-all',
                              selectedTags.includes(tag)
                                ? 'border-0'
                                : 'border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/30'
                            )}
                            onClick={() => toggleTag(tag)}
                            isDisabled={createGuestMutation.isPending}
                          >
                            {tag}
                          </Chip>
                        ))}
                      </div>

                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        These categories help you filter and identify guests quickly.
                      </p>
                    </div>
                  )}

                  {/* Step 3: Notes */}
                  {step === 'notes' && (
                    <div className="space-y-4">
                      <Textarea
                        label="Guest Notes"
                        labelPlacement="outside"
                        placeholder="Add any special notes, preferences, or important information about this guest..."
                        radius="sm"
                        variant="flat"
                        minRows={6}
                        isInvalid={!!errors.notes}
                        errorMessage={errors.notes?.message}
                        isDisabled={createGuestMutation.isPending}
                        {...register('notes')}
                      />

                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Add information like dietary restrictions, seating preferences, or special
                        occasions.
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <ModalFooter className="px-6 py-4 bg-gray-50/80 dark:bg-gray-800/20 border-t border-gray-100 dark:border-gray-800">
              <div className="flex w-full justify-between">
                {/* Back button (except on first step) */}
                {step !== 'details' ? (
                  <Button
                    type="button"
                    variant="flat"
                    color="default"
                    startContent={<ChevronLeft className="h-4 w-4" />}
                    radius="sm"
                    onClick={() => setStep(step === 'notes' ? 'tags' : 'details')}
                    isDisabled={createGuestMutation.isPending}
                  >
                    Back
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="flat"
                    color="default"
                    radius="sm"
                    onClick={onClose}
                    isDisabled={createGuestMutation.isPending}
                  >
                    Cancel
                  </Button>
                )}

                {/* Next/Submit button */}
                {step !== 'notes' ? (
                  <Button
                    type="button"
                    color="success"
                    endContent={<ChevronRight className="h-4 w-4" />}
                    radius="sm"
                    isDisabled={!isCurrentStepValid() || createGuestMutation.isPending}
                    onClick={(e) => {
                      e.preventDefault();
                      setStep(step === 'details' ? 'tags' : 'notes');
                      e.stopPropagation();
                    }}
                    className="text-white"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    color="success"
                    radius="sm"
                    startContent={!createGuestMutation.isPending && <Save className="h-4 w-4" />}
                    isLoading={createGuestMutation.isPending}
                    className="text-white"
                  >
                    {createGuestMutation.isPending ? 'Creating...' : 'Create Guest'}
                  </Button>
                )}
              </div>
            </ModalFooter>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
