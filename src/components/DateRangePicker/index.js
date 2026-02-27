import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCalendarAlt } from 'react-icons/fa';
import './DateRangePicker.css';

const DateRangePicker = ({ startDate, endDate, onChange, onDateChange, placeholder = "Chọn khoảng thời gian" }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(startDate || '');
  const [tempEndDate, setTempEndDate] = useState(endDate || '');
  const containerRef = useRef(null);
  const startInputRef = useRef(null);
  const endInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const formatDateRange = () => {
    if (startDate && endDate) {
      const startStr = formatDateTimeVN(startDate);
      const endStr = formatDateTimeVN(endDate);
      return `${startStr} - ${endStr}`;
    }
    return '';
  };

  const applyDateRange = (start, end) => {
    if (start && end) {
      if (new Date(start) > new Date(end)) {
        alert('Thời gian bắt đầu không được sau thời gian kết thúc!');
        return;
      }
      const callback = onDateChange || onChange;
      if (callback) {
        callback(start, end);
      }
      setIsOpen(false);
    }
  };

  const handleStartDateClick = () => {
    if (startInputRef.current) {
      // iOS compatibility: focus instead of showPicker
      if (typeof startInputRef.current.showPicker === 'function') {
        try {
          startInputRef.current.showPicker();
        } catch (e) {
          startInputRef.current.focus();
        }
      } else {
        startInputRef.current.focus();
      }
    }
  };

  const handleEndDateClick = () => {
    if (endInputRef.current) {
      // iOS compatibility: focus instead of showPicker
      if (typeof endInputRef.current.showPicker === 'function') {
        try {
          endInputRef.current.showPicker();
        } catch (e) {
          endInputRef.current.focus();
        }
      } else {
        endInputRef.current.focus();
      }
    }
  };

  return (
    <div className="date-range-picker" ref={containerRef}>
      <div
        className="date-range-input"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={formatDateRange() ? 'selected' : 'placeholder'}>
          {formatDateRange() || placeholder}
        </span>
        <FaCalendarAlt className="calendar-icon" />
      </div>

      {isOpen && (
        <div className="date-range-dropdown">
          <div className="date-inputs">
            <div className="date-input-group">
              <label>{t('auto.t_ngy_102')}</label>
              <div className="datetime-wrapper">
                <div className="datetime-display" onClick={handleStartDateClick}>
                  {tempStartDate ? formatDateTimeVN(tempStartDate) : t('auto.chon_tg')}
                  <FaCalendarAlt className="datetime-icon-right" />
                </div>
                <input
                  ref={startInputRef}
                  type="datetime-local"
                  value={tempStartDate}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setTempStartDate(newStart);
                    if (newStart && tempEndDate) {
                      applyDateRange(newStart, tempEndDate);
                    }
                  }}
                  className="datetime-input-hidden"
                />
              </div>
            </div>
            <div className="date-input-group">
              <label>{t('auto.n_ngy_103')}</label>
              <div className="datetime-wrapper">
                <div className="datetime-display" onClick={handleEndDateClick}>
                  {tempEndDate ? formatDateTimeVN(tempEndDate) : t('auto.chon_tg')}
                  <FaCalendarAlt className="datetime-icon-right" />
                </div>
                <input
                  ref={endInputRef}
                  type="datetime-local"
                  value={tempEndDate}
                  onChange={(e) => {
                    const newEnd = e.target.value;
                    setTempEndDate(newEnd);
                    if (tempStartDate && newEnd) {
                      applyDateRange(tempStartDate, newEnd);
                    }
                  }}
                  className="datetime-input-hidden"
                />
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default DateRangePicker;