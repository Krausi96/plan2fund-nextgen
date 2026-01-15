import { create } from 'zustand';
import type { 
  BusinessPlan, 
  ProductType, 
  SectionTemplate, 
  DocumentTemplate, 
  ProgramSummary,
  SetupWizardState,
  ProjectProfile,
  ProgramProfile,
  DocumentTemplateId
} from '../types/types';
import { MASTER_SECTIONS, MASTER_DOCUMENTS_BY_PRODUCT } from '../templates';
import { METADATA_SECTION_ID, REFERENCES_SECTION_ID, APPENDICES_SECTION_ID } from '../constants';
import { syncTemplateStateFromPlan } from '../utils';

export interface EditorState {
  plan: BusinessPlan | null;
  isLoading: boolean;
  error: string | null;
  activeSectionId: string | null;
  selectedProduct: ProductType | null;
  programSummary: ProgramSummary | null;
  programLoading: boolean;
  programError: string | null;
  isConfiguratorOpen: boolean;
  // Setup Wizard State
  setupWizard: SetupWizardState;
  disabledSectionIds: string[];
  disabledDocumentIds: string[];
  customSections: SectionTemplate[];
  customDocuments: DocumentTemplate[];
  allSections: SectionTemplate[];
  allDocuments: DocumentTemplate[];
  showAddSection: boolean;
  showAddDocument: boolean;
  newSectionTitle: string;
  newDocumentName: string;
  expandedSectionId: string | null;
  expandedDocumentId: string | null;
  editingSection: SectionTemplate | null;
  editingDocument: DocumentTemplate | null;
  clickedDocumentId: string | null;
}

export interface EditorActions {
  setPlan: (plan: BusinessPlan | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateSection: (sectionId: string, updates: Partial<{content: string; title: string; [key: string]: any}>) => void;
  addCustomSection: (title: string, description?: string) => void;
  removeCustomSection: (sectionId: string) => void;
  setActiveSectionId: (id: string | null, source?: 'sidebar' | 'scroll' | 'editor' | 'direct') => void;
  setSelectedProduct: (product: ProductType | null) => void;
  setProgramSummary: (summary: ProgramSummary | null) => void;
  setProgramLoading: (loading: boolean) => void;
  setProgramError: (error: string | null) => void;
  setIsConfiguratorOpen: (open: boolean) => void;
  // Setup Wizard Actions
  setSetupWizardStep: (step: 1 | 2 | 3) => void;
  setProjectProfile: (profile: ProjectProfile | null) => void;
  setProgramProfile: (profile: ProgramProfile | null) => void;
  setDocumentTemplateId: (templateId: DocumentTemplateId | null) => void;
  completeSetupWizard: () => void;
  resetSetupWizard: () => void;
  setDisabledSectionIds: (ids: string[]) => void;
  setDisabledDocumentIds: (ids: string[]) => void;
  setCustomSections: (sections: SectionTemplate[]) => void;
  setCustomDocuments: (documents: DocumentTemplate[]) => void;
  setAllSections: (sections: SectionTemplate[]) => void;
  setAllDocuments: (documents: DocumentTemplate[]) => void;
  setShowAddSection: (show: boolean) => void;
  setShowAddDocument: (show: boolean) => void;
  setNewSectionTitle: (title: string) => void;
  setNewDocumentName: (name: string) => void;
  setExpandedSectionId: (id: string | null) => void;
  setExpandedDocumentId: (id: string | null) => void;
  setEditingSection: (section: SectionTemplate | null) => void;
  setEditingDocument: (document: DocumentTemplate | null) => void;
  setClickedDocumentId: (id: string | null) => void;
  resetFormState: () => void;
  syncTemplateStateFromPlan: () => void;
}

export type EditorStore = EditorState & EditorActions;

const initialState: EditorState = {
  plan: null,
  isLoading: false,
  error: null,
  activeSectionId: null,
  selectedProduct: null,
  programSummary: null,
  programLoading: false,
  programError: null,
  isConfiguratorOpen: false,
  // Setup Wizard initial state
  setupWizard: {
    currentStep: 1,
    projectProfile: null,
    programProfile: null,
    documentTemplateId: null,
    isComplete: false
  },
  disabledSectionIds: [],
  disabledDocumentIds: [],
  customSections: [],
  customDocuments: [],
  allSections: [],
  allDocuments: [],
  showAddSection: false,
  showAddDocument: false,
  newSectionTitle: '',
  newDocumentName: '',
  expandedSectionId: null,
  expandedDocumentId: null,
  editingSection: null,
  editingDocument: null,
  clickedDocumentId: null,
};

export const useEditorStore = create<EditorStore>((set, get) => ({
  ...initialState,
  
  setPlan: (plan) => {
    set({ plan });
    get().syncTemplateStateFromPlan();
  },
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  updateSection: (sectionId, updates) => {
    const plan = get().plan;
    if (!plan) return;
    
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
    
    const newSectionId = `custom_${Date.now()}`;
    
    const newSectionTemplate: SectionTemplate = {
      id: newSectionId,
      name: title,
      title: title,
      description: description,
      origin: 'custom',
      required: false,
      category: 'general',
    };
    
    const updatedCustomSections = [...customSections, newSectionTemplate];
    set({ customSections: updatedCustomSections });
    
    const updatedAllSections = [...allSections, newSectionTemplate];
    set({ allSections: updatedAllSections });
    
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
      
      if (updatedPlan.metadata) {
        updatedPlan.metadata.customSections = updatedCustomSections;
      }
      
      set({ plan: updatedPlan });
    }
    
    set({ showAddSection: false, newSectionTitle: '' });
  },
  
  removeCustomSection: (sectionId) => {
    const plan = get().plan;
    const customSections = get().customSections;
    const allSections = get().allSections;
    
    const updatedCustomSections = customSections.filter(s => s.id !== sectionId);
    set({ customSections: updatedCustomSections });
    
    const updatedAllSections = allSections.filter(s => s.id !== sectionId);
    set({ allSections: updatedAllSections });
    
    if (plan && plan.sections) {
      const updatedSections = plan.sections.filter(s => s.id !== sectionId && s.key !== sectionId);
      const updatedPlan = { ...plan, sections: updatedSections };
      
      if (updatedPlan.metadata) {
        updatedPlan.metadata.customSections = updatedCustomSections;
      }
      
      set({ plan: updatedPlan });
    }
    
    const activeSectionId = get().activeSectionId;
    if (activeSectionId === sectionId) {
      set({ activeSectionId: null });
    }
  },
  
  setActiveSectionId: (id, _source: 'sidebar' | 'scroll' | 'editor' | 'direct' = 'direct') => {
    set({ activeSectionId: id });
  },
  
  setSelectedProduct: (product) => {
    let allSections: SectionTemplate[] = [];
    let allDocuments: DocumentTemplate[] = [];
    
    if (product) {
      allSections = MASTER_SECTIONS[product] || [];
      allDocuments = MASTER_DOCUMENTS_BY_PRODUCT[product] || [];
      set({ allSections, allDocuments });
    }
    
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
  setIsConfiguratorOpen: (open) => set({ isConfiguratorOpen: open }),
  
  // Setup Wizard Actions
  setSetupWizardStep: (step) => set(state => ({
    setupWizard: { ...state.setupWizard, currentStep: step }
  })),
  setProjectProfile: (profile) => set(state => ({
    setupWizard: { ...state.setupWizard, projectProfile: profile }
  })),
  setProgramProfile: (profile) => set(state => ({
    setupWizard: { ...state.setupWizard, programProfile: profile }
  })),
  setDocumentTemplateId: (templateId) => set(state => ({
    setupWizard: { ...state.setupWizard, documentTemplateId: templateId }
  })),
  completeSetupWizard: () => set(state => ({
    setupWizard: { ...state.setupWizard, isComplete: true }
  })),
  resetSetupWizard: () => set({
    setupWizard: {
      currentStep: 1,
      projectProfile: null,
      programProfile: null,
      documentTemplateId: null,
      isComplete: false
    }
  }),
  
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
  
  setShowAddSection: (show) => set({ showAddSection: show }),
  setShowAddDocument: (show) => set({ showAddDocument: show }),
  setNewSectionTitle: (title) => set({ newSectionTitle: title }),
  setNewDocumentName: (name) => set({ newDocumentName: name }),
  setExpandedSectionId: (id) => set({ expandedSectionId: id }),
  setExpandedDocumentId: (id) => set({ expandedDocumentId: id }),
  setEditingSection: (section) => set({ editingSection: section }),
  setEditingDocument: (document) => set({ editingDocument: document }),
  setClickedDocumentId: (id) => set({ clickedDocumentId: id }),
  
  resetFormState: () => set({
    showAddSection: false,
    showAddDocument: false,
    newSectionTitle: '',
    newDocumentName: '',
  }),
  
  syncTemplateStateFromPlan: () => {
    syncTemplateStateFromPlan(get().plan, set, get);
  },
}));
