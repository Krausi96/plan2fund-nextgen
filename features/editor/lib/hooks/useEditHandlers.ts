/**
 * ============================================================================
 * EDIT HANDLERS HOOK
 * ============================================================================
 * 
 * Provides handlers for editing items (sections/documents).
 * Manages edit state: start editing, save changes, cancel editing.
 * 
 * WHAT IT DOES:
 *   - Creates onEdit handler to start editing an item
 *   - Creates onSave handler to save changes and update store
 *   - Creates onCancel handler to discard changes
 *   - Manages expanded/editing state synchronization
 * 
 * USED BY:
 *   - Sidebar.tsx - For editing sections
 *   - DocumentsBar.tsx - For editing documents
 *   - useSidebarState() - Wraps this hook for sidebar
 *   - useDocumentsBarState() - Wraps this hook for documents bar
 * 
 * HOW IT WORKS:
 *   - Takes items array, setItems action, setEditingItem, setExpandedId
 *   - Returns EditHandlers object with onEdit, onSave, onCancel
 *   - onEdit: Sets editing item and expands it
 *   - onSave: Updates item in array and clears editing state
 *   - onCancel: Clears editing state without saving
 * ============================================================================
 */

import { useCallback } from 'react';
import type { EditHandlers } from '../types';

/**
 * Hook to create edit handlers for sections or documents
 * 
 * @param items - Array of items (sections or documents) with id property
 * @param setItems - Action to update items list in store
 * @param setEditingItem - Action to set which item is being edited
 * @param setExpandedId - Action to set expanded item ID (for UI state)
 * @returns EditHandlers object with onEdit, onSave, and onCancel functions
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
