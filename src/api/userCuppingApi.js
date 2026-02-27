import { API_BASE_URL } from './config';

export const userCuppingApi = {
  // Lấy lịch sử cupping của user
  async getHistory() {
    const response = await fetch(`${API_BASE_URL}/user-cupping/history`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Lỗi khi lấy lịch sử cupping');
    }
    
    return response.json();
  },

  // Lấy chi tiết một phiếu cupping
  async getDetail(scoreCardId) {
    const response = await fetch(`${API_BASE_URL}/user-cupping/detail/${scoreCardId}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Lỗi khi lấy chi tiết phiếu cupping');
    }
    
    return response.json();
  },

  // Lấy thống kê cupping của user
  async getStats() {
    const response = await fetch(`${API_BASE_URL}/user-cupping/stats`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Lỗi khi lấy thống kê cupping');
    }
    
    return response.json();
  }
};