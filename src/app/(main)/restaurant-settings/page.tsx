'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Input,
  Textarea,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
  Avatar,
  Chip,
  Tooltip,
  Tabs,
  Tab,
  Badge,
  Spinner,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

import { useRestaurant } from '@/components/providers/RestaurantProvider';
import { useRestaurantSettings } from '@/hooks/useRestaurantSettings';
import { useToast } from '@/contexts/ToastContext';
import {
  restaurantSettingsSchema,
  RestaurantSettingsSchema,
  restaurantDeleteSchema,
  RestaurantDeleteSchema,
} from '@/schemas/restaurantSettingsSchema';

export default function RestaurantSettingsPage() {
  const router = useRouter();
  const toast = useToast();
  const { currentRestaurant } = useRestaurant();
  const {
    updateRestaurant,
    isUpdating,
    updateError: _updateError,
    deleteRestaurant,
    isDeleting,
    deleteError: _deleteError,
  } = useRestaurantSettings();
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { isOpen: isDeleteModalOpen, onOpen: onOpenDeleteModal, onClose: onCloseDeleteModal } = useDisclosure();
  const { isOpen: isUnsavedChangesModalOpen, onClose: onCloseUnsavedChangesModal } = useDisclosure();
  const { isOpen: isComingSoonModalOpen, onOpen: onOpenComingSoonModal, onClose: onCloseComingSoonModal } = useDisclosure();
  const [comingSoonFeature, setComingSoonFeature] = useState("");
  
  // Form setup for restaurant settings
  const {
    register: registerSettings,
    handleSubmit: handleSubmitSettings,
    formState: { errors: settingsErrors, isDirty: isSettingsDirty },
    reset: resetSettings,
    watch: watchSettings,
  } = useForm<RestaurantSettingsSchema>({
    resolver: zodResolver(restaurantSettingsSchema),
    defaultValues: {
      name: '',
      description: '',
      address: '',
      phone: '',
      email: '',
    },
  });
  
  // Form setup for restaurant deletion
  const {
    register: registerDelete,
    handleSubmit: handleSubmitDelete,
    formState: { errors: deleteErrors },
    watch: watchDelete,
  } = useForm<RestaurantDeleteSchema>({
    resolver: zodResolver(restaurantDeleteSchema),
  });

  // Confirmation name for deletion
  const confirmationName = watchDelete('confirmationName');
  const canDelete = confirmationName === currentRestaurant?.name;
  
  // Set initial form values when restaurant data is loaded
  useEffect(() => {
    if (currentRestaurant) {
      resetSettings({
        name: currentRestaurant.name || '',
        description: currentRestaurant.description || '',
        address: currentRestaurant.address || '',
        phone: currentRestaurant.phone || '',
        email: currentRestaurant.email || '',
      });
    }
  }, [currentRestaurant, resetSettings]);

  // Watch for form changes
  useEffect(() => {
    setHasUnsavedChanges(isSettingsDirty);
  }, [isSettingsDirty]);

  // Handle form submission for updating restaurant settings
  const onSubmitSettings = (data: RestaurantSettingsSchema) => {
    if (!currentRestaurant) return;
    
    updateRestaurant(data, {
      onSuccess: () => {
        toast.success('Restaurant settings saved successfully');
        setHasUnsavedChanges(false);
      },
      onError: (error) => {
        toast.error(`Failed to update restaurant: ${error.message}`);
      },
    });
  };

  // Handle form submission for restaurant deletion
  const onSubmitDelete = () => {
    if (!currentRestaurant) return;
    
    deleteRestaurant(undefined, {
      onSuccess: () => {
        toast.success('Restaurant deleted successfully');
        router.push('/dashboard');
        onCloseDeleteModal();
      },
      onError: (error) => {
        toast.error(`Failed to delete restaurant: ${error.message}`);
      },
    });
  };

  // Function to generate restaurant initials for avatar
  const getRestaurantInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }
  };
  
  const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  // Function to show coming soon modal
  const showComingSoonModal = (feature: string) => {
    setComingSoonFeature(feature);
    onOpenComingSoonModal();
  };

  if (!currentRestaurant) {
    return (
      <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center">
              <div className="relative w-12 h-12 mb-3">
                <div className="absolute inset-0 rounded-full border-2 border-[#75CAA6]/20"></div>
                <div className="absolute inset-0 rounded-full border-t-2 border-[#75CAA6] animate-spin"></div>
                <div className="absolute inset-2 rounded-full bg-[#75CAA6]/10 animate-pulse"></div>
                <div className="absolute inset-4 rounded-full bg-[#75CAA6]/20 animate-pulse" style={{ animationDelay: "0.3s" }}></div>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Loading restaurant information</p>
              <p className="text-xs text-gray-500 mt-1">Please wait while we retrieve your restaurant data</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <motion.div 
        className="max-w-7xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header with restaurant info */}
        <motion.div
          className="bg-gradient-to-r from-[#75CAA6]/20 via-[#75CAA6]/10 to-transparent border-b border-gray-100 dark:border-gray-700"
          variants={fadeInVariants}
        >
          <div className="p-6 lg:p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#75CAA6]/30 to-[#75CAA6]/10 blur-lg"></div>
                <Avatar
                  className="h-20 w-20 text-2xl font-semibold ring-4 ring-white dark:ring-gray-800 shadow-lg relative"
                  fallback={getRestaurantInitials(currentRestaurant?.name || '')}
                  color="primary"
                />
                <div className="absolute bottom-0 right-0 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md">
                  <Tooltip content="Restaurant is active">
                    <div className="text-[#75CAA6]">
                      <Icon icon="solar:check-circle-bold" className="w-5 h-5" />
                    </div>
                  </Tooltip>
                </div>
              </div>
              
              <div className="space-y-1 flex-grow">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">{currentRestaurant?.name}</h1>
                  {hasUnsavedChanges && (
                    <Badge color="warning" variant="flat" className="animate-pulse">Unsaved Changes</Badge>
                  )}
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">
                  Manage your restaurant profile and settings
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Chip size="sm" color="primary" variant="flat">Owner</Chip>
                  <Chip size="sm" color="default" variant="flat">
                    <div className="flex items-center gap-1">
                      <Icon icon="solar:calendar-bold-duotone" className="w-3.5 h-3.5" />
                      <span>Created {new Date(currentRestaurant?.createdAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                  </Chip>
                  <Chip size="sm" color="success" variant="flat">
                    <div className="flex items-center gap-1">
                      <Icon icon="solar:refresh-circle-bold-duotone" className="w-3.5 h-3.5" />
                      <span>Updated {new Date(currentRestaurant?.updatedAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                  </Chip>
                </div>
              </div>
              
              <div className="hidden lg:flex flex-col gap-2">
                <div className="flex gap-1.5">
                  <Button 
                    isIconOnly 
                    size="sm" 
                    variant="flat" 
                    color="default" 
                    onPress={() => showComingSoonModal("Download Restaurant Data")}
                  >
                    <div className="relative">
                      <Icon icon="solar:download-bold-duotone" className="text-lg" />
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary/60"></span>
                      </span>
                    </div>
                  </Button>
                  <Button 
                    isIconOnly 
                    size="sm" 
                    variant="flat" 
                    color="default" 
                    onPress={() => showComingSoonModal("Print Restaurant Details")}
                  >
                    <div className="relative">
                      <Icon icon="solar:printer-bold-duotone" className="text-lg" />
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary/60"></span>
                      </span>
                    </div>
                  </Button>
                  <Tooltip content="Restaurant online status">
                    <Button isIconOnly size="sm" variant="flat" color="success">
                      <Icon icon="solar:globe-bold-duotone" className="text-lg" />
                    </Button>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs and content */}
        <motion.div 
          className="p-4 lg:p-6"
          variants={itemVariants}
        >
          <Tabs 
            aria-label="Restaurant settings tabs" 
            color="primary" 
            variant="underlined"
            classNames={{
              tab: "h-12",
              tabList: "gap-6",
              cursor: "bg-primary/30 dark:bg-primary/20"
            }}
          >
            <Tab
              key="settings"
              title={
                <div className="flex items-center gap-2">
                  <Icon icon="solar:settings-bold-duotone" className="text-lg" />
                  <span>Restaurant Settings</span>
                </div>
              }
            >
              <motion.div 
                className="pt-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {isUpdating ? (
                  <div className="flex justify-center items-center h-64">
                    <Spinner color="primary" label="Saving restaurant data..." />
                  </div>
                ) : (
                  <form onSubmit={handleSubmitSettings(onSubmitSettings)}>
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {/* Form sections as motion.div with itemVariants */}
                      <motion.div variants={itemVariants}>
                        {/* Restaurant Information */}
                        <Card className="mb-6 shadow-sm">
                          <CardHeader className="flex justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Icon icon="solar:info-circle-bold-duotone" className="text-blue-600 dark:text-blue-400 w-5 h-5" />
                              </div>
                              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Restaurant Information</h3>
                            </div>
                          </CardHeader>
                          <Divider />
                          <CardBody className="gap-4">
                            <div>
                              <Input
                                label="Restaurant Name"
                                placeholder="Enter restaurant name"
                                labelPlacement="outside"
                                isRequired
                                startContent={<Icon icon="solar:shop-2-bold-duotone" className="text-lg text-default-400" />}
                                {...registerSettings('name')}
                                isInvalid={!!settingsErrors.name}
                                errorMessage={settingsErrors.name?.message}
                                classNames={{
                                  inputWrapper: "shadow-sm",
                                }}
                              />
                            </div>
                            
                            <div>
                              <Input
                                label="Email"
                                placeholder="Enter email address"
                                labelPlacement="outside"
                                isRequired
                                startContent={<Icon icon="solar:letter-bold-duotone" className="text-lg text-default-400" />}
                                {...registerSettings('email')}
                                isInvalid={!!settingsErrors.email}
                                errorMessage={settingsErrors.email?.message}
                                classNames={{
                                  inputWrapper: "shadow-sm",
                                }}
                              />
                            </div>
                            
                            <div>
                              <Input
                                label="Phone Number"
                                placeholder="Enter phone number"
                                labelPlacement="outside"
                                isRequired
                                startContent={<Icon icon="solar:phone-bold-duotone" className="text-lg text-default-400" />}
                                {...registerSettings('phone')}
                                isInvalid={!!settingsErrors.phone}
                                errorMessage={settingsErrors.phone?.message}
                                classNames={{
                                  inputWrapper: "shadow-sm",
                                }}
                              />
                            </div>
                            
                            <div>
                              <Input
                                label="Address"
                                placeholder="Enter address"
                                labelPlacement="outside"
                                isRequired
                                startContent={<Icon icon="solar:map-point-bold-duotone" className="text-lg text-default-400" />}
                                {...registerSettings('address')}
                                isInvalid={!!settingsErrors.address}
                                errorMessage={settingsErrors.address?.message}
                                classNames={{
                                  inputWrapper: "shadow-sm",
                                }}
                              />
                            </div>
                            
                            <div className="md:col-span-2">
                              <Textarea
                                label="Description"
                                placeholder="Enter restaurant description (services offered, cuisine type, etc.)"
                                labelPlacement="outside"
                                minRows={3}
                                {...registerSettings('description')}
                                isInvalid={!!settingsErrors.description}
                                errorMessage={settingsErrors.description?.message}
                                classNames={{
                                  inputWrapper: "shadow-sm",
                                }}
                              />
                            </div>
                          </CardBody>
                        </Card>
                      </motion.div>
                      
                      <motion.div variants={itemVariants}>
                        {/* Danger Zone */}
                        <Card className="mb-6 shadow-sm border border-danger-200 dark:border-danger-900/50">
                          <CardHeader className="flex justify-between bg-danger-50 dark:bg-danger-900/20">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-danger-100 dark:bg-danger-900/30 rounded-lg">
                                <Icon icon="solar:danger-triangle-bold-duotone" className="text-danger w-5 h-5" />
                              </div>
                              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Danger Zone</h3>
                            </div>
                          </CardHeader>
                          <CardBody className="gap-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 border border-danger-100 dark:border-danger-800/30 rounded-lg">
                              <div>
                                <h4 className="text-base font-medium text-gray-800 dark:text-gray-100">Delete Restaurant</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Once you delete your restaurant, there is no going back. Please be certain.
                                </p>
                              </div>
                              <Button 
                                color="danger" 
                                variant="flat"
                                onPress={onOpenDeleteModal}
                                startContent={<Icon icon="solar:trash-bin-trash-bold-duotone" className="text-lg" />}
                              >
                                Delete Restaurant
                              </Button>
                            </div>
                          </CardBody>
                        </Card>
                      </motion.div>
                      
                      <motion.div variants={itemVariants} className="flex justify-end mt-4">
                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="flat"
                            color="default"
                            onClick={() => {
                              if (currentRestaurant) {
                                resetSettings({
                                  name: currentRestaurant.name || '',
                                  description: currentRestaurant.description || '',
                                  address: currentRestaurant.address || '',
                                  phone: currentRestaurant.phone || '',
                                  email: currentRestaurant.email || '',
                                });
                              }
                            }}
                            isDisabled={!isSettingsDirty}
                          >
                            Reset
                          </Button>
                          <Button
                            type="submit"
                            color="primary"
                            isLoading={isUpdating}
                            isDisabled={!isSettingsDirty || !hasUnsavedChanges}
                            className="relative overflow-visible"
                            startContent={<Icon icon="solar:disk-bold-duotone" className="text-lg" />}
                          >
                            {hasUnsavedChanges && (
                              <motion.span
                                className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-warning"
                                initial={{ scale: 0 }}
                                animate={{ scale: [0, 1.2, 1] }}
                                transition={{ duration: 0.3 }}
                              />
                            )}
                            Save Changes
                          </Button>
                        </div>
                      </motion.div>
                    </motion.div>
                  </form>
                )}
              </motion.div>
            </Tab>
            
            <Tab
              key="activity"
              title={
                <div className="flex items-center gap-2">
                  <Icon icon="solar:clock-circle-bold-duotone" className="text-lg" />
                  <span>Activity Timeline</span>
                </div>
              }
            >
              <motion.div 
                className="pt-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="shadow-sm">
                  <CardBody className="p-8 flex flex-col items-center justify-center">
                    <div className="relative w-24 h-24 mb-6">
                      <div className="absolute inset-0 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <Icon icon="solar:clock-circle-bold-duotone" className="w-12 h-12 text-primary" />
                      </div>
                      <div className="absolute top-0 right-0 bg-primary rounded-full p-1.5 shadow-lg border-2 border-white dark:border-gray-800">
                        <Icon icon="solar:hourglass-bold-duotone" className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Activity Timeline Coming Soon</h3>
                    <p className="text-center text-gray-500 dark:text-gray-400 max-w-md mb-6">
                      We're building a comprehensive activity tracking system to help you monitor all changes and actions in your restaurant.
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
                      <div className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <Icon icon="solar:user-check-bold-duotone" className="text-primary w-5 h-5" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Staff activity</span>
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <Icon icon="solar:settings-bold-duotone" className="text-primary w-5 h-5" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Setting changes</span>
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <Icon icon="solar:calendar-mark-bold-duotone" className="text-primary w-5 h-5" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Reservation updates</span>
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <Icon icon="solar:bell-bold-duotone" className="text-primary w-5 h-5" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Notifications</span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            </Tab>
            
            <Tab
              key="integrations"
              title={
                <div className="flex items-center gap-2">
                  <Icon icon="solar:widget-2-bold-duotone" className="text-lg" />
                  <span>Integrations</span>
                </div>
              }
            >
              <motion.div 
                className="pt-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="shadow-sm">
                  <CardBody className="p-8 flex flex-col items-center justify-center">
                    <div className="relative w-24 h-24 mb-6">
                      <div className="absolute inset-0 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Icon icon="solar:widget-2-bold-duotone" className="w-12 h-12 text-purple-500" />
                      </div>
                      <div className="absolute top-0 right-0 bg-purple-500 rounded-full p-1.5 shadow-lg border-2 border-white dark:border-gray-800">
                        <Icon icon="solar:code-square-bold-duotone" className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Integrations Coming Soon</h3>
                    <p className="text-center text-gray-500 dark:text-gray-400 max-w-md mb-6">
                      We're developing powerful integrations with the most popular restaurant management services to streamline your operations.
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
                      <div className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <Icon icon="solar:card-bold-duotone" className="text-purple-500 w-5 h-5" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment processors</span>
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <Icon icon="solar:delivery-bold-duotone" className="text-purple-500 w-5 h-5" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Delivery services</span>
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <Icon icon="solar:calculator-bold-duotone" className="text-purple-500 w-5 h-5" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">POS systems</span>
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <Icon icon="solar:letter-bold-duotone" className="text-purple-500 w-5 h-5" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Marketing platforms</span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            </Tab>
          </Tabs>
        </motion.div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={onCloseDeleteModal}
        classNames={{
          backdrop: "bg-red-900/10 backdrop-blur-sm",
        }}
      >
        <ModalContent>
          <form onSubmit={handleSubmitDelete(onSubmitDelete)}>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Icon icon="solar:danger-triangle-bold-duotone" className="text-red-500 text-xl" />
                <span className="text-red-600">Delete Restaurant</span>
              </div>
            </ModalHeader>
            <ModalBody>
              <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-4 mb-4 border border-red-100 dark:border-red-800/20">
                <p className="text-red-600 dark:text-red-300 font-medium">
                  This action <span className="font-bold">cannot</span> be undone. 
                </p>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                This will permanently delete your restaurant <span className="font-semibold">{currentRestaurant?.name}</span>, all its 
                associated data, including floor plans, tables, shifts, reservations, and guest records.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Please type <span className="font-bold">{currentRestaurant?.name}</span> to confirm.
              </p>
              <Input
                placeholder={`Type "${currentRestaurant?.name}" to confirm`}
                {...registerDelete('confirmationName')}
                isInvalid={!!deleteErrors.confirmationName}
                errorMessage={deleteErrors.confirmationName?.message}
                color={canDelete ? "danger" : "default"}
                classNames={{
                  inputWrapper: "shadow-sm",
                }}
              />
            </ModalBody>
            <ModalFooter>
              <Button
                color="default"
                variant="light"
                onPress={onCloseDeleteModal}
              >
                Cancel
              </Button>
              <Button
                color="danger"
                type="submit"
                isDisabled={!canDelete}
                isLoading={isDeleting}
                startContent={<Icon icon="solar:trash-bin-trash-bold-duotone" className="text-lg" />}
              >
                Delete Restaurant
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Unsaved Changes Modal */}
      <Modal 
        isOpen={isUnsavedChangesModalOpen} 
        onClose={onCloseUnsavedChangesModal}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Icon icon="solar:question-circle-bold-duotone" className="text-amber-500 text-xl" />
              <span>Unsaved Changes</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <p className="text-gray-700 dark:text-gray-300">
              You have unsaved changes. Would you like to save them before leaving?
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="light"
              onPress={() => {
                onCloseUnsavedChangesModal();
                // Proceed with whatever action was interrupted
              }}
            >
              Discard Changes
            </Button>
            <Button
              color="primary"
              onPress={() => {
                // Save changes
                onSubmitSettings(watchSettings());
                onCloseUnsavedChangesModal();
              }}
            >
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Coming Soon Modal */}
      <Modal 
        isOpen={isComingSoonModalOpen} 
        onClose={onCloseComingSoonModal}
        classNames={{
          backdrop: "bg-blue-900/10 backdrop-blur-sm",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Icon icon="solar:hourglass-bold-duotone" className="text-primary text-xl" />
              <span className="text-primary">Coming Soon</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="bg-primary-50 dark:bg-primary-900/10 rounded-lg p-4 mb-4 border border-primary-100 dark:border-primary-800/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-full">
                  <Icon icon="solar:clock-circle-bold-duotone" className="w-5 h-5 text-primary" />
                </div>
                <p className="text-primary dark:text-primary-300 font-medium">
                  {comingSoonFeature} feature is currently under development
                </p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We're working hard to bring you this feature in a future update. Thank you for your patience as we continue to improve your restaurant management experience.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              onPress={onCloseComingSoonModal}
              className="w-full"
            >
              Got it
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
} 