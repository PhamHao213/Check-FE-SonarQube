import ApiHelper from './apiHelper';

export const dataBackupApi = {
  exportData: async (filters) => {
    return await ApiHelper.post('/data-backup/export', filters, {
      responseType: 'blob'
    });
  }
};