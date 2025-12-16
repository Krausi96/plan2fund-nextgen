/**
 * ============================================================================
 * UNIFIED GLOBAL EDITOR STATE STORE
 * ============================================================================
 * 
 * This is the SINGLE SOURCE OF TRUTH for all editor state.
 * Uses Zustand for state management.
 * 
 * WHAT IT DOES:
 *   - Manages all editor state (plan data, UI state, templates, etc.)
 *   - Provides actions to update state
 *   - Exports computed selectors (hooks) for derived state
 *   - Contains helper functions and constants for UI styling
 * 
 * USED BY:
 *   - Editor.tsx - Main editor component
 *   - Sidebar.tsx - Section navigation sidebar
 *   - DocumentsBar.tsx - Document selection bar
 *   - CurrentSelection.tsx - Product/program selection
 *   - SectionEditor.tsx - Section editing interface
 *   - PreviewWorkspace.tsx - Document preview
 *   - All hooks in hooks/ directory
 * 
 * KEY CONCEPTS:
 *   - EditorState: All state properties (plan, UI state, templates, etc.)
 *   - EditorActions: All state update functions
 *   - Selectors: Computed hooks like useSectionsForSidebar, useHasPlan
 *   - Helpers: Utility functions for UI (styles, calculations, etc.)
 * 
 * STATE CATEGORIES:
 *   1. Plan Data: The actual business plan content
 *   2. Navigation: Active section/question IDs
 *   3. Product & Program: Selected product type and program info
 *   4. UI State: Configurator open/closed, editing states
 *   5. Template Management: Sections/documents templates and disabled lists
 *   6. Form State: Add/edit form visibility and values
 *   7. Expansion State: Which items are expanded in UI
 *   8. Editing State: Which items are currently being edited
 * ============================================================================
 */

import React from 'react';
import { create } from 'zustand';
import type { BusinessPlan, ProductType, PlanSection, SectionTemplate, DocumentTemplate, ProgramSummary, ProductOption } from '@/features/editor/lib/types';

// ============================================================================
// PRODUCT OPTIONS & HELPERS
// ============================================================================

/**
 * Default product options available in the editor
 */
export const DEFAULT_PRODUCT_OPTIONS: ProductOption[] = [
  {
    value: 'submission',
    label: 'Submission',
    description: 'Optimized for grant applications with all required sections for formal submissions',
    icon: '📋',
  },
  {
    value: 'review',
    label: 'Review',
    description: 'Focused on revisions of existing documents',
    icon: '🔍',
  },
  {
    value: 'strategy',
    label: 'Strategy',
    description: 'Designed for strategic planning and business development',
    icon: '📊',
  },
];

/**
 * Get product metadata for a given product type
 */
export function getSelectedProductMeta(
  options: ProductOption[],
  product: ProductType | null
): ProductOption | null {
  if (!product) return null;
  return options.find((option) => option.value === product) ?? null;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export type SectionWithMetadata = {
  id: string;
  title: string;
  isDisabled: boolean;
  origin?: 'template' | 'custom';
  isSpecial: boolean;
  required?: boolean;
  [key: string]: any;
};

export type DocumentWithMetadata = {
  id: string;
  name: string;
  isDisabled: boolean;
  origin?: 'template' | 'custom';
  [key: string]: any;
};

// ============================================================================
// HELPER CONSTANTS AND FUNCTIONS (inlined from helpers)
// ============================================================================

export const METADATA_SECTION_ID = 'metadata';
export const ANCILLARY_SECTION_ID = 'ancillary';
export const REFERENCES_SECTION_ID = 'references';
export const APPENDICES_SECTION_ID = 'appendices';

export function isSpecialSectionId(sectionId: string): boolean {
  return [
    METADATA_SECTION_ID,
    ANCILLARY_SECTION_ID,
    REFERENCES_SECTION_ID,
    APPENDICES_SECTION_ID
  ].includes(sectionId);
}

export function getSectionTitle(
  sectionId: string,
  originalTitle: string,
  t?: (key: any) => string
): string {
  if (sectionId === METADATA_SECTION_ID) {
    return t?.('editor.sections.metadata.title' as any) || 'Title Page';
  }
  if (sectionId === ANCILLARY_SECTION_ID) {
    return t?.('editor.sections.ancillary.title' as any) || 'Table of Contents';
  }
  if (sectionId === REFERENCES_SECTION_ID) {
    return t?.('editor.sections.references.title' as any) || 'References';
  }
  if (sectionId === APPENDICES_SECTION_ID) {
    return t?.('editor.sections.appendices.title' as any) || 'Appendices';
  }
  return originalTitle;
}

type BuildSectionsForSidebarParams = {
  planSections?: PlanSection[] | null;
  allSections: SectionTemplate[];
  disabledSectionIds: string[];
  filteredSectionIds?: string[] | null;
  selectedProduct?: string | null;
  isNewUser?: boolean;
  getTitle: (sectionId: string, originalTitle: string) => string;
};

export function buildSectionsForSidebar(params: BuildSectionsForSidebarParams): SectionWithMetadata[] {
  const {
    planSections = [],
    allSections,
    disabledSectionIds,
    filteredSectionIds,
    isNewUser = false,
    getTitle
  } = params;

  if (isNewUser || !allSections.length) {
    return (planSections || []).map(section => ({
      id: section.id,
      title: getTitle(section.id, section.title),
      isDisabled: disabledSectionIds.includes(section.id),
      origin: 'template' as const,
      isSpecial: isSpecialSectionId(section.id),
      required: false
    }));
  }

  const sections: SectionWithMetadata[] = [];
  const processedIds = new Set<string>();

  // Add plan sections first
  (planSections || []).forEach(section => {
    if (!filteredSectionIds || filteredSectionIds.includes(section.id)) {
      const template = allSections.find(s => s.id === section.id);
      sections.push({
        id: section.id,
        title: getTitle(section.id, section.title),
        isDisabled: disabledSectionIds.includes(section.id),
        origin: template?.origin || 'template',
        isSpecial: isSpecialSectionId(section.id),
        required: template?.required ?? false
      });
      processedIds.add(section.id);
    }
  });

  // Add template sections not in plan
  allSections.forEach(template => {
    if (!processedIds.has(template.id)) {
      if (!filteredSectionIds || filteredSectionIds.includes(template.id)) {
        sections.push({
          id: template.id,
          title: getTitle(template.id, template.title),
          isDisabled: disabledSectionIds.includes(template.id),
          origin: template.origin || 'template',
          isSpecial: isSpecialSectionId(template.id),
          required: template.required ?? false
        });
      }
    }
  });

  return sections;
}

type BuildSectionsForConfigParams = {
  allSections: SectionTemplate[];
  disabledSectionIds: string[];
  includeAncillary?: boolean;
  includeReferences?: boolean;
  includeAppendices?: boolean;
  getTitle: (sectionId: string, originalTitle: string) => string;
};

export function buildSectionsForConfig(params: BuildSectionsForConfigParams): SectionWithMetadata[] {
  const {
    allSections,
    disabledSectionIds,
    includeAncillary = false,
    includeReferences = false,
    includeAppendices = false,
    getTitle
  } = params;

  return allSections
    .filter(section => {
      if (section.id === ANCILLARY_SECTION_ID && !includeAncillary) return false;
      if (section.id === REFERENCES_SECTION_ID && !includeReferences) return false;
      if (section.id === APPENDICES_SECTION_ID && !includeAppendices) return false;
      return true;
    })
    .map(section => ({
      id: section.id,
      title: getTitle(section.id, section.title),
      isDisabled: disabledSectionIds.includes(section.id),
      origin: section.origin || 'template',
      isSpecial: isSpecialSectionId(section.id),
      required: section.required ?? false
    }));
}

type BuildDocumentsForConfigParams = {
  allDocuments: DocumentTemplate[];
  disabledDocumentIds: string[];
  selectedProductMeta?: any | null;
};

export function buildDocumentsForConfig(params: BuildDocumentsForConfigParams): DocumentWithMetadata[] {
  const { allDocuments, disabledDocumentIds } = params;

  return allDocuments.map(doc => ({
    id: doc.id,
    name: doc.name,
    isDisabled: disabledDocumentIds.includes(doc.id),
    origin: doc.origin || 'template'
  }));
}

export function buildDocumentsForBar(params: BuildDocumentsForConfigParams): DocumentWithMetadata[] {
  return buildDocumentsForConfig(params);
}

export function getDocumentCounts(
  allDocuments: DocumentTemplate[],
  disabledDocumentIds: string[]
): { enabledCount: number; totalCount: number } {
  return {
    enabledCount: allDocuments.filter(doc => !disabledDocumentIds.includes(doc.id)).length,
    totalCount: allDocuments.length
  };
}

type ProgressSummary = any;
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
// SELECTORS MOVED TO hooks/selectors.ts
// ============================================================================
// All selector hooks have been moved to hooks/selectors.ts for better organization.
// This file now only contains the store definition and helper functions.
// Import selectors from '@/features/editor/lib' or '@/features/editor/lib/hooks/selectors'

// ============================================================================
// UI HELPERS & STYLES - Used by components
// ============================================================================

export const SECTION_STYLES = {
  collapsed: {
    container: 'space-y-1',
    button: {
      disabled: 'opacity-50 cursor-not-allowed',
      active: 'bg-blue-600/40 border-blue-400',
      default: 'bg-white/5 border-white/10 hover:bg-white/10',
    },
  },
  cardContainer: 'space-y-2',
  card: {
    container: 'space-y-2',
    item: {
      disabled: 'opacity-50 border-white/10',
      active: 'border-blue-400 bg-blue-600/20',
      required: 'border-amber-400 bg-amber-600/20',
      default: 'border-white/20 bg-white/5 hover:bg-white/10',
    },
  },
  list: {
    container: 'space-y-2',
    item: {
      disabled: 'opacity-50 border-white/10',
      active: 'border-blue-400 bg-blue-600/20',
      required: 'border-amber-400 bg-amber-600/20',
      default: 'border-white/20 bg-white/5 hover:bg-white/10',
    },
  },
};

export const INLINE_STYLES = {
  fullWidth: { width: '100%' },
  paddingBottom: { paddingBottom: '1rem' },
  paddingBottomLarge: { paddingBottom: '2rem' },
  overflowHidden: { overflow: 'hidden' },
  headerBorder: { borderBottom: '1px solid rgba(255, 255, 255, 0.1)' },
};

export const SIDEBAR_STYLES = {
  container: (collapsed: boolean) => collapsed ? 'w-16' : 'w-80',
  sidebarStyle: (collapsed: boolean) => ({
    width: collapsed ? '64px' : '320px',
    minWidth: collapsed ? '64px' : '320px',
    maxWidth: collapsed ? '64px' : '320px',
  }),
  contentStyle: () => ({}),
  header: 'text-lg font-bold uppercase tracking-wide text-white mb-2 pb-2',
  legend: 'text-xs text-white/50 mb-2 flex items-center gap-2',
  newUserMessage: 'text-white/60 text-center py-4 text-sm',
  addButton: {
    active: 'w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2',
    inactive: 'w-full px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center justify-center gap-2',
  },
};

export const DOCUMENTS_BAR_STYLES = {
  editFormContainer: 'border border-white/20 bg-white/10 rounded-lg p-4 mb-3',
  editFormInner: 'space-y-2',
  header: 'mb-2',
  headerTitle: 'text-lg font-bold uppercase tracking-wide text-white',
  scrollContainer: {
    className: 'flex gap-2 overflow-x-auto pb-2',
    style: { scrollbarWidth: 'thin' as const },
  },
  newUserCard: 'px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/60 text-sm text-center min-w-[200px]',
  addButton: {
    active: 'px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2 min-w-[120px]',
    inactive: 'px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center justify-center gap-2 min-w-[120px]',
  },
  documentCard: {
    selected: 'border-blue-400 bg-blue-600/20',
    unselected: 'opacity-50 border-white/10',
    disabled: 'opacity-30 border-white/5 cursor-not-allowed',
    required: 'border-amber-400 bg-amber-600/20',
    default: 'border-white/20 bg-white/5 hover:bg-white/10 cursor-pointer',
  },
  coreProductCard: {
    selected: 'border-blue-400 bg-blue-600/20',
    unselected: 'opacity-50 border-white/10',
    default: 'border-white/20 bg-white/5 hover:bg-white/10 cursor-pointer',
  },
  container: (showAddDocument: boolean) => ({
    minHeight: showAddDocument ? '200px' : 'auto',
  }),
};

/**
 * Calculate completion percentage for a section
 */
export function calculateCompletion(_section: SectionWithMetadata): number {
  // Parameter prefixed with _ to indicate intentionally unused
  // Placeholder - should calculate based on section content
  return 0;
}

/**
 * Get progress intent color based on completion percentage
 */
export function getProgressIntent(completion: number): 'primary' | 'success' | 'warning' | 'neutral' {
  if (completion >= 80) return 'success';
  if (completion >= 50) return 'warning';
  if (completion > 0) return 'primary';
  return 'neutral';
}

/**
 * Check if click should be ignored (e.g., on buttons, inputs)
 */
export function shouldIgnoreClick(target: HTMLElement): boolean {
  const tagName = target.tagName.toLowerCase();
  const isInteractive = ['button', 'input', 'select', 'textarea', 'a'].includes(tagName);
  const isCheckbox = target.closest('input[type="checkbox"]');
  const isButton = target.closest('button');
  return isInteractive || !!isCheckbox || !!isButton;
}

// ============================================================================
// RENDERER UTILITIES - For document/section rendering
// ============================================================================

/**
 * Page style for export preview
 */
export const PAGE_STYLE: React.CSSProperties = {
  width: '210mm',
  minHeight: '297mm',
  margin: '0 auto',
  padding: '20mm',
  backgroundColor: '#ffffff',
  boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
};

/**
 * Editor styles for section editor
 */
export const EDITOR_STYLES = {
  welcome: 'flex items-center justify-center h-full w-full',
  welcomeContent: 'text-center',
  welcomeIcon: 'text-6xl mb-4',
  welcomeTitle: 'text-xl font-semibold text-gray-800 mb-2',
  welcomeText: 'text-gray-600',
  container: 'fixed inset-0 z-50 flex items-center justify-center bg-black/50',
  editorInner: 'bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col',
  header: 'flex items-center justify-between p-4 border-b',
  sectionTitle: 'text-xl font-semibold text-gray-900',
  closeButton: 'text-gray-500 hover:text-gray-700 text-2xl leading-none',
  content: 'flex-1 overflow-y-auto p-4',
  sectionContent: 'prose max-w-none',
  sectionId: 'text-sm text-gray-500 mt-4',
};

/**
 * Get translation function based on language
 */
export function getTranslation(isGerman: boolean) {
  return {
    tableOfContents: isGerman ? 'Inhaltsverzeichnis' : 'Table of Contents',
    listOfFigures: isGerman ? 'Abbildungsverzeichnis' : 'List of Figures',
    listOfTables: isGerman ? 'Tabellenverzeichnis' : 'List of Tables',
    references: isGerman ? 'Literaturverzeichnis' : 'References',
    appendices: isGerman ? 'Anhänge' : 'Appendices',
    page: isGerman ? 'Seite' : 'Page',
    figure: isGerman ? 'Abbildung' : 'Figure',
    noReferencesYet: isGerman ? 'Noch keine Referenzen' : 'No references yet',
    noAppendicesYet: isGerman ? 'Noch keine Anhänge' : 'No appendices yet',
    businessPlan: isGerman ? 'Businessplan' : 'Business Plan',
    author: isGerman ? 'Autor' : 'Author',
    email: isGerman ? 'E-Mail' : 'Email',
    phone: isGerman ? 'Telefon' : 'Phone',
    website: isGerman ? 'Website' : 'Website',
    address: isGerman ? 'Adresse' : 'Address',
    date: isGerman ? 'Datum' : 'Date',
  };
}

/**
 * Calculate page number based on section index
 */
export function calculatePageNumber(
  sectionIndex: number,
  includeTitlePage: boolean,
  offset: number = 0
): number {
  let pageNumber = sectionIndex + 1 + offset;
  if (includeTitlePage) pageNumber += 1;
  return pageNumber;
}

/**
 * Format table label from key
 */
export function formatTableLabel(key: string): string {
  // Convert camelCase or snake_case to Title Case
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Render table component
 */
export function renderTable(table: any): React.ReactNode {
  // Placeholder - would render actual table component
  return React.createElement('div', null, `Table: ${JSON.stringify(table)}`);
}

/**
 * Normalize program input (extract program ID from URL or return as-is)
 */
export function normalizeProgramInput(input: string): string | null {
  if (!input || !input.trim()) return null;
  
  const trimmed = input.trim();
  
  // If it's already a simple ID, return it
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return trimmed;
  }
  
  // Try to extract from URL
  try {
    const url = new URL(trimmed);
    // Extract ID from pathname or return hostname
    const pathParts = url.pathname.split('/').filter(Boolean);
    return pathParts[pathParts.length - 1] || url.hostname;
  } catch {
    // Not a valid URL, return trimmed input
    return trimmed;
  }
}
