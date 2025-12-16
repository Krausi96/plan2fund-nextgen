/**
 * ============================================================================
 * CONSOLIDATED EDITOR STATE HOOKS
 * ============================================================================
 * 
 * These hooks consolidate multiple store calls into single, purpose-specific hooks.
 * Replaces 20+ individual useEditorStore calls with unified hooks.
 * 
 * WHAT IT DOES:
 *   - Provides unified state hooks for specific UI areas
 *   - Reduces prop drilling and multiple hook calls
 *   - Combines state, actions, and computed values in one place
 * 
 * USED BY:
 *   - Editor.tsx - Main editor component
 *   - Sidebar.tsx - Uses useSidebarState()
 *   - DocumentsBar.tsx - Uses useDocumentsBarState()
 *   - CurrentSelection.tsx - Uses useConfiguratorState()
 *   - SectionEditor.tsx - Uses useSectionEditorState()
 *   - PreviewWorkspace.tsx - Uses usePreviewState()
 * 
 * HOOKS:
 *   1. useEditorState() - Basic editor state (plan, loading, errors, etc.)
 *   2. useSidebarState() - Complete sidebar state + actions + handlers
 *   3. useDocumentsBarState() - Complete documents bar state + actions + handlers
 *   4. useConfiguratorState() - Product/program selection state + actions
 *   5. useSectionsDocumentsManagementState() - Sections/documents management state
 *   6. useSectionEditorState() - Section editor specific state
 *   7. usePreviewState() - Preview workspace state
 * 
 * PATTERN:
 *   Each hook follows the pattern: state + actions + computed values = complete UI state
 * 
 * INTERNAL HELPERS:
 *   - useToggleHandlers() - Creates toggle handlers for enabling/disabling items
 *   - useEditHandlers() - Creates edit handlers for editing items
 * ============================================================================
 */

import { useMemo, useCallback } from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';
import { useEditorStore, DEFAULT_PRODUCT_OPTIONS, getSelectedProductMeta } from '../store/editorStore';
import {
  // Set selectors
  useDisabledSectionsSet,
  useDisabledDocumentsSet,
  // Data selectors
  useSectionsForConfig,
  useSectionsForSidebar,
  useDocumentsForConfig,
  useVisibleDocuments,
  useDocumentCounts,
  useSectionsAndDocumentsCounts,
} from './selectors';
import { useEditorActions } from './useEditorStore';
import type { SectionTemplate, DocumentTemplate, ToggleHandlers, EditHandlers } from '../types';

// ============================================================================
// INTERNAL HELPER HOOKS - Used only within this file
// ============================================================================

/**
 * Hook to create toggle handlers for sections or documents
 * Internal helper - only used by consolidated hooks in this file
 */
function useToggleHandlers<T extends { id: string }>(
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
 * Internal helper - only used by consolidated hooks in this file
 */
function useEditHandlers<T extends { id: string }>(
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

// ============================================================================
// PUBLIC CONSOLIDATED STATE HOOKS
// ============================================================================

export function useEditorState() {
  return useEditorStore((state) => ({
    // Core state
    plan: state.plan,
    isLoading: state.isLoading,
    error: state.error,
    progressSummary: state.progressSummary,
    
    // Navigation
    activeSectionId: state.activeSectionId,
    
    // Product & Program
    selectedProduct: state.selectedProduct,
    programSummary: state.programSummary,
    programError: state.programError,
    programLoading: state.programLoading,
    
    // UI state
    isConfiguratorOpen: state.isConfiguratorOpen,
    
    // Template state
    allSections: state.allSections,
    allDocuments: state.allDocuments,
    disabledSectionIds: state.disabledSectionIds,
    disabledDocumentIds: state.disabledDocumentIds,
    
    // Form state
    expandedSectionId: state.expandedSectionId,
    expandedDocumentId: state.expandedDocumentId,
    editingSection: state.editingSection,
    editingDocument: state.editingDocument,
    clickedDocumentId: state.clickedDocumentId,
    showAddSection: state.showAddSection,
    showAddDocument: state.showAddDocument,
  }));
}

/**
 * Unified Configurator State Hook (like useIsNewUser pattern)
 * Consolidates all configurator (CurrentSelection) data and actions
 * Optimized: Single store selector + compute selectedProductMeta inline
 */
export function useConfiguratorState() {
  // Optimized: Single selector + compute selectedProductMeta inline instead of separate hook call
  const { selectedProduct, programSummary, programError, programLoading, selectedProductMeta } = useEditorStore((state) => {
    const selectedProduct = state.selectedProduct;
    const programSummary = state.programSummary;
    const programError = state.programError;
    const programLoading = state.programLoading;
    // Compute selectedProductMeta inline instead of separate hook call
    const selectedProductMeta = selectedProduct 
      ? getSelectedProductMeta(DEFAULT_PRODUCT_OPTIONS, selectedProduct)
      : null;
    return { selectedProduct, programSummary, programError, programLoading, selectedProductMeta };
  });
  
  // Optimized: Select only needed actions instead of all actions
  const actions = useEditorActions((a) => ({
    setSelectedProduct: a.setSelectedProduct,
    setProgramSummary: a.setProgramSummary,
  }));
  
  return {
    selectedProduct,
    productOptions: DEFAULT_PRODUCT_OPTIONS,
    selectedProductMeta,
    programSummary,
    programError,
    programLoading,
    actions,
  };
}

/**
 * Unified Sections & Documents Management State Hook (like useIsNewUser pattern)
 * Consolidates all sections/documents management data and actions
 * Optimized: Only subscribes to needed actions
 */
export function useSectionsDocumentsManagementState() {
  const { t } = useI18n();
  // Optimized: Single selector + compute selectedProductMeta inline
  const { allSections, allDocuments, disabledSectionIds, disabledDocumentIds, selectedProduct, programSummary, showAddSection, showAddDocument, selectedProductMeta } = useEditorStore((state) => {
    const allSections = state.allSections;
    const allDocuments = state.allDocuments;
    const disabledSectionIds = state.disabledSectionIds;
    const disabledDocumentIds = state.disabledDocumentIds;
    const selectedProduct = state.selectedProduct;
    const programSummary = state.programSummary;
    const showAddSection = state.showAddSection;
    const showAddDocument = state.showAddDocument;
    // Compute selectedProductMeta inline instead of separate hook call
    const selectedProductMeta = selectedProduct 
      ? getSelectedProductMeta(DEFAULT_PRODUCT_OPTIONS, selectedProduct)
      : null;
    return { allSections, allDocuments, disabledSectionIds, disabledDocumentIds, selectedProduct, programSummary, showAddSection, showAddDocument, selectedProductMeta };
  });
  
  // Optimized: Select only needed actions instead of all actions
  const actions = useEditorActions((a) => ({
    setDisabledSectionIds: a.setDisabledSectionIds,
    setDisabledDocumentIds: a.setDisabledDocumentIds,
    setShowAddSection: a.setShowAddSection,
    setShowAddDocument: a.setShowAddDocument,
  }));
  
  // Use store hooks (single source of truth) - these need complex logic so keep as separate hooks
  const sectionsToShow = useSectionsForConfig(t);
  const documentsToShow = useDocumentsForConfig();
  const documentCounts = useDocumentCounts();
  const counts = useSectionsAndDocumentsCounts();
  
  // Toggle handlers
  const sectionToggleHandlers = useToggleHandlers(allSections, disabledSectionIds, actions.setDisabledSectionIds);
  const documentToggleHandlers = useToggleHandlers(allDocuments, disabledDocumentIds, actions.setDisabledDocumentIds);
  
  // Memoized actions
  const managementActions = useMemo(() => ({
    toggleSection: sectionToggleHandlers.toggle,
    toggleDocument: documentToggleHandlers.toggle,
    toggleAddSection: () => actions.setShowAddSection(!showAddSection),
    toggleAddDocument: () => actions.setShowAddDocument(!showAddDocument),
  }), [sectionToggleHandlers, documentToggleHandlers, actions, showAddSection, showAddDocument]);
  
  return {
    sections: sectionsToShow,
    documents: documentsToShow,
    documentCounts,
    counts,
    selectedProductMeta,
    selectedProduct,
    programSummary,
    showAddSection,
    showAddDocument,
    actions: managementActions,
  };
}

/**
 * Unified Section Editor State Hook (like useIsNewUser pattern)
 * Consolidates section editor related data
 * Optimized: Single store call + compute boolean inline
 */
export function useSectionEditorState(sectionId: string | null) {
  // Optimized: Batch state read + compute boolean inline
  const { plan, hasPlan } = useEditorStore((state) => {
    const plan = state.plan;
    const hasPlan = !!plan;
    return { plan, hasPlan };
  });
  
  const section = useMemo(() => {
    if (!plan || !sectionId) return null;
    return plan.sections?.find(s => s.id === sectionId) || null;
  }, [plan, sectionId]);
  
  return {
    plan,
    hasPlan,
    section,
    sectionId,
  };
}

/**
 * Unified Preview State Hook (like useIsNewUser pattern)
 * Consolidates all preview-related data
 * Optimized: Single store call instead of 4 separate calls
 */
export function usePreviewState() {
  // Optimized: Batch all state reads into single selector + compute booleans inline
  const { plan, clickedDocumentId, isNewUser, hasPlan } = useEditorStore((state) => {
    const plan = state.plan;
    const clickedDocumentId = state.clickedDocumentId;
    // Compute booleans inline instead of separate hook calls
    const isNewUser = !plan && !state.selectedProduct;
    const hasPlan = !!plan;
    return { plan, clickedDocumentId, isNewUser, hasPlan };
  });
  
  const selectedDocument = useMemo(() => {
    if (!plan || !clickedDocumentId) return null;
    return plan.documents?.find((doc: any) => doc.id === clickedDocumentId) || null;
  }, [plan, clickedDocumentId]);
  
  return {
    plan,
    isNewUser,
    hasPlan,
    selectedDocument,
    clickedDocumentId,
  };
}

/**
 * Unified Sidebar State Hook (like useIsNewUser pattern)
 * Consolidates all sidebar-related data and actions
 * Optimized: Only subscribes to needed actions
 */
export function useSidebarState() {
  const { t } = useI18n();
  
  // Optimized: Batch state reads + compute booleans inline
  const { allSections, disabledSectionIds, editingSection, showAddSection, activeSectionId, isNewUser, selectedProductMeta, isEditing } = useEditorStore((state) => {
    const allSections = state.allSections;
    const disabledSectionIds = state.disabledSectionIds;
    const editingSection = state.editingSection;
    const showAddSection = state.showAddSection;
    const activeSectionId = state.activeSectionId;
    // Compute booleans inline instead of separate hook calls
    const isNewUser = !state.plan && !state.selectedProduct;
    const isEditing = !!state.expandedSectionId && !!state.editingSection;
    // Compute selectedProductMeta inline
    const selectedProductMeta = state.selectedProduct 
      ? getSelectedProductMeta(DEFAULT_PRODUCT_OPTIONS, state.selectedProduct)
      : null;
    return { allSections, disabledSectionIds, editingSection, showAddSection, activeSectionId, isNewUser, selectedProductMeta, isEditing };
  });
  
  const sections = useSectionsForSidebar(t, null, isNewUser);
  const disabledSections = useDisabledSectionsSet();
  
  // Optimized: Select only needed actions instead of all actions
  const actions = useEditorActions((a) => ({
    setActiveSectionId: a.setActiveSectionId,
    setDisabledSectionIds: a.setDisabledSectionIds,
    setAllSections: a.setAllSections,
    setEditingSection: a.setEditingSection,
    setExpandedSectionId: a.setExpandedSectionId,
    setShowAddSection: a.setShowAddSection,
  }));
  
  // Section toggle handlers
  const sectionToggleHandlers = useToggleHandlers(allSections, disabledSectionIds, actions.setDisabledSectionIds);
  const sectionEditHandlers = useEditHandlers(allSections, actions.setAllSections, actions.setEditingSection, actions.setExpandedSectionId);
  
  // Memoized actions object
  const sidebarActions = useMemo(() => ({
    setActiveSectionId: actions.setActiveSectionId,
    toggleSection: sectionToggleHandlers.toggle,
    editSection: (section: SectionTemplate) => sectionEditHandlers.onEdit(section),
    cancelEdit: sectionEditHandlers.onCancel,
    toggleAddSection: () => actions.setShowAddSection(!showAddSection),
  }), [actions, sectionToggleHandlers, sectionEditHandlers, showAddSection]);
  
  // Section counts
  const sectionCounts = useMemo(() => ({
    enabledCount: sections.filter(s => !disabledSections.has(s.id)).length,
    totalCount: sections.length,
  }), [sections, disabledSections]);
  
  return {
    isNewUser,
    sections,
    disabledSections,
    selectedProductMeta,
    isEditing,
    editingSection,
    showAddSection,
    activeSectionId,
    actions: sidebarActions,
    sectionCounts,
  };
}

/**
 * Unified Documents Bar State Hook (like useIsNewUser pattern)
 * Consolidates all documents bar-related data and actions
 * Optimized: Only subscribes to needed actions
 */
export function useDocumentsBarState() {
  // Optimized: Batch state reads + compute booleans inline
  const { allDocuments, disabledDocumentIds, editingDocument, showAddDocument, expandedDocumentId, clickedDocumentId, isNewUser, selectedProductMeta, isEditing } = useEditorStore((state) => {
    const allDocuments = state.allDocuments;
    const disabledDocumentIds = state.disabledDocumentIds;
    const editingDocument = state.editingDocument;
    const showAddDocument = state.showAddDocument;
    const expandedDocumentId = state.expandedDocumentId;
    const clickedDocumentId = state.clickedDocumentId;
    // Compute booleans inline instead of separate hook calls
    const isNewUser = !state.plan && !state.selectedProduct;
    const isEditing = !!state.expandedDocumentId && !!state.editingDocument;
    // Compute selectedProductMeta inline
    const selectedProductMeta = state.selectedProduct 
      ? getSelectedProductMeta(DEFAULT_PRODUCT_OPTIONS, state.selectedProduct)
      : null;
    return { allDocuments, disabledDocumentIds, editingDocument, showAddDocument, expandedDocumentId, clickedDocumentId, isNewUser, selectedProductMeta, isEditing };
  });
  
  const documents = useVisibleDocuments();
  const disabledDocuments = useDisabledDocumentsSet();
  const documentCounts = useDocumentCounts();
  
  // Optimized: Select only needed actions instead of all actions
  const actions = useEditorActions((a) => ({
    setClickedDocumentId: a.setClickedDocumentId,
    setDisabledDocumentIds: a.setDisabledDocumentIds,
    setAllDocuments: a.setAllDocuments,
    setEditingDocument: a.setEditingDocument,
    setExpandedDocumentId: a.setExpandedDocumentId,
    setShowAddDocument: a.setShowAddDocument,
  }));
  
  // Document toggle handlers
  const documentToggleHandlers = useToggleHandlers(allDocuments, disabledDocumentIds, actions.setDisabledDocumentIds);
  const documentEditHandlers = useEditHandlers(allDocuments, actions.setAllDocuments, actions.setEditingDocument, actions.setExpandedDocumentId);
  
  // Memoized actions object
  const documentsBarActions = useMemo(() => ({
    setClickedDocumentId: actions.setClickedDocumentId,
    toggleDocument: documentToggleHandlers.toggle,
    editDocument: (doc: DocumentTemplate) => documentEditHandlers.onEdit(doc),
    cancelEdit: documentEditHandlers.onCancel,
    toggleAddDocument: () => actions.setShowAddDocument(!showAddDocument),
    removeCustomDocument: (id: string) => {
      actions.setAllDocuments(allDocuments.filter(d => d.id !== id));
    },
  }), [actions, documentToggleHandlers, documentEditHandlers, showAddDocument, allDocuments]);
  
  return {
    isNewUser,
    documents,
    disabledDocuments,
    documentCounts,
    selectedProductMeta,
    isEditing,
    editingDocument,
    showAddDocument,
    expandedDocumentId,
    clickedDocumentId,
    actions: documentsBarActions,
  };
}
