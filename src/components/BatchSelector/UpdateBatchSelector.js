import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTimes } from 'react-icons/fa';
import { greenBeanBatchApi } from '../../api/cuppingSessionApi';

const UpdateBatchSelector = ({ isOpen, onClose, onSelect, selectedBatches = [] }) => {
  const { t } = useTranslation();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tempSelected, setTempSelected] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setTempSelected([...selectedBatches]);
      fetchBatches();
    }
  }, [isOpen, selectedBatches]);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const batchResponse = await greenBeanBatchApi.getAll();
      const batchesData = batchResponse.data || [];
      
      const formattedBatches = batchesData.map(batch => ({
        ...batch,
        uuid: batch.gb_batch_id || batch.uuid
      }));
      
      setBatches(formattedBatches);
    } catch (error) {
      // console.error('Error fetching batches:', error);
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleBatch = (batch) => {
    const batchId = batch.uuid || batch.gb_batch_id;
    const isSelected = tempSelected.some(b => (b.uuid || b.gb_batch_id) === batchId);
    if (isSelected) {
      setTempSelected(tempSelected.filter(b => (b.uuid || b.gb_batch_id) !== batchId));
    } else {
      setTempSelected([...tempSelected, { ...batch, uuid: batchId }]);
    }
  };

  const handleConfirm = () => {
    onSelect(tempSelected);
    onClose();
  };

  if (!isOpen) return null;

  return (
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
        borderRadius: '8px',
        width: '600px',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{margin: 0}}>{t('auto.chn_batch_nhn_x_25')}</h3>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer'
          }}>
            <FaTimes />
          </button>
        </div>

        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px'
        }}>
          {loading ? (
            <div>{t('auto.ang_ti_26')}</div>
          ) : batches.length === 0 ? (
            <div>{t('auto.cha_c_batch_no__28')}</div>
          ) : (
            <div>
              {batches.map((batch, index) => {
                const batchId = batch.uuid || batch.gb_batch_id;
                const isSelected = tempSelected.some(b => (b.uuid || b.gb_batch_id) === batchId);
                return (
                  <div
                    key={batchId || index}
                    onClick={() => toggleBatch(batch)}
                    style={{
                      padding: '12px',
                      margin: '8px 0',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: isSelected ? '#e3f2fd' : '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{fontWeight: 'bold', marginBottom: '4px'}}>
                        Batch {batch.gb_batch_id} - {batch.greenbean_name || 'Chưa có tên'}
                      </div>
                      <div style={{fontSize: '12px', color: '#666'}}>
                        Giống: {batch.variety || 'N/A'} | NCC: {batch.vendor_name || 'N/A'}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleBatch(batch)}
                      style={{marginLeft: '10px'}}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{
          padding: '20px',
          borderTop: '1px solid #eee',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px'
        }}>
          <button onClick={onClose} style={{
            padding: '8px 16px',
            border: '1px solid #ddd',
            backgroundColor: 'white',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>{t('auto.hy_31')}</button>
          <button onClick={handleConfirm} style={{
            padding: '8px 16px',
            border: 'none',
            backgroundColor: '#007bff',
            color: 'white',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            Xác nhận ({tempSelected.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateBatchSelector;