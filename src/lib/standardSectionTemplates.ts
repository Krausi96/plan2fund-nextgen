// ========= PLAN2FUND — STANDARD SECTION TEMPLATES =========
// Standard business plan sections by funding type
// Based on real funding program requirements and industry standards

export interface StandardSection {
  id: string;
  title: string;
  description: string;
  required: boolean;
  wordCountMin: number;
  wordCountMax: number;
  order: number;
  category: string; // Maps to requirement categories
  prompts: string[];
  validationRules: {
    requiredFields: string[];
    formatRequirements: string[];
  };
}

export interface StandardSectionTemplates {
  grants: StandardSection[];
  bankLoans: StandardSection[];
  equity: StandardSection[];
  visa: StandardSection[];
}

// ============================================================================
// STANDARD SECTION TEMPLATES BY FUNDING TYPE
// ============================================================================

export const STANDARD_SECTIONS: StandardSectionTemplates = {
  grants: [
    {
      id: 'executive_summary',
      title: 'Executive Summary',
      description: 'Brief overview of your project and funding request',
      required: true,
      wordCountMin: 200,
      wordCountMax: 500,
      order: 1,
      category: 'general',
      prompts: [
        'Summarize your project in 2-3 sentences',
        'What problem does your project solve?',
        'What makes your approach innovative?',
        'What impact do you expect to achieve?'
      ],
      validationRules: {
        requiredFields: ['project_overview', 'innovation_aspect', 'expected_impact'],
        formatRequirements: ['clear_problem_statement', 'solution_description']
      }
    },
    {
      id: 'project_description',
      title: 'Project Description',
      description: 'Detailed description of your innovative project',
      required: true,
      wordCountMin: 400,
      wordCountMax: 1000,
      order: 2,
      category: 'project',
      prompts: [
        'Describe your project in detail',
        'What technology or approach will you use?',
        'How is your project innovative?',
        'What are the expected outcomes?'
      ],
      validationRules: {
        requiredFields: ['technical_approach', 'innovation_aspect', 'expected_outcomes'],
        formatRequirements: ['clear_methodology', 'timeline_reference']
      }
    },
    {
      id: 'innovation_plan',
      title: 'Innovation & Technology',
      description: 'Technology readiness and innovation aspects',
      required: true,
      wordCountMin: 300,
      wordCountMax: 800,
      order: 3,
      category: 'technical',
      prompts: [
        'What is your technology readiness level (TRL)?',
        'How is your technology innovative?',
        'What research has been done?',
        'What are the technical risks?'
      ],
      validationRules: {
        requiredFields: ['trl_level', 'innovation_description', 'research_background'],
        formatRequirements: ['trl_justification', 'risk_assessment']
      }
    },
    {
      id: 'impact_assessment',
      title: 'Impact Assessment',
      description: 'Expected impact and benefits of your project',
      required: true,
      wordCountMin: 300,
      wordCountMax: 800,
      order: 4,
      category: 'impact',
      prompts: [
        'What environmental impact will your project have?',
        'How many jobs will be created?',
        'What market impact do you expect?',
        'How will you measure success?'
      ],
      validationRules: {
        requiredFields: ['environmental_impact', 'job_creation', 'market_impact'],
        formatRequirements: ['quantified_metrics', 'measurement_methods']
      }
    },
    {
      id: 'consortium_partners',
      title: 'Consortium Partners',
      description: 'Details about your consortium partners and agreements',
      required: true,
      wordCountMin: 200,
      wordCountMax: 500,
      order: 5,
      category: 'consortium',
      prompts: [
        'Who are your consortium partners?',
        'What role does each partner play?',
        'What agreements do you have?',
        'How do partners complement each other?'
      ],
      validationRules: {
        requiredFields: ['partner_list', 'role_descriptions', 'agreement_status'],
        formatRequirements: ['partner_credentials', 'collaboration_plan']
      }
    },
    {
      id: 'financial_plan',
      title: 'Financial Plan',
      description: 'Budget, funding requirements, and financial projections',
      required: true,
      wordCountMin: 400,
      wordCountMax: 1000,
      order: 6,
      category: 'financial',
      prompts: [
        'What is your total project budget?',
        'How much funding do you need?',
        'What are your co-financing sources?',
        'What are your revenue projections?'
      ],
      validationRules: {
        requiredFields: ['total_budget', 'funding_request', 'co_financing_plan'],
        formatRequirements: ['budget_breakdown', 'financial_justification']
      }
    }
  ],

  bankLoans: [
    {
      id: 'executive_summary',
      title: 'Executive Summary',
      description: 'Brief overview of your business and loan request',
      required: true,
      wordCountMin: 200,
      wordCountMax: 500,
      order: 1,
      category: 'general',
      prompts: [
        'Summarize your business in 2-3 sentences',
        'What loan amount do you need?',
        'How will you use the loan?',
        'What is your repayment plan?'
      ],
      validationRules: {
        requiredFields: ['business_overview', 'loan_amount', 'use_of_funds'],
        formatRequirements: ['clear_business_model', 'repayment_capacity']
      }
    },
    {
      id: 'business_description',
      title: 'Business Description',
      description: 'Detailed description of your business operations',
      required: true,
      wordCountMin: 400,
      wordCountMax: 1000,
      order: 2,
      category: 'project',
      prompts: [
        'What does your business do?',
        'What products or services do you offer?',
        'How long have you been in business?',
        'What is your business model?'
      ],
      validationRules: {
        requiredFields: ['business_activities', 'products_services', 'business_model'],
        formatRequirements: ['clear_operations', 'market_positioning']
      }
    },
    {
      id: 'financial_stability',
      title: 'Financial Stability Analysis',
      description: 'Analysis of your financial health and stability',
      required: true,
      wordCountMin: 500,
      wordCountMax: 1200,
      order: 3,
      category: 'financial',
      prompts: [
        'What are your current financial ratios?',
        'How stable is your cash flow?',
        'What are your debt levels?',
        'How do you manage financial risks?'
      ],
      validationRules: {
        requiredFields: ['financial_ratios', 'cash_flow_analysis', 'debt_analysis'],
        formatRequirements: ['ratio_calculations', 'risk_mitigation']
      }
    },
    {
      id: 'repayment_plan',
      title: 'Repayment Plan',
      description: 'Detailed plan for loan repayment',
      required: true,
      wordCountMin: 300,
      wordCountMax: 800,
      order: 4,
      category: 'financial',
      prompts: [
        'How will you repay the loan?',
        'What is your repayment schedule?',
        'What are your revenue projections?',
        'What if your business doesn\'t perform as expected?'
      ],
      validationRules: {
        requiredFields: ['repayment_schedule', 'revenue_projections', 'contingency_plan'],
        formatRequirements: ['dscr_calculation', 'scenario_analysis']
      }
    },
    {
      id: 'collateral_security',
      title: 'Collateral & Security',
      description: 'Details about collateral and security for the loan',
      required: true,
      wordCountMin: 200,
      wordCountMax: 500,
      order: 5,
      category: 'legal',
      prompts: [
        'What collateral can you provide?',
        'What is the value of your collateral?',
        'What other security can you offer?',
        'How will you protect the bank\'s interests?'
      ],
      validationRules: {
        requiredFields: ['collateral_list', 'collateral_valuation', 'security_measures'],
        formatRequirements: ['valuation_justification', 'legal_documentation']
      }
    }
  ],

  equity: [
    {
      id: 'executive_summary',
      title: 'Executive Summary',
      description: 'Brief overview of your business and investment opportunity',
      required: true,
      wordCountMin: 200,
      wordCountMax: 500,
      order: 1,
      category: 'general',
      prompts: [
        'What is your business idea?',
        'What problem do you solve?',
        'How big is the market opportunity?',
        'What makes you different?'
      ],
      validationRules: {
        requiredFields: ['problem_solution', 'market_opportunity', 'competitive_advantage'],
        formatRequirements: ['clear_value_proposition', 'market_size']
      }
    },
    {
      id: 'market_opportunity',
      title: 'Market Opportunity',
      description: 'Analysis of market size and opportunity',
      required: true,
      wordCountMin: 400,
      wordCountMax: 1000,
      order: 2,
      category: 'market_size',
      prompts: [
        'How big is your target market?',
        'What is your addressable market?',
        'How fast is the market growing?',
        'What market trends support your business?'
      ],
      validationRules: {
        requiredFields: ['market_size', 'growth_rate', 'market_trends'],
        formatRequirements: ['market_research', 'data_sources']
      }
    },
    {
      id: 'business_model',
      title: 'Business Model',
      description: 'How your business makes money and scales',
      required: true,
      wordCountMin: 300,
      wordCountMax: 800,
      order: 3,
      category: 'revenue_model',
      prompts: [
        'How do you make money?',
        'What are your revenue streams?',
        'How will you scale your business?',
        'What is your unit economics?'
      ],
      validationRules: {
        requiredFields: ['revenue_streams', 'scaling_strategy', 'unit_economics'],
        formatRequirements: ['financial_model', 'growth_projections']
      }
    },
    {
      id: 'traction_metrics',
      title: 'Traction & Metrics',
      description: 'Evidence of business traction and key metrics',
      required: true,
      wordCountMin: 300,
      wordCountMax: 800,
      order: 4,
      category: 'project',
      prompts: [
        'What traction do you have so far?',
        'What are your key metrics?',
        'How fast are you growing?',
        'What milestones have you achieved?'
      ],
      validationRules: {
        requiredFields: ['traction_evidence', 'key_metrics', 'growth_rate'],
        formatRequirements: ['metric_justification', 'milestone_tracking']
      }
    },
    {
      id: 'team_management',
      title: 'Team & Management',
      description: 'Details about your team and management structure',
      required: true,
      wordCountMin: 300,
      wordCountMax: 800,
      order: 5,
      category: 'team',
      prompts: [
        'Who is on your team?',
        'What experience do they have?',
        'How is your team structured?',
        'What key hires do you need?'
      ],
      validationRules: {
        requiredFields: ['team_members', 'experience_credentials', 'organizational_structure'],
        formatRequirements: ['team_bios', 'hiring_plan']
      }
    },
    {
      id: 'financial_projections',
      title: 'Financial Projections',
      description: 'Revenue projections and financial forecasts',
      required: true,
      wordCountMin: 400,
      wordCountMax: 1000,
      order: 6,
      category: 'financial',
      prompts: [
        'What are your revenue projections?',
        'What are your key assumptions?',
        'When will you break even?',
        'What is your exit strategy?'
      ],
      validationRules: {
        requiredFields: ['revenue_forecasts', 'assumptions', 'break_even_analysis'],
        formatRequirements: ['financial_model', 'scenario_analysis']
      }
    }
  ],

  visa: [
    {
      id: 'executive_summary',
      title: 'Executive Summary',
      description: 'Brief overview of your business and visa application',
      required: true,
      wordCountMin: 200,
      wordCountMax: 500,
      order: 1,
      category: 'general',
      prompts: [
        'What is your business idea?',
        'How will it benefit Austria?',
        'What jobs will you create?',
        'Why do you need to be in Austria?'
      ],
      validationRules: {
        requiredFields: ['business_concept', 'austrian_benefit', 'job_creation'],
        formatRequirements: ['clear_business_plan', 'immigration_justification']
      }
    },
    {
      id: 'innovation_focus',
      title: 'Innovation Focus',
      description: 'Details about your innovative business concept',
      required: true,
      wordCountMin: 400,
      wordCountMax: 1000,
      order: 2,
      category: 'technical',
      prompts: [
        'What makes your business innovative?',
        'What technology or approach do you use?',
        'How is it different from existing solutions?',
        'What research or development have you done?'
      ],
      validationRules: {
        requiredFields: ['innovation_description', 'technology_approach', 'differentiation'],
        formatRequirements: ['innovation_evidence', 'technical_details']
      }
    },
    {
      id: 'economic_benefit',
      title: 'Economic Benefit',
      description: 'How your business will benefit the Austrian economy',
      required: true,
      wordCountMin: 300,
      wordCountMax: 800,
      order: 3,
      category: 'impact',
      prompts: [
        'How will your business benefit Austria?',
        'What economic impact will you have?',
        'How will you contribute to innovation?',
        'What partnerships will you create?'
      ],
      validationRules: {
        requiredFields: ['economic_impact', 'innovation_contribution', 'partnership_plans'],
        formatRequirements: ['quantified_benefits', 'austrian_focus']
      }
    },
    {
      id: 'job_creation_plan',
      title: 'Job Creation Plan',
      description: 'Detailed plan for creating jobs in Austria',
      required: true,
      wordCountMin: 300,
      wordCountMax: 800,
      order: 4,
      category: 'impact',
      prompts: [
        'How many jobs will you create?',
        'What types of jobs will you create?',
        'When will you create these jobs?',
        'How will you find qualified employees?'
      ],
      validationRules: {
        requiredFields: ['job_numbers', 'job_types', 'timeline', 'hiring_strategy'],
        formatRequirements: ['job_descriptions', 'recruitment_plan']
      }
    },
    {
      id: 'austrian_market_analysis',
      title: 'Austrian Market Analysis',
      description: 'Analysis of the Austrian market for your business',
      required: true,
      wordCountMin: 300,
      wordCountMax: 800,
      order: 5,
      category: 'geographic',
      prompts: [
        'Why do you need to be in Austria?',
        'What is the Austrian market like?',
        'What opportunities exist in Austria?',
        'How will you access the Austrian market?'
      ],
      validationRules: {
        requiredFields: ['austrian_market_research', 'market_opportunities', 'access_strategy'],
        formatRequirements: ['market_data', 'local_insights']
      }
    },
    {
      id: 'qualifications_experience',
      title: 'Qualifications & Experience',
      description: 'Your qualifications and relevant experience',
      required: true,
      wordCountMin: 200,
      wordCountMax: 500,
      order: 6,
      category: 'team',
      prompts: [
        'What qualifications do you have?',
        'What relevant experience do you have?',
        'What achievements demonstrate your ability?',
        'Why are you qualified to run this business?'
      ],
      validationRules: {
        requiredFields: ['qualifications', 'relevant_experience', 'achievements'],
        formatRequirements: ['credential_verification', 'experience_evidence']
      }
    }
  ]
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get standard sections for a specific funding type
 */
export function getStandardSections(fundingType: string): StandardSection[] {
  const type = fundingType.toLowerCase();
  
  switch (type) {
    case 'grants':
    case 'grant':
      return STANDARD_SECTIONS.grants;
    case 'bankloans':
    case 'bank_loans':
    case 'loan':
      return STANDARD_SECTIONS.bankLoans;
    case 'equity':
    case 'investment':
      return STANDARD_SECTIONS.equity;
    case 'visa':
    case 'residency':
      return STANDARD_SECTIONS.visa;
    default:
      return STANDARD_SECTIONS.grants; // Default to grants
  }
}

/**
 * Get section by ID and funding type
 */
export function getSectionById(sectionId: string, fundingType: string): StandardSection | undefined {
  const sections = getStandardSections(fundingType);
  return sections.find(section => section.id === sectionId);
}

/**
 * Get sections that map to specific requirement categories
 */
export function getSectionsByCategory(category: string, fundingType: string): StandardSection[] {
  const sections = getStandardSections(fundingType);
  return sections.filter(section => section.category === category);
}
