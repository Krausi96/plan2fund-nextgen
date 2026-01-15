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
  getSectionTitle,
  isSpecialSectionId,
  METADATA_SECTION_ID,
  ANCILLARY_SECTION_ID,
  REFERENCES_SECTION_ID,
  APPENDICES_SECTION_ID,
} from '../constants';
import type { SectionWithMetadata, DocumentWithMetadata } from '../types/types';
import type { ProductOption, DocumentTemplate, SectionTemplate } from '../types/types';

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
    if (state.activeSectionId) return state.activeSectionId;
    if (state.plan?.sections && state.plan.sections.length > 0) {
      return state.plan.sections[0].id;
    }
    return null;
  });
};

/**
 * Get visible (enabled) documents
 * Used by: DocumentsBar, useDocumentsBarState
 */
export const useVisibleDocuments = (): DocumentTemplate[] => {
  return useEditorStore((state) =>
    state.allDocuments.filter(doc => !state.disabledDocumentIds.includes(doc.id))
  );
};

/**
 * Hook to get sections for configuration view
 * Combines normal sections with special sections in correct order
 * Used by: SectionsDocumentsManagement
 */
export const useSectionsForConfig = (
  t: (key: any) => string
): SectionWithMetadata[] => {
  return useEditorStore((state) => {
    const getTitle = (sectionId: string, originalTitle: string) =>
      getSectionTitle(sectionId, originalTitle, t);

    // Inline builder logic: filter and transform sections
    return state.allSections
      .filter(section => {
        // Include ancillary, references, and appendices
        if (section.id === ANCILLARY_SECTION_ID) return true;
        if (section.id === REFERENCES_SECTION_ID) return true;
        if (section.id === APPENDICES_SECTION_ID) return true;
        return true;
      })
      .map(section => ({
        id: section.id,
        title: getTitle(section.id, section.title),
        isDisabled: state.disabledSectionIds.includes(section.id),
        origin: section.origin || 'template',
        isSpecial: isSpecialSectionId(section.id),
        required: section.required ?? false,
      }));
  });
};

/**
 * Hook to get sections for sidebar view
 * Handles core product vs additional document logic
 * Used by: Sidebar, useSidebarState
 */
export const useSectionsForSidebar = (
  _t: (key: any) => string,
  filteredSectionIds?: string[] | null,
  isNewUser = false
): SectionTemplate[] => {
  return useEditorStore((state) => {
    // For new users or empty sections, return empty array
    if (isNewUser || (!state.allSections.length && !state.plan?.sections?.length)) {
      return [];
    }

    // Get regular sections from allSections
    let regularSections = state.allSections.filter(section => {
      // Apply section ID filter if provided
      if (filteredSectionIds && !filteredSectionIds.includes(section.id)) {
        return false;
      }
      // Don't filter out disabled sections here - let the component handle display
      return true;
    });
    
    // Always ensure special sections (title page, TOC, references, appendices) are included
    const specialSectionIds = [
      METADATA_SECTION_ID,
      ANCILLARY_SECTION_ID,
      REFERENCES_SECTION_ID,
      APPENDICES_SECTION_ID
    ];
    
    // Create special sections if they don't exist in regularSections
    const specialSections: SectionTemplate[] = [
      {
        id: METADATA_SECTION_ID,
        title: 'Title Page',
        description: 'Document title page with company information',
        required: true,
        category: 'general' as const,
        origin: 'template',
      },
      {
        id: ANCILLARY_SECTION_ID,
        title: 'Table of Contents',
        description: 'Automatically generated table of contents',
        required: true,
        category: 'general' as const,
        origin: 'template',
      },
      {
        id: REFERENCES_SECTION_ID,
        title: 'References',
        description: 'List of references and citations',
        required: false,
        category: 'general' as const,
        origin: 'template',
      },
      {
        id: APPENDICES_SECTION_ID,
        title: 'Appendices',
        description: 'Additional supporting documents and information',
        required: false,
        category: 'general' as const,
        origin: 'template',
      }
    ];
    
    // Check which special sections are missing from regularSections
    const existingSectionIds = new Set(regularSections.map(s => s.id));
    const missingSpecialSections = specialSections.filter(s => !existingSectionIds.has(s.id));
    
    // Separate special sections from regular sections for proper ordering
    const titlePageSection = [...regularSections.filter(s => s.id === METADATA_SECTION_ID), ...missingSpecialSections.filter(s => s.id === METADATA_SECTION_ID)];
    const tocSection = [...regularSections.filter(s => s.id === ANCILLARY_SECTION_ID), ...missingSpecialSections.filter(s => s.id === ANCILLARY_SECTION_ID)];
    const referencesSection = [...regularSections.filter(s => s.id === REFERENCES_SECTION_ID), ...missingSpecialSections.filter(s => s.id === REFERENCES_SECTION_ID)];
    const appendicesSection = [...regularSections.filter(s => s.id === APPENDICES_SECTION_ID), ...missingSpecialSections.filter(s => s.id === APPENDICES_SECTION_ID)];
    
    // Get regular sections that are not special sections
    const regularNonSpecialSections = regularSections.filter(s => !specialSectionIds.includes(s.id));
    
    // Build the ordered result: title page, toc, regular sections, references, appendices
    let orderedSections = [];
    
    if (titlePageSection.length > 0) orderedSections.push(titlePageSection[0]);
    if (tocSection.length > 0) orderedSections.push(tocSection[0]);
    
    orderedSections = [...orderedSections, ...regularNonSpecialSections];
    
    if (referencesSection.length > 0) orderedSections.push(referencesSection[0]);
    if (appendicesSection.length > 0) orderedSections.push(appendicesSection[0]);
    
    return orderedSections;
  });
};

/**
 * Hook to get documents for configuration view
 * Used by: SectionsDocumentsManagement
 */
export const useDocumentsForConfig = (): DocumentWithMetadata[] => {
  return useEditorStore((state) =>
    // Inline builder logic: transform documents with metadata
    state.allDocuments.map(doc => ({
      id: doc.id,
      name: doc.name,
      isDisabled: state.disabledDocumentIds.includes(doc.id),
      origin: doc.origin || 'template',
    }))
  );
};

/**
 * Hook to get document counts (enabled and total)
 * Used by: DocumentsBar, useDocumentsBarState
 */
export const useDocumentCounts = (): {
  enabledCount: number;
  totalCount: number;
} => {
  return useEditorStore((state) => ({
    enabledCount: state.allDocuments.filter(doc => !state.disabledDocumentIds.includes(doc.id)).length,
    totalCount: state.allDocuments.length,
  }));
};

/**
 * Get sections and documents counts (single source of truth)
 * Used by: ProductSelection, SectionsDocumentsManagement, useConfiguratorState
 */
export const useSectionsAndDocumentsCounts = () => {
  return useEditorStore((state) => {
    // Inline count calculations
    const enabledSectionsCount = state.allSections.filter(s => !state.disabledSectionIds.includes(s.id)).length;
    
    // Count both template documents and custom documents
    const enabledTemplateDocumentsCount = state.allDocuments.filter(d => !state.disabledDocumentIds.includes(d.id)).length;
    const enabledCustomDocumentsCount = state.customDocuments.filter(d => !state.disabledDocumentIds.includes(d.id)).length;
    
    // Include core product document in total count if a product is selected
    // The core product is always considered "enabled" when a product is selected
    const hasSelectedProduct = !!state.selectedProduct;
    const coreProductCount = hasSelectedProduct ? 1 : 0;
    
    return {
      enabledSectionsCount,
      totalSectionsCount: state.allSections.length,
      enabledDocumentsCount: enabledTemplateDocumentsCount + enabledCustomDocumentsCount + coreProductCount, // Core product always enabled when selected
      totalDocumentsCount: state.allDocuments.length + state.customDocuments.length + coreProductCount,
    };
  });
};
