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
 * 
 * USED BY:
 *   - All editor components via hooks
 *   - All hooks in hooks/ directory
 * 
 * KEY CONCEPTS:
 *   - EditorState: All state properties (plan, UI state, templates, etc.)
 *   - EditorActions: All state update functions
 *   - EditorStore: Combined state + actions
 * ============================================================================
 */

import { create } from 'zustand';
import type { BusinessPlan, ProductType, SectionTemplate, DocumentTemplate, ProgramSummary } from '../types/types';
import { MASTER_SECTIONS, MASTER_DOCUMENTS_BY_PRODUCT } from '../templates';
import { METADATA_SECTION_ID, REFERENCES_SECTION_ID, APPENDICES_SECTION_ID } from '../constants';

// Helper types
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



// State interface
export interface EditorState {
  // ========== PLAN DATA (Core business plan) ==========
  plan: BusinessPlan | null;
  isLoading: boolean;
  error: string | null;
  // Removed: progressSummary (not used)

  // ========== NAVIGATION STATE ==========
  activeSectionId: string | null;
  // Removed: activeQuestionId (not used)

  // ========== PRODUCT & PROGRAM STATE ==========
  selectedProduct: ProductType | null;
  programSummary: ProgramSummary | null;
  programLoading: boolean;
  programError: string | null;

  // ========== UI STATE ==========
  isConfiguratorOpen: boolean;
  // Removed: editingSectionId (not used)
  
  // ========== EDITING MODE STATE ==========
  // Removed: editingMode (not used)
  
  // ========== NAVIGATION STATE ==========
  // Removed: navigationSource (not used)
  
  // ========== TEMPLATE MANAGEMENT STATE ==========
  disabledSectionIds: string[];
  disabledDocumentIds: string[];
  customSections: SectionTemplate[];
  customDocuments: DocumentTemplate[];
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
  // Removed: templateLoading, templateError (not used)
}

// Actions interface
export interface EditorActions {
  // Plan actions
  setPlan: (plan: BusinessPlan | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  // Removed: setProgressSummary (not used)
  updateSection: (sectionId: string, updates: Partial<{content: string; title: string; [key: string]: any}>) => void;
  addCustomSection: (title: string, description?: string) => void;
  removeCustomSection: (sectionId: string) => void;
  
  // Navigation actions
  setActiveSectionId: (id: string | null, source?: 'sidebar' | 'scroll' | 'editor' | 'direct') => void;
  // Removed: setActiveQuestionId (not used)
  
  // Product & Program actions
  setSelectedProduct: (product: ProductType | null) => void;
  setProgramSummary: (summary: ProgramSummary | null) => void;
  setProgramLoading: (loading: boolean) => void;
  setProgramError: (error: string | null) => void;
  
  // UI actions
  setIsConfiguratorOpen: (open: boolean) => void;
  // Removed: setEditingSectionId (not used)
  // Removed: setEditingMode (not used)
  // Removed: setNavigationSource (not used)
  
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
  // Removed: setTemplateLoading, setTemplateError (not used)
  
  // Helper actions (combine multiple updates)
  resetFormState: () => void;
  syncTemplateStateFromPlan: () => void;
}

// Store type
export type EditorStore = EditorState & EditorActions;

// Initial state
const initialState: EditorState = {
  // Core data
  plan: null,
  isLoading: false,
  error: null,
  
  // Navigation
  activeSectionId: null,
  
  // Product & Program
  selectedProduct: null,
  programSummary: null,
  programLoading: false,
  programError: null,
  
  // UI state
  isConfiguratorOpen: false,
  
  // Templates
  disabledSectionIds: [],
  disabledDocumentIds: [],
  customSections: [],
  customDocuments: [],
  allSections: [],
  allDocuments: [],
  
  // Forms
  showAddSection: false,
  showAddDocument: false,
  newSectionTitle: '',
  newSectionDescription: '',
  newDocumentName: '',
  newDocumentDescription: '',
  
  // Expansion & Editing
  expandedSectionId: null,
  expandedDocumentId: null,
  editingSection: null,
  editingDocument: null,
  
  // Selection & Loading
  clickedDocumentId: null,
};

// Zustand store
export const useEditorStore = create<EditorStore>((set, get) => ({
  ...initialState,
  
  // Plan actions
  setPlan: (plan) => {
    set({ plan });
    get().syncTemplateStateFromPlan();
  },
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  // Removed: setProgressSummary (not used)
  
  updateSection: (sectionId, updates) => {
    const plan = get().plan;
    if (!plan) return;
    
    // Handle special sections
    if (sectionId === METADATA_SECTION_ID && plan.settings?.titlePage) {
      const updatedPlan = {
        ...plan,
        settings: {
          ...plan.settings,
          titlePage: { ...plan.settings.titlePage, ...updates }
        }
      };
      set({ plan: updatedPlan });
      return;
    }
    
    if (sectionId === REFERENCES_SECTION_ID) {
      set({ plan: { ...plan, references: updates.references || plan.references || [] } });
      return;
    }
    
    if (sectionId === APPENDICES_SECTION_ID) {
      set({ plan: { ...plan, appendices: updates.appendices || plan.appendices || [] } });
      return;
    }
    
    // Regular section updates
    if (plan.sections) {
      const updatedSections = plan.sections.map(section => 
        section.id === sectionId || section.key === sectionId 
          ? { ...section, ...updates }
          : section
      );
      set({ plan: { ...plan, sections: updatedSections } });
    }
  },
  
  addCustomSection: (title, description = '') => {
    const plan = get().plan;
    const customSections = get().customSections;
    const allSections = get().allSections;
    
    // Generate unique ID
    const newSectionId = `custom_${Date.now()}`;
    
    // Create new section template
    const newSectionTemplate: SectionTemplate = {
      id: newSectionId,
      name: title,
      title: title,
      description: description,
      origin: 'custom',
      required: false,
      category: 'general',
    };
    
    // Add to customSections
    const updatedCustomSections = [...customSections, newSectionTemplate];
    set({ customSections: updatedCustomSections });
    
    // Add to allSections
    const updatedAllSections = [...allSections, newSectionTemplate];
    set({ allSections: updatedAllSections });
    
    // Add to plan if plan exists
    if (plan) {
      const newPlanSection = {
        key: newSectionId,
        id: newSectionId,
        title: title,
        content: '',
        fields: {
          displayTitle: title,
          sectionNumber: null,
        },
        status: 'draft',
      };
      
      const updatedSections = [...(plan.sections || []), newPlanSection];
      const updatedPlan = { ...plan, sections: updatedSections };
      
      // Update plan metadata
      if (updatedPlan.metadata) {
        updatedPlan.metadata.customSections = updatedCustomSections;
      }
      
      set({ plan: updatedPlan });
    }
    
    // Close the add form
    set({ showAddSection: false, newSectionTitle: '', newSectionDescription: '' });
  },
  
  removeCustomSection: (sectionId) => {
    const plan = get().plan;
    const customSections = get().customSections;
    const allSections = get().allSections;
    
    // Remove from customSections
    const updatedCustomSections = customSections.filter(s => s.id !== sectionId);
    set({ customSections: updatedCustomSections });
    
    // Remove from allSections
    const updatedAllSections = allSections.filter(s => s.id !== sectionId);
    set({ allSections: updatedAllSections });
    
    // Remove from plan if plan exists
    if (plan && plan.sections) {
      const updatedSections = plan.sections.filter(s => s.id !== sectionId && s.key !== sectionId);
      const updatedPlan = { ...plan, sections: updatedSections };
      
      // Update plan metadata
      if (updatedPlan.metadata) {
        updatedPlan.metadata.customSections = updatedCustomSections;
      }
      
      set({ plan: updatedPlan });
    }
    
    // Clear active section if it was the removed one
    const activeSectionId = get().activeSectionId;
    if (activeSectionId === sectionId) {
      set({ activeSectionId: null });
    }
  },
  
  // Navigation actions
  setActiveSectionId: (id, _source: 'sidebar' | 'scroll' | 'editor' | 'direct' = 'direct') => {
    set({ activeSectionId: id });
  },
  // Removed: setActiveQuestionId (not used)
  
  // Product & Program actions
  setSelectedProduct: (product) => {
    let allSections: SectionTemplate[] = [];
    let allDocuments: DocumentTemplate[] = [];
    
    if (product) {
      allSections = MASTER_SECTIONS[product] || [];
      allDocuments = MASTER_DOCUMENTS_BY_PRODUCT[product] || [];
      set({ allSections, allDocuments });
    }
    
    // Create/update plan with new product's sections
    if (product && allSections.length > 0) {
      const planSections = allSections.map(section => ({
        key: section.id,
        id: section.id,
        title: section.title || section.name || '',
        content: '',
        fields: {
          displayTitle: section.title || section.name,
          sectionNumber: null,
        },
        status: 'draft',
      }));
      
      const newPlan: BusinessPlan = {
        language: 'en',
        productType: product,
        settings: {
          includeTitlePage: true,
          includePageNumbers: true,
          titlePage: {
            title: '',
            companyName: '',
            date: new Date().toISOString().split('T')[0],
          },
        },
        sections: planSections,
        metadata: {
          disabledSectionIds: [],
          disabledDocumentIds: [],
          customSections: [],
          customDocuments: [],
        },
        references: [],
        appendices: [],
      };
      
      set({ selectedProduct: product, plan: newPlan });
    } else {
      set({ selectedProduct: product, plan: null });
    }
  },
  setProgramSummary: (summary) => set({ programSummary: summary }),
  setProgramLoading: (loading) => set({ programLoading: loading }),
  setProgramError: (error) => set({ programError: error }),
  
  // UI actions
  setIsConfiguratorOpen: (open) => set({ isConfiguratorOpen: open }),
  // Removed: setEditingSectionId (not used)
  // Removed: setEditingMode (not used)
  // Removed: setNavigationSource (not used)
  
  // Template management
  setDisabledSectionIds: (ids) => {
    set({ disabledSectionIds: ids });
    const plan = get().plan;
    if (plan?.metadata) plan.metadata.disabledSectionIds = ids;
  },
  setDisabledDocumentIds: (ids) => {
    set({ disabledDocumentIds: ids });
    const plan = get().plan;
    if (plan?.metadata) plan.metadata.disabledDocumentIds = ids;
  },
  setCustomSections: (sections) => {
    set({ customSections: sections });
    const plan = get().plan;
    if (plan?.metadata) plan.metadata.customSections = sections;
  },
  setCustomDocuments: (documents) => {
    set({ customDocuments: documents });
    const plan = get().plan;
    if (plan?.metadata) plan.metadata.customDocuments = documents;
  },
  setAllSections: (sections) => set({ allSections: sections }),
  setAllDocuments: (documents) => set({ allDocuments: documents }),
  
  // Forms, Expansion, Editing
  setShowAddSection: (show) => set({ showAddSection: show }),
  setShowAddDocument: (show) => set({ showAddDocument: show }),
  setNewSectionTitle: (title) => set({ newSectionTitle: title }),
  setNewSectionDescription: (description) => set({ newSectionDescription: description }),
  setNewDocumentName: (name) => set({ newDocumentName: name }),
  setNewDocumentDescription: (description) => set({ newDocumentDescription: description }),
  setExpandedSectionId: (id) => set({ expandedSectionId: id }),
  setExpandedDocumentId: (id) => set({ expandedDocumentId: id }),
  setEditingSection: (section) => set({ editingSection: section }),
  setEditingDocument: (document) => set({ editingDocument: document }),
  setClickedDocumentId: (id) => set({ clickedDocumentId: id }),
  // Removed: setTemplateLoading, setTemplateError (not used)
  
  // Helpers
  resetFormState: () => set({
    showAddSection: false,
    showAddDocument: false,
    newSectionTitle: '',
    newSectionDescription: '',
    newDocumentName: '',
    newDocumentDescription: '',
  }),
  
  syncTemplateStateFromPlan: () => {
    const plan = get().plan;
    if (!plan?.metadata) return;
    
    set({
      disabledSectionIds: plan.metadata.disabledSectionIds || [],
      disabledDocumentIds: plan.metadata.disabledDocumentIds || [],
      customSections: plan.metadata.customSections || [],
      customDocuments: plan.metadata.customDocuments || [],
      selectedProduct: plan.productType || get().selectedProduct,
    });
  },
}));
