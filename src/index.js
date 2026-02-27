import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import './i18n'; // Import i18n để khởi tạo trước khi render
import { setupErrorFiltering, setupGlobalErrorHandler } from './utils/errorHandler';

// Thiết lập xử lý lỗi để ẩn các lỗi không mong muốn
setupErrorFiltering();
setupGlobalErrorHandler();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <App />
);

// If you want to start measuring performance in your app, pass a function
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
