import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './styles.css';
import backgroundImage from '../../assets/background.png';

const HomePage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after component mounts
    setIsVisible(true);
  }, []);

  const handleStart = () => {
    setIsLoading(true);
    setTimeout(() => {
      navigate('/login');
    }, 500);
  };

  const toggleLanguage = () => {
    const newLang = currentLang === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
    setCurrentLang(newLang);
  };

  return (
    <div className="homepage" style={{ backgroundImage: `url(${backgroundImage})` }}>
      {isLoading && (
        <div className="homepage__loading-overlay">
          <div className="homepage__loading-spinner"></div>
        </div>
      )}
      
      {/* Animated background overlay */}
      <div className="homepage__animated-overlay"></div>
      
      <header className={`homepage__header ${isVisible ? 'slide-down' : ''}`}>
        <div className="homepage__logo-container">
          <img src="/logo.png" alt="WeSlurp Logo" className="homepage__logo-icon pulse-animation" />
          <h1 className="homepage__brand-title gradient-text">WeSlurp</h1>
        </div>
        <div className="homepage__header-actions">
          <span className="homepage__language-switcher hover-scale" onClick={toggleLanguage} style={{ cursor: 'pointer' }}>
            {currentLang === 'vi' ? 'EN' : 'VN'}
          </span>
          <button className="homepage__start-btn pulse-button" onClick={handleStart}>
            {currentLang === 'vi' ? 'Bắt đầu' : 'Start'}
          </button>
        </div>
      </header>

      <main className="homepage__main-content">
        <div className={`homepage__hero-logo ${isVisible ? 'zoom-in' : ''}`}>
          <img src="/logo.png" alt="WeSlurp" className="homepage__hero-logo-image floating-animation" />
        </div>

        <h2 className={`homepage__hero-title ${isVisible ? 'fade-in-up' : ''}`}>
          {t('home page.coffee cupping management platform directly on the Website')}
        </h2>

        <p className={`homepage__hero-description ${isVisible ? 'fade-in-up delay-1' : ''}`}>
          {t('home page.optimized for mobile devices, allowing you to score cups right at the tasting table. WeSlurp lets you record, store, and compare cupping results anywhere, from anyone, with just your phone.')}
        </p>
        
        {/* Decorative coffee bean animation */}
        <div className="homepage__decorative-beans">
          <div className="homepage__bean homepage__bean--1"></div>
          <div className="homepage__bean homepage__bean--2"></div>
          <div className="homepage__bean homepage__bean--3"></div>
        </div>
      </main>

      <footer className={`homepage__footer ${isVisible ? 'fade-in' : ''}`}>
        © 2026 by <span className="homepage__company-name hover-glow">LiberRain Coffee</span>
      </footer>
    </div>
  );
};

export default HomePage;