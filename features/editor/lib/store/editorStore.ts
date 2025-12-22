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
import { MASTER_SECTIONS } from '../templates';

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
  updateSection: (sectionId: string, updates: Partial<{content: string; title: string; [key: string]: any}>) => void;
  addCustomSection: (title: string, description?: string) => void;
  removeCustomSection: (sectionId: string) => void;
  
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
  
  updateSection: (sectionId, updates) => {
    const plan = get().plan;
    if (!plan || !plan.sections) return;
    
    const updatedSections = plan.sections.map(section => {
      if (section.id === sectionId || section.key === sectionId) {
        return { ...section, ...updates };
      }
      return section;
    });
    
    set({ plan: { ...plan, sections: updatedSections } });
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
  
  // ========== NAVIGATION ACTIONS ==========
  setActiveSectionId: (id) => set({ activeSectionId: id }),
  setActiveQuestionId: (id) => set({ activeQuestionId: id }),
  
  // ========== PRODUCT & PROGRAM ACTIONS ==========
  setSelectedProduct: (product) => {
    const currentPlan = get().plan;
    let allSections = get().allSections;
    const disabledSectionIds = get().disabledSectionIds;
    
    // If allSections is empty and product is selected, load from templates
    if (allSections.length === 0 && product) {
      allSections = MASTER_SECTIONS[product] || [];
      set({ allSections });
    }
    
    // If no plan exists and product is selected, create a new plan
    if (!currentPlan && product && allSections.length > 0) {
      // Build sections from allSections template (excluding disabled ones)
      const planSections = allSections
        .filter(section => !disabledSectionIds.includes(section.id))
        .map(section => ({
          key: section.id,
          id: section.id,
          title: section.title || section.name || '',
          content: '', // Empty content initially
          fields: {
            displayTitle: section.title || section.name,
            sectionNumber: null,
          },
          status: 'draft',
        }));
      
      // Create new plan with basic structure
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
      // Plan exists or no product selected, just update product type
      set({ selectedProduct: product });
      if (currentPlan && product) {
        currentPlan.productType = product;
      }
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
