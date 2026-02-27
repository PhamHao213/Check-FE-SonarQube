// Token utility functions for checking authentication status
import { isAuthenticated as checkAuth } from './cookieAuth';

// Check if user is authenticated (synchronous version for backward compatibility)
export const isAuthenticated = () => {
  // This is a synchronous version that should be used carefully
  // For accurate results, use the async version from cookieAuth
  return true; // Assume authenticated, let API calls handle the actual check
};

// Get token for backward compatibility (returns null since we use httpOnly cookies)
export const getToken = () => {
  // For backward compatibility, but tokens are now httpOnly
  // Components should use isAuthenticated() instead
  return null;
};

// Check if user has token (for UI conditional rendering)
export const hasToken = () => {
  return isAuthenticated();
};

// Async version that actually checks authentication
export const checkAuthentication = checkAuth;