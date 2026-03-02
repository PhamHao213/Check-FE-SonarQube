import React, { useState } from 'react';
import PropTypes from 'prop-types'; // Thêm import PropTypes
import { useTranslation } from 'react-i18next';
import './CreateCuppingSession.css';
import { FaCalendarAlt, FaChevronDown, FaClipboardList, FaInfoCircle, FaEye, FaEyeSlash } from 'react-icons/fa';
import { ArrowLeftIcon } from '../../components/Icons';
import BatchSelector from '../../components/BatchSelector';
import { showToast } from '../Toast/Toast';

const CreateCuppingSession = ({ onBack, onSubmit, onGoToCupping, loading, createdSessionId, onStartSession, selectedContext }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    sessionName: '',
    cuppingDate: '',
    finishedDate: '',
    description: '',
    purpose: '',
    typeOfSession: '',
    sampleCount: 5,
    isBlindCupping: false,
    scoreCardFormat: 'SCA'
  });
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [showBatchSelector, setShowBatchSelector] = useState(false);
  // const [isCopied, setIsCopied] = useState(false); // Xóa biến không sử dụng
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [cuppingDuration, setCuppingDuration] = useState('');

  const tooltipContent = {
    startTime: t('cuppingSession.start_time'),
    endTime: t('cuppingSession.end_time'),
    purpose: t('cuppingSession.purpose'),
    sessionType: t('cuppingSession.session_type'),
    sampleCount: t('cuppingSession.sample_count'),
    batch: t('cuppingSession.batch'),
    description: t('cuppingSession.description1'),
    blindCupping: t('cuppingSession.blind_cupping'),
    scoreCardFormat: 'Chọn loại form đánh giá cho session',
  };

  // Hàm format datetime để hiển thị theo định dạng Việt Nam
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

  const toDatetimeLocalString = (date) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return '';
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate - startDate;
    if (diffMs <= 0) return '';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0 && minutes > 0) return `${hours} giờ ${minutes} phút`;
    if (hours > 0) return `${hours} giờ`;
    return `${minutes} phút`;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
      return;
    }

    if (name === 'cuppingDate' && value) {
      const startDate = new Date(value);
      const endDateObj = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
      const endDateString = toDatetimeLocalString(endDateObj);

      setFormData(prev => ({
        ...prev,
        [name]: value,
        finishedDate: endDateString
      }));
      setCuppingDuration(calculateDuration(value, endDateString));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      if (name === 'finishedDate') {
        setCuppingDuration(calculateDuration(formData.cuppingDate, value));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedBatches.length === 0) {
      showToast(
        t('cuppingSession.select_at_least_one'),
        'warning'
      );
      return;
    }
    // Sử dụng Number.parseInt thay vì parseInt
    if ((formData.scoreCardFormat === 'SCA' || formData.scoreCardFormat === 'AffectiveScoreCard') && Number.parseInt(formData.sampleCount, 10) > 5) {
      showToast(
        t('cuppingSession.max_limit'),
        'warning'
      );
      return;
    }
    if (formData.cuppingDate && formData.finishedDate && new Date(formData.cuppingDate) > new Date(formData.finishedDate)) {
      showToast(
        t('cuppingSession.start_after_end_error'),
        'error'
      );
      return;
    }
    if (onSubmit) {
      const submitData = {
        purpose: formData.purpose,
        description: formData.description,
        cupping_date: formData.cuppingDate,
        type_of_session: formData.typeOfSession,
        finish_date: formData.finishedDate,
        is_finished: false,
        is_blind_cupping: formData.isBlindCupping,
        score_card_format: formData.scoreCardFormat,
        batches: selectedBatches.map(batch => ({
          batch_id: batch.uuid || batch.gb_batch_id,
          // Sử dụng Number.parseInt thay vì parseInt
          number_of_sample_cup: (formData.scoreCardFormat === 'SCA' || formData.scoreCardFormat === 'AffectiveScoreCard') ? Number.parseInt(formData.sampleCount, 10) : 1
        }))
      };
      onSubmit(submitData);
    }
  };

  const handleBatchSelect = (batches) => {
    setSelectedBatches(batches);
    setShowBatchSelector(false);
  };

  const handleCancel = () => {
    if (onBack) {
      onBack();
    }
  };

  // Xóa hàm copyToClipboard không sử dụng
  // const getCuppingLink = () => {
  //   return `${window.location.origin}/#cupping_scorecard/session/${createdSessionId}`;
  // };

  // const copyToClipboard = () => {
  //   navigator.clipboard.writeText(getCuppingLink());
  //   setIsCopied(true);
  //   setTimeout(() => setIsCopied(false), 2000);
  // };

  // Xóa hàm goToCupping không sử dụng
  // const goToCupping = () => {
  //   // Function for future use
  // };

  // Helper function để lấy style dựa trên scoreCardFormat
  const getScoreCardStyles = (format) => {
    switch(format) {
      case 'SCA':
        return {
          background: '#e3f2fd',
          borderColor: '#1976d2',
          color: '#0d47a1'
        };
      case 'AffectiveScoreCard':
        return {
          background: '#f3e5f5',
          borderColor: '#7b1fa2',
          color: '#4a148c'
        };
      default:
        return {
          background: '#fff3e0',
          borderColor: '#f57c00',
          color: '#e65100'
        };
    }
  };

  return (
    <div className="create-session-container">
      <div className="create-session-wrapper">
        <button className="create-session-back-button" onClick={onBack}>
          <ArrowLeftIcon size={16} />{t('auto.quay_li_51')}</button>

        <div className="create-session-header">
          <h1 className="create-session-title">{t('auto.to_phin_th_nm_52')}</h1>
          <p className="create-session-subtitle">{t('auto.nhp_thng_tin_ph_53')}</p>
          {cuppingDuration && (
            <div className="cupping-duration-display">
              <span className="duration-label">Thời gian cupping:</span>
              <span className="duration-value">{cuppingDuration}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="create-session-form">
          <div className="create-session-form-row">
            <div className="create-session-form-group half-width">
              <label className="create-session-label">{t('auto.thi_gian_bt_u_54')}<span className="required">*</span>
                <span 
                  className="info-icon-wrapper"
                  onMouseEnter={() => setActiveTooltip('startTime')}
                  onMouseLeave={() => setActiveTooltip(null)}
                  onFocus={() => setActiveTooltip('startTime')}
                  onBlur={() => setActiveTooltip(null)}
                  tabIndex="0"
                  role="button"
                  aria-label={tooltipContent.startTime}
                >
                  <FaInfoCircle className="info-icon" />
                  {activeTooltip === 'startTime' && (
                    <span className="tooltip-text">{tooltipContent.startTime}</span>
                  )}
                </span>
              </label>
              <div className="datetime-wrapper">
                <button 
                  type="button"
                  className="datetime-display" 
                  onClick={(e) => {
                    const input = e.currentTarget.nextElementSibling;
                    if (typeof input.showPicker === 'function') {
                      try {
                        input.showPicker();
                      } catch (err) {
                        input.focus();
                      }
                    } else {
                      input.focus();
                    }
                  }}
                  aria-label="Chọn thời gian bắt đầu"
                >
                  {formData.cuppingDate ? formatDateTimeVN(formData.cuppingDate) : t('auto.chon_tg')}
                  <FaCalendarAlt className="datetime-icon-right" />
                </button>
                <input
                  type="datetime-local"
                  name="cuppingDate"
                  value={formData.cuppingDate}
                  onChange={handleChange}
                  className="datetime-input-hidden"
                  required
                />
              </div>
            </div>
            <div className="create-session-form-group half-width">
              <label className="create-session-label">{t('auto.thi_gian_kt_thc_55')}<span className="required">*</span>
                <span 
                  className="info-icon-wrapper"
                  onMouseEnter={() => setActiveTooltip('endTime')}
                  onMouseLeave={() => setActiveTooltip(null)}
                  onFocus={() => setActiveTooltip('endTime')}
                  onBlur={() => setActiveTooltip(null)}
                  tabIndex="0"
                  role="button"
                  aria-label={tooltipContent.endTime}
                >
                  <FaInfoCircle className="info-icon" />
                  {activeTooltip === 'endTime' && (
                    <span className="tooltip-text">{tooltipContent.endTime}</span>
                  )}
                </span>
              </label>
              <div className="datetime-wrapper">
                <button 
                  type="button"
                  className="datetime-display" 
                  onClick={(e) => {
                    const input = e.currentTarget.nextElementSibling;
                    if (typeof input.showPicker === 'function') {
                      try {
                        input.showPicker();
                      } catch (err) {
                        input.focus();
                      }
                    } else {
                      input.focus();
                    }
                  }}
                  aria-label="Chọn thời gian kết thúc"
                >
                  {formData.finishedDate ? formatDateTimeVN(formData.finishedDate) : t('auto.chon_tg')}
                  <FaCalendarAlt className="datetime-icon-right" />
                </button>
                <input
                  type="datetime-local"
                  name="finishedDate"
                  value={formData.finishedDate}
                  onChange={handleChange}
                  className="datetime-input-hidden"
                  required
                />
              </div>
            </div>
          </div>

          <div className="create-session-form-row">
            <div className="create-session-form-group half-width">
              <label className="create-session-label">{t('auto.mc_ch_phin_th_n_56')}<span className="required">*</span>
                <span 
                  className="info-icon-wrapper"
                  onMouseEnter={() => setActiveTooltip('purpose')}
                  onMouseLeave={() => setActiveTooltip(null)}
                  onFocus={() => setActiveTooltip('purpose')}
                  onBlur={() => setActiveTooltip(null)}
                  tabIndex="0"
                  role="button"
                  aria-label={tooltipContent.purpose}
                >
                  <FaInfoCircle className="info-icon" />
                  {activeTooltip === 'purpose' && (
                    <span className="tooltip-text">{tooltipContent.purpose}</span>
                  )}
                </span>
              </label>
              <select
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                className="create-session-select"
                required
              >
                <option value="">{t('auto.chn_mc_ch_57')}</option>
                <option value="Check new green bean quality">{t('auto.kim_tra_cht_lng_58')}</option>
                <option value="Check green bean quality">{t('auto.kim_tra_cht_lng_59')}</option>
                <option value="Check roast batch quality">{t('auto.kim_tra_cht_lng_60')}</option>
                <option value="Check finished product quality">{t('auto.kim_tra_cht_lng_61')}</option>
              </select>
            </div>
            <div className="create-session-form-group half-width">
              <label className="create-session-label">{t('auto.loi_phin_62')}<span className="required">*</span>
                <span 
                  className="info-icon-wrapper"
                  onMouseEnter={() => setActiveTooltip('sessionType')}
                  onMouseLeave={() => setActiveTooltip(null)}
                  onFocus={() => setActiveTooltip('sessionType')}
                  onBlur={() => setActiveTooltip(null)}
                  tabIndex="0"
                  role="button"
                  aria-label={tooltipContent.sessionType}
                >
                  <FaInfoCircle className="info-icon" />
                  {activeTooltip === 'sessionType' && (
                    <span className="tooltip-text">{tooltipContent.sessionType}</span>
                  )}
                </span>
              </label>
              <select
                name="typeOfSession"
                value={formData.typeOfSession}
                onChange={handleChange}
                className="create-session-select"
                required
              >
                <option value="">{t('auto.chn_loi_phin_63')}</option>
                <option value="open">{t('auto.m_64')}</option>
                <option value="close">{t('auto.ng_65')}</option>
              </select>
            </div>
          </div>

          <div className="create-session-form-row">
            {/* Trường chọn Score Card Format */}
            <div className="create-session-form-group half-width">
              <label className="create-session-label">Loại Form Đánh Giá<span className="required">*</span>
                <span 
                  className="info-icon-wrapper"
                  onMouseEnter={() => setActiveTooltip('scoreCardFormat')}
                  onMouseLeave={() => setActiveTooltip(null)}
                  onFocus={() => setActiveTooltip('scoreCardFormat')}
                  onBlur={() => setActiveTooltip(null)}
                  tabIndex="0"
                  role="button"
                  aria-label={tooltipContent.scoreCardFormat}
                >
                  <FaInfoCircle className="info-icon" />
                  {activeTooltip === 'scoreCardFormat' && (
                    <span className="tooltip-text">{tooltipContent.scoreCardFormat}</span>
                  )}
                </span>
              </label>
              <select
                name="scoreCardFormat"
                value={formData.scoreCardFormat}
                onChange={handleChange}
                className="create-session-select"
                style={getScoreCardStyles(formData.scoreCardFormat)}
                required
              >
                <option value="SCA">SCA Cupping Form</option>
                <option value="DescriptiveScoreCard">Descriptive Score Card</option>
                <option value="AffectiveScoreCard">Affective Score Card</option>
              </select>
            </div>

            {/* Chỉ hiển thị trường chọn số lượng chén khi chọn form SCA hoặc Affective */}
            {(formData.scoreCardFormat === 'SCA' || formData.scoreCardFormat === 'AffectiveScoreCard') && (
              <div className="create-session-form-group half-width">
                <label className="create-session-label">{t('auto.s_lng_chn_th_nm_66')}<span className="required">*</span>
                  <span 
                    className="info-icon-wrapper"
                    onMouseEnter={() => setActiveTooltip('sampleCount')}
                    onMouseLeave={() => setActiveTooltip(null)}
                    onFocus={() => setActiveTooltip('sampleCount')}
                    onBlur={() => setActiveTooltip(null)}
                    tabIndex="0"
                    role="button"
                    aria-label={tooltipContent.sampleCount}
                  >
                    <FaInfoCircle className="info-icon" />
                    {activeTooltip === 'sampleCount' && (
                      <span className="tooltip-text">{tooltipContent.sampleCount}</span>
                    )}
                  </span>
                </label>
                <div className="sample-count-buttons">
                  {[1, 2, 3, 4, 5].map(count => (
                    <button
                      key={count}
                      type="button"
                      className={`sample-count-btn ${formData.sampleCount === count ? 'active' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, sampleCount: count }))}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="create-session-form-row">
            {/* Thêm trường Blind Cupping */}
            <div className="create-session-form-group half-width">
              <label className="create-session-label" htmlFor="isBlindCupping">
                {t('auto.che_do_blind_cupping')}
                <span 
                  className="info-icon-wrapper"
                  onMouseEnter={() => setActiveTooltip('blindCupping')}
                  onMouseLeave={() => setActiveTooltip(null)}
                  onFocus={() => setActiveTooltip('blindCupping')}
                  onBlur={() => setActiveTooltip(null)}
                  tabIndex="0"
                  role="button"
                  aria-label={tooltipContent.blindCupping}
                >
                  <FaInfoCircle className="info-icon" />
                  {activeTooltip === 'blindCupping' && (
                    <span className="tooltip-text">{tooltipContent.blindCupping}</span>
                  )}
                </span>
              </label>
              <div className="blind-cupping-toggle">
                <label className="toggle-switch" htmlFor="isBlindCupping">
                  <input
                    type="checkbox"
                    id="isBlindCupping"
                    name="isBlindCupping"
                    checked={formData.isBlindCupping}
                    onChange={handleChange}
                    className="toggle-input"
                  />
                  <span className="toggle-slider">
                    <span className="toggle-icon">
                      {/* Icon có thể thêm sau nếu cần */}
                    </span>
                  </span>
                </label>
                <span className="blind-cupping-label">
                  {formData.isBlindCupping ? t('auto.blind_cupping_on') : t('auto.blind_cupping_off')}
                </span>
              </div>
            </div>
          </div>

          <div className="create-session-form-row">
            <div className="create-session-form-group full-width">
              <label className="create-session-label">{t('auto.chn_l_nhn_xanh_67')}<span className="required">*</span>
                <span 
                  className="info-icon-wrapper"
                  onMouseEnter={() => setActiveTooltip('batch')}
                  onMouseLeave={() => setActiveTooltip(null)}
                  onFocus={() => setActiveTooltip('batch')}
                  onBlur={() => setActiveTooltip(null)}
                  tabIndex="0"
                  role="button"
                  aria-label={tooltipContent.batch}
                >
                  <FaInfoCircle className="info-icon" />
                  {activeTooltip === 'batch' && (
                    <span className="tooltip-text">{tooltipContent.batch}</span>
                  )}
                </span>
              </label>
              <button
                type="button"
                className="create-session-batch-selector"
                onClick={() => setShowBatchSelector(true)}
                style={{ position: 'relative' }}
                aria-label="Chọn lô"
              >
                {selectedBatches.length === 0 ? (
                  <span className="create-session-batch-placeholder">{t('auto.chn_l_cn_th_nm_68')}</span>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', width: 'calc(100% - 30px)' }}>
                    {selectedBatches.map((batch, index) => {
                      const batchId = batch.uuid || batch.gb_batch_id;
                      const batchName = batch.green_bean_name || `Batch ${batch.gb_batch_id}`;
                      return (
                        <span
                          key={`${batchId}-${index}`}
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
                <FaChevronDown style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d', fontSize: '12px', pointerEvents: 'none' }} />
              </button>
            </div>
          </div>

          <div className="create-session-form-row">
            <div className="create-session-form-group full-width">
              <label className="create-session-label">{t('auto.m_t_70')}<span className="required">*</span>
                <span 
                  className="info-icon-wrapper"
                  onMouseEnter={() => setActiveTooltip('description')}
                  onMouseLeave={() => setActiveTooltip(null)}
                  onFocus={() => setActiveTooltip('description')}
                  onBlur={() => setActiveTooltip(null)}
                  tabIndex="0"
                  role="button"
                  aria-label={tooltipContent.description}
                >
                  <FaInfoCircle className="info-icon" />
                  {activeTooltip === 'description' && (
                    <span className="tooltip-text">{tooltipContent.description}</span>
                  )}
                </span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder={t('auto.nhp_m_t_cho_phi_72')}
                className="create-session-textarea"
                rows="3"
                required
              />
            </div>
          </div>

          <div className="create-session-form-actions">
            <button type="submit" className="create-session-submit-button" disabled={loading}>
              {loading ? t("cuppingSession.loadingsession") : t("cuppingSession.createSession")}
            </button>

            <button type="button" className="create-session-cancel-button" onClick={handleCancel}>{t('auto.hy_71')}</button>
          </div>
        </form>
      </div>

      <BatchSelector
        isOpen={showBatchSelector}
        onClose={() => setShowBatchSelector(false)}
        onSelect={handleBatchSelect}
        selectedBatches={selectedBatches}
        selectedContext={selectedContext}
      />

    </div>
  );
};

// Thêm PropTypes validation
CreateCuppingSession.propTypes = {
  onBack: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onGoToCupping: PropTypes.func,
  loading: PropTypes.bool,
  createdSessionId: PropTypes.string,
  onStartSession: PropTypes.func,
  selectedContext: PropTypes.object
};

// Thêm defaultProps cho các props không bắt buộc
CreateCuppingSession.defaultProps = {
  onGoToCupping: () => {},
  loading: false,
  createdSessionId: null,
  onStartSession: () => {},
  selectedContext: {}
};

export default CreateCuppingSession;