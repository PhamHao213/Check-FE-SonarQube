import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../../api/config';
import { ArrowLeftIcon, LeafIcon, EditIcon, TrashIcon, CalendarIcon } from '../../components/Icons';
import './GreenBeanDetail.css';
import { canDelete, canEdit, usePermissions } from '../../utils/permissions';
import { showToast } from '../../components/Toast/Toast';

const GreenBeanDetail = ({ greenbeanId, onBack }) => {
  const { t } = useTranslation();
  const { permissions, role } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [greenBean, setGreenBean] = useState(null);
  const [origin, setOrigin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [selectedOrigins, setSelectedOrigins] = useState([]);
  const [selectModal, setSelectModal] = useState({ show: false, type: '', data: [], selected: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [cuppingScores, setCuppingScores] = useState([]);
  const [loadingCuppings, setLoadingCuppings] = useState(false);
  const [showCuppingDetails, setShowCuppingDetails] = useState(false);
  const lang = localStorage.getItem('language') || 'vi';
  const LOCALE_MAP = {
    en: 'en-US',
    vi: 'vi-VN'
  };

  const locale = LOCALE_MAP[lang] || 'vi-VN';

  useEffect(() => {
    fetchGreenBeanDetail();
    fetchCuppingScores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [greenbeanId]);

  const fetchGreenBeanDetail = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/greenbeans/${greenbeanId}`, {
        credentials: 'include',
        headers: {}
      });
      if (response.ok) {
        const data = await response.json();
        setGreenBean(data.data);

        if (data.data.origin_id) {
          const originResponse = await fetch(`${API_BASE_URL}/origins/${data.data.origin_id}`, {
            credentials: 'include',
            headers: {}
          });
          if (originResponse.ok) {
            const originData = await originResponse.json();
            setOrigin(originData.data);
          }
        }
      }
    } catch (error) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  const fetchCuppingScores = async () => {
    try {
      setLoadingCuppings(true);
      const cuppingResponse = await fetch(`${API_BASE_URL}/greenbean-cuppings/${greenbeanId}`, {
        credentials: 'include'
      });

      if (cuppingResponse.ok) {
        const cuppingData = await cuppingResponse.json();
        const cuppings = cuppingData.data || [];

        const validCuppings = cuppings.filter((cupping) => {
          const finalScore = cupping.total_score || cupping.final_score || 0;
          return finalScore > 0;
        });

        validCuppings.forEach((cupping) => {
          cupping.batch_info = {
            uuid: cupping.batch_id,
            green_bean_batch_code: cupping.green_bean_batch_code
          };
        });

        setCuppingScores(validCuppings);
      }
    } catch (error) {
      // Error handled silently
    } finally {
      setLoadingCuppings(false);
    }
  };

  const handleEditClick = () => {
    setEditFormData({
      origin_id: greenBean.origin_id,
      green_bean_name: greenBean.green_bean_name,
      green_bean_code: greenBean.green_bean_code,
      variety: greenBean.variety,
      processing: greenBean.processing,
      variety_type: greenBean.variety_type,
      altitude: greenBean.altitude,
      crop_year: greenBean.crop_year,
      vendor_name: greenBean.vendor_name || ''
    });
    setSelectedOrigins(origin ? [origin] : []);
    setShowEditModal(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const openSelectModal = async (type) => {
    try {
      const response = await fetch(`${API_BASE_URL}/origins/`, {
        credentials: 'include',
        headers: {}
      });
      if (response.ok) {
        const data = await response.json();
        const items = Array.isArray(data) ? data : data.data || data.results || [];
        const currentSelected = selectedOrigins.length > 0 ? [selectedOrigins[0].uuid] : [];
        setSelectModal({ show: true, type, data: items, selected: currentSelected });
        setSearchTerm('');
      }
    } catch (error) {
      // Error handled silently
    }
  };

  const selectOrigin = (item) => {
    setSelectedOrigins([item]);
    setEditFormData((prev) => ({ ...prev, origin_id: item.uuid }));
    setSelectModal({ show: false, type: '', data: [], selected: [] });
    setSearchTerm('');
    setSelectedCountry('');
    setCurrentPage(1);
  };

  const getUniqueCountries = () => {
    const countries = selectModal.data
      .map((item) => item.country_name)
      .filter((country, index, arr) => country && arr.indexOf(country) === index)
      .sort();
    return countries;
  };

  const filteredOrigins = selectModal.data.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      (item.country_name && item.country_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.region && item.region.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCountry = !selectedCountry || item.country_name === selectedCountry;

    return matchesSearch && matchesCountry;
  });

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!editFormData.origin_id) {
      showToast(t('greenBeans.selectOrigin') || 'Vui lòng chọn Origin', 'warning');
      return;
    }

    try {
      const updateData = {
        origin_id: editFormData.origin_id,
        green_bean_name: editFormData.green_bean_name,
        green_bean_code: editFormData.green_bean_code,
        variety: editFormData.variety,
        variety_type: editFormData.variety_type,
        processing: editFormData.processing,
        altitude: parseInt(editFormData.altitude) || 0,
        crop_year: editFormData.crop_year
      };

      const response = await fetch(`${API_BASE_URL}/greenbeans/${greenbeanId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        setShowEditModal(false);
        fetchGreenBeanDetail();
        fetchCuppingScores();
        showToast(t('common.success') || 'Cập nhật thành công!', 'success');
      } else {
        const errorData = await response.json();
        showToast(`${t('common.error') || 'Lỗi cập nhật'}: ${errorData.message || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      showToast(t('common.error') || 'Lỗi kết nối server', 'error');
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/greenbeans/${greenbeanId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {}
      });

      if (response.ok) {
        setShowDeleteModal(false);
        showToast(t('common.success') || 'Xóa thành công!', 'success');
        onBack();
      } else {
        const errorData = await response.json();
        showToast(`${t('common.error') || 'Lỗi xóa'}: ${errorData.message || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      showToast(t('common.error') || 'Lỗi kết nối server', 'error');
    }
  };

  const formatDate = (dateString) => {
    return dateString
      ? new Date(dateString).toLocaleString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      : 'N/A';
  };

  // Clean variables for origin selection
  const hasSelectedOrigin = selectedOrigins.length > 0;
  const selectedOrigin = hasSelectedOrigin ? selectedOrigins[0] : null;
  const originDisplayText = selectedOrigin
    ? `${selectedOrigin.region}, ${selectedOrigin.country_name}`
    : t('greenBeans.selectOriginPlaceholder');

  // Clean variables for filtered origins
  const hasFilteredOrigins = filteredOrigins.length > 0;
  const totalPages = Math.ceil(filteredOrigins.length / itemsPerPage);
  const showPagination = totalPages > 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrigins = filteredOrigins.slice(startIndex, startIndex + itemsPerPage);
  const noDataMessage = selectModal.data.length === 0 ? t('common.noData') : t('common.noResults');

  // Pagination button states
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;
  const prevButtonStyle = { padding: '6px 12px', borderRadius: '4px', border: '1px solid #d1d5db', background: isFirstPage ? '#f3f4f6' : 'white', cursor: isFirstPage ? 'not-allowed' : 'pointer' };
  const nextButtonStyle = { padding: '6px 12px', borderRadius: '4px', border: '1px solid #d1d5db', background: isLastPage ? '#f3f4f6' : 'white', cursor: isLastPage ? 'not-allowed' : 'pointer' };

  const clearSelectedOrigin = () => {
    setSelectedOrigins([]);
    setEditFormData((prev) => ({ ...prev, origin_id: '' }));
  };

  const originDisplay = origin
    ? `${origin.region}, ${origin.country_name}`
    : t('greenBeans.noInformation');


  const LoadingState = () => (
    <div className="loading">{t('common.loading')}</div>
  );

  const NotFoundState = () => (
    <div className="error">{t('greenBeans.noInformation')}</div>
  );

  const handleCuppingClick = (cupping) => {
    if (cupping.session_id) {
      const currentPath = location.pathname;
      let prefix = '/personal';

      if (currentPath.startsWith('/org/')) {
        const orgMatch = currentPath.match(/^\/org\/[^\/]+/);
        if (orgMatch) {
          prefix = orgMatch[0];
        }
      }

      navigate(`${prefix}/sessionlist/${cupping.session_id}`);
    }
  };

  if (loading) return <LoadingState />;
  if (!greenBean) return <NotFoundState />;


  return (
    <div className="gb_greenbean-detail-page">
      <div className="gb_greenbean-detail-content">
        <button className="gb_detail-back-button" onClick={onBack}>
          <ArrowLeftIcon size={16} />
          {t('common.back')}
        </button>
        <div className="gb_greenbean-detail-title">
          <div className="gb_greenbean-title-info">
            <div className="gb_greenbean-detail-icon">
              <LeafIcon color="#09B04B" size={32} />
            </div>
            <div>
              <h2>{greenBean.green_bean_name}</h2>
              <p>{t('greenBeans.detailSubtitle') || 'Chi tiết thông tin nhân xanh'}</p>
            </div>
          </div>
          <div className="gb_greenbean-detail-actions">
            {canEdit('green_bean') && (
              <button className="gb_detail-edit-btn" onClick={handleEditClick}>
                <EditIcon size={14} color="#16a34a" />
                {t('common.edit')}
              </button>
            )}
            {canDelete('green_bean') && (
              <button className="gb_detail-delete-btn" onClick={handleDeleteClick}>
                <TrashIcon size={14} color="#dc2626" />
                {t('common.delete')}
              </button>
            )}
          </div>
        </div>

        <div className="gb_greenbean-detail-info">
          <div className="gb_info-section">
            <h3>{t('greenBeans.basicInfo') || 'Thông tin cơ bản'}</h3>
            <div className="gb_info-grid">
              <div className="gb_info-item">
                <label>
                  <i className="fas fa-leaf"></i> {t('greenBeans.variety')}
                </label>
                <span>{greenBean.variety || t('greenBeans.noInformation')}</span>
              </div>
              <div className="gb_info-item">
                <label>
                  <i className="fas fa-seedling"></i>
                  {t('greenBeans.varietyType')}
                </label>
                <span>{greenBean.variety_type || t('greenBeans.noInformation')}</span>
              </div>

              <div className="gb_info-item">
                <label>
                  <i className="fas fa-map-marker-alt"></i> {t('greenBeans.growingRegion') || 'Vùng trồng'}
                </label>
                <span>{originDisplay}</span>
              </div>

              <div className="gb_info-item">
                <label>
                  <i className="fas fa-mountain"></i> {t('greenBeans.altitude')}
                </label>
                <span>{greenBean.altitude || t('greenBeans.noInformation')}m</span>
              </div>

              <div className="gb_info-item">
                <label>
                  <i className="fas fa-cogs"></i> {t('greenBeans.processing')}
                </label>
                <span>{greenBean.processing || t('greenBeans.noInformation')}</span>
              </div>

              <div className="gb_info-item">
                <label>
                  <i className="fas fa-calendar-alt"></i> {t('greenBeans.cropYear')}
                </label>
                <span>{greenBean.crop_year || t('greenBeans.noInformation')}</span>
              </div>
            </div>
          </div>

          <div className="gb_info-section">
            <h3>
              {t('greenBeans.timeInformation')}
            </h3>

            <div className="gb_info-grid">
              <div className="gb_info-item">
                <label>
                  {t('greenBeans.createdDate')}
                </label>
                <span className="gb_date-info">
                  <CalendarIcon size={14} color="#6c757d" />
                  {formatDate(greenBean.created_at)}
                </span>
              </div>

              <div className="gb_info-item">
                <label>
                  {t('greenBeans.lastUpdated')}
                </label>
                <span className="gb_date-info">
                  <CalendarIcon size={14} color="#6c757d" />
                  {formatDate(greenBean.updated_at)}
                </span>
              </div>
            </div>
          </div>


        </div>
      </div>

      {showEditModal && (
        <div className="gb_modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="gb_edit-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="gb_edit-modal-header">
              <h3>{t('greenBeans.editGreenBeanTitle')}</h3>
              <button className="gb_close-button" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form className="gb_edit-form" onSubmit={handleEditSubmit}>
              <div className="gb_form-group">
                <label>{t('greenBeans.origin')} <span className="gb_required">*</span></label>
                <div className="gb_input-with-button">
                  <div className="gb_input-with-tags">
                    {hasSelectedOrigin ? (
                      <span className="gb_input-tag">
                        {originDisplayText}
                        <button type="button" className="gb_tag-remove" onClick={clearSelectedOrigin}>×</button>
                      </span>
                    ) : (
                      <span className="gb_placeholder-text">{originDisplayText}</span>
                    )}
                  </div>
                  <button type="button" className="gb_select-button" onClick={() => openSelectModal('origin')}>{t('common.select')}</button>
                </div>
              </div>

              <div className="gb_form-group">
                <label>{t('greenBeans.greenBeanNameLabel')} <span className="gb_required">*</span></label>
                <input type="text" name="green_bean_name" value={editFormData.green_bean_name || ''} onChange={handleEditFormChange} required />
              </div>

              <div className="gb_form-group">
                <label>{t('greenBeans.greenBeanCode')}</label>
                <input type="text" name="green_bean_code" value={editFormData.green_bean_code || ''} disabled style={{ backgroundColor: '#f5f5f5', color: '#666' }} />
              </div>

              <div className="gb_form-row">
                <div className="gb_form-group">
                  <label>{t('greenBeans.varietyLabel')}</label>
                  <input type="text" value={editFormData.variety || ''} disabled style={{ backgroundColor: '#f5f5f5', color: '#666' }} />
                </div>
                <div className="gb_form-group">
                  <label>{t('greenBeans.varietyTypeLabel')}</label>
                  <input type="text" name="variety_type" value={editFormData.variety_type || ''} onChange={handleEditFormChange} />
                </div>
              </div>

              <div className="gb_form-row">
                <div className="gb_form-group">
                  <label>{t('greenBeans.processingLabel')}</label>
                  <input type="text" value={editFormData.processing || ''} disabled style={{ backgroundColor: '#f5f5f5', color: '#666' }} />
                </div>
                <div className="gb_form-group">
                  <label>{t('greenBeans.altitudeLabel')}</label>
                  <input type="number" name="altitude" value={editFormData.altitude || ''} onChange={handleEditFormChange} />
                </div>
              </div>

              <div className="gb_form-row">
                <div className="gb_form-group">
                  <label>{t('greenBeans.cropYearLabel')} <span className="gb_required">*</span></label>
                  <input type="number" name="crop_year" value={editFormData.crop_year || ''} onChange={handleEditFormChange} min="1901" max="2155" required />
                </div>
                <div className="gb_form-group"></div>
              </div>

              <div className="gb_form-actions">
                <button type="button" className="gb_cancel-button" onClick={() => setShowEditModal(false)}>{t('common.cancel')}</button>
                <button type="submit" className="gb_submit-button">{t('greenBeans.updateButton')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectModal.show && (
        <div className="gb_modal-overlay" onClick={() => setSelectModal({ show: false, type: '', data: [], selected: [] })}>
          <div className="gbd_select-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="gbd_select-modal-header">
              <h3 style={{ color: '#1F429B' }}>{t('greenBeans.selectOrigin')}</h3>
              <button className="gbd_close-button" onClick={() => setSelectModal({ show: false, type: '', data: [], selected: [] })}>×</button>
            </div>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <select
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', background: 'white', marginBottom: '8px' }}
              >
                <option value="">{t('common.country')}</option>
                <optgroup label="Recommend">
                  <option value="Ethiopia">Ethiopia</option>
                  <option value="Colombia">Colombia</option>
                  <option value="Brazil">Brazil</option>
                  <option value="Kenya">Kenya</option>
                  <option value="Guatemala">Guatemala</option>
                  <option value={t("auto.vit_nam_469")}>{t("auto.vit_nam_470")}</option>
                </optgroup>
                <optgroup label={t('common.all') || 'Tất cả'}>
                  {getUniqueCountries().map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </optgroup>
              </select>
              <input
                type="text"
                placeholder={t('greenBeans.searchByCountryOrRegion')}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="gbd_modal-search-input"
                style={{ width: '100%', padding: '8px 10px' }}
              />
            </div>
            <div style={{ padding: '0 16px 12px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <div className="gbd_table-header-row">
                <span className="gbd_header-col">{t('common.country')}</span>
                <span className="gbd_header-col">{t('common.region')}</span>
              </div>
            </div>
            <div className="gbd_select-modal-body">
              {hasFilteredOrigins ? (
                <>
                  <div className="gbd_select-table-container">
                    <table className="gbd_select-table">
                      <tbody>
                        {paginatedOrigins.map((item) => (
                          <tr key={item.uuid} onClick={() => selectOrigin(item)} style={{ cursor: 'pointer' }}>
                            <td className="gbd_batch-name">{item.country_name}</td>
                            <td>{item.region}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {showPagination && (
                    <div className="gbd_pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', padding: '12px', borderTop: '1px solid #e5e7eb' }}>
                      <button
                        disabled={isFirstPage}
                        style={prevButtonStyle}
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      >
                        {t('common.previous')}
                      </button>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>
                        {t('common.page')} {currentPage} {t('common.of')} {totalPages}
                      </span>
                      <button
                        disabled={isLastPage}
                        style={nextButtonStyle}
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      >
                        {t('common.next')}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="gbd_no-data">
                  {noDataMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="gb_modal-overlay gbd_delete-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="gbd_delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gbd_delete-modal_header">
              <h3>{t('modal.confirmTitle')}</h3>
            </div>
            <div className="gbd_delete-modal_body">
              <p>{t('greenBeans.confirmDeleteGreenBean', { name: greenBean.green_bean_name }) || `Bạn có chắc chắn muốn xóa ${greenBean.green_bean_name} không?`}</p>
              <p className="gbd_delete-warning">{t('modal.cannotUndo')}</p>
            </div>
            <div className="gbd_delete-modal_actions">
              <button className="gbd_delete-modal_cancel-btn" onClick={() => setShowDeleteModal(false)}>{t('common.cancel')}</button>
              <button className="gbd_delete-modal_delete-btn" onClick={handleDeleteConfirm}>{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GreenBeanDetail;