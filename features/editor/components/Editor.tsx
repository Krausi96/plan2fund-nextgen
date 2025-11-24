// ========= PLAN2FUND — UNIFIED BUSINESS PLAN EDITOR =========
// New scaffold: sidebar navigation + workspace + right panel powered by a local Zustand store.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { create } from 'zustand';
import { createPortal } from 'react-dom';
import {
  AncillaryContent,
  AppendixItem,
  BusinessPlan,
  Dataset,
  FundingProgramType,
  KPI,
  AttachmentReference,
  MediaAsset,
  ProgramSummary,
  PlanSection as LegacyPlanSection,
  ProductType,
  Question,
  QuestionStatus,
  Reference,
  RightPanelView,
  Section,
  TemplateFundingType,
  Table,
  TitlePage
} from '@/features/editor/types/plan';
import { SectionTemplate, getSections } from '@templates';
import { createAIHelper } from '@/features/editor/engine/aiHelper';
import { calculateSectionProgress } from '@/features/editor/utils/tableInitializer';
import {
  loadPlanSections,
  savePlanSections,
  loadUserAnswers,
  savePlanConversations,
  loadPlanConversations,
  loadSelectedProgram,
  saveSelectedProgram,
  clearSelectedProgram,
  loadQuestionStates,
  saveQuestionStates
} from '@/shared/user/storage/planStore';
import type { PlanSection as StoredPlanSection } from '@/shared/user/storage/planStore';
// SimpleTextEditor component merged inline below
import DataPanel from './InlineTableCreator';
import PreviewPane from './SectionContentRenderer';
import AncillaryEditorPanel from './RequirementsModal';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Card } from '@/shared/components/ui/card';
import { Progress } from '@/shared/components/ui/progress';
import { useI18n } from '@/shared/contexts/I18nContext';

type ProgressSummary = { id: string; title: string; progress: number };

type QuestionStateSnapshot = {
  status: QuestionStatus;
  note?: string;
  lastUpdatedAt?: string;
};

type QuestionStateMap = Record<string, QuestionStateSnapshot>;

type ResolvedAttachmentSummary = {
  id: string;
  label: string;
  displayType: MediaAsset['type'];
  sourceType: 'dataset' | 'kpi' | 'media';
};

type AISuggestionIntent = 'default' | 'outline' | 'improve' | 'data';

interface AISuggestionOptions {
  intent?: AISuggestionIntent;
}

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
  requestAISuggestions: (
    sectionId: string,
    questionId: string,
    options?: AISuggestionOptions
  ) => Promise<void>;
  toggleQuestionUnknown: (questionId: string, note?: string) => void;
  markQuestionComplete: (questionId: string) => void;
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

const PRODUCT_TYPE_CONFIG = [
  {
    value: 'strategy' as ProductType,
    labelKey: 'planTypes.strategy.title',
    descriptionKey: 'planTypes.strategy.subtitle'
  },
  {
    value: 'review' as ProductType,
    labelKey: 'planTypes.review.title',
    descriptionKey: 'planTypes.review.subtitle'
  },
  {
    value: 'submission' as ProductType,
    labelKey: 'planTypes.custom.title',
    descriptionKey: 'planTypes.custom.subtitle'
  }
] as const;

type ConnectCopy = {
  badge: string;
  heading: string;
  description: string;
  openFinder: string;
  pasteLink: string;
  inputLabel: string;
  placeholder: string;
  example: string;
  submit: string;
  error: string;
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

type IconProps = React.SVGProps<SVGSVGElement>;

const ChevronLeftIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 19.5 8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRightIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5 15.75 12l-7.5 7.5" />
  </svg>
);

const CheckCircleIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m9 12.75 1.5 1.5 4-4" />
    <circle cx="12" cy="12" r="8.25" strokeWidth={1.5} />
  </svg>
);

const QuestionMarkCircleIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <circle cx="12" cy="12" r="8.25" strokeWidth={1.5} />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12 15.75h.007M9.75 9a2.25 2.25 0 114.5 0c0 1.125-.75 1.5-1.5 2.25-.375.375-.75.75-.75 1.5"
    />
  </svg>
);

const EllipsisHorizontalIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <circle cx="6" cy="12" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="18" cy="12" r="1.5" />
  </svg>
);

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
      const questionStates: QuestionStateMap =
        typeof window !== 'undefined' ? loadQuestionStates() : {};
      // Funding type ignored - only product type matters
      const templates = await getSections('grants', product, context?.programId, baseUrl);
      const savedSections: StoredPlanSection[] =
        typeof window !== 'undefined' ? loadPlanSections() : [];
      const sections = templates.map((template) =>
        buildSectionFromTemplate(template, savedSections, questionStates)
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
          templateFundingType: context?.summary?.fundingType ?? context?.fundingType ?? 'grants'
        }
      };

      // Auto-select Section 2 (Project Description) as recommended primary starting point
      // Executive Summary should be completed last as it summarizes other sections
      const projectDescriptionSection = sections.find(s => s.id === 'project_description');
      const initialSection = projectDescriptionSection ?? sections[0] ?? null;
      
      set({
        plan,
        templates,
        isLoading: false,
        activeSectionId: initialSection?.id ?? null,
        activeQuestionId: initialSection?.questions[0]?.id ?? null,
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
    const trimmed = (content ?? '').trim();
    const updatedPlan: BusinessPlan = {
      ...plan,
      sections: plan.sections.map((section) => {
        const updatedQuestions = section.questions.map((question) =>
          question.id === questionId
            ? {
                ...question,
                answer: content,
                status:
                  question.status === 'unknown' && trimmed.length === 0
                    ? ('unknown' as QuestionStatus)
                    : determineQuestionStatus(content ?? ''),
                statusNote:
                  trimmed.length === 0 && question.status === 'unknown'
                    ? question.statusNote
                    : undefined,
                lastUpdatedAt: new Date().toISOString()
              }
            : question
        );
        return {
          ...section,
          questions: updatedQuestions,
          progress: calculateSectionCompletion(updatedQuestions)
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
  toggleQuestionUnknown: (questionId, note) => {
    const { plan } = get();
    if (!plan) return;
    const updatedPlan: BusinessPlan = {
      ...plan,
      sections: plan.sections.map((section) => {
        const updatedQuestions = section.questions.map((question) => {
          if (question.id !== questionId) return question;
          const isCurrentlyUnknown = question.status === 'unknown';
          if (isCurrentlyUnknown) {
            return {
              ...question,
              status: 'blank' as QuestionStatus,
              statusNote: undefined,
              answer: '',
              lastUpdatedAt: new Date().toISOString()
            };
          }
          return {
            ...question,
            status: 'unknown' as QuestionStatus,
            statusNote: note,
            answer: '',
            lastUpdatedAt: new Date().toISOString()
          };
        });
        return {
          ...section,
          questions: updatedQuestions,
          progress: calculateSectionCompletion(updatedQuestions)
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
  markQuestionComplete: (questionId) => {
    const { plan } = get();
    if (!plan) return;
    const updatedPlan: BusinessPlan = {
      ...plan,
      sections: plan.sections.map((section) => {
        const updatedQuestions = section.questions.map((question) =>
          question.id === questionId
            ? {
                ...question,
                status: 'complete' as QuestionStatus,
                lastUpdatedAt: new Date().toISOString()
              }
            : question
        );
        return {
          ...section,
          questions: updatedQuestions,
          progress: calculateSectionCompletion(updatedQuestions)
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
    attachReferenceToQuestion(set, get, sectionId, questionId, {
      attachmentId: dataset.id,
      attachmentType: 'dataset'
    });
  },
  attachKpiToQuestion: (sectionId, questionId, kpi) => {
    attachReferenceToQuestion(set, get, sectionId, questionId, {
      attachmentId: kpi.id,
      attachmentType: 'kpi'
    });
  },
  attachMediaToQuestion: (sectionId, questionId, asset) => {
    attachReferenceToQuestion(set, get, sectionId, questionId, {
      attachmentId: asset.id,
      attachmentType: 'media'
    });
  },
  detachQuestionAttachment: (sectionId, questionId, attachmentId) => {
    const { plan } = get();
    if (!plan) return;
    const updatedPlan = updateSection(plan, sectionId, (section) => {
      const targetQuestion = section.questions.find((question) => question.id === questionId);
      if (!targetQuestion || !targetQuestion.attachments) {
        return section;
      }

      const reference = targetQuestion.attachments.find(
        (attachment) =>
          'attachmentId' in attachment && attachment.attachmentId === attachmentId
      ) as AttachmentReference | undefined;

      if (!reference) {
        return section;
      }

      return syncAttachmentReference(section, questionId, reference, 'remove');
    });
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
  requestAISuggestions: async (sectionId, questionId, options) => {
    const { plan, templates } = get();
    if (!plan) return;
    const section = plan.sections.find((item) => item.id === sectionId);
    if (!section) return;
    const question = section.questions.find((item) => item.id === questionId);
    if (!question) return;

    const conversations = loadPlanConversations();
    const conversationKey = `${sectionId}::${questionId}`;
    const conversationHistory = conversations[conversationKey] || [];
    const template = templates.find((item) => item.id === sectionId);

    const attachmentSummary = summarizeQuestionAttachments(section, question);
    const validation = validateQuestionRequirements(question, section, template);
    const requirementHints = computeRequirementHints(question, attachmentSummary, validation);
    const aiGuidanceMode = getAiGuidanceMode(question.status);
    const intent: AISuggestionIntent = options?.intent ?? 'default';
    const enhancedContext = [
      template?.prompts?.join('\n') ?? section.description ?? '',
      buildAiQuestionContext({
        section,
        question,
        attachments: attachmentSummary,
        requirementHints,
        intent,
        validation
      }),
      buildIntentPrompt(intent)
    ]
      .filter(Boolean)
      .join('\n\n');

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
        enhancedContext,
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
        conversationHistory,
        {
          questionPrompt: question.prompt,
          questionStatus: question.status,
          questionMode: aiGuidanceMode,
          attachmentSummary: attachmentSummary.summaryLines,
          requirementHints
        }
      );

      if (response.content) {
        const userTurn = {
          id: `msg_${Date.now()}`,
          role: 'assistant' as const,
          content: response.content,
          timestamp: new Date().toISOString()
        };
        savePlanConversations(conversationKey, [...conversationHistory, userTurn]);

        // Create KPIs if AI suggested them
        let planWithKPIs = plan;
        if ((response as any).suggestedKPIs && (response as any).suggestedKPIs.length > 0) {
          const newKPIs = (response as any).suggestedKPIs.map((suggested: any) => ({
            id: `kpi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: suggested.name,
            value: suggested.value || 0,
            unit: suggested.unit,
            description: suggested.description,
            sectionId,
            questionId
          }));
          
          planWithKPIs = updateSection(plan, sectionId, (currentSection) => ({
            ...currentSection,
            kpis: [...(currentSection.kpis ?? []), ...newKPIs]
          }));
        }

        const updatedPlan = updateSection(planWithKPIs, sectionId, (currentSection) => ({
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

function attachReferenceToQuestion(
  set: (partial: Partial<EditorStoreState>) => void,
  get: () => EditorStoreState,
  sectionId: string,
  questionId: string,
  reference: AttachmentReference
) {
  const { plan } = get();
  if (!plan) return;
  const updatedPlan = updateSection(plan, sectionId, (section) =>
    syncAttachmentReference(section, questionId, reference, 'add')
  );
  persistPlan(updatedPlan);
  set({ plan: updatedPlan });
}

function syncAttachmentReference(
  section: Section,
  questionId: string,
  reference: AttachmentReference,
  mode: 'add' | 'remove'
): Section {
  const timestamp = new Date().toISOString();

  const updatedQuestions = section.questions.map((question) => {
    if (question.id !== questionId) return question;
    const attachments = question.attachments ?? [];

    if (mode === 'add') {
      const alreadyLinked = attachments.some(
        (attachment) =>
          'attachmentId' in attachment &&
          attachment.attachmentId === reference.attachmentId &&
          attachment.attachmentType === reference.attachmentType
      );
      if (alreadyLinked) return question;
      return {
        ...question,
        attachments: [...attachments, { ...reference, linkedAt: timestamp }]
      };
    }

    return {
      ...question,
      attachments: attachments.filter((attachment) =>
        'attachmentId' in attachment
          ? !(
              attachment.attachmentId === reference.attachmentId &&
              attachment.attachmentType === reference.attachmentType
            )
          : true
      )
    };
  });

  const updateCollection = <T extends { id: string; relatedQuestions?: string[]; updatedAt?: string }>(
    collection?: T[]
  ): T[] | undefined => {
    if (!collection) return collection;
    return collection.map((item) => {
      if (item.id !== reference.attachmentId) return item;
      const related = item.relatedQuestions ?? [];
      if (mode === 'add') {
        if (related.includes(questionId)) return item;
        return {
          ...item,
          relatedQuestions: [...related, questionId],
          updatedAt: timestamp
        };
      }
      if (!related.includes(questionId)) return item;
      return {
        ...item,
        relatedQuestions: related.filter((id) => id !== questionId),
        updatedAt: timestamp
      };
    });
  };

  if (reference.attachmentType === 'dataset') {
    return {
      ...section,
      questions: updatedQuestions,
      datasets: updateCollection(section.datasets)
    };
  }

  if (reference.attachmentType === 'kpi') {
    return {
      ...section,
      questions: updatedQuestions,
      kpis: updateCollection(section.kpis)
    };
  }

  return {
    ...section,
    questions: updatedQuestions,
    media: updateCollection(section.media)
  };
}

function stripHtml(content?: string): string {
  if (!content) return '';
  return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function countWords(content?: string): number {
  const stripped = stripHtml(content);
  if (!stripped) return 0;
  return stripped.split(/\s+/).filter(Boolean).length;
}

function resolveQuestionAttachments(section: Section, question: Question): ResolvedAttachmentSummary[] {
  const attachments = question.attachments ?? [];
  if (attachments.length === 0) return [];

  return attachments
    .map((attachment) => {
      if ('attachmentId' in attachment) {
        if (attachment.attachmentType === 'dataset') {
          const dataset = section.datasets?.find((item) => item.id === attachment.attachmentId);
          if (!dataset) return null;
          return {
            id: dataset.id,
            label: dataset.name || 'Unnamed dataset',
            displayType: 'table' as MediaAsset['type'],
            sourceType: 'dataset' as const
          };
        }
        if (attachment.attachmentType === 'kpi') {
          const kpi = section.kpis?.find((item) => item.id === attachment.attachmentId);
          if (!kpi) return null;
          return {
            id: kpi.id,
            label: kpi.name || 'Unnamed KPI',
            displayType: 'kpi' as MediaAsset['type'],
            sourceType: 'kpi' as const
          };
        }
        const media = section.media?.find((item) => item.id === attachment.attachmentId);
        if (!media) return null;
        return {
          id: media.id,
          label: media.title || 'Untitled media',
          displayType: media.type,
          sourceType: 'media' as const
        };
      }

      // Legacy payloads (pre-reference model)
      const legacy = attachment as MediaAsset;
      return {
        id: legacy.id,
        label: legacy.title || 'Untitled attachment',
        displayType: legacy.type,
        sourceType: legacy.type === 'kpi' ? 'kpi' : legacy.type === 'table' ? 'dataset' : 'media'
      };
    })
    .filter((item): item is ResolvedAttachmentSummary => Boolean(item));
}

function summarizeQuestionAttachments(section: Section, question: Question) {
  const resolved = resolveQuestionAttachments(section, question);
  const typeSet = new Set(resolved.map((item) => item.displayType));
  const summaryLines =
    resolved.length > 0
      ? resolved.map((item) => `- ${item.displayType.toUpperCase()}: ${item.label}`)
      : ['- No attachments linked'];

  return {
    resolved,
    summaryLines,
    hasType: (type: MediaAsset['type']) => typeSet.has(type),
    total: resolved.length
  };
}

function getAiGuidanceMode(status: QuestionStatus) {
  return status === 'blank' || status === 'unknown' ? 'guidance' : 'critique';
}

type RequirementValidation = {
  questionId: string;
  questionPrompt: string;
  isValid: boolean;
  issues: Array<{
    type: 'status' | 'word_count' | 'keywords' | 'attachments';
    severity: 'error' | 'warning';
    message: string;
  }>;
};

function validateQuestionRequirements(
  question: Question,
  section: Section,
  template?: SectionTemplate,
  t?: (key: any) => string
): RequirementValidation {
  const issues: RequirementValidation['issues'] = [];
  const attachmentSummary = summarizeQuestionAttachments(section, question);
  const wordCount = countWords(question.answer);
  const plainAnswer = stripHtml(question.answer).toLowerCase();

  // 1. Status validation
  if (question.required && question.status === 'blank') {
    issues.push({
      type: 'status',
      severity: 'error',
      message: t ? (t('editor.ui.validation.requiredBlank' as any) as string) : 'Required question is still blank. Provide an answer or mark as unknown with a note.'
    });
  }

  // 2. Word count validation (with ±10% tolerance)
  if (template && wordCount > 0) {
    const min = template.wordCountMin;
    const max = template.wordCountMax;
    const tolerance = 0.1; // 10% tolerance
    const minWithTolerance = Math.floor(min * (1 - tolerance));
    const maxWithTolerance = Math.ceil(max * (1 + tolerance));

    if (wordCount < minWithTolerance) {
      issues.push({
        type: 'word_count',
        severity: 'warning',
        message: `Answer is ${wordCount} words, below the recommended minimum of ${min} words (${minWithTolerance} with tolerance).`
      });
    } else if (wordCount > maxWithTolerance) {
      issues.push({
        type: 'word_count',
        severity: 'warning',
        message: `Answer is ${wordCount} words, above the recommended maximum of ${max} words (${maxWithTolerance} with tolerance).`
      });
    }
  }

  // 3. Required keywords validation
  if (template && template.validationRules?.requiredFields && plainAnswer) {
    const missingKeywords: string[] = [];
    template.validationRules.requiredFields.forEach((field) => {
      // Simple heuristic: check if field name or common variations appear in answer
      const fieldVariations = [
        field.toLowerCase(),
        field.replace(/_/g, ' '),
        field.replace(/_/g, '-')
      ];
      const found = fieldVariations.some((variant) => plainAnswer.includes(variant));
      if (!found) {
        missingKeywords.push(field.replace(/_/g, ' '));
      }
    });

    if (missingKeywords.length > 0) {
      issues.push({
        type: 'keywords',
        severity: 'warning',
        message: `Answer may be missing required topics: ${missingKeywords.slice(0, 3).join(', ')}${missingKeywords.length > 3 ? '...' : ''}`
      });
    }
  }

  // 4. Required attachments validation
  if (question.requiredAssets && question.requiredAssets.length > 0) {
    question.requiredAssets.forEach((assetType) => {
      if (!attachmentSummary.hasType(assetType)) {
        const label =
          assetType === 'kpi'
            ? 'KPI metric'
            : assetType === 'chart'
            ? 'chart or visualization'
            : assetType === 'table'
            ? 'table/dataset'
            : 'supporting media';
        issues.push({
          type: 'attachments',
          severity: question.required ? 'error' : 'warning',
          message: `Add at least one ${label} to support this prompt.`
        });
      }
    });
  }

  return {
    questionId: question.id,
    questionPrompt: question.prompt,
    isValid: issues.filter((i) => i.severity === 'error').length === 0,
    issues
  };
}

function computeRequirementHints(
  question: Question,
  attachmentSummary: ReturnType<typeof summarizeQuestionAttachments>,
  validation?: RequirementValidation
) {
  const hints: string[] = [];
  const wordCount = countWords(question.answer);

  // Use validation results if available, otherwise fall back to simple heuristics
  if (validation) {
    validation.issues.forEach((issue) => {
      hints.push(issue.message);
    });
  } else {
    // Fallback to original logic
    if (question.status === 'blank') {
      hints.push('Prompt is still blank — provide at least a rough outline.');
    } else if (question.status === 'unknown') {
      hints.push('Prompt is marked as unknown. Add a supporting note or revisit with data when ready.');
    }

    if (wordCount > 0 && wordCount < 80) {
      hints.push('Answer is shorter than ~80 words. Add more detail or supporting data.');
    }

    if (attachmentSummary.total === 0) {
      hints.push('No datasets, KPIs, or media are attached. Consider linking evidence.');
    }

    if (question.requiredAssets && question.requiredAssets.length > 0) {
      question.requiredAssets.forEach((assetType) => {
        if (!attachmentSummary.hasType(assetType)) {
          const label =
            assetType === 'kpi'
              ? 'KPI metric'
              : assetType === 'chart'
              ? 'chart or visualization'
              : assetType === 'table'
              ? 'table/dataset'
              : 'supporting media';
          hints.push(`Add at least one ${label} to support this prompt.`);
        }
      });
    }
  }

  return hints;
}

function buildAiQuestionContext(params: {
  section: Section;
  question: Question;
  attachments: ReturnType<typeof summarizeQuestionAttachments>;
  requirementHints: string[];
  intent?: AISuggestionIntent;
  validation?: RequirementValidation;
}) {
  const { section, question, attachments, requirementHints, intent, validation } = params;
  const plainAnswer = stripHtml(question.answer);
  const wordCount = countWords(question.answer);
  const aiMode = getAiGuidanceMode(question.status);

  const attachmentBlock = attachments.summaryLines.join('\n');
  
  // Use validation results if available for more detailed hints
  let hintsBlock: string;
  if (validation && validation.issues.length > 0) {
    const errors = validation.issues.filter((i) => i.severity === 'error');
    const warnings = validation.issues.filter((i) => i.severity === 'warning');
    const errorBlock = errors.length > 0 
      ? `BLOCKING ISSUES:\n${errors.map((e) => `- ${e.message}`).join('\n')}`
      : '';
    const warningBlock = warnings.length > 0
      ? `WARNINGS:\n${warnings.map((w) => `- ${w.message}`).join('\n')}`
      : '';
    hintsBlock = [errorBlock, warningBlock].filter(Boolean).join('\n\n') || '- No immediate gaps detected.';
  } else {
    hintsBlock =
      requirementHints.length > 0
        ? requirementHints.map((hint) => `- ${hint}`).join('\n')
        : '- No immediate gaps detected.';
  }

  const trimmedAnswer =
    plainAnswer.length > 1200 ? `${plainAnswer.slice(0, 1200)}…` : plainAnswer || '[No answer yet]';

  return [
    '=== QUESTION CONTEXT ===',
    `Section: ${section.title}`,
    `Prompt: ${question.prompt}`,
    `Mode: ${aiMode.toUpperCase()}`,
    `Status: ${question.status}${question.statusNote ? ` (${question.statusNote})` : ''}`,
    `Word count: ${wordCount}`,
    validation && !validation.isValid ? '⚠️ VALIDATION FAILED - See requirement hints below' : null,
    intent && intent !== 'default' ? `User intent: ${intent}` : null,
    '',
    'Current answer:',
    trimmedAnswer,
    '',
    'Linked data:',
    attachmentBlock,
    '',
    'Requirement validation:',
    hintsBlock
  ].filter(Boolean).join('\n');
}

function buildIntentPrompt(intent: AISuggestionIntent): string | null {
  switch (intent) {
    case 'outline':
      return 'Focus on building a structured outline with bullet points for each required subtopic before suggesting final prose.';
    case 'improve':
      return 'Critique the current answer and provide specific improvements; call out weak areas and suggest stronger arguments.';
    case 'data':
      return 'Suggest the datasets, KPIs, or media assets that should be added to strengthen this answer. Provide names, column ideas, or KPI definitions.';
    default:
      return null;
  }
}

function buildSectionFromTemplate(
  template: SectionTemplate,
  savedSections: StoredPlanSection[],
  questionStates: QuestionStateMap
): Section {
  const saved = savedSections.find((section) => section.id === template.id);
  const datasets = convertLegacyTablesToDatasets(saved?.tables, template.id);
  const questions = buildQuestionsFromTemplate(template, saved?.content ?? '', questionStates);
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
    progress: calculateSectionCompletion(questions)
  };
}

function convertLegacyTablesToDatasets(tables?: Record<string, Table | undefined>, sectionId: string = ''): Dataset[] {
  if (!tables) return [];
  const timestamp = new Date().toISOString();
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
        tags: [],
        sectionId: sectionId || 'legacy',
        relatedQuestions: [],
        createdAt: timestamp,
        updatedAt: timestamp,
        lastUpdated: timestamp
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

function meetsMinimalAnswerThreshold(content: string): boolean {
  const stripped = (content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!stripped) return false;
  const wordCount = stripped.split(/\s+/).filter(Boolean).length;
  const bulletCount = (content || '')
    .split('\n')
    .filter((line) => line.trim().match(/^([-*•]|[0-9]+\.)\s+/))
    .length;
  const sentenceCount = stripped.split(/[.!?]/).filter((sentence) => sentence.trim().length > 0).length;
  if (bulletCount >= 1) return true;
  if (sentenceCount >= 2 && wordCount >= 15) return true;
  return wordCount >= 30;
}

function determineQuestionStatus(content: string): QuestionStatus {
  const stripped = (content || '').replace(/<[^>]*>/g, ' ').trim();
  if (!stripped) {
    return 'blank';
  }
  return meetsMinimalAnswerThreshold(content) ? 'complete' : 'draft';
}

function calculateSectionCompletion(questions: Question[]): number {
  if (questions.length === 0) return 0;
  const completed = questions.filter((question) => question.status === 'complete').length;
  return Math.round((completed / questions.length) * 100);
}

function extractQuestionStates(plan: BusinessPlan): QuestionStateMap {
  return plan.sections.reduce<QuestionStateMap>((acc, section) => {
    section.questions.forEach((question) => {
      acc[question.id] = {
        status: question.status ?? 'blank',
        note: question.statusNote,
        lastUpdatedAt: question.lastUpdatedAt
      };
    });
    return acc;
  }, {});
}

function buildQuestionsFromTemplate(
  template: SectionTemplate,
  savedAnswer: string,
  questionStates: QuestionStateMap
): Question[] {
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

  return seeds.map((seed, index) => {
    const questionId = `${template.id}_q${index + 1}`;
    const storedState = questionStates?.[questionId];
    const initialAnswer = index === 0 ? savedAnswer : '';
    const derivedStatus = determineQuestionStatus(initialAnswer ?? '');
    return {
      id: questionId,
      prompt: seed.prompt,
      helperText: seed.helperText,
      placeholder: seed.placeholder,
      required: seed.required,
      answer: initialAnswer,
      suggestions: [],
      warnings: [],
      requiredAssets,
      status: storedState?.status ?? derivedStatus,
      statusNote: storedState?.note,
      lastUpdatedAt: storedState?.lastUpdatedAt
    };
  });
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
  saveQuestionStates(extractQuestionStates(plan));
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
  const { t } = useI18n();
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
        description: (t(option.descriptionKey as any) as string) || ''
      })),
    [t]
  );
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
    markQuestionComplete,
    rightPanelView,
    setRightPanelView,
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
    setProductType,
    progressSummary,
    runRequirementsCheck,
    requestAISuggestions,
    toggleQuestionUnknown
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


  const triggerAISuggestions = (questionId?: string, options?: AISuggestionOptions) => {
    if (!activeSection) return;
    const targetQuestionId = questionId ?? activeQuestion?.id;
    if (!targetQuestionId) return;
    requestAISuggestions(activeSection.id, targetQuestionId, options);
    setRightPanelView('ai');
  };

  if (isLoading || !plan) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        {t('editor.ui.loadingEditor' as any) as string || 'Loading editor...'}
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
            plan={plan}
            programSummary={programSummary ?? plan.programSummary ?? null}
            onChangeProduct={handleProductChange}
            onConnectProgram={handleConnectProgram}
            onOpenProgramFinder={() => router.push('/reco')}
            programLoading={programLoading}
            programError={programError}
            onUpdateTitlePage={updateTitlePage}
            onOpenFrontMatter={() => setActiveSection(ANCILLARY_SECTION_ID)}
            productOptions={productOptions}
            connectCopy={connectCopy}
          />
        </div>
      </header>

      {/* Section Navigation Bar */}
      <div className="border-b border-neutral-200 bg-neutral-200 sticky top-[72px] z-30">
        <div className="container">
          <div className="relative rounded-lg border border-blue-600/50 overflow-hidden backdrop-blur-lg shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-900 to-slate-800" />
            <div className="relative z-10 py-2 px-2.5">
              <div className="mb-1">
                <h2 className="text-xl font-bold uppercase tracking-wider text-white">{t('editor.header.planSections' as any) as string || 'Plan Sections'}</h2>
              </div>
              <SectionNavigationBar
                plan={plan}
                activeSectionId={activeSectionId ?? plan.sections[0]?.id ?? null}
                onSelectSection={setActiveSection}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container py-1 pb-6 flex flex-col gap-1 lg:flex-row lg:items-start">
        <div className="flex-1 min-w-0 max-w-4xl">
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
              onAskAI={triggerAISuggestions}
              onToggleUnknown={toggleQuestionUnknown}
              onMarkComplete={markQuestionComplete}
            />
          )}
        </div>

        <div className="w-full lg:w-[400px] flex-shrink-0">
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
            onAnswerChange={updateAnswer}
          />
        </div>
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
  programError,
  onUpdateTitlePage,
  onOpenFrontMatter,
  productOptions,
  connectCopy
}: {
  plan: BusinessPlan;
  programSummary: ProgramSummary | null;
  onChangeProduct: (product: ProductType) => void;
  onConnectProgram: (value: string | null) => void;
  onOpenProgramFinder: () => void;
  programLoading: boolean;
  programError: string | null;
  onUpdateTitlePage: (titlePage: TitlePage) => void;
  onOpenFrontMatter: () => void;
  productOptions: Array<{ value: ProductType; label: string; description: string }>;
  connectCopy: ConnectCopy;
}) {
  const { t } = useI18n();
  const [titleDraft, setTitleDraft] = useState(plan.titlePage.planTitle);
  const [manualValue, setManualValue] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [showProductTooltip, setShowProductTooltip] = useState(false);
  const [showProgramTooltip, setShowProgramTooltip] = useState(false);

  useEffect(() => {
    setTitleDraft(plan.titlePage.planTitle);
  }, [plan.titlePage.planTitle]);

  const commitTitlePageChange = (updates: Partial<TitlePage>) => {
    onUpdateTitlePage({ ...plan.titlePage, ...updates });
  };

  const headerCardClasses =
    'relative h-24 space-y-1 rounded-lg border border-blue-600/50 overflow-hidden px-2.5 py-1.5 shadow-xl backdrop-blur-xl';

  const selectedProductMeta =
    productOptions.find((option) => option.value === plan.productType) ?? productOptions[0];

  const handleManualConnect = () => {
    setManualError(null);
    const normalized = normalizeProgramInput(manualValue);
    if (!normalized) {
      setManualError(connectCopy.error);
      return;
    }
    onConnectProgram(normalized);
  };

  return (
    <div className="flex flex-col md:flex-row gap-3 w-full">
      {/* Plan Title */}
      <Card className={`${headerCardClasses} flex-1 flex flex-col`}>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-900 to-slate-800" />
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center justify-between gap-2 h-6 mb-3">
            <p className="text-xl font-bold uppercase tracking-wider text-white">
              {t('editor.header.planTitle' as any) as string || 'Plan Title'}
            </p>
            <Button variant="ghost" size="sm" className="text-blue-100 hover:text-white text-xs h-6 px-2" onClick={onOpenFrontMatter}>
              {t('editor.ui.edit' as any) as string || 'Edit'}
            </Button>
          </div>
          <div className="flex-1 flex items-center">
            <input
              value={titleDraft}
              onChange={(event) => setTitleDraft(event.target.value)}
              onBlur={() => {
                const next = titleDraft.trim() || 'Business Plan';
                if (next !== plan.titlePage.planTitle) {
                  commitTitlePageChange({ planTitle: next });
                } else {
                  setTitleDraft(plan.titlePage.planTitle);
                }
              }}
              className="w-full rounded border border-slate-200 bg-white px-2.5 py-2 h-8 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
              placeholder={t('editor.ui.planNamePlaceholder' as any) as string || 'Plan name'}
            />
          </div>
        </div>
      </Card>

      {/* Product Type Selector */}
      <Card className={`${headerCardClasses} flex-1 flex flex-col`}>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-900 to-slate-800" />
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-1.5 h-6 mb-3">
            <span className="text-xl font-bold uppercase tracking-wider text-white">
              {t('editor.header.productType' as any) as string || 'Product Type'}
            </span>
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setShowProductTooltip(true)}
                onMouseLeave={() => setShowProductTooltip(false)}
                className="text-white hover:text-blue-100 text-xs font-bold w-4 h-4 rounded-full border border-white/50 bg-white/20 flex items-center justify-center"
              >
                ?
              </button>
              {showProductTooltip && (
                <div className="absolute z-50 left-0 top-5 w-64 p-2 bg-slate-900 text-white text-xs rounded shadow-lg border border-slate-700">
                  {selectedProductMeta?.description}
                </div>
              )}
            </div>
          </div>
          <div className="relative flex-1 flex items-center">
            <select
              value={plan.productType ?? 'submission'}
              onChange={(event) => onChangeProduct(event.target.value as ProductType)}
              className="w-full appearance-none rounded border border-slate-300 bg-white px-2.5 h-8 text-sm font-bold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-400"
              style={{ paddingTop: 0, paddingBottom: 0, lineHeight: '2rem' }}
            >
              {productOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-slate-600 text-xs font-bold">
              ▾
            </span>
          </div>
        </div>
      </Card>

      {/* Program Connection */}
      <Card className={`${headerCardClasses} flex-1 flex flex-col`}>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-900 to-slate-800" />
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-1.5 h-6 mb-3">
            <p className="text-xl font-bold uppercase tracking-wider text-white">
              {connectCopy.badge}
            </p>
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setShowProgramTooltip(true)}
                onMouseLeave={() => setShowProgramTooltip(false)}
                className="text-white hover:text-blue-100 text-xs font-bold w-4 h-4 rounded-full border border-white/50 bg-white/20 flex items-center justify-center"
              >
                ?
              </button>
              {showProgramTooltip && (
                <div className="absolute z-50 left-0 top-5 w-64 p-2 bg-slate-900 text-white text-xs rounded shadow-lg border border-slate-700">
                  {connectCopy.description}
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 flex items-center">
            {programSummary ? (
              <div className="w-full rounded border border-blue-300 bg-blue-100/60 px-2 py-1.5 h-8 flex items-center">
                <div className="flex items-center justify-between gap-2 w-full">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-blue-900 truncate">{programSummary.name}</p>
                    {programSummary.amountRange && (
                      <p className="text-[10px] text-blue-800 mt-0.5">{programSummary.amountRange}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-800 hover:text-blue-900 text-xs h-6 px-1 flex-shrink-0"
                    onClick={() => onConnectProgram(null)}
                  >
                    ×
                  </Button>
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-wrap gap-1.5">
                <button
                  onClick={onOpenProgramFinder}
                  className="inline-flex items-center justify-center px-4 py-0 h-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg text-xs"
                >
                  {connectCopy.openFinder}
                </button>
                <button
                  onClick={() => setShowManualInput((prev) => !prev)}
                  className="inline-flex items-center justify-center px-4 py-0 h-8 border-2 border-white/30 hover:border-white/50 text-white font-semibold rounded-lg transition-colors duration-200 backdrop-blur-sm hover:bg-white/10 text-xs"
                >
                  {connectCopy.pasteLink}
                </button>
              </div>
            )}
          </div>
        </div>
        {showManualInput && !programSummary && (
          <div className="space-y-1 mt-1.5">
            <label className="text-[10px] font-semibold text-slate-800 block">
              {connectCopy.inputLabel}
            </label>
            <div className="flex flex-col gap-1.5 sm:flex-row">
              <input
                value={manualValue}
                onChange={(event) => setManualValue(event.target.value)}
                placeholder={connectCopy.placeholder}
                className="flex-1 rounded border border-slate-300 bg-white px-2 py-1.5 h-8 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              <Button
                type="button"
                size="sm"
                className="sm:w-auto text-xs h-8 px-3"
                onClick={handleManualConnect}
                disabled={programLoading}
              >
                {programLoading ? '...' : connectCopy.submit}
              </Button>
            </div>
            <p className="text-[10px] text-slate-600">{connectCopy.example}</p>
            {(manualError || programError) && (
              <p className="text-[10px] text-red-600">{manualError || programError}</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function SectionNavigationBar({
  plan,
  activeSectionId,
  onSelectSection
}: {
  plan: BusinessPlan;
  activeSectionId: string | null;
  onSelectSection: (sectionId: string) => void;
}) {
  const { t } = useI18n();
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  
  const getSectionTitle = (sectionId: string, originalTitle: string): string => {
    if (sectionId === ANCILLARY_SECTION_ID) {
      return (t('editor.section.front_back_matter' as any) as string) || 'Front & Back Matter';
    }
    const translationKey = `editor.section.${sectionId}` as any;
    const translated = t(translationKey) as string;
    return translated || originalTitle;
  };
  
  const sections = [
    ...plan.sections.map(s => ({ ...s, title: getSectionTitle(s.id, s.title) })),
    {
      id: ANCILLARY_SECTION_ID,
      title: getSectionTitle(ANCILLARY_SECTION_ID, 'Front & Back Matter'),
      progress: undefined,
      questions: []
    }
  ];

  const scrollBy = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: direction === 'left' ? -240 : 240, behavior: 'smooth' });
    }
  };

  const handleKeyNavigation = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      scrollBy('left');
      event.preventDefault();
    }
    if (event.key === 'ArrowRight') {
      scrollBy('right');
      event.preventDefault();
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => scrollBy('left')}
        aria-label="Scroll sections left"
        className="border border-white/30 bg-white/10 hover:bg-white/20 text-white flex-shrink-0"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>
      <div
        ref={scrollContainerRef}
        className="flex flex-1 items-center gap-1 overflow-x-auto scrollbar-hide"
        role="tablist"
        aria-label="Plan sections"
        tabIndex={0}
        onKeyDown={handleKeyNavigation}
      >
        {sections.map((section, index) => {
          const totalQuestions = section.questions.length;
          const answeredQuestions = section.questions.filter((question) => question.status === 'complete').length;
          const completion =
            section.progress ??
            (totalQuestions === 0 ? 0 : Math.round((answeredQuestions / totalQuestions) * 100));
          const isAncillary = section.id === ANCILLARY_SECTION_ID;
          const isActive = section.id === activeSectionId;
          const progressIntent: 'success' | 'warning' | 'neutral' =
            completion === 100 ? 'success' : completion > 0 ? 'warning' : 'neutral';

          return (
            <button
              key={section.id}
              onClick={() => onSelectSection(section.id)}
              aria-current={isActive ? 'page' : undefined}
              role="tab"
              className={`min-w-[200px] rounded-xl border-2 px-4 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                isActive
                  ? 'border-blue-400 bg-blue-500/30 text-white shadow-xl shadow-blue-900/30 backdrop-blur-md'
                  : 'border-white/50 bg-blue-400/20 text-white hover:border-blue-300/70 hover:bg-blue-400/30 backdrop-blur-sm'
              }`}
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  {!isAncillary && <span className="text-xs font-bold tracking-[0.2em] text-white drop-shadow-sm">{String(index + 1).padStart(2, '0')}</span>}
                  <span className="text-xs font-bold text-white drop-shadow-sm">{completion}%</span>
                </div>
                <Progress value={completion} intent={progressIntent} size="xs" />
                <p className="text-base font-bold leading-snug text-white drop-shadow-sm">{section.title}</p>
              </div>
            </button>
          );
        })}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => scrollBy('right')}
        aria-label="Scroll sections right"
        className="border border-white/30 bg-white/10 hover:bg-white/20 text-white flex-shrink-0"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}

function getSectionHint(section?: Section, t?: (key: any) => string) {
  if (!section) return '';
  const key = (section.category ?? '').toLowerCase();
  const hintKey = `editor.ui.hint.${key}` as any;
  const translated = t ? (t(hintKey) as string) : null;
  if (translated && translated !== hintKey) return translated;
  return SECTION_TONE_HINTS[key] ?? (t ? (t('editor.ui.hint.default' as any) as string) : 'Keep paragraphs tight, highlight the why, and point to data or KPIs when possible.');
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
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <div className="card bg-white lg:sticky lg:top-4 lg:z-10">
        <p className="text-[11px] tracking-[0.35em] uppercase text-neutral-500">Ancillary</p>
        <h1 className="text-2xl font-semibold text-neutral-900 mt-1">{t('editor.section.front_back_matter' as any) as string || 'Front & Back Matter'}</h1>
        <p className="text-sm text-neutral-600 mt-2">
          Maintain the title page, table of contents, references, and appendices in one cohesive workspace. These
          elements frame the narrative, so keeping them aligned here speeds up reviews.
        </p>
      </div>
      <div className="card bg-surface">
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
  );
}

function SectionWorkspace({
  section,
  onAnswerChange,
  onSelectQuestion,
  activeQuestionId,
  onAskAI,
  onToggleUnknown,
  onMarkComplete
}: {
  section?: Section;
  onAnswerChange: (questionId: string, content: string) => void;
  onSelectQuestion: (questionId: string) => void;
  activeQuestionId: string | null;
  onAskAI: (questionId?: string) => void;
  onToggleUnknown: (questionId: string, note?: string) => void;
  onMarkComplete: (questionId: string) => void;
}) {
  const { t } = useI18n();

  if (!section) {
    return (
      <div className="rounded-3xl border border-dashed border-neutral-200 bg-white p-12 text-center text-sm text-neutral-500">
        {t('editor.ui.selectSection' as any) as string || 'Select a section to begin.'}
      </div>
    );
  }

  const getSectionTitle = (sectionId: string, originalTitle: string): string => {
    if (sectionId === ANCILLARY_SECTION_ID) {
      return (t('editor.section.front_back_matter' as any) as string) || 'Front & Back Matter';
    }
    const translationKey = `editor.section.${sectionId}` as any;
    const translated = t(translationKey) as string;
    // Handle special case for project_description which might have different titles
    if (sectionId === 'project_description' && originalTitle.includes('/')) {
      return (t('editor.section.project_description_business_concept' as any) as string) || originalTitle;
    }
    return translated || originalTitle;
  };

  const sectionHint = getSectionHint(section, t);
  const activeQuestion =
    section.questions.find((q) => q.id === activeQuestionId) ?? section.questions[0] ?? null;
  const translatedTitle = getSectionTitle(section.id, section.title);

  return (
    <main className="space-y-1">
      {/* Section Header */}
      <Card className="space-y-1 border border-blue-600/50 relative overflow-hidden backdrop-blur-lg shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-blue-900 to-slate-950" />
        <div className="absolute inset-0 bg-black/20 backdrop-blur-xl" />
        <div className="relative z-10">
          {section.category && (
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-white">
              {(t(`editor.ui.category.${section.category.toLowerCase()}` as any) as string) || section.category.toUpperCase()}
            </p>
          )}
          <h1 className="text-3xl font-semibold text-white leading-tight drop-shadow-lg">{translatedTitle}</h1>
          {(sectionHint || section.description) && (
            <p className="text-sm text-white leading-relaxed">{sectionHint || section.description}</p>
          )}
        </div>
      </Card>

      {/* Single Active Prompt Block */}
      {activeQuestion && (
        <QuestionCard
          question={activeQuestion}
          section={section}
          activeQuestionId={activeQuestionId}
          isActive={true}
          panelId={`question-panel-${activeQuestion.id}`}
          onFocus={() => onSelectQuestion(activeQuestion.id)}
          onSelectQuestion={onSelectQuestion}
          onChange={(content) => onAnswerChange(activeQuestion.id, content)}
          onAskAI={() => onAskAI(activeQuestion.id)}
          onToggleUnknown={(note) => onToggleUnknown(activeQuestion.id, note)}
          onMarkComplete={onMarkComplete}
        />
      )}
    </main>
  );
}

function QuestionCard({
  question,
  section,
  activeQuestionId,
  isActive,
  panelId,
  onFocus,
  onSelectQuestion,
  onChange,
  onAskAI,
  onToggleUnknown,
  onMarkComplete
}: {
  question: Question;
  section?: Section;
  activeQuestionId: string | null;
  isActive: boolean;
  panelId?: string;
  onFocus: () => void;
  onSelectQuestion: (questionId: string) => void;
  onChange: (content: string) => void;
  onAskAI: () => void;
  onToggleUnknown: (note?: string) => void;
  onMarkComplete: (questionId: string) => void;
}) {
  const { t } = useI18n();
  const { plan, setActiveSection } = useEditorStore();
  const isUnknown = question.status === 'unknown';
  const isComplete = question.status === 'complete';
  const isDraft = question.status === 'draft';
  const hasContent = isComplete || isDraft;
  const [isUnknownModalOpen, setUnknownModalOpen] = useState(false);
  const isLastQuestion = section && section.questions.length > 0 && section.questions[section.questions.length - 1].id === question.id;
  const isSectionComplete = section && section.questions.every(q => q.status === 'complete');

  const handleToggleUnknown = (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.stopPropagation();
    if (isUnknown) {
      onToggleUnknown();
      return;
    }
    setUnknownModalOpen(true);
  };

  return (
    <>
      <Card
        id={panelId}
        role="tabpanel"
        aria-live="polite"
        className={`space-y-2 border transition-all relative overflow-hidden backdrop-blur-lg shadow-xl ${
          'border-blue-600/50'
        } ${isActive && !hasContent ? 'border-blue-400 ring-1 ring-blue/20 shadow-2xl' : ''}`}
        onClick={onFocus}
      >
        {/* Always show gradient blue background - no white overlay for completed questions */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-blue-900 to-slate-950" />
        <div className="absolute inset-0 bg-black/15 backdrop-blur-xl" />
        {/* Question Navigation Tabs in Header */}
        {section && section.questions.length > 1 && (
          <div className="pb-1.5 border-b border-white/30 mb-1.5 relative z-10">
            <div className="mb-3">
              <h2 className="text-xl font-bold uppercase tracking-wider text-white">{t('editor.header.prompts' as any) as string || 'Prompts'}</h2>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto" role="tablist" aria-label="Section prompts">
              {section.questions.map((q, index) => {
                const isActiveTab = q.id === activeQuestionId;
                const status = q.status;
                const intentClasses =
                  status === 'complete'
                    ? 'text-white'
                    : status === 'unknown'
                    ? 'text-red-300'
                    : status === 'draft'
                    ? 'text-blue-300'
                    : 'text-white/80';
                const icon =
                  status === 'complete' ? (
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                  ) : status === 'unknown' ? (
                    <QuestionMarkCircleIcon className="h-3.5 w-3.5" />
                  ) : (
                    <EllipsisHorizontalIcon className="h-3.5 w-3.5" />
                  );

                return (
                  <button
                    key={q.id}
                    role="tab"
                    aria-selected={isActiveTab}
                    aria-controls={`question-panel-${q.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectQuestion(q.id);
                    }}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 relative ${
                      isActiveTab
                        ? 'border-blue-400 bg-blue-500/30 text-white shadow-lg shadow-blue-900/30 backdrop-blur-md'
                        : 'border-white/50 bg-white/10 text-white/80 hover:border-blue-300/70 hover:bg-white/20 backdrop-blur-sm'
                    }`}
                  >
                    <span>{index + 1}</span>
                    <span className={`flex items-center gap-1 ${intentClasses}`}>{icon}</span>
                    {status === 'complete' && (
                      <CheckCircleIcon className="h-4 w-4 text-green-500 absolute -top-1 -right-1 bg-slate-900 rounded-full p-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Prompt Header */}
        <div className="flex items-start justify-between gap-2 relative z-10">
          <p className={`text-2xl font-semibold leading-snug flex-1 drop-shadow-lg ${isComplete ? 'text-white' : 'text-white'}`}>{question.prompt}</p>
          <div className="flex flex-wrap gap-1.5 flex-shrink-0">
            {question.required && <Badge variant="danger" className={`text-xs ${isComplete ? 'bg-white/30 text-white border-white/50' : ''}`}>{t('editor.ui.required' as any) as string || 'Required'}</Badge>}
            {isUnknown && (
              <Badge variant="warning" className={`text-xs ${isComplete ? 'bg-white/30 text-white border-white/50' : ''}`}>
                {t('editor.ui.unknown' as any) as string || 'Unknown'}{question.statusNote ? ` — ${question.statusNote}` : ''}
              </Badge>
            )}
          </div>
        </div>

        {/* Text Editor */}
        <div onClick={(e) => e.stopPropagation()} className="relative z-10 mb-4">
          <SimpleTextEditor
            content={question.answer ?? ''}
            onChange={onChange}
            placeholder={question.placeholder}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-1.5 relative z-10 border-t border-white/15 pt-3 mt-2" onClick={(e) => e.stopPropagation()}>
          {!isComplete && (
            <Button
              type="button"
              variant="success"
              onClick={() => onMarkComplete(question.id)}
              className="min-w-[180px] justify-center text-base bg-green-700 hover:bg-green-800 text-white font-semibold uppercase tracking-wide rounded-lg shadow-lg hover:shadow-xl drop-shadow-lg transition-colors flex items-center gap-2"
            >
              {t('editor.ui.complete' as any) as string || 'Complete'}
            </Button>
          )}
          {isLastQuestion && (
            <Button
              type="button"
              onClick={() => {
                if (!isComplete) {
                  onMarkComplete(question.id);
                }
                const currentSectionIndex = plan?.sections.findIndex(s => s.id === section?.id) ?? -1;
                const nextSection = plan?.sections[currentSectionIndex + 1];
                if (nextSection) {
                  setActiveSection(nextSection.id);
                }
              }}
              variant="success"
              className="min-w-[180px] justify-center text-base bg-green-700 hover:bg-green-800 text-white font-semibold uppercase tracking-wide border border-green-700 rounded-lg shadow-lg hover:shadow-xl drop-shadow-lg"
            >
              {isSectionComplete 
                ? (t('editor.ui.nextSection' as any) as string || 'Next Section')
                : (t('editor.ui.completeSection' as any) as string || 'Complete Section')
              }
            </Button>
          )}
          {!isComplete ? (
            <Button
              type="button"
              variant="outline"
              className={`min-w-[180px] justify-center text-sm text-white ${isDraft ? 'border-white/50 hover:bg-white/15' : 'border-white/40 hover:bg-white/10'}`}
              onClick={handleToggleUnknown}
            >
              {isUnknown ? (t('editor.ui.clearUnknownStatus' as any) as string || 'Clear unknown status') : (t('editor.ui.markAsUnknown' as any) as string || 'Mark as unknown')}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="min-w-[180px] justify-center text-sm text-white border-white/60 hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                onFocus();
              }}
            >
              {t('editor.ui.edit' as any) as string || 'Edit'}
            </Button>
          )}
        </div>
      </Card>
      <UnknownNoteModal
        open={isUnknownModalOpen}
        onClose={() => setUnknownModalOpen(false)}
        onSave={(note) => {
          onToggleUnknown(note);
          setUnknownModalOpen(false);
        }}
      />
    </>
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
  onAskAI,
  onAnswerChange
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
  onAskAI: (questionId?: string, options?: AISuggestionOptions) => void;
  onAnswerChange: (questionId: string, content: string) => void;
}) {
  const [requirementsChecked, setRequirementsChecked] = React.useState(false);
  // Map 'requirements' view to 'preview' for backward compatibility
  const activeView = view === 'requirements' ? 'preview' : view;
  const effectiveView = (['ai', 'data', 'preview'].includes(activeView) ? activeView : 'ai') as 'ai' | 'data' | 'preview';

  const handleQuickAsk = (intent: AISuggestionIntent) => {
    if (!question) return;
    onAskAI(question.id, { intent });
  };

  const handleAskForStructure = () => {
    if (!question) return;
    setView('ai');
    onAskAI(question.id, { intent: 'data' });
  };

  const { t } = useI18n();
  const tabs: Array<{ key: 'ai' | 'data' | 'preview'; label: string }> = [
    { key: 'ai', label: (t('editor.ui.tabs.assistant' as any) as string) || 'Assistant' },
    { key: 'data', label: (t('editor.ui.tabs.data' as any) as string) || 'Data' },
    { key: 'preview', label: (t('editor.ui.tabs.preview' as any) as string) || 'Preview' }
  ];

  return (
    <aside className="card sticky top-24 space-y-1.5 w-full lg:w-[400px] border-blue-600/50 relative overflow-hidden backdrop-blur-lg shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-blue-900 to-slate-950" />
      <div className="absolute inset-0 bg-black/15 backdrop-blur-xl" />
      <div className="relative z-10">
        <div className="flex gap-1.5" role="tablist" aria-label="Editor tools">
          {tabs.map(({ key, label }) => {
            const isActive = effectiveView === key;
            return (
              <Button
                key={key}
                role="tab"
                aria-selected={isActive}
                aria-controls={`right-panel-${key}`}
                variant="ghost"
                size="sm"
                className={`flex-1 justify-center rounded-lg border text-xs ${
                  isActive ? 'border-blue-600 bg-blue-600 hover:bg-blue-700 text-white shadow-lg' : 'border-white/30 text-white/80 hover:text-white hover:bg-white/10'
                }`}
                onClick={() => setView(key)}
              >
                {label}
              </Button>
            );
          })}
        </div>
      <div
        id={`right-panel-${effectiveView}`}
        role="tabpanel"
        className="max-h-[70vh] overflow-y-auto pr-1 space-y-1.5"
      >
        {effectiveView === 'ai' && (
          <div className="space-y-3">
            {question && (
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs font-medium text-white/70 mb-1.5 uppercase tracking-wide">{t('editor.ui.currentQuestion' as any) as string || 'Current question'}</p>
                  <p className="font-semibold text-white leading-snug mb-1.5 text-base">{question.prompt}</p>
                      <p className="text-xs text-white/70">
                        {t('editor.ui.status' as any) as string || 'Status'}: <span className="font-medium text-white">{question.status}</span>
                        {question.status === 'blank' || question.status === 'unknown'
                          ? ` (${t('editor.ui.aiFocusGuidance' as any) as string || 'AI will focus on guidance'})`
                          : ` (${t('editor.ui.aiFocusCritique' as any) as string || 'AI will focus on critique'})`}
                      </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAsk('outline')}
                      disabled={!question}
                    >
                      Draft outline
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAsk('improve')}
                      disabled={!question}
                    >
                      Improve answer
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAsk('data')}
                      disabled={!question}
                    >
                      {t('editor.ui.suggestDataKPIs' as any) as string || 'Suggest data/KPIs'}
                    </Button>
                  </div>
                </div>
                {question.answer ? (
                  <div className="bg-white/10 rounded-lg p-3 border border-white/20">
                    <p className="text-xs font-medium text-white/90 mb-2">Answer preview</p>
                    <p className="text-white text-sm leading-relaxed mb-2">{question.answer.substring(0, 200)}...</p>
                    <p className="text-xs text-white/70">
                      {question.answer.split(/\s+/).length} words
                    </p>
                  </div>
                ) : (
                  <p className="text-white/80 text-sm leading-relaxed bg-white/5 rounded-lg p-3 border border-white/10">
                    {t('editor.ui.startTypingHint' as any) as string || 'Start typing to provide context—the assistant draws on previous answers, datasets, and program requirements.'}
                  </p>
                )}
                {question.suggestions && question.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-white">Latest response</p>
                    {question.suggestions.slice(-1).map((suggestion, index) => (
                      <div key={index} className="border border-white/30 bg-white/10 rounded-lg p-2.5 backdrop-blur-sm">
                        <p className="text-sm text-white mb-2 leading-relaxed">{suggestion}</p>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(suggestion)}
                            className="text-white hover:text-white hover:bg-white/10"
                          >
                            Copy
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const latestSuggestion = question.suggestions?.[question.suggestions.length - 1];
                              if (latestSuggestion && question) {
                                const currentAnswer = question.answer ?? '';
                                const newContent = currentAnswer
                                  ? `${currentAnswer}\n\n${latestSuggestion}`
                                  : latestSuggestion;
                                onAnswerChange(question.id, newContent);
                              }
                            }}
                            className="text-white hover:text-white hover:bg-white/10"
                          >
                            {t('editor.ui.insert' as any) as string || 'Insert'}
                          </Button>
                        </div>
                      </div>
                    ))}
                    {question.suggestions.length > 1 && (
                      <button
                        onClick={() => {
                          // TODO: Implement conversation history modal
                          console.log('View full conversation');
                        }}
                        className="text-xs text-blue-300 hover:text-blue-200 font-medium"
                      >
                        View full conversation ({question.suggestions.length} responses)
                      </button>
                    )}
                  </div>
                )}
                {/* Quick Actions */}
                {question && question.answer && (
                  <div className="space-y-2 pt-2 border-t border-white/20">
                    <p className="text-xs font-medium text-white">Quick actions</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['Tone', 'Translate', 'Summarize', 'Expand'].map((action) => (
                        <Button
                          key={action}
                          variant="outline"
                          size="sm"
                          onClick={() => console.log(`Quick action: ${action}`)}
                          className="border-white/40 text-white hover:text-white hover:bg-white/10"
                        >
                          {action}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {!question && (
              <div className="text-center py-8 text-slate-400 text-sm">
                {t('editor.ui.selectQuestion' as any) as string || 'Select a question to receive AI suggestions.'}
              </div>
            )}
          </div>
        )}

        {/* Data Tab */}
        {effectiveView === 'data' && (
          <div className="space-y-4">
            {section ? (
              <DataPanel
                datasets={section.datasets ?? []}
                kpis={section.kpis ?? []}
                media={section.media ?? []}
                onDatasetCreate={onDatasetCreate}
                onKpiCreate={onKpiCreate}
                onMediaCreate={onMediaCreate}
                activeQuestionId={question?.id}
                sectionId={section.id}
                sectionTitle={section.title}
                onAttachDataset={onAttachDataset}
                onAttachKpi={onAttachKpi}
                onAttachMedia={onAttachMedia}
                onAskForStructure={handleAskForStructure}
              />
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm">
                Choose a section to manage datasets, KPIs, and media.
              </div>
            )}
          </div>
        )}

        {/* Preview Tab (with Requirements) */}
        {effectiveView === 'preview' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <PreviewPane plan={plan} focusSectionId={section?.id} />
            </div>
            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-700">Requirements validation</p>
                <Button
                  size="sm"
                  onClick={() => {
                    setRequirementsChecked(true);
                    onRunRequirements();
                  }}
                >
                  Run check
                </Button>
              </div>
              {!requirementsChecked ? (
                <p className="text-gray-500 text-xs">Run the checker to view validation status.</p>
              ) : (
                <div className="space-y-3">
                  {/* Current Question Validation (if selected) */}
                  {section && question && (() => {
                    // Get template for validation - access store directly
                    const { templates } = useEditorStore.getState();
                    const template = templates.find((t) => t.id === section.id);
                    const validation = validateQuestionRequirements(question, section, template);
                    
                    if (validation.issues.length === 0) {
                      return (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-green-600 text-sm">✓</span>
                            <p className="text-xs font-semibold text-green-700">{t('editor.ui.currentQuestionPasses' as any) as string || 'Current question passes validation'}</p>
                          </div>
                          <p className="text-xs text-green-600 mt-1">{t('editor.ui.validation.allRequirementsMet' as any) as string || 'All requirements are met for this prompt.'}</p>
                        </div>
                      );
                    }
                    
                    const errors = validation.issues.filter((i) => i.severity === 'error');
                    const warnings = validation.issues.filter((i) => i.severity === 'warning');
                    
                    return (
                      <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-slate-700">Current question</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                            errors.length > 0 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {errors.length > 0 ? `${errors.length} error${errors.length > 1 ? 's' : ''}` : `${warnings.length} warning${warnings.length > 1 ? 's' : ''}`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2">{question.prompt}</p>
                        <div className="space-y-1.5">
                          {errors.map((issue, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs">
                              <span className="text-red-600 mt-0.5">●</span>
                              <p className="text-red-700 flex-1">{issue.message}</p>
                            </div>
                          ))}
                          {warnings.map((issue, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs">
                              <span className="text-amber-600 mt-0.5">●</span>
                              <p className="text-amber-700 flex-1">{issue.message}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* Overall Summary */}
                  {progressSummary.length > 0 && (() => {
                    const overallProgress = Math.round(
                      progressSummary.reduce((sum, item) => sum + item.progress, 0) / progressSummary.length
                    );
                    const incompleteCount = progressSummary.filter((item) => item.progress < 100).length;
                    const mandatoryMissing = progressSummary.filter((item) => item.progress === 0).length;
                    
                    return (
                      <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700">Overall completion</span>
                          <span className={`text-sm font-bold ${overallProgress === 100 ? 'text-green-600' : 'text-amber-600'}`}>
                            {overallProgress}%
                          </span>
                        </div>
                        {mandatoryMissing > 0 && (
                          <p className="text-xs text-red-600 font-medium">
                            {mandatoryMissing} mandatory field{mandatoryMissing > 1 ? 's' : ''} missing
                          </p>
                        )}
                        {incompleteCount > 0 && mandatoryMissing === 0 && (
                          <p className="text-xs text-amber-600 font-medium">
                            {incompleteCount} section{incompleteCount > 1 ? 's' : ''} need{incompleteCount === 1 ? 's' : ''} attention
                          </p>
                        )}
                      </div>
                    );
                  })()}
                  
                  {/* Per-Section Accordion */}
                  {progressSummary.length > 0 && (
                    <div className="space-y-2">
                      {progressSummary.map((item) => {
                        const [isExpanded, setIsExpanded] = React.useState(false);
                        const hasIssues = item.progress < 100;
                        const sectionData = plan.sections.find((s) => s.id === item.id);
                        const { templates } = useEditorStore.getState();
                        const template = templates.find((t) => t.id === item.id);
                        
                        return (
                          <div key={item.id} className="border border-slate-200 rounded-lg overflow-hidden">
                            <button
                              onClick={() => setIsExpanded(!isExpanded)}
                              className="w-full flex items-center justify-between p-2 hover:bg-slate-50 transition text-left"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="text-xs text-slate-600 truncate">{item.title}</span>
                                {hasIssues && (
                                  <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-semibold">
                                    Needs attention
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`text-xs font-semibold ${item.progress === 100 ? 'text-green-600' : 'text-amber-600'}`}>
                                  {item.progress}%
                                </span>
                                <span className="text-xs text-slate-400">{isExpanded ? '▼' : '▶'}</span>
                              </div>
                            </button>
                            {isExpanded && sectionData && (
                              <div className="px-2 pb-2 space-y-2 border-t border-slate-100">
                                <div className="h-1.5 bg-slate-100 rounded-full mt-2">
                                  <div
                                    className={`h-full rounded-full ${
                                      item.progress === 100 ? 'bg-green-500' : 'bg-amber-500'
                                    }`}
                                    style={{ width: `${item.progress}%` }}
                                  />
                                </div>
                                {/* Per-question validation details */}
                                <div className="space-y-2 mt-2">
                                  {sectionData.questions.map((q) => {
                                    const qValidation = validateQuestionRequirements(q, sectionData, template);
                                    if (qValidation.issues.length === 0) return null;
                                    const errors = qValidation.issues.filter((i) => i.severity === 'error');
                                    const warnings = qValidation.issues.filter((i) => i.severity === 'warning');
                                    return (
                                      <div key={q.id} className="bg-slate-50 rounded p-2 space-y-1">
                                        <p className="text-[11px] font-semibold text-slate-700 line-clamp-1">{q.prompt}</p>
                                        <div className="space-y-0.5">
                                          {errors.map((issue, idx) => (
                                            <p key={idx} className="text-[10px] text-red-600">● {issue.message}</p>
                                          ))}
                                          {warnings.map((issue, idx) => (
                                            <p key={idx} className="text-[10px] text-amber-600">● {issue.message}</p>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                {hasIssues && sectionData.questions.every((q) => {
                                  const qValidation = validateQuestionRequirements(q, sectionData, template);
                                  return qValidation.issues.length === 0;
                                }) && (
                                  <p className="text-xs text-slate-500">
                                    {item.progress === 0 
                                      ? 'This section has not been started yet.'
                                      : `This section is ${100 - item.progress}% incomplete. Please review and complete all required prompts.`}
                                  </p>
                                )}
                                {item.progress === 100 && (
                                  <p className="text-xs text-green-600">✓ All requirements met for this section.</p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
    </aside>
  );
}

function UnknownNoteModal({
  open,
  onClose,
  onSave
}: {
  open: boolean;
  onClose: () => void;
  onSave: (note?: string) => void;
}) {
  const { t } = useI18n();
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      setNote('');
    }
  }, [open]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 px-4">
      <div
        className="card max-w-md w-full space-y-4"
        role="dialog"
        aria-modal="true"
        aria-label={t('editor.ui.unknownNoteLabel' as any) as string || 'Add note explaining unknown status'}
      >
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-neutral-900">{t('editor.ui.unknownNoteLabel' as any) as string || 'Add a note'}</h2>
          <p className="text-sm text-neutral-600">
            {t('editor.ui.unknownNoteDescription' as any) as string || 'Explain why this answer is marked as unknown so collaborators understand the gap.'}
          </p>
        </div>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-400 focus:ring-2 focus:ring-primary/30"
          rows={4}
          placeholder={t('editor.ui.unknownNotePlaceholder' as any) as string || 'Optional note'}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('editor.ui.cancel' as any) as string || 'Cancel'}
          </Button>
          <Button
            type="button"
            onClick={() => onSave(note.trim() ? note.trim() : undefined)}
          >
            {t('editor.ui.saveNote' as any) as string || 'Save note'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ============================================================================
// SIMPLE TEXT EDITOR COMPONENT (merged inline)
// ============================================================================

function SimpleTextEditor({
  content,
  onChange,
  placeholder
}: {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}) {
  const [isFocused, setIsFocused] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div
      className={`rounded-2xl border backdrop-blur-xl transition-all duration-200 shadow-[inset_0_1px_8px_rgba(15,23,42,0.5)] bg-slate-950/60 ${
        isFocused ? 'border-blue-400/70 ring-1 ring-blue/30 shadow-[inset_0_1px_12px_rgba(30,64,175,0.45)]' : 'border-white/15'
      }`}
      onClick={() => textareaRef.current?.focus()}
    >
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder || 'Start writing...'}
        aria-label={placeholder || 'Prompt response'}
        className="w-full resize-none bg-transparent p-4 text-sm leading-relaxed text-white/95 placeholder:text-white/40 focus:outline-none md:min-h-[120px] min-h-[90px]"
        style={{
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          lineHeight: '1.7',
          fontSize: '14px'
        }}
      />
    </div>
  );
}

