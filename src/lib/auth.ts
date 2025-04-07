import { auth } from './firebase';

/**
 * Gets the current user's authentication token
 * @param forceRefresh Whether to force a token refresh
 * @returns The authentication token or null if not authenticated
 */
export async function getAuthToken(forceRefresh = true): Promise<string | null> {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      console.log('No current user found in Firebase');
      return null;
    }
    
    console.log('Getting auth token for user:', user.email);
    const token = await user.getIdToken(forceRefresh);
    console.log('Got token (first 10 chars):', token.substring(0, 10) + '...');
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
} 