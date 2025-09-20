export type UserAnswers = Record<string, any>;

export type UserProfile = {
  id: string;
  segment: 'B2C_FOUNDER' | 'SME_LOAN' | 'VISA_APPLICANT' | 'MIXED';
  programType: 'GRANT' | 'LOAN' | 'EQUITY' | 'VISA' | 'MIXED';
  country?: string;
  stage?: string;
  theme?: string;
  industry?: string;
  teamSize?: string;
  amount?: string;
  duration?: string;
};

export type Program = {
  id: string;
  name: string;
  type: string;
  requirements: Record<string, any>;
  notes?: string;
  maxAmount?: number;
  link?: string;
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
