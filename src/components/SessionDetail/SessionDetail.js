import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { useNavigate } from 'react-router-dom';
import './SessionDetail.css';
import { FaCalendarAlt, FaUsers, FaClipboardList, FaMapMarkerAlt, FaCheckCircle, FaClock, FaFileAlt, FaEdit, FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa';
import { ArrowLeftIcon } from '../../components/Icons';
import { QRCode } from 'react-qr-code';
import { cuppingSessionApi } from '../../api/cuppingSessionApi';
import { userApi } from '../../api/userApi';
import { descriptiveScoreCardApi } from '../../api/descriptiveScoreCardApi';
import { affectiveScoreCardApi } from '../../api/affectiveScoreCardApi';
import SessionForm from '../../components/CuppingSession/SessionForm';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog';
import { API_BASE_URL } from '../../api/config';
import { showToast } from '../Toast/Toast';
import { canDelete, canEdit, usePermissions } from '../../utils/permissions';

// ==================== SUB-COMPONENTS ====================

const BatchHeader = ({ 
  batch, 
  displayName, 
  isBlindCupping, 
  canViewBatchInfo, 
  sessionInfo,
  isAffectiveScoreCard,
  isDescriptiveScoreCard,
  averageScore,
  affectiveAverageScore,
  t 
}) => {
  return (
    <div className="batch-header">
      <span className="batch-id">
        {displayName}
        {isBlindCupping && !canViewBatchInfo && (
          <span className="blind-tag">
            {sessionInfo?.isOwner ? 'Ẩn thông tin' : 'Chỉ owner được xem'}
          </span>
        )}
      </span>
      <div className="batch-stats">
        {isAffectiveScoreCard ? (
          affectiveAverageScore && (
            <span className="batch-average">
              {t("cuppingSession.average_point")}: {affectiveAverageScore}
            </span>
          )
        ) : !isDescriptiveScoreCard && averageScore ? (
          <span className="batch-average">
            {t('cuppingSession.average')}: {averageScore}
          </span>
        ) : null}
        <span className="batch-samples">
          {t('cuppingSession.samples', {
            count: batch.number_of_sample_cup || 0
          })}
        </span>
      </div>
    </div>
  );
};

const BatchInfoRow = ({ label, value }) => (
  <div className="batch-info-row">
    <span>{label}: {value}</span>
  </div>
);

const ViewButtons = ({ 
  batchId, 
  expandedBatches, 
  setExpandedBatches, 
  accessType, 
  currentUser,
  scores,
  type,
  t,
  showToast 
}) => {
  const myScores = scores.filter(s => s.user_id === currentUser?.uuid);
  const othersScores = scores.filter(s => s.user_id !== currentUser?.uuid);
  
  const handleMyClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (myScores.length > 0) {
      setExpandedBatches(prev => ({ ...prev, [batchId]: 'my' }));
    } else {
      showToast(t('cuppingSession.NoScoreForBatch'), 'info');
    }
  };

  const handleOthersClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (othersScores.length > 0) {
      setExpandedBatches(prev => ({ ...prev, [batchId]: 'others' }));
    } else {
      showToast(t('cuppingSession.NoOtherScores'), 'info');
    }
  };

  const handleAllClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setExpandedBatches(prev => ({ ...prev, [batchId]: 'all' }));
  };

  return (
    <div className="cupping-view-buttons">
      <button
        className={`view-my-cupping-btn ${expandedBatches[batchId] === 'my' ? 'active' : ''}`}
        onClick={handleMyClick}
      >
        {t("auto.phiu_ca_ti__221")} ({myScores.length})
      </button>
      {accessType === 'full_access' && (
        <>
          <button
            className={`view-others-cupping-btn ${expandedBatches[batchId] === 'others' ? 'active' : ''}`}
            onClick={handleOthersClick}
          >
            {t("auto.phiu_ngi_khc__222")} ({othersScores.length})
          </button>
          <button
            className={`view-all-cupping-btn ${expandedBatches[batchId] === 'all' ? 'active' : ''}`}
            onClick={handleAllClick}
          >
            {t("auto.xem_tt_c__223")} ({scores.length})
          </button>
        </>
      )}
    </div>
  );
};

const ExcludeButton = ({ 
  isExcluded, 
  onClick, 
  sessionPermissions,
  batchId,
  idx 
}) => {
  if (!sessionPermissions.canEdit) return null;
  
  return (
    <button
      className={`exclude-btn ${isExcluded ? 'excluded' : ''}`}
      title={isExcluded ? 'Click để đưa phiếu trở lại tính điểm' : 'Click để loại bỏ phiếu khỏi tính điểm'}
      onClick={onClick}
    >
      <span className="btn-label">
        {isExcluded ? 'Đưa lại' : 'Loại bỏ'}
      </span>
    </button>
  );
};

const AffectiveScoreItem = ({ 
  affectiveScore, 
  batchId, 
  idx, 
  excludedAffectiveScores, 
  sessionPermissions,
  handleExcludeAffective,
  renderAffectiveScoreDetails 
}) => {
  const formData = affectiveScore.form_data || {};
  const stableKey = `affective-${batchId}-${idx}-${affectiveScore.user_id || 'unknown'}`;
  const isExcluded = excludedAffectiveScores[`${batchId}_${idx}`];
  
  return (
    <div key={stableKey} className={`cupping-detail affective-score ${isExcluded ? 'excluded' : ''}`}>
      <div className="cupper-header">
        <div className="cupper-info">
          <span className="cupper-name">{affectiveScore.cupper_name || 'Unknown User'}</span>
        </div>
        <div className="score-badges">
          {affectiveScore.final_score && (
            <span className="final-score">Final: {affectiveScore.final_score}</span>
          )}
          <ExcludeButton
            isExcluded={isExcluded}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleExcludeAffective(batchId, idx);
            }}
            sessionPermissions={sessionPermissions}
            batchId={batchId}
            idx={idx}
          />
        </div>
      </div>
      <div className="affective-score-sections">
        {renderAffectiveScoreDetails(formData)}
      </div>
    </div>
  );
};

const DescriptiveScoreItem = ({ descriptiveScore, batchId, idx, renderDescriptiveScoreDetails }) => {
  const formData = descriptiveScore.form_data || {};
  const stableKey = `descriptive-${batchId}-${idx}-${descriptiveScore.user_id || 'unknown'}`;
  
  return (
    <div key={stableKey} className="cupping-detail descriptive-score">
      <div className="cupper-header">
        <div className="cupper-info">
          <span className="cupper-name">{descriptiveScore.cupper_name || 'Unknown User'}</span>
        </div>
        <div className="score-badges">
          <span className="descriptive-badge">Descriptive Score</span>
        </div>
      </div>
      <div className="descriptive-score-grid">
        {renderDescriptiveScoreDetails(formData)}
      </div>
    </div>
  );
};

const CuppingScoreItem = ({ 
  cupping, 
  batch, 
  batchId, 
  originalIdx, 
  excludedCuppings,
  sessionPermissions,
  handleExcludeCupping,
  renderCuppingScoreDetails 
}) => {
  const isExcluded = excludedCuppings[`${batchId}_${originalIdx}`];
  const calculatedDefects = cupping.total_score && cupping.final_score
    ? (parseFloat(cupping.total_score) - parseFloat(cupping.final_score)).toFixed(1)
    : 0;
    
  return renderCuppingScoreDetails(cupping, batch, batchId, originalIdx, isExcluded, calculatedDefects, sessionPermissions, handleExcludeCupping);
};

const AffectiveScoreList = ({ 
  batchId, 
  affectiveScores, 
  expandedBatches, 
  accessType, 
  currentUser,
  excludedAffectiveScores,
  sessionPermissions,
  handleExcludeAffective,
  renderAffectiveScoreDetails,
  setExpandedBatches,
  t,
  showToast 
}) => {
  if (!expandedBatches[batchId]) return null;
  
  let filteredScores = affectiveScores;
  
  if (accessType !== 'full_access') {
    filteredScores = affectiveScores.filter(a => a.user_id === currentUser?.uuid);
  } else {
    if (expandedBatches[batchId] === 'my') {
      filteredScores = affectiveScores.filter(a => a.user_id === currentUser?.uuid);
    } else if (expandedBatches[batchId] === 'others') {
      filteredScores = affectiveScores.filter(a => a.user_id !== currentUser?.uuid);
    } else if (expandedBatches[batchId] === 'all') {
      filteredScores = affectiveScores;
    }
  }
  
  return (
    <div className="cupping-list">
      {filteredScores.map((affectiveScore, idx) => (
        <AffectiveScoreItem
          key={`affective-${batchId}-${idx}-${affectiveScore.user_id || 'unknown'}`}
          affectiveScore={affectiveScore}
          batchId={batchId}
          idx={idx}
          excludedAffectiveScores={excludedAffectiveScores}
          sessionPermissions={sessionPermissions}
          handleExcludeAffective={handleExcludeAffective}
          renderAffectiveScoreDetails={renderAffectiveScoreDetails}
        />
      ))}
      <div
        className="view-more-link"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setExpandedBatches(prev => ({ ...prev, [batchId]: false }));
        }}
      >
        {t('auto._n_phiu_chm_im_251')}
      </div>
    </div>
  );
};

const DescriptiveScoreList = ({ 
  batchId, 
  descriptiveScores, 
  expandedBatches, 
  accessType, 
  currentUser,
  renderDescriptiveScoreDetails,
  setExpandedBatches,
  t 
}) => {
  if (!expandedBatches[batchId]) return null;
  
  let filteredScores = descriptiveScores;
  
  if (accessType !== 'full_access') {
    filteredScores = descriptiveScores.filter(d => d.user_id === currentUser?.uuid);
  } else {
    if (expandedBatches[batchId] === 'my') {
      filteredScores = descriptiveScores.filter(d => d.user_id === currentUser?.uuid);
    } else if (expandedBatches[batchId] === 'others') {
      filteredScores = descriptiveScores.filter(d => d.user_id !== currentUser?.uuid);
    } else if (expandedBatches[batchId] === 'all') {
      filteredScores = descriptiveScores;
    }
  }
  
  return (
    <div className="cupping-list">
      {filteredScores.map((descriptiveScore, idx) => (
        <DescriptiveScoreItem
          key={`descriptive-${batchId}-${idx}-${descriptiveScore.user_id || 'unknown'}`}
          descriptiveScore={descriptiveScore}
          batchId={batchId}
          idx={idx}
          renderDescriptiveScoreDetails={renderDescriptiveScoreDetails}
        />
      ))}
      <div
        className="view-more-link"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setExpandedBatches(prev => ({ ...prev, [batchId]: false }));
        }}
      >
        {t('auto._n_phiu_chm_im_251')}
      </div>
    </div>
  );
};

const CuppingScoreList = ({ 
  batchId, 
  cuppings, 
  expandedBatches, 
  accessType, 
  currentUser,
  excludedCuppings,
  sessionPermissions,
  handleExcludeCupping,
  renderCuppingScoreDetails,
  setExpandedBatches,
  t,
  batch 
}) => {
  if (!expandedBatches[batchId]) return null;
  
  let filteredCuppings = cuppings;
  
  if (accessType !== 'full_access') {
    filteredCuppings = cuppings.filter(c => c.user_id === currentUser?.uuid);
  } else {
    if (expandedBatches[batchId] === 'my') {
      filteredCuppings = cuppings.filter(c => c.user_id === currentUser?.uuid);
    } else if (expandedBatches[batchId] === 'others') {
      filteredCuppings = cuppings.filter(c => c.user_id !== currentUser?.uuid);
    } else if (expandedBatches[batchId] === 'all') {
      filteredCuppings = cuppings;
    }
  }
  
  return (
    <div className="cupping-list">
      {filteredCuppings.map((cupping, idx) => {
        const originalIdx = cuppings.findIndex(c => c === cupping);
        return (
          <React.Fragment key={`cupping-${batchId}-${originalIdx}-${cupping.user_id || 'unknown'}`}>
            {renderCuppingScoreDetails(cupping, batch, batchId, originalIdx, 
              excludedCuppings[`${batchId}_${originalIdx}`], 
              cupping.total_score && cupping.final_score
                ? (parseFloat(cupping.total_score) - parseFloat(cupping.final_score)).toFixed(1)
                : 0,
              sessionPermissions,
              handleExcludeCupping
            )}
          </React.Fragment>
        );
      })}
      <div
        className="view-more-link"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setExpandedBatches(prev => ({ ...prev, [batchId]: false }));
        }}
      >
        {t('auto._n_phiu_chm_im_251')}
      </div>
    </div>
  );
};

const BatchCard = ({ 
  batch, 
  index, 
  batchCuppings, 
  batchDescriptiveScores, 
  batchAffectiveScores,
  loadingCuppings,
  expandedBatches,
  setExpandedBatches,
  excludedCuppings,
  excludedAffectiveScores,
  accessType,
  currentUser,
  sessionPermissions,
  isBlindCupping,
  canViewBatchInfo,
  sessionInfo,
  isAffectiveScoreCard,
  isDescriptiveScoreCard,
  getBatchDisplayName,
  getBatchDetailInfo,
  calculateAverageScore,
  calculateAffectiveAverageScore,
  getVendorDisplay,
  renderAffectiveScoreDetails,
  renderDescriptiveScoreDetails,
  renderCuppingScoreDetails,
  handleExcludeCupping,
  handleExcludeAffective,
  showToast,
  t 
}) => {
  const cuppings = batchCuppings[batch.batch_id] || [];
  const descriptiveScores = batchDescriptiveScores[batch.batch_id] || [];
  const affectiveScores = batchAffectiveScores[batch.batch_id] || [];
  const cuppingCount = cuppings.length;
  const descriptiveCount = descriptiveScores.length;
  const affectiveCount = affectiveScores.length;
  const displayName = getBatchDisplayName(batch, index);
  const batchDetails = getBatchDetailInfo(batch);
  const averageScore = calculateAverageScore(cuppings, excludedCuppings, batch.batch_id);
  const affectiveAverageScore = calculateAffectiveAverageScore(affectiveScores, excludedAffectiveScores, batch.batch_id);

  return (
    <div
      key={batch.batch_id}
      className={`session-batch-card ${isBlindCupping && !canViewBatchInfo ? 'blind-mode' : ''}`}
    >
      <BatchHeader
        batch={batch}
        displayName={displayName}
        isBlindCupping={isBlindCupping}
        canViewBatchInfo={canViewBatchInfo}
        sessionInfo={sessionInfo}
        isAffectiveScoreCard={isAffectiveScoreCard()}
        isDescriptiveScoreCard={isDescriptiveScoreCard()}
        averageScore={averageScore}
        affectiveAverageScore={affectiveAverageScore}
        t={t}
      />

      <div className="batch-details">
        <BatchInfoRow label={t("greenBeans.variety")} value={batchDetails.variety} />
        <BatchInfoRow label={t("navigation.vendor")} value={getVendorDisplay(batchDetails.vendor)} />

        {isAffectiveScoreCard() ? (
          affectiveCount > 0 && (
            <div className="batch-cupping-info">
              {!expandedBatches[batch.batch_id] && (
                <ViewButtons
                  batchId={batch.batch_id}
                  expandedBatches={expandedBatches}
                  setExpandedBatches={setExpandedBatches}
                  accessType={accessType}
                  currentUser={currentUser}
                  scores={affectiveScores}
                  type="affective"
                  t={t}
                  showToast={showToast}
                />
              )}
              <AffectiveScoreList
                batchId={batch.batch_id}
                affectiveScores={affectiveScores}
                expandedBatches={expandedBatches}
                accessType={accessType}
                currentUser={currentUser}
                excludedAffectiveScores={excludedAffectiveScores}
                sessionPermissions={sessionPermissions}
                handleExcludeAffective={handleExcludeAffective}
                renderAffectiveScoreDetails={renderAffectiveScoreDetails}
                setExpandedBatches={setExpandedBatches}
                t={t}
                showToast={showToast}
              />
            </div>
          )
        ) : isDescriptiveScoreCard() ? (
          descriptiveCount > 0 && (
            <div className="batch-cupping-info">
              {!expandedBatches[batch.batch_id] && (
                <ViewButtons
                  batchId={batch.batch_id}
                  expandedBatches={expandedBatches}
                  setExpandedBatches={setExpandedBatches}
                  accessType={accessType}
                  currentUser={currentUser}
                  scores={descriptiveScores}
                  type="descriptive"
                  t={t}
                  showToast={showToast}
                />
              )}
              <DescriptiveScoreList
                batchId={batch.batch_id}
                descriptiveScores={descriptiveScores}
                expandedBatches={expandedBatches}
                accessType={accessType}
                currentUser={currentUser}
                renderDescriptiveScoreDetails={renderDescriptiveScoreDetails}
                setExpandedBatches={setExpandedBatches}
                t={t}
              />
            </div>
          )
        ) : (
          cuppingCount > 0 && (
            <div className="batch-cupping-info">
              {!expandedBatches[batch.batch_id] && (
                <ViewButtons
                  batchId={batch.batch_id}
                  expandedBatches={expandedBatches}
                  setExpandedBatches={setExpandedBatches}
                  accessType={accessType}
                  currentUser={currentUser}
                  scores={cuppings}
                  type="cupping"
                  t={t}
                  showToast={showToast}
                />
              )}
              <CuppingScoreList
                batchId={batch.batch_id}
                cuppings={cuppings}
                expandedBatches={expandedBatches}
                accessType={accessType}
                currentUser={currentUser}
                excludedCuppings={excludedCuppings}
                sessionPermissions={sessionPermissions}
                handleExcludeCupping={handleExcludeCupping}
                renderCuppingScoreDetails={renderCuppingScoreDetails}
                setExpandedBatches={setExpandedBatches}
                t={t}
                batch={batch}
              />
            </div>
          )
        )}
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

const SessionDetail = ({ session, onBack, onFinishSession, onStartSession, onRefresh, selectedContext }) => {
  const { t } = useTranslation();
  const { permissions, role } = usePermissions();
  const navigate = useNavigate();
  const isMountedRef = useRef(true);
  const copyTimeoutRef = useRef(null);
  const textAreaRef = useRef(null);

  // Các state cơ bản
  const [isFinished, setIsFinished] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [batchCuppings, setBatchCuppings] = useState({});
  const [batchDescriptiveScores, setBatchDescriptiveScores] = useState({});
  const [batchAffectiveScores, setBatchAffectiveScores] = useState({});
  const [expandedBatches, setExpandedBatches] = useState({});
  const [excludedCuppings, setExcludedCuppings] = useState({});
  const [excludedAffectiveScores, setExcludedAffectiveScores] = useState({});
  const [loadingCuppings, setLoadingCuppings] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [userHasCupped, setUserHasCupped] = useState(false);
  const [accessType, setAccessType] = useState('full_access');
  const [isCopiedQR, setIsCopiedQR] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);

  // State mới cho Blind Cupping
  const [showBlindInfo, setShowBlindInfo] = useState(false);
  const [revealBatches, setRevealBatches] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);

  const [sessionPermissions, setSessionPermissions] = useState({
    canEdit: false,
    canDelete: false,
    canView: true,
    accessType: 'read_only'
  });

  const [forceUpdate, setForceUpdate] = useState(0);

  const purposeMap = {
    'Check new green bean quality': t('auto.kim_tra_cht_lng_58'),
    'Check green bean quality': t('auto.kim_tra_cht_lng_59'),
    'Check roast batch quality': t('auto.kim_tra_cht_lng_60'),
    'Check finished product quality': t('auto.kim_tra_cht_lng_61'),
  };

  // Kiểm tra Blind Cupping
  const isBlindCupping = session?.is_blind_cupping || false;

  // Kiểm tra quyền xem thông tin batch - chỉ owner mới được xem khi blind cupping
  const canViewBatchInfo = isBlindCupping ? (sessionInfo?.isOwner || revealBatches) : (accessType === 'full_access' || revealBatches);

  // ==================== HELPER FUNCTIONS ====================

  const getBatchDisplayName = (batch, index) => {
    if (!isBlindCupping || canViewBatchInfo) {
      return batch.greenbean_name || `Batch ${batch.batch_id}`;
    }
    return `${t("greenBatch.sample_new")} ${index + 1}`;
  };

  const getBatchDetailInfo = (batch) => {
    if (!isBlindCupping || canViewBatchInfo) {
      return {
        variety: batch.variety || 'N/A',
        processing: batch.processing || 'N/A',
        vendor: batch.vendor_name || 'N/A',
        showInfo: true
      };
    }
    return {
      variety: 'Hiden',
      processing: 'Hiden',
      vendor: 'Hiden',
      showInfo: false
    };
  };

  const getVendorDisplay = (vendor) => {
    if (vendor && vendor !== "N/A" && vendor !== "NA" && vendor !== "null" && vendor !== "undefined" && vendor.trim() !== "") {
      return vendor;
    }
    return t("auto.noVendor");
  };

  // ==================== SCORE CARD TYPE FUNCTIONS ====================

  const isAffectiveScoreCard = () => {
    return session?.score_card_format === 'AffectiveScoreCard' || 
           session?.score_card_format === 'affective' || 
           session?.score_card_format === 'Affective';
  };

  const isDescriptiveScoreCard = () => {
    return session?.score_card_format === 'DescriptiveScoreCard' || 
           session?.score_card_format === 'descriptive';
  };

  const getScoreCardFormatDisplay = () => {
    if (isDescriptiveScoreCard()) return 'Descriptive Score Card';
    if (isAffectiveScoreCard()) return 'Affective Score Card';
    return 'Cupping Form';
  };

  const getScoreCardFormatClass = () => {
    if (isDescriptiveScoreCard()) return 'descriptive';
    if (isAffectiveScoreCard()) return 'affective';
    return 'cupping';
  };

  const getScoreCardEndpoint = () => {
    if (isDescriptiveScoreCard()) return 'descriptive_scorecard';
    if (isAffectiveScoreCard()) return 'affective_scorecard';
    return 'cupping_scorecard';
  };

  // ==================== AVERAGE SCORE FUNCTIONS ====================

  const calculateAverageScore = (cuppings, excludedMap, batchId) => {
    const validScores = cuppings
      .map((cupping, idx) => ({
        score: parseFloat(cupping.final_score || cupping.total_score),
        excluded: excludedMap[`${batchId}_${idx}`]
      }))
      .filter(item => !isNaN(item.score) && !item.excluded)
      .map(item => item.score);
    
    return validScores.length > 0
      ? (validScores.reduce((sum, score) => sum + score, 0) / validScores.length).toFixed(1)
      : null;
  };

  const calculateAffectiveAverageScore = (affectiveScores, excludedMap, batchId) => {
    const validFinalScores = affectiveScores
      .map((score, idx) => ({
        finalScore: parseFloat(score.final_score),
        excluded: excludedMap[`${batchId}_${idx}`]
      }))
      .filter(item => !isNaN(item.finalScore) && !item.excluded)
      .map(item => item.finalScore);
    
    return validFinalScores.length > 0
      ? (validFinalScores.reduce((sum, score) => sum + score, 0) / validFinalScores.length).toFixed(1)
      : null;
  };

  // ==================== SCORE DISPLAY FUNCTIONS ====================

  const calculateDefectScore = (formData, type) => {
    const cups = type === 'non-uniform' 
      ? formData.defect?.non_uniform_cups 
      : formData.defect?.defective_cups;
    const multiplier = type === 'non-uniform' ? 2 : 4;
    return Array.isArray(cups) ? cups.length * multiplier : (cups || 0) * multiplier;
  };

  // ==================== HANDLER FUNCTIONS ====================

  const handleBackClick = () => {
    isMountedRef.current = false;
    
    if (accessType === 'read_only' && window.location.pathname.startsWith('/org/')) {
      const personalContext = { type: 'personal', name: 'Cá nhân' };
      localStorage.setItem('selectedContext', JSON.stringify(personalContext));
      window.location.href = '/personal/session';
    } else {
      onBack();
    }
  };

  const handleExcludeCupping = (batchId, originalIdx) => {
    toggleExcludeCupping(batchId, originalIdx);
  };

  const handleExcludeAffective = (batchId, idx) => {
    toggleExcludeAffectiveScore(batchId, idx);
  };

  // ==================== RENDER FUNCTIONS ====================

  const renderLoadingState = () => (
    <div className="session-detail-page">
      <div className="session-detail-loading">
        <div className="loading-spinner"></div>
        <p>{t('auto.ang_ti_thng_tin_225')}</p>
      </div>
    </div>
  );

  const renderBlindCuppingButton = () => (
    <div
      className="blind-cupping-badge-btn"
      onClick={toggleBlindInfo}
      title={t('cuppingSession.clickToViewInfo')}
      style={{
        backgroundColor: revealBatches ? '#16a34a' : '#9333ea',
        borderColor: revealBatches ? '#16a34a' : '#9333ea'
      }}
    >
      {revealBatches ? <FaEye size={14} /> : <FaEyeSlash size={14} />}
      <span>{revealBatches ? `${t('cuppingSession.Revealed') || 'Đã tiết lộ'}` : 'Blind Cupping'}</span>
      {showBlindInfo && renderBlindCuppingTooltip()}
    </div>
  );

  const renderBlindCuppingTooltip = () => (
    <div className="blind-cupping-tooltip">
      <p>{t('cuppingSession.blindCuppingInfo') || 'Chế độ Blind Cupping đang bật. Thông tin batch đã bị ẩn để tránh thiên vị khi chấm điểm.'}</p>
      {sessionInfo?.isOwner && !revealBatches && (
        <button
          className="reveal-batches-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleRevealBatches();
          }}
        >
          {t('cuppingSession.revealInfo') || 'Tiết lộ thông tin'}
        </button>
      )}
      {!sessionInfo?.isOwner && (
        <p className="no-access-info">⚠️ {t('cuppingSession.onlyOwnerCanReveal') || 'Chỉ người tạo session mới có thể xem thông tin trong chế độ Blind Cupping'}</p>
      )}
      {revealBatches && (
        <p className="revealed-info">{t('cuppingSession.revealedInfo') || 'Thông tin đã được tiết lộ'}</p>
      )}
    </div>
  );

  const renderInfoItem = (label, value, className = '') => (
    <div className="info-item">
      <label>{label}</label>
      <span className={className}>{value}</span>
    </div>
  );

  const renderTastingMode = () => (
    <span className={`blind-cupping-status ${isBlindCupping ? 'blind' : 'normal'}`}>
      {isBlindCupping ? (
        <>
          <FaEyeSlash /> Blind Cupping
        </>
      ) : (
        <>
          <FaEye /> Normal Cupping
        </>
      )}
    </span>
  );

  const renderScoreCardFormat = () => (
    <span className={`score-format-badge ${getScoreCardFormatClass()}`}>
      {getScoreCardFormatDisplay()}
    </span>
  );

  const renderSessionType = () => (
    <span className={`session-type-badge ${session.type_of_session}`}>
      {session.type_of_session === 'open' ? t("auto.m_137") : session.type_of_session === 'close' ? t("auto.ng_138") : session.type_of_session}
    </span>
  );

  const renderStatus = () => (
    <span className={`status ${isFinished ? 'finished' : isStarted ? 'active' : 'pending'}`}>
      {isFinished ? t("auto._kt_thc_202") : isStarted ? t("cuppingSession.inProgress") : t("cuppingSession.notStarted")}
    </span>
  );

  const renderDateInfo = (date, icon) => (
    <span className="date-info">
      <FaClock size={14} color="#6c757d" />
      {date ? new Date(date).toLocaleString('vi-VN') : 'Chưa thiết lập'}
    </span>
  );

  const renderCopyButton = (isCopied, onClick, text) => (
    <button
      onClick={onClick}
      className="qr-copy-link-btn"
      type="button"
      style={{ marginTop: '8px' }}
    >
      {isCopied ? (i18n.language === 'en' ? 'Copied' : 'Đã sao chép') : text}
    </button>
  );

  const renderAffectiveScoreDetails = (formData) => (
    <div className="score-section">
      {/* Fragrance & Aroma */}
      <div className="score-pair">
        <div className="score-grid">
          <div className="score-item">Fragrance: {formData.fragrance_aroma?.fragrance_intensity || 0}</div>
          <div className="score-item">Aroma: {formData.fragrance_aroma?.aroma_intensity || 0}</div>
        </div>
        {formData.fragrance_aroma?.note && (
          <div className="flavor-notes-section">
            <strong>Notes:</strong>
            <p>{formData.fragrance_aroma.note}</p>
          </div>
        )}
      </div>

      {/* Flavor & Aftertaste */}
      <div className="score-pair">
        <div className="score-grid">
          <div className="score-item">Flavor: {formData.flavor_aftertaste?.flavor_intensity || 0}</div>
          <div className="score-item">Aftertaste: {formData.flavor_aftertaste?.aftertaste_intensity || 0}</div>
        </div>
        {formData.flavor_aftertaste?.note && (
          <div className="flavor-notes-section">
            <strong>Notes:</strong>
            <p>{formData.flavor_aftertaste.note}</p>
          </div>
        )}
      </div>

      {/* Acidity */}
      <div className="score-pair">
        <div className="score-grid">
          <div className="score-item">Acidity: {formData.acidity?.intensity || 0}</div>
        </div>
        {formData.acidity?.note && (
          <div className="flavor-notes-section">
            <strong>Notes:</strong>
            <p>{formData.acidity.note}</p>
          </div>
        )}
      </div>

      {/* Sweetness */}
      <div className="score-pair">
        <div className="score-grid">
          <div className="score-item">Sweetness: {formData.sweetness?.intensity || 0}</div>
        </div>
        {formData.sweetness?.note && (
          <div className="flavor-notes-section">
            <strong>Notes:</strong>
            <p>{formData.sweetness.note}</p>
          </div>
        )}
      </div>

      {/* Mouthfeel */}
      <div className="score-pair">
        <div className="score-grid">
          <div className="score-item">Mouthfeel: {formData.mouthfeel?.intensity || 0}</div>
        </div>
        {formData.mouthfeel?.note && (
          <div className="flavor-notes-section">
            <strong>Notes:</strong>
            <p>{formData.mouthfeel.note}</p>
          </div>
        )}
      </div>

      {/* Overall */}
      <div className="score-pair">
        <div className="score-grid">
          <div className="score-item">Overall: {formData.overall?.intensity || 0}</div>
        </div>
        {formData.overall?.note && (
          <div className="flavor-notes-section">
            <strong>Notes:</strong>
            <p>{formData.overall.note}</p>
          </div>
        )}
      </div>

      {/* Defects */}
      <div className="score-pair">
        <div className="score-grid">
          <div className="score-item">Non-uniform: -{calculateDefectScore(formData, 'non-uniform')}</div>
          <div className="score-item">Defective: -{calculateDefectScore(formData, 'defective')}</div>
        </div>
        {formData.defect?.types?.length > 0 && (
          <div className="flavor-notes-section">
            <strong>Defect Types:</strong>
            <p>{formData.defect.types.join(', ')}</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderDescriptiveScoreDetails = (formData) => (
    <>
      <div className="score-section">
        <h4>Fragrance & Aroma</h4>
        <div className="score-item">Fragrance: {formData.fragrance_aroma?.fragrance_intensity || 0}</div>
        <div className="score-item">Aroma: {formData.fragrance_aroma?.aroma_intensity || 0}</div>
        {formData.fragrance_aroma?.note && (
          <div className="notes-item">Notes: {formData.fragrance_aroma.note}</div>
        )}
        {formData.fragrance_aroma?.descriptors?.length > 0 && (
          <div className="descriptors-item">Descriptors: {formData.fragrance_aroma.descriptors.join(', ')}</div>
        )}
      </div>
      <div className="score-section">
        <h4>Flavor & Aftertaste</h4>
        <div className="score-item">Flavor: {formData.flavor_aftertaste?.flavor_intensity || 0}</div>
        <div className="score-item">Aftertaste: {formData.flavor_aftertaste?.aftertaste_intensity || 0}</div>
        {formData.flavor_aftertaste?.note && (
          <div className="notes-item">Notes: {formData.flavor_aftertaste.note}</div>
        )}
        {formData.flavor_aftertaste?.descriptors?.length > 0 && (
          <div className="descriptors-item">Flavor Descriptors: {formData.flavor_aftertaste.descriptors.join(', ')}</div>
        )}
        {formData.flavor_aftertaste?.main_tastes?.length > 0 && (
          <div className="descriptors-item">Main Tastes: {formData.flavor_aftertaste.main_tastes.join(', ')}</div>
        )}
      </div>
      <div className="score-section">
        <h4>Acidity & Sweetness</h4>
        <div className="score-item">Acidity: {formData.acidity?.intensity || 0}</div>
        {formData.acidity?.note && (
          <div className="notes-item">Acidity Notes: {formData.acidity.note}</div>
        )}
        <div className="score-item">Sweetness: {formData.sweetness?.intensity || 0}</div>
        {formData.sweetness?.note && (
          <div className="notes-item">Sweetness Notes: {formData.sweetness.note}</div>
        )}
      </div>
      <div className="score-section">
        <h4>Mouthfeel</h4>
        <div className="score-item">Intensity: {formData.mouthfeel?.intensity || 0}</div>
        {formData.mouthfeel?.note && (
          <div className="notes-item">Notes: {formData.mouthfeel.note}</div>
        )}
        {formData.mouthfeel?.descriptors?.length > 0 && (
          <div className="descriptors-item">Descriptors: {formData.mouthfeel.descriptors.join(', ')}</div>
        )}
      </div>
    </>
  );

  const renderCuppingScoreDetails = (cupping, batch, batchId, originalIdx, isExcluded, calculatedDefects, sessionPermissions, handleExcludeCupping) => (
    <div className={`cupping-detail ${isExcluded ? 'excluded' : ''}`}>
      <div className="cupper-header">
        <div className="cupper-info">
          <span className="cupper-name">{cupping.cupper}</span>
          {sessionPermissions.canEdit && (
            <button
              className={`exclude-btn ${isExcluded ? 'excluded' : ''}`}
              title={isExcluded ? 'Click để đưa phiếu trở lại tính điểm' : 'Click để loại bỏ phiếu khỏi tính điểm'}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleExcludeCupping(batchId, originalIdx);
              }}
            >
              <span className="btn-label">
                {isExcluded ? 'Đưa lại' : 'Loại bỏ'}
              </span>
            </button>
          )}
        </div>
        <div className="score-badges">
          <span className="final-score">Final: {cupping.final_score || '-'}</span>
        </div>
      </div>
      <div className="score-grid">
        <div className="score-item">Fragrance: {cupping.fragrance || '-'}</div>
        <div className="score-item">Flavor: {cupping.flavor || '-'}</div>
        <div className="score-item">Aftertaste: {cupping.aftertaste || '-'}</div>
        <div className="score-item">Acidity: {cupping.acidity || '-'}</div>
        <div className="score-item">Body: {cupping.body || '-'}</div>
        <div className="score-item">Balance: {cupping.balance || '-'}</div>
        {batch.variety_type?.toLowerCase().includes('robusta') ? (
          <>
            <div className="score-item">Sweetness: {cupping.sweetness || '-'}</div>
            <div className="score-item">Bitter: {cupping.bitter || '-'}</div>
            <div className="score-item">Mouthfeel: {cupping.mouthfeel || '-'}</div>
          </>
        ) : (
          <>
            <div className="score-item">Uniformity: {cupping.uniformity || '-'}</div>
            <div className="score-item">Clean Cup: {cupping.clean_cup || '-'}</div>
            <div className="score-item">Sweetness: {cupping.sweetness || '-'}</div>
          </>
        )}
        <div className="score-item">Overall: {cupping.overall || '-'}</div>
        <div className="score-item">Defects: {cupping.defects ?? calculatedDefects}</div>
      </div>
      {cupping.flavor_notes && (
        <div className="flavor-notes-section">
          <strong>{t('auto.flavor_notes_250')}</strong>
          <p>{cupping.flavor_notes}</p>
        </div>
      )}
      {cupping.notes && cupping.notes.trim() && (
        <div className="flavor-notes-section">
          <strong>Notes:</strong>
          <p>{cupping.notes}</p>
        </div>
      )}
    </div>
  );

  // ==================== API FUNCTIONS ====================

  useEffect(() => {
    const checkBlindInfoRevealed = async () => {
      if (isBlindCupping && session?.uuid) {
        try {
          const response = await cuppingSessionApi.getById(session.uuid);
          if (response.data?.blind_info_revealed) {
            setRevealBatches(true);
          }
        } catch (error) {
          console.error('Error checking blind info:', error);
        }
      }
    };

    checkBlindInfoRevealed();
  }, [session?.uuid, isBlindCupping]);

  const toggleBlindInfo = () => {
    setShowBlindInfo(!showBlindInfo);
  };

  const handleRevealBatches = async () => {
    try {
      const sessionId = session.session_id || session.uuid;

      const response = await fetch(`${API_BASE_URL}/cupping-sessions/${sessionId}/reveal-blind-info`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setRevealBatches(true);
        showToast(t('cuppingSession.BlindInfoRevealed'), 'success');
        if (onRefresh) {
          await onRefresh();
        }
      }
    } catch (error) {
      console.error('Error revealing blind info:', error);
      showToast(t('cuppingSession.BlindInfoRevealError'), 'error');
    }
  };

  const loadBatchCuppings = async (batchId) => {
    if (batchCuppings[batchId]?.length > 0 || loadingCuppings[batchId]) {
      return;
    }

    setLoadingCuppings(prev => ({ ...prev, [batchId]: true }));

    try {
      const sessionId = session.session_id || session.uuid;
      const cuppingResponse = await fetch(`${API_BASE_URL}/cupping/session/${sessionId}/batch/${batchId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const cuppingData = await cuppingResponse.json();

      setBatchCuppings(prev => ({
        ...prev,
        [batchId]: cuppingData.success ? cuppingData.data : []
      }));
    } catch (error) {
      console.error('Error loading cuppings:', error);
    } finally {
      setLoadingCuppings(prev => ({ ...prev, [batchId]: false }));
    }
  };

  const toggleExcludeCupping = (batchId, cuppingIndex) => {
    const key = `${batchId}_${cuppingIndex}`;
    setExcludedCuppings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleExcludeAffectiveScore = (batchId, scoreIndex) => {
    const key = `${batchId}_${scoreIndex}`;
    setExcludedAffectiveScores(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleFinishToggle = async () => {
    const newStatus = !isFinished;
    try {
      const sessionId = session.session_id || session.uuid;

      if (!sessionId) {
        showToast(t('cuppingSession.SessionIdNotFound'), 'error');
        return;
      }

      await cuppingSessionApi.finishSession(sessionId, newStatus);
      setIsFinished(newStatus);

      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error toggling finish:', error);
      showToast(t('cuppingSession.UpdateStatusError'), 'error');
    }
  };

  const handleStartToggle = async () => {
    try {
      const sessionId = session.session_id || session.uuid;
      await cuppingSessionApi.startSession(sessionId);
      await new Promise(resolve => setTimeout(resolve, 500));
      const updatedSession = await cuppingSessionApi.getById(sessionId);

      if (updatedSession.data) {
        setIsStarted(Boolean(updatedSession.data.is_started));
        setForceUpdate(prev => prev + 1);

        if (onRefresh) {
          await onRefresh();
        }
      }
    } catch (error) {
      console.error('Error starting session:', error);
      showToast(t('cuppingSession.StartSessionError'), 'error');
    }
  };

  const handleStartCupping = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (userHasCupped) {
      showToast(t('cuppingSession.AlreadyScored'), 'warning');
      return;
    }

    try {
      const sessionId = session.session_id || session.uuid;
      const currentPath = window.location.pathname;
      const prefix = currentPath.startsWith('/org/') ? currentPath.match(/^\/org\/[^\/]+/)[0] : '/personal';
      const endpoint = getScoreCardEndpoint();
      const targetUrl = `${prefix}/sessionlist/${sessionId}/${endpoint}`;

      window.location.href = targetUrl;
    } catch (error) {
      console.error('Error navigating:', error);
      showToast(t('cuppingSession.PageNavigationError'), 'error');
    }
  }, [userHasCupped, session]);

  const fetchBatches = async () => {
    try {
      setLoadingBatches(true);
      const sessionId = session.session_id || session.uuid;
      const response = await cuppingSessionApi.getSessionBatches(sessionId);
      const batchesData = response.data || [];

      if (response.accessType) {
        setAccessType(response.accessType);
      }

      const uniqueBatches = batchesData.filter((batch, index, self) =>
        index === self.findIndex(b => b.batch_id === batch.batch_id)
      );

      setBatches(uniqueBatches);

      const cuppingMap = {};
      const descriptiveMap = {};
      const affectiveMap = {};
      const loadPromises = uniqueBatches.map(async (batch) => {
        try {
          const cuppingResponse = await fetch(`${API_BASE_URL}/cupping/session/${sessionId}/batch/${batch.batch_id}`, {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          const cuppingData = await cuppingResponse.json();
          cuppingMap[batch.batch_id] = cuppingData.success ? cuppingData.data : [];

          try {
            const descriptiveResult = await descriptiveScoreCardApi.getBySessionBatch(sessionId, batch.batch_id);
            descriptiveMap[batch.batch_id] = descriptiveResult.success ? descriptiveResult.data : [];
          } catch (error) {
            console.error('Error loading descriptive scores:', error);
            descriptiveMap[batch.batch_id] = [];
          }

          try {
            const affectiveResult = await affectiveScoreCardApi.getBySessionBatch(sessionId, batch.batch_id);
            affectiveMap[batch.batch_id] = affectiveResult.success ? affectiveResult.data : [];
          } catch (error) {
            console.error('Error loading affective scores:', error);
            affectiveMap[batch.batch_id] = [];
          }
        } catch (error) {
          console.error('Error loading batch scores:', error);
          cuppingMap[batch.batch_id] = [];
          descriptiveMap[batch.batch_id] = [];
          affectiveMap[batch.batch_id] = [];
        }
      });

      await Promise.all(loadPromises);
      setBatchCuppings(cuppingMap);
      setBatchDescriptiveScores(descriptiveMap);
      setBatchAffectiveScores(affectiveMap);

      if (currentUser?.uuid) {
        const hasUserCupping = Object.values(cuppingMap).some(cuppings =>
          cuppings.some(cupping => cupping.user_id === currentUser.uuid)
        );
        const hasUserDescriptive = Object.values(descriptiveMap).some(descriptives =>
          descriptives.some(desc => desc.user_id === currentUser.uuid)
        );
        const hasUserAffective = Object.values(affectiveMap).some(affectives =>
          affectives.some(aff => aff.user_id === currentUser.uuid)
        );
        setUserHasCupped(hasUserCupping || hasUserDescriptive || hasUserAffective);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoadingBatches(false);
    }
  };

  const refreshBatches = async () => {
    if (session?.session_id || session?.uuid) {
      await fetchBatches();
    }
  };

  const getCuppingLink = useCallback(() => {
    const sessionId = session.session_id || session.uuid;
    const currentPath = window.location.pathname;
    const prefix = currentPath.startsWith('/org/') ? currentPath.match(/^\/org\/[^\/]+/)[0] : '/personal';
    const endpoint = getScoreCardEndpoint();

    return `${window.location.origin}${prefix}/sessionlist/${sessionId}/${endpoint}`;
  }, [session]);

  const copyToClipboard = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      const link = getCuppingLink();

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
      } else {
        const tempInput = document.createElement('input');
        tempInput.value = link;
        tempInput.style.position = 'absolute';
        tempInput.style.left = '-9999px';
        tempInput.style.opacity = '0';

        document.body.appendChild(tempInput);
        tempInput.select();
        tempInput.setSelectionRange(0, 99999);

        try {
          document.execCommand('copy');
        } finally {
          setTimeout(() => {
            if (document.body.contains(tempInput)) {
              document.body.removeChild(tempInput);
            }
          }, 0);
        }
      }

      if (isMountedRef.current) {
        setIsCopiedLink(true);
        setTimeout(() => setIsCopiedLink(false), 2000);
        showToast(t('common.copied') || 'Đã sao chép', 'success');
      }
    } catch (error) {
      if (isMountedRef.current) {
        showToast(t('cuppingSession.CopyLinkError'), 'error');
      }
    }
  }, [getCuppingLink]);

  const handleQRImageLoad = (canvas, ctx, img, resolve, reject) => {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    
    canvas.toBlob((blob) => {
      handleQRBlob(blob, resolve, reject);
    });
  };

  const handleQRBlob = async (blob, resolve, reject) => {
    try {
      const isSecureContext = window.isSecureContext;
      
      if (isSecureContext && navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob
          })
        ]);
        setIsCopiedQR(true);
        setTimeout(() => setIsCopiedQR(false), 2000);
        showToast(t('cuppingSession.QRCopied') || 'Đã sao chép QR code', 'success');
        resolve();
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `QR-${session.session_id || 'cupping'}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(t('cuppingSession.QRCopyNotSupported') || 'QR code đã được tải xuống', 'success');
        resolve();
      }
    } catch (error) {
      showToast(t('cuppingSession.QRCopyError') || 'Không thể sao chép QR code', 'error');
      reject(error);
    }
  };

  const copyQRToClipboard = useCallback(async () => {
    try {
      const svg = document.querySelector('.qr-code-wrapper svg');
      if (!svg) return;

      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      canvas.width = 180;
      canvas.height = 180;

      return new Promise((resolve, reject) => {
        img.onload = () => handleQRImageLoad(canvas, ctx, img, resolve, reject);
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
      });
    } catch (error) {
      showToast(t('cuppingSession.QRCopyError') || 'Không thể sao chép QR code', 'error');
    }
  }, [t, session]);

  const fetchCurrentUser = async () => {
    try {
      const userData = await userApi.getCurrentUser();
      setCurrentUser(userData);
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchSessionPermissions = async () => {
    try {
      const sessionId = session.session_id || session.uuid;

      const infoResponse = await fetch(`${API_BASE_URL}/cupping-sessions/${sessionId}/info`, {
        credentials: 'include'
      });

      if (infoResponse.ok) {
        const infoData = await infoResponse.json();
        if (infoData.success) {
          setSessionInfo(infoData.data);
        }
      }

      const permissionsData = await cuppingSessionApi.getSessionPermissions(sessionId);
      if (permissionsData.success) {
        setSessionPermissions(permissionsData.data.permissions);
        const memberAccessType = permissionsData.data.permissions.accessType;
        setAccessType(memberAccessType);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setSessionPermissions({
        canEdit: false,
        canDelete: false,
        canView: true,
        accessType: 'read_only'
      });
      setAccessType('read_only');
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    const initializePage = async () => {
      setPageLoading(true);
      try {
        await fetchCurrentUser();
        await fetchSessionPermissions();

        if (session?.session_id || session?.uuid) {
          await fetchBatches();
        }
      } finally {
        if (isMountedRef.current) {
          setPageLoading(false);
        }
      }
    };

    initializePage();

    setIsFinished(Boolean(session?.is_finished));
    setIsStarted(Boolean(session?.is_started));

    setRevealBatches(false);

    const handleVisibilityChange = () => {
      if (!document.hidden && (session?.session_id || session?.uuid) && isMountedRef.current) {
        fetchBatches();
      }
    };

    const handleFocus = () => {
      if (session?.session_id || session?.uuid && isMountedRef.current) {
        fetchBatches();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    const checkAutoFinish = async () => {
      if (!isMountedRef.current) return;

      const finishDate = session?.finish_date || session?.finished_date;
      if (finishDate && !session?.is_finished && session?.is_started) {
        const finishTime = new Date(finishDate);
        const now = new Date();
        if (now >= finishTime) {
          try {
            const sessionId = session.session_id || session.uuid;
            await cuppingSessionApi.finishSession(sessionId, true);
            if (isMountedRef.current) {
              setIsFinished(true);
              if (onRefresh) {
                await onRefresh();
              }
            }
          } catch (error) {
            console.error('Error auto-finishing session:', error);
          }
        }
      }
    };

    checkAutoFinish();
    const interval = setInterval(checkAutoFinish, 60000);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      isMountedRef.current = false;

      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = null;
      }

      textAreaRef.current = null;
    };
  }, [session?.session_id, session?.is_finished, session?.is_started, session?.finish_date, session?.finished_date]);

  useEffect(() => {
    setIsFinished(Boolean(session?.is_finished));
    setIsStarted(Boolean(session?.is_started));
  }, [session]);

  useEffect(() => {
    if (currentUser?.uuid && (Object.keys(batchCuppings).length > 0 || Object.keys(batchDescriptiveScores).length > 0 || Object.keys(batchAffectiveScores).length > 0)) {
      const hasUserCupping = Object.values(batchCuppings).some(cuppings =>
        cuppings.some(cupping => cupping.user_id === currentUser.uuid)
      );
      const hasUserDescriptive = Object.values(batchDescriptiveScores).some(descriptives =>
        descriptives.some(desc => desc.user_id === currentUser.uuid)
      );
      const hasUserAffective = Object.values(batchAffectiveScores).some(affectives =>
        affectives.some(aff => aff.user_id === currentUser.uuid)
      );
      setUserHasCupped(hasUserCupping || hasUserDescriptive || hasUserAffective);
    } else {
      setUserHasCupped(false);
    }
  }, [currentUser, batchCuppings, batchDescriptiveScores, batchAffectiveScores]);

  if (pageLoading) {
    return renderLoadingState();
  }

  return (
    <div className="session-detail-page">
      <div className="session-detail-content">
        <button className="session-detail-back-button" onClick={handleBackClick}>
          <ArrowLeftIcon size={16} />{t('auto.quay_li_226')}
        </button>

        <div className="session-detail-title">
          <div className="session-title-info">
            <div className="session-detail-icon">
              <FaClipboardList color="#4A90E2" size={32} />
            </div>
            <div>
              <h2 className={`purpose-badge ${session.purpose}`}>
                {purposeMap[session.purpose] || session.purpose}
              </h2>

              <p>{t('auto.chi_tit_thng_ti_227')}</p>
            </div>
          </div>

          <div className="session-detail-actions">
            {!isStarted && !isFinished && accessType === 'full_access' && (
              <button
                className="start-session-btn"
                style={{ display: 'flex', backgroundColor: '#fef3c7', color: '#d97706', border: '2px solid #d97706' }}
                onClick={handleStartToggle}
              >
                <FaClock />{t('auto.bt_u_229')}
              </button>
            )}

            {isStarted && !isFinished && accessType === 'full_access' && (
              <button
                className="finish-session-btn active"
                onClick={handleFinishToggle}
              >
                <FaClock />{t('auto.kt_thc_230')}
              </button>
            )}

            {isBlindCupping && renderBlindCuppingButton()}

            {isFinished && (
              <button className="finish-session-btn finished" disabled>
                <FaCheckCircle />{t('auto._kt_thc_231')}
              </button>
            )}

            {canEdit('cupping_session') && sessionPermissions.canEdit && (
              <button className="edit-session-btn" onClick={() => setShowEditForm(true)}>
                <FaEdit />{t('auto.sa_232')}
              </button>
            )}

            {canDelete('cupping_session') && sessionPermissions.canDelete && (
              <button className="delete-session-btn" onClick={() => setShowDeleteConfirm(true)}>
                <FaTrash />{t('auto.xa_233')}
              </button>
            )}
          </div>
        </div>

        <div className="info-section">
          <h3>{t('auto.thng_tin_phin_234')}</h3>
          <div className="info-section-layout">
            <div className="info-fields-section">
              <div className="info-grid">
                {renderInfoItem(t('cuppingSession.TastingMode'), renderTastingMode())}
                {renderInfoItem(t('cuppingSession.scoreCardFormat'), renderScoreCardFormat())}
                {renderInfoItem(t('auto.loi_phin_237'), renderSessionType())}
                {renderInfoItem(t('auto.trng_thi_238'), renderStatus())}
                {renderInfoItem(t('auto.gi_bt_u_239'), renderDateInfo(session.cupping_date))}
                {renderInfoItem(t('auto.gi_kt_thc_240'), renderDateInfo(session.finish_date))}
              </div>
            </div>

            <div className="qr-code-section">
              <div className="qr-code-container-inline">
                <h4>{t('auto.qut_m_qr_truy_c_241')}</h4>
                <div className="qr-code-wrapper">
                  <QRCode
                    value={getCuppingLink()}
                    size={180}
                    level="H"
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  />
                </div>
                <p className="qr-code-hint">{t('auto.qut_m_qr_m_form_242')}</p>
                {renderCopyButton(
                  isCopiedQR,
                  (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    copyQRToClipboard();
                  },
                  t('cuppingSession.copyQR') || 'Sao chép QR'
                )}
                {renderCopyButton(
                  isCopiedLink,
                  (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    copyToClipboard();
                  },
                  t('cuppingSession.copyLink') || 'Sao chép Link'
                )}
              </div>
            </div>
          </div>
        </div>

        {session.description && (
          <div className="info-section">
            <h3>{t('auto.m_t_243')}</h3>
            <div className="description-content">
              <p>{session.description}</p>
            </div>
          </div>
        )}

        <div className="info-section">
          <h3>{t('auto.danh_sch_nhn_xa_244')}</h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              className={`start-cupping-btn ${userHasCupped ? 'completed' : ''}`}
              onClick={handleStartCupping}
              disabled={!isStarted || isFinished || userHasCupped}
            >
              {userHasCupped ? t("cuppingSession.ScoreComplete") : t('cuppingSession.startScoring')}
            </button>
            {userHasCupped && isBlindCupping && !sessionInfo?.isOwner && !revealBatches && (
              <span className="blind-info-hidden-text">
                {t('cuppingSession.blindInfoHidden')}
              </span>
            )}
          </div>
          <div className="batch-section-title">
            <div className="batch-section-header">
            </div>
          </div>

          <div className="session-batches-grid">
            {loadingBatches ? (
              <p>{t('auto.ang_ti_thng_tin_245')}</p>
            ) : batches.length === 0 ? (
              <p>{t('auto.khng_c_batch_no_247')}</p>
            ) : (
              batches.map((batch, index) => (
                <BatchCard
                  key={batch.batch_id}
                  batch={batch}
                  index={index}
                  batchCuppings={batchCuppings}
                  batchDescriptiveScores={batchDescriptiveScores}
                  batchAffectiveScores={batchAffectiveScores}
                  loadingCuppings={loadingCuppings}
                  expandedBatches={expandedBatches}
                  setExpandedBatches={setExpandedBatches}
                  excludedCuppings={excludedCuppings}
                  excludedAffectiveScores={excludedAffectiveScores}
                  accessType={accessType}
                  currentUser={currentUser}
                  sessionPermissions={sessionPermissions}
                  isBlindCupping={isBlindCupping}
                  canViewBatchInfo={canViewBatchInfo}
                  sessionInfo={sessionInfo}
                  isAffectiveScoreCard={isAffectiveScoreCard}
                  isDescriptiveScoreCard={isDescriptiveScoreCard}
                  getBatchDisplayName={getBatchDisplayName}
                  getBatchDetailInfo={getBatchDetailInfo}
                  calculateAverageScore={calculateAverageScore}
                  calculateAffectiveAverageScore={calculateAffectiveAverageScore}
                  getVendorDisplay={getVendorDisplay}
                  renderAffectiveScoreDetails={renderAffectiveScoreDetails}
                  renderDescriptiveScoreDetails={renderDescriptiveScoreDetails}
                  renderCuppingScoreDetails={renderCuppingScoreDetails}
                  handleExcludeCupping={handleExcludeCupping}
                  handleExcludeAffective={handleExcludeAffective}
                  showToast={showToast}
                  t={t}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {showEditForm && (
        <SessionForm
          session={session}
          onClose={() => setShowEditForm(false)}
          selectedContext={selectedContext}
          onSuccess={async () => {
            setUpdating(true);
            try {
              const sessionId = session.session_id || session.uuid;
              const updatedSession = await cuppingSessionApi.getById(sessionId);
              if (updatedSession.data) {
                setIsFinished(updatedSession.data.is_finished || false);
                setIsStarted(updatedSession.data.is_started || false);
              }

              await Promise.all([
                onRefresh && onRefresh(),
                refreshBatches()
              ]);

              setShowEditForm(false);
            } finally {
              setUpdating(false);
            }
          }}
        />
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title={t('auto.xc_nhn_xa_499')}
        message={<p>{t('cuppingSession.ConfirmDelete')}</p>}
        onConfirm={async () => {
          try {
            await cuppingSessionApi.delete(session.uuid);
            if (onRefresh) onRefresh();
            onBack();
          } catch (error) {
            console.error('Error deleting session:', error);
            showToast(t('cuppingSession.DeleteSessionError'), 'error');
          }
          setShowDeleteConfirm(false);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {updating && (
        <div className="updating-overlay">
          <div className="updating-spinner">
            <div className="spinner"></div>
            <p>{t('auto.ang_cp_nht_252')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionDetail;