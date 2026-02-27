import React, { useState, useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (isOpen && currentPasswordRef.current) {
      setTimeout(() => {
        currentPasswordRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
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
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Hàm kiểm tra mật khẩu mạnh
  const isStrongPassword = (password) => {
    return password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(password);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = t('validation.required');
    }

    if (!formData.newPassword) {
      newErrors.newPassword = t('validation.required');
    } else if (!isStrongPassword(formData.newPassword)) {
      newErrors.newPassword = t('validation.passwordStrength');
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('validation.required');
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = t('validation.passwordMismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      } else {
        // Xử lý lỗi từ server
        if (data.error && data.error.includes('mật khẩu hiện tại')) {
          setErrors({
            currentPassword: data.error
          });
        } else if (data.error && data.error.includes('Mật khẩu mới phải có')) {
          setErrors({
            newPassword: data.error
          });
        } else {
          setErrors({
            currentPassword: data.error || t('toast.error')
          });
        }
      }
    } catch (error) {
      // console.error('Change password error:', error);
      setErrors({
        currentPassword: t('toast.error')
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
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
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={handleClose}>
        <div className="change-password-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{t('profile.changePassword')}</h2>
            <button className="close-button" onClick={handleClose}>
              <FaTimes />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="change-password-form">
            <div className="form-group">
              <label htmlFor="currentPassword">
                {t('profile.currentPassword')} *
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
                  tabIndex={1}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('current')}
                  tabIndex={-1}
                >
                  {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.currentPassword && (
                <span className="error-message">{errors.currentPassword}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">
                {t('profile.newPassword')} *
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
                  tabIndex={2}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('new')}
                  tabIndex={-1}
                >
                  {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.newPassword && (
                <span className="error-message">{errors.newPassword}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                {t('profile.confirmNewPassword')} *
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
                  tabIndex={3}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('confirm')}
                  tabIndex={-1}
                >
                  {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="error-message">{errors.confirmPassword}</span>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={handleClose}
                disabled={isLoading}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="submit-button"
                disabled={isLoading}
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

export default ChangePasswordModal;