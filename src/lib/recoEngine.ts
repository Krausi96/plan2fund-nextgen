import programs from "@/data/fundingPrograms.json";

export type UserAnswers = {
  sector: string;
  location: string;
  stage: string;
  need: string;
  fundingSize?: number;
  freeText?: string;
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

// ✅ NEW: normalizeAnswers (stub, later GPT)
export function normalizeAnswers(freeText: string): UserAnswers {
  const text = freeText.toLowerCase();

  let sector = "";
  if (text.includes("tech") || text.includes("ai")) sector = "Tech";
  else if (text.includes("retail") || text.includes("shop")) sector = "Retail";
  else sector = "Other";

  let stage = "Early";
  if (text.includes("idea")) stage = "Idea";
  else if (text.includes("growth") || text.includes("expand")) stage = "Growth";

  let need = "Loan";
  if (text.includes("grant")) need = "Grant";
  else if (text.includes("visa")) need = "Visa";
  else if (text.includes("coach")) need = "Coaching";

  let location = "Other";
  if (text.includes("vienna") || text.includes("austria")) location = "AT";
  else if (text.includes("germany")) location = "DE";
  else if (text.includes("eu")) location = "EU";

  let fundingSize: number | undefined = undefined;
  const match = text.match(/\\d{4,6}/); // crude number detection
  if (match) fundingSize = Number(match[0]);

  return { sector, stage, need, location, fundingSize, freeText };
}

// ✅ NEW: generateReason (stub, later GPT)
export function generateReason(program: Program, answers: UserAnswers, unmetRequirements: string[], score: number): string {
  if (unmetRequirements.length > 0) {
    return `Not eligible because missing requirements: ${unmetRequirements.join(", ")}.`;
  }

  let reasons: string[] = [];
  if (program.needs.includes(answers.need)) reasons.push(`Matches your funding need: ${answers.need}`);
  if (answers.fundingSize && answers.fundingSize <= program.maxAmount)
    reasons.push(`Requested funding fits (≤ €${program.maxAmount.toLocaleString()})`);
  if (program.region === answers.location) reasons.push(`Region matches: ${program.region}`);
  if (program.targetStage === answers.stage || program.targetStage === "Any") reasons.push(`Stage matches: ${answers.stage}`);

  return reasons.length > 0
    ? `Eligible: ${reasons.join("; ")}. Final score ${score}%`
    : `Partially matched, score ${score}%.`;
}

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

    // Sector (partial stub)
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

    const finalScore = Math.round(score * 100);
    const reason = generateReason(program, answers, unmetRequirements, finalScore);

    return {
      ...program,
      score: finalScore,
      reason,
      eligibility,
      confidence,
      unmetRequirements,
      debug,
    };
  }).sort((a, b) => b.score - a.score);
}
