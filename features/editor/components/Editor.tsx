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
  ConversationMessage,
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

      // Auto-select Section 2 (Project Description) as recommended starting point
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
  template?: SectionTemplate
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
      message: 'Required question is still blank. Provide an answer or mark as unknown with a note.'
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
    <div className="min-h-screen bg-[#f6f8fb]">
      <header className="border-b-2 border-slate-200 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12 py-4">
          <PlanConfigurator
            plan={plan}
            programSummary={programSummary ?? plan.programSummary ?? null}
            onChangeProduct={handleProductChange}
            onConnectProgram={handleConnectProgram}
            onOpenProgramFinder={() => router.push('/reco')}
            programLoading={programLoading}
            programError={programError}
          />
        </div>
      </header>

      {/* Section Navigation Bar */}
      <div className="border-b-2 border-slate-200 bg-white sticky top-0 z-30 shadow-sm">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
          <SectionNavigationBar
            plan={plan}
            activeSectionId={activeSectionId ?? plan.sections[0]?.id ?? null}
            onSelectSection={setActiveSection}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12 py-8 flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex-1 min-w-0">
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
            />
          )}
        </div>

        <div className="w-full lg:w-[360px] flex-shrink-0">
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
    <div className="flex items-center justify-between gap-6">
      <div className="flex items-center gap-6 flex-1">
        <div>
          <p className="text-base font-semibold text-slate-900 leading-tight">{plan.titlePage.planTitle || 'Business Plan'}</p>
        </div>
        <label className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600 whitespace-nowrap">Product type:</span>
          <div className="relative">
            <select
              value={plan.productType ?? 'submission'}
              onChange={(event) => onChangeProduct(event.target.value as ProductType)}
              className="appearance-none rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
            >
              {PRODUCT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-400 text-xs">▾</span>
          </div>
        </label>
      </div>
      <div className="flex-shrink-0">
        <div className="relative">
          <ProgramConnectionCard
            programSummary={programSummary}
            onConnectProgram={onConnectProgram}
            onOpenProgramFinder={onOpenProgramFinder}
            loading={programLoading}
            error={programError}
          />
        </div>
      </div>
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
  const [isExpanded, setIsExpanded] = useState(false);
  useEffect(() => {
    if (programSummary) {
      setInputValue('');
      setIsExpanded(false);
    }
  }, [programSummary]);

  if (programSummary) {
    return (
      <div className="flex items-center gap-2">
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5">
          <p className="text-xs font-medium text-blue-900 leading-tight">{programSummary.name}</p>
        </div>
        <button
          onClick={() => onConnectProgram(null)}
          className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
          title="Disconnect program"
        >
          ×
        </button>
      </div>
    );
  }

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="text-xs text-slate-600 hover:text-slate-900 px-3 py-1.5 border border-slate-200 rounded-lg hover:border-slate-300 transition"
      >
        Connect program
      </button>
    );
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-lg p-3 space-y-2 z-50">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-800">Connect program</p>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-xs text-slate-400 hover:text-slate-600"
        >
          ×
        </button>
      </div>
      <div className="flex gap-2">
        <input
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder="Program ID (e.g., page_123)"
          className="flex-1 border border-slate-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-300"
        />
        <button
          onClick={() => onConnectProgram(inputValue)}
          disabled={loading}
          className="px-3 py-1.5 text-xs font-medium rounded bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700"
        >
          {loading ? '...' : 'Connect'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
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

function SectionNavigationBar({
  plan,
  activeSectionId,
  onSelectSection
}: {
  plan: BusinessPlan;
  activeSectionId: string | null;
  onSelectSection: (sectionId: string) => void;
}) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const sections = [
    ...plan.sections,
    {
      id: ANCILLARY_SECTION_ID,
      title: 'Front & back matter',
      progress: undefined,
      questions: []
    }
  ];

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={scrollLeft}
        className="flex-shrink-0 rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition"
        aria-label="Scroll left"
      >
        ←
      </button>
      <div ref={scrollContainerRef} className="flex items-center gap-3 overflow-x-auto py-3 flex-1 scrollbar-hide">
        {sections.map((section, index) => {
        const totalQuestions = section.questions.length;
        const answeredQuestions = section.questions.filter(
          (question) => question.status === 'complete'
        ).length;
        const completion =
          section.progress ??
          (totalQuestions === 0 ? 0 : Math.round((answeredQuestions / totalQuestions) * 100));
        const isAncillary = section.id === ANCILLARY_SECTION_ID;
        const isActive = section.id === activeSectionId;

        return (
          <button
            key={section.id}
            onClick={() => onSelectSection(section.id)}
            className={`flex-shrink-0 rounded-lg border-2 px-4 py-2.5 min-w-[140px] transition-all focus:outline-none focus:ring-2 focus:ring-blue-200 ${
              isActive
                ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                {!isAncillary && (
                  <span className={`text-xs font-semibold ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                )}
                <span className={`text-xs font-medium ${isActive ? 'text-white' : completion === 100 ? 'text-green-600' : completion > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                  {completion}%
                </span>
              </div>
              <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    completion === 100 ? 'bg-green-500' : completion > 0 ? 'bg-amber-500' : 'bg-slate-300'
                  }`}
                  style={{ width: `${completion}%` }}
                />
              </div>
              <p className={`text-sm font-semibold leading-tight text-left ${isActive ? 'text-white' : 'text-slate-900'}`}>
                {section.title}
              </p>
            </div>
          </button>
        );
      })}
      </div>
      <button
        onClick={scrollRight}
        className="flex-shrink-0 rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition"
        aria-label="Scroll right"
      >
        →
      </button>
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
  onAskAI,
  onToggleUnknown
}: {
  section?: Section;
  onAnswerChange: (questionId: string, content: string) => void;
  onSelectQuestion: (questionId: string) => void;
  activeQuestionId: string | null;
  onAskAI: (questionId?: string) => void;
  onToggleUnknown: (questionId: string, note?: string) => void;
}) {

  if (!section) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-12 text-center text-sm text-slate-500">
        Select a section to begin.
      </div>
    );
  }

  const sectionHint = getSectionHint(section);

  return (
    <main className="space-y-6">
      {/* Section Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          {section.category && (
            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">{section.category}</p>
          )}
          <h1 className="text-2xl font-semibold text-slate-900 leading-tight">{section.title}</h1>
          {(sectionHint || section.description) && (
            <p className="text-sm text-slate-600">{sectionHint || section.description}</p>
          )}
        </div>
      </div>

      {/* Prompt Navigation Bar */}
      {section.questions.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {section.questions.map((question, index) => {
            const isActive = question.id === activeQuestionId;
            const status = question.status;
            
            return (
              <button
                key={question.id}
                onClick={() => onSelectQuestion(question.id)}
                className={`flex-shrink-0 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                    : `border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50`
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{index + 1}</span>
                  {status === 'complete' && (
                    <span className={`text-xs ${isActive ? 'text-blue-100' : 'text-green-600'}`}>✓</span>
                  )}
                  {status === 'draft' && (
                    <span className={`text-xs ${isActive ? 'text-blue-100' : 'text-amber-600'}`}>⋯</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Single Active Prompt Block */}
      {section.questions.length > 0 && (() => {
        const activeQuestion = section.questions.find(q => q.id === activeQuestionId) ?? section.questions[0];
        
        return (
          <QuestionCard
            question={activeQuestion}
            isActive={true}
            onFocus={() => onSelectQuestion(activeQuestion.id)}
            onChange={(content) => onAnswerChange(activeQuestion.id, content)}
            onAskAI={() => onAskAI(activeQuestion.id)}
            onToggleUnknown={(note) => onToggleUnknown(activeQuestion.id, note)}
          />
        );
      })()}
    </main>
  );
}

function QuestionCard({
  question,
  isActive,
  onFocus,
  onChange,
  onAskAI,
  onToggleUnknown
}: {
  question: Question;
  isActive: boolean;
  onFocus: () => void;
  onChange: (content: string) => void;
  onAskAI: () => void;
  onToggleUnknown: (note?: string) => void;
}) {
  const isUnknown = question.status === 'unknown';
  const handleToggleUnknown = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (isUnknown) {
      onToggleUnknown();
      return;
    }
    const note =
      typeof window !== 'undefined'
        ? window.prompt('Optional note for why this prompt is unknown?')
        : undefined;
    onToggleUnknown(note ?? undefined);
  };

  return (
    <div
      className={`rounded-2xl border-2 p-6 bg-white shadow-sm transition-all ${
        isActive
          ? 'border-blue-500 shadow-lg shadow-blue-50 ring-2 ring-blue-100'
          : 'border-slate-200 hover:border-slate-300'
      }`}
      onClick={onFocus}
    >
      {/* Prompt Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          {question.required && (
            <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
              Required
            </span>
          )}
          {isUnknown && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
              Marked as unknown{question.statusNote ? ` • ${question.statusNote}` : ''}
            </span>
          )}
        </div>
        <p className="text-xl font-semibold text-slate-900 leading-snug">{question.prompt}</p>
      </div>

      {/* Text Editor */}
      <div onClick={(e) => e.stopPropagation()}>
        <SimpleTextEditor
          content={question.answer ?? ''}
          onChange={onChange}
          placeholder={question.placeholder}
        />
      </div>

      {/* Action Buttons (directly below editor) */}
      <div className="mt-5 flex flex-wrap gap-3" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onAskAI}
          className="inline-flex items-center px-5 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 shadow-sm transition-all"
        >
          <span className="mr-2">✨</span>
          Generate for this prompt
        </button>
        <button
          type="button"
          onClick={handleToggleUnknown}
          className={`inline-flex items-center px-4 py-2.5 rounded-lg border-2 font-medium text-sm transition-all ${
            isUnknown
              ? 'border-amber-400 text-amber-700 bg-amber-50 hover:bg-amber-100'
              : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          {isUnknown ? 'Clear unknown status' : 'Mark as unknown'}
        </button>
      </div>
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
  const [conversationHistory, setConversationHistory] = React.useState<ConversationMessage[]>([]);
  const activeQuestionKey = section && question ? `${section.id}::${question.id}` : null;
  // Map 'requirements' view to 'preview' for backward compatibility
  const activeView = view === 'requirements' ? 'preview' : view;
  const effectiveView = (['ai', 'data', 'preview'].includes(activeView) ? activeView : 'ai') as 'ai' | 'data' | 'preview';

  React.useEffect(() => {
    if (!activeQuestionKey) {
      setConversationHistory([]);
      return;
    }
    const stored = loadPlanConversations();
    setConversationHistory(stored[activeQuestionKey] || []);
  }, [activeQuestionKey, question?.aiContext?.updatedAt]);

  const handleQuickAsk = (intent: AISuggestionIntent) => {
    if (!question) return;
    onAskAI(question.id, { intent });
  };

  const handleAskForStructure = () => {
    if (!question) return;
    setView('ai');
    onAskAI(question.id, { intent: 'data' });
  };

  return (
    <aside className="rounded-2xl border-2 border-slate-200 bg-white shadow-sm flex h-full min-h-[360px] flex-col sticky top-[120px] w-full lg:w-[360px] lg:flex-shrink-0">
      <div className="grid grid-cols-3 border-b-2 border-slate-200">
        {(['Assistant', 'Data', 'Preview'] as const).map((tabLabel) => {
          const tabKey = tabLabel.toLowerCase() as 'ai' | 'data' | 'preview';
          return (
            <button
              key={tabKey}
              onClick={() => setView(tabKey)}
              className={`py-3 text-xs font-semibold transition-all ${
                effectiveView === tabKey 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' 
                  : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
              }`}
            >
              {tabLabel}
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-y-auto">
        {/* Assistant Tab */}
        {effectiveView === 'ai' && (
          <div className="p-4 space-y-4">
            <button
              onClick={() => onAskAI(question?.id)}
              disabled={!question}
              className={`w-full px-4 py-3 rounded-lg font-semibold text-sm shadow-sm transition-all ${
                question
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              Ask the assistant
            </button>
            {question && (
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Current question</p>
                  <p className="font-semibold text-slate-900 leading-snug mb-2">{question.prompt}</p>
                      <p className="text-xs text-slate-600">
                        Status: <span className="font-medium">{question.status}</span>
                        {question.status === 'blank' || question.status === 'unknown'
                          ? ' (AI will focus on guidance)'
                          : ' (AI will focus on critique)'}
                      </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickAsk('outline')}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
                      disabled={!question}
                    >
                      Draft outline
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAsk('improve')}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
                      disabled={!question}
                    >
                      Improve answer
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAsk('data')}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
                      disabled={!question}
                    >
                      Suggest data/KPIs
                    </button>
                  </div>
                </div>
                {question.answer ? (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Answer preview</p>
                    <p className="text-slate-600">{question.answer.substring(0, 200)}...</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {question.answer.split(/\s+/).length} words
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">
                    Start typing to provide context—the assistant draws on previous answers, datasets, and program requirements.
                  </p>
                )}
                {question.suggestions && question.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-700">Latest response</p>
                    {question.suggestions.slice(-1).map((suggestion, index) => (
                      <div key={index} className="border border-blue-100 bg-blue-50 rounded-lg p-3">
                        <p className="text-sm text-blue-700 mb-2">{suggestion}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(suggestion);
                            }}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                          >
                            Copy
                          </button>
                          <button
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
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                          >
                            Insert
                          </button>
                        </div>
                      </div>
                    ))}
                    {question.suggestions.length > 1 && (
                      <button
                        onClick={() => {
                          // TODO: Implement conversation history modal
                          console.log('View full conversation');
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View full conversation ({question.suggestions.length} responses)
                      </button>
                    )}
                  </div>
                )}
                {/* Quick Actions */}
                {question && question.answer && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <p className="text-xs font-semibold text-slate-700">Quick actions</p>
                    <div className="flex flex-wrap gap-2">
                      {['Tone', 'Translate', 'Summarize', 'Expand'].map((action) => (
                        <button
                          key={action}
                          onClick={() => {
                            // TODO: Implement quick action handlers
                            console.log(`Quick action: ${action}`);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {conversationHistory.length > 0 && (
                  <div className="border-t border-slate-200 pt-3 space-y-2 max-h-48 overflow-y-auto">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase text-slate-400">Conversation history</p>
                      <button
                        type="button"
                        onClick={() => setView('ai')}
                        className="text-[10px] text-blue-600 hover:underline"
                      >
                        Refresh
                      </button>
                    </div>
                    {conversationHistory
                      .slice()
                      .reverse()
                      .map((message) => (
                        <div
                          key={message.id}
                          className="rounded-xl border border-slate-100 bg-slate-50 p-2 text-xs text-slate-600 space-y-1"
                        >
                          <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-slate-400">
                            <span>{message.role === 'assistant' ? 'Assistant' : 'You'}</span>
                            <span>{new Date(message.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-700">{message.content}</p>
                          {message.role === 'assistant' && (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => navigator.clipboard.writeText(message.content)}
                                className="px-2 py-1 rounded border border-slate-200 text-[10px] font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600"
                              >
                                Copy
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (question) {
                                    const currentAnswer = question.answer ?? '';
                                    const newContent = currentAnswer
                                      ? `${currentAnswer}\n\n${message.content}`
                                      : message.content;
                                    onAnswerChange(question.id, newContent);
                                  }
                                }}
                                className="px-2 py-1 rounded border border-slate-200 text-[10px] font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600"
                              >
                                Insert
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
            {!question && (
              <div className="text-center py-8 text-slate-400 text-sm">
                Select a question to receive AI suggestions.
              </div>
            )}
          </div>
        )}

        {/* Data Tab */}
        {effectiveView === 'data' && (
          <div className="p-4">
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
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <PreviewPane plan={plan} focusSectionId={section?.id} />
            </div>
            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-700">Requirements validation</p>
                <button
                  onClick={() => {
                    setRequirementsChecked(true);
                    onRunRequirements();
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-500"
                >
                  Run check
                </button>
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
                            <p className="text-xs font-semibold text-green-700">Current question passes validation</p>
                          </div>
                          <p className="text-xs text-green-600 mt-1">All requirements are met for this prompt.</p>
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
    </aside>
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
    <div className="space-y-2">
      <div 
        className={`
          relative
          bg-white
          rounded-xl
          border-2
          transition-all
          duration-200
          ${isFocused 
            ? 'border-blue-400 shadow-md shadow-blue-50' 
            : 'border-slate-200 hover:border-slate-300'
          }
        `}
        onClick={() => textareaRef.current?.focus()}
      >
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder || `Start writing...`}
          className="
            w-full
            min-h-[240px]
            p-5
            text-base
            leading-relaxed
            text-slate-900
            placeholder-slate-400
            resize-none
            border-0
            outline-none
            bg-transparent
            focus:outline-none
            font-sans
          "
          style={{
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            lineHeight: '1.7',
            fontSize: '15px'
          }}
        />
      </div>
    </div>
  );
}

