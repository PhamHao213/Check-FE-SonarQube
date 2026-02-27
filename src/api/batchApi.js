import { API_BASE_URL } from './config';

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
    // console.error('Error getting policy_id:', error);
    return null;
  }
};

export const batchApi = {
  // Lấy tất cả batches theo policy_id
  getAllBatches: async (selectedContext = null) => {
    const policyId = await getPolicyId(selectedContext);
    
    if (!policyId) {
      console.warn('No policy_id found, returning empty batches');
      return { data: [] };
    }
    
    const response = await fetch(`${API_BASE_URL}/greenbeanbatch?policy_id=${policyId}`, {
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error('Failed to fetch batches');
    }
    return response.json();
  },

  // Tạo batch mới
  createBatch: async (batchData, selectedContext = null) => {
    const policyId = await getPolicyId(selectedContext);
    
    if (!policyId) {
      throw new Error('Không thể xác định workspace');
    }
    
    const requestData = {
      ...batchData,
      policy_id: policyId
    };
    
    const response = await fetch(`${API_BASE_URL}/greenbeanbatch`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData),
    });
    if (!response.ok) {
      throw new Error('Failed to create batch');
    }
    return response.json();
  },

  // Cập nhật batch
  updateBatch: async (uuid, batchData) => {
    
    const response = await fetch(`${API_BASE_URL}/greenbeanbatch/${uuid}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(batchData),
    });
    if (!response.ok) {
      throw new Error('Failed to update batch');
    }
    return response.json();
  },

  // Xóa batch (và session liên quan nếu có)
  deleteBatch: async (uuid, deleteRelatedSessions = false) => {
    const url = deleteRelatedSessions 
      ? `${API_BASE_URL}/greenbeanbatch/${uuid}?delete_sessions=true`
      : `${API_BASE_URL}/greenbeanbatch/${uuid}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete batch');
    }
    return response.json();
  },

  // Lấy green beans theo batch ID
  getGreenBeansByBatchId: async (batchId) => {
    const response = await fetch(`${API_BASE_URL}/greenbeans/batch/${batchId}`, {
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error('Failed to fetch green beans');
    }
    return response.json();
  },

  // Lấy batch theo ID
  getBatchById: async (batchId) => {
    const response = await fetch(`${API_BASE_URL}/greenbeanbatch/${batchId}`, {
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error('Failed to fetch batch');
    }
    return response.json();
  },

  // Kiểm tra batch có liên quan đến session nào không
  checkBatchSessions: async (batchId, selectedContext = null) => {
    try {
      // Thử gọi API chuyên dụng nếu có
      const response = await fetch(`${API_BASE_URL}/greenbeanbatch/${batchId}/sessions`, {
        credentials: 'include'
      });
      if (response.ok) {
        return response.json();
      }
    } catch (error) {
      
    }
    
    // Nếu API chưa có, kiểm tra thủ công bằng cách lấy tất cả sessions
    try {
      const policyId = await getPolicyId(selectedContext);
      if (!policyId) {
        return { data: [] };
      }
      
      const sessionsResponse = await fetch(`${API_BASE_URL}/cupping-sessions?policy_id=${policyId}`, {
        credentials: 'include'
      });
      
      if (!sessionsResponse.ok) {
        return { data: [] };
      }
      
      const sessionsData = await sessionsResponse.json();
      const allSessions = sessionsData.data || [];
      
      // Lọc các session có chứa batch này
      const relatedSessions = [];
      for (const session of allSessions) {
        try {
          const batchesResponse = await fetch(`${API_BASE_URL}/cupping-sessions/${session.uuid}/batches`, {
            credentials: 'include'
          });
          
          if (batchesResponse.ok) {
            const batchesData = await batchesResponse.json();
            const batches = batchesData.data || [];
            
            // Kiểm tra xem batch có trong session không
            const hasBatch = batches.some(b => 
              (b.uuid && b.uuid === batchId) || 
              (b.gb_batch_id && b.gb_batch_id === batchId) ||
              (b.batch_id && b.batch_id === batchId)
            );
            
            if (hasBatch) {
              relatedSessions.push(session);
            }
          }
        } catch (err) {
          // console.error('Error checking session batches:', err);
        }
      }
      
      return { data: relatedSessions };
    } catch (error) {
      // console.error('Error checking batch sessions manually:', error);
      return { data: [] };
    }
  }
};