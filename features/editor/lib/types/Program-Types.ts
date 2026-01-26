/**
 * DOCUMENT SETUP TYPES
 * 
 * Contains TypeScript interfaces for Step 2: Document Setup functionality.
 * Defines program connection, document structure, and setup wizard types.
 */

/**
 * FundingProgram - Normalized funding program data for document setup
 * Contains structured information about grants, loans, or investment programs
 */
export interface FundingProgram {
  id: string;
  name: string;
  provider: string;
  region: string;
  
  // Program characteristics
  fundingTypes: ('grant' | 'loan' | 'equity' | 'subsidy')[];
  amountRange?: { min?: number; max?: number; currency: string };
  deadline?: string;
  
  // Focus and requirements
  useOfFunds: string[];
  coFinancingRequired: boolean;
  coFinancingPercentage?: number;
  focusAreas: string[];
  
  // Deliverables and requirements
  deliverables: string[];
  requirements: string[];
  formattingRules: {
    length?: { minPages?: number; maxPages?: number };
    language?: string;
    attachments?: string[];
  };
  
  // Evidence requirements
  evidenceRequired: string[];
  
  // Raw data for traceability
  rawData: any;
}

/**
 * DocumentStructure - Complete document structure and requirements
 * Generated from funding program data to define what documents/sections are needed
 */
export interface DocumentStructure {
  structureId: string;
  version: string;
  source: 'program' | 'template' | 'standard';
  
  // Document structure
  documents: Array<{
    id: string;
    name: string;
    purpose: string;
    required: boolean;
    templateId?: string;
  }>;
  
  // Section structure
  sections: Array<{
    id: string;
    documentId: string;
    title: string;
    type: 'required' | 'optional' | 'conditional';
    required: boolean;
    programCritical: boolean;
    aiPrompt?: string;
    checklist?: string[];
  }>;
  
  // Requirements
  requirements: Array<{
    id: string;
    scope: 'section' | 'document' | 'global';
    category: 'financial' | 'market' | 'team' | 'risk' | 'formatting' | 'evidence';
    severity: 'blocker' | 'major' | 'minor';
    rule: string;
    target?: any;
    evidenceType?: string;
  }>;
  
  // Validation
  validationRules: Array<{
    id: string;
    type: 'presence' | 'completeness' | 'numeric' | 'attachment' | 'formatting' | 'consistency';
    scope: string;
    condition?: string;
    errorMessage: string;
  }>;
  
  // AI Guidance
  aiGuidance: Array<{
    sectionId: string;
    prompt: string;
    checklist: string[];
    examples?: string[];
  }>;
  
  // Rendering rules
  renderingRules: {
    titlePage?: Record<string, any>;
    tableOfContents?: Record<string, any>;
    references?: Record<string, any>;
    appendices?: Record<string, any>;
  };
  
  // Diagnostics
  conflicts: string[];
  warnings: string[];
  confidenceScore: number; // 0-100
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Document setup status and diagnostics
export interface SetupDiagnostics {
  warnings: string[];
  missingFields: string[];
  confidence: number;
}

export type SetupStatus = 'none' | 'draft' | 'confirmed' | 'locked';
export type SetupSource = 'program' | 'template' | 'standard';