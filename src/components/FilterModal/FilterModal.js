import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './FilterModal.css';
import { FaTimes, FaFilter } from 'react-icons/fa';
import DateRangePicker from '../DateRangePicker';

const FilterModal = ({ isOpen, onClose, onApply, initialFilters = {}, filterType = 'session', greenBeans = [], origins = {}, batches = [] }) => {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const getInitialFilters = () => {
    if (filterType === 'warehouse') {
      return {
        startDate: '',
        endDate: '',
        ticketType: '',
        ...initialFilters
      };
    } else if (filterType === 'greenbean') {
      return {
        startDate: '',
        endDate: '',
        variety: '',
        varietyType: '',
        cropYear: '',
        country: '',
        ...initialFilters
      };
    } else if (filterType === 'batch') {
      return {
        startDate: '',
        endDate: '',
        sampleType: '',
        greenbeanName: '',
        size: '',
        ...initialFilters
      };
    }
    return {
      startDate: '',
      endDate: '',
      purpose: '',
      sessionType: '',
      sessionStatus: '',
      greenbeanName: '',
      variety: '',
      varietyType: '',
      country: '',
      ...initialFilters
    };
  };

  const [filters, setFilters] = useState(getInitialFilters());

  useEffect(() => {
    if (isOpen) {
      setFilters(getInitialFilters());
    }
  }, [isOpen, initialFilters, filterType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (name === 'country' && value.length > 0) {
      const countryList = ['Brazil', 'Ethiopia', 'Colombia', 'Kenya', 'Guatemala', 'Vietnam', 'Costa Rica', 'Panama', 'Jamaica', 'Honduras', 'Peru', 'Ecuador', 'Bolivia', 'Nicaragua', 'El Salvador', 'Mexico', 'Indonesia', 'India', 'Yemen', 'Rwanda', 'Burundi', 'Tanzania', 'Uganda', 'Papua New Guinea', 'Hawaii', 'Puerto Rico', 'Thái Lan'];
      const filtered = countryList.filter(country => 
        country.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else if (name === 'country') {
      setShowSuggestions(false);
    }
  };

  const handleDateChange = (startDate, endDate) => {
    setFilters(prev => ({
      ...prev,
      startDate,
      endDate
    }));
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = getInitialFilters();
    Object.keys(resetFilters).forEach(key => {
      resetFilters[key] = '';
    });
    setFilters(resetFilters);
  };



  if (!isOpen) return null;

  return (
    <div className="filter-modal-overlay">
      <div className="filter-modal">
        <div className="filter-modal-header">
          <h3><FaFilter />{t('auto.b_lc_nng_cao_128')}</h3>
          <button className="filter-modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="filter-modal-content">
          <div className="filter-group">
            <label>{t('auto.khong_thi_gian_129')}</label>
            <DateRangePicker
              startDate={filters.startDate}
              endDate={filters.endDate}
              onChange={handleDateChange}
              placeholder={t('auto.chn_khong_thi_g_155')}
            />
          </div>

          {filterType === 'warehouse' && (
            <div className="filter-group">
              <label>{t('warehouse.type')}</label>
              <select name="ticketType" value={filters.ticketType} onChange={handleChange}>
                <option value="">{t('warehouse.allTypes')}</option>
                <option value="import">{t('warehouse.import1')}</option>
                <option value="export">{t('warehouse.export1')}</option>
              </select>
            </div>
          )}

          {filterType === 'session' && (
            <>
              <div className="filter-row">
                <div className="filter-group">
                  <label>{t('auto.mc_ch_130')}</label>
                  <select name="purpose" value={filters.purpose} onChange={handleChange}>
                    <option value="">{t('auto.tt_c_mc_ch_131')}</option>
                    <option value="Check new green bean quality">{t('auto.kim_tra_cht_lng_58')}</option>
                    <option value="Check green bean quality">{t('auto.kim_tra_cht_lng_59')}</option>
                    <option value="Check roast batch quality">{t('auto.kim_tra_cht_lng_60')}</option>
                    <option value="Check finished product quality">{t('auto.kim_tra_cht_lng_61')}</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>{t('auto.loi_phin_135')}</label>
                  <select name="sessionType" value={filters.sessionType} onChange={handleChange}>
                    <option value="">{t('auto.tt_c_loi_136')}</option>
                    <option value="open">{t('auto.m_137')}</option>
                    <option value="close">{t('auto.ng_138')}</option>
                  </select>
                </div>
              </div>

              <div className="filter-row">
                <div className="filter-group">
                  <label>{t('auto.ging_141')}</label>
                  <select name="variety" value={filters.variety} onChange={handleChange}>
                    <option value="">{t('auto.tt_c_ging_142')}</option>
                    <option value="Arabica">Arabica</option>
                    <option value="Robusta">Robusta</option>
                    <option value="Liberica">Liberica</option>
                  </select>
                </div>

                <div className="filter-group" style={{position: 'relative'}}>
                  <label>{t('auto.quc_gia_142')}</label>
                  <input
                    type="text"
                    name="country"
                    value={filters.country}
                    onChange={handleChange}
                    placeholder={t('auto.tt_c_quc_gia_143')}
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      zIndex: 1000,
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}>
                      {suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderBottom: index < suggestions.length - 1 ? '1px solid #eee' : 'none'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                          onClick={() => {
                            setFilters(prev => ({...prev, country: suggestion}));
                            setShowSuggestions(false);
                          }}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="filter-group">
                <label>{t('cuppingSession.sessionStatusFilter')}</label>
                <select name="sessionStatus" value={filters.sessionStatus} onChange={handleChange}>
                  <option value="">{t('cuppingSession.allStatuses')}</option>
                  <option value="upcoming">{t('cuppingSession.upcoming')}</option>
                  <option value="ongoing">{t('cuppingSession.ongoing')}</option>
                  <option value="completed">{t('cuppingSession.completed')}</option>
                </select>
              </div>
            </>
          )}

          {filterType === 'batch' && (
            <>
              <div className="filter-row">
                <div className="filter-group">
                  <label>{t('auto.loi_mu_145')}</label>
                  <select name="sampleType" value={filters.sampleType} onChange={handleChange}>
                    <option value="">{t('auto.tt_c_146')}</option>
                    <option value="sample">{t('auto.mu_th_147')}</option>
                    <option value="material">{t('auto.nguyn_liu_148')}</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>{t('auto.kch_thc_149')}</label>
                  <input
                    type="text"
                    name="size"
                    value={filters.size}
                    onChange={handleChange}
                    placeholder={t('auto.nhp_kch_thc_156')}
                  />
                </div>
              </div>

              <div className="filter-group">
                <label>{t('auto.tn_nhn_xanh_150')}</label>
                <input
                  type="text"
                  name="greenbeanName"
                  value={filters.greenbeanName}
                  onChange={handleChange}
                  placeholder={t('auto.nhp_tn_nhn_xanh_157')}
                />
              </div>
            </>
          )}

          {filterType === 'greenbean' && (
            <>
              <div className="filter-row">
                <div className="filter-group">
                  <label>{t('auto.ging_140')}</label>
                  <select name="variety" value={filters.variety} onChange={handleChange}>
                    <option value="">{t('auto.tt_c_chi_141')}</option>
                    <option value="Arabica">Arabica</option>
                    <option value="Robusta">Robusta</option>
                    <option value="Liberica">Liberica</option>
                  </select>
                </div>

                <div className="filter-group" style={{position: 'relative'}}>
                  <label>{t('auto.quc_gia_142')}</label>
                  <input
                    type="text"
                    name="country"
                    value={filters.country}
                    onChange={handleChange}
                    placeholder={t('auto.tt_c_quc_gia_143')}
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      zIndex: 1000,
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}>
                      {suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderBottom: index < suggestions.length - 1 ? '1px solid #eee' : 'none'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                          onClick={() => {
                            setFilters(prev => ({...prev, country: suggestion}));
                            setShowSuggestions(false);
                          }}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="filter-group">
                <label>{t('auto.ma_v_151')}</label>
                <input
                  type="number"
                  name="cropYear"
                  value={filters.cropYear}
                  onChange={handleChange}
                  placeholder={t('auto.nhp_ma_v_v_d_20_158')}
                  max={new Date().getFullYear()}
                />
              </div>
            </>
          )}
        </div>

        <div className="filter-modal-actions">
          <button className="filter-reset-btn" onClick={handleReset}>{t('auto.t_li_153')}</button>
          <button className="filter-apply-btn" onClick={handleApply}>{t('auto.p_dng_154')}</button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;