import { API_BASE_URL } from './config';

export const inventoryApi = {
  // Nhập kho
  createImportTicket: async (data) => {
    const response = await fetch(`${API_BASE_URL}/inventory-tickets`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create import ticket');
    return response.json();
  },

  getAllImportTickets: async (policyId, organizationId) => {
    let url = `${API_BASE_URL}/inventory-tickets`;
    const params = [];
    if (organizationId) {
      params.push(`organization_id=${organizationId}`);
    } else if (policyId) {
      params.push(`policy_id=${policyId}`);
    }
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    const response = await fetch(url, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch import tickets');
    return response.json();
  },

  getImportTicketById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/inventory-tickets/${id}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch import ticket');
    return response.json();
  },

  updateImportTicket: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/inventory-tickets/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update import ticket');
    return response.json();
  },

  deleteImportTicket: async (id) => {
    const response = await fetch(`${API_BASE_URL}/inventory-tickets/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to delete import ticket');
    return response.json();
  },

  // Xuất kho
  createExportTicket: async (data) => {
    const response = await fetch(`${API_BASE_URL}/export-inventory`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create export ticket');
    return response.json();
  },

  getAllExportTickets: async (policyId) => {
    const response = await fetch(`${API_BASE_URL}/export-inventory?policy_id=${policyId}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch export tickets');
    return response.json();
  },

  getExportTicketById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/export-inventory/${id}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch export ticket');
    return response.json();
  },

  updateExportTicket: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/export-inventory/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update export ticket');
    return response.json();
  },

  deleteExportTicket: async (id) => {
    const response = await fetch(`${API_BASE_URL}/export-inventory/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to delete export ticket');
    return response.json();
  },

  // Hủy phiếu
  cancelTicket: async (id) => {
    const response = await fetch(`${API_BASE_URL}/inventory-tickets/cancel/${id}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Cancel ticket error:', errorData);
      throw new Error(errorData.message || 'Failed to cancel ticket');
    }
    return response.json();
  },

  // Tạo phiếu nhập kho không cập nhật weight (dùng khi tạo batch mới)
  createTicketWithoutWeight: async (data) => {
    const response = await fetch(`${API_BASE_URL}/inventory-tickets/without-weight`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create import ticket without weight');
    }
    return response.json();
  },
};
