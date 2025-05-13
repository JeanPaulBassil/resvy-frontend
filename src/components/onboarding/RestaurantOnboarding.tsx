'use client';

import { Button, Card, CardBody, CardHeader, Input, Listbox, ListboxItem, Progress, addToast, Select, SelectItem } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { restaurantApi, UnauthorizedAccessError } from '@/api/restaurant';
import { useRestaurant } from '@/components/providers/RestaurantProvider';
import { countryCodes } from '@/constants/countryCodes';

interface RestaurantOnboardingProps {
  className?: string;
}

const onboardingItems = [
  {
    key: "setup-restaurant",
    icon: "solar:restaurant-linear",
    title: "Create your restaurant",
    description: "Add details about your restaurant like name, location, and contact information.",
    isCompleted: false,
  },
];

export default function RestaurantOnboarding({ className }: RestaurantOnboardingProps) {
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    countryCode: '+961',
    phoneNumber: '',
    email: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const router = useRouter();
  const { refetchRestaurants, setCurrentRestaurant } = useRestaurant();

  // Fetch user's restaurants on component mount
  useEffect(() => {
    const fetchUserRestaurants = async () => {
      try {
        setIsLoading(true);
        const restaurants = await restaurantApi.getMyRestaurants();
        
        // If user has at least one restaurant, mark the first step as completed
        if (restaurants.length > 0) {
          const updatedCompletedSteps = ["setup-restaurant"];
          setCompletedSteps(updatedCompletedSteps);
          
          // Update progress
          const completedCount = updatedCompletedSteps.length;
          setProgress(Math.round((completedCount / onboardingItems.length) * 100));
          
          // Pre-fill form with the first restaurant's data if needed
          const firstRestaurant = restaurants[0];
          
          // Extract country code and phone number
          let countryCode = '+961'; // Default
          let phoneNumber = '';
          
          if (firstRestaurant.phone) {
            // Try to extract country code from phone number
            const countryCodeMatch = firstRestaurant.phone.match(/^\+\d+/);
            if (countryCodeMatch) {
              countryCode = countryCodeMatch[0];
              phoneNumber = firstRestaurant.phone.substring(countryCode.length);
            } else {
              phoneNumber = firstRestaurant.phone;
            }
          }
          
          setFormData({
            name: firstRestaurant.name || '',
            description: firstRestaurant.description || '',
            address: firstRestaurant.address || '',
            countryCode,
            phoneNumber,
            email: firstRestaurant.email || '',
          });
        }
      } catch (error) {
        console.error('Error fetching restaurants:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRestaurants();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCountryCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = e.target.value;
    setFormData(prev => ({
      ...prev,
      countryCode: selectedCode
    }));
  };

  const handleAction = (key: React.Key) => {
    setActiveStep(key as string);
  };

  const handleBack = () => {
    setActiveStep(null);
  };

  const handleSave = async () => {
    try {
      // Ensure we're logged in
      localStorage.setItem('loggedIn', 'true');
      
      // Combine country code and phone number
      const fullPhoneNumber = `${formData.countryCode}${formData.phoneNumber}`;
      
      // Save the restaurant data to the backend
      const newRestaurant = await restaurantApi.createRestaurant({
        name: formData.name,
        description: formData.description,
        address: formData.address,
        phone: fullPhoneNumber,
        email: formData.email,
      });
      
      console.log('Restaurant created successfully:', newRestaurant.id);
      
      // Set the newly created restaurant as the current restaurant
      setCurrentRestaurant(newRestaurant);
      
      // Store a flag to indicate we successfully created a restaurant
      // This is a backup in case the React Query cache doesn't update fast enough
      localStorage.setItem('hasCreatedRestaurant', 'true');
      localStorage.setItem('currentRestaurantId', newRestaurant.id);
      
      // Refetch restaurants to update the list
      try {
        await refetchRestaurants();
        console.log('Restaurants refetched after creation');
      } catch (refetchError) {
        console.error('Error refetching restaurants:', refetchError);
      }
      
      // Show success message
      addToast({
        title: "Success",
        description: "Restaurant created successfully!",
        color: "success",
        timeout: 3000,
      });
      
      // Mark the restaurant step as completed if not already
      if (!completedSteps.includes("setup-restaurant")) {
        const updatedSteps = [...completedSteps, "setup-restaurant"];
        setCompletedSteps(updatedSteps);
        
        // Update progress
        const completedCount = updatedSteps.length;
        setProgress(Math.round((completedCount / onboardingItems.length) * 100));
      }
      
      // Go back to the main list
      setActiveStep(null);
    } catch (error) {
      console.error('Error creating restaurant:', error);
      
      // Handle unauthorized access error
      if (error instanceof UnauthorizedAccessError) {
        addToast({
          title: "Permission Denied",
          description: error.message,
          color: "danger",
          timeout: 5000,
        });
      } else {
        // Handle other errors
        addToast({
          title: "Error",
          description: "Failed to create restaurant. Please try again.",
          color: "danger",
          timeout: 5000,
        });
      }
    }
  };

  const handleGoToDashboard = () => {
    // Set a flag to ensure we can navigate to dashboard successfully
    if (completedSteps.includes("setup-restaurant")) {
      // Make sure we have the hasCreatedRestaurant flag set
      localStorage.setItem('hasCreatedRestaurant', 'true');
      localStorage.setItem('loggedIn', 'true');
      
      // Log state for debugging
      console.log('Going to dashboard with flags - loggedIn:', localStorage.getItem('loggedIn'), 
        'hasCreatedRestaurant:', localStorage.getItem('hasCreatedRestaurant'));
      
      // Navigate to dashboard
      console.log('Navigating to dashboard');
      router.push('/dashboard');
    } else {
      // Show a message if they try to go to dashboard without completing setup
      addToast({
        title: "Setup Required",
        description: "Please complete restaurant setup first.",
        color: "warning",
        timeout: 3000,
      });
    }
  };

  // Get updated onboarding items with completion status
  const getUpdatedOnboardingItems = () => {
    return onboardingItems.map(item => ({
      ...item,
      isCompleted: completedSteps.includes(item.key)
    }));
  };

  // Render different content based on the active step
  const renderStepContent = () => {
    switch (activeStep) {
      case 'setup-restaurant':
        return (
          <div className="space-y-4 px-4 w-full h-[400px] flex flex-col">
            <h3 className="text-lg font-semibold">Restaurant Details</h3>
            <div className="flex-1 overflow-y-auto">
              <Input
                label="Restaurant Name"
                placeholder="Enter your restaurant name"
                name="name"
                radius='sm'
                value={formData.name}
                onChange={handleInputChange}
                variant="bordered"
                isRequired
                className="mb-4"
              />
              <Input
                label="Address"
                placeholder="Enter your restaurant address"
                name="address"
                radius='sm'
                value={formData.address}
                onChange={handleInputChange}
                variant="bordered"
                isRequired
                className="mb-4"
              />
              <div className="flex gap-2 mb-4">
                <Select
                  label="Country Code"
                  className="w-1/3"
                  radius="sm"
                  variant="bordered"
                  defaultSelectedKeys={[formData.countryCode]}
                  onChange={handleCountryCodeChange}
                  classNames={{
                    trigger: "min-h-unit-10",
                    value: "text-small"
                  }}
                  renderValue={(items) => {
                    return items.map((item) => {
                      const country = countryCodes.find(c => c.key === item.key);
                      return (
                        <div key={item.key} className="flex items-center gap-1">
                          <span>{country?.flag}</span>
                          <span>{country?.key}</span>
                        </div>
                      );
                    });
                  }}
                >
                  {countryCodes.map((country) => (
                    <SelectItem 
                      key={country.key}
                      startContent={<span>{country.flag}</span>}
                      textValue={country.key}
                    >
                      <div className="flex items-center gap-2">
                        <span>{country.key}</span>
                      </div>
                    </SelectItem>
                  ))}
                </Select>
                <Input
                  label="Phone Number"
                  placeholder="Enter phone number without country code"
                  name="phoneNumber"
                  radius='sm'
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  variant="bordered"
                  isRequired
                  className="w-2/3"
                />
              </div>
              <Input
                label="Email"
                radius='sm' 
                placeholder="Enter your restaurant email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                variant="bordered"
                isRequired
                className="mb-4"
              />
            </div>
            <div className="flex justify-between pt-4">
              <Button 
                variant="flat" 
                radius='sm'
                onClick={handleBack}
                startContent={<Icon icon="solar:arrow-left-linear" />}
              >
                Back
              </Button>
              <Button 
              radius='sm'
                color="primary" 
                onClick={handleSave}
                endContent={<Icon icon="solar:check-circle-linear" />}
              >
                Save Restaurant
              </Button>
            </div>
          </div>
        );
      case 'setup-tables':
        return (
          <div className="space-y-4 px-4 w-full h-[400px] flex flex-col">
            <h3 className="text-lg font-semibold">Table Setup</h3>
            <div className="flex-1 overflow-y-auto">
              <p className="text-default-500">Configure your restaurant's floor plan and table layout.</p>
              <div className="bg-default-100 p-6 rounded-lg text-center my-8">
                <Icon icon="solar:widget-linear" className="text-primary mb-2" width={40} />
                <p>Table setup feature coming soon!</p>
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <Button 
                variant="flat" 
                onClick={handleBack}
                startContent={<Icon icon="solar:arrow-left-linear" />}
              >
                Back
              </Button>
              <Button 
                color="primary" 
                onClick={handleBack}
              >
                Continue Later
              </Button>
            </div>
          </div>
        );
      case 'setup-hours':
        return (
          <div className="space-y-4 px-4 w-full h-[400px] flex flex-col">
            <h3 className="text-lg font-semibold">Business Hours</h3>
            <div className="flex-1 overflow-y-auto">
              <p className="text-default-500">Define your restaurant's operating hours and special schedules.</p>
              <div className="bg-default-100 p-6 rounded-lg text-center my-8">
                <Icon icon="solar:clock-circle-linear" className="text-primary mb-2" width={40} />
                <p>Business hours setup feature coming soon!</p>
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <Button 
                variant="flat" 
                onClick={handleBack}
                startContent={<Icon icon="solar:arrow-left-linear" />}
              >
                Back
              </Button>
              <Button 
                color="primary" 
                onClick={handleBack}
              >
                Continue Later
              </Button>
            </div>
          </div>
        );
      case 'setup-menu':
        return (
          <div className="space-y-4 px-4">
            <h3 className="text-lg font-semibold">Menu Setup</h3>
            <p className="text-default-500">Add your restaurant's menu items and categories.</p>
            <div className="bg-default-100 p-6 rounded-lg text-center">
              <Icon icon="solar:menu-dots-bold" className="text-primary mb-2" width={40} />
              <p>Menu setup feature coming soon!</p>
            </div>
            <div className="flex justify-between pt-4">
              <Button 
                variant="flat" 
                onClick={handleBack}
                startContent={<Icon icon="solar:arrow-left-linear" />}
              >
                Back
              </Button>
              <Button 
                color="primary" 
                onClick={handleBack}
              >
                Continue Later
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 w-[600px] ${className}`}>
      <Card className="w-full py-1 md:py-4 shadow-xl">
        <CardHeader className="flex items-center gap-3 px-5 pb-0 pt-3 md:px-10 md:pt-5 border-none">
          <div className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600">
            <Icon className="text-white" icon="solar:restaurant-line-duotone" width={30} />
          </div>
          <Progress
            showValueLabel
            classNames={{
              label: "font-medium",
              indicator: "bg-gradient-to-r from-primary-400 to-secondary-500",
              value: "text-foreground/60",
            }}
            label="Restaurant Setup"
            value={progress}
          />
        </CardHeader>
        <CardBody className="px-2 pt-3 sm:px-3 md:px-6">
          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <Icon icon="solar:spinner-line-duotone" className="text-primary animate-spin" width={40} />
                <p className="mt-2 text-default-500">Loading your restaurant data...</p>
              </div>
            </div>
          ) : activeStep ? (
            renderStepContent()
          ) : (
            <div className="h-[400px] flex flex-col">
              <div className="mb-4 px-4">
                <h2 className="text-xl font-bold">Welcome to Resvy!</h2>
                <p className="text-default-500">Complete these steps to set up your restaurant and start accepting reservations.</p>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <Listbox
                  hideSelectedIcon
                  aria-label="Restaurant setup checklist"
                  items={getUpdatedOnboardingItems()}
                  variant="flat"
                  onAction={handleAction}
                >
                  {(item) => (
                    <ListboxItem
                      key={item.key}
                      classNames={{
                        base: "w-full px-2 md:px-4 min-h-[70px] gap-3 hover:bg-default-100",
                        title: "text-medium font-medium",
                        description: "text-small text-wrap",
                      }}
                      description={<p className="text-default-500">{item.description}</p>}
                      endContent={
                        <div className="flex flex-none">
                          {item.isCompleted ? (
                            <Icon className="text-primary" icon="solar:check-circle-bold" width={30} />
                          ) : (
                            <Icon
                              className="text-default-400"
                              icon="solar:round-alt-arrow-right-bold"
                              width={30}
                            />
                          )}
                        </div>
                      }
                      startContent={
                        <div className="item-center flex rounded-medium border border-divider bg-default-100 p-2">
                          <Icon className="text-primary" icon={item.icon} width={24} />
                        </div>
                      }
                      title={item.title}
                    />
                  )}
                </Listbox>
              </div>
              
              <div className="flex justify-center gap-4 mt-6 px-4">
                {completedSteps.includes("setup-restaurant") && (
                  <Button 
                    color="secondary" 
                    size="lg" 
                    className="font-medium"
                    endContent={<Icon icon="solar:home-2-linear" />}
                    onClick={handleGoToDashboard}
                  >
                    Go to Dashboard
                  </Button>
                )}
                <Button 
                  color="primary" 
                  size="lg" 
                  className="font-medium"
                  endContent={<Icon icon="solar:arrow-right-linear" />}
                  onClick={() => setActiveStep("setup-restaurant")}
                >
                  {completedSteps.includes("setup-restaurant") ? "Edit Restaurant" : "Get Started"}
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
} 