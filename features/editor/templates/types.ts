// ============================================================================
// TEMPLATE TYPES
// ============================================================================

export interface SectionQuestion {
  text: string;
  required: boolean;
  placeholder?: string;
  hint?: string;
  // Customization fields
  customText?: string; // User-edited question text
  customHint?: string; // User-added helper hint
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
  // Template simplification metadata
  visibility?: 'essential' | 'advanced' | 'programOnly'; // Controls progressive disclosure
  origin?: 'master' | 'program' | 'custom'; // Source of the template
  severity?: 'soft' | 'hard'; // Requirement severity (soft = recommended, hard = mandatory)
  tags?: string[]; // Keywords to map program requirements to sections
  programId?: string; // ID of program that added this (if origin is 'program')
  disabled?: boolean; // User toggle to exclude optional sections
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
  // Template simplification metadata
  origin?: 'master' | 'program' | 'custom'; // Source of the document
  programId?: string; // ID of program that added this (if origin is 'program')
  disabled?: boolean; // User toggle to exclude optional documents
}

// Type aliases for backward compatibility
export type StandardSection = SectionTemplate;
export type AdditionalDocument = DocumentTemplate;

