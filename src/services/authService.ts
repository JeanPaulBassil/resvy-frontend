import { FirebaseError } from 'firebase/app';
import {
  GoogleAuthProvider,
  User,
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  getIdToken,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';

import { auth } from '@/lib/firebase';

// API URL definition
const API_URL = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/auth/login` 
  : 'http://localhost:5200/api/auth/login';

// 🔹 Helper function to send token to backend
async function sendTokenToBackend(token: string, user: User) {
  // Check if we're already on the unauthorized page to prevent redirect loops
  if (typeof window !== 'undefined' && sessionStorage.getItem('onUnauthorizedPage') === 'true') {
    throw new Error('UNAUTHORIZED_EMAIL');
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: user.displayName, email: user.email }),
    });
    
    console.log('Auth response status:', response.status, 'statusText:', response.statusText);
    
    if (!response.ok) {
      // Since we're seeing 401 errors for unauthorized emails but can't access the message,
      // we'll assume any 401 is an unauthorized email case
      if (response.status === 401) {
        console.log('401 Unauthorized detected, checking if admin...');
        console.log('User email:', user.email);
        
        // Try to check if this user is an admin (which would bypass the email allowlist)
        try {
          const adminCheckUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/check-admin`;
          console.log('Calling admin check endpoint:', adminCheckUrl);
          
          // Make a separate request to check if the user is an admin
          const adminCheckResponse = await fetch(adminCheckUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ email: user.email }),
          });
          
          console.log('Admin check response status:', adminCheckResponse.status);
          
          // If the admin check is successful, the user is an admin and should be allowed
          if (adminCheckResponse.ok) {
            const adminData = await adminCheckResponse.json();
            console.log('User is admin, bypassing email allowlist check. Response data:', adminData);
            
            // Store user data including role in localStorage immediately
            localStorage.setItem('loggedIn', 'true');
            localStorage.setItem('userData', JSON.stringify(adminData));
            
            return adminData;
          } else {
            const errorText = await adminCheckResponse.text();
            console.log('Admin check failed:', errorText);
          }
        } catch (adminCheckError) {
          console.error('Error checking admin status:', adminCheckError);
          // Continue with normal unauthorized flow if admin check fails
        }
        
        // Try to parse the response to see if we have user data
        try {
          const errorData = await response.json();
          console.log('Unauthorized response data:', errorData);
          
          if (errorData && errorData.user) {
            // Store the user data with isAllowed: false flag
            const userData = {
              ...errorData.user,
              isAllowed: false,
              pendingApproval: true
            };
            
            // Store in localStorage so we can use it on the unauthorized page
            localStorage.setItem('pendingUser', JSON.stringify(userData));
            console.log('Stored pending user data:', userData);
          }
        } catch (parseError) {
          console.error('Error parsing unauthorized response:', parseError);
        }
        
        console.log('User is not admin, redirecting to unauthorized page');
        // Set a flag in sessionStorage to help prevent redirect loops
        sessionStorage.setItem('onUnauthorizedPage', 'true');
        
        // Redirect to the unauthorized page - use replace instead of href for better performance
        if (typeof window !== 'undefined') {
          window.location.replace('/unauthorized');
        }
        
        // Throw a specific error that will be caught by the calling function
        throw new Error('UNAUTHORIZED_EMAIL');
      }
      
      throw new Error(`Failed to authenticate with backend: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    // If it's our specific error, just rethrow it
    if (error instanceof Error && error.message === 'UNAUTHORIZED_EMAIL') {
      throw error;
    }
    
    // For other errors, log and rethrow
    console.error('Error in sendTokenToBackend:', error);
    throw error;
  }
}

// 🔹 Sign in with email/password
export async function signIn(email: string, password: string, rememberMe: boolean) {
  try {
    // Set persistence based on rememberMe
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

    // Sign in with email and password
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get Firebase ID token
    const token = await getIdToken(user);

    // Send token to backend
    const backendUser = await sendTokenToBackend(token, user);

    // Store user data including role in localStorage
    // This is now handled in sendTokenToBackend for admin users who bypass the email check
    // We only need to set it here for regular users who pass the email check
    if (!localStorage.getItem('userData')) {
      localStorage.setItem('loggedIn', 'true');
      localStorage.setItem('userData', JSON.stringify(backendUser));
    }

    return backendUser;
  } catch (error) {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('userData');
    
    // If it's our specific error, just rethrow it
    if (error instanceof Error && error.message === 'UNAUTHORIZED_EMAIL') {
      throw error;
    }
    
    // Otherwise handle Firebase errors
    if (error instanceof FirebaseError) {
      throw error;
    }
    throw error;
  }
}

// 🔹 Sign in with Google
export async function signInWithGoogle() {
  try {
    const googleProvider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, googleProvider);
    const user = userCredential.user;

    // Get Firebase ID token
    const token = await getIdToken(user);

    // Send token to backend
    const backendUser = await sendTokenToBackend(token, user);

    // Store user data including role in localStorage
    // This is now handled in sendTokenToBackend for admin users who bypass the email check
    // We only need to set it here for regular users who pass the email check
    if (!localStorage.getItem('userData')) {
      localStorage.setItem('loggedIn', 'true');
      localStorage.setItem('userData', JSON.stringify(backendUser));
    }

    return backendUser;
  } catch (error) {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('userData');
    
    // If it's our specific error, just rethrow it
    if (error instanceof Error && error.message === 'UNAUTHORIZED_EMAIL') {
      throw error;
    }
    
    throw error;
  }
}

// 🔹 Sign up with email/password
export async function signUp(email: string, password: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 🔹 Get Firebase ID token
    const token = await getIdToken(user);

    // 🔹 Send token to backend
    const backendUser = await sendTokenToBackend(token, user);

    // Store user data including role in localStorage
    // This is now handled in sendTokenToBackend for admin users who bypass the email check
    // We only need to set it here for regular users who pass the email check
    if (!localStorage.getItem('userData')) {
      localStorage.setItem('loggedIn', 'true');
      localStorage.setItem('userData', JSON.stringify(backendUser));
    }

    return backendUser;
  } catch (error) {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('userData');
    throw error;
  }
}

// 🔹 Logout function
export async function logout() {
  // Clear localStorage
  localStorage.removeItem('loggedIn');
  localStorage.removeItem('userData');
  
  // Clear sessionStorage flags
  sessionStorage.removeItem('onUnauthorizedPage');
  
  // Sign out from Firebase
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out from Firebase:', error);
    // Continue with cleanup even if Firebase signout fails
  }
  
  // Return a promise that resolves after a small delay
  // This ensures all async operations have time to complete
  return new Promise(resolve => setTimeout(resolve, 100));
}

// 🔹 Get user role
export function getUserRole() {
  const userData = localStorage.getItem('userData');
  
  if (!userData) return null;
  
  try {
    const user = JSON.parse(userData);
    
    // Check different possible locations for the role
    if (user.role) {
      return user.role;
    } else if (user.user && user.user.role) {
      return user.user.role;
    } else if (user.payload && user.payload.user && user.payload.user.role) {
      return user.payload.user.role;
    } else {
      return null;
    }
  } catch {
    return null;
  }
}

// 🔹 Check if user is admin
export function isAdmin() {
  return getUserRole() === 'ADMIN';
}

// 🔹 Fetch user data from backend using current user's token
export async function fetchUserData(user: User) {
  if (!user) return null;

  try {
    // Check if user is a Firebase User object with getIdToken method
    let token;
    if (typeof user.getIdToken === 'function') {
      // If it's a Firebase User object, call the method directly
      token = await user.getIdToken();
    } else {
      // Otherwise use the imported function
      token = await getIdToken(user);
    }
    
    const userData = await sendTokenToBackend(token, user);
    
    // Store the user data in localStorage
    localStorage.setItem('userData', JSON.stringify(userData));
    
    return userData;
  } catch {
    return null;
  }
}
