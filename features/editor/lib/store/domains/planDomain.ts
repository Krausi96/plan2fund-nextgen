import type { BusinessPlan } from '../../types/types';
import { METADATA_SECTION_ID, REFERENCES_SECTION_ID, APPENDICES_SECTION_ID } from '../../constants';

export interface PlanState {
  plan: BusinessPlan | null;
  isLoading: boolean;
  error: string | null;
}

export interface PlanActions {
  setPlan: (plan: BusinessPlan | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateSection: (sectionId: string, updates: Partial<{content: string; title: string; [key: string]: any}>) => void;
}

export const createPlanDomain = (set: any, get: any): PlanActions => ({
  setPlan: (plan: BusinessPlan | null) => {
    set({ plan });
    get().syncTemplateStateFromPlan();
  },
  
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
  
  updateSection: (sectionId: string, updates: Partial<{content: string; title: string; [key: string]: any}>) => {
    let plan = get().plan;
    
    // Create minimal plan if none exists and we're updating title page data
    if (!plan && sectionId === METADATA_SECTION_ID) {
      plan = {
        language: 'en',
        productType: undefined,
        settings: {
          includeTitlePage: true,
          includePageNumbers: true,
          titlePage: {
            title: '',
            companyName: '',
            date: new Date().toISOString().split('T')[0],
          },
        },
        sections: [],
        metadata: {
          disabledSectionIds: [],
          disabledDocumentIds: [],
          customSections: [],
          customDocuments: [],
        },
        references: [],
        appendices: [],
      };
      set({ plan });
      plan = get().plan; // Get the newly set plan
    }
    
    if (!plan) {
      return;
    }
    
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
      const updatedSections = plan.sections.map((section: any) => 
        section.id === sectionId || section.key === sectionId 
          ? { ...section, ...updates }
          : section
      );
      set({ plan: { ...plan, sections: updatedSections } });
    }
  },
});