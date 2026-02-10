/**
 * Project types consolidated from features/editor/lib/types/
 * Central location for document structure, planning, and project-related types
 */

export interface ProjectProfile {
  id: string;
  name: string;
  description?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  // Core business data
  projectName?: string;
  oneliner?: string;
  country?: string;
  stage?: string;
  industry?: string[];
  industrySubcategory?: string;
  objective?: string;
  planningHorizon?: number;
  teamSize?: string;
}

/**
 * Editor-only metadata that doesn't belong in core business model
 * Contains UI state, form inputs, and temporary editor data
 */
export interface EditorMeta {
  // Title page extras
  author?: string;
  confidentiality?: 'public' | 'confidential' | 'private';
  confidentialityStatement?: string;
  logoUrl?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    [key: string]: any;
  };
  
  // Form temporaries
  tone?: string;
  language?: string;
  
  // Legacy migration fields
  subtitle?: string;
  date?: string;
  region?: string;
  mainObjective?: string;
  teamSizeNumber?: number;
  customIndustry?: string;
  customObjective?: string;
  
  // Financial baseline extras
  financialBaseline?: {
    currency?: string;
    startDate?: string;
    [key: string]: any;
  };
}

/**
 * User's funding preferences and questionnaire answers
 * Output of program finder recommendation flow
 */
export interface FundingProfile {
  location: string;
  organisation_type: string;
  funding_amount: number;
  company_stage: 'idea' | 'MVP' | 'revenue' | 'growth';
  revenue_status?: number;
  revenue_status_category?: string;
  industry_focus?: string[];
  co_financing?: 'co_yes' | 'co_no' | 'co_flexible';
  co_financing_percentage?: string;
  legal_form?: string;
  deadline_urgency?: string;
  use_of_funds?: string[];
  impact_focus?: string[];
  organisation_type_other?: string;
  organisation_type_sub?: 'no_company' | 'has_company';
  location_region?: string;
  funding_intent?: string;
}

/**
 * User's planned business/funding document
 */
export interface Plan {
  id: string;
  title: string;
  content?: string;
  sections?: Section[];
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  // Legacy fields from old editor types
  productType?: string;
}

export interface BusinessPlan {
  id: string;
  title: string;
  sections: Section[];
  documents: Document[];
  metadata: {
    wordCount: number;
    completionPercentage: number;
    lastEditedAt: string;
    version: number;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Editor document types - comprehensive document representation
 * Consolidated from features/editor/lib/types/documents/document-types.ts
 */
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
  productType?: string;
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
    customSections?: any[];
    customDocuments?: any[];
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
 * SINGLE SOURCE OF TRUTH for document structure
 * Unified output from both program flows and document upload flows
 */
export interface DocumentStructure {
  // Document containers
  documents: Document[]; // with id, name, purpose, required

  // Content sections mapped to documents
  sections: Section[]; // with documentId, title, type, required, programCritical, aiGuidance

  // Validation & compliance rules
  requirements: Requirement[]; // financial, market, team, risk, formatting, evidence
  validationRules: ValidationRule[]; // presence, completeness, numeric, attachment

  // AI-assisted content generation
  aiGuidance: AIGuidance[]; // per-section prompts and checklists

  // Special sections and rendering
  renderingRules: RenderingRules; // titlePage, tableOfContents, references, appendices

  // Quality & diagnostic metadata
  conflicts: ConflictItem[];
  warnings: WarningItem[];
  confidenceScore: number;
  metadata: {
    source: 'program' | 'document' | 'template';
    generatedAt: string;
    version: string;
  };
}

export interface Document {
  id: string;
  name: string;
  purpose: string;
  required: boolean;
  order?: number;
  type?: 'core' | 'template' | 'custom';
}

export interface Section {
  id: string;
  documentId: string; // Maps to Document.id
  title: string;
  type: 'normal' | 'metadata' | 'references' | 'appendices' | 'ancillary';
  required: boolean;
  programCritical: boolean;
  content?: string;
  aiGuidance?: string[];
  hints?: string[];
  order?: number;
}

export interface Requirement {
  id: string;
  type: 'financial' | 'market' | 'team' | 'risk' | 'formatting' | 'evidence';
  title: string;
  description: string;
  applicableSectionIds?: string[];
}

export interface ValidationRule {
  id: string;
  type: 'presence' | 'completeness' | 'numeric' | 'attachment';
  sectionId: string;
  rule: string;
  severity: 'error' | 'warning';
}

export interface AIGuidance {
  sectionId: string;
  prompt: string;
  checklist: string[];
  examples?: string[];
}

export interface RenderingRules {
  titlePage?: {
    enabled: boolean;
    fields?: string[];
  };
  tableOfContents?: {
    enabled: boolean;
    format?: 'numbered' | 'bulleted';
  };
  references?: {
    enabled: boolean;
    style?: 'APA' | 'Chicago' | 'Harvard';
  };
  appendices?: {
    enabled: boolean;
    maxCount?: number;
  };
}

export interface ConflictItem {
  id: string;
  type: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  resolution?: string;
}

export interface WarningItem {
  id: string;
  message: string;
  context?: string;
}

/**
 * Parsed document data from file extraction
 * Output of documentParser.parseDocumentStructure()
 */
export interface ParsedDocumentData {
  structure: DocumentStructure; // initial/normalized
  detection: DetectionMap; // structural element confidence
  specialSections: SpecialSection[];
  confidence: number;
  metadata: {
    source: 'upload' | 'template';
    fileName?: string;
    fileType?: string;
  };
}

export interface DetectionMap {
  titlePageConfidence: number;
  tocConfidence: number;
  referencesConfidence: number;
  appendicesConfidence: number;
  templateType?: 'business_plan' | 'strategy' | 'financial' | string;
  detectedSections: SectionDetection[];
}

export interface SectionDetection {
  sectionId: string;
  title: string;
  confidence: number;
  type?: string;
}

export interface SpecialSection {
  id: string;
  type: 'title_page' | 'toc' | 'references' | 'appendices';
  content?: string;
}

/**
 * Template for document structure
 * Base template before program/document-specific customization
 */
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
  category: 'general' | 'project' | 'impact' | 'financial' | 'market' | 'team' | 'risk' | 'submission' | 'strategy' | 'review' | 'business';
  fundingTypes?: string[];
  origin?: 'template' | 'custom';
  [key: string]: any;
}

/**
 * Document template type identifier
 * Represents the type of document being created (business plan, pitch deck, etc.)
 */
export type DocumentTemplateId = 'business-plan' | 'pitch-deck' | 'executive-summary' | 'strategy' | 'upgrade' | 'custom';

/**
 * Section template definition
 * Used to define document sections with validation and metadata
 */
export interface SubsectionTemplate {
  id: string;
  title: string;
  rawText: string;
}

export interface SectionTemplate {
  id: string;
  title: string;
  description: string;
  required: boolean;
  wordCountMin?: number;
  wordCountMax?: number;
  order?: number;
  category: 'general' | 'project' | 'impact' | 'financial' | 'market' | 'team' | 'risk' | 'submission' | 'strategy' | 'review' | 'business';
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
  sectionIntro?: string;
  rawSubsections?: SubsectionTemplate[];
  icon?: string;
  [key: string]: any;
}

/**
 * Product option for UI selection
 * Defines a selectable product type with label and description
 */
export interface ProductOption {
  value: ProductType;
  label: string;
  description: string;
  icon?: string;
}

export type ProductType = 'submission' | 'strategy' | 'upgrade';

/**
 * Setup wizard state tracking
 */
export interface SetupWizardState {
  currentStep: 1 | 2 | 3;
  isComplete: boolean;
  projectProfile: ProjectProfile | null;
  programProfile: FundingProgram | null;
  documentStructure: DocumentStructure | null;
  documentTemplateId?: DocumentTemplateId | null;
  setupStatus: 'none' | 'draft' | 'confirmed' | 'locked';
  setupDiagnostics?: {
    warnings: string[];
    missingFields: string[];
    confidence: number;
  };
  inferredProductType?: string | null;
}

// Import for type reference
import type { FundingProgram } from './program';
