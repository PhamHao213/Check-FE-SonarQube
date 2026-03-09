import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeftIcon, TrashIcon } from '../../components/Icons';
import { batchApi } from '../../api/batchApi';
import { policyApi } from '../../api/policyApi';
import { inventoryApi } from '../../api/inventoryApi';
import { userApi } from '../../api/userApi';
import { showToast } from '../../components/Toast/Toast';
import { API_BASE_URL } from '../../api/config';
import './CreateExportForm.css';

const CreateExportForm = ({ onBack, selectedContext }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    ticket_code: '',
    export_date: new Date().toISOString().split('T')[0],
    batches: []
  });
  const [batches, setBatches] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [nextTicketCode, setNextTicketCode] = useState('');

  const [rows, setRows] = useState([{
    selectedBatch: null,
    quantity: '',
    unit: 'Kg',
    reason: 'sales'
  }]);
  const [currentUser, setCurrentUser] = useState(null);

  const handleAddRow = () => {
    setRows([...rows, {
      selectedBatch: null,
      quantity: '',
      unit: 'Kg',
      reason: 'sales'
    }]);
  };

  const handleRemoveRow = (index) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  const handleRowChange = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);
  };

  useEffect(() => {
    loadBatches();
    loadCurrentUser();
    loadNextTicketCode();
  }, [selectedContext]);

  const loadBatches = async () => {
    try {
      const response = await batchApi.getAllBatches(selectedContext);
      setBatches(response.data || []);
    } catch (error) {
      console.error('Error loading batches:', error);
    }
  };

  const loadCurrentUser = async () => {
    try {
      const response = await userApi.getCurrentUser();
      console.log('Current user response:', response);
      setCurrentUser(response.data || response);
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadNextTicketCode = async () => {
    try {
      const policyResponse = await policyApi.getUserPolicy(selectedContext);
      const policyId = policyResponse?.data?.uuid;
      if (!policyId) return;
      
      const response = await inventoryApi.getAllExportTickets(policyId);
      const tickets = response.data || [];
      
      if (tickets.length === 0) {
        setNextTicketCode('PXK-0001');
      } else {
        const lastTicket = tickets[0];
        const lastCode = lastTicket.ticket_code;
        const match = lastCode.match(/PXK-(\d+)/);
        if (match) {
          const nextNum = parseInt(match[1]) + 1;
          setNextTicketCode(`PXK-${nextNum.toString().padStart(4, '0')}`);
        } else {
          setNextTicketCode('PXK-0001');
        }
      }
    } catch (error) {
      console.error('Error loading next ticket code:', error);
      setNextTicketCode('PXK-0001');
    }
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const filteredBatches = batches.filter(b =>
    b.batch_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.green_bean_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].selectedBatch) {
        showToast(t('warehouse.selectGreenBeanBatchToast', { row: i + 1 }), 'error');
        return;
      }
      if (!rows[i].quantity) {
        showToast(t('warehouse.enterWeightToast', { row: i + 1 }), 'error');
        return;
      }
    }

    try {
      const policyResponse = await policyApi.getUserPolicy(selectedContext);
      const policyId = policyResponse?.data?.uuid;

      const batchesForExport = rows.map(row => ({
        batch_id: row.selectedBatch.uuid,
        quantity: parseFloat(row.quantity),
        unit: row.unit,
        reason: row.reason
      }));

      const exportPayload = {
        export_date: formData.export_date,
        batches: batchesForExport,
        policy_id: policyId
      };

      await inventoryApi.createExportTicket(exportPayload);
      showToast(t('warehouse.exportSlipCreatedSuccess'), 'success');
      if (onBack) onBack();
    } catch (error) {
      console.error('Error creating export ticket:', error);
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
          <h2>{t("warehouse.createWarehouseExport")}</h2>
        </div>

        <form onSubmit={handleSubmit}>
          {/* General Information Section */}
          <div className="general-info-section">
          <h3 className="section-title">
            {t("warehouse.general_information")}
          </h3>
            <div className="info-grid">
              <div className="info-field">
                <label>{t("warehouse.receiptCode")}</label>
                <input
                  type="text"
                  value={nextTicketCode}
                  readOnly
                  className="readonly-input"
                  placeholder="Loading..."
                />
              </div>
              <div className="info-field">
              <label>
                {t("warehouse.created_date")} <span className="required">*</span>
              </label>
                <div className="date-input-wrapper">
                  <input
                    type="date"
                    value={formData.export_date}
                    onChange={(e) => setFormData({ ...formData, export_date: e.target.value })}
                    className="date-input"
                    required
                  />
            
                </div>
              </div>
              <div className="info-field">
              <label>{t("warehouse.created_by")}</label>
                <input
                  type="text"
                  value={currentUser ? (
                    (currentUser.user_firstname && currentUser.user_lastname) 
                      ? `${currentUser.user_firstname} ${currentUser.user_lastname}` 
                      : (currentUser.user_name || currentUser.username || '')
                  ) : ''}
                  readOnly
                  className="readonly-input"
                  placeholder="Loading..."
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
                  <th>{t("warehouse.greenBeanBatch")}<span className="required"> *</span></th>
                  <th>{t('warehouse.weight')}<span className="required"> *</span></th>
                  <th>{t('warehouse.unit')}<span className="required"> *</span></th>
                  <th>{t('warehouse.reason')}<span className="required"> *</span></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index}>
                    <td>
                      <button
                        type="button"
                        className="select-batch-button"
                        onClick={() => {
                          setCurrentBatchIndex(index);
                          setShowModal(true);
                        }}
                      >
                        {row.selectedBatch ? `${row.selectedBatch.green_bean_name}` : t("warehouse.selectGreenBeanBatch")}
                      </button>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.quantity}
                        onChange={(e) => handleRowChange(index, 'quantity', e.target.value)}
                        className="input-field"
                        placeholder=""
                      />
                    </td>
                    <td>
                      <select
                        value={row.unit || 'Kg'}
                        onChange={(e) => handleRowChange(index, 'unit', e.target.value)}
                        className="select-field"
                      >
                        <option value="Kg">Kg</option>
                        <option value="Gram">Gram</option>
                      </select>
                    </td>
                    <td>
                      <select
                        value={row.reason}
                        onChange={(e) => handleRowChange(index, 'reason', e.target.value)}
                        className="select-field"
                      >
                        <option value="sales">{t('warehouse.sales')}</option>
                        <option value="raw_materials">{t('warehouse.rawMaterials')}</option>
                        <option value="quality_control">{t('warehouse.qualityControl')}</option>
                      </select>
                    </td>
                    <td>
                      {rows.length > 1 && (
                        <button
                          type="button"
                          className="delete-row-btn"
                          onClick={() => handleRemoveRow(index)}
                        >
                          <TrashIcon size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-save" onClick={handleSubmit}>
              {t('common.saveInformation')}
            </button>

            <button type="button" className="btn-cancel" onClick={onBack}>
              {t('common.cancel')}
            </button>

            <button type="button" className="btn-add" onClick={handleAddRow}>
              {t('common.addRow')}
            </button>
          </div>
        </form>
      </div>

      {showModal && (
        <div className="batch-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="batch-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t("warehouse.selectGreenBeanBatch")}</h3>
              <button onClick={() => setShowModal(false)}>×</button>
            </div>
            <input
              type="text"
              className="batch-search"
              placeholder={t("warehouse.searchBatches")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            <div className="batch-list">
              <table className="batch-table">
                <thead>
                  <tr>
                    <th>{t('warehouse.greenBeanname')}</th>
                    <th>{t('warehouse.createdDate')}</th>
                    <th>{t('warehouse.vendor')}</th>
                    <th>{t('warehouse.inventory')}</th>
                    <th>{t('warehouse.unit')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBatches.map(b => (
                    <tr
                      key={b.uuid}
                      className="batch-row"
                      onClick={() => {
                        handleRowChange(currentBatchIndex, 'selectedBatch', b);
                        setShowModal(false);
                      }}
                    >
                      <td>{b.green_bean_name}</td>
                      <td>{b.created_dt ? formatDateDisplay(b.created_dt.split('T')[0]) : 'N/A'}</td>
                      <td>{b.vendor_name || 'N/A'}</td>
                      <td>{Number(b.weight || 0).toFixed(2)}</td>
                      <td>{b.unit || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateExportForm;
