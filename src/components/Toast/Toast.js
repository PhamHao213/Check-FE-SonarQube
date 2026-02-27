import React, { useState, useEffect } from 'react';
import './Toast.css';

let showToastFunction = null;

export const showToast = (message, type = 'info') => {
  if (showToastFunction) {
    showToastFunction(message, type);
  }
};

const Toast = () => {
  const [toasts, setToasts] = useState([]);

  const removeToastById = (uuid) => {
    setToasts(prev => prev.filter(toast => toast.uuid !== uuid));
  };

  const addToast = (message, type) => {
    const uuid = Date.now();
    const newToast = { uuid, message, type };
    setToasts(prev => [...prev, newToast]);
    setTimeout(removeToastById, 4000, uuid);
  };

  useEffect(() => {
    showToastFunction = addToast;
    
    return () => {
      showToastFunction = null;
    };
  }, []);

  const removeToast = (uuid) => {
    setToasts(prev => prev.filter(toast => toast.uuid !== uuid));
  };

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div 
          key={toast.uuid} 
          className={`toast toast-${toast.type}`}
          onClick={() => removeToast(toast.uuid)}
        >
          <span className="toast-message">{toast.message}</span>
          <button className="toast-close" onClick={() => removeToast(toast.uuid)}>×</button>
        </div>
      ))}
    </div>
  );
};

export default Toast;