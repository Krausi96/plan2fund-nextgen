import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { useRouter } from 'next/router';

import { TemplateOverviewPanel, ConnectCopy } from './layout/Desktop/Desktop';
import { Workspace } from './layout/Workspace/Main Editor/Workspace';
import RightPanel from './layout/Workspace/Right-Panel/RightPanel';
import {
  AISuggestionOptions,
  ANCILLARY_SECTION_ID,
  METADATA_SECTION_ID,
  mapProgramTypeToFunding,
  normalizeProgramInput,
  useEditorActions,
  useEditorStore
} from '@/features/editor/hooks/useEditorStore';
import {
  ProductType,
  ProgramSummary,
  Question,
  Section,
  Dataset,
  KPI,
  MediaAsset
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
    rightPanelView,
    progressSummary
  } = useEditorStore((state) => ({
    plan: state.plan,
    isLoading: state.isLoading,
    error: state.error,
    activeSectionId: state.activeSectionId,
    activeQuestionId: state.activeQuestionId,
    rightPanelView: state.rightPanelView,
    progressSummary: state.progressSummary
  }));

  const {
    hydrate,
    setActiveSection,
    setActiveQuestion,
    setRightPanelView,
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
    requestAISuggestions,
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

  const isAncillaryView = activeSectionId === ANCILLARY_SECTION_ID;
  const isMetadataView = activeSectionId === METADATA_SECTION_ID;
  const isSpecialWorkspace = isAncillaryView || isMetadataView;
  const activeSection: Section | null = useMemo(() => {
    if (!plan || isSpecialWorkspace) return null;
    return plan.sections.find((section) => section.id === activeSectionId) ?? plan.sections[0] ?? null;
  }, [plan, activeSectionId, isSpecialWorkspace]);
  const activeQuestion: Question | null = useMemo(() => {
    if (!activeSection) return null;
    return (
      activeSection.questions.find((question) => question.id === activeQuestionId) ??
      activeSection.questions[0] ??
      null
    );
  }, [activeSection, activeQuestionId]);

  const triggerAISuggestions = useCallback(
    (questionId?: string, options?: AISuggestionOptions) => {
      if (!activeSection) return;
      const targetQuestionId = questionId ?? activeQuestion?.id;
      if (!targetQuestionId) return;
      requestAISuggestions(activeSection.id, targetQuestionId, options);
      setRightPanelView('ai');
    },
    [activeSection, activeQuestion, requestAISuggestions, setRightPanelView]
  );

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
            {/* Dein Schreibtisch - Template Overview Panel with integrated Sidebar */}
            <div className="relative z-30 mb-0">
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
                plan={plan}
                activeSectionId={activeSectionId ?? plan.sections[0]?.id ?? null}
                onSelectSection={setActiveSection}
                isAncillaryView={isAncillaryView}
                isMetadataView={isMetadataView}
                activeSection={activeSection}
                activeQuestionId={activeQuestionId}
                onSelectQuestion={setActiveQuestion}
                onAnswerChange={updateAnswer}
                onToggleUnknown={toggleQuestionUnknown}
                onMarkComplete={markQuestionComplete}
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
                rightPanelView={rightPanelView}
                setRightPanelView={setRightPanelView}
                activeQuestion={activeQuestion}
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
                onAskAI={triggerAISuggestions}
              />
            </div>

            {/* Workspace and RightPanel */}
            <div className="relative z-0">
            <div className="relative rounded-lg border-t-0 border border-blue-600/50 overflow-hidden backdrop-blur-lg shadow-xl rounded-t-none">
              <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-blue-900 to-slate-950" />
              <div className="absolute inset-0 bg-black/20 backdrop-blur-xl" />
              <div className="relative z-10 flex flex-col gap-1 lg:flex-row lg:items-start p-1">
                <div className="flex-1 min-w-0 max-w-4xl">
                  <Workspace
                plan={plan}
                isAncillaryView={isAncillaryView}
                isMetadataView={isMetadataView}
                activeSection={activeSection}
                activeQuestionId={activeQuestionId}
                onSelectQuestion={setActiveQuestion}
                onAnswerChange={updateAnswer}
                onToggleUnknown={toggleQuestionUnknown}
                onMarkComplete={markQuestionComplete}
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
                  />
                </div>

                <div className="w-full lg:w-[500px] flex-shrink-0">
                  <RightPanel
                view={rightPanelView}
                setView={setRightPanelView}
                section={activeSection ?? (isSpecialWorkspace ? undefined : plan.sections[0])}
                question={activeQuestion ?? undefined}
                plan={plan}
                onDatasetCreate={(dataset: Dataset) => activeSection && addDataset(activeSection.id, dataset)}
                onKpiCreate={(kpi: KPI) => activeSection && addKpi(activeSection.id, kpi)}
                onMediaCreate={(asset: MediaAsset) => activeSection && addMedia(activeSection.id, asset)}
                onAttachDataset={(dataset: Dataset) =>
                  activeSection && activeQuestion && attachDatasetToQuestion(activeSection.id, activeQuestion.id, dataset)
                }
                onAttachKpi={(kpi: KPI) =>
                  activeSection && activeQuestion && attachKpiToQuestion(activeSection.id, activeQuestion.id, kpi)
                }
                onAttachMedia={(asset: MediaAsset) =>
                  activeSection && activeQuestion && attachMediaToQuestion(activeSection.id, activeQuestion.id, asset)
                }
                onRunRequirements={runRequirementsCheck}
                progressSummary={progressSummary}
                onAskAI={triggerAISuggestions}
                onAnswerChange={updateAnswer}
                  />
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

