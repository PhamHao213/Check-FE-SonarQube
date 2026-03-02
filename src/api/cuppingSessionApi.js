import { API_BASE_URL } from './config';

export const greenBeanBatchApi = {
  getAll: async () => {
    try {
      const policyId = await getPolicyId();

      if (!policyId) {
        console.warn('No policy_id found, returning empty batches');
        return { data: [] };
      }

      const response = await fetch(`${API_BASE_URL}/greenbeanbatch?policy_id=${policyId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching green bean batches:', error);
      throw error;
    }
  }
};

export const greenbeanInfoApi = {
  getAll: async () => {
    try {
      const policyId = await getPolicyId();

      if (!policyId) {
        console.warn('No policy_id found, returning empty greenbean info');
        return { data: [] };
      }

      const response = await fetch(`${API_BASE_URL}/greenbean-info?policy_id=${policyId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching greenbean info:', error);
      throw error;
    }
  },

  getByBatchId: async (batchId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/greenbean-info/batch/${batchId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching greenbean info by batch id:', error);
      throw error;
    }
  }
};

// Helper function để lấy headers (hỗ trợ guest mode)
const getAuthHeaders = (requireAuth = true) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  return headers;
};

// Helper function để lấy policy_id từ selectedContext
const getPolicyId = async (selectedContext = null) => {
  try {
    const context = selectedContext || { type: 'personal' };
    const contextType = context?.type || 'personal';

    if (contextType === 'personal') {
      const policyResponse = await fetch(`${API_BASE_URL}/policies/personal`, {
        credentials: 'include'
      });
      if (policyResponse.ok) {
        const policyData = await policyResponse.json();
        return policyData.data?.uuid;
      }
    } else if (contextType === 'organization') {
      const policyResponse = await fetch(`${API_BASE_URL}/policies/organization/${context.uuid}`, {
        credentials: 'include'
      });
      if (policyResponse.ok) {
        const policyData = await policyResponse.json();
        return policyData.data?.uuid;
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting policy_id:', error);
    return null;
  }
};

export const cuppingSessionApi = {
  // Tạo session mới
  create: async (sessionData, selectedContext = null) => {
    try {
      const policyId = await getPolicyId(selectedContext);

      if (!policyId) {
        throw new Error('Không thể xác định workspace');
      }

      const requestData = {
        ...sessionData,
        policy_id: policyId
      };

      const response = await fetch(`${API_BASE_URL}/cupping-sessions`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating cupping session:', error);
      throw error;
    }
  },

  // Lấy tất cả sessions
  getAll: async (selectedContext = null, filters = {}) => {
    try {
      const policyId = await getPolicyId(selectedContext);

      if (!policyId) {
        console.warn('No policy_id found, returning empty sessions');
        return { data: [] };
      }

      let url = `${API_BASE_URL}/cupping-sessions?policy_id=${policyId}`;

      // Add variety filter if provided
      if (filters.variety) {
        url += `&variety=${encodeURIComponent(filters.variety)}`;
      }

      // Add country filter if provided
      if (filters.country) {
        url += `&country=${encodeURIComponent(filters.country)}`;
      }


      const response = await fetch(url, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching cupping sessions:', error);
      throw error;
    }
  },

  // Lấy session theo ID (yêu cầu auth)
  getById: async (uuid) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cupping-sessions/${uuid}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching cupping session:', error);
      throw error;
    }
  },

  // Lấy thông tin session (không cần auth)
  getSessionInfo: async (uuid) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cupping-sessions/${uuid}/info`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching session info:', error);
      throw error;
    }
  },

  // Lấy quyền của user đối với session
  getSessionPermissions: async (sessionId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cupping-sessions/${sessionId}/permissions`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching session permissions:', error);
      throw error;
    }
  },

  // Cập nhật trạng thái session
  updateStatus: async (uuid, statusData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cupping-sessions/${uuid}/status`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(statusData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating session status:', error);
      throw error;
    }
  },

  // Bắt đầu session
  startSession: async (uuid) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cupping-sessions/${uuid}/start`, {
        method: 'PUT',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    }
  },

  // Kết thúc session
  finishSession: async (uuid, isFinished) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cupping-sessions/${uuid}/status`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_finished: isFinished }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error finishing session:', error);
      throw error;
    }
  },

  // Lấy danh sách batch của session (yêu cầu auth)
  getSessionBatches: async (uuid) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cupping-sessions/${uuid}/batches`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching session batches:', error);
      throw error;
    }
  },

  // Lấy danh sách batch của session cho guest
  getSessionBatchesGuest: async (uuid) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cupping-sessions/${uuid}/batches/guest`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching session batches for guest:', error);
      throw error;
    }
  },

  // Cập nhật danh sách batch của session
  updateSessionBatches: async (uuid, batches) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cupping-sessions/${uuid}/batches`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ batches }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating session batches:', error);
      throw error;
    }
  },

  // Cập nhật session
  update: async (uuid, sessionData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cupping-sessions/${uuid}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating cupping session:', error);
      throw error;
    }
  },

  // Xóa session
  delete: async (uuid) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cupping-sessions/${uuid}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting cupping session:', error);
      throw error;
    }
  },

  // Tìm kiếm sessions theo tên nhân xanh
  searchByGreenbeanName: async (searchTerm, selectedContext = null) => {
    try {
      const policyId = await getPolicyId(selectedContext);

      // Đảm bảo luôn có policy_id để lọc kết quả
      if (!policyId) {
        console.warn('No policy_id found for search, returning empty results');
        return { data: [] };
      }

      const response = await fetch(`${API_BASE_URL}/cupping-sessions/search?greenbean_name=${encodeURIComponent(searchTerm)}&policy_id=${policyId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching sessions by greenbean name:', error);
      throw error;
    }
  },

  // Lấy dữ liệu chia sẻ session (không cần auth)
  getSharedSessionData: async (sessionBatchId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cupping-sessions/shared/${sessionBatchId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching shared session data:', error);
      throw error;
    }
  }
};