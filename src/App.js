import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './i18n'; // Import i18n configuration
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer/Footer';
import Navigation from './components/Navigation';
import GreenBeans from './pages/GreenBeans';
import GreenBatch from './pages/GreenBatch';
import CuppingSession from './pages/CuppingSession';
import Vendor from './pages/Vendor';
import Warehouse from './pages/Warehouse';
import WarehouseDetail from './pages/Warehouse/WarehouseDetail';
import Login from './pages/Login';
import Organization from './pages/Organization';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import Toast from './components/Toast/Toast';
import ForgotPassword from './pages/ForgotPassword';
import SessionDetail from './components/SessionDetail/SessionDetail';
import CuppingForm from './pages/CuppingForm/CuppingForm';
import DescriptiveScoreCard from './components/DescriptiveScoreCard';
import AffectiveScoreCard from './components/AffectiveScoreCard';
import { affectiveScoreCardApi } from './api/affectiveScoreCardApi';
import GreenBeanDetail from './pages/GreenBeans/GreenBeanDetail';
import BatchDetail from './pages/GreenBatch/BatchDetail';
import VendorDetail from './pages/Vendor/VendorDetail';
import SharedSession from './pages/SharedSession/SharedSession';
import { cuppingSessionApi } from './api/cuppingSessionApi';
import { descriptiveScoreCardApi } from './api/descriptiveScoreCardApi';
import { startTokenCheck, stopTokenCheck, checkTokenAndLogout } from './utils/auth';
import { isAuthenticated, clearAuthData } from './utils/cookieAuth';
import AuthModal from './components/AuthModal';
import { showToast } from './components/Toast/Toast';
import HomePage from './pages/HomePage';

// Hàm băm ID tổ chức để bảo mật
const hashOrgId = (orgId) => {
  return btoa(String(orgId)).replace(/=/g, '');
};

const unhashOrgId = (hashedId) => {
  try {
    return atob(hashedId);
  } catch {
    return null;
  }
};

// Hàm băm ID vendor để bảo mật
const hashVendorId = (vendorId) => {
  return btoa(String(vendorId)).replace(/=/g, '');
};

const unhashVendorId = (hashedId) => {
  if (!hashedId) return null;
  try {
    return atob(hashedId);
  } catch (error) {
    return null;
  }
};

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [isAuth, setIsAuth] = React.useState(null);

  React.useEffect(() => {
    const checkAuth = async () => {
      // Tránh gọi API khi đang ở các trang auth
      const currentPath = location.pathname;
      if (currentPath === '/login' ||
        currentPath === '/register' ||
        currentPath === '/verify-otp' ||
        currentPath === '/forgot-password') {
        setIsAuth(false);
        return;
      }

      const authenticated = await checkTokenAndLogout();
      setIsAuth(authenticated);
    };
    checkAuth();
  }, [location.pathname]);

  if (isAuth === null) {
    return <div>Loading...</div>;
  }

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired
};

const CuppingProtectedRoute = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuth, setIsAuth] = React.useState(null);
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [allowAccess, setAllowAccess] = React.useState(false);
  const [authProcessed, setAuthProcessed] = React.useState(false);

  React.useEffect(() => {
    const checkAuth = async () => {
      // Tránh gọi API khi đang ở các trang auth
      const currentPath = location.pathname;
      if (currentPath === '/login' ||
        currentPath === '/register' ||
        currentPath === '/verify-otp' ||
        currentPath === '/forgot-password') {
        setIsAuth(false);
        setShowAuthModal(true);
        setAllowAccess(false);
        setAuthProcessed(false);
        return;
      }

      const authenticated = await isAuthenticated();
      setIsAuth(authenticated);

      if (authenticated) {
        setAllowAccess(true);
        setShowAuthModal(false);
        setAuthProcessed(true);
      } else {
        setShowAuthModal(true);
        setAllowAccess(false);
        setAuthProcessed(false);
      }
    };
    checkAuth();
  }, [location.pathname]);

  const handleLogin = () => {
    setShowAuthModal(false);
    // Lưu URL hiện tại vào sessionStorage để login biết quay về đâu
    const returnUrl = location.pathname + location.search;

    sessionStorage.setItem('authReturnUrl', returnUrl);

    // Điều hướng đến trang login với state
    navigate('/login', { state: { returnTo: returnUrl } });
  };

  const handleGuest = () => {
    // Clear any existing auth data but don't logout via API
    clearAuthData();
    setIsAuth(false);
    setShowAuthModal(false);
    setAllowAccess(true);
    setAuthProcessed(true);
  };

  if (isAuth === null) {
    return <div>Loading...</div>;
  }

  if (!allowAccess) {
    return (
      <AuthModal
        isOpen={showAuthModal}
        onLogin={handleLogin}
        onGuest={handleGuest}
        onClose={() => {
          setShowAuthModal(false);
          navigate('/');
        }}
      />
    );
  }

  return children;
};

CuppingProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired
};

const SessionDetailPage = ({ selectedContext }) => {
  const { session_id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const response = await cuppingSessionApi.getById(session_id);
      setSession(response.data);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [session_id]);

  if (loading) return <div>Đang tải...</div>;
  if (!session) return <div>Không tìm thấy session</div>;

  return <SessionDetail session={session} onBack={() => navigate('/session')} onRefresh={fetchSession} selectedContext={selectedContext} />;
};

SessionDetailPage.propTypes = {
  selectedContext: PropTypes.object
};

const AffectiveFormPage = ({ standalone = false }) => {
  const { session_id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [affectiveSubmitting, setAffectiveSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const normalizeAffectiveData = (formData) => {
    if (!formData) return {};
    return formData;
  };

  const handleAffectiveSubmit = async ({ allBatchData, cupper_name }) => {
    try {

      setAffectiveSubmitting(true);

      const authStatus = await isAuthenticated();


      let savedCount = 0;
      for (const [batchId, formData] of Object.entries(allBatchData)) {
        if (authStatus) {
          // User đã đăng nhập - dùng API thông thường
          await affectiveScoreCardApi.create({
            session_id: session_id,
            batch_id: batchId,
            form_data: normalizeAffectiveData(formData),
            cupper_name: cupper_name
          });
        } else {
          // Guest - dùng API guest
          await affectiveScoreCardApi.createGuest({
            session_id: session_id,
            batch_id: batchId,
            form_data: normalizeAffectiveData(formData),
            cupper_name: cupper_name
          });
        }
        savedCount++;
      }


      if (!authStatus && standalone) {

        localStorage.setItem('guestCompletedSession', session_id);

        const confirmModal = document.createElement('div');
        confirmModal.innerHTML = `
  <div class="modal-backdrop" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.3); display: flex; justify-content: center; align-items: center; z-index: 10000;">
    <div style="background: white; padding: 30px; border-radius: 12px; text-align: center; max-width: 450px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
      <h3 style="color: #28a745; margin: 0 0 16px 0; font-size: 24px;">
        ${t("descriptiveScoreCard.excellent_title")}
      </h3>
      <p style="margin: 0 0 20px 0; line-height: 1.5; color: #333;">
        ${t("descriptiveScoreCard.create_account_message")}
      </p>
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button class="create-account-btn" style="background: #007bff; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: 500;">
          ${t("descriptiveScoreCard.create_account")}
        </button>
        <button class="skip-btn" style="background: #6c757d; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: 500;">
          ${t("common.skip")}
        </button>
      </div>
    </div>
  </div>
`;

        const createBtn = confirmModal.querySelector('.create-account-btn');
        const skipBtn = confirmModal.querySelector('.skip-btn');
        const backdrop = confirmModal.querySelector('.modal-backdrop');

        createBtn.onclick = (e) => {
          e.stopPropagation();
          window.location.href = `/register?sessionId=${session_id}&returnUrl=${encodeURIComponent(window.location.pathname)}`;
        };

        skipBtn.onclick = (e) => {
          e.stopPropagation();
          confirmModal.remove();
          setIsCompleted(true);
        };

        backdrop.onclick = (e) => {
          if (e.target === backdrop) {
            confirmModal.remove();
            setIsCompleted(true);
          }
        };

        document.body.appendChild(confirmModal);
        return;
      }


      showAffectiveSuccessModal();

    } catch (error) {

      showToast(error.message || 'Lưu Affective Score Card thất bại', 'error');
    } finally {
      setAffectiveSubmitting(false);
    }
  };

  const showAffectiveSuccessModal = () => {
    const modal = document.createElement('div');
    modal.innerHTML = `
  <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 9999;">
    <div style="background: white; padding: 24px; border-radius: 8px; text-align: center; max-width: 400px;">
      <h3 style="color: #28a745; margin: 0 0 16px 0; font-size: 20px;">
        ${t("descriptiveScoreCard.completed_title")}
      </h3>
      <p style="margin: 0 0 20px 0; color: #333;">
        ${t("descriptiveScoreCard.completed_message")}
      </p>
      <button 
        class="ok-btn" 
        style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: 500;"
      >
        ${t("common.ok")}
      </button>
    </div>
  </div>
`;


    const okBtn = modal.querySelector('.ok-btn');
    okBtn.onclick = (e) => {
      e.stopPropagation();
      modal.remove();

      const currentPath = window.location.pathname;
      const prefix = currentPath.startsWith('/org/') ? currentPath.match(/^\/org\/[^\/]+/)[0] : '/personal';
      navigate(`${prefix}/sessionlist/${session_id}`);
    };

    setTimeout(() => {
      if (modal.parentElement) {
        modal.remove();
        const currentPath = window.location.pathname;
        const prefix = currentPath.startsWith('/org/') ? currentPath.match(/^\/org\/[^\/]+/)[0] : '/personal';
        navigate(`${prefix}/sessionlist/${session_id}`);
      }
    }, 3000);

    document.body.appendChild(modal);
  };

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        setLoading(true);

        let sessionInfo;
        try {
          const sessionResponse = await cuppingSessionApi.getById(session_id);
          sessionInfo = sessionResponse.data;
        } catch (error) {
          try {
            const sessionResponse = await cuppingSessionApi.getSessionInfo(session_id);
            sessionInfo = sessionResponse.data;
          } catch (infoError) {

            sessionInfo = null;
          }
        }

        let batchResponse;
        try {
          batchResponse = await cuppingSessionApi.getSessionBatches(session_id);
        } catch (error) {
          try {
            batchResponse = await cuppingSessionApi.getSessionBatchesGuest(session_id);
          } catch (guestError) {

            batchResponse = { data: [] };
          }
        }

        setSessionData({
          sessionId: session_id,
          batches: batchResponse.data || [],
          is_blind_cupping: sessionInfo?.is_blind_cupping || false,
          type_of_session: sessionInfo?.type_of_session,
          is_started: sessionInfo?.is_started,
          is_finished: sessionInfo?.is_finished,
          score_card_format: 'AffectiveScoreCard'
        });
      } catch (error) {

        setSessionData({
          sessionId: session_id,
          batches: [],
          is_blind_cupping: false,
          score_card_format: 'AffectiveScoreCard'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [session_id]);

  if (loading) return <div>Đang tải...</div>;
  if (!sessionData) return <div>Không tìm thấy session</div>;

  const handleBack = standalone ? null : () => {
    const currentPath = window.location.pathname;
    const prefix = currentPath.startsWith('/org/') ? currentPath.match(/^\/org\/[^\/]+/)[0] : '/personal';
    navigate(`${prefix}/sessionlist/${session_id}`);
  };

  return (
    <>
      <AffectiveScoreCard
        sessionData={sessionData}
        onSubmit={handleAffectiveSubmit}
        onCancel={handleBack || (() => navigate(-1))}
        submitting={affectiveSubmitting}
        isGuestCompleted={isCompleted}
      />
      <Toast />
    </>
  );
};

AffectiveFormPage.propTypes = {
  standalone: PropTypes.bool
};

const DescriptiveFormPage = ({ standalone = false }) => {
  const { session_id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [descriptiveSubmitting, setDescriptiveSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const normalizeDescriptiveData = (formData) => {
    if (!formData) return {};
    return formData;
  };

  const handleDescriptiveSubmit = async ({ allBatchData, cupper_name }) => {
    try {

      setDescriptiveSubmitting(true);

      // Kiểm tra xem user có đăng nhập không
      const authStatus = await isAuthenticated();


      let savedCount = 0;
      for (const [batchId, formData] of Object.entries(allBatchData)) {
        if (authStatus) {
          // User đã đăng nhập - dùng API thông thường
          await descriptiveScoreCardApi.create({
            session_id: session_id,
            batch_id: batchId,
            form_data: normalizeDescriptiveData(formData),
            cupper_name: cupper_name
          });
        } else {
          // Guest - dùng API guest
          await descriptiveScoreCardApi.createGuest({
            session_id: session_id,
            batch_id: batchId,
            form_data: normalizeDescriptiveData(formData),
            cupper_name: cupper_name
          });
        }
        savedCount++;
      }


      // Nếu là guest và hoàn thành tất cả, hiển thị modal xác nhận tạo tài khoản
      if (!authStatus && standalone) {

        localStorage.setItem('guestCompletedSession', session_id);

        const confirmModal = document.createElement('div');
        confirmModal.innerHTML = `
        <div class="modal-backdrop" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.3); display: flex; justify-content: center; align-items: center; z-index: 10000;">
          <div style="background: white; padding: 30px; border-radius: 12px; text-align: center; max-width: 450px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
            <h3 style="color: #28a745; margin: 0 0 16px 0; font-size: 24px;">Hoàn thành xuất sắc!</h3>
            <p style="margin: 0 0 20px 0; line-height: 1.5; color: #333;">Bạn vừa hoàn thành chấm điểm. Bạn có muốn tạo tài khoản để lưu kết quả không?</p>
            <div style="display: flex; gap: 12px; justify-content: center;">
              <button class="create-account-btn" style="background: #007bff; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: 500;">Tạo tài khoản</button>
              <button class="skip-btn" style="background: #6c757d; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: 500;">Bỏ qua</button>
            </div>
          </div>
        </div>
      `;

        const createBtn = confirmModal.querySelector('.create-account-btn');
        const skipBtn = confirmModal.querySelector('.skip-btn');
        const backdrop = confirmModal.querySelector('.modal-backdrop');

        createBtn.onclick = (e) => {
          e.stopPropagation();
          window.location.href = `/register?sessionId=${session_id}&returnUrl=${encodeURIComponent(window.location.pathname)}`;
        };

        skipBtn.onclick = (e) => {
          e.stopPropagation();
          confirmModal.remove();
          // Guest chọn bỏ qua - ở lại trang chấm điểm và disable form
          setIsCompleted(true);
        };

        backdrop.onclick = (e) => {
          if (e.target === backdrop) {
            confirmModal.remove();
            // Click backdrop cũng tương đương bỏ qua
            setIsCompleted(true);
          }
        };

        document.body.appendChild(confirmModal);
        return;
      }

      // LUÔN HIỂN THỊ MODAL THÀNH CÔNG CHO TẤT CẢ TRƯỜNG HỢP

      showSuccessModal();

    } catch (error) {

      showToast(error.message || 'Lưu Descriptive Score Card thất bại', 'error');
    } finally {
      setDescriptiveSubmitting(false);
    }
  };

  // THÊM HÀM HIỂN THỊ MODAL THÀNH CÔNG
  const showSuccessModal = () => {
    const modal = document.createElement('div');
    modal.innerHTML = `
    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 9999;">
      <div style="background: white; padding: 24px; border-radius: 8px; text-align: center; max-width: 400px;">
        <h3 style="color: #28a745; margin: 0 0 16px 0; font-size: 20px;">
          ${t('descriptiveScoreCard.success_modal_title')}
        </h3>
        <p style="margin: 0 0 20px 0; color: #333;">
          ${t('descriptiveScoreCard.success_modal_message')}
        </p>
        <button 
          class="ok-btn" 
          style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: 500;"
        >
          ${t('descriptiveScoreCard.success_modal_ok')}
        </button>
      </div>
    </div>
  `;

    // Xử lý sự kiện cho nút OK
    const okBtn = modal.querySelector('.ok-btn');
    okBtn.onclick = (e) => {
      e.stopPropagation();
      modal.remove();

      // QUAN TRỌNG: Trở về trang detail session GIỐNG CUPPING FORM
      const currentPath = window.location.pathname;
      const prefix = currentPath.startsWith('/org/') ? currentPath.match(/^\/org\/[^\/]+/)[0] : '/personal';
      navigate(`${prefix}/sessionlist/${session_id}`);
    };

    // Tự động đóng và trở về trang detail sau 3 giây
    setTimeout(() => {
      if (modal.parentElement) {
        modal.remove();
        const currentPath = window.location.pathname;
        const prefix = currentPath.startsWith('/org/') ? currentPath.match(/^\/org\/[^\/]+/)[0] : '/personal';
        navigate(`${prefix}/sessionlist/${session_id}`);
      }
    }, 3000);

    document.body.appendChild(modal);
  };

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        setLoading(true);

        // Lấy thông tin session trước - thử cả auth và guest API
        let sessionInfo;
        try {
          const sessionResponse = await cuppingSessionApi.getById(session_id);
          sessionInfo = sessionResponse.data;
        } catch (error) {
          // Nếu lỗi auth, thử dùng getSessionInfo (không cần auth)
          try {
            const sessionResponse = await cuppingSessionApi.getSessionInfo(session_id);
            sessionInfo = sessionResponse.data;
          } catch (infoError) {

            sessionInfo = null;
          }
        }

        // Lấy thông tin batches - thử cả guest và auth API
        let batchResponse;
        try {
          batchResponse = await cuppingSessionApi.getSessionBatches(session_id);
        } catch (error) {
          // Nếu lỗi auth, thử dùng guest API
          try {
            batchResponse = await cuppingSessionApi.getSessionBatchesGuest(session_id);
          } catch (guestError) {

            batchResponse = { data: [] };
          }
        }

        setSessionData({
          sessionId: session_id,
          batches: batchResponse.data || [],
          is_blind_cupping: sessionInfo?.is_blind_cupping || false,
          type_of_session: sessionInfo?.type_of_session,
          is_started: sessionInfo?.is_started,
          is_finished: sessionInfo?.is_finished,
          score_card_format: 'DescriptiveScoreCard'
        });
      } catch (error) {

        setSessionData({
          sessionId: session_id,
          batches: [],
          is_blind_cupping: false,
          score_card_format: 'DescriptiveScoreCard'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [session_id]);

  if (loading) return <div>Loading...</div>;
  if (!sessionData) return <div>session not found</div>;

  const handleBack = standalone ? null : () => {
    const currentPath = window.location.pathname;
    const prefix = currentPath.startsWith('/org/') ? currentPath.match(/^\/org\/[^\/]+/)[0] : '/personal';
    navigate(`${prefix}/sessionlist/${session_id}`);
  };

  return (
    <>
      <DescriptiveScoreCard
        sessionData={sessionData}
        onSubmit={handleDescriptiveSubmit}
        onCancel={handleBack || (() => navigate(-1))}
        submitting={descriptiveSubmitting}
        isGuestCompleted={isCompleted}
      />
      <Toast />
    </>
  );
};

DescriptiveFormPage.propTypes = {
  standalone: PropTypes.bool
};

const CuppingFormPage = ({ standalone = false }) => {
  const { session_id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [descriptiveSubmitting, setDescriptiveSubmitting] = useState(false);

  const normalizeDescriptiveData = (formData) => {
    if (!formData) return {};
    return formData;
  };

  const handleDescriptiveSubmit = async ({ allBatchData, cupper_name }) => {
    try {
      setDescriptiveSubmitting(true);

      // Kiểm tra xem user có đăng nhập không
      const authStatus = await isAuthenticated();

      let savedCount = 0;
      for (const [batchId, formData] of Object.entries(allBatchData)) {
        if (authStatus) {
          // User đã đăng nhập - dùng API thông thường
          await descriptiveScoreCardApi.create({
            session_id: session_id,
            batch_id: batchId,
            form_data: normalizeDescriptiveData(formData),
            cupper_name: cupper_name
          });
        } else {
          // Guest - dùng API guest
          await descriptiveScoreCardApi.createGuest({
            session_id: session_id,
            batch_id: batchId,
            form_data: normalizeDescriptiveData(formData),
            cupper_name: cupper_name
          });
        }
        savedCount++;
      }

      // HIỂN THỊ MODAL THÀNH CÔNG THAY VÌ CHỈ TOAST
      showSuccessModal();
    } catch (error) {
      showToast(error.message || 'Lưu Descriptive Score Card thất bại', 'error');
    } finally {
      setDescriptiveSubmitting(false);
    }
  };

  // THÊM HÀM HIỂN THỊ MODAL THÀNH CÔNG
  const showSuccessModal = () => {
    const modal = document.createElement('div');
    modal.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 9999;">
        <div style="background: white; padding: 24px; border-radius: 8px; text-align: center; max-width: 400px;">
          <h3 style="color: #28a745; margin: 0 0 16px 0; font-size: 20px;">
            ${t('descriptiveScoreCard.success_modal_title')}
          </h3>
          <p style="margin: 0 0 20px 0; color: #333;">
            ${t('descriptiveScoreCard.success_modal_message')}
          </p>
          <button 
            class="ok-btn" 
            style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: 500;"
          >
            ${t('descriptiveScoreCard.success_modal_ok')}
          </button>
        </div>
      </div>
    `;

    // Xử lý sự kiện cho nút OK
    const okBtn = modal.querySelector('.ok-btn');
    okBtn.onclick = (e) => {
      e.stopPropagation();
      modal.remove();

      // Trở về trang detail session
      if (standalone) {
        navigate(-1);
      } else {
        const currentPath = window.location.pathname;
        const prefix = currentPath.startsWith('/org/') ? currentPath.match(/^\/org\/[^\/]+/)[0] : '/personal';
        navigate(`${prefix}/sessionlist/${session_id}`);
      }
    };

    // Tự động đóng và trở về trang detail sau 3 giây
    setTimeout(() => {
      if (modal.parentElement) {
        modal.remove();
        if (standalone) {
          navigate(-1);
        } else {
          const currentPath = window.location.pathname;
          const prefix = currentPath.startsWith('/org/') ? currentPath.match(/^\/org\/[^\/]+/)[0] : '/personal';
          navigate(`${prefix}/sessionlist/${session_id}`);
        }
      }
    }, 3000);

    document.body.appendChild(modal);
  };

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        setLoading(true);

        // Lấy thông tin session trước - thử cả auth và guest API
        let sessionInfo;
        try {
          const sessionResponse = await cuppingSessionApi.getById(session_id);
          sessionInfo = sessionResponse.data;
        } catch (error) {
          // Nếu lỗi auth, thử dùng getSessionInfo (không cần auth)
          try {
            const sessionResponse = await cuppingSessionApi.getSessionInfo(session_id);
            sessionInfo = sessionResponse.data;
          } catch (infoError) {

            sessionInfo = null;
          }
        }

        // Lấy thông tin batches - thử cả guest và auth API
        let batchResponse;
        try {
          batchResponse = await cuppingSessionApi.getSessionBatches(session_id);
        } catch (error) {
          // Nếu lỗi auth, thử dùng guest API
          try {
            batchResponse = await cuppingSessionApi.getSessionBatchesGuest(session_id);
          } catch (guestError) {

            batchResponse = { data: [] };
          }
        }

        setSessionData({
          sessionId: session_id,
          batches: batchResponse.data || [],
          is_blind_cupping: sessionInfo?.is_blind_cupping || false,
          type_of_session: sessionInfo?.type_of_session,
          is_started: sessionInfo?.is_started,
          is_finished: sessionInfo?.is_finished,
          score_card_format: sessionInfo?.score_card_format || 'SCA'
        });
      } catch (error) {

        setSessionData({
          sessionId: session_id,
          batches: [],
          is_blind_cupping: false,
          score_card_format: 'SCA'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [session_id]);

  if (loading) return <div>Đang tải...</div>;
  if (!sessionData) return <div>Không tìm thấy session</div>;

  const handleBack = standalone ? null : () => {
    const currentPath = window.location.pathname;
    const prefix = currentPath.startsWith('/org/') ? currentPath.match(/^\/org\/[^\/]+/)[0] : '/personal';
    navigate(`${prefix}/sessionlist/${session_id}`);
  };

  if (sessionData.score_card_format === 'DescriptiveScoreCard' || sessionData.score_card_format === 'descriptive') {
    return (
      <>
        <DescriptiveScoreCard
          sessionData={sessionData}
          onSubmit={handleDescriptiveSubmit}
          onCancel={handleBack || (() => navigate(-1))}
          submitting={descriptiveSubmitting}
        />
        <Toast />
      </>
    );
  }

  if (sessionData.score_card_format === 'AffectiveScoreCard' || sessionData.score_card_format === 'affective') {
    return (
      <>
        <AffectiveScoreCard
          sessionData={sessionData}
          onSubmit={handleDescriptiveSubmit}
          onCancel={handleBack || (() => navigate(-1))}
          submitting={descriptiveSubmitting}
        />
        <Toast />
      </>
    );
  }

  return (
    <>
      <CuppingForm sessionData={sessionData} onBack={handleBack} />
      <Toast />
    </>
  );
};

CuppingFormPage.propTypes = {
  standalone: PropTypes.bool
};

// Tạo LoginWrapper để xử lý redirect sau login
const LoginWrapper = () => {

  const handleLoginSuccess = () => {
    // Start token checking after successful login
    startTokenCheck();

    // QUAN TRỌNG: Lấy return URL từ nhiều nguồn
    let returnUrl = null;

    // 1. Từ location state (khi chuyển từ CuppingProtectedRoute)
    const getReturnUrlFromSession = () => {
      const url = sessionStorage.getItem('authReturnUrl');
      sessionStorage.removeItem('authReturnUrl');
      return url;
    };
    
    const getReturnUrlFromQuery = () => {
      const params = new URLSearchParams(window.location.search);
      return params.get('returnUrl');
    };
    
    returnUrl =
      returnUrl ||
      getReturnUrlFromSession() ||
      getReturnUrlFromQuery();

    // Redirect về trang cũ
    if (returnUrl) {

      // Dùng window.location.href để reload toàn bộ trang với auth mới
      window.location.href = returnUrl;
    } else {

      window.location.href = '/gblist';
    }
  };

  return <Login onLoginSuccess={handleLoginSuccess} />;
};

// ... các component khác giữ nguyên ...

const GreenBeanDetailPage = () => {
  const { green_bean_id } = useParams();
  const navigate = useNavigate();
  return <GreenBeanDetail greenbeanId={green_bean_id} onBack={() => navigate('/gblist')} />;
};

const BatchDetailPage = ({ selectedContext }) => {
  const { green_bean_batch_id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBatch = async () => {
      try {
        setLoading(true);
        const { batchApi } = await import('./api/batchApi');
        const response = await batchApi.getBatchById(green_bean_batch_id);
        setBatch(response.data);
      } catch (error) {

      } finally {
        setLoading(false);
      }
    };
    fetchBatch();
  }, [green_bean_batch_id]);

  const handleClose = () => {
    // Nếu đến từ vendor detail thì quay lại vendor, ngược lại quay về batch list
    if (location.state?.fromVendor) {
      navigate(-1); // Quay lại trang trước
    } else {
      navigate('/gbblist');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!batch) return <div>No batch found</div>;

  return <BatchDetail batch={batch} onClose={handleClose} selectedContext={selectedContext} />;
};

BatchDetailPage.propTypes = {
  selectedContext: PropTypes.object
};

const VendorDetailPage = ({ selectedContext }) => {
  const { vendor_id } = useParams();
  const navigate = useNavigate();

  const handleBack = () => {
    const prefix = selectedContext?.type === 'organization'
      ? `/org/${hashOrgId(selectedContext.uuid)}`
      : '/personal';
    navigate(`${prefix}/vendor`);
  };

  const handleBatchClick = (batchId) => {
    const prefix = selectedContext?.type === 'organization'
      ? `/org/${hashOrgId(selectedContext.uuid)}`
      : '/personal';
    navigate(`${prefix}/gbblist/${batchId}`, { state: { fromVendor: true } });
  };

  return <VendorDetail
    vendorId={unhashVendorId(vendor_id)}
    onBack={handleBack}
    onBatchClick={handleBatchClick}
    selectedContext={selectedContext}
  />;
};

VendorDetailPage.propTypes = {
  selectedContext: PropTypes.shape({
    type: PropTypes.string,
    uuid: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  })
};

const HeaderOnlyLayout = ({ children, selectedContext }) => {
  return (
    <div className="App">
      <Header selectedContext={selectedContext} />
      <div className="App-content">{children}</div>
      <Footer />
      <Toast />
    </div>
  );
};

HeaderOnlyLayout.propTypes = {
  children: PropTypes.node.isRequired,
  selectedContext: PropTypes.shape({
    type: PropTypes.string,
    uuid: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  })
};

const MainLayout = ({ children, selectedContext, onContextSelect, disableOrgSwitch }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('gblist');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [orgSwitchDisabled, setOrgSwitchDisabled] = useState(disableOrgSwitch || false);

  useEffect(() => {
    setOrgSwitchDisabled(disableOrgSwitch || false);
  }, [disableOrgSwitch]);

  // Kiểm tra xem có đang ở trang chi tiết không
  const isDetailPage = () => {
    const path = location.pathname;
    return path.includes('/sessionlist/') ||
      path.includes('/gblist/') ||
      path.includes('/gbblist/') ||
      path.includes('/vendorlist/');
  };

  // Kiểm tra xem có đang mở form không
  useEffect(() => {
    const checkFormOpen = () => {
      // Kiểm tra các form đang mở bằng cách tìm các element form trong DOM
      const hasAddGreenBeanForm = document.querySelector('.gb_add-greenbean-form');
      const hasCreateBatchForm = document.querySelector('.gbb_batch-form');
      const hasCreateCuppingSession = document.querySelector('.create-session-form');
      const hasAddVendorForm = document.querySelector('.vendor-add-form');

      setIsFormOpen(!!(hasAddGreenBeanForm || hasCreateBatchForm || hasCreateCuppingSession || hasAddVendorForm));
    };

    // Kiểm tra ngay lập tức
    checkFormOpen();

    // Thiết lập MutationObserver để theo dõi thay đổi DOM
    const observer = new MutationObserver(checkFormOpen);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [location.pathname]);

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/gblist')) setActiveTab('gblist');
    else if (path.includes('/gbblist')) setActiveTab('gbblist');
    else if (path.includes('/session')) setActiveTab('session');
    else if (path.includes('/vendor')) setActiveTab('vendor');
    else if (path.includes('/warehouse')) setActiveTab('warehouse');
    else if (path.includes('/organization')) setActiveTab('organization');
  }, [location]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const prefix = selectedContext?.type === 'organization'
      ? `/org/${hashOrgId(selectedContext.uuid)}`
      : '/personal';
    navigate(`${prefix}/${tab}`);
  };

  // Redirect khi chuyển context (chỉ khi selectedContext thay đổi thực sự)
  useEffect(() => {
    if (selectedContext) {
      const currentPath = location.pathname;
      const isOrgPath = currentPath.startsWith('/org/');
      const isPersonalPath = currentPath.startsWith('/personal/');
      const shouldBeOrgPath = selectedContext.type === 'organization';

      // Chỉ redirect khi có sự không khớp thực sự
      if (shouldBeOrgPath && !isOrgPath && isPersonalPath) {
        // Chuyển từ cá nhân sang tổ chức
        const pathWithoutPrefix = currentPath.replace(/^\/personal/, '');
        navigate(`/org/${hashOrgId(selectedContext.uuid)}${pathWithoutPrefix || '/gblist'}`);
      } else if (!shouldBeOrgPath && isOrgPath && !isPersonalPath) {
        // Chuyển từ tổ chức sang cá nhân
        const pathWithoutPrefix = currentPath.replace(/^\/org\/[^\/]+/, '');
        navigate(`/personal${pathWithoutPrefix || '/gblist'}`);
      }
    }
  }, [selectedContext]);

  const isOrganizationPage = location.pathname.includes('/organization');

  if (isOrganizationPage) {
    return (
      <div className="App">
        <Header selectedContext={selectedContext} />
        <div className="App-content">{children}</div>
        <Footer />
        <Toast />
      </div>
    );
  }

  return (
    <div className="App">
      <Header selectedContext={selectedContext} disableOrgSwitch={orgSwitchDisabled} />
      <Navigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        selectedContext={selectedContext}
        onContextSelect={onContextSelect}
        isDetailPage={isDetailPage()}
        isFormOpen={isFormOpen}
        disableOrgSwitch={orgSwitchDisabled}
      />
      <div className="App-content">
        {React.cloneElement(children, { onDisableOrgSwitch: setOrgSwitchDisabled })}
      </div>
      <Footer />
      <Toast />
    </div>
  );
};

MainLayout.propTypes = {
  children: PropTypes.node.isRequired,
  selectedContext: PropTypes.shape({
    type: PropTypes.string,
    uuid: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }),
  onContextSelect: PropTypes.func
};

function App() {
  const [selectedContext, setSelectedContext] = useState(null);

  useEffect(() => {
    const shouldSkipContext = (path) => {
      return path.startsWith('/shared/') ||
        path === '/login' ||
        path === '/register' ||
        path === '/verify-otp' ||
        path === '/forgot-password';
    };

    const restoreFromLocalStorage = () => {
      const savedContext = localStorage.getItem('selectedContext');
      if (!savedContext) return false;

      try {
        setSelectedContext(JSON.parse(savedContext));
        return true;
      } catch (error) {
        return false;
      }
    };

    const restoreOrgContext = async (orgId, isUserAuthenticated) => {
      setSelectedContext({ type: 'organization', uuid: orgId, name: 'Tổ chức' });

      if (!isUserAuthenticated) return;

      try {
        const { organizationApi } = await import('./api/organizationApi');
        const userOrgsResponse = await organizationApi.getUserOrganizations();
        const currentOrg = userOrgsResponse.find(org => org.organization_id == orgId);

        if (currentOrg) {
          setSelectedContext({
            type: 'organization',
            uuid: orgId,
            name: currentOrg.org_name,
            role: currentOrg.role_name
          });
        }
      } catch (error) {
        // Error fetching organization info
      }
    };

    const restorePersonalContext = async (isUserAuthenticated) => {
      setSelectedContext({ type: 'personal', name: 'Cá nhân' });

      if (!isUserAuthenticated) return;

      try {
        const { userApi } = await import('./api/userApi');
        const response = await userApi.getCurrentUser();
        setSelectedContext({
          type: 'personal',
          name: 'Cá nhân',
          user: response
        });
      } catch (error) {
        // Error fetching user info
      }
    };

    const restoreContext = async () => {
      const currentPath = window.location.pathname;

      if (shouldSkipContext(currentPath)) return;
      if (restoreFromLocalStorage()) return;

      const isUserAuthenticated = await isAuthenticated();
      const orgMatch = currentPath.match(/^\/org\/([^\/]+)/);

      if (orgMatch) {
        const orgId = unhashOrgId(orgMatch[1]);
        if (orgId) {
          await restoreOrgContext(orgId, isUserAuthenticated);
        }
      } else if (currentPath.startsWith('/personal/')) {
        await restorePersonalContext(isUserAuthenticated);
      }
    };

    restoreContext();

    // Start token checking when app loads (chỉ khi không phải shared route hoặc auth routes)
    const checkAuth = async () => {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/shared/') &&
        currentPath !== '/login' &&
        currentPath !== '/register' &&
        currentPath !== '/verify-otp' &&
        currentPath !== '/forgot-password' &&
        await isAuthenticated()) {
        startTokenCheck();
      }
    };
    checkAuth();

    // Cleanup on unmount
    return () => {
      stopTokenCheck();
    };
  }, []);

  const handleContextSelect = async (context) => {
    setSelectedContext(context);
    localStorage.setItem('selectedContext', JSON.stringify(context));
    const { refreshUserPermissions } = await import('./utils/permissions');
    const organizationId = context?.type === 'organization' ? context.uuid : 'personal';
    await refreshUserPermissions(organizationId);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* QUAN TRỌNG: Sử dụng LoginWrapper thay vì Login trực tiếp */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginWrapper />} />

        <Route path="/register" element={<><Register onRegisterSuccess={() => window.location.href = '/verify-otp'} /><Toast /></>} />
        <Route path="/verify-otp" element={<><VerifyOTP /><Toast /></>} />
        <Route path="/forgot-password" element={<><ForgotPassword /><Toast /></>} />

        {/* Route chia sẻ - không cần authentication */}
        <Route path="/shared/:sessionBatchId" element={<><SharedSession /><Toast /></>} />

        {/* <Route path="/" element={<Navigate to="/personal/gblist" replace />} /> */}

        {/* Redirect routes cũ sang personal */}
        <Route path="/organization" element={<Navigate to="/personal/organization" replace />} />
        <Route path="/gblist" element={<Navigate to="/personal/gblist" replace />} />
        <Route path="/gbblist" element={<Navigate to="/personal/gbblist" replace />} />
        <Route path="/session" element={<Navigate to="/personal/session" replace />} />
        <Route path="/vendor" element={<Navigate to="/personal/vendor" replace />} />
        <Route path="/warehouse" element={<Navigate to="/personal/warehouse" replace />} />

        {/* Routes cá nhân */}
        <Route path="/personal/session" element={<ProtectedRoute><MainLayout selectedContext={selectedContext} onContextSelect={handleContextSelect}><CuppingSession selectedContext={selectedContext} /></MainLayout></ProtectedRoute>} />
        <Route path="/personal/sessionlist/:session_id" element={<ProtectedRoute><MainLayout selectedContext={selectedContext} onContextSelect={handleContextSelect}><SessionDetailPage selectedContext={selectedContext} /></MainLayout></ProtectedRoute>} />

        {/* QUAN TRỌNG: Cả hai route đều dùng CuppingProtectedRoute GIỐNG NHAU */}
        <Route path="/personal/sessionlist/:session_id/cupping_scorecard" element={<CuppingProtectedRoute><CuppingFormPage standalone={true} /></CuppingProtectedRoute>} />
        <Route path="/personal/sessionlist/:session_id/descriptive_scorecard" element={<CuppingProtectedRoute><DescriptiveFormPage standalone={true} /></CuppingProtectedRoute>} />
        <Route path="/personal/sessionlist/:session_id/affective_scorecard" element={<CuppingProtectedRoute><AffectiveFormPage standalone={true} /></CuppingProtectedRoute>} />
        <Route path="/personal/sessionlist/:session_id/affective_score_card" element={<CuppingProtectedRoute><AffectiveFormPage standalone={true} /></CuppingProtectedRoute>} />

        <Route path="/personal/sessionlist/:session_id/cupping_score_card" element={<ProtectedRoute><MainLayout selectedContext={selectedContext} onContextSelect={handleContextSelect}><CuppingFormPage /></MainLayout></ProtectedRoute>} />
        <Route path="/personal/gbblist" element={<ProtectedRoute><MainLayout selectedContext={selectedContext} onContextSelect={handleContextSelect}><GreenBatch selectedContext={selectedContext} /></MainLayout></ProtectedRoute>} />
        <Route path="/personal/gbblist/:green_bean_batch_id" element={<ProtectedRoute><MainLayout selectedContext={selectedContext} onContextSelect={handleContextSelect}><BatchDetailPage selectedContext={selectedContext} /></MainLayout></ProtectedRoute>} />
        <Route path="/personal/gblist" element={<ProtectedRoute><MainLayout selectedContext={selectedContext} onContextSelect={handleContextSelect}><GreenBeans selectedContext={selectedContext} /></MainLayout></ProtectedRoute>} />
        <Route path="/personal/gblist/:green_bean_id" element={<ProtectedRoute><MainLayout selectedContext={selectedContext} onContextSelect={handleContextSelect}><GreenBeanDetailPage /></MainLayout></ProtectedRoute>} />
        <Route path="/personal/vendor" element={<ProtectedRoute><MainLayout selectedContext={selectedContext} onContextSelect={handleContextSelect}><Vendor selectedContext={selectedContext} /></MainLayout></ProtectedRoute>} />
        <Route path="/personal/vendorlist/:vendor_id" element={<ProtectedRoute><MainLayout selectedContext={selectedContext} onContextSelect={handleContextSelect}><VendorDetailPage selectedContext={selectedContext} /></MainLayout></ProtectedRoute>} />
        <Route path="/personal/warehouse" element={<ProtectedRoute><MainLayout selectedContext={selectedContext} onContextSelect={handleContextSelect}><Warehouse selectedContext={selectedContext} /></MainLayout></ProtectedRoute>} />
        <Route path="/personal/warehouse/:ticket_id" element={<ProtectedRoute><MainLayout selectedContext={selectedContext} onContextSelect={handleContextSelect} disableOrgSwitch={true}><WarehouseDetail selectedContext={selectedContext} /></MainLayout></ProtectedRoute>} />
        <Route path="/personal/organization" element={<ProtectedRoute><MainLayout selectedContext={selectedContext} onContextSelect={handleContextSelect}><Organization /></MainLayout></ProtectedRoute>} />
        <Route path="/personal/organization/:org_id" element={<ProtectedRoute><MainLayout selectedContext={selectedContext} onContextSelect={handleContextSelect}><Organization /></MainLayout></ProtectedRoute>} />

        {/* Routes tổ chức */}
        <Route path="/org/:org_id/session" element={<ProtectedRoute><MainLayout selectedContext={selectedContext} onContextSelect={handleContextSelect}><CuppingSession selectedContext={selectedContext} /></MainLayout></ProtectedRoute>} />
        <Route path="/org/:org_id/sessionlist/:session_id" element={<ProtectedRoute><MainLayout selectedContext={selectedContext} onContextSelect={handleContextSelect}><SessionDetailPage selectedContext={selectedContext} /></MainLayout></ProtectedRoute>} />

        {/* QUAN TRỌNG: Cả hai route đều dùng CuppingProtectedRoute GIỐNG NHAU */}
        <Route path="/org/:org_id/sessionlist/:session_id/cupping_scorecard" element={<CuppingProtectedRoute><CuppingFormPage standalone={true} /></CuppingProtectedRoute>} />
        <Route path="/org/:org_id/sessionlist/:session_id/descriptive_scorecard" element={<CuppingProtectedRoute><DescriptiveFormPage standalone={true} /></CuppingProtectedRoute>} />
        <Route path="/org/:org_id/sessionlist/:session_id/affective_scorecard" element={<CuppingProtectedRoute><AffectiveFormPage standalone={true} /></CuppingProtectedRoute>} />
        <Route path="/org/:org_id/sessionlist/:session_id/affective_score_card" element={<CuppingProtectedRoute><AffectiveFormPage standalone={true} /></CuppingProtectedRoute>} />

        <Route path="/org/:org_id/sessionlist/:session_id/cupping_score_card" element={<ProtectedRoute><MainLayout selectedContext={selectedContext} onContextSelect={handleContextSelect}><CuppingFormPage /></MainLayout></ProtectedRoute>} />
        <Route path="/org/:org_id/gbblist" element={<ProtectedRoute><MainLayout selectedContext={selectedContext} onContextSelect={handleContextSelect}><GreenBatch selectedContext={selectedContext} /></MainLayout></ProtectedRoute>} />
        <Route path="/org/:org_id/gbblist/:green_bean_batch_id" element={<ProtectedRoute><MainLayout selectedContext={selectedContext} onContextSelect={handleContextSelect}><BatchDetailPage selectedContext={selectedContext} /></MainLayout></ProtectedRoute>} />
        <Route path="/org/:org_id/gblist" element={<ProtectedRoute><MainLayout selectedContext={selectedContext} onContextSelect={handleContextSelect}><GreenBeans selectedContext={selectedContext} /></MainLayout></ProtectedRoute>} />
        <Route path="/org/:org_id/gblist/:green_bean_id" element={<ProtectedRoute><MainLayout selectedContext={selectedContext} onContextSelect={handleContextSelect}><GreenBeanDetailPage /></MainLayout></ProtectedRoute>} />
        <Route path="/org/:org_id/vendor" element={<ProtectedRoute><MainLayout selectedContext={selectedContext} onContextSelect={handleContextSelect}><Vendor selectedContext={selectedContext} /></MainLayout></ProtectedRoute>} />
        <Route path="/org/:org_id/vendorlist/:vendor_id" element={<ProtectedRoute><MainLayout selectedContext={selectedContext} onContextSelect={handleContextSelect}><VendorDetailPage selectedContext={selectedContext} /></MainLayout></ProtectedRoute>} />
        <Route path="/org/:org_id/warehouse" element={<ProtectedRoute><MainLayout selectedContext={selectedContext} onContextSelect={handleContextSelect}><Warehouse selectedContext={selectedContext} /></MainLayout></ProtectedRoute>} />
        <Route path="/org/:org_id/warehouse/:ticket_id" element={<ProtectedRoute><MainLayout selectedContext={selectedContext} onContextSelect={handleContextSelect} disableOrgSwitch={true}><WarehouseDetail selectedContext={selectedContext} /></MainLayout></ProtectedRoute>} />
        <Route path="/org/:org_id/organization" element={<ProtectedRoute><MainLayout selectedContext={selectedContext} onContextSelect={handleContextSelect}><Organization /></MainLayout></ProtectedRoute>} />
        <Route path="/org/:org_id/organization/:detail_org_id" element={<ProtectedRoute><MainLayout selectedContext={selectedContext} onContextSelect={handleContextSelect}><Organization /></MainLayout></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;