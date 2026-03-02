import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { showToast } from '../Toast/Toast';
import { API_BASE_URL } from '../../api/config';
import './DataBackupModal.css';

const DataBackupModal = ({ isOpen, onClose, selectedContext }) => {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      // Determine workspace type for correct data export
      const workspaceType = selectedContext?.type === 'organization' ? 'org' : 'personal';
      const organizationId = selectedContext?.type === 'organization' ? selectedContext?.uuid : null;

      const response = await fetch(`${API_BASE_URL}/data-backup/export`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workspace: workspaceType,
          organizationId: organizationId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || t('profile.exportError');
        showToast(errorMessage, 'error');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data_backup_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a); // Giữ nguyên theo yêu cầu không thay đổi logic
    } catch (error) {
      // Log error for debugging (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.error('Export error:', error);
      }
      
      // Show user-friendly error message
      const errorMessage = error.message === 'Failed to fetch' 
        ? t('common.networkError') 
        : t('profile.exportError');
      
      showToast(errorMessage, 'error');
    } finally {
      setExporting(false);
    }
  }, [selectedContext, onClose, t]);

  const handleClose = useCallback(() => {
    if (!exporting) {
      onClose();
    }
  }, [exporting, onClose]);

  const handleOverlayClick = useCallback((e) => {
    // Close modal when clicking on overlay (but not on modal content)
    if (e.target === e.currentTarget && !exporting) {
      onClose();
    }
  }, [exporting, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="data-backup-modal-overlay" 
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div 
        className="data-backup-modal" 
        role="dialog"
        aria-modal="true"
        aria-labelledby="backup-modal-title"
      >
        <div className="data-backup-modal-header">
          <h2 id="backup-modal-title">{t("profile.backup")}</h2>
          <button 
            className="close-btn" 
            onClick={handleClose}
            disabled={exporting}
            aria-label={t('common.close')}
          >
            ×
          </button>
        </div>

        <div className="data-backup-modal-content">
          <div className="export-info">
            <h3>{t("profile.backup")}</h3>
            <p>{t("profile.exportIncludes")}</p>
            <ul>
              <li>{t("profile.greenBeans")}</li>
              <li>{t("profile.greenBeanBatches")}</li>
              <li>{t("profile.vendors")}</li>
            </ul>
            <div className="workspace-info">
              <strong>{t("profile.label")}:</strong>{" "}
              <span>
                {selectedContext?.type === "organization"
                  ? t("profile.organization")
                  : t("profile.personal")}
              </span>
            </div>
          </div>
        </div>

        <div className="data-backup-modal-footer">
          <button 
            className="cancel-export-btn" 
            onClick={handleClose}
            disabled={exporting}
          >
            {t("common.cancel")}
          </button>
          <button
            className="export-btn"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <>
                <span className="loading-spinner"></span>
                {t("profile.exporting")}
              </>
            ) : (
              t("profile.exportExcel")
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Thêm PropTypes validation chi tiết
DataBackupModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedContext: PropTypes.shape({
    type: PropTypes.string,
    uuid: PropTypes.string
  })
};

// Thêm defaultProps
DataBackupModal.defaultProps = {
  selectedContext: null
};

export default DataBackupModal;