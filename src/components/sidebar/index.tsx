'use client';

import { Image, ScrollShadow, Spacer } from '@heroui/react';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { useAuth } from '../providers/AuthProvider';
import { useRestaurant } from '../providers/RestaurantProvider';
import { useSidebar } from '../providers/SidebarProvider';
import UserSettingsDropdown from '../user/UserSettingsDropdown';
import RestaurantSwitcher from './RestaurantSwitcher';
import Sidebar, { SidebarItem } from './Sidebar';

// Admin-only sidebar items
export const adminItems: SidebarItem[] = [
  {
    key: 'admin',
    title: '',
    items: [
      {
        key: 'clients',
        href: '/admin/clients',
        icon: 'solar:users-group-rounded-linear',
        title: 'Clients',
      },
      {
        key: 'allowed-emails',
        href: '/admin/allowed-emails',
        icon: 'solar:letter-linear',
        title: 'Allowed Emails',
      },
    ],
  },
  // {
  //   key: 'your-teams',
  //   title: 'Your Teams',
  //   items: [
  //     {
  //       key: 'heroui',
  //       href: '#',
  //       title: 'HeroUI',
  //       startContent: (
  //         <TeamAvatar
  //           classNames={{
  //             base: 'border-1 border-primary-foreground/20',
  //             name: 'text-primary-foreground/80',
  //           }}
  //           name="Hero UI"
  //         />
  //       ),
  //     },
  //     {
  //       key: 'tailwind-variants',
  //       href: '#',
  //       title: 'Tailwind Variants',
  //       startContent: (
  //         <TeamAvatar
  //           classNames={{
  //             base: 'border-1 border-primary-foreground/20',
  //             name: 'text-primary-foreground/80',
  //           }}
  //           name="Tailwind Variants"
  //         />
  //       ),
  //     },
  //     {
  //       key: 'heroui-pro',
  //       href: '#',
  //       title: 'HeroUI Pro',
  //       startContent: (
  //         <TeamAvatar
  //           classNames={{
  //             base: 'border-1 border-primary-foreground/20',
  //             name: 'text-primary-foreground/80',
  //           }}
  //           name="HeroUI Pro"
  //         />
  //       ),
  //     },
  //   ],
  // },
];

// Regular user sidebar items
export const userItems: SidebarItem[] = [
  {
    key: 'main',
    title: '',
    items: [
      {
        key: 'dashboard',
        href: '/dashboard',
        icon: 'solar:home-2-linear',
        title: 'Dashboard',
      },
      {
        key: 'reservations',
        href: '/reservations',
        icon: 'solar:calendar-mark-linear',
        title: 'Reservations',
      },
      {
        key: 'floor-plan',
        href: '/floor-plan',
        icon: 'solar:widget-2-outline',
        title: 'Floor Plan',
      },
      {
        key: 'guests',
        href: '/guests',
        icon: 'solar:user-rounded-linear',
        title: 'Guests',
      },
      {
        key: 'shifts',
        href: '/shifts',
        icon: 'solar:clock-circle-linear',
        title: 'Shifts',
      },
    ],
  },
];

/**
 * 💡 TIP: You can use the usePathname hook from Next.js App Router to get the current pathname
 * and use it as the active key for the Sidebar component.
 *
 * ```tsx
 * import {usePathname} from "next/navigation";
 *
 * const pathname = usePathname();
 * const currentPath = pathname.split("/")?.[1]
 *
 * <Sidebar defaultSelectedKey="home" selectedKeys={[th]} />
 * ```
 */
export default function AppWrapper() {
  const { userRole, isInitializing, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // Extract the first segment of the path
  const currentPath = pathname?.split('/')?.[1] || '';

  // Map path to sidebar key
  const getSelectedKey = (): string => {
    // For admin paths
    if (currentPath === 'admin') {
      const secondSegment = pathname?.split('/')?.[2];
      if (secondSegment === 'clients') return 'clients';
      if (secondSegment === 'allowed-emails') return 'allowed-emails';
      return 'clients'; // Default admin section
    }

    // For user paths
    if (currentPath === 'dashboard') return 'dashboard';
    if (currentPath === 'floor-plan') return 'floor-plan';
    if (currentPath === 'guests') return 'guests';
    if (currentPath === 'shifts') return 'shifts';
    if (currentPath === 'reservations') return 'reservations';
    if (currentPath === 'settings') return 'settings';

    // Default to dashboard
    return userRole === 'ADMIN' ? 'clients' : 'dashboard';
  };

  const [shouldRedirect, setShouldRedirect] = useState(false);
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const { restaurants, isLoading: isLoadingRestaurants } = useRestaurant();

  // Handle redirect after state update
  useEffect(() => {
    if (shouldRedirect) {
      console.log('Redirecting to onboarding in AppWrapper');
      router.push('/onboarding');
    }
  }, [shouldRedirect, router]);

  // Check if user has any restaurants
  useEffect(() => {
    const checkUserRestaurants = () => {
      if (user && userRole === 'USER' && !isLoadingRestaurants) {
        const hasAnyRestaurants = restaurants.length > 0;

        // Set redirect flag if user has no restaurants
        if (!hasAnyRestaurants) {
          setShouldRedirect(true);
        }
      }
    };

    checkUserRestaurants();
  }, [user, userRole, restaurants, isLoadingRestaurants, isInitializing]);

  // Determine which sidebar items to show based on user role
  const sidebarItems = userRole === 'ADMIN' ? adminItems : userItems;

  // Determine default selected key based on current path
  const activeKey = getSelectedKey();

  return (
    <div className="h-full relative flex-shrink-0">
      {/* Sidebar container with dynamic width */}
      <div
        className={`relative flex h-full flex-col bg-[#75CAA6] transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'w-72 p-6' : 'w-0 p-0 overflow-hidden'
        }`}
      >
        {/* Header with logo - fixed at top */}
        <div className="flex items-center gap-2 px-2 mb-2 flex-shrink-0">
          <div className="relative">
            <Image src="/logo.svg" alt="logo" width={isSidebarOpen ? 200 : 0} height={100} />
            {isSidebarOpen && (
              <div className="absolute bottom-0 right-0 text-white/80 text-[10px] italic font-light transform translate-x-8 translate-y-1">
                by rooster
              </div>
            )}
          </div>
        </div>

        {/* Restaurant Switcher - fixed below header */}
        {isSidebarOpen && userRole === 'USER' && (
          <div className="flex-shrink-0">
            <RestaurantSwitcher />
          </div>
        )}

        {/* Sidebar content - scrollable section */}
        {isSidebarOpen && (
          <div className="flex-grow overflow-hidden flex flex-col min-h-0">
            <ScrollShadow className="-mr-6 h-full py-6 pr-6 overflow-y-auto">
              <Sidebar
                defaultSelectedKey={activeKey}
                selectedKeys={[activeKey]}
                iconClassName="text-primary-foreground/60 group-data-[selected=true]:text-primary-foreground"
                itemClasses={{
                  title:
                    'text-primary-foreground/60 group-data-[selected=true]:text-primary-foreground',
                }}
                items={sidebarItems}
                sectionClasses={{
                  heading: 'text-primary-foreground/80',
                }}
                variant="flat"
              />
              <Spacer y={8} />
            </ScrollShadow>
          </div>
        )}

        {/* Footer with user settings - fixed at bottom */}
        {isSidebarOpen && (
          <div className="mt-auto flex flex-col flex-shrink-0">
            <div className="flex items-center gap-3 px-2">
              <div className="flex flex-col"></div>
            </div>
            <UserSettingsDropdown variant="sidebar" />
          </div>
        )}
      </div>

      {/* Toggle button positioned in the middle of the sidebar edge */}
      <div
        style={{
          left: isSidebarOpen ? '18rem' : '0', // Using style for smooth transition
          transition: 'left 0.3s ease-in-out, background-color 0.2s',
        }}
        className={`absolute top-1/2 -translate-y-1/2 z-20 bg-[#75CAA6] text-white shadow-md hover:bg-[#5fb992] hover:shadow-lg h-10 w-6 p-0 min-w-0 rounded-r-md ${
          isSidebarOpen ? 'border-l border-white/20' : ''
        }`}
      >
        <button
          aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          className="w-full h-full flex items-center justify-center"
          onClick={toggleSidebar}
        >
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
            className={`transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : ''}`}
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
