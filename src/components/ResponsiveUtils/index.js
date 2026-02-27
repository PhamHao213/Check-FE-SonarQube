import React from 'react';
import useResponsive from '../../hooks/useResponsive';

// Component để hiển thị content chỉ trên mobile
export const MobileOnly = ({ children }) => {
  const { isMobile } = useResponsive();
  return isMobile ? children : null;
};

// Component để hiển thị content chỉ trên tablet
export const TabletOnly = ({ children }) => {
  const { isTablet } = useResponsive();
  return isTablet ? children : null;
};

// Component để hiển thị content chỉ trên desktop
export const DesktopOnly = ({ children }) => {
  const { isDesktop } = useResponsive();
  return isDesktop ? children : null;
};

// Component để hiển thị content trên mobile và tablet
export const MobileAndTablet = ({ children }) => {
  const { isMobileOrTablet } = useResponsive();
  return isMobileOrTablet ? children : null;
};

// Component để ẩn content trên mobile
export const HideMobile = ({ children }) => {
  const { isMobile } = useResponsive();
  return !isMobile ? children : null;
};

// Component để ẩn content trên desktop
export const HideDesktop = ({ children }) => {
  const { isDesktop } = useResponsive();
  return !isDesktop ? children : null;
};

// Component responsive với breakpoint tùy chỉnh
export const ResponsiveShow = ({ children, breakpoint, condition = 'min' }) => {
  const { isMinBreakpoint, isMaxBreakpoint, isBreakpoint } = useResponsive();
  
  let shouldShow = false;
  
  if (condition === 'min') {
    shouldShow = isMinBreakpoint(breakpoint);
  } else if (condition === 'max') {
    shouldShow = isMaxBreakpoint(breakpoint);
  } else if (condition === 'only') {
    shouldShow = isBreakpoint(breakpoint);
  }
  
  return shouldShow ? children : null;
};

// Component để render content khác nhau dựa trên screen size
export const ResponsiveRender = ({ mobile, tablet, desktop }) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  if (isMobile && mobile) return mobile;
  if (isTablet && tablet) return tablet;
  if (isDesktop && desktop) return desktop;
  
  // Fallback
  return mobile || tablet || desktop || null;
};