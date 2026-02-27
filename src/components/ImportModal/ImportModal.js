import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { greenBeanImportApi } from '../../api/greenBeanImportApi';
import { API_BASE_URL } from '../../api/config';
import { showToast } from '../Toast/Toast';
import ApiHelper from '../../api/apiHelper';
import './ImportModal.css';

const ImportModal = ({ isOpen, onClose, onImportSuccess, selectedContext }) => {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [activeStep, setActiveStep] = useState(1);

  // Helper function để lấy policy_id từ selectedContext
  const getPolicyId = async (selectedContext = null) => {
    try {
      const context = selectedContext || { type: 'personal' };
      const contextType = context?.type || 'personal';

      let endpoint;
      if (contextType === 'personal') {
        endpoint = '/policies/personal';
      } else if (contextType === 'organization') {
        endpoint = `/policies/organization/${context.uuid}`;
      }

      const policyData = await ApiHelper.get(endpoint);
      return policyData.data?.uuid;
    } catch (error) {
  
      return null;
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setActiveStep(3);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setActiveStep(2);
      // Gọi endpoint template kết hợp có cả GreenBean và Vendor sheet
      const response = await fetch(`${API_BASE_URL}/excel-import/template`, {
        credentials: 'include'
      });

      // Nếu gặp lỗi 401, thử refresh token
      if (response.status === 401) {
        const refreshResponse = await fetch(`${API_BASE_URL}/users/refresh-token`, {
          method: 'POST',
          credentials: 'include'
        });

        if (refreshResponse.ok) {
          // Thử lại request
          const retryResponse = await fetch(`${API_BASE_URL}/excel-import/template`, {
            credentials: 'include'
          });

          if (retryResponse.ok) {
            const blob = await retryResponse.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'import_template.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            return;
          }
        }
        throw new Error('Session expired');
      }

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'import_template.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Không thể tải template');
      }
    } catch (error) {
    
      showToast('Lỗi khi tải template', 'error');
    }
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      setImporting(true);

      const policyId = await getPolicyId(selectedContext);
      if (!policyId) {
        throw new Error('Không tìm thấy policy_id');
      }

      // Sử dụng endpoint import kết hợp
      const formData = new FormData();
      formData.append('file', file);
      formData.append('policy_id', policyId);

      let response = await fetch(`${API_BASE_URL}/excel-import/import`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      // Nếu gặp lỗi 401, thử refresh token
      if (response.status === 401) {
        const refreshResponse = await fetch(`${API_BASE_URL}/users/refresh-token`, {
          method: 'POST',
          credentials: 'include'
        });

        if (refreshResponse.ok) {
          // Thử lại request
          response = await fetch(`${API_BASE_URL}/excel-import/import`, {
            method: 'POST',
            credentials: 'include',
            body: formData
          });
        } else {
          throw new Error('Session expired');
        }
      }

      const result = await response.json();

 

      if (!response.ok) {
        throw new Error(result.error || 'Import failed');
      }

      setResult(result);

      const totalSuccess = result.greenBeans.success + result.vendors.success + (result.greenBeanBatches?.success || 0);
      const totalFailed = result.greenBeans.failed + result.vendors.failed + (result.greenBeanBatches?.failed || 0);


      if (totalSuccess > 0) {
        onImportSuccess();
        showToast(`Import thành công! ${totalSuccess} bản ghi đã được thêm.`, 'success');
        setTimeout(() => {
          handleClose();
        }, 2000);
      }

      if (totalFailed > 0) {
        showToast(`${totalFailed} bản ghi import thất bại`, 'warning');
      }

      // Kiểm tra nếu có lỗi liên quan đến việc không tạo được lô
 
      const batchErrors = result.greenBeanBatches?.items?.failed || [];
 
      const hasBatchLinkError = batchErrors.some(error =>
        error.error && error.error.includes('liên kết nhân xanh')
      );
    

      if (hasBatchLinkError) {
     
        showToast('Một số lô không thể tạo vì không có liên kết nhân xanh', 'warning');
      } else if (totalSuccess === 0 && totalFailed === 0) {
     
        showToast('Không thể lưu dữ liệu - kiểm tra lại định dạng hoặc liên kết dữ liệu', 'warning');
      }
    } catch (error) {
      const errorMessage = error.message || 'Có lỗi xảy ra khi import file';
      showToast(errorMessage, 'error');
      setResult({
        message: errorMessage,
        greenBeans: { success: 0, failed: 1 },
        vendors: { success: 0, failed: 1 },
        greenBeanBatches: { success: 0, failed: 1 }
      });
    } finally {
      setImporting(false);
      setActiveStep(4);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setActiveStep(1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="import-modal-overlay">
      <div className="import-modal">
        <div className="import-modal-header">
          <div className="header-content">
            <div className="header-text">
              <h2>{t("vendor.importTitle")}</h2>
              <p className="header-subtitle">
                {t("vendor.importSubtitle")}
              </p>

            </div>
          </div>
          <button className="import-modal-close" onClick={handleClose}>
            <span>×</span>
          </button>
        </div>

        <div className="import-modal-content">
          {/* Progress Steps */}
          <div className="import-progress-steps">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className={`import-step-item ${activeStep >= step ? 'active' : ''}`}>
                <div className="step-circle">{step}</div>
                <div className="step-label">
                  {step === 1 && t("vendor.start")}
                  {step === 2 && t("vendor.template")}
                  {step === 3 && t("vendor.upload")}
                  {step === 4 && t("vendor.complete")}
                </div>
              </div>
            ))}
          </div>

          {/* Step 1: Template Download */}
          <div className="import-step">
            <div className="step-header">
              <div className="step-number">1</div>
              <h3>{t("vendor.downloadTemplate")}</h3>
            </div>
            <p className="step-description">
              {t("vendor.downloadTemplateDescription")}
            </p>
            <button
              className="download-template-btn"
              onClick={handleDownloadTemplate}
            >
              <span className="btn-text">
                {t("vendor.downloadExcelTemplate")}
              </span>
            </button>
          </div>

          {/* Step 2: File Upload */}
          <div className="import-step">
            <div className="step-header">
              <div className="step-number">2</div>
              <h3>{t("vendor.uploadYourFile")}</h3>
            </div>
            <p className="step-description">
              {t("vendor.selectExcelFile")}
            </p>


            {!file && (
              <div className="file-upload-area">
                <input
                  type="file"
                  id="file-upload"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="file-input"
                />
                <label htmlFor="file-upload" className="file-upload-label">
                  <div className="upload-icon">📄</div>
                  <div className="upload-text">
                    <div className="upload-title">
                      {t("vendor.clickToUpload")}
                    </div>

                    <div className="upload-subtitle">
                      {t("vendor.excelFilesOnly")}
                    </div>
                  </div>
                </label>
              </div>
            )}

            {file && (
              <div className="file-preview">
                <div className="file-info">
                  <span className="file-icon">📄</span>
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">
                    ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  className="file-remove"
                  onClick={() => {
                    setFile(null);
                    setActiveStep(2);
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="import-actions">
            <button
              className="cancel-btn"
              onClick={handleClose}
            >
              {t("common.cancel")}
            </button>
            <button
              className="import-btn"
              onClick={handleImport}
              disabled={!file || importing}
            >
              {importing ? (
                <>
                  <span className="loading-spinner"></span>
                  {t("vendor.processing")}
                </>
              ) : (
                <>
                  {t("vendor.importData")}
                </>
              )}
            </button>

          </div>

          {/* Results Section - Removed */}
        </div>
      </div>
    </div>
  );
};

export default ImportModal;