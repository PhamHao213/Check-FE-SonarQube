import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { useTranslation } from 'react-i18next';
import { createPortal } from "react-dom";
import { FaBuilding, FaChevronDown, FaUser } from "react-icons/fa";
import "./OrganizationSelector.css";
import { API_BASE_URL } from "../../api/config";

const OrganizationSelector = forwardRef(({ onContextSelect, selectedContext, disabled = false, disabledReason = "Không thể chuyển tổ chức khi đang xem chi tiết" }, ref) => {
  const { t } = useTranslation();
  const [organizations, setOrganizations] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef(null);

  useEffect(() => {
    fetchUserOrganizations();
    
    // Khôi phục context đã chọn từ localStorage
    const savedContext = localStorage.getItem('selectedContext');
    if (savedContext) {
      try {
        const context = JSON.parse(savedContext);
        onContextSelect(context);
      } catch (error) {
        // console.error('Error parsing saved context:', error);
      }
    }

    // Lắng nghe sự kiện cập nhật quyền
    const handleRoleUpdate = () => {
      fetchUserOrganizations();
    };

    window.addEventListener('userRoleUpdated', handleRoleUpdate);
    
    // Tự động kiểm tra cập nhật quyền mỗi 30 giây khi đang ở chế độ organization
    const intervalId = setInterval(() => {
      if (selectedContext?.type === "organization") {
        fetchUserOrganizations();
      }
    }, 30000);
    
    return () => {
      window.removeEventListener('userRoleUpdated', handleRoleUpdate);
      clearInterval(intervalId);
    };
  }, [selectedContext?.type]);

  // Xóa cache khi component unmount
  useEffect(() => {
    return () => {
      // Reset state khi component unmount
      setOrganizations([]);
      setIsOpen(false);
    };
  }, []);

  const fetchUserOrganizations = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/organizations/user/organizations`,
        {
          credentials: 'include',
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setOrganizations(data);

        // Cập nhật role trong selectedContext nếu đang ở chế độ organization
        if (selectedContext?.type === "organization" && selectedContext?.uuid) {
          const currentOrg = data.find(org => org.organization_id === selectedContext.uuid);
          if (currentOrg && currentOrg.role_name !== selectedContext.role) {
            const updatedContext = {
              ...selectedContext,
              role: currentOrg.role_name
            };
            localStorage.setItem('selectedContext', JSON.stringify(updatedContext));
            onContextSelect(updatedContext);
          }
        }
      }
    } catch (error) {
      // console.error("Error fetching user organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  // Expose refresh function
  useImperativeHandle(ref, () => ({
    refreshOrganizations: fetchUserOrganizations
  }));

  const handleSelect = async (context) => {
    setSwitching(true);
    setIsOpen(false);

    // Simulate loading time for better UX
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Lưu context vào localStorage
    localStorage.setItem('selectedContext', JSON.stringify(context));
    
    onContextSelect(context);
    setSwitching(false);
  };

  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      });
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      updateDropdownPosition();
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (event) => {
        const dropdownElement = document.querySelector('.org-dropdown-portal');
        if (buttonRef.current &&
          !buttonRef.current.contains(event.target) &&
          (!dropdownElement || !dropdownElement.contains(event.target))) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (loading) {
    return <div className="org-selector-loading">{t('auto.ang_ti_174')}</div>;
  }

  return (
    <>
      {switching && createPortal(
        <div className="org-switching-overlay">
          <div className="org-switching-spinner"></div>
        </div>,
        document.body
      )}
      <div className="organization-selector">
        <button
          ref={buttonRef}
          className="org-selector-button"
          onClick={handleToggle}
          disabled={disabled}
          title={disabled ? disabledReason : ""}
        >
          <div className="org-selector-content">
            {selectedContext?.type === "personal" ? (
              <>
                <FaUser size={14} />
                {/* <span>{t('auto.__175')}</span> */}
              </>
            ) : (
              <FaBuilding size={14} />
            )}
            <div className="org-selector-info">
              <span className="org-name">
                {selectedContext?.type === "personal"
                  ? t("auto.c_nhn_176")          // Cá nhân / Personal
                  : selectedContext?.type === "organization"
                    ? selectedContext.name
                    : t("auto.ch_n_ng_cnh_179")  // Chọn ngữ cảnh
                }
              </span>

              {/* {selectedContext?.type === "organization" &&
                selectedContext.role && (
                  <span className="org-role">
                    {selectedContext.role === "owner"
                      ? "Chủ sở hữu"
                      : selectedContext.role === "admin"
                        ? "Quản trị viên"
                        : selectedContext.role === "manager"
                          ? "Quản lý"
                          : "Thành viên"}
                  </span>
                )} */}
              {selectedContext?.type === "organization" &&
                selectedContext.role && (
                  <span className="org-role">
                    {t(`organization.${selectedContext.role}`, t('organization.member'))}
                  </span>
                )}


            </div>
          </div>
          <FaChevronDown className={`chevron ${isOpen ? "open" : ""}`} />
        </button>

        {isOpen && createPortal(
          <div
            className="org-dropdown org-dropdown-portal"
            style={{
              position: 'fixed',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              zIndex: 999999
            }}
          >
            {/* Option Cá nhân */}
            <div
              className={`org-option ${selectedContext?.type === "personal" ? "selected" : ""
                }`}
              onClick={() => handleSelect({ type: "personal" })}
            >
              <FaUser size={14} />
              <div className="org-option-info">
                <span className="org-option-name">
                  {t("auto.c_nhn_176")}
                </span>
                <span className="org-option-role">
                  {t("auto.d_liu_c_nhn_177")}
                </span>
              </div>
            </div>

            {/* Separator */}
            {organizations.length > 0 && <div className="org-separator"></div>}

            {/* Current Organization */}
            {selectedContext?.type === 'organization' && (
              <>
                <div className="org-section-header">{t('common.currentOrg')}</div>
                <div className="org-option selected">
                  <FaBuilding size={14} />
                  <div className="org-option-info">
                    <span className="org-option-name">{selectedContext.name}</span>
                    <span className="org-option-role">
                      {t(`organization.${selectedContext.role}`, t('organization.member'))}
                    </span>
                  </div>
                </div>
                {organizations.length > 1 && (
                  <>
                    <div className="org-separator"></div>
                    <div className="org-section-header">{t('common.switchOrg')}</div>
                  </>
                )}
              </>
            )}

            {/* Other Organizations */}
            {organizations
              .filter(org => selectedContext?.type !== 'organization' || org.organization_id !== selectedContext?.uuid)
              .map((org) => (
                <div
                  key={org.organization_id}
                  className="org-option"
                  onClick={() =>
                    handleSelect({
                      type: "organization",
                      uuid: org.organization_id,
                      name: org.org_name,
                      role: org.role_name,
                    })
                  }
                >
                  <FaBuilding size={14} />
                  <div className="org-option-info">
                    <span className="org-option-name">{org.org_name}</span>
                    <span className="org-option-role">
                      {t(`organization.${org.role_name}`, t('organization.member'))}
                    </span>
                  </div>
                </div>
              ))}
          </div>,
          document.body
        )}
      </div>
    </>
  );
});

export default OrganizationSelector;
