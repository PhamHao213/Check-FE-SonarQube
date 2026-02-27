import React from 'react';
import './ResponsiveWrapper.css';

const ResponsiveWrapper = ({ 
  children, 
  className = '', 
  maxWidth = '1200px',
  padding = 'responsive',
  background = 'white',
  shadow = true,
  rounded = true
}) => {
  const wrapperClasses = [
    'responsive-wrapper',
    className,
    padding === 'responsive' ? 'responsive-padding' : '',
    background === 'white' ? 'bg-white' : '',
    background === 'gray' ? 'bg-gray' : '',
    shadow ? 'with-shadow' : '',
    rounded ? 'rounded' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className="responsive-container">
      <div 
        className={wrapperClasses}
        style={{ maxWidth }}
      >
        {children}
      </div>
    </div>
  );
};

export default ResponsiveWrapper;