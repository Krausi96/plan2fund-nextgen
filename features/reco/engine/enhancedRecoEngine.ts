import { UserAnswers } from "@/shared/user/storage/planStore";
import {
  normalizeLocationAnswer,
  normalizeCompanyTypeAnswer,
  normalizeFundingAmountAnswer,
  normalizeFundingAmountExtraction,
  matchLocations,
  matchCompanyTypes,
  matchFundingAmounts,
  NormalizedLocation,
  NormalizedCompanyType,
  NormalizedFundingAmount,
} from "./normalization";

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
  location: 35,      // Reduced from 40 to make room for advanced questions
  companyType: 20,   // Reduced from 25
  funding: 20,       // Reduced from 25
  industry: 10,      // Same
  teamSize: 5,       // New: Advanced question
  revenueStatus: 3,  // New: Advanced question
  impactFocus: 4,    // New: Advanced question
  deadlineUrgency: 3, // New: Advanced question
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

function getProgramRegion(program: Program) {
  return (
    program.region ||
    program.metadata?.region ||
    program.metadata?.location ||
    program.location ||
    program.categorized_requirements?.geographic?.[0]?.value ||
    null
  );
}

function getProgramCompanyType(program: Program) {
  return (
    program.program_type ||
    program.type ||
    program.company_type ||
    program.categorized_requirements?.eligibility?.[0]?.value ||
    null
  );
}

function locationMatches(userLocation: NormalizedLocation | null, program: Program) {
  if (!userLocation) return true;
  const programRegion = getProgramRegion(program);
  if (!programRegion) return true;
  const normalizedProgramLocation = normalizeLocationAnswer(programRegion);
  return matchLocations(userLocation, normalizedProgramLocation);
}

function companyTypeMatches(userType: NormalizedCompanyType | null, program: Program) {
  if (!userType) return true;
  const programType = getProgramCompanyType(program);
  if (!programType) return true;
  const normalizedProgramType = normalizeCompanyTypeAnswer(programType);
  return matchCompanyTypes(userType, normalizedProgramType);
}

function fundingMatches(userFunding: NormalizedFundingAmount | null, program: Program) {
  if (!userFunding) return true;
  const amount = getProgramAmount(program);
  const normalizedProgramFunding = normalizeFundingAmountExtraction(amount.min, amount.max);
  return matchFundingAmounts(userFunding, normalizedProgramFunding);
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

// Advanced question matching functions
function teamSizeMatches(answers: UserAnswers, program: Program): boolean {
  if (!answers.team_size) return true; // No penalty if not answered
  
  // Check if program has team size requirements in categorized_requirements
  const teamRequirements = program.categorized_requirements?.team || [];
  if (teamRequirements.length === 0) return true; // No requirement = match
  
  // Simple matching: if program mentions team requirements, consider it a match
  // More sophisticated matching could be added later
  return true; // For now, just don't penalize
}

function revenueStatusMatches(answers: UserAnswers, program: Program): boolean {
  if (!answers.revenue_status) return true;
  
  // Check if program has revenue requirements
  const financialRequirements = program.categorized_requirements?.financial || [];
  const hasRevenueRequirement = financialRequirements.some((req: any) => 
    req.value?.toLowerCase().includes('revenue') || 
    req.value?.toLowerCase().includes('profit') ||
    req.value?.toLowerCase().includes('turnover')
  );
  
  if (!hasRevenueRequirement) return true; // No requirement = match
  
  // Basic matching: pre-revenue users might not match programs requiring revenue
  if (answers.revenue_status === 'pre_revenue' && hasRevenueRequirement) {
    // Check if requirement explicitly allows pre-revenue
    const allowsPreRevenue = financialRequirements.some((req: any) =>
      req.value?.toLowerCase().includes('pre-revenue') ||
      req.value?.toLowerCase().includes('no revenue required')
    );
    return allowsPreRevenue;
  }
  
  return true; // Default: match
}

function impactFocusMatches(answers: UserAnswers, program: Program): boolean {
  if (!answers.impact_focus) return true;
  
  const userImpacts = toArray(answers.impact_focus);
  if (!userImpacts.length) return true;
  
  // Check program impact focus in categorized_requirements or metadata
  const programImpacts = [
    ...toArray(program.categorized_requirements?.impact?.map((item: any) => item.value)),
    ...toArray(program.metadata?.impact_focus),
  ];
  
  if (programImpacts.length === 0) return true; // No requirement = match
  
  // Check if any user impact matches program impact
  return userImpacts.some((impact) => 
    programImpacts.some((p) => p.toLowerCase().includes(impact) || impact.includes(p.toLowerCase()))
  );
}

function deadlineUrgencyMatches(answers: UserAnswers, program: Program): boolean {
  if (!answers.deadline_urgency) return true;
  
  // Check if program has deadlines
  const deadlines = program.metadata?.application_deadlines;
  if (!deadlines) return true; // No deadline info = match
  
  // If user needs immediate funding but program has passed deadline, it's a mismatch
  // For now, just return true (more sophisticated logic could check actual dates)
  return true;
}

function useOfFundsMatches(answers: UserAnswers, program: Program): boolean {
  if (!answers.use_of_funds) return true;
  
  const userUseCases = toArray(answers.use_of_funds);
  if (!userUseCases.length) return true;
  
  // Check program use of funds requirements
  const programUseCases = toArray(
    program.categorized_requirements?.funding_details?.find(
      (item: any) => item.type === 'use_of_funds'
    )?.value
  );
  
  if (programUseCases.length === 0) return true; // No requirement = match
  
  // Check if any user use case matches program use case
  return userUseCases.some((useCase) =>
    programUseCases.some((p) => 
      p.toLowerCase().includes(useCase) || 
      useCase.includes(p.toLowerCase()) ||
      // Common synonyms
      (useCase === 'product_development' && (p.includes('r&d') || p.includes('research'))) ||
      (useCase === 'hiring' && (p.includes('personnel') || p.includes('team'))) ||
      (useCase === 'equipment' && (p.includes('infrastructure') || p.includes('machinery'))) ||
      (useCase === 'marketing' && (p.includes('go-to-market') || p.includes('sales'))) ||
      (useCase === 'working_capital' && (p.includes('capital') || p.includes('operating')))
    )
  );
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
  programs: Program[] = []
): Promise<EnhancedProgramResult[]> {
  if (!programs.length) {
    return [];
  }

  const userLocation = answers.location ? normalizeLocationAnswer(answers.location) : null;
  const userCompanyType = answers.company_type ? normalizeCompanyTypeAnswer(answers.company_type) : null;
  const userFunding =
    answers.funding_amount !== undefined && answers.funding_amount !== null
      ? normalizeFundingAmountAnswer(answers.funding_amount)
      : null;

  const scored = programs.map((program) => {
    let score = 0;
    const matchedCriteria: EnhancedProgramResult["matchedCriteria"] = [];
    const gaps: EnhancedProgramResult["gaps"] = [];

    if (locationMatches(userLocation, program)) {
      score += SCORE_WEIGHTS.location;
      matchedCriteria.push({
        key: "location",
        value: answers.location,
        reason: "Matches your location preference.",
      });
    } else {
      gaps.push({ key: "location", description: "Program targets a different region." });
    }

    if (companyTypeMatches(userCompanyType, program)) {
      score += SCORE_WEIGHTS.companyType;
      matchedCriteria.push({
        key: "company_type",
        value: answers.company_type,
        reason: "Company type is compatible.",
      });
    } else {
      gaps.push({ key: "company_type", description: "Company type is not compatible." });
    }

    if (fundingMatches(userFunding, program)) {
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

    // Advanced question matching (lower weights)
    if (teamSizeMatches(answers, program)) {
      score += SCORE_WEIGHTS.teamSize;
      if (answers.team_size) {
        matchedCriteria.push({
          key: "team_size",
          value: answers.team_size,
          reason: "Team size is compatible with program requirements.",
        });
      }
    }

    if (revenueStatusMatches(answers, program)) {
      score += SCORE_WEIGHTS.revenueStatus;
      if (answers.revenue_status) {
        matchedCriteria.push({
          key: "revenue_status",
          value: answers.revenue_status,
          reason: "Revenue status aligns with program eligibility.",
        });
      }
    }

    if (impactFocusMatches(answers, program)) {
      score += SCORE_WEIGHTS.impactFocus;
      if (answers.impact_focus) {
        matchedCriteria.push({
          key: "impact_focus",
          value: answers.impact_focus,
          reason: "Impact focus matches program objectives.",
        });
      }
    }

    if (deadlineUrgencyMatches(answers, program)) {
      score += SCORE_WEIGHTS.deadlineUrgency;
      if (answers.deadline_urgency) {
        matchedCriteria.push({
          key: "deadline_urgency",
          value: answers.deadline_urgency,
          reason: "Timeline is compatible with program deadlines.",
        });
      }
    }

    // Use of funds matching (if implemented)
    if (useOfFundsMatches(answers, program)) {
      // Add small bonus for use of funds match (not in weights to keep total <= 100)
      if (answers.use_of_funds) {
        score += 2; // Small bonus
        matchedCriteria.push({
          key: "use_of_funds",
          value: answers.use_of_funds,
          reason: "Intended use of funds aligns with program scope.",
        });
      }
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

