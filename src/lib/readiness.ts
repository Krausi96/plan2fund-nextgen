/**
 * Readiness Validation System
 * Checks business plan compliance with program requirements
 */

import { dataSource } from './dataSource';

export interface ReadinessCheck {
  section: string;
  status: 'complete' | 'incomplete' | 'missing';
  score: number; // 0-100
  requirements: RequirementCheck[];
  suggestions: string[];
}

export interface RequirementCheck {
  id: string;
  description: string;
  status: 'met' | 'not_met' | 'partial';
  evidence?: string;
  importance: 'critical' | 'important' | 'optional';
}

export interface ProgramRequirements {
  id: string;
  name: string;
  type: 'grant' | 'loan' | 'equity' | 'visa';
  requirements: {
    [section: string]: {
      mandatory: string[];
      recommended: string[];
      optional: string[];
    };
  };
  eligibility: {
    [key: string]: any;
  };
  scoring: {
    [section: string]: {
      [requirement: string]: number;
    };
  };
}

export class ReadinessValidator {
  private programRequirements: ProgramRequirements;
  private planContent: Record<string, any>;

  constructor(programRequirements: ProgramRequirements, planContent: Record<string, any>) {
    this.programRequirements = programRequirements;
    this.planContent = planContent;
  }

  /**
   * Perform comprehensive readiness check
   */
  async performReadinessCheck(): Promise<ReadinessCheck[]> {
    const checks: ReadinessCheck[] = [];

    for (const [section, requirements] of Object.entries(this.programRequirements.requirements)) {
      const check = await this.checkSection(section, requirements);
      checks.push(check);
    }

    return checks;
  }

  /**
   * Check specific section against requirements
   */
  private async checkSection(section: string, requirements: any): Promise<ReadinessCheck> {
    const sectionContent = this.planContent[section] || '';
    const requirementChecks: RequirementCheck[] = [];
    let totalScore = 0;
    let maxScore = 0;

    // Check mandatory requirements
    for (const req of requirements.mandatory) {
      const check = this.checkRequirement(req, sectionContent, 'critical');
      requirementChecks.push(check);
      totalScore += check.status === 'met' ? 100 : 0;
      maxScore += 100;
    }

    // Check recommended requirements
    for (const req of requirements.recommended) {
      const check = this.checkRequirement(req, sectionContent, 'important');
      requirementChecks.push(check);
      totalScore += check.status === 'met' ? 80 : check.status === 'partial' ? 40 : 0;
      maxScore += 80;
    }

    // Check optional requirements
    for (const req of requirements.optional) {
      const check = this.checkRequirement(req, sectionContent, 'optional');
      requirementChecks.push(check);
      totalScore += check.status === 'met' ? 20 : check.status === 'partial' ? 10 : 0;
      maxScore += 20;
    }

    const overallScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const status = this.determineStatus(overallScore, requirementChecks);
    const suggestions = this.generateSuggestions(requirementChecks, section);

    return {
      section,
      status,
      score: overallScore,
      requirements: requirementChecks,
      suggestions
    };
  }

  /**
   * Check individual requirement
   */
  private checkRequirement(requirement: string, content: string, importance: 'critical' | 'important' | 'optional'): RequirementCheck {
    const patterns = this.getRequirementPatterns(requirement);
    let status: 'met' | 'not_met' | 'partial' = 'not_met';
    let evidence = '';

    for (const pattern of patterns) {
      const matches = content.match(new RegExp(pattern, 'gi'));
      if (matches && matches.length > 0) {
        status = matches.length >= 2 ? 'met' : 'partial';
        evidence = matches[0];
        break;
      }
    }

    return {
      id: requirement.toLowerCase().replace(/\s+/g, '_'),
      description: requirement,
      status,
      evidence,
      importance
    };
  }

  /**
   * Get regex patterns for requirement checking
   */
  private getRequirementPatterns(requirement: string): string[] {
    const patterns: { [key: string]: string[] } = {
      'business_name': ['business name', 'company name', 'organization name'],
      'funding_amount': ['€\\d+', '\\$\\d+', 'funding.*amount', 'request.*amount'],
      'target_market': ['target market', 'customer.*segment', 'market.*segment'],
      'revenue_model': ['revenue.*model', 'pricing.*strategy', 'monetization'],
      'team_size': ['team.*size', 'employees', 'staff.*count'],
      'timeline': ['timeline', 'schedule', 'milestone', 'deadline'],
      'financial_projections': ['financial.*projection', 'revenue.*forecast', 'profit.*loss'],
      'market_analysis': ['market.*analysis', 'competitive.*analysis', 'market.*size'],
      'risk_assessment': ['risk.*assessment', 'risk.*analysis', 'mitigation.*strategy'],
      'implementation_plan': ['implementation.*plan', 'execution.*plan', 'action.*plan'],
      'use_of_funds': ['use.*of.*funds', 'fund.*utilization', 'spending.*plan'],
      'competitive_advantage': ['competitive.*advantage', 'unique.*selling', 'differentiation'],
      'market_opportunity': ['market.*opportunity', 'market.*potential', 'growth.*potential'],
      'business_model': ['business.*model', 'value.*proposition', 'revenue.*stream'],
      'team_qualifications': ['team.*qualification', 'experience', 'expertise', 'credentials']
    };

    return patterns[requirement.toLowerCase()] || [requirement.toLowerCase()];
  }

  /**
   * Determine overall status
   */
  private determineStatus(score: number, requirements: RequirementCheck[]): 'complete' | 'incomplete' | 'missing' {
    const criticalRequirements = requirements.filter(r => r.importance === 'critical');
    const unmetCritical = criticalRequirements.filter(r => r.status === 'not_met');

    if (unmetCritical.length > 0) {
      return 'missing';
    } else if (score >= 80) {
      return 'complete';
    } else {
      return 'incomplete';
    }
  }

  /**
   * Generate improvement suggestions
   */
  private generateSuggestions(requirements: RequirementCheck[], section: string): string[] {
    const suggestions: string[] = [];
    const unmet = requirements.filter(r => r.status === 'not_met');
    const partial = requirements.filter(r => r.status === 'partial');

    if (unmet.length > 0) {
      suggestions.push(`Add missing ${section} requirements: ${unmet.map(r => r.description).join(', ')}`);
    }

    if (partial.length > 0) {
      suggestions.push(`Strengthen ${section} content: ${partial.map(r => r.description).join(', ')}`);
    }

    // Add section-specific suggestions
    const sectionSuggestions = this.getSectionSuggestions(section);
    suggestions.push(...sectionSuggestions);

    return suggestions;
  }

  /**
   * Get section-specific suggestions
   */
  private getSectionSuggestions(section: string): string[] {
    const suggestions: { [key: string]: string[] } = {
      'executive_summary': [
        'Include clear value proposition',
        'Add funding amount and timeline',
        'Highlight key achievements',
        'Mention target market size'
      ],
      'business_description': [
        'Detail unique selling points',
        'Explain business model clearly',
        'Include company background',
        'Describe products/services'
      ],
      'market_analysis': [
        'Add market size data (TAM/SAM/SOM)',
        'Include competitive analysis',
        'Provide customer personas',
        'Show market trends'
      ],
      'financial_projections': [
        'Provide detailed assumptions',
        'Include sensitivity analysis',
        'Add break-even analysis',
        'Show cash flow projections'
      ],
      'team': [
        'Highlight relevant experience',
        'Show team structure and roles',
        'Include advisory board',
        'Add hiring plan'
      ]
    };

    return suggestions[section] || [];
  }
}

/**
 * Predefined program requirements
 */
export const PROGRAM_REQUIREMENTS: { [key: string]: ProgramRequirements } = {
  'grant': {
    id: 'grant',
    name: 'Grant Program',
    type: 'grant',
    requirements: {
      'executive_summary': {
        mandatory: ['business_name', 'funding_amount', 'use_of_funds'],
        recommended: ['target_market', 'revenue_model', 'timeline'],
        optional: ['competitive_advantage', 'market_opportunity']
      },
      'business_description': {
        mandatory: ['business_model', 'target_market'],
        recommended: ['competitive_advantage', 'revenue_model'],
        optional: ['company_background', 'products_services']
      },
      'market_analysis': {
        mandatory: ['market_analysis'],
        recommended: ['target_market', 'competitive_analysis'],
        optional: ['market_trends', 'customer_personas']
      },
      'financial_projections': {
        mandatory: ['financial_projections', 'use_of_funds'],
        recommended: ['revenue_model', 'break_even_analysis'],
        optional: ['sensitivity_analysis', 'cash_flow']
      },
      'team': {
        mandatory: ['team_qualifications'],
        recommended: ['team_size', 'experience'],
        optional: ['advisory_board', 'hiring_plan']
      }
    },
    eligibility: {
      'company_age': 'max_5_years',
      'revenue': 'max_500k',
      'location': 'european_union'
    },
    scoring: {
      'executive_summary': {
        'business_name': 20,
        'funding_amount': 30,
        'use_of_funds': 30,
        'target_market': 20
      }
    }
  },
  'loan': {
    id: 'loan',
    name: 'Business Loan',
    type: 'loan',
    requirements: {
      'executive_summary': {
        mandatory: ['business_name', 'funding_amount', 'revenue_model'],
        recommended: ['target_market', 'financial_projections', 'timeline'],
        optional: ['competitive_advantage', 'market_opportunity']
      },
      'business_description': {
        mandatory: ['business_model', 'revenue_model'],
        recommended: ['target_market', 'competitive_advantage'],
        optional: ['company_background', 'products_services']
      },
      'financial_projections': {
        mandatory: ['financial_projections', 'revenue_model'],
        recommended: ['break_even_analysis', 'cash_flow'],
        optional: ['sensitivity_analysis', 'debt_service_coverage']
      },
      'team': {
        mandatory: ['team_qualifications'],
        recommended: ['team_size', 'experience'],
        optional: ['advisory_board', 'hiring_plan']
      }
    },
    eligibility: {
      'company_age': 'min_1_year',
      'revenue': 'min_100k',
      'credit_score': 'min_600'
    },
    scoring: {
      'executive_summary': {
        'business_name': 15,
        'funding_amount': 25,
        'revenue_model': 35,
        'financial_projections': 25
      }
    }
  },
  'equity': {
    id: 'equity',
    name: 'Equity Investment',
    type: 'equity',
    requirements: {
      'executive_summary': {
        mandatory: ['business_name', 'funding_amount', 'market_opportunity'],
        recommended: ['target_market', 'revenue_model', 'competitive_advantage'],
        optional: ['timeline', 'exit_strategy']
      },
      'business_description': {
        mandatory: ['business_model', 'market_opportunity'],
        recommended: ['competitive_advantage', 'revenue_model'],
        optional: ['company_background', 'products_services']
      },
      'market_analysis': {
        mandatory: ['market_analysis', 'market_opportunity'],
        recommended: ['target_market', 'competitive_analysis'],
        optional: ['market_trends', 'customer_personas']
      },
      'financial_projections': {
        mandatory: ['financial_projections', 'revenue_model'],
        recommended: ['break_even_analysis', 'growth_projections'],
        optional: ['sensitivity_analysis', 'exit_strategy']
      },
      'team': {
        mandatory: ['team_qualifications', 'experience'],
        recommended: ['team_size', 'advisory_board'],
        optional: ['hiring_plan', 'equity_structure']
      }
    },
    eligibility: {
      'company_age': 'max_10_years',
      'revenue': 'min_50k',
      'growth_potential': 'high'
    },
    scoring: {
      'executive_summary': {
        'business_name': 10,
        'funding_amount': 20,
        'market_opportunity': 40,
        'competitive_advantage': 30
      }
    }
  }
};

/**
 * Get program requirements by type
 */
export async function getProgramRequirements(type: string): Promise<ProgramRequirements | null> {
  // Try to get from enhanced data source first
  try {
    const programs = await dataSource.getProgramsByType(type);
    if (programs.length > 0) {
      // Convert program to requirements format
      const program = programs[0];
      return {
        id: program.id,
        name: program.name,
        type: program.type as any,
        requirements: program.requirements || {},
        eligibility: {},
        scoring: {}
      };
    }
  } catch (error) {
    console.log('Could not get requirements from data source, using fallback');
  }
  
  // Fallback to static requirements
  return PROGRAM_REQUIREMENTS[type] || null;
}

/**
 * Create readiness validator
 */
export async function createReadinessValidator(programType: string, planContent: Record<string, any>): Promise<ReadinessValidator | null> {
  const requirements = await getProgramRequirements(programType);
  if (!requirements) {
    return null;
  }
  return new ReadinessValidator(requirements, planContent);
}
