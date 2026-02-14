/**
 * Program types consolidated from features/reco/types.ts and features/editor/lib/types/program/
 * Central location for all funding program and recommendation-related types
 */

export type FundingType =
  | 'grant'
  | 'loan'
  | 'equity'
  | 'angel_investment'
  | 'venture_capital'
  | 'crowdfunding'
  | 'bank_loan'
  | 'leasing'
  | 'micro_credit'
  | 'repayable_advance'
  | 'guarantee'
  | 'visa_application'
  | 'subsidy'
  | 'convertible';

export interface Program {
  id: string;
  name: string;
  type?: string;
  program_type?: string;
  description?: string;
  url?: string | null;
  source_url?: string | null;
  region?: string | null;
  funding_types?: string[];
  funding_amount_min?: number | null;
  funding_amount_max?: number | null;
  currency?: string;
  amount?: {
    min: number;
    max: number;
    currency: string;
  };
  program_focus?: string[];
  company_type?: string | null;
  company_stage?: string | null;
  categorized_requirements?: Record<string, any[]>;
  metadata?: Record<string, any>;

  // New fields for decision-critical information
  repayable?: boolean | null;
  repayable_percentage?: number | null;
  repayable_type?: 'grant' | 'loan' | 'mixed' | 'convertible' | null;

  timeline?: {
    application_deadline: string | null;
    decision_time: string | null;
    funding_start: string | null;
  };

  effort_level?: 'low' | 'medium' | 'heavy';

  // Renamed fields (kept for compatibility)
  organisation_type?: string | null; // renamed from company_type
  eligible_company_types?: string[] | null; // renamed from organisation_type
  eligible_stage?: string | null; // renamed from company_stage
}

// DEPRECATED: EnhancedProgramResult removed - use FundingProgram instead

/**
 * Summary of a selected program for compact display
 * Used in setup wizard and editor
 */
export interface ProgramSummary {
  id: string;
  name: string;
  provider?: string;
  fundingTypes: FundingType[];
  amountRange?: {
    min: number;
    max: number;
    currency: string;
  };
  deadline?: string;
  description?: string;
}

/**
 * Normalized representation of a funding program after analysis
 * Single source of truth for all program data
 */
export interface FundingProgram {
  id: string;
  name: string;
  provider: string;
  fundingTypes: FundingType[];
  amountRange: {
    min: number;
    max: number;
  };
  deadline: string;
  applicationRequirements: {
    documents: DocumentRequirement[];
    sections: SectionRequirement[];
    financialRequirements: FinancialRequirement[];
  };
  // DEPRECATED: blueprint removed - diagnostics now in setupDiagnostics
  analysis?: AnalysisMetadata;
}

export interface DocumentRequirement {
  documentId: string;
  name: string;
  purpose: string;
  required: boolean;
  hints?: string[];
}

export interface SectionRequirement {
  sectionId: string;
  title: string;
  required: boolean;
  programCritical: boolean;
  hints?: string[];
}

export interface FinancialRequirement {
  type: 'revenue' | 'profitability' | 'cash_flow' | 'equity';
  minThreshold?: number;
  description?: string;
}

// DEPRECATED: BlueprintData removed - diagnostics now in setupDiagnostics

export interface AnalysisMetadata {
  confidence: number;
  detectedSections: SectionDetection[];
  warnings: string[];
}

export interface SectionDetection {
  sectionId: string;
  title: string;
  confidence: number;
}

// Question types for program finder questionnaire

export type BaseQuestion = {
  id: string;
  label: string;
  required: boolean;
  priority: number;
  isAdvanced: boolean;
};

export type SingleSelectQuestion = BaseQuestion & {
  type: 'single-select';
  options: Array<{ value: string; label: string; group?: string }>;
  hasOtherTextInput?: boolean;
  hasOptionalRegion?: (value: string) => boolean;
  hasOptionalTextField?: (value: string) => boolean;
  hasCoFinancingPercentage?: boolean;
  hasSubOptions?: (value: string) => boolean;
  subOptions?: Record<string, Array<{ value: string; label: string }>>;
  hasGroups?: boolean;
  parentQuestion?: string;
  parentValue?: string;
};

export type MultiSelectQuestion = BaseQuestion & {
  type: 'multi-select';
  options: Array<{ value: string; label: string; group?: string }>;
  hasOtherTextInput?: boolean;
  subCategories?: Record<string, { value: string; label: string }[]>;
  hasGroups?: boolean;
  parentQuestion?: string;
  parentValue?: string;
};

export type RangeQuestion = BaseQuestion & {
  type: 'range';
  min: number;
  max: number;
  step: number;
  unit: string;
  editableValue?: boolean;
  hasGroups?: boolean;
  parentQuestion?: string;
  parentValue?: string;
  revenueRanges?: Array<{ min: number; max: number; label: string; value: string }>;
};

export type TextQuestion = BaseQuestion & {
  type: 'text';
  placeholder?: string;
  maxLength?: number;
  minLength?: number;
  multiline?: boolean;
  helpText?: string;
};

export type QuestionDefinition = SingleSelectQuestion | MultiSelectQuestion | RangeQuestion | TextQuestion;

export interface ProgramFinderProps {
  onProgramSelect?: (programId: string, route: string) => void;
  wizardMode?: boolean; // Enable step-by-step wizard mode
  editorMode?: boolean; // Simplified layout for editor embedding
}
