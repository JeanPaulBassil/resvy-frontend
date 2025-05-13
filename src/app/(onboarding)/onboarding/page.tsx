'use client';

import { restaurantApi } from '@/api/restaurant';
import RestaurantOnboarding from '@/components/onboarding/RestaurantOnboarding';
import { useAuth } from '@/components/providers/AuthProvider';
import UserSettingsDropdown from '@/components/user/UserSettingsDropdown';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function OnboardingPage() {
  const { user, userRole, isInitializing, refreshUserData } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [shouldRedirectToLogin, setShouldRedirectToLogin] = useState(false);
  const [shouldRedirectToAdmin, setShouldRedirectToAdmin] = useState(false);
  const [shouldRedirectToDashboard, setShouldRedirectToDashboard] = useState(false);
  const [isCheckingRestaurants, setIsCheckingRestaurants] = useState(false);
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

    // Check if user has restaurants
    const checkUserRestaurants = async (retryCount = 0) => {
      if (user && userRole === 'USER' && !isCheckingRestaurants) {
        setIsCheckingRestaurants(true);

        // If this is the first attempt, refresh user data first
        if (retryCount === 0) {
          try {
            console.log('Refreshing user data before checking restaurants...');
            await refreshUserData();
            console.log('User data refreshed successfully');
          } catch (error) {
            console.error('Error refreshing user data:', error);
          }
        }

        try {
          console.log('Fetching restaurants directly using restaurantApi...');
          // Add a small delay to ensure token is properly set
          await new Promise((resolve) => setTimeout(resolve, 500));

          const restaurants = await restaurantApi.getMyRestaurants();
          console.log('Restaurants fetched successfully:', restaurants.length);

          const hasAnyRestaurants = restaurants.length > 0;
          console.log('User has restaurants:', hasAnyRestaurants, 'Count:', restaurants.length);

          setNetworkError(null); // Clear any previous network errors

          // If user has restaurants, always redirect to dashboard
          if (hasAnyRestaurants) {
            console.log('User has restaurants, redirecting to dashboard...');
            
            // Save the hasRestaurants flag to localStorage to help with future checks
            localStorage.setItem('hasRestaurants', 'true');
            
            // Save the first restaurant as current if not already saved
            if (restaurants[0] && !localStorage.getItem('currentRestaurantId')) {
              localStorage.setItem('currentRestaurantId', restaurants[0].id);
              console.log('Saved first restaurant as current:', restaurants[0].id);
            }
            
            setShouldRedirectToDashboard(true);
          } else {
            // No restaurants found
            localStorage.removeItem('hasRestaurants');
            localStorage.removeItem('currentRestaurantId');
            setIsLoading(false);
          }
        } catch (error: unknown) {
          console.error('Error fetching restaurants:', error);

          // Define type guard for axios error
          const isAxiosError = (
            err: unknown
          ): err is {
            response?: {
              status: number;
              data: unknown;
              headers: unknown;
            };
            request?: unknown;
            message: string;
          } => {
            return (
              typeof err === 'object' &&
              err !== null &&
              ('response' in err || 'request' in err) &&
              'message' in err
            );
          };

          // Check specifically for network errors
          if (error instanceof Error && error.message === 'Network Error') {
            console.error('Network error detected - unable to connect to the API server');
            setNetworkError(
              'Unable to connect to the server. Please check your internet connection and try again.'
            );
          }

          // Log more detailed error information
          if (isAxiosError(error) && error.response) {
            console.error('Error response status:', error.response.status);
            console.error('Error response data:', error.response.data);
            console.error('Error response headers:', error.response.headers);
          } else if (isAxiosError(error) && error.request) {
            console.error('No response received:', error.request);
          } else if (error instanceof Error && error.message.includes('Unexpected token')) {
            console.error('JSON parsing error - likely received HTML instead of JSON');
            console.error(
              'This usually happens when the API returns an error page instead of JSON'
            );
          }

          // If we got an error but we have a valid user, retry after a delay
          if (retryCount < 3) {
            console.log(
              `Error fetching restaurants, retrying (${retryCount + 1}/3) in 1.5 seconds...`
            );
            setTimeout(() => {
              setIsCheckingRestaurants(false);
              checkUserRestaurants(retryCount + 1);
            }, 1500);
            return;
          }

          // After all retries, check localStorage as a fallback
          const hasRestaurantsInStorage = localStorage.getItem('hasRestaurants') === 'true';
          const currentRestaurantId = localStorage.getItem('currentRestaurantId');
          
          if (hasRestaurantsInStorage && currentRestaurantId) {
            console.log('Failed to fetch restaurants but found restaurant data in localStorage');
            setShouldRedirectToDashboard(true);
            return;
          }
          
          // After all retries, default to showing the onboarding page
          console.log('All retries failed, showing onboarding page');
          setIsLoading(false);
        } finally {
          setIsCheckingRestaurants(false);
        }
      }
    };

    if (!isInitializing && user) {
      checkUserRestaurants();
    }
  }, [user, userRole, isInitializing, refreshUserData, isCheckingRestaurants]);

  if (
    isInitializing ||
    isLoading ||
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
