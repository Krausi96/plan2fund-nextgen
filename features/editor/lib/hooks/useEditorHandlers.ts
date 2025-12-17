/**
 * ============================================================================
 * EDITOR HANDLER HOOKS
 * ============================================================================
 * 
 * Hooks for creating handlers for editor interactions (toggle, edit, etc.)
 * 
 * WHAT IT DOES:
 *   - Provides reusable handler creation hooks
 *   - Handles toggle logic for enabling/disabling items
 *   - Handles edit logic for editing items
 * 
 * USED BY:
 *   - useEditorState.ts - Uses these handlers in consolidated state hooks
 * 
 * HOOKS:
 *   1. useToggleHandlers() - Creates toggle handlers for enabling/disabling items
 *   2. useEditHandlers() - Creates edit handlers for editing items
 * ============================================================================
 */

import { useMemo, useCallback } from 'react';
import type { ToggleHandlers, EditHandlers } from '../types/types';

/**
 * Hook to create toggle handlers for sections or documents
 * Creates handlers for enabling/disabling items
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

/**
 * Hook to create edit handlers for sections or documents
 * Creates handlers for editing items
 */
export function useEditHandlers<T extends { id: string }>(
  items: T[],
  setItems: (items: T[]) => void,
  setEditingItem: (item: T | null) => void,
  setExpandedId: (id: string | null) => void
): EditHandlers<T> {
  // Start editing an item
  const onEdit = useCallback(
    (item: T) => {
      setEditingItem(item);
      setExpandedId(item.id);
    },
    [setEditingItem, setExpandedId]
  );

  // Save changes (currently just closes edit mode - actual save logic would go here)
  const onSave = useCallback(
    (updatedItem: T) => {
      // Update the item in the list
      const updatedItems = items.map(item =>
        item.id === updatedItem.id ? updatedItem : item
      );
      setItems(updatedItems);
      
      // Clear editing state
      setEditingItem(null);
      setExpandedId(null);
    },
    [items, setItems, setEditingItem, setExpandedId]
  );

  // Cancel editing (discard changes)
  const onCancel = useCallback(
    () => {
      setEditingItem(null);
      setExpandedId(null);
    },
    [setEditingItem, setExpandedId]
  );

  return {
    onEdit,
    onSave,
    onCancel,
  };
}
