import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchIcon, FilterIcon, SortIcon } from '../../components/Icons';
import FilterModal from '../../components/FilterModal/FilterModal';
import './Warehouse.css';

const Warehouse = () => {
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
  });

  const handleTypeClick = (type) => {
    setSelectedType(selectedType === type ? null : type);
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setShowFilterModal(false);
  };

  return (
    <div className="warehouse-page">
      <div className="warehouse-wrapper">
        <div className="warehouse-header">
          <div className="warehouse-header-left">
            <div className="warehouse-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" fill="#0158A4"/>
              </svg>
            </div>
            <div className="warehouse-info">
              <h2>{t('warehouse.title')}</h2>
              <p>{t('warehouse.subtitle')}</p>
            </div>
          </div>
          <div className="warehouse-actions">
            <button 
              className={`action-btn ${selectedType === 'import' ? 'active' : ''}`}
              onClick={() => handleTypeClick('import')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t('warehouse.import')}
            </button>
            <button 
              className={`action-btn ${selectedType === 'export' ? 'active' : ''}`}
              onClick={() => handleTypeClick('export')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 14l5-5 5 5M12 9v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 9V5a2 2 0 00-2-2H5a2 2 0 00-2 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t('warehouse.export')}
            </button>
          </div>
        </div>

        <div className="warehouse-search-bar">
          <div className="warehouse-search">
            <span className="search-icon">
              <SearchIcon color="#666" size={16} />
            </span>
            <input 
              type="text" 
              placeholder={t('warehouse.searchPlaceholder')}
              className="search-input"
            />
          </div>
          <div className="warehouse-filters">
            <button className="filter-btn" onClick={() => setShowFilterModal(true)}>
              <FilterIcon size={14} color="#666" />
              {t('warehouse.filter')}
            </button>
            <button className="sort-btn">
              <SortIcon size={14} color="#666" />
              {t('warehouse.sort')}
            </button>
          </div>
        </div>

        {selectedType ? (
          <div className="warehouse-empty">
            <div className="empty-icon">
              <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" fill="#E5E7EB"/>
              </svg>
            </div>
            <h3>
              {selectedType === 'import' 
                ? t('warehouse.noImportReceipt')
                : t('warehouse.noExportReceipt')
              }
            </h3>
            <p>
              {selectedType === 'import'
                ? t('warehouse.noImportReceiptDesc')
                : t('warehouse.noExportReceiptDesc')
              }
            </p>
            <button className="create-warehouse-btn">
              + {selectedType === 'import'
                ? t('warehouse.createImportReceipt')
                : t('warehouse.createExportReceipt')
              }
            </button>
          </div>
        ) : (
          <div className="warehouse-empty">
            <div className="empty-icon">
              <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" fill="#E5E7EB"/>
              </svg>
            </div>
            <h3>{t('warehouse.noData')}</h3>
            <p>{t('warehouse.noDataDesc')}</p>
          </div>
        )}      </div>

      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
        initialFilters={filters}
        filterType="warehouse"
      />
    </div>
  );
};

export default Warehouse;
