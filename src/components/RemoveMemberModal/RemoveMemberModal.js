import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './RemoveMemberModal.css';
import { API_BASE_URL } from '../../api/config';

const RemoveMemberModal = ({ member, organizationId, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // const getRoleName = (roleName) => {
  //   const roleNames = {
  //     'owner': 'Chủ sở hữu',
  //     'admin': 'Quản trị viên',
  //     'staff': 'Nhân viên'
  //   };
  //   return roleNames[roleName] || roleName;
  // };
  const getRoleName = (roleName) => {
    return t(`organization.${roleName}`, roleName);
  };

  const handleRemove = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/organizations/${organizationId}/members/${member.user_id}`, {
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
        setError(data.error || 'Có lỗi xảy ra khi xóa thành viên');
      }
    } catch (error) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content remove-member-modal">
        <div className="modal-header">
          <h2>{t('auto.xc_nhn_xa_thnh__202')}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <p>{t('auto.bn_c_chc_chn_mu_203')}</p>

          <div className="member-info">
            <div className="info-row">
              <label>{t('auto.tn_204')}</label>
              <span>{member.user_name || 'Chưa cập nhật'}</span>
            </div>
            <div className="info-row">
              <label>{t('auto.email_205')}</label>
              <span>{member.email_address}</span>
            </div>
            <div className="info-row">
              <label>{t('auto.vai_tr_206')}</label>
              <span className={`role-badge role-${member.role_name}`}>
                {getRoleName(member.role_name)}
              </span>
            </div>
          </div>

          <div className="warning-note">
            <strong>{t('auto.lu__207')}</strong> {t('auto.cc_d_liu_thuc_q_208')}</div>

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
          >{t('auto.hy_209')}</button>
          <button
            type="button"
            className="remove-button"
            onClick={handleRemove}
            disabled={loading}
          >
            {loading ? t('common.deleting') : t('organization.removeMember')}
          </button>

        </div>
      </div>
    </div>
  );
};

export default RemoveMemberModal;