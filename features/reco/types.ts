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
  options: Array<{ value: string; label: string }>;
  hasOtherTextInput?: boolean;
  hasOptionalRegion?: (value: string) => boolean;
  hasCoFinancingPercentage?: boolean;
};

export type MultiSelectQuestion = BaseQuestion & {
  type: 'multi-select';
  options: Array<{ value: string; label: string }>;
  hasOtherTextInput?: boolean;
  subCategories?: Record<string, { value: string; label: string }[]>;
};

export type RangeQuestion = BaseQuestion & {
  type: 'range';
  min: number;
  max: number;
  step: number;
  unit: string;
  editableValue?: boolean;
};

export type QuestionDefinition = SingleSelectQuestion | MultiSelectQuestion | RangeQuestion;

export interface ProgramFinderProps {
  onProgramSelect?: (programId: string, route: string) => void;
}




