import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeftIcon, TrashIcon } from '../../components/Icons';
import { batchApi } from '../../api/batchApi';
import { policyApi } from '../../api/policyApi';
import { inventoryApi } from '../../api/inventoryApi';
import { vendorApi } from '../../api/vendorApi';
import { showToast } from '../../components/Toast/Toast';
import { API_BASE_URL } from '../../api/config';
import './CreateImportForm.css';

const CreateImportForm = ({ onBack, selectedContext }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    created_date: new Date().toISOString().split('T')[0],
    batches: []
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingTickets, setPendingTickets] = useState([]);
  const [batches, setBatches] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);

  // Green bean selection
  const [showGreenBeanModal, setShowGreenBeanModal] = useState(false);
  const [selectedGreenBean, setSelectedGreenBean] = useState(null);
  const [greenBeans, setGreenBeans] = useState([]);
  const [showCreateGreenBeanModal, setShowCreateGreenBeanModal] = useState(false);
  const [greenBeanSearchTerm, setGreenBeanSearchTerm] = useState('');
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
  const [origins, setOrigins] = useState([]);
  const [showOriginModal, setShowOriginModal] = useState(false);

  // Batch form data
  const [batchFormData, setBatchFormData] = useState({
    moisture: '',
    size: '',
    weight: '',
    density: '',
    vendor_id: '',
    is_sample: false,
    batch_date: new Date().toISOString().split('T')[0],
    image: null
  });

  // Vendor
  const [vendors, setVendors] = useState([]);
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
    selectedGreenBean: null,
    weight: '',
    vendor_id: '',
    vendorData: null
  }]);

  const handleAddRow = () => {
    setRows([...rows, {
      selectedGreenBean: null,
      weight: '',
      vendor_id: '',
      vendorData: null
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
      const response = await vendorApi.getAll(policyId);
      setVendors(response.data || []);
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

    // Validate all rows
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

      const batchesForImport = [];

      // Tạo tất cả các lô nhân xanh
      for (const row of rows) {
        const greenBeanId = row.selectedGreenBean.uuid;
        const vendorId = row.vendor_id || null;

        // Tạo lô nhân xanh
        const batchPayload = {
          green_bean_id: greenBeanId,
          moisture: 0,
          size: null,
          weight: parseFloat(row.weight),
          density: null,
          vendor_id: vendorId,
          is_sample: false,
          policy_id: policyId
        };

        const batchResponse = await batchApi.createBatch(batchPayload, selectedContext);
        const newBatchId = batchResponse.data?.uuid || batchResponse.data?.batch_id || batchResponse.data?.id || batchResponse.data?.batchId;

        if (!newBatchId) {
          throw new Error('Không nhận được batch_id từ API');
        }

        batchesForImport.push({
          batch_id: newBatchId,
          quantity: parseFloat(row.weight)
        });
      }

      // Tạo 1 phiếu nhập kho chứa tất cả các lô
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

  const handleNext = (e) => {
    e.preventDefault();

    if (!selectedGreenBean) {
      showToast('Vui lòng chọn nhân xanh', 'error');
      return;
    }

    // Lưu dữ liệu trang hiện tại
    const currentTicketData = {
      page: currentPage,
      selectedGreenBean,
      greenBeanData,
      batchFormData,
      vendorData,
      created_date: formData.created_date
    };

    setPendingTickets(prev => [...prev, currentTicketData]);

    // Reset form cho trang tiếp theo
    setSelectedGreenBean(null);
    setGreenBeanData({
      origin_id: '',
      green_bean_name: '',
      green_bean_code: '',
      variety: '',
      variety_type: '',
      processing: '',
      altitude: '',
      crop_year: ''
    });
    setBatchFormData({
      moisture: '',
      size: '',
      weight: '',
      density: '',
      vendor_id: '',
      is_sample: false,
      batch_date: new Date().toISOString().split('T')[0],
      image: null
    });
    setVendorData({
      name: '',
      address: '',
      phone_number: '',
      email: '',
      contact_link: ''
    });
    setCurrentPage(prev => prev + 1);

    showToast('Chuyển sang trang tiếp theo', 'info');
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
      const newGreenBean = { ...greenBeanData, uuid: gbResult.data?.greenbeanId };

      handleRowChange(currentBatchIndex, 'selectedGreenBean', newGreenBean);
      await loadGreenBeans();
      showToast('Tạo nhân xanh thành công', 'success');
      setShowCreateGreenBeanModal(false);
      setShowGreenBeanModal(false);
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

      const vendorResponse = await vendorApi.create({ ...vendorData, policy_id: policyId });
      const vendorId = vendorResponse.data?.uuid;

      handleRowChange(currentBatchIndex, 'vendor_id', vendorId);
      await loadVendors();
      showToast('Tạo nhà cung cấp thành công', 'success');
      setShowCreateVendorModal(false);
      setShowVendorModal(false);
    } catch (error) {
      console.error('Error creating vendor:', error);
      showToast('Có lỗi xảy ra khi tạo nhà cung cấp', 'error');
    }
  };

  const filteredGreenBeans = greenBeans.filter(gb =>
    gb.green_bean_name?.toLowerCase().includes(greenBeanSearchTerm.toLowerCase())
  );

  return (
    <div className="create-import-form">
      <div className="form-wrapper">
        <button className="back-button" onClick={onBack}>
          <ArrowLeftIcon size={20} />
          {t('common.back')}
        </button>

        <div className="form-header">
          <h2>{t('warehouse.detailInformation')}</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="detail-table">
            <div className="table-header">
              <div className="header-cell">
                {t('warehouse.greenBeanName')}
              </div>

              <div className="header-cell">
                {t('warehouse.weight')}
              </div>

              <div className="header-cell">
                {t('warehouse.supplier')}
              </div>
              <div className="header-cell"></div>
            </div>
            {rows.map((row, index) => (
              <div key={index} className="table-row">
                <div className="table-cell">
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
                </div>
                <div className="table-cell">
                  <input
                    type="number"
                    value={row.weight}
                    onChange={(e) => handleRowChange(index, 'weight', e.target.value)}
                    className="input-field"
                    placeholder=""
                  />
                </div>
                <div className="table-cell">
                  <button
                    type="button"
                    className="select-vendor-btn"
                    onClick={() => {
                      setCurrentBatchIndex(index);
                      setShowVendorModal(true);
                    }}
                  >
                    {row.vendor_id
                      ? vendors.find(v => v.uuid === row.vendor_id)?.name
                      : row.vendorData?.name || ''}
                  </button>
                </div>
                <div className="table-cell">
                  {rows.length > 1 && (
                    <button
                      type="button"
                      className="delete-row-btn"
                      onClick={() => handleRemoveRow(index)}
                    >
                      <TrashIcon size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
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

      {showGreenBeanModal && (
        <div className="batch-modal-overlay" onClick={() => setShowGreenBeanModal(false)}>
          <div className="batch-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('warehouse.selectGreenBean')}</h3>
              <button onClick={() => setShowGreenBeanModal(false)}>×</button>
            </div>
            <div className="modal-actions">
              <button className="action-button" onClick={() => setShowCreateGreenBeanModal(true)}>
                {t('warehouse.createNewGreenBean')}
              </button>
            </div>
            <input
              type="text"
              className="batch-search"
              placeholder={t('warehouse.searchGreenBeanPlaceholder')}
              value={greenBeanSearchTerm}
              onChange={(e) => setGreenBeanSearchTerm(e.target.value)}
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
                    setGreenBeanSearchTerm('');
                  }}
                >
                  <div className="batch-name">{gb.green_bean_name}</div>
                </div>
              ))}
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
            <div className="batch-list">
              {vendors.map(v => (
                <div
                  key={v.uuid}
                  className="batch-item"
                  onClick={() => {
                    handleRowChange(currentBatchIndex, 'vendor_id', v.uuid);
                    setShowVendorModal(false);
                  }}
                >
                  <div className="batch-name">{v.name}</div>
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
            <div className="batch-list">
              {origins.map(origin => (
                <div
                  key={origin.uuid}
                  className="batch-item"
                  onClick={() => {
                    setGreenBeanData({ ...greenBeanData, origin_id: origin.uuid });
                    setShowOriginModal(false);
                  }}
                >
                  <div className="batch-name">{origin.country_name} - {origin.region}</div>
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
