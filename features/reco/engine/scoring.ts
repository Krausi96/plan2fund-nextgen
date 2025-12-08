/**
 * Unified Recommendation Engine
 * Combines normalization, matching, and scoring logic
 */

import { UserAnswers } from "@/shared/user/storage/planStore";

// ============================================================================
// TYPES
// ============================================================================

export interface NormalizedLocation {
  countries: string[];
  scope: 'local' | 'regional' | 'national' | 'eu' | 'international' | null;
}

export interface NormalizedCompanyType {
  type: 'startup' | 'sme' | 'large' | 'research' | 'public' | 'other' | null;
}

export interface NormalizedCompanyStage {
  stage: 'pre_company' | 'inc_lt_6m' | 'inc_6_36m' | 'inc_gt_36m' | 'research_org' | 'public_org' | null;
}

export interface NormalizedFundingAmount {
  min: number;
  max: number;
  currency: string;
}

export interface NormalizedIndustry {
  industries: string[];
}

export interface NormalizedCoFinancing {
  canProvide: boolean;
  percentage?: number | null;
}

export interface Program {
  id: string;
  name: string;
  type?: string;
  program_type?: string;
  description?: string;
  url?: string | null;
  source_url?: string | null;
  region?: string | null;
  funding_types?: string[];
  funding_amount_min?: number | null;
  funding_amount_max?: number | null;
  currency?: string;
  amount?: {
    min: number;
    max: number;
    currency: string;
  };
  categorized_requirements?: Record<string, any[]>;
  metadata?: Record<string, any>;
  program_focus?: string[];
  company_type?: string | null;
  company_stage?: string | null;
}

export interface EnhancedProgramResult extends Program {
  score: number;
  confidence: 'high' | 'medium' | 'low';
  eligibility: 'eligible' | 'maybe' | 'ineligible';
  reason?: string;
  matchedCriteria?: Array<{ key: string; reason: string; description?: string }>;
  gaps?: Array<{ key: string; description: string }>;
}

// ============================================================================
// NORMALIZATION: Q&A ANSWERS
// ============================================================================

export function normalizeLocationAnswer(value: string): NormalizedLocation {
  const lower = value.toLowerCase().trim();
  const countries: string[] = [];
  let scope: NormalizedLocation['scope'] = null;

  if (lower.includes('austria') || lower === 'at') {
    countries.push('austria');
    scope = 'national';
  } else if (lower.includes('germany') || lower === 'de') {
    countries.push('germany');
    scope = 'national';
  } else if (lower.includes('eu') || lower === 'europe') {
    countries.push('eu');
    scope = 'eu';
  } else if (lower.includes('international') || lower.includes('global')) {
    countries.push('international');
    scope = 'international';
  } else {
    countries.push(lower);
    scope = 'national';
  }

  return { countries, scope };
}

export function normalizeCompanyTypeAnswer(value: string): NormalizedCompanyType {
  const lower = value.toLowerCase().trim();
  
  if (lower.includes('startup') || lower.includes('start-up')) {
    return { type: 'startup' };
  } else if (lower.includes('sme') || lower.includes('small') || lower.includes('medium')) {
    return { type: 'sme' };
  } else if (lower.includes('large') || lower.includes('enterprise')) {
    return { type: 'large' };
  } else if (lower.includes('research') || lower.includes('university') || lower.includes('institution')) {
    return { type: 'research' };
  } else if (lower.includes('public') || lower.includes('municipality')) {
    return { type: 'public' };
  }
  
  return { type: 'other' };
}

export function normalizeCompanyStageAnswer(value: string | number): NormalizedCompanyStage {
  if (typeof value === 'number') {
    if (value < 0) return { stage: 'pre_company' };
    if (value < 6) return { stage: 'inc_lt_6m' };
    if (value < 36) return { stage: 'inc_6_36m' };
    return { stage: 'inc_gt_36m' };
  }
  
  const lower = String(value).toLowerCase().trim();
  
  if (lower.includes('pre') || lower.includes('idea') || lower === 'pre_company') {
    return { stage: 'pre_company' };
  } else if (lower.includes('lt_6m') || lower.includes('less than 6')) {
    return { stage: 'inc_lt_6m' };
  } else if (lower.includes('6_36m') || lower.includes('6 to 36')) {
    return { stage: 'inc_6_36m' };
  } else if (lower.includes('gt_36m') || lower.includes('more than 36')) {
    return { stage: 'inc_gt_36m' };
  } else if (lower.includes('research')) {
    return { stage: 'research_org' };
  } else if (lower.includes('public')) {
    return { stage: 'public_org' };
  }
  
  return { stage: null };
}

/**
 * Normalize company stage value (helper for API)
 */
export function normalizeCompanyStageValue(value: any): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number') {
    if (value < 0) return 'pre_company';
    if (value < 6) return 'inc_lt_6m';
    if (value < 36) return 'inc_6_36m';
    return 'inc_gt_36m';
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }
  return null;
}

export function normalizeFundingAmountAnswer(value: string | number): NormalizedFundingAmount {
  if (typeof value === 'number') {
    return {
      min: value,
      max: value,
      currency: 'EUR'
    };
  }
  
  // Parse string like "€50,000" or "50000 EUR"
  const cleaned = String(value).replace(/[€,\s]/g, '');
  const num = parseFloat(cleaned) || 0;
  
  return {
    min: num,
    max: num,
    currency: 'EUR'
  };
}

export function normalizeIndustryAnswer(value: string | string[]): NormalizedIndustry {
  const industries = Array.isArray(value) ? value : [value];
  return { industries: industries.filter(Boolean) };
}

export function normalizeCoFinancingAnswer(value: string): NormalizedCoFinancing {
  const lower = value.toLowerCase().trim();
  const canProvide = !lower.includes('no') && !lower.includes('cannot');
  
  // Extract percentage if present
  const percentMatch = value.match(/(\d+)%/);
  const percentage = percentMatch ? parseInt(percentMatch[1], 10) : null;
  
  return { canProvide, percentage };
}

// ============================================================================
// NORMALIZATION: LLM EXTRACTION
// ============================================================================

export function normalizeLocationExtraction(value: string): NormalizedLocation {
  return normalizeLocationAnswer(value);
}

export function normalizeCompanyTypeExtraction(value: string): NormalizedCompanyType {
  return normalizeCompanyTypeAnswer(value);
}

export function normalizeCompanyStageExtraction(value: string): NormalizedCompanyStage {
  return normalizeCompanyStageAnswer(value);
}

export function normalizeFundingAmountExtraction(
  min: number | null,
  max: number | null
): NormalizedFundingAmount | null {
  if (min === null && max === null) return null;
  
  return {
    min: min ?? 0,
    max: max ?? min ?? 0,
    currency: 'EUR'
  };
}

export function normalizeCoFinancingExtraction(value: string): NormalizedCoFinancing {
  return normalizeCoFinancingAnswer(value);
}

// ============================================================================
// MATCHING FUNCTIONS
// ============================================================================

export function matchLocations(user: NormalizedLocation, extracted: NormalizedLocation): boolean {
  if (!user.countries.length || !extracted.countries.length) return true;
  
  // Check for overlap
  const userSet = new Set(user.countries);
  const extractedSet = new Set(extracted.countries);
  
  for (const country of userSet) {
    if (extractedSet.has(country)) return true;
  }
  
  // EU-wide programs match EU countries
  if (userSet.has('eu') || extractedSet.has('eu')) {
    if (userSet.has('austria') || userSet.has('germany') || extractedSet.has('austria') || extractedSet.has('germany')) {
      return true;
    }
  }
  
  // International matches everything
  if (userSet.has('international') || extractedSet.has('international')) {
    return true;
  }
  
  return false;
}

export function matchCompanyTypes(user: NormalizedCompanyType, extracted: NormalizedCompanyType): boolean {
  if (!user.type || !extracted.type) return true;
  if (user.type === extracted.type) return true;
  
  // Allow adjacent types
  const compatible: Record<string, string[]> = {
    'startup': ['sme', 'other'],
    'sme': ['startup', 'other'],
    'large': ['sme', 'other'],
    'research': ['other'],
    'public': ['other'],
    'other': ['startup', 'sme', 'large', 'research', 'public']
  };
  
  return compatible[user.type]?.includes(extracted.type) || false;
}

export function matchCompanyStages(user: NormalizedCompanyStage, extracted: NormalizedCompanyStage): boolean {
  if (!user.stage || !extracted.stage) return true;
  if (user.stage === extracted.stage) return true;
  
  // Allow adjacent stages
  const stages = ['pre_company', 'inc_lt_6m', 'inc_6_36m', 'inc_gt_36m'];
  const userIndex = stages.indexOf(user.stage);
  const extractedIndex = stages.indexOf(extracted.stage);
  
  if (userIndex === -1 || extractedIndex === -1) {
    // Handle special stages
    if (user.stage === 'research_org' && extracted.stage === 'research_org') return true;
    if (user.stage === 'public_org' && extracted.stage === 'public_org') return true;
    return false;
  }
  
  // Allow ±1 stage difference
  return Math.abs(userIndex - extractedIndex) <= 1;
}

export function matchFundingAmounts(user: NormalizedFundingAmount, extracted: NormalizedFundingAmount): boolean {
  if (!extracted.min && !extracted.max) return true;
  
  const userNeed = user.max || user.min;
  const programMin = extracted.min || 0;
  const programMax = extracted.max || Infinity;
  
  // ±200% tolerance
  const tolerance = 2.0;
  const minAcceptable = userNeed / tolerance;
  const maxAcceptable = userNeed * tolerance;
  
  // Program range overlaps with acceptable range
  return programMax >= minAcceptable && programMin <= maxAcceptable;
}

export function matchIndustries(user: NormalizedIndustry, extracted: string[]): boolean {
  if (!user.industries.length || !extracted.length) return true;
  
  const userSet = new Set(user.industries.map(i => i.toLowerCase()));
  const extractedSet = new Set(extracted.map(i => i.toLowerCase()));
  
  for (const industry of userSet) {
    if (extractedSet.has(industry)) return true;
  }
  
  return false;
}

export function matchCoFinancing(user: NormalizedCoFinancing, extracted: NormalizedCoFinancing): boolean {
  // If user cannot provide co-financing, program must not require it
  if (!user.canProvide && extracted.canProvide) {
    return false;
  }
  
  // If program requires specific percentage, user must be able to provide it
  if (extracted.percentage && user.percentage !== null && user.percentage !== undefined) {
    return user.percentage >= extracted.percentage;
  }
  
  return true;
}

// ============================================================================
// PROGRAM SCORING
// ============================================================================

const SCORE_WEIGHTS = {
  location: 25,
  companyType: 20,
  companyStage: 15,
  fundingAmount: 20,
  industry: 10,
  coFinancing: 10
};

export function deriveCompanyInfo(organisationStage: string | undefined): { company_type: string | null; company_stage: string | null } {
  if (!organisationStage) return { company_type: null, company_stage: null };
  
  const stageMap: Record<string, { company_type: string; company_stage: string }> = {
    'exploring_idea': { company_type: 'founder_idea', company_stage: 'pre_company' },
    'early_stage_startup': { company_type: 'startup', company_stage: 'inc_lt_6m' },
    'growing_startup': { company_type: 'startup', company_stage: 'inc_6_36m' },
    'established_sme': { company_type: 'sme', company_stage: 'inc_gt_36m' },
    'research_institution': { company_type: 'research', company_stage: 'research_org' },
    'public_body': { company_type: 'public', company_stage: 'public_org' }
  };
  
  return stageMap[organisationStage] || { company_type: null, company_stage: null };
}

function isFundingTypeEligible(program: Program, answers: UserAnswers): boolean {
  const coFinancing = answers.co_financing;
  const fundingTypes = program.funding_types || [];
  
  if (coFinancing === 'co_no') {
    // Only grants/subsidies allowed
    return fundingTypes.some(type => 
      type.toLowerCase().includes('grant') || 
      type.toLowerCase().includes('subsidy') ||
      type.toLowerCase().includes('support')
    );
  }
  
  return true;
}

function getProgramAmount(program: Program) {
  return program.amount || {
    min: program.funding_amount_min ?? 0,
    max: program.funding_amount_max ?? 0,
    currency: program.currency || 'EUR'
  };
}

function getProgramRegion(program: Program) {
  return program.region || program.metadata?.region || null;
}

function getProgramCompanyType(program: Program) {
  return program.company_type || program.program_type || null;
}

function locationMatches(userLocation: NormalizedLocation | null, program: Program): boolean {
  if (!userLocation) return true;
  
  const programLocation = getProgramRegion(program);
  if (!programLocation) return true;
  
  const normalizedProgramLocation = normalizeLocationExtraction(programLocation);
  return matchLocations(userLocation, normalizedProgramLocation);
}

function companyTypeMatches(userType: NormalizedCompanyType | null, program: Program): boolean {
  if (!userType) return true;
  
  const programType = getProgramCompanyType(program);
  if (!programType) return true;
  
  const normalizedProgramType = normalizeCompanyTypeExtraction(programType);
  return matchCompanyTypes(userType, normalizedProgramType);
}

function fundingMatches(userFunding: NormalizedFundingAmount | null, program: Program): boolean {
  if (!userFunding) return true;
  
  const programAmount = getProgramAmount(program);
  const normalizedProgramAmount = normalizeFundingAmountExtraction(
    programAmount.min,
    programAmount.max
  );
  
  if (!normalizedProgramAmount) return true;
  return matchFundingAmounts(userFunding, normalizedProgramAmount);
}

function industryMatches(answers: UserAnswers, program: Program): boolean {
  const userIndustries = normalizeIndustryAnswer(answers.industry_focus || []);
  const programFocus = program.program_focus || [];
  
  if (!userIndustries.industries.length || !programFocus.length) return true;
  return matchIndustries(userIndustries, programFocus);
}

// Optional matching functions removed - not currently used in scoring

function buildReason(matched: Array<{ reason: string }>): string {
  if (matched.length === 0) return 'Program may be suitable';
  return matched.map(m => m.reason).join(' ');
}

export async function scoreProgramsEnhanced(
  answers: UserAnswers,
  programs: Program[] = []
): Promise<EnhancedProgramResult[]> {
  if (!programs.length) return [];
  
  // Normalize user answers
  const userLocation = answers.location ? normalizeLocationAnswer(answers.location) : null;
  const orgStage = answers.organisation_stage;
  const { company_type: derivedType, company_stage: derivedStage } = deriveCompanyInfo(orgStage);
  const userCompanyType = (answers.company_type || derivedType) 
    ? normalizeCompanyTypeAnswer(answers.company_type || derivedType || 'other')
    : null;
  const userCompanyStage = (answers.company_stage || derivedStage)
    ? normalizeCompanyStageAnswer(answers.company_stage || derivedStage || '')
    : null;
  const userFunding = answers.funding_amount 
    ? normalizeFundingAmountAnswer(answers.funding_amount)
    : null;
  const userCoFinancing = answers.co_financing
    ? normalizeCoFinancingAnswer(answers.co_financing)
    : null;
  
  const results: EnhancedProgramResult[] = [];
  
  for (const program of programs) {
    // Check eligibility first
    if (!isFundingTypeEligible(program, answers)) {
      results.push({
        ...program,
        score: 0,
        confidence: 'low',
        eligibility: 'ineligible',
        reason: 'Funding type not eligible (co-financing requirement)'
      });
      continue;
    }
    
    let score = 0;
    const matched: Array<{ key: string; reason: string }> = [];
    const gaps: Array<{ key: string; description: string }> = [];
    
    // Location matching
    if (locationMatches(userLocation, program)) {
      score += SCORE_WEIGHTS.location;
      matched.push({ key: 'location', reason: 'Location matches' });
    } else {
      gaps.push({ key: 'location', description: 'Location mismatch' });
    }
    
    // Company type matching
    if (companyTypeMatches(userCompanyType, program)) {
      score += SCORE_WEIGHTS.companyType;
      matched.push({ key: 'companyType', reason: 'Company type matches' });
    } else {
      gaps.push({ key: 'companyType', description: 'Company type mismatch' });
    }
    
    // Company stage matching
    if (userCompanyStage && program.company_stage) {
      const programStage = normalizeCompanyStageExtraction(program.company_stage);
      if (matchCompanyStages(userCompanyStage, programStage)) {
        score += SCORE_WEIGHTS.companyStage;
        matched.push({ key: 'companyStage', reason: 'Company stage matches' });
      } else {
        gaps.push({ key: 'companyStage', description: 'Company stage mismatch' });
      }
    } else {
      // Partial credit if stage not specified
      score += SCORE_WEIGHTS.companyStage * 0.5;
    }
    
    // Funding amount matching
    if (fundingMatches(userFunding, program)) {
      score += SCORE_WEIGHTS.fundingAmount;
      matched.push({ key: 'fundingAmount', reason: 'Funding amount matches' });
    } else {
      gaps.push({ key: 'fundingAmount', description: 'Funding amount mismatch' });
    }
    
    // Industry matching
    if (industryMatches(answers, program)) {
      score += SCORE_WEIGHTS.industry;
      matched.push({ key: 'industry', reason: 'Industry focus matches' });
    }
    
    // Co-financing matching
    if (userCoFinancing && program.metadata?.co_financing_required !== undefined) {
      const programCoFinancing: NormalizedCoFinancing = {
        canProvide: program.metadata.co_financing_required,
        percentage: program.metadata.co_financing_percentage || null
      };
      if (matchCoFinancing(userCoFinancing, programCoFinancing)) {
        score += SCORE_WEIGHTS.coFinancing;
        matched.push({ key: 'coFinancing', reason: 'Co-financing requirement matches' });
      } else {
        gaps.push({ key: 'coFinancing', description: 'Co-financing requirement mismatch' });
      }
    }
    
    // Determine confidence and eligibility
    const maxScore = Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0);
    const percentage = (score / maxScore) * 100;
    
    let confidence: 'high' | 'medium' | 'low';
    let eligibility: 'eligible' | 'maybe' | 'ineligible';
    
    if (percentage >= 70) {
      confidence = 'high';
      eligibility = 'eligible';
    } else if (percentage >= 40) {
      confidence = 'medium';
      eligibility = 'maybe';
    } else {
      confidence = 'low';
      eligibility = 'ineligible';
    }
    
    results.push({
      ...program,
      score: Math.round(percentage),
      confidence,
      eligibility,
      reason: buildReason(matched),
      matchedCriteria: matched,
      gaps: gaps.length > 0 ? gaps : undefined
    });
  }
  
  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
}

// ============================================================================
// MATCHING HELPER (for API use)
// ============================================================================

/**
 * Check if a program matches user answers (for API filtering)
 */
export function matchesAnswers(
  program: {
    categorized_requirements?: Record<string, any[]>;
    metadata?: Record<string, any>;
    location?: string | null;
    company_type?: string | null;
  },
  answers: UserAnswers
): boolean {
  const categorized = program.categorized_requirements || {};
  const metadata = program.metadata || {};

  if (answers.location) {
    const userLocation = normalizeLocationAnswer(answers.location);
    const programLocation = metadata.location || program.location || categorized.geographic?.[0]?.value;
    if (programLocation) {
      const normalizedProgramLocation = normalizeLocationExtraction(programLocation);
      
      // More lenient: Allow EU-wide programs for EU countries
      const userCountries = userLocation.countries || [];
      const programCountries = normalizedProgramLocation.countries || [];
      const programScope = normalizedProgramLocation.scope;
      const userIsEuCountry =
        userCountries.includes('austria') ||
        userCountries.includes('germany') ||
        userCountries.includes('eu');
      const programIsEuWide = programCountries.includes('eu') || programScope === 'eu';
      const programIsInternational = programCountries.includes('international') || programScope === 'international';

      if (userIsEuCountry && (programIsEuWide || programIsInternational)) {
        // Accept EU-wide/international programs for EU countries
      } else if (!matchLocations(userLocation, normalizedProgramLocation)) {
        return false;
      }
    }
  }

  if (answers.company_type) {
    const userType = normalizeCompanyTypeAnswer(answers.company_type);
    const programType = program.company_type || categorized.eligibility?.[0]?.value;
    if (programType) {
      const normalizedProgramType = normalizeCompanyTypeExtraction(programType);
      if (!matchCompanyTypes(userType, normalizedProgramType)) {
        return false;
      }
    }
  }

  if (answers.company_stage !== undefined && answers.company_stage !== null) {
    const userStageValue = normalizeCompanyStageValue(answers.company_stage);
    if (userStageValue) {
      const userStage = normalizeCompanyStageAnswer(userStageValue);
      const programStageValue =
        (program as any).company_stage ||
        metadata.company_stage ||
        categorized.eligibility?.find((item: any) => item.type === 'company_stage')?.value;
      if (programStageValue) {
        const normalizedProgramStage = normalizeCompanyStageAnswer(programStageValue);
        if (!matchCompanyStages(userStage, normalizedProgramStage)) {
          return false;
        }
      }
    }
  }

  if (answers.funding_amount !== undefined && answers.funding_amount !== null) {
    const userAmount = normalizeFundingAmountAnswer(answers.funding_amount);
    const programAmount = normalizeFundingAmountExtraction(
      metadata.funding_amount_min ?? null,
      metadata.funding_amount_max ?? null
    );
    if (programAmount && !matchFundingAmounts(userAmount, programAmount)) {
      const userNeed = typeof answers.funding_amount === 'number' ? answers.funding_amount : userAmount.max;
      const min = metadata.funding_amount_min || 0;
      const max = metadata.funding_amount_max || 0;
      const tolerance = userNeed < 10000 ? 5 : 3;
      const withinTolerance =
        (min === 0 || min <= userNeed * tolerance) &&
        (max === 0 || max <= userNeed * tolerance * 1.5);
      if (!withinTolerance) {
        return false;
      }
    }
  }

  return true;
}
