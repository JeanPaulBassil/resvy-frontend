'use client';

import { useRestaurant } from '@/components/providers/RestaurantProvider';
import { SidebarProvider } from '@/components/providers/SidebarProvider';
import AppWrapper from '@/components/sidebar';
import RestaurantIndicator from '@/components/shared/RestaurantIndicator';
import { Skeleton } from '@heroui/react';
import React from 'react';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useRestaurant();

  return (
    <SidebarProvider>
      <div className="flex h-[100dvh] overflow-hidden">
        <AppWrapper />
        <main className="flex-1 overflow-y-auto transition-all duration-300 ease-in-out transform-gpu w-full">
          {isLoading ? (
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto h-full">
                <div className="bg-white rounded-xl shadow-sm h-full p-6">
                <div className="flex flex-col h-full">
                  {/* Header skeleton with logo */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-[#75CAA6]/20 flex items-center justify-center animate-pulse">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-[#75CAA6]/50"
                        >
                          <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"></path>
                          <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"></path>
                          <path d="M12 3v6"></path>
                        </svg>
                      </div>
                      <div className="ml-3">
                        <Skeleton className="h-6 w-48 rounded-md" />
                        <Skeleton className="h-4 w-32 rounded-md mt-1" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-9 w-24 rounded-md" />
                      <Skeleton className="h-9 w-24 rounded-md" />
                    </div>
                  </div>
                  
                  {/* Content skeleton with staggered animation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {[...Array(6)].map((_, i) => (
                      <div 
                        key={i} 
                        className="rounded-lg border border-gray-100 p-4 animate-pulse"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      >
                        <div className="flex items-center mb-3">
                          <div className="w-8 h-8 rounded-full bg-[#75CAA6]/20 mr-3"></div>
                          <Skeleton className="h-5 w-32 rounded-md" />
                        </div>
                        <Skeleton className="h-4 w-full rounded-md mb-2" />
                        <Skeleton className="h-4 w-3/4 rounded-md mb-2" />
                        <Skeleton className="h-4 w-1/2 rounded-md" />
                        <div className="mt-4 flex justify-between items-center">
                          <Skeleton className="h-8 w-20 rounded-md" />
                          <Skeleton className="h-6 w-6 rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Loading message */}
                  <div className="flex flex-col items-center justify-center mt-8 mb-4">
                    <div className="relative w-12 h-12 mb-3">
                      <div className="absolute inset-0 rounded-full border-2 border-[#75CAA6]/20"></div>
                      <div className="absolute inset-0 rounded-full border-t-2 border-[#75CAA6] animate-spin"></div>
                      <div className="absolute inset-2 rounded-full bg-[#75CAA6]/10 animate-pulse"></div>
                      <div
                        className="absolute inset-4 rounded-full bg-[#75CAA6]/20 animate-pulse"
                        style={{ animationDelay: '0.3s' }}
                      ></div>
                    </div>
                    <p className="text-sm font-medium text-gray-600">Loading restaurant data</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Please wait while we set up your workspace
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative h-full">
              <RestaurantIndicator />
              {children}
            </div>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
}
