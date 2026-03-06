import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeftIcon, TrashIcon } from '../../components/Icons';
import { batchApi } from '../../api/batchApi';
import { policyApi } from '../../api/policyApi';
import { inventoryApi } from '../../api/inventoryApi';
import { userApi } from '../../api/userApi';
import { showToast } from '../../components/Toast/Toast';
import { API_BASE_URL } from '../../api/config';
import './CreateImportForm.css';

const CreateImportForm = ({ onBack, selectedContext }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    ticket_code: '',
    created_date: new Date().toISOString().split('T')[0],
    batches: []
  });
  const [batches, setBatches] = useState([]);
  const [nextTicketCode, setNextTicketCode] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Create new batch states
  const [showCreateBatchModal, setShowCreateBatchModal] = useState(false);
  const [greenBeans, setGreenBeans] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [origins, setOrigins] = useState([]);
  const [newBatchData, setNewBatchData] = useState({
    green_bean_id: '',
    vendor_id: ''
  });
  
  // Green bean creation states
  const [showCreateGreenBeanModal, setShowCreateGreenBeanModal] = useState(false);
  const [showOriginModal, setShowOriginModal] = useState(false);
  const [greenBeanData, setGreenBeanData] = useState({
    origin_id: '',
    green_bean_name: '',
    green_bean_code: '',
    variety: '',
    variety_type: '',
    processing: '',
    altitude: '',
    crop_year: ''
  });
  
  // Vendor creation states
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showCreateVendorModal, setShowCreateVendorModal] = useState(false);
  const [vendorData, setVendorData] = useState({
    name: '',
    address: '',
    phone_number: '',
    email: '',
    contact_link: ''
  });

  const [rows, setRows] = useState([{
    selectedBatch: null,
    quantity: ''
  }]);
  const [currentUser, setCurrentUser] = useState(null);

  const handleAddRow = () => {
    setRows([...rows, {
      selectedBatch: null,
      quantity: ''
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

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    loadBatches();
    loadGreenBeans();
    loadVendors();
    loadOrigins();
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

  const loadVendors = async () => {
    try {
      const policyResponse = await policyApi.getUserPolicy(selectedContext);
      const policyId = policyResponse?.data?.uuid;
      if (!policyId) return;
      const response = await fetch(`${API_BASE_URL}/vendors?policy_id=${policyId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setVendors(data.data || []);
      }
    } catch (error) {
      console.error('Error loading vendors:', error);
    }
  };

  const loadOrigins = async () => {
    try {
      const policyResponse = await policyApi.getUserPolicy(selectedContext);
      const policyId = policyResponse?.data?.uuid;
      if (!policyId) return;
      const response = await fetch(`${API_BASE_URL}/origins?policy_id=${policyId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setOrigins(data.data || []);
      }
    } catch (error) {
      console.error('Error loading origins:', error);
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
      
      const response = await inventoryApi.getAllImportTickets(policyId, selectedContext?.organizationId);
      const tickets = response.data || [];
      
      if (tickets.length === 0) {
        setNextTicketCode('PNK-0001');
      } else {
        const lastTicket = tickets[0];
        const lastCode = lastTicket.ticket_code;
        const match = lastCode.match(/PNK-(\d+)/);
        if (match) {
          const nextNum = parseInt(match[1]) + 1;
          setNextTicketCode(`PNK-${nextNum.toString().padStart(4, '0')}`);
        } else {
          setNextTicketCode('PNK-0001');
        }
      }
    } catch (error) {
      console.error('Error loading next ticket code:', error);
      setNextTicketCode('PNK-0001');
    }
  };

  const filteredBatches = batches.filter(b =>
    b.batch_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.green_bean_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateNewBatch = async () => {
    if (!newBatchData.green_bean_id) {
      showToast('Vui lòng chọn nhân xanh', 'error');
      return;
    }

    try {
      const policyResponse = await policyApi.getUserPolicy(selectedContext);
      const policyId = policyResponse?.data?.uuid;

      const batchPayload = {
        green_bean_id: newBatchData.green_bean_id,
        vendor_id: newBatchData.vendor_id || null,
        weight: 0,
        moisture: null,
        size: null,
        density: null,
        is_sample: false,
        policy_id: policyId
      };

      const response = await batchApi.createBatch(batchPayload, selectedContext);
      const newBatch = response.data;

      await loadBatches();
      handleRowChange(currentBatchIndex, 'selectedBatch', newBatch);
      setShowCreateBatchModal(false);
      setNewBatchData({ green_bean_id: '', vendor_id: '' });
      showToast('Tạo batch thành công', 'success');
    } catch (error) {
      console.error('Error creating batch:', error);
      showToast('Có lỗi xảy ra khi tạo batch', 'error');
    }
  };

  const handleCreateGreenBean = async () => {
    if (!greenBeanData.green_bean_name || !greenBeanData.origin_id || !greenBeanData.variety || !greenBeanData.processing || !greenBeanData.altitude || !greenBeanData.crop_year) {
      showToast('Vui lòng nhập đầy đủ thông tin bắt buộc', 'error');
      return;
    }

    try {
      const policyResponse = await policyApi.getUserPolicy(selectedContext);
      const policyId = policyResponse?.data?.uuid;

      const gbPayload = {
        ...greenBeanData,
        altitude: parseInt(greenBeanData.altitude, 10),
        variety_type: greenBeanData.variety_type || null,
        green_bean_code: greenBeanData.green_bean_code?.trim() || null,
        policy_id: policyId
      };

      const gbResponse = await fetch(`${API_BASE_URL}/greenbeans/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gbPayload)
      });

      if (!gbResponse.ok) throw new Error('Failed to create green bean');
      const gbResult = await gbResponse.json();
      const newGreenBeanId = gbResult.data?.greenbeanId;

      setNewBatchData({ ...newBatchData, green_bean_id: newGreenBeanId });
      await loadGreenBeans();
      showToast('Tạo nhân xanh thành công', 'success');
      setShowCreateGreenBeanModal(false);
    } catch (error) {
      console.error('Error creating green bean:', error);
      showToast('Có lỗi xảy ra khi tạo nhân xanh', 'error');
    }
  };

  const handleCreateVendor = async () => {
    if (!vendorData.name) {
      showToast('Vui lòng nhập tên nhà cung cấp', 'error');
      return;
    }

    try {
      const policyResponse = await policyApi.getUserPolicy(selectedContext);
      const policyId = policyResponse?.data?.uuid;

      const vendorPayload = { ...vendorData, policy_id: policyId };
      const vendorResponse = await fetch(`${API_BASE_URL}/vendors`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vendorPayload)
      });

      if (!vendorResponse.ok) throw new Error('Failed to create vendor');
      const vendorResult = await vendorResponse.json();
      const newVendorId = vendorResult.data?.uuid;

      setNewBatchData({ ...newBatchData, vendor_id: newVendorId });
      await loadVendors();
      showToast('Tạo nhà cung cấp thành công', 'success');
      setShowCreateVendorModal(false);
      setShowVendorModal(false);
    } catch (error) {
      console.error('Error creating vendor:', error);
      showToast('Có lỗi xảy ra khi tạo nhà cung cấp', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all rows
    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].selectedBatch) {
        showToast(`Vui lòng chọn batch nhân xanh cho dòng ${i + 1}`, 'error');
        return;
      }
      if (!rows[i].quantity) {
        showToast(`Vui lòng nhập khối lượng cho dòng ${i + 1}`, 'error');
        return;
      }
    }

    try {
      const policyResponse = await policyApi.getUserPolicy(selectedContext);
      const policyId = policyResponse?.data?.uuid;

      const batchesForImport = rows.map(row => ({
        batch_id: row.selectedBatch.uuid,
        quantity: parseFloat(row.quantity)
      }));

      const importPayload = {
        created_date: formData.created_date,
        batches: batchesForImport,
        policy_id: policyId
      };

      await inventoryApi.createImportTicket(importPayload);

      showToast('Tạo phiếu nhập kho thành công', 'success');
      if (onBack) onBack();
    } catch (error) {
      console.error('Error creating import ticket:', error);
      showToast(error.message || 'Có lỗi xảy ra khi tạo phiếu nhập kho', 'error');
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
         <h2>{t("warehouse.createImportNote")}</h2>
        </div>

        <form onSubmit={handleSubmit}>
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
                    value={formData.created_date}
                    onChange={(e) => setFormData({ ...formData, created_date: e.target.value })}
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
                  <th>{t("warehouse.greenBeanBatch")}</th>
                  <th>{t('warehouse.weight')}</th>
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
            <div className="modal-actions">
              <button className="action-button" onClick={() => setShowCreateBatchModal(true)}>
               {t("warehouse.createBatch")}
              </button>
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
                 <th>{t("warehouse.greenBeanname")}</th>
                <th>{t("warehouse.createdDate")}</th>
                <th>{t("warehouse.suppliername")}</th>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showCreateBatchModal && (
        <div className="batch-modal-overlay" onClick={() => setShowCreateBatchModal(false)}>
          <div className="batch-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
             <h3>{t("warehouse.createBatch")}</h3>
              <button onClick={() => setShowCreateBatchModal(false)}>×</button>
            </div>
            <div className="modal-form">
              <div style={{display: 'flex', gap: '8px'}}>
                <select
                  style={{flex: 1}}
                  value={newBatchData.green_bean_id}
                  onChange={(e) => setNewBatchData({ ...newBatchData, green_bean_id: e.target.value })}
                >
                  <option value="">Chọn nhân xanh *</option>
                  {greenBeans.map(gb => (
                    <option key={gb.uuid} value={gb.uuid}>{gb.green_bean_name}</option>
                  ))}
                </select>
                <button 
                  type="button"
                  className="confirm-button"
                  onClick={() => setShowCreateGreenBeanModal(true)}
                  style={{padding: '10px 16px', whiteSpace: 'nowrap'}}
                >
                  Tạo mới
                </button>
              </div>
              <div style={{display: 'flex', gap: '8px'}}>
                <select
                  style={{flex: 1}}
                  value={newBatchData.vendor_id}
                  onChange={(e) => setNewBatchData({ ...newBatchData, vendor_id: e.target.value })}
                >
                  <option value="">Chọn nhà cung cấp (tùy chọn)</option>
                  {vendors.map(v => (
                    <option key={v.uuid} value={v.uuid}>{v.name}</option>
                  ))}
                </select>
                <button 
                  type="button"
                  className="confirm-button"
                  onClick={() => setShowVendorModal(true)}
                  style={{padding: '10px 16px', whiteSpace: 'nowrap'}}
                >
                  Tạo mới
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="confirm-button" onClick={handleCreateNewBatch}>
                Tạo
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateGreenBeanModal && (
        <div className="batch-modal-overlay" onClick={() => setShowCreateGreenBeanModal(false)}>
          <div className="batch-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('warehouse.createNewGreenBean')}</h3>
              <button onClick={() => setShowCreateGreenBeanModal(false)}>×</button>
            </div>
            <div className="modal-form">
              <button
                type="button"
                className="origin-select-button"
                onClick={() => setShowOriginModal(true)}
              >
                {greenBeanData.origin_id
                  ? origins.find(o => o.uuid === greenBeanData.origin_id)?.country_name
                  : t('warehouse.selectOrigin')}
              </button>
              <input
                type="text"
                placeholder={t('warehouse.greenBeanNameRequired')}
                value={greenBeanData.green_bean_name}
                onChange={(e) => setGreenBeanData({ ...greenBeanData, green_bean_name: e.target.value })}
              />
              <select
                value={greenBeanData.variety}
                onChange={(e) => setGreenBeanData({ ...greenBeanData, variety: e.target.value })}
                required
              >
                <option value="">{t('warehouse.selectSpeciesRequired')}</option>
                <option value="Arabica">{t('warehouse.arabica')}</option>
                <option value="Robusta">{t('warehouse.robusta')}</option>
                <option value="Liberica">{t('warehouse.liberica')}</option>
              </select>
              <input
                type="text"
                placeholder={t('warehouse.varietyTypePlaceholder')}
                value={greenBeanData.variety_type}
                onChange={(e) => setGreenBeanData({ ...greenBeanData, variety_type: e.target.value })}
              />
              <select
                value={greenBeanData.processing}
                onChange={(e) => setGreenBeanData({ ...greenBeanData, processing: e.target.value })}
                required
              >
                <option value="">{t('warehouse.selectProcessingMethodRequired')}</option>
                <option value="Natural">Natural</option>
                <option value="Washed">Washed</option>
                <option value="Honey">Honey</option>
                <option value="Anaerobic Fermentation">Anaerobic Fermentation</option>
                <option value="Carbonic Maceration">Carbonic Maceration</option>
                <option value="Lactic">Lactic</option>
                <option value="Infused">Infused</option>
                <option value="Giling Basah">Giling Basah (Wet Hulling)</option>
                <option value="White Honey">White Honey</option>
                <option value="Yellow Honey">Yellow Honey</option>
                <option value="Red Honey">Red Honey</option>
                <option value="Black Honey">Black Honey</option>
              </select>
              <input
                type="number"
                placeholder={t('warehouse.altitudeRequired')}
                value={greenBeanData.altitude}
                onChange={(e) => setGreenBeanData({ ...greenBeanData, altitude: e.target.value })}
              />
              <input
                type="number"
                placeholder={t('warehouse.cropYearRequired')}
                value={greenBeanData.crop_year}
                onChange={(e) => setGreenBeanData({ ...greenBeanData, crop_year: e.target.value })}
                min="1901"
                max={new Date().getFullYear()}
              />
            </div>
            <div className="modal-footer">
              <button className="confirm-button" onClick={handleCreateGreenBean}>
                {t('common.create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showVendorModal && (
        <div className="batch-modal-overlay" onClick={() => setShowVendorModal(false)}>
          <div className="batch-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chọn nhà cung cấp</h3>
              <button onClick={() => setShowVendorModal(false)}>×</button>
            </div>
            <div className="modal-actions">
              <button className="action-button" onClick={() => setShowCreateVendorModal(true)}>
                Tạo nhà cung cấp mới
              </button>
            </div>
            <div className="batch-list" style={{border: 'none', margin: '0 24px 24px'}}>
              {vendors.map(v => (
                <div
                  key={v.uuid}
                  className="batch-item"
                  style={{padding: '12px', border: '1px solid #e9ecef', borderRadius: '6px', marginBottom: '8px', cursor: 'pointer'}}
                  onClick={() => {
                    setNewBatchData({ ...newBatchData, vendor_id: v.uuid });
                    setShowVendorModal(false);
                  }}
                >
                  <div>{v.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showCreateVendorModal && (
        <div className="batch-modal-overlay" onClick={() => setShowCreateVendorModal(false)}>
          <div className="batch-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tạo nhà cung cấp mới</h3>
              <button onClick={() => setShowCreateVendorModal(false)}>×</button>
            </div>
            <div className="modal-form">
              <input
                type="text"
                placeholder="Tên nhà cung cấp *"
                value={vendorData.name}
                onChange={(e) => setVendorData({ ...vendorData, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Địa chỉ"
                value={vendorData.address}
                onChange={(e) => setVendorData({ ...vendorData, address: e.target.value })}
              />
              <input
                type="tel"
                placeholder="Số điện thoại"
                value={vendorData.phone_number}
                onChange={(e) => setVendorData({ ...vendorData, phone_number: e.target.value })}
              />
              <input
                type="email"
                placeholder="Email"
                value={vendorData.email}
                onChange={(e) => setVendorData({ ...vendorData, email: e.target.value })}
              />
              <input
                type="url"
                placeholder="Địa chỉ liên hệ"
                value={vendorData.contact_link}
                onChange={(e) => setVendorData({ ...vendorData, contact_link: e.target.value })}
              />
            </div>
            <div className="modal-footer">
              <button className="confirm-button" onClick={handleCreateVendor}>
                Tạo
              </button>
            </div>
          </div>
        </div>
      )}

      {showOriginModal && (
        <div className="batch-modal-overlay" onClick={() => setShowOriginModal(false)}>
          <div className="batch-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chọn xuất xứ</h3>
              <button onClick={() => setShowOriginModal(false)}>×</button>
            </div>
            <div className="batch-list" style={{border: 'none', margin: '0 24px 24px'}}>
              {origins.map(origin => (
                <div
                  key={origin.uuid}
                  className="batch-item"
                  style={{padding: '12px', border: '1px solid #e9ecef', borderRadius: '6px', marginBottom: '8px', cursor: 'pointer'}}
                  onClick={() => {
                    setGreenBeanData({ ...greenBeanData, origin_id: origin.uuid });
                    setShowOriginModal(false);
                  }}
                >
                  <div>{origin.country_name} - {origin.region}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default CreateImportForm;
