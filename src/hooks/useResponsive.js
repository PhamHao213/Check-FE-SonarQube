import { useState, useEffect } from 'react';

const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const [breakpoint, setBreakpoint] = useState('desktop');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({ width, height });

      // Determine breakpoint
      if (width <= 480) {
        setBreakpoint('mobile');
      } else if (width <= 768) {
        setBreakpoint('tablet');
      } else if (width <= 1024) {
        setBreakpoint('desktop-sm');
      } else if (width <= 1200) {
        setBreakpoint('desktop');
      } else {
        setBreakpoint('desktop-lg');
      }
    };

    // Set initial breakpoint
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';
  const isDesktop = ['desktop-sm', 'desktop', 'desktop-lg'].includes(breakpoint);
  const isMobileOrTablet = isMobile || isTablet;

  return {
    screenSize,
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isMobileOrTablet,
    // Utility functions
    isBreakpoint: (bp) => breakpoint === bp,
    isMinBreakpoint: (bp) => {
      const breakpoints = ['mobile', 'tablet', 'desktop-sm', 'desktop', 'desktop-lg'];
      const currentIndex = breakpoints.indexOf(breakpoint);
      const targetIndex = breakpoints.indexOf(bp);
      return currentIndex >= targetIndex;
    },
    isMaxBreakpoint: (bp) => {
      const breakpoints = ['mobile', 'tablet', 'desktop-sm', 'desktop', 'desktop-lg'];
      const currentIndex = breakpoints.indexOf(breakpoint);
      const targetIndex = breakpoints.indexOf(bp);
      return currentIndex <= targetIndex;
    }
  };
};

export default useResponsive;