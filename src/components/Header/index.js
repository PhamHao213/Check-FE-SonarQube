import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './Header.css';
import { FaUser, FaBuilding } from 'react-icons/fa';
import ProfileDropdown from '../ProfileDropdown';
import LanguageToggle from '../LanguageToggle';
import { useUser } from '../../hooks/useUser';

const Header = ({ selectedContext, disableOrgSwitch }) => {
  const user = useUser();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const handleLogoClick = () => {
    const prefix = selectedContext?.type === 'organization' 
      ? `/org/${btoa(String(selectedContext.uuid)).replace(/=/g, '')}` 
      : '/personal';
    navigate(`${prefix}/gblist`);
  };
  
  const getHeaderTitle = () => {
    if (selectedContext?.type === 'organization') {
      const orgName = selectedContext.name || t('common.loading');
      return `${orgName}`;
    } else {
      // Ưu tiên sử dụng thông tin từ selectedContext
      const contextUser = selectedContext?.user;
      if (contextUser?.user_firstname && contextUser?.user_lastname) {
        return `${contextUser.user_firstname} ${contextUser.user_lastname}`;
      }
      if (contextUser?.user_name) {
        return contextUser.user_name;
      }
      // Fallback về useUser hook
      if (user?.user_firstname && user?.user_lastname) {
        return `${user.user_firstname} ${user.user_lastname}`;
      }
      return user?.user_name || t('common.loading');
    }
  };

  return (
    <div className="header-container">
      <div className="header-left" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
        <div className="header-logo">
          {selectedContext?.type === 'organization' ? (
            <FaBuilding />
          ) : (
            <FaUser />
          )}
        </div>
        <h1 className="header-title">{getHeaderTitle()}</h1>
      </div>
      <div className="header-right">
        <LanguageToggle />
        <ProfileDropdown selectedContext={selectedContext} disableOrgSwitch={disableOrgSwitch} />
      </div>
    </div>
  );
};

export default Header;

