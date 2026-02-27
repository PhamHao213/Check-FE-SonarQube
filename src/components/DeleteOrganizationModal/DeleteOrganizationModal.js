import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './DeleteOrganizationModal.css';
import { API_BASE_URL } from '../../api/config';

const DeleteOrganizationModal = ({ organization, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (confirmText !== organization.org_name) {
      setError('Tên tổ chức không khớp');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/organizations/${organization.organization_id || organization.uuid}/dissolve`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.error || 'Có lỗi xảy ra khi xóa tổ chức');
      }
    } catch (error) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content delete-org-modal">
        <div className="modal-header">
          <h2>{t('auto.xc_nhn_xa_t_chc_106')}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="warning-section">
            <div className="warning-icon">{t('auto._107')}</div>
            <div className="warning-text">
              <h3>{t('auto.cnh_bo_hnh_ng_n_108')}</h3>
              <p>{t('auto.vic_xa_t_chc_s_109')}</p>
              <ul>
                <li>{t('auto.xa_vnh_vin_tt_c_110')}</li>
                <li>{t('auto.xa_tt_c_phin_cu_111')}</li>
                <li>{t('auto.xa_tt_c_thnh_vi_112')}</li>
                <li>{t('auto.khng_th_khi_phc_113')}</li>
              </ul>
            </div>
          </div>

          <div className="org-info">
            <p><strong>{t('organization.infoTitle')}</strong></p>

            <div className="org-details">
              <div>{t('organization.name')}: {organization.org_name}</div>
              <div>{t('organization.code')}: {organization.org_code}</div>
              <div>{t('organization.email')}: {organization.org_email}</div>
            </div>
          </div>


          <div className="confirm-section">
            <p>{t('auto._xc_nhn_vui_lng_115')}<strong>{organization.org_name}</strong></p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={t('auto.nhp_tn_t_chc_117')}
              className="confirm-input"
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="cancel-button"
            onClick={onClose}
          >{t('auto.hy_116')}</button>
          <button
            type="button"
            className="delete-button"
            onClick={handleDelete}
            disabled={loading || confirmText !== organization.org_name}
          >
            {loading ? t('organization.deleting') : t('organization.delete')}
          </button>

        </div>
      </div>
    </div>
  );
};

export default DeleteOrganizationModal;