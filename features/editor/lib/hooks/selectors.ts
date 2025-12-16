/**
 * ============================================================================
 * ORGANIZED STORE SELECTORS
 * ============================================================================
 * 
 * All store selectors organized by category for better maintainability.
 * Consistent pattern: Each selector is a simple hook that uses useEditorStore.
 * 
 * CATEGORIES:
 *   1. Boolean Selectors - Simple true/false checks
 *   2. Data Selectors - Return arrays, objects, or computed data
 *   3. Set Selectors - Return Sets for O(1) lookups
 * 
 * PATTERN:
 *   export const useXxx = () => useEditorStore((state) => ...);
 * ============================================================================
 */

import { useEditorStore } from '../store/editorStore';
import {
  DEFAULT_PRODUCT_OPTIONS,
  getSelectedProductMeta,
  buildSectionsForConfig,
  buildSectionsForSidebar,
  buildDocumentsForConfig,
  buildDocumentsForBar,
  getDocumentCounts,
  getSectionTitle,
  type SectionWithMetadata,
  type DocumentWithMetadata,
} from '../store/editorStore';
import type { ProductOption } from '../types';

// ============================================================================
// BOOLEAN SELECTORS - Simple true/false checks
// ============================================================================

/**
 * Check if user is new (no plan and no product selected)
 * Used by: Editor, Sidebar, DocumentsBar, useSidebarState, useDocumentsBarState
 */
export const useIsNewUser = (): boolean => {
  return useEditorStore((state) => !state.plan && !state.selectedProduct);
};

/**
 * Check if plan exists
 * Used by: Editor, PreviewWorkspace, SectionEditor
 */
export const useHasPlan = (): boolean => {
  return useEditorStore((state) => !!state.plan);
};

/**
 * Check if waiting for plan to load
 * Used by: Editor
 */
export const useIsWaitingForPlan = (): boolean => {
  return useEditorStore((state) => !!state.selectedProduct && state.isLoading);
};

/**
 * Check if currently editing a section
 * Used by: Editor, Sidebar, useSidebarState
 */
export const useIsEditingSection = (): boolean => {
  return useEditorStore((state) => !!state.expandedSectionId && !!state.editingSection);
};

/**
 * Check if currently editing a document
 * Used by: Editor, DocumentsBar, useDocumentsBarState
 */
export const useIsEditingDocument = (): boolean => {
  return useEditorStore((state) => !!state.expandedDocumentId && !!state.editingDocument);
};

// ============================================================================
// SET SELECTORS - Return Sets for O(1) lookups
// ============================================================================

/**
 * Get disabled sections as a Set (for easier Set operations)
 * Used by: Sidebar, useSidebarState
 */
export const useDisabledSectionsSet = (): Set<string> => {
  return useEditorStore((state) => new Set(state.disabledSectionIds));
};

/**
 * Get disabled documents as a Set (for easier Set operations)
 * Used by: DocumentsBar, useDocumentsBarState
 */
export const useDisabledDocumentsSet = (): Set<string> => {
  return useEditorStore((state) => new Set(state.disabledDocumentIds));
};

// ============================================================================
// DATA SELECTORS - Return arrays, objects, or computed data
// ============================================================================

/**
 * Get selected product meta (single source of truth)
 * Used by: Editor, ProductSelection, Sidebar, DocumentsBar, useConfiguratorState, useSidebarState, useDocumentsBarState
 */
export const useSelectedProductMeta = (): ProductOption | null => {
  return useEditorStore((state) => {
    const product = state.selectedProduct;
    if (!product) return null;
    return getSelectedProductMeta(DEFAULT_PRODUCT_OPTIONS, product);
  });
};

/**
 * Get effective editing section ID (editingSectionId || activeSectionId || first section)
 * Used by: Editor
 */
export const useEffectiveEditingSectionId = (): string | null => {
  return useEditorStore((state) => {
    if (state.editingSectionId) return state.editingSectionId;
    if (state.activeSectionId) return state.activeSectionId;
    if (state.plan?.sections && state.plan.sections.length > 0) {
      return state.plan.sections[0].id;
    }
    return null;
  });
};

/**
 * Get visible (enabled) sections
 * Used by: DocumentsBar (indirectly)
 */
export const useVisibleSections = (): SectionWithMetadata[] => {
  return useEditorStore((state) => 
    state.allSections
      .filter(s => !state.disabledSectionIds.includes(s.id))
      .map(s => ({
        id: s.id,
        title: s.title,
        isDisabled: false,
        origin: s.origin,
        isSpecial: false,
        required: s.required,
      }))
  );
};

/**
 * Get visible (enabled) documents
 * Used by: DocumentsBar, useDocumentsBarState
 */
export const useVisibleDocuments = (): DocumentWithMetadata[] => {
  return useEditorStore((state) => 
    state.allDocuments
      .filter(d => !state.disabledDocumentIds.includes(d.id))
      .map(d => ({
        id: d.id,
        name: d.name,
        isDisabled: false,
        origin: d.origin,
      }))
  );
};

/**
 * Hook to get sections for configuration view
 * Combines normal sections with special sections in correct order
 * Used by: SectionsDocumentsManagement, useSectionsDocumentsManagementState
 */
export const useSectionsForConfig = (
  t: (key: any) => string
): SectionWithMetadata[] => {
  return useEditorStore((state) => {
    const getTitle = (sectionId: string, originalTitle: string) =>
      getSectionTitle(sectionId, originalTitle, t);

    return buildSectionsForConfig({
      allSections: state.allSections,
      disabledSectionIds: state.disabledSectionIds,
      includeAncillary: true,
      includeReferences: true,
      includeAppendices: true,
      getTitle,
    });
  });
};

/**
 * Hook to get sections for sidebar view
 * Handles core product vs additional document logic
 * Used by: Sidebar, useSidebarState
 */
export const useSectionsForSidebar = (
  t: (key: any) => string,
  filteredSectionIds?: string[] | null,
  isNewUser = false
): SectionWithMetadata[] => {
  return useEditorStore((state) => {
    const getTitle = (sectionId: string, originalTitle: string) =>
      getSectionTitle(sectionId, originalTitle, t);

    return buildSectionsForSidebar({
      planSections: state.plan?.sections,
      allSections: state.allSections,
      disabledSectionIds: state.disabledSectionIds,
      filteredSectionIds,
      selectedProduct: state.selectedProduct,
      isNewUser,
      getTitle,
    });
  });
};

/**
 * Hook to get documents for configuration view
 * Used by: SectionsDocumentsManagement, useSectionsDocumentsManagementState
 */
export const useDocumentsForConfig = (): DocumentWithMetadata[] => {
  return useEditorStore((state) =>
    buildDocumentsForConfig({
      allDocuments: state.allDocuments,
      disabledDocumentIds: state.disabledDocumentIds,
      selectedProductMeta: null,
    })
  );
};

/**
 * Hook to get documents for documents bar view
 * Used by: DocumentsBar (indirectly)
 */
export const useDocumentsForBar = (): DocumentWithMetadata[] => {
  return useEditorStore((state) =>
    buildDocumentsForBar({
      allDocuments: state.allDocuments,
      disabledDocumentIds: state.disabledDocumentIds,
      selectedProductMeta: null,
    })
  );
};

/**
 * Hook to get document counts (enabled and total)
 * Used by: DocumentsBar, useDocumentsBarState, useSectionsDocumentsManagementState
 */
export const useDocumentCounts = (): {
  enabledCount: number;
  totalCount: number;
} => {
  return useEditorStore((state) =>
    getDocumentCounts(state.allDocuments, state.disabledDocumentIds)
  );
};

/**
 * Get sections and documents counts (single source of truth)
 * Used by: ProductSelection, SectionsDocumentsManagement, useConfiguratorState
 */
export const useSectionsAndDocumentsCounts = () => {
  return useEditorStore((state) => {
    const enabledSections = state.allSections.filter(
      (s) => !state.disabledSectionIds.includes(s.id)
    ).length;
    const enabledDocuments = state.allDocuments.filter(
      (d) => !state.disabledDocumentIds.includes(d.id)
    ).length;

    return {
      enabledSectionsCount: enabledSections,
      totalSectionsCount: state.allSections.length,
      enabledDocumentsCount: enabledDocuments,
      totalDocumentsCount: state.allDocuments.length,
    };
  });
};
