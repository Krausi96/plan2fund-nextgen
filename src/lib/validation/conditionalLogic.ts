// ========= PLAN2FUND — CONDITIONAL LOGIC =========
// Centralized conditional logic definitions for dynamic form behavior
// Based on GPT agent comprehensive instructions

export interface LogicCondition {
  id: string;                   // Unique ID for the condition
  sourceId: string;             // ID of the question/section controlling the logic
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'in' | 'notIn' | 'contains' | 'notContains';
  value: any;                   // Value to compare against
  targetId: string;             // ID of the section/subquestion affected
  action: 'show' | 'hide' | 'require' | 'optional' | 'enable' | 'disable'; // Action to perform
  description?: string;         // Human-readable description of the condition
}

// ============================================================================
// CONDITIONAL RULES
// ============================================================================

export const CONDITIONAL_RULES: LogicCondition[] = [
  // Consortium-related rules
  {
    id: 'show_consortium_if_partners',
    sourceId: 'hasConsortium',
    operator: 'equals',
    value: true,
    targetId: 'consortium_partners',
    action: 'show',
    description: 'Show consortium partners section when consortium is indicated'
  },
  {
    id: 'hide_consortium_if_no_partners',
    sourceId: 'hasConsortium',
    operator: 'equals',
    value: false,
    targetId: 'consortium_partners',
    action: 'hide',
    description: 'Hide consortium partners section when no consortium'
  },
  {
    id: 'require_consortium_details',
    sourceId: 'hasConsortium',
    operator: 'equals',
    value: true,
    targetId: 'consortium_details',
    action: 'require',
    description: 'Make consortium details required when consortium is indicated'
  },

  // Loan-related rules
  {
    id: 'hide_collateral_for_unsecured',
    sourceId: 'loanSecured',
    operator: 'equals',
    value: false,
    targetId: 'collateral_details',
    action: 'hide',
    description: 'Hide collateral section for unsecured loans'
  },
  {
    id: 'show_collateral_for_secured',
    sourceId: 'loanSecured',
    operator: 'equals',
    value: true,
    targetId: 'collateral_details',
    action: 'show',
    description: 'Show collateral section for secured loans'
  },
  {
    id: 'require_collateral_details',
    sourceId: 'loanSecured',
    operator: 'equals',
    value: true,
    targetId: 'collateral_details',
    action: 'require',
    description: 'Make collateral details required for secured loans'
  },
  {
    id: 'show_guarantor_for_high_risk',
    sourceId: 'riskLevel',
    operator: 'in',
    value: ['high', 'very_high'],
    targetId: 'guarantor_details',
    action: 'show',
    description: 'Show guarantor section for high-risk loans'
  },

  // TRL-related rules
  {
    id: 'require_trl_for_grants',
    sourceId: 'fundingType',
    operator: 'equals',
    value: 'grants',
    targetId: 'trl_level',
    action: 'require',
    description: 'Make TRL level required for grant applications'
  },
  {
    id: 'show_trl_evidence_for_high_trl',
    sourceId: 'trl_level',
    operator: 'greaterThan',
    value: 4,
    targetId: 'trl_evidence',
    action: 'show',
    description: 'Show TRL evidence section for TRL 5+'
  },
  {
    id: 'require_trl_evidence_for_high_trl',
    sourceId: 'trl_level',
    operator: 'greaterThan',
    value: 4,
    targetId: 'trl_evidence',
    action: 'require',
    description: 'Make TRL evidence required for TRL 5+'
  },

  // Industry-specific rules
  {
    id: 'show_healthcare_compliance',
    sourceId: 'industry',
    operator: 'equals',
    value: 'healthcare',
    targetId: 'regulatory_compliance',
    action: 'show',
    description: 'Show regulatory compliance section for healthcare projects'
  },
  {
    id: 'require_healthcare_compliance',
    sourceId: 'industry',
    operator: 'equals',
    value: 'healthcare',
    targetId: 'regulatory_compliance',
    action: 'require',
    description: 'Make regulatory compliance required for healthcare projects'
  },
  {
    id: 'show_green_tech_metrics',
    sourceId: 'industry',
    operator: 'equals',
    value: 'greenTech',
    targetId: 'environmental_metrics',
    action: 'show',
    description: 'Show environmental metrics section for green tech projects'
  },
  {
    id: 'require_green_tech_metrics',
    sourceId: 'industry',
    operator: 'equals',
    value: 'greenTech',
    targetId: 'environmental_metrics',
    action: 'require',
    description: 'Make environmental metrics required for green tech projects'
  },

  // Visa-related rules
  {
    id: 'show_job_creation_for_visa',
    sourceId: 'fundingType',
    operator: 'equals',
    value: 'visa',
    targetId: 'job_creation_plan',
    action: 'show',
    description: 'Show job creation plan for visa applications'
  },
  {
    id: 'require_job_creation_for_visa',
    sourceId: 'fundingType',
    operator: 'equals',
    value: 'visa',
    targetId: 'job_creation_plan',
    action: 'require',
    description: 'Make job creation plan required for visa applications'
  },
  {
    id: 'show_austrian_market_analysis',
    sourceId: 'fundingType',
    operator: 'equals',
    value: 'visa',
    targetId: 'austrian_market_analysis',
    action: 'show',
    description: 'Show Austrian market analysis for visa applications'
  },

  // Equity-related rules
  {
    id: 'show_traction_for_equity',
    sourceId: 'fundingType',
    operator: 'equals',
    value: 'equity',
    targetId: 'traction_metrics',
    action: 'show',
    description: 'Show traction metrics for equity funding'
  },
  {
    id: 'require_traction_for_equity',
    sourceId: 'fundingType',
    operator: 'equals',
    value: 'equity',
    targetId: 'traction_metrics',
    action: 'require',
    description: 'Make traction metrics required for equity funding'
  },
  {
    id: 'show_exit_strategy_for_equity',
    sourceId: 'fundingType',
    operator: 'equals',
    value: 'equity',
    targetId: 'exit_strategy',
    action: 'show',
    description: 'Show exit strategy for equity funding'
  },

  // Product-specific rules
  {
    id: 'show_upload_for_review',
    sourceId: 'productType',
    operator: 'equals',
    value: 'review',
    targetId: 'document_upload',
    action: 'show',
    description: 'Show document upload for review product'
  },
  {
    id: 'require_upload_for_review',
    sourceId: 'productType',
    operator: 'equals',
    value: 'review',
    targetId: 'document_upload',
    action: 'require',
    description: 'Make document upload required for review product'
  },
  {
    id: 'show_program_selection_for_submission',
    sourceId: 'productType',
    operator: 'equals',
    value: 'submission',
    targetId: 'program_selection',
    action: 'show',
    description: 'Show program selection for submission product'
  },
  {
    id: 'require_program_selection_for_submission',
    sourceId: 'productType',
    operator: 'equals',
    value: 'submission',
    targetId: 'program_selection',
    action: 'require',
    description: 'Make program selection required for submission product'
  },

  // Financial rules
  {
    id: 'show_co_financing_for_grants',
    sourceId: 'fundingType',
    operator: 'equals',
    value: 'grants',
    targetId: 'co_financing_sources',
    action: 'show',
    description: 'Show co-financing sources for grants'
  },
  {
    id: 'require_co_financing_for_grants',
    sourceId: 'fundingType',
    operator: 'equals',
    value: 'grants',
    targetId: 'co_financing_sources',
    action: 'require',
    description: 'Make co-financing sources required for grants'
  },
  {
    id: 'show_repayment_plan_for_loans',
    sourceId: 'fundingType',
    operator: 'equals',
    value: 'bankLoans',
    targetId: 'repayment_plan',
    action: 'show',
    description: 'Show repayment plan for bank loans'
  },
  {
    id: 'require_repayment_plan_for_loans',
    sourceId: 'fundingType',
    operator: 'equals',
    value: 'bankLoans',
    targetId: 'repayment_plan',
    action: 'require',
    description: 'Make repayment plan required for bank loans'
  },

  // Team size rules
  {
    id: 'show_team_expansion_for_large_team',
    sourceId: 'teamSize',
    operator: 'greaterThan',
    value: 10,
    targetId: 'team_expansion_plan',
    action: 'show',
    description: 'Show team expansion plan for large teams'
  },
  {
    id: 'show_organizational_chart_for_medium_team',
    sourceId: 'teamSize',
    operator: 'greaterThan',
    value: 5,
    targetId: 'organizational_chart',
    action: 'show',
    description: 'Show organizational chart for medium+ teams'
  },

  // Revenue model rules
  {
    id: 'show_subscription_metrics_for_saas',
    sourceId: 'revenueModel',
    operator: 'contains',
    value: 'subscription',
    targetId: 'subscription_metrics',
    action: 'show',
    description: 'Show subscription metrics for SaaS businesses'
  },
  {
    id: 'show_unit_economics_for_product',
    sourceId: 'revenueModel',
    operator: 'in',
    value: ['product_sales', 'ecommerce', 'marketplace'],
    targetId: 'unit_economics',
    action: 'show',
    description: 'Show unit economics for product-based businesses'
  },

  // Geographic rules
  {
    id: 'show_eu_compliance_for_eu_funding',
    sourceId: 'fundingSource',
    operator: 'contains',
    value: 'EU',
    targetId: 'eu_compliance',
    action: 'show',
    description: 'Show EU compliance section for EU funding'
  },
  {
    id: 'require_eu_compliance_for_eu_funding',
    sourceId: 'fundingSource',
    operator: 'contains',
    value: 'EU',
    targetId: 'eu_compliance',
    action: 'require',
    description: 'Make EU compliance required for EU funding'
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Evaluate a single condition against form data
 */
export function evaluateCondition(condition: LogicCondition, formData: Record<string, any>): boolean {
  const sourceValue = formData[condition.sourceId];
  
  if (sourceValue === undefined || sourceValue === null) {
    return false;
  }
  
  switch (condition.operator) {
    case 'equals':
      return sourceValue === condition.value;
    case 'notEquals':
      return sourceValue !== condition.value;
    case 'greaterThan':
      return Number(sourceValue) > Number(condition.value);
    case 'lessThan':
      return Number(sourceValue) < Number(condition.value);
    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(sourceValue);
    case 'notIn':
      return Array.isArray(condition.value) && !condition.value.includes(sourceValue);
    case 'contains':
      return String(sourceValue).toLowerCase().includes(String(condition.value).toLowerCase());
    case 'notContains':
      return !String(sourceValue).toLowerCase().includes(String(condition.value).toLowerCase());
    default:
      return false;
  }
}

/**
 * Get all conditions that apply to a specific target
 */
export function getConditionsForTarget(targetId: string): LogicCondition[] {
  return CONDITIONAL_RULES.filter(rule => rule.targetId === targetId);
}

/**
 * Get all conditions triggered by a specific source
 */
export function getConditionsForSource(sourceId: string): LogicCondition[] {
  return CONDITIONAL_RULES.filter(rule => rule.sourceId === sourceId);
}

/**
 * Evaluate all conditions and return actions to take
 */
export function evaluateAllConditions(formData: Record<string, any>): Record<string, string[]> {
  const actions: Record<string, string[]> = {};
  
  for (const condition of CONDITIONAL_RULES) {
    if (evaluateCondition(condition, formData)) {
      if (!actions[condition.targetId]) {
        actions[condition.targetId] = [];
      }
      actions[condition.targetId].push(condition.action);
    }
  }
  
  return actions;
}

/**
 * Get the final action for a target (highest priority action)
 */
export function getFinalActionForTarget(targetId: string, formData: Record<string, any>): string | null {
  const conditions = getConditionsForTarget(targetId);
  const triggeredConditions = conditions.filter(condition => evaluateCondition(condition, formData));
  
  if (triggeredConditions.length === 0) {
    return null;
  }
  
  // Priority order: require > optional > show > hide > enable > disable
  const priority = {
    'require': 6,
    'optional': 5,
    'show': 4,
    'hide': 3,
    'enable': 2,
    'disable': 1
  };
  
  const highestPriority = triggeredConditions.reduce((highest, current) => {
    return priority[current.action] > priority[highest.action] ? current : highest;
  });
  
  return highestPriority.action;
}

/**
 * Check if a target should be visible
 */
export function isTargetVisible(targetId: string, formData: Record<string, any>): boolean {
  const action = getFinalActionForTarget(targetId, formData);
  return action === 'show' || action === 'require' || action === 'optional';
}

/**
 * Check if a target is required
 */
export function isTargetRequired(targetId: string, formData: Record<string, any>): boolean {
  const action = getFinalActionForTarget(targetId, formData);
  return action === 'require';
}

/**
 * Check if a target is enabled
 */
export function isTargetEnabled(targetId: string, formData: Record<string, any>): boolean {
  const action = getFinalActionForTarget(targetId, formData);
  return action !== 'disable';
}

/**
 * Get all visible targets
 */
export function getVisibleTargets(formData: Record<string, any>): string[] {
  const allTargets = [...new Set(CONDITIONAL_RULES.map(rule => rule.targetId))];
  return allTargets.filter(targetId => isTargetVisible(targetId, formData));
}

/**
 * Get all required targets
 */
export function getRequiredTargets(formData: Record<string, any>): string[] {
  const allTargets = [...new Set(CONDITIONAL_RULES.map(rule => rule.targetId))];
  return allTargets.filter(targetId => isTargetRequired(targetId, formData));
}

/**
 * Get all enabled targets
 */
export function getEnabledTargets(formData: Record<string, any>): string[] {
  const allTargets = [...new Set(CONDITIONAL_RULES.map(rule => rule.targetId))];
  return allTargets.filter(targetId => isTargetEnabled(targetId, formData));
}

/**
 * Get condition by ID
 */
export function getConditionById(conditionId: string): LogicCondition | undefined {
  return CONDITIONAL_RULES.find(rule => rule.id === conditionId);
}

/**
 * Add a new condition
 */
export function addCondition(condition: LogicCondition): void {
  CONDITIONAL_RULES.push(condition);
}

/**
 * Remove a condition by ID
 */
export function removeCondition(conditionId: string): boolean {
  const index = CONDITIONAL_RULES.findIndex(rule => rule.id === conditionId);
  if (index !== -1) {
    CONDITIONAL_RULES.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * Update a condition by ID
 */
export function updateCondition(conditionId: string, updates: Partial<LogicCondition>): boolean {
  const index = CONDITIONAL_RULES.findIndex(rule => rule.id === conditionId);
  if (index !== -1) {
    CONDITIONAL_RULES[index] = { ...CONDITIONAL_RULES[index], ...updates };
    return true;
  }
  return false;
}
