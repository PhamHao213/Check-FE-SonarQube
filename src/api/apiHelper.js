import { API_BASE_URL } from './config';
import { checkTokenAndLogout, logout } from '../utils/auth';

class ApiHelper {
  static async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
      credentials: 'include', // Include cookies in request
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      let response = await fetch(url, config);
      
      // Nếu gặp lỗi 401, thử refresh token
      if (response.status === 401) {
        try {
          const refreshResponse = await fetch(`${API_BASE_URL}/users/refresh-token`, {
            method: 'POST',
            credentials: 'include'
          });
          
          if (refreshResponse.ok) {
            // Thử lại request ban đầu
            response = await fetch(url, config);
          } else {
            logout();
            throw new Error('Session expired');
          }
        } catch (refreshError) {
          logout();
          throw new Error('Session expired');
        }
      }
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      // Chỉ log lỗi nếu không phải lỗi HTTP thông thường để tránh spam console
      if (!error.message.includes('HTTP error') && !error.message.includes('Session expired')) {
        console.error(`API Error [${config.method || 'GET'}] ${endpoint}:`, error);
      }
      throw error;
    }
  }

  static async get(endpoint) {
    return this.request(endpoint);
  }

  static async post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  static async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  // Method for requests that don't require authentication
  static async requestWithoutAuth(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      credentials: 'include', // Include cookies for login/register requests
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Tạo error object với thông tin chi tiết nhưng không log ra console
        const error = new Error(data.message || `HTTP error! status: ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      // Không log lỗi ra console để tránh hiển thị lỗi 401 trên web
      // Chỉ log nếu không phải lỗi HTTP thông thường
      if (!error.status && !error.message.includes('HTTP error')) {
        console.error(`API Error [${config.method || 'GET'}] ${endpoint}:`, error);
      }
      throw error;
    }
  }
}

export default ApiHelper;