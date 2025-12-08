import { useCallback, useState, useEffect, useMemo } from 'react';
import { useEditorStore, METADATA_SECTION_ID, defaultTitlePage } from './useEditorStore';
import type { DocumentTemplate, SectionTemplate } from '@templates';
import type { ProductType, ProgramSummary, Section } from '@/features/editor/lib/types/plan';

const DOCUMENT_SELECTION_STORAGE_KEY = 'plan2fund-desktop-doc-selection';

const createDefaultSelectionState = (): Record<ProductType, string | null> => ({
  submission: null,
  review: null,
  strategy: null
});

export function useDocumentManagement(
  selectedProduct: ProductType,
  programSummary: ProgramSummary | null,
  allSections: SectionTemplate[],
  allDocuments: DocumentTemplate[],
  disabledSections: Set<string>,
  setActiveSection: (sectionId: string) => void
) {
  const [productDocumentSelections, setProductDocumentSelections] = useState<Record<ProductType, string | null>>(() => {
    if (typeof window === 'undefined') {
      return createDefaultSelectionState();
    }
    try {
      const stored = window.sessionStorage.getItem(DOCUMENT_SELECTION_STORAGE_KEY);
      if (!stored) {
        return createDefaultSelectionState();
      }
      const parsed = JSON.parse(stored) as Partial<Record<ProductType, string | null>>;
      return {
        ...createDefaultSelectionState(),
        ...parsed
      };
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[useDocumentManagement] Failed to parse document selection cache:', err);
      }
      return createDefaultSelectionState();
    }
  });

  const clickedDocumentId = productDocumentSelections[selectedProduct] ?? null;

  // Persist document selections to sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.sessionStorage.setItem(
        DOCUMENT_SELECTION_STORAGE_KEY,
        JSON.stringify(productDocumentSelections)
      );
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[useDocumentManagement] Failed to persist document selection cache:', err);
      }
    }
  }, [productDocumentSelections]);

  const updateProductSelection = useCallback((product: ProductType, selection: string | null) => {
    setProductDocumentSelections(prev => {
      if (prev[product] === selection) {
        return prev;
      }
      return {
        ...prev,
        [product]: selection
      };
    });
  }, []);

  const handleSelectDocument = useCallback((docId: string | null) => {
    updateProductSelection(selectedProduct, docId);
    
    // If selecting an additional document, automatically show its title page
    const plan = useEditorStore.getState().plan;
    if (docId && plan) {
      const isAdditionalDocument = plan.metadata?.customDocuments?.some(doc => doc.id === docId);
      if (isAdditionalDocument) {
        // Additional documents should show title page by default (separate from core product)
        setActiveSection(METADATA_SECTION_ID);
      }
    }
  }, [selectedProduct, updateProductSelection, setActiveSection]);

  const addCustomDocument = useCallback((
    newDocumentName: string,
    newDocumentDescription: string,
    onDocumentCreated?: (documentId: string) => void
  ) => {
    if (!newDocumentName.trim()) {
      return;
    }
    const fundingType = programSummary?.fundingType ?? 'grants';
    const newDocument: DocumentTemplate = {
      id: `custom_doc_${Date.now()}`,
      name: newDocumentName.trim(),
      description: newDocumentDescription.trim() || 'Benutzerdefiniertes Dokument',
      required: false,
      format: 'pdf',
      maxSize: '10MB',
      template: '',
      instructions: [],
      examples: [],
      commonMistakes: [],
      category: 'custom',
      fundingTypes: [fundingType],
      origin: 'custom'
    };
    
    // Each additional document gets its own title page and empty sections array (separate from core product)
    const documentTitlePage = defaultTitlePage();
    documentTitlePage.planTitle = newDocumentName.trim();
    
    // Update plan metadata to store document-specific sections and title page
    const currentPlan = useEditorStore.getState().plan;
    if (currentPlan) {
      const documentSections = currentPlan.metadata?.documentSections || {};
      const documentTitlePages = currentPlan.metadata?.documentTitlePages || {};
      
      // Get program-recommended sections for this document if program is connected
      let initialSections: Section[] = [];
      if (programSummary && allSections.length > 0) {
        // Get sections related to this document based on document name/category
        const docNameLower = newDocument.name.toLowerCase();
        const docCategoryLower = newDocument.category?.toLowerCase() || '';
        
        const keywordsByProduct: Record<string, Record<string, string[]>> = {
          submission: {
            'work plan': ['work', 'plan', 'timeline', 'milestone', 'project', 'implementation'],
            'gantt': ['work', 'plan', 'timeline', 'schedule', 'project', 'milestone', 'implementation'],
            'budget': ['budget', 'financial', 'cost', 'finance', 'funding', 'resources'],
            'financial': ['budget', 'financial', 'cost', 'finance', 'funding', 'resources'],
            'team': ['team', 'personnel', 'staff', 'organization', 'management'],
            'cv': ['team', 'personnel', 'staff', 'biography', 'management'],
            'pitch': ['executive', 'summary', 'overview', 'introduction'],
            'deck': ['executive', 'summary', 'overview', 'introduction']
          },
          strategy: {
            'work plan': ['strategy', 'planning', 'timeline', 'roadmap', 'vision'],
            'gantt': ['strategy', 'planning', 'timeline', 'roadmap'],
            'budget': ['budget', 'financial', 'investment', 'resources'],
            'team': ['team', 'organization', 'structure', 'leadership']
          },
          review: {
            'work plan': ['review', 'analysis', 'assessment', 'evaluation'],
            'budget': ['budget', 'financial', 'review', 'analysis'],
            'team': ['team', 'review', 'assessment']
          }
        };
        
        const productKeywords = keywordsByProduct[selectedProduct] || keywordsByProduct.submission;
        const matchingKeywords: string[] = [];
        for (const [key, values] of Object.entries(productKeywords)) {
          if (docNameLower.includes(key) || docCategoryLower.includes(key)) {
            matchingKeywords.push(...values);
          }
        }
        
        const relatedSectionTemplates = allSections.filter(section => {
          const sectionTitleLower = section.title.toLowerCase();
          const sectionCategoryLower = section.category?.toLowerCase() || '';
          
          if (docCategoryLower && sectionCategoryLower && docCategoryLower === sectionCategoryLower) {
            return true;
          }
          
          if (matchingKeywords.length > 0) {
            return matchingKeywords.some(keyword => 
              sectionTitleLower.includes(keyword) || sectionCategoryLower.includes(keyword)
            );
          }
          
          return false;
        });
        
        // Convert section templates to plan sections
        initialSections = relatedSectionTemplates
          .filter(sectionTemplate => !disabledSections.has(sectionTemplate.id))
          .map(sectionTemplate => {
            // Find existing section in plan if it exists, otherwise create new
            const existingSection = currentPlan.sections.find(s => s.id === sectionTemplate.id);
            if (existingSection) {
              return existingSection;
            }
            // Create new section from template
            return {
              id: sectionTemplate.id,
              title: sectionTemplate.title,
              questions: sectionTemplate.questions?.map((q, idx) => ({
                id: `${sectionTemplate.id}_q_${idx}`,
                prompt: q.text,
                status: 'blank' as const,
                answer: '',
                attachments: []
              })) || [],
              progress: 0
            };
          });
      }
      
      // Initialize document with program-recommended sections (or empty array)
      documentSections[newDocument.id] = initialSections;
      documentTitlePages[newDocument.id] = documentTitlePage;
      
      useEditorStore.setState({
        plan: {
          ...currentPlan,
          metadata: {
            ...currentPlan.metadata,
            customDocuments: [...(currentPlan.metadata?.customDocuments || []), newDocument],
            documentSections,
            documentTitlePages
          }
        }
      });
      
      // Auto-select the newly created document
      updateProductSelection(selectedProduct, newDocument.id);
      setActiveSection(METADATA_SECTION_ID); // Show title page
      
      // Call callback if provided (for clearing editing section, etc.)
      if (onDocumentCreated) {
        onDocumentCreated(newDocument.id);
      }
    }
    
    return newDocument;
  }, [programSummary, allSections, allDocuments, disabledSections, selectedProduct, updateProductSelection, setActiveSection]);

  // Get plan from store (reactive)
  const plan = useEditorStore((state) => state.plan);

  // Compute document-specific plan (when additional document is selected)
  const documentPlan = useMemo(() => {
    // If an additional document is selected, use its sections (separate from core product)
    if (clickedDocumentId && plan) {
      const isAdditionalDocument = plan.metadata?.customDocuments?.some(doc => doc.id === clickedDocumentId);
      if (isAdditionalDocument) {
        const documentSections = plan.metadata?.documentSections?.[clickedDocumentId] || [];
        const documentTitlePage = plan.metadata?.documentTitlePages?.[clickedDocumentId] || plan.titlePage;
        
        // Return a modified plan with document-specific sections and title page
        // Additional documents should show ONLY their own sections (starting with just title page)
        return {
          ...plan,
          sections: documentSections, // Document-specific sections (empty initially, just title page)
          titlePage: documentTitlePage // Document-specific title page
        };
      }
    }
    // Core product: use plan.sections (main business plan sections)
    return plan;
  }, [plan, clickedDocumentId]);

  return {
    clickedDocumentId,
    productDocumentSelections,
    updateProductSelection,
    handleSelectDocument,
    addCustomDocument,
    documentPlan
  };
}

