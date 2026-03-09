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
  const [nextTicketCode, setNextTicketCode] = useState('');
  const [currentBatchIndex, setCurrentBatchIndex] = useState(null);
  const [showGreenBeanModal, setShowGreenBeanModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [greenBeanSearchTerm, setGreenBeanSearchTerm] = useState('');
  const [batchSearchTerm, setBatchSearchTerm] = useState('');

  const [greenBeans, setGreenBeans] = useState([]);
  const [batches, setBatches] = useState([]);
  const [origins, setOrigins] = useState([]);
  const [vendors, setVendors] = useState([]);

  // Green bean creation states
  const [showCreateGreenBeanModal, setShowCreateGreenBeanModal] = useState(false);
  const [showOriginModal, setShowOriginModal] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showCreateVendorModal, setShowCreateVendorModal] = useState(false);
  const [currentVendorIndex, setCurrentVendorIndex] = useState(null);
  const [vendorData, setVendorData] = useState({
    name: '',
    address: '',
    phone_number: '',
    contact_link: '',
    email: ''
  });
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



  const [rows, setRows] = useState([{
    importType: 'new', // 'new' hoặc 'existing'
    selectedGreenBean: null,
    selectedBatch: null,
    quantity: '',
    unit: 'Kg',
    selectedVendor: null
  }]);
  const [currentUser, setCurrentUser] = useState(null);

  const handleAddRow = () => {
    setRows([...rows, {
      importType: 'new',
      selectedGreenBean: null,
      selectedBatch: null,
      quantity: '',
      unit: 'Kg',
      selectedVendor: null
    }]);
  };

  const handleRemoveRow = (index) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  const handleRowChange = (index, field, value) => {
    if (field === 'quantity' && value < 0) {
      showToast(t('warehouse.weightCannotBeNegative'), 'error');
      return;
    }
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
    loadGreenBeans();
    loadBatches();
    loadOrigins();
    loadVendors();
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

  const loadVendors = async () => {
    try {
      const policyResponse = await policyApi.getUserPolicy(selectedContext);
      const policyId = policyResponse?.data?.uuid;
      if (!policyId) return;
      const response = await fetch(`${API_BASE_URL}/vendors/?policy_id=${policyId}`, {
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

  const filteredGreenBeans = greenBeans.filter(gb =>
    gb.green_bean_name?.toLowerCase().includes(greenBeanSearchTerm.toLowerCase())
  );

  const filteredBatches = batches.filter(b =>
    b.green_bean_name?.toLowerCase().includes(batchSearchTerm.toLowerCase()) ||
    b.batch_code?.toLowerCase().includes(batchSearchTerm.toLowerCase())
  );



  const handleCreateGreenBean = async () => {
    if (!greenBeanData.green_bean_name || !greenBeanData.origin_id || !greenBeanData.variety || !greenBeanData.processing || !greenBeanData.altitude || !greenBeanData.crop_year) {
      showToast(t('warehouse.requiredFieldsMissing'), 'error');
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
      const newGreenBean = gbResult.data;

      await loadGreenBeans();
      if (currentBatchIndex !== null) {
        const createdGreenBean = greenBeans.find(gb => gb.uuid === newGreenBean?.greenbeanId) || newGreenBean;
        handleRowChange(currentBatchIndex, 'selectedGreenBean', createdGreenBean);
      }
      showToast(t('warehouse.greenBeanCreatedSuccess'), 'success');
      setShowCreateGreenBeanModal(false);
    } catch (error) {
      console.error('Error creating green bean:', error);
    }
  };

  const handleCreateVendor = async () => {
    if (!vendorData.name) {
      showToast(t('warehouse.enterSupplierName'), 'error');
      return;
    }

    // Validate email if provided
    if (vendorData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vendorData.email)) {
      showToast(t('warehouse.invalidEmail'), 'error');
      return;
    }

    // Validate phone if provided
    if (vendorData.phone_number && !/^[0-9+\-\s()]{10,15}$/.test(vendorData.phone_number)) {
      showToast(t('warehouse.invalidPhoneNumber'), 'error');
      return;
    }

    try {
      const policyResponse = await policyApi.getUserPolicy(selectedContext);
      const policyId = policyResponse?.data?.uuid;

      const vendorPayload = {
        ...vendorData,
        policy_id: policyId
      };

      const response = await fetch(`${API_BASE_URL}/vendors`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vendorPayload)
      });

      if (!response.ok) throw new Error('Failed to create vendor');
      const result = await response.json();

      await loadVendors();
      if (currentVendorIndex !== null) {
        const newVendor = vendors.find(v => v.uuid === result.data.uuid) || { uuid: result.data.uuid, name: vendorData.name };
        handleRowChange(currentVendorIndex, 'selectedVendor', newVendor);
      }
      showToast(t('warehouse.supplierCreatedSuccess'), 'success');
      // if (result.data.vendor_code) {
      //   showToast(`Mã nhà cung cấp: ${result.data.vendor_code}`, 'info');
      // }
      setShowCreateVendorModal(false);
      setVendorData({
        name: '',
        address: '',
        phone_number: '',
        contact_link: '',
        email: ''
      });
    } catch (error) {
      console.error('Error creating vendor:', error);
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all rows
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].importType === 'new' && !rows[i].selectedGreenBean) {
        showToast(t('warehouse.selectGreenBeanForRow', { row: i + 1 }), 'error');
        return;
      }
      if (rows[i].importType === 'existing' && !rows[i].selectedBatch) {
        showToast(t('warehouse.selectBatchForRow', { row: i + 1 }), 'error');
        return;
      }
      if (!rows[i].quantity) {
        showToast(t('warehouse.enterWeightForRow', { row: i + 1 }), 'error');
        return;
      }
      if (!rows[i].unit) {
        showToast(t('warehouse.selectUnitForRow', { row: i + 1 }), 'error');
        return;
      }
      if (rows[i].importType === 'new' && !rows[i].selectedVendor) {
        showToast(t('warehouse.selectSupplierForRow', { row: i + 1 }), 'error');
        return;
      }
    }

    try {
      const policyResponse = await policyApi.getUserPolicy(selectedContext);
      const policyId = policyResponse?.data?.uuid;

      // Tạo batch cho mỗi nhân xanh
      const batchesForImport = [];
      for (const row of rows) {
        if (row.importType === 'new') {
          // Tạo batch mới
          const batchPayload = {
            green_bean_id: row.selectedGreenBean.uuid,
            weight: 0,
            policy_id: policyId
          };
          const batchResponse = await batchApi.createBatch(batchPayload, selectedContext);
          batchesForImport.push({
            batch_id: batchResponse.data.batchId,
            quantity: parseFloat(row.quantity),
            unit: row.unit,
            vendor_id: row.selectedVendor.uuid
          });
        } else {
          // Sử dụng batch có sẵn
          batchesForImport.push({
            batch_id: row.selectedBatch.uuid,
            quantity: parseFloat(row.quantity),
            unit: row.unit,
            vendor_id: row.selectedBatch.vendor_id || null
          });
        }
      }

      const importPayload = {
        created_date: formData.created_date,
        batches: batchesForImport,
        policy_id: policyId
      };

      await inventoryApi.createImportTicket(importPayload);

      showToast(t('warehouse.importSlipCreatedSuccess'), 'success');
      if (onBack) onBack();
    } catch (error) {
      console.error('Error creating import ticket:', error);
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
                  {t("warehouse.created_date")}<span className="required">*</span>
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
                  <th>{t('warehouse.importType')}<span className="required">*</span></th>
                  <th> {t('warehouse.greenBeanOrBatch')}<span className="required">*</span></th>
                  <th>{t('warehouse.weight')} <span className="required">*</span></th>
                  <th>{t('warehouse.unit')}<span className="required">*</span></th>
                  <th>{t('warehouse.vendor')}<span className="required">*</span></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index}>
                    <td>
                      <select
                        value={row.importType}
                        onChange={(e) => {
                          handleRowChange(index, 'importType', e.target.value);
                          handleRowChange(index, 'selectedGreenBean', null);
                          handleRowChange(index, 'selectedBatch', null);
                        }}
                        className="input-field"
                      >
                       <option value="new">{t('warehouse.createNewImportSlip')}</option>
                       <option value="existing">{t('warehouse.selectExistingBatch')}</option>
                      </select>
                    </td>
                    <td>
                      {row.importType === 'new' ? (
                        <button
                          type="button"
                          className="select-batch-button"
                          onClick={() => {
                            setCurrentBatchIndex(index);
                            setShowGreenBeanModal(true);
                            loadGreenBeans();
                          }}
                        >
                          {row.selectedGreenBean ? `${row.selectedGreenBean.green_bean_name}` : t('warehouse.selectGreenBean')}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="select-batch-button"
                          onClick={() => {
                            setCurrentBatchIndex(index);
                            setShowBatchModal(true);
                            loadBatches();
                          }}
                        >
                          {row.selectedBatch ? row.selectedBatch.green_bean_name : t('warehouse.selectBatch')}
                        </button>
                      )}
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.quantity}
                        onChange={(e) => handleRowChange(index, 'quantity', e.target.value)}
                        className="select-batch-button"
                        placeholder=""
                        min="0"
                      />
                    </td>
                    <td>
                      <select
                        value={row.unit}
                        onChange={(e) => handleRowChange(index, 'unit', e.target.value)}
                        className="input-field"
                        title={t('warehouse.selectMeasurementUnitTitle')}
                      >
                        <option value="Kg">Kg</option>
                        <option value="Gram">Gram</option>
                      </select>
                    </td>
                    <td>
                      {row.importType === 'new' ? (
                        <button
                          type="button"
                          className="select-batch-button"
                          onClick={() => {
                            setCurrentVendorIndex(index);
                            setShowVendorModal(true);
                            loadVendors();
                          }}
                          title={t('warehouse.selectOrCreateSupplier')}
                        >
                          {row.selectedVendor ? row.selectedVendor.name : t('warehouse.selectSupplier')}
                        </button>
                      ) : (
                        <input
                          type="text"
                          value={row.selectedBatch?.vendor_name || '-'}
                          readOnly
                          className="select-batch-button"
                          placeholder="-"
                        />
                      )}
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



      {showCreateGreenBeanModal && (
        <div className="batch-modal-overlay" onClick={() => setShowCreateGreenBeanModal(false)} style={{ zIndex: 1001 }}>
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
                required
              />
              <input
                type="number"
                placeholder={t('warehouse.cropYearRequired')}
                value={greenBeanData.crop_year}
                onChange={(e) => setGreenBeanData({ ...greenBeanData, crop_year: e.target.value })}
                min="1901"
                max={new Date().getFullYear()}
                required
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



      {showOriginModal && (
        <div className="batch-modal-overlay" onClick={() => setShowOriginModal(false)} style={{ zIndex: 1002 }}>
          <div className="batch-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chọn xuất xứ</h3>
              <button onClick={() => setShowOriginModal(false)}>×</button>
            </div>
            <div className="batch-list" style={{ border: 'none', margin: '0 24px 24px' }}>
              {origins.map(origin => (
                <div
                  key={origin.uuid}
                  className="batch-item"
                  style={{ padding: '12px', border: '1px solid #e9ecef', borderRadius: '6px', marginBottom: '8px', cursor: 'pointer' }}
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

      {showGreenBeanModal && (
        <div className="batch-modal-overlay" onClick={() => setShowGreenBeanModal(false)}>
          <div className="batch-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chọn nhân xanh</h3>
              <button onClick={() => setShowGreenBeanModal(false)}>×</button>
            </div>
            <div className="modal-actions">
              <button className="action-button" onClick={() => setShowCreateGreenBeanModal(true)}>
                Tạo nhân xanh mới
              </button>
            </div>
            <input
              type="text"
              className="batch-search"
              placeholder="Tìm kiếm nhân xanh..."
              value={greenBeanSearchTerm}
              onChange={(e) => setGreenBeanSearchTerm(e.target.value)}
              autoFocus
            />
            <div className="batch-list">
              <table className="batch-table">
                <thead>
                  <tr>
                    <th>Tên nhân xanh</th>
                    <th>Xuất xứ</th>
                    <th>Giống</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGreenBeans.map(gb => (
                    <tr
                      key={gb.uuid}
                      className="batch-row"
                      onClick={() => {
                        handleRowChange(currentBatchIndex, 'selectedGreenBean', gb);
                        setShowGreenBeanModal(false);
                        setGreenBeanSearchTerm('');
                      }}
                    >
                      <td>{gb.green_bean_name}</td>
                      <td>{origins.find(o => o.uuid === gb.origin_id)?.country_name || 'N/A'}</td>
                      <td>{gb.variety || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showVendorModal && (
        <div className="batch-modal-overlay" onClick={() => setShowVendorModal(false)}>
          <div className="batch-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('warehouse.selectSupplier')}</h3>
              <button onClick={() => setShowVendorModal(false)}>×</button>
            </div>
            <div className="modal-actions">
              <button className="action-button" onClick={() => setShowCreateVendorModal(true)}>
                {t('auto.to_nh_cung_cp_mi_357')}
              </button>
            </div>
            <div className="batch-list">
              <table className="batch-table">
                <thead>
                  <tr>
                    <th>{t('auto.tn_nh_cung_cp_359')}</th>
                    <th>{t('auto.m_nh_cung_cp_358')}</th>
                    <th>{t('auto.s_in_thoi_363')}</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map(vendor => (
                    <tr
                      key={vendor.uuid}
                      className="batch-row"
                      onClick={() => {
                        handleRowChange(currentVendorIndex, 'selectedVendor', vendor);
                        setShowVendorModal(false);
                      }}
                    >
                      <td>{vendor.name}</td>
                      <td>{vendor.vendor_code || t('common.notAvailable')}</td>
                      <td>{vendor.phone || t('common.notAvailable')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showCreateVendorModal && (
        <div className="batch-modal-overlay" onClick={() => setShowCreateVendorModal(false)} style={{ zIndex: 1003 }}>
          <div className="batch-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('auto.to_nh_cung_cp_mi_357')}</h3>
              <button onClick={() => setShowCreateVendorModal(false)}>×</button>
            </div>
            <div className="modal-form">
              <input
                type="text"
                placeholder={t('warehouse.supplierNamePlaceholder')}
                value={vendorData.name}
                onChange={(e) => setVendorData({ ...vendorData, name: e.target.value })}
              />
              <input
                type="text"
                placeholder={t('auto.a_ch_456')}
                value={vendorData.address}
                onChange={(e) => setVendorData({ ...vendorData, address: e.target.value })}
              />
              <input
                type="text"
                placeholder={t('auto.s_in_thoi_458')}
                value={vendorData.phone_number}
                onChange={(e) => setVendorData({ ...vendorData, phone_number: e.target.value })}
              />
              <input
                type="email"
                placeholder="Email"
                value={vendorData.email}
                onChange={(e) => setVendorData({ ...vendorData, email: e.target.value })}
              />
            </div>
            <div className="modal-footer">
              <button className="confirm-button" onClick={handleCreateVendor}>
                {t('common.create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBatchModal && (
        <div className="batch-modal-overlay" onClick={() => setShowBatchModal(false)}>
          <div className="batch-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('warehouse.selectExistingBatch')}</h3>
              <button onClick={() => setShowBatchModal(false)}>×</button>
            </div>
            <input
              type="text"
              className="batch-search"
              placeholder={t('warehouse.searchBatches')}
              value={batchSearchTerm}
              onChange={(e) => setBatchSearchTerm(e.target.value)}
              autoFocus
            />
            <div className="batch-list">
              <table className="batch-table">
                <thead>
                  <tr>
                    <th>{t('auto.tn_nhn_xanh_44')}</th>
                    <th>{t('auto.tn_nh_cung_cp_471')}</th>
                    <th>{t('warehouse.createdDate')}</th>
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
                        setShowBatchModal(false);
                        setBatchSearchTerm('');
                      }}
                    >
                      <td>{b.green_bean_name}</td>
                      <td>{b.vendor_name || t('common.notAvailable')}</td>
                      <td>
                        {b.created_dt
                          ? new Date(b.created_dt).toLocaleDateString('vi-VN')
                          : t('common.notAvailable')}
                      </td>
                      <td>{Number(b.weight || 0).toFixed(2)}</td>
                      <td>{b.unit || 'Kg'}</td>
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

export default CreateImportForm;
