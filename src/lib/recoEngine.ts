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

export type ScoreBreakdown = {
  factor: string;
  matched: boolean;
  weight: number;
  points: number;
};

export type ScoredProgram = Program & {
  score: number;
  reason: string;
  eligibility: "Eligible" | "Not Eligible";
  confidence: "High" | "Medium" | "Low";
  unmetRequirements: string[];
  debug: ScoreBreakdown[];
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
    let debug: ScoreBreakdown[] = [];
    let unmetRequirements: string[] = [];

    // Location
    const locationMatch = program.region === answers.location;
    score += locationMatch ? weights.location : 0;
    debug.push({ factor: "Location", matched: locationMatch, weight: weights.location, points: locationMatch ? weights.location : 0 });

    // Stage
    const stageMatch = program.targetStage === answers.stage || program.targetStage === "Any";
    score += stageMatch ? weights.stage : 0;
    debug.push({ factor: "Stage", matched: stageMatch, weight: weights.stage, points: stageMatch ? weights.stage : 0 });

    // Need
    const needMatch = program.needs.includes(answers.need);
    score += needMatch ? weights.need : 0;
    debug.push({ factor: "Need", matched: needMatch, weight: weights.need, points: needMatch ? weights.need : 0 });

    // Funding size
    const fundingMatch = !answers.fundingSize || answers.fundingSize <= program.maxAmount;
    score += fundingMatch ? weights.fundingSize : 0;
    debug.push({ factor: "Funding Size", matched: fundingMatch, weight: weights.fundingSize, points: fundingMatch ? weights.fundingSize : 0 });

    // Sector (currently stub: partial match gives half credit)
    const sectorMatch = !!answers.sector;
    score += sectorMatch ? weights.sector * 0.5 : 0;
    debug.push({ factor: "Sector", matched: sectorMatch, weight: weights.sector, points: sectorMatch ? weights.sector * 0.5 : 0 });

    // Requirements check
    program.requirements.forEach((req) => {
      if (!answers.sector.toLowerCase().includes("tech") && req.toLowerCase().includes("technology")) {
        unmetRequirements.push(req);
      }
    });

    // Eligibility logic
    const eligibility = unmetRequirements.length > 0 ? "Not Eligible" : score > 0.5 ? "Eligible" : "Not Eligible";

    // Confidence logic
    const confidence = score > 0.7 ? "High" : score > 0.4 ? "Medium" : "Low";

    return {
      ...program,
      score: Math.round(score * 100),
      reason: unmetRequirements.length > 0
        ? `Not eligible: missing ${unmetRequirements.join(", ")}`
        : `Eligible with score ${Math.round(score * 100)}%`,
      eligibility,
      confidence,
      unmetRequirements,
      debug,
    };
  }).sort((a, b) => b.score - a.score);
}
