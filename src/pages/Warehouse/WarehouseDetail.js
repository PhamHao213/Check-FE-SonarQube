import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { inventoryApi } from '../../api/inventoryApi';
import { API_BASE_URL } from '../../api/config';
import { showToast } from '../../components/Toast/Toast';
import './Warehouse.css';

const WarehouseDetail = ({ selectedContext }) => {
  const { t } = useTranslation();
  const { ticket_id } = useParams();
  const navigate = useNavigate();

  // Helper function to translate backend values
  const translateReason = (reason) => {
    const reasonMap = {
      'sales': t('warehouse.sales'),
      'raw_materials': t('warehouse.rawMaterials'),
      'quality_control': t('warehouse.qualityControl')
    };
    return reasonMap[reason] || reason;
  };
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelTooltip, setShowCancelTooltip] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [batches, setBatches] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [creatorName, setCreatorName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadTicketDetail();
    loadUserPermissions();
    loadBatches();
    loadUserRole();
  }, [ticket_id, selectedContext]);

  const loadUserPermissions = () => {
    try {
      const permissions = JSON.parse(localStorage.getItem('user_permissions') || '[]');

      setUserPermissions(permissions);
    } catch (error) {
      console.error('Error loading permissions:', error);
    }
  };

  const loadUserRole = async () => {
    try {
      const { policyApi } = await import('../../api/policyApi');

      const policyResponse = await policyApi.getUserPolicy(selectedContext);


      // Nếu là personal policy (organization_id = null) thì luôn là owner
      const isPersonal = policyResponse?.data?.organization_id === null;
      const role = isPersonal ? 'owner' : null; // Với org sẽ cần fetch role từ role_id


      setUserRole(role);
    } catch (error) {
      console.error('❌ Error loading user role:', error);
    }
  };

  const loadBatches = async () => {
    try {
      const { batchApi } = await import('../../api/batchApi');
      const response = await batchApi.getAllBatches();
      setBatches(response.data || []);
    } catch (error) {
      console.error('Error loading batches:', error);
    }
  };

  const loadTicketDetail = async () => {
    try {
      setLoading(true);
      const response = await inventoryApi.getImportTicketById(ticket_id);
      let ticketData;
      if (!response.data) {
        const exportResponse = await inventoryApi.getExportTicketById(ticket_id);
        ticketData = exportResponse.data;
      } else {
        ticketData = response.data;
      }
      console.log('Ticket data:', ticketData);
      setTicket(ticketData);
      
      // Load creator name - use current user since they created it
      await loadCurrentUserAsCreator();
    } catch (error) {
      console.error('Error loading ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUserAsCreator = async () => {
    try {
      const { userApi } = await import('../../api/userApi');
      const response = await userApi.getCurrentUser();
      console.log('Current user response:', response);
      const user = response.data || response;
      let name = '-';
      if (user.user_firstname && user.user_lastname) {
        name = `${user.user_firstname} ${user.user_lastname}`;
      } else if (user.user_name) {
        name = user.user_name;
      } else if (user.username) {
        name = user.username;
      }
      console.log('Creator name:', name);
      setCreatorName(name);
    } catch (error) {
      console.error('Error loading creator:', error);
      setCreatorName('-');
    }
  };

  const handleDelete = async () => {
    try {
      if (ticket.ticket_type) {
        await inventoryApi.deleteImportTicket(ticket_id);
      } else {
        await inventoryApi.deleteExportTicket(ticket_id);
      }
      navigate(-1);
    } catch (error) {
      console.error('Error deleting ticket:', error);
      showToast(t('warehouse.deleteError'), 'error');
    }
  };

  const handleCancelClick = () => {
    setShowCancelTooltip(!showCancelTooltip);
  };

  const handleConfirmCancel = async () => {
    try {
      await inventoryApi.cancelTicket(ticket_id);
      setTicket(prev => ({ ...prev, is_cancel: true, is_cancelled: true }));
      setShowCancelTooltip(false);
      showToast(t('warehouse.cancelSuccess'), 'success');
    } catch (error) {
      console.error('Error canceling ticket:', error);
      showToast(error.message || t('warehouse.cancelError'), 'error');
    }
  };

  if (loading) {
    return (
      <div className="warehouse-detail-container">
        <div className="warehouse-detail-wrapper">
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="warehouse-detail-container">
        <div className="warehouse-detail-wrapper">
          <p>{t('warehouse.notFound')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="warehouse-detail-container">
      <div className="warehouse-detail-wrapper">
        <button className="warehouse-detail-back-button" onClick={() => navigate(-1)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t('common.back')}
        </button>

        <div className="warehouse-detail-header">
          <div className="warehouse-detail-title-section">
            <div className="warehouse-detail-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" fill="#0158A4" />
              </svg>
            </div>
            <div>
              <h2 className="warehouse-detail-title">{ticket.ticket_code}</h2>
              <p className="warehouse-detail-subtitle">
                {ticket.ticket_type ? t('warehouse.importReceipt') : t('warehouse.exportReceipt')}
              </p>
            </div>
          </div>
          <div className="warehouse-detail-actions">
            <div style={{ position: 'relative' }}>
              <button
                className="action-btn"
                onClick={handleCancelClick}
                disabled={!!(ticket?.is_cancel || ticket?.is_cancelled)}
                style={{
                  background: (ticket?.is_cancel || ticket?.is_cancelled) ? '#9CA3AF' : '#F59E0B',
                  cursor: (ticket?.is_cancel || ticket?.is_cancelled) ? 'not-allowed' : 'pointer',
                  opacity: (ticket?.is_cancel || ticket?.is_cancelled) ? 0.6 : 1
                }}
                title={(ticket?.is_cancel || ticket?.is_cancelled) ? t('warehouse.alreadyCancelled') : t('warehouse.cancelTicketTooltip')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t('warehouse.cancelTicket')}
              </button>
              {showCancelTooltip && !(ticket?.is_cancel || ticket?.is_cancelled) && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  padding: '16px',
                  width: '320px',
                  zIndex: 1000
                }}>
                  <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#374151', lineHeight: '1.5' }}>
                    {t('warehouse.cancelTooltipText')}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConfirmCancel();
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: '#059669',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    {t('warehouse.confirmCancelTicket')}
                  </button>
                </div>
              )}
            </div>
            <button
              className="action-btn"
              onClick={() => setShowDeleteConfirm(true)}
              style={{ background: '#dc2626' }}
              title={t('warehouse.deleteTicketTooltip')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t('common.delete')}
            </button>
          </div>
        </div>

        <div className="warehouse-detail-content">
          {/* General Information Section */}
          <div className="general-info-section">
          <h3 className="section-title">
            {t("warehouse.general_information")}
          </h3>
            <div className="info-grid">
              <div className="info-field">
              <label>{t('warehouse.code')}</label>
                <input
                  type="text"
                  value={ticket.ticket_code}
                  readOnly
                  className="readonly-input"
                />
              </div>
              <div className="info-field">
              <label>
                {t("warehouse.created_date")}
              </label>
                <input
                  type="text"
                  value={new Date(ticket.created_date).toLocaleDateString('vi-VN')}
                  readOnly
                  className="readonly-input"
                />
              </div>
              <div className="info-field">
              <label>{t("warehouse.created_by")}</label>
                <input
                  type="text"
                  value={creatorName}
                  readOnly
                  className="readonly-input"
                />
              </div>
            </div>
          </div>

          {/* Detail Information Section */}
          <div className="detail-info-section">
          <h3 className="section-title">
            {t("warehouse.detail_information")}
          </h3>
          </div>
          <div className="detail-table">
            <table>
              <thead>
                <tr>
                  <th>{t('greenBeans.greenBean')}</th>
                  <th>{t('warehouse.quantity')}</th>
                  {ticket.details?.[0]?.reason && (
                    <th>{t('warehouse.reason')}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {ticket.details
                  ?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((detail, idx) => (
                    <tr key={idx}>
                      <td>{detail.green_bean_name || '-'}</td>
                      <td>{detail.quantity} {detail.unit || 'kg'}</td>
                      {detail.reason && (
                        <td>{translateReason(detail.reason)}</td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {ticket.details && ticket.details.length > itemsPerPage && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                {t('auto.trc_510')}
              </button>
              <span className="pagination-info">
                Trang {currentPage} / {Math.ceil(ticket.details.length / itemsPerPage)}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(ticket.details.length / itemsPerPage), prev + 1))}
                disabled={currentPage === Math.ceil(ticket.details.length / itemsPerPage)}
                className="pagination-btn"
              >
                {t('auto.trc_510')}
              </button>
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ margin: '0 0 16px 0' }}>{t('warehouse.confirmDelete')}</h3>
            <p style={{ margin: '0 0 24px 0' }}>
              {t('warehouse.confirmDeleteMessage', { code: ticket.ticket_code })}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >{t('common.cancel')}</button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  handleDelete();
                }}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  background: '#dc2626',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseDetail;
