import { API_BASE_URL } from './config';

export const getGreenbeanSessions = async (greenbeanId) => {
  const response = await fetch(`${API_BASE_URL}/greenbean-sessions/${greenbeanId}`, {
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch greenbean sessions');
  }
  
  return response.json();
};
