import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './InviteMemberModal.css';
import { API_BASE_URL } from '../../api/config';

const InviteMemberModal = ({ organizationId, onClose, onSuccess, currentUserRole }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    roleId: ''
  });
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  // Auto-hide error after 5 seconds
  useEffect(() => {
    if (showError) {
      const timer = setTimeout(() => {
        setShowError(false);
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showError]);

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const fetchRoles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/roles`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Đảm bảo data là array
        const rolesArray = Array.isArray(data) ? data : [];
        // Lọc role dựa trên quyền của user hiện tại
        const filteredRoles = filterRolesByPermission(rolesArray);
        setRoles(filteredRoles);
        if (filteredRoles.length > 0) {
          setFormData(prev => ({ ...prev, roleId: filteredRoles[0].uuid }));
        }
      }
    } catch (error) {
      // console.error('Error fetching roles:', error);
      setRoles([]);
    }
  };

  const filterRolesByPermission = (allRoles) => {
    if (!Array.isArray(allRoles)) return [];

    const roleHierarchy = {
      'owner': ['admin', 'staff'],
      'admin': ['staff'],
      'staff': []
    };

    const allowedRoles = roleHierarchy[currentUserRole] || [];
    return allRoles.filter(role => allowedRoles.includes(role.role_name));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (showError) {
      setShowError(false);
      setError('');
    }
  };

  const handleExistingUserInvite = async () => {
    const response = await fetch(`${API_BASE_URL}/organizations/${organizationId}/members`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await response.json();
    if (response.ok) {
      onSuccess('Đã gửi lời mời thành công!');
    } else {
      setError(data.error || 'Có lỗi xảy ra khi mời thành viên');
    }
  };

  const handleRateLimitError = (inviteData) => {
    if (inviteData.waitSeconds) {
      setCountdown(inviteData.waitSeconds);
      setError('Vui lòng chờ 10 phút trước khi gửi lại email');
    } else if (inviteData.remainingMinutes) {
      setCountdown(inviteData.remainingMinutes * 60);
      setError(`Email này đã bị tạm khóa do gửi quá nhiều lần. Vui lòng thử lại sau ${inviteData.remainingMinutes} phút`);
    } else {
      setError(inviteData.error || 'Đã vượt quá giới hạn gửi email');
    }
    setShowError(true);
  };

  const handleNewUserInvite = async () => {
    const inviteResponse = await fetch(`${API_BASE_URL}/organizations/${organizationId}/invite-register`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.email,
        roleId: formData.roleId,
        organizationId: organizationId
      })
    });

    const inviteData = await inviteResponse.json();

    if (inviteResponse.ok) {
      if (inviteData.remainingAttempts !== undefined) {
        setRemainingAttempts(inviteData.remainingAttempts);
      }
      onSuccess(`Đã gửi email mời đăng ký thành công! ${inviteData.remainingAttempts !== undefined ? `(Còn ${inviteData.remainingAttempts} lần gửi)` : ''}`);
    } else {
      if (inviteResponse.status === 429) {
        handleRateLimitError(inviteData);
      } else {
        setError(inviteData.error || 'Có lỗi xảy ra khi gửi email mời đăng ký');
        setShowError(true);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const checkEmailResponse = await fetch(`${API_BASE_URL}/users/check-email`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });

      const emailCheckData = await checkEmailResponse.json();

      if (emailCheckData.exists) {
        await handleExistingUserInvite();
      } else {
        await handleNewUserInvite();
      }
    } catch (error) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const getRoleName = (roleName) => {
    const roleNames = {
      'owner': t("auto.ch_s_hu_495"),
      'admin': t("organization.admin"),
      'staff': t("organization.member")
    };
    return roleNames[roleName] || roleName;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content invite-member-modal">
        <div className="modal-header">
          <h2>{t('auto.thm_thnh_vin_161')}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="invite-form">
          <div className="form-group">
            <label htmlFor="email">{t('auto.email_thnh_vin__162')}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder={t('auto.nhp_email_thnh__165')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="roleId">{t('auto.vai_tr__163')}</label>
            <select
              id="roleId"
              name="roleId"
              value={formData.roleId}
              onChange={handleInputChange}
              required
            >
              {roles.map(role => (
                <option key={role.uuid} value={role.uuid}>
                  {getRoleName(role.role_name)}
                </option>
              ))}
            </select>
          </div>

          {showError && error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
            >{t('auto.hy_164')}</button>
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? t("organization.inviting") : t("organization.sendInvite")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteMemberModal;