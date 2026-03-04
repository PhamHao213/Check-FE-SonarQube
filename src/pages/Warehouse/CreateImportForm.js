import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeftIcon, TrashIcon } from '../../components/Icons';
import { batchApi } from '../../api/batchApi';
import { policyApi } from '../../api/policyApi';
import { inventoryApi } from '../../api/inventoryApi';
import { showToast } from '../../components/Toast/Toast';
import './CreateImportForm.css';

const CreateImportForm = ({ onBack, selectedContext }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    created_date: new Date().toISOString().split('T')[0],
    batches: []
  });
  const [batches, setBatches] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

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

  const openBatchModal = (index) => {
    setCurrentBatchIndex(index);
    setSearchTerm('');
    setShowModal(true);
  };

  const openMultiBatchModal = () => {
    setCurrentBatchIndex(null);
    setSearchTerm('');
    setSelectedBatchIds([]);
    setShowModal(true);
  };

  const selectBatch = (batchId) => {
    handleBatchChange(currentBatchIndex, 'batch_id', batchId);
    setShowModal(false);
  };

  const toggleBatchSelection = (batchId) => {
    setSelectedBatchIds(prev =>
      prev.includes(batchId) ? prev.filter(id => id !== batchId) : [...prev, batchId]
    );
  };

  const addSelectedBatches = () => {
    const newBatches = selectedBatchIds.map(id => ({ batch_id: id, quantity: '' }));
    setFormData(prev => ({ ...prev, batches: [...prev.batches, ...newBatches] }));
    setShowModal(false);
  };

  const filteredBatches = batches.filter(b =>
    b.batch_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.green_bean_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const policyResponse = await policyApi.getUserPolicy(selectedContext);
      const policyId = policyResponse?.data?.uuid;
      await inventoryApi.createImportTicket({ ...formData, policy_id: policyId });
      showToast(t('warehouse.createImportSuccess'), 'success');
      if (onBack) onBack();
    } catch (error) {
      console.error('Error creating import ticket:', error);
      showToast(t('warehouse.createError'), 'error');
    }
  };

  return (
    <div className="create-import-form">
      <div className="form-wrapper">
        <button className="back-button" onClick={onBack}>
          <ArrowLeftIcon size={20} />
          {t('common.back')}
        </button>

        <div className="form-header">
          <h2>{t('warehouse.createImportReceipt')}</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <div className="form-group">
              <label>{t('warehouse.importDate')}</label>
              <div className="date-input-wrapper">
                <input
                  type="date"
                  value={formData.created_date}
                  onChange={(e) => setFormData({ ...formData, created_date: e.target.value })}
                  required
                />
                <span className="date-display">{formatDateDisplay(formData.created_date)}</span>
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="section-header">
              <label>{t('warehouse.batches')}</label>
              <div className="header-buttons">
                <button type="button" className="add-button-single" onClick={handleAddBatch}>
                  + {t('warehouse.addBatch')}
                </button>
              </div>
            </div>

            {formData.batches.map((batch, index) => (
              <div key={index} className="batch-row">
                <div className="batch-select" onClick={() => openBatchModal(index)}>
                  {batch.batch_id ?
                    batches.find(b => b.uuid === batch.batch_id)?.green_bean_name
                    : t('warehouse.selectBatch')}
                </div>

                <input
                  type="number"
                  placeholder={t('warehouse.quantity') + ' (kg)'}
                  value={batch.quantity}
                  onChange={(e) => handleBatchChange(index, 'quantity', e.target.value)}
                  min="0.01"
                  step="0.01"
                  required
                />

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

      {showModal && (
        <div className="batch-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="batch-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('warehouse.selectBatch')}</h3>
              <button onClick={() => setShowModal(false)}>×</button>
            </div>
            <input
              type="text"
              className="batch-search"
              placeholder={t('warehouse.searchBatch')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            <div className="batch-list">
              {filteredBatches.map(b => (
                <div
                  key={b.uuid}
                  className={`batch-item ${currentBatchIndex === null && selectedBatchIds.includes(b.uuid) ? 'selected' : ''}`}
                  onClick={() => currentBatchIndex !== null ? selectBatch(b.uuid) : toggleBatchSelection(b.uuid)}
                >
                  {currentBatchIndex === null && (
                    <input
                      type="checkbox"
                      checked={selectedBatchIds.includes(b.uuid)}
                      onChange={() => toggleBatchSelection(b.uuid)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  <div className="batch-name">{b.green_bean_name}</div>
                </div>
              ))}
            </div>
            {currentBatchIndex === null && (
              <div className="modal-footer">
                <button className="confirm-button" onClick={addSelectedBatches} disabled={selectedBatchIds.length === 0}>
                  {t('common.add')} ({selectedBatchIds.length})
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateImportForm;
