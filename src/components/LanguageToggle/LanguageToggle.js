import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageToggle.css';

const LanguageToggle = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <button
      className="language-toggle"
      onClick={toggleLanguage}
      title={i18n.language === 'vi' ? 'Switch to English' : 'Chuyen sang tieng Viet'}
    >
      {i18n.language === 'vi' ? '🇬🇧 EN' : '🇻🇳 VI'}
    </button>
  );
};

export default LanguageToggle;