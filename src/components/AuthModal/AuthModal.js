import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import './AuthModal.css';

const AuthModal = ({ isOpen, onLogin, onGuest, onClose }) => {
  const { t, i18n } = useTranslation();
  
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };
  
  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <div className="auth-modal-header">
          <h2>{t('auto.cho_mng_bn_n_vi_15')}</h2>
          <div className="language-selector">
            <button 
              className={`lang-btn ${i18n.language === 'vi' ? 'active' : ''}`}
              onClick={() => changeLanguage('vi')}
            >
              VI
            </button>
            <button 
              className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
              onClick={() => changeLanguage('en')}
            >
              EN
            </button>
          </div>
          <button className="auth-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="auth-modal-content">
          <p>{t('auto._truy_cp_vo_h_t_16')}</p>
          
          <div className="auth-options">
            <div className="auth-option">
              <div className="auth-option-icon">{t('auto._17')}</div>
              <h3>{t('auto.ng_nhp_18')}</h3>
              <p>{t('auto.ng_nhp_truy_cp__19')}</p>
              <button className="auth-btn auth-btn-login" onClick={onLogin}>{t('auto.ng_nhp_20')}</button>
            </div>
            
            <div className="auth-option">
              <div className="auth-option-icon">{t('auto._21')}</div>
              <h3>{t('auto.ti_khon_khch_22')}</h3>
              <p>{t('auto.truy_cp_vi_quyn_23')}</p>
              <button className="auth-btn auth-btn-guest" onClick={onGuest}>{t('auto.tip_tc_vi_ti_kh_24')}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

AuthModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onLogin: PropTypes.func.isRequired,
  onGuest: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

export default AuthModal;