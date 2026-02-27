import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './SuccessModal.css';

const SuccessModal = ({ isOpen, onClose, sessionId, sessionName, onStartSession }) => {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);
    const [isStarting, setIsStarting] = useState(false);

    if (!isOpen) return null;

    const sessionUrl = `${window.location.origin}/personal/sessionlist/${sessionId}/cupping_scorecard`;

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(sessionUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            const textArea = document.createElement('textarea');
            textArea.value = sessionUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleStartSession = async () => {
        if (isStarting) return;
        setIsStarting(true);
        try {
            await onStartSession(sessionId);
            onClose();
        } catch (error) {
            // console.error('Error starting session:', error);
        } finally {
            setIsStarting(false);
        }
    };

    return (
        <div className="lbr-success-modal-overlay" onClick={onClose}>
            <div className="lbr-success-modal" onClick={(e) => e.stopPropagation()}>
                <button className="lbr-success-modal-close" onClick={onClose}>
                    ×
                </button>

                <h2 className="lbr-success-modal-title">{t('auto.to_phin_thnh_cn_256')}</h2>

                <p className="lbr-success-modal-message">{t('auto.phin_th_nm_257')}<strong>"{sessionName}"</strong>{t('auto._c_to_thnh_cng__258')}</p>

                <div className="lbr-success-modal-link-section">
                    <label className="lbr-success-modal-link-label">{t('auto.link_chia_s_259')}</label>
                    <div className="lbr-success-modal-link-container">
                        <input
                            type="text"
                            value={sessionUrl}
                            readOnly
                            className="lbr-success-modal-link-input"
                            onClick={(e) => e.target.select()}
                        />
                        <button
                            className="lbr-success-modal-copy-button"
                            onClick={copyToClipboard}
                        >
                            {copied ? t('auto.copied') : t('auto.copy')}
                        </button>
                    </div>
                </div>

                <div className="lbr-success-modal-actions">
                    {onStartSession && (
                        <button
                            className="lbr-success-modal-start-button"
                            onClick={handleStartSession}
                            disabled={isStarting}
                        >
                            {isStarting ? t('auto.starting_session') : t('auto.start_session')}
                        </button>
                    )}
                    <button className="lbr-success-modal-ok-button" onClick={onClose}>{t('auto.ng_260')}</button>
                </div>
            </div>
        </div>
    );
};

export default SuccessModal;