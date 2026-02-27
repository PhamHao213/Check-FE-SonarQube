import React, { useState, useEffect } from 'react';
import { REACT_APP_IMAGE_BASE_URL } from '../../api/config'
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './GreenBatch.css';
import { BoxIcon, CalendarIcon, EditIcon, TrashIcon, SearchIcon, FilterIcon, SortIcon, LeafIcon } from '../../components/Icons';
import { batchApi } from '../../api/batchApi';
import CreateBatchForm from './CreateBatchForm';
import EditBatchForm from './EditBatchForm';
import FilterModal from '../../components/FilterModal/FilterModal';
import ImportModal from '../../components/ImportModal/ImportModal';
import { canCreate, usePermissions } from '../../utils/permissions';

const GreenBatch = ({ selectedContext }) => {
  const { t } = useTranslation();
  const { permissions, role } = usePermissions();
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [greenBeans, setGreenBeans] = useState({}); // Thêm state để lưu thông tin nhân xanh
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState(null);
  const [relatedSessions, setRelatedSessions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    sampleType: '',
    greenbeanName: '',
    size: ''
  });

  // Mapping purpose từ tiếng Anh sang tiếng Việt
  const purposeMap = {
    'Check new green bean quality': t('auto.kim_tra_cht_lng_58'),
    'Check green bean quality': t('auto.kim_tra_cht_lng_59'),
    'Check roast batch quality': t('auto.kim_tra_cht_lng_60'),
    'Check finished product quality': t('auto.kim_tra_cht_lng_61'),
  };

  useEffect(() => {
    fetchBatches();
  }, [selectedContext]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const response = await batchApi.getAllBatches(selectedContext);
      const batchesData = response.data || [];
      setBatches(batchesData);

      // Lấy thông tin nhân xanh từ các batch
      const greenBeansMap = {};
      batchesData.forEach(batch => {
        if (batch.green_bean_id) {
          greenBeansMap[batch.green_bean_id] = {
            green_bean_name: batch.greenbean_name || batch.green_bean_name,
            green_bean_name_vi: batch.greenbean_name_vi,
            green_bean_name_en: batch.greenbean_name_en
          };
        }
      });
      setGreenBeans(greenBeansMap);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBatch = async (batch) => {
    try {
      const batchId = batch.uuid || batch.gb_batch_id;
      // Kiểm tra xem batch có liên quan đến session nào không
      const sessionsResponse = await batchApi.checkBatchSessions(batchId, selectedContext);
      const sessions = sessionsResponse.data || [];

      setBatchToDelete(batch);
      setRelatedSessions(sessions);
      setShowDeleteModal(true);
    } catch (error) {

      // Nếu không kiểm tra được, vẫn cho phép xóa
      setBatchToDelete(batch);
      setRelatedSessions([]);
      setShowDeleteModal(true);
    }
  };

  const confirmDelete = async () => {
    try {
      const batchId = batchToDelete.uuid || batchToDelete.gb_batch_id;
      // Nếu có session liên quan, xóa cả session
      const deleteRelatedSessions = relatedSessions.length > 0;
      await batchApi.deleteBatch(batchId, deleteRelatedSessions);
      fetchBatches();
      setShowDeleteModal(false);
      setBatchToDelete(null);
      setRelatedSessions([]);
    } catch (error) {

      alert(error.message || 'Có lỗi xảy ra khi xóa batch');
    }
  };

  const handleEditBatch = (batch) => {
    setEditingBatch(batch);
    setShowEditForm(true);
  };

  const handleViewBatch = (batch) => {
    const batchId = batch.gb_batch_id || batch.uuid;
    const currentPath = window.location.pathname;
    const prefix = currentPath.startsWith('/org/') ? currentPath.match(/^\/org\/[^\/]+/)[0] : '/personal';
    navigate(`${prefix}/gbblist/${batchId}`);
  };

  const handleCreateClick = () => {
    setShowCreateForm(true);
  };



  const handleImportSuccess = () => {
    fetchBatches();
    setShowImportModal(false);
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  // Helper functions for clean code
  const getGreenBeanName = (batch) => {
    const greenBeanInfo = batch.green_bean_id != null
      ? greenBeans?.[batch.green_bean_id] ?? null
      : null;
    return greenBeanInfo?.green_bean_name || batch.greenbean_name || batch.green_bean_name;
  };

  const searchInFields = (searchLower, ...fields) => {
    return fields.some(field => field && field.toLowerCase().includes(searchLower));
  };

  const matchesSearchTerm = (batch, searchTerm) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase().trim();
    const batchId = batch.gb_batch_id || batch.uuid;
    const batchName = `Batch-${batchId.toString().padStart(3, '0')}`;
    const greenBeanName = getGreenBeanName(batch);

    return searchInFields(searchLower,
      batchId.toString(),
      batchName,
      batch.size,
      batch.description,
      greenBeanName,
      batch.greenbean_name,
      batch.green_bean_name,
      batch.greenbean_name_en,
      batch.greenbean_name_vi,
      batch.variety,
      batch.variety_type,
      batch.vendor_name
    );
  };

  const matchesDateRange = (batch, filters) => {
    if (!filters.startDate && !filters.endDate) return true;

    const batchDate = new Date(batch.created_dt);

    if (filters.startDate && batchDate < new Date(filters.startDate)) {
      return false;
    }

    if (filters.endDate) {
      const toDate = new Date(filters.endDate);
      toDate.setHours(23, 59, 59, 999);
      if (batchDate > toDate) return false;
    }

    return true;
  };

  const filteredBatches = batches.
    filter((batch) => {
      const matchesSearch = matchesSearchTerm(batch, searchTerm);

      let matchesSampleType = true;

      if (filters.sampleType === 'sample') {
        matchesSampleType = batch.is_sample;
      } else if (filters.sampleType === 'material') {
        matchesSampleType = !batch.is_sample;
      }

      // Filter theo tên nhân xanh từ modal filter
      const filterGreenBeanLower = filters.greenbeanName?.toLowerCase().trim();
      const greenBeanName = getGreenBeanName(batch);
      const matchesGreenBeanName = !filterGreenBeanLower ||
        searchInFields(filterGreenBeanLower,
          greenBeanName,
          batch.greenbean_name,
          batch.green_bean_name,
          batch.greenbean_name_en,
          batch.greenbean_name_vi
        );

      const matchesSize = !filters.size ||
        (batch.size && batch.size.toLowerCase().includes(filters.size.toLowerCase()));

      return matchesSearch && matchesSampleType && matchesGreenBeanName && matchesSize && matchesDateRange(batch, filters);
    }).
    sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_dt) - new Date(a.created_dt);
      } else if (sortBy === 'oldest') {
        return new Date(a.created_dt) - new Date(b.created_dt);
      }
      return 0;
    });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Cải thiện hiển thị khi không có kết quả tìm kiếm
  const getEmptyStateMessage = () => {
    if (searchTerm.trim() !== '') {
      return `${t('greenBatch.noSearchResults') || 'Không tìm thấy kết quả cho'} "${searchTerm}"`;
    }
    if (Object.values(filters).some(filter => filter !== '')) {
      return t('greenBatch.noFilterResults') || 'Không có lô nhân xanh nào phù hợp với bộ lọc';
    }
    return t('greenBatch.emptyDescription');
  };

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredBatches.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBatches = filteredBatches.slice(startIndex, startIndex + itemsPerPage);

  if (showCreateForm) {
    return (
      <CreateBatchForm
        onClose={() => setShowCreateForm(false)}
        onSuccess={fetchBatches}
        selectedContext={selectedContext} />);
  }

  return (
    <div className="gbb_green-batch-container">
      <div className="gbb_green-batch-wrapper">
        <div className="gbb_green-batch-header">
          <div className="gbb_green-batch-title-section">
            <div className="gbb_green-batch-icon">
              <BoxIcon color="#FBB217" opacity={0.6} size={32} />
            </div>
            <div className="gbb_green-batch-text">
              <h1 className="gbb_green-batch-title">{t('greenBatch.title')}</h1>
              <p className="gbb_green-batch-subtitle">{t('greenBatch.subtitle')}</p>
            </div>
          </div>
          {canCreate('green_bean_batch') &&
            <div className="gbb_green-batch-header-buttons">
              <button
                className="gbb_green-batch-add-button"
                onClick={handleCreateClick}>
                {t('auto._to_391')}
              </button>
            </div>
          }
        </div>

        <div className="gbb_green-batch-content">
          <div className="gbb_session-controls">
            <div className="gbb_search-container">
              <span className="gbb_search-icon">
                <SearchIcon color="#666" size={16} />
              </span>
              <input
                type="text"
                placeholder={t('greenBatch.searchPlaceholder') || 'Tìm kiếm theo ID, tên nhân xanh, giống, vendor...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="gbb_search-input1" />
            </div>
            <div className="gbb_filter-controls">
              <button className="gbb_filter-btn" onClick={() => setShowFilterModal(true)}>
                <FilterIcon size={14} color="#666" />
                {t('common.filter')}
              </button>
              <button className="gbb_sort-btn" onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}>
                <SortIcon size={14} color="#666" />
                {t('common.date')} ({sortBy === 'newest' ? t('common.newest') : t('common.oldest')})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="gbb_loading-state">{t('common.loading')}</div>
          ) : filteredBatches.length === 0 ? (
            <div className="gbb_green-batch-empty-state">
              <div className="gbb_green-batch-empty-icon">
                <BoxIcon color="#FBB217" opacity={0.4} size={80} />
              </div>
              <h2 className="gbb_green-batch-empty-title">
                {searchTerm || Object.values(filters).some(filter => filter !== '')
                  ? t('greenBatch.noResults') || 'Không tìm thấy kết quả'
                  : t('greenBatch.emptyTitle')
                }
              </h2>
              <p className="gbb_green-batch-empty-description">
                {getEmptyStateMessage()}
              </p>
              {(searchTerm || Object.values(filters).some(filter => filter !== '')) && (
                <button
                  className="gbb_clear-search-btn"
                  onClick={() => {
                    setSearchTerm('');
                    setFilters({
                      startDate: '',
                      endDate: '',
                      sampleType: '',
                      greenbeanName: '',
                      size: ''
                    });
                    setCurrentPage(1);
                  }}
                >
                  {t('greenBatch.clearSearch') || 'Xóa tìm kiếm & bộ lọc'}
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="gbb_batch-list">
                {paginatedBatches.map((batch) => {
                  const batchId = batch.gb_batch_id || batch.uuid;
                  // Lấy thông tin nhân xanh
                  const greenBeanInfo = batch.green_bean_id ? greenBeans[batch.green_bean_id] : null;
                  const greenBeanName = greenBeanInfo?.green_bean_name ||
                    batch.greenbean_name ||
                    batch.green_bean_name ||
                    batch.greenbean_name_vi ||
                    batch.greenbean_name_en ||
                    t('greenBatch.noGreenbean');

                  return (
                    <div key={batchId} className="gbb_batch-item" onClick={() => handleViewBatch(batch)} style={{ cursor: 'pointer' }}>
                      <div className="gbb_batch-icon">
                        {(() => {
                          let imageUrl = null;
                          if (batch.image_urls) {
                            try {
                              const urls = typeof batch.image_urls === 'string' ? JSON.parse(batch.image_urls) : batch.image_urls;
                              imageUrl = Array.isArray(urls) && urls.length > 0 ? urls[0] : null;
                            } catch (e) {
                              imageUrl = null;
                            }
                          }

                          return imageUrl ? (
                            <img
                              src={imageUrl.startsWith('http') ? imageUrl : `${REACT_APP_IMAGE_BASE_URL}${imageUrl}`}
                              alt="Batch"
                              style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ backgroundColor: 'rgba(251, 178, 23, 0.2)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <BoxIcon color="rgb(251, 178, 23)" size={24} />
                            </div>
                          );
                        })()}
                      </div>
                      <div className="gbb_batch-info">
                        <div className="gbb_batch-main-info">
                          <h3 className="gbb_batch-title">{greenBeanName}</h3>
                          <div className="gbb_batch-details">
                            <span className="gbb_batch-date">
                              {t('greenBatch.receivedDate')}:
                              {batch.received_at
                                ? formatDate(batch.received_at)
                                : t('common.notAvailable')}
                            </span>
                            <span className="gbb_batch-variety">
                              <LeafIcon size={12} color="#6c757d" />
                              <span style={{ marginLeft: '4px' }}>{batch.variety || batch.variety_type || 'Typica'}</span>
                            </span>
                            {batch.vendor_name &&
                              <span className="gbb_batch-vendor">
                                {t('greenBatch.vendor')}: {batch.vendor_name}
                              </span>
                            }
                          </div>
                        </div>
                      </div>
                      <div className="gbb_batch-meta">
                        <div className="gbb_batch-weight">
                          <span className="gbb_batch-weight-label">{t('greenBatch.density')}</span>
                          <span className="gbb_batch-weight-value">{batch.density || 0}{t("auto.gml_367")}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="gbb_pagination">
                  <button
                    className="gbb_pagination-btn"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}>
                    {t('common.previous')}
                  </button>
                  <span className="gbb_pagination-info">
                    {t('common.page')} {currentPage} / {totalPages} ({filteredBatches.length} {t('greenBatch.items')})
                  </span>
                  <button
                    className="gbb_pagination-btn"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}>
                    {t('common.next')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit Batch Modal */}
      {showEditForm && editingBatch &&
        <EditBatchForm
          batch={editingBatch}
          onClose={() => {
            setShowEditForm(false);
            setEditingBatch(null);
          }}
          onSuccess={fetchBatches}
          selectedContext={selectedContext} />
      }

      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
        initialFilters={filters}
        filterType="batch"
        batches={batches} />

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={handleImportSuccess}
        selectedContext={selectedContext}
      />



      {/* Delete Confirmation Modal */}
      {showDeleteModal && batchToDelete &&
        <div className="gbb_modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="gbb_delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gbb_delete-modal-header">
              <h3>{t('modal.deleteTitle')}</h3>
            </div>
            <div className="gbb_delete-modal-body">
              <p>{t('greenBatch.confirmDelete', { batchId: batchToDelete.gb_batch_id || batchToDelete.uuid })}</p>
              {relatedSessions.length > 0 && (
                <div className="gbb_warning-section">
                  <p className="gbb_delete-warning" style={{ color: '#d32f2f', fontWeight: 'bold', marginTop: '12px' }}>
                    ⚠️ Batch này có liên quan đến các session sau:
                  </p>
                  <ul style={{ marginTop: '8px', marginLeft: '20px', color: '#666' }}>
                    {relatedSessions.map((session, index) => (
                      <li key={index}>
                        {purposeMap[session.purpose] || session.purpose || session.session_name || `Session #${session.session_id}`}
                      </li>
                    ))}
                  </ul>
                  <p className="gbb_delete-warning" style={{ marginTop: '8px' }}>
                    Xóa batch này sẽ xóa luôn các session liên quan. Bạn có chắc chắn muốn tiếp tục?
                  </p>
                </div>
              )}
              {relatedSessions.length === 0 && (
                <p className="gbb_delete-warning">{t('modal.cannotUndo')}</p>
              )}
            </div>
            <div className="gbb_delete-modal-actions">
              <button className="gbb_cancel-btn" onClick={() => setShowDeleteModal(false)}>{t('common.cancel')}</button>
              <button className="gbb_delete-btn" onClick={confirmDelete}>{t('common.delete')}</button>
            </div>
          </div>
        </div>
      }
    </div>);
};

export default GreenBatch;