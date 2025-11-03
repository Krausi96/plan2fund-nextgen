// ========= PLAN2FUND — TEMPLATE TYPES =========

/**
 * Section template (for main business plan sections)
 */
export interface SectionTemplate {
  id: string;
  title: string;
  description: string;
  required: boolean;
  wordCountMin: number;
  wordCountMax: number;
  order: number;
  category: string; // Maps to requirement categories
  prompts: string[];
  validationRules: {
    requiredFields: string[];
    formatRequirements: string[];
  };
  // Source tracking
  source?: {
    verified: boolean;
    verifiedDate?: string;
    officialProgram?: string;
    sourceUrl?: string;
    version?: string;
  };
}

/**
 * Document template (for additional documents)
 */
export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  required: boolean;
  format: 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'text';
  maxSize: string;
  template: string; // Full markdown/text template
  instructions: string[];
  examples: string[];
  commonMistakes: string[];
  category: string;
  fundingTypes: string[];
  // Variable document support
  isVariable?: boolean; // If true, user can customize structure
  defaultStructure?: string; // Default structure if variable
  // Source tracking
  source?: {
    verified: boolean;
    verifiedDate?: string;
    officialProgram?: string;
    sourceUrl?: string;
    version?: string;
  };
}

