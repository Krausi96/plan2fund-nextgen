/**
 * Shared types for ProgramFinder component
 */

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
  organisation_type?: string | null;  // renamed from company_type
  eligible_company_types?: string[] | null;  // renamed from organisation_type
  eligible_stage?: string | null;  // renamed from company_stage
}

export interface EnhancedProgramResult extends Program {
  // All fields from Program are available
  // Removed unused fields: score, confidence, eligibility, reason, matchedCriteria, gaps
}

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





