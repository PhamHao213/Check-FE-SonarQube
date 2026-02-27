import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { organizationApi } from '../../api/organizationApi';
import { FaTimes } from 'react-icons/fa';
import { showToast } from '../../components/Toast/Toast';
import './CreateOrganizationModal.css';

const CreateOrganizationModal = ({ onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    org_name: '',
    org_code: '',
    org_email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Get user email from API instead of localStorage
    const fetchUserEmail = async () => {
      try {
        const response = await fetch('/api/users/me', {
          credentials: 'include'
        });
        if (response.ok) {
          const user = await response.json();
          if (user && user.email_address) {
            setFormData(prev => ({
              ...prev,
              org_email: user.email_address
            }));
          }
        }
      } catch (error) {
        // console.error('Error fetching user email:', error);
      }
    };

    fetchUserEmail();
  }, []);

  const generateOrgCode = (orgName) => {
    return orgName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 6);
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate org_name
    if (!formData.org_name.trim()) {
      newErrors.org_name = 'Tên tổ chức là bắt buộc';
    } else if (formData.org_name.trim().length < 3) {
      newErrors.org_name = 'Tên tổ chức phải có ít nhất 3 ký tự';
    } else if (formData.org_name.trim().length > 100) {
      newErrors.org_name = 'Tên tổ chức không được quá 100 ký tự';
    }

    // Validate org_email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.org_email.trim()) {
      newErrors.org_email = 'Email là bắt buộc';
    } else if (!emailRegex.test(formData.org_email)) {
      newErrors.org_email = 'Email không hợp lệ';
    }

    // Validate phone (optional but if provided must be valid)
    if (formData.phone.trim()) {
      const phoneRegex = /^[0-9+\-\s()]{10,15}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        newErrors.phone = 'Số điện thoại không hợp lệ';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedData = {
      ...formData,
      [name]: value
    };

    if (name === 'org_name') {
      updatedData.org_code = generateOrgCode(value);
    }

    setFormData(updatedData);

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await organizationApi.createOrganization(formData);
      showToast(t('toast.create_org_success'), 'success');
      onSuccess();
      onClose();
    } catch (error) {
      // console.error('Error creating organization:', error);
      showToast(
        t('greenBatch.createOrganization', {
          message: error?.message || t('greenBatch.retry')
        }),
        'error'
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-org-modal-overlay">
      <div className="modal-content create-org-modal">
        <div className="modal-header">
          <h2>{t('auto.to_t_chc_mi_386')}</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-org-form">
          <div className="form-group">
            <label>{t('auto.tn_t_chc__387')}</label>
            <input
              type="text"
              name="org_name"
              value={formData.org_name}
              onChange={handleChange}
              required
              placeholder={t('auto.nhp_tn_t_chc_392')}
              className={errors.org_name ? 'error' : ''}
            />
            {errors.org_name && <span className="error-message">{errors.org_name}</span>}
          </div>

          <div className="form-group">
            <label>{t('auto.m_t_chc__388')}</label>
            <input
              type="text"
              name="org_code"
              value={formData.org_code}
              readOnly
              placeholder={t('auto.t_ng_to_t_tn_t__393')}
            />
          </div>

          <div className="form-group">
            <label>{t('auto.email__389')}</label>
            <input
              type="email"
              name="org_email"
              value={formData.org_email}
              onChange={handleChange}
              required
              placeholder={t('auto.nhp_email_t_chc_394')}
              className={errors.org_email ? 'error' : ''}
            />
            {errors.org_email && <span className="error-message">{errors.org_email}</span>}
          </div>

          <div className="form-group">
            <label>{t('auto.s_in_thoi_390')}</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder={t('auto.nhp_s_in_thoi_395')}
              className={errors.phone ? 'error' : ''}
            />
            {errors.phone && <span className="error-message">{errors.phone}</span>}
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-button">{t('auto.hy_391')}</button>
            <button type="submit" disabled={loading} className="submit-button">
              {loading ? t('organization.creating') : t('organization.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrganizationModal;