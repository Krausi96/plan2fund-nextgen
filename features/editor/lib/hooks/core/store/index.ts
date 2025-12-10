// Main editor store - Zustand store implementation

import { create } from 'zustand';
import type {
  AttachmentReference,
  BusinessPlan,
  Question,
  QuestionStatus,
  Section
} from '@/features/editor/lib/types/plan';
import type { PlanSection as LegacyPlanSection } from '@/features/editor/lib/types/plan';
import type { SectionTemplate } from '@templates';
import { getSections } from '@templates';
import { calculateSectionProgress, calculateSectionCompletion, determineQuestionStatus } from '@/features/editor/lib/helpers/renderHelpers';
import {
  loadPlanSections,
  loadQuestionStates
} from '@/shared/user/storage/planStore';
import type { PlanSection as StoredPlanSection } from '@/shared/user/storage/planStore';

// Import helpers (consolidated)
import {
  METADATA_SECTION_ID,
  ANCILLARY_SECTION_ID,
  defaultTitlePage,
  defaultAncillary,
  isMetadataComplete,
  buildSectionFromTemplate,
  persistPlan,
  updateSection,
  convertPlanToLegacySections,
  type QuestionStateMap
} from '@/features/editor/lib/helpers/editorHelpers';
import type { EditorStoreState } from './types';

export const useEditorStore = create<EditorStoreState>((set, get) => ({
  plan: null,
  templates: [],
  isLoading: false,
  error: null,
  activeSectionId: null,
  activeQuestionId: null,
  progressSummary: [],
  // UI State
  isConfiguratorOpen: false,
  editingSectionId: null,
  hydrate: async (product, context) => {
    // Don't hydrate if product is null
    if (!product) {
      set({ isLoading: false, error: null });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      // Preserve existing plan data (especially documentSections and documentTitlePages)
      const existingPlan = get().plan;
      
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
          } catch (_err) {
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
        // Use a translation key that will be handled in Sidebar
        sections.push({
          id: 'default_section',
          title: 'editor.section.default_section', // Will be translated in Sidebar
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

      // Preserve existing plan data when switching products
      // This is critical for additional documents - preserve their sections and title pages
      const preservedDocumentSections = existingPlan?.metadata?.documentSections || {};
      const preservedDocumentTitlePages = existingPlan?.metadata?.documentTitlePages || {};
      const preservedTitlePage = existingPlan?.titlePage || defaultTitlePage();
      const preservedReferences = existingPlan?.references || [];
      const preservedAppendices = existingPlan?.appendices || [];
      const preservedAncillary = existingPlan?.ancillary || defaultAncillary();

      const plan: BusinessPlan = {
        id: existingPlan?.id || `plan_${Date.now()}`,
        productType: product,
        fundingProgram: context?.summary?.fundingProgramTag ?? 'grant',
        titlePage: preservedTitlePage, // Preserve existing title page
        sections,
        references: preservedReferences, // Preserve existing references
        appendices: preservedAppendices, // Preserve existing appendices
        ancillary: preservedAncillary, // Preserve existing ancillary
        programSummary: context?.summary,
        metadata: {
          lastSavedAt: new Date().toISOString(),
          programId: context?.programId,
          programName: context?.programName,
          templateFundingType: context?.summary?.fundingType ?? context?.fundingType ?? 'grants',
          disabledSectionIds: context?.disabledSectionIds,
          disabledDocumentIds: context?.disabledDocumentIds,
          customSections: context?.customSections,
          customDocuments: context?.customDocuments,
          // CRITICAL: Preserve document-specific data when switching products
          documentSections: preservedDocumentSections,
          documentTitlePages: preservedDocumentTitlePages
        }
      };

      // For new users, don't auto-navigate to metadata - keep them on the configurator
      // Only set activeSectionId if there's already a plan (user is returning)
      const shouldAutoNavigate = existingPlan !== null; // Only auto-navigate if plan already existed
      
      // Decide initial workspace: for new users, don't set activeSectionId (stay on configurator)
      // For returning users, navigate to metadata first until required fields exist, otherwise recommended section
      const metadataComplete = isMetadataComplete(plan.titlePage);
      const projectDescriptionSection = sections.length > 0 ? sections.find(s => s.id === 'project_description') : null;
      const initialSection = metadataComplete && sections.length > 0 ? (projectDescriptionSection ?? sections[0] ?? null) : null;
      
      set({
        plan,
        templates: allEnabledTemplates,
        isLoading: false,
        // For new users (no existing plan), don't set activeSectionId - keep them on configurator
        // For returning users, navigate to appropriate section
        activeSectionId: shouldAutoNavigate 
          ? (metadataComplete ? initialSection?.id ?? null : METADATA_SECTION_ID)
          : null,
        activeQuestionId: shouldAutoNavigate ? (initialSection?.questions[0]?.id ?? null) : null,
        progressSummary: []
      });
    } catch (error: any) {
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
    const updatedPlan = updateSection(plan, sectionId, (section: Section) => ({
      ...section,
      datasets: [...(section.datasets ?? []), dataset]
    }));
    persistPlan(updatedPlan);
    set({ plan: updatedPlan });
  },
  addKpi: (sectionId, kpi) => {
    const { plan } = get();
    if (!plan) return;
    const updatedPlan = updateSection(plan, sectionId, (section: Section) => ({
      ...section,
      kpis: [...(section.kpis ?? []), kpi]
    }));
    persistPlan(updatedPlan);
    set({ plan: updatedPlan });
  },
  addMedia: (sectionId, asset) => {
    const { plan } = get();
    if (!plan) return;
    const updatedPlan = updateSection(plan, sectionId, (section: Section) => ({
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
    const updatedPlan = updateSection(plan, sectionId, (section: Section) => {
      const targetQuestion = section.questions.find((question: Question) => question.id === questionId);
      if (!targetQuestion || !targetQuestion.attachments) {
        return section;
      }

      const updatedQuestions = section.questions.map((question: Question) => {
        if (question.id !== questionId) return question;
        return {
          ...question,
          attachments: question.attachments?.filter((attachment: any) =>
            'attachmentId' in attachment
              ? attachment.attachmentId !== attachmentId
              : true
          )
        };
      });

      return {
        ...section,
        questions: updatedQuestions
      };
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
    const summary = legacySections.map((section: LegacyPlanSection) => {
      const progress = calculateSectionProgress(section);
      return {
        id: section.key,
        title: section.title,
        progress: progress.completionPercentage
      };
    });
    set({ progressSummary: summary });
  },
  requestAISuggestions: async (_sectionId: string, _questionId: string, _options?: any) => {
    // AI suggestions functionality removed
    return;
  },
  setIsConfiguratorOpen: (open) => {
    set({ isConfiguratorOpen: open });
  },
  setEditingSectionId: (sectionId) => {
    set({ editingSectionId: sectionId });
  }
}));

// Helper function for attaching references
function attachReferenceToQuestion(
  set: (partial: Partial<EditorStoreStateType>) => void,
  get: () => EditorStoreStateType,
  sectionId: string,
  questionId: string,
  reference: AttachmentReference
) {
  const { plan } = get();
  if (!plan) return;
  const timestamp = new Date().toISOString();
  const updatedPlan = updateSection(plan, sectionId, (section: Section) => {
    const updatedQuestions = section.questions.map((question: Question) => {
      if (question.id !== questionId) return question;
      const attachments = question.attachments ?? [];
      const alreadyLinked = attachments.some(
        (attachment: any) =>
          'attachmentId' in attachment &&
          attachment.attachmentId === reference.attachmentId &&
          attachment.attachmentType === reference.attachmentType
      );
      if (alreadyLinked) return question;
      return {
        ...question,
        attachments: [...attachments, { ...reference, linkedAt: timestamp }]
      };
    });
    return {
      ...section,
      questions: updatedQuestions
    };
  });
  persistPlan(updatedPlan);
  set({ plan: updatedPlan });
}

// Export action selector
import type { EditorActions, EditorStoreState as EditorStoreStateType } from './types';

const selectActions = (state: EditorStoreStateType): EditorActions => ({
  hydrate: state.hydrate,
  setActiveSection: state.setActiveSection,
  setActiveQuestion: state.setActiveQuestion,
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
  markQuestionComplete: state.markQuestionComplete,
  setIsConfiguratorOpen: state.setIsConfiguratorOpen,
  setEditingSectionId: state.setEditingSectionId
});

export const useEditorActions = <T>(selector: (actions: EditorActions) => T) =>
  useEditorStore((state) => selector(selectActions(state)));

