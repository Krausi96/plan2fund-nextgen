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
  description?: string;
  sections: TemplateSection[];
  documents?: TemplateDocument[];
  metadata?: Record<string, any>;
}

export interface TemplateSection {
  id: string;
  title: string;
  type?: string;
  order?: number;
}

export interface TemplateDocument {
  id: string;
  name: string;
  order?: number;
}

/**
 * Setup wizard state tracking
 */
export interface SetupWizardState {
  currentStep: 1 | 2 | 3;
  isComplete: boolean;
  projectProfile: ProjectProfile | null;
  programProfile: FundingProgram | null;
  documentStructure: DocumentStructure | null;
  documentTemplateId?: string | null;
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
