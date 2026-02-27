import { API_BASE_URL } from './config';

export const descriptiveScoreCardApi = {
  async create(data) {
    const response = await fetch(`${API_BASE_URL}/descriptive-score-card`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create descriptive score card');
    }
    return result;
  },

  async getBySessionBatch(sessionId, batchId) {
    try {
      const response = await fetch(`${API_BASE_URL}/descriptive-score-card/session/${sessionId}/batch/${batchId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        // Nếu là 404 (không tìm thấy), trả về kết quả rỗng
        if (response.status === 404) {
          return { success: true, data: [] };
        }
        // Nếu là lỗi khác, vẫn trả về kết quả rỗng để không block UI
        console.warn(`API error ${response.status} for session ${sessionId}, batch ${batchId}`);
        return { success: true, data: [] };
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.warn('Network error when fetching score card:', error);
      // Trả về kết quả rỗng để không block UI
      return { success: true, data: [] };
    }
  },

  async createGuest(data) {
    const response = await fetch(`${API_BASE_URL}/descriptive-score-card/guest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create guest descriptive score card');
    }
    return result;
  },

  async update(id, data) {
    const response = await fetch(`${API_BASE_URL}/descriptive-score-card/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data)
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to update descriptive score card');
    }
    return result;
  }
};