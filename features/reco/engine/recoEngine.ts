/**
 * Unified Recommendation Engine
 * Combines scoring and normalization logic for program recommendations
 */

import { UserAnswers } from "@/shared/user/storage/planStore";

// ============================================================================
// TYPES
// ============================================================================

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

// Normalized value types
interface NormalizedLocation {
  countries: string[];
  regions?: string[];
  scope: 'local' | 'national' | 'regional' | 'eu' | 'international';
}

interface NormalizedCompanyType {
  primary: 'startup' | 'sme' | 'large' | 'research' | 'nonprofit' | 'unknown';
  aliases: string[];
  size?: 'micro' | 'small' | 'medium' | 'large';
}

interface NormalizedFundingAmount {
  min: number;
  max: number;
  range: 'under100k' | '100kto500k' | '500kto2m' | 'over2m' | 'custom';
}

// ============================================================================
// SCORING CONFIGURATION
// ============================================================================

const SCORE_WEIGHTS = {
  location: 35,        // Highest weight (Q4 - 35 pts)
  organisationStage: 20, // Derived from organisation_stage (Q2 - 20 pts)
  funding: 20,         // Critical (Q5 - 20 pts)
  industry: 10,        // Bonus (Q6 - 10 pts)
  impactFocus: 4,      // Advanced (Q10 - 4 pts)
  deadlineUrgency: 3,   // Advanced (Q9 - 3 pts)
  useOfFunds: 2,       // Bonus (Q8 - +2 pts)
};

// ============================================================================
// NORMALIZATION FUNCTIONS
// ============================================================================

function normalizeLocation(value: string): NormalizedLocation {
  const lower = value.toLowerCase().trim();
  const countries: string[] = [];
  const regions: string[] = [];
  let scope: NormalizedLocation['scope'] = 'national';
  
  if (lower.includes('austria') || lower.includes('österreich') || lower.includes('at')) {
    countries.push('austria');
  }
  if (lower.includes('germany') || lower.includes('deutschland') || lower.includes('de')) {
    countries.push('germany');
  }
  if (lower.includes('eu') || lower.includes('europe') || lower.includes('european') || lower.includes('europa')) {
    countries.push('eu');
    scope = 'eu';
  }
  if (lower.includes('international') || lower.includes('global') || lower.includes('worldwide')) {
    countries.push('international');
    scope = 'international';
  }
  
  const austrianStates = ['vienna', 'wien', 'tyrol', 'tirol', 'salzburg', 'styria', 'steiermark', 
                          'upper austria', 'oberösterreich', 'lower austria', 'niederösterreich',
                          'carinthia', 'kärnten', 'vorarlberg', 'burgenland'];
  for (const state of austrianStates) {
    if (lower.includes(state)) {
      regions.push(state);
    }
  }
  
  return {
    countries: countries.length > 0 ? countries : ['unknown'],
    regions: regions.length > 0 ? regions : undefined,
    scope
  };
}

function normalizeCompanyType(value: string): NormalizedCompanyType {
  const lower = value.toLowerCase().trim();
  let primary: NormalizedCompanyType['primary'] = 'unknown';
  const aliases: string[] = [];
  let size: NormalizedCompanyType['size'] | undefined;
  
  if (lower === 'prefounder' || lower.includes('pre-founder') || lower.includes('prefounder') || 
      lower.includes('idea stage') || lower === 'founder_idea') {
    primary = 'startup';
    aliases.push('prefounder', 'pre-founder', 'idea stage', 'startup', 'early-stage company');
    size = 'micro';
  } else if (lower === 'startup' || lower.includes('startup') || lower.includes('start-up') || 
             lower === 'startup_building' || lower === 'startup_traction') {
    primary = 'startup';
    aliases.push('startup', 'start-up', 'new venture', 'early-stage company');
    size = 'micro';
  } else if (lower === 'sme' || lower.includes('sme') || lower.includes('small') || 
             lower.includes('medium') || lower.includes('mittelstand') || lower === 'sme_established') {
    primary = 'sme';
    aliases.push('sme', 'small and medium enterprise', 'small business', 'mittelstand', 'kmü');
    size = lower.includes('small') ? 'small' : 'medium';
  } else if (lower === 'large' || lower.includes('large') || lower.includes('enterprise')) {
    primary = 'large';
    aliases.push('large company', 'enterprise', 'corporation');
    size = 'large';
  } else if (lower === 'research' || lower.includes('research') || lower.includes('university') || 
             lower.includes('academic') || lower.includes('institution')) {
    primary = 'research';
    aliases.push('research institution', 'university', 'academic institution', 'research organization');
  }
  
  return { primary, aliases, size };
}

function normalizeFundingAmount(value: string | number): NormalizedFundingAmount {
  let min = 0;
  let max = 0;
  let range: NormalizedFundingAmount['range'] = 'custom';
  
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    if (lower === 'under100k' || lower.includes('under 100')) {
      min = 0;
      max = 100000;
      range = 'under100k';
    } else if (lower === '100kto500k' || (lower.includes('100') && lower.includes('500'))) {
      min = 100000;
      max = 500000;
      range = '100kto500k';
    } else if (lower === '500kto2m' || (lower.includes('500') && lower.includes('2'))) {
      min = 500000;
      max = 2000000;
      range = '500kto2m';
    } else if (lower === 'over2m' || lower.includes('over 2') || lower.includes('above 2')) {
      min = 2000000;
      max = 999999999;
      range = 'over2m';
    } else {
      const num = parseInt(lower.replace(/[^\d]/g, ''));
      if (!isNaN(num)) {
        min = num;
        max = num;
        range = 'custom';
      }
    }
  } else {
    min = value;
    max = value;
    range = 'custom';
  }
  
  return { min, max, range };
}

function normalizeFundingAmountFromProgram(min: number | null, max: number | null): NormalizedFundingAmount {
  const normalizedMin = min || 0;
  const normalizedMax = max || 0;
  
  let range: NormalizedFundingAmount['range'] = 'custom';
  if (normalizedMax <= 100000) {
    range = 'under100k';
  } else if (normalizedMax <= 500000) {
    range = '100kto500k';
  } else if (normalizedMax <= 2000000) {
    range = '500kto2m';
  } else {
    range = 'over2m';
  }
  
  return { min: normalizedMin, max: normalizedMax, range };
}

// ============================================================================
// MATCHING FUNCTIONS
// ============================================================================

function matchLocations(user: NormalizedLocation, program: NormalizedLocation): boolean {
  const countryMatch = user.countries.some(uc => 
    program.countries.includes(uc) || 
    program.countries.includes('international') ||
    (uc === 'eu' && program.countries.includes('austria'))
  );
  
  const regionMatch = !user.regions || !program.regions || 
    user.regions.some(ur => program.regions!.includes(ur));
  
  const scopeMatch = 
    program.scope === 'international' ||
    user.scope === program.scope ||
    (user.scope === 'national' && program.scope === 'regional');
  
  return countryMatch && regionMatch && scopeMatch;
}

function matchCompanyTypes(user: NormalizedCompanyType, program: NormalizedCompanyType): boolean {
  if (user.primary === 'unknown' || program.primary === 'unknown') {
    return true;
  }
  if (user.primary === program.primary) return true;
  
  return user.aliases.some(alias => 
    program.aliases.some(eAlias => 
      eAlias.toLowerCase().includes(alias.toLowerCase()) || 
      alias.toLowerCase().includes(eAlias.toLowerCase())
    )
  );
}

function matchFundingAmounts(user: NormalizedFundingAmount, program: NormalizedFundingAmount): boolean {
  const userNeed = user.max;
  const programMin = program.min || 0;
  const programMax = program.max || 0;
  
  if (programMax === 0 && programMin === 0) {
    return true; // No limits = flexible
  }
  
  if (userNeed >= programMin && (programMax === 0 || userNeed <= programMax)) {
    return true;
  }

  // Tolerance: ±200% for small amounts, ±300% for larger
  const tolerance = userNeed < 10000 ? 3 : 3;
  if (programMax > 0 && programMax <= userNeed * tolerance) {
    return true;
  }
  if (programMin > 0 && programMin <= userNeed * (tolerance / 2)) {
    return true;
  }

  return false;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function toArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v).toLowerCase());
  return [String(value).toLowerCase()];
}

function deriveCompanyInfo(organisationStage: string | undefined): {
  company_type: string | null;
  company_stage: string | null;
} {
  if (!organisationStage) return { company_type: null, company_stage: null };
  
  const mapping: Record<string, { company_type: string; company_stage: string | null }> = {
    'exploring_idea': { company_type: 'founder_idea', company_stage: 'pre_company' },
    'early_stage_startup': { company_type: 'startup', company_stage: 'inc_lt_6m' },
    'growing_startup': { company_type: 'startup', company_stage: 'inc_6_36m' },
    'established_sme': { company_type: 'sme', company_stage: 'inc_gt_36m' },
    'research_institution': { company_type: 'research', company_stage: 'research_org' },
    'public_body': { company_type: 'public', company_stage: 'public_org' },
    'other': { company_type: 'other', company_stage: null },
  };
  
  return mapping[organisationStage] || { company_type: 'other', company_stage: null };
}

function isFundingTypeEligible(program: Program, answers: UserAnswers): boolean {
  const fundingTypes = program.funding_types || [];
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

  // Early revenue: all types except large VC
  if (revenueStatus === 'early_revenue') {
    return !fundingTypes.some(type => type.toLowerCase() === 'venture_capital');
  }

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

// ============================================================================
// MATCHING CHECKS
// ============================================================================

function locationMatches(userLocation: NormalizedLocation | null, program: Program) {
  if (!userLocation) return true;
  const programRegion = getProgramRegion(program);
  if (!programRegion) return true;
  return matchLocations(userLocation, normalizeLocation(programRegion));
}

function companyTypeMatches(userType: NormalizedCompanyType | null, program: Program) {
  if (!userType) return true;
  const programType = getProgramCompanyType(program);
  if (!programType) return true;
  return matchCompanyTypes(userType, normalizeCompanyType(programType));
}

function fundingMatches(userFunding: NormalizedFundingAmount | null, program: Program) {
  if (!userFunding) return true;
  const amount = getProgramAmount(program);
  const normalizedProgramFunding = normalizeFundingAmountFromProgram(amount.min, amount.max);
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

function impactFocusMatches(answers: UserAnswers, program: Program): boolean {
  if (!answers.impact_focus) return true;
  const userImpacts = toArray(answers.impact_focus);
  if (!userImpacts.length) return true;
  
  const programImpacts = [
    ...toArray(program.categorized_requirements?.impact?.map((item: any) => item.value)),
    ...toArray(program.metadata?.impact_focus),
  ];
  
  if (programImpacts.length === 0) return true;
  return userImpacts.some((impact) => 
    programImpacts.some((p) => p.toLowerCase().includes(impact) || impact.includes(p.toLowerCase()))
  );
}

function useOfFundsMatches(answers: UserAnswers, program: Program): boolean {
  if (!answers.use_of_funds) return true;
  const userUseCases = toArray(answers.use_of_funds);
  if (!userUseCases.length) return true;
  
  const programUseCases = toArray(
    program.categorized_requirements?.funding_details?.find(
      (item: any) => item.type === 'use_of_funds'
    )?.value
  );
  
  if (programUseCases.length === 0) return true;
  
  return userUseCases.some((useCase) =>
    programUseCases.some((p) => 
      p.toLowerCase().includes(useCase) || 
      useCase.includes(p.toLowerCase()) ||
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
  return matched.slice(0, 3).map((item) => item.reason).join(" ");
}

// ============================================================================
// MAIN SCORING FUNCTION
// ============================================================================

export async function scoreProgramsEnhanced(
  answers: UserAnswers,
  programs: Program[] = []
): Promise<EnhancedProgramResult[]> {
  if (!programs.length) {
    return [];
  }

  // Step 1: Filter programs by funding type eligibility BEFORE scoring
  const eligiblePrograms = programs.filter((program) => 
    isFundingTypeEligible(program, answers)
  );

  // Step 2: Derive company_type from organisation_stage if available
  let userCompanyType: NormalizedCompanyType | null = null;
  
  if (answers.organisation_stage) {
    const derived = deriveCompanyInfo(answers.organisation_stage);
    if (derived.company_type) {
      userCompanyType = normalizeCompanyType(derived.company_type);
    }
  } else if (answers.company_type) {
    userCompanyType = normalizeCompanyType(answers.company_type);
  }

  const userLocation = answers.location ? normalizeLocation(answers.location) : null;
  const userFunding =
    answers.funding_amount !== undefined && answers.funding_amount !== null
      ? normalizeFundingAmount(answers.funding_amount)
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

    if (answers.deadline_urgency) {
      // Simplified: if program has deadline info, it's compatible
      const hasDeadlineInfo = program.metadata?.application_deadlines;
      if (hasDeadlineInfo !== undefined) {
        score += SCORE_WEIGHTS.deadlineUrgency;
        matchedCriteria.push({
          key: "deadline_urgency",
          value: answers.deadline_urgency,
          reason: "Timeline is compatible with program deadlines.",
        });
      }
    }

    if (useOfFundsMatches(answers, program)) {
      if (answers.use_of_funds) {
        score += SCORE_WEIGHTS.useOfFunds;
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

// ============================================================================
// COMPANY STAGE NORMALIZATION (for backward compatibility)
// ============================================================================

interface NormalizedCompanyStage {
  stage: 'idea' | 'pre_company' | 'inc_lt_6m' | 'inc_6_36m' | 'inc_gt_36m' | 'research_org' | 'unknown';
  ageRange?: { min?: number; max?: number };
  maturity: 'early' | 'growth' | 'mature' | 'unknown';
}

function normalizeCompanyStageAnswer(value: string): NormalizedCompanyStage {
  const lower = value.toLowerCase().trim();
  let stage: NormalizedCompanyStage['stage'] = 'unknown';
  let maturity: NormalizedCompanyStage['maturity'] = 'unknown';
  let ageRange: { min?: number; max?: number } | undefined;
  
  if (lower === 'idea' || lower.includes('idea') || lower.includes('concept')) {
    stage = 'idea';
    maturity = 'early';
    ageRange = { min: 0, max: 0 };
  } else if (lower === 'pre_company' || (lower.includes('pre') && lower.includes('company'))) {
    stage = 'pre_company';
    maturity = 'early';
    ageRange = { min: 0, max: 0 };
  } else if (lower === 'inc_lt_6m' || lower.includes('<6') || lower.includes('under 6') || 
             lower.includes('newly founded') || lower.includes('seed') || lower === 'early_stage') {
    stage = 'inc_lt_6m';
    maturity = 'early';
    ageRange = { min: 0, max: 6 };
  } else if (lower === 'inc_6_36m' || (lower.includes('6') && lower.includes('36')) || 
             lower.includes('growth') || lower.includes('scale-up') || lower === 'growth_stage') {
    stage = 'inc_6_36m';
    maturity = 'growth';
    ageRange = { min: 6, max: 36 };
  } else if (lower === 'inc_gt_36m' || lower.includes('>36') || lower.includes('over 36') || 
             lower.includes('established') || lower.includes('mature')) {
    stage = 'inc_gt_36m';
    maturity = 'mature';
    ageRange = { min: 36 };
  } else if (lower === 'research_org' || lower.includes('research') || 
             lower.includes('university') || lower.includes('academic')) {
    stage = 'research_org';
    maturity = 'mature';
  }
  
  return { stage, ageRange, maturity };
}

function matchCompanyStages(user: NormalizedCompanyStage, program: NormalizedCompanyStage): boolean {
  if (user.stage === 'unknown' || program.stage === 'unknown') {
    return true;
  }
  if (user.stage === program.stage) return true;
  if (user.maturity !== 'unknown' && user.maturity === program.maturity) return true;
  
  // Age range overlap with tolerance
  if (user.ageRange && program.ageRange) {
    const userMax = user.ageRange.max ?? Infinity;
    const userMin = user.ageRange.min ?? 0;
    const programMax = program.ageRange.max ?? Infinity;
    const programMin = program.ageRange.min ?? 0;
    const tolerance = 12; // months
    
    if (userMin - tolerance <= programMax + tolerance && userMax + tolerance >= programMin - tolerance) {
      return true;
    }
    return false;
  }
  
  return true;
}

// ============================================================================
// EXPORTS FOR BACKWARD COMPATIBILITY (used by recommend.ts API)
// ============================================================================

export {
  normalizeLocation as normalizeLocationAnswer,
  normalizeCompanyType as normalizeCompanyTypeAnswer,
  normalizeFundingAmount as normalizeFundingAmountAnswer,
  normalizeFundingAmountFromProgram as normalizeFundingAmountExtraction,
  normalizeCompanyStageAnswer,
  matchLocations,
  matchCompanyTypes,
  matchFundingAmounts,
  matchCompanyStages,
  type NormalizedLocation,
  type NormalizedCompanyType,
  type NormalizedFundingAmount,
};

