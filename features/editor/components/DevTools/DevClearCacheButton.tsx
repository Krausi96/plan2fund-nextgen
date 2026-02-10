import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/shared/components/ui/button';
import { useUser } from '@/platform/core/context/hooks/useUser';
import { useProject } from '@/platform/core/context/hooks/useProject';
import { clearSelectedProgram } from '@/shared/user/storage/planStore';

/**
 * Dev-only button to clear all cache and reset user state
 * Only visible in development mode
 */
export default function DevClearCacheButton() {
  const { setUserProfile } = useUser();
  const resetAll = useProject((state) => state.resetAll);
  const [isClearing, setIsClearing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClearCache = () => {
    if (!confirm('Clear all cache and reset to new user? This will reload the page.')) {
      return;
    }

    setIsClearing(true);

    try {
      // Reset project store state (replaces old editor store reset)
      resetAll();

      // Clear user profile
      setUserProfile(null);

      // Clear program selection
      clearSelectedProgram();

      // Clear all localStorage items
      const localStorageKeys = [
        'pf_user_profile',
        'userPlans',
        'userRecommendations',
        'pf_clients',
        'selectedProgram',
        'inline-editor-position'
      ];

      localStorageKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn(`Failed to clear ${key}:`, e);
        }
      });

      // Clear all sessionStorage items
      const sessionStorageKeys = [
        'plan2fund-desktop-doc-selection'
      ];

      sessionStorageKeys.forEach(key => {
        try {
          sessionStorage.removeItem(key);
        } catch (e) {
          console.warn(`Failed to clear sessionStorage ${key}:`, e);
        }
      });

      // Clear any other editor-related storage
      try {
        // Clear any other localStorage items that might be editor-related
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('plan2fund-') || key.startsWith('editor-')) {
            localStorage.removeItem(key);
          }
        });
      } catch (e) {
        console.warn('Failed to clear editor-related storage:', e);
      }

      // Clear URL query parameters (programId, etc.)
      if (typeof window !== 'undefined' && window.location.search) {
        const url = new URL(window.location.href);
        url.search = ''; // Remove all query parameters
        window.history.replaceState({}, '', url.toString());
      }

      console.log('✅ Cache cleared! Reloading page...');
      
      // Reload page after a short delay to ensure cleanup completes
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('Error clearing cache:', error);
      setIsClearing(false);
      alert('Error clearing cache. Check console for details.');
    }
  };

  // Only show in development - check both NODE_ENV and window location
  const isDev = typeof window !== 'undefined' && (
    process.env.NODE_ENV !== 'production' || 
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('localhost')
  );

  if (!isDev || !mounted) {
    return null;
  }

  const buttonContent = (
    <div 
      className="pointer-events-auto" 
      style={{ 
        position: 'fixed',
        top: '80px',
        right: '16px',
        zIndex: 99999,
        pointerEvents: 'auto'
      }}
    >
      <Button
        onClick={handleClearCache}
        disabled={isClearing}
        variant="danger"
        size="sm"
        className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 shadow-lg border-2 border-red-400 font-semibold"
        title="Dev: Clear all cache and reset to new user"
        style={{
          pointerEvents: 'auto',
          cursor: isClearing ? 'wait' : 'pointer'
        }}
      >
        {isClearing ? 'Clearing...' : '🧹 Clear Cache'}
      </Button>
    </div>
  );

  // Use portal to render at document body level to ensure it's always visible
  if (typeof window !== 'undefined' && document.body) {
    return createPortal(buttonContent, document.body);
  }

  return buttonContent;
}

