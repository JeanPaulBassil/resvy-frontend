'use client';

import { Guest, UpdateGuestDto } from '@/api/guest';
import { CreateReservationDto } from '@/api/reservation';
import { ReservationForm } from '@/components/shared/ReservationForm';
import { useDeleteGuest, useUpdateGuest } from '@/hooks/useGuest';
import { classNames } from '@/lib/utils';
import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Checkbox,
  CheckboxGroup,
  Chip,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Radio,
  RadioGroup,
  Tab,
  Tabs,
  Textarea,
} from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronLeft,
  Coffee,
  Edit,
  Heart,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Save,
  Sparkles,
  Star,
  Trash2,
  User,
  UtensilsCrossed,
  Wine,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRestaurant } from '../providers/RestaurantProvider';

interface GuestDetailViewProps {
  guest: Guest;
  onBack: () => void;
}

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

// Mock reservation history for guest
// Removing mock reservations array
// Instead we'll show a coming soon message

export default function GuestDetailView({ guest: initialGuest, onBack }: GuestDetailViewProps) {
  const { currentRestaurant } = useRestaurant();
  // State for the guest data that we'll update
  const [guest, setGuest] = useState<Guest>(initialGuest);
  // State for delete confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // State for edit guest modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(guest.tags);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New state for preferences and restrictions
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);
  const [isRestrictionsModalOpen, setIsRestrictionsModalOpen] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isSavingRestrictions, setIsSavingRestrictions] = useState(false);

  // State for reservation modal
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [isCreatingReservation, setIsCreatingReservation] = useState(false);

  // State for preferences form - initialize from guest data if it exists
  const [preferredSeating, setPreferredSeating] = useState<string>(
    guest.preferredSeating || 'no-preference'
  );
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>(
    guest.diningPreferences || []
  );
  const [customPreference, setCustomPreference] = useState<string>('');

  // State for restrictions form - initialize from guest data if it exists
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>(
    guest.dietaryRestrictions || []
  );
  const [allergies, setAllergies] = useState<string>(guest.allergies || '');
  const [customRestriction, setCustomRestriction] = useState<string>('');

  // Keyboard handling for iPad - Set CSS custom property for actual viewport height
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Set initial value
    setVh();

    // Listen for resize events
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', setVh);

    // Also listen for visual viewport changes (keyboard)
    if ('visualViewport' in window) {
      window.visualViewport?.addEventListener('resize', setVh);
    }

    return () => {
      window.removeEventListener('resize', setVh);
      window.removeEventListener('orientationchange', setVh);
      if ('visualViewport' in window) {
        window.visualViewport?.removeEventListener('resize', setVh);
      }
    };
  }, []);

  // Initialize hooks for API operations
  const deleteGuestMutation = useDeleteGuest(currentRestaurant?.id as string);
  const updateGuestMutation = useUpdateGuest(guest.id, currentRestaurant?.id as string);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<GuestFormValues>({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      name: guest.name,
      email: guest.email || '',
      phone: guest.phone,
      notes: guest.notes || '',
    },
  });

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await deleteGuestMutation.mutateAsync(guest.id);
      setIsDeleteModalOpen(false);
      onBack(); // Navigate back after deletion
    } catch {
      // Error handling is already managed by the mutation hook
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const onSubmit = async (data: GuestFormValues) => {
    setIsSubmitting(true);

    const updateData: UpdateGuestDto = {
      name: data.name,
      phone: data.phone,
      email: data.email || undefined,
      notes: data.notes || undefined,
      tags: selectedTags,
    };

    try {
      const updatedGuest = await updateGuestMutation.mutateAsync(updateData);
      setIsEditModalOpen(false);
      // Update our local guest state
      setGuest(updatedGuest);
    } catch {
      // Error handling is already managed by the mutation hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = () => {
    // Reset form with current guest data
    reset({
      name: guest.name,
      email: guest.email || '',
      phone: guest.phone,
      notes: guest.notes || '',
    });
    setSelectedTags(guest.tags);
    setIsEditModalOpen(true);
  };

  const openPreferencesModal = () => {
    // Reset preferences form with current guest data
    setPreferredSeating(guest.preferredSeating || 'no-preference');
    setSelectedPreferences(guest.diningPreferences || []);
    setCustomPreference('');
    setIsPreferencesModalOpen(true);
  };

  const openRestrictionsModal = () => {
    // Reset restrictions form with current guest data
    setDietaryRestrictions(guest.dietaryRestrictions || []);
    setAllergies(guest.allergies || '');
    setCustomRestriction('');
    setIsRestrictionsModalOpen(true);
  };

  const handleSavePreferences = async () => {
    setIsSavingPreferences(true);

    try {
      // Create update data for the guest preferences
      const updateData: UpdateGuestDto = {
        preferredSeating: preferredSeating === 'no-preference' ? undefined : preferredSeating,
        diningPreferences: selectedPreferences,
      };

      // Update the guest with the new preferences
      const updatedGuest = await updateGuestMutation.mutateAsync(updateData);

      // Update local state
      setGuest(updatedGuest);
      setIsPreferencesModalOpen(false);
    } catch {
      // Error handling is already managed by the mutation hook
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handleAddCustomPreference = () => {
    if (customPreference.trim() !== '' && !selectedPreferences.includes(customPreference.trim())) {
      setSelectedPreferences([...selectedPreferences, customPreference.trim()]);
      setCustomPreference('');
    }
  };

  const handleSaveRestrictions = async () => {
    setIsSavingRestrictions(true);

    try {
      // Create update data for the guest dietary restrictions
      const updateData: UpdateGuestDto = {
        dietaryRestrictions: dietaryRestrictions,
        allergies: allergies || undefined,
      };

      // Update the guest with the new restrictions
      const updatedGuest = await updateGuestMutation.mutateAsync(updateData);

      // Update local state
      setGuest(updatedGuest);
      setIsRestrictionsModalOpen(false);
    } catch {
      // Error handling is already managed by the mutation hook
    } finally {
      setIsSavingRestrictions(false);
    }
  };

  const handleAddCustomRestriction = () => {
    if (
      customRestriction.trim() !== '' &&
      !dietaryRestrictions.includes(customRestriction.trim())
    ) {
      setDietaryRestrictions([...dietaryRestrictions, customRestriction.trim()]);
      setCustomRestriction('');
    }
  };

  const handleCreateReservation = async (reservationData: CreateReservationDto) => {
    setIsCreatingReservation(true);

    try {
      // TODO: Replace with actual API call when reservation API is implemented
      // Example: await createReservationMutation.mutateAsync({...reservationData, restaurantId});
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log('Creating reservation:', {
        ...reservationData,
        guestName: guest.name,
      });

      setIsReservationModalOpen(false);
    } catch {
      // Error handling will be managed by the mutation hook when implemented
    } finally {
      setIsCreatingReservation(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Header with back button and actions */}
      <div className="mb-4">
        <Button
          variant="flat"
          startContent={<ChevronLeft className="h-4 w-4" />}
          onPress={onBack}
          radius="sm"
          className="mb-5"
          size="sm"
        >
          Back to Guests
        </Button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <Avatar
              name={guest.name}
              className="h-14 w-14 text-lg hidden sm:flex text-white"
              isBordered
              color="success"
            />
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {guest.name}
              </h1>
              <div className="flex flex-wrap gap-2 mt-2">
                {guest.tags.map((tag) => (
                  <Chip key={tag} color={getTagColor(tag)} variant="flat" radius="sm" size="sm">
                    {tag}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-2 md:mt-0 self-start">
            <Button
              variant="flat"
              color="danger"
              startContent={<Trash2 className="h-4 w-4" />}
              radius="sm"
              size="sm"
              onPress={() => setIsDeleteModalOpen(true)}
            >
              Delete
            </Button>
            <Button
              color="success"
              startContent={<Edit className="h-4 w-4" />}
              radius="sm"
              className="text-white"
              size="sm"
              onPress={openEditModal}
            >
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left column - Guest profile card */}
        <div className="lg:col-span-1">
          <Card className="shadow-sm overflow-hidden">
            <CardBody className="p-5">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs text-default-500 mb-1">Member since</span>
                    <span className="text-sm font-medium">
                      {guest.createdAt ? new Date(guest.createdAt).getFullYear() : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-success-800 dark:text-success-300 mb-3">
                    <Sparkles className="h-5 w-5" />
                    <span className="text-sm font-medium">
                      {guest.visitCount} {guest.visitCount === 1 ? 'visit' : 'visits'} recorded
                    </span>
                  </div>
                </div>

                <Divider />

                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    <a
                      href={`tel:${guest.phone}`}
                      className="flex items-center p-2 -mx-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      <Phone className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 truncate">
                        {guest.phone}
                      </span>
                    </a>
                    <a
                      href={`mailto:${guest.email}`}
                      className="flex items-center p-2 -mx-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      <Mail className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 truncate">
                        {guest.email}
                      </span>
                    </a>
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-4">
                      <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      {guest.visitCount === 0 
                        ? 'New guest'
                        : `${guest.visitCount} ${guest.visitCount === 1 ? 'visit' : 'visits'}`}
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
            <CardFooter className="p-5 pt-0">
              <Button
                color="success"
                fullWidth
                startContent={<CalendarDays className="h-4 w-4" />}
                radius="sm"
                size="md"
                onPress={() => setIsReservationModalOpen(true)}
                className="text-white"
              >
                Create Reservation
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right column - Tabs with guest details */}
        <div className="lg:col-span-3">
          <Card className="shadow-sm overflow-hidden h-full">
            <Tabs
              aria-label="Guest details"
              fullWidth
              variant="underlined"
              color="success"
              classNames={{
                tabList: 'px-5 pt-1 border-b border-gray-200 dark:border-gray-700',
                cursor: 'bg-success-500',
                tab: 'h-12 data-[hover=true]:text-success text-sm font-medium',
              }}
            >
              <Tab key="notes" title="Notes & Preferences">
                <div className="p-5">
                  <div className="mb-6">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      Guest Notes
                    </h3>
                    {guest.notes ? (
                      <div className="bg-gray-50 dark:bg-gray-800/40 p-5 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                          {guest.notes}
                        </p>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/40 rounded-lg">
                        <MessageSquare className="h-10 w-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                        <p className="text-sm">No notes added for this guest</p>
                        <Button
                          className="mt-4"
                          variant="flat"
                          color="success"
                          radius="sm"
                          size="sm"
                          onPress={openEditModal}
                        >
                          Add Note
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <Card className="border shadow-none overflow-hidden bg-gray-50/80 dark:bg-gray-800/30">
                      <CardHeader className="pb-2 px-4 pt-4">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Dining Preferences
                        </h4>
                      </CardHeader>
                      <CardBody className="py-3 px-4">
                        {guest.diningPreferences && guest.diningPreferences.length > 0 ? (
                          <div className="space-y-2">
                            {guest.preferredSeating && (
                              <div className="mb-3">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                                  Preferred Seating:
                                </span>
                                <Chip size="sm" color="primary" variant="flat">
                                  {guest.preferredSeating}
                                </Chip>
                              </div>
                            )}
                            <div>
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                                Preferences:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {guest.diningPreferences.map((pref) => (
                                  <Chip key={pref} size="sm" color="success" variant="flat">
                                    {pref}
                                  </Chip>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            <p>No dining preferences recorded yet.</p>
                          </div>
                        )}
                      </CardBody>
                      <CardFooter className="px-4 pb-4 pt-0">
                        <Button
                          variant="flat"
                          color="success"
                          radius="sm"
                          size="sm"
                          onPress={openPreferencesModal}
                        >
                          {guest.diningPreferences && guest.diningPreferences.length > 0
                            ? 'Edit Preferences'
                            : 'Add Preferences'}
                        </Button>
                      </CardFooter>
                    </Card>

                    <Card className="border shadow-none overflow-hidden bg-gray-50/80 dark:bg-gray-800/30">
                      <CardHeader className="pb-2 px-4 pt-4">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Allergies & Dietary Restrictions
                        </h4>
                      </CardHeader>
                      <CardBody className="py-3 px-4">
                        {(guest.dietaryRestrictions && guest.dietaryRestrictions.length > 0) ||
                        guest.allergies ? (
                          <div className="space-y-3">
                            {guest.dietaryRestrictions && guest.dietaryRestrictions.length > 0 && (
                              <div>
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                                  Dietary Restrictions:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {guest.dietaryRestrictions.map((restriction) => (
                                    <Chip key={restriction} size="sm" color="danger" variant="flat">
                                      {restriction}
                                    </Chip>
                                  ))}
                                </div>
                              </div>
                            )}

                            {guest.allergies && (
                              <div>
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                                  Allergies:
                                </span>
                                <p className="text-xs text-gray-700 dark:text-gray-300 bg-danger-50 dark:bg-danger-900/20 p-2 rounded-md">
                                  {guest.allergies}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            <p>No allergies or dietary restrictions recorded yet.</p>
                          </div>
                        )}
                      </CardBody>
                      <CardFooter className="px-4 pb-4 pt-0">
                        <Button
                          variant="flat"
                          color="success"
                          radius="sm"
                          size="sm"
                          onPress={openRestrictionsModal}
                        >
                          {(guest.dietaryRestrictions && guest.dietaryRestrictions.length > 0) ||
                          guest.allergies
                            ? 'Edit Restrictions'
                            : 'Add Restrictions'}
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </div>
              </Tab>
              <Tab key="history" title="Reservation History">
                <div className="p-5">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      Past Reservations
                    </h3>
                    <Button
                      variant="flat"
                      color="success"
                      radius="sm"
                      size="sm"
                      endContent={<CalendarDays className="h-4 w-4" />}
                    >
                      View All
                    </Button>
                  </div>

                  <div className="py-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/40 rounded-lg">
                    <CalendarDays className="h-10 w-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-sm">Reservation history coming soon</p>
                    <p className="text-xs mt-2">
                      Reservations will be integrated in the next update
                    </p>
                  </div>
                </div>
              </Tab>
              <Tab key="activity" title="Activity & Spending">
                <div className="p-5">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      Activity Summary
                    </h3>
                  </div>

                  <div className="py-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/40 rounded-lg">
                    <User className="h-10 w-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-sm">Activity tracking coming soon</p>
                    <p className="text-xs mt-2">
                      Track guest spending, favorite dishes, and visit patterns
                    </p>
                  </div>
                </div>
              </Tab>
            </Tabs>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        placement="center"
        classNames={{
          base: 'max-w-md',
          wrapper: 'z-50',
          backdrop: 'bg-gray-900/60 backdrop-blur-sm',
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col items-center gap-1">
            <div className="p-3 rounded-full bg-danger-50 text-danger-500 dark:bg-danger-900/20 dark:text-danger-400 mt-3 mb-2">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Delete Guest</h3>
          </ModalHeader>
          <ModalBody className="text-center px-6 pb-2">
            <p className="text-gray-600 dark:text-gray-300 mb-1">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-900 dark:text-white">{guest.name}</span>?
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This action cannot be undone. All reservation history and guest data will be
              permanently removed.
            </p>
          </ModalBody>
          <ModalFooter className="flex justify-center gap-2 px-6 pb-6 pt-4">
            <Button
              variant="flat"
              color="default"
              onPress={() => setIsDeleteModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={handleDelete}
              className="flex-1"
              isLoading={isDeleting}
              startContent={!isDeleting && <Trash2 className="h-4 w-4" />}
            >
              {isDeleting ? 'Deleting...' : 'Delete Guest'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Guest Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        placement="top"
        scrollBehavior="inside"
        classNames={{
          base: 'max-h-[calc(var(--vh,1vh)*90)]',
          wrapper: 'z-50',
          body: 'p-0',
          closeButton:
            'top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
          backdrop: 'bg-gray-900/60 backdrop-blur-sm',
        }}
      >
        <ModalContent className="overflow-hidden flex flex-col max-h-[calc(var(--vh,1vh)*90)]">
          <ModalHeader className="pt-4 px-4 pb-2 flex flex-col items-center text-center flex-shrink-0">
            <Avatar
              name={guest.name}
              className="h-12 w-12 bg-success-50 text-success-500 dark:bg-success-900/20 dark:text-success-400 text-lg mb-2"
              showFallback
              isBordered
              color="success"
            />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Guest</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Update guest details and preferences
            </p>
          </ModalHeader>

          <ModalBody className="flex-1 overflow-y-auto py-2">
            <form id="edit-guest-form" onSubmit={handleSubmit(onSubmit)}>
              <div className="px-4 pt-2 pb-2">
                <div className="space-y-3">
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
                      size="sm"
                      classNames={{
                        inputWrapper: 'bg-gray-50/50 dark:bg-gray-800/30 shadow-sm',
                        label: 'text-gray-700 dark:text-gray-300 font-medium text-sm mb-1',
                        base: 'mt-0',
                      }}
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
                      size="sm"
                      classNames={{
                        inputWrapper: 'bg-gray-50/50 dark:bg-gray-800/30 shadow-sm',
                        label: 'text-gray-700 dark:text-gray-300 font-medium text-sm mb-1',
                        base: 'mt-0',
                      }}
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
                      size="sm"
                      classNames={{
                        inputWrapper: 'bg-gray-50/50 dark:bg-gray-800/30 shadow-sm',
                        label: 'text-gray-700 dark:text-gray-300 font-medium text-sm mb-1',
                        base: 'mt-0',
                      }}
                      {...register('email')}
                    />
                  </div>

                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">
                      Categories
                    </p>
                    <div className="flex flex-wrap gap-1.5 p-2.5 bg-gray-50/70 dark:bg-gray-800/20 rounded-lg shadow-sm">
                      {availableTags.map((tag) => (
                        <Chip
                          key={tag}
                          variant={selectedTags.includes(tag) ? 'solid' : 'flat'}
                          color={selectedTags.includes(tag) ? getTagColor(tag) : 'default'}
                          radius="sm"
                          size="sm"
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
                        >
                          {tag}
                        </Chip>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Textarea
                      label="Notes"
                      labelPlacement="outside"
                      placeholder="Add any special notes or preferences..."
                      rows={2}
                      radius="sm"
                      variant="flat"
                      classNames={{
                        inputWrapper: 'bg-gray-50/50 dark:bg-gray-800/30 shadow-sm',
                        input: 'text-sm',
                        label: 'text-gray-700 dark:text-gray-300 font-medium text-sm mb-1',
                        base: 'mt-0',
                      }}
                      {...register('notes')}
                    />
                  </div>
                </div>
              </div>

              <ModalFooter className="px-4 py-3 bg-gray-50/80 dark:bg-gray-800/20 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
                <Button
                  variant="flat"
                  color="default"
                  onPress={() => setIsEditModalOpen(false)}
                  className="flex-1"
                  radius="sm"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  color="success"
                  isLoading={isSubmitting}
                  startContent={!isSubmitting && <Save className="h-3.5 w-3.5" />}
                  className="flex-1 text-white"
                  radius="sm"
                  size="sm"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </ModalFooter>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Preferences Modal */}
      <Modal
        isOpen={isPreferencesModalOpen}
        onClose={() => setIsPreferencesModalOpen(false)}
        placement="top"
        scrollBehavior="inside"
        classNames={{
          base: 'max-h-[calc(var(--vh,1vh)*90)]',
          wrapper: 'z-50',
          body: 'p-0',
          closeButton:
            'top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
          backdrop: 'bg-gray-900/60 backdrop-blur-sm',
        }}
      >
        <ModalContent className="overflow-hidden flex flex-col max-h-[calc(var(--vh,1vh)*90)]">
          <ModalHeader className="pt-4 px-4 pb-2 flex flex-col items-center text-center flex-shrink-0">
            <div className="p-2.5 rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20 dark:text-emerald-400 mb-2">
              <Wine className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Dining Preferences
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Customize dining experience for {guest.name}
            </p>
          </ModalHeader>

          <ModalBody className="flex-1 overflow-y-auto py-2">
            <div className="px-4 py-2">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preferred Seating
                  </h4>
                  <RadioGroup
                    value={preferredSeating}
                    onValueChange={setPreferredSeating}
                    color="success"
                    orientation="horizontal"
                    size="sm"
                    classNames={{
                      wrapper: 'gap-3 flex-wrap',
                    }}
                  >
                    <Radio value="window">Window</Radio>
                    <Radio value="booth">Booth</Radio>
                    <Radio value="bar">Bar</Radio>
                    <Radio value="outdoor">Outdoor</Radio>
                    <Radio value="quiet">Quiet Area</Radio>
                    <Radio value="no-preference">No Preference</Radio>
                  </RadioGroup>
                </div>

                <Divider className="my-2" />

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Guest Preferences
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    <CheckboxGroup
                      value={selectedPreferences}
                      onValueChange={setSelectedPreferences}
                      color="success"
                      size="sm"
                      classNames={{
                        wrapper: 'gap-1.5',
                      }}
                    >
                      <Checkbox value="wine-enthusiast">
                        <div className="flex items-center">
                          <Wine className="h-3.5 w-3.5 mr-2 text-gray-500" />
                          <span className="text-sm">Wine Enthusiast</span>
                        </div>
                      </Checkbox>
                      <Checkbox value="cocktail-lover">
                        <div className="flex items-center">
                          <Sparkles className="h-3.5 w-3.5 mr-2 text-gray-500" />
                          <span className="text-sm">Cocktail Lover</span>
                        </div>
                      </Checkbox>
                      <Checkbox value="coffee-after-meal">
                        <div className="flex items-center">
                          <Coffee className="h-3.5 w-3.5 mr-2 text-gray-500" />
                          <span className="text-sm">Coffee After Meal</span>
                        </div>
                      </Checkbox>
                      <Checkbox value="dessert-lover">
                        <div className="flex items-center">
                          <Heart className="h-3.5 w-3.5 mr-2 text-gray-500" />
                          <span className="text-sm">Dessert Lover</span>
                        </div>
                      </Checkbox>
                      <Checkbox value="regular-menu">
                        <div className="flex items-center">
                          <Check className="h-3.5 w-3.5 mr-2 text-gray-500" />
                          <span className="text-sm">Regular Menu</span>
                        </div>
                      </Checkbox>
                      <Checkbox value="specials-only">
                        <div className="flex items-center">
                          <Star className="h-3.5 w-3.5 mr-2 text-gray-500" />
                          <span className="text-sm">Specials Only</span>
                        </div>
                      </Checkbox>
                    </CheckboxGroup>
                  </div>

                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Custom Preference
                    </h4>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add custom preference..."
                        value={customPreference}
                        onValueChange={setCustomPreference}
                        radius="sm"
                        variant="flat"
                        size="sm"
                        classNames={{
                          inputWrapper: 'bg-gray-50/50 dark:bg-gray-800/30 shadow-sm',
                          input: 'text-sm',
                        }}
                        startContent={<Plus className="h-3.5 w-3.5 text-gray-400" />}
                      />
                      <Button
                        color="success"
                        radius="sm"
                        size="sm"
                        isDisabled={customPreference.trim() === ''}
                        onPress={handleAddCustomPreference}
                        className="text-white"
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {selectedPreferences.filter(
                    (p) =>
                      ![
                        'wine-enthusiast',
                        'cocktail-lover',
                        'coffee-after-meal',
                        'dessert-lover',
                        'regular-menu',
                        'specials-only',
                      ].includes(p)
                  ).length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Custom Preferences Added:
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedPreferences
                          .filter(
                            (p) =>
                              ![
                                'wine-enthusiast',
                                'cocktail-lover',
                                'coffee-after-meal',
                                'dessert-lover',
                                'regular-menu',
                                'specials-only',
                              ].includes(p)
                          )
                          .map((pref) => (
                            <Chip
                              key={pref}
                              variant="flat"
                              color="success"
                              radius="sm"
                              size="sm"
                              onClose={() =>
                                setSelectedPreferences(
                                  selectedPreferences.filter((p) => p !== pref)
                                )
                              }
                            >
                              {pref}
                            </Chip>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <ModalFooter className="px-4 py-3 bg-gray-50/80 dark:bg-gray-800/20 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
              <Button
                variant="flat"
                color="default"
                onPress={() => setIsPreferencesModalOpen(false)}
                className="flex-1"
                radius="sm"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                color="success"
                onPress={handleSavePreferences}
                isLoading={isSavingPreferences}
                className="flex-1 text-white"
                radius="sm"
                size="sm"
              >
                {isSavingPreferences ? 'Saving...' : 'Save Preferences'}
              </Button>
            </ModalFooter>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Restrictions Modal */}
      <Modal
        isOpen={isRestrictionsModalOpen}
        onClose={() => setIsRestrictionsModalOpen(false)}
        placement="top"
        scrollBehavior="inside"
        classNames={{
          base: 'max-w-md max-h-[calc(var(--vh,1vh)*90)]',
          wrapper: 'z-50',
          body: 'p-0',
          closeButton:
            'top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
          backdrop: 'bg-gray-900/60 backdrop-blur-sm',
        }}
      >
        <ModalContent className="overflow-hidden flex flex-col max-h-[calc(var(--vh,1vh)*90)]">
          <ModalHeader className="pt-4 px-4 pb-2 flex flex-col items-center text-center flex-shrink-0">
            <div className="p-2.5 rounded-full bg-danger-50 text-danger-500 dark:bg-danger-900/20 dark:text-danger-400 mb-2">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Dietary Restrictions
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Track allergies and food preferences for {guest.name}
            </p>
          </ModalHeader>

          <ModalBody className="flex-1 overflow-y-auto py-2">
            <div className="px-4 py-2">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dietary Restrictions
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    <CheckboxGroup
                      value={dietaryRestrictions}
                      onValueChange={setDietaryRestrictions}
                      color="success"
                      size="sm"
                      classNames={{
                        wrapper: 'gap-1.5',
                      }}
                    >
                      <Checkbox value="vegetarian">Vegetarian</Checkbox>
                      <Checkbox value="vegan">Vegan</Checkbox>
                      <Checkbox value="gluten-free">Gluten-Free</Checkbox>
                      <Checkbox value="dairy-free">Dairy-Free</Checkbox>
                      <Checkbox value="paleo">Paleo</Checkbox>
                      <Checkbox value="keto">Keto</Checkbox>
                      <Checkbox value="halal">Halal</Checkbox>
                      <Checkbox value="kosher">Kosher</Checkbox>
                      <Checkbox value="low-sodium">Low Sodium</Checkbox>
                      <Checkbox value="low-carb">Low Carb</Checkbox>
                    </CheckboxGroup>
                  </div>

                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Custom Restriction
                    </h4>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add custom dietary restriction..."
                        value={customRestriction}
                        onValueChange={setCustomRestriction}
                        radius="sm"
                        variant="flat"
                        size="sm"
                        classNames={{
                          inputWrapper: 'bg-gray-50/50 dark:bg-gray-800/30 shadow-sm',
                          input: 'text-sm',
                        }}
                        startContent={<Plus className="h-3.5 w-3.5 text-gray-400" />}
                      />
                      <Button
                        color="success"
                        radius="sm"
                        size="sm"
                        isDisabled={customRestriction.trim() === ''}
                        onPress={handleAddCustomRestriction}
                        className="text-white"
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {dietaryRestrictions.filter(
                    (r) =>
                      ![
                        'vegetarian',
                        'vegan',
                        'gluten-free',
                        'dairy-free',
                        'paleo',
                        'keto',
                        'halal',
                        'kosher',
                        'low-sodium',
                        'low-carb',
                      ].includes(r)
                  ).length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Custom Restrictions Added:
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {dietaryRestrictions
                          .filter(
                            (r) =>
                              ![
                                'vegetarian',
                                'vegan',
                                'gluten-free',
                                'dairy-free',
                                'paleo',
                                'keto',
                                'halal',
                                'kosher',
                                'low-sodium',
                                'low-carb',
                              ].includes(r)
                          )
                          .map((restriction) => (
                            <Chip
                              key={restriction}
                              variant="flat"
                              color="danger"
                              radius="sm"
                              size="sm"
                              onClose={() =>
                                setDietaryRestrictions(
                                  dietaryRestrictions.filter((r) => r !== restriction)
                                )
                              }
                            >
                              {restriction}
                            </Chip>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                <Divider className="my-2" />

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Allergies & Other Concerns
                  </h4>
                  <Textarea
                    placeholder="E.g., Shellfish, peanuts, tree nuts, eggs, etc. Include severity if known."
                    value={allergies}
                    onValueChange={setAllergies}
                    radius="sm"
                    variant="flat"
                    size="sm"
                    rows={2}
                    classNames={{
                      inputWrapper: 'bg-gray-50/50 dark:bg-gray-800/30 shadow-sm',
                      input: 'text-sm',
                    }}
                  />
                  <p className="text-xs text-danger-500 mt-2">
                    <AlertTriangle className="h-3.5 w-3.5 inline mr-1" />
                    Food allergies will be highlighted to service staff
                  </p>
                </div>
              </div>
            </div>

            <ModalFooter className="px-4 py-3 bg-gray-50/80 dark:bg-gray-800/20 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
              <Button
                variant="flat"
                color="default"
                onPress={() => setIsRestrictionsModalOpen(false)}
                className="flex-1"
                radius="sm"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                color="success"
                onPress={handleSaveRestrictions}
                isLoading={isSavingRestrictions}
                className="flex-1 text-white"
                radius="sm"
                size="sm"
              >
                {isSavingRestrictions ? 'Saving...' : 'Save Restrictions'}
              </Button>
            </ModalFooter>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Create Reservation Modal */}
      <Modal
        isOpen={isReservationModalOpen}
        onClose={() => setIsReservationModalOpen(false)}
        placement="top"
        scrollBehavior="inside"
        size="full"
        classNames={{
          base: 'max-h-[calc(var(--vh,1vh)*90)]',
          wrapper: 'z-50',
          body: 'p-0',
          closeButton:
            'top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
          backdrop: 'bg-gray-900/60 backdrop-blur-sm',
        }}
      >
        <ModalContent className="overflow-hidden flex flex-col max-h-[calc(var(--vh,1vh)*90)]">
          <ModalHeader className="pt-4 px-4 pb-2 flex flex-col items-center text-center flex-shrink-0">
            <div className="p-2.5 rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20 dark:text-emerald-400 mb-2">
              <CalendarDays className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              New Reservation
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Create a reservation for {guest.name}
            </p>
          </ModalHeader>

          <ModalBody className="flex-1 overflow-y-auto py-2">
            <div className="px-4 py-2">
              <ReservationForm
                guest={guest}
                preferredSeating={preferredSeating}
                dietaryRestrictions={dietaryRestrictions}
                allergies={allergies}
                onSubmit={handleCreateReservation}
                onCancel={() => setIsReservationModalOpen(false)}
                isSubmitting={isCreatingReservation}
              />
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </motion.div>
  );
}
