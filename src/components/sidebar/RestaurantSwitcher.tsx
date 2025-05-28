import { useToast } from '@/contexts/ToastContext';
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Skeleton,
  Textarea,
  useDisclosure,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import { useRestaurant } from '../providers/RestaurantProvider';
import { useSidebar } from '../providers/SidebarProvider';

// Initial restaurant form state
interface RestaurantForm {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
}

const initialRestaurantForm: RestaurantForm = {
  name: '',
  description: '',
  address: '',
  phone: '',
  email: '',
};

export default function RestaurantSwitcher() {
  const { restaurants, currentRestaurant, setCurrentRestaurant, isLoading, error, addRestaurant } =
    useRestaurant();
  const { isSidebarOpen } = useSidebar();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const toast = useToast();

  // Modal state
  const { isOpen: isModalOpen, onOpen: onOpenModal, onClose: onCloseModal } = useDisclosure();
  const [restaurantForm, setRestaurantForm] = useState<RestaurantForm>(initialRestaurantForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<RestaurantForm>>({});

  // Reset dropdown state when restaurants data changes
  useEffect(() => {
    setIsOpen(false);
  }, [restaurants]);

  // Memoize the action handler to prevent unnecessary rerenders
  const handleAction = useCallback(
    (key: React.Key) => {
      setIsOpen(false);

      if (key === 'add-restaurant') {
        onOpenModal();
      } else if (key === 'restaurant-settings') {
        router.push('/restaurant-settings');
      } else {
        // Handle restaurant selection
        const selected = restaurants?.find((r) => r.id === key);
        if (selected) {
          setCurrentRestaurant(selected);
        }
      }
    },
    [restaurants, router, setCurrentRestaurant, onOpenModal]
  );

  // Handle input change in the form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRestaurantForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Partial<RestaurantForm> = {};

    if (!restaurantForm.name.trim()) {
      errors.name = 'Restaurant name is required';
    }

    if (!restaurantForm.address.trim()) {
      errors.address = 'Address is required';
    }

    if (!restaurantForm.phone.trim()) {
      errors.phone = 'Phone number is required';
    }

    if (!restaurantForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(restaurantForm.email)) {
      errors.email = 'Please enter a valid email';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Call the API to add a restaurant
      if (addRestaurant) {
        const newRestaurant = await addRestaurant(restaurantForm);
        toast.success('Restaurant added successfully');

        // Automatically select the new restaurant
        setCurrentRestaurant(newRestaurant);

        onCloseModal();
        setRestaurantForm(initialRestaurantForm);
      }
    } catch (error) {
      toast.error('Failed to add restaurant');
      console.error('Failed to add restaurant:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when modal closes
  const handleModalClose = () => {
    setRestaurantForm(initialRestaurantForm);
    setFormErrors({});
    onCloseModal();
  };

  // Don't render anything if sidebar is closed
  if (!isSidebarOpen) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="mb-4">
        <p className="text-primary-foreground/80 text-xs font-medium mb-2 px-2">RESTAURANT</p>
        <div className="animate-pulse">
          <Skeleton className="rounded-md h-10 w-full bg-white/10" />
          <div className="mt-2 space-y-1">
            <Skeleton className="rounded-md h-4 w-3/4 bg-white/5" />
            <Skeleton className="rounded-md h-4 w-1/2 bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-2 px-4 rounded-md bg-red-500/20 text-white text-sm mb-4">
        Error loading restaurants
      </div>
    );
  }

  if (!restaurants || restaurants.length === 0) {
    return (
      <div className="py-2 px-4 rounded-md bg-white/10 text-white text-sm mb-4">
        No restaurants found
      </div>
    );
  }

  return (
    <div className="">
      <p className="text-primary-foreground/80 text-xs font-medium mb-2 px-2">RESTAURANT</p>
      <Dropdown isOpen={isOpen} onOpenChange={setIsOpen}>
        <DropdownTrigger>
          <Button
            radius="sm"
            className="w-full justify-between bg-white/10 hover:bg-white/20 text-white border-0"
            variant="flat"
            endContent={
              <span className="text-white">
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
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
            }
          >
            {currentRestaurant?.name || 'Select Restaurant'}
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          variant="light"
          aria-label="Restaurant selection"
          className="w-[240px]"
          onAction={handleAction}
          key={restaurants.length} // Force menu to rerender when restaurants change
        >
          {/* Section 1: Restaurant Switcher */}
          <DropdownSection title="SWITCH RESTAURANT" showDivider>
            {restaurants.map((restaurant) => (
              <DropdownItem
                variant="light"
                key={restaurant.id}
                className={currentRestaurant?.id === restaurant.id ? 'bg-primary/20' : ''}
                startContent={
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white">
                    {restaurant.name.charAt(0).toUpperCase()}
                  </div>
                }
              >
                {restaurant.name}
              </DropdownItem>
            ))}
          </DropdownSection>

          {/* Section 2: Restaurant Actions */}
          <DropdownSection title="ACTIONS">
            <DropdownItem
              key="add-restaurant"
              startContent={<Icon icon="solar:add-circle-linear" className="text-primary" />}
              onClick={onOpenModal}
            >
              Add Restaurant
            </DropdownItem>

            <DropdownItem
              key="restaurant-settings"
              startContent={<Icon icon="solar:settings-linear" className="text-primary" />}
              onClick={() => router.push('/restaurant-settings')}
            >
              Restaurant Settings
            </DropdownItem>
          </DropdownSection>
        </DropdownMenu>
      </Dropdown>

      {/* Add Restaurant Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        size="lg"
        classNames={{
          wrapper: 'z-[70]',
          backdrop: 'z-[65]',
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="bg-[#75CAA6]/10 p-1.5 rounded-md">
                <Icon icon="solar:chef-hat-linear" className="text-[#75CAA6] text-xl" />
              </div>
              <span>Add New Restaurant</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Restaurant Name*</label>
                <Input
                  name="name"
                  value={restaurantForm.name}
                  onChange={handleInputChange}
                  placeholder="Enter restaurant name"
                  isInvalid={!!formErrors.name}
                  errorMessage={formErrors.name}
                  startContent={<Icon icon="solar:home-2-linear" className="text-gray-400" />}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  name="description"
                  value={restaurantForm.description}
                  onChange={handleInputChange}
                  placeholder="Enter a brief description of your restaurant"
                  isInvalid={!!formErrors.description}
                  errorMessage={formErrors.description}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Address*</label>
                <Input
                  name="address"
                  value={restaurantForm.address}
                  onChange={handleInputChange}
                  placeholder="Enter restaurant address"
                  isInvalid={!!formErrors.address}
                  errorMessage={formErrors.address}
                  startContent={<Icon icon="solar:map-point-linear" className="text-gray-400" />}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Phone*</label>
                  <Input
                    name="phone"
                    value={restaurantForm.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                    isInvalid={!!formErrors.phone}
                    errorMessage={formErrors.phone}
                    startContent={<Icon icon="solar:phone-linear" className="text-gray-400" />}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email*</label>
                  <Input
                    name="email"
                    value={restaurantForm.email}
                    onChange={handleInputChange}
                    placeholder="Enter restaurant email"
                    isInvalid={!!formErrors.email}
                    errorMessage={formErrors.email}
                    startContent={<Icon icon="solar:letter-linear" className="text-gray-400" />}
                  />
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onClick={handleModalClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              className="bg-[#75CAA6]"
              onClick={handleSubmit}
              isLoading={isSubmitting}
            >
              Create Restaurant
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
