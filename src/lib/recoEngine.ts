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
  unmetRequirements: string[];
};

// --- Core Scoring Logic ---
export function scorePrograms(answers: UserAnswers): ScoredProgram[] {
  return (programs as Program[]).map((program) => {
    let score = 0;
    const unmetRequirements: string[] = [];

    // Evaluate each requirement dynamically
    for (const [key, requirement] of Object.entries(program.requirements)) {
      const answer = answers[key];

      if (answer === undefined || answer === null || answer === "") {
        unmetRequirements.push(`${key} is missing`);
        continue;
      }

      // Handle ranges and arrays
      if (Array.isArray(requirement)) {
        if (requirement.includes(answer)) {
          score += 1;
        } else {
          unmetRequirements.push(`${key} does not match (${answer})`);
        }
      } else if (typeof requirement === "number") {
        if (answer <= requirement) {
          score += 1;
        } else {
          unmetRequirements.push(`${key} exceeds maximum (${answer})`);
        }
      } else if (typeof requirement === "object" && requirement.min !== undefined) {
        if (answer >= requirement.min) {
          score += 1;
        } else {
          unmetRequirements.push(`${key} is below minimum (${answer})`);
        }
      } else if (typeof requirement === "object" && requirement.max !== undefined) {
        if (answer <= requirement.max) {
          score += 1;
        } else {
          unmetRequirements.push(`${key} exceeds maximum (${answer})`);
        }
      } else {
        // Fallback: strict equality
        if (answer === requirement) {
          score += 1;
        } else {
          unmetRequirements.push(`${key} mismatch (${answer})`);
        }
      }
    }

    // Normalize score to percentage
    const totalRequirements = Object.keys(program.requirements).length;
    const scorePercent =
      totalRequirements > 0 ? Math.round((score / totalRequirements) * 100) : 0;

    // Eligibility
    const eligibility =
      unmetRequirements.length === 0 ? "Eligible" : "Not Eligible";

    // Reason string
    const reason = generateReason(program, answers, unmetRequirements, scorePercent);

    return {
      ...program,
      score: scorePercent,
      reason,
      eligibility,
      unmetRequirements,
    };
  }).sort((a, b) => b.score - a.score);
}

// --- Reason Generator ---
export function generateReason(
  program: Program,
  answers: UserAnswers,
  unmetRequirements: string[],
  score: number
): string {
  if (unmetRequirements.length === 0) {
    return `✅ You meet all requirements for ${program.name}. Score: ${score}%`;
  }
  return `⚠️ ${program.name} partially matches your profile (Score: ${score}%). Missing: ${unmetRequirements.join(
    ", "
  )}`;
}
