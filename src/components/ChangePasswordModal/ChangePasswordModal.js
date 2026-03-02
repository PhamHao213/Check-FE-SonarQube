import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import './ChangePasswordModal.css';
import { FaEye, FaEyeSlash, FaTimes } from 'react-icons/fa';
import SuccessModal from '../SuccessModal';
import { API_BASE_URL } from '../../api/config';

// Constants
const PASSWORD_VALIDATION = {
  MIN_LENGTH: 8,
  PATTERNS: {
    UPPERCASE: /[A-Z]/,
    LOWERCASE: /[a-z]/,
    DIGIT: /\d/,
    SPECIAL: /[!@#$%^&*(),.?":{}|<>]/
  }
};

// Utility functions
const isStrongPassword = (password) => {
  return password.length >= PASSWORD_VALIDATION.MIN_LENGTH &&
    PASSWORD_VALIDATION.PATTERNS.UPPERCASE.test(password) &&
    PASSWORD_VALIDATION.PATTERNS.LOWERCASE.test(password) &&
    PASSWORD_VALIDATION.PATTERNS.DIGIT.test(password) &&
    PASSWORD_VALIDATION.PATTERNS.SPECIAL.test(password);
};

const validatePasswordFields = (formData, t) => {
  const errors = {};

  if (!formData.currentPassword?.trim()) {
    errors.currentPassword = t('validation.required');
  }

  if (!formData.newPassword?.trim()) {
    errors.newPassword = t('validation.required');
  } else if (!isStrongPassword(formData.newPassword)) {
    errors.newPassword = t('validation.passwordStrength');
  }

  if (!formData.confirmPassword?.trim()) {
    errors.confirmPassword = t('validation.required');
  } else if (formData.newPassword !== formData.confirmPassword) {
    errors.confirmPassword = t('validation.passwordMismatch');
  }

  return errors;
};

const handleServerError = (data, t) => {
  if (data.error?.includes('mật khẩu hiện tại')) {
    return { currentPassword: data.error };
  } else if (data.error?.includes('Mật khẩu mới phải có')) {
    return { newPassword: data.error };
  } else {
    return { currentPassword: data.error || t('toast.error') };
  }
};

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  
  // State
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
  
  // Refs
  const currentPasswordRef = useRef(null);
  const timeoutRef = useRef(null);

  // Effects
  useEffect(() => {
    if (isOpen && currentPasswordRef.current) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        currentPasswordRef.current?.focus();
      }, 100);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen]);

  // Handlers
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

  const validateForm = useCallback(() => {
    const newErrors = validatePasswordFields(formData, t);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  const resetForm = useCallback(() => {
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
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

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
    e.stopPropagation();
  }, []);

  // API calls
  const changePassword = useCallback(async () => {
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
    return { response, data };
  }, [formData]);

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const { response, data } = await changePassword();

      if (response.ok) {
        handleClose();
        setShowSuccessModal(true);
        return;
      }
      
      const serverErrors = handleServerError(data, t);
      setErrors(serverErrors);
    } catch (error) {
      console.error('Change password error:', error);
      setErrors({
        currentPassword: t('toast.error')
      });
    } finally {
      setIsLoading(false);
    }
  }, [validateForm, changePassword, handleClose, t]);

  // Render helpers
  const renderPasswordInput = useCallback((field, label, ref = null) => {
    const fieldName = field === 'current' ? 'currentPassword' 
                    : field === 'new' ? 'newPassword' 
                    : 'confirmPassword';
    
    return (
      <div className="form-group">
        <label htmlFor={fieldName}>
          {label} <span className="required" aria-hidden="true">*</span>
        </label>
        <div className="password-input-wrapper">
          <input
            ref={ref}
            type={showPasswords[field] ? 'text' : 'password'}
            id={fieldName}
            name={fieldName}
            value={formData[fieldName]}
            onChange={handleInputChange}
            className={errors[fieldName] ? 'error' : ''}
            placeholder={label}
            aria-invalid={!!errors[fieldName]}
            aria-describedby={errors[fieldName] ? `${fieldName}-error` : undefined}
            disabled={isLoading}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => togglePasswordVisibility(field)}
            tabIndex={-1}
            aria-label={showPasswords[field] ? t('common.hidePassword') : t('common.showPassword')}
          >
            {showPasswords[field] ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
          </button>
        </div>
        {errors[fieldName] && (
          <span id={`${fieldName}-error`} className="error-message" role="alert">
            {errors[fieldName]}
          </span>
        )}
      </div>
    );
  }, [formData, showPasswords, errors, isLoading, handleInputChange, togglePasswordVisibility, t]);

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
            {renderPasswordInput('current', t('profile.currentPassword'), currentPasswordRef)}
            {renderPasswordInput('new', t('profile.newPassword'))}
            {renderPasswordInput('confirm', t('profile.confirmNewPassword'))}

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