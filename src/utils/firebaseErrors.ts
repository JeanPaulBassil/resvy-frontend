import { FirebaseError } from 'firebase/app';

type FirebaseErrorMessages = {
  [key: string]: string;
};

export const firebaseErrors: FirebaseErrorMessages = {
  'auth/claims-too-large': 'The authentication claims are too large.',
  'auth/email-already-exists': 'The email address is already in use.',
  'auth/id-token-expired': 'Your session has expired. Please sign in again.',
  'auth/id-token-revoked': 'Your session has been revoked. Please sign in again.',
  'auth/insufficient-permission': 'Insufficient permissions to perform this action.',
  'auth/internal-error': 'An internal error occurred. Please try again later.',
  'auth/invalid-argument': 'Invalid request. Please check your input and try again.',
  'auth/invalid-claims': 'Invalid authentication claims. Please contact support.',
  'auth/invalid-continue-uri': 'The provided link is invalid.',
  'auth/invalid-creation-time': 'Invalid account creation time.',
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/invalid-disabled-field': 'Invalid account status update request.',
  'auth/invalid-display-name': 'Display name must be a non-empty string.',
  'auth/invalid-dynamic-link-domain': 'Invalid dynamic link configuration.',
  'auth/invalid-email': 'The email address is invalid.',
  'auth/invalid-email-verified': 'Invalid email verification status.',
  'auth/invalid-hash-algorithm': 'Unsupported password hashing algorithm.',
  'auth/invalid-hash-block-size': 'Invalid password hash block size.',
  'auth/invalid-hash-derived-key-length': 'Invalid hash key length.',
  'auth/invalid-hash-key': 'Invalid hash key format.',
  'auth/invalid-hash-memory-cost': 'Invalid password hashing parameters.',
  'auth/invalid-hash-parallelization': 'Invalid password hashing parameters.',
  'auth/invalid-hash-rounds': 'Invalid password hashing rounds.',
  'auth/invalid-hash-salt-separator': 'Invalid password hash salt separator.',
  'auth/invalid-id-token': 'Invalid authentication token. Please sign in again.',
  'auth/invalid-last-sign-in-time': 'Invalid last sign-in time.',
  'auth/invalid-page-token': 'Invalid page token. Please try again.',
  'auth/invalid-password': 'Password must be at least 6 characters long.',
  'auth/invalid-password-hash': 'Invalid password hash format.',
  'auth/invalid-password-salt': 'Invalid password salt format.',
  'auth/invalid-phone-number': 'Invalid phone number format.',
  'auth/invalid-photo-url': 'Invalid profile photo URL.',
  'auth/invalid-provider-data': 'Invalid authentication provider data.',
  'auth/invalid-provider-id': 'Invalid authentication provider ID.',
  'auth/invalid-oauth-responsetype': 'Invalid OAuth response type configuration.',
  'auth/invalid-session-cookie-duration':
    'Session cookie duration must be between 5 minutes and 2 weeks.',
  'auth/invalid-uid': 'User ID must be a valid string with at most 128 characters.',
  'auth/invalid-user-import': 'Invalid user data import request.',
  'auth/maximum-user-count-exceeded': 'Too many users imported at once.',
  'auth/missing-android-pkg-name': 'Missing Android package name in request.',
  'auth/missing-continue-uri': 'Missing continue URL in request.',
  'auth/missing-hash-algorithm': 'Password hashes require a hashing algorithm.',
  'auth/missing-ios-bundle-id': 'Missing iOS bundle ID in request.',
  'auth/missing-uid': 'Missing user identifier in request.',
  'auth/missing-oauth-client-secret': 'Missing OAuth client secret for authentication.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',
  'auth/phone-number-already-exists': 'The phone number is already in use.',
  'auth/project-not-found': 'Authentication service unavailable. Please try again later.',
  'auth/reserved-claims': 'Some authentication claims are reserved and cannot be used.',
  'auth/session-cookie-expired': 'Your session has expired. Please sign in again.',
  'auth/session-cookie-revoked': 'Your session has been revoked. Please sign in again.',
  'auth/too-many-requests': 'Too many unsuccessful login attempts. Please try again later.',
  'auth/uid-already-exists': 'The provided user ID is already in use.',
  'auth/unauthorized-continue-uri': 'The provided link is not authorized.',
  'auth/user-not-found': 'Invalid email or password.',
  'auth/wrong-password': 'Invalid email or password.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  default: 'An unexpected error occurred. Please try again.',
};

export const getFirebaseErrorMessage = (errorCode: string): string => {
  return firebaseErrors[errorCode] || firebaseErrors.default;
};

/**
 * Handles Firebase and general errors, returning an appropriate error message
 * @param error The error to handle (FirebaseError, Error, or unknown)
 * @returns A user-friendly error message
 */
export const handleAuthError = (error: unknown): string => {
  if (error instanceof FirebaseError) {
    return getFirebaseErrorMessage(error.code);
  }

  if (error instanceof Error) {
    console.error('Non-Firebase Error:', error);
    return error.message;
  }

  console.error('Unknown Error:', error);
  return getFirebaseErrorMessage('default');
};
