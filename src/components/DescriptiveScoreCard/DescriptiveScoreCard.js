import React, { useEffect, useState } from 'react';
import './DescriptiveScoreCard.css';
import { descriptiveScoreCardApi } from '../../api/descriptiveScoreCardApi';
import { useTranslation } from 'react-i18next';
import { isAuthenticated } from '../../utils/cookieAuth';

const SliderComponent = ({ label, field, formData, handleSliderChange, handleNotesChange, openDescriptorModal, handleMainTasteSelect, showDescriptors = false, showMainTastes = false, mainTasteOptions = [] }) => (
  <div className="score-section">
    <h3>{label}</h3>
    <div className="slider-container">
      <div className="slider-labels">
        <span>Low</span>
        <span>Medium</span>
        <span>High</span>
      </div>
      <div className="slider-wrapper">
        <input
          type="range"
          min="0"
          max="15"
          value={formData[field].value}
          onChange={(e) => handleSliderChange(field, parseInt(e.target.value))}
          className="slider"
        />
        <div className="slider-markers">
          <span>0</span>
          <span>5</span>
          <span>10</span>
          <span>15</span>
        </div>
      </div>
      <div className="intensity-label">
        <span>Intensity: {formData[field].value}</span>
        {/* <span>High</span> */}
      </div>
    </div>

    {showDescriptors && (
      <div className="descriptors-section">
        <p>Select the descriptions that apply:</p>
        <button
          className="add-descriptors-btn"
          onClick={() => openDescriptorModal(field)}
        >
          + Add descriptions
        </button>
        {formData[field].descriptors && formData[field].descriptors.length > 0 && (
          <div className="selected-descriptors">
            <p>Selected: {formData[field].descriptors.join(', ')}</p>
          </div>
        )}
      </div>
    )}

    {showMainTastes && (
      <div className="main-tastes-section">
        <p>Main Tastes:</p>
        <div className="tastes-grid">
          {mainTasteOptions.map(taste => (
            <label key={taste} className="taste-checkbox">
              <input
                type="checkbox"
                checked={formData[field].mainTastes?.includes(taste)}
                onChange={(e) => {
                  const current = formData[field].mainTastes || [];
                  const updated = e.target.checked
                    ? [...current, taste]
                    : current.filter(t => t !== taste);
                  handleMainTasteSelect(field, updated);
                }}
              />
              {taste}
            </label>
          ))}
        </div>
      </div>
    )}
  </div>
);

const CombinedSectionComponent = ({ title, fields, formData, handleSliderChange, handleNotesChange, openDescriptorModal, handleMainTasteSelect, descriptorOptions, showBottomRow = false, isDisabled = false }) => (
  <div className="combined-section">
    <div className="section-title">{title}</div>
    <div className="dual-sliders">
      {fields.map((field, index) => (
        <div key={field.field} className="slider-item">
          <h3>{field.label}</h3>
          <div className="slider-container">
            <div className="slider-labels">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
            <div className="slider-wrapper">
              <input
                type="range"
                min="0"
                max="15"
                value={formData[field.field].value}
                onChange={(e) => handleSliderChange(field.field, parseInt(e.target.value))}
                className="slider"
                disabled={isDisabled}
              />
              <div className="slider-markers">
                <span>0</span>
                <span>5</span>
                <span>10</span>
                <span>15</span>
              </div>
            </div>
            <div className="intensity-label" data-intensity={formData[field.field].value}>
              <span>Intensity: {formData[field.field].value}</span>
              {/* <span>High</span> */}
            </div>
          </div>
        </div>
      ))}
    </div>
    {fields.some(field => field.showDescriptors) && (
      <div className="descriptors-section">
        <p>Select the descriptions that apply:</p>
        <button
          className="add-descriptors-btn"
          onClick={() => openDescriptorModal(fields.find(f => f.showDescriptors)?.field)}
          disabled={isDisabled}
        >
          + Add descriptions
        </button>
        {(() => {
          const descriptorField = fields.find(f => f.showDescriptors);
          return descriptorField && formData[descriptorField.field].descriptors && formData[descriptorField.field].descriptors.length > 0 && (
            <div className="selected-descriptors">
              <p>Selected: {formData[descriptorField.field].descriptors.join(', ')}</p>
            </div>
          );
        })()}
      </div>
    )}
    {showBottomRow && (
      <div className="bottom-row">
        <div className="main-tastes-section">
          <p>Main Tastes:</p>
          <div className="tastes-grid">
            {descriptorOptions.aftertaste.map(taste => (
              <label key={taste} className="taste-checkbox">
                <input
                  type="checkbox"
                  checked={formData.aftertaste.mainTastes?.includes(taste)}
                  onChange={(e) => {
                    const current = formData.aftertaste.mainTastes || [];
                    const updated = e.target.checked
                      ? [...current, taste]
                      : current.filter(t => t !== taste);
                    handleMainTasteSelect('aftertaste', updated);
                  }}
                  disabled={isDisabled}
                />
                {taste}
              </label>
            ))}
          </div>
        </div>
        <textarea
          placeholder="Notes:..."
          value={formData.flavor.notes || formData.aftertaste.notes}
          onChange={(e) => {
            handleNotesChange('flavor', e.target.value);
            handleNotesChange('aftertaste', e.target.value);
          }}
          className="notes-textarea"
          disabled={isDisabled}
        />
      </div>
    )}
    {!showBottomRow && (
      <textarea
        placeholder="Notes:..."
        value={fields[0] ? formData[fields[0].field].notes : ''}
        onChange={(e) => fields.forEach(field => handleNotesChange(field.field, e.target.value))}
        className="notes-textarea"
        disabled={isDisabled}
      />
    )}
  </div>
);

const DescriptiveScoreCard = ({ sessionData, onSubmit, onCancel, submitting = false, isGuestCompleted = false }) => {
  const { t } = useTranslation();

  const initialFormData = {
    fragrance: { value: 0, notes: '' },
    aroma: { value: 0, notes: '', descriptors: [] },
    flavor: { value: 0, notes: '', descriptors: [] },
    aftertaste: { value: 0, notes: '', mainTastes: [] },
    acidity: { value: 0, notes: '' },
    mouthfeel: { value: 0, notes: '', mainTastes: [] },
    sweetness: { value: 0, notes: '' }
  };

  const [formData, setFormData] = useState(initialFormData);
  const [cupperName, setCupperName] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [showDescriptorModal, setShowDescriptorModal] = useState(false);
  const [currentField, setCurrentField] = useState('');
  const [selectedDescriptors, setSelectedDescriptors] = useState([]);
  const batches = sessionData?.batches ?? [];
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.batch_id || '');
  const [previousBatchId, setPreviousBatchId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [existingScoreCardId, setExistingScoreCardId] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [batchCompletionStatus, setBatchCompletionStatus] = useState({});

  // Thay đổi: batchFormData giờ lưu dữ liệu đã được convert (backend format)
  const [batchFormData, setBatchFormData] = useState({});

  // Thêm các state để xử lý share page logic
  const [isSharePage, setIsSharePage] = useState(false);
  const [authStatus, setAuthStatus] = useState(null);
  const [userHasScored, setUserHasScored] = useState(false);

  // Blind cupping states
  const [isBlindCupping, setIsBlindCupping] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);

  // Thêm các state để xử lý session status
  const [accessDenied, setAccessDenied] = useState(false);
  const [sessionNotStarted, setSessionNotStarted] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [sessionStatusChecked, setSessionStatusChecked] = useState(false);
  const [isOrganizationMember, setIsOrganizationMember] = useState(false);

  // Tính toán trạng thái disable tổng hợp
  const isDisabled = isCompleted || isGuestCompleted || userHasScored || (sessionEnded);




  // Effect để disable tất cả input khi cần
  useEffect(() => {
    if (isDisabled) {
      // Disable tất cả input, textarea, select, button trong component
      const inputs = document.querySelectorAll('.descriptive-scorecard input, .descriptive-scorecard textarea, .descriptive-scorecard select, .descriptive-scorecard button');
      inputs.forEach(input => {
        if (!input.classList.contains('close-btn')) { // Không disable nút close modal
          input.disabled = true;
        }
      });
    }
  }, [isDisabled]);

  // Descriptor options
  const descriptorOptions = {
    floral: ['Floral'],
    fruity: ['Berry', 'Dried Fruit', 'Citrus Fruit'],
    sourFermented: ['Sour/Fermented', 'Sour', 'Fermented'],
    greenVegetative: ['Green/Vegetative'],
    other: ['Other', 'Chemical', 'Musty/Earthy', 'Woody'],
    roasted: ['Roasted', 'Cereal', 'Burnt', 'Tobacco'],
    nuttycocoa: ['Nutty/Cocoa', 'Nutty', 'Cocoa'],
    spicy: ['Spice'],
    sweet: ['Sweet', 'Vanilla/Vanillin', 'Brown Sugar'],
    aftertaste: ['Salty', 'Sour', 'Sweet', 'Bitter', 'Umami'],
    mouthfeel: ['Rough (Gritty, Chalky, Sandy)', 'Oily', 'Smooth (Velvety, Silky, Syrupy)', 'Mouth-Drying', 'Metallic']
  };

  // Hàm convert formData sang định dạng backend
  const convertFormDataToBackendFormat = (formData) => {
    return {
      fragrance_aroma: {
        fragrance_intensity: formData.fragrance.value,
        aroma_intensity: formData.aroma.value,
        descriptors: formData.aroma.descriptors || [],
        note: formData.aroma.notes || formData.fragrance.notes || ''
      },
      flavor_aftertaste: {
        flavor_intensity: formData.flavor.value,
        aftertaste_intensity: formData.aftertaste.value,
        main_tastes: formData.aftertaste.mainTastes || [],
        descriptors: formData.flavor.descriptors || [],
        note: formData.flavor.notes || formData.aftertaste.notes || ''
      },
      acidity: {
        intensity: formData.acidity.value,
        note: formData.acidity.notes || ''
      },
      sweetness: {
        intensity: formData.sweetness.value,
        note: formData.sweetness.notes || ''
      },
      mouthfeel: {
        intensity: formData.mouthfeel.value,
        descriptors: formData.mouthfeel.mainTastes || [],
        note: formData.mouthfeel.notes || ''
      }
    };
  };

  // Hàm convert từ backend format về frontend format
  const convertBackendToFrontendFormat = (backendData) => {
    if (!backendData) return initialFormData;

    return {
      fragrance: {
        value: backendData.fragrance_aroma?.fragrance_intensity || 0,
        notes: backendData.fragrance_aroma?.note || '',
        descriptors: []
      },
      aroma: {
        value: backendData.fragrance_aroma?.aroma_intensity || 0,
        notes: backendData.fragrance_aroma?.note || '',
        descriptors: backendData.fragrance_aroma?.descriptors || []
      },
      flavor: {
        value: backendData.flavor_aftertaste?.flavor_intensity || 0,
        notes: backendData.flavor_aftertaste?.note || '',
        descriptors: backendData.flavor_aftertaste?.descriptors || []
      },
      aftertaste: {
        value: backendData.flavor_aftertaste?.aftertaste_intensity || 0,
        notes: backendData.flavor_aftertaste?.note || '',
        mainTastes: backendData.flavor_aftertaste?.main_tastes || []
      },
      acidity: {
        value: backendData.acidity?.intensity || 0,
        notes: backendData.acidity?.note || ''
      },
      mouthfeel: {
        value: backendData.mouthfeel?.intensity || 0,
        notes: backendData.mouthfeel?.note || '',
        mainTastes: backendData.mouthfeel?.descriptors || []
      },
      sweetness: {
        value: backendData.sweetness?.intensity || 0,
        notes: backendData.sweetness?.note || ''
      }
    };
  };

  // Effect để disable tất cả input khi cần
  useEffect(() => {
    if (isDisabled) {
      // Disable tất cả input, textarea, select, button trong component
      const inputs = document.querySelectorAll('.descriptive-scorecard input, .descriptive-scorecard textarea, .descriptive-scorecard select, .descriptive-scorecard button');
      inputs.forEach(input => {
        if (!input.classList.contains('close-btn')) { // Không disable nút close modal
          input.disabled = true;
        }
      });
    }
  }, [isDisabled]);
  const updateLabelIntensity = (label, value) => {
    const span = label.querySelector('span');
    if (span && span.textContent.includes(`Intensity: ${value}`)) {
      label.dataset.intensity = value.toString();
    }
  };

  const updateIntensityColors = () => {
    const intensityLabels = document.querySelectorAll('.intensity-label');
    Object.keys(formData).forEach(field => {
      const value = formData[field].value;
      intensityLabels.forEach(label => updateLabelIntensity(label, value));
    });
  };

  useEffect(() => {
    setTimeout(updateIntensityColors, 50);
  }, [formData]);

  // Effect để ẩn số 0 khi không ở chế độ blind cupping
  useEffect(() => {
    if (isBlindCupping) {
      document.body.classList.add('blind-cupping-active');
    } else {
      document.body.classList.remove('blind-cupping-active');
    }

    if (!isBlindCupping) {
      const hideZeroNumbers = () => {
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: function (node) {
              return node.textContent.trim() === '0' ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
            }
          },
          false
        );

        let node;
        while (node = walker.nextNode()) {
          const parent = node.parentElement;
          if (parent &&
            !parent.closest('.descriptive-scorecard') &&
            !parent.matches('input, textarea, select') &&
            !parent.closest('.slider-markers') &&
            !parent.closest('.intensity-label') &&
            parent.textContent.trim() === '0') {
            parent.dataset.hideZero = 'true';
            parent.style.display = 'none';
          }
        }
      };

      setTimeout(hideZeroNumbers, 0);
      setTimeout(hideZeroNumbers, 100);
      setTimeout(hideZeroNumbers, 500);
      setTimeout(hideZeroNumbers, 1000);
      setTimeout(hideZeroNumbers, 2000);

      const observer = new MutationObserver(() => {
        setTimeout(hideZeroNumbers, 50);
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
      });

      return () => {
        observer.disconnect();
        document.body.classList.remove('blind-cupping-active');
      };
    }

    return () => {
      document.body.classList.remove('blind-cupping-active');
    };
  }, [isBlindCupping]);

  // Effect để xử lý sau khi render
  useEffect(() => {
    if (!isBlindCupping) {
      const forceHideZeros = () => {
        document.querySelectorAll('*').forEach(el => {
          if (el.textContent === '0' &&
            el.children.length === 0 &&
            !el.closest('.descriptive-scorecard') &&
            !el.matches('input, textarea, select, option')) {
            el.remove();
          }
        });

        document.querySelectorAll('span, div, p').forEach(el => {
          if (el.textContent.trim() === '0' &&
            !el.closest('.descriptive-scorecard') &&
            !el.closest('.slider-markers') &&
            !el.closest('.intensity-label')) {
            el.style.visibility = 'hidden';
            el.style.display = 'none';
          }
        });
      };

      setTimeout(forceHideZeros, 3000);
      setTimeout(forceHideZeros, 5000);
    }
  }, [isBlindCupping, sessionInfo]);

  // Khởi tạo dữ liệu
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
            } else {

            }
          } catch (error) {

          }
        } else {

        }



        if (infoData.data.type_of_session === 'close' && !isOrganizationMember) {

          setAccessDenied(true);
          setSessionStatusChecked(true);
          return;
        }



        setAccessDenied(false);
      } catch (error) {
        console.error('Error checking session status:', error);
        setAccessDenied(false);
      } finally {
        setSessionStatusChecked(true);
      }
    };

    checkSessionStatus();
  }, [sessionData?.sessionId]);

  // Khởi tạo dữ liệu
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

  // Xử lý khi chọn batch - FIXED: lưu dữ liệu đã convert
  useEffect(() => {
    if (selectedBatchId && authStatus !== null) {
      if (previousBatchId && previousBatchId !== selectedBatchId) {
        // Lưu dữ liệu HIỆN TẠI (đã convert) vào batchFormData
        const convertedData = convertFormDataToBackendFormat(formData);
        setBatchFormData(prev => ({
          ...prev,
          [previousBatchId]: convertedData
        }));
      }
      setPreviousBatchId(selectedBatchId);
      // Gọi loadExistingData mỗi khi có thay đổi
      loadExistingData();
    }
  }, [selectedBatchId, authStatus, currentUser]);

  // Kiểm tra completion status
  useEffect(() => {
    checkAllBatchesCompletion();
  }, [batches, sessionData?.sessionId]);

  const checkAllBatchesCompletion = async () => {
    if (!sessionData?.sessionId || batches.length === 0) return;

    const completionStatus = {};
    for (const batch of batches) {
      const result = await descriptiveScoreCardApi.getBySessionBatch(sessionData.sessionId, batch.batch_id);
      completionStatus[batch.batch_id] = result.success && result.data.length > 0 && result.data[0].final_score;
    }
    setBatchCompletionStatus(completionStatus);
  };

  const loadCachedData = (batchId) => {
    const frontendData = convertBackendToFrontendFormat(batchFormData[batchId]);
    setFormData(frontendData);
    setExistingScoreCardId(null);
    setIsCompleted(false);
  };

  const findUserScoreCard = (scorecards) => {
    if (authStatus && currentUser) {
      return scorecards.find(card => card.user_id === currentUser.uuid);
    }
    if (!authStatus) {
      return scorecards.find(card => card.cupper_name === cupperName);
    }
    return null;
  };

  const loadUserScoreCard = (userScoreCard) => {
    setExistingScoreCardId(userScoreCard.id);
    const formDataFromBE = userScoreCard.form_data;
    
    if (formDataFromBE) {
      setBatchFormData(prev => ({
        ...prev,
        [selectedBatchId]: formDataFromBE
      }));
      
      const frontendData = convertBackendToFrontendFormat(formDataFromBE);
      setFormData(frontendData);
      const completed = !!userScoreCard.final_score;
      setIsCompleted(completed);
    }
  };

  const loadExistingData = async () => {
    if (!sessionData?.sessionId || !selectedBatchId) return;

    if (authStatus === true && !currentUser) return;

    if (batchFormData[selectedBatchId]) {
      loadCachedData(selectedBatchId);
      return;
    }

    const result = await descriptiveScoreCardApi.getBySessionBatch(sessionData.sessionId, selectedBatchId);
    
    if (result.success && result.data.length > 0) {
      const userScoreCard = findUserScoreCard(result.data);
      setUserHasScored(!!userScoreCard);

      if (userScoreCard) {
        loadUserScoreCard(userScoreCard);
      } else {
        resetFormData();
      }
    } else {
      resetFormData();
      setUserHasScored(false);
    }
  };

  const resetFormData = () => {
    setExistingScoreCardId(null);
    setIsCompleted(false);
    setFormData(initialFormData);
  };

  const handleSliderChange = (field, value) => {
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [field]: { ...prev[field], value }
      };
      // Cập nhật batchFormData với dữ liệu đã convert
      const convertedData = convertFormDataToBackendFormat(newFormData);
      setBatchFormData(prevBatch => ({
        ...prevBatch,
        [selectedBatchId]: convertedData
      }));
      return newFormData;
    });

    // Cập nhật màu sắc intensity label
    setTimeout(() => {
      const intensityLabels = document.querySelectorAll('.intensity-label');
      intensityLabels.forEach(label => {
        const span = label.querySelector('span');
        if (span && span.textContent.includes(`Intensity: ${value}`)) {
          label.dataset.intensity = value.toString();
        }
      });
    }, 10);
  };

  const handleNotesChange = (field, notes) => {
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [field]: { ...prev[field], notes }
      };
      // Cập nhật batchFormData với dữ liệu đã convert
      const convertedData = convertFormDataToBackendFormat(newFormData);
      setBatchFormData(prevBatch => ({
        ...prevBatch,
        [selectedBatchId]: convertedData
      }));
      return newFormData;
    });
  };

  const openDescriptorModal = (field) => {
    setCurrentField(field);
    setSelectedDescriptors(formData[field]?.descriptors || []);
    setShowDescriptorModal(true);
  };

  const closeDescriptorModal = () => {
    setShowDescriptorModal(false);
    setCurrentField('');
    setSelectedDescriptors([]);
  };

  const handleDescriptorToggle = (descriptor) => {
    setSelectedDescriptors(prev => {
      if (prev.includes(descriptor)) {
        return prev.filter(d => d !== descriptor);
      } else {
        return [...prev, descriptor];
      }
    });
  };

  const saveDescriptors = () => {
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [currentField]: {
          ...prev[currentField],
          descriptors: selectedDescriptors
        }
      };
      // Cập nhật batchFormData với dữ liệu đã convert
      const convertedData = convertFormDataToBackendFormat(newFormData);
      setBatchFormData(prevBatch => ({
        ...prevBatch,
        [selectedBatchId]: convertedData
      }));
      return newFormData;
    });
    closeDescriptorModal();
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
  const handleMainTasteSelect = (field, tastes) => {
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [field]: { ...prev[field], mainTastes: tastes }
      };
      // Cập nhật batchFormData với dữ liệu đã convert
      const convertedData = convertFormDataToBackendFormat(newFormData);
      setBatchFormData(prevBatch => ({
        ...prevBatch,
        [selectedBatchId]: convertedData
      }));
      return newFormData;
    });
  };

  const handleSubmit = async () => {
    if (loading) return;

    if (!cupperName.trim()) {
      showModal('Thông báo', t('descriptiveScoreCard.enter_your_name'), 'warning');
      return;
    }

    // Kiểm tra xem đã chấm hết tất cả batch chưa
    const totalBatches = batches.length;
    const completedBatches = Object.keys(batchFormData).length;

    if (completedBatches < totalBatches) {
      const remainingBatches = totalBatches - completedBatches;
      showModal(
        'Chưa hoàn thành',
        `Bạn cần chấm điểm cho tất cả ${totalBatches} batch trước khi xác nhận. Còn lại ${remainingBatches} batch chưa chấm.`,
        'warning'
      );
      return;
    }

    // Đảm bảo dữ liệu batch hiện tại đã được lưu vào batchFormData
    const currentConvertedData = convertFormDataToBackendFormat(formData);
    const finalBatchFormData = {
      ...batchFormData,
      [selectedBatchId]: currentConvertedData
    };

    if (onSubmit) {
      onSubmit({
        allBatchData: finalBatchFormData,  // Tất cả dữ liệu đều ở backend format
        cupper_name: cupperName.trim()
      });
    }
  };

  const handleExportCVA = async () => {
    if (!sessionData?.sessionId || !selectedBatchId) {
      showModal('Lỗi', t('descriptiveScoreCard.cannot_export'), 'error');
      return;
    }

    try {
      const { API_BASE_URL } = await import('../../api/config');
      const response = await fetch(`${API_BASE_URL}/cva-export/export-cva/${sessionData.sessionId}/${selectedBatchId}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CVA_Export_${sessionData.sessionId}_${selectedBatchId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json();
        showModal('Lỗi xuất file', `${t('descriptiveScoreCard.export_error')}: ${errorData.message}`, 'error');
      }
    } catch (error) {
      console.error('Error exporting CVA:', error);
      showModal('Lỗi', t('descriptiveScoreCard.export_failed'), 'error');
    }
  };

  const SessionNotStartedView = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', textAlign: 'center' }}>
      <div>
        <h2 style={{ margin: '0 0 16px 0', color: '#ff9800', fontSize: '28px', fontWeight: '600' }}>Phiên chưa bắt đầu</h2>
        <p style={{ color: '#666', margin: '0 0 16px 0' }}>{t("cuppingSession.not_started")}</p>
        <p style={{ color: '#666', margin: '0', fontSize: '14px' }}>{t("cuppingSession.contact_admin")}</p>
      </div>
    </div>
  );

  const SessionEndedView = () => (
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

  const AccessDeniedView = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', textAlign: 'center' }}>
      <div>
        <h2 style={{ margin: '0 0 16px 0', color: '#dc3545', fontSize: '28px', fontWeight: '600' }}>
          {t("auto.khng_c_quyn_truy_cp_264")}
        </h2>
      </div>
    </div>
  );

  const LoadingView = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', textAlign: 'center' }}>
      <div>
        <p style={{ color: '#666', margin: '0' }}>Đang kiểm tra trạng thái...</p>
      </div>
    </div>
  );

  const getBlindCuppingMessage = () => {
    if (!sessionInfo) return null;
    if (!sessionInfo.is_blind_cupping) {
      return (
        <div style={{ background: 'transparent', border: 'none', padding: '12px', margin: '16px 2rem', color: 'transparent', visibility: 'hidden' }}>
          {t('descriptiveScoreCard.regular_session')}
        </div>
      );
    }
    const message = sessionInfo.isOwner 
      ? t('descriptiveScoreCard.blind_cupping_info_owner')
      : `${t('descriptiveScoreCard.blind_cupping_info_owner')} - ${sessionInfo.blind_info_revealed ? t('descriptiveScoreCard.blind_cupping_info_revealed') : t('descriptiveScoreCard.blind_cupping_info_hidden')}`;
    return (
      <div style={{ background: '#f3e5f5', border: '1px solid #9c27b0', borderRadius: '6px', padding: '12px', margin: '16px 2rem', color: '#7b1fa2' }}>
        {message}
      </div>
    );
  };

  const getBatchOptionLabel = (batch, index) => {
    const label = isBlindCupping ? `${t('descriptiveScoreCard.sample')} ${index + 1}` : (batch.greenbean_name || 'Batch');
    const checkmark = batchCompletionStatus[batch.batch_id] ? ' ✓' : '';
    return label + checkmark;
  };

  const handleBatchChange = (newBatchId) => {
    if (selectedBatchId) {
      const convertedData = convertFormDataToBackendFormat(formData);
      setBatchFormData(prev => ({ ...prev, [selectedBatchId]: convertedData }));
    }
    setSelectedBatchId(newBatchId);
  };

  const handleNavigateBatch = (direction) => {
    const currentIndex = batches.findIndex(batch => batch.batch_id === selectedBatchId);
    const targetIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex >= 0 && targetIndex < batches.length) {
      const targetBatch = batches[targetIndex];
      const convertedData = convertFormDataToBackendFormat(formData);
      setBatchFormData(prev => ({ ...prev, [selectedBatchId]: convertedData }));
      setSelectedBatchId(targetBatch.batch_id);
    }
  };

  const handleMouthfeelTasteChange = (e, taste) => {
    const current = formData.mouthfeel.mainTastes || [];
    const updated = e.target.checked ? [...current, taste] : current.filter(t => t !== taste);
    handleMainTasteSelect('mouthfeel', updated);
  };

  const getConfirmButtonText = () => {
    if (loading) return t('descriptiveScoreCard.saving');
    if (isGuestCompleted) return t('descriptiveScoreCard.completed');
    if (isSharePage && userHasScored) return 'Đã chấm điểm';
    if (sessionEnded) return 'Phiên kết thúc';
    return t('descriptiveScoreCard.confirm');
  };

  const renderContent = () => {
    if (!sessionStatusChecked) return <LoadingView />;
    if (sessionNotStarted) return <SessionNotStartedView />;
    if (sessionEnded) return <SessionEndedView />;
    if (accessDenied) return <AccessDeniedView />;
    return null;
  };

  return (
    <div className={`descriptive-scorecard ${isBlindCupping ? 'blind-mode' : ''}`}>
      {renderContent() || (
        <>
          {getBlindCuppingMessage()}

          <div className="session-context">
            <div className="context-block">
              <label className="context-label">
                {t('descriptiveScoreCard.cupper_name')}
              </label>
              <input
                type="text"
                className="batch-select"
                value={cupperName}
                onChange={(e) => setCupperName(e.target.value)}
                placeholder={t('descriptiveScoreCard.placeholder_cupper_name')}
                disabled={isDisabled}
              />
            </div>
            <div className="context-block full-width">
              <label className="context-label">
                {t('descriptiveScoreCard.select_batch_to_score')}
              </label>
              {batches.length > 0 ? (
                <select
                  className="batch-select"
                  value={selectedBatchId}
                  onChange={(e) => handleBatchChange(e.target.value)}
                  disabled={isDisabled}
                >
                  {batches.map((batch, index) => (
                    <option key={batch.batch_id} value={batch.batch_id} title={isBlindCupping ? `${t('descriptiveScoreCard.sample')} ${index + 1}` : batch.greenbean_name}>
                      {getBatchOptionLabel(batch, index)}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="context-hint">
                  {t('descriptiveScoreCard.no_batches_available')}
                </div>
              )}
            </div>
          </div>

          <div className="scorecard-content">
            <CombinedSectionComponent
              title="Fragrance & Aroma"
              fields={[
                { label: "Fragrance", field: "fragrance" },
                { label: "Aroma", field: "aroma", showDescriptors: true }
              ]}
              formData={formData}
              handleSliderChange={handleSliderChange}
              handleNotesChange={handleNotesChange}
              openDescriptorModal={openDescriptorModal}
              handleMainTasteSelect={handleMainTasteSelect}
              isDisabled={isDisabled}
            />

            <CombinedSectionComponent
              title="Flavor & Aftertaste"
              fields={[
                { label: "Flavor", field: "flavor", showDescriptors: true },
                { label: "Aftertaste", field: "aftertaste" }
              ]}
              formData={formData}
              handleSliderChange={handleSliderChange}
              handleNotesChange={handleNotesChange}
              openDescriptorModal={openDescriptorModal}
              handleMainTasteSelect={handleMainTasteSelect}
              descriptorOptions={descriptorOptions}
              showBottomRow={true}
              isDisabled={isDisabled}
            />

            <div className="combined-section">
              <div className="section-title">Acidity & Sweetness</div>
              <div className="dual-sliders">
                <div className="slider-item">
                  <h3>Acidity</h3>
                  <div className="slider-container">
                    <div className="slider-labels">
                      <span>Low</span>
                      <span>Medium</span>
                      <span>High</span>
                    </div>
                    <div className="slider-wrapper">
                      <input
                        type="range"
                        min="0"
                        max="15"
                        value={formData.acidity.value}
                        onChange={(e) => handleSliderChange('acidity', parseInt(e.target.value))}
                        className="slider"
                        disabled={isDisabled}
                      />
                      <div className="slider-markers">
                        <span>0</span>
                        <span>5</span>
                        <span>10</span>
                        <span>15</span>
                      </div>
                    </div>
                    <div className="intensity-label" data-intensity={formData.acidity.value}>
                      <span>Intensity: {formData.acidity.value}</span>
                      {/* <span>High</span> */}
                    </div>
                  </div>
                  <textarea
                    placeholder="Notes:..."
                    value={formData.acidity.notes}
                    onChange={(e) => handleNotesChange('acidity', e.target.value)}
                    className="notes-textarea"
                    disabled={isDisabled}
                  />
                </div>
                <div className="slider-item">
                  <h3>Sweetness</h3>
                  <div className="slider-container">
                    <div className="slider-labels">
                      <span>Low</span>
                      <span>Medium</span>
                      <span>High</span>
                    </div>
                    <div className="slider-wrapper">
                      <input
                        type="range"
                        min="0"
                        max="15"
                        value={formData.sweetness.value}
                        onChange={(e) => handleSliderChange('sweetness', parseInt(e.target.value))}
                        className="slider"
                        disabled={isDisabled}
                      />
                      <div className="slider-markers">
                        <span>0</span>
                        <span>5</span>
                        <span>10</span>
                        <span>15</span>
                      </div>
                    </div>
                    <div className="intensity-label" data-intensity={formData.sweetness.value}>
                      <span>Intensity: {formData.sweetness.value}</span>
                      {/* <span>High</span> */}
                    </div>
                  </div>
                  <textarea
                    placeholder="Notes:..."
                    value={formData.sweetness.notes}
                    onChange={(e) => handleNotesChange('sweetness', e.target.value)}
                    className="notes-textarea"
                    disabled={isDisabled}
                  />
                </div>
              </div>
            </div>

            <div className="combined-section">
              <div className="section-title">Mouthfeel</div>
              <div className="slider-item">
                <h3>Mouthfeel</h3>
                <div className="slider-container">
                  <div className="slider-labels">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                  </div>
                  <div className="slider-wrapper">
                    <input
                      type="range"
                      min="0"
                      max="15"
                      value={formData.mouthfeel.value}
                      onChange={(e) => handleSliderChange('mouthfeel', parseInt(e.target.value))}
                      className="slider"
                      disabled={isDisabled}
                    />
                    <div className="slider-markers">
                      <span>0</span>
                      <span>5</span>
                      <span>10</span>
                      <span>15</span>
                    </div>
                  </div>
                  <div className="intensity-label" data-intensity={formData.mouthfeel.value}>
                    <span>Intensity: {formData.mouthfeel.value}</span>
                    {/* <span>High</span> */}
                  </div>
                </div>
              </div>
              <div className="main-tastes-section">
                <p>Main Tastes:</p>
                <div className="tastes-grid">
                  {descriptorOptions.mouthfeel.map(taste => (
                    <label key={taste} className="taste-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.mouthfeel.mainTastes?.includes(taste)}
                        onChange={(e) => handleMouthfeelTasteChange(e, taste)}
                        disabled={isDisabled}
                      />
                      {taste}
                    </label>
                  ))}
                </div>
              </div>
              <textarea
                placeholder="Notes:..."
                value={formData.mouthfeel.notes}
                onChange={(e) => handleNotesChange('mouthfeel', e.target.value)}
                className="notes-textarea"
                disabled={isDisabled}
              />
            </div>
          </div>

          <div className="action-buttons">
            <div className="navigation-buttons">
              <button
                className="nav-btn prev-btn"
                onClick={() => handleNavigateBatch('prev')}
                disabled={batches.findIndex(batch => batch.batch_id === selectedBatchId) === 0 || isDisabled}
              >
                {t('common.previous')}
              </button>
              <span className="batch-counter">
                {batches.findIndex(batch => batch.batch_id === selectedBatchId) + 1} / {batches.length}
              </span>
              <button
                className="nav-btn next-btn"
                onClick={() => handleNavigateBatch('next')}
                disabled={batches.findIndex(batch => batch.batch_id === selectedBatchId) === batches.length - 1 || isDisabled}
              >
                {t('common.next')}
              </button>
            </div>
            <button
              className="confirm-btn"
              onClick={handleSubmit}
              disabled={loading || isDisabled}
            >
              {getConfirmButtonText()}
            </button>
          </div>

          {showDescriptorModal && (
            <DescriptorModal
              onClose={closeDescriptorModal}
              onConfirm={(descriptors) => {
                const newFormData = {
                  ...formData,
                  [currentField]: {
                    ...formData[currentField],
                    descriptors: descriptors
                  }
                };
                setFormData(newFormData);
                // Cập nhật batchFormData với dữ liệu đã convert
                const convertedData = convertFormDataToBackendFormat(newFormData);
                setBatchFormData(prevBatch => ({
                  ...prevBatch,
                  [selectedBatchId]: convertedData
                }));
              }}
              selected={formData[currentField]?.descriptors || []}
            />
          )}
        </>
      )}
    </div>
  );
};

const DescriptorModal = ({ onClose, onConfirm, selected }) => {
  const [selectedDescriptors, setSelectedDescriptors] = useState(selected);

  const descriptorCategories = {
    'Floral': [],
    'Fruity': ['Berry', 'Dried Fruit', 'Citrus Fruit'],
    'Sour/Fermented': ['Sour', 'Fermented'],
    'Green/Vegetative': [],
    'Other': ['Chemical', 'Musty/Earthy', 'Woody'],
    'Roasted': ['Cereal', 'Burnt', 'Tobacco'],
    'Nutty/Cocoa': ['Nutty', 'Cocoa'],
    'Spice': [],
    'Sweet': ['Vanilla/Vanillin', 'Brown Sugar']
  };

  const handleToggle = (descriptor) => {
    setSelectedDescriptors(prev => {
      // Kiểm tra xem descriptor này có phải là parent category không
      const isParentCategory = Object.keys(descriptorCategories).includes(descriptor);

      if (prev.includes(descriptor)) {
        // Nếu đang bỏ chọn
        return prev.filter(d => d !== descriptor);
      } else {
        // Nếu đang chọn
        let newSelected = [...prev, descriptor];

        if (isParentCategory) {
          // Nếu chọn parent category, bỏ chọn tất cả children của nó
          const childrenToRemove = descriptorCategories[descriptor] || [];
          newSelected = newSelected.filter(d => !childrenToRemove.includes(d));
        } else {
          // Nếu chọn child category, tìm và bỏ chọn parent của nó
          const parentCategory = Object.keys(descriptorCategories).find(parent =>
            descriptorCategories[parent].includes(descriptor)
          );
          if (parentCategory) {
            newSelected = newSelected.filter(d => d !== parentCategory);
          }
        }

        return newSelected;
      }
    });
  };

  const handleSave = () => {
    onConfirm(selectedDescriptors);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="descriptor-modal">
        <div className="modal-header">
          <h3>DESCRIPTIONS:</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          <div className="descriptor-list">
            {Object.entries(descriptorCategories).map(([category, subItems]) => (
              <div key={category} className="category-section">
                <label className="descriptor-item main-item" data-value={category.toLowerCase()}>
                  <input
                    type="checkbox"
                    checked={selectedDescriptors.includes(category)}
                    onChange={() => handleToggle(category)}
                  />
                  <span>{category}</span>
                </label>
                {subItems.map(subItem => (
                  <label key={subItem} className="descriptor-item sub-item" data-value={subItem.toLowerCase()}>
                    <input
                      type="checkbox"
                      checked={selectedDescriptors.includes(subItem)}
                      onChange={() => handleToggle(subItem)}
                    />
                    <span>{subItem}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button className="confirm-btn" onClick={handleSave}>
            Save
          </button>
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DescriptiveScoreCard;