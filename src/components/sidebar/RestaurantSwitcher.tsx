import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  DropdownSection,
  Skeleton,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';
import { useRestaurant } from '../providers/RestaurantProvider';
import { useSidebar } from '../providers/SidebarProvider';

export default function RestaurantSwitcher() {
  const { restaurants, currentRestaurant, setCurrentRestaurant, isLoading, error } =
    useRestaurant();
  const { isSidebarOpen } = useSidebar();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Reset dropdown state when restaurants data changes
  useEffect(() => {
    setIsOpen(false);
  }, [restaurants]);

  // Memoize the action handler to prevent unnecessary rerenders
  const handleAction = useCallback((key: React.Key) => {
    setIsOpen(false);
    
    if (key === 'add-restaurant') {
      router.push('/settings/restaurants/new');
    } else if (key === 'restaurant-settings') {
      router.push('/settings/restaurants');
    } else {
      // Handle restaurant selection
      const selected = restaurants?.find((r) => r.id === key);
      if (selected) {
        setCurrentRestaurant(selected);
      }
    }
  }, [restaurants, router, setCurrentRestaurant]);

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
    <div className="mb-4">
      <p className="text-primary-foreground/80 text-xs font-medium mb-2 px-2">RESTAURANT</p>
      <Dropdown 
        isOpen={isOpen} 
        onOpenChange={setIsOpen}
      >
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
              onClick={() => router.push('/settings/restaurants/new')}
            >
              Add Restaurant
            </DropdownItem>
            
            <DropdownItem
              key="restaurant-settings"
              startContent={<Icon icon="solar:settings-linear" className="text-primary" />}
              onClick={() => router.push(`/settings/restaurant`)}
            >
              Restaurant Settings
            </DropdownItem>
          </DropdownSection>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
}
