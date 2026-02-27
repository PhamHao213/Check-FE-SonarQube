import { API_BASE_URL } from './config';

// Helper function để lấy headers
const getAuthHeaders = () => {
  return {
    'Content-Type': 'application/json'
  };
};

export const policyApi = {
  // Lấy policy của user theo context
  getUserPolicy: async (selectedContext) => {
    let url;
    
    if (selectedContext?.type === 'organization' && selectedContext.uuid) {
      url = `${API_BASE_URL}/policies/organization/${selectedContext.uuid}`;
    } else {
      url = `${API_BASE_URL}/policies/personal`;
    }
    
    const response = await fetch(url, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user policy');
    }
    
    return response.json();
  }
};