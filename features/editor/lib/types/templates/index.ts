// ============================================================================
// TEMPLATE TYPES
// ============================================================================

export interface SectionQuestion {
  text: string;
  required: boolean;
  placeholder?: string;
  hint?: string;
  // User customization fields (Section 1)
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
  // Template simplification metadata (Section 5)
  visibility?: 'essential' | 'advanced' | 'programOnly'; // For progressive disclosure
  origin?: 'master' | 'program' | 'custom'; // Source of this section
  severity?: 'soft' | 'hard'; // Requirement severity (Section 2)
  tags?: string[]; // Tags to map program requirements (Section 2)
  programId?: string; // ID of program that added this (if origin is 'program')
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
  // Template simplification metadata (Section 5)
  origin?: 'master' | 'program' | 'custom'; // Source of this document
  programId?: string; // ID of program that added this (if origin is 'program')
}

// Type aliases for backward compatibility
export type StandardSection = SectionTemplate;
export type AdditionalDocument = DocumentTemplate;

