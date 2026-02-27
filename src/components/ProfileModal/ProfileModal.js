import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './ProfileModal.css';
import { FaTimes, FaEdit, FaUser, FaTrash, FaUndo, FaCalendarAlt, FaEye, FaEyeSlash, FaDownload } from 'react-icons/fa';
import { API_BASE_URL } from '../../api/config';
import OrganizationTransferModal from '../OrganizationTransferModal';
import DataBackupModal from '../DataBackupModal';

const LoadingSpinner = ({ message }) => (
  <div className="loading">{message}</div>
);

const ProfileContent = ({ activeTab, isEditing, showDeleteConfirm, children }) => {
  if (activeTab !== 'profile') return null;

  if (isEditing || showDeleteConfirm) {
    return children;
  }

  return (
    <div className="profile-info">
      {children}
    </div>
  );
};

const DeleteConfirmation = ({ deleteReason, setDeleteReason, deletePassword, setDeletePassword, showPassword, setShowPassword, deleteLoading, handleDeleteAccount, setShowDeleteConfirm, t }) => (
  <div className="delete-confirmation">
    <div className="delete-warning">
      <h3><FaTrash />{t('profile.delete_account')}</h3>
      <div className="warning-box">
        <p className="warning-icon">⚠️</p>
        <p className="warning-title">{t('profile.warning')}</p>
        <p className="warning-text">{t('profile.delete_warning')}</p>
        <ul className="warning-list">
          <li>{t('profile.delete_consequence_1')}</li>
          <li>{t('profile.delete_consequence_2')}</li>
          <li>{t('profile.delete_consequence_3')}</li>
        </ul>
      </div>

      <div className="form-group">
        <label>{t('profile.reason_for_deletion')}*</label>
        <textarea
          value={deleteReason}
          onChange={(e) => setDeleteReason(e.target.value)}
          placeholder={t('profile.reason_placeholder')}
          rows="3"
          required
        />
      </div>

      <div className="form-group">
        <label>{t('profile.confirm_password')}*</label>
        <div style={{ position: 'relative' }}>
          <input
            type={getInputType(showPassword)}
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            placeholder={t('profile.enter_password')}
            required
            style={{ paddingRight: '40px' }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#666',
              padding: '5px'
            }}
          >
            {getPasswordToggleIcon(showPassword)}
          </button>
        </div>
      </div>

      <div className="delete-actions">
        <button
          className="confirm-delete-btn"
          onClick={handleDeleteAccount}
          disabled={deleteLoading}
        >
          {getDeleteButtonText(deleteLoading, t)}
        </button>
        <button
          className="cancel-delete-btn"
          onClick={() => {
            setShowDeleteConfirm(false);
            setDeleteReason('');
            setDeletePassword('');
          }}
          disabled={deleteLoading}
        >
          {t('profile.cancel')}
        </button>
      </div>
    </div>
  </div>
);

const getSaveButtonText = (loading, t) => loading ? t('profile.saving') : t('greenBeans.saveInfo');

const getCalendarIconStyle = (isPendingDeletion) => ({
  position: 'absolute',
  right: '10px',
  cursor: isPendingDeletion ? 'not-allowed' : 'pointer',
  color: isPendingDeletion ? '#ccc' : '#666'
});

const getDeleteButtonText = (deleteLoading, t) => deleteLoading ? t('profile.deleting') : t('profile.confirm_delete');

const getPasswordToggleIcon = (showPassword) => showPassword ? <FaEyeSlash /> : <FaEye />;

const getInputType = (showPassword) => showPassword ? "text" : "password";

const getGenderDisplay = (gender, t) => {
  const genderMap = {
    'M': t('auto.nam_199'),
    'F': t('auto.nu_200')
  };
  return genderMap[gender] || t('auto.chua_cap_nhat_201');
};

const IncompleteProfileWarning = ({ userInfo, t }) => {
  const isIncomplete = !userInfo.user_firstname || !userInfo.user_lastname || !userInfo.gender || !userInfo.user_dob;

  if (!isIncomplete) return null;

  return (
    <p className="warning-message">{t('auto.bn_vui_lng_cp_n_182')}</p>
  );
};

const DeletionWarning = ({ deletionStatus, formatTimeRemaining, handleCancelDeletion, cancelDeleteLoading, t }) => {
  if (!deletionStatus?.isPendingDeletion) return null;

  return (
    <div className="deletion-pending-warning">
      <div className="warning-box">
        <p className="warning-icon">⚠️</p>
        <p className="warning-title">{t('profile.account_pending_deletion')}</p>
        <p className="warning-text">
          {t('profile.account_will_be_deleted_in')}: {formatTimeRemaining()}
        </p>
        {deletionStatus?.deletionActions?.transferTiming === 'immediate' && (
          <p className="transfer-status">
            {t("organization.transferImmediate")}
          </p>
        )}
        <p className="warning-note">
          {t('profile.pending_deletion_note')}
        </p>
        <button
          className="cancel-deletion-btn"
          onClick={handleCancelDeletion}
          disabled={cancelDeleteLoading}
        >
          <FaUndo /> {cancelDeleteLoading ? t('profile.cancelling') : t('profile.cancel_deletion')}
        </button>
      </div>
    </div>
  );
};

const TabButton = ({ isActive, onClick, icon, label }) => (
  <button
    className={`tab-btn ${isActive ? 'active' : ''}`}
    onClick={onClick}
  >
    {icon} {label}
  </button>
);

const ProfileModal = ({ isOpen, onClose, selectedContext }) => {
  const { t } = useTranslation();
  const [userInfo, setUserInfo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deletionStatus, setDeletionStatus] = useState(null);
  const [timeUntilDeletion, setTimeUntilDeletion] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [showDataBackupModal, setShowDataBackupModal] = useState(false);
  const [formData, setFormData] = useState({
    user_name: '',
    user_firstname: '',
    user_lastname: '',
    gender: '',
    user_dob: ''
  });
  const [dateDisplay, setDateDisplay] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [cancelDeleteLoading, setCancelDeleteLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [showOrgTransferModal, setShowOrgTransferModal] = useState(false);
  const [ownedOrganizations, setOwnedOrganizations] = useState([]);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUserInfo();
      fetchDeletionStatus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to get user info');
      }

      const user = await response.json();

      const detailResponse = await fetch(`${API_BASE_URL}/users/${user.uuid}`, {
        credentials: 'include'
      });

      if (detailResponse.ok) {
        const userData = await detailResponse.json();
        setUserInfo(userData);
      }
    } catch (error) {
      // console.error('Error fetching user info:', error);
    }
  };

  const fetchDeletionStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/deletion-status`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setDeletionStatus(data);

        if (data.isPendingDeletion && data.timeUntilDeletion) {
          setTimeUntilDeletion(data.timeUntilDeletion);

          // Cập nhật thời gian đếm ngược mỗi phút
          if (data.timeUntilDeletion.totalMs > 0) {
            const timer = setInterval(() => {
              setTimeUntilDeletion(prev => {
                if (!prev || prev.totalMs <= 1000) {
                  clearInterval(timer);
                  return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
                }
                return {
                  ...prev,
                  totalMs: prev.totalMs - 60000,
                  minutes: prev.minutes > 0 ? prev.minutes - 1 : 59,
                  hours: prev.minutes === 0 && prev.hours > 0 ? prev.hours - 1 : prev.hours,
                  days: prev.hours === 0 && prev.minutes === 0 && prev.days > 0 ? prev.days - 1 : prev.days
                };
              });
            }, 60000); // Cập nhật mỗi phút
          }
        }
      }
    } catch (error) {
      // console.error('Error fetching deletion status:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      user_dob: value
    }));
    if (value) {
      const [year, month, day] = value.split('-');
      setDateDisplay(`${day}/${month}/${year}`);
    }
  };

  const handleDateInputChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    let formatted = '';
    
    if (value.length > 0) {
      formatted = value.slice(0, 2);
    }
    if (value.length >= 3) {
      formatted += '/' + value.slice(2, 4);
    }
    if (value.length >= 5) {
      formatted += '/' + value.slice(4, 8);
    }
    
    setDateDisplay(formatted);
    
    if (formatted.length === 10) {
      const [day, month, year] = formatted.split('/');
      setFormData(prev => ({
        ...prev,
        user_dob: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      }));
    } else if (formatted.length === 0) {
      // Nếu xóa hết ngày sinh, set về empty string
      setFormData(prev => ({
        ...prev,
        user_dob: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate ngày sinh - không bắt buộc
    if (dateDisplay && dateDisplay.length !== 10) {
      showErrorMessage(t('profile.please_enter_valid_date') || 'Vui lòng nhập ngày sinh hợp lệ');
      return;
    }
    
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showSuccessMessage(t('profile.update_success') || 'Cập nhật thông tin thành công!');
        setIsEditing(false);
        fetchUserInfo();
      } else {
        const error = await response.json();
        showErrorMessage(error.error || t('profile.update_failed') || 'Cập nhật thất bại');
      }
    } catch (error) {
      // console.error('Error updating profile:', error);
      showErrorMessage(t('profile.update_error') || 'Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    const dob = userInfo.user_dob ? userInfo.user_dob.split('T')[0] : '';
    setFormData({
      user_name: userInfo.user_name || '',
      user_firstname: userInfo.user_firstname || '',
      user_lastname: userInfo.user_lastname || '',
      gender: userInfo.gender || '',
      user_dob: dob
    });
    if (dob) {
      const [year, month, day] = dob.split('-');
      setDateDisplay(`${day}/${month}/${year}`);
    } else {
      setDateDisplay('');
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteReason.trim()) {
      showErrorMessage(t('profile.please_enter_reason'));
      return;
    }

    if (!deletePassword.trim()) {
      showErrorMessage(t('profile.please_enter_password'));
      return;
    }

    setDeleteLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/users/delete-account`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: deleteReason,
          password: deletePassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        showSuccessMessage(t('profile.account_deletion_requested'));
        setTimeout(() => {
          setShowDeleteConfirm(false);
          setDeleteReason('');
          setDeletePassword('');
          fetchDeletionStatus();
        }, 1500);
      } else {
        // Kiểm tra xem có phải lỗi do sở hữu organization không
        if (data.requiresOrganizationAction && data.ownedOrganizations) {
          setOwnedOrganizations(data.ownedOrganizations);
          setShowOrgTransferModal(true);
        } else {
          showErrorMessage(data.error || t('profile.delete_failed'));
        }
      }
    } catch (error) {
      // console.error('Error deleting account:', error);
      showErrorMessage(t('profile.delete_error'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDeletion = async () => {
    setCancelDeleteLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/users/cancel-deletion`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        showSuccessMessage(t('profile.deletion_cancelled'));
        setDeletionStatus(null);
        setTimeUntilDeletion(null);
      } else {
        showErrorMessage(data.error || t('profile.cancel_deletion_failed'));
      }
    } catch (error) {
      // console.error('Error cancelling deletion:', error);
      showErrorMessage(t('profile.cancel_deletion_error'));
    } finally {
      setCancelDeleteLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('auto.chua_cap_nhat_201');
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTimeRemaining = () => {
    if (!timeUntilDeletion) return '';

    const { days, hours, minutes } = timeUntilDeletion;

    if (days > 0) {
      return `${days} ${t('profile.days')}, ${hours} ${t('profile.hours')}`;
    } else if (hours > 0) {
      return `${hours} ${t('profile.hours')}, ${minutes} ${t('profile.minutes')}`;
    } else {
      return `${minutes} ${t('profile.minutes')}`;
    }
  };

  const showSuccessMessage = (message) => {
    setNotification({ show: true, message, type: 'success' });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const showErrorMessage = (message) => {
    setNotification({ show: true, message, type: 'error' });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const handleOrgActionsConfirmed = (data) => {
    setShowOrgTransferModal(false);
    setShowDeleteConfirm(false);
    setDeleteReason('');
    setDeletePassword('');
    showSuccessMessage(t('toast.requestRecorded'));
    fetchDeletionStatus();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="profile-modal-overlay" style={{ overflow: 'hidden' }}>
      <div className="profile-modal">
        <div className="profile-modal-header">
          <h2>
            <FaUser />{t('auto.thng_tin_c_nhn_179')}</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="profile-tabs">
          <TabButton
            isActive={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
            icon={<FaUser />}
            label={t("profile.profile")}
          />
          <TabButton
            isActive={activeTab === 'backup'}
            onClick={() => setActiveTab('backup')}
            icon={<FaDownload />}
            label={t("profile.backup")}
          />
        </div>

        <div className="profile-modal-content">
          {!userInfo ? (
            <LoadingSpinner message={t('auto.ang_ti_180')} />
          ) : (
            <>
              <ProfileContent
                activeTab={activeTab}
                isEditing={isEditing}
                showDeleteConfirm={showDeleteConfirm}
              >
                {!isEditing && !showDeleteConfirm ? (
                  <>
                    <DeletionWarning
                      deletionStatus={deletionStatus}
                      formatTimeRemaining={formatTimeRemaining}
                      handleCancelDeletion={handleCancelDeletion}
                      cancelDeleteLoading={cancelDeleteLoading}
                      t={t}
                    />

                    <div className="complete-profile">
                      <IncompleteProfileWarning userInfo={userInfo} t={t} />
                      <div className="info-row">
                        <label>{t('auto.tn_ng_nhp_185')}</label>
                        <span>{userInfo.user_name || t('auto.chua_cap_nhat_201')}</span>
                      </div>
                      <div className="info-row">
                        <label>{t('auto.email_186')}</label>
                        <span>{userInfo.email_address || t('auto.chua_cap_nhat_201')}</span>
                      </div>
                      <div className="info-row">
                        <label>{t('auto.h_187')}</label>
                        <span>{userInfo.user_firstname || t('auto.chua_cap_nhat_201')}</span>
                      </div>
                      <div className="info-row">
                        <label>{t('auto.tn_188')}</label>
                        <span>{userInfo.user_lastname || t('auto.chua_cap_nhat_201')}</span>
                      </div>
                      <div className="info-row">
                        <label>{t('auto.gii_tnh_189')}</label>
                        <span>{getGenderDisplay(userInfo.gender, t)}</span>
                      </div>
                      <div className="info-row">
                        <label>{t('auto.ngy_sinh_190')}</label>
                        <span>{formatDate(userInfo.user_dob)}</span>
                      </div>
                    </div>

                    {/* NÚT CẬP NHẬT VÀ XÓA TÀI KHOẢN */}
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '30px' }}>
                      <button
                        className="edit-btn"
                        onClick={handleEdit}
                        disabled={deletionStatus?.isPendingDeletion}
                      >
                        <FaEdit />{t('auto.chnh_sa_191')}
                      </button>
                      <button
                        className="delete-account-btn"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={deletionStatus?.isPendingDeletion}
                      >
                        <FaTrash />{t('profile.delete_account')}
                      </button>
                    </div>
                  </>
                ) : showDeleteConfirm ? (
                  <DeleteConfirmation
                    deleteReason={deleteReason}
                    setDeleteReason={setDeleteReason}
                    deletePassword={deletePassword}
                    setDeletePassword={setDeletePassword}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    deleteLoading={deleteLoading}
                    handleDeleteAccount={handleDeleteAccount}
                    setShowDeleteConfirm={setShowDeleteConfirm}
                    t={t}
                  />
                ) : (
                  <form className="profile-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label>{t('auto.tn_ng_nhp_193')}</label>
                      <input
                        type="text"
                        name="user_name"
                        value={formData.user_name}
                        onChange={handleInputChange}
                        required
                        disabled={deletionStatus?.isPendingDeletion}
                      />
                    </div>
                    <div className="form-group">
                      <label>{t('auto.h_194')}</label>
                      <input
                        type="text"
                        name="user_firstname"
                        value={formData.user_firstname}
                        onChange={handleInputChange}
                        required
                        disabled={deletionStatus?.isPendingDeletion}
                      />
                    </div>
                    <div className="form-group">
                      <label>{t('auto.tn_195')}</label>
                      <input
                        type="text"
                        name="user_lastname"
                        value={formData.user_lastname}
                        onChange={handleInputChange}
                        required
                        disabled={deletionStatus?.isPendingDeletion}
                      />
                    </div>
                    <div className="form-group">
                      <label>{t('auto.gii_tnh_196')}</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        required
                        disabled={deletionStatus?.isPendingDeletion}
                      >
                        <option value="">{t('auto.chn_gii_tnh_197')}</option>
                        <option value="M">{t('auto.nam_199')}</option>
                        <option value="F">{t('auto.n_198')}</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>{t('auto.ngy_sinh_199')}</label>
                      <div className="date-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={dateDisplay}
                          onChange={handleDateInputChange}
                          onKeyPress={(e) => {
                            if (!/[0-9]/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          placeholder="dd/mm/yyyy"
                          maxLength="10"
                          style={{ flex: 1, paddingRight: '40px' }}
                          disabled={deletionStatus?.isPendingDeletion}
                        />
                        <FaCalendarAlt
                          onClick={() => !deletionStatus?.isPendingDeletion && document.getElementById('date-picker').showPicker()}
                          style={getCalendarIconStyle(deletionStatus?.isPendingDeletion)}
                        />
                        <input
                          id="date-picker"
                          type="date"
                          name="user_dob"
                          value={formData.user_dob}
                          onChange={handleDateChange}
                          tabIndex="-1"
                          style={{
                            position: 'absolute',
                            opacity: 0,
                            pointerEvents: 'none',
                            width: '200px',
                            top: '100%',
                            right: '0',
                            zIndex: 1000,
                          }}
                          disabled={deletionStatus?.isPendingDeletion}
                        />
                      </div>
                    </div>
                    <div className="form-actions">
                      <button
                        type="submit"
                        className="save-btn"
                        disabled={loading || deletionStatus?.isPendingDeletion}
                      >
                        {getSaveButtonText(loading, t)}
                      </button>
                      <button
                        type="button"
                        className="profile-cancel-btn"
                        onClick={() => setIsEditing(false)}
                      >
                        {t('auto.hy_200')}
                      </button>
                    </div>
                  </form>
                )}
              </ProfileContent>

              {activeTab === 'backup' && (
                <div className="backup-tab-content">
                  <div className="backup-info">
                    <h3>{t("profile.backup")}</h3>
                    <p>{t("profile.description1")}</p>
                    <p>{t("profile.description2")}</p>
                  </div>
                  <button
                    className="backup-btn"
                    onClick={() => setShowDataBackupModal(true)}
                  >
                    <FaDownload /> {t("profile.backup")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        {notification.show && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}
      </div>

      {/* Data Backup Modal */}
      <DataBackupModal
        isOpen={showDataBackupModal}
        onClose={() => setShowDataBackupModal(false)}
        selectedContext={selectedContext}
      />

      {/* Organization Transfer Modal */}
      <OrganizationTransferModal
        isOpen={showOrgTransferModal}
        onClose={() => setShowOrgTransferModal(false)}
        ownedOrganizations={ownedOrganizations}
        onActionsConfirmed={handleOrgActionsConfirmed}
        deleteReason={deleteReason}
        deletePassword={deletePassword}
      />
    </div>
  );
};

export default ProfileModal;