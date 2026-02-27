import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './EditOrganizationModal.css';
import { API_BASE_URL } from '../../api/config';

const EditOrganizationModal = ({ organization, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    org_name: organization.org_name || '',
    org_code: organization.org_code || '',
    org_email: organization.org_email || '',
    phone: organization.phone || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const orgId = organization.organization_id || organization.uuid;

      const response = await fetch(`${API_BASE_URL}/organizations/${orgId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',

        },
        body: JSON.stringify({
          org_name: formData.org_name,
          org_code: formData.org_code,
          org_email: formData.org_email,
          phone: formData.phone
        })
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.message || 'Có lỗi xảy ra khi cập nhật tổ chức');
      }
    } catch (error) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-org-modal-overlay" onClick={onClose}>
      <div className="edit-org-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="edit-org-modal-header">
          <h3>{t('auto.sa_thng_tin_t_c_118')}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="edit-org-form">
          <div className="form-group">
            <label htmlFor="org_name">{t('auto.tn_t_chc_119')}</label>
            <input
              type="text"
              id="org_name"
              name="org_name"
              value={formData.org_name}
              onChange={handleChange}
              placeholder={t('auto.nhp_tn_t_chc_124')}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="org_code">{t('auto.m_t_chc_120')}</label>
            <input
              type="text"
              id="org_code"
              name="org_code"
              value={formData.org_code}
              onChange={handleChange}
              placeholder={t('auto.nhp_m_t_chc_125')}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="org_email">{t('auto.email_t_chc_121')}</label>
            <input
              type="email"
              id="org_email"
              name="org_email"
              value={formData.org_email}
              onChange={handleChange}
              placeholder={t('auto.nhp_email_t_chc_126')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">{t('auto.s_in_thoi_122')}</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder={t('auto.nhp_s_in_thoi_127')}
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>{t('auto.hy_123')}</button>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? t('common.updating') : t('common.update')}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
};

export default EditOrganizationModal;