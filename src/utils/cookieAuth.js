import { API_BASE_URL } from '../api/config';

// Kiểm tra xem user có đăng nhập không bằng cách gọi API
export const isAuthenticated = async () => {
  try {
    // Tránh gọi API khi đang ở các trang auth
    const currentPath = window.location.pathname;
    if (currentPath === '/login' || 
        currentPath === '/register' || 
        currentPath === '/verify-otp' || 
        currentPath === '/forgot-password') {
      return false;
    }
    
    let response = await fetch(`${API_BASE_URL}/users/check-auth`, {
      credentials: 'include'
    });
    
    // Nếu accessToken hết hạn, thử refresh
    if (response.status === 401) {
      const refreshResponse = await fetch(`${API_BASE_URL}/users/refresh-token`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (refreshResponse.ok) {
        // Thử lại check auth
        response = await fetch(`${API_BASE_URL}/users/check-auth`, {
          credentials: 'include'
        });
      } else {
        return false;
      }
    }
    
    const data = await response.json();
    return data.authenticated;
  } catch (error) {
    return false;
  }
};

// Clear auth data without API call
export const clearAuthData = () => {
  // Xóa tất cả dữ liệu trong localStorage
  localStorage.clear();
};

// Logout và clear cookies
export const logout = async (shouldRedirect = true) => {
  try {
    await fetch(`${API_BASE_URL}/users/logout`, {
      method: 'POST',
      credentials: 'include'
    });
  } catch (error) {
    // console.error('Logout error:', error);
  }
  
  // Clear auth data
  clearAuthData();
  
  // Redirect to login only if requested
  if (shouldRedirect) {
    window.location.href = '/login';
  }
};