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
  
  // Enhanced Application Requirements
  applicationRequirements: {
    documents: Array<{
      document_name: string;
      required: boolean;
      format: string;
      authority: string;
      reuseable: boolean;
    }>;
    sections: Array<{
      title: string;
      required: boolean;
      subsections: Array<{ title: string; required: boolean }>;
    }>;
    financialRequirements: {
      financial_statements_required: string[];
      years_required: number[];
      co_financing_proof_required: boolean;
      own_funds_proof_required: boolean;
    };
  };
  
  // ENHANCED BLUEPRINT DATA (NEW)
  blueprint?: {
    // Enhanced structured requirements
    enhancedRequirements?: Array<{
      category: 'financial' | 'market' | 'team' | 'risk' | 'formatting' | 'evidence';
      scope: 'global' | 'document' | 'section';
      severity: 'blocker' | 'major' | 'minor';
      description: string;
      evidenceType: string;
      validationLogic: string;
    }>;
    
    // Detailed category requirements
    financialDetails?: {
      modelsRequired: string[];
      yearsRequired: number[];
      coFinancingChecks: string[];
      budgetStructure: string;
    };
    
    marketAnalysis?: {
      tamSamSom: boolean;
      competitionDepth: string;
      customerProof: string[];
    };
    
    teamRequirements?: {
      orgStructure: string;
      cvRules: string[];
      keyRoles: string[];
    };
    
    riskAssessment?: {
      categories: string[];
      mitigation: string[];
      regulatoryRisks: string[];
    };
    
    formattingRules?: {
      pageLimits: string;
      language: string;
      annexRules: string;
    };
    
    aiGuidance?: {
      perSectionChecklist: Array<{ section: string; items: string[] }>;
      perSectionPrompts: Array<{ section: string; prompt: string }>;
    };
    
    diagnostics?: {
      confidenceScore: number;
      conflicts: string[];
      assumptions: string[];
      missingDataFlags: string[];
    };
  };
  
  // Blueprint metadata
  blueprintVersion?: string;
  blueprintStatus?: 'none' | 'draft' | 'confirmed' | 'locked';
  blueprintSource?: 'program' | 'template' | 'standard' | 'myproject';
  blueprintDiagnostics?: {
    warnings: string[];
    missingFields: string[];
    confidence: number;
  };
  
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
    detection?: {
      source: 'upload' | 'ocr' | 'program';
      confidence: number;
      payload?: any;
    };
    // Template-specific properties
    rawSubsections?: Array<{ id: string; title: string; rawText: string }>;
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

/**
 * ProgramSummary - Unified program data structure
 * Used for displaying program information and document setup
 */
export interface ProgramSummary {
  id: string;
  name: string;
  type?: string;
  amountRange?: string;
  deadline?: string;
  // Document setup enhancement fields
  source?: 'program' | 'template' | 'standard';
  requiredDocuments?: string[];
  requiredSections?: string[];
  requirementSchemas?: any[];
  validationRules?: any[];
  formattingRules?: any[];
  complianceStrictness?: 'low' | 'medium' | 'high';
  programFocus?: string[];
  fundingTypes?: string[];
  useOfFunds?: string[];
  coFinancingRequired?: boolean;
  region?: string;
  organization?: string;
  typicalTimeline?: string;
  competitiveness?: string;
  categorizedRequirements?: Record<string, any>;
  // Document setup tracking (new fields)
  documentStructure?: DocumentStructure;
  setupStatus?: 'none' | 'draft' | 'confirmed' | 'locked';
  setupVersion?: string;
  setupSource?: 'program' | 'template' | 'standard';
  setupDiagnostics?: {
    warnings: string[];
    missingFields: string[];
    confidence: number;
  };
  [key: string]: any;
}