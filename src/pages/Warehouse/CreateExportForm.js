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
  const [greenBeans, setGreenBeans] = useState([]);
  const [showGreenBeanModal, setShowGreenBeanModal] = useState(false);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [nextTicketCode, setNextTicketCode] = useState('');

  const [rows, setRows] = useState([{
    selectedGreenBean: null,
    weight: '',
    reason: 'sales'
  }]);
  const [currentUser, setCurrentUser] = useState(null);

  const handleAddRow = () => {
    setRows([...rows, {
      selectedGreenBean: null,
      weight: '',
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
    loadGreenBeans();
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

  const loadGreenBeans = async () => {
    try {
      const policyResponse = await policyApi.getUserPolicy(selectedContext);
      const policyId = policyResponse?.data?.uuid;
      if (!policyId) return;
      const response = await fetch(`${API_BASE_URL}/greenbeans?policy_id=${policyId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setGreenBeans(data.data || []);
      }
    } catch (error) {
      console.error('Error loading green beans:', error);
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

  const getAvailableStock = (greenBeanId) => {
    const total = batches
      .filter(b => b.green_bean_id === greenBeanId && b.weight > 0)
      .reduce((sum, b) => sum + (parseFloat(b.weight) || 0), 0);
    return total;
  };

  const filteredGreenBeans = greenBeans.filter(gb =>
    gb.green_bean_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].selectedGreenBean) {
        showToast(`Vui lòng chọn nhân xanh cho dòng ${i + 1}`, 'error');
        return;
      }
      if (!rows[i].weight) {
        showToast(`Vui lòng nhập khối lượng cho dòng ${i + 1}`, 'error');
        return;
      }
    }

    try {
      const policyResponse = await policyApi.getUserPolicy(selectedContext);
      const policyId = policyResponse?.data?.uuid;

      const batchesForExport = [];

      for (const row of rows) {
        const greenBeanId = row.selectedGreenBean.uuid;
        const requestedWeight = parseFloat(row.weight);
        const availableStock = getAvailableStock(greenBeanId);

        if (requestedWeight > availableStock) {
          showToast(`Không đủ tồn kho cho ${row.selectedGreenBean.green_bean_name}. Tồn kho: ${availableStock}kg`, 'error');
          return;
        }

        const greenBeanBatches = batches
          .filter(b => b.green_bean_id === greenBeanId && b.weight > 0)
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        let remainingWeight = requestedWeight;

        for (const batch of greenBeanBatches) {
          if (remainingWeight <= 0) break;

          const exportQuantity = Math.min(batch.weight, remainingWeight);
          batchesForExport.push({
            batch_id: batch.uuid,
            quantity: exportQuantity,
            reason: row.reason
          });

          remainingWeight -= exportQuantity;
        }
      }

      const exportPayload = {
        export_date: formData.export_date,
        batches: batchesForExport,
        policy_id: policyId
      };

      await inventoryApi.createExportTicket(exportPayload);
      showToast('Tạo phiếu xuất kho thành công', 'success');
      if (onBack) onBack();
    } catch (error) {
      console.error('Error creating export ticket:', error);
      showToast(error.message || 'Có lỗi xảy ra khi tạo phiếu xuất kho', 'error');
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
          <h2>Tạo phiếu xuất kho</h2>
        </div>

        <form onSubmit={handleSubmit}>
          {/* General Information Section */}
          <div className="general-info-section">
          <h3 className="section-title">
            {t("warehouse.general_information")}
          </h3>
            <div className="info-grid">
              <div className="info-field">
                <label>Mã phiếu</label>
                <input
                  type="text"
                  value={nextTicketCode}
                  readOnly
                  className="readonly-input"
                  placeholder="Đang tải..."
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
                  placeholder="Đang tải..."
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
                  <th>{t('warehouse.greenBeanName')}</th>
                  <th>{t('warehouse.weight')}</th>
                  <th>{t('warehouse.supplier')}</th>
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
                          setShowGreenBeanModal(true);
                        }}
                      >
                        {row.selectedGreenBean?.green_bean_name || t('warehouse.selectGreenBean')}
                      </button>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.weight}
                        onChange={(e) => handleRowChange(index, 'weight', e.target.value)}
                        className="input-field"
                        placeholder=""
                      />
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

      {showGreenBeanModal && (
        <div className="batch-modal-overlay" onClick={() => setShowGreenBeanModal(false)}>
          <div className="batch-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('warehouse.selectGreenBean')}</h3>
              <button onClick={() => setShowGreenBeanModal(false)}>×</button>
            </div>
            <input
              type="text"
              className="batch-search"
              placeholder={t('warehouse.searchGreenBeanPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            <div className="batch-list">
              {filteredGreenBeans.map(gb => (
                <div
                  key={gb.uuid}
                  className="batch-item"
                  onClick={() => {
                    handleRowChange(currentBatchIndex, 'selectedGreenBean', gb);
                    setShowGreenBeanModal(false);
                    setSearchTerm('');
                  }}
                >
                  <div className="batch-name">{gb.green_bean_name}</div>
                  <div className="batch-stock">Tồn kho: {Number(getAvailableStock(gb.uuid)).toFixed(2)}kg</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateExportForm;
