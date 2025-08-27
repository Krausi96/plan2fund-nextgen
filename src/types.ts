export type UserAnswers = Record<string, any>;

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
};
