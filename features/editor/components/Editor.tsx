import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { useRouter } from 'next/router';

import { TemplateOverviewPanel, ConnectCopy } from './layout/Desktop/Desktop';
import Sidebar from './layout/Workspace/Navigation/Sidebar';
import PreviewWorkspace from './layout/Workspace/Preview/PreviewWorkspace';
import InlineSectionEditor from './layout/Workspace/Content/InlineSectionEditor';
import DocumentsBar from './layout/Workspace/Content/DocumentsBar';
import CurrentSelection from './layout/Workspace/Navigation/CurrentSelection';
import type { SectionTemplate, DocumentTemplate } from '@templates';
import {
  ANCILLARY_SECTION_ID,
  METADATA_SECTION_ID,
  REFERENCES_SECTION_ID,
  APPENDICES_SECTION_ID,
  mapProgramTypeToFunding,
  normalizeProgramInput,
  useEditorActions,
  useEditorStore
} from '@/features/editor/hooks/useEditorStore';
import {
  ProductType,
  ProgramSummary,
  Question,
  Section
} from '@/features/editor/types/plan';
import { useI18n } from '@/shared/contexts/I18nContext';
import {
  clearSelectedProgram,
  loadSelectedProgram,
  saveSelectedProgram
} from '@/shared/user/storage/planStore';

type EditorProps = {
  product?: ProductType;
};

type ProductConfig = {
  value: ProductType;
  labelKey: string;
  descriptionKey: string;
  icon: string;
};

const PRODUCT_TYPE_CONFIG: ProductConfig[] = [
  {
    value: 'strategy' as ProductType,
    labelKey: 'planTypes.strategy.title',
    descriptionKey: 'planTypes.strategy.subtitle',
    icon: '💡'
  },
  {
    value: 'review' as ProductType,
    labelKey: 'planTypes.review.title',
    descriptionKey: 'planTypes.review.subtitle',
    icon: '✏️'
  },
  {
    value: 'submission' as ProductType,
    labelKey: 'planTypes.custom.title',
    descriptionKey: 'planTypes.custom.subtitle',
    icon: '📋'
  }
] as const;

export default function Editor({ product = 'submission' }: EditorProps) {
  const router = useRouter();
  const { t } = useI18n();

  const {
    plan,
    isLoading,
    error,
    activeSectionId,
    activeQuestionId,
    progressSummary
  } = useEditorStore((state) => ({
    plan: state.plan,
    isLoading: state.isLoading,
    error: state.error,
    activeSectionId: state.activeSectionId,
    activeQuestionId: state.activeQuestionId,
    progressSummary: state.progressSummary
  }));

  const {
    hydrate,
    setActiveQuestion,
    setActiveSection,
    updateAnswer,
    markQuestionComplete,
    addDataset,
    addKpi,
    addMedia,
    attachDatasetToQuestion,
    attachKpiToQuestion,
    attachMediaToQuestion,
    updateTitlePage,
    updateAncillary,
    addReference,
    updateReference,
    deleteReference,
    addAppendix,
    updateAppendix,
    deleteAppendix,
    runRequirementsCheck,
    toggleQuestionUnknown,
    setProductType
  } = useEditorActions((actions) => actions);

  const [selectedProduct, setSelectedProduct] = useState<ProductType>(product);
  const [programId, setProgramId] = useState<string | null>(null);
  const [programSummary, setProgramSummary] = useState<ProgramSummary | null>(null);
  const [programLoading, setProgramLoading] = useState(false);
  const [programError, setProgramError] = useState<string | null>(null);
  const storedProgramChecked = useRef(false);
  const hydrationInProgress = useRef(false);

  const connectCopy = useMemo<ConnectCopy>(
    () => ({
      badge: (t('editor.connect.badge' as any) as string) || 'Program options',
      heading: (t('editor.connect.heading' as any) as string) || 'Pick a program or paste a link',
      description:
        (t('editor.connect.description' as any) as string) ||
        'ProgramFinder can suggest matches from your answers. Already have an official funding URL (AWS, FFG, EU call)? Paste it and we’ll pull the requirements automatically.',
      openFinder: (t('editor.connect.openFinder' as any) as string) || 'Open ProgramFinder',
      pasteLink: (t('editor.connect.pasteLink' as any) as string) || 'Paste program link',
      inputLabel: (t('editor.connect.inputLabel' as any) as string) || 'Official program URL',
      placeholder: (t('editor.connect.placeholder' as any) as string) || 'e.g. https://www.aws.at/funding/...',
      example:
        (t('editor.connect.example' as any) as string) ||
        'Example: https://www.aws.at/funding/aws-preseed/page_123 or https://www.ffg.at/calls/page_456',
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

  useEffect(() => {
    setSelectedProduct(product);
  }, [product]);


  // Hydrate plan when product/program is selected (but allow overview to show)
  useEffect(() => {
    if (selectedProduct && typeof window !== 'undefined' && !hydrationInProgress.current) {
      hydrationInProgress.current = true;
      console.log('[Editor] Triggering hydration', { selectedProduct, hasProgram: !!programSummary });
      // Call with empty options initially - will be updated when TemplateOverviewPanel calls onUpdate
      applyHydration(programSummary, {
        disabledSectionIds: [],
        disabledDocumentIds: []
      }).catch((err) => {
        console.error('[Editor] Hydration error:', err);
        hydrationInProgress.current = false;
      }).finally(() => {
        // Reset after a delay to allow for updates
        setTimeout(() => {
          hydrationInProgress.current = false;
        }, 1000);
      });
    }
  }, [applyHydration, programSummary, selectedProduct]);

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
      const response = await fetch(`/api/programs/${id}/requirements`);
      if (!response.ok) {
        throw new Error('Unable to load program metadata.');
      }
      const data = await response.json();
      const mapping = mapProgramTypeToFunding(data.program_type);
      const summary: ProgramSummary = {
        id,
        name: data.program_name ?? data.program_id ?? id,
        fundingType: mapping.templateFundingType,
        fundingProgramTag: mapping.fundingProgramTag,
        deadline: data?.library?.[0]?.deadlines?.[0] ?? null,
        amountRange: data?.library?.[0]?.funding_amount ?? null,
        region: data?.library?.[0]?.region ?? null
      };
      setProgramSummary(summary);
      saveSelectedProgram({ id, name: summary.name, type: summary.fundingProgramTag });
    } catch (err) {
      setProgramSummary(null);
      setProgramError(err instanceof Error ? err.message : 'Failed to load program metadata.');
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
        setProgramError('Enter a program ID like page_123 or paste a URL that contains it.');
        return;
      }
      setProgramError(null);
      setProgramId(normalized);
      const nextQuery = { ...router.query, programId: normalized };
      router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true });
    },
    [router]
  );

  const handleProductChange = useCallback(
    (next: ProductType) => {
      setSelectedProduct(next);
      setProductType(next);
    },
    [setProductType]
  );

  const handleTemplateUpdate = useCallback((options: {
    disabledSectionIds: string[];
    disabledDocumentIds: string[];
    customSections?: any[];
    customDocuments?: any[];
  }) => {
    // Only update if we have a plan or are not currently loading
    // This prevents infinite loops
    if (isLoading || hydrationInProgress.current) {
      console.log('[Editor] Skipping template update - still loading');
      return;
    }
    
    hydrationInProgress.current = true;
    
    // Update hydration with new disabled sections/documents and custom templates
    applyHydration(programSummary, {
      disabledSectionIds: options.disabledSectionIds,
      disabledDocumentIds: options.disabledDocumentIds,
      customSections: options.customSections,
      customDocuments: options.customDocuments
    }).catch((err) => {
      console.error('[Editor] Template update error:', err);
      hydrationInProgress.current = false;
    }).then(() => {
      // Reset after a delay to allow for updates
      setTimeout(() => {
        hydrationInProgress.current = false;
      }, 500);
    });
  }, [applyHydration, programSummary, isLoading]);

  // Track filtered section IDs for sidebar filtering
  const [filteredSectionIds, setFilteredSectionIds] = useState<string[] | null>(null);
  // Track editing section for inline editor - MUST BE DECLARED BEFORE useMemo
  // Auto-open editor when section is selected from sidebar
  // Always show editor - default to active section if no explicit editingSectionId
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  
  // Always show editor - simple logic: use editingSectionId, then activeSectionId, then default to first section or METADATA
  const effectiveEditingSectionId = useMemo(() => {
    if (!plan) return null;
    
    // Priority 1: Explicitly set editing section
    if (editingSectionId) return editingSectionId;
    
    // Priority 2: Active section
    if (activeSectionId) return activeSectionId;
    
    // Priority 3: First regular section
    if (plan.sections && plan.sections.length > 0) {
      return plan.sections[0].id;
    }
    
    // Priority 4: METADATA (always available)
    return METADATA_SECTION_ID;
  }, [editingSectionId, activeSectionId, plan]);
  // Template management state from Desktop (for DocumentsBar and Sidebar)
  const [templateState, setTemplateState] = useState<{
    filteredDocuments: DocumentTemplate[];
    disabledDocuments: Set<string>;
    enabledDocumentsCount: number;
    expandedDocumentId: string | null;
    editingDocument: DocumentTemplate | null;
    clickedDocumentId: string | null;
    showAddDocument: boolean;
    newDocumentName: string;
    newDocumentDescription: string;
    filteredSections: SectionTemplate[];
    allSections: SectionTemplate[]; // All sections for counting
    disabledSections: Set<string>;
    expandedSectionId: string | null;
    editingSection: SectionTemplate | null;
    showAddSection: boolean;
    newSectionTitle: string;
    newSectionDescription: string;
    selectionSummary?: {
      productLabel: string;
      productIcon?: string;
      programLabel: string | null;
      enabledSectionsCount: number;
      totalSectionsCount: number;
      enabledDocumentsCount: number;
      totalDocumentsCount: number;
      sectionTitles: string[];
      documentTitles: string[];
    };
    handlers: any;
  } | null>(null);

  // Track if activeSectionId change was from user interaction (sidebar click) vs scroll detection
  const sectionChangeSourceRef = useRef<'user' | 'scroll' | 'preview'>('scroll');

  // Wrapper for setActiveSection that tracks the source
  const handleSectionSelect = useCallback((sectionId: string, source: 'user' | 'scroll' | 'preview' = 'user') => {
    sectionChangeSourceRef.current = source;
    setActiveSection(sectionId);
  }, [setActiveSection]);

  // Auto-activate editor when plan loads or activeSectionId changes
  useEffect(() => {
    if (!plan) return;
    
    // If no active section, set one
    if (!activeSectionId) {
      if (plan.sections && plan.sections.length > 0) {
        setActiveSection(plan.sections[0].id);
      } else {
        setActiveSection(METADATA_SECTION_ID);
      }
      return;
    }
    
    // Auto-open editor for active section
    const isMetadataSection = activeSectionId === METADATA_SECTION_ID || 
                              activeSectionId === ANCILLARY_SECTION_ID || 
                              activeSectionId === REFERENCES_SECTION_ID || 
                              activeSectionId === APPENDICES_SECTION_ID;
    
    // Always set editingSectionId to show editor
    if (!editingSectionId || editingSectionId !== activeSectionId) {
      setEditingSectionId(activeSectionId);
    }
    
    // For regular sections, set first question as active if not already set
    if (!isMetadataSection) {
      const section = plan.sections.find(s => s.id === activeSectionId);
      if (section && !activeQuestionId) {
        setActiveQuestion(section.questions[0]?.id ?? null);
      }
    }

    // If change was from user interaction (sidebar click) or preview click, scroll to section
    if (sectionChangeSourceRef.current === 'user' || sectionChangeSourceRef.current === 'preview') {
      const scrollToSection = () => {
        const scrollContainer = document.getElementById('preview-scroll-container');
        if (!scrollContainer) {
          console.log('[Scroll] Scroll container not found');
          return false;
        }

        // Find the section element - try multiple strategies
        let sectionElement: HTMLElement | null = null;
        
        // Strategy 1: Query within scroll container (most reliable)
        sectionElement = scrollContainer.querySelector(`[data-section-id="${activeSectionId}"]`) as HTMLElement;
        
        // Strategy 2: Query within export-preview class (where sections are rendered)
        if (!sectionElement) {
          const exportPreview = scrollContainer.querySelector('.export-preview');
          if (exportPreview) {
            sectionElement = exportPreview.querySelector(`[data-section-id="${activeSectionId}"]`) as HTMLElement;
          }
        }

        // Strategy 3: Query entire document (fallback)
        if (!sectionElement) {
          sectionElement = document.querySelector(`[data-section-id="${activeSectionId}"]`) as HTMLElement;
        }

        if (sectionElement) {
          // Use scrollIntoView for reliable scrolling
          // This handles all edge cases including transforms and scaling
          // For metadata sections, scroll to top of page
          const isMetadataSectionScroll = activeSectionId === METADATA_SECTION_ID || 
                                        activeSectionId === ANCILLARY_SECTION_ID || 
                                        activeSectionId === REFERENCES_SECTION_ID || 
                                        activeSectionId === APPENDICES_SECTION_ID;
          
          sectionElement.scrollIntoView({
            behavior: 'smooth',
            block: isMetadataSectionScroll ? 'start' : 'center',
            inline: 'nearest'
          });
          
          console.log('[Scroll] Scrolled to section:', activeSectionId);
          return true;
        } else {
          console.log('[Scroll] Section element not found:', activeSectionId);
        }
        
        return false;
      };

      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        // Try immediately
        if (!scrollToSection()) {
          // Element not found yet, retry with increasing delays
          const retries = [100, 300, 500, 1000, 2000];
          let retryIndex = 0;
          
          const retryScroll = () => {
            if (retryIndex < retries.length) {
              setTimeout(() => {
                if (scrollToSection()) {
                  // Success, stop retrying
                  return;
                }
                retryIndex++;
                retryScroll();
              }, retries[retryIndex]);
            } else {
              console.warn('[Scroll] Section element not found after all retries:', activeSectionId);
            }
          };
          
          retryScroll();
        }
      });
    }
    
    // Reset source after handling
    sectionChangeSourceRef.current = 'scroll';
  }, [activeSectionId, plan, activeQuestionId, editingSectionId, setActiveSection, setActiveQuestion, setEditingSectionId]);

  // Scroll detection to update active section when scrolling through preview
  // Uses IntersectionObserver for more reliable detection
  useEffect(() => {
    if (!plan || plan.sections.length === 0) return;

    const scrollContainer = document.getElementById('preview-scroll-container');
    if (!scrollContainer) return;

    // Use IntersectionObserver for better reliability
    const observerOptions = {
      root: scrollContainer,
      rootMargin: '-20% 0px -20% 0px', // Only trigger when section is in center 60% of viewport
      threshold: [0, 0.1, 0.3, 0.5, 0.7, 1.0] // Multiple thresholds for better detection
    };

    interface SectionVisibility {
      id: string;
      ratio: number;
      isIntersecting: boolean;
    }

    const sectionVisibility = new Map<string, SectionVisibility>();

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        const sectionId = (entry.target as HTMLElement).getAttribute('data-section-id');
        if (!sectionId) return;

        sectionVisibility.set(sectionId, {
          id: sectionId,
          ratio: entry.intersectionRatio,
          isIntersecting: entry.isIntersecting
        });
      });

      // Find the section with highest visibility ratio that's intersecting
      const intersectingSections = Array.from(sectionVisibility.values()).filter(v => v.isIntersecting);
      const bestSection = intersectingSections.length > 0 
        ? intersectingSections.reduce((best, current) => 
            current.ratio > best.ratio ? current : best
          )
        : null;

      // Update active section if we found a better match
      if (bestSection && bestSection.ratio > 0.1 && bestSection.id !== activeSectionId) {
        const bestSectionId: string = bestSection.id;
        
        // Check if this is a metadata section
        const isMetadataSection = bestSectionId === METADATA_SECTION_ID || 
                                  bestSectionId === ANCILLARY_SECTION_ID || 
                                  bestSectionId === REFERENCES_SECTION_ID || 
                                  bestSectionId === APPENDICES_SECTION_ID;
        
        if (isMetadataSection) {
          // For metadata sections, clear editingSectionId (no inline editor)
          handleSectionSelect(bestSectionId, 'scroll');
          setEditingSectionId(null); // Clear any existing editor
        } else {
          // For regular sections, find the section and update editor
          const sectionToEdit = plan.sections.find(s => s.id === bestSectionId);
          if (sectionToEdit) {
            // Mark as scroll-triggered change and update
            handleSectionSelect(bestSectionId, 'scroll');
            // Only update question if we don't have one selected or if it's a different section
            if (!activeQuestionId || activeSectionId !== bestSectionId) {
              setActiveQuestion(sectionToEdit.questions[0]?.id ?? null);
            }
            // Update editor to follow the new active section
            setEditingSectionId(bestSectionId);
          }
        }
      }
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all section elements
    const observeSections = () => {
      // Try scroll container first
      const sectionElements = scrollContainer.querySelectorAll('[data-section-id]');
      
      if (sectionElements.length === 0) {
        // Fallback to global query
        const globalSections = document.querySelectorAll('[data-section-id]');
        globalSections.forEach((el) => {
          observer.observe(el as HTMLElement);
        });
      } else {
        sectionElements.forEach((el) => {
          observer.observe(el as HTMLElement);
        });
      }
    };

    // Initial observation - wait a bit for DOM to be ready
    const observeTimeout = setTimeout(observeSections, 200);

    // Also observe on scroll (in case new sections are added)
    let scrollTimeout: NodeJS.Timeout | null = null;
    const handleScroll = () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      scrollTimeout = setTimeout(() => {
        // Re-observe in case new sections appeared
        observeSections();
      }, 500);
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(observeTimeout);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      observer.disconnect();
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [plan, activeSectionId, activeQuestionId, editingSectionId, setActiveSection, setActiveQuestion, setEditingSectionId]);

  const isAncillaryView = activeSectionId === ANCILLARY_SECTION_ID;
  const isMetadataView = activeSectionId === METADATA_SECTION_ID;
  const isSpecialWorkspace = isAncillaryView || isMetadataView;
  // Get active section - use effectiveEditingSectionId to find section being edited
  const activeSection: Section | null = useMemo(() => {
    if (!plan) return null;
    // Use effectiveEditingSectionId (which defaults to activeSectionId if not explicitly set)
    if (effectiveEditingSectionId) {
      // For special sections, they're not in plan.sections, so return null
      if (effectiveEditingSectionId === METADATA_SECTION_ID || 
          effectiveEditingSectionId === ANCILLARY_SECTION_ID || 
          effectiveEditingSectionId === REFERENCES_SECTION_ID || 
          effectiveEditingSectionId === APPENDICES_SECTION_ID) {
        return null;
      }
      return plan.sections.find((section) => section.id === effectiveEditingSectionId) ?? null;
    }
    // Otherwise use activeSectionId
    if (isSpecialWorkspace) return null;
    return plan.sections.find((section) => section.id === activeSectionId) ?? plan.sections[0] ?? null;
  }, [plan, activeSectionId, isSpecialWorkspace, effectiveEditingSectionId]);
  const activeQuestion: Question | null = useMemo(() => {
    if (!activeSection) return null;
    return (
      activeSection.questions.find((question) => question.id === activeQuestionId) ??
      activeSection.questions[0] ??
      null
    );
  }, [activeSection, activeQuestionId]);


  // Handle document selection changes from Desktop - navigate to first filtered section
  const handleDocumentSelectionChange = useCallback((sectionIds: string[]) => {
    if (!plan) return;
    
    // Store filtered section IDs for sidebar filtering
    setFilteredSectionIds(sectionIds.length > 0 ? sectionIds : null);
    
    // Check if current active section is already in the filtered list - if so, don't navigate
    if (activeSectionId && sectionIds.length > 0 && sectionIds.includes(activeSectionId)) {
      return; // Already on a filtered section, no need to navigate
    }
    
    if (sectionIds.length === 0) {
      // If no filtered sections (core product selected), navigate to first available section or metadata
      const firstSection = plan.sections[0];
      if (firstSection && firstSection.id !== activeSectionId) {
        setActiveSection(firstSection.id);
      } else if (!activeSectionId || activeSectionId !== METADATA_SECTION_ID) {
        setActiveSection(METADATA_SECTION_ID);
      }
      return;
    }
    
    // Find the first filtered section that exists in the plan
    const firstFilteredSection = plan.sections.find(section => 
      sectionIds.includes(section.id)
    );
    
    if (firstFilteredSection && firstFilteredSection.id !== activeSectionId) {
      // Navigate to the first filtered section (only if different from current)
      setActiveSection(firstFilteredSection.id);
    } else if (!firstFilteredSection) {
      // If filtered sections don't exist in plan yet, navigate to first available
      const firstSection = plan.sections[0];
      if (firstSection && firstSection.id !== activeSectionId) {
        setActiveSection(firstSection.id);
      } else if (!activeSectionId || activeSectionId !== METADATA_SECTION_ID) {
        setActiveSection(METADATA_SECTION_ID);
      }
    }
  }, [plan, setActiveSection, activeSectionId]);

  // Show loading/error states
  if (isLoading || !plan) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-gray-500 space-y-2">
        <div>{(t('editor.ui.loadingEditor' as any) as string) || 'Loading editor...'}</div>
        {isLoading && <div className="text-xs text-gray-400">Initializing plan...</div>}
        {!plan && !isLoading && <div className="text-xs text-gray-400">Waiting for plan data...</div>}
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-4">
        <p className="text-red-500 font-semibold">{error}</p>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          onClick={() => hydrate(product)}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-neutral-200 text-textPrimary">
      {/* Workspace - show if plan exists */}
      {plan ? (
        <>
          <div className="container pb-6">
            <div className="relative rounded-[32px] border border-dashed border-white shadow-[0_30px_80px_rgba(6,12,32,0.65)]">
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-900/90 to-slate-900 rounded-[32px]" />
              <div className="relative z-10 flex flex-col gap-2 p-4 lg:p-6 overflow-hidden">
                {/* Dein Schreibtisch - Template Overview Panel */}
                <TemplateOverviewPanel
                  productType={selectedProduct}
                  programSummary={programSummary}
                  fundingType={programSummary?.fundingType ?? 'grants'}
                  planMetadata={plan?.metadata}
                  onUpdate={handleTemplateUpdate}
                  onChangeProduct={handleProductChange}
                  onConnectProgram={handleConnectProgram}
                  onOpenProgramFinder={() => router.push('/reco')}
                  programLoading={programLoading}
                  programError={programError}
                  productOptions={productOptions}
                  connectCopy={connectCopy}
                  onDocumentSelectionChange={handleDocumentSelectionChange}
                  onTemplateStateExposed={setTemplateState}
                />

                {/* Workspace Container - Document-Centric Layout */}
                <div className="relative rounded-2xl border border-dashed border-white/60 bg-slate-900/40 p-4 lg:p-6 shadow-lg backdrop-blur-sm w-full">
                  {/* Grid Layout: 2 rows, 2 columns */}
                  <div className="grid grid-cols-[320px_1fr] grid-rows-[auto_1fr] gap-4 h-[calc(100vh-380px)] min-h-[800px] max-h-[calc(100vh-200px)]" style={{ overflow: 'visible' }}>
                    {/* Row 1, Col 1: Current Selection - Fills gap next to DocumentsBar */}
                    <div className="flex-shrink-0 overflow-visible relative" style={{ zIndex: 0 }}>
                      {templateState?.selectionSummary ? (
                        <CurrentSelection
                          productLabel={templateState.selectionSummary.productLabel}
                          productIcon={templateState.selectionSummary.productIcon}
                          programLabel={templateState.selectionSummary.programLabel}
                          enabledSectionsCount={templateState.selectionSummary.enabledSectionsCount}
                          totalSectionsCount={templateState.selectionSummary.totalSectionsCount}
                          enabledDocumentsCount={templateState.selectionSummary.enabledDocumentsCount}
                          totalDocumentsCount={templateState.selectionSummary.totalDocumentsCount}
                          sectionTitles={templateState.selectionSummary.sectionTitles}
                          documentTitles={templateState.selectionSummary.documentTitles}
                        />
                      ) : (
                        <div className="h-full border-r border-white/10 pr-4">
                          <div className="text-white/60 text-sm">Loading selection...</div>
                        </div>
                      )}
                    </div>

                    {/* Row 1, Col 2: Documents Bar - Same Width as Preview */}
                    <div className="flex-shrink-0 overflow-visible relative" style={{ zIndex: 0 }}>
                      {templateState ? (
                        <DocumentsBar
                          filteredDocuments={templateState.filteredDocuments}
                          disabledDocuments={templateState.disabledDocuments}
                          enabledDocumentsCount={templateState.enabledDocumentsCount}
                          expandedDocumentId={templateState.expandedDocumentId}
                          editingDocument={templateState.editingDocument}
                          selectedProductMeta={productOptions.find((option) => option.value === selectedProduct) ?? null}
                          clickedDocumentId={templateState.clickedDocumentId}
                          showAddDocument={templateState.showAddDocument}
                          newDocumentName={templateState.newDocumentName}
                          newDocumentDescription={templateState.newDocumentDescription}
                          onToggleDocument={templateState.handlers.onToggleDocument}
                          onSelectDocument={templateState.handlers.onSelectDocument}
                          onEditDocument={templateState.handlers.onEditDocument}
                          onSaveDocument={templateState.handlers.onSaveDocument}
                          onCancelEdit={templateState.handlers.onCancelEdit}
                          onToggleAddDocument={templateState.handlers.onToggleAddDocument}
                          onAddCustomDocument={templateState.handlers.onAddCustomDocument}
                          onSetNewDocumentName={templateState.handlers.onSetNewDocumentName}
                          onSetNewDocumentDescription={templateState.handlers.onSetNewDocumentDescription}
                          onRemoveCustomDocument={templateState.handlers.onRemoveCustomDocument}
                          getOriginBadge={templateState.handlers.getOriginBadge}
                        />
                      ) : (
                        <div className="w-full border-b border-white/10 pb-3 mb-3">
                          <div className="text-white/60 text-sm">Loading documents...</div>
                        </div>
                      )}
                    </div>

                    {/* Row 2, Col 1: Sidebar - Next to Preview */}
                    <div className="border-r border-white/10 pr-4 min-h-0 flex flex-col relative h-full" style={{ maxWidth: '320px', width: '320px', minWidth: '320px', boxSizing: 'border-box', zIndex: 1 }}>
                      <Sidebar
                        plan={plan}
                        activeSectionId={activeSectionId ?? plan.sections[0]?.id ?? null}
                        onSelectSection={(sectionId) => handleSectionSelect(sectionId, 'user')}
                        filteredSectionIds={filteredSectionIds}
                        filteredSections={templateState?.filteredSections}
                        allSections={templateState?.allSections}
                        disabledSections={templateState?.disabledSections}
                        expandedSectionId={templateState?.expandedSectionId}
                        editingSection={templateState?.editingSection}
                        showAddSection={templateState?.showAddSection}
                        newSectionTitle={templateState?.newSectionTitle}
                        newSectionDescription={templateState?.newSectionDescription}
                        onToggleSection={templateState?.handlers?.onToggleSection}
                        onEditSection={templateState?.handlers?.onEditSection}
                        onSaveSection={templateState?.handlers?.onSaveSection}
                        onCancelEdit={templateState?.handlers?.onCancelEdit}
                        onToggleAddSection={templateState?.handlers?.onToggleAddSection}
                        onAddCustomSection={templateState?.handlers?.onAddCustomSection}
                        onSetNewSectionTitle={templateState?.handlers?.onSetNewSectionTitle}
                        onSetNewSectionDescription={templateState?.handlers?.onSetNewSectionDescription}
                        onRemoveCustomSection={templateState?.handlers?.onRemoveCustomSection}
                        getOriginBadge={templateState?.handlers?.getOriginBadge}
                        selectedProductMeta={productOptions.find((option) => option.value === selectedProduct) ?? null}
                        programSummary={programSummary ? { name: programSummary.name, amountRange: programSummary.amountRange ?? undefined } : null}
                      />
                    </div>
                    
                    {/* Row 2, Col 2: Preview - Full Width */}
                    <div className="min-w-0 min-h-0 overflow-visible relative flex flex-col h-full min-h-[700px]" id="preview-container" style={{ zIndex: 1 }}>
                      {/* Preview - Always visible */}
                      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative" id="preview-scroll-container">
                        <PreviewWorkspace 
                          plan={plan} 
                          focusSectionId={activeSectionId}
                          editingSectionId={editingSectionId}
                          onSectionClick={(sectionId: string) => {
                            // Click section in preview → Select it (triggers editor via useEffect)
                            const isMetadataSection = sectionId === METADATA_SECTION_ID || 
                                                     sectionId === ANCILLARY_SECTION_ID || 
                                                     sectionId === REFERENCES_SECTION_ID || 
                                                     sectionId === APPENDICES_SECTION_ID;
                            
                            if (isMetadataSection) {
                              // For metadata sections, enable editing mode (editing happens inline in preview)
                              handleSectionSelect(sectionId, 'preview');
                              setEditingSectionId(sectionId); // Enable edit mode for metadata sections
                              // Scroll to the specific page
                              setTimeout(() => {
                                const scrollContainer = document.getElementById('preview-scroll-container');
                                const element = scrollContainer?.querySelector(`[data-section-id="${sectionId}"]`) as HTMLElement;
                                if (element) {
                                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                              }, 100);
                            } else {
                              // For regular sections, enable inline editor
                              const sectionToEdit = plan.sections.find(s => s.id === sectionId);
                              if (sectionToEdit) {
                                handleSectionSelect(sectionId, 'preview');
                                setEditingSectionId(sectionId); // Enable edit mode
                                setActiveQuestion(sectionToEdit.questions[0]?.id ?? null);
                              }
                            }
                          }}
                          onTitlePageChange={updateTitlePage}
                          onAncillaryChange={updateAncillary}
                          onReferenceAdd={addReference}
                          onReferenceUpdate={updateReference}
                          onReferenceDelete={deleteReference}
                          onAppendixAdd={addAppendix}
                          onAppendixUpdate={updateAppendix}
                          onAppendixDelete={deleteAppendix}
                        />
                      </div>
                      
                      {/* Inline Editor - RENDERED OUTSIDE SCROLL CONTAINER TO AVOID OVERFLOW CLIPPING */}
                      {/* ALWAYS VISIBLE when plan exists */}
                      {plan && effectiveEditingSectionId && (
                        <InlineSectionEditor
                          sectionId={effectiveEditingSectionId}
                          section={activeSection}
                          activeQuestionId={activeQuestionId}
                          plan={plan}
                          onClose={() => setEditingSectionId(null)}
                          onSelectQuestion={setActiveQuestion}
                          onAnswerChange={(questionId, content) => {
                            updateAnswer(questionId, content);
                          }}
                          onToggleUnknown={(questionId, note) => {
                            toggleQuestionUnknown(questionId, note);
                          }}
                          onMarkComplete={(questionId) => {
                            markQuestionComplete(questionId);
                          }}
                          onTitlePageChange={updateTitlePage}
                          onAncillaryChange={updateAncillary}
                          onReferenceAdd={addReference}
                          onReferenceUpdate={updateReference}
                          onReferenceDelete={deleteReference}
                          onAppendixAdd={addAppendix}
                          onAppendixUpdate={updateAppendix}
                          onAppendixDelete={deleteAppendix}
                          onRunRequirements={runRequirementsCheck}
                          progressSummary={progressSummary}
                          onDatasetCreate={(dataset) => activeSection && addDataset(activeSection.id, dataset)}
                          onKpiCreate={(kpi) => activeSection && addKpi(activeSection.id, kpi)}
                          onMediaCreate={(asset) => activeSection && addMedia(activeSection.id, asset)}
                          onAttachDataset={(dataset) =>
                            activeSection && activeQuestion && attachDatasetToQuestion(activeSection.id, activeQuestion.id, dataset)
                          }
                          onAttachKpi={(kpi) =>
                            activeSection && activeQuestion && attachKpiToQuestion(activeSection.id, activeQuestion.id, kpi)
                          }
                          onAttachMedia={(asset) =>
                            activeSection && activeQuestion && attachMediaToQuestion(activeSection.id, activeQuestion.id, asset)
                          }
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

