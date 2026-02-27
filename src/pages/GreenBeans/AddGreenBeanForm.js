import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './AddGreenBeanForm.css';
import { ArrowLeftIcon, TrashIcon } from '../../components/Icons';
import { API_BASE_URL } from '../../api/config';
import { showToast } from '../../components/Toast/Toast';

const AddGreenBeanForm = ({ onBack, onSubmit, selectedContext }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    origin_id: '',
    green_bean_name: '',
    green_bean_code: '',
    variety: '',
    processing: '',
    variety_type: '',
    altitude: '',
    crop_year: ''
  });
  const [selectedOrigins, setSelectedOrigins] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [selectModal, setSelectModal] = useState({ show: false, type: '', data: [], selected: [] });
  const [confirmModal, setConfirmModal] = useState({ show: false, formData: null });
  const [batchModal, setBatchModal] = useState({ show: false });
  const [batchData, setBatchData] = useState({
    moisture: '',
    size: '',
    weight: '',
    density: '',
    vendor_id: '',
    is_sample: false
  });
  const [createOriginModal, setCreateOriginModal] = useState({ show: false });
  const [originData, setOriginData] = useState({
    country_name: '',
    region: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteOriginModal, setDeleteOriginModal] = useState({ show: false, origin: null });
  const [editOriginModal, setEditOriginModal] = useState({ show: false, origin: null });
  const [currentOriginPage, setCurrentOriginPage] = useState(1);
  const [originsPerPage] = useState(10);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [showCreateVendorModal, setShowCreateVendorModal] = useState(false);
  const [newVendorData, setNewVendorData] = useState({
    vendor_code: '',
    name: '',
    address: '',
    phone_number: ''
  });
  const [vendorErrors, setVendorErrors] = useState({});

  const TOAST_TYPES = {
    ERROR: "error",
    SUCCESS: "success",
    INFO: "info",
  };


  const title =
    selectModal.type === "origin"
      ? t("modal.select_origin")
      : t("modal.select_supplier");

  const noDataMessage =
    (selectModal.data ?? []).length === 0
      ? 'Không có dữ liệu'
      : 'Không tìm thấy kết quả phù hợp';
  const message =
    vendors.length === 0
      ? 'Không có dữ liệu'
      : 'Không tìm thấy kết quả phù hợp';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleConfirmCreateBatch = () => {
    setBatchModal({ show: true });
  };

  const handleSkipCreateBatch = async () => {
    try {
      const policyId = await getPolicyId();
      if (!policyId) {
        showToast(t('greenBeans.policyNotFound'), 'error');
        return;
      }
      const requestData = { ...confirmModal.formData, policy_id: policyId };
      const response = await fetch(`${API_BASE_URL}/greenbeans/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      if (response.ok) {
        showToast(t('toast.create_gbbsuccess'), 'success');
        setConfirmModal({ show: false, formData: null });
        setFormData({
          origin_id: '',
          green_bean_name: '',
          green_bean_code: '',
          variety: '',
          processing: '',
          variety_type: '',
          altitude: '',
          crop_year: ''
        });
        setSelectedOrigins([]);
        if (onSubmit) onSubmit();
        if (onBack) onBack();
      }
    } catch (error) {
      // silent
    }
  };

  const handleBatchChange = (e) => {
    const { name, value } = e.target;
    setBatchData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      let policyId;
      if (selectedContext?.type === 'personal') {
        const policyResponse = await fetch(`${API_BASE_URL}/policies/personal`, { credentials: 'include' });
        if (policyResponse.ok) {
          const policyData = await policyResponse.json();
          policyId = policyData.data?.uuid;
        }
      } else if (selectedContext?.type === 'organization') {
        const policyResponse = await fetch(`${API_BASE_URL}/policies/organization/${selectedContext.uuid}`, { credentials: 'include' });
        if (policyResponse.ok) {
          const policyData = await policyResponse.json();
          policyId = policyData.data?.uuid;
        }
      }
      if (!policyId) {
        showToast(
          t('greenBeans.policyNotFound'),
          'error'
        );

        return;
      }
      const requestData = { ...confirmModal.formData, policy_id: policyId };
      const greenbeanResponse = await fetch(`${API_BASE_URL}/greenbeans/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      if (!greenbeanResponse.ok) {
        let errorMessage = t("greenBeans.unknown");

        try {
          const errorData = await greenbeanResponse.json();
          errorMessage = errorData?.message ?? errorMessage;
        } catch {
          // response not JSON
        }

        showToast(
          t("greenBeans.createGreenBean", { message: errorMessage }),
          TOAST_TYPES.ERROR
        );

        return;
      }

      const greenbeanResult = await greenbeanResponse.json();
      const greenbeanId = greenbeanResult.data?.greenbeanId;
      if (!greenbeanId) {
        showToast(
          t("greenBeans.createGreenBean_1"),
          TOAST_TYPES.ERROR
        );
        return;
      }
      const batchSubmitData = {
        green_bean_id: greenbeanId,
        moisture: parseFloat(batchData.moisture),
        size: batchData.size || null,
        weight: parseFloatOrNull(batchData.weight),
        density: parseFloatOrNull(batchData.density),
        vendor_id: batchData.vendor_id || null,
        is_sample: batchData.is_sample === 'true' || batchData.is_sample === true,
        policy_id: policyId
      };
      const batchResponse = await fetch(`${API_BASE_URL}/greenbeanbatch/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchSubmitData)
      });
      const batchResult = await batchResponse.json();
      if (batchResponse.ok) {
        showToast(t('greenBeans.createGreenBeanAndBatch'), 'success');
        resetAllForms();
      } else {
        showToast(
          t('greenBatch.createBatch_1', {
            message: batchResult?.message || t('greenBeans.unknown')
          }),
          'error'
        );
      }
    } catch (error) {
      showToast(t('greenBatch.createBatch_2'), 'error');
    }
  };

  const fetchVendors = async () => {
    try {
      let policyId;
      if (selectedContext?.type === 'personal') {
        const policyResponse = await fetch(`${API_BASE_URL}/policies/personal`, { credentials: 'include' });
        if (policyResponse.ok) {
          const policyData = await policyResponse.json();
          policyId = policyData.data?.uuid;
        }
      } else if (selectedContext?.type === 'organization') {
        const policyResponse = await fetch(`${API_BASE_URL}/policies/organization/${selectedContext.uuid}`, { credentials: 'include' });
        if (policyResponse.ok) {
          const policyData = await policyResponse.json();
          policyId = policyData.data?.uuid;
        }
      }
      if (!policyId) {
        setVendors([]);
        return [];
      }
      const response = await fetch(`${API_BASE_URL}/vendors?policy_id=${policyId}`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        const list = data.data || [];
        setVendors(list);
        return list;
      }
      setVendors([]);
      return [];
    } catch (error) {
      setVendors([]);
      return [];
    }
  };

  const openSelectModal = async (type) => {
    if (type === 'vendor') {
      const fetched = await fetchVendors();
      setSelectModal({ show: true, type: 'vendor', data: fetched, selected: [] });
      setSearchTerm('');
      return;
    }
    try {
      let policyId;
      if (selectedContext?.type === 'personal') {
        const policyResponse = await fetch(`${API_BASE_URL}/policies/personal`, { credentials: 'include' });
        if (policyResponse.ok) {
          const policyData = await policyResponse.json();
          policyId = policyData.data?.uuid;
        }
      } else if (selectedContext?.type === 'organization') {
        const policyResponse = await fetch(`${API_BASE_URL}/policies/organization/${selectedContext.uuid}`, { credentials: 'include' });
        if (policyResponse.ok) {
          const policyData = await policyResponse.json();
          policyId = policyData.data?.uuid;
        }
      }
      if (!policyId) return;
      let url = type === 'origin' ? `${API_BASE_URL}/origins?policy_id=${policyId}` : `${API_BASE_URL}/greenbeanbatch?policy_id=${policyId}`;
      const response = await fetch(url, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        let items = Array.isArray(data) ? data : data.data || data.results || [];
        items = items.sort((a, b) => {
          if (a.is_default && !b.is_default) return 1;
          if (!a.is_default && b.is_default) return -1;
          return 0;
        });
        setSelectModal({ show: true, type, data: items, selected: [] });
        setSearchTerm('');
        setCurrentOriginPage(1);
      }
    } catch (error) {
      // silent
    }
  };

  const handleOriginChange = (e) => {
    const { name, value } = e.target;
    setOriginData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateOrigin = async (e) => {
    e.preventDefault();
    try {
      let policyId;
      if (selectedContext?.type === 'personal') {
        const policyResponse = await fetch(`${API_BASE_URL}/policies/personal`, { credentials: 'include' });
        if (policyResponse.ok) {
          const policyData = await policyResponse.json();
          policyId = policyData.data?.uuid;
        }
      } else if (selectedContext?.type === 'organization') {
        const policyResponse = await fetch(`${API_BASE_URL}/policies/organization/${selectedContext.uuid}`, { credentials: 'include' });
        if (policyResponse.ok) {
          const policyData = await policyResponse.json();
          policyId = policyData.data?.uuid;
        }
      }
      if (!policyId) {
        showToast(
          t('greenBatch.policyNotFound_1'),
          'error'
        );

        return;
      }
      const requestData = { ...originData, policy_id: policyId };
      const response = await fetch(`${API_BASE_URL}/origins`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      if (response.ok) {
        setCreateOriginModal({ show: false });
        setOriginData({ country_name: '', region: '' });
        openSelectModal('origin');
        showToast(
          t('greenBatch.createOrigin'),
          'success'
        );

      } else {
        const errorData = await response.json();
        showToast(
          t('greenBatch.createOrigin_1', {
            message: errorData?.message || t('greenBatch.unknown')
          }),
          'error'
        );

      }
    } catch (error) {
      showToast(
        t('greenBatch.connection', {
          message: error?.message || t('greenBatch.unknown')
        }),
        'error'
      );

    }
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[0-9+\-\s()]{10,15}$/;
    return phoneRegex.test(phone);
  };

  const generateVendorCode = () => {
    const existingCodes = vendors
      .map((v) => v.vendor_code)
      .filter((code) => code && code.length === 4 && !isNaN(code))
      .map((code) => parseInt(code, 10))
      .sort((a, b) => b - a);
    const nextNumber = existingCodes.length > 0 ? existingCodes[0] + 1 : 1;
    return nextNumber.toString().padStart(4, '0');
  };

  const validateVendorForm = () => {
    const newErrors = {};
    if (!newVendorData.name.trim()) {
      newErrors.name = t("greenBeans.nameRequired");
    }
    if (newVendorData.phone_number && !validatePhone(newVendorData.phone_number)) {
      newErrors.phone_number = t("greenBeans.invalidPhoneNumber");
    }
    return newErrors;
  };

  const resetVendorForm = () => {
    setShowCreateVendorModal(false);
    setNewVendorData({ vendor_code: '', name: '', address: '', phone_number: '' });
    setVendorErrors({});
  };

  const handleCreateVendor = async (e) => {
    e.preventDefault();

    const errors = validateVendorForm();
    if (Object.keys(errors).length > 0) {
      setVendorErrors(errors);
      return;
    }

    try {
      const policyId = await getPolicyId();
      if (!policyId) {
        showToast(t('greenBatch.policyNotFound'), 'error');
        return;
      }

      const vendorCode = newVendorData.vendor_code.trim() || generateVendorCode();
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vendorData)
      });

      if (response.ok) {
        await fetchVendors();
        openSelectModal('vendor');
        showToast(t('greenBatch.createSupplier'), 'success');
        resetVendorForm();
      } else {
        const errorData = await response.json();
        showToast(
          t('greenBatch.createBatchError', {
            message: errorData?.message || t('greenBatch.unknown')
          }),
          'error'
        );
      }
    } catch (error) {
      showToast(t('greenBatch.serverConnection'), 'error');
    }
  };

  const selectOrigin = (item) => {
    const originId = item.uuid || item.origin_id;
    setSelectedOrigins([item]);
    setFormData((prev) => ({ ...prev, origin_id: originId }));
    setSelectModal({ show: false, type: '', data: [], selected: [] });
    setSearchTerm('');
  };

  const selectVendor = (item) => {
    setSelectedVendor(item);
    setBatchData((prev) => ({ ...prev, vendor_id: item.uuid }));
    setSelectModal({ show: false, type: '', data: [], selected: [] });
    setSearchTerm('');
  };

  const handleDeleteOrigin = (origin) => {
    setDeleteOriginModal({ show: true, origin });
  };

  const handleEditOrigin = (origin) => {
    setEditOriginModal({ show: true, origin });
    setOriginData({ country_name: origin.country_name, region: origin.region, policy_id: origin.policy_id });
  };

  const handleUpdateOrigin = async (e) => {
    e.preventDefault();
    const originId = editOriginModal.origin?.uuid;
    if (!originId) {
      showToast(
        t('greenBatch.originIdNotFound'),
        'error'
      );

      return;
    }
    const updateData = { country_name: originData.country_name, region: originData.region, policy_id: originData.policy_id || editOriginModal.origin.policy_id };
    try {
      const response = await fetch(`${API_BASE_URL}/origins/${originId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      if (response.ok) {
        setEditOriginModal({ show: false, origin: null });
        setOriginData({ country_name: '', region: '' });
        openSelectModal('origin');
        showToast(
          t('greenBatch.updateOrigin'),
          'success'
        );

      } else {
        const errorData = await response.json();
        showToast(
          t('greenBatch.update', {
            message: errorData?.message || t('greenBatch.unknown')
          }),
          'error'
        );

      }
    } catch (error) {
      showToast(
        t('greenBatch.connection', {
          message: error?.message || t('greenBatch.unknown')
        }),
        'error'
      );

    }
  };

  const confirmDeleteOrigin = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/origins/${deleteOriginModal.origin.uuid}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) {
        setDeleteOriginModal({ show: false, origin: null });
        openSelectModal('origin');
      }
    } catch (error) {
      // silent
    }
  };

  // Helper function to reset all forms
  const resetAllForms = () => {
    setBatchModal({ show: false });
    setConfirmModal({ show: false, formData: null });
    setBatchData({ moisture: '', size: '', weight: '', density: '', vendor_id: '', is_sample: false });
    setFormData({
      origin_id: '',
      green_bean_name: '',
      green_bean_code: '',
      variety: '',
      processing: '',
      variety_type: '',
      altitude: '',
      crop_year: ''
    });
    setSelectedOrigins([]);
    if (onSubmit) onSubmit();
    if (onBack) onBack();
  };

  // Helper function to parse float or return null
  const parseFloatOrNull = (value) => value ? parseFloat(value) : null;

  // Helper function to get policy ID
  const getPolicyId = async () => {
    const isPersonal = selectedContext?.type === 'personal';
    const url = isPersonal
      ? `${API_BASE_URL}/policies/personal`
      : `${API_BASE_URL}/policies/organization/${selectedContext.uuid}`;

    const response = await fetch(url, { credentials: 'include' });
    return response.ok ? (await response.json()).data?.uuid : null;
  };

  // Helper functions
  const hasSelectedOrigin = () => selectedOrigins.length > 0;

  const getSelectedOriginDisplay = () => {
    if (!hasSelectedOrigin()) return null;
    const origin = selectedOrigins[0];
    return `${origin.region}, ${origin.country_name}`;
  };

  const clearSelectedOrigin = () => {
    setSelectedOrigins([]);
    setFormData((prev) => ({ ...prev, origin_id: '' }));
  };

  const clearSelectedVendor = () => {
    setSelectedVendor(null);
    setBatchData((prev) => ({ ...prev, vendor_id: '' }));
  };

  const isOriginModal = () => selectModal.type === 'origin';
  const isVendorModal = () => selectModal.type === 'vendor';
  const hasFilteredOrigins = () => filteredOrigins.length > 0;
  const hasFilteredVendors = () => filteredVendors.length > 0;

  const renderVendorTag = () => {
    return selectedVendor ? (
      <span className="gb_input-tag">
        {selectedVendor.name}
        <button type="button" className="gb_tag-remove" onClick={clearSelectedVendor}>×</button>
      </span>
    ) : (
      <span className="gb_placeholder-text">{t("auto.chn_nh_cung_cp_425")}</span>
    );
  };

  const renderVendorRow = (item) => {
    const itemId = item.uuid;
    return (
      <tr key={itemId} onClick={() => selectVendor(item)} style={{ cursor: 'pointer' }}>
        <td className="gb_batch-name">{item.name}</td>
        <td>{item.phone_number || 'Chưa có'}</td>
        <td>
          <input type="radio" name="vendor-select" onChange={() => selectVendor(item)} className="gb_select-radio" onClick={(e) => e.stopPropagation()} />
        </td>
      </tr>
    );
  };

  const getUniqueCountries = () => {
    const data = Array.isArray(selectModal.data) ? selectModal.data : [];
    return data.map((item) => item.country_name).filter((country, idx, arr) => country && arr.indexOf(country) === idx).sort();
  };

  const data = Array.isArray(selectModal.data)
    ? selectModal.data
    : [];

  const lowerSearch = searchTerm?.toLowerCase();

  const filteredOrigins = data.filter((item) => {
    if (!item) return false;

    const country = item.country_name?.toLowerCase() || "";
    const region = item.region?.toLowerCase() || "";

    const matchesSearch =
      !lowerSearch ||
      country.includes(lowerSearch) ||
      region.includes(lowerSearch);

    const matchesCountry =
      !selectedCountry || item.country_name === selectedCountry;

    return matchesSearch && matchesCountry;
  });



  const filteredVendors = (Array.isArray(vendors) ? vendors : [])
    .filter(item =>
      !lowerSearch ||
      item.name?.toLowerCase().includes(lowerSearch)
    );


  // pagination for origins (moved out of JSX to avoid inline IIFE)
  const totalOriginPages = Math.max(1, Math.ceil(filteredOrigins.length / originsPerPage));
  const startIndex = (currentOriginPage - 1) * originsPerPage;
  const paginatedOrigins = filteredOrigins.slice(startIndex, startIndex + originsPerPage);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.origin_id) {
      showToast(
        t('greenBatch.selectOrigin'),
        'warning'
      );

      return;
    }
    const submitData = {
      ...formData,
      altitude: parseInt(formData.altitude, 10),
      variety_type: formData.variety_type || null,
      green_bean_code: formData.green_bean_code?.trim() || null
    };
    setConfirmModal({ show: true, formData: submitData });
  };

  return (
    <div className="gb_add-greenbean-container">
      <div className="gb_add-greenbean-wrapper">
        <button className="gb_add-back-button" onClick={onBack}>
          <ArrowLeftIcon size={16} />
          {t('common.back')}
        </button>
        <div className="gb_add-greenbean-header">
          <h1 className="gb_add-greenbean-title">{t('greenBeans.addGreenBeanTitle')}</h1>
          <p className="gb_add-greenbean-subtitle">{t('greenBeans.addGreenBeanSubtitle')}</p>
        </div>
        <form className="gb_add-greenbean-form" onSubmit={handleSubmit}>
          <div className="gb_form-group">
            <label htmlFor="origin_id">{t('greenBeans.origin')} <span className="gb_required">*</span></label>
            <div className="gb_input-with-button">
              <div className="gb_input-with-tags">
                {hasSelectedOrigin() ? (
                  <span className="gb_input-tag">
                    {getSelectedOriginDisplay()}
                    <button type="button" className="gb_tag-remove" onClick={clearSelectedOrigin}>×</button>
                  </span>
                ) : (
                  <span className="gb_placeholder-text">{t('greenBeans.selectOrigin')}</span>
                )}
              </div>
              <button type="button" className="gb_select-button" onClick={() => openSelectModal('origin')}>
                {t('common.select')}
              </button>
            </div>
          </div>

          <div className="gb_form-row">
            <div className="gb_form-group half-width">
              <label htmlFor="green_bean_name">{t('greenBeans.greenBeanName')} <span className="gb_required">*</span></label>
              <input type="text" id="green_bean_name" name="green_bean_name" value={formData.green_bean_name} onChange={handleChange} placeholder={t('greenBeans.NamePlaceholder')} required />
            </div>
          </div>

          <div className="gb_form-row">
            {/* CHI */}
            <div className="gb_form-group half-width">
              <label htmlFor="variety">{t("greenBeans.varietyLabel")}<span className="gb_required">*</span></label>
              <select
                id="variety"
                name="variety"
                value={formData.variety}
                onChange={handleChange}
                required
              >
                <option value="">{t("auto.chn_loi_ging_369")}</option>
                <option value="Arabica">Arabica</option>
                <option value="Robusta">Robusta</option>
                <option value="Liberica">Liberica</option>
              </select>
            </div>

            {/* GIỐNG */}
            <div className="gb_form-group half-width">
              <label htmlFor="variety_type">{t("auto.ging_368")}</label>
              <input
                type="text"
                id="variety_type"
                name="variety_type"
                value={formData.variety_type}
                onChange={handleChange}
                placeholder={t("auto.v_d_typica_370")}
              />
            </div>
          </div>


          <div className="gb_form-row">
            <div className="gb_form-group half-width">
              <label htmlFor="processing">{t("auto.phng_php_s_ch_371")}<span className="gb_required">*</span></label>
              <select id="processing" name="processing" value={formData.processing} onChange={handleChange} required>
                <option value="">{t("auto.chn_phng_php_372")}</option>
                <option value="Natural">Natural</option>
                <option value="Washed">Washed</option>
                <option value="Honey">Honey</option>
                <option value={t("auto.anaerobic_fermentation_373")}>{t("auto.anaerobic_fermentation_ln_men__374")}</option>
                <option value={t("auto.carbonic_maceration_375")}>{t("auto.carbonic_maceration_ln_men_car_376")}</option>
                <option value="Lactic">Lactic</option>
                <option value="Infused">Infused</option>
                <option value={t("auto.giling_basah_377")}>{t("auto.giling_basah_wet_hulling_378")}</option>
                <option value={t("auto.white_honey_379")}>{t("auto.white_honey_380")}</option>
                <option value={t("auto.yellow_honey_381")}>{t("auto.yellow_honey_382")}</option>
                <option value={t("auto.red_honey_383")}>{t("auto.red_honey_384")}</option>
                <option value={t("auto.black_honey_385")}>{t("auto.black_honey_386")}</option>
              </select>
            </div>
            <div className="gb_form-group half-width">
              <label htmlFor="altitude">{t("auto._cao_m_387")}<span className="gb_required">*</span></label>
              <input type="number" id="altitude" name="altitude" value={formData.altitude} onChange={handleChange} placeholder={t("auto.v_d_1500_388")} required />
            </div>
          </div>

          <div className="gb_form-row">
            <div className="gb_form-group half-width">
              <label htmlFor="crop_year">{t("auto.nm_thu_hoch_389")}<span className="gb_required">*</span></label>
              <input type="number" id="crop_year" name="crop_year" value={formData.crop_year} onChange={handleChange}
                onBlur={(e) => {
                  const year = parseInt(e.target.value, 10);
                  const currentYear = new Date().getFullYear();
                  if (year && (year < 1901 || year > currentYear)) {
                    showToast(
                      t('greenBatch.harvestYearMax', {
                        year: currentYear
                      }),
                      'warning'
                    );

                    setFormData((prev) => ({ ...prev, crop_year: '' }));
                  }
                }}
                placeholder={t("auto.v_d_2024_390")}
                min="1901"
                max={new Date().getFullYear()}
                step="1"
                required />
            </div>
          </div>

          <div className="gb_form-actions">
            <button type="submit" className="gb_submit-button">
              {t('greenBeans.saveInfo')}
            </button>
            <button type="button" className="gb_cancel-button" onClick={onBack}>
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>

      {selectModal.show && (
        <div className="gb_modal-overlay1" style={{ zIndex: 1001 }} onClick={() => setSelectModal({ show: false, type: '', data: [], selected: [] })}>
          <div className="gb_select-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="gb_select-modal-header">
              <h3 style={{ color: '#1F429B' }}>{title}</h3>
              <button className="gb_close-button" onClick={() => setSelectModal({ show: false, type: '', data: [], selected: [] })}>×</button>
            </div>

            {isOriginModal() ? (
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                  <button className="gb_create-origin-btn" onClick={() => setCreateOriginModal({ show: true })} style={{ whiteSpace: 'nowrap', flex: '1', padding: '8px 12px' }}>{t("auto._to_391")}</button>
                  <select value={selectedCountry} onChange={(e) => { setSelectedCountry(e.target.value); setCurrentOriginPage(1); }} style={{ flex: '1', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', background: 'white' }}>
                    <option value="">{t("auto.quc_gia_392")}</option>
                    <optgroup label="Recommend">
                      <option value="Ethiopia">Ethiopia</option>
                      <option value="Colombia">Colombia</option>
                      <option value="Brazil">Brazil</option>
                      <option value="Kenya">Kenya</option>
                      <option value="Guatemala">Guatemala</option>
                      <option value={t("auto.vit_nam_393")}>{t("auto.vit_nam_394")}</option>
                    </optgroup>
                    <optgroup label={t("auto.tt_c_395")}>
                      {getUniqueCountries().map((country) => <option key={country} value={country}>{country}</option>)}
                    </optgroup>
                  </select>
                </div>
                <input type="text" placeholder={t("auto.tm_kim_theo_quc_gia_hoc_vng_396")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="gb_modal-search-input" style={{ width: '100%', padding: '8px 10px' }} />
              </div>
            ) : (
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                  <button className="gb_create-origin-btn" onClick={() => setShowCreateVendorModal(true)} style={{ whiteSpace: 'nowrap', flex: '0 0 auto', padding: '8px 12px' }}>{t("auto._to_397")}</button>
                </div>
                <input type="text" placeholder={t("auto.tm_kim_theo_tn_nh_cung_cp_398")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="gb_modal-search-input" style={{ width: '100%', padding: '8px 10px' }} />
              </div>
            )}

            <div style={{ padding: '0 16px 12px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <div className="gb_table-header-row">
                {isOriginModal() ? (
                  <>
                    <span className="gb_header-col gb_header-country">{t("auto.quc_gia_399")}</span>
                    <span className="gb_header-col gb_header-region">{t("auto.khu_vc_400")}</span>
                    <span className="gb_header-col gb_header-select">{t("auto.chn_401")}</span>
                    <span className="gb_header-col gb_header-action"></span>
                  </>
                ) : (
                  <>
                    <span className="gb_header-col gb_header-country">{t("auto.tn_402")}</span>
                    <span className="gb_header-col gb_header-region">{t("auto.lin_h_403")}</span>
                    <span className="gb_header-col gb_header-select">{t("auto.chn_404")}</span>
                  </>
                )}
              </div>
            </div>

            <div className="gb_select-modal-body">
              {isOriginModal() ? (
                hasFilteredOrigins() ? (
                  <>
                    <div className="gb_select-table-container">
                      <table className="gb_select-table">
                        <tbody>
                          {paginatedOrigins.map((item, index) => {
                            const itemId = item.origin_id || item.uuid || index + 1;
                            return (
                              <tr key={itemId} onClick={() => selectOrigin(item)} style={{ cursor: 'pointer' }}>
                                <td className="gb_batch-name">{item.country_name || 'Chưa có thông tin'}</td>
                                <td>{item.region || '-'}</td>
                                <td>
                                  <input type="radio" name="origin-select" onChange={() => selectOrigin(item)} className="gb_select-radio" onClick={(e) => e.stopPropagation()} />
                                </td>
                                <td>
                                  {!item.is_default ? (
                                    <>
                                      <button type="button" className="gb_edit-icon-btn" onClick={(e) => { e.stopPropagation(); handleEditOrigin(item); }} title={t("auto.sa_405")}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1F429B" strokeWidth="2">
                                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                      </button>
                                      <button type="button" className="gb_delete-icon-btn" onClick={(e) => { e.stopPropagation(); handleDeleteOrigin(item); }} title={t("auto.xa_407")}>
                                        <TrashIcon size={16} color="#dc3545" />
                                      </button>
                                    </>
                                  ) : (
                                    <button type="button" className="gb_delete-icon-btn" disabled title={t("auto.khng_th_xa_origin_mc_nh_406")} style={{ opacity: 0.3, cursor: 'not-allowed' }}>
                                      <TrashIcon size={16} color="#6b7280" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {totalOriginPages > 1 && (
                      <div className="gb_pagination">
                        <button className="gb_pagination-btn" onClick={() => setCurrentOriginPage((prev) => Math.max(prev - 1, 1))} disabled={currentOriginPage === 1}>{t("auto.trc_408")}</button>
                        <span className="gb_pagination-info">Trang {currentOriginPage} / {totalOriginPages} ({filteredOrigins.length})</span>
                        <button className="gb_pagination-btn" onClick={() => setCurrentOriginPage((prev) => Math.min(prev + 1, totalOriginPages))} disabled={currentOriginPage === totalOriginPages}>{t("auto.tip_410")}</button>
                      </div>
                    )}
                  </>
                ) : (

                  <div className="gb_no-data">{noDataMessage}</div>
                )
              ) : (
                hasFilteredVendors() ? (
                  <div className="gb_select-table-container">
                    <table className="gb_select-table gb_vendor-table">
                      <tbody>
                        {filteredVendors.map(renderVendorRow)}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="gb_no-data">{message}</div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {confirmModal.show && !batchModal.show && (
        <div className="gb_modal-overlay">
          <div className="gb_confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gb_confirm-modal-header"><h3 style={{ color: '#1F429B' }}>{t("auto.thnh_cng_411")}</h3></div>
            <div className="gb_confirm-modal-body"><p>{t("auto.bn_c_mun_to_l_mi_cho_nhn_xanh__412")}</p></div>
            <div className="gb_confirm-modal-actions">
              <button className="gb_cancel-btn" onClick={handleSkipCreateBatch}>{t("auto.khng_413")}</button>
              <button className="gb_confirm-btn" onClick={handleConfirmCreateBatch}>{t("auto.c_414")}</button>
            </div>
          </div>
        </div>
      )}

      {batchModal.show && (
        <div className="gb_modal-overlay" style={{ zIndex: 1000 }}>
          <div className="gb_batch-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="gb_batch-modal-header">
              <h3 style={{ color: '#1F429B' }}>{t("auto.to_l_mi_415")}</h3>
              <button className="gb_close-button" onClick={() => { setBatchModal({ show: false }); setBatchData({ moisture: '', size: '', weight: '', density: '', vendor_id: '', is_sample: false }); }}>×</button>
            </div>
            <form onSubmit={handleCreateBatch} className="gb_batch-form">
              <div className="gb_form-row">
                <div className="gb_form-group half-width">
                  <label>{t("auto._m_416")}</label>
                  <input type="number" name="moisture" step="0.1" placeholder={t("auto.vd_125_417")} value={batchData.moisture} onChange={handleBatchChange} />
                </div>
                <div className="gb_form-group half-width">
                  <label>{t("auto.sn_418")}</label>
                  <input type="text" name="size" placeholder={t("auto.vd_18_419")} value={batchData.size} onChange={handleBatchChange} />
                </div>
              </div>

              <div className="gb_form-row">
                <div className="gb_form-group half-width">
                  <label>{t("auto.khi_lng_kg_420")}<span className="gb_required">*</span></label>
                  <input type="number" name="weight" step="0.1" placeholder={t("auto.vd_60_421")} value={batchData.weight} onChange={handleBatchChange} required />
                </div>
                <div className="gb_form-group half-width">
                  <label>{t("auto.t_trng_gml_422")}</label>
                  <input type="number" name="density" placeholder={t("auto.vd_500_423")} value={batchData.density} onChange={handleBatchChange} />
                </div>
              </div>

              <div className="gb_form-row">
                <div className="gb_form-group half-width">
                  <label>{t("auto.nh_cung_cp_424")}<span className="gb_required">*</span></label>
                  <div className="gb_input-with-button">
                    <div className="gb_input-with-tags">
                      {renderVendorTag()}
                    </div>
                    <button type="button" className="gb_select-button" onClick={() => openSelectModal('vendor')}>{t("auto.chn_426")}</button>
                  </div>
                </div>

                <div className="gb_form-group half-width">
                  <label>{t("auto.l_mu_th_427")}</label>
                  <select name="is_sample" value={batchData.is_sample} onChange={handleBatchChange}>
                    <option value={false}>{t("auto.khng_428")}</option>
                    <option value={true}>{t("auto.c_429")}</option>
                  </select>
                </div>
              </div>

              <div className="gb_form-actions">
                <button type="submit" className="gb_submit-button">{t("auto.to_l_430")}</button>
                <button type="button" className="gb_cancel-button" onClick={() => { setBatchModal({ show: false }); setBatchData({ moisture: '', size: '', weight: '', density: '', vendor_id: '', is_sample: false }); }}>{t("auto.hy_431")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {createOriginModal.show && (
        <div className="gb_modal-overlay gb_create-origin-overlay">
          <div className="gb_create-origin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="gb_create-origin-modal-header">
              <h3 style={{ color: '#1F429B' }}>{t("auto.to_origin_mi_432")}</h3>
              <button className="gb_close-button" onClick={() => setCreateOriginModal({ show: false })}>×</button>
            </div>
            <form onSubmit={handleCreateOrigin} className="gb_create-origin-form">
              <div className="gb_form-group">
                <label>{t("auto.quc_gia_433")}<span className="gb_required">*</span></label>
                <input type="text" name="country_name" placeholder={t("auto.v_d_vit_nam_434")} value={originData.country_name} onChange={handleOriginChange} required />
              </div>
              <div className="gb_form-group">
                <label>{t("auto.vng_435")}<span className="gb_required">*</span></label>
                <input type="text" name="region" placeholder={t("auto.v_d_tphcm_436")} value={originData.region} onChange={handleOriginChange} required />
              </div>
              <div className="gb_form-actions">
                <button type="button" className="gb_cancel-button" onClick={() => setCreateOriginModal({ show: false })}>{t("auto.hy_437")}</button>
                <button type="submit" className="gb_submit-button">{t("auto.to_origin_438")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editOriginModal.show && (
        <div className="gb_modal-overlay gb_edit-origin-overlay" onClick={() => setEditOriginModal({ show: false, origin: null })}>
          <div className="gb_create-origin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="gb_create-origin-modal-header">
              <h3 style={{ color: '#1F429B' }}>{t("auto.sa_origin_439")}</h3>
              <button className="gb_close-button" onClick={() => setEditOriginModal({ show: false, origin: null })}>×</button>
            </div>
            <form onSubmit={handleUpdateOrigin} className="gb_create-origin-form">
              <div className="gb_form-group">
                <label>{t("auto.quc_gia_440")}<span className="gb_required">*</span></label>
                <input type="text" name="country_name" placeholder={t("auto.v_d_vit_nam_441")} value={originData.country_name} onChange={handleOriginChange} required />
              </div>
              <div className="gb_form-group">
                <label>{t("auto.vng_442")}<span className="gb_required">*</span></label>
                <input type="text" name="region" placeholder={t("auto.v_d_tphcm_443")} value={originData.region} onChange={handleOriginChange} required />
              </div>
              <div className="gb_form-actions">
                <button type="button" className="gb_cancel-button" onClick={() => setEditOriginModal({ show: false, origin: null })}>{t("auto.hy_444")}</button>
                <button type="submit" className="gb_submit-button">{t("auto.cp_nht_445")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteOriginModal.show && (
        <div className="gb_modal-overlay" style={{ zIndex: 1010 }} onClick={() => setDeleteOriginModal({ show: false, origin: null })}>
          <div className="gb_delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gb_delete-modal-header"><h3>{t("auto.xc_nhn_xa_446")}</h3></div>
            <div className="gb_delete-modal-body">
              <p>{t("auto.bn_c_chc_chn_mun_xa_origin_447")}<strong>{deleteOriginModal.origin?.region}, {deleteOriginModal.origin?.country_name}</strong>{t("auto.khng_448")}</p>
              <p className="gb_delete-warning">{t("auto.hnh_ng_ny_khng_th_hon_tc_449")}</p>
            </div>
            <div className="gb_delete-modal-actions">
              <button className="gb_cancel-btn" onClick={() => setDeleteOriginModal({ show: false, origin: null })}>{t("auto.hy_450")}</button>
              <button className="gb_delete-btn" onClick={confirmDeleteOrigin}>{t("auto.xa_451")}</button>
            </div>
          </div>
        </div>
      )}

      {showCreateVendorModal && (
        <div className="gb_modal-overlay" style={{ zIndex: 1200 }} onClick={() => setShowCreateVendorModal(false)}>
          <div className="gb_create-origin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="gb_create-origin-modal-header">
              <h3 style={{ color: '#1F429B' }}>{t("auto.to_nh_cung_cp_mi_452")}</h3>
              <button className="gb_close-button" onClick={() => setShowCreateVendorModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateVendor} className="gb_create-origin-form">
              {/* <div className="gb_form-group">
                <label>{t("auto.m_nh_cung_cp_453")}</label>
                <input type="text" value={newVendorData.vendor_code} onChange={(e) => setNewVendorData((prev) => ({ ...prev, vendor_code: e.target.value }))} />
              </div> */}
              <div className="gb_form-group">
                <label>{t("auto.tn_nh_cung_cp_454")}<span className="gb_required">*</span></label>
                <input
                  type="text"
                  value={newVendorData.name}
                  onChange={(e) => {
                    setNewVendorData((prev) => ({ ...prev, name: e.target.value }));
                    if (vendorErrors.name) {
                      setVendorErrors((prev) => ({ ...prev, name: '' }));
                    }
                  }}
                  required
                  placeholder={t("auto.tn_nh_cung_cp_455")}
                />
                {vendorErrors.name && <span className="gb_error-message" style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block' }}>{vendorErrors.name}</span>}
              </div>
              <div className="gb_form-group">
                <label>{t("auto.a_ch_456")}</label>
                <input type="text" value={newVendorData.address} onChange={(e) => setNewVendorData((prev) => ({ ...prev, address: e.target.value }))} placeholder={t("auto.a_ch_nh_cung_cp_457")} />
              </div>
              <div className="gb_form-group">
                <label>{t("auto.s_in_thoi_458")}</label>
                <input
                  type="tel"
                  value={newVendorData.phone_number}
                  onChange={(e) => {
                    setNewVendorData((prev) => ({ ...prev, phone_number: e.target.value }));
                    if (vendorErrors.phone_number) {
                      setVendorErrors((prev) => ({ ...prev, phone_number: '' }));
                    }
                  }}
                  placeholder={t("auto.s_in_thoi_459")}
                />
                {vendorErrors.phone_number && <span className="gb_error-message" style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block' }}>{vendorErrors.phone_number}</span>}
              </div>
              <div className="gb_form-actions">
                <button type="button" className="gb_cancel-button" onClick={() => setShowCreateVendorModal(false)}>{t("auto.hy_460")}</button>
                <button type="submit" className="gb_submit-button">{t("auto.to_461")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddGreenBeanForm;