import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { vendorApi } from '../../api/vendorApi';
import { ArrowLeftIcon, VendorIcon, EditIcon, TrashIcon } from '../../components/Icons';
import EditVendorForm from './EditVendorForm';
import './VendorDetail.css';

const VendorDetail = ({ vendorId, onBack, selectedContext, onBatchClick }) => {
  const { t } = useTranslation();
  const [vendor, setVendor] = useState(null);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const truncateName = (name, maxLength = 30) => {
    if (!name) return 'N/A';
    return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name;
  };

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        setLoading(true);
        setBatchesLoading(true);

        // Lấy thông tin vendor
        const vendorResponse = await vendorApi.getById(vendorId);
        setVendor(vendorResponse.data);

        // Lấy danh sách batches
        const batchesResponse = await vendorApi.getBatches(vendorId);
        setBatches(batchesResponse.data || []);

      } catch (error) {
        // console.error('Error fetching vendor data:', error);
      } finally {
        setLoading(false);
        setBatchesLoading(false);
      }
    };

    if (vendorId) {
      fetchVendorData();
    }
  }, [vendorId]);

  if (loading) {
    return <div className="vendor-detail-loading">{t('auto.ang_ti_476')}</div>;
  }

  if (!vendor) {
    return <div className="vendor-detail-error">{t('auto.khng_tm_thy_nh__477')}</div>;
  }

  return (
    <div className="vendor-detail-container">
      <div className="vendor-detail-wrapper">
        <button className="vendor-detail-back-button" onClick={onBack}>
          <ArrowLeftIcon size={16} />{t('auto.quay_li_478')}</button>

        <div className="vendor-detail-header">
          <div className="vendor-detail-icon">
            <VendorIcon color="#FBB217" size={48} />
          </div>
          <div className="vendor-detail-title-section">
            <h1 className="vendor-detail-title" title={vendor.name}>{vendor.name}</h1>
            <p className="vendor-detail-subtitle">{t('auto.chi_tit_thng_ti_479')}</p>
          </div>
          <div className="vendor-detail-actions">
            <button className="vendor-detail-edit-btn" onClick={() => setShowEditForm(true)}>
              <EditIcon size={14} color="#16a34a" />{t('auto.sa_480')}</button>
            <button className="vendor-detail-delete-btn" onClick={() => setShowDeleteConfirm(true)}>
              <TrashIcon size={14} color="#dc2626" />{t('auto.xa_481')}</button>
          </div>
        </div>

        <div className="vendor-detail-content">
          <div className="vendor-detail-card">
            <h2 className="vendor-detail-section-title">{t('auto.thng_tin_c_bn_482')}</h2>
            <div className="vendor-detail-info-grid">
              <div className="vendor-detail-info-item">
                <label>{t('auto.m_nh_cung_cp_483')}</label>
                <span>{vendor.vendor_code || t('common.notAvailable')}</span>
              </div>
              <div className="vendor-detail-info-item">
                <label>{t('auto.tn_nh_cung_cp_484')}</label>
                <span title={vendor.name}>{vendor.name || t('common.notAvailable')}</span>
              </div>
              <div className="vendor-detail-info-item">
                <label>{t('auto.a_ch_485')}</label>
                <span>{vendor.address || t('common.notAvailable')}</span>
              </div>
              <div className="vendor-detail-info-item">
                <label>{t('auto.s_in_thoi_486')}</label>
                <span>{vendor.phone_number || t('common.notAvailable')}</span>
              </div>
              <div className="vendor-detail-info-item">
                <label>{t('auto.email_487')}</label>
                <span>{vendor.email || t('common.notAvailable')}</span>
              </div>
              <div className="vendor-detail-info-item">
                <label>{t('auto.lin_kt_lin_h_488')}</label>
                <span>
                  {vendor.contact_link ? (
                    <a href={vendor.contact_link} target="_blank" rel="noopener noreferrer">
                      {vendor.contact_link}
                    </a>
                  ) : (
                    t('common.notAvailable')
                  )}
                </span>
              </div>
              <div className="vendor-detail-info-item">
                <label>{t('auto.ngy_to_489')}</label>
                <span>
                  {vendor.created_dt
                    ? new Date(vendor.created_dt).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="vendor-detail-card">
            <h2 className="vendor-detail-section-title">
              {t('vendor.greenBeanBatch')} ({batches.length})
            </h2>

            {batchesLoading ? (
              <div className="vendor-batches-loading">{t('auto.ang_ti_danh_sch_490')}</div>
            ) : batches.length > 0 ? (
              <div className="vendor-batches-grid">
                {batches.map((batch) => (
                  <div
                    key={batch.uuid}
                    className="vendor-batch-card"
                    onClick={() => onBatchClick && onBatchClick(batch.uuid)}
                  >
                    {/* <div className="vendor-batch-header">
                      <h3 className="vendor-batch-code">{batch.green_bean_batch_code}</h3>
                      {batch.is_sample && <span className="vendor-batch-sample-badge">Sample</span>}
                    </div> */}
                    <div className="vendor-batch-info">
                      <p><strong>{t('auto.nhn_xanh_492')}</strong> {batch.green_bean_name || 'Chưa có thông tin'}</p>
                      <p><strong>{t('auto.ging_493')}</strong> {batch.variety || 'N/A'}</p>
                      <p><strong>{t('auto.x_l_494')}</strong> {batch.processing || 'N/A'}</p>
                      <p><strong>{t('auto.trng_lng_495')}</strong> {batch.weight ? `${batch.weight} kg` : 'N/A'}</p>
                      <p><strong>{t('auto._m_496')}</strong> {batch.moisture ? `${batch.moisture}%` : 'N/A'}</p>
                    </div>
                    <div className="vendor-batch-date">
                      {batch.created_dt ? new Date(batch.created_dt).toLocaleDateString('vi-VN') : ''}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="vendor-no-batches">
                <p>{t('auto.cha_c_l_nhn_xan_498')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showEditForm && (
        <EditVendorForm
          vendor={vendor}
          onClose={() => setShowEditForm(false)}
          onSuccess={() => {
            setShowEditForm(false);
            // Reload vendor data
            const fetchVendorData = async () => {
              try {
                const vendorResponse = await vendorApi.getById(vendorId);
                setVendor(vendorResponse.data);
              } catch (error) {
                // console.error('Error fetching vendor data:', error);
              }
            };
            fetchVendorData();
          }}
        />
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
            <h3 style={{ margin: '0 0 16px 0' }}>{t('auto.xc_nhn_xa_499')}</h3>
            <p style={{ margin: '0 0 24px 0' }}>
              {t('vendor.confirmDeleteVendor', { name: vendor.name })}
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
              >{t('auto.hy_500')}</button>
              <button
                onClick={async () => {
                  try {
                    await vendorApi.delete(vendorId);
                    onBack && onBack();
                  } catch (error) {
                    // console.error('Error deleting vendor:', error);
                  }
                }}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  background: '#dc2626',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >{t('auto.xa_501')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDetail;