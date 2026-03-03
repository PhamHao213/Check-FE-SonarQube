import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './CuppingForm.css';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { cuppingApi } from '../../api/cuppingApi';
import { API_BASE_URL } from '../../api/config';
import { isAuthenticated } from '../../utils/cookieAuth';
import ScoreInput from '../../components/ScoreInput/ScoreInput';

const CuppingForm = ({ sessionData, onBack, onSubmit }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Clean sessionId from URL parameters if needed
  const cleanSessionId = sessionData?.sessionId ? sessionData.sessionId.split('?')[0] : '';

  // Detect if this is a share page
  const isSharePage = window.location.pathname.includes('/cupping_scorecard') || window.location.pathname.includes('/share') || window.location.search.includes('share=true') || sessionData?.isShare;

  // Function to truncate long names
  const truncateName = (name, maxLength = 40) => {
    if (!name) return 'N/A';
    return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name;
  };

  // Mobile form selector state
  const [selectedFormIndex, setSelectedFormIndex] = useState(() => {
    // Nếu có selectedBatchIndex từ sessionData, sử dụng nó
    if (sessionData?.selectedBatchIndex !== undefined) {
      return sessionData.selectedBatchIndex;
    }
    return 0;
  });

  const [cuppingData, setCuppingData] = useState(() => {
    // Initialize with empty data - will load from API when needed

    // Ensure batches is an array
    let batches = [];
    if (sessionData?.batches) {
      if (Array.isArray(sessionData.batches)) {
        batches = sessionData.batches;
      } else if (typeof sessionData.batches === 'object') {
        // If batches is an object, try to convert it to array or use empty array
        batches = [];
        console.warn('Batches is not an array, using empty array');
      }
    }

    if (!sessionData) {
     
      return [];
    }

    if (batches.length === 0) {

      return [];
    }

    const result = batches.map(batch => {
      const sampleCount = batch.number_of_sample_cup || 5;
      const varietyType = batch.variety_type || 'Arabica';
      const isRobusta = varietyType.toLowerCase().includes('robusta');

      return {
        batchId: batch.batch_id,
        batchName: batch.greenbean_name || `Batch ${batch.batch_id}`,
        varietyType: varietyType,
        isRobusta: isRobusta,
        cupper: '',
        isLead: true,
        notes: '',
        flavorNotes: '',
        sampleCount: sampleCount,
        scores: {
          fragrance: "",
          flavor: "",
          aftertaste: "",
          acidity: "",
          body: "",
          balance: "",
          flavorNote: "",
          overall: "",
          uniformity: Math.min(sampleCount, 5) === 5 ? 10 : (Math.min(sampleCount, 5) === 4 ? 10 : (Math.min(sampleCount, 5) === 3 ? 10 : 10)),
          cleanCup: Math.min(sampleCount, 5) === 5 ? 10 : (Math.min(sampleCount, 5) === 4 ? 10 : (Math.min(sampleCount, 5) === 3 ? 10 : 10)),
          sweetness: isRobusta ? "" : (Math.min(sampleCount, 5) === 5 ? 10 : (Math.min(sampleCount, 5) === 4 ? 10 : (Math.min(sampleCount, 5) === 3 ? 10 : 10))),
          uniformityDefects: [],
          cleanCupDefects: [],
          sweetnessDefects: [],
          defects: 0,
          defectCups: [],
          defectIntensity: 2,
          bitter: isRobusta ? "" : null,
          mouthfeel: isRobusta ? "" : null,
          finalScore: ""
        },
        isCompleted: false
      };
    });

    return result;
  });

  const [isAllCompleted, setIsAllCompleted] = useState(false);
  const [sessionFinished, setSessionFinished] = useState(sessionData?.isFinished ?? false);
  const [validationErrors, setValidationErrors] = useState({});
  const [availableScoreCards, setAvailableScoreCards] = useState([]);
  const [cupperName, setCupperName] = useState('');
  const [submitting, setSubmitting] = useState({});

  // State cho Blind Cupping - Khởi tạo mặc định là false, sẽ được cập nhật từ API
  const [isBlindCupping, setIsBlindCupping] = useState(false);

  // State để lưu thông tin session
  const [sessionInfo, setSessionInfo] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [sessionNotStarted, setSessionNotStarted] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [sessionStatusChecked, setSessionStatusChecked] = useState(false);
  const [isOrganizationMember, setIsOrganizationMember] = useState(false);

  // Kiểm tra xem có phải đang ở trong quá trình xử lý auth modal không
  const [authModalProcessed, setAuthModalProcessed] = useState(false);

  // Cập nhật isBlindCupping khi sessionData thay đổi (chỉ cho non-share page)
  useEffect(() => {
    if (!isSharePage && sessionData?.is_blind_cupping !== undefined) {
      const blindStatus = sessionData.is_blind_cupping;
      const isOwner = sessionData.isOwner || false;
      const shouldShowBlind = blindStatus && !isOwner;
      setIsBlindCupping(shouldShowBlind);
    }
  }, [sessionData?.is_blind_cupping, sessionData?.isOwner, isSharePage]);

  // Đảm bảo isBlindCupping không bị reset khi sessionStatusChecked thay đổi
  useEffect(() => {
    if (sessionStatusChecked && sessionInfo?.is_blind_cupping !== undefined) {
      const blindStatus = sessionInfo.is_blind_cupping;
      const isOwner = sessionInfo.isOwner || false;
      const isRevealed = sessionInfo.blind_info_revealed || false;
      const shouldShowBlind = blindStatus && !isOwner && !isRevealed;
      setIsBlindCupping(shouldShowBlind);
    }
  }, [sessionStatusChecked, sessionInfo?.is_blind_cupping, sessionInfo?.isOwner, sessionInfo?.blind_info_revealed]);

  // Thêm useEffect để đảm bảo blind cupping state được duy trì cho share page
  useEffect(() => {
    if (isSharePage && sessionInfo?.is_blind_cupping !== undefined) {
      const blindStatus = sessionInfo.is_blind_cupping;
      const isOwner = sessionInfo.isOwner || false;
      const isRevealed = sessionInfo.blind_info_revealed || false;
      const shouldShowBlind = blindStatus && !isOwner && !isRevealed;
      setIsBlindCupping(shouldShowBlind);
    }
  }, [isSharePage, sessionInfo?.is_blind_cupping, sessionInfo?.isOwner, sessionInfo?.blind_info_revealed, cuppingData.length]);

  // Kiểm tra trạng thái session khi load từ URL
  useEffect(() => {
    const checkSessionStatus = async () => {
      try {
        // Nếu đã có sessionData từ props và không phải share page, vẫn cần kiểm tra ownership
        if (sessionData && sessionData.batches && Array.isArray(sessionData.batches) && !isSharePage) {
          // Vẫn cần gọi API để kiểm tra ownership
          try {
            const infoResponse = await fetch(`${API_BASE_URL}/cupping-sessions/${cleanSessionId}/info`, {
              credentials: 'include'
            });

            if (infoResponse.ok) {
              const infoData = await infoResponse.json();
              if (infoData.success) {
                const blindStatus = infoData.data.is_blind_cupping || false;
                const isOwner = infoData.data.isOwner || false;
                const isRevealed = infoData.data.blind_info_revealed || false;

                // Chỉ áp dụng blind cupping nếu không phải là owner VÀ chưa được tiết lộ
                const shouldShowBlind = blindStatus && !isOwner && !isRevealed;
                setIsBlindCupping(shouldShowBlind);
                setSessionInfo(infoData.data);
              }
            }
          } catch (error) {
           
          }

          setAccessDenied(false);
          setSessionStatusChecked(true);
          return;
        }

        if (!cleanSessionId) {
          setSessionStatusChecked(true);
          return;
        }

        // Lấy thông tin session trước (có thể có auth để kiểm tra ownership)
        const infoResponse = await fetch(`${API_BASE_URL}/cupping-sessions/${cleanSessionId}/info`, {
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

        // Cập nhật trạng thái blind cupping NGAY LẬP TỨC
        const blindStatus = infoData.data.is_blind_cupping || false;
        const isOwner = infoData.data.isOwner || false;
        const isRevealed = infoData.data.blind_info_revealed || false;

        // Chỉ áp dụng blind cupping nếu không phải là owner VÀ chưa được tiết lộ
        const shouldShowBlind = blindStatus && !isOwner && !isRevealed;
        setIsBlindCupping(shouldShowBlind);

        // Kiểm tra trạng thái session - LUÔN kiểm tra
        if (!infoData.data.is_started) {
          setSessionNotStarted(true);
          setAccessDenied(false);
          setSessionStatusChecked(true);
          return;
        }

        // Session đang chạy bình thường - kiểm tra quyền truy cập
        const authStatus = await isAuthenticated();

        // Kiểm tra xem user có thuộc tổ chức không
        let isOrganizationMember = false;
        if (authStatus) {
          try {
            const userResponse = await fetch(`${API_BASE_URL}/users/me`, {
              credentials: 'include'
            });
            if (userResponse.ok) {
              const userData = await userResponse.json();
              // Kiểm tra xem user có trong tổ chức không (có role khác null/undefined)
              isOrganizationMember = userData.role && userData.role !== 'guest';
              setIsOrganizationMember(isOrganizationMember);
            }
          } catch (error) {
           
          }
        }

        // Chặn chấm điểm nếu session đã kết thúc (bất kể có đăng nhập hay không)
        if (infoData.data.is_finished) {
          setSessionEnded(true);
          setAccessDenied(false);
          setSessionStatusChecked(true);
          return;
        }

        // Đối với share page
        if (isSharePage) {
          // Nếu đã đăng nhập, xử lý như user bình thường
          if (authStatus) {
            // Tiếp tục xử lý như user bình thường bên dưới
          } else {
            // Thực sự là guest (chưa đăng nhập)

            if (infoData.data.type_of_session === 'open') {
              setAccessDenied(false);

              // Load batches for guest
              try {
                const batchResponse = await fetch(`${API_BASE_URL}/cupping-sessions/${cleanSessionId}/batches/guest`, {
                  credentials: 'include'
                });
                if (batchResponse.ok) {
                  const batchData = await batchResponse.json();

                  if (batchData.success && batchData.data && Array.isArray(batchData.data)) {
                    // Cập nhật blind cupping cho guest - đảm bảo state được set đúng
                    const blindCuppingStatus = infoData.data.is_blind_cupping || false;
                    const isOwner = infoData.data.isOwner || false;
                    const isRevealed = infoData.data.blind_info_revealed || false;

                    // Chỉ áp dụng blind cupping nếu không phải là owner VÀ chưa được tiết lộ
                    const shouldShowBlind = blindCuppingStatus && !isOwner && !isRevealed;
                    setIsBlindCupping(shouldShowBlind);

                    const guestCuppingData = batchData.data.map(batch => {
                      const sampleCount = batch.number_of_sample_cup || 5;
                      const varietyType = batch.variety_type || 'Arabica';
                      const isRobusta = varietyType.toLowerCase().includes('robusta');

                      return {
                        batchId: batch.batch_id,
                        batchName: batch.greenbean_name || `Batch ${batch.batch_id}`,
                        varietyType: varietyType,
                        isRobusta: isRobusta,
                        cupper: '',
                        isLead: true,
                        notes: '',
                        flavorNotes: '',
                        sampleCount: sampleCount,
                        scores: {
                          fragrance: "",
                          flavor: "",
                          aftertaste: "",
                          acidity: "",
                          body: "",
                          balance: "",
                          flavorNote: "",
                          overall: "",
                          uniformity: Math.min(sampleCount, 5) === 5 ? 10 : 10,
                          cleanCup: Math.min(sampleCount, 5) === 5 ? 10 : 10,
                          sweetness: isRobusta ? "" : 10,
                          uniformityDefects: [],
                          cleanCupDefects: [],
                          sweetnessDefects: [],
                          defects: 0,
                          defectCups: [],
                          defectIntensity: 2,
                          bitter: isRobusta ? "" : null,
                          mouthfeel: isRobusta ? "" : null,
                          finalScore: ""
                        },
                        isCompleted: false
                      };
                    });
                    setCuppingData(guestCuppingData);

                    // Đảm bảo blind cupping state được set lại sau khi set cupping data
                    setTimeout(() => {
                      setIsBlindCupping(shouldShowBlind);
                    }, 100);
                  }
                }
              } catch (error) {
               
              }
            } else {
              setAccessDenied(true);
            }
            return;
          }
        }

        if (!authStatus) {
          return;
        }

        // Kiểm tra quyền truy cập cho authenticated users
        const response = await fetch(`${API_BASE_URL}/cupping-sessions/${cleanSessionId}`, {
          credentials: 'include'
        });

        if (response.ok) {
          const sessionDetail = await response.json();
          if (sessionDetail.success) {
            setAccessDenied(false);
          } else {
            setAccessDenied(true);
          }
        } else if (response.status === 403) {
          const errorData = await response.json().catch(() => ({}));
          setAccessDenied(true);
        } else if (response.status === 401) {
          setAccessDenied(false);
        } else {
          setAccessDenied(false);
        }

      } catch (error) {
        setAccessDenied(false);
      } finally {
        setSessionStatusChecked(true);
      }
    };

    checkSessionStatus();
  }, [cleanSessionId, sessionData?.isFinished, sessionData?.batches, isSharePage]);

  // Theo dõi khi người dùng đã hoàn thành auth modal cho share page
  useEffect(() => {
    if (isSharePage && sessionStatusChecked) {
      // Đối với share page, sau khi đã check session status thì set authModalProcessed
      setAuthModalProcessed(true);
    }
  }, [isSharePage, sessionStatusChecked]);

  // Load available scoreCards for session
  useEffect(() => {
    const loadAvailableScoreCards = async () => {
      if (cleanSessionId) {
        try {
          const apiUrl = `${API_BASE_URL}/cupping/session/${cleanSessionId}`;

          // Gọi API lấy tất cả scoreCard trong session
          const response = await fetch(apiUrl, {
            credentials: 'include'
          });
          const data = await response.json();

          if (data.success && data.data) {
            const scoreCards = data.data.map(item => ({
              uuid: item.uuid,
              cupper: item.cupper || 'Chưa có tên',
              batch_id: item.batch_id
            }));
            setAvailableScoreCards(scoreCards);

            // Lấy thông tin user hiện tại để lọc scoreCards
            let currentUserId = null;
            const authStatus = await isAuthenticated();
            if (authStatus) {
              try {
                const userResponse = await fetch(`${API_BASE_URL}/users/me`, {
                  credentials: 'include'
                });
                if (userResponse.ok) {
                  const userData = await userResponse.json();
                  currentUserId = userData.uuid;
                }
              } catch (e) {
             
              }
            }

            // Tự động gán Score Card ID cho các batch chưa có (chỉ lấy của user hiện tại)
            setCuppingData(prev => prev.map(batch => {
              if (!batch.scoreCardId) {
                const matchingCard = scoreCards.find(card =>
                  card.batch_id === batch.batchId &&
                  (card.user_id === currentUserId || (!card.user_id && !currentUserId))
                );
                if (matchingCard) {
                  return { ...batch, scoreCardId: matchingCard.uuid };
                }
              }
              return batch;
            }));
          }
        } catch (error) {
        
        }
      }
    };

    loadAvailableScoreCards();
  }, [cleanSessionId]);

  // Load cupper name from API
  useEffect(() => {
    const loadCupperName = async () => {
      try {
        const authStatus = await isAuthenticated();

        if (!authStatus) {
          return;
        }

        // Gọi API để lấy thông tin user hiện tại
        const apiUrl = `${API_BASE_URL}/users/me`;

        const response = await fetch(apiUrl, {
          credentials: 'include'
        });
        const user = await response.json();
        
        if (user && user.uuid) {
          const name = (user.user_firstname && user.user_lastname)
            ? `${user.user_lastname} ${user.user_firstname}`
            : user.user_name;
          setCupperName(name);
        } else {
          
        }
      } catch (error) {
       
      }
    };

    loadCupperName();
  }, []);

  // Load existing cupping data when component mounts
  useEffect(() => {
    const loadExistingCuppingData = async () => {
      if (sessionData?.batches && Array.isArray(sessionData.batches)) {
        const newBatchData = [];

        for (const batch of sessionData.batches) {
          const sampleCount = batch.number_of_sample_cup || 5;
          const varietyType = batch.variety_type || 'Arabica';
          const isRobusta = varietyType.toLowerCase().includes('robusta');

          // Create default batch data
          const defaultBatchData = {
            batchId: batch.batch_id,
            batchName: batch.greenbean_name || `Batch ${batch.batch_id}`,
            varietyType: varietyType,
            isRobusta: isRobusta,
            cupper: cupperName,
            isLead: true,
            notes: '',
            flavorNotes: '',
            sampleCount: sampleCount,
            scores: {
              fragrance: "",
              flavor: "",
              aftertaste: "",
              acidity: "",
              body: "",
              balance: "",
              flavorNote: "",
              overall: "",
              uniformity: Math.min(sampleCount, 5) === 5 ? 10 : (Math.min(sampleCount, 5) === 4 ? 10 : (Math.min(sampleCount, 5) === 3 ? 10 : 10)),
              cleanCup: Math.min(sampleCount, 5) === 5 ? 10 : (Math.min(sampleCount, 5) === 4 ? 10 : (Math.min(sampleCount, 5) === 3 ? 10 : 10)),
              sweetness: isRobusta ? "" : (Math.min(sampleCount, 5) === 5 ? 10 : (Math.min(sampleCount, 5) === 4 ? 10 : (Math.min(sampleCount, 5) === 3 ? 10 : 10))),
              uniformityDefects: [],
              cleanCupDefects: [],
              sweetnessDefects: [],
              defects: 0,
              defectCups: [],
              defectIntensity: 2,
              bitter: isRobusta ? "" : null,
              mouthfeel: isRobusta ? "" : null,
              finalScore: ""
            },
            isCompleted: false
          };

          // Try to load existing data from API for current session and current user only
          try {
            const apiUrl = `${API_BASE_URL}/cupping/session/${cleanSessionId}/batch/${batch.batch_id}`;

            const response = await fetch(apiUrl, {
              credentials: 'include'
            });

            let existingData = null;
            if (response.ok) {
              existingData = await response.json();
            }

            if (existingData.success && existingData.data && existingData.data.length > 0) {
              // Lấy thông tin user hiện tại để so sánh
              let currentUserId = null;
              const authStatus = await isAuthenticated();
              if (authStatus) {
                try {
                  const userResponse = await fetch(`${API_BASE_URL}/users/me`, {
                    credentials: 'include'
                  });
                  if (userResponse.ok) {
                    const userData = await userResponse.json();
                    currentUserId = userData.uuid;
                  }
                } catch (e) {
                  
                }
              }

              // Tìm phiếu chấm của user hiện tại
              const userCupping = existingData.data.find(cupping =>
                cupping.user_id === currentUserId || (!cupping.user_id && !currentUserId)
              );

              if (userCupping) {
                // Only load data if it belongs to current user
                defaultBatchData.scoreCardId = userCupping.uuid; // Lưu scoreCardId
                defaultBatchData.cupper = userCupping.cupper || cupperName;
                defaultBatchData.isLead = userCupping.is_lead !== undefined ? userCupping.is_lead : true;
                defaultBatchData.notes = userCupping.notes || '';
                defaultBatchData.flavorNotes = userCupping.flavor_notes || '';
                defaultBatchData.scores = {
                  ...defaultBatchData.scores,
                  fragrance: userCupping.fragrance || "",
                  flavor: userCupping.flavor || "",
                  aftertaste: userCupping.aftertaste || "",
                  acidity: userCupping.acidity || "",
                  body: userCupping.body || "",
                  balance: userCupping.balance || "",
                  flavorNote: userCupping.flavor_note || "",
                  overall: userCupping.overall || "",
                  uniformity: userCupping.uniformity || defaultBatchData.scores.uniformity,
                  cleanCup: userCupping.clean_cup || defaultBatchData.scores.cleanCup,
                  sweetness: userCupping.sweetness || defaultBatchData.scores.sweetness,
                  bitter: userCupping.bitter || defaultBatchData.scores.bitter,
                  mouthfeel: userCupping.mouthfeel || defaultBatchData.scores.mouthfeel,
                  finalScore: userCupping.final_score || ""
                };
                // Nếu có final_score thì phiếu đã hoàn thành
                defaultBatchData.isCompleted = !!userCupping.final_score;
              }
            }
          } catch (error) {
            // Ignore error - just use default empty data for new session
          }

          newBatchData.push(defaultBatchData);
        }

        setCuppingData(newBatchData);
      }
    };

    if (cupperName) {
      loadExistingCuppingData();
    }
  }, [sessionData?.batches, cupperName]);

  const handleScoreChange = (batchIndex, category, value) => {
    // Thay thế dấu phẩy thành dấu chấm cho các thiết bị mobile
    let numericValue = value.replace(/,/g, '.');

    // Chỉ cho phép nhập số, dấu chấm và dấu trừ
    numericValue = numericValue.replace(/[^0-9.-]/g, '');

    // Giới hạn chỉ 2 chữ số thập phân
    if (numericValue.includes('.')) {
      const parts = numericValue.split('.');
      if (parts[1] && parts[1].length > 2) {
        numericValue = parts[0] + '.' + parts[1].substring(0, 2);
      }
    }

    let processedValue = numericValue;

    // Kiểm tra giá trị hợp lệ nếu có giá trị
    if (numericValue !== '' && !isNaN(parseFloat(numericValue))) {
      const numValue = parseFloat(numericValue);
      if (numValue < 6) processedValue = '6';
      else if (numValue > 10) processedValue = '10';
      else processedValue = numericValue;
    } else {
      processedValue = numericValue;
    }

    setCuppingData(prev => {
      const updated = prev.map((batch, index) => {
        if (index === batchIndex) {
          const updatedBatch = {
            ...batch,
            scores: {
              ...batch.scores,
              [category]: processedValue
            }
          };
          // Tự động tính Total Score và Final Score
          const totalScore = calculateTotalScore(updatedBatch.scores);
          const defectScore = ((updatedBatch.scores.cleanCupDefects || []).length * (updatedBatch.scores.defectIntensity || 2) || 0);
          const finalScore = totalScore - defectScore;
          updatedBatch.scores.totalScore = isNaN(totalScore) ? '' : parseFloat(totalScore.toFixed(2));
          updatedBatch.scores.finalScore = isNaN(finalScore) ? '' : parseFloat(finalScore.toFixed(2));
          return updatedBatch;
        }
        return batch;
      });

      // Auto-save disabled - only save on confirm
      // const batchData = updated[batchIndex];
      // saveCuppingData(batchData);

      return updated;
    });
  };

  const handleFieldChange = (batchIndex, field, value) => {
    setCuppingData(prev => {
      let updated;
      if (field === 'cupper') {
        // Khi thay đổi cupper, tự động điền cho tất cả phiếu chưa hoàn thành
        updated = prev.map((batch, index) =>
          !batch.isCompleted ? { ...batch, [field]: value } : batch
        );
      } else {
        updated = prev.map((batch, index) =>
          index === batchIndex ? { ...batch, [field]: value } : batch
        );
      }

      return updated;
    });
  };

  // Clear form index - no longer needed
  const clearLocalStorage = () => {
    // No localStorage to clear
  };

  // Navigation functions
  const goToPreviousForm = () => {
    setSelectedFormIndex(prev => {
      const newIndex = prev > 0 ? prev - 1 : cuppingData.length - 1;
      return newIndex;
    });
  };

  const goToNextForm = () => {
    setSelectedFormIndex(prev => {
      const newIndex = prev < cuppingData.length - 1 ? prev + 1 : 0;
      return newIndex;
    });
  };

  const isLastForm = selectedFormIndex === cuppingData.length - 1;
  const isFirstForm = selectedFormIndex === 0;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Only handle if not typing in an input/textarea
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        goToPreviousForm();
      } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        goToNextForm();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [cuppingData.length]);

  const saveCuppingData = async (batchData) => {
    try {
      const cuppingPayload = {
        session_id: cleanSessionId || sessionData.sessionId,
        batch_id: batchData.batchId,
        cupper: batchData.cupper || '',
        is_lead: batchData.isLead,
        fragrance: batchData.scores.fragrance,
        flavor: batchData.scores.flavor,
        aftertaste: batchData.scores.aftertaste,
        acidity: batchData.scores.acidity,
        body: batchData.scores.body,
        balance: batchData.scores.balance,
        flavor_note: batchData.scores.flavorNote,
        overall: batchData.scores.overall,
        uniformity: batchData.scores.uniformity,
        clean_cup: batchData.scores.cleanCup,
        sweetness: batchData.scores.sweetness,
        bitter: batchData.scores.bitter,
        mouthfeel: batchData.scores.mouthfeel,
        defects: batchData.scores.defects || 0,
        final_score: batchData.scores.finalScore,
        notes: batchData.notes || '',
        flavor_notes: batchData.flavorNotes || ''
      };

      await cuppingApi.createOrUpdate(cuppingPayload);
      
    } catch (error) {
      
    }
  };

  const calculateTotalScore = (scores) => {
    const parseScore = (value) => {
      if (value === '' || value === null || value === undefined) return 0;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    };

    const basicScores = parseScore(scores.fragrance) + parseScore(scores.flavor) + parseScore(scores.aftertaste) +
      parseScore(scores.acidity) + parseScore(scores.body) + parseScore(scores.balance);
    const qualityScores = parseScore(scores.uniformity) + parseScore(scores.cleanCup) + parseScore(scores.sweetness);
    const total = basicScores + qualityScores + parseScore(scores.overall);
    return parseFloat(total.toFixed(2));
  };

  const handleScoreChangeWithValidation = (batchIndex, category, value) => {
    handleScoreChange(batchIndex, category, value);
    handleFocusClearError(batchIndex);
  };

  const handleFocusClearError = (batchIndex) => {
    // Clear all validation errors for this batch
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      // Remove all errors for this batch
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith(`${batchIndex}_`)) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
  };

  const validateBatchData = (batch, batchIndex) => {
    const requiredFields = ['cupper', 'fragrance', 'flavor', 'aftertaste', 'acidity', 'body', 'balance', 'overall'];
    const missingFields = [];
    const errorFields = {};

    // Kiểm tra cupper
    if (!batch.cupper || batch.cupper.trim() === '') {
      missingFields.push('Tên người thử nếm');
      errorFields[`${batchIndex}_cupper`] = true;
    }

    // Kiểm tra các điểm số cơ bản
    requiredFields.slice(1).forEach(field => {
      if (!batch.scores[field] || batch.scores[field] === '' || isNaN(parseFloat(batch.scores[field]))) {
        const fieldNames = {
          fragrance: 'Fragrance/Aroma',
          flavor: 'Flavor',
          aftertaste: 'Aftertaste',
          acidity: 'Acidity',
          body: 'Body',
          balance: 'Balance',
          overall: 'Overall'
        };
        missingFields.push(fieldNames[field]);
        errorFields[`${batchIndex}_${field}`] = true;
      }
    });

    // Kiểm tra điểm số đặc biệt cho Robusta
    if (batch.isRobusta) {
      if (!batch.scores.sweetness || batch.scores.sweetness === '' || isNaN(parseFloat(batch.scores.sweetness))) {
        missingFields.push('Sweetness');
        errorFields[`${batchIndex}_sweetness`] = true;
      }
      if (!batch.scores.bitter || batch.scores.bitter === '' || isNaN(parseFloat(batch.scores.bitter))) {
        missingFields.push('Bitter');
        errorFields[`${batchIndex}_bitter`] = true;
      }
      if (!batch.scores.mouthfeel || batch.scores.mouthfeel === '' || isNaN(parseFloat(batch.scores.mouthfeel))) {
        missingFields.push('Mouthfeel');
        errorFields[`${batchIndex}_mouthfeel`] = true;
      }
    }

    return { missingFields, errorFields };
  };

  // Hàm xử lý submit cho từng batch
  const handleSubmitBatch = async (batch, batchIndex) => {
    if (isAllCompleted || (sessionFinished && !isOrganizationMember) || submitting[batchIndex] || batch.isCompleted) return;

    setSubmitting(prev => ({ ...prev, [batchIndex]: true }));

    // Validate required fields
    const { missingFields, errorFields } = validateBatchData(batch, batchIndex);
    if (missingFields.length > 0) {
      setValidationErrors(errorFields);
      setSubmitting(prev => ({ ...prev, [batchIndex]: false }));
      return;
    }

    // Clear validation errors if all fields are valid
    setValidationErrors({});

    // Force update totalScore and finalScore before submit
    const currentTotalScore = calculateTotalScore(batch.scores);
    const currentDefectScore = ((batch.scores.cleanCupDefects || []).length * (batch.scores.defectIntensity || 2) || 0);
    const currentFinalScore = currentTotalScore - currentDefectScore;

    try {
      // Lấy userId từ API
      let userId = null;
      const authStatus = await isAuthenticated();
      if (authStatus) {
        try {
          const userResponse = await fetch(`${API_BASE_URL}/users/me`, {
            credentials: 'include'
          });
          if (userResponse.ok) {
            const userData = await userResponse.json();
            userId = userData.uuid;
          }
        } catch (e) {
        
        }
      } else if (isSharePage) {
        // Đối với guest, sử dụng một ID đặc biệt hoặc null
        userId = null;
      }

      const submitData = {
        batch_id: batch.batchId,
        session_id: cleanSessionId || sessionData.sessionId,
        user_id: userId,
        cupper: batch.cupper,
        is_lead: true,
        notes: batch.notes,
        fragrance: parseFloat(batch.scores.fragrance),
        flavor: parseFloat(batch.scores.flavor),
        aftertaste: parseFloat(batch.scores.aftertaste),
        acidity: parseFloat(batch.scores.acidity),
        body: parseFloat(batch.scores.body),
        sweetness: batch.isRobusta ? parseFloat(batch.scores.sweetness) : parseFloat(batch.scores.sweetness),
        balance: parseFloat(batch.scores.balance),
        uniformity: parseFloat(batch.scores.uniformity),
        clean_cup: parseFloat(batch.scores.cleanCup),
        bitter: batch.isRobusta ? parseFloat(batch.scores.bitter) : null,
        mouthfeel: batch.isRobusta ? parseFloat(batch.scores.mouthfeel) : null,
        defects: (batch.scores.cleanCupDefects || []).length * (batch.scores.defectIntensity || 2),
        overall: parseFloat(batch.scores.overall),
        total_score: parseFloat(currentTotalScore.toFixed(2)),
        final_score: parseFloat(currentFinalScore.toFixed(2)),
        flavor_notes: batch.flavorNotes
      };

      // Kiểm tra xem có phải là share page không
      let result;
      if (isSharePage && !authStatus) {
        // Trường hợp guest thực sự (chưa đăng nhập) - dùng guest API
        // Lưu cupper name vào localStorage để liên kết sau khi đăng ký
        if (batch.cupper) {
          localStorage.setItem('guest_cupper_name', batch.cupper);
        }
        result = await cuppingApi.createGuest(submitData);
      } else {
        // Trường hợp người đăng nhập chấm - kiểm tra xem có phiếu chấm của user này chưa
        let scoreCardId = batch.scoreCardId;

        if (scoreCardId) {
          // Có scoreCardId - cập nhật phiếu hiện tại
          result = await cuppingApi.update(scoreCardId, submitData);
        } else {
          // Chưa có scoreCardId - tạo mới
          result = await cuppingApi.createOrUpdate(submitData);
        }
      }

      // Đánh dấu phiếu đã hoàn thành và hiển thị modal
      setCuppingData(prev => {
        const updated = prev.map((b, i) =>
          i === batchIndex ? { ...b, isCompleted: true } : b
        );
        
        // Check if all batches are completed
        const allCompleted = updated.every(b => b.isCompleted);
        const remainingCount = updated.filter(b => !b.isCompleted).length;

        // Hiển thị modal thành công
        showSuccessModal(allCompleted, remainingCount, batch, authStatus);

        return updated;
      });
    } catch (error) {
      setSubmitting(prev => ({ ...prev, [batchIndex]: false }));

      // Xử lý thông báo lỗi dựa trên response từ server
      let errorMessage = 'Có lỗi xảy ra khi lưu dữ liệu';
      let errorTitle = 'Lỗi!';
      let errorColor = '#dc3545';

      if (error.message) {
        if (error.message.includes('chưa bắt đầu') || error.message.includes('Không thể chấm điểm')) {
          errorTitle = '⚠️ Phiên chưa bắt đầu';
          errorMessage = 'Phiên nếm thử này chưa được bắt đầu. Vui lòng liên hệ quản trị viên để bắt đầu phiên nếm thử.';
          errorColor = '#ff9800';
        } else if (error.message.includes('đã kết thúc')) {
          errorTitle = '⚠️ Phiên đã kết thúc';
          errorMessage = 'Phiên nếm thử này đã kết thúc. Không thể chấm điểm thêm.';
          errorColor = '#9e9e9e';
        } else {
          errorMessage = error.message;
        }
      }

      // Hiển thị modal lỗi
      showErrorModal(errorTitle, errorMessage, errorColor);
    } finally {
      setSubmitting(prev => ({ ...prev, [batchIndex]: false }));
    }
  };

  // Hàm hiển thị modal thành công
  const showSuccessModal = (allCompleted, remainingCount, batch, authStatus) => {
    const modal = document.createElement('div');
    
    if (allCompleted) {
      clearLocalStorage();

      // Nếu là guest và hoàn thành tất cả, hiển thị modal xác nhận tạo tài khoản
      if (isSharePage && !authStatus) {
        // Lưu sessionId vào localStorage để hiển thị sau khi đăng nhập
        localStorage.setItem('guestCompletedSession', cleanSessionId || sessionData.sessionId);

        // Hiển thị modal xác nhận
        const confirmModal = document.createElement('div');
        confirmModal.innerHTML = `
<div class="modal-backdrop" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.3); display: flex; justify-content: center; align-items: center; z-index: 10000;">
  <div style="background: white; padding: 30px; border-radius: 12px; text-align: center; max-width: 450px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
    <h3 style="color: #28a745; margin: 0 0 16px 0; font-size: 24px;">
      ${t('auto.hon_thnh_xut_sc_307')}
    </h3>
    <p style="margin: 0 0 20px 0; line-height: 1.5; color: #333;">
      ${t('auto.bn_va_hon_thnh__308')}
    </p>
    <div style="display: flex; gap: 12px; justify-content: center;">
      <button class="create-account-btn" style="background: #007bff; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: 500;">
        ${t('auto.to_ti_khon_309')}
      </button>
      <button class="skip-btn" style="background: #6c757d; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: 500;">
        ${t('auto.b_qua_310')}
      </button>
    </div>
  </div>
</div>
`;

        // Xử lý sự kiện
        const createBtn = confirmModal.querySelector('.create-account-btn');
        const skipBtn = confirmModal.querySelector('.skip-btn');
        const backdrop = confirmModal.querySelector('.modal-backdrop');

        createBtn.onclick = (e) => {
          e.stopPropagation();
          const registerUrl = `/register?sessionId=${cleanSessionId || sessionData.sessionId}&returnUrl=${encodeURIComponent(window.location.pathname)}`;
          window.location.href = registerUrl;
        };

        skipBtn.onclick = (e) => {
          e.stopPropagation();
          confirmModal.remove();
          // Ở lại trang chấm điểm, không chuyển đi đâu
        };

        // Đóng modal khi click vào backdrop
        backdrop.onclick = (e) => {
          if (e.target === backdrop) {
            confirmModal.remove();
            // Ở lại trang chấm điểm, không chuyển đi đâu
          }
        };

        document.body.appendChild(confirmModal);
        return;
      }

      modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 9999;">
          <div style="background: white; padding: 24px; border-radius: 8px; text-align: center; max-width: 400px;">
            <h3 style="color: #28a745; margin: 0 0 16px 0;">
              ${t('auto.hon_thnh_tt_c_311')}
            </h3>
            <p style="margin: 0 0 20px 0;">
              ${t('auto._hon_thnh_tt_c__312')}
            </p>
            <button class="ok-btn" style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
              OK
            </button>
          </div>
        </div>
      `;
      
      // Xử lý sự kiện cho nút OK
      const okBtn = modal.querySelector('.ok-btn');
      okBtn.onclick = (e) => {
        e.stopPropagation();
        modal.remove();
        // Quay về trang detail session
        const currentPath = window.location.pathname;
        const prefix = currentPath.startsWith('/org/') ? currentPath.match(/^\/org\/[^\/]+/)[0] : '/personal';
        navigate(`${prefix}/sessionlist/${cleanSessionId || sessionData.sessionId}`);
      };

      // Tự động đóng modal sau 3 giây và quay về trang detail
      setTimeout(() => {
        if (modal.parentElement) {
          modal.remove();
          // Quay về trang detail session
          const currentPath = window.location.pathname;
          const prefix = currentPath.startsWith('/org/') ? currentPath.match(/^\/org\/[^\/]+/)[0] : '/personal';
          navigate(`${prefix}/sessionlist/${cleanSessionId || sessionData.sessionId}`);
        }
      }, 3000);
    } else {
      modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 9999;">
          <div style="background: white; padding: 24px; border-radius: 8px; text-align: center; max-width: 400px;">
            <h3 style="color: #28a745; margin: 0 0 16px 0;">
              ${t('cuppingSession.savedSuccess')}
            </h3>
            <p style="margin: 0 0 16px 0;">
              ${t('cuppingSession.savedBatch', { name: batch.batchName })}
            </p>
            <p style="margin: 0 0 20px 0; font-size: 14px; color: #ff9800;">
              ${t('cuppingSession.remainingBatch', { count: remainingCount })}
            </p>
            <div style="display: flex; gap: 12px; justify-content: center;">
              <button class="continue-btn"
                style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                ${t('cuppingSession.continue')}
              </button>
              <button class="back-to-detail-btn"
                style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                ${t('cuppingSession.backToDetail')}
              </button>
            </div>
          </div>
        </div>
      `;
      
      // Xử lý sự kiện cho các nút
      const continueBtn = modal.querySelector('.continue-btn');
      const backToDetailBtn = modal.querySelector('.back-to-detail-btn');

      continueBtn.onclick = (e) => {
        e.stopPropagation();
        modal.remove();
      };

      backToDetailBtn.onclick = (e) => {
        e.stopPropagation();
        modal.remove();
        // Quay về trang detail session
        const currentPath = window.location.pathname;
        const prefix = currentPath.startsWith('/org/') ? currentPath.match(/^\/org\/[^\/]+/)[0] : '/personal';
        navigate(`${prefix}/sessionlist/${cleanSessionId || sessionData.sessionId}`);
      };

      // Tự động đóng modal sau 5 giây nếu không phải hoàn thành tất cả
      setTimeout(() => {
        if (modal.parentElement) {
          modal.remove();
        }
      }, 5000);
    }

    // Chỉ append modal khi không phải là guest đã hoàn thành tất cả (đã xử lý riêng)
    if (!allCompleted || !isSharePage || authStatus) {
      document.body.appendChild(modal);
    }
  };

  // Hàm hiển thị modal lỗi
  const showErrorModal = (title, message, color) => {
    const modal = document.createElement('div');
    modal.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 9999;">
        <div style="background: white; padding: 24px; border-radius: 8px; text-align: center; max-width: 450px;">
          <h3 style="color: ${color}; margin: 0 0 16px 0;">${title}</h3>
          <p style="margin: 0 0 20px 0; line-height: 1.5;">${message}</p>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: ${color}; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  };

  return (
    <div className="cupping-form-container">
      <div className="cupping-form-wrapper">
        {/* {onBack && (
          // <button className="cupping-back-button" onClick={onBack}>
          //   <FaArrowLeft />{t('auto.quay_li_267')}</button>
        )} */}

        {(sessionStatusChecked || authModalProcessed) && sessionNotStarted ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', textAlign: 'center' }}>
            <div>
              <h2 style={{ margin: '0 0 16px 0', color: '#ff9800', fontSize: '28px', fontWeight: '600' }}>{t('auto.phin_cha_bt_u_268')}</h2>
              <p style={{ color: '#666', margin: '0 0 16px 0' }}>{t('auto.phin_th_nm_ny_c_269')}</p>
              <p style={{ color: '#666', margin: '0', fontSize: '14px' }}>{t('auto.vui_lng_lin_h_q_270')}</p>
            </div>
          </div>
        ) : null}

        {(sessionStatusChecked || authModalProcessed) && sessionEnded ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', textAlign: 'center' }}>
            <div>
              <h2 style={{ margin: '0 0 16px 0', color: '#9e9e9e', fontSize: '28px', fontWeight: '600' }}>{t('auto.phin_kt_thc_271')}</h2>
              <p style={{ color: '#666', margin: '0 0 16px 0' }}>{t('auto.phin_th_nm_ny_k_272')}</p>
              <p style={{ color: '#666', margin: '0', fontSize: '14px' }}>{t('auto.khng_th_chm_im__273')}</p>
            </div>
          </div>
        ) : null}

        {(sessionStatusChecked || authModalProcessed) && accessDenied ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', textAlign: 'center' }}>
            <div>
              <h2 style={{ margin: '0 0 16px 0', color: '#dc3545', fontSize: '28px', fontWeight: '600' }}>{t('auto.khng_c_quyn_tru_274')}</h2>
              {/* <p style={{ color: '#666', fontSize: '14px' }}>Debug: accessDenied = {accessDenied.toString()}</p> */}
            </div>
          </div>
        ) : null}

        {(sessionStatusChecked || authModalProcessed) && !accessDenied && !sessionNotStarted && !sessionEnded && cuppingData.length > 0 ? (
          <>
            <div className="cupping-forms-header">
              <h2>{t('auto.phiu_nh_gi_276')}</h2>
              <p>{t('auto.vui_lng_in_thng_277')}</p>
              {sessionInfo?.type_of_session === 'open' ? (
                <div style={{ background: '#e8f5e8', border: '1px solid #4caf50', borderRadius: '6px', padding: '12px', margin: '16px 0', color: '#2e7d32' }}>{t('auto._phin_th_nm_m_c_278')}</div>
              ) : null}
              {sessionInfo?.type_of_session === 'close' ? (
                <div style={{ background: '#fff3e0', border: '1px solid #ff9800', borderRadius: '6px', padding: '12px', margin: '16px 0', color: '#ef6c00' }}>{t('auto._phin_th_nm_rin_279')}</div>
              ) : null}

              {sessionInfo?.is_blind_cupping ? (
                <div style={{ background: '#f3e5f5', border: '1px solid #9c27b0', borderRadius: '6px', padding: '12px', margin: '16px 0', color: '#7b1fa2' }}>
                  {sessionInfo?.isOwner ? (
                    <>👁️ Chế độ Blind Cupping - Bạn là người tạo session nên vẫn thấy được thông tin</>
                  ) : (
                    <>🔒 Chế độ Blind Cupping - {sessionInfo?.blind_info_revealed ? 'Thông tin đã được tiết lộ' : 'Thông tin đã được ẩn'}</>
                  )}
                </div>
              ) : null}
            </div>

            {/* Navigation Controls */}
            <div className="form-navigation">
              <button
                className="nav-button"
                onClick={goToPreviousForm}
                disabled={cuppingData.length <= 1}
              >
                <span>←</span>
                <span>{t('auto.trc_281')}</span>
              </button>

              <div className="nav-info">
                <div className="form-count">
                  {selectedFormIndex + 1} / {cuppingData.length}
                </div>
                {isLastForm && cuppingData.length > 1 ? (
                  <div className="next-form-hint">{t('auto.bm_tip_s_quay_v_283')}</div>
                ) : null}
              </div>

              <button
                className="nav-button"
                onClick={goToNextForm}
                disabled={cuppingData.length <= 1}
              >
                <span>{t('auto.tip_284')}</span>
                <span>→</span>
              </button>
            </div>

            {/* Mobile Form Selector */}
            <div className="mobile-form-selector">
              {cuppingData.map((batch, index) => (
                <button
                  key={`${batch.batchId}-${index}`}
                  className={`form-number-button ${index === selectedFormIndex ? 'active' : ''}`}
                  onClick={() => setSelectedFormIndex(index)}
                  title={isBlindCupping ? `Mẫu ${index + 1}` : batch.batchName}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <div className="cupping-forms-grid" data-count={cuppingData.length}>
              {cuppingData.map((batch, batchIndex) => (
                <div
                  key={`${batch.batchId}-${batchIndex}`}
                  className={`cupping-form-card ${batchIndex === selectedFormIndex ? 'active' : ''} ${isSharePage ? 'share-page' : ''} ${isBlindCupping ? 'blind-mode' : ''}`}
                >
                  <div className="cupping-form-header">
                    <div className="batch-info">
                      <h3>
                        {isBlindCupping
                          ? t('greenBatch.sample_index', { index: batchIndex + 1 })
                          : `${t('greenBatch.nhn_xanh_492')} ${batch.batchName}`
                        }
                      </h3>
                      {!isBlindCupping ? (
                        <>
                          {/* <span className="batch-id">Batch ID: {batch.batchId}</span> */}
                          <span className="variety-info">
                            {t('greenBatch.variety')}: {batch.varietyType}
                          </span>
                        </>
                      ) : null}
                      {isBlindCupping ? (
                        <div className="blind-cupping-notice">
                          <span className="blind-tag">
                            🔒 {t('common.blind_mode_notice')}
                          </span>
                        </div>
                      ) : null}
                    </div>
                    <div className="cupper-section">
                      <label>{t('auto.name_of_cupper_285')}</label>
                      <input
                        type="text"
                        value={batch.cupper}
                        onChange={(e) => {
                          handleFieldChange(batchIndex, 'cupper', e.target.value);
                          handleFocusClearError(batchIndex);
                        }}
                        onFocus={() => handleFocusClearError(batchIndex)}
                        className={`cupper-name-input ${validationErrors[`${batchIndex}_cupper`] ? 'required-error' : ''}`}
                        placeholder={t('auto.nhp_tn_ngi_th_n_323')}
                        disabled={isAllCompleted || sessionFinished || batch.isCompleted}
                      />
                      {validationErrors[`${batchIndex}_cupper`] && (
                        <span className="error-message">{t('auto.bt_buc_nhp_thng_286')}</span>
                      )}
                      <input type="hidden" value={cleanSessionId || sessionData.sessionId} />
                      <input type="hidden" value={batch.batchId} />
                    </div>

                    <div className="notes-section">
                      <label>Notes</label>
                      <textarea
                        value={batch.notes}
                        onChange={(e) => handleFieldChange(batchIndex, 'notes', e.target.value)}
                        className="notes-input"
                        placeholder={t('auto.nhp_ghi_ch_324')}
                        disabled={isAllCompleted || sessionFinished || batch.isCompleted}
                        rows="3"
                      />
                    </div>
                  </div>

                  <div className="scoring-section">
                    <div className="score-row">
                      <div className="score-item1">
                        <label>{t('auto.fragrancearoma_287')}</label>
                        <ScoreInput
                          value={batch.scores.fragrance}
                          onChange={(e) => handleScoreChangeWithValidation(batchIndex, 'fragrance', e.target.value)}
                          onFocus={() => handleFocusClearError(batchIndex)}
                          onKeyPress={(e) => {
                            if (!/[0-9.,-]/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          className={validationErrors[`${batchIndex}_fragrance`] ? 'required-error' : ''}
                          placeholder={t('auto.600_100_325')}
                          disabled={isAllCompleted || sessionFinished || batch.isCompleted}
                          id={`fragrance-${batchIndex}`}
                        />
                        {validationErrors[`${batchIndex}_fragrance`] && (
                          <span className="error-message">{t('auto.bt_buc_nhp_thng_288')}</span>
                        )}
                      </div>
                      <div className="score-item1">
                        <label>Flavor</label>
                        <ScoreInput
                          value={batch.scores.flavor}
                          onChange={(e) => handleScoreChangeWithValidation(batchIndex, 'flavor', e.target.value)}
                          onFocus={() => handleFocusClearError(batchIndex)}
                          onKeyPress={(e) => {
                            if (!/[0-9.,-]/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          className={validationErrors[`${batchIndex}_flavor`] ? 'required-error' : ''}
                          placeholder={t('auto.600_100_326')}
                          disabled={isAllCompleted || sessionFinished || batch.isCompleted}
                          id={`flavor-${batchIndex}`}
                        />
                        {validationErrors[`${batchIndex}_flavor`] && (
                          <span className="error-message">{t('auto.bt_buc_nhp_thng_289')}</span>
                        )}
                      </div>
                    </div>

                    <div className="score-row">
                      <div className="score-item1">
                        <label>Aftertaste</label>
                        <ScoreInput
                          value={batch.scores.aftertaste}
                          onChange={(e) => handleScoreChangeWithValidation(batchIndex, 'aftertaste', e.target.value)}
                          onFocus={() => handleFocusClearError(batchIndex)}
                          onKeyPress={(e) => {
                            if (!/[0-9.,-]/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          className={validationErrors[`${batchIndex}_aftertaste`] ? 'required-error' : ''}
                          placeholder={t('auto.600_100_327')}
                          disabled={isAllCompleted || (sessionFinished && !isOrganizationMember) || batch.isCompleted}
                          id={`aftertaste-${batchIndex}`}
                        />
                        {validationErrors[`${batchIndex}_aftertaste`] && (
                          <span className="error-message">{t('auto.bt_buc_nhp_thng_290')}</span>
                        )}
                      </div>
                      <div className="score-item1">
                        <label>Acidity</label>
                        <ScoreInput
                          value={batch.scores.acidity}
                          onChange={(e) => handleScoreChangeWithValidation(batchIndex, 'acidity', e.target.value)}
                          onFocus={() => handleFocusClearError(batchIndex)}
                          onKeyPress={(e) => {
                            if (!/[0-9.,-]/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          className={validationErrors[`${batchIndex}_acidity`] ? 'required-error' : ''}
                          placeholder={t('auto.600_100_328')}
                          disabled={isAllCompleted || (sessionFinished && !isOrganizationMember) || batch.isCompleted}
                          id={`acidity-${batchIndex}`}
                        />
                        {validationErrors[`${batchIndex}_acidity`] && (
                          <span className="error-message">{t('auto.bt_buc_nhp_thng_291')}</span>
                        )}
                      </div>
                    </div>

                    <div className="score-row">
                      <div className="score-item1">
                        <label>Body</label>
                        <ScoreInput
                          value={batch.scores.body}
                          onChange={(e) => handleScoreChangeWithValidation(batchIndex, 'body', e.target.value)}
                          onFocus={() => handleFocusClearError(batchIndex)}
                          onKeyPress={(e) => {
                            if (!/[0-9.,-]/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          className={validationErrors[`${batchIndex}_body`] ? 'required-error' : ''}
                          placeholder={t('auto.600_100_329')}
                          disabled={isAllCompleted || (sessionFinished && !isOrganizationMember) || batch.isCompleted}
                          id={`body-${batchIndex}`}
                        />
                        {validationErrors[`${batchIndex}_body`] && (
                          <span className="error-message">{t('auto.bt_buc_nhp_thng_292')}</span>
                        )}
                      </div>
                      <div className="score-item1">
                        <label>Balance</label>
                        <ScoreInput
                          value={batch.scores.balance}
                          onChange={(e) => handleScoreChangeWithValidation(batchIndex, 'balance', e.target.value)}
                          onFocus={() => handleFocusClearError(batchIndex)}
                          onKeyPress={(e) => {
                            if (!/[0-9.,-]/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          className={validationErrors[`${batchIndex}_balance`] ? 'required-error' : ''}
                          placeholder={t('auto.600_100_330')}
                          disabled={isAllCompleted || (sessionFinished && !isOrganizationMember) || batch.isCompleted}
                          id={`balance-${batchIndex}`}
                        />
                        {validationErrors[`${batchIndex}_balance`] && (
                          <span className="error-message">{t('auto.bt_buc_nhp_thng_293')}</span>
                        )}
                      </div>
                    </div>

                    {batch.isRobusta && (
                      <>
                        <div className="score-row">
                          <div className="score-item1">
                            <label>Sweetness</label>
                            <ScoreInput
                              value={batch.scores.sweetness}
                              onChange={(e) => handleScoreChangeWithValidation(batchIndex, 'sweetness', e.target.value)}
                              onFocus={() => handleFocusClearError(batchIndex)}
                              onKeyPress={(e) => {
                                if (!/[0-9.,-]/.test(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              className={validationErrors[`${batchIndex}_sweetness`] ? 'required-error' : ''}
                              placeholder={t('auto.600_100_331')}
                              disabled={isAllCompleted || (sessionFinished && !isOrganizationMember) || batch.isCompleted}
                              id={`sweetness-${batchIndex}`}
                            />
                            {validationErrors[`${batchIndex}_sweetness`] && (
                              <span className="error-message">{t('auto.bt_buc_nhp_thng_294')}</span>
                            )}
                          </div>
                          <div className="score-item1">
                            <label>Bitter</label>
                            <ScoreInput
                              value={batch.scores.bitter}
                              onChange={(e) => handleScoreChangeWithValidation(batchIndex, 'bitter', e.target.value)}
                              onFocus={() => handleFocusClearError(batchIndex)}
                              onKeyPress={(e) => {
                                if (!/[0-9.,-]/.test(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              className={validationErrors[`${batchIndex}_bitter`] ? 'required-error' : ''}
                              placeholder={t('auto.600_100_332')}
                              disabled={isAllCompleted || (sessionFinished && !isOrganizationMember) || batch.isCompleted}
                              id={`bitter-${batchIndex}`}
                            />
                            {validationErrors[`${batchIndex}_bitter`] && (
                              <span className="error-message">{t('auto.bt_buc_nhp_thng_295')}</span>
                            )}
                          </div>
                        </div>
                        <div className="score-row">
                          <div className="score-item1">
                            <label>Mouthfeel</label>
                            <ScoreInput
                              value={batch.scores.mouthfeel}
                              onChange={(e) => handleScoreChangeWithValidation(batchIndex, 'mouthfeel', e.target.value)}
                              onFocus={() => handleFocusClearError(batchIndex)}
                              onKeyPress={(e) => {
                                if (!/[0-9.,-]/.test(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              className={validationErrors[`${batchIndex}_mouthfeel`] ? 'required-error' : ''}
                              placeholder={t('auto.600_100_333')}
                              disabled={isAllCompleted || (sessionFinished && !isOrganizationMember) || batch.isCompleted}
                              id={`mouthfeel-${batchIndex}`}
                            />
                            {validationErrors[`${batchIndex}_mouthfeel`] && (
                              <span className="error-message">{t('auto.bt_buc_nhp_thng_296')}</span>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    <div className="score-row">
                      <div className="score-item1">
                        <label>{t('auto.flavor_notes_297')}</label>
                        <textarea
                          value={batch.flavorNotes}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[0-9]/g, '');
                            handleFieldChange(batchIndex, 'flavorNotes', value);
                          }}
                          placeholder={t('auto.ghi_ch_hng_v_334')}
                          disabled={isAllCompleted || (sessionFinished && !isOrganizationMember) || batch.isCompleted}
                          className="flavor-notes-textarea"
                          rows="3"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="quality-section">
                    <h4>{t('auto.quality_assesme_298')}</h4>

                    <div className="quality-row">
                      <div className="quality-item">
                        <label>Uniformity</label>
                        <div className="rating-buttons">
                          {Array.from({ length: Math.min(batch.sampleCount, 5) }, (_, i) => i + 1).map(num => {
                            const defectCups = batch.scores.uniformityDefects || [];
                            const isDefect = defectCups.includes(num);
                            return (
                              <button
                                key={num}
                                type="button"
                                className={isDefect ? 'defect' : 'good transparent-number'}
                                onClick={() => {
                                  const currentDefects = batch.scores.uniformityDefects || [];
                                  let newDefects;
                                  if (isDefect) {
                                    newDefects = currentDefects.filter(cup => cup !== num);
                                  } else {
                                    newDefects = [...currentDefects, num];
                                  }
                                  const maxCups = Math.min(batch.sampleCount, 5);
                                  const goodCups = maxCups - newDefects.length;
                                  const scorePerCup = maxCups === 5 ? 2 : (maxCups === 4 ? 2.5 : (maxCups === 3 ? 3.333 : 10));
                                  const uniformityScore = goodCups * scorePerCup;

                                  setCuppingData(prev => prev.map((b, i) => {
                                    if (i === batchIndex) {
                                      const updatedScores = {
                                        ...b.scores,
                                        uniformity: parseFloat(uniformityScore.toFixed(3)),
                                        uniformityDefects: newDefects
                                      };
                                      const totalScore = calculateTotalScore(updatedScores);
                                      const defectScore = ((updatedScores.cleanCupDefects || []).length * (updatedScores.defectIntensity || 2) || 0);
                                      const finalScore = totalScore - defectScore;
                                      return {
                                        ...b,
                                        scores: {
                                          ...updatedScores,
                                          totalScore: parseFloat(totalScore.toFixed(2)),
                                          finalScore: parseFloat(finalScore.toFixed(2))
                                        }
                                      };
                                    }
                                    return b;
                                  }));
                                }}
                                disabled={isAllCompleted || (sessionFinished && !isOrganizationMember) || batch.isCompleted}
                              >
                                {num}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="quality-row">
                      <div className="quality-item">
                        <label>{t('auto.clean_cup_299')}</label>
                        <div className="rating-buttons">
                          {Array.from({ length: Math.min(batch.sampleCount, 5) }, (_, i) => i + 1).map(num => {
                            const defectCups = batch.scores.cleanCupDefects || [];
                            const isDefect = defectCups.includes(num);
                            return (
                              <button
                                key={num}
                                type="button"
                                className={isDefect ? 'defect' : 'good transparent-number'}
                                onClick={() => {
                                  const currentDefects = batch.scores.cleanCupDefects || [];
                                  let newDefects;
                                  if (isDefect) {
                                    newDefects = currentDefects.filter(cup => cup !== num);
                                  } else {
                                    newDefects = [...currentDefects, num];
                                  }
                                  const maxCups = Math.min(batch.sampleCount, 5);
                                  const goodCups = maxCups - newDefects.length;
                                  const scorePerCup = maxCups === 5 ? 2 : (maxCups === 4 ? 2.5 : (maxCups === 3 ? 3.333 : 10));
                                  const cleanCupScore = goodCups * scorePerCup;

                                  setCuppingData(prev => prev.map((b, i) => {
                                    if (i === batchIndex) {
                                      const updatedScores = {
                                        ...b.scores,
                                        cleanCup: parseFloat(cleanCupScore.toFixed(3)),
                                        cleanCupDefects: newDefects
                                      };
                                      const totalScore = calculateTotalScore(updatedScores);
                                      const defectScore = ((updatedScores.cleanCupDefects || []).length * (updatedScores.defectIntensity || 2) || 0);
                                      const finalScore = totalScore - defectScore;
                                      return {
                                        ...b,
                                        scores: {
                                          ...updatedScores,
                                          totalScore: parseFloat(totalScore.toFixed(2)),
                                          finalScore: parseFloat(finalScore.toFixed(2))
                                        }
                                      };
                                    }
                                    return b;
                                  }));
                                }}
                                disabled={isAllCompleted || (sessionFinished && !isOrganizationMember) || batch.isCompleted}
                              >
                                {num}
                              </button>
                            );
                          })}
                        </div>

                      </div>
                    </div>

                    {!batch.isRobusta && (
                      <div className="quality-row">
                        <div className="quality-item">
                          <label>Sweetness</label>
                          <div className="rating-buttons">
                            {Array.from({ length: Math.min(batch.sampleCount, 5) }, (_, i) => i + 1).map(num => {
                              const defectCups = batch.scores.sweetnessDefects || [];
                              const isDefect = defectCups.includes(num);
                              return (
                                <button
                                  key={num}
                                  type="button"
                                  className={isDefect ? 'defect' : 'good transparent-number'}
                                  onClick={() => {
                                    const currentDefects = batch.scores.sweetnessDefects || [];
                                    let newDefects;
                                    if (isDefect) {
                                      newDefects = currentDefects.filter(cup => cup !== num);
                                    } else {
                                      newDefects = [...currentDefects, num];
                                    }
                                    const maxCups = Math.min(batch.sampleCount, 5);
                                    const goodCups = maxCups - newDefects.length;
                                    const scorePerCup = maxCups === 5 ? 2 : (maxCups === 4 ? 2.5 : (maxCups === 3 ? 3.333 : 10));
                                    const sweetnessScore = goodCups * scorePerCup;

                                    setCuppingData(prev => prev.map((b, i) => {
                                      if (i === batchIndex) {
                                        const updatedScores = {
                                          ...b.scores,
                                          sweetness: parseFloat(sweetnessScore.toFixed(3)),
                                          sweetnessDefects: newDefects
                                        };
                                        const totalScore = calculateTotalScore(updatedScores);
                                        const defectScore = ((updatedScores.cleanCupDefects || []).length * (updatedScores.defectIntensity || 2) || 0);
                                        const finalScore = totalScore - defectScore;
                                        return {
                                          ...b,
                                          scores: {
                                            ...updatedScores,
                                            totalScore: parseFloat(totalScore.toFixed(2)),
                                            finalScore: parseFloat(finalScore.toFixed(2))
                                          }
                                        };
                                      }
                                      return b;
                                    }));
                                  }}
                                  disabled={isAllCompleted || (sessionFinished && !isOrganizationMember) || batch.isCompleted}
                                >
                                  {num}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="score-row">
                      <div className="score-item1">
                        <label>Overall</label>
                        <ScoreInput
                          value={batch.scores.overall}
                          onChange={(e) => handleScoreChangeWithValidation(batchIndex, 'overall', e.target.value)}
                          onFocus={() => handleFocusClearError(batchIndex)}
                          onKeyPress={(e) => {
                            if (!/[0-9.,-]/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          placeholder={t('auto.600_100_335')}
                          className={validationErrors[`${batchIndex}_overall`] ? 'required-error' : ''}
                          disabled={isAllCompleted || (sessionFinished && !isOrganizationMember) || batch.isCompleted}
                          id={`overall-${batchIndex}`}
                        />
                        {validationErrors[`${batchIndex}_overall`] && (
                          <span className="error-message">{t('auto.bt_buc_nhp_thng_300')}</span>
                        )}
                      </div>
                      <div className="score-item1">
                        <label>{t('auto.total_score_301')}</label>
                        <div className="total-score-display">
                          {(batch.scores.totalScore || calculateTotalScore(batch.scores)).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Hiển thị defect calculation khi có cốc hư */}
                    {(batch.scores.cleanCupDefects || []).length > 0 && (
                      <div className="defect-calculation-section">
                        <div className="calculation-description">
                          <span className="desc-item">{t('auto.s_cc_h_303')}</span>
                          <span className="desc-item">{t('auto.mc_li_304')}</span>
                          <span className="desc-item">{t('auto.tng_im_tr_305')}</span>
                        </div>
                        <div className="calculation-display">
                          <span className="defect-label">{t('auto.defect_306')}</span>
                          <div className="defect-count-square">
                            {(batch.scores.cleanCupDefects || []).length}
                          </div>
                          <span className="multiply-symbol">×</span>
                          <select
                            className="intensity-selector"
                            value={batch.scores.defectIntensity || 2}
                            onChange={(e) => {
                              const intensity = parseInt(e.target.value);
                              setCuppingData(prev => prev.map((b, i) => {
                                if (i === batchIndex) {
                                  const updatedScores = {
                                    ...b.scores,
                                    defectIntensity: intensity
                                  };
                                  const totalScore = calculateTotalScore(updatedScores);
                                  const defectScore = ((updatedScores.cleanCupDefects || []).length * intensity || 0);
                                  const finalScore = totalScore - defectScore;
                                  return {
                                    ...b,
                                    scores: {
                                      ...updatedScores,
                                      totalScore: parseFloat(totalScore.toFixed(2)),
                                      finalScore: parseFloat(finalScore.toFixed(2))
                                    }
                                  };
                                }
                                return b;
                              }));
                            }}
                            disabled={isAllCompleted || (sessionFinished && !isOrganizationMember) || batch.isCompleted}
                          >
                            <option value={2}>2</option>
                            <option value={4}>4</option>
                          </select>
                          <span className="equals-symbol">=</span>
                          <div className="result-square">
                            {(batch.scores.cleanCupDefects || []).length * (batch.scores.defectIntensity || 2)}
                          </div>
                        </div>
                      </div>
                    )}


                  </div>

                  <div className="score-summary">
                    <div className="score-total">
                      <span>Final Score: {(() => {
                        const finalScore = batch.scores.finalScore || (calculateTotalScore(batch.scores) - ((batch.scores.cleanCupDefects || []).length * (batch.scores.defectIntensity || 2) || 0));
                        return isNaN(finalScore) ? '0.00' : parseFloat(finalScore).toFixed(2);
                      })()}</span>
                    </div>
                    <button
                      type="button"
                      className="confirm-button"
                      disabled={isAllCompleted || (sessionFinished && !isOrganizationMember) || submitting[batchIndex] || batch.isCompleted}
                      onClick={() => handleSubmitBatch(batch, batchIndex)}
                    >
                      {submitting[batchIndex] ? t("cuppingSession.Save") : (batch.isCompleted ? t("cuppingSession.Complete") : sessionFinished ? t("auto.phin_kt_thc_271") : t("modal.confirmTitle"))}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}

        {!sessionStatusChecked ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', textAlign: 'center' }}>
            <div>
              <div className="session-status-spinner"></div>
              <p style={{ color: '#666', margin: '0' }}>{t('auto.ang_kim_tra_trn_320')}</p>
            </div>
          </div>
        ) : null}

        {(sessionStatusChecked || authModalProcessed) && !accessDenied && !sessionNotStarted && !sessionEnded && cuppingData.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', textAlign: 'center' }}>
            <div>
              <h2 style={{ margin: '0 0 16px 0', color: '#ff9800', fontSize: '28px', fontWeight: '600' }}>{t('auto.ang_ti_d_liu_321')}</h2>
              {/* <p style={{ color: '#666', fontSize: '14px' }}>{t('auto.debug_khng_c_ba_322')}</p> */}
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
};

export default CuppingForm;