import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeftIcon, TrashIcon } from '../../components/Icons';
import { batchApi } from '../../api/batchApi';
import { policyApi } from '../../api/policyApi';
import { inventoryApi } from '../../api/inventoryApi';
import { showToast } from '../../components/Toast/Toast';
import './CreateExportForm.css';

const CreateExportForm = ({ onBack, selectedContext }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    export_date: new Date().toISOString().split('T')[0],
    batches: []
  });
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    loadBatches();
  }, [selectedContext]);

  const loadBatches = async () => {
    try {
      const response = await batchApi.getAllBatches(selectedContext);
      setBatches(response.data || []);
    } catch (error) {
      console.error('Error loading batches:', error);
    }
  };

  const handleAddBatch = () => {
    setFormData(prev => ({
      ...prev,
      batches: [...prev.batches, { batch_id: '', quantity: '', reason: 'sales' }]
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

  const getBatchStock = (batchId) => {
    const batch = batches.find(b => b.uuid === batchId);
    return batch ? batch.weight : 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const policyResponse = await policyApi.getUserPolicy(selectedContext);
      const policyId = policyResponse?.data?.uuid;
      await inventoryApi.createExportTicket({ ...formData, policy_id: policyId });
      showToast(t('warehouse.createExportSuccess'), 'success');
      if (onBack) onBack();
    } catch (error) {
      console.error('Error creating export ticket:', error);
      showToast(t('warehouse.createError'), 'error');
    }
  };

  return (
    <div className="create-export-form">
      <div className="form-wrapper">
        <button className="back-button" onClick={onBack}>
          <ArrowLeftIcon size={20} />
          {t('common.back')}
        </button>

        <div className="form-header">
          <h2>{t('warehouse.createExportReceipt')}</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <div className="form-group">
              <label>{t('warehouse.exportDate')}</label>
              <input
                type="date"
                value={formData.export_date}
                onChange={(e) => setFormData({ ...formData, export_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-section">
            <div className="section-header">
              <label>{t('warehouse.batches')}</label>
              <button type="button" className="add-button" onClick={handleAddBatch}>
                + {t('warehouse.addBatch')}
              </button>
            </div>

            {formData.batches.map((batch, index) => (
              <div key={index} className="batch-row">
                <select
                  value={batch.batch_id}
                  onChange={(e) => handleBatchChange(index, 'batch_id', e.target.value)}
                  required
                >
                  <option value="">{t('warehouse.selectBatch')}</option>
                  {batches.filter(b => b.weight > 0).map(b => (
                    <option key={b.uuid} value={b.uuid}>
                      {b.batch_code} - {b.green_bean_name} (Tồn: {b.weight}kg)
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  placeholder={t('warehouse.quantity')}
                  value={batch.quantity}
                  onChange={(e) => handleBatchChange(index, 'quantity', e.target.value)}
                  min="0.01"
                  step="0.01"
                  max={getBatchStock(batch.batch_id)}
                  required
                />

                <select
                  value={batch.reason}
                  onChange={(e) => handleBatchChange(index, 'reason', e.target.value)}
                >
                  <option value="sales">{t('warehouse.sales')}</option>
                  <option value="raw_materials">{t('warehouse.rawMaterials')}</option>
                  <option value="quality_control">{t('warehouse.qualityControl')}</option>
                </select>

                <button type="button" className="remove-button" onClick={() => handleRemoveBatch(index)}>
                  <TrashIcon size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-button" disabled={formData.batches.length === 0}>
              {t('common.create')}
            </button>
            <button type="button" className="cancel-button" onClick={onBack}>
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateExportForm;
