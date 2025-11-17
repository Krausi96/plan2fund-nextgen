// ========= PLAN2FUND — UNIFIED BUSINESS PLAN EDITOR =========
// New scaffold: sidebar navigation + workspace + right panel powered by a local Zustand store.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { create } from 'zustand';
import {
  AncillaryContent,
  AppendixItem,
  BusinessPlan,
  Dataset,
  FundingProgramType,
  KPI,
  MediaAsset,
  ProgramSummary,
  PlanSection as LegacyPlanSection,
  ProductType,
  Question,
  Reference,
  RightPanelView,
  Section,
  TemplateFundingType,
  Table,
  TitlePage
} from '@/features/editor/types/plan';
import { SectionTemplate, getSections } from '@templates';
import { createAIHelper } from '@/features/editor/engine/aiHelper';
import { calculateSectionProgress } from '@/features/editor/hooks/useSectionProgress';
import {
  loadPlanSections,
  savePlanSections,
  loadUserAnswers,
  savePlanConversations,
  loadPlanConversations,
  loadSelectedProgram,
  saveSelectedProgram,
  clearSelectedProgram
} from '@/shared/user/storage/planStore';
import type { PlanSection as StoredPlanSection } from '@/shared/user/storage/planStore';
import SimpleTextEditor from './SimpleTextEditor';
import DataPanel from './InlineTableCreator';
import PreviewPane from './SectionContentRenderer';
import AncillaryEditorPanel from './RequirementsModal';

type ProgressSummary = { id: string; title: string; progress: number };

interface EditorStoreState {
  plan: BusinessPlan | null;
  templates: SectionTemplate[];
  isLoading: boolean;
  error: string | null;
  activeSectionId: string | null;
  activeQuestionId: string | null;
  rightPanelView: RightPanelView;
  progressSummary: ProgressSummary[];
  hydrate: (
    product: ProductType,
    context?: {
      fundingType?: TemplateFundingType;
      programId?: string;
      programName?: string;
      summary?: ProgramSummary;
    }
  ) => Promise<void>;
  setActiveSection: (sectionId: string) => void;
  setActiveQuestion: (questionId: string) => void;
  setRightPanelView: (view: RightPanelView) => void;
  updateAnswer: (questionId: string, content: string) => void;
  addDataset: (sectionId: string, dataset: Dataset) => void;
  addKpi: (sectionId: string, kpi: KPI) => void;
  addMedia: (sectionId: string, asset: MediaAsset) => void;
  attachDatasetToQuestion: (sectionId: string, questionId: string, dataset: Dataset) => void;
  attachKpiToQuestion: (sectionId: string, questionId: string, kpi: KPI) => void;
  attachMediaToQuestion: (sectionId: string, questionId: string, asset: MediaAsset) => void;
  detachQuestionAttachment: (sectionId: string, questionId: string, attachmentId: string) => void;
  updateTitlePage: (titlePage: TitlePage) => void;
  updateAncillary: (updates: Partial<AncillaryContent>) => void;
  addReference: (reference: Reference) => void;
  updateReference: (reference: Reference) => void;
  deleteReference: (referenceId: string) => void;
  addAppendix: (item: AppendixItem) => void;
  updateAppendix: (item: AppendixItem) => void;
  deleteAppendix: (appendixId: string) => void;
  setProductType: (product: ProductType) => void;
  setFundingProgram: (program: FundingProgramType) => void;
  runRequirementsCheck: () => void;
  requestAISuggestions: (sectionId: string, questionId: string) => Promise<void>;
}

const defaultTitlePage = (): TitlePage => ({
  companyName: 'Untitled Company',
  logoUrl: '',
  valueProp: '',
  planTitle: 'Business Plan',
  date: new Date().toISOString().split('T')[0],
  contactInfo: {
    name: '',
    email: '',
    phone: '',
    website: '',
    address: ''
  },
  confidentialityStatement: ''
});

const defaultAncillary = (): AncillaryContent => ({
  tableOfContents: [],
  listOfIllustrations: [],
  listOfTables: [],
  citationStyle: 'apa',
  footnotes: [],
  lastGenerated: undefined
});

const ANCILLARY_SECTION_ID = '__ancillary__';

const PRODUCT_TYPE_OPTIONS: Array<{ value: ProductType; label: string; description: string }> = [
  {
    value: 'submission',
    label: 'Full submission',
    description: 'Grant-ready application with every section completed.'
  },
  {
    value: 'review',
    label: 'Plan review',
    description: 'Upload an existing draft and collect AI/editor feedback.'
  },
  {
    value: 'strategy',
    label: 'Commercial strategy',
    description: 'Market, go-to-market, and traction narratives.'
  }
];

const PANEL_GUIDANCE: Record<
  RightPanelView,
  { kicker: string; description: string; ctaLabel?: string }
> = {
  ai: {
    kicker: 'Inline guidance',
    description:
      'Use the assistant to draft concise answers, propose datasets, or flag compliance gaps for the active question. It references context but never overwrites your text.',
    ctaLabel: 'Ask the assistant'
  },
  data: {
    kicker: 'Data & media',
    description:
      'Attach reusable tables, charts, KPIs, or images. Import CSVs, reuse datasets, and keep numeric stories in sync with your narrative.'
  },
  preview: {
    kicker: 'Structure check',
    description: 'Scan a lightweight preview to verify flow, headings, and media placement before exporting.'
  },
  info: {
    kicker: 'Section guidance',
    description:
      'Surface contextual tips and helper copy so writers know what reviewers expect before they move on.'
  },
  requirements: {
    kicker: 'Compliance',
    description:
      'Run the checker to confirm mandatory sections, KPIs, and length limits are satisfied for the selected funding program.'
  }
};

const SECTION_TONE_HINTS: Record<string, string> = {
  general:
    'Lead with the problem, your innovative solution, and expected impact. Keep it to two or three sentences as suggested in the spec.',
  financial:
    'Highlight revenue, expenses, and cash needs. Consider adding a table or KPI via the Data panel when you reference numbers.',
  innovation:
    'Explain the technology or approach plainly, linking back to datasets or charts if you cite benchmarks.',
  impact:
    'Focus on measurable outcomes and KPIs. Tie qualitative benefits to metrics and reference supporting datasets.',
  consortium:
    'Clarify each partner’s role, governance, and commitment. Use concise paragraphs per the calmer layout guidance.'
};

function mapProgramTypeToFunding(programType?: string): {
  templateFundingType: TemplateFundingType;
  fundingProgramTag: FundingProgramType;
} {
  const normalized = (programType ?? 'grant').toLowerCase();
  if (normalized.includes('loan') || normalized.includes('bank')) {
    return { templateFundingType: 'bankLoans', fundingProgramTag: 'loan' };
  }
  if (normalized.includes('equity') || normalized.includes('investment')) {
    return { templateFundingType: 'equity', fundingProgramTag: 'equity' };
  }
  if (normalized.includes('visa') || normalized.includes('relocation') || normalized.includes('residence')) {
    return { templateFundingType: 'visa', fundingProgramTag: 'visa' };
  }
  return { templateFundingType: 'grants', fundingProgramTag: 'grant' };
}

function normalizeProgramInput(rawInput: string): string | null {
  if (!rawInput) return null;
  const trimmed = rawInput.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('page_')) return trimmed;
  const match = trimmed.match(/(\d{2,})/);
  if (match) {
    return `page_${match[1]}`;
  }
  return null;
}

const useEditorStore = create<EditorStoreState>((set, get) => ({
  plan: null,
  templates: [],
  isLoading: false,
  error: null,
  activeSectionId: null,
  activeQuestionId: null,
  rightPanelView: 'ai',
  progressSummary: [],
  hydrate: async (product, context) => {
    set({ isLoading: true, error: null });
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const fundingType = context?.fundingType ?? 'grants';
      const templates = await getSections(fundingType, product, context?.programId, baseUrl);
      const savedSections: StoredPlanSection[] =
        typeof window !== 'undefined' ? loadPlanSections() : [];
      const sections = templates.map((template) =>
        buildSectionFromTemplate(template, savedSections)
      );

      const plan: BusinessPlan = {
        id: `plan_${Date.now()}`,
        productType: product,
        fundingProgram: context?.summary?.fundingProgramTag ?? 'grant',
        titlePage: defaultTitlePage(),
        sections,
        references: [],
        appendices: [],
        ancillary: defaultAncillary(),
        programSummary: context?.summary,
        metadata: {
          lastSavedAt: new Date().toISOString(),
          programId: context?.programId,
          programName: context?.programName,
          templateFundingType: fundingType
        }
      };

      set({
        plan,
        templates,
        isLoading: false,
        activeSectionId: sections[0]?.id ?? null,
        activeQuestionId: sections[0]?.questions[0]?.id ?? null,
        progressSummary: [],
        rightPanelView: 'ai'
      });
    } catch (error: any) {
      set({
        error: error?.message || 'Failed to load editor',
        isLoading: false
      });
    }
  },
  setActiveSection: (sectionId) => {
    const { plan } = get();
    if (!plan) return;
    if (sectionId === ANCILLARY_SECTION_ID) {
      set({
        activeSectionId: sectionId,
        activeQuestionId: null
      });
      return;
    }
    const section = plan.sections.find((item) => item.id === sectionId);
    set({
      activeSectionId: sectionId,
      activeQuestionId: section?.questions[0]?.id ?? null
    });
  },
  setActiveQuestion: (questionId) => set({ activeQuestionId: questionId }),
  setRightPanelView: (view) => set({ rightPanelView: view }),
  updateAnswer: (questionId, content) => {
    const { plan } = get();
    if (!plan) return;
    const updatedPlan: BusinessPlan = {
      ...plan,
      sections: plan.sections.map((section) => {
        const updatedQuestions = section.questions.map((question) =>
          question.id === questionId ? { ...question, answer: content } : question
        );
        const answeredCount = updatedQuestions.filter(
          (question) => (question.answer ?? '').trim().length > 0
        ).length;
        const progress =
          updatedQuestions.length === 0
            ? 0
            : Math.round((answeredCount / updatedQuestions.length) * 100);
        return {
          ...section,
          questions: updatedQuestions,
          progress
        };
      }),
      metadata: {
        ...plan.metadata,
        lastSavedAt: new Date().toISOString()
      }
    };
    persistPlan(updatedPlan);
    set({ plan: updatedPlan });
  },
  addDataset: (sectionId, dataset) => {
    const { plan } = get();
    if (!plan) return;
    const updatedPlan = updateSection(plan, sectionId, (section) => ({
      ...section,
      datasets: [...(section.datasets ?? []), dataset]
    }));
    persistPlan(updatedPlan);
    set({ plan: updatedPlan });
  },
  addKpi: (sectionId, kpi) => {
    const { plan } = get();
    if (!plan) return;
    const updatedPlan = updateSection(plan, sectionId, (section) => ({
      ...section,
      kpis: [...(section.kpis ?? []), kpi]
    }));
    persistPlan(updatedPlan);
    set({ plan: updatedPlan });
  },
  addMedia: (sectionId, asset) => {
    const { plan } = get();
    if (!plan) return;
    const updatedPlan = updateSection(plan, sectionId, (section) => ({
      ...section,
      media: [...(section.media ?? []), asset]
    }));
    persistPlan(updatedPlan);
    set({ plan: updatedPlan });
  },
  attachDatasetToQuestion: (sectionId, questionId, dataset) => {
    const asset: MediaAsset = {
      id: `dataset_attachment_${dataset.id}_${Date.now()}`,
      type: 'table',
      title: dataset.name,
      description: dataset.description,
      datasetId: dataset.id,
      tags: dataset.tags,
      attachedQuestionId: questionId
    };
    attachAssetToQuestion(set, get, sectionId, questionId, asset);
  },
  attachKpiToQuestion: (sectionId, questionId, kpi) => {
    const asset: MediaAsset = {
      id: `kpi_attachment_${kpi.id}_${Date.now()}`,
      type: 'kpi',
      title: kpi.name,
      description: kpi.description,
      datasetId: kpi.datasetId,
      tags: kpi.unit ? [kpi.unit] : undefined,
      attachedQuestionId: questionId
    };
    attachAssetToQuestion(set, get, sectionId, questionId, asset);
  },
  attachMediaToQuestion: (sectionId, questionId, asset) => {
    attachAssetToQuestion(set, get, sectionId, questionId, {
      ...asset,
      id: `${asset.id}_attached_${Date.now()}`,
      attachedQuestionId: questionId
    });
  },
  detachQuestionAttachment: (sectionId, questionId, attachmentId) => {
    const { plan } = get();
    if (!plan) return;
    const updatedPlan = updateSection(plan, sectionId, (section) => ({
      ...section,
      questions: section.questions.map((question) =>
        question.id === questionId
          ? {
              ...question,
              attachments: (question.attachments ?? []).filter(
                (attachment) => attachment.id !== attachmentId
              )
            }
          : question
      )
    }));
    set({ plan: updatedPlan });
  },
  updateTitlePage: (titlePage) => {
    const { plan } = get();
    if (!plan) return;
    const updatedPlan = { ...plan, titlePage };
    set({ plan: updatedPlan });
  },
  updateAncillary: (updates) => {
    const { plan } = get();
    if (!plan) return;
    const updatedPlan = {
      ...plan,
      ancillary: { ...plan.ancillary, ...updates }
    };
    set({ plan: updatedPlan });
  },
  addReference: (reference) => {
    const { plan } = get();
    if (!plan) return;
    set({ plan: { ...plan, references: [...plan.references, reference] } });
  },
  updateReference: (reference) => {
    const { plan } = get();
    if (!plan) return;
    set({
      plan: {
        ...plan,
        references: plan.references.map((ref) =>
          ref.id === reference.id ? reference : ref
        )
      }
    });
  },
  deleteReference: (referenceId) => {
    const { plan } = get();
    if (!plan) return;
    set({
      plan: {
        ...plan,
        references: plan.references.filter((ref) => ref.id !== referenceId)
      }
    });
  },
  addAppendix: (item) => {
    const { plan } = get();
    if (!plan) return;
    set({
      plan: {
        ...plan,
        appendices: [...(plan.appendices ?? []), item]
      }
    });
  },
  updateAppendix: (item) => {
    const { plan } = get();
    if (!plan) return;
    set({
      plan: {
        ...plan,
        appendices: (plan.appendices ?? []).map((existing) =>
          existing.id === item.id ? item : existing
        )
      }
    });
  },
  deleteAppendix: (appendixId) => {
    const { plan } = get();
    if (!plan) return;
    set({
      plan: {
        ...plan,
        appendices: (plan.appendices ?? []).filter((appendix) => appendix.id !== appendixId)
      }
    });
  },
  setProductType: (product) => {
    const { plan } = get();
    if (!plan) return;
    set({ plan: { ...plan, productType: product } });
  },
  setFundingProgram: (program) => {
    const { plan } = get();
    if (!plan) return;
    set({ plan: { ...plan, fundingProgram: program } });
  },
  runRequirementsCheck: () => {
    const { plan } = get();
    if (!plan) return;
    const legacySections = convertPlanToLegacySections(plan);
    const summary = legacySections.map((section) => {
      const progress = calculateSectionProgress(section);
      return {
        id: section.key,
        title: section.title,
        progress: progress.completionPercentage
      };
    });
    set({ progressSummary: summary, rightPanelView: 'requirements' });
  },
  requestAISuggestions: async (sectionId, questionId) => {
    const { plan, templates } = get();
    if (!plan) return;
    const section = plan.sections.find((item) => item.id === sectionId);
    if (!section) return;
    const question = section.questions.find((item) => item.id === questionId);
    if (!question) return;

    const conversations = loadPlanConversations();
    const conversationHistory = conversations[sectionId] || [];
    const template = templates.find((item) => item.id === sectionId);

    try {
      const aiHelper = createAIHelper({
        maxWords: 400,
        sectionScope: section.title,
        programHints: {},
        userAnswers: loadUserAnswers(),
        tone: 'neutral',
        language: 'en'
      });

      const response = await aiHelper.generateSectionContent(
        section.title,
        template?.prompts?.join('\n') ?? section.description ?? '',
        {
          id: plan.metadata?.ownerId ?? 'default',
          name: plan.fundingProgram ?? 'Grant',
          type: plan.fundingProgram ?? 'grant',
          amount: '',
          eligibility: [],
          requirements: [],
          score: 100,
          reasons: [],
          risks: []
        },
        conversationHistory
      );

      if (response.content) {
        const userTurn = {
          id: `msg_${Date.now()}`,
          role: 'assistant' as const,
          content: response.content,
          timestamp: new Date().toISOString()
        };
        savePlanConversations(sectionId, [...conversationHistory, userTurn]);

        const updatedPlan = updateSection(plan, sectionId, (currentSection) => ({
          ...currentSection,
          questions: currentSection.questions.map((item) =>
            item.id === questionId
              ? {
                  ...item,
                  suggestions: [response.content],
                  aiContext: { lastSuggestion: response.content, updatedAt: new Date().toISOString() }
                }
              : item
          )
        }));
        set({ plan: updatedPlan });
      }
    } catch (aiError) {
      console.error('AI suggestion failed', aiError);
    }
  }
}));

function attachAssetToQuestion(
  set: (partial: Partial<EditorStoreState>) => void,
  get: () => EditorStoreState,
  sectionId: string,
  questionId: string,
  asset: MediaAsset
) {
  const { plan } = get();
  if (!plan) return;
  const updatedPlan = updateSection(plan, sectionId, (section) => ({
    ...section,
    questions: section.questions.map((question) =>
      question.id === questionId
        ? {
            ...question,
            attachments: [...(question.attachments ?? []), asset]
          }
        : question
    )
  }));
  set({ plan: updatedPlan });
}

function buildSectionFromTemplate(
  template: SectionTemplate,
  savedSections: StoredPlanSection[]
): Section {
  const saved = savedSections.find((section) => section.id === template.id);
  const datasets = convertLegacyTablesToDatasets(saved?.tables);
  const questions = buildQuestionsFromTemplate(template, saved?.content ?? '');
  return {
    id: template.id,
    title: template.title,
    description: template.description || template.prompts?.[0] || '',
    questions,
    datasets,
    kpis: [],
    media: (saved?.figures as MediaAsset[]) || [],
    collapsed: false,
    category: template.category,
    progress: questions.every((question) => (question.answer ?? '').trim().length > 0)
      ? 100
      : 0
  };
}

function convertLegacyTablesToDatasets(tables?: Record<string, Table | undefined>): Dataset[] {
  if (!tables) return [];
  return Object.entries(tables)
    .filter((entry): entry is [string, Table] => Boolean(entry[1]))
    .map(([key, table]) => {
      const columns = [
        { name: 'Item', type: 'string' as const },
        ...table.columns.map((column) => ({ name: column, type: 'number' as const }))
      ];
      const rows = table.rows.map((row) => {
        const record: Record<string, string | number> = { Item: row.label };
        row.values.forEach((value, index) => {
          record[table.columns[index]] = value;
        });
        return record;
      });
      return {
        id: `${key}_${Date.now() + Math.random()}`,
        name: key,
        description: '',
        columns,
        rows,
        tags: []
      };
    });
}

function convertDatasetsToTables(datasets?: Dataset[]): Record<string, Table> | undefined {
  if (!datasets || datasets.length === 0) return undefined;
  const tables: Record<string, Table> = {};
  datasets.forEach((dataset) => {
    const nonLabelColumns = dataset.columns.filter((column) => column.name !== 'Item');
    const rows = dataset.rows.map((row, idx) => ({
      label: (row.Item as string) || `Row ${idx + 1}`,
      values: nonLabelColumns.map((column) => {
        const value = row[column.name];
        return typeof value === 'number' ? value : (typeof value === 'string' ? value : '');
      })
    }));
    tables[dataset.name] = {
      columns: nonLabelColumns.map((column) => column.name),
      rows
    };
  });
  return Object.keys(tables).length ? tables : undefined;
}

function convertPlanToLegacySections(plan: BusinessPlan): LegacyPlanSection[] {
  return plan.sections.map((section) => ({
    key: section.id,
    title: section.title,
    content: section.questions[0]?.answer ?? '',
    tables: convertDatasetsToTables(section.datasets),
    figures: section.media
  }));
}

function buildQuestionsFromTemplate(template: SectionTemplate, savedAnswer: string): Question[] {
  const requiredAssets = deriveRequiredAssets(template.validationRules?.requiredFields ?? []);
  const seeds =
    template.questions && template.questions.length > 0
      ? template.questions.map((question) => ({
          prompt: question.text,
          helperText: question.hint,
          placeholder: question.placeholder,
          required: question.required
        }))
      : (template.prompts?.length
          ? template.prompts.map((prompt) => ({
              prompt,
              helperText: template.description,
              placeholder: 'Provide details',
              required: true
            }))
          : [
              {
                prompt: template.title,
                helperText: template.description,
                placeholder: 'Provide details',
                required: true
              }
            ]);

  return seeds.map((seed, index) => ({
    id: `${template.id}_q${index + 1}`,
    prompt: seed.prompt,
    helperText: seed.helperText,
    placeholder: seed.placeholder,
    required: seed.required,
    answer: index === 0 ? savedAnswer : '',
    suggestions: [],
    warnings: [],
    requiredAssets
  }));
}

function deriveRequiredAssets(requiredFields: string[]): Array<MediaAsset['type']> {
  const hints: Array<MediaAsset['type']> = [];
  const tableFields = [
    'budget_breakdown',
    'funding_request',
    'co_financing',
    'cost_justification',
    'timeline',
    'milestones',
    'partner_list',
    'roles',
    'team_members'
  ];
  const chartFields = ['market_trends', 'revenue_assumptions', 'cost_assumptions', 'financial_projection'];
  const kpiFields = ['kpi_summary', 'expected_impact', 'impact_kpis'];

  if (requiredFields.some((field) => tableFields.includes(field))) {
    hints.push('table');
  }
  if (requiredFields.some((field) => chartFields.includes(field))) {
    hints.push('chart');
  }
  if (requiredFields.some((field) => kpiFields.includes(field))) {
    hints.push('kpi');
  }
  return Array.from(new Set(hints));
}

function persistPlan(plan: BusinessPlan) {
  const legacySections = convertPlanToLegacySections(plan);
  savePlanSections(
    legacySections.map((section) => ({
      id: section.key,
      title: section.title,
      content: section.content,
      tables: section.tables,
      figures: section.figures
    }))
  );
}

function updateSection(plan: BusinessPlan, sectionId: string, updater: (section: Section) => Section): BusinessPlan {
  return {
    ...plan,
    sections: plan.sections.map((section) =>
      section.id === sectionId ? updater(section) : section
    )
  };
}

interface EditorProps {
  product?: ProductType;
}

export default function Editor({ product = 'submission' }: EditorProps) {
  const router = useRouter();
  const {
    plan,
    isLoading,
    error,
    hydrate,
    activeSectionId,
    activeQuestionId,
    setActiveSection,
    setActiveQuestion,
    updateAnswer,
    rightPanelView,
    setRightPanelView,
    addDataset,
    addKpi,
    addMedia,
    attachDatasetToQuestion,
    attachKpiToQuestion,
    attachMediaToQuestion,
    detachQuestionAttachment,
    updateTitlePage,
    updateAncillary,
    addReference,
    updateReference,
    deleteReference,
    addAppendix,
    updateAppendix,
    deleteAppendix,
    setProductType,
    progressSummary,
    runRequirementsCheck,
    requestAISuggestions
  } = useEditorStore();
  const [selectedProduct, setSelectedProduct] = useState<ProductType>(product);
  const [programId, setProgramId] = useState<string | null>(null);
  const [programSummary, setProgramSummary] = useState<ProgramSummary | null>(null);
  const [programLoading, setProgramLoading] = useState(false);
  const [programError, setProgramError] = useState<string | null>(null);
  const storedProgramChecked = useRef(false);

  const applyHydration = useCallback(
    (summary: ProgramSummary | null) => {
      const fundingType = summary?.fundingType ?? 'grants';
      hydrate(selectedProduct, {
        fundingType,
        programId: summary?.id,
        programName: summary?.name,
        summary: summary ?? undefined
      });
    },
    [hydrate, selectedProduct]
  );
  useEffect(() => {
    setSelectedProduct(product);
  }, [product]);

  const handleProductChange = useCallback(
    (next: ProductType) => {
      setSelectedProduct(next);
      setProductType(next);
    },
    [setProductType]
  );


  useEffect(() => {
    applyHydration(programSummary);
  }, [applyHydration, programSummary]);

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
    } catch (error) {
      setProgramSummary(null);
      setProgramError(error instanceof Error ? error.message : 'Failed to load program metadata.');
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
          const { programId: _omit, ...rest } = router.query;
          router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
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

  const isAncillaryView = activeSectionId === ANCILLARY_SECTION_ID;
  const activeSection = useMemo(() => {
    if (!plan || isAncillaryView) return null;
    return plan.sections.find((section) => section.id === activeSectionId) ?? plan.sections[0] ?? null;
  }, [plan, activeSectionId, isAncillaryView]);
  const activeQuestion = useMemo(() => {
    if (!activeSection) return null;
    return (
      activeSection.questions.find((question) => question.id === activeQuestionId) ??
      activeSection.questions[0] ??
      null
    );
  }, [activeSection, activeQuestionId]);

  const sectionIndex =
    plan?.sections.findIndex((section) => section.id === activeSection?.id) ?? -1;
  const previousSectionId =
    plan && sectionIndex > 0 ? plan.sections[sectionIndex - 1]?.id ?? null : null;
  const nextSectionId =
    plan && sectionIndex >= 0 && sectionIndex < plan.sections.length - 1
      ? plan.sections[sectionIndex + 1]?.id ?? null
      : null;

  const triggerAISuggestions = (questionId?: string) => {
    if (!activeSection) return;
    const targetQuestionId = questionId ?? activeQuestion?.id;
    if (!targetQuestionId) return;
    requestAISuggestions(activeSection.id, targetQuestionId);
    setRightPanelView('ai');
  };

  if (isLoading || !plan) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Loading editor...
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-6">
          <PlanConfigurator
            plan={plan}
            programSummary={programSummary ?? plan.programSummary ?? null}
            onChangeProduct={handleProductChange}
            onConnectProgram={handleConnectProgram}
            onOpenProgramFinder={() => router.push('/reco')}
            programLoading={programLoading}
            programError={programError}
          />
          <SectionStepper
            plan={plan}
            activeSectionId={activeSectionId ?? plan.sections[0]?.id ?? null}
            onSelectSection={setActiveSection}
          />
        </div>
      </header>
      <div className="flex flex-1">
        <div className="flex-1">
          {isAncillaryView ? (
            <AncillaryWorkspace
              plan={plan}
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
          ) : (
            <SectionWorkspace
              section={activeSection ?? plan.sections[0]}
              onAnswerChange={updateAnswer}
              onSelectQuestion={setActiveQuestion}
              activeQuestionId={activeQuestion?.id ?? null}
              onNavigateSection={(targetId) => targetId && setActiveSection(targetId)}
              previousSectionId={previousSectionId}
              nextSectionId={nextSectionId}
              onAskAI={triggerAISuggestions}
              onDetachAttachment={(questionId, attachmentId) =>
                activeSection && detachQuestionAttachment(activeSection.id, questionId, attachmentId)
              }
              onPromptAssetRequest={() => setRightPanelView('data')}
            />
          )}
        </div>
        <RightPanel
          view={rightPanelView}
          setView={setRightPanelView}
          section={activeSection ?? (isAncillaryView ? undefined : plan.sections[0])}
          question={activeQuestion ?? undefined}
          plan={plan}
          onDatasetCreate={(dataset) => activeSection && addDataset(activeSection.id, dataset)}
          onKpiCreate={(kpi) => activeSection && addKpi(activeSection.id, kpi)}
          onMediaCreate={(asset) => activeSection && addMedia(activeSection.id, asset)}
          onAttachDataset={(dataset) =>
            activeSection &&
            activeQuestion &&
            attachDatasetToQuestion(activeSection.id, activeQuestion.id, dataset)
          }
          onAttachKpi={(kpi) =>
            activeSection &&
            activeQuestion &&
            attachKpiToQuestion(activeSection.id, activeQuestion.id, kpi)
          }
          onAttachMedia={(asset) =>
            activeSection &&
            activeQuestion &&
            attachMediaToQuestion(activeSection.id, activeQuestion.id, asset)
          }
          onRunRequirements={runRequirementsCheck}
          progressSummary={progressSummary}
          onAskAI={triggerAISuggestions}
        />
      </div>
    </div>
  );
}

function PlanConfigurator({
  plan,
  programSummary,
  onChangeProduct,
  onConnectProgram,
  onOpenProgramFinder,
  programLoading,
  programError
}: {
  plan: BusinessPlan;
  programSummary: ProgramSummary | null;
  onChangeProduct: (product: ProductType) => void;
  onConnectProgram: (value: string | null) => void;
  onOpenProgramFinder: () => void;
  programLoading: boolean;
  programError: string | null;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Plan title</p>
        <p className="text-lg font-semibold text-slate-900">{plan.titlePage.planTitle || 'Business Plan'}</p>
        <p className="text-xs text-slate-500">Align the workflow before editing.</p>
      </div>
      <label className="space-y-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">Product type</span>
        <div className="relative">
          <select
            value={plan.productType ?? 'submission'}
            onChange={(event) => onChangeProduct(event.target.value as ProductType)}
            className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            {PRODUCT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">▾</span>
        </div>
        <p className="text-[11px] text-slate-500">
          {PRODUCT_TYPE_OPTIONS.find((option) => option.value === plan.productType)?.description}
        </p>
      </label>
      <ProgramConnectionCard
        programSummary={programSummary}
        onConnectProgram={onConnectProgram}
        onOpenProgramFinder={onOpenProgramFinder}
        loading={programLoading}
        error={programError}
      />
    </div>
  );
}

function ProgramConnectionCard({
  programSummary,
  onConnectProgram,
  onOpenProgramFinder,
  loading,
  error
}: {
  programSummary: ProgramSummary | null;
  onConnectProgram: (value: string | null) => void;
  onOpenProgramFinder: () => void;
  loading: boolean;
  error: string | null;
}) {
  const [inputValue, setInputValue] = useState('');
  useEffect(() => {
    if (programSummary) {
      setInputValue('');
    }
  }, [programSummary]);

  if (programSummary) {
    return (
      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 space-y-2 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-blue-900">{programSummary.name}</p>
            <p className="text-xs text-blue-700">
              {programSummary.amountRange ?? 'Amount not specified'}
              {programSummary.deadline ? ` • Deadline ${programSummary.deadline}` : ''}
            </p>
            {programSummary.region && (
              <p className="text-[11px] text-blue-700/80">Region: {programSummary.region}</p>
            )}
          </div>
          <button
            onClick={() => onConnectProgram(null)}
            className="text-xs text-blue-700 hover:text-blue-900 underline"
          >
            Disconnect
          </button>
        </div>
        <p className="text-[11px] text-blue-700/80">
          Funding type: {programSummary.fundingType} • Mode: {programSummary.fundingProgramTag}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-gray-300 p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-gray-800">No program connected</p>
        <p className="text-xs text-gray-500">
          Paste a program ID (e.g., page_123) or open Program Finder to import a call.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder="Program ID or URL containing it"
          className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm"
        />
        <button
          onClick={() => onConnectProgram(inputValue)}
          disabled={loading}
          className="px-4 py-2 text-sm font-semibold rounded-md bg-blue-600 text-white disabled:opacity-50"
        >
          {loading ? 'Connecting…' : 'Connect'}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        type="button"
        onClick={onOpenProgramFinder}
        className="text-xs text-blue-600 hover:text-blue-800 underline"
      >
        Open Program Finder
      </button>
    </div>
  );
}

function SectionStepper({
  plan,
  activeSectionId,
  onSelectSection
}: {
  plan: BusinessPlan;
  activeSectionId: string | null;
  onSelectSection: (sectionId: string) => void;
}) {
  const sections = [
    ...plan.sections,
    {
      id: ANCILLARY_SECTION_ID,
      title: 'Front & back matter',
      progress: undefined,
      questions: []
    }
  ];

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-1">
      {sections.map((section, index) => {
        const totalQuestions = section.questions.length;
        const answeredQuestions = section.questions.filter(
          (question) => (question.answer ?? '').trim().length > 0
        ).length;
        const completion =
          section.progress ??
          (totalQuestions === 0 ? 0 : Math.round((answeredQuestions / totalQuestions) * 100));
        const isAncillary = section.id === ANCILLARY_SECTION_ID;

        return (
          <button
            key={section.id}
            onClick={() => onSelectSection(section.id)}
            className={`flex-shrink-0 rounded-2xl border px-4 py-3 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-200 ${
              section.id === activeSectionId
                ? 'border-blue-500 bg-blue-50 text-blue-800'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
              {isAncillary ? 'Ancillary' : `Step ${String(index + 1).padStart(2, '0')}`}
            </div>
            <div className="text-sm font-semibold">{section.title}</div>
            {!isAncillary && (
              <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${
                    completion === 100 ? 'bg-emerald-500' : completion > 0 ? 'bg-blue-500' : 'bg-slate-200'
                  }`}
                  style={{ width: `${completion}%` }}
                />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function getSectionHint(section?: Section) {
  if (!section) return '';
  const key = (section.category ?? '').toLowerCase();
  return SECTION_TONE_HINTS[key] ?? 'Keep paragraphs tight, highlight the why, and point to data or KPIs when possible.';
}

function AncillaryWorkspace({
  plan,
  onTitlePageChange,
  onAncillaryChange,
  onReferenceAdd,
  onReferenceUpdate,
  onReferenceDelete,
  onAppendixAdd,
  onAppendixUpdate,
  onAppendixDelete,
  onRunRequirements,
  progressSummary
}: {
  plan: BusinessPlan;
  onTitlePageChange: (titlePage: TitlePage) => void;
  onAncillaryChange: (updates: Partial<AncillaryContent>) => void;
  onReferenceAdd: (reference: Reference) => void;
  onReferenceUpdate: (reference: Reference) => void;
  onReferenceDelete: (referenceId: string) => void;
  onAppendixAdd: (item: AppendixItem) => void;
  onAppendixUpdate: (item: AppendixItem) => void;
  onAppendixDelete: (appendixId: string) => void;
  onRunRequirements: () => void;
  progressSummary: ProgressSummary[];
}) {
  return (
    <main className="flex flex-col h-screen bg-gradient-to-b from-[#f6f9ff] to-white">
      <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-50 to-white px-6 sm:px-10 lg:px-14 py-6 border-b border-slate-200/70">
        <p className="text-[11px] tracking-[0.4em] uppercase text-slate-500">Ancillary</p>
        <h1 className="text-2xl font-semibold text-slate-900">Front & back matter</h1>
        <p className="text-sm text-slate-600 max-w-3xl mt-1">
          Maintain the title page, table of contents, lists of figures tables, references, and appendices in one place.
          This mirrors the spec’s guidance that ancillary pieces bookend the narrative.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-14 py-8">
        <div className="max-w-5xl mx-auto">
          <AncillaryEditorPanel
            titlePage={plan.titlePage}
            ancillary={plan.ancillary}
            references={plan.references}
            appendices={plan.appendices ?? []}
            onTitlePageChange={onTitlePageChange}
            onAncillaryChange={onAncillaryChange}
            onReferenceAdd={onReferenceAdd}
            onReferenceUpdate={onReferenceUpdate}
            onReferenceDelete={onReferenceDelete}
            onAppendixAdd={onAppendixAdd}
            onAppendixUpdate={onAppendixUpdate}
            onAppendixDelete={onAppendixDelete}
            onRunRequirementsCheck={onRunRequirements}
            progressSummary={progressSummary}
          />
        </div>
      </div>
    </main>
  );
}

function SectionWorkspace({
  section,
  onAnswerChange,
  onSelectQuestion,
  activeQuestionId,
  onNavigateSection,
  previousSectionId,
  nextSectionId,
  onAskAI,
  onDetachAttachment,
  onPromptAssetRequest
}: {
  section?: Section;
  onAnswerChange: (questionId: string, content: string) => void;
  onSelectQuestion: (questionId: string) => void;
  activeQuestionId: string | null;
  onNavigateSection: (targetId: string | null) => void;
  previousSectionId: string | null;
  nextSectionId: string | null;
  onAskAI: (questionId?: string) => void;
  onDetachAttachment: (questionId: string, attachmentId: string) => void;
  onPromptAssetRequest: () => void;
}) {
  if (!section) {
    return (
      <main className="flex flex-col h-screen bg-slate-50">
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
          Select a section to begin.
        </div>
      </main>
    );
  }

  const sectionHint = getSectionHint(section);

  const totalQuestions = section.questions.length;
  const answeredQuestions = section.questions.filter(
    (question) => (question.answer ?? '').trim().length > 0
  ).length;

  return (
    <main className="flex flex-col h-screen bg-gradient-to-b from-[#f3f8ff] via-white to-white">
      <div className="flex-1 overflow-y-auto px-6 lg:px-12 py-9 space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[11px] tracking-[0.2em] uppercase text-slate-400">{section.category}</p>
              <h1 className="text-3xl font-semibold text-slate-900 leading-tight">{section.title}</h1>
              {(sectionHint || section.description) && (
                <p className="text-sm text-slate-500">{sectionHint || section.description}</p>
              )}
            </div>
            <div className="text-xs text-slate-500 text-right">
              <p className="font-semibold text-slate-700">Completion</p>
              <p>
                {answeredQuestions}/{totalQuestions} questions • {section.progress ?? 0}%
              </p>
            </div>
          </div>
        </div>
        {section.questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            position={index + 1}
            question={question}
            isActive={question.id === activeQuestionId}
            onFocus={() => onSelectQuestion(question.id)}
            onChange={(content) => onAnswerChange(question.id, content)}
            onDetachAttachment={onDetachAttachment}
            onPromptAssetRequest={onPromptAssetRequest}
            onAskAI={() => onAskAI(question.id)}
          />
        ))}
      </div>

      <div className="sticky bottom-0 bg-slate-50/95 backdrop-blur border-t border-slate-200 px-6 lg:px-12 py-4 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          Progress • {section.progress ?? 0}% complete
        </span>
        <div className="flex items-center gap-2">
          <NavigationButton
            label="Previous"
            variant="ghost"
            disabled={!previousSectionId}
            onClick={() => onNavigateSection(previousSectionId)}
          />
          <NavigationButton
            label="Next section"
            variant="primary"
            disabled={!nextSectionId}
            onClick={() => onNavigateSection(nextSectionId)}
          />
        </div>
      </div>
    </main>
  );
}

function QuestionCard({
  question,
  position,
  isActive,
  onFocus,
  onChange,
  onDetachAttachment,
  onPromptAssetRequest,
  onAskAI
}: {
  question: Question;
  position: number;
  isActive: boolean;
  onFocus: () => void;
  onChange: (content: string) => void;
  onDetachAttachment: (questionId: string, attachmentId: string) => void;
  onPromptAssetRequest: () => void;
  onAskAI: () => void;
}) {
  return (
    <div
      className={`border rounded-2xl p-6 bg-white shadow-sm transition ${
        isActive ? 'border-blue-500 shadow-lg ring-1 ring-blue-100' : 'border-slate-200'
      }`}
      onClick={onFocus}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold tracking-wider text-slate-400">
              Q{position.toString().padStart(2, '0')}
            </span>
            {question.required && (
              <span className="text-[10px] uppercase tracking-widest text-red-500">Required</span>
            )}
          </div>
          <p className="text-base font-semibold text-slate-900">{question.prompt}</p>
        </div>
      </div>

      <SimpleTextEditor
        content={question.answer ?? ''}
        onChange={onChange}
        placeholder={question.placeholder}
      />
      {question.helperText && (
        <p className="mt-2 text-xs text-slate-500">{question.helperText}</p>
      )}

      {isActive && (
        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 space-y-2 text-xs text-slate-600">
          <p className="text-sm font-semibold text-slate-700">Need a nudge?</p>
          <p>Ask the assistant for a draft or jump to the Data tab when numbers belong in tables, charts, or KPIs.</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onAskAI();
              }}
              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-500"
            >
              Ask AI for this prompt
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onPromptAssetRequest();
              }}
              className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold text-xs hover:border-slate-300 hover:text-slate-900"
            >
              Open data & media panel
            </button>
          </div>
        </div>
      )}

      {question.attachments && question.attachments.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-2">
            Attachments
          </p>
          <div className="space-y-2">
            {question.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700"
              >
                <div>
                  <p className="font-medium">
                    {attachment.title}{' '}
                    <span className="text-xs uppercase text-slate-400">({attachment.type})</span>
                  </p>
                  {(attachment.caption || attachment.description) && (
                    <p className="text-xs text-slate-500">
                      {attachment.caption ?? attachment.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onDetachAttachment(question.id, attachment.id);
                  }}
                  className="text-xs text-red-500"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {question.suggestions && question.suggestions.length > 0 && (
        <div className="mt-4 border border-blue-100 bg-blue-50 text-sm text-blue-700 rounded-lg p-3 space-y-2">
          <p className="font-semibold">AI suggestion</p>
          {question.suggestions.map((suggestion: string, index: number) => (
            <p key={`${question.id}_suggestion_${index}`}>{suggestion}</p>
          ))}
        </div>
      )}
      {question.warnings && question.warnings.length > 0 && (
        <div className="mt-3 border border-amber-200 bg-amber-50 text-sm text-amber-800 rounded-lg p-3 space-y-1">
          {question.warnings.map((warning, index) => (
            <p key={`${question.id}_warning_${index}`}>{warning}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function NavigationButton({
  label,
  onClick,
  disabled,
  variant = 'outline'
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'outline' | 'ghost' | 'primary';
}) {
  const baseClasses =
    'px-4 py-2 rounded-full text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-1';
  const variants: Record<'outline' | 'ghost' | 'primary', string> = {
    outline:
      'border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900 bg-white',
    ghost: 'text-slate-500 hover:text-slate-900',
    primary: 'bg-blue-600 text-white hover:bg-blue-500'
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {label}
    </button>
  );
}

function RightPanel({
  view,
  setView,
  section,
  question,
  plan,
  onDatasetCreate,
  onKpiCreate,
  onMediaCreate,
  onAttachDataset,
  onAttachKpi,
  onAttachMedia,
  onRunRequirements,
  progressSummary,
  onAskAI
}: {
  view: RightPanelView;
  setView: (view: RightPanelView) => void;
  section?: Section;
  question?: Question;
  plan: BusinessPlan;
  onDatasetCreate: (dataset: Dataset) => void;
  onKpiCreate: (kpi: KPI) => void;
  onMediaCreate: (asset: MediaAsset) => void;
  onAttachDataset: (dataset: Dataset) => void;
  onAttachKpi: (kpi: KPI) => void;
  onAttachMedia: (asset: MediaAsset) => void;
  onRunRequirements: () => void;
  progressSummary: ProgressSummary[];
  onAskAI: (questionId?: string) => void;
}) {
  const panelMeta = PANEL_GUIDANCE[view];
  return (
    <aside className="border-l border-gray-200 bg-white flex flex-col">
      <div className="grid grid-cols-4 border-b border-gray-200 text-xs font-semibold text-gray-500">
        {(['ai', 'data', 'preview', 'requirements'] as RightPanelView[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setView(tab)}
              className={`py-3 ${
                view === tab ? 'text-blue-600 border-b-2 border-blue-600' : ''
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
      </div>
      {panelMeta && (
        <div className="px-4 py-3 border-b border-gray-100 bg-slate-50 space-y-2">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">{panelMeta.kicker}</p>
          <p className="text-xs text-slate-600 leading-relaxed">{panelMeta.description}</p>
          {panelMeta.ctaLabel && view === 'ai' && (
            <button
              onClick={() => onAskAI(question?.id)}
              disabled={!question}
              className={`w-full text-xs font-semibold px-3 py-2 rounded-lg ${
                question
                  ? 'bg-blue-600 text-white hover:bg-blue-500'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {panelMeta.ctaLabel} {question ? '' : '(select a question)'}
            </button>
          )}
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        {view === 'ai' && question && (
          <div className="p-4 space-y-3 text-sm text-gray-600">
            <p className="text-xs uppercase text-gray-400">Current question</p>
            <p className="font-semibold">{question?.prompt}</p>
            {question?.answer ? (
              <p className="text-gray-500">{question.answer.substring(0, 200)}...</p>
            ) : (
              <p className="text-gray-400">
                Start typing to provide context—the assistant draws on previous answers, datasets, and program requirements.
              </p>
            )}
            <ul className="text-xs text-slate-500 list-disc list-inside space-y-1">
              <li>Summaries should cover the problem, solution, and expected impact.</li>
              <li>When numbers appear, open the Data tab to insert tables, charts, or KPIs.</li>
            </ul>
            {question?.suggestions?.map((suggestion: string, index: number) => (
              <div key={index} className="border border-blue-100 bg-blue-50 rounded-lg p-3 text-blue-700">
                {suggestion}
              </div>
            ))}
            {!question?.suggestions?.length && (
              <p className="text-xs text-gray-400">
                Ask the assistant for a draft or dataset suggestion, then refine it in the editor.
              </p>
            )}
          </div>
        )}
        {view === 'ai' && !question && (
          <div className="p-4 text-xs text-gray-500">
            Select a question to receive AI suggestions.
          </div>
        )}
        {view === 'data' && section && (
          <DataPanel
            datasets={section.datasets ?? []}
            kpis={section.kpis ?? []}
            media={section.media ?? []}
            onDatasetCreate={onDatasetCreate}
            onKpiCreate={onKpiCreate}
            onMediaCreate={onMediaCreate}
            activeQuestionId={question?.id}
            onAttachDataset={onAttachDataset}
            onAttachKpi={onAttachKpi}
            onAttachMedia={onAttachMedia}
          />
        )}
        {view === 'data' && !section && (
          <div className="p-4 text-xs text-gray-500">
            Choose a section to manage datasets, KPIs, and media.
          </div>
        )}
        {view === 'preview' && (
          <PreviewPane plan={plan} focusSectionId={section?.id} />
        )}
        {view === 'requirements' && (
          <div className="p-4 space-y-3 text-sm">
            <button
              onClick={onRunRequirements}
              className="px-3 py-1 text-xs font-semibold bg-blue-600 text-white rounded-md"
            >
              Refresh checker
            </button>
            {progressSummary.length === 0 && (
              <p className="text-gray-500 text-xs">Run the checker to view status.</p>
            )}
            {progressSummary.map((item) => (
              <div key={item.id}>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>{item.title}</span>
                  <span>{item.progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

