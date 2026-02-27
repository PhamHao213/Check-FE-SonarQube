import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { vendorApi } from '../../api/vendorApi';
import { policyApi } from '../../api/policyApi';
import { ArrowLeftIcon } from '../../components/Icons';
import { showToast } from '../../components/Toast/Toast';
import './AddVendorForm.css';

const AddVendorForm = ({ onBack, onSubmit, selectedContext }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone_number: '',
    contact_link: '',
    email: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[0-9+\-\s()]{10,15}$/;
    return phoneRegex.test(phone);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    // Validate required fields - chỉ tên là bắt buộc
    if (!formData.name.trim()) {
      newErrors.name = t('validation.required');
    }

    // Validate email if provided
    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = t('validation.emailInvalid');
    }

    // Validate phone if provided
    if (formData.phone_number && !validatePhone(formData.phone_number)) {
      newErrors.phone_number = t('validation.phoneInvalid');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);

      const policyResponse = await policyApi.getUserPolicy(selectedContext);
      const policyId = policyResponse.data.uuid;

      const payload = {
        ...formData,
        policy_id: policyId
      };

      const response = await vendorApi.create(payload);

      showToast(t('toast.createSuccessSupplier'), 'success');
      
      // Hiển thị mã nhà cung cấp đã được tạo
      if (response.data && response.data.vendor_code) {
        showToast(`${t('vendor.vendorCode')}: ${response.data.vendor_code}`, 'info');
      }
      
      onSubmit();
      onBack();
    } catch (error) {
      showToast(error.message || t('toast.error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vendor-add-container">
      <div className="vendor-add-wrapper">
        <button className="vendor-add-back-button" onClick={onBack}>
          <ArrowLeftIcon size={16} />{t('auto.quay_li_450')}</button>

        <div className="vendor-add-header">
          <h1 className="vendor-add-title">{t('auto.thm_nh_cung_cp__451')}</h1>
          <p className="vendor-add-subtitle">{t('vendor.onlyNameRequired')}</p>
        </div>

        <form className="vendor-add-form" onSubmit={handleSubmit}>
          <div className="vendor-form-row">
            <div className="vendor-form-group half-width">
              <label htmlFor="name">{t('auto.tn_nh_cung_cp_453')}<span className="vendor-required">*</span></label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={t('auto.v_d_nh_cung_cp__458')}
                required
              />
              {errors.name && <span className="vendor-error">{errors.name}</span>}
            </div>
          </div>

          <div className="vendor-form-row">
            <div className="vendor-form-group full-width">
              <label htmlFor="address">{t('auto.a_ch_454')}</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder={t('auto.v_d_58_ng_51_tp_459')}
              />
              {errors.address && <span className="vendor-error">{errors.address}</span>}
            </div>
          </div>

          <div className="vendor-form-row">
            <div className="vendor-form-group half-width">
              <label htmlFor="phone_number">{t('auto.s_in_thoi_455')}</label>
              <input
                type="tel"
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder={t('auto.v_d_0912345678_460')}
              />
              {errors.phone_number && <span className="vendor-error">{errors.phone_number}</span>}
            </div>
            <div className="vendor-form-group half-width">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t('auto.v_d_vendorexamp_461')}
              />
              {errors.email && <span className="vendor-error">{errors.email}</span>}
            </div>
          </div>

          <div className="vendor-form-row">
            <div className="vendor-form-group full-width">
              <label htmlFor="contact_link">{t('auto.a_ch_lin_h_456')}</label>
              <input
                type="url"
                id="contact_link"
                name="contact_link"
                value={formData.contact_link}
                onChange={handleChange}
                placeholder={t('auto.v_d_httpswebsit_462')}
              />
            </div>
          </div>

          <div className="vendor-form-actions">
            <button type="submit" className="vendor-submit-button" disabled={loading}>
              {loading ? t('vendor.creating') : t('vendor.createVendor')}
            </button>

            <button type="button" className="vendor-cancel-button" onClick={onBack}>{t('auto.hy_457')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVendorForm;