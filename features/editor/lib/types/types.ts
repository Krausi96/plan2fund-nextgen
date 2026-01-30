/**
 * ============================================================================
 * EDITOR TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains all TypeScript type definitions used throughout the editor.
 * It serves as the single source of truth for editor-related types.
 * 
 * USAGE:
 *   Import types from here: import type { ProductType, PlanSection } from '@/features/editor/lib';
 * 
 * USED BY:
 *   - All editor components (Editor, Sidebar, DocumentsBar, etc.)
 *   - Store (editorStore.ts) - for state typing
 *   - Hooks - for parameter and return types
 *   - Renderers - for data structure typing
 * 
 * ORGANIZATION:
 *   - Product & Plan Types: Core business plan data structures
 *   - Program Types: Grant program related types
 *   - AI & Conversation Types: AI chat functionality types
 *   - Template Types: Section and document template types
 *   - UI Types: Component prop and state types
 * ============================================================================
 */

// Import all program-related types from Program-Types.ts (single source of truth)
import type { 
  FundingProgram, 
  DocumentStructure, 
  SetupDiagnostics, 
  SetupStatus, 
  SetupSource,
  ProgramSummary
} from './Program-Types';

// Re-export for convenience
export type { 
  FundingProgram, 
  DocumentStructure, 
  SetupDiagnostics, 
  SetupStatus, 
  SetupSource,
  ProgramSummary
};

export type ProductType = 'submission' | 'review' | 'strategy';

export type ProductOption = {
  value: ProductType;
  label: string;
  description: string;
  icon?: string;
};

export interface TitlePage {
  planTitle: string;
  valueProp?: string;
  companyName: string;
  legalForm?: string;
  teamHighlight?: string;
  date: string;
  logoUrl?: string;
  confidentialityStatement?: string;
  headquartersLocation?: string;
  contactInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
  };
}

export interface PlanSection {
  key: string;
  id: string;
  title: string;
  content?: string;
  fields?: {
    displayTitle?: string;
    sectionNumber?: number | null;
    subchapters?: Array<{ id: string; title: string; numberLabel: string }>;
    [key: string]: any;
  };
  status?: string;
  tables?: Record<string, any>;
  figures?: Array<{
    id?: string;
    title?: string;
    caption?: string;
    description?: string;
    source?: string;
    tags?: string[];
    uri?: string;
    altText?: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface PlanDocument {
  id?: string;
  language: 'de' | 'en';
  productType?: ProductType;
  settings: {
    includeTitlePage?: boolean;
    includePageNumbers?: boolean;
    titlePage?: {
      title?: string;
      subtitle?: string;
      companyName?: string;
      legalForm?: string;
      teamHighlight?: string;
      date?: string;
      logoUrl?: string;
      confidentialityStatement?: string;
      headquartersLocation?: string;
      contactInfo?: {
        email?: string;
        phone?: string;
        website?: string;
        address?: string;
      };
    };
    [key: string]: any;
  };
  sections: PlanSection[];
  metadata?: {
    disabledSectionIds?: string[];
    disabledDocumentIds?: string[];
    customSections?: SectionTemplate[];
    customDocuments?: DocumentTemplate[];
    [key: string]: any;
  };
  ancillary?: {
    listOfTables?: Array<{ id: string; label: string; page?: number; [key: string]: any }>;
    listOfIllustrations?: Array<{ id: string; label: string; page?: number; [key: string]: any }>;
    tableOfContents?: Array<{ id: string; title: string; page?: number; hidden?: boolean; [key: string]: any }>;
    [key: string]: any;
  };
  references?: Array<{
    id: string;
    citation?: string;
    url?: string;
    accessedDate?: string;
    [key: string]: any;
  }>;
  appendices?: Array<{
    id: string;
    title?: string;
    description?: string;
    fileUrl?: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

// Re-export BusinessPlan if it exists elsewhere, otherwise define it
export type BusinessPlan = PlanDocument;

// ============================================================================
// PROGRAM TYPES
// ============================================================================

// ProgramSummary moved to Program-Types.ts for single source of truth

// ProgramProfile functionality moved to setup.types.ts as FundingProgram

// ============================================================================
// AI & CONVERSATION TYPES
// =============================================================================

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
  [key: string]: any;
}

export type QuestionStatus = 'pending' | 'answered' | 'skipped' | 'hidden';

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

export interface SectionTemplate {
  id: string;
  title: string;
  description: string;
  required: boolean;
  wordCountMin?: number;
  wordCountMax?: number;
  order?: number;
  category: 'general' | 'project' | 'impact' | 'financial' | 'market' | 'team' | 'risk';
  prompts?: string[];
  validationRules?: {
    requiredFields?: string[];
    formatRequirements?: string[];
  };
  source?: {
    verified: boolean;
    verifiedDate?: string;
    officialProgram?: string;
    sourceUrl?: string;
    version?: string;
  };
  origin?: 'template' | 'custom';
  [key: string]: any;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  required: boolean;
  format: 'pdf' | 'docx' | 'xlsx';
  maxSize: string;
  template?: string;
  instructions?: string[];
  examples?: string[];
  commonMistakes?: string[];
  category: 'submission' | 'strategy' | 'review' | 'business' | 'market' | 'financial' | 'general' | 'project' | 'team' | 'risk';
  fundingTypes?: string[];
  origin?: 'template' | 'custom';
  [key: string]: any;
}

// ============================================================================
// UI TYPES - Used by multiple components (Single Source of Truth)
// ============================================================================

/**
 * Dropdown position for portal-based dropdowns
 * Used by: ProductSelection, ProgramSelection, useDropdownPosition hook
 */
export type DropdownPosition = {
  top: number;
  left: number;
  width: number;
};

/**
 * Options for dropdown positioning
 * Used by: useDropdownPosition hook
 */
export type DropdownPositionOptions = {
  offset?: number;
  maxWidth?: number;
  minWidth?: number;
  position?: 'below' | 'above';
};

/**
 * Edit handlers interface
 * Used by: Editor, Sidebar, DocumentsBar, useEditHandlers hook
 */
export interface EditHandlers<T> {
  onEdit: (item: T) => void;
  onSave: (item: T) => void;
  onCancel: () => void;
}

/**
 * Toggle handlers interface
 * Used by: Editor, useToggleHandlers hook
 */
export interface ToggleHandlers {
  toggle: (id: string) => void;
  isDisabled: (id: string) => boolean;
  enabledCount: number;
  totalCount: number;
}

// ============================================================================
// SETUP WIZARD TYPES
// ============================================================================

/**
 * ProjectProfile - Output of Step 1 (Project Basics)
 * Contains essential project metadata that affects document structure
 */
export interface ProjectProfile {
  projectName: string;
  author: string;
  confidentiality: 'public' | 'confidential' | 'private';
  confidentialityStatement?: string;
  oneLiner: string;
  stage: 'idea' | 'MVP' | 'revenue';
  country: string;
  industryTags: string[]; // max 3
  mainObjective?: string;
  teamSize?: number;
  customIndustry?: string;
  financialBaseline: {
    fundingNeeded: number;
    currency: string;
    startDate: string;
    planningHorizon: 0 | 6 | 12 | 18 | 24 | 30 | 36 | 42 | 48; // months
  };
}

/**
 * DocumentTemplateId - Output of Step 3 (Document Type)
 * Final document template selection
 */
export type DocumentTemplateId = 'business-plan' | 'pitch-deck' | 'executive-summary' | 'custom';

/**
 * SetupWizardState - Tracks progress through the 3-step wizard
 */
export interface SetupWizardState {
  currentStep: 1 | 2 | 3;
  projectProfile: ProjectProfile | null;
  programProfile: FundingProgram | null;  // Normalized funding program data for document setup
  documentTemplateId: DocumentTemplateId | null;
  isComplete: boolean;
  
  // Document setup tracking (wizard-owned state)
  documentStructure: DocumentStructure | null;
  setupStatus: 'none' | 'draft' | 'confirmed' | 'locked';
  setupVersion: string;
  setupSource: 'program' | 'template' | 'standard';
  setupDiagnostics: {
    warnings: string[];
    missingFields: string[];
    confidence: number;
  } | null;
  
  // Product type inference (Step 2 → Step 3 bridge)
  inferredProductType?: ProductType | null;
}

// Helper types for editor store
export type SectionWithMetadata = {
  id: string;
  title: string;
  isDisabled: boolean;
  origin?: 'template' | 'custom';
  isSpecial: boolean;
  required?: boolean;
  [key: string]: any;
};

export type DocumentWithMetadata = {
  id: string;
  name: string;
  isDisabled: boolean;
  origin?: 'template' | 'custom';
  [key: string]: any;
};

/**
 * ConnectCopy - Interface for program connection copy text
 */
export interface ConnectCopy {
  openFinder?: string;
  pasteLink?: string;
  inputLabel?: string;
  placeholder?: string;
  submit?: string;
  example?: string;
  error?: string;
}
