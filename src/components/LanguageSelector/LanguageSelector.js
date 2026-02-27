import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
      <label style={{ marginRight: '10px', fontSize: '14px', color: '#666' }}>
        {t('login.selectLanguage')}:
      </label>
      <select
        value={i18n.language}
        onChange={(e) => changeLanguage(e.target.value)}
        style={{
          padding: '5px 10px',
          borderRadius: '4px',
          border: '1px solid #ddd',
          fontSize: '14px'
        }}>

        <option value="vi">🇻🇳 {t("auto.ting_vit_154")}</option>
        <option value="en">🇬🇧 English</option>
      </select>
    </div>);

};

export default LanguageSelector;