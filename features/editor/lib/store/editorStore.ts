import { create } from 'zustand';
import type { SetupWizardState } from '../types/types';
import { createPlanDomain } from './domains/planDomain';
import { createTemplateDomain } from './domains/templateDomain';
import { createSetupWizardDomain } from './domains/setupWizardDomain';
import { createUIDomain } from './domains/uiDomain';
import { createProgramDomain } from './domains/programDomain';

// =============================================================================
// SEPARATION OF CONCERNS - MULTI-FILE APPROACH
// =============================================================================
// This store now imports domain-specific logic from separate files:
//
// 1. PLAN DOMAIN (planDomain.ts)
//    - Business plan structure and content
//    - Section content updates
//    - Loading/error states
//
// 2. TEMPLATE DOMAIN (templateDomain.ts)
//    - Section/document templates
//    - Custom section management
//    - Product selection
//
// 3. SETUP WIZARD DOMAIN (setupWizardDomain.ts)
//    - Wizard step management
//    - Profile data collection
//    - Document structure setup
//
// 4. UI DOMAIN (uiDomain.ts)
//    - Form states (show/hide, editing)
//    - Expansion states
//    - Temporary UI flags
//
// 5. PROGRAM DOMAIN (programDomain.ts)
//    - Funding program data
//    - Configurator state
//
// Each domain file contains PURE actions with NO UI side effects

export interface EditorState {
  // Plan Domain State
  plan: any | null;
  isLoading: boolean;
  error: string | null;
  
  // Template Domain State
  selectedProduct: any | null;
  disabledSectionIds: string[];
  disabledDocumentIds: string[];
  customSections: any[];
  customDocuments: any[];
  allSections: any[];
  allDocuments: any[];
  activeSectionId: string | null;
  
  // Setup Wizard State
  setupWizard: SetupWizardState;
  
  // UI Domain State
  showAddSection: boolean;
  showAddDocument: boolean;
  newSectionTitle: string;
  newDocumentName: string;
  expandedSectionId: string | null;
  expandedDocumentId: string | null;
  editingSection: any | null;
  editingDocument: any | null;
  clickedDocumentId: string | null;
  
  // Program Domain State
  programSummary: any | null;
  programLoading: boolean;
  programError: string | null;
  isConfiguratorOpen: boolean;
}

export interface EditorActions {
  // Plan Domain Actions
  setPlan: (plan: any | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateSection: (sectionId: string, updates: Partial<{content: string; title: string; [key: string]: any}>) => void;
  
  // Template Domain Actions
  addCustomSection: (title: string, description?: string) => void;
  removeCustomSection: (sectionId: string) => void;
  setActiveSectionId: (id: string | null, source?: 'sidebar' | 'scroll' | 'editor' | 'direct') => void;
  setSelectedProduct: (product: any | null) => void;
  setDisabledSectionIds: (ids: string[]) => void;
  setDisabledDocumentIds: (ids: string[]) => void;
  setCustomSections: (sections: any[]) => void;
  setCustomDocuments: (documents: any[]) => void;
  setAllSections: (sections: any[]) => void;
  setAllDocuments: (documents: any[]) => void;
  
  // Setup Wizard Actions
  setSetupWizardStep: (step: 1 | 2 | 3) => void;
  setProjectProfile: (profile: any | null) => void;
  setProgramProfile: (profile: any | null) => void;
  setDocumentTemplateId: (templateId: any | null) => void;
  setDocumentStructure: (structure: any | null) => void;
  setSetupStatus: (status: 'none' | 'draft' | 'confirmed' | 'locked') => void;
  setSetupDiagnostics: (diagnostics: any | null) => void;
  completeSetupWizard: () => void;
  resetSetupWizard: () => void;
  
  // UI Domain Actions
  setShowAddSection: (show: boolean) => void;
  setShowAddDocument: (show: boolean) => void;
  setNewSectionTitle: (title: string) => void;
  setNewDocumentName: (name: string) => void;
  setExpandedSectionId: (id: string | null) => void;
  setExpandedDocumentId: (id: string | null) => void;
  setEditingSection: (section: any | null) => void;
  setEditingDocument: (document: any | null) => void;
  setClickedDocumentId: (id: string | null) => void;
  resetFormState: () => void;
  
  // Program Domain Actions
  setProgramSummary: (summary: any | null) => void;
  setProgramLoading: (loading: boolean) => void;
  setProgramError: (error: string | null) => void;
  setIsConfiguratorOpen: (open: boolean) => void;
  
  // Utility Actions
  syncTemplateStateFromPlan: () => void;
}

export type EditorStore = EditorState & EditorActions;

const initialState: EditorState = {
  // Plan Domain Initial State
  plan: null,
  isLoading: false,
  error: null,
  
  // Template Domain Initial State
  selectedProduct: null,
  disabledSectionIds: [],
  disabledDocumentIds: [],
  customSections: [],
  customDocuments: [],
  allSections: [],
  allDocuments: [],
  activeSectionId: null,
  
  // Setup Wizard Initial State
  setupWizard: {
    currentStep: 1,
    projectProfile: null,
    programProfile: null,
    documentTemplateId: null,
    isComplete: false,
    documentStructure: null,
    setupStatus: 'none',
    setupVersion: '1.0',
    setupSource: 'standard',
    setupDiagnostics: null
  },
  
  // UI Domain Initial State
  showAddSection: false,
  showAddDocument: false,
  newSectionTitle: '',
  newDocumentName: '',
  expandedSectionId: null,
  expandedDocumentId: null,
  editingSection: null,
  editingDocument: null,
  clickedDocumentId: null,
  
  // Program Domain Initial State
  programSummary: null,
  programLoading: false,
  programError: null,
  isConfiguratorOpen: false,
};

export const useEditorStore = create<EditorStore>((set, get) => ({
  ...initialState,
  
  // ===========================================================================
  // COMBINE ALL DOMAIN-SPECIFIC ACTIONS
  // Each domain file contains PURE actions with NO UI side effects
  // This eliminates duplication between store actions and components
  // ===========================================================================
  ...createPlanDomain(set, get),        // Plan structure & content
  ...createTemplateDomain(set, get),    // Templates & navigation
  ...createSetupWizardDomain(set),      // Setup wizard flow
  ...createUIDomain(set),               // UI form states
  ...createProgramDomain(set),          // Program/funding data
  
  syncTemplateStateFromPlan: () => {
    // Pure action - no side effects
    // Side effect moved to selector/computed state
  },
}));

// Selectors for computed/derived state
export const useActiveSection = () => {
  const { plan, activeSectionId } = useEditorStore();
  if (!plan?.sections || !activeSectionId) return null;
  return plan.sections.find((s: any) => s.id === activeSectionId || s.key === activeSectionId) || null;
};

export const useIsSectionDisabled = (sectionId: string) => {
  const { disabledSectionIds } = useEditorStore();
  return disabledSectionIds.includes(sectionId);
};

export const useIsDocumentDisabled = (documentId: string) => {
  const { disabledDocumentIds } = useEditorStore();
  return disabledDocumentIds.includes(documentId);
};

export const useSetupProgress = () => {
  const { setupWizard } = useEditorStore();
  const totalSteps = 3;
  const progress = (setupWizard.currentStep / totalSteps) * 100;
  return {
    currentStep: setupWizard.currentStep,
    totalSteps,
    progress,
    isComplete: setupWizard.isComplete
  };
};

export const useAllSectionsWithTemplates = () => {
  const { allSections, customSections } = useEditorStore();
  return [...allSections, ...customSections];
};

export const useAllDocumentsWithTemplates = () => {
  const { allDocuments, customDocuments } = useEditorStore();
  return [...allDocuments, ...customDocuments];
};
