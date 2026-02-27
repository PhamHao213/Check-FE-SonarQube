import { API_BASE_URL } from './config';

export const cuppingApi = {
  create: async (cuppingData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cupping`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cuppingData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  createOrUpdate: async (cuppingData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cupping`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cuppingData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  createGuest: async (cuppingData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cupping/guest`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cuppingData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  update: async (scoreCardId, cuppingData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cupping/${scoreCardId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cuppingData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  }
};