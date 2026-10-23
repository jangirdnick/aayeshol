'use client';

import * as React from 'react';
import { SIDEBAR_COLLAPSE_STORAGE_KEY } from '../constants/navigation.constants';

/**
 * Custom hook to manage and persist sidebar collapsed state across page reloads.
 */
export function useSidebarCollapse() {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Restore collapsed preference from localStorage on client mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSE_STORAGE_KEY);
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch {
      // Ignore localStorage read errors in private browsing modes
    }
  }, []);

  const toggleCollapse = React.useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSE_STORAGE_KEY, String(next));
      } catch {
        // Ignore localStorage write errors
      }
      return next;
    });
  }, []);

  return {
    isCollapsed,
    setIsCollapsed,
    toggleCollapse,
  };
}
