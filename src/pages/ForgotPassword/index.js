import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../../api/config';
import { useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '../../components/Icons';
import Footer from '../../components/Footer/Footer';
import './ForgotPassword.css';

const ForgotPassword = ({ onBack }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/users/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email_address: email })
      });

      if (response.ok) {
        setStep(2);
      } else {
        const data = await response.json();
        setError(data.message || t('forgotPassword.emailNotFound'));
      }
    } catch (error) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/users/verify-reset-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_address: email,
          otp: otp
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResetToken(data.resetToken);
        setStep(3);
      } else {
        setError(data.message || t('forgotPassword.invalidOtp'));
      }
    } catch (error) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resetToken: resetToken,
          newPassword: newPassword
        })
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 2000);
      } else {
        const data = await response.json();
        setError(data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="forgot-password-card">
          <div className="forgot-password-header">
            <h1>
              {step === 1 && t('forgotPassword.title')}
              {step === 2 && t('forgotPassword.otp_title')}
              {step === 3 && t('forgotPassword.new_password_title')}
            </h1>
            <p>
              {step === 1 && t('forgotPassword.email_desc')}
              {step === 2 && t('forgotPassword.otp_desc')}
              {step === 3 && t('forgotPassword.new_password_desc')}
            </p>
          </div>

          {step === 1 && (
            <form onSubmit={handleEmailSubmit} className="forgot-password-form">
              <div className="form-group">
                <label htmlFor="email">{t('auto.email__356')}</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={t('auto.nhp_email_363')}
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="submit-btn" disabled={loading}>
                {t(loading ? 'forgotPassword.loading' : 'forgotPassword.send_otp')}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleOtpSubmit} className="forgot-password-form">
              <div className="form-group">
                <label htmlFor="otp">{t('auto.m_otp__357')}</label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(value);
                  }}
                  maxLength={6}
                  required
                  placeholder={t('auto.nhp_m_otp_364')}
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="submit-btn" disabled={loading}>
                {t(loading ? 'forgotPassword.loading' : 'forgotPassword.authentic')}
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handlePasswordSubmit} className="forgot-password-form">
              <div className="form-group">
                <label htmlFor="newPassword">{t('auto.mt_khu_mi__358')}</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (confirmPassword && e.target.value !== confirmPassword) {
                        setPasswordMismatch(true);
                      } else {
                        setPasswordMismatch(false);
                      }
                    }}
                    required
                    placeholder={t('auto.nhp_mt_khu_mi_365')}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">{t('auto.xc_nhn_mt_khu__359')}</label>
                <div className="password-input-container">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (newPassword && e.target.value !== newPassword) {
                        setPasswordMismatch(true);
                      } else {
                        setPasswordMismatch(false);
                      }
                    }}
                    required
                    placeholder={t('auto.nhp_li_mt_khu_m_366')}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
                {passwordMismatch && confirmPassword && (
                  <div className="password-mismatch">{t('auto.mt_khu_xc_nhn_k_360')}</div>
                )}
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="submit-btn" disabled={loading || passwordMismatch}>
                {t(loading ? 'forgotPassword.loading' : 'forgotPassword.change_password')}
              </button>
            </form>
          )}

          <button type="button" className="back-btn" onClick={() => navigate('/login')}>{t('auto.quay_li_ng_nhp_361')}</button>
        </div>
      </div>
      <Footer />

      {success && (
        <div className="forgot-password-success-overlay">
          <div className="forgot-password-success-modal">
            <div className="forgot-password-success-text">{t('auto.i_mt_khu_thnh_c_362')}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;