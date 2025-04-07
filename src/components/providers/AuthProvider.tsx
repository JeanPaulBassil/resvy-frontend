import { onAuthStateChanged, User } from 'firebase/auth';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { auth } from '@/lib/firebase';
import { fetchUserData } from '@/services/authService';

// Define a type for our user with role
interface ExtendedUser extends User {
  role?: string | null;
}

// Define a type for our context
interface AuthContextType {
  user: ExtendedUser | null;
  isInitializing: boolean;
  userRole: string | null;
  isAdmin: boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isInitializing: true,
  userRole: null,
  isAdmin: false,
  refreshUserData: async () => {},
});

// Define interfaces for possible user data structures
interface UserData {
  role?: string;
  user?: {
    role?: string;
  };
  payload?: {
    user?: {
      role?: string;
    };
  };
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Function to get user data from localStorage
  const getUserDataFromStorage = () => {
    if (typeof window === 'undefined') return null;

    const userData = localStorage.getItem('userData');
    if (!userData) return null;

    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  };

  // Helper function to extract role from various data structures
  const extractRole = (data: unknown): string | null => {
    if (!data || typeof data !== 'object') return null;

    const userData = data as UserData;

    // Check direct role property
    if (userData.role) return userData.role;

    // Check nested user.role
    if (userData.user?.role) return userData.user.role;

    // Check nested payload.user.role (from your backend response)
    if (userData.payload?.user?.role) {
      return userData.payload.user.role;
    }

    return null;
  };

  // Function to refresh user data from the backend
  const refreshUserData = useCallback(async () => {
    if (!user) return;

    try {
      const userData = await fetchUserData(user);

      if (userData) {
        const role = extractRole(userData);

        const extendedUser = {
          ...user,
          role: role,
        };

        setUser(extendedUser);
        setUserRole(role);
      }
    } catch {
      // Silent error handling
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get user data from localStorage (including role)
        const userData = getUserDataFromStorage();

        // If we have userData with role, extend the firebase user
        if (userData) {
          const role = extractRole(userData);

          const extendedUser = {
            ...firebaseUser,
            role: role,
          };
          setUser(extendedUser);
          setUserRole(role);
        } else {
          // If no userData in localStorage but we have a firebase user,
          // fetch fresh data from backend
          setUser(firebaseUser); // Set the basic user first

          try {
            const backendData = await fetchUserData(firebaseUser);

            if (backendData) {
              const role = extractRole(backendData);

              const extendedUser = {
                ...firebaseUser,
                role: role,
              };

              setUser(extendedUser);
              setUserRole(role);
            }
          } catch {
            // Silent error handling
          }
        }
      } else {
        setUser(null);
        setUserRole(null);
      }

      setIsInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      user,
      isInitializing,
      userRole,
      isAdmin: userRole === 'ADMIN',
      refreshUserData,
    }),
    [user, isInitializing, userRole, refreshUserData]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  return useContext(AuthContext);
}
