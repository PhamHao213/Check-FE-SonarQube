import React from 'react';
import { useTranslation } from 'react-i18next';
import './Navigation.css';
import { LeafIcon, BoxIcon, ClipboardIcon, VendorIcon, WarehouseIcon } from '../Icons';
import OrganizationSelector from '../OrganizationSelector';

const Navigation = ({ activeTab, onTabChange, selectedContext, onContextSelect, isDetailPage, isFormOpen }) => {
  const { t } = useTranslation();
  
  const tabs = [
    { 
      uuid: 'gblist', 
      label: t('navigation.greenBeans'), 
      icon: <LeafIcon color="#FFFFFF" opacity={1} size={18} />,
      color: '#09B04B',
      number: '1'
    },
    { 
      uuid: 'gbblist', 
      label: t('navigation.greenBatch'), 
      icon: <BoxIcon color="#FFFFFF" opacity={1} size={18} />,
      color: '#FBB217',
      number: '2'
    },
    { 
      uuid: 'session', 
      label: t('navigation.cuppingSession'), 
      icon: <ClipboardIcon color="#FFFFFF" opacity={1} size={18} />,
      color: '#0158A4',
      number: '3'
    },
    { 
      uuid: 'vendor', 
      label: t('navigation.vendor'), 
      icon: <VendorIcon color="#FFFFFF" opacity={1} size={18} />,
      color: '#6f42c1',
      number: '4'
    },
    { 
      uuid: 'warehouse', 
      label: t('navigation.warehouse') || 'Xuất nhập kho', 
      icon: <WarehouseIcon color="#FFFFFF" opacity={1} size={18} />,
      color: '#dc3545',
      number: '5'
    },
  ];

  const getDisabledReason = () => {
    if (isFormOpen) {
      return "Không thể chuyển tổ chức khi đang tạo/chỉnh sửa";
    }
    if (isDetailPage) {
      return "Không thể chuyển tổ chức khi đang xem chi tiết";
    }
    return "";
  };

  return (
    <div className="navigation-container">
      <div className="navigation-wrapper">
        <div className="nav-left">
          {tabs.map((tab) => (
            <button
              key={tab.uuid}
              className={`nav-tab ${activeTab === tab.uuid ? 'active' : ''}`}
              onClick={() => onTabChange(tab.uuid)}
            >
              <span className="nav-tab-icon">{tab.icon}</span>
              <span className="nav-tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="nav-right">
          <OrganizationSelector 
            selectedContext={selectedContext}
            onContextSelect={onContextSelect}
            disabled={isDetailPage || isFormOpen}
            disabledReason={getDisabledReason()}
          />
        </div>
      </div>
    </div>
  );
};

export default Navigation;

