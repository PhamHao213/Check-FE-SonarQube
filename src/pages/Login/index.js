import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EyeIcon, EyeSlashIcon } from '../../components/Icons';
import logo from '../../assets/logo.jpg';
import ApiHelper from '../../api/apiHelper';
import { showToast } from '../../components/Toast/Toast';
import { API_BASE_URL } from '../../api/config';
import LanguageSelector from '../../components/LanguageSelector/LanguageSelector';
import Footer from '../../components/Footer/Footer';
import './Login.css';

const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const returnTo = location.state?.returnTo;
  const [formData, setFormData] = useState({
    email_address: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorTimeout, setErrorTimeout] = useState(null);
  const [needsVerification, setNeedsVerification] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/users/check-auth`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            localStorage.setItem('selectedContext', JSON.stringify({ type: 'personal' }));
            navigate('/personal/gblist', { replace: true });
          }
        }
      } catch (error) {
        // Không làm gì nếu chưa đăng nhập
      }
    };
    checkSession();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleLoginSuccess = () => {
    showToast(t('login.loginSuccess') || 'Đăng nhập thành công!', 'success');
    window.dispatchEvent(new Event('authSuccess'));
    
    if (returnTo && returnTo.includes('/cupping_scorecard')) {
      navigate(returnTo, { replace: true });
    } else {
      onLoginSuccess();
    }
  };

  const getErrorMessage = (error) => {
    if (error.status === 401 || (error.message && error.message.includes('401'))) {
      return t('login.invalidCredentialsDetail') || 'Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.';
    }
    if (error.status === 404 || (error.message && error.message.includes('404'))) {
      return t('login.accountNotFound') || 'Tài khoản không tồn tại. Vui lòng kiểm tra email.';
    }
    if (error.status === 403 || (error.message && error.message.includes('403'))) {
      return t('login.accountLocked') || 'Tài khoản đã bị khóa. Liên hệ quản trị viên.';
    }
    if (error.message && !error.message.includes('HTTP error')) {
      return error.message;
    }
    return t('login.invalidCredentials') || 'Email hoặc mật khẩu không đúng';
  };

  const handleLoginError = (error) => {
    if (error.message && error.message.includes('verify')) {
      setNeedsVerification(true);
      return;
    }
    
    const errorMessage = getErrorMessage(error);
    setError(errorMessage);
    
    if (errorTimeout) clearTimeout(errorTimeout);
    const timeout = setTimeout(() => setError(''), 7000);
    setErrorTimeout(timeout);
  };

  const performLogin = async () => {
    const data = await ApiHelper.requestWithoutAuth('/users/login', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    
    if (data.success) {
      handleLoginSuccess();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNeedsVerification(false);

    try {
      await performLogin();
    } catch (error) {
      handleLoginError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await ApiHelper.requestWithoutAuth('/users/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ email_address: formData.email_address })
      });

      showToast(t('login.otpResent') || 'Mã OTP đã được gửi lại!', 'success');
      navigate('/verify-otp');
    } catch (error) {
      // console.error('Error resending OTP:', error);
      showToast(t('login.otpError') || 'Có lỗi xảy ra khi gửi lại OTP', 'error');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
        <div className="login-logo">
          <img src={logo} alt="Logo" />
        </div>
        <LanguageSelector />
        <div className="login-header">
          <h1>{t('login.title')}</h1>
          <p>{t('login.subtitle') || 'Vui lòng đăng nhập để tiếp tục'}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email_address">{t('login.email')}</label>
            <input
              type="email"
              id="email_address"
              name="email_address"
              value={formData.email_address}
              onChange={handleInputChange}
              required
              placeholder={t('login.emailPlaceholder') || 'Nhập email'}
              tabIndex={1}
            />
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
                placeholder={t('login.passwordPlaceholder') || 'Nhập mật khẩu'}
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
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {needsVerification && (
            <div className="verification-message">
              <p>{t('login.needsVerification') || 'Tài khoản chưa được xác thực email.'}</p>
              <button
                type="button"
                className="resend-otp-btn"
                onClick={handleResendOTP}
                tabIndex={3}
              >
                {t('login.resendOTP') || 'Gửi lại OTP'}
              </button>
            </div>
          )}

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
            tabIndex={4}
          >
            {loading ? (t('login.loggingIn') || 'Đang đăng nhập...') : t('login.loginButton')}
          </button>


          <button
            type="button"
            className="forgot-password-link"
            onClick={() => navigate('/forgot-password')}
            tabIndex={5}
          >
            {t('login.forgotPassword')}
          </button>

          <button
            type="button"
            className="register-btn"
            onClick={() => navigate('/register')}
            tabIndex={6}
          >
            {t('login.createAccount') || 'Tạo tài khoản mới'}
          </button>
        </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;