'use client';

import { restaurantApi } from '@/api/restaurant';
import RestaurantOnboarding from '@/components/onboarding/RestaurantOnboarding';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRestaurant } from '@/components/providers/RestaurantProvider';
import UserSettingsDropdown from '@/components/user/UserSettingsDropdown';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function OnboardingPage() {
  const { user, userRole, isInitializing, refreshUserData } = useAuth();
  const { hasRestaurants, isLoading: isLoadingRestaurants } = useRestaurant();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [shouldRedirectToLogin, setShouldRedirectToLogin] = useState(false);
  const [shouldRedirectToAdmin, setShouldRedirectToAdmin] = useState(false);
  const [shouldRedirectToDashboard, setShouldRedirectToDashboard] = useState(false);
  const [redirectAttempts, setRedirectAttempts] = useState(0);
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Handle redirects based on state
  useEffect(() => {
    if (shouldRedirectToLogin) {
      router.push('/login');
    } else if (shouldRedirectToAdmin) {
      router.push('/admin');
    } else if (shouldRedirectToDashboard && redirectAttempts < 2) {
      setRedirectAttempts((prev) => prev + 1);
      router.push('/dashboard');
    } else if (redirectAttempts >= 2) {
      // If we've tried to redirect too many times, just show the onboarding page
      console.log('Too many redirect attempts, showing onboarding page anyway');
      setShouldRedirectToDashboard(false);
      setIsLoading(false);
    }
  }, [
    shouldRedirectToLogin,
    shouldRedirectToAdmin,
    shouldRedirectToDashboard,
    router,
    redirectAttempts,
  ]);

  useEffect(() => {
    // If user is not authenticated, set redirect to login
    if (!isInitializing && !user) {
      setShouldRedirectToLogin(true);
      return;
    }

    // If user is admin, set redirect to admin dashboard
    if (!isInitializing && userRole === 'ADMIN') {
      setShouldRedirectToAdmin(true);
      return;
    }

    // If we've finished loading and user has restaurants, redirect to dashboard
    if (!isInitializing && !isLoadingRestaurants && hasRestaurants) {
      console.log('User has restaurants, redirecting to dashboard...');
      setShouldRedirectToDashboard(true);
      return;
    }

    // If we've finished loading and user doesn't have restaurants, show onboarding
    if (!isInitializing && !isLoadingRestaurants) {
      setIsLoading(false);
    }
  }, [user, userRole, isInitializing, hasRestaurants, isLoadingRestaurants]);

  // If we're in a loading state, show loading spinner
  if (
    isInitializing ||
    isLoading ||
    isLoadingRestaurants ||
    shouldRedirectToLogin ||
    shouldRedirectToAdmin ||
    shouldRedirectToDashboard
  ) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#75CAA6]">
        <div className="text-center text-white">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-white/80">Setting up your experience</p>
        </div>
      </div>
    );
  }

  // Show network error message if there is one
  if (networkError) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#75CAA6]">
        <div className="text-center text-white max-w-md p-6 bg-red-500/20 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Connection Error</h2>
          <p className="text-white/90 mb-4">{networkError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white text-red-600 rounded-md font-medium hover:bg-white/90"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-center justify-center flex-col bg-[#75CAA6]">
      <header className="absolute top-0 left-0 right-0 border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Resvy Logo" width={150} height={50} />
          </div>
          <div className="flex items-center gap-4">
            <UserSettingsDropdown variant="header" />
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto py-8 w-full h-full flex items-center justify-center">
        <RestaurantOnboarding className="mt-8" />
      </main>
    </div>
  );
}
