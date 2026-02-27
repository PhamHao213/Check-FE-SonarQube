import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { vendorApi } from '../../api/vendorApi';
import { showToast } from '../../components/Toast/Toast';
import './AddVendorForm.css';
import './EditVendorForm.css';

const EditVendorForm = ({ vendor, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    vendor_code: '',
    name: '',
    address: '',
    phone_number: '',
    contact_link: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (vendor) {
      setFormData({
        vendor_code: vendor.vendor_code || '',
        name: vendor.name || '',
        address: vendor.address || '',
        phone_number: vendor.phone_number || '',
        contact_link: vendor.contact_link || '',
        email: vendor.email || ''
      });
    }
  }, [vendor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await vendorApi.update(vendor.uuid, formData);
      showToast(t('toast.updateVendorSuccess'), 'success');
      onSuccess();
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi cập nhật nhà cung cấp';
      if (errorMsg.includes('vendor_code') || errorMsg.includes('Duplicate')) {
        showToast(t('greenBatch.codeExists'), 'error');
      } else {
        showToast(errorMsg, 'error');
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-vendor-modal-overlay">
      <div className="edit-vendor-modal-content">
        <div className="edit-vendor-modal-header">
          <h2 className="edit-vendor-modal-title">{t('auto.chnh_sa_nh_cung_463')}</h2>
          <button onClick={onClose} className="edit-vendor-modal-close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="vendor-add-form">
          {error && <div className="edit-vendor-error">{error}</div>}

          <div className="vendor-form-group">
            <label>{t('auto.m_nh_cung_cp_464')}</label>
            <input
              type="text"
              name="vendor_code"
              value={formData.vendor_code}
              onChange={handleChange}
              placeholder={t('auto.nhp_m_nh_cung_c_470')}
            />
          </div>

          <div className="vendor-form-group">
            <label>{t('auto.tn_nh_cung_cp_465')}<span className="vendor-required">*</span></label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={t('auto.nhp_tn_nh_cung__471')}
              required
            />
          </div>

          <div className="vendor-form-group">
            <label>{t('auto.a_ch_466')}<span className="vendor-required"></span></label>
            <input
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder={t('auto.nhp_a_ch_472')}
            />
          </div>

          <div className="vendor-form-group">
            <label>{t('auto.s_in_thoi_467')}<span className="vendor-required"></span></label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder={t('auto.nhp_s_in_thoi_473')}
            />
          </div>

          <div className="vendor-form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t('auto.nhp_email_474')}
            />
          </div>

          <div className="vendor-form-group">
            <label>{t('auto.lin_kt_lin_h_468')}</label>
            <input
              type="url"
              name="contact_link"
              value={formData.contact_link}
              onChange={handleChange}
              placeholder={t('auto.nhp_lin_kt_lin__475')}
            />
          </div>

          <div className="vendor-form-actions">
            <button type="submit" className="vendor-submit-button" disabled={loading}>
              {loading ? t('vendor.creating') : t('vendor.saveInfo')}
            </button>
            <button type="button" onClick={onClose} className="vendor-cancel-button">{t('auto.hy_469')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditVendorForm;