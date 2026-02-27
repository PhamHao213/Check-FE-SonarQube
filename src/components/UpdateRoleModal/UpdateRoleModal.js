import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './UpdateRoleModal.css';
import { API_BASE_URL } from '../../api/config';

const UpdateRoleModal = ({ member, organizationId, currentUserRole, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [selectedRole, setSelectedRole] = useState(member.role_name);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRoles();
  }, []);

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
        const rolesArray = Array.isArray(data) ? data : [];
        const filteredRoles = filterRolesByPermission(rolesArray);
        setRoles(filteredRoles);
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


  const handleUpdate = async () => {
    if (selectedRole === member.role_name) {
      onClose();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const selectedRoleObj = roles.find(r => r.role_name === selectedRole);

      const response = await fetch(`${API_BASE_URL}/organizations/${organizationId}/members/${member.user_id}/role`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ roleId: selectedRoleObj.uuid })
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.error || 'Có lỗi xảy ra khi cập nhật vai trò');
      }
    } catch (error) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content update-role-modal">
        <div className="modal-header">
          <h2>{t('auto.cp_nht_vai_tr_t_261')}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="member-info">
            <div className="info-row">
              <label>{t('auto.tn_262')}</label>
              <span>{member.user_name || 'Chưa cập nhật'}</span>
            </div>
            <div className="info-row">
              <label>{t('auto.email_263')}</label>
              <span>{member.email_address}</span>
            </div>
            <div className="info-row">
              <label>{t('auto.vai_tr_hin_ti_264')}</label>
              <span className={`role-badge role-${member.role_name}`}>
                {getRoleName(member.role_name)}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="role">{t('auto.vai_tr_mi_265')}</label>
            <select
              id="role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              {roles.map(role => (
                <option key={role.uuid} value={role.role_name}>
                  {getRoleName(role.role_name)}
                </option>
              ))}
            </select>
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
          >{t('auto.hy_266')}</button>
          <button
            type="button"
            className="update-button"
            onClick={handleUpdate}
            disabled={loading || selectedRole === member.role_name}
          >
            {loading ? t('common.updating') : t('organization.updateRole')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateRoleModal;