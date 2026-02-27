import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";
import "./GreenBeans.css";
import {
  LeafIcon,
  SearchIcon,
  FilterIcon,
  SortIcon,
  BeanIcon,
  RegionIcon,
  AltitudeIcon,
  YearIcon,
} from "../../components/Icons";
import AddGreenBeanForm from "./AddGreenBeanForm";
import FilterModal from "../../components/FilterModal/FilterModal";
import ImportModal from "../../components/ImportModal/ImportModal";
import { API_BASE_URL } from "../../api/config";
import { canCreate, usePermissions } from "../../utils/permissions";

// Helper function để lấy policy_id từ selectedContext
const getPolicyId = async (selectedContext = null) => {
  try {
    const context = selectedContext || { type: 'personal' };
    const contextType = context?.type || 'personal';

    if (contextType === 'personal') {
      const policyResponse = await fetch(`${API_BASE_URL}/policies/personal`, {
        credentials: 'include',
        headers: {}
      });
      if (policyResponse.ok) {
        const policyData = await policyResponse.json();
        return policyData.data?.uuid;
      }
    } else if (contextType === 'organization') {
      const policyResponse = await fetch(`${API_BASE_URL}/policies/organization/${context.uuid}`, {
        credentials: 'include',
        headers: {}
      });
      if (policyResponse.ok) {
        const policyData = await policyResponse.json();
        return policyData.data?.uuid;
      }
    }

    return null;
  } catch (error) {

    return null;
  }
};

const GreenBeans = ({ selectedContext }) => {
  const { t } = useTranslation();
  const { permissions, role } = usePermissions();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [greenBeans, setGreenBeans] = useState([]);
  const [origins, setOrigins] = useState({});

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState("newest");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    variety: "",
    cropYear: "",
    country: ""
  });

  useEffect(() => {
    // Reset state khi chuyển context
    setGreenBeans([]);
    setOrigins({});
    setLoading(true);
    setCurrentPage(1);

    fetchGreenBeans();
    fetchOrigins();
    fetchCountries();
  }, [selectedContext]);

  const fetchGreenBeans = async () => {
    try {
      setLoading(true);

      const policyId = await getPolicyId(selectedContext);

      if (!policyId) {
        console.warn('No policy_id found, returning empty green beans');
        setGreenBeans([]);
        setLoading(false);
        return;
      }

      // Lấy green beans theo policy_id
      const response = await fetch(
        `${API_BASE_URL}/greenbeans/?policy_id=${policyId}`,
        {
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        setGreenBeans(data.data || []);
      }
    } catch (error) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  const fetchOrigins = async () => {
    try {
      const policyId = await getPolicyId(selectedContext);

      if (!policyId) {
        console.warn("No policy found for origins");
        return;
      }

      // Lấy origins theo policy_id
      const response = await fetch(
        `${API_BASE_URL}/origins?policy_id=${policyId}`,
        {
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        const originsMap = {};
        data.data?.forEach((origin) => {
          originsMap[origin.uuid] = {
            country: origin.country_name,
            region: origin.region,
            // Thêm các trường khác để hỗ trợ tìm kiếm
            country_lower: origin.country_name?.toLowerCase() || '',
            region_lower: origin.region?.toLowerCase() || '',
          };
        });
        setOrigins(originsMap);
      }
    } catch (error) {
      // Error handled silently
    }
  };

  const fetchCountries = async () => {
    try {
      const policyId = await getPolicyId(selectedContext);

      if (!policyId) {
        console.warn("No policy found for countries");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/origins?policy_id=${policyId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        // Countries will be handled by FilterModal
      }
    } catch (error) {
      // Error handled silently
    }
  };

  const handleAddClick = () => {
    setShowForm(true);
  };



  const handleImportSuccess = () => {
    fetchGreenBeans();
    setShowImportModal(false);
  };

  const handleFormBack = () => {
    setShowForm(false);
  };

  const handleFormSubmit = (newGreenBean) => {
    fetchGreenBeans(); // Refresh danh sách
  };

  const handleCardClick = (greenbeanId) => {
    const currentPath = window.location.pathname;
    // an toàn khi match; nếu không match thì fallback về /personal
    const orgMatch = currentPath.match(/^\/org\/[^\/]+/);
    const prefix = currentPath.startsWith('/org/') && orgMatch ? orgMatch[0] : '/personal';
    navigate(`${prefix}/gblist/${greenbeanId}`);
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const filteredGreenBeans = greenBeans
    .filter((bean) => {
      // Tìm kiếm theo tên, giống (variety_type), hoặc địa điểm
      const originInfo = origins[bean.origin_id];
      const searchLower = searchTerm.toLowerCase().trim();

      const matchesSearch = !searchTerm ||
        (bean.green_bean_name &&
          bean.green_bean_name.toLowerCase().includes(searchLower)) ||
        (bean.variety_type &&
          bean.variety_type.toLowerCase().includes(searchLower)) ||
        (bean.green_bean_code &&
          bean.green_bean_code.toLowerCase().includes(searchLower)) ||
        // Tìm kiếm theo địa điểm - country
        (originInfo?.country &&
          originInfo.country.toLowerCase().includes(searchLower)) ||
        // Tìm kiếm theo địa điểm - region
        (originInfo?.region &&
          originInfo.region.toLowerCase().includes(searchLower));

      // Filter theo giống
      const matchesVariety =
        !filters.variety || bean.variety === filters.variety;

      // Filter theo mùa vụ
      const matchesCropYear =
        !filters.cropYear ||
        bean.crop_year?.toString().includes(filters.cropYear);

      // Filter theo vùng (country)
      const matchesCountry =
        !filters.country ||
        origins[bean.origin_id]?.country === filters.country;

      // Filter theo khoảng thời gian
      let matchesDateRange = true;
      if (filters.startDate || filters.endDate) {
        const beanDate = new Date(bean.created_dt || bean.created_at);
        if (filters.startDate) {
          const fromDate = new Date(filters.startDate);
          matchesDateRange = matchesDateRange && beanDate >= fromDate;
        }
        if (filters.endDate) {
          const toDate = new Date(filters.endDate);
          toDate.setHours(23, 59, 59, 999);
          matchesDateRange = matchesDateRange && beanDate <= toDate;
        }
      }

      return (
        matchesSearch &&
        matchesVariety &&
        matchesCropYear &&
        matchesCountry &&
        matchesDateRange
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at || a.created_dt);
      const dateB = new Date(b.created_at || b.created_dt);
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  if (showForm) {
    return (
      <AddGreenBeanForm
        onBack={handleFormBack}
        onSubmit={handleFormSubmit}
        selectedContext={selectedContext}
      />
    );
  }

  return (
    <div className="gb_green-beans-container">
      <div className="gb_green-beans-wrapper">
        <div className="gb_green-beans-header">
          <div className="gb_green-beans-title-section">
            <div className="gb_green-beans-icon">
              <LeafIcon color="#09B04B" opacity={0.6} size={32} />
            </div>
            <div>
              <h1 className="gb_green-beans-title">{t('greenBeans.title')}</h1>
              <p className="gb_green-beans-subtitle">
                {t('greenBeans.subtitle') || 'Quản lý thông tin giống, vùng trồng, sơ chế'}
              </p>
            </div>
          </div>
          {canCreate("green_bean") && (
            <div className="gb_header-buttons">
              <button
                className="gb_green-beans-add-button"
                onClick={handleAddClick}
              >
                + {t('common.create')}
              </button>
            </div>
          )}
        </div>

        <div className="gb_green-beans-content">
          <div className="gb_session-controls">
            <div className="gb_search-container">
              <span className="gb_search-icon">
                <SearchIcon color="#666" size={16} />
              </span>
              <input
                type="text"
                placeholder={t('greenBeans.searchPlaceholder') || 'Tìm kiếm theo tên, mã, địa điểm...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="gb_search-input"
              />
            </div>
            <div className="gb_filter-controls">
              <button
                className="gb_filter-btn"
                onClick={() => setShowFilterModal(true)}
              >
                <FilterIcon size={14} color="#666" />
                {t('common.filter')}
              </button>
              <button
                className="gb_sort-btn"
                onClick={() =>
                  setSortOrder(sortOrder === "newest" ? "oldest" : "newest")
                }
              >
                <SortIcon size={14} color="#666" />
                {t('common.date')} ({sortOrder === "newest" ? t('common.newest') || 'mới nhất' : t('common.oldest') || 'cũ nhất'})
              </button>
            </div>
          </div>
          <div className="gb_green-beans-list">
            {loading ? (
              <div className="gb_loading">{t('common.loading')}</div>
            ) : (
              (() => {
                const totalPages = Math.ceil(
                  filteredGreenBeans.length / itemsPerPage
                );
                const startIndex = (currentPage - 1) * itemsPerPage;
                const paginatedBeans = filteredGreenBeans.slice(
                  startIndex,
                  startIndex + itemsPerPage
                );

                if (filteredGreenBeans.length === 0) {
                  return (
                    <div className="gb_green-beans-empty-state">
                      <div className="gb_green-beans-empty-icon">
                        <LeafIcon color="#09B04B" opacity={0.3} size={120} />
                      </div>
                      <h2 className="gb_green-beans-empty-title">
                        {t('greenBeans.noGreenBeans') || 'Chưa có nhân xanh nào'}
                      </h2>
                      <p className="gb_green-beans-empty-description">
                        {searchTerm
                          ? `${t('greenBeans.noResultsFor')} "${searchTerm}"`
                          : t('greenBeans.createFirstGreenBean') || 'Tạo nhân xanh đầu tiên để bắt đầu quản lý thông tin giống cà phê'
                        }
                      </p>
                      {searchTerm && (
                        <button
                          className="gb_clear-search-btn"
                          onClick={() => setSearchTerm("")}
                        >
                          {t('greenBeans.clearSearch') || 'Xóa tìm kiếm'}
                        </button>
                      )}
                    </div>
                  );
                }

                return (
                  <>
                    {paginatedBeans.map((bean) => (
                      <div
                        key={bean.uuid}
                        className="gb_green-bean-card"
                        onClick={() => handleCardClick(bean.uuid)}
                      >
                        <div className="gb_bean-icon">
                          <LeafIcon color="#09B04B" size={24} />
                        </div>
                        <div className="gb_bean-info">
                          <div className="gb_bean-main-info">
                            <h3 className="gb_bean-name">{bean.green_bean_name}</h3>
                            <div className="gb_bean-details">
                              <span className="gb_detail-item">
                                <BeanIcon size={12} color="#6c757d" />{" "}
                                {bean.variety_type || bean.variety || 'N/A'}
                              </span>
                              <span className="gb_detail-item">
                                <RegionIcon size={12} color="#6c757d" />{" "}
                                {origins[bean.origin_id]?.region || "N/A"},{" "}
                                {origins[bean.origin_id]?.country || "N/A"}
                              </span>
                              <span className="gb_detail-item">
                                <AltitudeIcon size={12} color="#6c757d" />{" "}
                                {bean.altitude}m
                              </span>
                              <span className="gb_detail-item">
                                <YearIcon size={12} color="#6c757d" />{" "}
                                {bean.crop_year}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="gb_bean-meta">
                          <div className="gb_bean-id">
                            <span className="gb_id-label">{t('greenBeans.greenBeanCode')}</span>
                            <span className="gb_yellow-badge">{bean.green_bean_code || t('greenBeans.noCode') || 'Chưa có'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {totalPages > 1 && (
                      <div className="gb_pagination">
                        <button
                          className="gb_pagination-btn"
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={currentPage === 1}
                        >
                          {t('common.previous')}
                        </button>
                        <span className="gb_pagination-info">
                          {t('common.page')} {currentPage} / {totalPages} (
                          {filteredGreenBeans.length} {t('greenBeans.items') || 'nhân xanh'})
                        </span>
                        <button
                          className="gb_pagination-btn"
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages)
                            )
                          }
                          disabled={currentPage === totalPages}
                        >
                          {t('common.next')}
                        </button>
                      </div>
                    )}
                  </>
                );
              })()
            )}
          </div>
        </div>
      </div>

      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
        initialFilters={filters}
        filterType="greenbean"
        greenBeans={greenBeans}
        origins={origins}
      />

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={handleImportSuccess}
        selectedContext={selectedContext}
      />


    </div>
  );
};

export default GreenBeans;