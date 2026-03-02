import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './AffectiveScoreCard.css';
import { affectiveScoreCardApi } from '../../api/affectiveScoreCardApi';
import { useTranslation } from 'react-i18next';
import { isAuthenticated } from '../../utils/cookieAuth';

// Helper functions
const isFieldDisabled = (isCompleted, isGuestCompleted, isSharePage, userHasScored, sessionEnded, isOrganizationMember) => {
  return isCompleted || isGuestCompleted || (isSharePage && userHasScored) || (sessionEnded && !isOrganizationMember);
};

const hasDefectiveCups = (defectiveCups) => {
  return Array.isArray(defectiveCups) ? defectiveCups.length > 0 : defectiveCups > 0;
};

const isDefectChecked = (defectArray, num) => {
  return Array.isArray(defectArray) ? defectArray.includes(num) : false;
};

const getCurrentBatchIndex = (batches, selectedBatchId) => {
  return batches.findIndex(batch => batch.batch_id === selectedBatchId);
};

const getButtonText = (loading, isGuestCompleted, isSharePage, userHasScored, sessionEnded, isOrganizationMember, t) => {
  if (loading) return t("common.saving");
  if (isGuestCompleted) return t("common.completed");
  if (isSharePage && userHasScored) return t("cuppingSession.scored");
  if (sessionEnded && !isOrganizationMember) return t("cuppingSession.sessionEnded");
  return t("common.confirm");
};

const AffectiveScoreCard = ({ sessionData, onSubmit, onCancel, submitting = false, isGuestCompleted = false }) => {
  const { t } = useTranslation();

  const initialFormData = {
    fragrance_aroma: { fragrance_intensity: 1, aroma_intensity: 1, note: '' },
    flavor_aftertaste: { flavor_intensity: 1, aftertaste_intensity: 1, note: '' },
    acidity: { intensity: 1, note: '' },
    sweetness: { intensity: 1, note: '' },
    mouthfeel: { intensity: 1, note: '' },
    overall: { intensity: 1, note: '' },
    defect: { non_uniform_cups: [], defective_cups: [], types: [] }
  };

  const [formData, setFormData] = useState(initialFormData);
  const [cupperName, setCupperName] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const batches = Array.isArray(sessionData?.batches) ? sessionData.batches : [];
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.batch_id || '');
  const [previousBatchId, setPreviousBatchId] = useState(null);
  const [loading] = useState(false);
  const [existingScoreCardId, setExistingScoreCardId] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [batchCompletionStatus, setBatchCompletionStatus] = useState({});
  const [batchFormData, setBatchFormData] = useState({});
  const [isSharePage, setIsSharePage] = useState(false);
  const [authStatus, setAuthStatus] = useState(null);
  const [userHasScored, setUserHasScored] = useState(false);
  const [isBlindCupping, setIsBlindCupping] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);

  // Thêm các state để xử lý session status
  const [accessDenied, setAccessDenied] = useState(false);
  const [sessionNotStarted, setSessionNotStarted] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [sessionStatusChecked, setSessionStatusChecked] = useState(false);
  const [isOrganizationMember, setIsOrganizationMember] = useState(false);

  // Get current batch info for cup count
  const currentBatch = batches.find(batch => batch.batch_id === selectedBatchId);
  const sampleCount = currentBatch?.number_of_sample_cup || 5;

  useEffect(() => {

    const checkSessionStatus = async () => {
      try {

        if (!sessionData?.sessionId) {

          setSessionStatusChecked(true);
          return;
        }


        // Kiểm tra xem có phải share page không - chỉ khi có 'share' trong URL hoặc query param
        const currentPath = window.location.pathname;
        const urlParams = new URLSearchParams(window.location.search);
        const isShare = currentPath.includes('/share') || urlParams.has('share') || sessionData?.isShare;
        setIsSharePage(isShare);





        const { API_BASE_URL } = await import('../../api/config');

        const infoResponse = await fetch(`${API_BASE_URL}/cupping-sessions/${sessionData.sessionId}/info`, {
          credentials: 'include'
        });


        if (!infoResponse.ok) {

          setSessionStatusChecked(true);
          return;
        }


        const infoData = await infoResponse.json();

        if (!infoData.success) {

          setSessionStatusChecked(true);
          return;
        }


        setSessionInfo(infoData.data);


        // Kiểm tra trạng thái session
        if (!infoData.data.is_started) {
          setSessionNotStarted(true);
          setAccessDenied(false);
          setSessionStatusChecked(true);
          return;
        }

        // Kiểm tra session đã kết thúc - không ai được chấm điểm
        if (infoData.data.is_finished) {
          setSessionEnded(true);
          setAccessDenied(false);
          setSessionStatusChecked(true);
          return;
        }

        const authStatus = await isAuthenticated();
        setAuthStatus(authStatus);

        // Sử dụng API getSessionBatches để kiểm tra isOrgMember
        let isOrganizationMember = false;
        if (authStatus) {
          try {
            const batchesResponse = await fetch(`${API_BASE_URL}/cupping-sessions/${sessionData.sessionId}/batches`, {
              credentials: 'include'
            });
            if (batchesResponse.ok) {
              const batchesData = await batchesResponse.json();
              isOrganizationMember = batchesData.isOrgMember || false;

              setIsOrganizationMember(isOrganizationMember);
            }
          } catch (error) {
            console.error('Error fetching organization membership:', error);
          }
        }



        if (infoData.data.type_of_session === 'close' && !isOrganizationMember) {

          setAccessDenied(true);
          setSessionStatusChecked(true);
          return;
        }




        setAccessDenied(false);
      } catch (error) {
        console.error('🔴 [AFF] Error in checkSessionStatus:', error);
        setAccessDenied(true);
      } finally {

        setSessionStatusChecked(true);
      }
    };

    checkSessionStatus();
  }, [sessionData?.sessionId]);

  useEffect(() => {
    setSelectedBatchId(batches[0]?.batch_id || '');

    const fetchSessionInfo = async () => {
      if (sessionData?.sessionId) {
        try {
          const { API_BASE_URL } = await import('../../api/config');
          const response = await fetch(`${API_BASE_URL}/cupping-sessions/${sessionData.sessionId}/info`, {
            credentials: 'include'
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              const blindStatus = result.data.is_blind_cupping || false;
              const isOwner = result.data.isOwner || false;
              const isRevealed = result.data.blind_info_revealed || false;
              const shouldShowBlind = blindStatus && !isOwner && !isRevealed;
              setIsBlindCupping(shouldShowBlind);
            }
          }
        } catch (error) {
          console.error('Error fetching session info:', error);
        }
      }
    };

    const fetchCurrentUser = async () => {
      try {
        const { userApi } = await import('../../api/userApi');
        const userData = await userApi.getCurrentUser();
        setCurrentUser(userData);
        setAuthStatus(true);
        const displayName = (userData.user_firstname && userData.user_lastname)
          ? `${userData.user_firstname} ${userData.user_lastname}`.trim()
          : userData.user_name || userData.username || '';
        setCupperName(displayName);
      } catch (error) {
        setCurrentUser(null);
        setAuthStatus(false);
        setCupperName('');
      }
    };

    const initializeData = async () => {
      await fetchSessionInfo();
      await fetchCurrentUser();
    };

    initializeData();
  }, [sessionData?.sessionId, batches.length]);

  useEffect(() => {
    if (selectedBatchId && authStatus !== null) {
      if (previousBatchId && previousBatchId !== selectedBatchId) {
        setBatchFormData(prev => ({
          ...prev,
          [previousBatchId]: formData
        }));
      }
      setPreviousBatchId(selectedBatchId);
      loadExistingData();
    }
  }, [selectedBatchId, authStatus, currentUser]);

  useEffect(() => {
    checkAllBatchesCompletion();
  }, [batches, sessionData?.sessionId]);

  const checkAllBatchesCompletion = async () => {
    if (!sessionData?.sessionId || batches.length === 0) return;

    const completionStatus = {};
    for (const batch of batches) {
      const result = await affectiveScoreCardApi.getBySessionBatch(sessionData.sessionId, batch.batch_id);
      completionStatus[batch.batch_id] = result.success && result.data.length > 0 && result.data[0].final_score;
    }
    setBatchCompletionStatus(completionStatus);
  };

  const findUserScoreCard = (data, authStatus, currentUser, cupperName) => {
    if (authStatus && currentUser) {
      return data.find(card => card.user_id === currentUser.uuid);
    }
    if (!authStatus) {
      return data.find(card => card.cupper_name === cupperName);
    }
    return null;
  };

  const applyScoreCardData = (userScoreCard) => {
    setExistingScoreCardId(userScoreCard.id);
    const formDataFromBE = userScoreCard.form_data;
    if (formDataFromBE) {
      setBatchFormData(prev => ({ ...prev, [selectedBatchId]: formDataFromBE }));
      setFormData(formDataFromBE);
      setIsCompleted(!!userScoreCard.final_score);
    }
  };

  const loadExistingData = async () => {
    if (!sessionData?.sessionId || !selectedBatchId) return;
    if (authStatus === true && !currentUser) return;

    if (batchFormData[selectedBatchId]) {
      setFormData(batchFormData[selectedBatchId]);
      setExistingScoreCardId(null);
      setIsCompleted(false);
      return;
    }

    const result = await affectiveScoreCardApi.getBySessionBatch(sessionData.sessionId, selectedBatchId);

    if (!result.success || result.data.length === 0) {
      resetFormData();
      setUserHasScored(false);
      return;
    }

    const userScoreCard = findUserScoreCard(result.data, authStatus, currentUser, cupperName);
    setUserHasScored(!!userScoreCard);

    if (userScoreCard) {
      applyScoreCardData(userScoreCard);
    } else {
      resetFormData();
    }
  };

  const resetFormData = () => {
    setExistingScoreCardId(null);
    setIsCompleted(false);
    setFormData(initialFormData);
  };

  const updateFormField = (field, updates) => {
    setFormData(prev => {
      const newFormData = { ...prev, [field]: { ...prev[field], ...updates } };
      setBatchFormData(prevBatch => ({ ...prevBatch, [selectedBatchId]: newFormData }));
      return newFormData;
    });
  };

  const handleSliderChange = (field, value) => {
    const fieldMap = {
      fragrance: { parent: 'fragrance_aroma', key: 'fragrance_intensity' },
      aroma: { parent: 'fragrance_aroma', key: 'aroma_intensity' },
      flavor: { parent: 'flavor_aftertaste', key: 'flavor_intensity' },
      aftertaste: { parent: 'flavor_aftertaste', key: 'aftertaste_intensity' }
    };

    const mapping = fieldMap[field];
    if (mapping) {
      updateFormField(mapping.parent, { [mapping.key]: value });
    } else {
      updateFormField(field, { intensity: value });
    }
  };

  const handleNotesChange = (field, notes) => {
    const noteFieldMap = {
      fragrance: 'fragrance_aroma',
      aroma: 'fragrance_aroma',
      flavor: 'flavor_aftertaste',
      aftertaste: 'flavor_aftertaste'
    };

    const targetField = noteFieldMap[field] || field;
    updateFormField(targetField, { note: notes });
  };

  const handleDefectChange = (type, value, isChecked) => {
    setFormData(prev => {
      let newValue;

      if (type === 'types') {
        newValue = value;
      } else {
        const currentArray = prev.defect[type] || [];

        if (isChecked) {
          if (currentArray.includes(value)) {
            newValue = currentArray;
          } else {
            newValue = [...currentArray, value];
          }
        } else {
          newValue = currentArray.filter(item => item !== value);
        }
      }

      const newFormData = {
        ...prev,
        defect: { ...prev.defect, [type]: newValue }
      };

      setBatchFormData(prevBatch => ({ ...prevBatch, [selectedBatchId]: newFormData }));
      return newFormData;
    });
  };

  const showModal = (title, message, type = 'info') => {
    const modal = document.createElement('div');
    const colors = {
      error: '#dc3545',
      warning: '#ff9800',
      info: '#17a2b8',
      success: '#28a745'
    };

    modal.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 9999;">
        <div style="background: white; padding: 24px; border-radius: 8px; text-align: center; max-width: 450px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
          <h3 style="color: ${colors[type]}; margin: 0 0 16px 0; font-size: 18px;">${title}</h3>
          <p style="margin: 0 0 20px 0; line-height: 1.5; color: #333;">${message}</p>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                  style="background: ${colors[type]}; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: 500;">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  };

  const validateSubmit = () => {
    if (!cupperName.trim()) {
      showModal(t("common.notification"), t("cuppingSession.enterTasterName"), "warning");
      return false;
    }

    const totalBatches = batches.length;
    const completedBatches = Object.keys(batchFormData).length;

    if (completedBatches < totalBatches) {
      const remainingBatches = totalBatches - completedBatches;
      showModal(
        t("cuppingSession.notCompletedTitle"),
        t("cuppingSession.notCompletedMessage", { total: totalBatches, remaining: remainingBatches }),
        "warning"
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (loading || !validateSubmit()) return;

    const finalBatchFormData = { ...batchFormData, [selectedBatchId]: formData };
    if (onSubmit) {
      onSubmit({ allBatchData: finalBatchFormData, cupper_name: cupperName.trim() });
    }
  };

  const fieldDisabled = isFieldDisabled(isCompleted, isGuestCompleted, isSharePage, userHasScored, sessionEnded, isOrganizationMember);
  const currentBatchIndex = getCurrentBatchIndex(batches, selectedBatchId);
  const buttonText = getButtonText(loading, isGuestCompleted, isSharePage, userHasScored, sessionEnded, isOrganizationMember, t);

  const navigateBatch = (direction) => {
    const newIndex = currentBatchIndex + direction;
    if (newIndex >= 0 && newIndex < batches.length) {
      setBatchFormData(prev => ({ ...prev, [selectedBatchId]: formData }));
      setSelectedBatchId(batches[newIndex].batch_id);
    }
  };

  const renderSessionStatus = () => {
    if (!sessionStatusChecked) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', textAlign: 'center' }}>
          <div><p style={{ color: '#666', margin: '0' }}>Đang kiểm tra trạng thái...</p></div>
        </div>
      );
    }

    if (sessionNotStarted) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', textAlign: 'center' }}>
          <div>
            <h2 style={{ margin: '0 0 16px 0', color: '#ff9800', fontSize: '28px', fontWeight: '600' }}>Phiên chưa bắt đầu</h2>
            <p style={{ color: '#666', margin: '0 0 16px 0' }}>{t("cuppingSession.not_started")}</p>
            <p style={{ color: '#666', margin: '0', fontSize: '14px' }}>{t("cuppingSession.contact_admin")}</p>
          </div>
        </div>
      );
    }

    if (sessionEnded) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', textAlign: 'center' }}>
          <div>
            <h2 style={{ margin: '0 0 16px 0', color: '#9e9e9e', fontSize: '28px', fontWeight: '600' }}>
              {t("cuppingSession.session_ended_title")}
            </h2>
            <p style={{ color: '#666', margin: '0 0 16px 0' }}>{t("cuppingSession.session_ended_message")}</p>
            <p style={{ color: '#666', margin: '0', fontSize: '14px' }}>{t("cuppingSession.no_more_scoring")}</p>
          </div>
        </div>
      );
    }

    if (accessDenied) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', textAlign: 'center' }}>
          <div>
            <h2 style={{ margin: '0 0 16px 0', color: '#dc3545', fontSize: '28px', fontWeight: '600' }}>
              {t("auto.khng_c_quyn_truy_cp_264")}
            </h2>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`affective-scorecard ${isBlindCupping ? 'blind-mode' : ''}`}>
      {renderSessionStatus()}
      {sessionStatusChecked && !accessDenied && !sessionNotStarted && !sessionEnded && (
        <>
          {sessionInfo && (
            sessionInfo.is_blind_cupping ? (
              <div style={{
                background: '#f3e5f5',
                border: '1px solid #9c27b0',
                borderRadius: '6px',
                padding: '12px',
                margin: '16px 2rem',
                color: '#7b1fa2'
              }}>
                {sessionInfo.isOwner ? (
                  t("cuppingSession.blindModeOwner")
                ) : (
                  t("cuppingSession.blindModeStatus", {
                    status: sessionInfo.blind_info_revealed
                      ? t("cuppingSession.infoRevealed")
                      : t("cuppingSession.infoHidden")
                  })
                )}
              </div>
            ) : (
              <div style={{
                background: 'transparent',
                border: 'none',
                padding: '12px',
                margin: '16px 2rem',
                color: 'transparent',
                visibility: 'hidden'
              }}>
                {t("cuppingSession.normalSession")}
              </div>
            )
          )}

          <div className="affective-session-context">
            <div className="affective-context-block">
              <label className="affective-context-label">
                {t("cuppingSession.tasterName")}
              </label>
              <input
                type="text"
                className="affective-batch-select"
                value={cupperName}
                onChange={(e) => setCupperName(e.target.value)}
                placeholder="Nhập tên của bạn"
                disabled={isGuestCompleted || (isSharePage && userHasScored) || sessionEnded}
              />
            </div>
            <div className="affective-context-block full-width">
              <label className="affective-context-label">
                {t("cuppingSession.selectBatchToScore")}
              </label>
              {batches.length > 0 ? (
                <select
                  className="affective-batch-select"
                  value={selectedBatchId}
                  onChange={(e) => {
                    if (selectedBatchId) {
                      setBatchFormData(prev => ({
                        ...prev,
                        [selectedBatchId]: formData
                      }));
                    }
                    setSelectedBatchId(e.target.value);
                  }}
                  disabled={isGuestCompleted || (isSharePage && userHasScored) || sessionEnded}
                >
                  {batches.map((batch, index) => (
                    <option key={batch.batch_id} value={batch.batch_id} title={isBlindCupping ? `Mẫu ${index + 1}` : batch.greenbean_name}>
                      {isBlindCupping
                        ? `${t("greenBatch.sample_new")} ${index + 1}`
                        : (batch.greenbean_name || 'Batch')
                      } {batchCompletionStatus[batch.batch_id] ? '✓' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="affective-context-hint">
                  {t("cuppingSession.noBatchAvailable")}
                </div>
              )}
            </div>
          </div>
          <div className="affective-scorecard-content">
            <div className="affective-combined-section">
              <div className="affective-section-title">Fragrance & Aroma</div>
              <div className="affective-dual-sliders">
                <div className="affective-slider-item">
                  <h3>Fragrance</h3>
                  <div className="affective-slider-container">
                    <div className="affective-slider-labels">
                      <span>Low</span>
                      <span>Medium</span>
                      <span>High</span>
                    </div>
                    <div className="affective-slider-wrapper">
                      <input
                        type="range"
                        min="1"
                        max="9"
                        value={formData.fragrance_aroma?.fragrance_intensity || 1}
                        onChange={(e) => handleSliderChange('fragrance', Number.parseInt(e.target.value, 10))}
                        className="affective-slider"
                        disabled={fieldDisabled}
                      />
                      <div className="affective-slider-markers">
                        <span>1</span>
                        <span>2</span>
                        <span>3</span>
                        <span>4</span>
                        <span>5</span>
                        <span>6</span>
                        <span>7</span>
                        <span>8</span>
                        <span>9</span>
                      </div>
                    </div>
                    <div className="affective-intensity-label" data-intensity={formData.fragrance_aroma?.fragrance_intensity || 1}>
                      <span>Intensity: {formData.fragrance_aroma?.fragrance_intensity || 1}</span>
                    </div>
                  </div>
                </div>
                <div className="affective-slider-item">
                  <h3>Aroma</h3>
                  <div className="affective-slider-container">
                    <div className="affective-slider-labels">
                      <span>Low</span>
                      <span>Medium</span>
                      <span>High</span>
                    </div>
                    <div className="affective-slider-wrapper">
                      <input
                        type="range"
                        min="1"
                        max="9"
                        value={formData.fragrance_aroma?.aroma_intensity || 1}
                        onChange={(e) => handleSliderChange('aroma', Number.parseInt(e.target.value, 10))}
                        className="affective-slider"
                        disabled={fieldDisabled}
                      />
                      <div className="affective-slider-markers">
                        <span>1</span>
                        <span>2</span>
                        <span>3</span>
                        <span>4</span>
                        <span>5</span>
                        <span>6</span>
                        <span>7</span>
                        <span>8</span>
                        <span>9</span>
                      </div>
                    </div>
                    <div className="affective-intensity-label" data-intensity={formData.fragrance_aroma?.aroma_intensity || 1}>
                      <span>Intensity: {formData.fragrance_aroma?.aroma_intensity || 1}</span>
                    </div>
                  </div>
                </div>
              </div>
              <textarea
                placeholder="Notes:..."
                value={formData.fragrance_aroma?.note || ''}
                onChange={(e) => handleNotesChange('fragrance', e.target.value)}
                className="affective-notes-textarea"
                disabled={fieldDisabled}
              />
            </div>

            <div className="affective-combined-section">
              <div className="affective-section-title">Flavor & Aftertaste</div>
              <div className="affective-dual-sliders">
                <div className="affective-slider-item">
                  <h3>Flavor</h3>
                  <div className="affective-slider-container">
                    <div className="affective-slider-labels">
                      <span>Low</span>
                      <span>Medium</span>
                      <span>High</span>
                    </div>
                    <div className="affective-slider-wrapper">
                      <input
                        type="range"
                        min="1"
                        max="9"
                        value={formData.flavor_aftertaste?.flavor_intensity || 1}
                        onChange={(e) => handleSliderChange('flavor', Number.parseInt(e.target.value, 10))}
                        className="affective-slider"
                        disabled={fieldDisabled}
                      />
                      <div className="affective-slider-markers">
                        <span>1</span>
                        <span>2</span>
                        <span>3</span>
                        <span>4</span>
                        <span>5</span>
                        <span>6</span>
                        <span>7</span>
                        <span>8</span>
                        <span>9</span>
                      </div>
                    </div>
                    <div className="affective-intensity-label" data-intensity={formData.flavor_aftertaste?.flavor_intensity || 1}>
                      <span>Intensity: {formData.flavor_aftertaste?.flavor_intensity || 1}</span>
                    </div>
                  </div>
                </div>
                <div className="affective-slider-item">
                  <h3>Aftertaste</h3>
                  <div className="affective-slider-container">
                    <div className="affective-slider-labels">
                      <span>Low</span>
                      <span>Medium</span>
                      <span>High</span>
                    </div>
                    <div className="affective-slider-wrapper">
                      <input
                        type="range"
                        min="1"
                        max="9"
                        value={formData.flavor_aftertaste?.aftertaste_intensity || 1}
                        onChange={(e) => handleSliderChange('aftertaste', Number.parseInt(e.target.value, 10))}
                        className="affective-slider"
                        disabled={fieldDisabled}
                      />
                      <div className="affective-slider-markers">
                        <span>1</span>
                        <span>2</span>
                        <span>3</span>
                        <span>4</span>
                        <span>5</span>
                        <span>6</span>
                        <span>7</span>
                        <span>8</span>
                        <span>9</span>
                      </div>
                    </div>
                    <div className="affective-intensity-label" data-intensity={formData.flavor_aftertaste?.aftertaste_intensity || 1}>
                      <span>Intensity: {formData.flavor_aftertaste?.aftertaste_intensity || 1}</span>
                    </div>
                  </div>
                </div>
              </div>
              <textarea
                placeholder="Notes:..."
                value={formData.flavor_aftertaste?.note || ''}
                onChange={(e) => handleNotesChange('flavor', e.target.value)}
                className="affective-notes-textarea"
                disabled={fieldDisabled}
              />
            </div>

            <div className="affective-combined-section">
              <div className="affective-section-title">Acidity & Sweetness</div>
              <div className="affective-dual-sliders">
                <div className="affective-slider-item">
                  <h3>Acidity</h3>
                  <div className="affective-slider-container">
                    <div className="affective-slider-labels">
                      <span>Low</span>
                      <span>Medium</span>
                      <span>High</span>
                    </div>
                    <div className="affective-slider-wrapper">
                      <input
                        type="range"
                        min="1"
                        max="9"
                        value={formData.acidity.intensity}
                        onChange={(e) => handleSliderChange('acidity', Number.parseInt(e.target.value, 10))}
                        className="affective-slider"
                        disabled={fieldDisabled}
                      />
                      <div className="affective-slider-markers">
                        <span>1</span>
                        <span>2</span>
                        <span>3</span>
                        <span>4</span>
                        <span>5</span>
                        <span>6</span>
                        <span>7</span>
                        <span>8</span>
                        <span>9</span>
                      </div>
                    </div>
                    <div className="affective-intensity-label" data-intensity={formData.acidity.intensity}>
                      <span>Intensity: {formData.acidity.intensity}</span>
                    </div>
                  </div>
                  <textarea
                    placeholder="Notes:..."
                    value={formData.acidity.note}
                    onChange={(e) => handleNotesChange('acidity', e.target.value)}
                    className="affective-notes-textarea"
                    disabled={fieldDisabled}
                  />
                </div>
                <div className="affective-slider-item">
                  <h3>Sweetness</h3>
                  <div className="affective-slider-container">
                    <div className="affective-slider-labels">
                      <span>Low</span>
                      <span>Medium</span>
                      <span>High</span>
                    </div>
                    <div className="affective-slider-wrapper">
                      <input
                        type="range"
                        min="1"
                        max="9"
                        value={formData.sweetness.intensity}
                        onChange={(e) => handleSliderChange('sweetness', Number.parseInt(e.target.value, 10))}
                        className="affective-slider"
                        disabled={fieldDisabled}
                      />
                      <div className="affective-slider-markers">
                        <span>1</span>
                        <span>2</span>
                        <span>3</span>
                        <span>4</span>
                        <span>5</span>
                        <span>6</span>
                        <span>7</span>
                        <span>8</span>
                        <span>9</span>
                      </div>
                    </div>
                    <div className="affective-intensity-label" data-intensity={formData.sweetness.intensity}>
                      <span>Intensity: {formData.sweetness.intensity}</span>
                    </div>
                  </div>
                  <textarea
                    placeholder="Notes:..."
                    value={formData.sweetness.note}
                    onChange={(e) => handleNotesChange('sweetness', e.target.value)}
                    className="affective-notes-textarea"
                    disabled={fieldDisabled}
                  />
                </div>
              </div>
            </div>

            <div className="affective-combined-section">
              <div className="affective-section-title">Mouthfeel & Overall</div>
              <div className="affective-dual-sliders">
                <div className="affective-slider-item">
                  <h3>Mouthfeel</h3>
                  <div className="affective-slider-container">
                    <div className="affective-slider-labels">
                      <span>Low</span>
                      <span>Medium</span>
                      <span>High</span>
                    </div>
                    <div className="affective-slider-wrapper">
                      <input
                        type="range"
                        min="1"
                        max="9"
                        value={formData.mouthfeel.intensity}
                        onChange={(e) => handleSliderChange('mouthfeel', Number.parseInt(e.target.value, 10))}
                        className="affective-slider"
                        disabled={fieldDisabled}
                      />
                      <div className="affective-slider-markers">
                        <span>1</span>
                        <span>2</span>
                        <span>3</span>
                        <span>4</span>
                        <span>5</span>
                        <span>6</span>
                        <span>7</span>
                        <span>8</span>
                        <span>9</span>
                      </div>
                    </div>
                    <div className="affective-intensity-label" data-intensity={formData.mouthfeel.intensity}>
                      <span>Intensity: {formData.mouthfeel.intensity}</span>
                    </div>
                  </div>
                  <textarea
                    placeholder="Notes:..."
                    value={formData.mouthfeel.note}
                    onChange={(e) => handleNotesChange('mouthfeel', e.target.value)}
                    className="affective-notes-textarea"
                    disabled={fieldDisabled}
                  />
                </div>
                <div className="affective-slider-item">
                  <h3>Overall</h3>
                  <div className="affective-slider-container">
                    <div className="affective-slider-labels">
                      <span>Low</span>
                      <span>Medium</span>
                      <span>High</span>
                    </div>
                    <div className="affective-slider-wrapper">
                      <input
                        type="range"
                        min="1"
                        max="9"
                        value={formData.overall.intensity}
                        onChange={(e) => handleSliderChange('overall', Number.parseInt(e.target.value, 10))}
                        className="affective-slider"
                        disabled={fieldDisabled}
                      />
                      <div className="affective-slider-markers">
                        <span>1</span>
                        <span>2</span>
                        <span>3</span>
                        <span>4</span>
                        <span>5</span>
                        <span>6</span>
                        <span>7</span>
                        <span>8</span>
                        <span>9</span>
                      </div>
                    </div>
                    <div className="affective-intensity-label" data-intensity={formData.overall.intensity}>
                      <span>Intensity: {formData.overall.intensity}</span>
                    </div>
                  </div>
                  <textarea
                    placeholder="Notes:..."
                    value={formData.overall.note}
                    onChange={(e) => handleNotesChange('overall', e.target.value)}
                    className="affective-notes-textarea"
                    disabled={fieldDisabled}
                  />
                </div>
              </div>
            </div>

            <div className="affective-defect-section">
              <h3>Defects</h3>
              <div className="affective-defect-inputs">
                <div className="affective-defect-item">
                  <label>NON-UNIFORM CUPS:</label>
                  <div className="affective-defect-checkboxes">
                    {Array.from({ length: Math.min(sampleCount, 5) }, (_, i) => i + 1).map(num => (
                      <label key={num} className="affective-defect-checkbox">
                        <input
                          type="checkbox"
                          checked={isDefectChecked(formData.defect.non_uniform_cups, num)}
                          onChange={(e) => {
                            handleDefectChange('non_uniform_cups', num, e.target.checked);
                          }}
                          disabled={fieldDisabled}
                        />
                        <span>{num}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="affective-defect-item">
                  <label>DEFECTIVE CUPS:</label>
                  <div className="affective-defect-checkboxes">
                    {Array.from({ length: Math.min(sampleCount, 5) }, (_, i) => i + 1).map(num => (
                      <label key={num} className="affective-defect-checkbox">
                        <input
                          type="checkbox"
                          checked={isDefectChecked(formData.defect.defective_cups, num)}
                          onChange={(e) => {
                            handleDefectChange('defective_cups', num, e.target.checked);
                          }}
                          disabled={fieldDisabled}
                        />
                        <span>{num}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {hasDefectiveCups(formData.defect.defective_cups) && (
                <div className="affective-defect-types">
                  <label>Defect Name:</label>
                  <div className="affective-defect-type-checkboxes">
                    {['Moldy', 'Phenolic', 'Potato'].map(type => (
                      <label key={type} className="affective-defect-type-checkbox">
                        <input
                          type="checkbox"
                          checked={formData.defect.types.includes(type.toLowerCase())}
                          onChange={(e) => {
                            const types = formData.defect.types || [];
                            const newTypes = e.target.checked
                              ? [...types, type.toLowerCase()]
                              : types.filter(t => t !== type.toLowerCase());
                            handleDefectChange('types', newTypes);
                          }}
                          disabled={fieldDisabled}
                        />
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="affective-action-buttons">
            <div className="navigation-buttons">
              <button
                className="nav-btn prev-btn"
                onClick={() => navigateBatch(-1)}
                disabled={currentBatchIndex === 0 || fieldDisabled}
              >
                {t('common.previous')}
              </button>
              <span className="batch-counter">
                {currentBatchIndex + 1} / {batches.length}
              </span>
              <button
                className="nav-btn next-btn"
                onClick={() => navigateBatch(1)}
                disabled={currentBatchIndex === batches.length - 1 || fieldDisabled}
              >
                {t('common.next')}
              </button>
            </div>
            <button
              className="affective-confirm-btn"
              onClick={handleSubmit}
              disabled={loading || fieldDisabled}
            >
              {buttonText}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

AffectiveScoreCard.propTypes = {
  sessionData: PropTypes.shape({
    sessionId: PropTypes.string,
    batches: PropTypes.array,
    isShare: PropTypes.bool,
  }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
  isGuestCompleted: PropTypes.bool
};

export default AffectiveScoreCard;