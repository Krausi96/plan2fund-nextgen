import { useState, useEffect, useRef, useCallback } from 'react';

export type EditorPosition = {
  top: number;
  left: number;
  placement: 'right' | 'below';
  visible: boolean;
};

// Responsive panel sizing - optimized for chat and editing
const getEditorWidth = () => {
  if (typeof window === 'undefined') return 320;
  if (window.innerWidth > 1400) return 340; // Large screens
  if (window.innerWidth > 1000) return 320; // Medium screens
  if (window.innerWidth > 768) return 300;  // Small screens
  return Math.min(window.innerWidth - 32, 300); // Mobile
};

const getEditorHeight = () => {
  if (typeof window === 'undefined') return 500;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const maxHeight = Math.min(vh * 0.7, 500); // Max 70% of viewport or 500px
  if (window.innerWidth > 1400) return maxHeight; // Large screens
  if (window.innerWidth > 1000) return Math.min(maxHeight, 480); // Medium screens
  if (window.innerWidth > 768) return Math.min(maxHeight, 450);  // Small screens
  return Math.min(vh * 0.75, 450); // Mobile (75vh max)
};

const EDITOR_WIDTH = 320;
const EDITOR_MAX_HEIGHT = 500;
const GAP = 24;

export interface PanelDimensions {
  width: number;
  height: number;
}

/**
 * Hook for managing SectionEditor position and dimensions
 */
export function useSectionEditorPosition(sectionId: string | null) {
  const [position, setPosition] = useState<EditorPosition>(() => ({
    top: 24,
    left: typeof window !== 'undefined' ? window.innerWidth - EDITOR_WIDTH - GAP : 0,
    placement: 'right',
    visible: true // ALWAYS start visible - show welcome state if no sectionId
  }));

  const positionUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Responsive panel dimensions
  const [panelDimensions, setPanelDimensions] = useState<PanelDimensions>(() => ({ 
    width: typeof window !== 'undefined' ? getEditorWidth() : EDITOR_WIDTH, 
    height: typeof window !== 'undefined' ? getEditorHeight() : EDITOR_MAX_HEIGHT 
  }));

  // Update panel dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      setPanelDimensions({ width: getEditorWidth(), height: getEditorHeight() });
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Smart positioning: Relative to preview container, align with active section when possible
  const calculatePosition = useCallback(() => {
    const isDesktop = window.innerWidth > 768;
    const currentWidth = panelDimensions.width;
    const currentHeight = panelDimensions.height;
    
    // Default: right edge of preview, center-bottom
    let top = typeof window !== 'undefined' 
      ? window.innerHeight - currentHeight - GAP 
      : GAP;
    let left = typeof window !== 'undefined' 
      ? window.innerWidth - currentWidth - GAP
      : GAP;
    
    // Position panel at right edge of viewport (not relative to preview)
    left = typeof window !== 'undefined' 
      ? window.innerWidth - currentWidth - GAP
      : GAP;
    
    // Try to position relative to preview container for vertical alignment
    const previewContainer = document.getElementById('preview-container');
    if (previewContainer) {
      const previewRect = previewContainer.getBoundingClientRect();
      
      // Try to align with active section if visible
      if (sectionId) {
        const activeSection = document.querySelector(`[data-section-id="${sectionId}"]`) as HTMLElement;
        if (activeSection) {
          const sectionRect = activeSection.getBoundingClientRect();
          // Check if section is visible in preview
          if (sectionRect.top >= previewRect.top && sectionRect.top < previewRect.bottom) {
            // Align panel top with section top (relative to viewport)
            top = sectionRect.top + GAP;
            // Ensure panel doesn't go below viewport
            if (top + currentHeight > window.innerHeight - GAP) {
              top = window.innerHeight - currentHeight - GAP;
            }
          }
        }
      }
      
      // If section not visible or not found, use center-bottom of preview
      if (top === window.innerHeight - currentHeight - GAP) {
        top = previewRect.top + (previewRect.height / 2) - (currentHeight / 2);
        // Clamp to preview bounds
        top = Math.max(previewRect.top + GAP, Math.min(top, previewRect.bottom - currentHeight - GAP));
      }
    }
    
    // Try to load saved position from localStorage (only if user has moved it)
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('inline-editor-position');
        if (saved) {
          const parsed = JSON.parse(saved);
          // Only use saved position if it's significantly different from default (user moved it)
          const defaultLeft = previewContainer 
            ? previewContainer.getBoundingClientRect().right - currentWidth - GAP
            : (window.innerWidth - currentWidth) / 2;
          const defaultTop = window.innerHeight - currentHeight - GAP;
          const diffX = Math.abs(parsed.left - defaultLeft);
          const diffY = Math.abs(parsed.top - defaultTop);
          
          // If user moved it more than 50px, use saved position
          if ((diffX > 50 || diffY > 50) && 
              parsed.top >= 0 && parsed.top < window.innerHeight && 
              parsed.left >= 0 && parsed.left < window.innerWidth) {
            top = parsed.top;
            left = parsed.left;
          }
        }
      } catch (_e) {
        // Ignore localStorage errors
      }
    }
    
    // Ensure editor stays within viewport
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
    
    left = Math.max(GAP, Math.min(left, viewportWidth - currentWidth - GAP));
    top = Math.max(GAP, Math.min(top, viewportHeight - currentHeight - GAP));
    
    // ALWAYS set visible to true - component should always be visible when plan exists
    setPosition({
      top: Math.max(0, top),
      left: Math.max(0, left),
      placement: isDesktop ? 'right' : 'below',
      visible: true // ALWAYS visible when plan exists
    });
  }, [sectionId, panelDimensions]);

  // Update position on mount, section change, resize, and dimension changes
  useEffect(() => {
    // IMMEDIATELY set visible - component should always be visible when plan exists
    setPosition(prev => ({
      ...prev,
      visible: true, // ALWAYS visible
      top: prev.top || 24,
      left: prev.left || (typeof window !== 'undefined' ? window.innerWidth - panelDimensions.width - GAP : 0)
    }));

    // Calculate position once after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      calculatePosition();
    }, 150);

    // Only listen to resize events (sidebar position doesn't change on scroll)
    const handleResize = () => {
      if (positionUpdateTimeoutRef.current) {
        clearTimeout(positionUpdateTimeoutRef.current);
      }
      positionUpdateTimeoutRef.current = setTimeout(() => {
        calculatePosition();
      }, 100);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timeoutId);
      if (positionUpdateTimeoutRef.current) {
        clearTimeout(positionUpdateTimeoutRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [sectionId, calculatePosition, panelDimensions.width]);

  // Ensure editor is visible when plan exists
  useEffect(() => {
    // ALWAYS visible - show welcome state if sectionId is null, editor if sectionId exists
    setPosition(prev => ({ ...prev, visible: true }));
  }, [sectionId]);

  // Save position to localStorage
  const savePosition = useCallback((pos: EditorPosition) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('inline-editor-position', JSON.stringify({
          left: pos.left,
          top: pos.top
        }));
      } catch (_e) {
        // Ignore localStorage errors
      }
    }
  }, []);

  return {
    position,
    setPosition,
    panelDimensions,
    savePosition,
    EDITOR_WIDTH,
    EDITOR_MAX_HEIGHT,
    GAP
  };
}

