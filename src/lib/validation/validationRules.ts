// ========= PLAN2FUND — VALIDATION RULES =========
// Quality validation rules and checks for the editor
// Based on GPT agent comprehensive instructions

export interface QualityCheck {
  id: string;
  description: string;
  validate: (content: string) => boolean | string; // return true or an error message
}

export interface ValidationRule {
  id: string;
  fields: string[];
  validate: (data: Record<string, any>) => boolean | string;
}

// ============================================================================
// QUALITY CHECKS
// ============================================================================

export const QUALITY_CHECKS: QualityCheck[] = [
  {
    id: 'word_count_check',
    description: 'Ensure content is within prescribed word count range',
    validate: (content: string) => {
      const wordCount = content.trim().split(/\s+/).length;
      // This would be called with min/max parameters in practice
      return wordCount > 0 ? true : 'Content must have at least one word';
    }
  },
  {
    id: 'problem_solution_completeness',
    description: 'Verify that both problem and solution descriptions are present',
    validate: (content: string) => {
      const hasProblem = /problem|challenge|issue|pain|gap/i.test(content);
      const hasSolution = /solution|approach|method|technology|innovation/i.test(content);
      
      if (!hasProblem) return 'Missing problem statement - clearly define the problem you are solving';
      if (!hasSolution) return 'Missing solution description - explain how you will solve the problem';
      return true;
    }
  },
  {
    id: 'market_data_presence',
    description: 'Validate that market size, growth and customer demographics are included',
    validate: (content: string) => {
      const hasMarketSize = /\d+[\s,]*[billion|million|thousand|€|\$]/i.test(content);
      const hasGrowth = /growth|increase|expand|cagr|rate/i.test(content);
      const hasDemographics = /customer|user|target|segment|demographic/i.test(content);
      
      if (!hasMarketSize) return 'Missing market size data - include specific market size numbers';
      if (!hasGrowth) return 'Missing growth information - include market growth rates or trends';
      if (!hasDemographics) return 'Missing customer demographics - describe your target audience';
      return true;
    }
  },
  {
    id: 'financial_consistency',
    description: 'Ensure budget totals match sum of costs and revenue projections are plausible',
    validate: (content: string) => {
      // This would be more sophisticated in practice, checking actual financial data
      const hasNumbers = /\d+[\s,]*[€|\$]/i.test(content);
      const hasNegative = /-\s*\d+[\s,]*[€|\$]/i.test(content);
      
      if (!hasNumbers) return 'Missing financial data - include budget and revenue information';
      if (hasNegative && !content.includes('loss') && !content.includes('deficit')) {
        return 'Negative numbers found without explanation - justify any negative values';
      }
      return true;
    }
  },
  {
    id: 'trl_justification',
    description: 'Check that TRL stated aligns with evidence provided',
    validate: (content: string) => {
      const hasTRL = /trl\s*[1-9]|technology\s*readiness\s*level/i.test(content);
      const hasEvidence = /prototype|test|trial|validation|proof|evidence|demonstration/i.test(content);
      
      if (hasTRL && !hasEvidence) {
        return 'TRL mentioned without supporting evidence - provide proof of your technology readiness level';
      }
      return true;
    }
  },
  {
    id: 'gdpr_compliance',
    description: 'For sections containing personal data, verify GDPR compliance acknowledgment',
    validate: (content: string) => {
      const hasPersonalData = /personal|individual|customer|user|data|privacy/i.test(content);
      const hasGDPR = /gdpr|data\s*protection|privacy\s*policy|consent|lawful/i.test(content);
      
      if (hasPersonalData && !hasGDPR) {
        return 'Personal data mentioned without GDPR compliance - address data protection requirements';
      }
      return true;
    }
  },
  {
    id: 'austrian_eu_compliance',
    description: 'Check that references to legislation are accurate',
    validate: (content: string) => {
      const hasLegalRefs = /law|regulation|compliance|legal|austrian|eu|european/i.test(content);
      const hasSpecificRefs = /gmbh|gmbh\s*law|state\s*aid|eu\s*taxonomy|horizon\s*europe/i.test(content);
      
      if (hasLegalRefs && !hasSpecificRefs) {
        return 'Legal references too vague - be specific about Austrian/EU regulations';
      }
      return true;
    }
  },
  {
    id: 'impact_metrics',
    description: 'Ensure impact claims are supported by specific metrics',
    validate: (content: string) => {
      const hasImpact = /impact|benefit|effect|contribution|improvement/i.test(content);
      const hasMetrics = /\d+[\s,]*[jobs|emissions|reduction|increase|%]/i.test(content);
      
      if (hasImpact && !hasMetrics) {
        return 'Impact claims without metrics - provide specific, measurable impact indicators';
      }
      return true;
    }
  },
  {
    id: 'competitive_analysis',
    description: 'Verify competitive landscape analysis is included',
    validate: (content: string) => {
      const hasCompetition = /competitor|competition|alternative|rival|market\s*leader/i.test(content);
      const hasDifferentiation = /unique|different|advantage|edge|superior|better/i.test(content);
      
      if (!hasCompetition) return 'Missing competitive analysis - identify and analyze competitors';
      if (!hasDifferentiation) return 'Missing differentiation - explain your competitive advantages';
      return true;
    }
  },
  {
    id: 'team_qualifications',
    description: 'Ensure team members have relevant experience and qualifications',
    validate: (content: string) => {
      const hasTeam = /team|founder|manager|director|expert|specialist/i.test(content);
      const hasExperience = /experience|background|qualification|education|degree|phd|mba/i.test(content);
      
      if (hasTeam && !hasExperience) return 'Team mentioned without qualifications - detail relevant experience and expertise';
      return true;
    }
  }
];

// ============================================================================
// VALIDATION RULES
// ============================================================================

export const VALIDATION_RULES: ValidationRule[] = [
  {
    id: 'executive_summary_completeness',
    fields: ['problem_statement', 'solution_overview', 'target_market', 'funding_request'],
    validate: (data: Record<string, any>) => {
      const missing = [];
      if (!data.problem_statement) missing.push('problem statement');
      if (!data.solution_overview) missing.push('solution overview');
      if (!data.target_market) missing.push('target market');
      if (!data.funding_request) missing.push('funding request');
      
      if (missing.length > 0) {
        return `Missing required fields: ${missing.join(', ')}`;
      }
      return true;
    }
  },
  {
    id: 'financial_consistency_check',
    fields: ['total_budget', 'funding_request', 'co_financing'],
    validate: (data: Record<string, any>) => {
      const totalBudget = parseFloat(data.total_budget) || 0;
      const fundingRequest = parseFloat(data.funding_request) || 0;
      const coFinancing = parseFloat(data.co_financing) || 0;
      
      if (Math.abs(fundingRequest + coFinancing - totalBudget) > 0.01) {
        return 'Funding request and co-financing must equal total budget';
      }
      
      if (fundingRequest > totalBudget) {
        return 'Funding request cannot exceed total budget';
      }
      
      return true;
    }
  },
  {
    id: 'market_size_validation',
    fields: ['market_size', 'growth_rate', 'target_segment'],
    validate: (data: Record<string, any>) => {
      const marketSize = parseFloat(data.market_size) || 0;
      const growthRate = parseFloat(data.growth_rate) || 0;
      
      if (marketSize <= 0) {
        return 'Market size must be greater than zero';
      }
      
      if (growthRate < -100 || growthRate > 1000) {
        return 'Growth rate seems unrealistic (should be between -100% and 1000%)';
      }
      
      if (!data.target_segment) {
        return 'Target market segment must be specified';
      }
      
      return true;
    }
  },
  {
    id: 'team_structure_validation',
    fields: ['founders', 'key_employees', 'advisors'],
    validate: (data: Record<string, any>) => {
      const founders = Array.isArray(data.founders) ? data.founders.length : 0;
      
      if (founders === 0) {
        return 'At least one founder must be specified';
      }
      
      if (founders > 5) {
        return 'Too many founders (typically 1-3 founders)';
      }
      
      return true;
    }
  },
  {
    id: 'timeline_realism_check',
    fields: ['start_date', 'end_date', 'milestones'],
    validate: (data: Record<string, any>) => {
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return 'Invalid start or end date format';
      }
      
      if (endDate <= startDate) {
        return 'End date must be after start date';
      }
      
      const durationMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                           (endDate.getMonth() - startDate.getMonth());
      
      if (durationMonths > 60) {
        return 'Project duration seems too long (typically 12-36 months)';
      }
      
      return true;
    }
  },
  {
    id: 'trl_evidence_validation',
    fields: ['trl_level', 'trl_evidence', 'development_stage'],
    validate: (data: Record<string, any>) => {
      const trlLevel = parseInt(data.trl_level) || 0;
      const hasEvidence = data.trl_evidence && data.trl_evidence.trim().length > 0;
      
      if (trlLevel < 1 || trlLevel > 9) {
        return 'TRL level must be between 1 and 9';
      }
      
      if (trlLevel >= 5 && !hasEvidence) {
        return 'TRL 5+ requires supporting evidence (prototypes, tests, trials)';
      }
      
      return true;
    }
  },
  {
    id: 'job_creation_realism',
    fields: ['job_count', 'job_timeline', 'salary_range'],
    validate: (data: Record<string, any>) => {
      const jobCount = parseInt(data.job_count) || 0;
      const salaryMin = parseFloat(data.salary_range?.split('-')[0]) || 0;
      const salaryMax = parseFloat(data.salary_range?.split('-')[1]) || 0;
      
      if (jobCount <= 0) {
        return 'Job creation count must be greater than zero';
      }
      
      if (jobCount > 100) {
        return 'Job creation count seems unrealistic for startup (typically 5-50 jobs)';
      }
      
      if (salaryMin > 0 && salaryMax > 0 && salaryMin > salaryMax) {
        return 'Minimum salary cannot be greater than maximum salary';
      }
      
      if (salaryMin > 0 && salaryMin < 20000) {
        return 'Salary range seems too low for Austrian market';
      }
      
      return true;
    }
  },
  {
    id: 'consortium_validation',
    fields: ['has_consortium', 'partners', 'agreements'],
    validate: (data: Record<string, any>) => {
      const hasConsortium = data.has_consortium === true || data.has_consortium === 'true';
      const partners = Array.isArray(data.partners) ? data.partners : [];
      
      if (hasConsortium && partners.length === 0) {
        return 'Consortium indicated but no partners specified';
      }
      
      if (hasConsortium && partners.length > 10) {
        return 'Too many consortium partners (typically 2-8 partners)';
      }
      
      return true;
    }
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Run all quality checks on content
 */
export function runQualityChecks(content: string): { passed: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const check of QUALITY_CHECKS) {
    const result = check.validate(content);
    if (result !== true) {
      errors.push(result as string);
    }
  }
  
  return {
    passed: errors.length === 0,
    errors
  };
}

/**
 * Run validation rules on form data
 */
export function runValidationRules(data: Record<string, any>): { passed: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const rule of VALIDATION_RULES) {
    const result = rule.validate(data);
    if (result !== true) {
      errors.push(result as string);
    }
  }
  
  return {
    passed: errors.length === 0,
    errors
  };
}

/**
 * Get specific quality check by ID
 */
export function getQualityCheck(checkId: string): QualityCheck | undefined {
  return QUALITY_CHECKS.find(check => check.id === checkId);
}

/**
 * Get specific validation rule by ID
 */
export function getValidationRule(ruleId: string): ValidationRule | undefined {
  return VALIDATION_RULES.find(rule => rule.id === ruleId);
}

/**
 * Run specific quality check
 */
export function runQualityCheck(checkId: string, content: string): boolean | string {
  const check = getQualityCheck(checkId);
  if (!check) {
    return `Quality check '${checkId}' not found`;
  }
  return check.validate(content);
}

/**
 * Run specific validation rule
 */
export function runValidationRule(ruleId: string, data: Record<string, any>): boolean | string {
  const rule = getValidationRule(ruleId);
  if (!rule) {
    return `Validation rule '${ruleId}' not found`;
  }
  return rule.validate(data);
}

/**
 * Get all quality check IDs
 */
export function getQualityCheckIds(): string[] {
  return QUALITY_CHECKS.map(check => check.id);
}

/**
 * Get all validation rule IDs
 */
export function getValidationRuleIds(): string[] {
  return VALIDATION_RULES.map(rule => rule.id);
}
