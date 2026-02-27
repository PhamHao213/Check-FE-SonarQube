import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaUserPlus, FaUsers, FaEdit, FaTrash } from 'react-icons/fa';
import InviteMemberModal from '../InviteMemberModal/InviteMemberModal';
import RemoveMemberModal from '../RemoveMemberModal/RemoveMemberModal';
import UpdateRoleModal from '../UpdateRoleModal/UpdateRoleModal';
import './MembersList.css';
import { API_BASE_URL } from '../../api/config';

const MembersList = ({ organizationId, userRole, onMemberCountChange }) => {
  const { t } = useTranslation();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showUpdateRoleModal, setShowUpdateRoleModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);

  useEffect(() => {
    fetchMembers();
    fetchCurrentUser();
  }, [organizationId]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setCurrentUserEmail(userData.email_address);
      }
    } catch (error) {
      // console.error('Error fetching current user:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/organizations/${organizationId}/members`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const membersArray = Array.isArray(data) ? data : [];

        // Sắp xếp thành viên theo role từ lớn đến nhỏ
        const roleHierarchy = { 'owner': 4, 'admin': 3, 'staff': 2 };
        const sortedMembers = membersArray.sort((a, b) => {
          const aLevel = roleHierarchy[a.role_name] || 0;
          const bLevel = roleHierarchy[b.role_name] || 0;
          return bLevel - aLevel; // Sắp xếp giảm dần
        });

        setMembers(sortedMembers);
        if (onMemberCountChange) {
          onMemberCountChange(sortedMembers.length);
        }
      }
    } catch (error) {
      // console.error('Error fetching members:', error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSuccess = () => {
    setShowInviteModal(false);
    fetchMembers();
  };

  const handleRemoveClick = (member) => {
    setSelectedMember(member);
    setShowRemoveModal(true);
  };

  const handleUpdateRoleClick = (member) => {
    setSelectedMember(member);
    setShowUpdateRoleModal(true);
  };

  const handleRemoveSuccess = () => {
    setShowRemoveModal(false);
    setSelectedMember(null);
    fetchMembers();
  };

  const handleUpdateRoleSuccess = () => {
    setShowUpdateRoleModal(false);
    setSelectedMember(null);
    fetchMembers();
  };

  const canManageMember = (member) => {
    // Chỉ owner và admin mới có thể quản lý thành viên
    if (userRole !== 'owner' && userRole !== 'admin') return false;

    const roleHierarchy = { 'owner': 4, 'admin': 3, 'staff': 2 };
    const currentUserLevel = roleHierarchy[userRole] || 0;
    const memberLevel = roleHierarchy[member.role_name] || 0;

    return currentUserLevel > memberLevel;
  };

  const canRemoveMember = (member) => {
    // Chỉ owner mới có thể xóa thành viên
    // Nhưng không thể tự xóa bản thân
    return userRole === 'owner' && member.email_address !== currentUserEmail;
  };

  const getRoleName = (roleName) => {
    const roleNames = {
      'owner': t("auto.ch_s_hu_495"),
      'admin': t("organization.admin"),
      'staff': t("organization.member")
    };
    return roleNames[roleName] || roleName;
  };

  const canInviteMembers = userRole === 'owner' || userRole === 'admin';

  if (loading) {
    return <div className="members-loading">{t('auto.ang_ti_danh_sch_166')}</div>;
  }

  return (
    <div className="members-container">
      <div className="members-header">
        <div className="header-left">
          <FaUsers size={20} />
          <h3>
            {t('organization.membersOrg')} ({members.length})
          </h3>

        </div>
        {canInviteMembers && (
          <button
            className="invite-button"
            onClick={() => setShowInviteModal(true)}
          >
            <FaUserPlus size={16} />{t('auto.thm_thnh_vin_167')}</button>
        )}
      </div>

      <div className="members-list">
        {members.length === 0 ? (
          <div className="no-members">
            <FaUsers size={48} />
            <p>{t('auto.cha_c_thnh_vin__168')}</p>
            {canInviteMembers && (
              <button
                className="invite-first-member-button"
                onClick={() => setShowInviteModal(true)}
              >{t('auto.thm_thnh_vin_u__169')}</button>
            )}
          </div>
        ) : (
          <div className="members-table">
            <div className="table-header">
              <div className="header-cell">{t('auto.tn_171')}</div>
              <div className="header-cell">Email</div>
              <div className="header-cell">{t('auto.vai_tr_172')}</div>
              <div className="header-cell">{t('auto.thao_tc_173')}</div>
            </div>
            {members.map(member => (
              <div key={member.user_id} className="table-row">
                <div className="table-cell" data-label="Tên:">
                  {member.user_name || 'Chưa cập nhật'}
                </div>
                <div className="table-cell" data-label="Email:">
                  {member.email_address}
                </div>
                <div className="table-cell" data-label="Vai trò:">
                  <span className={`role-badge role-${member.role_name}`}>
                    {getRoleName(member.role_name)}
                  </span>
                </div>
                <div className="table-cell" data-label="Thao tác:">
                  <div className="member-action-buttons">
                    {canManageMember(member) && (
                      <button
                        className="member-action-btn member-edit-btn"
                        onClick={() => handleUpdateRoleClick(member)}
                        title="Cập nhật vai trò"
                      >
                        <FaEdit size={14} />
                      </button>
                    )}
                    {canRemoveMember(member) && (
                      <button
                        className="member-action-btn member-remove-btn"
                        onClick={() => handleRemoveClick(member)}
                        title="Xóa thành viên"
                      >
                        <FaTrash size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showInviteModal && (
        <InviteMemberModal
          organizationId={organizationId}
          currentUserRole={userRole}
          onClose={() => setShowInviteModal(false)}
          onSuccess={handleInviteSuccess}
        />
      )}

      {showRemoveModal && selectedMember && (
        <RemoveMemberModal
          member={selectedMember}
          organizationId={organizationId}
          onClose={() => {
            setShowRemoveModal(false);
            setSelectedMember(null);
          }}
          onSuccess={handleRemoveSuccess}
        />
      )}

      {showUpdateRoleModal && selectedMember && (
        <UpdateRoleModal
          member={selectedMember}
          organizationId={organizationId}
          currentUserRole={userRole}
          onClose={() => {
            setShowUpdateRoleModal(false);
            setSelectedMember(null);
          }}
          onSuccess={handleUpdateRoleSuccess}
        />
      )}
    </div>
  );
};

export default MembersList;