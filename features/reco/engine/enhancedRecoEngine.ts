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

// Updated scoring weights to match WIZARD_UPDATED_QA_TABLE.md
const SCORE_WEIGHTS = {
  location: 35,        // Highest weight (Q4 - 35 pts)
  organisationStage: 20, // Derived from organisation_stage (Q2 - 20 pts, critical)
  funding: 20,         // Critical (Q5 - 20 pts)
  industry: 10,        // Bonus (Q6 - 10 pts)
  impactFocus: 4,      // Advanced (Q10 - 4 pts)
  deadlineUrgency: 3,   // Advanced (Q9 - 3 pts)
  useOfFunds: 2,       // Bonus (Q8 - +2 pts)
  // REMOVED: teamSize (Q12 was removed from Q&A table)
  // REMOVED: revenueStatus (used for filtering eligibility, not scoring)
};

function toArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v).toLowerCase());
  return [String(value).toLowerCase()];
}

/**
 * Derive company_type and company_stage from organisation_stage
 * Maps the new merged question to backward-compatible values
 */
function deriveCompanyInfo(organisationStage: string | undefined): {
  company_type: string | null;
  company_stage: string | null;
} {
  if (!organisationStage) return { company_type: null, company_stage: null };
  
  const mapping: Record<string, { company_type: string; company_stage: string | null }> = {
    'exploring_idea': { 
      company_type: 'founder_idea', 
      company_stage: 'pre_company' 
    },
    'early_stage_startup': { 
      company_type: 'startup', 
      company_stage: 'inc_lt_6m'  // < 6 months old
    },
    'growing_startup': { 
      company_type: 'startup', 
      company_stage: 'inc_6_36m'  // < 3 years old
    },
    'established_sme': { 
      company_type: 'sme', 
      company_stage: 'inc_gt_36m'  // 3+ years operating
    },
    'research_institution': { 
      company_type: 'research', 
      company_stage: 'research_org' 
    },
    'public_body': { 
      company_type: 'public', 
      company_stage: 'public_org' 
    },
    'other': { 
      company_type: 'other', 
      company_stage: null  // Will be inferred from other text if available
    },
  };
  
  return mapping[organisationStage] || { company_type: 'other', company_stage: null };
}

/**
 * Check if program's funding types are eligible based on user's revenue_status and co_financing
 * This filters programs BEFORE scoring to ensure users only see appropriate funding types
 */
function isFundingTypeEligible(
  program: Program,
  answers: UserAnswers
): boolean {
  const fundingTypes = program.funding_types || [];
  
  // If no funding types specified, allow it (will be scored normally)
  if (fundingTypes.length === 0) return true;
  
  const revenueStatus = answers.revenue_status;
  const coFinancing = answers.co_financing;

  // CRITICAL: If user cannot provide co-financing, only grants/subsidies/support allowed
  if (coFinancing === 'co_no') {
    const allowedTypes = [
      'grant', 'subsidy', 
      'coaching', 'mentoring', 'networking', 'consultation',
      'workshop', 'support_program', 'consulting_support', 
      'acceleration_program', 'gründungsprogramm'
    ];
    return fundingTypes.some(type => allowedTypes.includes(type.toLowerCase()));
  }

  // Pre-revenue users: grants, subsidies, some equity (angel, crowdfunding), micro-credit
  if (revenueStatus === 'pre_revenue') {
    const allowedTypes = [
      'grant', 'subsidy',
      'angel_investment', 'crowdfunding',
      'micro_credit', 'visa_application'
    ];
    return fundingTypes.some(type => allowedTypes.includes(type.toLowerCase()));
  }

  // Early revenue (< €500k/year): all types except large VC (usually requires €500k+ revenue)
  if (revenueStatus === 'early_revenue') {
    const restrictedTypes = ['venture_capital']; // Usually requires established revenue
    return !fundingTypes.some(type => restrictedTypes.includes(type.toLowerCase()));
  }

  // Established revenue (€500k+/year) or not_applicable: all types allowed
  // (not_applicable = public sector, research, non-profit - can access all funding types)
  return true;
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

// REMOVED: teamSizeMatches - Q12 (team_size) was removed from Q&A table
// REMOVED: revenueStatusMatches - revenue_status is now used for filtering eligibility, not scoring

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

  // Step 1: Filter programs by funding type eligibility BEFORE scoring
  // This ensures users only see appropriate funding types based on revenue_status and co_financing
  const eligiblePrograms = programs.filter((program) => 
    isFundingTypeEligible(program, answers)
  );

  // Step 2: Derive company_type and company_stage from organisation_stage if available
  // This supports the new merged question while maintaining backward compatibility
  let userCompanyType: NormalizedCompanyType | null = null;
  
  if (answers.organisation_stage) {
    const derived = deriveCompanyInfo(answers.organisation_stage);
    if (derived.company_type) {
      userCompanyType = normalizeCompanyTypeAnswer(derived.company_type);
    }
    // userCompanyStage = derived.company_stage; // Not currently used in matching
  } else if (answers.company_type) {
    // Fallback to old company_type if organisation_stage not available
    userCompanyType = normalizeCompanyTypeAnswer(answers.company_type);
    // userCompanyStage = answers.company_stage || null; // Not currently used in matching
  }

  const userLocation = answers.location ? normalizeLocationAnswer(answers.location) : null;
  const userFunding =
    answers.funding_amount !== undefined && answers.funding_amount !== null
      ? normalizeFundingAmountAnswer(answers.funding_amount)
      : null;

  // Step 3: Score only eligible programs
  const scored = eligiblePrograms.map((program) => {
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

    // Use organisation_stage for scoring if available, otherwise fall back to company_type
    const organisationStageKey = answers.organisation_stage ? "organisation_stage" : "company_type";
    const organisationStageValue = answers.organisation_stage || answers.company_type;
    
    if (companyTypeMatches(userCompanyType, program)) {
      score += SCORE_WEIGHTS.organisationStage;
      matchedCriteria.push({
        key: organisationStageKey,
        value: organisationStageValue,
        reason: "Organisation stage is compatible.",
      });
    } else {
      gaps.push({ 
        key: organisationStageKey, 
        description: "Organisation stage is not compatible." 
      });
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

    // REMOVED: teamSize scoring (Q12 was removed from Q&A table)
    // REMOVED: revenueStatus scoring (now used for filtering eligibility only, not scoring)

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

    // Use of funds matching (bonus points)
    if (useOfFundsMatches(answers, program)) {
      if (answers.use_of_funds) {
        score += SCORE_WEIGHTS.useOfFunds; // +2 pts bonus
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

