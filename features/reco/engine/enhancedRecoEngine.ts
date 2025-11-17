import { UserAnswers } from "@/shared/user/storage/planStore";

export interface Program {
  id: string;
  name: string;
  type?: string;
  program_type?: string;
  company_type?: string;
  region?: string;
  description?: string;
  url?: string | null;
  amount?: {
    min: number;
    max: number;
    currency: string;
  };
  funding_amount_min?: number;
  funding_amount_max?: number;
  currency?: string;
  funding_types?: string[];
  program_focus?: string[];
  categorized_requirements?: Record<string, any[]>;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export interface EnhancedProgramResult extends Program {
  score: number;
  matchedCriteria: Array<{ key: string; value: any; reason: string }>;
  gaps: Array<{ key: string; description: string }>;
  eligibility: "Eligible" | "Not Eligible";
  confidence: "High" | "Medium" | "Low";
  reason: string;
}

const SCORE_WEIGHTS = {
  location: 40,
  companyType: 25,
  funding: 25,
  industry: 10,
};

function toArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v).toLowerCase());
  return [String(value).toLowerCase()];
}

function getProgramAmount(program: Program) {
  if (program.amount) return program.amount;
  return {
    min: program.funding_amount_min ?? program.metadata?.funding_amount_min ?? 0,
    max: program.funding_amount_max ?? program.metadata?.funding_amount_max ?? 0,
    currency: program.currency || program.metadata?.currency || "EUR",
  };
}

function textIncludes(text: string | undefined | null, search: string | undefined | null) {
  if (!text || !search) return false;
  return text.toLowerCase().includes(search.toLowerCase());
}

function locationMatches(answers: UserAnswers, program: Program) {
  if (!answers.location) return true;
  const programRegion =
    program.region ||
    program.metadata?.region ||
    program.metadata?.location ||
    program.location ||
    program.categorized_requirements?.geographic?.[0]?.value;
  return textIncludes(programRegion, answers.location);
}

function companyTypeMatches(answers: UserAnswers, program: Program) {
  if (!answers.company_type) return true;
  const programType =
    program.program_type ||
    program.type ||
    program.company_type ||
    program.categorized_requirements?.eligibility?.[0]?.value;
  return textIncludes(programType, answers.company_type);
}

function fundingMatches(answers: UserAnswers, program: Program) {
  if (answers.funding_amount === undefined || answers.funding_amount === null) {
    return true;
  }
  const amount = getProgramAmount(program);
  if (!amount.min && !amount.max) return true;
  const target = typeof answers.funding_amount === "number" ? answers.funding_amount : Number(answers.funding_amount);
  if (!target || Number.isNaN(target)) return true;
  const minOk = !amount.min || target >= amount.min * 0.25;
  const maxOk = !amount.max || target <= amount.max * 1.5;
  return minOk && maxOk;
}

function industryMatches(answers: UserAnswers, program: Program) {
  if (!answers.industry_focus) return true;
  const userIndustries = toArray(answers.industry_focus);
  if (!userIndustries.length) return true;
  const programIndustries = [
    ...toArray(program.program_focus),
    ...toArray(program.categorized_requirements?.project?.map((item: any) => item.value)),
  ];
  return userIndustries.some((industry) => programIndustries.some((p) => p.includes(industry)));
}

function buildReason(matched: Array<{ reason: string }>) {
  if (!matched.length) {
    return "Program relevance could not be determined.";
  }
  return matched
    .slice(0, 3)
    .map((item) => item.reason)
    .join(" ");
}

export async function scoreProgramsEnhanced(
  answers: UserAnswers,
  _mode: "strict" | "explorer" = "strict",
  programs: Program[] = []
): Promise<EnhancedProgramResult[]> {
  if (!programs.length) {
    return [];
  }

  const scored = programs.map((program) => {
    let score = 0;
    const matchedCriteria: EnhancedProgramResult["matchedCriteria"] = [];
    const gaps: EnhancedProgramResult["gaps"] = [];

    if (locationMatches(answers, program)) {
      score += SCORE_WEIGHTS.location;
      matchedCriteria.push({
        key: "location",
        value: answers.location,
        reason: "Matches your location preference.",
      });
    } else {
      gaps.push({ key: "location", description: "Program targets a different region." });
    }

    if (companyTypeMatches(answers, program)) {
      score += SCORE_WEIGHTS.companyType;
      matchedCriteria.push({
        key: "company_type",
        value: answers.company_type,
        reason: "Company type is compatible.",
      });
    } else {
      gaps.push({ key: "company_type", description: "Company type is not compatible." });
    }

    if (fundingMatches(answers, program)) {
      score += SCORE_WEIGHTS.funding;
      matchedCriteria.push({
        key: "funding_amount",
        value: answers.funding_amount,
        reason: "Funding range is within tolerance.",
      });
    } else {
      gaps.push({ key: "funding_amount", description: "Funding range differs significantly." });
    }

    if (industryMatches(answers, program)) {
      score += SCORE_WEIGHTS.industry;
      matchedCriteria.push({
        key: "industry_focus",
        value: answers.industry_focus,
        reason: "Industry focus overlaps with your profile.",
      });
    }

    const clampedScore = Math.max(0, Math.min(100, score));
    const eligibility: "Eligible" | "Not Eligible" = clampedScore >= 50 ? "Eligible" : "Not Eligible";
    const confidence: "High" | "Medium" | "Low" =
      clampedScore >= 80 ? "High" : clampedScore >= 50 ? "Medium" : "Low";

    return {
      ...program,
      amount: getProgramAmount(program),
      score: clampedScore,
      matchedCriteria,
      gaps,
      eligibility,
      confidence,
      reason: buildReason(matchedCriteria),
    };
  });

  return scored.sort((a, b) => b.score - a.score);
}

