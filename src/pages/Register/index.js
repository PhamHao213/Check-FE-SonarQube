import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../../api/config';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '../../components/Icons';
import logo from '../../assets/logo.jpg';
import { showToast } from '../../components/Toast/Toast';
import LanguageSelector from '../../components/LanguageSelector/LanguageSelector';
import Footer from '../../components/Footer/Footer';
import './Register.css';

const Register = ({ onRegisterSuccess }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const returnUrl = searchParams.get('returnUrl');
  const orgId = searchParams.get('orgId');
  const roleId = searchParams.get('roleId');
  const inviteEmail = searchParams.get('email');
  const [formData, setFormData] = useState({
    email_address: inviteEmail || '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorTimeout, setErrorTimeout] = useState(null);
  const [emailExists, setEmailExists] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);


  const checkEmailExists = async (email) => {
    if (!email || !email.includes('@')) {
      setEmailExists(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/check-email?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        setEmailExists(data.exists);
      }
    } catch (error) {
      // console.error('Error checking email:', error);
    }
  };

  const isStrongPassword = (password) => {
    return password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(password);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');

    if (name === 'email_address') {
      setEmailExists(false);
      const timeoutId = setTimeout(() => {
        checkEmailExists(value);
      }, 500);
      return () => clearTimeout(timeoutId);
    }

    if (name === 'password') {
      setIsPasswordValid(isStrongPassword(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      if (errorTimeout) clearTimeout(errorTimeout);
      const timeout = setTimeout(() => setError(''), 5000);
      setErrorTimeout(timeout);
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...registerData } = formData;

      // Lấy guest_session_id và guest_cupper_name từ localStorage hoặc URL params nếu có
      const guestSessionId = sessionId || localStorage.getItem('guest_session_id');
      const guestCupperName = localStorage.getItem('guest_cupper_name');
      
      if (guestSessionId) {
        registerData.guest_session_id = guestSessionId;
      }
      
      if (guestCupperName) {
        registerData.guest_cupper_name = guestCupperName;
      }

      // Thêm thông tin tổ chức nếu có
      if (orgId && roleId) {
        registerData.orgId = orgId;
        registerData.roleId = roleId;
      }

      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData)
      });

      if (response.ok) {
        // Xóa guest_session_id và guest_cupper_name sau khi đăng ký thành công
        localStorage.removeItem('guest_session_id');
        localStorage.removeItem('guest_cupper_name');
        showToast(
          t('register.register_success'),
          'success'
        );

        // Chuyển đến trang verify với thông tin session nếu có
        const verifyState = {
          email: formData.email_address,
          password: formData.password,
          ...(sessionId && { sessionId }),
          ...(returnUrl && { returnUrl })
        };
        navigate('/verify-otp', { state: verifyState });
      } else {
        const data = await response.json();
        const errorMsg = data.error || data.message || 'Có lỗi xảy ra khi đăng ký';
        setError(errorMsg);
        showToast(errorMsg, 'error');
        if (errorTimeout) clearTimeout(errorTimeout);
        const timeout = setTimeout(() => setError(''), 5000);
        setErrorTimeout(timeout);
      }
    } catch (error) {
      const errorMsg = 'Có lỗi xảy ra. Vui lòng thử lại.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      if (errorTimeout) clearTimeout(errorTimeout);
      const timeout = setTimeout(() => setError(''), 5000);
      setErrorTimeout(timeout);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-card">
          <div className="register-logo">
            <img src={logo} alt="Logo" />
          </div>
          <LanguageSelector />
          <div className="register-header">
            <h1>{t('register.title')}</h1>
            <p>{t('register.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
              {/* <label htmlFor="email_address">{t('register.email') || t('login.email')}</label> */}
              <label htmlFor="email_address">{t('Email')}</label>
              <input
                type="email"
                id="email_address"
                name="email_address"
                value={formData.email_address}
                onChange={handleInputChange}
                required
                placeholder={t('login.emailPlaceholder')}
                tabIndex={1}
              />
              {emailExists && (
                <div className="email-exists-error">
                  {t('register.emailExists') || 'Email đã tồn tại'}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password">{t('login.password')}</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder={t('login.passwordPlaceholder')}
                  tabIndex={2}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>
              {!isPasswordValid && formData.password && (
                <div className="password-requirements">
                  {t('register.passwordRequirements') || 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt'}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">{t('register.confirmPassword')}</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  placeholder={t('register.confirmPasswordPlaceholder') || 'Nhập mật khẩu mới'}
                  tabIndex={3}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>
              {formData.confirmPassword && formData.password && formData.password !== formData.confirmPassword && (
                <div className="password-mismatch-error">
                  {t('validation.passwordMismatch')}
                </div>
              )}
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="register-btn"
              disabled={loading}
              tabIndex={4}
            >
              {loading ? t('register.registering') : t('register.registerButton')}
            </button>

            <button
              type="button"
              className="back-login-btn"
              onClick={() => navigate('/login')}
              tabIndex={5}
            >
              {t('register.backToLogin') || 'Quay lại đăng nhập'}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Register;