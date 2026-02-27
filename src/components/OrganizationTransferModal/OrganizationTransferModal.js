import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './OrganizationTransferModal.css';
import { FaTimes, FaExclamationTriangle, FaUsers, FaTrash, FaChevronDown } from 'react-icons/fa';
import { API_BASE_URL } from '../../api/config';

const OrganizationTransferModal = ({ 
  isOpen, 
  onClose, 
  ownedOrganizations, 
  onActionsConfirmed,
  deleteReason,
  deletePassword
}) => {
  const { t } = useTranslation();
  const [organizationActions, setOrganizationActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [orgMembers, setOrgMembers] = useState({}); // Lưu thành viên của từng org
  const [loadingMembers, setLoadingMembers] = useState({});
  const [transferTiming, setTransferTiming] = useState('after_deletion'); // 'immediate' hoặc 'after_deletion'

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  // Lấy danh sách thành viên của organization
  const fetchOrgMembers = async (orgId) => {
    if (orgMembers[orgId] || loadingMembers[orgId]) return;
    
    setLoadingMembers(prev => ({ ...prev, [orgId]: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/organizations/${orgId}/members`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const members = await response.json();
        // Lọc bỏ owner hiện tại khỏi danh sách
        const eligibleMembers = members.filter(member => member.role_name !== 'owner');
        setOrgMembers(prev => ({ ...prev, [orgId]: eligibleMembers }));
      }
    } catch (error) {
      // console.error('Error fetching members:', error);
    } finally {
      setLoadingMembers(prev => ({ ...prev, [orgId]: false }));
    }
  };

  const handleActionChange = (orgId, actionType, actionData = {}) => {
    setOrganizationActions(prev => {
      const filtered = prev.filter(action => action.organizationId !== orgId);
      return [...filtered, {
        organizationId: orgId,
        type: actionType,
        ...actionData
      }];
    });
    
    // Nếu chọn transfer thì lấy danh sách thành viên
    if (actionType === 'transfer') {
      fetchOrgMembers(orgId);
    }
  };

  const handleConfirmActions = async () => {
    // Kiểm tra tất cả organization đã có hành động
    if (organizationActions.length !== ownedOrganizations.length) {
      showNotification(t('organizationTransfer.pleaseSelectAction'), 'error');
      return;
    }

    // Kiểm tra transfer actions có selectedMember
    const transferActions = organizationActions.filter(action => action.type === 'transfer');
    const hasInvalidTransfer = transferActions.some(action => !action.selectedMember?.uuid);
    if (hasInvalidTransfer) {
      showNotification(t('organizationTransfer.pleaseSelectMember'), 'error');
      return;
    }

    // Kiểm tra delete actions có confirmation
    const deleteActions = organizationActions.filter(action => action.type === 'delete');
    const hasInvalidDelete = deleteActions.some(action => {
      const org = ownedOrganizations.find(o => o.uuid === action.organizationId);
      return action.confirmText !== org?.name;
    });
    if (hasInvalidDelete) {
      showNotification(t('organizationTransfer.pleaseConfirmName'), 'error');
      return;
    }

    setLoading(true);
    try {
      // Gửi yêu cầu xóa tài khoản với organizationActions
      const response = await fetch(`${API_BASE_URL}/users/delete-account`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: deleteReason,
          password: deletePassword,
          transferTiming: transferTiming,
          organizationActions: organizationActions.map(action => ({
            ...action,
            transferEmail: action.selectedMember?.email_address || action.transferEmail
          }))
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        const successMessage = transferTiming === 'immediate' 
          ? t('organizationTransfer.successImmediate')
          : t('organizationTransfer.successAfterDeletion');
        showNotification(successMessage, 'success');
        setTimeout(() => {
          onActionsConfirmed(data);
        }, 1500);
      } else {
        showNotification(data.error || t('organizationTransfer.error'), 'error');
      }
    } catch (error) {
      showNotification(t('organizationTransfer.requestError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="org-transfer-modal-overlay">
      <div className="org-transfer-modal">
        <div className="org-transfer-modal-header">
          <h2>
            <FaExclamationTriangle />
            {t('organizationTransfer.title')}
          </h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="org-transfer-modal-content">
          <div className="warning-section">
            <p className="warning-text">
              {t('organizationTransfer.warning', { count: ownedOrganizations.length })}
            </p>
          </div>

          <div className="organizations-actions">
            {ownedOrganizations.map(org => {
              const currentAction = organizationActions.find(action => action.organizationId === org.uuid);
              
              return (
                <div key={org.uuid} className="org-action-item">
                  <div className="org-info">
                    <h4>{org.name}</h4>
                    <p>{t('common.code')}: {org.code}</p>
                  </div>
                  
                  <div className="action-selection">
                    <label className="action-option">
                      <input
                        type="radio"
                        name={`action-${org.uuid}`}
                        value="transfer"
                        checked={currentAction?.type === 'transfer'}
                        onChange={() => handleActionChange(org.uuid, 'transfer')}
                      />
                      <FaUsers />
                      <span>{t('organizationTransfer.transfer')}</span>
                    </label>
                    
                    <label className="action-option">
                      <input
                        type="radio"
                        name={`action-${org.uuid}`}
                        value="delete"
                        checked={currentAction?.type === 'delete'}
                        onChange={() => handleActionChange(org.uuid, 'delete')}
                      />
                      <FaTrash />
                      <span>{t('organizationTransfer.dissolve')}</span>
                    </label>
                  </div>

                  {currentAction?.type === 'transfer' && (
                    <div className="transfer-form">
                      <h6> {t('organizationTransfer.selectRecipient')}</h6>
                      {loadingMembers[org.uuid] ? (
                        <div className="loading-members">
                          <div className="loading-spinner"></div>
                          {t('organizationTransfer.loadingMembers')}
                        </div>
                      ) : orgMembers[org.uuid]?.length > 0 ? (
                        <div className="member-selector">
                          <select
                            value={currentAction.selectedMember?.uuid || ''}
                            onChange={(e) => {
                              const selectedMember = orgMembers[org.uuid].find(m => m.uuid === e.target.value);
                              handleActionChange(org.uuid, 'transfer', { selectedMember });
                            }}
                          >
                            <option value="">{t('organizationTransfer.selectMemberPlaceholder')}</option>
                            {orgMembers[org.uuid].map(member => (
                              <option key={member.uuid} value={member.uuid}>
                                {member.user_name} ({member.email_address}) - {member.role_name}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="no-members">
                          <p>{t('organizationTransfer.noMembers')}</p>
                          <small>{t('organizationTransfer.noMembersNote')}</small>
                        </div>
                      )}
                      
                      {/* Tùy chọn thời điểm chuyển quyền chỉ hiện khi có transfer */}
                      {organizationActions.some(action => action.type === 'transfer') && (
                        <div className="transfer-timing-section">
                          <h6> {t('organizationTransfer.transferTiming')}</h6>
                          <div className="timing-options">
                            <label className={`timing-option ${transferTiming === 'immediate' ? 'selected' : ''}`}>
                              <input
                                type="radio"
                                name="transferTiming"
                                value="immediate"
                                checked={transferTiming === 'immediate'}
                                onChange={(e) => setTransferTiming(e.target.value)}
                              />
                              <div className="timing-content">
                                <span className="timing-title"> {t('organizationTransfer.transferImmediate')}</span>
                                <small>{t('organizationTransfer.transferImmediateDesc')}</small>
                              </div>
                            </label>
                            
                            <label className={`timing-option ${transferTiming === 'after_deletion' ? 'selected' : ''}`}>
                              <input
                                type="radio"
                                name="transferTiming"
                                value="after_deletion"
                                checked={transferTiming === 'after_deletion'}
                                onChange={(e) => setTransferTiming(e.target.value)}
                              />
                              <div className="timing-content">
                                <span className="timing-title"> {t('organizationTransfer.transferAfterDeletion')}</span>
                                <small>{t('organizationTransfer.transferAfterDeletionDesc')}</small>
                              </div>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {currentAction?.type === 'delete' && (
                    <div className="delete-form">
                      <input
                        type="text"
                        placeholder={t('organizationTransfer.confirmDeletePlaceholder', { name: org.name })}
                        value={currentAction.confirmText || ''}
                        onChange={(e) => handleActionChange(org.uuid, 'delete', { confirmText: e.target.value })}
                      />
                      <small className="danger-text"> {t('organizationTransfer.deleteWarning')}</small>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="modal-actions">
            <button
              className="confirm-btn"
              onClick={handleConfirmActions}
              disabled={loading || organizationActions.length !== ownedOrganizations.length}
            >
              {loading ? t('organizationTransfer.processing') : 
                transferTiming === 'immediate' 
                  ? t('organizationTransfer.confirmButtonImmediate')
                  : t('organizationTransfer.confirmButtonAfterDeletion')
              }
            </button>
            <button
              className="cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              {t('organizationTransfer.cancel')}
            </button>
          </div>
        </div>

        {notification.show && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationTransferModal;