import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { useRouter } from 'next/router';

import Sidebar from './layout/shell/Sidebar';
import RightPanel from './layout/right-panel/RightPanel';
import { ConnectCopy, PlanConfigurator, Workspace } from './layout/shell/Workspace';
import { TemplateOverviewPanel } from './layout/shell/TemplateOverviewPanel';
import {
  AISuggestionOptions,
  ANCILLARY_SECTION_ID,
  METADATA_SECTION_ID,
  mapProgramTypeToFunding,
  normalizeProgramInput,
  useEditorActions,
  useEditorStore
} from '@/features/editor/hooks/useEditorStore';
import { getSections, getDocuments } from '@/features/editor/templates';
import type { SectionTemplate, DocumentTemplate } from '@/features/editor/templates/types';
import {
  BusinessPlan,
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
  
  // Template overview state
  const [showTemplateOverview, setShowTemplateOverview] = useState(false);
  const [loadedTemplates, setLoadedTemplates] = useState<{
    sections: SectionTemplate[];
    documents: DocumentTemplate[];
  } | null>(null);
  const [disabledSections, setDisabledSections] = useState<Set<string>>(new Set());
  const [disabledDocuments, setDisabledDocuments] = useState<Set<string>>(new Set());
  const [loadingTemplates, setLoadingTemplates] = useState(false);

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
    (summary: ProgramSummary | null, disabledSectionsSet?: Set<string>, disabledDocumentsSet?: Set<string>) => {
      const fundingType = summary?.fundingType ?? 'grants';
      hydrate(selectedProduct, {
        fundingType,
        programId: summary?.id,
        programName: summary?.name,
        summary: summary ?? undefined,
        disabledSections: disabledSectionsSet,
        disabledDocuments: disabledDocumentsSet
      });
      setShowTemplateOverview(false);
    },
    [hydrate, selectedProduct]
  );

  // Load templates when product/program changes (for overview)
  const loadTemplatesForOverview = useCallback(async () => {
    if (!selectedProduct) return;
    
    setLoadingTemplates(true);
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const fundingType = programSummary?.fundingType ?? 'grants';
      const sections = await getSections(fundingType, selectedProduct, programId || undefined, baseUrl);
      const documents = await getDocuments(fundingType, selectedProduct, programId || undefined, baseUrl);
      
      setLoadedTemplates({ sections, documents });
      
      // Show overview if we have a program or if user wants to customize
      if (programId || programSummary) {
        setShowTemplateOverview(true);
      }
    } catch (error) {
      console.error('Error loading templates for overview:', error);
      // Continue without overview if loading fails
    } finally {
      setLoadingTemplates(false);
    }
  }, [selectedProduct, programId, programSummary]);

  useEffect(() => {
    setSelectedProduct(product);
  }, [product]);

  // Load templates when product/program is ready (but don't hydrate yet if overview should show)
  useEffect(() => {
    if (!selectedProduct) return;
    
    if (programSummary || programId) {
      // Load templates for overview when program is selected
      loadTemplatesForOverview();
    } else if (!plan && !showTemplateOverview) {
      // Auto-hydrate if no program selected, no plan exists, and overview not shown
      applyHydration(null);
    }
  }, [selectedProduct, programId, programSummary, loadTemplatesForOverview, showTemplateOverview, applyHydration, plan]);

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
      setShowTemplateOverview(false);
      setLoadedTemplates(null);
    },
    [setProductType]
  );

  const handleStartEditing = useCallback(() => {
    applyHydration(programSummary, disabledSections, disabledDocuments);
  }, [applyHydration, programSummary, disabledSections, disabledDocuments]);

  const handleToggleSection = useCallback((sectionId: string, enabled: boolean) => {
    setDisabledSections(prev => {
      const next = new Set(prev);
      if (enabled) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const handleToggleDocument = useCallback((documentId: string, enabled: boolean) => {
    setDisabledDocuments(prev => {
      const next = new Set(prev);
      if (enabled) {
        next.delete(documentId);
      } else {
        next.add(documentId);
      }
      return next;
    });
  }, []);

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

  // Show loading only if we're not in template overview mode
  if ((isLoading || !plan) && !showTemplateOverview) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        {(t('editor.ui.loadingEditor' as any) as string) || 'Loading editor...'}
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
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur-sm">
        <div className="container py-1.5">
          <PlanConfigurator
            plan={plan as BusinessPlan | null}
            programSummary={programSummary ?? plan?.programSummary ?? null}
            onChangeProduct={handleProductChange}
            onConnectProgram={handleConnectProgram}
            onOpenProgramFinder={() => router.push('/reco')}
            programLoading={programLoading}
            programError={programError}
            productOptions={productOptions}
            connectCopy={connectCopy}
          />
          {showTemplateOverview && loadedTemplates && (
            <TemplateOverviewPanel
              sections={loadedTemplates.sections}
              documents={loadedTemplates.documents}
              programName={programSummary?.name}
              onToggleSection={handleToggleSection}
              onToggleDocument={handleToggleDocument}
              onStartEditing={handleStartEditing}
              disabledSections={disabledSections}
              disabledDocuments={disabledDocuments}
            />
          )}
        </div>
      </header>

      {!showTemplateOverview && (
        <>
          <div className="border-b border-neutral-200 bg-neutral-200 sticky top-[72px] z-30">
            <div className="container">
            <Sidebar
              plan={plan}
              activeSectionId={activeSectionId ?? plan.sections[0]?.id ?? null}
              onSelectSection={setActiveSection}
            />
            </div>
          </div>

          <div className="container py-1 pb-6 flex flex-col gap-1 lg:flex-row lg:items-start">
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
            onRunRequirements={runRequirementsCheck}
            progressSummary={progressSummary}
            onAskAI={triggerAISuggestions}
            onAnswerChange={updateAnswer}
          />
        </div>
      </div>
        </>
      )}
    </div>
  );
}

