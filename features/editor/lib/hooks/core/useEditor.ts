import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { useI18n } from '@/shared/contexts/I18nContext';
import { useEditorActions, useEditorStore, METADATA_SECTION_ID, defaultTitlePage } from '../useEditorStore';
import { clearSelectedProgram, loadSelectedProgram, saveSelectedProgram } from '@/shared/user/storage/planStore';
import { 
  mapProgramTypeToFunding, 
  normalizeProgramInput,
  getRelatedSections,
  isAdditionalDocument,
  getDocumentSections,
  getDocumentTitlePage
} from '@/features/editor/lib/helpers/editorHelpers';
import { getSections, getDocuments } from '@templates';
import { PRODUCT_TYPE_CONFIG } from '@/features/editor/lib/constants/productConfig';
import type { ProductType, ProgramSummary, Section } from '@/features/editor/lib/types/plan';
import type { SectionTemplate, DocumentTemplate } from '@templates';
import type { ConnectCopy } from '@/features/editor/lib/types/editor/configurator';

const DOCUMENT_SELECTION_STORAGE_KEY = 'plan2fund-desktop-doc-selection';

const createDefaultSelectionState = (): Record<ProductType, string | null> => ({
  submission: null,
  review: null,
  strategy: null
});

/**
 * Unified editor hook consolidating:
 * - useProductSelection
 * - useTemplateManagement
 * - useDocumentManagement
 * - useProgramConnection
 * - useEditorUI
 */
export function useEditor(initialProduct: ProductType | null = null) {
  const { t } = useI18n();
  const router = useRouter();
  const { hydrate, setProductType, setActiveSection, setIsConfiguratorOpen, setEditingSectionId } = useEditorActions((actions) => ({
    hydrate: actions.hydrate,
    setProductType: actions.setProductType,
    setActiveSection: actions.setActiveSection,
    setIsConfiguratorOpen: actions.setIsConfiguratorOpen,
    setEditingSectionId: actions.setEditingSectionId
  }));

  // ========== UI State (from store) ==========
  const { isConfiguratorOpen, editingSectionId } = useEditorStore((state) => ({
    isConfiguratorOpen: state.isConfiguratorOpen,
    editingSectionId: state.editingSectionId
  }));

  const connectCopy = useMemo<ConnectCopy>(
    () => ({
      badge: (t('editor.connect.badge' as any) as string) || 'Program options',
      heading: (t('editor.connect.heading' as any) as string) || 'Pick a program or paste a link',
      description: (t('editor.connect.description' as any) as string) || 'ProgramFinder can suggest matches from your answers. Already have an official funding URL (AWS, FFG, EU call)? Paste it and we will pull the requirements automatically.',
      openFinder: (t('editor.connect.openFinder' as any) as string) || 'Open ProgramFinder',
      pasteLink: (t('editor.connect.pasteLink' as any) as string) || 'Paste program link',
      inputLabel: (t('editor.connect.inputLabel' as any) as string) || 'Official program URL',
      placeholder: (t('editor.connect.placeholder' as any) as string) || 'e.g. https://www.aws.at/funding/...',
      example: (t('editor.connect.example' as any) as string) || 'Example: https://www.aws.at/funding/aws-preseed/page_123 or https://www.ffg.at/calls/page_456',
      submit: (t('editor.connect.submit' as any) as string) || 'Load program',
      error: (t('editor.connect.error' as any) as string) || 'Please enter a valid program URL.'
    }),
    [t]
  );

  const productOptions = useMemo(
    () =>
      PRODUCT_TYPE_CONFIG.map((option) => ({
        value: option.value,
        label: (t(option.labelKey as any) as string) || option.value,
        description: (t(option.descriptionKey as any) as string) || '',
        icon: option.icon
      })),
    [t]
  );

  // ========== Program Connection (from useProgramConnection) ==========
  const [programId, setProgramId] = useState<string | null>(null);
  const [programSummary, setProgramSummary] = useState<ProgramSummary | null>(null);
  const [programLoading, setProgramLoading] = useState(false);
  const [programError, setProgramError] = useState<string | null>(null);
  const storedProgramChecked = useRef(false);

  // Load program from URL query or localStorage
  useEffect(() => {
    if (!router.isReady) return;
    const queryProgramId = router.query.programId as string | undefined;
    if (queryProgramId) {
      setProgramId(queryProgramId);
      return;
    }
    if (storedProgramChecked.current) return;
    if (typeof window !== 'undefined') {
      const saved = loadSelectedProgram();
      if (saved?.id) {
        setProgramId(saved.id);
      }
    }
    storedProgramChecked.current = true;
  }, [router.isReady, router.query.programId]);

  const fetchProgramDetails = useCallback(async (id: string) => {
    setProgramLoading(true);
    setProgramError(null);
    try {
      const saved = loadSelectedProgram();
      
      if (!saved || saved.id !== id) {
        throw new Error('Program not found in localStorage. Please select a program from ProgramFinder.');
      }
      
      const mapping = mapProgramTypeToFunding(saved.type || 'grant');
      const summary: ProgramSummary = {
        id: saved.id,
        name: saved.name || '',
        fundingType: mapping.templateFundingType,
        fundingProgramTag: mapping.fundingProgramTag,
        deadline: (saved as any).deadline || null,
        amountRange: (saved as any).funding_amount_min && (saved as any).funding_amount_max
          ? `${(saved as any).funding_amount_min} - ${(saved as any).funding_amount_max}`
          : null,
        region: (saved as any).region || null
      };
      
      setProgramSummary(summary);
      saveSelectedProgram({ id: saved.id, name: saved.name, type: summary.fundingProgramTag });
    } catch (err) {
      console.error('[useEditor] Error loading program details', err);
      setProgramSummary(null);
      setProgramError('Program not found. Please select a program from ProgramFinder or paste a valid program link.');
    } finally {
      setProgramLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!programId) {
      setProgramSummary(null);
      return;
    }
    fetchProgramDetails(programId);
  }, [programId, fetchProgramDetails]);

  const handleConnectProgram = useCallback(
    (rawInput: string | null) => {
      if (!rawInput) {
        setProgramId(null);
        setProgramSummary(null);
        setProgramError(null);
        clearSelectedProgram();
        if (router.query.programId) {
          const nextQuery = { ...router.query };
          delete nextQuery.programId;
          router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true });
        }
        return;
      }
      const normalized = normalizeProgramInput(rawInput);
      if (!normalized) {
        setProgramError('Please enter a valid program ID or paste a program URL. You can also select a program from ProgramFinder.');
        return;
      }
      setProgramError(null);
      setProgramId(normalized);
      const nextQuery = { ...router.query, programId: normalized };
      router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true });
    },
    [router]
  );

  // ========== Product Selection (from useProductSelection) ==========
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(initialProduct);
  const [pendingProductChange, setPendingProductChange] = useState<ProductType | null>(null);
  const hydrationInProgress = useRef(false);

  useEffect(() => {
    setSelectedProduct(initialProduct);
  }, [initialProduct]);

  const applyHydration = useCallback(
    async (summary: ProgramSummary | null, options?: {
      disabledSectionIds: string[];
      disabledDocumentIds: string[];
      customSections?: any[];
      customDocuments?: any[];
    }) => {
      const fundingType = summary?.fundingType ?? 'grants';
      await hydrate(selectedProduct, {
        fundingType,
        programId: summary?.id,
        programName: summary?.name,
        summary: summary ?? undefined,
        disabledSectionIds: options?.disabledSectionIds,
        disabledDocumentIds: options?.disabledDocumentIds,
        customSections: options?.customSections,
        customDocuments: options?.customDocuments
      });
    },
    [hydrate, selectedProduct]
  );

  // Hydrate plan when product/program is selected
  useEffect(() => {
    if (selectedProduct && typeof window !== 'undefined' && !hydrationInProgress.current && !isConfiguratorOpen) {
      const currentPlan = useEditorStore.getState().plan;
      const currentProgramId = currentPlan?.metadata?.programId;
      const newProgramId = programSummary?.id || null;
      
      const programChanged = currentProgramId !== newProgramId;
      
      const needsHydration = 
        !currentPlan || 
        currentPlan.productType !== selectedProduct ||
        programChanged;
      
      if (needsHydration) {
        hydrationInProgress.current = true;
        applyHydration(programSummary, {
          disabledSectionIds: [],
          disabledDocumentIds: []
        }).then(() => {
          hydrationInProgress.current = false;
        }).catch(() => {
          hydrationInProgress.current = false;
        });
      }
    }
  }, [applyHydration, programSummary, selectedProduct, isConfiguratorOpen]);

  // Apply pending changes when configurator closes
  useEffect(() => {
    if (!isConfiguratorOpen && pendingProductChange) {
      const productToApply = pendingProductChange;
      setSelectedProduct(productToApply);
      setProductType(productToApply);
      setPendingProductChange(null);
      hydrationInProgress.current = false;
    }
  }, [isConfiguratorOpen, pendingProductChange, setProductType]);

  const handleProductChange = useCallback(
    (next: ProductType | null) => {
      if (isConfiguratorOpen) {
        setPendingProductChange(next);
        setSelectedProduct(next);
        if (next) {
          setProductType(next);
        }
      } else {
        setSelectedProduct(next);
        if (next) {
          setProductType(next);
        }
      }
    },
    [setProductType, isConfiguratorOpen]
  );

  const handleTemplateUpdate = useCallback((options: {
    disabledSectionIds: string[];
    disabledDocumentIds: string[];
    customSections?: any[];
    customDocuments?: any[];
  }) => {
    const isLoading = useEditorStore.getState().isLoading;
    if (isLoading || hydrationInProgress.current) {
      return;
    }
    
    hydrationInProgress.current = true;
    
    applyHydration(programSummary, {
      disabledSectionIds: options.disabledSectionIds,
      disabledDocumentIds: options.disabledDocumentIds,
      customSections: options.customSections,
      customDocuments: options.customDocuments
    }).catch(() => {
      hydrationInProgress.current = false;
    }).then(() => {
      setTimeout(() => {
        hydrationInProgress.current = false;
      }, 500);
    });
  }, [applyHydration, programSummary]);

  // ========== Template Management (from useTemplateManagement) ==========
  const [sections, setSections] = useState<SectionTemplate[]>([]);
  const [documents, setDocuments] = useState<DocumentTemplate[]>([]);
  const [customSections, setCustomSections] = useState<SectionTemplate[]>([]);
  const [customDocuments, setCustomDocuments] = useState<DocumentTemplate[]>([]);
  const [templateLoading, setTemplateLoading] = useState(() => {
    return selectedProduct !== null;
  });
  const [templateError, setTemplateError] = useState<string | null>(null);

  // Initialize disabled state from plan.metadata
  const [disabledSections, setDisabledSections] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') {
      return new Set();
    }
    try {
      const storeState = useEditorStore.getState();
      if (storeState.plan?.metadata?.disabledSectionIds) {
        return new Set(storeState.plan.metadata.disabledSectionIds);
      }
    } catch (_e) {
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
    } catch (_e) {
      // Store might not be ready yet
    }
    return new Set();
  });

  // Template loading
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

  const toggleSection = useCallback((sectionId: string) => {
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

  // ========== Document Management (from useDocumentManagement) ==========
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
        console.warn('[useEditor] Failed to parse document selection cache:', err);
      }
      return createDefaultSelectionState();
    }
  });

  const clickedDocumentId = productDocumentSelections[selectedProduct || 'submission'] ?? null;

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
        console.warn('[useEditor] Failed to persist document selection cache:', err);
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
    updateProductSelection(selectedProduct || 'submission', docId);
    
    const plan = useEditorStore.getState().plan;
    if (docId && plan && isAdditionalDocument(plan, docId)) {
      setActiveSection(METADATA_SECTION_ID);
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
    
    const documentTitlePage = defaultTitlePage();
    documentTitlePage.planTitle = newDocumentName.trim();
    
    const currentPlan = useEditorStore.getState().plan;
    if (currentPlan) {
      const documentSections = currentPlan.metadata?.documentSections || {};
      const documentTitlePages = currentPlan.metadata?.documentTitlePages || {};
      
      let initialSections: Section[] = [];
      if (programSummary && allSections.length > 0) {
        // Use getRelatedSections helper instead of duplicating keyword matching logic
        const relatedSectionTemplates = getRelatedSections(newDocument.id, allSections, allDocuments, selectedProduct);
        
        initialSections = relatedSectionTemplates
          .filter(sectionTemplate => !disabledSections.has(sectionTemplate.id))
          .map(sectionTemplate => {
            const existingSection = currentPlan.sections.find(s => s.id === sectionTemplate.id);
            if (existingSection) {
              return existingSection;
            }
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
      
      updateProductSelection(selectedProduct || 'submission', newDocument.id);
      setActiveSection(METADATA_SECTION_ID);
      
      if (onDocumentCreated) {
        onDocumentCreated(newDocument.id);
      }
    }
    
    return newDocument;
  }, [programSummary, allSections, allDocuments, disabledSections, selectedProduct, updateProductSelection, setActiveSection]);

  // Get plan from store (reactive)
  const plan = useEditorStore((state) => state.plan);

  // Compute document-specific plan
  const documentPlan = useMemo(() => {
    if (clickedDocumentId && plan && isAdditionalDocument(plan, clickedDocumentId)) {
      const documentSections = getDocumentSections(plan, clickedDocumentId);
      const documentTitlePage = getDocumentTitlePage(plan, clickedDocumentId, plan.titlePage);
      
      return {
        ...plan,
        sections: documentSections,
        titlePage: documentTitlePage
      };
    }
    return plan;
  }, [plan, clickedDocumentId]);

  // ========== Computed Values ==========
  // Filter sections based on clicked document
  const filteredSections = useMemo(() => 
    clickedDocumentId 
      ? getRelatedSections(clickedDocumentId, allSections, allDocuments, selectedProduct)
      : allSections,
    [clickedDocumentId, allSections, allDocuments, selectedProduct]
  );
  
  const filteredDocuments = allDocuments;

  // ========== Return Unified Interface ==========
  return {
    // UI State
    isConfiguratorOpen,
    setIsConfiguratorOpen,
    editingSectionId,
    setEditingSectionId,
    connectCopy,
    productOptions,
    
    // Program Connection
    programId,
    programSummary,
    programLoading,
    programError,
    handleConnectProgram,
    setProgramSummary,
    
    // Product Selection
    selectedProduct,
    handleProductChange,
    handleTemplateUpdate,
    applyHydration,
    hydrationInProgress,
    
    // Template Management
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
    removeCustomDocument,
    
    // Document Management
    clickedDocumentId,
    productDocumentSelections,
    updateProductSelection,
    handleSelectDocument,
    addCustomDocument,
    documentPlan,
    filteredSections,
    filteredDocuments
  };
}
