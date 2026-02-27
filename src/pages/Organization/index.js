import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../../api/config';
import './Organization.css';
import { organizationApi } from '../../api/organizationApi';
import { FaPlus, FaBuilding, FaArrowLeft, FaTrash, FaSignOutAlt, FaEdit } from 'react-icons/fa';
import CreateOrganizationModal from './CreateOrganizationModal';
import MembersList from '../../components/ListMember/MembersList';
import DeleteOrganizationModal from '../../components/DeleteOrganizationModal/DeleteOrganizationModal';
import EditOrganizationModal from '../../components/EditOrganizationModal/EditOrganizationModal';
import { showToast } from '../../components/Toast/Toast';

const Organization = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { org_id, detail_org_id } = useParams();
  const location = useLocation();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [memberCount, setMemberCount] = useState(0);
  const [ownerInfo, setOwnerInfo] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      // Kiểm tra nếu URL có org ID ở cuối (trang chi tiết)
      const isDetailPage = location.pathname.match(/\/organization\/([^/]+)$/);
      const orgIdFromUrl = isDetailPage ? isDetailPage[1] : null;

      if (orgIdFromUrl) {

        await restoreOrgDetailFromUrl(orgIdFromUrl);
      } else {

        await fetchOrganizations();
      }
    };

    initializeData();
  }, []);

  const restoreOrgDetailFromUrl = async (orgId) => {
    try {
      setLoading(true);

      // Fetch danh sách organizations trước
      await fetchOrganizations();

      // Fetch trực tiếp thông tin tổ chức từ API
      const response = await fetch(`${API_BASE_URL}/organizations/${orgId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const orgData = await response.json();

        // Lấy role của user trong tổ chức này
        const roleResponse = await fetch(`${API_BASE_URL}/organizations/${orgId}/user-role`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        let userRoleInOrg = 'staff';
        if (roleResponse.ok) {
          const roleData = await roleResponse.json();
          userRoleInOrg = roleData.role_name || 'staff';
        }

        // Set state cho trang chi tiết
        const orgWithRole = { ...orgData, role_name: userRoleInOrg };
        setSelectedOrg(orgWithRole);
        setUserRole(userRoleInOrg);

        await fetchMemberCount(orgId);
        await fetchOwnerInfo(orgId);
      }
    } catch (error) {
      // console.error('Error restoring org detail from URL:', error);
      // Nếu lỗi, về trang danh sách
      await fetchOrganizations();
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const data = await organizationApi.getUserOrganizations();
      setOrganizations(Array.isArray(data) ? data : []);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      // console.error('Error fetching organizations:', error);
      setOrganizations([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchOrganizations();
  };

  const getUserRoleInOrg = async (orgId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/organizations/${orgId}/user-role`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.role_name || 'staff';
      }
      return 'staff';
    } catch (error) {
      // console.error('Error getting user role:', error);
      return 'staff';
    }
  };

  const handleOrgClick = async (org) => {
    setUserRole(org.role_name);
    setSelectedOrg(org);
    const orgId = org.organization_id || org.uuid;

    // Cập nhật URL
    const currentPath = location.pathname;
    if (currentPath.includes('/org/')) {
      navigate(`/org/${org_id}/organization/${orgId}`, { replace: true });
    } else {
      navigate(`/personal/organization/${orgId}`, { replace: true });
    }

    await fetchMemberCount(orgId);
    await fetchOwnerInfo(orgId);
  };

  const fetchMemberCount = async (orgId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/organizations/${orgId}/members`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMemberCount(Array.isArray(data) ? data.length : 0);
      }
    } catch (error) {
      // console.error('Error fetching member count:', error);
      setMemberCount(0);
    }
  };

  const fetchOwnerInfo = async (orgId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/organizations/${orgId}/members`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const owner = Array.isArray(data) ? data.find(member => member.role_name === 'owner') : null;
        setOwnerInfo(owner);
      }
    } catch (error) {
      // console.error('Error fetching owner info:', error);
      setOwnerInfo(null);
    }
  };

  const handleBackToList = () => {
    setSelectedOrg(null);
    setUserRole(null);
    setMemberCount(0);
    setOwnerInfo(null);

    // Cập nhật URL về trang danh sách
    const currentPath = location.pathname;
    if (currentPath.includes('/org/')) {
      navigate(`/org/${org_id}/organization`, { replace: true });
    } else {
      navigate('/personal/organization', { replace: true });
    }
  };

  const handleLeaveOrganization = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn rời tổ chức này?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/organizations/${selectedOrg.organization_id || selectedOrg.uuid}/leave`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        showToast(
          t('greenBatch.leaveOrganization'),
          'success'
        );

        handleBackToList();
        fetchOrganizations();
      } else {
        const data = await response.json();
        showToast(
          data?.error || t('greenBatch.leaveOrganization_1'),
          'error'
        );

      }
    } catch (error) {
      showToast(t('greenBatch.errorRetry'), 'error');
    }
  };

  const handleDeleteSuccess = () => {
    setShowDeleteModal(false);
    handleBackToList();
    fetchOrganizations();
  };

  const handleEditSuccess = async () => {
    setShowEditModal(false);
    await fetchOrganizations();

    // Cập nhật thông tin tổ chức hiện tại
    const orgId = selectedOrg.organization_id || selectedOrg.uuid;
    try {
      const response = await fetch(`${API_BASE_URL}/organizations/${orgId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const updatedOrg = await response.json();
        setSelectedOrg(updatedOrg);
      }
    } catch (error) {
      // console.error('Error fetching updated organization:', error);
    }

    await fetchOwnerInfo(orgId);
  };

  if (loading) {
    return <div className="organization-loading">{t('auto.ang_ti_396')}</div>;
  }

  if (selectedOrg) {
    return (
      <div className="organization-container">
        <div className="organization-header">
          <div className="header-left">
            <button className="back-button" onClick={handleBackToList}>
              <FaArrowLeft size={16} />{t('auto.quay_li_397')}</button>
            <h1>{t('auto.chi_tit_t_chc_398')}</h1>
          </div>
          <div className="header-right">
            <div className="role-badge">
              {t("organization.role")}: {
                userRole === 'owner'
                  ? t("auto.ch_s_hu_495")
                  : userRole === 'admin'
                    ? t("auto.ch_s_hu_496")
                    : t("auto.ch_s_hu_497")
              }
            </div>

            <div className="org-action-buttons">
              {userRole === 'owner' && (
                <>
                  <button
                    className="org-action-btn org-edit-btn"
                    onClick={() => setShowEditModal(true)}
                    title="Sửa tổ chức"
                  >
                    <FaEdit size={14} />{t('auto.sa_399')}</button>
                  <button
                    className="org-action-btn org-delete-btn"
                    onClick={() => setShowDeleteModal(true)}
                    title="Xóa tổ chức"
                  >
                    <FaTrash size={14} />{t('auto.xa_400')}</button>
                </>
              )}
              {/* Tạm thời ẩn nút rời tổ chức */}
              {/* {userRole !== 'owner' && (
                <button 
                  className="org-action-btn org-leave-btn"
                  onClick={handleLeaveOrganization}
                  title="Rời tổ chức"
                >
                  <FaSignOutAlt size={14} />{t('auto.ri_t_chc_401')}</button>
              )} */}
            </div>
          </div>
        </div>

        <div className="org-detail-card">
          <div className="org-detail-header">
            <FaBuilding size={32} />
            <h2>{selectedOrg.org_name}</h2>
          </div>

          <div className="org-detail-info">
            <div className="info-row">
              <label>{t('auto.m_t_chc_402')}</label>
              <span>{selectedOrg.org_code}</span>
            </div>
            <div className="info-row">
              <label>{t('auto.email_403')}</label>
              <span>{selectedOrg.org_email}</span>
            </div>
            <div className="info-row">
              <label>{t('auto.in_thoi_404')}</label>
              <span>{selectedOrg.phone}</span>
            </div>

            {(userRole === 'owner' || userRole === 'admin') && (
              <>
                <div className="info-row">
                  <label>{t('auto.ngy_to_405')}</label>
                  <span>{selectedOrg.created_at ? new Date(selectedOrg.created_at).toLocaleDateString('vi-VN') : 'Không có thông tin'}</span>
                </div>
                <div className="info-row">
                  <label>{t('auto.trng_thi_406')}</label>
                  <span className="status-active">{t('auto.hot_ng_407')}</span>
                </div>
              </>
            )}

            {ownerInfo && (
              <div className="info-row">
                <label>{t('auto.ch_s_hu_408')}</label>
                <span>{ownerInfo.user_name || ownerInfo.email_address}</span>
              </div>
            )}

            {(userRole === 'owner' || userRole === 'admin' || userRole === 'staff') && (
              <div className="info-row">
                <label>{t('auto.s_thnh_vin_409')}</label>
                <span>{memberCount}</span>
              </div>
            )}
          </div>
        </div>

        <MembersList
          organizationId={selectedOrg.organization_id || selectedOrg.uuid}
          userRole={userRole}
          onMemberCountChange={setMemberCount}
        />

        {showDeleteModal && (
          <DeleteOrganizationModal
            organization={selectedOrg}
            onClose={() => setShowDeleteModal(false)}
            onSuccess={handleDeleteSuccess}
          />
        )}

        {showEditModal && (
          <EditOrganizationModal
            organization={selectedOrg}
            onClose={() => setShowEditModal(false)}
            onSuccess={handleEditSuccess}
          />
        )}
      </div>
    );
  }

  return (
    <div className="organization-container">
      <div className="organization-header">
        <div className="header-left">
          <button
            className="back-button"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft size={16} />{t('auto.quay_li_410')}</button>
          <h1>{t('auto.thng_tin_t_chc_411')}</h1>
        </div>
        <button
          className="create-org-button"
          onClick={() => setShowCreateModal(true)}
        >
          <FaPlus size={16} />{t('auto.to_t_chc_412')}</button>
      </div>

      <div className="organization-list">
        {organizations.length === 0 ? (
          <div className="no-organizations">
            <FaBuilding size={48} />
            <p>{t('auto.cha_c_t_chc_no_413')}</p>
            <button
              className="create-first-org-button"
              onClick={() => setShowCreateModal(true)}
            >{t('auto.to_t_chc_u_tin_414')}</button>
          </div>
        ) : (
          <div className="organization-table">
            <div className="table-header">
              <div className="header-cell">{t('auto.tn_t_chc_416')}</div>
              <div className="header-cell">{t('auto.m_t_chc_417')}</div>
              <div className="header-cell">Email</div>
              <div className="header-cell">{t('auto.in_thoi_418')}</div>
              <div className="header-cell">{t('auto.vai_tr_419')}</div>
            </div>
            {organizations.map(org => (
              <div key={org.organization_id || org.uuid} className="table-row clickable" onClick={() => handleOrgClick(org)}>
                <div className="table-cell" data-label="Tên tổ chức:">
                  <div className="cell-content">
                    <FaBuilding size={16} className="org-icon-small" />
                    <span>{org.org_name}</span>
                  </div>
                </div>
                <div className="table-cell" data-label="Mã tổ chức:">{org.org_code || 'N/A'}</div>
                <div className="table-cell" data-label="Email:">{org.org_email || 'N/A'}</div>
                <div className="table-cell" data-label="Điện thoại:">
                  {org.phone || t("common.notAvailable")}
                </div>

                <div className="table-cell" data-label="Vai trò:">
                 
                  <span className={`role-badge-table role-${org.role_name || 'staff'}`}>
                    {t(`organization.${org.role_name || 'staff'}`)}
                  </span>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateOrganizationModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

    </div>
  );
};

export default Organization;