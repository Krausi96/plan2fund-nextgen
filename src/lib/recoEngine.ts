import programs from "@/data/fundingPrograms.json";

// --- Types ---
export type UserAnswers = {
  [key: string]: any; // canonical keys from questions.json (e.g. "location", "stage")
};

export type Program = {
  id: string;
  name: string;
  type: string;
  requirements: Record<string, any>;
  maxAmount?: number | null;
  link: string;
  notes?: string;
};

export type ScoredProgram = Program & {
  score: number;
  reason: string;
  eligibility: "Eligible" | "Not Eligible";
  confidence: "High" | "Medium" | "Low";
  unmetRequirements: string[];
};

// --- New: AI Normalization ---
export function normalizeAnswers(raw: Record<string, string>): UserAnswers {
  const normalized: UserAnswers = {};

  for (const [key, value] of Object.entries(raw)) {
    if (!value) continue;
    const lower = value.toLowerCase().trim();

    // Example mappings (can be extended with NLP/AI later)
    if (key === "sector") {
      if (lower.includes("bakery") || lower.includes("restaurant") || lower.includes("food")) {
        normalized["sector"] = "Food";
      } else if (lower.includes("tech") || lower.includes("software") || lower.includes("ai")) {
        normalized["sector"] = "Technology";
      } else {
        normalized["sector"] = value;
      }
    } else if (key === "purpose") {
      if (lower.includes("loan")) normalized["purpose"] = "Loan";
      else if (lower.includes("grant")) normalized["purpose"] = "Grant";
      else normalized["purpose"] = value;
    } else {
      normalized[key] = value;
    }
  }

  return normalized;
}

// --- Core Scoring Logic ---
export function scorePrograms(answers: UserAnswers): ScoredProgram[] {
  return (programs as Program[]).map((program) => {
    let score = 0;
    const unmetRequirements: string[] = [];
    const matchedRequirements: string[] = [];

    for (const [key, requirement] of Object.entries(program.requirements)) {
      const answer = answers[key];

      if (answer === undefined || answer === null || answer === "") {
        unmetRequirements.push(`${key} is missing`);
        continue;
      }

      if (Array.isArray(requirement)) {
        if (requirement.includes(answer)) {
          score += 1;
          matchedRequirements.push(`${key}=${answer}`);
        } else {
          unmetRequirements.push(`${key} does not match (${answer})`);
        }
      } else if (typeof requirement === "number") {
        if (answer <= requirement) {
          score += 1;
          matchedRequirements.push(`${key}<=${requirement}`);
        } else {
          unmetRequirements.push(`${key} exceeds maximum (${answer})`);
        }
      } else if (typeof requirement === "object" && requirement.min !== undefined) {
        if (answer >= requirement.min) {
          score += 1;
          matchedRequirements.push(`${key}>=${requirement.min}`);
        } else {
          unmetRequirements.push(`${key} is below minimum (${answer})`);
        }
      } else if (typeof requirement === "object" && requirement.max !== undefined) {
        if (answer <= requirement.max) {
          score += 1;
          matchedRequirements.push(`${key}<=${requirement.max}`);
        } else {
          unmetRequirements.push(`${key} exceeds maximum (${answer})`);
        }
      } else {
        if (answer === requirement) {
          score += 1;
          matchedRequirements.push(`${key}=${answer}`);
        } else {
          unmetRequirements.push(`${key} mismatch (${answer})`);
        }
      }
    }

    // Normalize score to percentage
    const totalRequirements = Object.keys(program.requirements).length;
    const scorePercent = totalRequirements > 0 ? Math.round((score / totalRequirements) * 100) : 0;

    // Eligibility
    const eligibility = unmetRequirements.length === 0 ? "Eligible" : "Not Eligible";

    // Confidence scoring
    let confidence: "High" | "Medium" | "Low" = "Low";
    if (scorePercent >= 80) confidence = "High";
    else if (scorePercent >= 50) confidence = "Medium";

    // Explainable reason
    const reason = generateReason(program, matchedRequirements, unmetRequirements, scorePercent);

    return {
      ...program,
      score: scorePercent,
      reason,
      eligibility,
      confidence,
      unmetRequirements,
    };
  }).sort((a, b) => b.score - a.score);
}

// --- Improved Reason Generator ---
export function generateReason(
  program: Program,
  matched: string[],
  unmet: string[],
  score: number
): string {
  if (unmet.length === 0) {
    return `? You meet all requirements for ${program.name}. Strong fit with score ${score}%.`;
  }
  return `?? ${program.name} matches ${matched.length} requirement(s) but has issues: ${unmet.join(
    ", "
  )}. (Score: ${score}%)`;
}
