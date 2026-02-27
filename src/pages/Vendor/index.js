import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './Vendor.css';
import { vendorApi } from '../../api/vendorApi';
import { policyApi } from '../../api/policyApi';
import { VendorIcon, SearchIcon, FilterIcon, SortIcon } from '../../components/Icons';
import AddVendorForm from './AddVendorForm';
import FilterModal from '../../components/FilterModal/FilterModal';
import ImportModal from '../../components/ImportModal/ImportModal';
import { canCreate, usePermissions } from '../../utils/permissions';

// Hàm băm ID vendor để bảo mật
const hashVendorId = (vendorId) => {
  return btoa(String(vendorId)).replace(/=/g, '');
};

// Hàm băm ID tổ chức để bảo mật
const hashOrgId = (orgId) => {
  return btoa(String(orgId)).replace(/=/g, '');
};

const Vendor = ({ selectedContext }) => {
  const { t } = useTranslation();
  const { permissions, role } = usePermissions();
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
  });


  const fetchVendors = async () => {
    try {
      setLoading(true);

      const policyResponse = await policyApi.getUserPolicy(selectedContext);
      const policyId = policyResponse.data.uuid;

      const response = await vendorApi.getAll(policyId);
      setVendors(response.data || []);
    } catch (error) {
      // console.error('Error fetching vendors:', error);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedContext) {
      fetchVendors();
    }
  }, [selectedContext]);

  const handleCreateClick = () => {
    setShowForm(true);
  };



  const handleImportSuccess = () => {
    fetchVendors();
    setShowImportModal(false);
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const filteredVendors = vendors
    .filter((vendor) => {
      const matchesSearch = !searchTerm ||
        vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.vendor_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.contact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.phone_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.address?.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesDateRange = true;
      if (filters.startDate || filters.endDate) {
        const vendorDate = new Date(vendor.created_dt);
        if (filters.startDate) {
          const fromDate = new Date(filters.startDate);
          matchesDateRange = matchesDateRange && vendorDate >= fromDate;
        }
        if (filters.endDate) {
          const toDate = new Date(filters.endDate);
          toDate.setHours(23, 59, 59, 999);
          matchesDateRange = matchesDateRange && vendorDate <= toDate;
        }
      }

      return matchesSearch && matchesDateRange;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_dt);
      const dateB = new Date(b.created_dt);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVendors = filteredVendors.slice(startIndex, startIndex + itemsPerPage);

  if (showForm) {
    return (
      <AddVendorForm
        onBack={() => setShowForm(false)}
        onSubmit={fetchVendors}
        selectedContext={selectedContext}
      />
    );
  }

  return (
    <div className="vendor-container">
      <div className="vendor-wrapper">
        <div className="vendor-header">
          <div className="vendor-title-section">
            <div className="vendor-icon">
              <VendorIcon color="#FBB217" opacity={0.6} size={32} />
            </div>
            <div>
              <h1 className="vendor-title">{t('auto.qun_l_nh_cung_c_502')}</h1>
              <p className="vendor-subtitle">{t('auto.qun_l_thng_tin__503')}</p>
            </div>
          </div>
          {canCreate("vendor") && (
            <div className="vendor-header-buttons">
              <button
                className="vendor-add-button"
                onClick={handleCreateClick}
              >
                {t('auto._to_391')}
              </button>
            </div>
          )}
        </div>

        <div className="vendor-content">
          <div className="vendor-controls">
            <div className="vendor-search-container">
              <span className="vendor-search-icon">
                <SearchIcon color="#666" size={16} />
              </span>
              <input
                type="text"
                placeholder={t('auto.tm_kim_theo_tn__512')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="vendor-search-input"
              />
            </div>
            <div className="vendor-filter-controls">
              <button
                className="vendor-filter-btn"
                onClick={() => setShowFilterModal(true)}
              >
                <FilterIcon size={14} color="#666" />{t('auto.b_lc_505')}</button>
              <button
                className="vendor-sort-btn"
                onClick={() =>
                  setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')
                }
              >
                <SortIcon size={14} color="#666" />
                {t('vendor.created_date')} (
                {sortOrder === 'newest'
                  ? t('vendor.newest')
                  : t('vendor.oldest')}
                )
              </button>
            </div>
          </div>

          <div className="vendor-list">
            {loading ? (
              <div className="vendor-loading">{t('auto.ang_ti_506')}</div>
            ) : filteredVendors.length === 0 ? (
              <div className="vendor-empty-state">
                <div className="vendor-empty-icon">
                  <VendorIcon color="#FBB217" opacity={0.3} size={120} />
                </div>
                <h2 className="vendor-empty-title">{t('auto.cha_c_nh_cung_c_507')}</h2>
                <p className="vendor-empty-description">{t('auto.danh_sch_nh_cun_508')}</p>
              </div>
            ) : (
              <>
                {paginatedVendors.map((vendor) => {
                  const handleVendorClick = () => {
                    const prefix = selectedContext?.type === 'organization'
                      ? `/org/${hashOrgId(selectedContext.uuid)}`
                      : '/personal';
                    navigate(`${prefix}/vendorlist/${hashVendorId(vendor.uuid)}`);
                  };

                  return (
                    <div key={vendor.uuid} className="vendor-card" onClick={handleVendorClick}>
                      <div className="vendor-card-icon">
                        <VendorIcon color="#FBB217" size={24} />
                      </div>
                      <div className="vendor-info">
                        <div className="vendor-main-info">
                          <h3 className="vendor-name" title={vendor.name}>{vendor.name || t('common.notAvailable') }</h3>
                          <div className="vendor-details">
                            <span className="vendor-detail-item">
                              {t('vendor.phone')}: {vendor.phone_number || t('common.notAvailable')}
                            </span>

                            <span className="vendor-detail-item">
                              {t('vendor.address')}: {vendor.address || t('common.notAvailable')}
                            </span>

                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {totalPages > 1 && (
                  <div className="vendor-pagination">
                    <button
                      className="vendor-pagination-btn"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >{t('auto.trc_510')}</button>
                    <span className="vendor-pagination-info">
                      Trang {currentPage} / {totalPages} ({filteredVendors.length} nhà cung cấp)
                    </span>
                    <button
                      className="vendor-pagination-btn"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >{t('auto.tip_511')}</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
        initialFilters={filters}
        filterType="vendor"
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

export default Vendor;