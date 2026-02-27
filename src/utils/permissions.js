// Utility functions for checking user permissions
import React from 'react';
import ApiHelper from '../api/apiHelper';

// Helper functions for cookie operations
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    try {
      return decodeURIComponent(parts.pop().split(';').shift());
    } catch (error) {
      return null;
    }
  }
  return null;
};

const setCookie = (name, value, days = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

const deleteCookie = (name) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

export const getUserPermissions = () => {
  try {
    const userData = getCookie('userData');
    if (userData) {
      const parsed = JSON.parse(userData);
      return parsed.permissions || [];
    }
    return [];
  } catch (error) {
    // console.error('Error getting user permissions:', error);
    return [];
  }
};

export const getUserRole = () => {
  try {
    const userData = getCookie('userData');
    if (userData) {
      const parsed = JSON.parse(userData);
      return parsed.role || '';
    }
    return '';
  } catch (error) {
    // console.error('Error getting user role:', error);
    return '';
  }
};

export const hasPermission = (permissionName) => {
  const permissions = getUserPermissions();
  return permissions.includes(permissionName);
};

export const canDelete = (resourceType) => {
  const permissions = getUserPermissions();
  const role = getUserRole();
  
  // Fallback cho trang cá nhân
  if (!permissions || permissions.length === 0) {
    return true;
  }
  
  // Nhân viên không được xóa
  if (role === 'staff') {
    return false;
  }
  
  // Chỉ owner và admin được xóa
  if (role === 'owner' || role === 'admin') {
    return true;
  }
  
  switch (resourceType) {
    case 'green_bean':
      return hasPermission('delete_green_bean');
    case 'green_bean_batch':
      return hasPermission('delete_green_bean_batch');
    case 'cupping_session':
      return hasPermission('delete_cupping_session');
    case 'origin':
      return hasPermission('delete_origin');
    default:
      return false;
  }
};

export const canEdit = (resourceType) => {
  const permissions = getUserPermissions();
  const role = getUserRole();
  
  // Fallback cho trang cá nhân hoặc nhân viên trong tổ chức
  if (!permissions || permissions.length === 0 || role === 'staff' || role === 'owner' || role === 'admin') {
    return true;
  }
  
  switch (resourceType) {
    case 'green_bean':
      return hasPermission('edit_green_bean');
    case 'green_bean_batch':
      return hasPermission('edit_green_bean_batch');
    case 'cupping_session':
      return hasPermission('edit_cupping_session');
    case 'origin':
      return hasPermission('edit_origin');
    default:
      return false;
  }
};

export const canCreate = (resourceType) => {
  const permissions = getUserPermissions();
  const role = getUserRole();
  
  // Fallback cho trang cá nhân hoặc nhân viên trong tổ chức
  if (!permissions || permissions.length === 0 || role === 'staff' || role === 'owner' || role === 'admin') {
    return true;
  }
  
  switch (resourceType) {
    case 'green_bean':
      return hasPermission('create_green_bean');
    case 'green_bean_batch':
      return hasPermission('create_green_bean_batch');
    case 'cupping_session':
      return hasPermission('create_cupping_session');
    case 'origin':
      return hasPermission('create_origin');
    default:
      return false;
  }
};

export const canView = (resourceType) => {
  const permissions = getUserPermissions();
  const role = getUserRole();
  
  // Fallback cho trang cá nhân hoặc nhân viên trong tổ chức
  if (!permissions || permissions.length === 0 || role === 'staff' || role === 'owner' || role === 'admin') {
    return true;
  }
  
  switch (resourceType) {
    case 'green_bean':
      return hasPermission('view_green_bean');
    case 'green_bean_batch':
      return hasPermission('view_green_bean_batch');
    case 'cupping_session':
      return hasPermission('view_cupping_session');
    case 'origin':
      return hasPermission('view_origin');
    default:
      return false;
  }
};

// Function để refresh permissions khi chuyển đổi context
export const refreshUserPermissions = async (organizationId = 'personal') => {
  try {
    const userData = await ApiHelper.get(`/users/me?organizationId=${organizationId}`);
    
    // Cập nhật cookie
    const userDataToStore = {
      permissions: userData.permissions || [],
      role: userData.role || '',
      ...userData
    };
    setCookie('userData', JSON.stringify(userDataToStore));
    
    // Trigger custom event để các component re-render
    window.dispatchEvent(new CustomEvent('permissionsChanged', { detail: userData }));
        
    return userData;
  } catch (error) {
    // console.error('Error refreshing permissions:', error);
    // Nếu lỗi, clear permissions
    deleteCookie('userData');
  }
};

// Hook để lắng nghe thay đổi permissions
export const usePermissions = () => {
  const [permissions, setPermissions] = React.useState(getUserPermissions());
  const [role, setRole] = React.useState(getUserRole());
  
  React.useEffect(() => {
    const handlePermissionsChange = (event) => {
      const newPermissions = event.detail.permissions || [];
      const newRole = event.detail.role || '';
      
      setPermissions(newPermissions);
      setRole(newRole);
      
      // Cập nhật cookie
      try {
        const userData = {
          permissions: newPermissions,
          role: newRole,
          ...event.detail
        };
        setCookie('userData', JSON.stringify(userData));
      } catch (error) {
        // console.error('Error saving user data:', error);
      }
    };
    
    window.addEventListener('permissionsChanged', handlePermissionsChange);
    
    return () => {
      window.removeEventListener('permissionsChanged', handlePermissionsChange);
    };
  }, []);
  
  return { permissions, role };
};