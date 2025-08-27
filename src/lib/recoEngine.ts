import programs from "@/data/programs.json";
import { Program, UserAnswers, ScoredProgram } from "@/types";

export function normalizeAnswers(answers: UserAnswers): UserAnswers {
  const normalized: UserAnswers = {};
  for (const [key, value] of Object.entries(answers)) {
    if (typeof value === "string") {
      normalized[key] = value.trim().toLowerCase();
    } else {
      normalized[key] = value;
    }
  }
  return normalized;
}

// --- Core Scoring Logic with Persona Mode ---
export function scorePrograms(
  answers: UserAnswers,
  mode: "strict" | "explorer" = "strict"
): ScoredProgram[] {
  return (programs as Program[]).map((program) => {
    let score = 0;
    const unmetRequirements: string[] = [];
    const matchedRequirements: string[] = [];

    for (const [key, requirement] of Object.entries(program.requirements)) {
      const answer = answers[key];

      if (answer === undefined || answer === null || answer === "") {
        if (mode === "strict") {
          unmetRequirements.push(`${key} is missing`);
        }
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

    const totalRequirements = Object.keys(program.requirements).length;
    const scorePercent = totalRequirements > 0 ? Math.round((score / totalRequirements) * 100) : 0;

    const eligibility =
      mode === "strict"
        ? unmetRequirements.length === 0
          ? "Eligible"
          : "Not Eligible"
        : scorePercent > 0
        ? "Eligible"
        : "Not Eligible";

    let confidence: "High" | "Medium" | "Low" = "Low";
    if (scorePercent >= 80) confidence = "High";
    else if (scorePercent >= 50) confidence = "Medium";

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
    return `✅ You meet all requirements for ${program.name}. Strong fit with score ${score}%.`;
  }
  return `ℹ️ ${program.name} matches ${matched.length} requirement(s) but has issues: ${unmet.join(
    ", "
  )}. (Score: ${score}%)`;
}

/**
 * Analyze free-text description and normalize into structured answers.
 */
export function analyzeFreeText(description: string): { normalized: UserAnswers; scored: ScoredProgram[] } {
  const normalized: UserAnswers = {};
  const lower = description.toLowerCase();

  if (lower.includes("bakery") || lower.includes("restaurant") || lower.includes("food")) {
    normalized["sector"] = "Food";
  } else if (lower.includes("tech") || lower.includes("software") || lower.includes("ai")) {
    normalized["sector"] = "Technology";
  } else if (lower.includes("manufacturing")) {
    normalized["sector"] = "Manufacturing";
  }

  if (lower.includes("loan")) {
    normalized["purpose"] = "Loan";
  } else if (lower.includes("grant")) {
    normalized["purpose"] = "Grant";
  } else if (lower.includes("funding")) {
    normalized["purpose"] = "Funding";
  }

  if (lower.includes("vienna")) {
    normalized["location"] = "Vienna";
  } else if (lower.includes("austria")) {
    normalized["location"] = "Austria";
  }

  if (lower.includes("startup")) {
    normalized["stage"] = "Startup";
  } else if (lower.includes("scale") || lower.includes("growth")) {
    normalized["stage"] = "Growth";
  }

  const scored = scorePrograms(normalized, "strict");
  return { normalized, scored };
}
