/**
 * ============================================================================
 * TOGGLE HANDLERS HOOK
 * ============================================================================
 * 
 * Provides handlers for toggling items (sections/documents) between enabled/disabled states.
 * Returns toggle function, disabled check, and counts.
 * 
 * WHAT IT DOES:
 *   - Creates toggle function to enable/disable items
 *   - Provides isDisabled check function
 *   - Calculates enabled/total counts
 *   - Uses memoization for performance
 * 
 * USED BY:
 *   - Sidebar.tsx - For toggling sections enabled/disabled
 *   - DocumentsBar.tsx - For toggling documents enabled/disabled
 *   - SectionsDocumentsManagement.tsx - For managing sections/documents
 *   - useSidebarState() - Wraps this hook for sidebar
 *   - useDocumentsBarState() - Wraps this hook for documents bar
 * 
 * HOW IT WORKS:
 *   - Takes items array, disabledIds array, setDisabledIds action
 *   - Returns ToggleHandlers: { toggle, isDisabled, enabledCount, totalCount }
 *   - toggle(id): Adds/removes ID from disabled list
 *   - isDisabled(id): Checks if item is disabled (O(1) lookup)
 *   - Counts: Calculated from items array and disabled set
 * ============================================================================
 */

import { useMemo, useCallback } from 'react';
import type { ToggleHandlers } from '../types';

/**
 * Hook to create toggle handlers for sections or documents
 * 
 * @param items - Array of items (sections or documents) with id property
 * @param disabledIds - Array of disabled item IDs
 * @param setDisabledIds - Action to update disabled IDs in store
 * @returns ToggleHandlers object with toggle function, isDisabled check, and counts
 */
export function useToggleHandlers<T extends { id: string }>(
  items: T[],
  disabledIds: string[],
  setDisabledIds: (ids: string[]) => void
): ToggleHandlers {
  // Memoize disabled set for O(1) lookup
  const disabledSet = useMemo(
    () => new Set(disabledIds),
    [disabledIds]
  );

  // Memoize counts
  const counts = useMemo(() => {
    const enabledCount = items.filter(item => !disabledSet.has(item.id)).length;
    const totalCount = items.length;
    return { enabledCount, totalCount };
  }, [items, disabledSet]);

  // Toggle function - add/remove ID from disabled list
  const toggle = useCallback(
    (id: string) => {
      const newDisabledIds = disabledSet.has(id)
        ? disabledIds.filter(disabledId => disabledId !== id) // Enable: remove from disabled
        : [...disabledIds, id]; // Disable: add to disabled
      
      setDisabledIds(newDisabledIds);
    },
    [disabledIds, disabledSet, setDisabledIds]
  );

  // Check if item is disabled
  const isDisabled = useCallback(
    (id: string) => disabledSet.has(id),
    [disabledSet]
  );

  return {
    toggle,
    isDisabled,
    enabledCount: counts.enabledCount,
    totalCount: counts.totalCount,
  };
}
