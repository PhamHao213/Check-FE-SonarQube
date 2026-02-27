import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../../api/config';
import { useNavigate, useLocation } from 'react-router-dom';
import './VerifyOTP.css';

const VerifyOTP = ({ onVerifySuccess }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [email, setEmail] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    const emailFromState = location.state?.email;
    if (emailFromState) {
      setEmail(emailFromState);
    } else {
      navigate('/register');
    }
  }, [navigate, location]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!otp || otp.length !== 6) {
      setError(t('verifyOTP.otpCode') + ' ' + t('validation.required'));
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_address: email,
          otp: otp
        })
      });

      if (response.ok) {
        const sessionId = location.state?.sessionId;
        
        if (sessionId) {
          // Nếu có sessionId, đăng nhập tự động và chuyển về session
          try {
            // Đăng nhập tự động
            const loginResponse = await fetch(`${API_BASE_URL}/users/login`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                email_address: email,
                password: location.state?.password || '' // Nếu có password từ register
              })
            });
            
            if (loginResponse.ok) {
              setShowSuccessModal(true);
              setTimeout(() => {
                setShowSuccessModal(false);
                window.location.href = `/personal/sessionlist/${sessionId}`;
              }, 2000);
            } else {
              throw new Error('Login failed');
            }
          } catch (loginError) {
            // console.error('Auto login failed:', loginError);
            setShowSuccessModal(true);
            setTimeout(() => {
              setShowSuccessModal(false);
              navigate('/login', { 
                state: { 
                  message: t('register.registerSuccess') + '. ' + t('login.subtitle'),
                  email: email,
                  redirectTo: `/personal/sessionlist/${sessionId}`
                }
              });
            }, 2000);
          }
        } else {
          // Không có sessionId, xử lý bình thường
          setShowSuccessModal(true);
          setTimeout(() => {
            setShowSuccessModal(false);
            if (typeof onVerifySuccess === 'function') {
              onVerifySuccess();
            } else {
              navigate('/login', { state: { email } });
            }
          }, 3000);
        }
      } else {
        const data = await response.json();
        setError(data.error || t('verifyOTP.verifyButton') + ' ' + t('common.error'));
      }
    } catch (error) {
      setError(t('toast.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_address: email
        })
      });

      if (response.ok) {
        setTimeLeft(300);
        setError('');
        setResendMessage(t('verifyOTP.otpSent'));
        setTimeout(() => setResendMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || t('verifyOTP.cannotResendOtp'));
      }
    } catch (error) {
      setError(t('verifyOTP.cannotResendOtp'));
    }
  };

  return (
    <div className="verify-otp-container">
      <div className={`verify-otp-card ${showSuccessModal ? 'blurred' : ''}`}>
        <div className="verify-otp-header">
          <h1>{t('verifyOTP.title')}</h1>
          <p>{t('verifyOTP.subtitle')}: <strong>{email}</strong></p>
        </div>

        <form onSubmit={handleSubmit} className="verify-otp-form">
          <div className="form-group">
            <label htmlFor="otp">{t('verifyOTP.otpCode')}</label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={t('verifyOTP.otpCode')}
              maxLength="6"
              required
            />
          </div>

          <div className="timer">
            {timeLeft > 0 ? (
              <p>
                {t('verifyOTP.otpTimeLeft')}{' '}
                <span className="time">{formatTime(timeLeft)}</span>
              </p>
            ) : (
              <p className="expired">{t('verifyOTP.otpExpired')}</p>
            )}
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {resendMessage && (
            <div className="success-message">
              {resendMessage}
            </div>
          )}

          <button
            type="submit"
            className="verify-btn"
            disabled={loading || timeLeft === 0}
          >
            {loading ? t('common.loading') : t('verifyOTP.verifyButton')}
          </button>

          <button
            type="button"
            className="resend-btn"
            onClick={handleResendOTP}
          >{t('verifyOTP.resendOTP')}</button>

          <button
            type="button"
            className="back-register-btn"
            onClick={() => navigate('/register')}
          >{t('verifyOTP.backToRegister')}</button>
        </form>
      </div>

      {showSuccessModal && (
        <div className="verify-success-modal">
          <div className="verify-success-modal-content">
            <h2>{t('verifyOTP.verifySuccess')}</h2>
            <p>{t('register.registerSuccess')}</p>
            {location.state?.sessionId && (
              <p>{t('verifyOTP.redirectingToSession')}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyOTP;