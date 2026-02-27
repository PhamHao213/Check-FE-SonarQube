import { API_BASE_URL } from './config';

export const greenBeanImportApi = {
  // Download template Excel
  downloadTemplate: async () => {
    const response = await fetch(`${API_BASE_URL}/excel-import/greenbean/template`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to download template');
    }
    
    return response.blob();
  },

  // Import Excel file
  importExcel: async (file, policyId, skipBatch = false) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('policy_id', policyId);
    if (skipBatch) {
      formData.append('skip_batch', 'true');
    }

    const response = await fetch(`${API_BASE_URL}/excel-import/greenbean/import`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Import failed');
    }

    return response.json();
  }
};