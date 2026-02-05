import type { 
  SectionTemplate, 
  DocumentTemplate, 
  ProductType 
} from '../../types/types';
import { MASTER_SECTIONS, MASTER_DOCUMENTS_BY_PRODUCT } from '../../templates';

export interface TemplateState {
  selectedProduct: ProductType | null;
  disabledSectionIds: string[];
  disabledDocumentIds: string[];
  customSections: SectionTemplate[];
  customDocuments: DocumentTemplate[];
  allSections: SectionTemplate[];
  allDocuments: DocumentTemplate[];
  activeSectionId: string | null;
}

export interface TemplateActions {
  addCustomSection: (title: string, description?: string) => void;
  removeCustomSection: (sectionId: string) => void;
  setActiveSectionId: (id: string | null, source?: 'sidebar' | 'scroll' | 'editor' | 'direct') => void;
  setSelectedProduct: (product: ProductType | null) => void;
  setDisabledSectionIds: (ids: string[]) => void;
  setDisabledDocumentIds: (ids: string[]) => void;
  setCustomSections: (sections: SectionTemplate[]) => void;
  setCustomDocuments: (documents: DocumentTemplate[]) => void;
  setAllSections: (sections: SectionTemplate[]) => void;
  setAllDocuments: (documents: DocumentTemplate[]) => void;
}

export const createTemplateDomain = (set: any, get: any): TemplateActions => ({
  addCustomSection: (title: string, description = '') => {
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

  removeCustomSection: (sectionId: string) => {
    const plan = get().plan;
    const customSections = get().customSections;
    const allSections = get().allSections;
    
    const updatedCustomSections = customSections.filter((s: SectionTemplate) => s.id !== sectionId);
    set({ customSections: updatedCustomSections });
    
    const updatedAllSections = allSections.filter((s: SectionTemplate) => s.id !== sectionId);
    set({ allSections: updatedAllSections });
    
    if (plan && plan.sections) {
      const updatedSections = plan.sections.filter((s: any) => s.id !== sectionId && s.key !== sectionId);
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

  setActiveSectionId: (id: string | null, _source: 'sidebar' | 'scroll' | 'editor' | 'direct' = 'direct') => {
    set({ activeSectionId: id });
  },

  setSelectedProduct: (product: ProductType | null) => {
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
      
      const newPlan = {
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

  setDisabledSectionIds: (ids: string[]) => {
    set({ disabledSectionIds: ids });
    const plan = get().plan;
    if (plan?.metadata) plan.metadata.disabledSectionIds = ids;
  },

  setDisabledDocumentIds: (ids: string[]) => {
    set({ disabledDocumentIds: ids });
    const plan = get().plan;
    if (plan?.metadata) plan.metadata.disabledDocumentIds = ids;
  },

  setCustomSections: (sections: SectionTemplate[]) => {
    set({ customSections: sections });
    const plan = get().plan;
    if (plan?.metadata) plan.metadata.customSections = sections;
  },

  setCustomDocuments: (documents: DocumentTemplate[]) => {
    set({ customDocuments: documents });
    const plan = get().plan;
    if (plan?.metadata) plan.metadata.customDocuments = documents;
  },

  setAllSections: (sections: SectionTemplate[]) => set({ allSections: sections }),
  setAllDocuments: (documents: DocumentTemplate[]) => set({ allDocuments: documents }),
});