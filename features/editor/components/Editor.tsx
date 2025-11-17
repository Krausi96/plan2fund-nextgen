// ========= PLAN2FUND — UNIFIED BUSINESS PLAN EDITOR =========
// New scaffold: sidebar navigation + workspace + right panel powered by a local Zustand store.

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { create } from 'zustand';
import {
  AncillaryContent,
  BusinessPlan,
  Dataset,
  FundingProgramType,
  KPI,
  MediaAsset,
  PlanSection as LegacyPlanSection,
  ProductType,
  Question,
  Reference,
  RightPanelView,
  Section,
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
  loadPlanConversations
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
  hydrate: (product: ProductType) => Promise<void>;
  setActiveSection: (sectionId: string) => void;
  setActiveQuestion: (questionId: string) => void;
  setRightPanelView: (view: RightPanelView) => void;
  updateAnswer: (questionId: string, content: string) => void;
  addDataset: (sectionId: string, dataset: Dataset) => void;
  addKpi: (sectionId: string, kpi: KPI) => void;
  addMedia: (sectionId: string, asset: MediaAsset) => void;
  updateTitlePage: (titlePage: TitlePage) => void;
  updateAncillary: (updates: Partial<AncillaryContent>) => void;
  addReference: (reference: Reference) => void;
  updateReference: (reference: Reference) => void;
  deleteReference: (referenceId: string) => void;
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

const useEditorStore = create<EditorStoreState>((set, get) => ({
  plan: null,
  templates: [],
  isLoading: false,
  error: null,
  activeSectionId: null,
  activeQuestionId: null,
  rightPanelView: 'ai',
  progressSummary: [],
  hydrate: async (product) => {
    set({ isLoading: true, error: null });
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const templates = await getSections('grants', product, undefined, baseUrl);
      const savedSections: StoredPlanSection[] =
        typeof window !== 'undefined' ? loadPlanSections() : [];
      const sections = templates.map((template) =>
        buildSectionFromTemplate(template, savedSections)
      );

      const plan: BusinessPlan = {
        id: `plan_${Date.now()}`,
        productType: product,
        fundingProgram: 'grant',
        titlePage: defaultTitlePage(),
        sections,
        references: [],
        appendices: [],
        ancillary: defaultAncillary(),
        metadata: {
          lastSavedAt: new Date().toISOString()
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
      sections: plan.sections.map((section) => ({
        ...section,
        questions: section.questions.map((question) =>
          question.id === questionId ? { ...question, answer: content } : question
        ),
        progress: section.questions.every((q) => (q.answer || '').trim().length > 0) ? 100 : 0
      })),
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

function buildSectionFromTemplate(
  template: SectionTemplate,
  savedSections: StoredPlanSection[]
): Section {
  const saved = savedSections.find((section) => section.id === template.id);
  const answer = saved?.content ?? '';
  const datasets = convertLegacyTablesToDatasets(saved?.tables);
  return {
    id: template.id,
    title: template.title,
    description: template.description || template.prompts?.[0] || '',
    questions: [
      {
        id: `${template.id}_q1`,
        prompt: template.prompts?.[0] || template.title,
        answer,
        suggestions: [],
        warnings: []
      }
    ],
    datasets,
    kpis: [],
    media: (saved?.figures as MediaAsset[]) || [],
    collapsed: false,
    category: template.category,
    progress: answer ? 100 : 0
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
    updateTitlePage,
    updateAncillary,
    addReference,
    updateReference,
    deleteReference,
    setProductType,
    setFundingProgram,
    progressSummary,
    runRequirementsCheck,
    requestAISuggestions
  } = useEditorStore();

  useEffect(() => {
    hydrate(product);
  }, [product, hydrate]);

  useEffect(() => {
    if (router.query.product && router.query.product !== product) {
      hydrate(router.query.product as ProductType);
    }
  }, [router.query.product, product, hydrate]);

  const activeSection = useMemo(
    () => plan?.sections.find((section) => section.id === activeSectionId) ?? plan?.sections[0],
    [plan, activeSectionId]
  );
  const activeQuestion =
    activeSection?.questions.find((question) => question.id === activeQuestionId) ??
    activeSection?.questions[0];

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
    <div className="grid grid-cols-[260px_minmax(0,1fr)_340px] min-h-screen bg-slate-50">
      <Sidebar
        plan={plan}
        activeSectionId={activeSection?.id ?? null}
        onSelectSection={setActiveSection}
        onChangeProduct={(next) => {
          setProductType(next);
          hydrate(next);
        }}
        onChangeFunding={setFundingProgram}
      />

      <SectionWorkspace
        section={activeSection}
        onAnswerChange={updateAnswer}
        onSelectQuestion={setActiveQuestion}
        activeQuestionId={activeQuestion?.id ?? null}
        onAskAI={() => {
          if (activeSection && activeQuestion) {
            requestAISuggestions(activeSection.id, activeQuestion.id);
            setRightPanelView('ai');
          }
        }}
      />

      <RightPanel
        view={rightPanelView}
        setView={setRightPanelView}
        section={activeSection}
        question={activeQuestion}
        plan={plan}
        onDatasetCreate={(dataset) => activeSection && addDataset(activeSection.id, dataset)}
        onKpiCreate={(kpi) => activeSection && addKpi(activeSection.id, kpi)}
        onMediaCreate={(asset) => activeSection && addMedia(activeSection.id, asset)}
        onTitlePageChange={updateTitlePage}
        onAncillaryChange={updateAncillary}
        onReferenceAdd={addReference}
        onReferenceUpdate={updateReference}
        onReferenceDelete={deleteReference}
        onRunRequirements={runRequirementsCheck}
        progressSummary={progressSummary}
      />
    </div>
  );
}

function Sidebar({
  plan,
  activeSectionId,
  onSelectSection,
  onChangeProduct,
  onChangeFunding
}: {
  plan: BusinessPlan;
  activeSectionId: string | null;
  onSelectSection: (sectionId: string) => void;
  onChangeProduct: (product: ProductType) => void;
  onChangeFunding: (program: FundingProgramType) => void;
}) {
  return (
    <aside className="border-r border-gray-200 bg-white p-4 space-y-4">
      <div>
        <p className="text-xs text-gray-500 uppercase">Plan</p>
        <p className="text-base font-semibold text-gray-900">{plan.titlePage.planTitle}</p>
      </div>
      <div className="space-y-3">
        <label className="block text-xs text-gray-500">
          Product type
          <select
            value={plan.productType}
            onChange={(event) => onChangeProduct(event.target.value as ProductType)}
            className="mt-1 w-full border border-gray-200 rounded-md px-2 py-1 text-sm"
          >
            <option value="submission">Submission</option>
            <option value="prototype">Prototype</option>
            <option value="research_project">Research project</option>
            <option value="strategy">Strategy</option>
          </select>
        </label>
        <label className="block text-xs text-gray-500">
          Funding program
          <select
            value={plan.fundingProgram}
            onChange={(event) => onChangeFunding(event.target.value as FundingProgramType)}
            className="mt-1 w-full border border-gray-200 rounded-md px-2 py-1 text-sm"
          >
            <option value="grant">Grant</option>
            <option value="venture_financing">Venture financing</option>
            <option value="loan">Loan</option>
            <option value="equity">Equity</option>
          </select>
        </label>
      </div>
      <nav className="space-y-2">
        {plan.sections.map((section, index) => (
          <button
            key={section.id}
            onClick={() => onSelectSection(section.id)}
            className={`w-full text-left px-3 py-2 rounded-md border text-sm ${
              section.id === activeSectionId
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <span className="block font-medium">
              {String(index + 1).padStart(2, '0')} · {section.title}
            </span>
            <span className="text-xs text-gray-400">{section.progress ?? 0}%</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

function SectionWorkspace({
  section,
  onAnswerChange,
  onSelectQuestion,
  activeQuestionId,
  onAskAI
}: {
  section?: Section;
  onAnswerChange: (questionId: string, content: string) => void;
  onSelectQuestion: (questionId: string) => void;
  activeQuestionId: string | null;
  onAskAI: () => void;
}) {
  if (!section) {
    return (
      <main className="p-10">
        <div className="text-gray-500 text-sm">Select a section to begin.</div>
      </main>
    );
  }

  return (
    <main className="p-10 space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase">{section.category}</p>
          <h1 className="text-2xl font-semibold text-gray-900">{section.title}</h1>
          {section.description && (
            <p className="text-sm text-gray-500 mt-1">{section.description}</p>
          )}
        </div>
        <button
          onClick={onAskAI}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold"
        >
          Ask AI for help
        </button>
      </div>
      <div className="space-y-4">
        {section.questions.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            isActive={question.id === activeQuestionId}
            onFocus={() => onSelectQuestion(question.id)}
            onChange={(content) => onAnswerChange(question.id, content)}
          />
        ))}
      </div>
    </main>
  );
}

function QuestionCard({
  question,
  isActive,
  onFocus,
  onChange
}: {
  question: Question;
  isActive: boolean;
  onFocus: () => void;
  onChange: (content: string) => void;
}) {
  return (
    <div
      className={`border rounded-xl p-4 bg-white shadow-sm ${
        isActive ? 'border-blue-500 shadow-md' : 'border-gray-200'
      }`}
      onClick={onFocus}
    >
      <p className="text-xs text-gray-500 uppercase mb-2">{question.prompt}</p>
      <SimpleTextEditor content={question.answer ?? ''} onChange={onChange} />
      {question.suggestions && question.suggestions.length > 0 && (
        <div className="mt-3 border border-blue-100 bg-blue-50 text-sm text-blue-700 rounded-lg p-3 space-y-2">
          <p className="font-semibold">AI suggestion</p>
          {question.suggestions.map((suggestion: string, index: number) => (
            <p key={index}>{suggestion}</p>
          ))}
        </div>
      )}
    </div>
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
  onTitlePageChange,
  onAncillaryChange,
  onReferenceAdd,
  onReferenceUpdate,
  onReferenceDelete,
  onRunRequirements,
  progressSummary
}: {
  view: RightPanelView;
  setView: (view: RightPanelView) => void;
  section?: Section;
  question?: Question;
  plan: BusinessPlan;
  onDatasetCreate: (dataset: Dataset) => void;
  onKpiCreate: (kpi: KPI) => void;
  onMediaCreate: (asset: MediaAsset) => void;
  onTitlePageChange: (titlePage: TitlePage) => void;
  onAncillaryChange: (updates: Partial<AncillaryContent>) => void;
  onReferenceAdd: (reference: Reference) => void;
  onReferenceUpdate: (reference: Reference) => void;
  onReferenceDelete: (referenceId: string) => void;
  onRunRequirements: () => void;
  progressSummary: ProgressSummary[];
}) {
  return (
    <aside className="border-l border-gray-200 bg-white flex flex-col">
      <div className="grid grid-cols-5 border-b border-gray-200 text-xs font-semibold text-gray-500">
        {(['ai', 'data', 'ancillary', 'preview', 'requirements'] as RightPanelView[]).map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setView(tab)}
              className={`py-3 ${
                view === tab ? 'text-blue-600 border-b-2 border-blue-600' : ''
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          )
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        {view === 'ai' && question && (
          <div className="p-4 space-y-3 text-sm text-gray-600">
            <p className="text-xs uppercase text-gray-400">Current question</p>
            <p className="font-semibold">{question?.prompt}</p>
            {question?.answer ? (
              <p className="text-gray-500">{question.answer.substring(0, 200)}...</p>
            ) : (
              <p className="text-gray-400">Start typing to receive better suggestions.</p>
            )}
            {question?.suggestions?.map((suggestion: string, index: number) => (
              <div key={index} className="border border-blue-100 bg-blue-50 rounded-lg p-3 text-blue-700">
                {suggestion}
              </div>
            ))}
            {!question?.suggestions?.length && (
              <p className="text-xs text-gray-400">Use “Ask AI for help” to request guidance.</p>
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
          />
        )}
        {view === 'data' && !section && (
          <div className="p-4 text-xs text-gray-500">
            Choose a section to manage datasets, KPIs, and media.
          </div>
        )}
        {view === 'ancillary' && (
          <AncillaryEditorPanel
            titlePage={plan.titlePage}
            ancillary={plan.ancillary}
            references={plan.references}
            onTitlePageChange={onTitlePageChange}
            onAncillaryChange={onAncillaryChange}
            onReferenceAdd={onReferenceAdd}
            onReferenceUpdate={onReferenceUpdate}
            onReferenceDelete={onReferenceDelete}
            onRunRequirementsCheck={onRunRequirements}
            progressSummary={progressSummary}
          />
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

