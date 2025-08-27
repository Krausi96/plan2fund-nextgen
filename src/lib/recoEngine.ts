import programs from "@/data/fundingPrograms.json";

export type UserAnswers = {
  sector: string;
  location: string;
  stage: string;
  need: string;
  fundingSize?: number;
};

export type Program = {
  id: string;
  name: string;
  type: string;
  region: string;
  targetStage: string;
  needs: string[];
  requirements: string[];
  maxAmount: number;
  link: string;
};

export type ScoredProgram = Program & {
  score: number;
  reason: string;
  eligibility: "Eligible" | "Not Eligible";
  confidence: "High" | "Medium" | "Low";
};

const weights = {
  sector: 0.25,
  location: 0.1,
  stage: 0.25,
  need: 0.3,
  fundingSize: 0.1,
};

export function scorePrograms(answers: UserAnswers): ScoredProgram[] {
  return (programs as Program[]).map((program) => {
    let score = 0;

    // Simple scoring rules
    if (program.region === answers.location) score += weights.location;
    if (program.targetStage === answers.stage || program.targetStage === "Any") score += weights.stage;
    if (program.needs.includes(answers.need)) score += weights.need;
    if (!answers.fundingSize || answers.fundingSize <= program.maxAmount) score += weights.fundingSize;

    // Sector matching stub → expand later
    if (answers.sector) score += weights.sector * 0.5;

    const eligibility = score > 0.5 ? "Eligible" : "Not Eligible";
    const confidence = score > 0.7 ? "High" : score > 0.4 ? "Medium" : "Low";

    return {
      ...program,
      score: Math.round(score * 100),
      reason: `Matched on ${eligibility} criteria.`,
      eligibility,
      confidence,
    };
  }).sort((a, b) => b.score - a.score);
}
