import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, FilterIcon, SortIcon } from '../../components/Icons';
import FilterModal from '../../components/FilterModal/FilterModal';
import CreateImportForm from './CreateImportForm';
import CreateExportForm from './CreateExportForm';
import { inventoryApi } from '../../api/inventoryApi';
import { batchApi } from '../../api/batchApi';
import { policyApi } from '../../api/policyApi';
import './Warehouse.css';

const Warehouse = ({ selectedContext, onDisableOrgSwitch }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [showExportForm, setShowExportForm] = useState(false);
  const [batches, setBatches] = useState([]);
  const [importTickets, setImportTickets] = useState([]);
  const [exportTickets, setExportTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortOrder, setSortOrder] = useState('newest');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    ticketType: ''
  });

  useEffect(() => {
    if (onDisableOrgSwitch) {
      onDisableOrgSwitch(showImportForm || showExportForm);
    }
  }, [showImportForm, showExportForm, onDisableOrgSwitch]);

  useEffect(() => {
    loadBatches();
    loadImportTickets();
    loadExportTickets();
  }, [selectedContext]);

  const loadBatches = async () => {
    try {
      const response = await batchApi.getAllBatches(selectedContext);
      setBatches(response.data || []);
    } catch (error) {
      console.error('Error loading batches:', error);
    }
  };

  const loadImportTickets = async () => {
    try {
      setLoading(true);
      const policyResponse = await policyApi.getUserPolicy(selectedContext);
      const policyId = policyResponse?.data?.uuid;
      const organizationId = selectedContext?.type === 'organization' ? selectedContext.uuid : null;
      const response = await inventoryApi.getAllImportTickets(policyId, organizationId);
      setImportTickets(response.data || []);
    } catch (error) {
      console.error('Error loading import tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExportTickets = async () => {
    try {
      setLoading(true);
      const policyResponse = await policyApi.getUserPolicy(selectedContext);
      const policyId = policyResponse?.data?.uuid;
      const response = await inventoryApi.getAllExportTickets(policyId);
      setExportTickets(response.data || []);
    } catch (error) {
      console.error('Error loading export tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportClick = () => {
    setShowImportForm(true);
  };

  const handleExportClick = () => {
    setShowExportForm(true);
  };

  const handleBackToList = () => {
    setShowImportForm(false);
    setShowExportForm(false);
    loadImportTickets();
    loadExportTickets();
    loadBatches();
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setShowFilterModal(false);
    setCurrentPage(1);
  };

  const allTickets = [...importTickets, ...exportTickets]
    .filter(ticket => {
      if (filters.ticketType === '') return true;
      if (filters.ticketType === 'import') return ticket.ticket_type === true || ticket.ticket_type === 1 || ticket.ticket_type === '1';
      if (filters.ticketType === 'export') return ticket.ticket_type === false || ticket.ticket_type === 0 || ticket.ticket_type === '0';
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_date);
      const dateB = new Date(b.created_date);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const totalPages = Math.ceil(allTickets.length / itemsPerPage);
  const currentTickets = allTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (showImportForm) {
    return <CreateImportForm onBack={handleBackToList} selectedContext={selectedContext} />;
  }

  if (showExportForm) {
    return <CreateExportForm onBack={handleBackToList} selectedContext={selectedContext} />;
  }

  return (
    <div className="warehouse-page">
      <div className="warehouse-wrapper">
        <div className="warehouse-header">
          <div className="warehouse-header-left">
            <div className="warehouse-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" fill="#0158A4" />
              </svg>
            </div>
            <div className="warehouse-info">
              <h2>{t('warehouse.title')}</h2>
              <p>{t('warehouse.subtitle')}</p>
            </div>
          </div>
          <div className="warehouse-actions">
            <button
              className="action-btn"
              onClick={handleImportClick}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t('warehouse.import')}
            </button>
            <button
              className="action-btn"
              onClick={handleExportClick}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 14l5-5 5 5M12 9v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 9V5a2 2 0 00-2-2H5a2 2 0 00-2 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
            <button className="sort-btn" onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}>
              <SortIcon size={14} color="#666" />
              {t('warehouse.date')}: {sortOrder === 'newest' ? t('warehouse.descending') : t('warehouse.ascending')}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="warehouse-empty">
            <p>{t('common.loading')}</p>
          </div>
        ) : importTickets.length > 0 || exportTickets.length > 0 ? (
          <>
            <div className="tickets-list">
              {currentTickets.map(ticket => (
                <div key={ticket.id} className="ticket-card" onClick={() => navigate(`${ticket.id}`)}>
                  <div className="ticket-card-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" fill="#0158A4" />
                    </svg>
                  </div>
                  <div className="ticket-info">
                    <div className="ticket-main-info">
                      <h3 className="ticket-name" title={ticket.ticket_code}>{ticket.ticket_code}</h3>
                      <div className="ticket-details">
                        <span className="ticket-detail-item" style={{ color: ticket.ticket_type ? '#10B981' : '#EF4444' }}>
                          {t('warehouse.type')}: {ticket.ticket_type ? t('warehouse.import1') : t('warehouse.export1')}
                        </span>
                        <span className="ticket-detail-item">
                          {t('warehouse.date')}: {new Date(ticket.created_date).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="cs_pagination">
                <button
                  className="cs_pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  {t('common.previous')}
                </button>
                <span className="cs_pagination-info">
                  {t('common.page')} {currentPage} / {totalPages} ({allTickets.length})
                </span>
                <button
                  className="cs_pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  {t('common.next')}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="warehouse-empty">
            <div className="empty-icon">
              <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" fill="#E5E7EB" />
              </svg>
            </div>
            <h3>{t('warehouse.noData')}</h3>
            <p>{t('warehouse.noDataDesc')}</p>
          </div>
        )}
      </div>

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
