import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="app-footer">
      <span>© {new Date().getFullYear()} by <strong>LibeRain Coffee</strong></span>
    </footer>
  );
};

export default Footer;