import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { showToast } from '../Toast/Toast';
import { API_BASE_URL } from '../../api/config';
import './DataBackupModal.css';

const DataBackupModal = ({ isOpen, onClose, selectedContext }) => {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);



  const handleExport = async () => {
    setExporting(true);
    try {
    

      // Xác định workspace để export đúng dữ liệu
      const workspaceType = selectedContext?.type === 'organization' ? 'org' : 'personal';
      const organizationId = selectedContext?.type === 'organization' ? selectedContext.uuid : null;



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
        const errorData = await response.json();
        showToast(errorData.error || 'Lỗi khi export dữ liệu', 'error');
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
      document.body.removeChild(a);

      showToast('Export dữ liệu thành công!', 'success');
      onClose();
    } catch (error) {
   
      showToast('Lỗi khi export dữ liệu', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="data-backup-modal-overlay">
      <div className="data-backup-modal">
        <div className="data-backup-modal-header">
          <h2>{t("profile.backup")}</h2>
          <button className="close-btn" onClick={handleClose}>
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
            <p className="workspace-info">
              <strong>{t("profile.label")}:</strong>{" "}
              {selectedContext?.type === "organization"
                ? t("profile.organization")
                : t("profile.personal")}

            </p>
          </div>
        </div>

        <div className="data-backup-modal-footer">
          <button className="cancel-export-btn" onClick={handleClose}>
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

export default DataBackupModal;

