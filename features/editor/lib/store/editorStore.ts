/**
 * UNIFIED GLOBAL EDITOR STATE STORE
 * 
 * This is the SINGLE SOURCE OF TRUTH for all editor state.
 */

import { create } from 'zustand';
import type { ProductType, ProgramSummary } from '@/features/editor/lib/types';
import type { SectionTemplate, DocumentTemplate } from '@templates';
import type { BusinessPlan, ProgressSummary } from '@/features/editor/lib/types/plan';
import {
  buildSectionsForConfig,
  buildSectionsForSidebar,
  getSectionTitle,
  type SectionWithMetadata,
} from '../helpers/sections';
import {
  buildDocumentsForConfig,
  buildDocumentsForBar,
  getDocumentCounts,
  type DocumentWithMetadata,
} from '../helpers/documents';

// ============================================================================
// STATE INTERFACE - All editor state in one place
// ============================================================================

export interface EditorState {
  // ========== PLAN DATA (Core business plan) ==========
  plan: BusinessPlan | null;
  isLoading: boolean;
  error: string | null;
  progressSummary: ProgressSummary[];

  // ========== NAVIGATION STATE ==========
  activeSectionId: string | null;
  activeQuestionId: string | null;

  // ========== PRODUCT & PROGRAM STATE ==========
  selectedProduct: ProductType | null;
  programSummary: ProgramSummary | null;
  programLoading: boolean;
  programError: string | null;

  // ========== UI STATE ==========
  isConfiguratorOpen: boolean;
  editingSectionId: string | null;
  
  // ========== TEMPLATE MANAGEMENT STATE ==========
  // Note: These are derived from plan.metadata, but we keep them here
  // for easier access. They sync with plan.metadata automatically.
  disabledSectionIds: string[];
  disabledDocumentIds: string[];
  customSections: SectionTemplate[];
  customDocuments: DocumentTemplate[];
  
  // All available templates (for configurator UI)
  allSections: SectionTemplate[];
  allDocuments: DocumentTemplate[];
  
  // ========== FORM STATE (Add/Edit forms) ==========
  showAddSection: boolean;
  showAddDocument: boolean;
  newSectionTitle: string;
  newSectionDescription: string;
  newDocumentName: string;
  newDocumentDescription: string;
  
  // ========== EXPANSION STATE (Which items are expanded) ==========
  expandedSectionId: string | null;
  expandedDocumentId: string | null;
  
  // ========== EDITING STATE (Which items are being edited) ==========
  editingSection: SectionTemplate | null;
  editingDocument: DocumentTemplate | null;
  
  // ========== DOCUMENT SELECTION STATE ==========
  clickedDocumentId: string | null;
  
  // ========== LOADING STATES ==========
  templateLoading: boolean;
  templateError: string | null;
}

// ============================================================================
// ACTIONS INTERFACE - All ways to update state
// ============================================================================

export interface EditorActions {
  // Plan actions
  setPlan: (plan: BusinessPlan | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setProgressSummary: (summary: ProgressSummary[]) => void;
  
  // Navigation actions
  setActiveSectionId: (id: string | null) => void;
  setActiveQuestionId: (id: string | null) => void;
  
  // Product & Program actions
  setSelectedProduct: (product: ProductType | null) => void;
  setProgramSummary: (summary: ProgramSummary | null) => void;
  setProgramLoading: (loading: boolean) => void;
  setProgramError: (error: string | null) => void;
  
  // UI actions
  setIsConfiguratorOpen: (open: boolean) => void;
  setEditingSectionId: (id: string | null) => void;
  
  // Template management actions
  setDisabledSectionIds: (ids: string[]) => void;
  setDisabledDocumentIds: (ids: string[]) => void;
  setCustomSections: (sections: SectionTemplate[]) => void;
  setCustomDocuments: (documents: DocumentTemplate[]) => void;
  setAllSections: (sections: SectionTemplate[]) => void;
  setAllDocuments: (documents: DocumentTemplate[]) => void;
  
  // Form actions
  setShowAddSection: (show: boolean) => void;
  setShowAddDocument: (show: boolean) => void;
  setNewSectionTitle: (title: string) => void;
  setNewSectionDescription: (description: string) => void;
  setNewDocumentName: (name: string) => void;
  setNewDocumentDescription: (description: string) => void;
  
  // Expansion actions
  setExpandedSectionId: (id: string | null) => void;
  setExpandedDocumentId: (id: string | null) => void;
  
  // Editing actions
  setEditingSection: (section: SectionTemplate | null) => void;
  setEditingDocument: (document: DocumentTemplate | null) => void;
  
  // Document selection actions
  setClickedDocumentId: (id: string | null) => void;
  
  // Loading actions
  setTemplateLoading: (loading: boolean) => void;
  setTemplateError: (error: string | null) => void;
  
  // Helper actions (combine multiple updates)
  resetFormState: () => void;
  syncTemplateStateFromPlan: () => void;
}

// ============================================================================
// STORE TYPE
// ============================================================================

export type EditorStore = EditorState & EditorActions;

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: EditorState = {
  // Plan data
  plan: null,
  isLoading: false,
  error: null,
  progressSummary: [],
  
  // Navigation
  activeSectionId: null,
  activeQuestionId: null,
  
  // Product & Program
  selectedProduct: null,
  programSummary: null,
  programLoading: false,
  programError: null,
  
  // UI
  isConfiguratorOpen: false,
  editingSectionId: null,
  
  // Template management
  disabledSectionIds: [],
  disabledDocumentIds: [],
  customSections: [],
  customDocuments: [],
  allSections: [],
  allDocuments: [],
  
  // Form state
  showAddSection: false,
  showAddDocument: false,
  newSectionTitle: '',
  newSectionDescription: '',
  newDocumentName: '',
  newDocumentDescription: '',
  
  // Expansion
  expandedSectionId: null,
  expandedDocumentId: null,
  
  // Editing
  editingSection: null,
  editingDocument: null,
  
  // Document selection
  clickedDocumentId: null,
  
  // Loading
  templateLoading: false,
  templateError: null,
};

// ============================================================================
// ZUSTAND STORE CREATION
// ============================================================================

export const useEditorStore = create<EditorStore>((set, get) => ({
  ...initialState,
  
  // ========== PLAN ACTIONS ==========
  setPlan: (plan) => {
    set({ plan });
    // Auto-sync template state from plan when plan changes
    get().syncTemplateStateFromPlan();
  },
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setProgressSummary: (summary) => set({ progressSummary: summary }),
  
  // ========== NAVIGATION ACTIONS ==========
  setActiveSectionId: (id) => set({ activeSectionId: id }),
  setActiveQuestionId: (id) => set({ activeQuestionId: id }),
  
  // ========== PRODUCT & PROGRAM ACTIONS ==========
  setSelectedProduct: (product) => {
    set({ selectedProduct: product });
    // Also update plan.productType if plan exists
    const plan = get().plan;
    if (plan) {
      plan.productType = product;
    }
  },
  setProgramSummary: (summary) => set({ programSummary: summary }),
  setProgramLoading: (loading) => set({ programLoading: loading }),
  setProgramError: (error) => set({ programError: error }),
  
  // ========== UI ACTIONS ==========
  setIsConfiguratorOpen: (open) => set({ isConfiguratorOpen: open }),
  setEditingSectionId: (id) => set({ editingSectionId: id }),
  
  // ========== TEMPLATE MANAGEMENT ACTIONS ==========
  setDisabledSectionIds: (ids) => {
    set({ disabledSectionIds: ids });
    // Sync to plan.metadata
    const plan = get().plan;
    if (plan && plan.metadata) {
      plan.metadata.disabledSectionIds = ids;
    }
  },
  setDisabledDocumentIds: (ids) => {
    set({ disabledDocumentIds: ids });
    // Sync to plan.metadata
    const plan = get().plan;
    if (plan && plan.metadata) {
      plan.metadata.disabledDocumentIds = ids;
    }
  },
  setCustomSections: (sections) => {
    set({ customSections: sections });
    // Sync to plan.metadata
    const plan = get().plan;
    if (plan && plan.metadata) {
      plan.metadata.customSections = sections;
    }
  },
  setCustomDocuments: (documents) => {
    set({ customDocuments: documents });
    // Sync to plan.metadata
    const plan = get().plan;
    if (plan && plan.metadata) {
      plan.metadata.customDocuments = documents;
    }
  },
  setAllSections: (sections) => set({ allSections: sections }),
  setAllDocuments: (documents) => set({ allDocuments: documents }),
  
  // ========== FORM ACTIONS ==========
  setShowAddSection: (show) => set({ showAddSection: show }),
  setShowAddDocument: (show) => set({ showAddDocument: show }),
  setNewSectionTitle: (title) => set({ newSectionTitle: title }),
  setNewSectionDescription: (description) => set({ newSectionDescription: description }),
  setNewDocumentName: (name) => set({ newDocumentName: name }),
  setNewDocumentDescription: (description) => set({ newDocumentDescription: description }),
  
  // ========== EXPANSION ACTIONS ==========
  setExpandedSectionId: (id) => set({ expandedSectionId: id }),
  setExpandedDocumentId: (id) => set({ expandedDocumentId: id }),
  
  // ========== EDITING ACTIONS ==========
  setEditingSection: (section) => set({ editingSection: section }),
  setEditingDocument: (document) => set({ editingDocument: document }),
  
  // ========== DOCUMENT SELECTION ACTIONS ==========
  setClickedDocumentId: (id) => set({ clickedDocumentId: id }),
  
  // ========== LOADING ACTIONS ==========
  setTemplateLoading: (loading) => set({ templateLoading: loading }),
  setTemplateError: (error) => set({ templateError: error }),
  
  // ========== HELPER ACTIONS ==========
  resetFormState: () => {
    set({
      showAddSection: false,
      showAddDocument: false,
      newSectionTitle: '',
      newSectionDescription: '',
      newDocumentName: '',
      newDocumentDescription: '',
    });
  },
  
  syncTemplateStateFromPlan: () => {
    const plan = get().plan;
    if (!plan || !plan.metadata) return;
    
    set({
      disabledSectionIds: plan.metadata.disabledSectionIds || [],
      disabledDocumentIds: plan.metadata.disabledDocumentIds || [],
      customSections: plan.metadata.customSections || [],
      customDocuments: plan.metadata.customDocuments || [],
      selectedProduct: plan.productType || get().selectedProduct,
    });
  },
}));

// ============================================================================
// SELECTORS - Computed/derived values
// ============================================================================

/**
 * Get disabled sections as a Set (for easier Set operations)
 */
export const useDisabledSectionsSet = () => {
  return useEditorStore((state) => new Set(state.disabledSectionIds));
};

/**
 * Get disabled documents as a Set (for easier Set operations)
 */
export const useDisabledDocumentsSet = () => {
  return useEditorStore((state) => new Set(state.disabledDocumentIds));
};

/**
 * Get visible (enabled) sections
 */
export const useVisibleSections = () => {
  return useEditorStore((state) => 
    state.allSections.filter(s => !state.disabledSectionIds.includes(s.id))
  );
};

/**
 * Get visible (enabled) documents
 */
export const useVisibleDocuments = () => {
  return useEditorStore((state) => 
    state.allDocuments.filter(d => !state.disabledDocumentIds.includes(d.id))
  );
};

/**
 * Get effective editing section ID (editingSectionId || activeSectionId || first section)
 */
export const useEffectiveEditingSectionId = () => {
  return useEditorStore((state) => {
    if (state.editingSectionId) return state.editingSectionId;
    if (state.activeSectionId) return state.activeSectionId;
    if (state.plan?.sections && state.plan.sections.length > 0) {
      return state.plan.sections[0].id;
    }
    return null;
  });
};

// ============================================================================
// NEW SELECTORS - Using centralized section/document helpers
// ============================================================================

/**
 * Hook to get sections for configuration view
 * Combines normal sections with special sections in correct order
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
 */
export const useDocumentsForConfig = (): DocumentWithMetadata[] => {
  return useEditorStore((state) =>
    buildDocumentsForConfig({
      allDocuments: state.allDocuments,
      disabledDocumentIds: state.disabledDocumentIds,
      selectedProductMeta: null, // Not needed for config view
    })
  );
};

/**
 * Hook to get documents for documents bar view
 */
export const useDocumentsForBar = (): DocumentWithMetadata[] => {
  return useEditorStore((state) =>
    buildDocumentsForBar({
      allDocuments: state.allDocuments,
      disabledDocumentIds: state.disabledDocumentIds,
      selectedProductMeta: null, // Core product handled separately in UI
    })
  );
};

/**
 * Hook to get document counts (enabled and total)
 */
export const useDocumentCounts = (): {
  enabledCount: number;
  totalCount: number;
} => {
  return useEditorStore((state) =>
    getDocumentCounts(state.allDocuments, state.disabledDocumentIds)
  );
};
