import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from "react-router-dom";
import "./CuppingSession.css";
import { ClipboardIcon, FilterIcon, SortIcon } from "../../components/Icons";
import CreateCuppingSession from "../../components/CreateCuppingSession/CreateCuppingSession";
import SuccessModal from "../../components/SuccessModal";
import FilterModal from "../../components/FilterModal/FilterModal";
import { cuppingSessionApi } from "../../api/cuppingSessionApi";
import { showToast } from "../../components/Toast/Toast";
import { canCreate, usePermissions } from "../../utils/permissions";
import { API_BASE_URL } from "../../api/config";
import {
  FaSearch,
  FaFilter,
  FaSort,
  FaEye,
  FaEdit,
  FaTrash,
  FaCalendarAlt,
  FaUsers,
  FaMapMarkerAlt,
  FaClipboardList,
  FaCheckCircle,
  FaClock
} from
  "react-icons/fa";

const CuppingSession = ({ selectedContext }) => {
  const { t } = useTranslation();
  const { permissions, role } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdSession, setCreatedSession] = useState(null);
  const [createdSessionId, setCreatedSessionId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [greenbeanSearchTerm, setGreenbeanSearchTerm] = useState("");
  const [greenbeanSearchResults, setGreenbeanSearchResults] = useState([]);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    purpose: "",
    sessionType: "",
    sessionStatus: "",
    greenbeanName: "",
    variety: "",
    country: ""
  });
  const [sessionBatches, setSessionBatches] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Chỉ kiểm tra guest session khi component mount
  // useEffect(() => {
  //   const guestSessionId = localStorage.getItem('guestCompletedSession');
  //   if (guestSessionId) {
  //     const personalContext = { type: 'personal', name: 'Cá nhân' };
  //     localStorage.setItem('selectedContext', JSON.stringify(personalContext));
  //     window.location.href = '/personal/session'; // 🔥 GÂY CHỚP MÀN HÌNH
  //     return;
  //   }
  // }, []);

  // useEffect(() => {
  //   if (showCreateForm) return;

  //   // PROBLEMATIC: setInterval gọi fetchSessions() liên tục có thể gây re-render không cần thiết
  //   const interval = setInterval(() => {
  //     fetchSessions();
  //   }, 60000);

  //   // PROBLEMATIC: visibilitychange event có thể trigger quá nhiều lần
  //   const handleVisibilityChange = () => {
  //     if (!document.hidden && !showCreateForm) {
  //       // PROBLEMATIC: Lại dùng window.location.href
  //       const guestSessionId = localStorage.getItem('guestCompletedSession');
  //       if (guestSessionId) {
  //         const personalContext = { type: 'personal', name: 'Cá nhân' };
  //         localStorage.setItem('selectedContext', JSON.stringify(personalContext));
  //         window.location.href = '/personal/session'; 
  //         return;
  //       }
  //       // PROBLEMATIC: fetchSessions() được gọi mỗi khi focus lại tab
  //       fetchSessions();
  //     }
  //   };

  //   document.addEventListener('visibilitychange', handleVisibilityChange);

  //   return () => {
  //     clearInterval(interval);
  //     document.removeEventListener('visibilitychange', handleVisibilityChange);
  //   };
  // }, [showCreateForm, selectedContext, filters.variety, filters.country]);

  const getCuppingPurposeLabel = (purpose) => {
    const map = {
      "Check new green bean quality": "greenbean_new",
      "Check green bean quality": "greenbean",
      "Check roast batch quality": "roastbean",
      "Check finished product quality": "product"
    };

    const key = map[purpose];
    return key ? t(`cuppingSession.purposes.${key}`) : purpose;
  };

  const getScoreCardFormatDisplay = (format) => {
    const formatMap = {
      "AffectiveScoreCard": "Affective Form",
      "DescriptiveScoreCard": "Descriptive Form",
      "SCA": "SCA Form"
    };
    return formatMap[format] || format;
  };

  const getScoreCardFormatStyles = (format) => {
    const styles = {
      "AffectiveScoreCard": { bg: "#f3e5f5", text: "#7b1fa2" },
      "DescriptiveScoreCard": { bg: "#fef3c7", text: "#d97706" },
      "SCA": { bg: "#dbeafe", text: "#1d4ed8" }
    };
    return styles[format] || { bg: "#f3f4f6", text: "#6b7280" };
  };

  const getSessionStatusClass = (session) => {
    if (session.is_finished) return "finished";
    if (session.is_started) return "active";
    return "pending";
  };

  const getSessionStatusText = (session) => {
    if (session.is_finished) return t('cuppingSession.completed');
    if (session.is_started) return t('cuppingSession.inProgress');
    return t('cuppingSession.notStarted');
  };

  const matchesPurposeFilter = (session) => {
    return !filters.purpose || session.purpose === filters.purpose;
  };

  const matchesSessionTypeFilter = (session) => {
    return !filters.sessionType || session.type_of_session === filters.sessionType;
  };

  const matchesDateRangeFilter = (session) => {
    if (!filters.startDate && !filters.endDate) return true;
    
    const sessionDate = new Date(session.cupping_date);
    if (filters.startDate && sessionDate < new Date(filters.startDate)) return false;
    if (filters.endDate && sessionDate > new Date(filters.endDate)) return false;
    return true;
  };

  const matchesStatusFilter = (session) => {
    if (!filters.sessionStatus) return true;

    if (filters.sessionStatus === 'upcoming') {
      return !session.is_started && !session.is_finished;
    }
    if (filters.sessionStatus === 'ongoing') {
      return session.is_started && !session.is_finished;
    }
    if (filters.sessionStatus === 'completed') {
      return session.is_finished;
    }
    return true;
  };

  const filterSession = (session) => {
    return matchesPurposeFilter(session) &&
           matchesSessionTypeFilter(session) &&
           matchesDateRangeFilter(session) &&
           matchesStatusFilter(session);
  };

  const handleCreateSession = () => {
    setCreatedSessionId(null);
    setShowCreateForm(true);
  };

  const handleBack = () => {
    setShowCreateForm(false);
  };

  const handleSearchByGreenbean = async (term) => {
    if (!term.trim()) {
      setGreenbeanSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await cuppingSessionApi.searchByGreenbeanName(term, selectedContext);
      setGreenbeanSearchResults(response.data || []);
    } catch (error) {
      // console.error("Error searching sessions:", error);
      setGreenbeanSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      const response = await cuppingSessionApi.create(formData, selectedContext);
      const sessionId = response.data?.sessionId || response.data?.session_id;
      setCreatedSessionId(sessionId);
      setShowSuccessModal(true);
      setCreatedSession({
        uuid: sessionId,
        sessionName: formData.description || "Phiên thử nếm mới"
      });
    } catch (error) {
      // console.error("Error creating session:", error);
      showToast(
        t('cuppingSession.CreateSessionError'),
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      setSessionsLoading(true); // 

      const response = await cuppingSessionApi.getAll(selectedContext, {
        variety: filters.variety,
        country: filters.country,
        _t: Date.now() // PROBLEMATIC: Force cache bust mỗi lần gọi, không cache được
      });
      let allSessions = response.data || [];

      // Việc map và thay đổi trạng thái session có thể gây re-render không mong muốn
      allSessions = allSessions.map(session => {
        const now = new Date();
        const finishDate = session.finish_date ? new Date(session.finish_date) : null;

        if (session.is_started && !session.is_finished && finishDate && now > finishDate) {
          return { ...session, is_finished: true }; // State change gây re-render
        }

        return session;
      });

      // ⚠️ NGUYÊN NHÂN CHỚP MÀN HÌNH #5: Thao tác localStorage và fetch thêm data
      const guestSessionId = localStorage.getItem('guestCompletedSession');
      if (guestSessionId) {
        try {
          const sessionResponse = await fetch(`${API_BASE_URL}/cupping-sessions/${guestSessionId}/info`);
          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json();
            if (sessionData.success) {
              const exists = allSessions.find((s) => s.uuid === guestSessionId);
              if (!exists) {
                allSessions.unshift({
                  ...sessionData.data,
                  _isGuestSession: true
                });
              }
            }
          }
        } catch (error) {
          // console.error('Error fetching guest session:', error);
        }
        localStorage.removeItem('guestCompletedSession');
      }

      setSessions(allSessions); // 
    
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setSessionsLoading(false); // 
    }
  };

  const handleSearch = async (term) => {
    if (!term.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await cuppingSessionApi.searchByGreenbeanName(term);
      setSearchResults(response.data || []);
    } catch (error) {
      // console.error("Error searching sessions:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRefresh = async () => {
    await fetchSessions();
    setRefreshTrigger((prev) => prev + 1);
  };

  // ⚠️ NGUYÊN NHÂN CHỚP MÀN HÌNH #6: useEffect với nhiều dependencies
  useEffect(() => {
    
    if (!showCreateForm) {
      fetchSessions(); 
    }
   
    setGreenbeanSearchResults([]);
    setGreenbeanSearchTerm("");
  }, [refreshTrigger, selectedContext, showCreateForm, filters.variety, filters.country, location.pathname]);



  const handleViewDetail = (session) => {
    const sessionId = session.uuid || session.session_id;
    const currentPath = window.location.pathname;
    const prefix = currentPath.startsWith('/org/') ? currentPath.match(/^\/org\/[^\/]+/)[0] : '/personal';
    navigate(`${prefix}/sessionlist/${sessionId}`);
  };

  const handleViewCuppingForms = (session) => {


  }; if (showCreateForm) {
    return (
      <>
        <CreateCuppingSession
          onBack={handleBack}
          onSubmit={handleSubmit}
          loading={loading}
          createdSessionId={createdSessionId}
          onStartSession={async (sessionId) => {
            try {
              await cuppingSessionApi.startSession(sessionId);
              await fetchSessions();
              // Chỉ start session, không navigate
            } catch (error) {
              // console.error("Error starting session:", error);
              showToast(
                t('cuppingSession.StartSessionError'),
                'error'
              );

            }
          }}
          selectedContext={selectedContext}
          onGoToCupping={(sessionId) => {
            const currentPath = window.location.pathname;
            const prefix = currentPath.startsWith('/org/') ? currentPath.match(/^\/org\/[^\/]+/)[0] : '/personal';
            navigate(`${prefix}/sessionlist/${sessionId}`);
          }} />


        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            setShowCreateForm(false);
            fetchSessions();
            // Navigate đến trang detail của session vừa tạo
            if (createdSessionId) {
              const currentPath = window.location.pathname;
              const prefix = currentPath.startsWith('/org/') ? currentPath.match(/^\/org\/[^\/]+/)[0] : '/personal';
              navigate(`${prefix}/sessionlist/${createdSessionId}`);
            }
          }}
          sessionId={createdSessionId}
          sessionName={createdSession?.sessionName}
          onStartSession={async (sessionId) => {
            try {
              await cuppingSessionApi.startSession(sessionId);
              setShowSuccessModal(false);
              setShowCreateForm(false);
              await fetchSessions();
              // Navigate đến trang detail của session sau khi start
              const currentPath = window.location.pathname;
              const prefix = currentPath.startsWith('/org/') ? currentPath.match(/^\/org\/[^\/]+/)[0] : '/personal';
              navigate(`${prefix}/sessionlist/${sessionId}`);
            } catch (error) {
              // console.error("Error starting session:", error);
              showToast(
                t('cuppingSession.StartSessionError'),
                'error'
              );
            }
          }} />

      </>);

  }

  return (
    <div className="cs_cupping-session-container">
      <div className="cs_cupping-session-wrapper">
        <div className="cs_cupping-session-header">
          <div className="cs_cupping-session-title-section">
            <div className="cs_cupping-session-icon">
              <ClipboardIcon color="#4A90E2" opacity={0.6} size={32} />
            </div>
            <div>
              <h1 className="cs_cupping-session-title">{t('cuppingSession.title')}</h1>
              <p className="cs_cupping-session-subtitle">
                {t('cuppingSession.subtitle')}
              </p>
            </div>
          </div>
          {canCreate('cupping_session') &&
            <button
              className="cs_cupping-session-add-button"
              onClick={handleCreateSession}>

              {t('auto._to_391')}
            </button>
          }
        </div>

        <div className="cs_cupping-session-content">
          <div className="cs_session-controls">
            <div className="cs_search-container">
              <span className="cs_search-icon">
                <FaSearch size={16} color="#666" />
              </span>
              <input
                type="text"
                placeholder={t('cuppingSession.searchPlaceholder')}
                value={greenbeanSearchTerm}
                onChange={(e) => {
                  const value = e.target.value;
                  setGreenbeanSearchTerm(value);
                  handleSearchByGreenbean(value);
                }}
                className="cs_search-input" />

            </div>
            <div className="cs_filter-controls">
              <button
                className="cs_filter-btn"
                onClick={() => setShowFilterModal(true)}>

                <FilterIcon size={14} color="#666" />
                {t('common.filter')}
              </button>
              <button
                className="cs_sort-btn"
                onClick={() =>
                  setSortOrder(sortOrder === "newest" ? "oldest" : "newest")
                }>

                <SortIcon size={14} color="#666" />
                {t('common.date')} ({sortOrder === "newest" ? t('common.newest') : t('common.oldest')})
              </button>
            </div>
          </div>

          {(() => {
            const filteredSessions = (
              greenbeanSearchTerm.trim() ? greenbeanSearchResults : sessions
            )
              .filter(filterSession)
              .sort((a, b) => {
                if (sortOrder === "newest") {
                  return new Date(b.cupping_date) - new Date(a.cupping_date);
                } else {
                  return new Date(a.cupping_date) - new Date(b.cupping_date);
                }
              });

            const totalPages = Math.ceil(
              filteredSessions.length / itemsPerPage
            );
            const startIndex = (currentPage - 1) * itemsPerPage;
            const paginatedSessions = filteredSessions.slice(
              startIndex,
              startIndex + itemsPerPage
            );

            if (sessionsLoading) {
              return (
                <div className="cs_cupping-session-loading">
                  <div className="cs_loading-spinner"></div>
                  <p>{t('cuppingSession.loading')}</p>
                </div>);

            }

            if (filteredSessions.length === 0) {
              return (
                <div className="cs_cupping-session-empty-state">
                  <div className="cs_cupping-session-empty-icon">
                    <FaClipboardList color="#0158A4" opacity={0.4} size={80} />
                  </div>
                  <h2 className="cs_cupping-session-empty-title">
                    {t('cuppingSession.emptyTitle')}
                  </h2>
                  <p className="cs_cupping-session-empty-description">
                    {t('cuppingSession.emptyDescription')}
                  </p>
                </div>);

            }

            return (
              <>
                <div className="cs_session-list">
                  {paginatedSessions.map((session) => {
                    const sessionId = session.uuid || session.session_id;
                    const scoreCardStyles = session.score_card_format ? getScoreCardFormatStyles(session.score_card_format) : null;

                    return (
                      <div
                        key={sessionId || Math.random()}
                        className="cs_session-card"
                        onClick={() => handleViewDetail(session)}>

                        <div className="cs_session-icon">
                          <ClipboardIcon color="#4A90E2" size={24} />
                        </div>
                        <div className="cs_session-info">
                          <div className="cs_session-main-info">
                            <h3 className="cs_session-title">
                              {getCuppingPurposeLabel(session.purpose)}
                            </h3>

                            <div className="cs_session-details">
                              <span className="cs_session-date">
                                <FaCalendarAlt size={12} color="#6c757d" />
                                {t('cuppingSession.createdDate')}:{" "}
                                {new Date(
                                  session.cupping_date
                                ).toLocaleDateString("vi-VN")}
                              </span>
                              {session.start_date &&
                                <span className="cs_session-start-date">
                                  <FaCalendarAlt size={12} color="#28a745" />
                                  {t('cuppingSession.startDate')}:{" "}
                                  {new Date(
                                    session.start_date
                                  ).toLocaleDateString("vi-VN")}
                                </span>
                              }
                              {session.finish_date &&
                                <span className="cs_session-end-date">
                                  <FaCalendarAlt size={12} color="#dc3545" />
                                  {t('cuppingSession.endDate')}:{" "}
                                  {new Date(
                                    session.finish_date
                                  ).toLocaleDateString("vi-VN")}
                                </span>
                              }
                            </div>
                            {session.description &&
                              <div className="cs_session-purpose-description">
                                <span className="cs_session-description">
                                  <strong>{t("auto.m_t_311")}</strong> {session.description}
                                </span>
                              </div>
                            }
                          </div>
                        </div>
                        <div className="cs_session-meta">
                          <div className="cs_session-status">
                            <span className="cs_session-status-label">{t('cuppingSession.status')}</span>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                              {session.score_card_format && scoreCardStyles && (
                                <span style={{
                                  padding: "4px 12px",
                                  borderRadius: "20px",
                                  fontSize: "14px",
                                  fontWeight: "600",
                                  backgroundColor: scoreCardStyles.bg,
                                  color: scoreCardStyles.text
                                }}>
                                  {getScoreCardFormatDisplay(session.score_card_format)}
                                </span>
                              )}
                              <span className={`cs_session-status-badge ${getSessionStatusClass(session)}`}>
                                {getSessionStatusText(session)}
                              </span>
                            </div>
                          </div>

                          {/* Action buttons based on permissions */}
                          <div className="cs_session-actions" onClick={(e) => e.stopPropagation()}>
                            {session.canEdit &&
                              <button
                                className="cs_action-btn cs_edit-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Handle edit

                                }}
                                title={t("auto.chnh_sa_312")}>

                                <FaEdit size={14} />
                              </button>
                            }
                            {session.canDelete &&
                              <button
                                className="cs_action-btn cs_delete-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Handle delete

                                }}
                                title={t("auto.xa_313")}>

                                <FaTrash size={14} />
                              </button>
                            }
                          </div>
                        </div>
                      </div>);

                  })}
                </div>
                {totalPages > 1 && (
                  <div className="cs_pagination">
                    <button
                      className="cs_pagination-btn"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}>

                      {t('common.previous')}
                    </button>
                    <span className="cs_pagination-info">
                      {t('common.page')} {currentPage} / {totalPages} (
                      {filteredSessions.length} {t('cuppingSession.items')})
                    </span>
                    <button
                      className="cs_pagination-btn"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}>

                      {t('common.next')}
                    </button>
                  </div>
                )}
              </>);

          })()}
        </div>
      </div>
      <SuccessModal
        isOpen={showSuccessModal && !showCreateForm}
        onClose={() => {
          setShowSuccessModal(false);
          fetchSessions();
          // Navigate đến trang detail của session vừa tạo
          if (createdSessionId) {
            const currentPath = window.location.pathname;
            const prefix = currentPath.startsWith('/org/') ? currentPath.match(/^\/org\/[^\/]+/)[0] : '/personal';
            navigate(`${prefix}/sessionlist/${createdSessionId}`);
          }
        }}
        sessionId={createdSessionId}
        sessionName={createdSession?.sessionName}
        onStartSession={async (sessionId) => {
          try {
            await cuppingSessionApi.startSession(sessionId);
            setShowSuccessModal(false);
            await fetchSessions();
            // Navigate đến trang detail của session sau khi start
            const currentPath = window.location.pathname;
            const prefix = currentPath.startsWith('/org/') ? currentPath.match(/^\/org\/[^\/]+/)[0] : '/personal';
            navigate(`${prefix}/sessionlist/${sessionId}`);
          } catch (error) {
            // console.error("Error starting session:", error);
            showToast(
              t('cuppingSession.StartSessionError'),
              'error'
            );
          }
        }} />


      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={async (newFilters) => {

          setFilters(newFilters);
          setSessionsLoading(true);
          try {
            const response = await cuppingSessionApi.getAll(selectedContext, {
              variety: newFilters.variety,
              country: newFilters.country
            });

            let allSessions = response.data || [];

            setSessions(allSessions);
          } catch (error) {
            // console.error("Error fetching sessions:", error);
          } finally {
            setSessionsLoading(false);
          }
        }}
        initialFilters={filters} />

    </div>);

};

export default CuppingSession;