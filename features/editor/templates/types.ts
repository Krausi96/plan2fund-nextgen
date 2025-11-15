// ========= PLAN2FUND — EDITOR TEMPLATE TYPES =========
// Types for section templates (used by editor only)

/**
 * Question for guided editing mode
 */
export interface SectionQuestion {
  text: string;
  required: boolean;
  placeholder?: string;
  hint?: string;
}

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
  questions?: SectionQuestion[]; // Optional questions for guided editing mode
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

