import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import './ChangePasswordModal.css';
import { FaEye, FaEyeSlash, FaTimes } from 'react-icons/fa';
import SuccessModal from '../SuccessModal';
import { API_BASE_URL } from '../../api/config';

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const currentPasswordRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (isOpen && currentPasswordRef.current) {
      // Clear previous timeout if exists
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        currentPasswordRef.current?.focus();
      }, 100);
    }

    // Cleanup timeout on unmount or when isOpen changes
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e?.target || {};
    if (!name) return;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [errors]);

  const togglePasswordVisibility = useCallback((field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  }, []);

  // Hàm kiểm tra mật khẩu mạnh
  const isStrongPassword = useCallback((password) => {
    return password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(password);
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.currentPassword?.trim()) {
      newErrors.currentPassword = t('validation.required');
    }

    if (!formData.newPassword?.trim()) {
      newErrors.newPassword = t('validation.required');
    } else if (!isStrongPassword(formData.newPassword)) {
      newErrors.newPassword = t('validation.passwordStrength');
    }

    if (!formData.confirmPassword?.trim()) {
      newErrors.confirmPassword = t('validation.required');
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = t('validation.passwordMismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, isStrongPassword, t]);

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/users/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          password: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        handleClose();
        setShowSuccessModal(true);
        return;
      }
      
      // Xử lý lỗi từ server
      if (data.error?.includes('mật khẩu hiện tại')) {
        setErrors({
          currentPassword: data.error
        });
      } else if (data.error?.includes('Mật khẩu mới phải có')) {
        setErrors({
          newPassword: data.error
        });
      } else {
        setErrors({
          currentPassword: data.error || t('toast.error')
        });
      }
    } catch (error) {
      console.error('Change password error:', error);
      setErrors({
        currentPassword: t('toast.error')
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm, t]);

  const handleClose = useCallback(() => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setErrors({});
    setShowPasswords({
      current: false,
      new: false,
      confirm: false
    });
    onClose();
  }, [onClose]);

  const handleSuccessClose = useCallback(() => {
    setShowSuccessModal(false);
  }, []);

  const handleOverlayKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  }, [handleClose]);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  const handleModalClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

  const handleModalKeyDown = useCallback((e) => {
    // Chỉ ngăn chặn sự kiện lan ra ngoài, không xử lý gì thêm
    e.stopPropagation();
  }, []);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="modal-overlay" 
        onClick={handleOverlayClick}
        onKeyDown={handleOverlayKeyDown}
        role="presentation"
        aria-hidden={!isOpen}
      >
        <div 
          className="change-password-modal" 
          onClick={handleModalClick}
          onKeyDown={handleModalKeyDown}
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-password-title"
          tabIndex={-1}
        >
          <div className="modal-header">
            <h2 id="change-password-title">{t('profile.changePassword')}</h2>
            <button 
              className="close-button" 
              onClick={handleClose}
              aria-label={t('common.close')}
              title={t('common.close')}
            >
              <FaTimes aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="change-password-form" noValidate>
            <div className="form-group">
              <label htmlFor="currentPassword">
                {t('profile.currentPassword')} <span className="required" aria-hidden="true">*</span>
              </label>
              <div className="password-input-wrapper">
                <input
                  ref={currentPasswordRef}
                  type={showPasswords.current ? 'text' : 'password'}
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className={errors.currentPassword ? 'error' : ''}
                  placeholder={t('profile.currentPassword')}
                  aria-invalid={!!errors.currentPassword}
                  aria-describedby={errors.currentPassword ? 'current-password-error' : undefined}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('current')}
                  tabIndex={-1}
                  aria-label={showPasswords.current ? t('common.hidePassword') : t('common.showPassword')}
                >
                  {showPasswords.current ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
                </button>
              </div>
              {errors.currentPassword && (
                <span id="current-password-error" className="error-message" role="alert">
                  {errors.currentPassword}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">
                {t('profile.newPassword')} <span className="required" aria-hidden="true">*</span>
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className={errors.newPassword ? 'error' : ''}
                  placeholder={t('profile.newPassword')}
                  aria-invalid={!!errors.newPassword}
                  aria-describedby={errors.newPassword ? 'new-password-error' : undefined}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('new')}
                  tabIndex={-1}
                  aria-label={showPasswords.new ? t('common.hidePassword') : t('common.showPassword')}
                >
                  {showPasswords.new ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
                </button>
              </div>
              {errors.newPassword && (
                <span id="new-password-error" className="error-message" role="alert">
                  {errors.newPassword}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                {t('profile.confirmNewPassword')} <span className="required" aria-hidden="true">*</span>
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={errors.confirmPassword ? 'error' : ''}
                  placeholder={t('profile.confirmNewPassword')}
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('confirm')}
                  tabIndex={-1}
                  aria-label={showPasswords.confirm ? t('common.hidePassword') : t('common.showPassword')}
                >
                  {showPasswords.confirm ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span id="confirm-password-error" className="error-message" role="alert">
                  {errors.confirmPassword}
                </span>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={handleClose}
                disabled={isLoading}
                aria-label={t('common.cancel')}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="submit-button"
                disabled={isLoading}
                aria-busy={isLoading}
                aria-label={isLoading ? t('common.loading') : t('profile.changePassword')}
              >
                {isLoading ? t('common.loading') : t('profile.changePassword')}
              </button>
            </div>
          </form>
        </div>
      </div>
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        message={t('profile.passwordChanged')}
      />
    </>
  );
};

ChangePasswordModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default ChangePasswordModal;