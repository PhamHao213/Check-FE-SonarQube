import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL, REACT_APP_IMAGE_BASE_URL } from "../../api/config";
import {
  ArrowLeftIcon,
  CalendarIcon,
  BoxIcon,
  EditIcon,
  TrashIcon,
  LeafIcon,
} from "../../components/Icons";
import { batchApi } from "../../api/batchApi";
import EditBatchForm from "./EditBatchForm";
import "./BatchDetail.css";
import { canDelete, canEdit, usePermissions } from "../../utils/permissions";

const BatchDetail = ({ batch, onClose, onRefresh, selectedContext }) => {
  const { t } = useTranslation();
  const { permissions, role } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [relatedSessions, setRelatedSessions] = useState([]);
  const [currentBatch, setCurrentBatch] = useState(batch);
  const [greenBeanInfo, setGreenBeanInfo] = useState(null);
  const [vendorInfo, setVendorInfo] = useState(null);
  const [batchImages, setBatchImages] = useState([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [cuppingScores, setCuppingScores] = useState([]);
  const [loadingCuppings, setLoadingCuppings] = useState(false);
  const [showCuppingDetails, setShowCuppingDetails] = useState(false);
  const [affectiveScores, setAffectiveScores] = useState([]);
  const [loadingAffectives, setLoadingAffectives] = useState(false);
  const [showAffectiveDetails, setShowAffectiveDetails] = useState(false);
  const [cuppingForms, setCuppingForms] = useState({});
  const [loadingForms, setLoadingForms] = useState(false);
  const [showCuppingHistory, setShowCuppingHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const lang = localStorage.getItem("language") || "vi";

  // Hàm cắt ngắn tên khi quá dài
  const truncateName = (name, maxLength = 30) => {
    if (!name) return "";
    return name.length > maxLength
      ? `${name.substring(0, maxLength)}...`
      : name;
  };

  // Mapping purpose - hỗ trợ cả tiếng Anh và tiếng Việt
  const getPurposeDisplay = (purpose) => {
    const purposeMap = {
      "Check new green bean quality": t("auto.kim_tra_cht_lng_58"),
      "Check green bean quality": t("auto.kim_tra_cht_lng_59"),
      "Check roast batch quality": t("auto.kim_tra_cht_lng_60"),
      "Check finished product quality": t("auto.kim_tra_cht_lng_61"),
    };
    return purposeMap[purpose] || purpose;
  };

  const getFormTypeDisplay = (formType) => {
    const typeMap = {
      "AffectiveScoreCard": "Affective Form",
      "DescriptiveScoreCard": "Descriptive Form",
      "SCA": "SCA Form"
    };
    return typeMap[formType] || formType;
  };

  const getFormTypeStyles = (formType) => {
    const styles = {
      "SCA": { bg: "#e3f2fd", text: "#0d47a1" },
      "AffectiveScoreCard": { bg: "#f3e5f5", text: "#4a148c" },
      "DescriptiveScoreCard": { bg: "#fff3e0", text: "#e65100" }
    };
    return styles[formType] || { bg: "#fff3e0", text: "#e65100" };
  };

  const getFormScore = (form) => {
    if (form.formType === "AffectiveScoreCard") return form.affective_score || "-";
    if (form.formType === "SCA") return form.cupping_score || "-";
    return "-";
  };

  const getFormCupper = (form) => {
    if (form.formType === "AffectiveScoreCard") return form.affective_cupper || "-";
    if (form.formType === "DescriptiveScoreCard") return form.descriptive_cupper || "-";
    if (form.formType === "SCA") return form.cupping_cupper || "-";
    return "-";
  };

  const navigateToSession = (sessionId) => {
    const currentPath = location.pathname;
    let prefix = "/personal";
    if (currentPath.startsWith("/org/")) {
      const orgMatch = currentPath.match(/^\/org\/[^\/]+/);
      if (orgMatch) prefix = orgMatch[0];
    }
    navigate(`${prefix}/sessionlist/${sessionId}`);
  };

  useEffect(() => {
    fetchBatchDetail();
    fetchCuppingScores();
    fetchAffectiveScores();
    fetchCuppingForms();
  }, [batch]);

  const processImageUrls = (imageUrls) => {
    if (!imageUrls) return [];

    try {
      const urls =
        typeof imageUrls === "string" ? JSON.parse(imageUrls) : imageUrls;
      return Array.isArray(urls)
        ? urls.map((img) =>
          img.startsWith("http") ? img : `${REACT_APP_IMAGE_BASE_URL}${img}`
        )
        : [];
    } catch {
      return [];
    }
  };

  const fetchBatchDetail = async () => {
    try {
      const batchId = batch.gb_batch_id || batch.uuid;
      const response = await fetch(
        `${API_BASE_URL}/greenbeanbatch/${batchId}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) return;

      const { data } = await response.json();
      setCurrentBatch(data);
      setBatchImages(processImageUrls(data.image_urls));

      if (data.green_bean_id) fetchGreenBeanInfo(data.green_bean_id);
      if (data.vendor_id) fetchVendorInfo(data.vendor_id);
    } catch (error) { }
  };

  const fetchGreenBeanInfo = async (greenBeanId) => {
    if (!greenBeanId) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/greenbeans/${greenBeanId}`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setGreenBeanInfo(data.data);
      }
    } catch (error) { }
  };

  const fetchVendorInfo = async (vendorId) => {
    if (!vendorId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/vendors/${vendorId}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setVendorInfo(data.data || data);
      }
    } catch (error) { }
  };
  const fetchCuppingScores = async () => {
    if (!currentBatch?.green_bean_id) return;

    try {
      setLoadingCuppings(true);
      const cuppingResponse = await fetch(
        `${API_BASE_URL}/greenbean-cuppings/${currentBatch.green_bean_id}`,
        {
          credentials: "include",
        }
      );

      if (cuppingResponse.ok) {
        const cuppingData = await cuppingResponse.json();
        const cuppings = cuppingData.data || [];

        const validCuppings = cuppings.filter((cupping) => {
          const finalScore = cupping.total_score || cupping.final_score || 0;
          return finalScore > 0;
        });

        setCuppingScores(validCuppings);
      }
    } catch (error) {
    } finally {
      setLoadingCuppings(false);
    }
  };

  const fetchAffectiveScores = async () => {
    if (!currentBatch?.green_bean_id) return;

    try {
      setLoadingAffectives(true);
      const affectiveResponse = await fetch(
        `${API_BASE_URL}/affective-score-card/greenbean/${currentBatch.green_bean_id}`,
        {
          credentials: "include",
        }
      );

      if (affectiveResponse.ok) {
        const affectiveData = await affectiveResponse.json();

        const affectives = affectiveData.data || [];

        const validAffectives = affectives.filter((affective) => {
          return (
            affective.cupper_name &&
            affective.form_data &&
            (affective.form_data.fragrance_aroma ||
              affective.form_data.flavor_aftertaste ||
              affective.form_data.acidity ||
              affective.form_data.sweetness ||
              affective.form_data.mouthfeel ||
              affective.form_data.overall)
          );
        });

        setAffectiveScores(validAffectives);
      } else {
        const errorText = await affectiveResponse.text();
      }
    } catch (error) {
    } finally {
      setLoadingAffectives(false);
    }
  };

  const fetchCuppingForms = async () => {
    try {
      setLoadingForms(true);
      const batchId = batch.gb_batch_id || batch.uuid;
      const response = await fetch(
        `${API_BASE_URL}/greenbeanbatch/${batchId}/cupping-forms`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const { data } = await response.json();
        setCuppingForms(data || {});
      } else {

      }
    } catch (error) {

    } finally {
      setLoadingForms(false);
    }
  };

  const handleCuppingClick = (scoreCard) => {
    // Xử lý cho cả cupping và affective score cards
    const sessionId =
      scoreCard.session_id || scoreCard.cupping_session_batch_id;

    if (sessionId) {
      const currentPath = location.pathname;
      let prefix = "/personal";

      if (currentPath.startsWith("/org/")) {
        const orgMatch = currentPath.match(/^\/org\/[^\/]+/);
        if (orgMatch) {
          prefix = orgMatch[0];
        }
      }

      navigate(`${prefix}/sessionlist/${sessionId}`);
    }
  };

  // Hàm xử lý click vào thông tin nhân xanh để chuyển đến greenbean detail
  const handleGreenbeanClick = () => {
    if (currentBatch.green_bean_id) {
      // Xác định prefix dựa trên context hiện tại
      const currentPath = location.pathname;
      let prefix = "/personal";

      if (currentPath.startsWith("/org/")) {
        const orgMatch = currentPath.match(/^\/org\/[^\/]+/);
        if (orgMatch) {
          prefix = orgMatch[0];
        }
      }

      // Navigate đến greenbean detail
      navigate(`${prefix}/gblist/${currentBatch.green_bean_id}`);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const timeStr = date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${dateStr} ${timeStr}`;
  };

  return (
    <div className="gbb_batch-detail-page">
      <div className="gbb_batch-detail-content">
        <button className="gbb_back-button" onClick={onClose}>
          <ArrowLeftIcon size={16} />
          {t("common.back")}
        </button>
        <div className="gbb_batch-detail-title">
          <div className="gbb_batch-title-info">
            <div className="gbb_batch-detail-icon">
              <BoxIcon color="#FBB217" size={32} />
            </div>
            <div>
              <h2>
                {truncateName(
                  batch?.greenbean_name || batch?.green_bean_name
                ) || t("greenBatch.noGreenbean")}
              </h2>
              <p>{t("greenBatch.detailSubtitle")}</p>
            </div>
          </div>
          <div className="gbb_batch-detail-actions">
            {canEdit("green_bean_batch") && (
              <button
                className="gbb_detail-edit-btn"
                onClick={() => setShowEditForm(true)}
              >
                <EditIcon size={14} color="#16a34a" />
                {t("common.edit")}
              </button>
            )}
            {canDelete("green_bean_batch") && (
              <button
                className="gbb_detail-delete-btn"
                onClick={async () => {
                  try {
                    const batchId =
                      currentBatch.uuid ||
                      currentBatch.gb_batch_id ||
                      batch.uuid ||
                      batch.gb_batch_id;
                    // Kiểm tra xem batch có liên quan đến session nào không
                    const sessionsResponse = await batchApi.checkBatchSessions(
                      batchId,
                      selectedContext
                    );
                    const sessions = sessionsResponse.data || [];

                    setRelatedSessions(sessions);
                    setShowDeleteModal(true);
                  } catch (error) {
                    // Nếu không kiểm tra được, vẫn cho phép xóa
                    setRelatedSessions([]);
                    setShowDeleteModal(true);
                  }
                }}
              >
                <TrashIcon size={14} color="#dc2626" />
                {t("common.delete")}
              </button>
            )}
          </div>
        </div>

        <div className="gbb_batch-detail-info">
          <div className="gbb_info-section">
            <h3>{t("greenBatch.basicInfo")}</h3>
            <div className="gbb_basic-info-with-image">
              <div className="gbb_basic-info-content">
                <div className="gbb_info-grid">
                  <div className="gbb_info-item">
                    <label>{t("greenBatch.moisture")}</label>
                    <span>
                      {currentBatch?.moisture || t("greenBatch.noInfo")}
                    </span>
                  </div>

                  <div className="gbb_info-item">
                    <label>{t("greenBatch.size")}</label>
                    <span>{currentBatch?.size || t("greenBatch.noInfo")}</span>
                  </div>

                  <div className="gbb_info-item">
                    <label>{t("greenBatch.weight")}</label>
                    <span>
                      {currentBatch.weight
                        ? `${currentBatch.weight} kg`
                        : t("greenBatch.noInfo")}
                    </span>
                  </div>

                  <div className="gbb_info-item">
                    <label>{t("greenBatch.density")}</label>
                    <span>
                      {currentBatch?.density || 0}
                      {t("auto.gml_325")}
                    </span>
                  </div>

                  <div className="gbb_info-item">
                    <label>{t("greenBatch.vendor")}</label>
                    <span>
                      {vendorInfo?.name ||
                        batch.vendor_name ||
                        t("greenBatch.noInfo")}
                    </span>
                  </div>

                  <div className="gbb_info-item">
                    <label>{t("greenBatch.sampleType")}</label>
                    <span>
                      {currentBatch?.is_sample
                        ? t("greenBatch.sample")
                        : t("greenBatch.material")}
                    </span>
                  </div>
                </div>
              </div>

              {currentBatch.description && (
                <div className="gbb_info-section">
                  <h3>{t("greenBatch.description")}</h3>
                  <div className="gbb_description-content">
                    <p>{currentBatch.description}</p>
                  </div>
                </div>
              )}

              <div className="gbb_info-section">
                <h3>{t("common.timeInfo")}</h3>
                <div className="gbb_info-grid">
                  <div className="gbb_info-item">
                    <label>{t('greenBatch.received_at')}</label>
                    <span className="gbb_date-info">
                      <CalendarIcon size={14} color="#6c757d" />
                      {currentBatch.received_at
                        ? new Date(currentBatch.received_at).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                        : t("greenBatch.noInfo")}
                    </span>
                  </div>

                  <div className="gbb_info-item">
                    <label>{t("common.createdDate")}</label>
                    <span className="gbb_date-info">
                      <CalendarIcon size={14} color="#6c757d" />
                      {formatDate(currentBatch.created_dt)}
                    </span>
                  </div>

                  <div className="gbb_info-item">
                    <label>{t("common.lastUpdated")}</label>
                    <span className="gbb_date-info">
                      <CalendarIcon size={14} color="#6c757d" />
                      {formatDate(currentBatch.updated_dt)}
                    </span>
                  </div>
                </div>
              </div>

              {batchImages.length > 0 && (
                <div className="gbb_batch-images-sidebar">
                  <h4>{t("greenBatch.image")}</h4>
                  <div className="gbb_batch-images-preview">
                    <div
                      className="gbb_main-image"
                      onClick={() => {
                        setCurrentImageIndex(0);
                        setShowImageModal(true);
                      }}
                    >
                      <img src={batchImages[0]} alt="Ảnh lô chính" />
                      <div className="gbb_image-overlay">
                        <span>Xem ảnh</span>
                      </div>
                    </div>
                    {batchImages.length > 1 && (
                      <button
                        className="gbb_view-all-images-btn"
                        onClick={() => {
                          setCurrentImageIndex(0);
                          setShowImageModal(true);
                        }}
                      >
                        {t("greenBatch.view_all_images", {
                          count: batchImages.length,
                        })}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          {(currentBatch.greenbean_name || currentBatch.green_bean_name) && (
            <div className="gbb_info-section">
              <h3>{t("greenBatch.greenbeanInfo")}</h3>
              <div
                className="gbb_greenbean-simple-card gbb_greenbean-clickable"
                onClick={handleGreenbeanClick}
              >
                <div className="gbb_greenbean-item">
                  <LeafIcon size={18} color="#09B04B" />
                  <div className="gbb_greenbean-content">
                    <div className="gbb_greenbean-name">
                      {truncateName(
                        currentBatch.greenbean_name ||
                        currentBatch.green_bean_name
                      )}
                    </div>
                    <div className="gbb_greenbean-details">
                      <span className="gbb_detail-item">
                        {t("greenBatch.variety")}:{" "}
                        <strong>
                          {currentBatch.variety_type || t("greenBatch.noInfo")}
                        </strong>
                      </span>
                      <span className="gbb_detail-separator">•</span>
                      <span className="gbb_detail-item">
                        {t("greenBatch.processing")}:{" "}
                        <strong>
                          {currentBatch.processing || t("greenBatch.noInfo")}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="gbb_click-hint">
                  {t("greenBatch.clickForDetails")}
                </div>
              </div>
            </div>
          )}

          <div className="gbb_info-section">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                marginBottom: "16px"
              }}
              onClick={() => setShowCuppingHistory(!showCuppingHistory)}
            >
              <h3 style={{ margin: 0 }}>{t("greenBatch.title1")}</h3>
              <span style={{ fontSize: "20px", color: "#6c757d" }}>
                {showCuppingHistory ? "▲" : "▼"}
              </span>
            </div>
            {showCuppingHistory && (
              loadingForms ? (
                <p>Loading...</p>
              ) : Object.keys(cuppingForms).length > 0 ? (
                <>
                  <div className="gbb_forms-table">
                    <table style={{ width: "100%", borderCollapse: "collapse", minHeight: "400px" }}>
                      <thead>
                        <tr>
                          <th style={{ width: "20%", padding: "12px 8px", border: "1px solid #dee2e6" }}>
                            {t("greenBatch.session_score_card")}
                          </th>
                          <th style={{ width: "15%", padding: "12px 8px", border: "1px solid #dee2e6" }}>
                            {t("greenBatch.cupping_date")}
                          </th>
                          <th style={{ width: "15%", padding: "12px 8px", border: "1px solid #dee2e6" }}>
                            {t('greenBatch.type')}
                          </th>
                          <th style={{ width: "15%", padding: "12px 8px", border: "1px solid #dee2e6" }}>
                            {t("greenBatch.score")}
                          </th>
                          <th style={{ width: "20%", padding: "12px 8px", border: "1px solid #dee2e6" }}>
                            {t("greenBatch.cupper")}
                          </th>
                        </tr>
                      </thead>
                      <tbody style={{ minHeight: "400px", display: "table-row-group" }}>
                        {(() => {
                          const allForms = Object.entries(cuppingForms)
                            .flatMap(([formType, forms]) =>
                              forms.map(form => ({ ...form, formType }))
                            )
                            .sort((a, b) => new Date(b.cupping_date) - new Date(a.cupping_date))
                            .slice(0, 16);

                          const totalPages = Math.ceil(allForms.length / itemsPerPage);
                          const startIndex = (currentPage - 1) * itemsPerPage;
                          const paginatedForms = allForms.slice(startIndex, startIndex + itemsPerPage);

                          return paginatedForms.map((form, index) => {
                            const displayName = getFormTypeDisplay(form.formType);
                            const { bg: formTypeColor, text: formTypeTextColor } = getFormTypeStyles(form.formType);
                            
                            return (
                              <tr
                                key={`${form.formType}-${index}`}
                                onClick={() => navigateToSession(form.session_id)}
                                style={{ cursor: "pointer", transition: "background-color 0.2s" }}
                                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f8f9fa")}
                                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                              >
                                <td style={{ padding: "10px 8px", border: "1px solid #dee2e6" }}>
                                  {getPurposeDisplay(form.purpose) || "Session"}
                                </td>
                                <td style={{ padding: "10px 8px", border: "1px solid #dee2e6" }}>
                                  {form.cupping_date ? new Date(form.cupping_date).toLocaleDateString("vi-VN") : "-"}
                                </td>
                                <td style={{ padding: "10px 8px", border: "1px solid #dee2e6" }}>
                                  <span style={{
                                    backgroundColor: formTypeColor,
                                    color: formTypeTextColor,
                                    padding: "4px 12px",
                                    borderRadius: "12px",
                                    fontSize: "13px",
                                    fontWeight: "500",
                                    display: "inline-block"
                                  }}>
                                    {displayName}
                                  </span>
                                </td>
                                <td style={{ padding: "10px 8px", border: "1px solid #dee2e6" }}>
                                  {getFormScore(form)}
                                </td>
                                <td style={{ padding: "10px 8px", border: "1px solid #dee2e6" }}>
                                  {getFormCupper(form)}
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                  {(() => {
                    const allForms = Object.entries(cuppingForms)
                      .flatMap(([formType, forms]) => forms.map(form => ({ ...form, formType })))
                      .sort((a, b) => new Date(b.cupping_date) - new Date(a.cupping_date))
                      .slice(0, 16);
                    const totalPages = Math.ceil(allForms.length / itemsPerPage);

                    return totalPages > 1 && (
                      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginTop: "16px" }}>
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          style={{
                            padding: "8px 16px",
                            border: "1px solid #dee2e6",
                            borderRadius: "4px",
                            background: currentPage === 1 ? "#f8f9fa" : "white",
                            cursor: currentPage === 1 ? "not-allowed" : "pointer",
                            fontSize: "14px"
                          }}
                        >
                          {t("common.previous")}
                        </button>
                        <span style={{ fontSize: "14px", color: "#6c757d" }}>
                          {t("common.page")} {currentPage} / {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          style={{
                            padding: "8px 16px",
                            border: "1px solid #dee2e6",
                            borderRadius: "4px",
                            background: currentPage === totalPages ? "#f8f9fa" : "white",
                            cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                            fontSize: "14px"
                          }}
                        >
                          {t("common.next")}
                        </button>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <p style={{ color: "#6c757d", fontStyle: "italic" }}>
                  {t("greenBatch.title2")}
                </p>
              )
            )}
          </div>
        </div>
      </div>

      {showEditForm && (
        <EditBatchForm
          batch={currentBatch}
          onClose={() => setShowEditForm(false)}
          onSuccess={async () => {
            // Refresh batch data after edit
            await fetchBatchDetail();

            if (onRefresh) {
              onRefresh(); // Refresh the main list
            }
          }}
          selectedContext={selectedContext}
        />
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div
          className="gbb_image-modal-overlay"
          onClick={() => setShowImageModal(false)}
        >
          <div className="gbb_image-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gbb_image-modal-header">
              <h3>
                {t("greenBatch.images_with_index", {
                  current: currentImageIndex + 1,
                  total: batchImages.length,
                })}
              </h3>
              <button
                className="gbb_close-modal-btn"
                onClick={() => setShowImageModal(false)}
              >
                ×
              </button>
            </div>
            <div className="gbb_image-modal-content">
              <div className="gbb_image-container">
                <img
                  src={batchImages[currentImageIndex]}
                  alt={`Ảnh lô ${currentImageIndex + 1}`}
                />
              </div>
              {batchImages.length > 1 && (
                <div className="gbb_image-navigation">
                  <button
                    className="gbb_nav-btn gbb_prev-btn"
                    onClick={() =>
                      setCurrentImageIndex((prev) =>
                        prev > 0 ? prev - 1 : batchImages.length - 1
                      )
                    }
                    disabled={batchImages.length <= 1}
                  >
                    ‹
                  </button>
                  <div className="gbb_image-thumbnails">
                    {batchImages.map((image, index) => (
                      <div
                        key={index}
                        className={`gbb_thumbnail ${index === currentImageIndex ? "active" : ""
                          }`}
                        onClick={() => setCurrentImageIndex(index)}
                      >
                        <img src={image} alt={`Thumbnail ${index + 1}`} />
                      </div>
                    ))}
                  </div>
                  <button
                    className="gbb_nav-btn gbb_next-btn"
                    onClick={() =>
                      setCurrentImageIndex((prev) =>
                        prev < batchImages.length - 1 ? prev + 1 : 0
                      )
                    }
                    disabled={batchImages.length <= 1}
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div
          className="gbb_modal-overlay"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="gbb_delete-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="gbb_delete-modal-header">
              <h3>{t("auto.xc_nhn_xa_326")}</h3>
            </div>
            <div className="gbb_delete-modal-body">
              <p>
                {t("auto.bn_c_chc_chn_mun_xa_327")} {t("auto.khng_329")}
              </p>
              {relatedSessions.length > 0 && (
                <div className="gbb_warning-section">
                  <p
                    className="gbb_delete-warning"
                    style={{
                      color: "#d32f2f",
                      fontWeight: "bold",
                      marginTop: "12px",
                    }}
                  >
                    ⚠️ Batch này có liên quan đến các session sau:
                  </p>
                  <ul
                    style={{
                      marginTop: "8px",
                      marginLeft: "20px",
                      color: "#666",
                    }}
                  >
                    {relatedSessions.map((session, index) => (
                      <li key={index}>
                        {getPurposeDisplay(session.purpose) ||
                          session.session_name ||
                          `Session #${session.session_id}`}
                      </li>
                    ))}
                  </ul>
                  <p
                    className="gbb_delete-warning"
                    style={{ marginTop: "8px" }}
                  >
                    {t("greenBatch.deleteBatchConfirmation")}
                  </p>
                </div>
              )}
              {relatedSessions.length === 0 && (
                <p className="gbb_delete-warning">
                  {t("auto.hnh_ng_ny_khng_th_hon_tc_330")}
                </p>
              )}
            </div>
            <div className="gbb_delete-modal-actions">
              <button
                className="gbb_cancel-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                {t("auto.hy_331")}
              </button>
              <button
                className="gbb_delete-btn"
                onClick={async () => {
                  try {
                    // Tìm đúng ID của batch - kiểm tra nhiều field
                    const batchId =
                      currentBatch.uuid ||
                      currentBatch.gb_batch_id ||
                      currentBatch.batch_id ||
                      batch.uuid ||
                      batch.gb_batch_id ||
                      batch.batch_id;

                    if (!batchId) {
                      throw new Error("Không tìm thấy ID của batch");
                    }

                    // Nếu có session liên quan, xóa cả session
                    const deleteRelatedSessions = relatedSessions.length > 0;
                    await batchApi.deleteBatch(batchId, deleteRelatedSessions);

                    // Hiển thị thông báo thành công - sử dụng t() trực tiếp
                    const successModal = document.createElement("div");
                    const successTitle = t("auto._xa_thnh_cng_367");
                    const successMessage = t("auto.l_nhn_xanh_c_xa_368");
                    successModal.innerHTML = `
              <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 9999;">
                <div style="background: white; padding: 24px; border-radius: 8px; text-align: center; max-width: 400px;">
                  <h3 style="color: #28a745; margin: 0 0 16px 0;">${successTitle}</h3>
                  <p style="margin: 0 0 20px 0;">${successMessage}</p>
                  <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">OK</button>
                </div>
              </div>
            `;
                    document.body.appendChild(successModal);

                    // Tự động đóng modal sau 2 giây
                    setTimeout(() => {
                      if (successModal.parentElement) {
                        successModal.remove();
                      }
                    }, 2000);

                    if (onRefresh) onRefresh();
                    onClose();
                  } catch (error) {
                    // Hiển thị thông báo lỗi
                    const errorTitle = t("auto._li_xa_369");
                    const errorModal = document.createElement("div");
                    errorModal.innerHTML = `
              <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 9999;">
                <div style="background: white; padding: 24px; border-radius: 8px; text-align: center; max-width: 400px;">
                  <h3 style="color: #dc3545; margin: 0 0 16px 0;">${errorTitle}</h3>
                  <p style="margin: 0 0 20px 0;">${error.message || "Có lỗi xảy ra khi xóa lô nhân xanh"
                      }</p>
                  <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">OK</button>
                </div>
              </div>
            `;
                    document.body.appendChild(errorModal);
                  }
                  setShowDeleteModal(false);
                  setRelatedSessions([]);
                }}
              >
                {t("auto.xa_332")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchDetail;
