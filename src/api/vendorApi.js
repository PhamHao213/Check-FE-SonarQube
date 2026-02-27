import ApiHelper from './apiHelper';

export const vendorApi = {
  getAll: (policyId) => {
    return ApiHelper.get(`/vendors/?policy_id=${policyId}`);
  },

  getById: (uuid) => {
    return ApiHelper.get(`/vendors/${uuid}`);
  },

  getBatches: (uuid) => {
    return ApiHelper.get(`/vendors/${uuid}/batches`);
  },

  create: (data) => {
    return ApiHelper.post('/vendors', data);
  },

  update: (uuid, data) => {
    return ApiHelper.put(`/vendors/${uuid}`, data);
  },

  delete: (uuid) => {
    return ApiHelper.delete(`/vendors/${uuid}`);
  },

  checkVendorCode: (vendorCode, policyId) => {
    return ApiHelper.get(`/vendors/check-code?vendor_code=${vendorCode}&policy_id=${policyId}`);
  }
};