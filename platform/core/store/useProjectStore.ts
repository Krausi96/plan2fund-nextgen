/**
 * UNIFIED PROJECT STORE (Zustand)
 * Single source of truth for ALL application state:
 * - User profile (from UserContext)
 * - Project/Business plan (from editorStore)
 * - Program selection (from programPersistence)
 * - Setup wizard state
 * - UI toggles
 *
 * Persistence: ONLY this store touches localStorage
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  UserProfile,
  ProjectProfile,
  FundingProfile,
  EditorMeta,
  PlanDocument,
  DocumentStructure,
  Section,
  Document,
} from '../types';
import { validateAndSanitizeProgram } from '../validation';
import type { PersistedProgram } from '../validation';

/**
 * Complete project store state shape
 */
export interface ProjectStoreState {
  // ========== USER ==========
  userProfile: UserProfile | null;
  isLoadingUser: boolean;

  // ========== PROJECT ==========
  projectProfile: ProjectProfile | null;
  editorMeta: EditorMeta | null; // Editor-only extras that don't belong in core business model
  fundingProfile: FundingProfile | null;
  selectedProgram: PersistedProgram | null;

  // ========== DOCUMENT SETUP ==========
  planDocument: PlanDocument | null;
  documentStructure: DocumentStructure | null;
  selectedProduct: any | null;
  documentTemplateId: string | null;

  // DEPRECATED: blueprint removed - use documentStructure instead

  // ========== TEMPLATE MANAGEMENT ==========
  allSections: Section[];
  allDocuments: Document[];
  customSections: Section[];
  customDocuments: Document[];
  disabledSectionIds: string[];
  disabledDocumentIds: string[];

  // ========== SETUP WIZARD ==========
  setupWizardStep: 1 | 2 | 3;
  setupStatus: 'none' | 'draft' | 'confirmed' | 'locked';
  setupDiagnostics?: {
    warnings: string[];
    missingFields: string[];
    confidence: number;
  };
  inferredProductType: string | null;

  // ========== UI STATE ==========
  activeSectionId: string | null;
  expandedSectionId: string | null;
  expandedDocumentId: string | null;
  clickedDocumentId: string | null;
  showAddSection: boolean;
  showAddDocument: boolean;
  editingSection: any | null;
  editingDocument: any | null;
  newSectionTitle: string;
  newDocumentName: string;
  isConfiguratorOpen: boolean;

  // ========== METADATA ==========
  origin: 'reco' | 'editor' | null;
  isLoading: boolean;
  error: string | null;
  setupWizardIsComplete: boolean;
}

/**
 * Store actions
 */
export interface ProjectStoreActions {
  setUserProfile: (profile: UserProfile | null) => void;
  setIsLoadingUser: (loading: boolean) => void;
  setProjectProfile: (profile: ProjectProfile | null) => void;
  setEditorMeta: (meta: EditorMeta | null) => void;
  updateEditorMeta: (updates: Partial<EditorMeta>) => void;
  updateSection: (sectionId: string, updates: Partial<Section>) => void;
  setFundingProfile: (profile: FundingProfile | null) => void;
  selectProgram: (program: PersistedProgram | null) => void;
  setPlanDocument: (plan: PlanDocument | null) => void;
  setDocumentStructure: (structure: DocumentStructure | null) => void;
  setSelectedProduct: (product: any | null) => void;
  setDocumentTemplateId: (id: string | null) => void;
  // DEPRECATED: setBlueprint removed - use setDocumentStructure instead
  setAllSections: (sections: Section[]) => void;
  setAllDocuments: (documents: Document[]) => void;
  setCustomSections: (sections: Section[]) => void;
  setCustomDocuments: (documents: Document[]) => void;
  setDisabledSectionIds: (ids: string[]) => void;
  setDisabledDocumentIds: (ids: string[]) => void;
  addCustomSection: (title: string, description?: string) => void;
  removeCustomSection: (sectionId: string) => void;
  setSetupWizardStep: (step: 1 | 2 | 3) => void;
  setSetupStatus: (status: 'none' | 'draft' | 'confirmed' | 'locked') => void;
  setSetupDiagnostics: (diagnostics: any) => void;
  setInferredProductType: (type: string | null) => void;
  completeSetupWizard: () => void;
  resetSetupWizard: () => void;
  setActiveSectionId: (id: string | null) => void;
  setExpandedSectionId: (id: string | null) => void;
  setExpandedDocumentId: (id: string | null) => void;
  setClickedDocumentId: (id: string | null) => void;
  setShowAddSection: (show: boolean) => void;
  setShowAddDocument: (show: boolean) => void;
  setEditingSection: (section: any | null) => void;
  setEditingDocument: (document: any | null) => void;
  setNewSectionTitle: (title: string) => void;
  setNewDocumentName: (name: string) => void;
  setIsConfiguratorOpen: (open: boolean) => void;
  resetFormState: () => void;
  setOrigin: (origin: 'reco' | 'editor' | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetAll: () => void;
}

export type ProjectStore = ProjectStoreState & ProjectStoreActions;

const INITIAL_STATE: ProjectStoreState = {
  userProfile: null,
  isLoadingUser: false,
  projectProfile: null,
  editorMeta: null,
  fundingProfile: null,
  selectedProgram: null,
  planDocument: null,
  documentStructure: null,
  selectedProduct: null,
  documentTemplateId: null,
  // DEPRECATED: blueprint removed
  allSections: [],
  allDocuments: [],
  customSections: [],
  customDocuments: [],
  disabledSectionIds: [],
  disabledDocumentIds: [],
  setupWizardStep: 1,
  setupStatus: 'none',
  setupDiagnostics: undefined,
  inferredProductType: null,
  activeSectionId: null,
  expandedSectionId: null,
  expandedDocumentId: null,
  clickedDocumentId: null,
  showAddSection: false,
  showAddDocument: false,
  editingSection: null,
  editingDocument: null,
  newSectionTitle: '',
  newDocumentName: '',
  isConfiguratorOpen: false,
  origin: null,
  isLoading: false,
  error: null,
  setupWizardIsComplete: false,
};

const projectStorageKey = 'pf_project_state';

/**
 * Create the Zustand store with persistence
 */
export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      setUserProfile: (profile) => set({ userProfile: profile }),
      setIsLoadingUser: (loading) => set({ isLoadingUser: loading }),
      setProjectProfile: (profile) => set({ projectProfile: profile }),
      setEditorMeta: (meta) => set({ editorMeta: meta }),
      updateEditorMeta: (updates) => set((state) => ({
        editorMeta: state.editorMeta ? { ...state.editorMeta, ...updates } : updates as EditorMeta,
      })),
      updateSection: (sectionId, updates) => set((state) => {
        if (!state.planDocument) return {};
        return {
          planDocument: {
            ...state.planDocument,
            sections: (state.planDocument.sections || []).map((s) =>
              s.id === sectionId ? { ...s, ...updates } : s
            )
          }
        };
      }),
      setFundingProfile: (profile) => set({ fundingProfile: profile }),
      selectProgram: (program) => {
        if (program) {
          const validated = validateAndSanitizeProgram(program);
          if (validated) {
            set({ selectedProgram: validated });
            
            // Note: Blueprint generation happens in the Editor component
            // when a program is loaded from localStorage
          }
        } else {
          set({ selectedProgram: null });
        }
      },

      setPlanDocument: (plan) => set({ planDocument: plan }),
      setDocumentStructure: (structure) => set({ documentStructure: structure }),
      setSelectedProduct: (product) => set({ selectedProduct: product }),
      setDocumentTemplateId: (id) => set({ documentTemplateId: id }),
      // DEPRECATED: setBlueprint removed

      setAllSections: (sections) => set({ allSections: sections }),
      setAllDocuments: (documents) => set({ allDocuments: documents }),
      setCustomSections: (sections) => set({ customSections: sections }),
      setCustomDocuments: (documents) => set({ customDocuments: documents }),
      setDisabledSectionIds: (ids) => set({ disabledSectionIds: ids }),
      setDisabledDocumentIds: (ids) => set({ disabledDocumentIds: ids }),

      addCustomSection: (title, _description) => {
        const id = `custom_section_${Date.now()}`;
        const newSection: Section = {
          id,
          title,
          required: false,
          source: 'user',
          requirements: [],
        };
        set((state) => ({
          customSections: [...state.customSections, newSection],
        }));
      },

      removeCustomSection: (sectionId) => {
        set((state) => ({
          customSections: state.customSections.filter((s) => s.id !== sectionId),
        }));
      },

      setSetupWizardStep: (step) => set({ setupWizardStep: step }),
      setSetupStatus: (status) => set({ setupStatus: status }),
      setSetupDiagnostics: (diagnostics) => set({ setupDiagnostics: diagnostics }),
      setInferredProductType: (type) => set({ inferredProductType: type }),

      completeSetupWizard: () => {
        set({ setupWizardIsComplete: true, setupStatus: 'confirmed' });
      },

      resetSetupWizard: () => {
        set({
          setupWizardStep: 1,
          setupStatus: 'none',
          setupDiagnostics: undefined,
          setupWizardIsComplete: false,
        });
      },

      setActiveSectionId: (id) => set({ activeSectionId: id }),
      setExpandedSectionId: (id) => set({ expandedSectionId: id }),
      setExpandedDocumentId: (id) => set({ expandedDocumentId: id }),
      setClickedDocumentId: (id) => set({ clickedDocumentId: id }),
      setShowAddSection: (show) => set({ showAddSection: show }),
      setShowAddDocument: (show) => set({ showAddDocument: show }),
      setEditingSection: (section) => set({ editingSection: section }),
      setEditingDocument: (document) => set({ editingDocument: document }),
      setNewSectionTitle: (title) => set({ newSectionTitle: title }),
      setNewDocumentName: (name) => set({ newDocumentName: name }),
      setIsConfiguratorOpen: (open) => set({ isConfiguratorOpen: open }),

      resetFormState: () => {
        set({
          showAddSection: false,
          showAddDocument: false,
          newSectionTitle: '',
          newDocumentName: '',
          editingSection: null,
          editingDocument: null,
        });
      },

      setOrigin: (origin) => set({ origin }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      resetAll: () => set(INITIAL_STATE),
    }),
    {
      name: projectStorageKey,
      partialize: (state) => ({
        userProfile: state.userProfile,
        selectedProgram: state.selectedProgram,
        projectProfile: state.projectProfile,
        fundingProfile: state.fundingProfile,
        planDocument: state.planDocument,
        setupWizardStep: state.setupWizardStep,
        setupStatus: state.setupStatus,
        origin: state.origin,
      }),
    }
  )
);
