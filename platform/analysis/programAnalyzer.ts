/**
 * Program Analyzer
 * Analyzes user profiles and matches programs for recommendations
 */

import type { Program, FundingProfile } from '@/platform/core/types';
import type { MatchScore, ProgramAnalysisResult } from './types';
import { CONFIDENCE_THRESHOLD } from './config';

/**
 * Analyze user profile to determine program eligibility
 */
export function analyzeUserProfileForPrograms(
  profile: FundingProfile
): {
  eligibleTypes: string[];
  focusAreas: string[];
  recommendedAmount: number;
  eligibilityFlags: string[];
} {
  const eligibleTypes: string[] = [];
  const focusAreas: string[] = [];
  const eligibilityFlags: string[] = [];

  // Determine eligible funding types based on company stage
  switch (profile.company_stage) {
    case 'idea':
      eligibleTypes.push('grant', 'subsidy', 'micro_credit');
      eligibilityFlags.push('Early stage - grants recommended');
      break;
    case 'MVP':
      eligibleTypes.push('grant', 'subsidy', 'repayable_advance', 'angel_investment');
      eligibilityFlags.push('MVP stage - consider non-dilutive funding');
      break;
    case 'revenue':
      eligibleTypes.push('grant', 'loan', 'subsidy', 'bank_loan', 'leasing');
      eligibilityFlags.push('Revenue stage - multiple options available');
      break;
    case 'growth':
      eligibleTypes.push('loan', 'equity', 'venture_capital', 'bank_loan', 'leasing');
      eligibilityFlags.push('Growth stage - scaling finance options');
      break;
  }

  // Add co-financing considerations
  if (profile.co_financing === 'co_yes') {
    eligibilityFlags.push('Co-financing available - unlock more programs');
  } else if (profile.co_financing === 'co_no') {
    const filteredTypes = eligibleTypes.filter(t => !t.includes('loan') && t !== 'bank_loan');
    eligibleTypes.length = 0;
    eligibleTypes.push(...filteredTypes);
  }

  // Add focus areas from industry
  if (profile.industry_focus && profile.industry_focus.length > 0) {
    focusAreas.push(...profile.industry_focus);
  }

  // Calculate recommended amount based on profile
  const recommendedAmount = determineRecommendedAmount(profile.funding_amount, profile.company_stage);

  return {
    eligibleTypes,
    focusAreas,
    recommendedAmount,
    eligibilityFlags,
  };
}

/**
 * Match programs to user profile
 */
export function matchProgramsToProfile(
  programs: Program[],
  profile: FundingProfile,
  options?: {
    maxResults?: number;
    minScore?: number;
  }
): ProgramAnalysisResult[] {
  const results: ProgramAnalysisResult[] = [];
  const maxResults = options?.maxResults || 10;
  const minScore = options?.minScore || CONFIDENCE_THRESHOLD;

  for (const program of programs) {
    const matchResult = calculateProgramMatchScore(program, profile);
    
    if (matchResult.overall >= minScore) {
      const breakdown = matchResult.breakdown;
      results.push({
        programId: program.id,
        matchScore: matchResult.overall,
        matchedCriteria: breakdown
          .filter((b: { score: number }) => b.score >= 70)
          .map((b: { criteria: string }) => b.criteria),
        gaps: breakdown
          .filter((b: { score: number }) => b.score < 50)
          .map((b: { criteria: string }) => b.criteria),
        recommendations: generateRecommendations(matchResult),
        confidence: matchResult.normalized,
      });
    }
  }

  return sortProgramsByRelevance(results).slice(0, maxResults);
}

/**
 * Calculate match score between program and user profile
 */
export function calculateProgramMatchScore(
  program: Program,
  profile: FundingProfile
): MatchScore {
  const breakdown: MatchScore['breakdown'] = [];
  let totalWeight = 0;
  let weightedScore = 0;

  // Location match (weight: 20)
  const locationScore = calculateLocationMatch(
    program.region ?? null, 
    profile.location
  );
  breakdown.push({
    criteria: 'location',
    score: locationScore,
    weight: 20,
  });
  weightedScore += locationScore * 20;
  totalWeight += 20;

  // Company stage match (weight: 20)
  const stageScore = calculateStageMatch(
    program.company_stage ?? null, 
    profile.company_stage
  );
  breakdown.push({
    criteria: 'company_stage',
    score: stageScore,
    weight: 20,
  });
  weightedScore += stageScore * 20;
  totalWeight += 20;

  // Funding amount match (weight: 25)
  const amountScore = calculateAmountMatch(
    program.funding_amount_min ?? null,
    program.funding_amount_max ?? null,
    profile.funding_amount
  );
  breakdown.push({
    criteria: 'funding_amount',
    score: amountScore,
    weight: 25,
  });
  weightedScore += amountScore * 25;
  totalWeight += 25;

  // Funding type match (weight: 20)
  const typeScore = calculateTypeMatch(program.funding_types, profile);
  breakdown.push({
    criteria: 'funding_type',
    score: typeScore,
    weight: 20,
  });
  weightedScore += typeScore * 20;
  totalWeight += 20;

  // Organization type match (weight: 15)
  const orgScore = calculateOrgTypeMatch(
    program.company_type ?? null, 
    profile.organisation_type ?? undefined
  );
  breakdown.push({
    criteria: 'organization_type',
    score: orgScore,
    weight: 15,
  });
  weightedScore += orgScore * 15;
  totalWeight += 15;

  return {
    overall: Math.round(weightedScore / totalWeight),
    breakdown,
    normalized: weightedScore / totalWeight,
  };
}

/**
 * Sort programs by relevance
 */
export function sortProgramsByRelevance(
  results: ProgramAnalysisResult[]
): ProgramAnalysisResult[] {
  return [...results].sort((a, b) => {
    // Primary sort by match score
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    // Secondary sort by confidence
    return b.confidence - a.confidence;
  });
}

// Helper functions

function determineRecommendedAmount(
  requestedAmount: number,
  stage: string
): number {
  const multipliers: Record<string, number> = {
    idea: 0.5,
    MVP: 0.75,
    revenue: 1.0,
    growth: 1.5,
  };
  const multiplier = multipliers[stage] || 1.0;
  return Math.round(requestedAmount * multiplier);
}

function calculateLocationMatch(
  programRegion: string | null,
  userLocation: string
): number {
  if (!programRegion) return 50; // Unknown region gets partial score
  if (programRegion.toLowerCase() === userLocation.toLowerCase()) return 100;
  if (programRegion.toLowerCase().includes(userLocation.toLowerCase())) return 80;
  if (userLocation.toLowerCase().includes(programRegion.toLowerCase())) return 80;
  return 30;
}

function calculateStageMatch(
  programStage: string | null,
  userStage: string
): number {
  if (!programStage) return 50;
  const stageHierarchy: Record<string, number> = {
    idea: 1,
    MVP: 2,
    revenue: 3,
    growth: 4,
  };
  const programLevel = stageHierarchy[programStage] || 2;
  const userLevel = stageHierarchy[userStage] || 1;
  
  if (programLevel <= userLevel) return 100;
  if (programLevel === userLevel + 1) return 60;
  return 20;
}

function calculateAmountMatch(
  min: number | null,
  max: number | null,
  requested: number
): number {
  if (!min && !max) return 50;
  if (min && requested < min) return Math.max(0, 100 - ((min - requested) / min) * 100);
  if (max && requested > max) return Math.max(0, 100 - ((requested - max) / max) * 100);
  return 100;
}

function calculateTypeMatch(
  fundingTypes: string[] | undefined,
  profile: FundingProfile
): number {
  if (!fundingTypes || fundingTypes.length === 0) return 50;
  
  const stageTypes: Record<string, string[]> = {
    idea: ['grant', 'subsidy', 'micro_credit'],
    MVP: ['grant', 'subsidy', 'repayable_advance', 'angel_investment'],
    revenue: ['grant', 'loan', 'bank_loan', 'leasing', 'subsidy'],
    growth: ['loan', 'equity', 'venture_capital', 'bank_loan'],
  };
  
  const preferredTypes = stageTypes[profile.company_stage] || [];
  const matches = fundingTypes.filter(t => preferredTypes.includes(t));
  
  if (matches.length === fundingTypes.length) return 100;
  if (matches.length > 0) return 70;
  return 30;
}

function calculateOrgTypeMatch(
  programOrgType: string | null | undefined,
  userOrgType: string | undefined
): number {
  if (!programOrgType) return 50;
  if (!userOrgType) return 70;
  if (programOrgType.toLowerCase() === userOrgType.toLowerCase()) return 100;
  if (programOrgType.toLowerCase().includes(userOrgType.toLowerCase())) return 80;
  if (userOrgType.toLowerCase().includes(programOrgType.toLowerCase())) return 80;
  return 40;
}

function generateRecommendations(matchResult: MatchScore): string[] {
  const recommendations: string[] = [];
  
  const lowScores = matchResult.breakdown.filter((b: { score: number }) => b.score < 50);
  
  for (const item of lowScores) {
    switch (item.criteria) {
      case 'location':
        recommendations.push('Consider programs in neighboring regions');
        break;
      case 'company_stage':
        recommendations.push('Some programs may require later stage companies');
        break;
      case 'funding_amount':
        recommendations.push('Adjust funding amount expectations');
        break;
      case 'funding_type':
        recommendations.push('Explore alternative funding structures');
        break;
    }
  }
  
  return recommendations;
}
