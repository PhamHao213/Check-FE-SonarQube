import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { inventoryApi } from '../../api/inventoryApi';
import './Warehouse.css';

const WarehouseDetail = ({ selectedContext }) => {
  const { t } = useTranslation();
  const { ticket_id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelTooltip, setShowCancelTooltip] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [batches, setBatches] = useState([]);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    loadTicketDetail();
    loadUserPermissions();
    loadBatches();
    loadUserRole();
  }, [ticket_id]);

  const loadUserPermissions = () => {
    try {
      const permissions = JSON.parse(localStorage.getItem('user_permissions') || '[]');
      console.log('📋 User permissions loaded:', permissions);
      setUserPermissions(permissions);
    } catch (error) {
      console.error('Error loading permissions:', error);
    }
  };

  const loadUserRole = async () => {
    try {
      const { policyApi } = await import('../../api/policyApi');
      console.log('🔍 Loading user role with context:', selectedContext);
      const policyResponse = await policyApi.getUserPolicy(selectedContext);
      console.log('📦 Policy response:', policyResponse);

      // Nếu là personal policy (organization_id = null) thì luôn là owner
      const isPersonal = policyResponse?.data?.organization_id === null;
      const role = isPersonal ? 'owner' : null; // Với org sẽ cần fetch role từ role_id

      console.log('👤 Is personal:', isPersonal);
      console.log('👤 User role:', role);
      setUserRole(role);
    } catch (error) {
      console.error('❌ Error loading user role:', error);
    }
  };

  const hasPermission = (permission) => {
    const isOwner = userRole === 'owner';
    const isAdmin = userRole === 'admin';
    const hasExplicitPermission = userPermissions.includes(permission);
    const result = isOwner || isAdmin || hasExplicitPermission;

    console.log('🔐 Permission check:', {
      permission,
      userRole,
      isOwner,
      isAdmin,
      hasExplicitPermission,
      result
    });

    return result;
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
      if (!response.data) {
        const exportResponse = await inventoryApi.getExportTicketById(ticket_id);
        setTicket(exportResponse.data);
      } else {
        setTicket(response.data);
      }
    } catch (error) {
      console.error('Error loading ticket:', error);
    } finally {
      setLoading(false);
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
      alert(t('warehouse.deleteError'));
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
      alert(t('warehouse.cancelSuccess'));
    } catch (error) {
      console.error('❌ Error canceling ticket:', error);
      alert(error.message || t('warehouse.cancelError'));
    }
  };

  const handleUpdate = async (formData) => {
    console.log('📝 Update ticket:', {
      ticket_id,
      ticket_type: ticket.ticket_type,
      isImport: ticket.ticket_type,
      formData
    });
    try {
      if (ticket.ticket_type) {
        console.log('➡️ Calling updateImportTicket');
        const response = await inventoryApi.updateImportTicket(ticket_id, formData);
        console.log('✅ Import update response:', response);
      } else {
        console.log('➡️ Calling updateExportTicket');
        const response = await inventoryApi.updateExportTicket(ticket_id, formData);
        console.log('✅ Export update response:', response);
      }
      setShowEditModal(false);
      loadTicketDetail();
      loadBatches();
    } catch (error) {
      console.error('❌ Error updating ticket:', error);
      alert(t('warehouse.updateError'));
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
            <button
              className="action-btn"
              onClick={() => setShowEditModal(true)}
              style={{ background: '#0158A4' }}
              title={t('warehouse.editTicketTooltip')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t('common.edit')}
            </button>
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
          <div className="warehouse-info-section">
            <h3>{t('warehouse.information')}</h3>
            <div className="warehouse-info-grid">
              <div className="warehouse-info-item">
                <p className="warehouse-info-label">{t('warehouse.ticketCode')}</p>
                <p className="warehouse-info-value">{ticket.ticket_code}</p>
              </div>
              <div className="warehouse-info-item">
                <p className="warehouse-info-label">{t('warehouse.date')}</p>
                <p className="warehouse-info-value">
                  {new Date(ticket.created_date).toLocaleDateString()}
                </p>
              </div>
              <div className="warehouse-info-item">
                <p className="warehouse-info-label">{t('warehouse.type')}</p>
                <p className="warehouse-info-value">
                  {ticket.ticket_type ? t('warehouse.import') : t('warehouse.export')}
                </p>
              </div>
              <div className="warehouse-info-item">
                <p className="warehouse-info-label">{t('warehouse.status')}</p>
                <p className="warehouse-info-value" style={{
                  color: (ticket.is_cancel || ticket.is_cancelled) ? '#EF4444' : '#10B981'
                }}>
                  {(ticket.is_cancel || ticket.is_cancelled) ? t('warehouse.cancelled') : t('warehouse.active')}
                </p>
              </div>
            </div>
          </div>

          <div className="warehouse-info-section">
            <h3>{t('warehouse.details')}</h3>
            <table className="warehouse-details-table">
              <thead>
                <tr>
                  <th>{t('greenBeans.greenBean')}</th>
                  <th style={{ textAlign: 'right' }}>{t('warehouse.quantity')}</th>
                  {ticket.details?.[0]?.reason && (
                    <th>{t('warehouse.reason')}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {ticket.details?.map((detail, idx) => (
                  <tr key={idx}>
                    <td>{detail.green_bean_name || '-'}</td>
                    <td style={{ textAlign: 'right' }}>{detail.quantity} kg</td>
                    {detail.reason && (
                      <td>{detail.reason}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showEditModal && ticket && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('warehouse.editTicket')}</h2>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = {
                created_date: e.target.created_date.value
              };
              if (!ticket.ticket_type) {
                formData.reason = e.target.reason.value;
              }
              handleUpdate(formData);
            }}>
              <div className="form-group">
                <label>{t('warehouse.date')}</label>
                <input
                  type="date"
                  name="created_date"
                  defaultValue={ticket.created_date?.split('T')[0]}
                  required
                />
              </div>
              {!ticket.ticket_type && (
                <div className="form-group">
                  <label>{t('warehouse.reason')}</label>
                  <select
                    name="reason"
                    defaultValue={ticket.details?.[0]?.reason || 'sales'}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
                  >
                    <option value="sales">{t('warehouse.sales')}</option>
                    <option value="raw_materials">{t('warehouse.rawMaterials')}</option>
                    <option value="quality_control">{t('warehouse.qualityControl')}</option>
                  </select>
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowEditModal(false)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="submit-btn">
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
