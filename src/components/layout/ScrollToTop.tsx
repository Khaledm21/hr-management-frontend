import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Automatically scrolls the window and all main content containers to the top
 * whenever the route or search params change, ensuring pages always open from the top.
 */
export const ScrollToTop: React.FC = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // 1. Instant window and document scroll to top
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' as ScrollBehavior,
    });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // 2. Reset any main content element scroll
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.scrollTop = 0;
    }

    // 3. Reset any scrollable content container outside sidebar
    const scrollContainers = document.querySelectorAll('.overflow-y-auto, .overflow-y-scroll');
    scrollContainers.forEach(container => {
      if (!container.closest('aside')) {
        container.scrollTop = 0;
      }
    });

    // 4. Secondary check on next frame for async rendered components
    const rafId = requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });

    return () => cancelAnimationFrame(rafId);
  }, [pathname, search]);

  return null;
};
