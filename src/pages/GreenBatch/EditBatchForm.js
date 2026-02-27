import React, { useState, useEffect } from 'react';
import { API_BASE_URL, REACT_APP_IMAGE_BASE_URL } from '../../api/config';
import { useTranslation } from 'react-i18next';
import { batchApi } from '../../api/batchApi';
import { vendorApi } from '../../api/vendorApi';
import { policyApi } from '../../api/policyApi';
import { showToast } from '../../components/Toast/Toast';
import { FaCalendarAlt } from 'react-icons/fa';
import './EditBatchForm.css';

const EditBatchForm = ({ batch, onClose, onSuccess, selectedContext }) => {
  const { t } = useTranslation();
  const [editBatch, setEditBatch] = useState({
    moisture: '',
    size: '',
    density: '',
    weight: '',
    vendor_name: '',
    description: '',
    is_sample: false,
    green_bean_id: '',
    vendor_id: '',
    received_at: ''
  });
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [dateDisplay, setDateDisplay] = useState('');

  // Helper functions
  const formatNumber = (value) => {
    if (!value && value !== 0) return '';
    const num = parseFloat(value);
    return isNaN(num) ? value : num.toString();
  };

  const parseBooleanValue = (value) => {
    return value === true || value === 1 || value === '1' || value === 'true';
  };

  const initializeBatchData = (batch) => {
    let receivedAt = '';
    if (batch.received_at) {
      // Nếu có timezone (Z hoặc +/-), chuyển sang local date
      if (batch.received_at.includes('T') && (batch.received_at.includes('Z') || batch.received_at.includes('+') || batch.received_at.includes('-', 10))) {
        const date = new Date(batch.received_at);
        // Lấy ngày theo local timezone (không phải UTC)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        receivedAt = `${year}-${month}-${day}`;
        setDateDisplay(`${day}/${month}/${year}`);
      } else {
        // Không có timezone, xử lý như string thuần
        const dateStr = batch.received_at.includes('T') 
          ? batch.received_at.split('T')[0] 
          : batch.received_at.split(' ')[0];
        const [year, month, day] = dateStr.split('-');
        receivedAt = dateStr;
        setDateDisplay(`${day}/${month}/${year}`);
      }
    } else {
      setDateDisplay('');
    }
    
    setEditBatch({
      moisture: formatNumber(batch.moisture) || '',
      size: formatNumber(batch.size) || '',
      density: formatNumber(batch.density) || '',
      weight: formatNumber(batch.weight) || '',
      vendor_name: batch.vendor_name || '',
      description: batch.description || '',
      is_sample: parseBooleanValue(batch.is_sample),
      green_bean_id: batch.green_bean_id || batch.greenbean_id || '',
      vendor_id: batch.vendor_id || '',
      received_at: receivedAt
    });
  };

  const initializeVendor = (batch) => {
    if (batch.vendor_id && batch.vendor_name) {
      setSelectedVendor({ uuid: batch.vendor_id, name: batch.vendor_name });
    }
  };

  const initializeImages = (batch) => {
    if (batch.image_urls) {
      try {
        const imageUrls = typeof batch.image_urls === 'string'
          ? JSON.parse(batch.image_urls)
          : batch.image_urls;
        setExistingImages(Array.isArray(imageUrls) ? imageUrls : []);
      } catch (error) {
        setExistingImages([]);
      }
    } else if (batch.images) {
      setExistingImages(batch.images);
    } else if (batch.image_url) {
      setExistingImages([batch.image_url]);
    } else {
      setExistingImages([]);
    }
  };

  useEffect(() => {
    if (batch) {
      initializeBatchData(batch);
      initializeVendor(batch);
      initializeImages(batch);
    }
    loadVendors();
  }, [batch]);


  const loadVendors = async () => {
    try {
      setLoadingVendors(true);
      const policyResponse = await policyApi.getUserPolicy(selectedContext);
      const policyId = policyResponse.data.uuid;
      const response = await vendorApi.getAll(policyId);
      setVendors(response.data || []);
    } catch (error) {
      
      showToast(t('vendor.loadError') || 'Lỗi khi tải danh sách nhà cung cấp', 'error');
    } finally {
      setLoadingVendors(false);
    }
  };

  const filteredVendors = vendors.filter(vendor =>
    vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.vendor_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectVendor = (vendor) => {
    setSelectedVendor(vendor);
    setEditBatch(prev => ({ ...prev, vendor_id: vendor.uuid }));
    setShowVendorModal(false);
    setSearchTerm('');
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
    const currentImageCount = selectedImages.length + existingImages.length;

    if (currentImageCount + files.length > 5) {
      showToast(
        t('greenBatch.maxImages1', { count: 5 }),
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

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const addMoreImages = () => {
    const currentImageCount = selectedImages.length + existingImages.length;
    if (currentImageCount >= 5) {
      showToast(
        t('greenBatch.maxImagesReached', { count: 5 }),
        'warning'
      );

      return;
    }
    document.getElementById('edit-image-upload').click();
  };

  const validateDecimal = (value, fieldName, maxDecimals = 2) => {
    if (!value) return true;
    const decimalParts = value.toString().split('.');
    if (decimalParts.length > 1 && decimalParts[1].length > maxDecimals) {
      showToast(
        t('greenBatch.decimalPlaces', {
          field: fieldName,
          max: maxDecimals
        }),
        'warning'
      );

      return false;
    }
    return true;
  };

  // Hàm xử lý khi người dùng nhập vào input
  const handleNumberInput = (value, fieldName) => {
    // Loại bỏ các ký tự không phải số và dấu chấm
    const cleanedValue = value.replace(/[^\d.]/g, '');

    // Kiểm tra nếu có nhiều hơn 1 dấu chấm
    const dotCount = (cleanedValue.match(/\./g) || []).length;
    if (dotCount > 1) {
      return cleanedValue.slice(0, -1); // Xóa ký tự cuối cùng nếu có nhiều dấu chấm
    }

    // Nếu là số nguyên, không hiển thị .00
    if (cleanedValue && !cleanedValue.includes('.')) {
      return cleanedValue;
    }

    // Nếu có phần thập phân, kiểm tra số chữ số sau dấu chấm
    if (cleanedValue.includes('.')) {
      const parts = cleanedValue.split('.');
      const integerPart = parts[0];
      const decimalPart = parts[1];

      // Nếu phần thập phân chỉ toàn số 0, chỉ hiển thị phần nguyên
      if (decimalPart === '0' || /^0+$/.test(decimalPart)) {
        return integerPart;
      }
    }

    return cleanedValue;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleDateChange = (e) => {
    const { value } = e.target;
    setEditBatch({ ...editBatch, received_at: value });
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
      setEditBatch({ ...editBatch, received_at: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` });
    }
  };

  const handleUpdateBatch = async (e) => {
    e.preventDefault();

    // Validate decimal places
    if (!validateDecimal(editBatch.moisture, t('greenBatch.moistureLabel'), 1)) return;
    if (!validateDecimal(editBatch.weight, 'Khối lượng', 1)) return;
    if (!validateDecimal(editBatch.density, t('greenBatch.densityLabel'), 0)) return;

    try {
      // Tìm đúng ID của batch - có thể là uuid, gb_batch_id, hoặc batch_id
      const batchId = batch.uuid || batch.gb_batch_id || batch.batch_id;

      if (!batchId) {
     
        throw new Error('Không tìm thấy ID của batch');
      }


      // Chuyển đổi giá trị sang số trước khi gửi API
      const dataToSend = {
        ...editBatch,
        moisture: editBatch.moisture ? parseFloat(editBatch.moisture) : null,
        size: editBatch.size ? parseFloat(editBatch.size) : null,
        density: editBatch.density ? parseFloat(editBatch.density) : null,
        weight: editBatch.weight ? parseFloat(editBatch.weight) : null,
      };

      // Luôn sử dụng FormData để giữ nguyên ảnh cũ
      const formData = new FormData();
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] !== '' && dataToSend[key] !== null) {
          formData.append(key, dataToSend[key]);
        }
      });

      // Luôn gửi danh sách ảnh cuối cùng (ảnh cũ còn lại + ảnh mới)
      // Gửi ảnh mới nếu có
      if (selectedImages.length > 0) {
        selectedImages.forEach((image) => {
          formData.append('images', image.file);
        });
      }

      // Luôn gửi danh sách ảnh cũ còn lại (kể cả khi rỗng)
      formData.append('existing_image_urls', JSON.stringify(existingImages));

      const response = await fetch(`${API_BASE_URL}/greenbeanbatch/${batchId}`, {
        method: 'PUT',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Cập nhật thất bại');
      }

      showToast(t('greenBatch.updateSuccess'), 'success');

      // Refresh batch detail data
      if (onSuccess) {
        await onSuccess();
      }
      onClose();
    } catch (error) {
     
      showToast(error.message || t('greenBatch.updateError') || 'Có lỗi xảy ra khi cập nhật lô', 'error');
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className="gbb_edit-batch-overlay"
      onClick={handleOverlayClick}
      onDragStart={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
      onDragOver={(e) => e.preventDefault()}
    >
      <div
        className="gbb_edit-batch-modal"
        onClick={handleModalClick}
        onDragStart={(e) => e.preventDefault()}
      >
        <div className="gbb_edit-batch-header">
          <h3>{t('greenBatch.editBatch')}</h3>
          <button className="gbb_close-button" onClick={onClose}>×</button>
        </div>

        {/* <div className="gbb_edit-batch-subtitle">
          Cập nhật thông tin lô {batch?.gb_batch_id?.toString().padStart(3, '0')}
        </div> */}

        <form onSubmit={handleUpdateBatch} className="gbb_edit-batch-form">
          <div className="gbb_form-row">
            <div className="gbb_form-group half-width">
              <label>{t('greenBatch.moistureLabel')} </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder={t('greenBatch.moisturePlaceholder')}
                value={editBatch.moisture}
                onChange={(e) => {
                  const processedValue = handleNumberInput(e.target.value, 'moisture');
                  if (validateDecimal(processedValue, t('greenBatch.moistureLabel'), 1)) {
                    setEditBatch({ ...editBatch, moisture: processedValue });
                  }
                }}
                onBlur={(e) => {
                  // Xử lý khi người dùng rời khỏi ô input
                  if (editBatch.moisture && editBatch.moisture.includes('.')) {
                    const num = parseFloat(editBatch.moisture);
                    if (!isNaN(num) && num % 1 === 0) {
                      setEditBatch({ ...editBatch, moisture: num.toString() });
                    }
                  }
                }}
              />
            </div>
            <div className="gbb_form-group half-width">
              <label>{t('greenBatch.sizeLabel')}</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder={t('greenBatch.sizePlaceholder')}
                value={editBatch.size}
                onChange={(e) => {
                  const processedValue = handleNumberInput(e.target.value, 'size');
                  setEditBatch({ ...editBatch, size: processedValue });
                }}
                onBlur={(e) => {
                  if (editBatch.size && editBatch.size.includes('.')) {
                    const num = parseFloat(editBatch.size);
                    if (!isNaN(num) && num % 1 === 0) {
                      setEditBatch({ ...editBatch, size: num.toString() });
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="gbb_form-row">
            <div className="gbb_form-group half-width">
              <label>{t('greenBatch.densityLabel')}</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder={t('greenBatch.densityPlaceholder')}
                value={editBatch.density}
                onChange={(e) => {
                  const processedValue = handleNumberInput(e.target.value, 'density');
                  if (processedValue && (parseFloat(processedValue) < 0 || parseFloat(processedValue) > 999)) {
                    showToast(
                      t('greenBatch.densityRange', {
                        min: 0,
                        max: 999
                      }),
                      'warning'
                    );

                    return;
                  }
                  if (validateDecimal(processedValue, t('greenBatch.densityLabel'), 0)) {
                    setEditBatch({ ...editBatch, density: processedValue });
                  }
                }}
                onBlur={(e) => {
                  if (editBatch.density && editBatch.density.includes('.')) {
                    const num = parseFloat(editBatch.density);
                    if (!isNaN(num) && num % 1 === 0) {
                      setEditBatch({ ...editBatch, density: num.toString() });
                    }
                  }
                }}
              />
            </div>

            <div className="gbb_form-group half-width">
              <label>{t('greenBatch.weight')} <span className="gbb_required">{t('greenBatch.required')}</span> </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="VD: 60"
                value={editBatch.weight}
                onChange={(e) => {
                  const processedValue = handleNumberInput(e.target.value, 'weight');
                  if (validateDecimal(processedValue, 'Khối lượng', 1)) {
                    setEditBatch({ ...editBatch, weight: processedValue });
                  }
                }}
                onBlur={(e) => {
                  if (editBatch.weight && editBatch.weight.includes('.')) {
                    const num = parseFloat(editBatch.weight);
                    if (!isNaN(num) && num % 1 === 0) {
                      setEditBatch({ ...editBatch, weight: num.toString() });
                    }
                  }
                }}
                required
              />
            </div>
          </div>

          <div className="gbb_form-row">
            <div className="gbb_form-group half-width">
              <label>{t('greenBatch.vendorLabel')}</label>
              <div className="gbb_input-with-button">
                <div className="gbb_input-with-tags">
                  {selectedVendor ? (
                    <span className="gbb_input-tag">
                      {selectedVendor.name}
                      <button type="button" className="gbb_tag-remove" onClick={() => {
                        setSelectedVendor(null);
                        setEditBatch(prev => ({ ...prev, vendor_id: '' }));
                      }}>×</button>
                    </span>
                  ) : (
                    <span className="gbb_placeholder-text">{t('greenBatch.selectVendorPlaceholder')}</span>
                  )}
                </div>
                <button type="button" className="gbb_select-button" onClick={() => {
                  setShowVendorModal(true);
                  if (vendors.length === 0) {
                    loadVendors();
                  }
                }}>
                  {t('greenBatch.selectButton')}
                </button>
              </div>
            </div>
          </div>

          <div className="gbb_form-row">
            <div className="gbb_form-group half-width">
              <label>{t('greenBatch.isSampleLabel')}</label>
              <select
                value={editBatch.is_sample.toString()}
                onChange={(e) => setEditBatch({ ...editBatch, is_sample: e.target.value === 'true' })}
              >
                <option value="false">{t('common.no')}</option>
                <option value="true">{t('common.yes')}</option>
              </select>
            </div>
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
                  onClick={() => document.getElementById('edit-received-date-picker').showPicker()}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    cursor: 'pointer',
                    color: '#666'
                  }}
                />
                <input
                  id="edit-received-date-picker"
                  type="date"
                  value={editBatch.received_at}
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
              {t('greenBatch.image')} ({t('greenBatch.maxImages', { count: 5 })})
              <div className="gbb_image-upload-container">
                {selectedImages.length === 0 && existingImages.length === 0 ? (
                  <div className="gbb_image-upload-area" onClick={() => document.getElementById('edit-image-upload').click()}>
                    <div className="gbb_upload-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                      </svg>
                    </div>
                    <div className="gbb_upload-text">
                      <p className="gbb_upload-title">{t('greenBatch.uploadimg')}</p>
                    </div>
                    <button type="button" className="gbb_upload-button">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                      </svg>
                      {t('greenBatch.uploadimg')}
                    </button>
                  </div>
                ) : (
                  <div className="gbb_image-preview-grid">
                    {existingImages.map((imageUrl, index) => (
                      <div key={`existing-${index}`} className="gbb_image-preview-card">
                        <div className="gbb_image-preview">
                          <img
                            src={imageUrl.startsWith('http') ? imageUrl : `${REACT_APP_IMAGE_BASE_URL}${imageUrl}`}
                            alt="Existing"
                          />
                          <button
                            type="button"
                            className="gbb_image-remove"
                            onClick={() => removeExistingImage(index)}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
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
                  id="edit-image-upload"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <div className="gbb_image-actions">
                  {(selectedImages.length + existingImages.length) < 5 && (
                    <button
                      type="button"
                      className="gbb_add-image-btn"
                      onClick={addMoreImages}
                    >
                      + {t('greenBatch.addImage', {
                        count: selectedImages.length + existingImages.length
                      })} ({selectedImages.length + existingImages.length}/5)
                    </button>

                  )}
                  {(selectedImages.length > 0 || existingImages.length > 0) && (
                    <button
                      type="button"
                      className="gbb_change-image-btn"
                      onClick={() => {
                        setExistingImages([]);
                        setSelectedImages([]);
                        document.getElementById('edit-image-upload').click();
                      }}
                    >
                      {t('greenBatch.changeimg')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="gbb_form-actions">
            <button type="submit" className="gbb_update-button">{t('common.save')}</button>
            <button type="button" className="gbb_cancel-button" onClick={onClose}>{t('common.cancel')}</button>
          </div>
        </form>
      </div>

      {showVendorModal && (
        <div className="gbb_modal-overlay" onClick={() => setShowVendorModal(false)}>
          <div className="gbb_select-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="gbb_select-modal_header">
              <h3>{t('greenBatch.selectVendor')}</h3>
              <button className="gbb_close-button" onClick={() => setShowVendorModal(false)}>×</button>
            </div>
            <div className="gbb_select-modal-body">
              <input
                type="text"
                placeholder={t('vendor.searchPlaceholder') || 'Tìm kiếm nhà cung cấp...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="gbb_search-input"
              />
              <div className="gbb_vendor-list">
                {loadingVendors ? (
                  <div className="gbb_loading">{t('common.loading')}</div>
                ) : filteredVendors.length > 0 ? (
                  filteredVendors.map(vendor => (
                    <div
                      key={vendor.uuid}
                      className="gbb_vendor-item"
                      onClick={() => selectVendor(vendor)}
                    >
                      <span className="gbb_vendor-name">{vendor.name}</span>
                      {vendor.vendor_code && (
                        <span className="gbb_vendor-code">({vendor.vendor_code})</span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="gbb_no-vendors">{t('common.noResults')}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditBatchForm;