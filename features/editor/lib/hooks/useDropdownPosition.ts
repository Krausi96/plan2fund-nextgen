/**
 * ============================================================================
 * DROPDOWN POSITION HOOK
 * ============================================================================
 * 
 * Calculates position for portal-based dropdown menus.
 * Ensures dropdowns are positioned correctly relative to their trigger elements.
 * 
 * WHAT IT DOES:
 *   - Calculates top, left, and width for dropdown positioning
 *   - Updates position on window resize and scroll
 *   - Returns null when dropdown is closed
 * 
 * USED BY:
 *   - ProductSelection.tsx - Product dropdown menu
 *   - ProgramSelection.tsx - Program dropdown menu
 *   - Any component that needs positioned dropdown menus
 * 
 * HOW IT WORKS:
 *   - Takes a ref to the trigger element
 *   - Calculates position using getBoundingClientRect()
 *   - Listens to resize/scroll events for updates
 *   - Returns position object: { top, left, width }
 * ============================================================================
 */

import { useState, useEffect, RefObject } from 'react';

export function useDropdownPosition(
  triggerRef: RefObject<HTMLElement>,
  isOpen: boolean
) {
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    if (!isOpen || !triggerRef.current) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
        });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, triggerRef]);

  return position;
}
