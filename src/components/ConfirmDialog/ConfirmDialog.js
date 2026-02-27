import React from 'react';
import { useTranslation } from 'react-i18next';
import './ConfirmDialog.css';

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="confirm-overlay">
      <div className="confirm-dialog">
        <div className="confirm-header">
          <h3>{title}</h3>
        </div>
        <div className="confirm-body">
          <p>{message}</p>
        </div>
        <div className="confirm-actions">
          <button className="btn-cancel" onClick={onCancel}>{t('auto.khng_49')}</button>
          <button className="btn-confirm" onClick={onConfirm}>{t('auto.c_50')}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;