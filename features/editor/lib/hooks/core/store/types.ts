// Editor store types and constants

import type {
  AncillaryContent,
  AppendixItem,
  BusinessPlan,
  Dataset,
  FundingProgramType,
  KPI,
  MediaAsset,
  ProductType,
  ProgramSummary,
  Reference,
  TemplateFundingType,
  TitlePage
} from '@/features/editor/lib/types/plan';
import type { SectionTemplate, DocumentTemplate } from '@templates';

export type ProgressSummary = { id: string; title: string; progress: number };

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
  progressSummary: ProgressSummary[];
  // UI State
  isConfiguratorOpen: boolean;
  editingSectionId: string | null;
  hydrate: (
    product: ProductType | null,
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
  setIsConfiguratorOpen: (open: boolean) => void;
  setEditingSectionId: (sectionId: string | null) => void;
}

export type EditorActionKeys =
  | 'hydrate'
  | 'setActiveSection'
  | 'setActiveQuestion'
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
  | 'markQuestionComplete'
  | 'setIsConfiguratorOpen'
  | 'setEditingSectionId';

export type EditorActions = Pick<EditorStoreState, EditorActionKeys>;

