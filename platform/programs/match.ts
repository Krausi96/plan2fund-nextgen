/**
 * Program Matching Module
 * Deterministic matching logic for programs based on user criteria
 * No LLM involved - pure logic-based scoring
 */

import type { Program } from '@/platform/core/types/program';

export interface MatchScore {
  programId: string;
  score: number;
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
}

/**
 * Match programs to user criteria using deterministic scoring
 * Returns ranked list of matches without LLM
 */
export function matchPrograms(
  programs: Program[],
  userCriteria: Record<string, any>
): MatchScore[] {
  const scored = programs.map(program => scoreProgram(program, userCriteria));
  return scored.sort((a, b) => b.score - a.score);
}

/**
 * Score a single program against user criteria
 */
function scoreProgram(program: Program, criteria: Record<string, any>): MatchScore {
  let score = 0;
  const reasons: string[] = [];
  
  // Company stage matching
  if (criteria.company_stage && program.company_stage) {
    if (program.company_stage === criteria.company_stage) {
      score += 30;
      reasons.push(`Stage match: ${criteria.company_stage}`);
    }
  }
  
  // Funding type matching
  if (criteria.funding_types && program.funding_types) {
    const matchedTypes = (criteria.funding_types as string[]).filter(t =>
      program.funding_types?.includes(t)
    );
    score += matchedTypes.length * 15;
    if (matchedTypes.length > 0) {
      reasons.push(`Funding types: ${matchedTypes.join(', ')}`);
    }
  }
  
  // Location matching
  if (criteria.location && program.region) {
    if (program.region.toLowerCase().includes(criteria.location.toLowerCase())) {
      score += 20;
      reasons.push(`Region: ${program.region}`);
    }
  }
  
  // Amount range matching
  if (criteria.funding_amount && program.funding_amount_max && program.funding_amount_min) {
    if (
      criteria.funding_amount >= program.funding_amount_min &&
      criteria.funding_amount <= program.funding_amount_max
    ) {
      score += 25;
      reasons.push(`Funding range fits: €${program.funding_amount_min}-${program.funding_amount_max}`);
    }
  }
  
  // Repayable preference
  if (criteria.co_financing === 'co_no' && program.repayable === false) {
    score += 20;
    reasons.push('Grant-only program matches preference');
  }
  
  return {
    programId: program.id,
    score: Math.min(score, 100),
    confidence: score > 70 ? 'high' : score > 40 ? 'medium' : 'low',
    reasons: reasons.length > 0 ? reasons : ['Partial match'],
  };
}

/**
 * Filter programs based on hard eligibility criteria
 * Returns programs that meet minimum requirements
 */
export function filterEligiblePrograms(
  programs: Program[],
  criteria: Record<string, any>
): Program[] {
  return programs.filter(program => {
    // Must-have: Company stage
    if (criteria.company_stage && program.company_stage !== criteria.company_stage) {
      return false;
    }
    
    // Must-have: Funding type
    if (
      criteria.funding_types &&
      !program.funding_types?.some(t => (criteria.funding_types as string[]).includes(t))
    ) {
      return false;
    }
    
    // Must-have: Amount range
    if (criteria.funding_amount) {
      if (
        !program.funding_amount_max ||
        !program.funding_amount_min ||
        criteria.funding_amount < program.funding_amount_min ||
        criteria.funding_amount > program.funding_amount_max
      ) {
        return false;
      }
    }
    
    return true;
  });
}
