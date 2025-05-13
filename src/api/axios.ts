import axios from 'axios';
import { getAuth } from 'firebase/auth';
import { getIdToken } from 'firebase/auth';
import { logout } from '@/services/authService';

// Define a fallback API URL in case the environment variable is not set
const DEFAULT_API_URL = 'http://localhost:5200/api';

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add a longer timeout to prevent quick failures
  timeout: 15000,
});

// Log the API URL being used
console.log('API URL being used:', axiosInstance.defaults.baseURL);

// Flag to track if we're experiencing connection issues
let isConnectionError = false;
let connectionErrorListeners: ((isError: boolean) => void)[] = [];

// Function to add connection error listeners
export const addConnectionErrorListener = (listener: (isError: boolean) => void) => {
  connectionErrorListeners.push(listener);
  // Immediately call with current state
  listener(isConnectionError);
  
  // Return function to remove listener
  return () => {
    connectionErrorListeners = connectionErrorListeners.filter(l => l !== listener);
  };
};

// Function to notify all listeners
const notifyConnectionErrorListeners = (isError: boolean) => {
  isConnectionError = isError;
  connectionErrorListeners.forEach(listener => listener(isError));
};

// Add request interceptor for authentication
axiosInstance.interceptors.request.use(
  async (config) => {
    // Make sure headers object exists
    config.headers = config.headers || {};
    
    // Always try to get a fresh token from Firebase first
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        console.log('Getting fresh Firebase ID token');
        // Always force refresh to ensure we have a valid token
        const token = await getIdToken(currentUser, true);
        
        // Store the token for future use
        sessionStorage.setItem('token', token);
        
        // If we have a valid token, make sure we're marked as logged in
        localStorage.setItem('loggedIn', 'true');
        
        console.log('Token refreshed successfully (first 10 chars):', token.substring(0, 10) + '...');
        // Set the Authorization header correctly
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.log('No current user found in Firebase');
        // Try to get token from storage as fallback
        const storedToken = sessionStorage.getItem('token') || localStorage.getItem('token');
        if (storedToken) {
          console.log('Using stored token (may be expired)');
          config.headers.Authorization = `Bearer ${storedToken}`;
        }
      }
    } catch (error) {
      console.error('Error refreshing Firebase ID token:', error);
      // Fallback to stored token if refresh fails
      const storedToken = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (storedToken) {
        console.log('Using stored token as fallback (may be expired)');
        config.headers.Authorization = `Bearer ${storedToken}`;
      }
    }
    
    console.log('Request URL:', config.url);
    console.log('Request baseURL:', config.baseURL);
    console.log('Request method:', config.method);
    console.log('Request headers:', JSON.stringify(config.headers));
    
    // Log query parameters for GET requests
    if (config.method?.toLowerCase() === 'get' && config.params) {
      console.log('Request params:', JSON.stringify(config.params));
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('Response successful:', response.status, response.config.url);
    // If we get a successful response, clear any connection error state
    if (isConnectionError) {
      notifyConnectionErrorListeners(false);
    }
    return response;
  },
  async (error) => {
    console.log('Response error detected:', error.message);
    
    if (error.response) {
      console.log('Error status:', error.response.status);
      console.log('Error data:', error.response.data);
      console.log('Error headers:', error.response.headers);
      
      // If we get any response, we're connected to the server
      if (isConnectionError) {
        notifyConnectionErrorListeners(false);
      }
    } else if (error.request) {
      console.log('No response received:', error.request);
      console.log('Network error details - URL attempted:', error.config?.url);
      console.log('Network error details - baseURL:', error.config?.baseURL);
      
      // This is likely a connection error (no response received)
      if (error.message === 'Network Error' || error.code === 'ECONNABORTED') {
        console.error('Connection error detected - unable to connect to the API server');
        notifyConnectionErrorListeners(true);
      }
    } else {
      console.log('Error setting up request:', error.message);
    }
    
    // Check if the error is due to user being deactivated
    if (error.response?.data?.code === 'AUTH_USER_DEACTIVATED') {
      console.log('User account has been deactivated. Logging out...');
      
      // Show alert to the user
      alert('Your account has been deactivated. You will be logged out.');
      
      // Log the user out
      await logout();
      
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login?reason=deactivated';
      }
      
      return Promise.reject(error);
    }

    // Handle users who are pending approval (not on allowed list)
    if (error.response?.data?.code === 'AUTH_USER_PENDING_APPROVAL') {
      console.log('User account is pending approval');
      
      // Don't log out or show alert - we want them to remain on the unauthorized page
      // Instead, if we're not already on the unauthorized page, redirect there
      if (typeof window !== 'undefined' && window.location.pathname !== '/unauthorized') {
        console.log('Redirecting to unauthorized page for pending approval');
        sessionStorage.setItem('onUnauthorizedPage', 'true');
        window.location.replace('/unauthorized');
      }
      
      return Promise.reject(error);
    }
    
    // Handle token expiration
    if (error.response?.status === 401) {
      console.log('Authentication error:', error.response?.data);
      
      // If we're not already on the login or signup page, redirect there
      if (typeof window !== 'undefined' && 
          !window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/signup')) {
        // Store the current path to redirect back after login
        sessionStorage.setItem('redirectPath', window.location.pathname);
        
        // Check if this is a token expiration
        if (error.response?.data?.message === 'Token expired') {
          console.log('Token expired, redirecting to login');
          window.location.href = '/login?reason=expired';
        } else if (error.response?.data?.message === 'Token revoked') {
          console.log('Token revoked, logging out');
          await logout();
          window.location.href = '/login?reason=revoked';
        } else {
          // Generic auth error
          console.log('Authentication error, redirecting to login');
          window.location.href = '/login?reason=auth_error';
        }
      }
    }
    
    // Implement retry logic for certain errors
    const config = error.config;
    
    // Only retry if we have a config object
    if (config) {
      // MODIFIED: Use a local retry count instead of a header
      // This avoids CORS issues with custom headers
      config.retryCount = config.retryCount || 0;
      
      // Check if we should retry (max 2 retries, so 3 total attempts)
      // Only retry for network errors or server errors (5xx), not for client errors (4xx)
      const shouldRetry = 
        // Network errors (no response)
        !error.response || 
        // Server errors (5xx)
        (error.response && error.response.status >= 500 && error.response.status < 600) ||
        // Timeout errors
        error.code === 'ECONNABORTED';
      
      if (config.retryCount < 2 && shouldRetry) {
        console.log(`Retrying request (${config.retryCount + 1}/2) after error:`, error.message);
        
        // Increment retry count
        config.retryCount += 1;
        
        // Wait a bit before retrying (exponential backoff)
        const delay = Math.pow(2, config.retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Force token refresh on retry
        try {
          const auth = getAuth();
          const currentUser = auth.currentUser;
          
          if (currentUser) {
            console.log('Refreshing token before retry');
            const token = await getIdToken(currentUser, true);
            config.headers.Authorization = `Bearer ${token}`;
            sessionStorage.setItem('token', token);
          }
        } catch (refreshError) {
          console.error('Error refreshing token before retry:', refreshError);
        }
        
        // Retry the request
        return axiosInstance(config);
      } else if (config.retryCount > 0 && !shouldRetry) {
        console.log('Not retrying client error (4xx):', error.response?.status, error.response?.data);
      }
    }
    
    // If we have a JSON parsing error, provide a more helpful error
    if (error.message && error.message.includes('Unexpected token')) {
      console.error('JSON parsing error detected - received non-JSON response');
      error.isJsonParsingError = true;
    }
    
    if (error.response && error.response.data) {
      // Check for various error message formats from the backend
      const backendMessage = 
        error.response.data.message || 
        (error.response.data.error && error.response.data.error.message) ||
        (typeof error.response.data === 'string' ? error.response.data : null);
      
      if (backendMessage) {
        // Keep the original error message
        error.originalMessage = error.message;
        // Override with the more descriptive backend message
        error.message = backendMessage;
        
        console.log('Enhanced error message from backend:', error.message);
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance; 