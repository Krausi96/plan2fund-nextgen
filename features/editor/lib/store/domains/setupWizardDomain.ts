import type { 
  SetupWizardState,
  ProjectProfile,
  DocumentTemplateId,
  ProductType
} from '../../types/types';
import type { DocumentStructure, SetupDiagnostics, FundingProgram } from '../../types/program/program-types';

export interface SetupWizardStateExtended extends SetupWizardState {
  // Extended with any additional properties if needed
}

export interface SetupWizardActions {
  setSetupWizardStep: (step: 1 | 2 | 3) => void;
  setProjectProfile: (profile: ProjectProfile | null) => void;
  setProgramProfile: (profile: FundingProgram | null) => void;
  setDocumentTemplateId: (templateId: DocumentTemplateId | null) => void;
  setDocumentStructure: (structure: DocumentStructure | null) => void;
  setSetupStatus: (status: 'none' | 'draft' | 'confirmed' | 'locked') => void;
  setSetupDiagnostics: (diagnostics: SetupDiagnostics | null) => void;
  setInferredProductType: (type: ProductType | null) => void;
  completeSetupWizard: () => void;
  resetSetupWizard: () => void;
}

export const createSetupWizardDomain = (set: any): SetupWizardActions => ({
  setSetupWizardStep: (step: 1 | 2 | 3) => set((state: any) => ({
    setupWizard: { ...state.setupWizard, currentStep: step }
  })),
  
  setProjectProfile: (profile: ProjectProfile | null) => set((state: any) => ({
    setupWizard: { ...state.setupWizard, projectProfile: profile }
  })),
  
  setProgramProfile: (profile: FundingProgram | null) => set((state: any) => ({
    setupWizard: { ...state.setupWizard, programProfile: profile }
  })),
  
  setDocumentTemplateId: (templateId: DocumentTemplateId | null) => set((state: any) => ({
    setupWizard: { ...state.setupWizard, documentTemplateId: templateId }
  })),
  
  setDocumentStructure: (structure: DocumentStructure | null) => set((state: any) => ({
    setupWizard: { ...state.setupWizard, documentStructure: structure }
  })),
  
  setSetupStatus: (status: 'none' | 'draft' | 'confirmed' | 'locked') => set((state: any) => ({
    setupWizard: { ...state.setupWizard, setupStatus: status }
  })),
  
  setSetupDiagnostics: (diagnostics: SetupDiagnostics | null) => set((state: any) => ({
    setupWizard: { ...state.setupWizard, setupDiagnostics: diagnostics }
  })),
  
  setInferredProductType: (type: ProductType | null) => set((state: any) => ({
    setupWizard: { ...state.setupWizard, inferredProductType: type }
  })),
  
  completeSetupWizard: () => set((state: any) => ({
    setupWizard: { ...state.setupWizard, isComplete: true }
  })),
  
  resetSetupWizard: () => set({
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
      setupDiagnostics: null,
      inferredProductType: null
    }
  })
});