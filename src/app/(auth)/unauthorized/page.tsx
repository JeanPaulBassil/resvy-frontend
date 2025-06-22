'use client';

import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';

import { logout, fetchUserData } from '@/services/authService';

// Preload the icons to prevent flickering
const ICONS = {
  email: 'mdi:email',
  phone: 'mdi:phone',
  info: 'mdi:information-outline'
};

export default function UnauthorizedPage() {
  const [isReady, setIsReady] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const router = useRouter();

  // Check authorization status and redirect if authorized
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check if Firebase user exists
        const firebaseUser = auth.currentUser;
        
        if (firebaseUser) {
          // Try to fetch fresh user data from the backend
          const result = await fetchUserData(firebaseUser);
          
          // If we successfully get data back, user is authorized
          if (result && !result.pendingApproval) {
            console.log('User is actually authorized, redirecting to dashboard');
            // Remove unauthorized flags
            sessionStorage.removeItem('onUnauthorizedPage');
            
            // Redirect to appropriate page based on role
            if (result.user?.role === 'ADMIN' || result.role === 'ADMIN') {
              router.replace('/admin/clients');
            } else {
              router.replace('/dashboard');
            }
            return;
          }
        }
        
        // Otherwise continue with unauthorized page setup
        const pendingUserData = localStorage.getItem('pendingUser');
        if (pendingUserData) {
          try {
            setPendingUser(JSON.parse(pendingUserData));
          } catch (error) {
            console.error('Error parsing pending user data:', error);
          }
        }
        
        // Mark component as ready
        setIsReady(true);
      } catch (error) {
        console.error('Error checking auth status:', error);
        // Still mark as ready even if there's an error
        setIsReady(true);
      }
    };
    
    // Set the unauthorized page flag
    sessionStorage.setItem('onUnauthorizedPage', 'true');
    
    // Run the auth check
    checkAuthStatus();
    
    // Preload icons
    const preloadIcons = async () => {
      try {
        // Small delay to ensure everything is loaded
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Error preloading icons:', error);
      }
    };
    
    preloadIcons();
    
    return () => {
      // Clean up when leaving the page
      sessionStorage.removeItem('onUnauthorizedPage');
    };
  }, [router]);

  // Handle returning to login
  const handleReturnToLogin = async () => {
    try {
      // Ensure user is fully logged out
      await logout();
      
      // Clear any remaining session data
      localStorage.removeItem('loggedIn');
      localStorage.removeItem('userData');
      localStorage.removeItem('pendingUser');
      
      // Remove the unauthorized page flag
      sessionStorage.removeItem('onUnauthorizedPage');
      
      // Set a flag to indicate we're coming from the unauthorized page
      sessionStorage.setItem('comingFromUnauthorized', 'true');
      
      // Navigate to login page
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      
      // Set the flag even if there's an error
      sessionStorage.setItem('comingFromUnauthorized', 'true');
      
      // Navigate to login even if there's an error
      router.push('/login');
    }
  };

  // Handle refreshing the page to check if user has been approved
  const handleRefresh = async () => {
    setIsReady(false); // Show loading state
    
    try {
      // Check if user is logged in with Firebase
      const firebaseUser = auth.currentUser;
      
      if (firebaseUser) {
        // Try to fetch fresh user data from the backend
        const result = await fetchUserData(firebaseUser);
        
        // If we successfully get data back, user is authorized
        if (result && !result.pendingApproval) {
          console.log('User is now authorized, redirecting to dashboard');
          
          // Remove unauthorized flags
          sessionStorage.removeItem('onUnauthorizedPage');
          
          // Redirect to appropriate page based on role
          if (result.user?.role === 'ADMIN' || result.role === 'ADMIN') {
            router.replace('/admin/clients');
          } else {
            router.replace('/dashboard');
          }
          return;
        }
      }
      
      // If still not authorized, just refresh the page
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing auth status:', error);
      window.location.reload();
    }
  };

  // Show a simple loading state until everything is ready
  if (!isReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden p-8 text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
        <div className="text-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-amber-600">
            {pendingUser ? 'Approval Pending' : 'Access Restricted'}
          </h2>
          <p className="text-lg text-gray-600">
            {pendingUser 
              ? 'Your account is registered but waiting for admin approval' 
              : 'Your email is not authorized to access this system'}
          </p>
        </div>
        <div className="p-6 space-y-6">
          <div className="text-center text-gray-700">
            {pendingUser ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-amber-600">
                  <Icon icon={ICONS.info} className="h-5 w-5" />
                  <p>Your account has been created successfully but requires admin approval.</p>
                </div>
                <p>
                  Once an administrator approves your account, you'll be able to access the system.
                  You can refresh this page to check if your account has been approved.
                </p>
                <div className="flex justify-center space-x-4 pt-4">
                  <Button variant="flat" onClick={handleRefresh}>
                    Check Approval Status
                  </Button>
                  <Button variant="ghost" onClick={handleReturnToLogin}>
                    Return to Login
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="mb-4">
                  This reservation system is only available to authorized users. If you believe you
                  should have access, please contact our support team.
                </p>
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="font-semibold text-lg mb-3">Support Contact</h3>
                  <div className="flex flex-col space-y-3 mb-6">
                    <div className="flex items-center justify-center gap-2">
                      <Icon icon={ICONS.email} className="h-5 w-5 text-primary" />
                      <a href="mailto:support@rooster-me.com" className="text-primary hover:underline">
                        support@rooster-me.com
                      </a>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Icon icon={ICONS.email} className="h-5 w-5 text-primary" />
                      <a href="mailto:jp@rooster-me.com" className="text-primary hover:underline">
                        jp@rooster-me.com
                      </a>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-3">Sales Contact</h3>
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center justify-center gap-2">
                      <Icon icon={ICONS.email} className="h-5 w-5 text-primary" />
                      <a href="mailto:info@rooster-me.com" className="text-primary hover:underline">
                        info@rooster-me.com
                      </a>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Icon icon={ICONS.phone} className="h-5 w-5 text-primary" />
                      <a href="tel:+9613543740" className="text-primary hover:underline">
                        +961 3 543740
                      </a>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center pt-4">
                  <Button variant="flat" onClick={handleReturnToLogin}>
                    Return to Login
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
