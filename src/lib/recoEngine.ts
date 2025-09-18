import { Program, UserAnswers, ScoredProgram } from "@/types";
import { loadPrograms } from "./dataLoader";

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

function convertEligibilityToRequirements(program: any): Record<string, any> {
  const requirements: Record<string, any> = {};
  
  // Convert eligibility array to requirements
  if (program.eligibility && Array.isArray(program.eligibility)) {
    program.eligibility.forEach((rule: string) => {
      const lowerRule = rule.toLowerCase();
      
      // Country requirements
      if (lowerRule.includes('austria') || lowerRule.includes('at')) {
        requirements.q1_country = ['AT', 'EU'];
      }
      
      // Stage requirements
      if (lowerRule.includes('startup') || lowerRule.includes('new')) {
        requirements.q2_entity_stage = ['PRE_COMPANY', 'INC_LT_6M'];
      }
      
      // Innovation requirements
      if (lowerRule.includes('innovation') || lowerRule.includes('r&d')) {
        requirements.q4_theme = ['INNOVATION_DIGITAL'];
      }
      
      // Company age requirements
      if (lowerRule.includes('≤6 months') || lowerRule.includes('6 months')) {
        requirements.q2_entity_stage = ['PRE_COMPANY', 'INC_LT_6M'];
      }
    });
  }
  
  // Convert overlays to requirements
  if (program.overlays && Array.isArray(program.overlays)) {
    program.overlays.forEach((overlay: any) => {
      if (overlay.decisiveness === 'HARD') {
        // Parse the ask_if condition to extract requirements
        const askIf = overlay.ask_if;
        if (askIf.includes("q1_country in ['AT','EU']")) {
          requirements.q1_country = ['AT', 'EU'];
        }
        if (askIf.includes("q2_entity_stage in ['PRE_COMPANY','INC_LT_6M']")) {
          requirements.q2_entity_stage = ['PRE_COMPANY', 'INC_LT_6M'];
        }
        if (askIf.includes("'INNOVATION_DIGITAL' in answers.q4_theme")) {
          requirements.q4_theme = ['INNOVATION_DIGITAL'];
        }
      }
    });
  }
  
  return requirements;
}

// --- Core Scoring Logic with Persona Mode ---
export async function scorePrograms(
  answers: UserAnswers,
  mode: "strict" | "explorer" = "strict"
): Promise<ScoredProgram[]> {
  const programs = await loadPrograms();
  const source = programs as any[]
  const normalizedPrograms: Program[] = source.map((p) => ({
    id: p.id,
    name: p.title || p.name || p.id,
    type: Array.isArray(p.tags) && p.tags.length > 0 ? p.tags[0] : (p.type || "program"),
    requirements: convertEligibilityToRequirements(p),
    notes: undefined,
    maxAmount: undefined,
    link: undefined,
  }))

  return normalizedPrograms.map((program) => {
    let score = 0;
    const unmetRequirements: string[] = [];
    const matchedRequirements: string[] = [];

    // If no requirements, give a neutral score
    if (!program.requirements || Object.keys(program.requirements).length === 0) {
      return {
        ...program,
        score: 50,
        reason: "No specific requirements found for this program",
        eligibility: "Unknown",
        confidence: "Low",
        unmetRequirements: [],
      };
    }

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

    const totalRequirements = Object.keys(program.requirements || {}).length;
    const scorePercent = totalRequirements > 0 ? Math.round((score / totalRequirements) * 100) : 50;

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
