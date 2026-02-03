// Define subsection template
export interface SubsectionTemplate {
  id: string;
  title: string;
  rawText: string;
}

export interface SectionTemplate {
  id: string;
  title: string;
  description: string;
  required: boolean;
  wordCountMin?: number;
  wordCountMax?: number;
  order?: number;
  category: 'general' | 'project' | 'impact' | 'financial' | 'market' | 'team' | 'risk' | 'submission' | 'strategy' | 'review' | 'business';
  prompts?: string[];
  validationRules?: {
    requiredFields?: string[];
    formatRequirements?: string[];
  };
  source?: {
    verified: boolean;
    verifiedDate?: string;
    officialProgram?: string;
    sourceUrl?: string;
    version?: string;
  };
  origin?: 'template' | 'custom';
  sectionIntro?: string;
  rawSubsections?: SubsectionTemplate[];
  [key: string]: any;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  required: boolean;
  format: 'pdf' | 'docx' | 'xlsx';
  maxSize: string;
  template?: string;
  instructions?: string[];
  examples?: string[];
  commonMistakes?: string[];
  category: 'general' | 'project' | 'impact' | 'financial' | 'market' | 'team' | 'risk' | 'submission' | 'strategy' | 'review' | 'business';
  fundingTypes?: string[];
  origin?: 'template' | 'custom';
  [key: string]: any;
}