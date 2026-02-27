import { API_BASE_URL } from './config';
import { logout } from '../utils/auth';

export const organizationApi = {
  async getAllOrganizations() {
    const response = await fetch(`${API_BASE_URL}/organizations`, {
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 401) {
        logout();
        throw new Error('Phiên đăng nhập đã hết hạn');
      }
      throw new Error('Failed to fetch organizations');
    }

    return response.json();
  },

  async createOrganization(data) {

    const response = await fetch(`${API_BASE_URL}/organizations`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });



    const result = await response.json();


    if (!response.ok) {
      if (response.status === 401) {
        logout();
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      throw new Error(result.error || result.message || 'Failed to create organization');
    }

    return result;
  },

  async getOrganizationById(uuid) {
    const response = await fetch(`${API_BASE_URL}/organizations/${uuid}`, {
      credentials: 'include'
    });
    return response.json();
  },

  async getUserOrganizations() {
    const response = await fetch(`${API_BASE_URL}/organizations/user/organizations`, {
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 401) {
        logout();
        throw new Error('Phiên đăng nhập đã hết hạn');
      }
      throw new Error('Failed to fetch user organizations');
    }

    return response.json();
  }
};