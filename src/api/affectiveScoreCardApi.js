import { API_BASE_URL } from './config';

export const affectiveScoreCardApi = {
  async create(data) {
    const response = await fetch(`${API_BASE_URL}/affective-score-card`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create affective score card');
    }
    return result;
  },

  async createGuest(data) {
    const response = await fetch(`${API_BASE_URL}/affective-score-card/guest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create guest affective score card: ${response.status} ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const errorText = await response.text();
      throw new Error(`Server returned non-JSON response: ${errorText}`);
    }

    const result = await response.json();
    return result;
  },

  async getBySessionBatch(sessionId, batchId) {
    try {
      const response = await fetch(`${API_BASE_URL}/affective-score-card/session/${sessionId}/batch/${batchId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { success: true, data: [] };
        }
        console.warn(`API error ${response.status} for session ${sessionId}, batch ${batchId}`);
        return { success: true, data: [] };
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.warn('Network error when fetching affective score card:', error);
      return { success: true, data: [] };
    }
  },

  async update(id, data) {
    const response = await fetch(`${API_BASE_URL}/affective-score-card/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data)
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to update affective score card');
    }
    return result;
  }
};