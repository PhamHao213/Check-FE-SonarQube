import { logout as cookieLogout, isAuthenticated } from './cookieAuth';

// Auth utility functions
export const logout = cookieLogout;

export const checkTokenAndLogout = async () => {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    logout(true); // Redirect to login
    return false;
  }
  return true;
};

// Auto check token every 5 minutes (since access token is 30 minutes)
let tokenCheckInterval = null;

export const startTokenCheck = () => {
  if (tokenCheckInterval) return;
  
  tokenCheckInterval = setInterval(async () => {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      logout(true); // Redirect to login
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
};

export const stopTokenCheck = () => {
  if (tokenCheckInterval) {
    clearInterval(tokenCheckInterval);
    tokenCheckInterval = null;
  }
};

// Function to handle token refresh (if backend supports it)
export const refreshToken = async () => {
  try {
    const { API_BASE_URL } = await import('../api/config');
    
    const response = await fetch(`${API_BASE_URL}/users/refresh-token`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      return true;
    }
    
    return false;
  } catch (error) {
    // console.error('Token refresh failed:', error);
    return false;
  }
};

// Enhanced token check with refresh attempt
export const checkTokenWithRefresh = async () => {
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    // Try to refresh token before logging out
    const refreshed = await refreshToken();
    if (!refreshed) {
      logout(true); // Redirect to login
      return false;
    }
  }
  
  return true;
};

// Add event listener for storage changes (multi-tab logout)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'token' && !e.newValue) {
      // Token was removed in another tab, logout this tab too
      logout(true); // Redirect to login
    }
  });
}