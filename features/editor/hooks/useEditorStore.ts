// ========= PLAN2FUND  EDITOR STORE =========
// Centralized Zustand store and pure helpers shared across editor surfaces.

import { create } from 'zustand';

import {
  AncillaryContent,
  AppendixItem,
  AttachmentReference,
  BusinessPlan,
  Dataset,
  FundingProgramType,
  KPI,
  MediaAsset,
  PlanSection as LegacyPlanSection,
  ProductType,
  ProgramSummary,
  Question,
  QuestionStatus,
  Reference,
  RightPanelView,
  Section,
  TemplateFundingType,
  Table,
  TitlePage
} from '@/features/editor/types/plan';
import { generateSectionContent } from '@/features/editor/engine/sectionAiClient';
import { SectionTemplate, DocumentTemplate, getSections } from '@templates';
import { calculateSectionProgress, calculateSectionCompletion, determineQuestionStatus } from '@/features/editor/utils';
import {
  loadPlanSections,
  savePlanSections,
  savePlanConversations,
  loadPlanConversations,
  loadQuestionStates,
  saveQuestionStates
} from '@/shared/user/storage/planStore';
import type { PlanSection as StoredPlanSection } from '@/shared/user/storage/planStore';

export type ProgressSummary = { id: string; title: string; progress: number };

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

export type AISuggestionIntent = 'default' | 'outline' | 'improve' | 'data';

export interface AISuggestionOptions {
  intent?: AISuggestionIntent;
}

export interface EditorStoreState {
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
      disabledSectionIds?: string[];
      disabledDocumentIds?: string[];
      customSections?: SectionTemplate[];
      customDocuments?: DocumentTemplate[];
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

export const defaultTitlePage = (): TitlePage => ({
  companyName: 'Untitled Company',
  logoUrl: '',
  valueProp: '',
  teamHighlight: '',
  planTitle: 'Business Plan',
  date: new Date().toISOString().split('T')[0],
  contactInfo: {
    name: '',
    email: '',
    phone: '',
    website: '',
    address: ''
  },
  confidentialityStatement: '',
  legalForm: '',
  headquartersLocation: ''
});

type MetadataFieldPath = (string | number)[];

export interface RequiredMetadataField {
  id: string;
  path: MetadataFieldPath;
  labelKey: string;
  fallback: string;
  validator?: (value: string) => boolean;
}

export const REQUIRED_METADATA_FIELDS: RequiredMetadataField[] = [
  {
    id: 'planTitle',
    path: ['planTitle'],
    labelKey: 'editor.metadata.field.planTitle',
    fallback: 'Plan title',
    validator: (value) => {
      const normalized = value.trim().toLowerCase();
      return normalized.length > 0 && normalized !== 'business plan';
    }
  },
  {
    id: 'companyName',
    path: ['companyName'],
    labelKey: 'editor.metadata.field.companyName',
    fallback: 'Company name'
  },
  {
    id: 'contactEmail',
    path: ['contactInfo', 'email'],
    labelKey: 'editor.metadata.field.email',
    fallback: 'Contact email'
  },
  {
    id: 'date',
    path: ['date'],
    labelKey: 'editor.metadata.field.date',
    fallback: 'Date'
  }
];

export function getMetadataFieldValue(titlePage: TitlePage, path: MetadataFieldPath): string {
  let current: any = titlePage;
  for (const segment of path) {
    if (current == null) {
      return '';
    }
    current = current[segment as keyof typeof current];
  }
  if (current == null) {
    return '';
  }
  return typeof current === 'string' ? current : String(current);
}

export const defaultAncillary = (): AncillaryContent => ({
  tableOfContents: [],
  listOfIllustrations: [],
  listOfTables: [],
  citationStyle: 'apa',
  footnotes: [],
  lastGenerated: undefined
});

export const ANCILLARY_SECTION_ID = '__ancillary__';
export const METADATA_SECTION_ID = '__metadata__';

export function isMetadataComplete(titlePage: TitlePage): boolean {
  return REQUIRED_METADATA_FIELDS.every((field) =>
    (field.validator
      ? field.validator(getMetadataFieldValue(titlePage, field.path))
      : getMetadataFieldValue(titlePage, field.path).trim().length > 0)
  );
}

export function mapProgramTypeToFunding(programType?: string): {
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

export function normalizeProgramInput(rawInput: string): string | null {
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

export const useEditorStore = create<EditorStoreState>((set, get) => ({
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
      const allTemplates = await getSections('grants', product, context?.programId, baseUrl);
      const savedSections: StoredPlanSection[] =
        typeof window !== 'undefined' ? loadPlanSections() : [];
      
      // Filter out disabled sections
      const disabledSectionIds = new Set(context?.disabledSectionIds || []);
      const enabledTemplates = allTemplates.filter(
        (template) => !disabledSectionIds.has(template.id)
      );
      
      // Add custom sections (filter out any invalid ones)
      const customSections = (context?.customSections || []).filter(
        (template): template is SectionTemplate => 
          template != null && 
          typeof template === 'object' && 
          'id' in template && 
          'title' in template
      );
      const allEnabledTemplates = [...enabledTemplates, ...customSections];
      
      // Convert templates to plan sections (with error handling for each)
      const sections = allEnabledTemplates
        .map((template) => {
          try {
            return buildSectionFromTemplate(template, savedSections, questionStates);
          } catch (err) {
            console.error(`[hydrate] Failed to build section from template ${template.id}:`, err);
            // Return a minimal valid section to prevent breaking the entire plan
            return {
              id: template.id,
              title: template.title || 'Untitled Section',
              description: template.description || '',
              questions: [],
              datasets: [],
              kpis: [],
              media: [],
              collapsed: false,
              category: template.category || 'custom',
              progress: 0
            };
          }
        })
        .filter((section) => section != null);

      // Ensure we have at least one section to prevent empty plan
      if (sections.length === 0) {
        console.warn('[hydrate] No sections available after filtering, creating default section');
        sections.push({
          id: 'default_section',
          title: 'Default Section',
          description: 'No sections available',
          questions: [],
          datasets: [],
          kpis: [],
          media: [],
          collapsed: false,
          category: 'custom',
          progress: 0
        });
      }

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
          templateFundingType: context?.summary?.fundingType ?? context?.fundingType ?? 'grants',
          disabledSectionIds: context?.disabledSectionIds,
          disabledDocumentIds: context?.disabledDocumentIds,
          customSections: context?.customSections,
          customDocuments: context?.customDocuments
        }
      };

      // Decide initial workspace: metadata first until required fields exist, otherwise recommended section
      const metadataComplete = isMetadataComplete(plan.titlePage);
      const projectDescriptionSection = sections.length > 0 ? sections.find(s => s.id === 'project_description') : null;
      const initialSection = metadataComplete && sections.length > 0 ? (projectDescriptionSection ?? sections[0] ?? null) : null;
      
      set({
        plan,
        templates: allEnabledTemplates,
        isLoading: false,
        activeSectionId: metadataComplete ? initialSection?.id ?? null : METADATA_SECTION_ID,
        activeQuestionId: initialSection?.questions[0]?.id ?? null,
        progressSummary: [],
        rightPanelView: 'ai'
      });
    } catch (error: any) {
      console.error('[hydrate] Error during hydration:', error);
      set({
        error: error?.message || 'Failed to load editor',
        isLoading: false,
        plan: null,
        templates: []
      });
    }
  },
  setActiveSection: (sectionId) => {
    const { plan } = get();
    if (!plan) return;
    if (sectionId === ANCILLARY_SECTION_ID || sectionId === METADATA_SECTION_ID) {
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
      const response = await generateSectionContent({
        sectionTitle: section.title,
        context: enhancedContext,
        program: {
          id: plan.metadata?.ownerId ?? 'default',
          name: plan.fundingProgram ?? 'Grant',
          type: plan.fundingProgram ?? 'grant'
        },
        conversationHistory,
        questionMeta: {
          questionPrompt: question.prompt,
          questionStatus: question.status,
          questionMode: aiGuidanceMode,
          attachmentSummary: attachmentSummary.summaryLines,
          requirementHints
        },
        maxWords: 400,
        tone: 'neutral',
        language: 'en'
      });

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

export function validateQuestionRequirements(
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
        const record: Record<string, string | number> = { Item: row.label ?? '' };
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

type EditorActionKeys =
  | 'hydrate'
  | 'setActiveSection'
  | 'setActiveQuestion'
  | 'setRightPanelView'
  | 'updateAnswer'
  | 'addDataset'
  | 'addKpi'
  | 'addMedia'
  | 'attachDatasetToQuestion'
  | 'attachKpiToQuestion'
  | 'attachMediaToQuestion'
  | 'detachQuestionAttachment'
  | 'updateTitlePage'
  | 'updateAncillary'
  | 'addReference'
  | 'updateReference'
  | 'deleteReference'
  | 'addAppendix'
  | 'updateAppendix'
  | 'deleteAppendix'
  | 'setProductType'
  | 'setFundingProgram'
  | 'runRequirementsCheck'
  | 'requestAISuggestions'
  | 'toggleQuestionUnknown'
  | 'markQuestionComplete';

export type EditorActions = Pick<EditorStoreState, EditorActionKeys>;

const selectActions = (state: EditorStoreState): EditorActions => ({
  hydrate: state.hydrate,
  setActiveSection: state.setActiveSection,
  setActiveQuestion: state.setActiveQuestion,
  setRightPanelView: state.setRightPanelView,
  updateAnswer: state.updateAnswer,
  addDataset: state.addDataset,
  addKpi: state.addKpi,
  addMedia: state.addMedia,
  attachDatasetToQuestion: state.attachDatasetToQuestion,
  attachKpiToQuestion: state.attachKpiToQuestion,
  attachMediaToQuestion: state.attachMediaToQuestion,
  detachQuestionAttachment: state.detachQuestionAttachment,
  updateTitlePage: state.updateTitlePage,
  updateAncillary: state.updateAncillary,
  addReference: state.addReference,
  updateReference: state.updateReference,
  deleteReference: state.deleteReference,
  addAppendix: state.addAppendix,
  updateAppendix: state.updateAppendix,
  deleteAppendix: state.deleteAppendix,
  setProductType: state.setProductType,
  setFundingProgram: state.setFundingProgram,
  runRequirementsCheck: state.runRequirementsCheck,
  requestAISuggestions: state.requestAISuggestions,
  toggleQuestionUnknown: state.toggleQuestionUnknown,
  markQuestionComplete: state.markQuestionComplete
});

export const useEditorActions = <T>(selector: (actions: EditorActions) => T) =>
  useEditorStore((state) => selector(selectActions(state)));
