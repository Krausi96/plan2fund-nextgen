import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useEditorStore } from './useEditorStore';
import type { SectionTemplate, DocumentTemplate } from '@templates';
import { getSections, getDocuments } from '@templates';
import type { ProductType, ProgramSummary } from '@/features/editor/lib/types/plan';

export function useTemplateManagement(
  selectedProduct: ProductType | null,
  programSummary: ProgramSummary | null,
  _isConfiguratorOpen: boolean
) {
  const [sections, setSections] = useState<SectionTemplate[]>([]);
  const [documents, setDocuments] = useState<DocumentTemplate[]>([]);
  const [customSections, setCustomSections] = useState<SectionTemplate[]>([]);
  const [customDocuments, setCustomDocuments] = useState<DocumentTemplate[]>([]);
  const [templateLoading, setTemplateLoading] = useState(() => {
    // If no product is selected initially, don't start in loading state
    return selectedProduct !== null;
  });
  const [templateError, setTemplateError] = useState<string | null>(null);

  // Initialize disabled state from plan.metadata synchronously to prevent hydration mismatches
  const [disabledSections, setDisabledSections] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') {
      return new Set();
    }
    try {
      const storeState = useEditorStore.getState();
      if (storeState.plan?.metadata?.disabledSectionIds) {
        return new Set(storeState.plan.metadata.disabledSectionIds);
      }
    } catch (e) {
      // Store might not be ready yet
    }
    return new Set();
  });

  const [disabledDocuments, setDisabledDocuments] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') {
      return new Set();
    }
    try {
      const storeState = useEditorStore.getState();
      if (storeState.plan?.metadata?.disabledDocumentIds) {
        return new Set(storeState.plan.metadata.disabledDocumentIds);
      }
    } catch (e) {
      // Store might not be ready yet
    }
    return new Set();
  });

  // Template loading - only load templates client-side
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    async function loadTemplates() {
      setTemplateLoading(true);
      setTemplateError(null);
      try {
        const baseUrl = undefined;
        const fundingType = programSummary?.fundingType ?? 'grants';
        
        if (!selectedProduct) {
          setSections([]);
          setDocuments([]);
          setTemplateLoading(false);
          return;
        }
        
        const [loadedSections, loadedDocuments] = await Promise.all([
          getSections(fundingType, selectedProduct, programSummary?.id, baseUrl),
          getDocuments(fundingType, selectedProduct, programSummary?.id, baseUrl)
        ]);
        
        setSections(loadedSections);
        setDocuments(loadedDocuments);
      } catch (err) {
        setTemplateError(err instanceof Error ? err.message : 'Failed to load templates');
      } finally {
        setTemplateLoading(false);
      }
    }

    loadTemplates();
  }, [selectedProduct, programSummary?.id, programSummary?.fundingType]);

  // Restore disabled state and custom templates from plan metadata
  const restoringFromMetadata = useRef(false);
  const lastMetadataRef = useRef<string>('');
  
  useEffect(() => {
    const plan = useEditorStore.getState().plan;
    if (!plan?.metadata) return;
    
    const metadataKey = JSON.stringify({
      disabled: plan.metadata.disabledSectionIds || [],
      docs: plan.metadata.disabledDocumentIds || [],
      customSections: plan.metadata.customSections?.length || 0,
      customDocuments: plan.metadata.customDocuments?.length || 0
    });
    
    if (lastMetadataRef.current === metadataKey) {
      return;
    }
    
    if (restoringFromMetadata.current) {
      return;
    }
    
    restoringFromMetadata.current = true;
    lastMetadataRef.current = metadataKey;
    
    if (plan.metadata.disabledSectionIds) {
      setDisabledSections(new Set(plan.metadata.disabledSectionIds));
    }
    if (plan.metadata.disabledDocumentIds) {
      setDisabledDocuments(new Set(plan.metadata.disabledDocumentIds));
    }
    if (plan.metadata.customSections && plan.metadata.customSections.length > 0) {
      setCustomSections(plan.metadata.customSections as SectionTemplate[]);
    }
    if (plan.metadata.customDocuments && plan.metadata.customDocuments.length > 0) {
      setCustomDocuments(plan.metadata.customDocuments as DocumentTemplate[]);
    }
    
    setTimeout(() => {
      restoringFromMetadata.current = false;
    }, 100);
  }, []);

  const allSections = useMemo(() => [...sections, ...customSections], [sections, customSections]);
  const allDocuments = useMemo(() => [...documents, ...customDocuments], [documents, customDocuments]);

  const toggleSection = useCallback((sectionId: string, _activeSectionId: string | null) => {
    setDisabledSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const toggleDocument = useCallback((documentId: string) => {
    setDisabledDocuments(prev => {
      const next = new Set(prev);
      if (next.has(documentId)) {
        next.delete(documentId);
      } else {
        next.add(documentId);
      }
      return next;
    });
  }, []);

  const removeCustomSection = useCallback((id: string) => {
    setCustomSections(prev => prev.filter(s => s.id !== id));
  }, []);

  const removeCustomDocument = useCallback((id: string) => {
    setCustomDocuments(prev => prev.filter(d => d.id !== id));
  }, []);

  return {
    sections,
    documents,
    customSections,
    customDocuments,
    templateLoading,
    templateError,
    disabledSections,
    disabledDocuments,
    allSections,
    allDocuments,
    setCustomSections,
    setCustomDocuments,
    setDisabledSections,
    setDisabledDocuments,
    toggleSection,
    toggleDocument,
    removeCustomSection,
    removeCustomDocument
  };
}

