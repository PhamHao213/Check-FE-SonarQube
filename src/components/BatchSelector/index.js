import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './BatchSelector.css';
import { FaTimes, FaSearch, FaFilter } from 'react-icons/fa';
import { batchApi } from '../../api/batchApi';
import { API_BASE_URL } from '../../api/config';

const BatchSelector = ({ isOpen, onClose, onSelect, selectedBatches = [], disableDeselect = false, selectedContext }) => {
  const { t } = useTranslation();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tempSelected, setTempSelected] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');
  const [showDateFilters, setShowDateFilters] = useState(false);

  useEffect(() => {
    if (isOpen) {
   
      setTempSelected([...selectedBatches]);
      setSearchTerm('');
      setStartDate('');
      setEndDate('');
      setAppliedStartDate('');
      setAppliedEndDate('');
      setShowDateFilters(false);
      fetchBatches();
    }
  }, [isOpen, selectedBatches]);

  // Separate useEffect to sync tempSelected when batches are loaded
  useEffect(() => {
    if (isOpen && batches.length > 0 && selectedBatches.length > 0) {


      // Find matching batches from the loaded batches list
      const matchingBatches = selectedBatches.map(selectedBatch => {
        const match = batches.find(batch => {
          const batchId = batch.uuid || batch.gb_batch_id;
          const selectedId = selectedBatch.uuid || selectedBatch.gb_batch_id;
          return batchId === selectedId;
        });
        return match ? { ...match, number_of_sample_cup: selectedBatch.number_of_sample_cup } : selectedBatch;
      });


      setTempSelected(matchingBatches);
    }
  }, [batches, isOpen]);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      // Lấy policy_id của user hiện tại
      let currentPolicyId = null;
      try {
        const contextType = selectedContext?.type || 'personal';

        if (contextType === 'personal') {
          const policyResponse = await fetch(`${API_BASE_URL}/policies/personal`, {
            credentials: 'include',
            headers: {}
          });
          if (policyResponse.ok) {
            const policyData = await policyResponse.json();
            currentPolicyId = policyData.data?.uuid;
          }
        } else if (contextType === 'organization') {
          const policyResponse = await fetch(`${API_BASE_URL}/policies/organization/${selectedContext.uuid}`, {
            credentials: 'include',
            headers: {}
          });
          if (policyResponse.ok) {
            const policyData = await policyResponse.json();
            currentPolicyId = policyData.data?.uuid;
          }
        }
      } catch (error) {
        // console.error('Error getting policy_id:', error);
      }

      const batchResponse = await batchApi.getAllBatches(selectedContext);
      const batchesData = batchResponse.data || [];



      // Tạm thời bỏ qua client-side filtering để kiểm tra
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
    const wasOriginallySelected = selectedBatches.some(b => (b.uuid || b.gb_batch_id) === batchId);

    if (isSelected) {
      // Don't allow deselecting if disableDeselect is true and it was originally selected
      if (disableDeselect && wasOriginallySelected) {
        return;
      }
      setTempSelected(tempSelected.filter(b => (b.uuid || b.gb_batch_id) !== batchId));
    } else {
      // Preserve existing sample count if batch was previously selected
      const existingBatch = selectedBatches.find(b => (b.uuid || b.gb_batch_id) === batchId);
      const sampleCount = existingBatch?.number_of_sample_cup || 5;
      setTempSelected([...tempSelected, { ...batch, uuid: batchId, number_of_sample_cup: sampleCount }]);
    }
  };

  const updateSampleCount = (batchId, count) => {
    setTempSelected(tempSelected.map(batch =>
      (batch.uuid || batch.gb_batch_id) === batchId
        ? { ...batch, number_of_sample_cup: count }
        : batch
    ));
  };

  const toggleAll = () => {
    if (tempSelected.length === batches.length) {
      // When deselecting all, keep originally selected batches if disableDeselect is true
      if (disableDeselect) {
        setTempSelected([...selectedBatches]);
      } else {
        setTempSelected([]);
      }
    } else {
      const formattedBatches = batches.map(batch => ({
        ...batch,
        uuid: batch.gb_batch_id || batch.uuid
      }));
      setTempSelected(formattedBatches);
    }
  };

  const handleConfirm = () => {
    onSelect(tempSelected);
    onClose();
  };

  const filteredBatches = batches.filter(batch => {
    const matchesSearch = !searchTerm ||
      batch.green_bean_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.greenbean_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.variety?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.variety_type?.toLowerCase().includes(searchTerm.toLowerCase());

    // Date range filter
    let matchesDate = true;
    if (appliedStartDate || appliedEndDate) {
      const batchDate = new Date(batch.created_dt);
      if (appliedStartDate && batchDate < new Date(appliedStartDate)) matchesDate = false;
      if (appliedEndDate) {
        const endDateTime = new Date(appliedEndDate);
        endDateTime.setHours(23, 59, 59, 999); // Include the entire end date
        if (batchDate > endDateTime) matchesDate = false;
      }
    }

    return matchesSearch && matchesDate;
  });

  const uniqueVendors = [...new Set(batches.map(b => b.vendor_name).filter(Boolean))];

  if (!isOpen) return null;

  return (
    <div className="batch-selector-overlay">
      <div className="batch-selector-modal">
        <div className="batch-selector-header">
          <h3>{t('auto.chn_batch_nhn_x_33')}</h3>
          <button className="batch-selector-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="batch-selector-controls">
          <div className="batch-search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder={t('auto.tm_kim_tn_nhn_x_46')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button
            className="batch-filter-btn"
            onClick={() => setShowDateFilters(!showDateFilters)}
          >
            <FaFilter />
          </button>
        </div>

        {showDateFilters && (
          <div className="batch-date-filters">
            <div className="date-filters">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setAppliedStartDate(e.target.value);
                }}
                className="date-input"
                placeholder={t('auto.t_ngy_47')}
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setAppliedEndDate(e.target.value);
                }}
                className="date-input"
                placeholder={t('auto.n_ngy_48')}
              />
            </div>
          </div>
        )}

        <div className="batch-selector-content">
          {loading ? (
            <div className="batch-selector-loading">{t('auto.ang_ti_34')}</div>
          ) : batches.length === 0 ? (
            <div className="batch-selector-empty">
              <p>{t('auto.cha_c_batch_no__36')}</p>
            </div>
          ) : filteredBatches.length === 0 ? (
            <div className="batch-selector-empty">
              <p>{t('auto.khng_tm_thy_bat_38')}</p>
            </div>
          ) : (
            <div className="batch-selector-table-container">
              <table className="batch-selector-table">
                <thead>
                  <tr>
                    <th>{t('auto.tn_nhn_xanh_40')}</th>
                    <th>{t('greenBeans.varietyLabel')}</th>
                    <th>{t('greenBeans.varietyTypeLabel')}</th>
                    <th>{t('auto.t_trng_43')}</th>
                    <th>{t('auto.ngy_to_44')}</th>
                    <th>
                      <input
                        type="checkbox"
                        checked={tempSelected.length === filteredBatches.length && filteredBatches.length > 0}
                        onChange={toggleAll}
                        className="batch-checkbox"
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBatches.map((batch, index) => {
                    const batchId = batch.uuid || batch.gb_batch_id;
                    const isSelected = tempSelected.some(b => {
                      const selectedId = b.uuid || b.gb_batch_id;
                      const match = selectedId === batchId || selectedId === batch.gb_batch_id || selectedId === batch.uuid;
                      if (index === 0) {
                      }
                      return match;
                    });
                    return (
                      <tr
                        key={`${batchId}-${index}`}
                        className={`batch-row ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleBatch(batch)}
                      >
                        <td className="batch-name">
                          {batch.green_bean_name || batch.greenbean_name || '-'}
                        </td>
                        <td>{batch.variety_type || '-'}</td>
                        <td>{batch.variety || '-'}</td>
                        <td>{batch.density || '-'} g/ml</td>
                        <td>
                          {batch.created_dt ?
                            new Date(batch.created_dt).toLocaleDateString('vi-VN') :
                            '-'
                          }
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleBatch(batch)}
                            className="batch-checkbox"
                            disabled={disableDeselect && selectedBatches.some(b => (b.uuid || b.gb_batch_id) === batchId)}
                            style={disableDeselect && selectedBatches.some(b => (b.uuid || b.gb_batch_id) === batchId) ? { opacity: 0.5 } : {}}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="batch-selector-footer">
          <button className="batch-selector-cancel" onClick={onClose}>{t('auto.hy_45')}</button>
          <button className="batch-selector-confirm" onClick={handleConfirm}>
            {t("modal.confirmTitle")} ({tempSelected.length})
          </button>
        </div>

      </div>
    </div>
  );
};

export default BatchSelector;