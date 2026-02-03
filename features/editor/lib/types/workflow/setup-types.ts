import type { ProductType } from '../core/product-types';
import type { FundingProgram, DocumentStructure } from '../program/program-types';

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
  stage: 'idea' | 'MVP' | 'revenue' | 'growth' | 'established';
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
export type DocumentTemplateId = 'business-plan' | 'pitch-deck' | 'executive-summary' | 'strategy' | 'upgrade' | 'custom';

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