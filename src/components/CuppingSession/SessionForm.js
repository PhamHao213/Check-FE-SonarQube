import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import BatchSelector from '../BatchSelector';
import { cuppingSessionApi } from '../../api/cuppingSessionApi';
import { FaChevronDown, FaCalendarAlt } from 'react-icons/fa';
import './SessionForm.css';

const SessionForm = ({ session, onClose, onSuccess, selectedContext }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    purpose: '',
    description: '',
    startDate: '',
    endDate: '',
    typeOfSession: '',
    sampleCount: '5',
    isBlindCupping: false,
    scoreCardFormat: 'SCA'
  });
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [showBatchSelector, setShowBatchSelector] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatDateTimeVN = (datetimeLocal) => {
    if (!datetimeLocal) return '';
    const date = new Date(datetimeLocal);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  // Tách logic xử lý session data
  const formatSessionData = () => {
    if (!session) return {};
    
    const formatDateTime = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    const cuppingDate = formatDateTime(session?.cupping_date);
    const finishedDate = formatDateTime(session?.finish_date || session?.finished_date) || cuppingDate;
    
    return {
      purpose: session?.purpose || '',
      description: session?.description || '',
      startDate: cuppingDate,
      endDate: finishedDate,
      typeOfSession: session?.type_of_session || '',
      sampleCount: '5',
      isBlindCupping: session?.is_blind_cupping || false,
      scoreCardFormat: session?.score_card_format === 'AffectiveScoreCard' ? 'Affective' : 
                      session?.score_card_format === 'DescriptiveScoreCard' ? 'DescriptiveScoreCard' :
                      session?.score_card_format || 'SCA'
    };
  };

  // Tách logic xử lý batches
  const processBatchesData = (responseData) => {
    if (!responseData || responseData.length === 0) return [];
    
    const uniqueBatchesData = responseData.filter((batch, index, self) => 
      index === self.findIndex(b => b.batch_id === batch.batch_id)
    );
    
    return uniqueBatchesData.map(batch => ({
      uuid: batch.batch_id,
      gb_batch_id: batch.batch_id,
      greenbean_name: batch.greenbean_name,
      green_bean_name: batch.greenbean_name,
      variety: batch.variety,
      variety_type: batch.variety_type,
      processing: batch.processing,
      vendor_name: batch.vendor_name,
      number_of_sample_cup: batch.number_of_sample_cup,
      density: batch.density,
      created_dt: batch.batch_created_dt
    }));
  };

  // Tách logic load session batches
  const loadSessionBatches = async () => {
    // eslint-disable-next-line react/prop-types
    const sessionId = session?.session_id || session?.uuid;
    if (!sessionId) return;

    try {
      const response = await cuppingSessionApi.getSessionBatches(sessionId);
      if (response.data && response.data.length > 0) {
        const batches = processBatchesData(response.data);
        setSelectedBatches(batches);

        if (response.data[0].number_of_sample_cup) {
          setFormData(prev => ({
            ...prev,
            sampleCount: response.data[0].number_of_sample_cup.toString()
          }));
        }
      }
    } catch (error) {
      console.error('Error loading session batches:', error);
    }
  };

  // Tách validation thành hàm riêng
  const validateForm = () => {
    if (selectedBatches.length === 0 && !session) {
      alert('Vui lòng chọn ít nhất 1 batch!');
      return false;
    }
    if (Number.parseInt(formData.sampleCount) > 5) {
      alert('Số lượng mẫu thử nếm tối đa là 5!');
      return false;
    }
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      alert('Thời gian bắt đầu không được sau thời gian kết thúc!');
      return false;
    }
    return true;
  };

  // Tách logic tạo session data
  const createSessionData = () => {
    const newFinishDate = new Date(formData.endDate);
    const now = new Date();
    const shouldReopenSession = session?.is_finished && newFinishDate > now;
    
    // eslint-disable-next-line react/prop-types
    const sessionData = {
      purpose: formData.purpose,
      description: formData.description,
      cupping_date: formData.startDate,
      finish_date: formData.endDate,
      type_of_session: formData.typeOfSession,
      is_blind_cupping: formData.isBlindCupping,
      score_card_format: formData.scoreCardFormat === 'Affective' ? 'AffectiveScoreCard' : formData.scoreCardFormat,
      is_started: session?.is_started || false,
      is_finished: shouldReopenSession ? false : (session?.is_finished || false)
    };

    if (selectedBatches.length > 0) {
      sessionData.batches = selectedBatches.map(batch => ({
        batch_id: batch.uuid || batch.gb_batch_id,
        number_of_sample_cup: Number.parseInt(formData.sampleCount)
      }));
    }

    return sessionData;
  };

  // Tách logic update session
  const handleUpdateSession = async (sessionData, sessionId) => {
    await cuppingSessionApi.update(sessionId, sessionData);
    
    if (selectedBatches.length > 0) {
      const batchesData = selectedBatches.map(batch => ({
        batch_id: batch.uuid || batch.gb_batch_id,
        number_of_sample_cup: Number.parseInt(formData.sampleCount)
      }));
      await cuppingSessionApi.updateSessionBatches(sessionId, batchesData);
    }
  };

  // Tách logic hiển thị modal bắt đầu
  const showStartSessionModal = (newSessionId) => {
    const startModal = document.createElement('div');
    startModal.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 10000;">
        <div style="background: white; padding: 24px; border-radius: 12px; max-width: 400px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
          <h3 style="margin: 0 0 16px 0; color: #333;">${t('auto._to_session_thn_73')}</h3>
          <p style="margin: 0 0 24px 0; color: #666;">${t('auto.bn_c_mun_bt_u_p_74')}</p>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button id="startLater" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">${t('auto._sau_75')}</button>
            <button id="startNow" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">${t('auto.bt_u_ngay_76')}</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(startModal);
    
    startModal.querySelector('#startLater').onclick = () => {
      startModal.remove();
      onSuccess();
      onClose();
    };
    
    startModal.querySelector('#startNow').onclick = async () => {
      await handleStartNow(newSessionId, startModal);
    };
  };

  // Tách logic xử lý start now
  const handleStartNow = async (newSessionId, startModal) => {
    try {
      await cuppingSessionApi.startSession(newSessionId);
      startModal.remove();
      showCuppingModal(newSessionId);
    } catch (error) {
      console.error('Error starting session:', error);
      alert('Có lỗi xảy ra khi bắt đầu session');
      startModal.remove();
      onSuccess();
      onClose();
    }
  };

  // Tách logic hiển thị modal cupping
  const showCuppingModal = (newSessionId) => {
    const cuppingModal = document.createElement('div');
    cuppingModal.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 10001;">
        <div style="background: white; padding: 24px; border-radius: 12px; max-width: 400px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
          <h3 style="margin: 0 0 16px 0; color: #28a745;">${t('auto._phin_bt_u_77')}</h3>
          <p style="margin: 0 0 24px 0; color: #666;">${t('auto.bn_c_mun_vo_phi_78')}</p>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button id="backToDetail" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">${t('auto.xem_chi_tit_79')}</button>
            <button id="goToCupping" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">${t('auto.vo_chm_im_80')}</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(cuppingModal);
    
    cuppingModal.querySelector('#backToDetail').onclick = () => {
      cuppingModal.remove();
      onSuccess();
      onClose();
    };
    
    cuppingModal.querySelector('#goToCupping').onclick = () => {
      cuppingModal.remove();
      navigateToCuppingForm(newSessionId);
    };
  };

  // Tách logic điều hướng
  const navigateToCuppingForm = (newSessionId) => {
    const currentPath = window.location.pathname;
    const prefix = currentPath.startsWith('/org/') ? currentPath.match(/^\/org\/[^/]+/)[0] : '/personal';
    const targetUrl = `${prefix}/sessionlist/${newSessionId}/cupping_score_card`;
    
    if (window.goToCuppingForm) {
      window.goToCuppingForm(newSessionId);
    } else {
      window.location.href = targetUrl;
    }
  };

  // Tách logic xử lý submit thành công
  const handleSubmitSuccess = () => {
    onSuccess();
    onClose();
  };

  // Tách logic xử lý lỗi
  const handleSubmitError = (error) => {
    console.error('Error saving session:', error);
    alert('Có lỗi xảy ra khi lưu session: ' + error.message);
  };

  useEffect(() => {
    const removeZeros = () => {
      const modal = document.querySelector('.session-edit-modal');
      if (modal) {
        const walker = document.createTreeWalker(
          modal,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
          if (node.textContent.trim() === '0' && 
              !['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(node.parentNode?.tagName)) {
            textNodes.push(node);
          }
        }
        
        textNodes.forEach(textNode => {
          textNode.textContent = '';
        });
      }
    };
    
    setTimeout(removeZeros, 100);
    setTimeout(removeZeros, 500);

    if (session) {
      const newFormData = formatSessionData();
      setFormData(newFormData);
      loadSessionBatches();
    }
  }, [session]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!validateForm()) {
        setLoading(false);
        return;
      }

      const sessionData = createSessionData();

      if (session) {
        // eslint-disable-next-line react/prop-types
        const sessionId = session.session_id || session.uuid;
        await handleUpdateSession(sessionData, sessionId);
        handleSubmitSuccess();
      } else {
        const response = await cuppingSessionApi.create(sessionData);
        const newSessionId = response.data?.session_id || response.session_id;
        showStartSessionModal(newSessionId);
        return;
      }
    } catch (error) {
      handleSubmitError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchSelect = (batches) => {
    setSelectedBatches(batches);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  const handleSampleCountClick = (count) => {
    setFormData(prev => ({ ...prev, sampleCount: count.toString() }));
    setSelectedBatches(prev => prev.map(batch => ({
      ...batch,
      number_of_sample_cup: count
    })));
  };

  const getScoreCardStyle = () => {
    // eslint-disable-next-line react/prop-types
    const baseStyle = {
      cursor: (session?.is_started && !session?.is_finished) ? 'not-allowed' : 'pointer',
      opacity: (session?.is_started && !session?.is_finished) ? 0.6 : 1,
      fontWeight: '600'
    };

    if (formData.scoreCardFormat === 'SCA') {
      return {
        ...baseStyle,
        backgroundColor: '#e3f2fd',
        borderColor: '#1976d2',
        color: '#0d47a1'
      };
    } else if (formData.scoreCardFormat === 'Affective') {
      return {
        ...baseStyle,
        backgroundColor: '#f3e5f5',
        borderColor: '#7b1fa2',
        color: '#4a148c'
      };
    } else {
      return {
        ...baseStyle,
        backgroundColor: '#fff3e0',
        borderColor: '#f57c00',
        color: '#e65100'
      };
    }
  };

  const getSubmitButtonText = () => {
    if (loading) return t("auto.dang_luu");
    if (session) return t("auto.cp_nht_445");
    return t("auto.tao_moi");
  };

  return (
    <div 
      className="session-edit-overlay"
      onClick={handleOverlayClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Escape' && handleOverlayClick(e)}
      aria-label="Close modal overlay"
    >
      <div 
        className="session-edit-modal"
        onClick={handleModalClick}
        role="dialog"
        aria-modal="true"
      >
        <div className="session-edit-header">
          <h3>{session ? t('cuppingSession.EditSession') : t('auto.tao_session_moi')}</h3>
          <button className="session-close-button" onClick={onClose}>×</button>
        </div>
        
        {session && (
          <div className="session-edit-subtitle">{t('auto.cp_nht_thng_tin_81')}</div>
        )}
        
        <form onSubmit={handleSubmit} className="session-edit-form">
          <div className="session-form-row">
            <div className="session-form-group half-width">
              <label>{t('auto.mc_ch_82')}<span className="session-required">*</span></label>
              <select
                value={formData.purpose}
                onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                required
              >
                <option value="">{t('auto.chn_mc_ch_83')}</option>
                <option value="Check new green bean quality">{t('auto.kim_tra_cht_lng_84')}</option>
                <option value="Check green bean quality">{t('auto.kim_tra_cht_lng_85')}</option>
                <option value="Check roast batch quality">{t('auto.kim_tra_cht_lng_86')}</option>
                <option value="Check finished product quality">{t('auto.kim_tra_cht_lng_87')}</option>
              </select>
            </div>
            <div className="session-form-group half-width">
              <label>{t('auto.loi_phin_88')}<span className="session-required">*</span></label>
              <select
                value={formData.typeOfSession}
                onChange={(e) => setFormData({...formData, typeOfSession: e.target.value})}
                required
              >
                <option value="">{t('auto.chn_loi_phin_89')}</option>
                <option value="open">{t('auto.m_90')}</option>
                <option value="close">{t('auto.ng_91')}</option>
              </select>
            </div>
          </div>
          
          <div className="session-form-row">
            <div className="session-form-group half-width">
              <label>{t('auto.thi_gian_bt_u_92')}<span className="session-required">*</span></label>
              <div className="datetime-wrapper">
                <div 
                  className="datetime-display" 
                  onClick={(e) => {
                    e.currentTarget.nextElementSibling.showPicker();
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.currentTarget.nextElementSibling.showPicker();
                    }
                  }}
                  aria-label="Select start date and time"
                >
                  {formData.startDate ? formatDateTimeVN(formData.startDate) : 'Chọn thời gian'}
                  <FaCalendarAlt className="datetime-icon-right" />
                </div>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  className="datetime-input-hidden"
                  required
                />
              </div>
            </div>
            <div className="session-form-group half-width">
              <label>{t('auto.thi_gian_kt_thc_93')}<span className="session-required">*</span></label>
              <div className="datetime-wrapper">
                <div 
                  className="datetime-display" 
                  onClick={(e) => {
                    e.currentTarget.nextElementSibling.showPicker();
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.currentTarget.nextElementSibling.showPicker();
                    }
                  }}
                  aria-label="Select end date and time"
                >
                  {formData.endDate ? formatDateTimeVN(formData.endDate) : 'Chọn thời gian'}
                  <FaCalendarAlt className="datetime-icon-right" />
                </div>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="datetime-input-hidden"
                  required
                />
              </div>
            </div>
          </div>

          <div className="session-form-row">
            <div className="session-form-group half-width">
              <label>{t('auto.che_do_blind_cupping')}</label>
              <div className="blind-cupping-toggle">
                <label className="toggle-switch" aria-label="Toggle blind cupping mode">
                  <input
                    type="checkbox"
                    checked={formData.isBlindCupping}
                    onChange={(e) => setFormData({...formData, isBlindCupping: e.target.checked})}
                    className="toggle-input"
                  />
                  <span className="toggle-slider">
                    <span className="toggle-icon"></span>
                  </span>
                </label>
                <span className="blind-cupping-label">
                  {formData.isBlindCupping ? t('auto.blind_cupping_on') : t('auto.blind_cupping_off')}
                </span>
              </div>
            </div>
            <div className="session-form-group half-width">
              <label>
                {t('cuppingSession.scoreCardFormat')}
                <span className="session-required">*</span>
                {/* eslint-disable-next-line react/prop-types */}
                {session?.is_started && !session?.is_finished && (
                  <span style={{ color: '#dc3545', fontSize: '12px', marginLeft: '8px' }}>{t('cuppingSession.cannotChangeWhileActive')}</span>
                )}
              </label>
              {/* eslint-disable-next-line react/prop-types */}
              <select
                value={formData.scoreCardFormat}
                onChange={(e) => setFormData({...formData, scoreCardFormat: e.target.value})}
                disabled={session?.is_started && !session?.is_finished}
                className={`score-card-format-select ${formData.scoreCardFormat.toLowerCase()}`}
                style={getScoreCardStyle()}
              >
                <option value="SCA">Cupping Form (SCA)</option>
                <option value="Affective">Affective Score Card</option>
                <option value="DescriptiveScoreCard">Descriptive Score Card</option>
              </select>
            </div>
          </div>
          
          <div className="session-form-row">
            <div className="session-form-group full-width">
              <label>{t('auto.m_t_94')}<span className="session-required">*</span></label>
              <textarea
                placeholder={t('auto.m_t_thm_v_phin__101')}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows="3"
                required
              />
            </div>
          </div>

          {!session && (
            <div className="session-form-row">
              <div className="session-form-group full-width">
                <label>
                  {t('cuppingSession.SelectGreenBeanLot')} <span className="session-required">*</span>
                </label>
                <div 
                  className="batch-selector-input"
                  onClick={() => setShowBatchSelector(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setShowBatchSelector(true);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label="Select green bean batches"
                  style={{ cursor: 'pointer' }}
                >
                  {selectedBatches.length === 0 ? (
                    <span className="placeholder">{t('auto.chn_l_cn_th_nm_96')}</span>
                  ) : (
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', width: 'calc(100% - 30px)'}}>
                      {selectedBatches.map((batch) => {
                        const batchId = batch.uuid || batch.gb_batch_id;
                        const batchName = batch.greenbean_name || `Batch ${batch.gb_batch_id}`;
                        return (
                          <span 
                            key={batchId} 
                            style={{
                              backgroundColor: '#eff6ff',
                              color: '#1f429b',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '13px',
                              fontWeight: '500',
                              border: '1px solid #bfdbfe',
                              textAlign: 'center',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {batchName}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  <FaChevronDown className="select-icon" />
                </div>
              </div>
            </div>
          )}
          
          {(formData.scoreCardFormat === 'SCA' || formData.scoreCardFormat === 'Affective') && (
            <div className="session-form-row">
              <div className="session-form-group half-width">
                <label>{t('auto.s_lng_mu_th_nm_98')}<span className="session-required">*</span></label>
                <div className="sample-count-buttons">
                  {[1, 2, 3, 4, 5].map(count => (
                    <button
                      key={count}
                      type="button"
                      className={`sample-count-btn ${Number.parseInt(formData.sampleCount) === count ? 'active' : ''}`}
                      onClick={() => handleSampleCountClick(count)}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <div className="session-form-actions">
            <button type="submit" disabled={loading} className="session-update-button">
              {getSubmitButtonText()}
            </button>
            <button type="button" onClick={onClose} className="session-cancel-button">{t('auto.hy_100')}</button>
          </div>
        </form>
      </div>
      
      {showBatchSelector && (
        <BatchSelector
          isOpen={showBatchSelector}
          onClose={() => setShowBatchSelector(false)}
          onSelect={handleBatchSelect}
          selectedBatches={selectedBatches}
          disableDeselect={true}
          selectedContext={selectedContext}
        />
      )}
    </div>
  );
};

SessionForm.propTypes = {
  session: PropTypes.shape({
    session_id: PropTypes.string,
    uuid: PropTypes.string,
    purpose: PropTypes.string,
    description: PropTypes.string,
    cupping_date: PropTypes.string,
    finish_date: PropTypes.string,
    finished_date: PropTypes.string,
    type_of_session: PropTypes.string,
    is_blind_cupping: PropTypes.bool,
    score_card_format: PropTypes.string,
    is_started: PropTypes.bool,
    is_finished: PropTypes.bool
  }),
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  selectedContext: PropTypes.string
};

export default SessionForm;