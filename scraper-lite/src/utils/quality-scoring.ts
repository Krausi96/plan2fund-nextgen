/**
 * Quality Scoring and Validation
 * Determines data quality and validates funding programs based on type-specific rules
 */

import { PageMetadata } from '../../db/db';

export type ProgramCategory = 'funding' | 'support' | 'service' | 'information';

export interface QualityAssessment {
  qualityScore: number; // 0-100
  completenessScore: number; // 0-100
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  category: ProgramCategory;
  isValid: boolean;
  issues: string[];
  warnings: string[];
}

/**
 * Calculate quality score based on data completeness
 */
export function calculateQualityScore(page: PageMetadata): QualityAssessment {
  const issues: string[] = [];
  const warnings: string[] = [];
  let score = 0;
  let completenessScore = 0;
  
  // 1. Has Funding Amount (+20 points)
  if (page.funding_amount_min || page.funding_amount_max) {
    score += 20;
    completenessScore += 20;
  } else {
    issues.push('Missing funding amount');
  }
  
  // 2. Has Deadline or Open Deadline (+15 points)
  if (page.deadline || page.open_deadline) {
    score += 15;
    completenessScore += 15;
  } else {
    issues.push('Missing deadline');
  }
  
  // 3. Has Requirements (5+ requirements = +20 points)
  const reqCount: number = Object.values(page.categorized_requirements || {}).reduce(
    (sum: number, arr: unknown) => sum + (Array.isArray(arr) ? arr.length : 0), 0
  );
  if (reqCount >= 5) {
    score += 20;
    completenessScore += 20;
  } else if (reqCount > 0) {
    score += Math.min(20, reqCount * 4); // Partial credit
    completenessScore += Math.min(20, reqCount * 4);
    if (reqCount < 5) {
      warnings.push(`Only ${reqCount} requirements (ideally 5+)`);
    }
  } else {
    issues.push('No requirements extracted');
  }
  
  // 4. Has Description (+10 points)
  if (page.description && page.description.length > 50) {
    score += 10;
    completenessScore += 10;
  } else {
    issues.push('Missing or too short description');
  }
  
  // 5. Has Contact Info (+10 points)
  if (page.contact_email || page.contact_phone) {
    score += 10;
    completenessScore += 10;
  } else {
    warnings.push('Missing contact information');
  }
  
  // 6. Funding Type Valid (+15 points)
  const hasValidFundingType = page.funding_types && 
                              page.funding_types.length > 0 &&
                              !page.funding_types.includes('unknown');
  if (hasValidFundingType) {
    score += 15;
    completenessScore += 15;
  } else {
    issues.push('Missing or invalid funding type');
  }
  
  // 7. Not a Service Page (+10 points)
  // Service pages typically have no funding amount and no deadline
  const isLikelyService = !page.funding_amount_min && 
                          !page.funding_amount_max && 
                          !page.deadline && 
                          !page.open_deadline;
  if (!isLikelyService) {
    score += 10;
    completenessScore += 10;
  } else {
    warnings.push('Likely a service page (no funding amount, no deadline)');
  }
  
  // Determine category
  const category = determineCategory(page);
  
  // Type-specific validation
  const typeValidation = validateByFundingType(page, category);
  issues.push(...typeValidation.issues);
  warnings.push(...typeValidation.warnings);
  
  // Adjust score based on validation
  if (typeValidation.isValid === false) {
    score = Math.max(0, score - 20); // Penalize invalid programs
  }
  
  // Calculate data quality level
  let dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  if (score >= 80) {
    dataQuality = 'excellent';
  } else if (score >= 60) {
    dataQuality = 'good';
  } else if (score >= 40) {
    dataQuality = 'fair';
  } else {
    dataQuality = 'poor';
  }
  
  // Determine if valid (score >= 40 and no critical issues)
  const isValid = score >= 40 && typeValidation.isValid !== false;
  
  return {
    qualityScore: Math.min(100, score),
    completenessScore: Math.min(100, completenessScore),
    dataQuality,
    category,
    isValid,
    issues,
    warnings
  };
}

/**
 * Determine program category based on funding types and characteristics
 */
function determineCategory(page: PageMetadata): ProgramCategory {
  const fundingTypes = page.funding_types || [];
  
  // Check for actual funding types
  const hasFunding = fundingTypes.some((t: string) => 
    ['grant', 'loan', 'equity', 'bank_loan', 'leasing', 'crowdfunding', 
     'subsidy', 'guarantee', 'venture_capital', 'angel_investment'].includes(t)
  );
  
  if (hasFunding) {
    return 'funding';
  }
  
  // Check for support programs
  const hasSupport = fundingTypes.some((t: string) => 
    ['gründungsprogramm', 'coaching', 'mentoring', 'consultation', 
     'networking', 'workshop'].includes(t)
  );
  
  if (hasSupport) {
    return 'support';
  }
  
  // Check if it's a service (no funding amount, no deadline)
  const isService = !page.funding_amount_min && 
                    !page.funding_amount_max && 
                    !page.deadline && 
                    !page.open_deadline;
  
  if (isService) {
    return 'service';
  }
  
  // Default to information
  return 'information';
}

/**
 * Validate program based on funding type-specific rules
 */
function validateByFundingType(
  page: PageMetadata, 
  category: ProgramCategory
): { isValid: boolean | null; issues: string[]; warnings: string[] } {
  const issues: string[] = [];
  const warnings: string[] = [];
  let isValid: boolean | null = null;
  
  const fundingTypes = page.funding_types || [];
  const isGrant = fundingTypes.includes('grant');
  const isLoan = fundingTypes.includes('loan') || fundingTypes.includes('bank_loan');
  const isGründungsprogramm = fundingTypes.includes('gründungsprogramm');
  const isService = category === 'service';
  
  // Grants should have deadline OR open_deadline = true
  if (isGrant) {
    if (!page.deadline && !page.open_deadline) {
      issues.push('Grant missing deadline (grants typically have deadlines)');
      isValid = false;
    } else if (page.deadline && page.open_deadline) {
      warnings.push('Grant has both deadline and open_deadline (should be one or the other)');
    }
  }
  
  // Loans/Banks typically have NO deadline (ongoing)
  if (isLoan) {
    if (page.deadline && !page.open_deadline) {
      warnings.push('Loan has specific deadline (loans typically have open/ongoing deadlines)');
    }
    // Loans should have funding amount
    if (!page.funding_amount_min && !page.funding_amount_max) {
      warnings.push('Loan missing funding amount');
    }
  }
  
  // Services should have NO funding amount and NO deadline
  if (isService) {
    if (page.funding_amount_min || page.funding_amount_max) {
      warnings.push('Service page has funding amount (unexpected)');
    }
    if (page.deadline || page.open_deadline) {
      warnings.push('Service page has deadline (unexpected)');
    }
  }
  
  // Gründungsprogramm: May have deadline, may have funding amount (both optional)
  if (isGründungsprogramm) {
    // No strict validation - support programs are flexible
    if (!page.description || page.description.length < 50) {
      warnings.push('Gründungsprogramm missing detailed description');
    }
  }
  
  // Funding programs should have funding amount
  if (category === 'funding' && !page.funding_amount_min && !page.funding_amount_max) {
    issues.push('Funding program missing funding amount');
    isValid = false;
  }
  
  return { isValid: isValid ?? true, issues, warnings };
}

/**
 * Get quality assessment for a page
 */
export function assessPageQuality(page: PageMetadata): QualityAssessment {
  return calculateQualityScore(page);
}

