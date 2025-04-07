'use client';

import {
  Avatar,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
} from '@heroui/react';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import { logout } from '@/services/authService';
import { useAuth } from '@/components/providers/AuthProvider';
import SkeletonText from '@/components/ui/SkeletonText';
import LogoutModal from '@/components/sidebar/LogoutModal';

interface UserSettingsDropdownProps {
  variant?: 'sidebar' | 'header';
  className?: string;
}

export default function UserSettingsDropdown({ 
  variant = 'sidebar',
  className = ''
}: UserSettingsDropdownProps) {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { user, isInitializing } = useAuth();
  const router = useRouter();

  const handleLogoutModalClose = () => setIsLogoutModalOpen(false);

  const handleLogoutModalOpen = () => setIsLogoutModalOpen(true);

  const handleLogoutConfirm = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Determine text color based on variant
  const textColor = variant === 'sidebar' ? 'text-primary-foreground' : 'text-default-700';
  const textColorSecondary = variant === 'sidebar' ? 'text-primary-foreground/60' : 'text-default-500';

  return (
    <>
      <Dropdown placement="bottom-end">
        <DropdownTrigger>
          <Button
            fullWidth
            className={`h-[60px] justify-start gap-3 rounded-[14px] border-1 border-default-300 bg-transparent px-3 py-[10px] ${className} min-w-[200px]`}
          >
            <div className="flex w-full items-center gap-3">
              <Avatar
                size="sm"
                radius="full"
                name={
                  isInitializing
                    ? undefined
                    : user?.displayName || user?.email?.split('@')[0] || undefined
                }
                showFallback
                src={isInitializing ? undefined : user?.photoURL || undefined}
                alt="Profile Photo"
                classNames={{
                  base: isInitializing ? 'opacity-50' : '',
                  fallback: textColor,
                }}
              />
              <div className="flex flex-col text-left">
                <SkeletonText isLoading={isInitializing} width={120} height={16}>
                  <p className={`text-small ${textColor}`}>
                    {user?.displayName || (user?.email ? user.email.split('@')[0] : 'No user')}
                  </p>
                </SkeletonText>
                <SkeletonText isLoading={isInitializing} width={160} height={14}>
                  <p className={`text-tiny ${textColorSecondary}`}>
                    {user?.email || 'No user'}
                  </p>
                </SkeletonText>
              </div>
            </div>
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Profile Actions"
          className="bg-content1 px-[8px] py-[8px]"
          variant="flat"
        >
          <DropdownItem key="profile" className="h-14">
            <div className="flex w-full items-center gap-3">
              <Avatar
                size="sm"
                radius="full"
                name={
                  isInitializing
                    ? undefined
                    : user?.displayName || user?.email?.split('@')[0] || undefined
                }
                showFallback
                src={isInitializing ? undefined : user?.photoURL || undefined}
                alt="Profile Photo"
                classNames={{
                  base: isInitializing ? 'opacity-50' : '',
                  fallback: 'text-default-700',
                }}
              />
              <div className="flex flex-col text-left">
                <SkeletonText isLoading={isInitializing} width={120} height={16}>
                  <p className="text-small">
                    {user?.displayName || (user?.email ? user.email.split('@')[0] : 'No user')}
                  </p>
                </SkeletonText>
                <SkeletonText isLoading={isInitializing} width={160} height={14}>
                  <p className="text-tiny">{user?.email || 'No user'}</p>
                </SkeletonText>
              </div>
            </div>
          </DropdownItem>
          <DropdownSection showDivider aria-label="profile-section-1" className="px-0">
            <DropdownItem
              key="my-plan"
              className="py-[4px] text-default-500"
              isDisabled
              description="Coming soon"
            >
              My Plan
            </DropdownItem>
          </DropdownSection>
          <DropdownSection aria-label="profile-section-3" className="mb-0">
            <DropdownItem
              key="help-and-feedback"
              className="py-[4px] text-default-500"
              isDisabled
              description="Coming soon"
            >
              Help & Feedback
            </DropdownItem>
            <DropdownItem
              key="logout"
              className="pt-[4px] text-default-500"
              onPress={handleLogoutModalOpen}
            >
              Log Out
            </DropdownItem>
          </DropdownSection>
        </DropdownMenu>
      </Dropdown>

      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={handleLogoutModalClose}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
} 