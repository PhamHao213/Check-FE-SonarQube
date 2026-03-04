import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './ProfileDropdown.css';
import { FaUser, FaBuilding, FaKey, FaSignOutAlt, FaChevronDown } from 'react-icons/fa';
import ProfileModal from '../ProfileModal';
import ChangePasswordModal from '../ChangePasswordModal';
import { API_BASE_URL } from '../../api/config';
import { useUser } from '../../hooks/useUser';

const ProfileDropdown = ({ selectedContext, disableOrgSwitch }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const getUserDisplayName = () => {
    if (user?.user_firstname && user?.user_lastname) {
      return `${user.user_firstname} ${user.user_lastname}`;
    }
    return user?.user_name || t('header.profile');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/users/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          
        }
      });
    } catch (error) {
      // console.error('Logout error:', error);
    } finally {
      // Xóa tất cả dữ liệu trong localStorage
      localStorage.clear();
      navigate('/login');
    }
  };

  const handleProfileClick = () => {
    setIsProfileModalOpen(true);
    setIsOpen(false);
  };

  const handleOrganizationClick = () => {
    navigate('/personal/organization');
    setIsOpen(false);
  };

  const handleChangePasswordClick = () => {
    setIsChangePasswordModalOpen(true);
    setIsOpen(false);
  };

  return (
    <>
      <div className="profile-dropdown" ref={dropdownRef}>
        <button 
          ref={buttonRef}
          className="profile-button"
          onClick={toggleDropdown}
        >
          <FaUser size={16} />
          <span className="profile-text">{getUserDisplayName()}</span>
          <FaChevronDown size={12} className={`chevron ${isOpen ? 'open' : ''}`} />
        </button>
        
        {isOpen && (
          <div className="dropdown-menu profile-dropdown-menu">
            <button className="dropdown-item" onClick={handleProfileClick}>
              <FaUser size={14} />
              <span>{t('profile.title')}</span>
            </button>
            <button className="dropdown-item" onClick={handleOrganizationClick} disabled={disableOrgSwitch}>
              <FaBuilding size={14} />
              <span>{t('organization.title')}</span>
            </button>
            <button className="dropdown-item" onClick={handleChangePasswordClick}>
              <FaKey size={14} />
              <span>{t('profile.changePassword')}</span>
            </button>
            <div className="dropdown-divider"></div>
            <button className="dropdown-item logout" onClick={handleLogout}>
              <FaSignOutAlt size={14} />
              <span>{t('header.logout')}</span>
            </button>
          </div>
        )}
      </div>
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)}
        selectedContext={selectedContext}
      />
      <ChangePasswordModal 
        isOpen={isChangePasswordModalOpen} 
        onClose={() => setIsChangePasswordModalOpen(false)} 
      />
    </> 
  );
};

export default ProfileDropdown;