import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { cuppingSessionApi } from '../../api/cuppingSessionApi';
import './SharedSession.css';

const SharedSession = () => {
  const { t } = useTranslation();
  const { sessionBatchId } = useParams();
  const [sharedData, setSharedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mapping purpose từ tiếng Anh sang tiếng Việt
  const purposeMap = {
    'Check new green bean quality': t('auto.kim_tra_cht_lng_58'),
    'Check green bean quality': t('auto.kim_tra_cht_lng_59'),
    'Check roast batch quality': t('auto.kim_tra_cht_lng_60'),
    'Check finished product quality': t('auto.kim_tra_cht_lng_61'),
  };

  useEffect(() => {
    const fetchSharedData = async () => {
      try {
        setLoading(true);
        const response = await cuppingSessionApi.getSharedSessionData(sessionBatchId);
        setSharedData(response.data);
        
        // Lưu session_id vào localStorage để dùng khi đăng ký
        if (response.data?.session?.uuid) {
          localStorage.setItem('guest_session_id', response.data.session.uuid);
        }
      } catch (error) {
        
        setError('Không thể tải dữ liệu chia sẻ');
      } finally {
        setLoading(false);
      }
    };

    if (sessionBatchId) {
      fetchSharedData();
    }
  }, [sessionBatchId]);

  if (loading) {
    return (
      <div className="shared-session-loading">
        <div className="loading-spinner"></div>
        <p>{t('auto.ang_ti_d_liu_420')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shared-session-error">
        <h2>{t('auto.li_421')}</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!sharedData) {
    return (
      <div className="shared-session-error">
        <h2>{t('auto.khng_tm_thy_d_l_422')}</h2>
        <p>{t('auto.d_liu_chia_s_kh_423')}</p>
      </div>
    );
  }

  const { session, batch, greenbean } = sharedData;

  return (
    <div className="shared-session-container">
      <div className="shared-session-header">
        <h1>{t('auto.d_liu_chia_s_ch_424')}</h1>
        <div className="header-actions">
          <div className="read-only-badge">{t('auto.ch_xem_425')}</div>
          <button 
            className="register-btn"
            onClick={() => window.location.href = '/register'}
          >{t('auto.ng_k_tham_gia_426')}</button>
        </div>
      </div>

      <div className="shared-session-content">
        {/* Session Info */}
        <div className="info-section">
          <h2>{t('auto.thng_tin_sessio_427')}</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>{t('auto.mc_ch_428')}</label>
              <span>{purposeMap[session.purpose] || session.purpose || 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>{t('auto.m_t_429')}</label>
              <span>{session.description || 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>{t('auto.loi_session_430')}</label>
              <span>{session.type_of_session === 'open' ? 'Công khai' : 'Riêng tư'}</span>
            </div>
            <div className="info-item">
              <label>{t('auto.trng_thi_431')}</label>
              <span className={`status ${session.is_finished ? 'finished' : session.is_started ? 'active' : 'pending'}`}>
                {session.is_finished ? 'Đã kết thúc' : session.is_started ? 'Đang tiến hành' : 'Chưa bắt đầu'}
              </span>
            </div>
            <div className="info-item">
              <label>{t('auto.ngy_to_432')}</label>
              <span>{new Date(session.created_dt).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        </div>

        {/* Batch Info */}
        <div className="info-section">
          <h2>{t('auto.thng_tin_batch_433')}</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>{t('auto.batch_id_434')}</label>
              <span>{batch.batch_id}</span>
            </div>
            <div className="info-item">
              <label>{t('auto.s_lng_mu_435')}</label>
              <span>{batch.number_of_sample_cup}</span>
            </div>
            <div className="info-item">
              <label>{t('auto._m_436')}</label>
              <span>{batch.moisture ? `${batch.moisture}%` : 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>{t('auto.kch_thc_437')}</label>
              <span>{batch.size || 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>{t('auto.mt__438')}</label>
              <span>{batch.density ? `${batch.density} g/ml` : 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>{t('auto.nh_cung_cp_439')}</label>
              <span>{batch.vendor_name}</span>
            </div>
            <div className="info-item">
              <label>{t('auto.ngy_to_batch_440')}</label>
              <span>{batch.batch_created_dt ? new Date(batch.batch_created_dt).toLocaleDateString('vi-VN') : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Green Bean Info */}
        <div className="info-section">
          <h2>{t('auto.thng_tin_green__441')}</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>{t('auto.tn_442')}</label>
              <span>{greenbean.green_bean_name}</span>
            </div>
            <div className="info-item">
              <label>{t('auto.ging_443')}</label>
              <span>{greenbean.variety}</span>
            </div>
            <div className="info-item">
              <label>{t('auto.loi_ging_444')}</label>
              <span>{greenbean.variety_type}</span>
            </div>
            <div className="info-item">
              <label>{t('auto.phng_php_x_l_445')}</label>
              <span>{greenbean.processing}</span>
            </div>
            <div className="info-item">
              <label>{t('auto.quc_gia_446')}</label>
              <span>{greenbean.origin_country}</span>
            </div>
            <div className="info-item">
              <label>{t('auto.vng_447')}</label>
              <span>{greenbean.region}</span>
            </div>
            <div className="info-item">
              <label>{t('auto._cao_448')}</label>
              <span>{greenbean.altitude ? `${greenbean.altitude}m` : 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>{t('auto.nm_thu_hoch_449')}</label>
              <span>{greenbean.crop_year || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedSession;