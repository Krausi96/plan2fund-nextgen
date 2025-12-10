import { useEffect, useState } from 'react';

/**
 * Hook to calculate overlay position for configurator
 * Covers CurrentSelection, DocumentsBar, and top of Sidebar
 */
export function useConfiguratorOverlayPosition(
  isExpanded: boolean,
  containerRef: React.RefObject<HTMLDivElement | null>,
  overlayContainerRef?: React.RefObject<HTMLDivElement | null>
) {
  const [overlayPosition, setOverlayPosition] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useEffect(() => {
    if (!isExpanded || !containerRef.current || !overlayContainerRef?.current) {
      setOverlayPosition(null);
      return;
    }

    const updatePosition = () => {
      if (!containerRef.current || !overlayContainerRef?.current) return;
      
      const gridRect = overlayContainerRef.current.getBoundingClientRect();
      
      // Start from top-left of grid (where CurrentSelection starts)
      const left = gridRect.left;
      const top = gridRect.top;
      
      // Width: covers CurrentSelection (320px) + DocumentsBar (remaining width) = full grid width
      const width = gridRect.width;
      
      // Height: Use a fixed height range for the overlay
      const minOverlayHeight = 600;
      const maxOverlayHeight = 800;
      const preferredHeight = gridRect.height * 0.8;
      const height = Math.max(minOverlayHeight, Math.min(maxOverlayHeight, preferredHeight));
      
      setOverlayPosition({ top, left, width, height });
    };

    const timeoutId = setTimeout(updatePosition, 10);
    updatePosition();
    
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isExpanded, containerRef, overlayContainerRef]);

  return overlayPosition;
}

