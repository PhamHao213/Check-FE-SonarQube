import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './CreateImportModal.css';

const CreateImportModal = ({ isOpen, onClose, onSubmit, batches = [] }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    created_date: new Date().toISOString().split('T')[0],
    batches: [],
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        created_date: new Date().toISOString().split('T')[0],
        batches: [],
      });
    }
  }, [isOpen]);

  const handleAddBatch = () => {
    setFormData(prev => ({
      ...prev,
      batches: [...prev.batches, { batch_id: '', quantity: '' }]
    }));
  };

  const handleRemoveBatch = (index) => {
    setFormData(prev => ({
      ...prev,
      batches: prev.batches.filter((_, i) => i !== index)
    }));
  };

  const handleBatchChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      batches: prev.batches.map((batch, i) => 
        i === index ? { ...batch, [field]: value } : batch
      )
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('warehouse.createImportReceipt')}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('warehouse.importDate')}</label>
            <input
              type="date"
              value={formData.created_date}
              onChange={(e) => setFormData({ ...formData, created_date: e.target.value })}
              required
            />
          </div>

          <div className="batches-section">
            <div className="batches-header">
              <label>{t('warehouse.batches')}</label>
              <button type="button" className="add-batch-btn" onClick={handleAddBatch}>
                + {t('warehouse.addBatch')}
              </button>
            </div>

            {formData.batches.map((batch, index) => (
              <div key={index} className="batch-item">
                <select
                  value={batch.batch_id}
                  onChange={(e) => handleBatchChange(index, 'batch_id', e.target.value)}
                  required
                >
                  <option value="">{t('warehouse.selectBatch')}</option>
                  {batches.map(b => (
                    <option key={b.uuid} value={b.uuid}>
                      {b.batch_code} - {b.green_bean_name}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  placeholder={t('warehouse.quantity') + ' (kg)'}
                  value={batch.quantity}
                  onChange={(e) => handleBatchChange(index, 'quantity', e.target.value)}
                  min="0.01"
                  step="0.01"
                  required
                />

                <button type="button" className="remove-btn" onClick={() => handleRemoveBatch(index)}>
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="submit-btn" disabled={formData.batches.length === 0}>
              {t('common.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateImportModal;
