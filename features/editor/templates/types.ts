// ============================================================================
// TEMPLATE TYPES
// ============================================================================

export interface SectionQuestion {
  text: string;
  required: boolean;
  placeholder?: string;
  hint?: string;
}

export interface SectionTemplate {
  id: string;
  title: string;
  description: string;
  required: boolean;
  wordCountMin: number;
  wordCountMax: number;
  order: number;
  category: string;
  prompts: string[];
  questions?: SectionQuestion[];
  validationRules: {
    requiredFields: string[];
    formatRequirements: string[];
  };
  source?: {
    verified: boolean;
    verifiedDate?: string;
    officialProgram?: string;
    sourceUrl?: string;
    version?: string;
  };
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  required: boolean;
  format: 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'text';
  maxSize: string;
  template: string;
  instructions: string[];
  examples: string[];
  commonMistakes: string[];
  category: string;
  fundingTypes: string[];
  isVariable?: boolean;
  defaultStructure?: string;
  source?: {
    verified: boolean;
    verifiedDate?: string;
    officialProgram?: string;
    sourceUrl?: string;
    version?: string;
  };
}

// Type aliases for backward compatibility
export type StandardSection = SectionTemplate;
export type AdditionalDocument = DocumentTemplate;

