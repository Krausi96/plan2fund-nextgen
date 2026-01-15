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

 *   6. useSectionEditorState() - Section editor specific state
 *   7. usePreviewState() - Preview workspace state
 * ============================================================================
 */

import { useMemo } from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';
import { useEditorStore } from '../store/editorStore';
import { DEFAULT_PRODUCT_OPTIONS } from '../constants';
import {
  // Boolean selectors
  useIsNewUser,
  useHasPlan,
  useIsEditingSection,
  useIsEditingDocument,
  // Set selectors
  useDisabledSectionsSet,
  useDisabledDocumentsSet,
  // Data selectors
  useSectionsForSidebar,
  useVisibleDocuments,

  useSectionsAndDocumentsCounts,
  useSelectedProductMeta,
} from './useEditorSelectors';
import {
  METADATA_SECTION_ID,
  ANCILLARY_SECTION_ID,
  REFERENCES_SECTION_ID,
  APPENDICES_SECTION_ID,
} from '../constants';
import { useEditorActions } from './useEditorActions';
import { useToggleHandlers, useEditHandlers } from './useEditorHandlers';
import type { SectionTemplate, DocumentTemplate } from '../types/types';

export function useEditorState() {
  return useEditorStore((state) => ({
    plan: state.plan,
    isLoading: state.isLoading,
    error: state.error,
    activeSectionId: state.activeSectionId,
    selectedProduct: state.selectedProduct,
    programSummary: state.programSummary,
    programError: state.programError,
    programLoading: state.programLoading,
    isConfiguratorOpen: state.isConfiguratorOpen,
    allSections: state.allSections,
    allDocuments: state.allDocuments,
    disabledSectionIds: state.disabledSectionIds,
    disabledDocumentIds: state.disabledDocumentIds,
    expandedSectionId: state.expandedSectionId,
    expandedDocumentId: state.expandedDocumentId,
    editingSection: state.editingSection,
    editingDocument: state.editingDocument,
    clickedDocumentId: state.clickedDocumentId,
    showAddSection: state.showAddSection,
    showAddDocument: state.showAddDocument,
  }));
}

export function useConfiguratorState() {
  const { selectedProduct, programSummary, programError, programLoading } = useEditorStore((state) => ({
    selectedProduct: state.selectedProduct,
    programSummary: state.programSummary,
    programError: state.programError,
    programLoading: state.programLoading,
  }));
  
  // Use selector hook for consistency
  const selectedProductMeta = useSelectedProductMeta();
  
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

export function useSectionEditorState(sectionId: string | null) {
  // Use selector hook for consistency
  const plan = useEditorStore((state) => state.plan);
  const hasPlan = useHasPlan();
  
  const section = useMemo(() => {
    if (!plan || !sectionId) return null;
    
    // Special section definitions
    const SPECIAL_SECTIONS = {
      [METADATA_SECTION_ID]: 'Title Page',
      [ANCILLARY_SECTION_ID]: 'Table of Contents',
      [REFERENCES_SECTION_ID]: 'References',
      [APPENDICES_SECTION_ID]: 'Appendices'
    };

    // Check if this is a special section
    const title = SPECIAL_SECTIONS[sectionId as keyof typeof SPECIAL_SECTIONS];
    if (title) {
      return {
        id: sectionId,
        key: sectionId,
        title,
        content: '',
        fields: { displayTitle: title, sectionNumber: null },
        status: 'draft',
        isSpecial: true
      };
    }
    
    // Regular section lookup
    return plan.sections?.find(s => s.id === sectionId) || null;
  }, [plan, sectionId]);
  
  return {
    plan,
    hasPlan,
    section,
    sectionId,
  };
}

export function usePreviewState() {
  // Optimized: Batch all state reads into single selector + compute booleans inline
  const { plan, isNewUser, hasPlan } = useEditorStore((state) => {
    const plan = state.plan;
    // Compute booleans inline instead of separate hook calls
    const isNewUser = !plan && !state.selectedProduct;
    const hasPlan = !!plan;
    return { plan, isNewUser, hasPlan };
  });
  
  return {
    plan,
    isNewUser,
    hasPlan,
  };
}

export const useSidebarState = () => {
  const data = useEditorStore((state) => ({
    items: state.allSections,
    disabledIds: state.disabledSectionIds,
    editingItem: state.editingSection,
    showAdd: state.showAddSection,
    activeId: state.activeSectionId,
    allItems: state.allSections
  }));
  
  const selectors = {
    isNewUser: useIsNewUser(),
    isEditing: useIsEditingSection(),
    selectedProductMeta: useSelectedProductMeta(),
    sections: useSectionsForSidebar(useI18n().t, null, useIsNewUser()),
    disabledSections: useDisabledSectionsSet()
  };
  
  const actions = useEditorActions((a) => ({
    setActiveId: a.setActiveSectionId,
    setDisabledIds: a.setDisabledSectionIds,
    setAllItems: a.setAllSections,
    setEditingItem: a.setEditingSection,
    setExpandedId: a.setExpandedSectionId,
    setShowAdd: a.setShowAddSection,
    addCustom: a.addCustomSection,
    removeCustom: a.removeCustomSection
  }));
  
  const handlers = {
    toggle: useToggleHandlers(data.items, data.disabledIds, actions.setDisabledIds),
    edit: useEditHandlers(data.items, actions.setAllItems, actions.setEditingItem, actions.setExpandedId)
  };
  
  const finalActions = useMemo(() => ({
    setActiveSectionId: actions.setActiveId,
    toggleSection: handlers.toggle.toggle,
    editSection: (s: SectionTemplate) => handlers.edit.onEdit(s),
    cancelEdit: handlers.edit.onCancel,
    toggleAddSection: () => actions.setShowAdd(!data.showAdd),
    addCustomSection: actions.addCustom,
    removeCustomSection: actions.removeCustom
  }), [actions, data, handlers]);
  
  return { ...selectors, ...data, actions: finalActions };
};

export const useDocumentsBarState = () => {
  const data = useEditorStore((state) => ({
    items: state.allDocuments,
    disabledIds: state.disabledDocumentIds,
    editingItem: state.editingDocument,
    showAdd: state.showAddDocument,
    expandedId: state.expandedDocumentId,
    clickedId: state.clickedDocumentId,
    allItems: state.allDocuments
  }));
  
  const selectors = {
    isNewUser: useIsNewUser(),
    isEditing: useIsEditingDocument(),
    selectedProductMeta: useSelectedProductMeta(),
    documents: useVisibleDocuments(),
    disabledDocuments: useDisabledDocumentsSet(),
    documentCounts: (() => {
      const counts = useSectionsAndDocumentsCounts();
      return {
        enabledCount: counts.enabledDocumentsCount,
        totalCount: counts.totalDocumentsCount,
      };
    })()
  };
  
  const actions = useEditorActions((a) => ({
    setClickedId: a.setClickedDocumentId,
    setDisabledIds: a.setDisabledDocumentIds,
    setAllItems: a.setAllDocuments,
    setEditingItem: a.setEditingDocument,
    setExpandedId: a.setExpandedDocumentId,
    setShowAdd: a.setShowAddDocument
  }));
  
  const handlers = {
    toggle: useToggleHandlers(data.items, data.disabledIds, actions.setDisabledIds),
    edit: useEditHandlers(data.items, actions.setAllItems, actions.setEditingItem, actions.setExpandedId)
  };
  
  const finalActions = useMemo(() => ({
    setClickedDocumentId: actions.setClickedId,
    toggleDocument: handlers.toggle.toggle,
    editDocument: (d: DocumentTemplate) => handlers.edit.onEdit(d),
    cancelEdit: handlers.edit.onCancel,
    toggleAddDocument: () => {
      const currentState = useEditorStore.getState();
      actions.setShowAdd(!currentState.showAddDocument);
    },
    removeCustomDocument: (id: string) => {
      actions.setAllItems(data.allItems.filter((d: DocumentTemplate) => d.id !== id));
    }
  }), [actions, data, handlers]);
  
  return { ...selectors, ...data, actions: finalActions };
};
