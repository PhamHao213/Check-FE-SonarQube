import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeftIcon, BoxIcon } from '../../components/Icons';
import { batchApi } from '../../api/batchApi';
import { API_BASE_URL } from '../../api/config';
import { showToast } from '../../components/Toast/Toast';
import { FaCalendarAlt } from 'react-icons/fa';
import './CreateBatchForm.css';

const CreateBatchForm = ({ onClose, onSuccess, selectedContext }) => {
  const { t } = useTranslation();
  const [newBatch, setNewBatch] = useState({
    moisture: '',
    size: '',
    weight: '',
    density: '',
    vendor_id: '',
    is_sample: false,
    green_bean_id: '',
    received_at: ''
  });
  const [greenBeans, setGreenBeans] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectedGreenBean, setSelectedGreenBean] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectModal, setSelectModal] = useState({ show: false, type: '', data: [], selected: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateVendorModal, setShowCreateVendorModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [newVendorData, setNewVendorData] = useState({
    vendor_code: '',
    name: '',
    address: '',
    phone_number: ''
  });

  useEffect(() => {
    if (selectedContext) {
      fetchGreenBeans();
      fetchVendors();
    }
  }, [selectedContext]);

  const fetchGreenBeans = async () => {
    try {
      const { getUserPermissions, getUserRole } = await import('../../utils/permissions');
      const currentPermissions = getUserPermissions();
      const currentRole = getUserRole();

      let policyId;

      if (selectedContext?.type === 'personal') {
        const policyResponse = await fetch(`${API_BASE_URL}/policies/personal`, {
          credentials: 'include',
          headers: {}
        });
        if (policyResponse.ok) {
          const policyData = await policyResponse.json();
          policyId = policyData.data?.uuid;
        }
      } else if (selectedContext?.type === 'organization') {
        const policyResponse = await fetch(`${API_BASE_URL}/policies/organization/${selectedContext.uuid}`, {
          credentials: 'include',
          headers: {}
        });
        if (policyResponse.ok) {
          const policyData = await policyResponse.json();
          policyId = policyData.data?.uuid;
        }
      }

      if (!policyId) {
     
        setGreenBeans([]);
        return;
      }

      const url = `${API_BASE_URL}/greenbeans?policy_id=${policyId}`;

      const response = await fetch(url, {
        credentials: 'include',
        headers: {}
      });

      if (response.ok) {
        const data = await response.json();
        const greenBeansData = data.data || [];
        setGreenBeans(greenBeansData);
      } else {
        const errorText = await response.text();
       
        setGreenBeans([]);
      }
    } catch (error) {

      setGreenBeans([]);
    }
  };

  const fetchVendors = async () => {
    try {
      let policyId;

      if (selectedContext?.type === 'personal') {
        const policyResponse = await fetch(`${API_BASE_URL}/policies/personal`, {
          credentials: 'include'
        });
        if (policyResponse.ok) {
          const policyData = await policyResponse.json();
          policyId = policyData.data?.uuid;
        }
      } else if (selectedContext?.type === 'organization') {
        const policyResponse = await fetch(`${API_BASE_URL}/policies/organization/${selectedContext.uuid}`, {
          credentials: 'include'
        });
        if (policyResponse.ok) {
          const policyData = await policyResponse.json();
          policyId = policyData.data?.uuid;
        }
      }

      if (!policyId) {
        setVendors([]);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/vendors?policy_id=${policyId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setVendors(data.data || []);
      } else {
        setVendors([]);
      }
    } catch (error) {

      setVendors([]);
    }
  };

  const openSelectModal = (type) => {
    if (type === 'greenbean') {
      setSelectModal({ show: true, type: 'greenbean', data: greenBeans, selected: [] });
    } else if (type === 'vendor') {
      setSelectModal({ show: true, type: 'vendor', data: vendors, selected: [] });
    }
    setSearchTerm('');
  };

  const selectItemDirectly = (item) => {
    if (selectModal.type === 'greenbean') {
      setSelectedGreenBean(item);
      setNewBatch((prev) => ({ ...prev, green_bean_id: item.uuid }));
    } else if (selectModal.type === 'vendor') {
      setSelectedVendor(item);
      setNewBatch((prev) => ({ ...prev, vendor_id: item.uuid }));
    }
    setSelectModal({ show: false, type: '', data: [], selected: [] });
    setSearchTerm('');
  };

  const filteredData = (() => {
    let dataSource = selectModal.data;

    if (selectModal.type === 'vendor') {
      dataSource = vendors;
    }

    return dataSource.filter((item) => {
      if (!searchTerm) return true;

      const q = searchTerm.toLowerCase();

      if (selectModal.type === 'greenbean') {
        const nameMatch = item.green_bean_name && item.green_bean_name.toLowerCase().includes(q);
        const varietyTypeMatch = item.variety_type && item.variety_type.toLowerCase().includes(q);
        return nameMatch || varietyTypeMatch;
      } else if (selectModal.type === 'vendor') {
        return item.name && item.name.toLowerCase().includes(q);
      }
      return true;
    });
  })();

  const validateDecimal = (value, fieldName, maxDecimals = 2) => {
    if (!value) return true;
    const decimalParts = value.toString().split('.');
    if (decimalParts.length > 1 && decimalParts[1].length > maxDecimals) {
      showToast(
        t('greenBatch.maxDecimals', {
          field: fieldName,
          max: maxDecimals
        }),
        'warning'
      );
      return false;
    }
    return true;
  };

  const resizeAndCompressImage = (file, maxWidth = 1200, quality = 0.25) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const { width, height } = img;
        let { width: newWidth, height: newHeight } = img;

        if (width > maxWidth) {
          newWidth = maxWidth;
          newHeight = (height * maxWidth) / width;
        }

        canvas.width = newWidth;
        canvas.height = newHeight;
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        canvas.toBlob(resolve, 'image/jpeg', quality);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);

    // Kiểm tra tổng số ảnh
    if (selectedImages.length + files.length > 5) {
      showToast(
        t('greenBatch.maxImages', { count: 5 }),
        'warning'
      );

      return;
    }

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        showToast(
          t('greenBatch.imageOnly'),
          'warning'
        );

        continue;
      }

      if (file.size > 15 * 1024 * 1024) {
        showToast(
          t('greenBatch.imageMaxSize', { size: 15 }),
          'warning'
        );
        continue;
      }

      try {
        const compressedFile = await resizeAndCompressImage(file);
        const reader = new FileReader();

        reader.onload = (e) => {
          setSelectedImages(prev => {
            if (prev.length >= 5) return prev;
            return [...prev, {
              file: compressedFile,
              preview: e.target.result,
              id: Date.now() + Math.random(),
              originalName: file.name
            }];
          });
        };

        reader.readAsDataURL(compressedFile);
      } catch (error) {
        showToast(
          t('greenBatch.imageProcessing'),
          'error'
        );

      }
    }

    e.target.value = '';
  };

  const removeImage = (imageId) => {
    setSelectedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    try {
      let policyId;

      if (selectedContext?.type === 'personal') {
        const policyResponse = await fetch(`${API_BASE_URL}/policies/personal`, {
          credentials: 'include'
        });
        if (policyResponse.ok) {
          const policyData = await policyResponse.json();
          policyId = policyData.data?.uuid;
        }
      } else if (selectedContext?.type === 'organization') {
        const policyResponse = await fetch(`${API_BASE_URL}/policies/organization/${selectedContext.uuid}`, {
          credentials: 'include'
        });
        if (policyResponse.ok) {
          const policyData = await policyResponse.json();
          policyId = policyData.data?.uuid;
        }
      }

      let vendorCode = newVendorData.vendor_code.trim();
      if (!vendorCode) {
        const existingCodes = vendors.
          map((v) => v.vendor_code).
          filter((code) => code && code.length === 4 && !isNaN(code)).
          map((code) => parseInt(code)).
          sort((a, b) => b - a);

        const nextNumber = existingCodes.length > 0 ? existingCodes[0] + 1 : 1;
        vendorCode = nextNumber.toString().padStart(4, '0');
      }

      const vendorData = {
        vendor_code: vendorCode,
        name: newVendorData.name,
        address: newVendorData.address,
        phone_number: newVendorData.phone_number,
        policy_id: policyId
      };

      const response = await fetch(`${API_BASE_URL}/vendors`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(vendorData)
      });

      if (response.ok) {
        const createdVendor = await response.json();
        showToast(
          t('greenBatch.createSupplier'),
          'success'
        );
        setShowCreateVendorModal(false);
        setNewVendorData({ vendor_code: '', name: '', address: '', phone_number: '' });

        await fetchVendors();
      } else {
        const errorData = await response.json();
        showToast(
          t('greenBatch.createSupplierError', {
            message: errorData.message || t('greenBatch.unknown')
          }),
          'error'
        );

      }
    } catch (error) {

      showToast(
        t('greenBatch.serverConnection'),
        'error'
      );

    }
  };

  const [dateDisplay, setDateDisplay] = useState('');

  const handleDateChange = (e) => {
    const { value } = e.target;
    setNewBatch({ ...newBatch, received_at: value });
    if (value) {
      const [year, month, day] = value.split('-');
      setDateDisplay(`${day}/${month}/${year}`);
    }
  };

  const handleDateInputChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    let formatted = '';
    
    if (value.length > 0) {
      formatted = value.slice(0, 2);
    }
    if (value.length >= 3) {
      formatted += '/' + value.slice(2, 4);
    }
    if (value.length >= 5) {
      formatted += '/' + value.slice(4, 8);
    }
    
    setDateDisplay(formatted);
    
    if (formatted.length === 10) {
      const [day, month, year] = formatted.split('/');
      setNewBatch({ ...newBatch, received_at: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const resetForm = () => {
    setNewBatch({ moisture: '', size: '', weight: '', density: '', vendor_id: '', is_sample: false, green_bean_id: '', received_at: '' });
    setSelectedImages([]);
  };

  const handleCreateSuccess = () => {
    showToast(t('toast.create_success'), 'success');
    resetForm();
    onSuccess?.();
    onClose?.();
  };

  const handleCreateError = async (response) => {
    try {
      const responseText = await response.text();
      const errorData = JSON.parse(responseText);
      const message = errorData?.message || t('greenBatch.createBatchError');
      showToast(message, 'error');
    } catch {
      showToast(t('greenBatch.serverWithStatus', { status: response.status }), 'error');
    }
  };

  const validateBatchInputs = () => {
    const validations = [
      { value: newBatch.moisture, label: 'Độ ẩm', decimals: 1 },
      { value: newBatch.weight, label: 'Khối lượng', decimals: 1 },
      { value: newBatch.density, label: 'Tỷ trọng', decimals: 0 }
    ];

    return validations.every(({ value, label, decimals }) =>
      validateDecimal(value, label, decimals)
    );
  };

  const fetchPolicyId = async () => {
    const endpoints = {
      personal: `${API_BASE_URL}/policies/personal`,
      organization: `${API_BASE_URL}/policies/organization/${selectedContext.uuid}`
    };

    const endpoint = endpoints[selectedContext?.type];
    if (!endpoint) return null;

    try {
      const response = await fetch(endpoint, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        return data.data?.uuid;
      }
    } catch (error) {
      
    }
    return null;
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();


    if (!validateBatchInputs()) return;

    try {
      const policyId = await fetchPolicyId();

      if (!policyId) {
        showToast(t('greenBatch.policyNotFound'), 'error');
        return;
      }

      const formData = new FormData();
      Object.keys(newBatch).forEach(key => {
        if (newBatch[key] !== '') {
          formData.append(key, newBatch[key]);

        }
      });

      // Thêm policy_id vào formData
      formData.append('policy_id', policyId);

      selectedImages.forEach((image) => {
        formData.append('images', image.file);
      });

    
      for (let pair of formData.entries()) {
     
      }

      const response = await fetch(`${API_BASE_URL}/greenbeanbatch/form-data`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

 
      const responseData = await response.clone().json();
  

      if (response.ok) {
        handleCreateSuccess();
      } else {
        await handleCreateError(response);
      }
    } catch (error) {
     
      showToast(t('greenBatch.serverConnection'), 'error');
    }
  };

  return (
    <div className="gbb_create-batch-page">
      <div className="gbb_create-batch-content">
        <button className="gbb_back-button1" onClick={onClose}>
          <ArrowLeftIcon size={16} />
          {t('common.back')}
        </button>

        <div className="gbb_create-batch-title">
          <h2>{t('greenBatch.createNewBatch')}</h2>
          <p>{t("auto.in_thng_tin_l_nhn_xanh_mi_nhp__333")}</p>
        </div>

        <form onSubmit={handleCreateBatch} className="gbb_batch-form">
          <div className="gbb_form-row">
            <div className="gbb_form-group full-width">
              <label>{t("auto.chn_nhn_xanh_334")}<span className="gbb_required"> * </span></label>
              <div className="gbb_input-with-button">
                <div className="gbb_input-with-tags">
                  {selectedGreenBean ?
                    <span className="gbb_input-tag">
                      {selectedGreenBean.green_bean_name} - {selectedGreenBean.variety_type}
                      <button type="button" className="gbb_tag-remove" onClick={() => {
                        setSelectedGreenBean(null);
                        setNewBatch((prev) => ({ ...prev, green_bean_id: '' }));
                      }}>×</button>
                    </span> :

                    <span className="gbb_placeholder-text">{t("auto.chn_nhn_xanh_335")}</span>
                  }
                </div>
                <button type="button" className="gbb_select-button" onClick={() => openSelectModal('greenbean')}>{t("auto.chn_336")}

                </button>
              </div>
            </div>
          </div>

          <div className="gbb_form-row">
            <div className="gbb_form-group half-width">
              <label>{t("auto._m_337")}<span className="gbb_required"></span></label>
              <input
                type="number"
                step="0.1"
                placeholder={t("auto.vd_125_338")}
                value={newBatch.moisture}
                onChange={(e) => {
                  const value = e.target.value;
                  if (validateDecimal(value, 'Độ ẩm', 1)) {
                    setNewBatch({ ...newBatch, moisture: value });
                  }
                }}
              />

            </div>
            <div className="gbb_form-group half-width">
              <label>{t("auto.sn_339")}</label>
              <input
                type="text"
                placeholder={t("auto.vd_18_340")}
                value={newBatch.size}
                onChange={(e) => setNewBatch({ ...newBatch, size: e.target.value })} />

            </div>
          </div>

          <div className="gbb_form-row">
            <div className="gbb_form-group half-width">
              <label>{t("auto.khi_lng_kg_341")}<span className="gbb_required" > * </span></label>
              <input
                type="number"
                step="0.1"
                placeholder={t("auto.vd_60_342")}
                value={newBatch.weight}
                required
                onChange={(e) => {
                  const value = e.target.value;
                  if (validateDecimal(value, 'Khối lượng', 1)) {
                    setNewBatch({ ...newBatch, weight: value });
                  }
                }} />

            </div>
            <div className="gbb_form-group half-width">
              <label>{t("auto.t_trng_gml_343")}</label>
              <input
                type="number"
                step="1"
                min="0"
                max="999"
                placeholder={t("auto.vd_500_344")}
                value={newBatch.density}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value && (parseFloat(value) < 0 || parseFloat(value) > 999)) {
                    showToast(
                      t('greenBatch.densityRange', {
                        min: 0,
                        max: 999
                      }),
                      'warning'
                    );
                    return;
                  }
                  if (validateDecimal(value, 'Tỷ trọng', 0)) {
                    setNewBatch({ ...newBatch, density: value });
                  }
                }} />

            </div>
          </div>

          <div className="gbb_form-row">
            <div className="gbb_form-group half-width">
              <label>{t("auto.nh_cung_cp_345")}</label>
              <div className="gbb_input-with-button">
                <div className="gbb_input-with-tags">
                  {selectedVendor ?
                    <span className="gbb_input-tag">
                      {selectedVendor.name}
                      <button type="button" className="gbb_tag-remove" onClick={() => {
                        setSelectedVendor(null);
                        setNewBatch((prev) => ({ ...prev, vendor_id: '' }));
                      }}>×</button>
                    </span> :

                    <span className="gbb_placeholder-text">{t("auto.chn_nh_cung_cp_346")}</span>
                  }
                </div>
                <button type="button" className="gbb_select-button" onClick={() => openSelectModal('vendor')}>{t("auto.chn_347")}

                </button>
              </div>
            </div>
            <div className="gbb_form-group half-width">
              <label>{t("auto.l_mu_th_348")}</label>
              <select
                value={newBatch.is_sample}
                onChange={(e) => setNewBatch({ ...newBatch, is_sample: e.target.value === 'true' })}>

                <option value={false}>{t("auto.khng_349")}</option>
                <option value={true}>{t("auto.c_350")}</option>
              </select>
            </div>
          </div>

          <div className="gbb_form-row">
            <div className="gbb_form-group half-width">
              <label>{t('greenBatch.received_at')}</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  value={dateDisplay}
                  onChange={handleDateInputChange}
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  placeholder="dd/mm/yyyy"
                  maxLength="10"
                  style={{ flex: 1, paddingRight: '40px' }}
                />
                <FaCalendarAlt
                  onClick={() => document.getElementById('received-date-picker').showPicker()}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    cursor: 'pointer',
                    color: '#666'
                  }}
                />
                <input
                  id="received-date-picker"
                  type="date"
                  value={newBatch.received_at}
                  onChange={handleDateChange}
                  tabIndex="-1"
                  style={{
                    position: 'absolute',
                    opacity: 0,
                    pointerEvents: 'none',
                    width: '200px',
                    top: '100%',
                    right: '0',
                    zIndex: 1000
                  }}
                />
              </div>
            </div>
          </div>

          <div className="gbb_form-row">
            <div className="gbb_form-group full-width">
              {t('greenBatch.batchImage')} ({t('greenBatch.maxImages', { count: 5 })})
              <div className="gbb_image-upload-container">
                {selectedImages.length === 0 ? (
                  <div className="gbb_image-upload-area" onClick={() => document.getElementById('image-upload').click()}>
                    <div className="gbb_upload-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                      </svg>
                    </div>
                    <div className="gbb_upload-text">
                      <p className="gbb_upload-title">{t("greenBatch.uploadimg")}</p>
                      <p className="gbb_upload-subtitle">
                        {t('greenBatch.max5Images')}
                      </p>

                    </div>
                    <button type="button" className="gbb_upload-button">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                      </svg>
                      {t("greenBatch.chooseimg")}
                    </button>
                  </div>
                ) : (
                  <div className="gbb_image-preview-grid">
                    {selectedImages.map((image) => (
                      <div key={image.id} className="gbb_image-preview-card">
                        <div className="gbb_image-preview">
                          <img src={image.preview} alt="Preview" />
                          <button
                            type="button"
                            className="gbb_image-remove"
                            onClick={() => removeImage(image.id)}
                          >
                            ×
                          </button>
                        </div>
                        <div className="gbb_image-info">
                          <p className="gbb_image-name">{image.originalName || image.file.name}</p>
                          <p className="gbb_image-size">{(image.file.size / 1024).toFixed(1)}KB</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  type="file"
                  id="image-upload"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                {selectedImages.length > 0 && selectedImages.length < 5 && (
                  <button
                    type="button"
                    className="gbb_change-image-btn"
                    onClick={() => document.getElementById('image-upload').click()}
                  >
                    {t('greenBatch.add_images', {
                      current: selectedImages.length,
                      max: 5
                    })}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="gbb_form-actions">
            <button type="submit" className="gbb_create-button">{t('greenBatch.createBatch')}</button>
            <button type="button" className="gbb_cancel-button" onClick={onClose}>{t('common.cancel')}</button>
          </div>
        </form>
      </div>

      {selectModal.show &&
        <div className="gbb_modal-overlay" onClick={() => setSelectModal({ show: false, type: '', data: [], selected: [] })}>
          <div className="gbb_select-modal-content1" onClick={(e) => e.stopPropagation()}>
            <div className="gbb_select-modal-header">
              <div className="gbb_header-left">
                <h3>{selectModal.type === 'greenbean' ? t("auto.chn_nhn_xanh_334") : t("greenBatch.selectVendor")}</h3>
                {selectModal.type === 'vendor' &&
                  <button
                    type="button"
                    className="gbb_create-vendor-btn"
                    onClick={() => setShowCreateVendorModal(true)}>{t("auto.to_mi_351")}


                  </button>
                }
              </div>
              <button className="gbb_close-button" onClick={() => setSelectModal({ show: false, type: '', data: [], selected: [] })}>
                ×
              </button>
            </div>
            <div className="gbb_select-modal-filters">
              <div className="gbb_search-box">
                <input
                  type="text"
                  placeholder={selectModal.type === 'greenbean' ? 'Tìm kiếm theo tên hoặc giống...' : 'Tìm kiếm theo tên nhà cung cấp...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="gbb_batch-search-input" />

              </div>
            </div>
            <div className="gbb_select-modal-body">
              {filteredData.length > 0 ? (
                <div className="gbb_select-table-container">
                  <table className="gbb_select-table">
                    <thead>
                      <tr>
                        {selectModal.type === 'greenbean' ?
                          <>
                            <th>{t("auto.tn_nhn_xanh_352")}</th>
                            <th>Chi</th>
                            <th>{t("auto.ging_353")}</th>
                          </> :

                          <>
                            <th>{t("auto.m_nh_cung_cp_354")}</th>
                            <th>{t("auto.tn_355")}</th>
                            <th>{t("auto.lin_h_356")}</th>
                          </>
                        }
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((item, index) => {
                        return (
                          <tr key={item.uuid} onClick={() => selectItemDirectly(item)} style={{ cursor: 'pointer' }} className="gbb_selectable-row">
                            {selectModal.type === 'greenbean' ?
                              <>
                                <td className="gbb_bean-name">{item.green_bean_name}</td>
                                <td>{item.variety}</td>
                                <td>{item.variety_type}</td>
                              </> :

                              <>
                                <td>{item.vendor_code || 'Chưa có'}</td>
                                <td className="gbb_bean-name">{item.name || 'Chưa có'}</td>
                                <td>{item.phone_number || 'Chưa có'}</td>
                              </>
                            }
                          </tr>);

                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="gbb_no-data">
                  {selectModal.data.length === 0 ? 'Không có dữ liệu' : 'Không tìm thấy kết quả phù hợp'}
                </div>
              )}
            </div>
          </div>
        </div>
      }

      {showCreateVendorModal &&
        <div className="gbb_modal-overlay" onClick={() => setShowCreateVendorModal(false)}>
          <div className="gbb_create-vendor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gbb_create-vendor-header">
              <h3>{t("auto.to_nh_cung_cp_mi_357")}</h3>
              <button className="gbb_close-button" onClick={() => setShowCreateVendorModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateVendor} className="gbb_create-vendor-form">
              {/* <div className="gbb_form-group">
                <label>{t("auto.m_nh_cung_cp_358")}</label>
                <input
                  type="text"
                  value={newVendorData.vendor_code}
                  onChange={(e) => setNewVendorData((prev) => ({ ...prev, vendor_code: e.target.value }))} />


                <small style={{color: '#6c757d', fontSize: '12px', marginTop: '4px'}}>{t('auto.nu_khng_nhp_h_t_371')}</small>
              </div> */}
              <div className="gbb_form-group">
                <label>{t("auto.tn_nh_cung_cp_359")}<span className="gbb_required">*</span></label>
                <input
                  type="text"
                  value={newVendorData.name}
                  onChange={(e) => setNewVendorData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder={t("auto.tn_nh_cung_cp_360")} />

              </div>
              <div className="gbb_form-group">
                <label>{t("auto.a_ch_361")}</label>
                <input
                  type="text"
                  value={newVendorData.address}
                  onChange={(e) => setNewVendorData((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder={t("auto.a_ch_nh_cung_cp_362")} />

              </div>
              <div className="gbb_form-group">
                <label>{t("auto.s_in_thoi_363")}</label>
                <input
                  type="tel"
                  value={newVendorData.phone_number}
                  onChange={(e) => setNewVendorData((prev) => ({ ...prev, phone_number: e.target.value }))}
                  placeholder={t("auto.s_in_thoi_364")} />

              </div>
              <div className="gbb_create-vendor-actions">
                <button type="button" className="gbb_cancel-button" onClick={() => setShowCreateVendorModal(false)}>{t("auto.hy_365")}</button>
                <button type="submit" className="gbb_create-button">{t("auto.to_366")}</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>);

};

export default CreateBatchForm;