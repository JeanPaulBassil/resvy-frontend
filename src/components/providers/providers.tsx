'use client';

import { HeroUIProvider, ToastProvider as HeroUIToastProvider } from '@heroui/react';
import React from 'react';

import { ReactQueryProvider } from '@/providers/ReactQueryProvider';
import { AuthProvider } from './AuthProvider';
import { AuthWrapper } from './AuthWrapper';
import { ApiErrorProvider } from './ApiErrorProvider';
import { RestaurantProvider } from './RestaurantProvider';
import { SidebarProvider } from './SidebarProvider';
import { ToastProvider } from '@/contexts/ToastContext';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ReactQueryProvider>
      <ApiErrorProvider>
        <ToastProvider>
          <AuthProvider>
            <AuthWrapper>
              <SidebarProvider>
                <RestaurantProvider>
                  <HeroUIProvider>
                    <HeroUIToastProvider />
                    {children}
                  </HeroUIProvider>
                </RestaurantProvider>
              </SidebarProvider>
            </AuthWrapper>
          </AuthProvider>
        </ToastProvider>
      </ApiErrorProvider>
    </ReactQueryProvider>
  );
}
