export type UserAnswers = Record<string, any>;

export type UserProfile = {
  id: string;
  segment: 'B2C_FOUNDER' | 'SME_LOAN' | 'VISA_APPLICANT' | 'MIXED';
  programType: 'grant' | 'loan' | 'equity' | 'visa' | 'consulting' | 'service' | 'other';
  country?: string;
  stage?: string;
  theme?: string;
  industry?: string;
  teamSize?: string;
  amount?: string;
  duration?: string;
};

export type ProgramType = 'grant' | 'loan' | 'equity' | 'visa' | 'consulting' | 'service' | 'other';

export type Program = {
  id: string;
  name: string;
  type: ProgramType;
  program_type: ProgramType;
  program_category: string;
  requirements: Record<string, any>;
  notes?: string;
  maxAmount?: number;
  link?: string;
  // GPT-enhanced fields
  target_personas?: string[];
  tags?: string[];
  decision_tree_questions?: any[];
  editor_sections?: any[];
  readiness_criteria?: any[];
  ai_guidance?: any;
  // Layer 1&2 categorized requirements
  categorized_requirements?: any;
};

export type ScoredProgram = Program & {
  score: number;
  reason: string;
  eligibility: string;
  confidence: "High" | "Medium" | "Low";
  unmetRequirements?: string[];
  source?: string;
  scores?: {
    fit: number;
    readiness: number;
    effort: number;
    confidence: number;
  };
  why?: string[];
};
