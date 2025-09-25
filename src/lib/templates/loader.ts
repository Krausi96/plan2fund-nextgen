/**
 * Template Loader
 * Loads and manages all business plan templates
 */

import { ChapterTemplate } from './chapters';

export interface BusinessPlanTemplate {
  id: string;
  name: string;
  type: 'grant' | 'loan' | 'equity' | 'visa' | 'custom';
  description: string;
  target_audience: string;
  estimated_time: string;
  difficulty: 'beginner' | 'intermediate' | 'expert';
  sections: TemplateSection[];
  requirements: string[];
  tips: string[];
  common_mistakes: string[];
}

export interface TemplateSection {
  id: string;
  title: string;
  description: string;
  required: boolean;
  estimated_words: number;
  guidance: string;
  template: string;
}

// Import template data
// import grantTemplate from '../../data/templates/grant.json';
// import loanTemplate from '../../data/templates/loan.json';
// import investorTemplate from '../../data/templates/investor.json';
// import visaTemplate from '../../data/templates/visa.json';
// import bankTemplate from '../../data/templates/bank.json';

export const BUSINESS_PLAN_TEMPLATES: BusinessPlanTemplate[] = [
  // grantTemplate as BusinessPlanTemplate,
  // loanTemplate as BusinessPlanTemplate,
  // investorTemplate as BusinessPlanTemplate,
  // visaTemplate as BusinessPlanTemplate,
  // bankTemplate as BusinessPlanTemplate
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): BusinessPlanTemplate | null {
  return BUSINESS_PLAN_TEMPLATES.find(template => template.id === id) || null;
}

/**
 * Get templates by type
 */
export function getTemplatesByType(type: string): BusinessPlanTemplate[] {
  return BUSINESS_PLAN_TEMPLATES.filter(template => template.type === type);
}

/**
 * Get all available template types
 */
export function getTemplateTypes(): string[] {
  return [...new Set(BUSINESS_PLAN_TEMPLATES.map(template => template.type))];
}

/**
 * Convert template to chapter format
 */
export function templateToChapters(template: BusinessPlanTemplate): ChapterTemplate[] {
  return template.sections.map(section => ({
    id: section.id,
    title: section.title,
    hint: section.description,
    placeholder: section.template.split('\n')[0] || `Write your ${section.title.toLowerCase()}...`,
    quality: getQualityIndicators(section.id),
    subchapters: getSubchapters(section.id)
  }));
}

/**
 * Get quality indicators for a section
 */
function getQualityIndicators(sectionId: string): string[] {
  const qualityMap: { [key: string]: string[] } = {
    'executive_summary': ['Clear ask', 'Target customer', 'Why now', 'Traction', 'Use of funds'],
    'problem_solution': ['Problem validation', 'Unique solution', 'Customer evidence', 'Market fit'],
    'market_analysis': ['Market size', 'Growth trends', 'Competitive analysis', 'Customer segments'],
    'business_model': ['Revenue streams', 'Pricing strategy', 'Unit economics', 'Scalability'],
    'financial_projections': ['Realistic assumptions', 'Growth projections', 'Break-even analysis', 'Cash flow'],
    'team': ['Relevant experience', 'Complementary skills', 'Track record', 'Advisory board'],
    'implementation_plan': ['Clear milestones', 'Resource requirements', 'Risk mitigation', 'Timeline'],
    'funding_ask': ['Specific amount', 'Use of funds', 'Valuation', 'Exit strategy'],
    'traction_metrics': ['Growth metrics', 'Customer acquisition', 'Revenue trends', 'Key milestones'],
    'repayment_plan': ['Debt service coverage', 'Cash flow analysis', 'Collateral', 'Risk mitigation'],
    'collateral_security': ['Adequate collateral', 'Security measures', 'Risk assessment', 'Legal documentation'],
    'economic_impact': ['Job creation', 'Economic investment', 'Innovation', 'Community impact']
  };

  return qualityMap[sectionId] || ['Quality content', 'Clear structure', 'Relevant details', 'Professional tone'];
}

/**
 * Get subchapters for a section
 */
function getSubchapters(sectionId: string): { id: string; title: string; completed: boolean }[] {
  const subchapterMap: { [key: string]: { id: string; title: string; completed: boolean }[] } = {
    'executive_summary': [
      { id: 'company-overview', title: 'Company Overview', completed: false },
      { id: 'market-opportunity', title: 'Market Opportunity', completed: false },
      { id: 'financial-highlights', title: 'Financial Highlights', completed: false },
      { id: 'team-credentials', title: 'Team Credentials', completed: false },
      { id: 'funding-ask', title: 'Funding Ask', completed: false }
    ],
    'problem_solution': [
      { id: 'problem-statement', title: 'Problem Statement', completed: false },
      { id: 'solution-overview', title: 'Solution Overview', completed: false },
      { id: 'value-proposition', title: 'Value Proposition', completed: false },
      { id: 'competitive-advantage', title: 'Competitive Advantage', completed: false }
    ],
    'market_analysis': [
      { id: 'target-market', title: 'Target Market', completed: false },
      { id: 'market-size', title: 'Market Size', completed: false },
      { id: 'competitive-landscape', title: 'Competitive Landscape', completed: false },
      { id: 'market-trends', title: 'Market Trends', completed: false }
    ],
    'financial_projections': [
      { id: 'revenue-projections', title: 'Revenue Projections', completed: false },
      { id: 'expense-breakdown', title: 'Expense Breakdown', completed: false },
      { id: 'cash-flow', title: 'Cash Flow Analysis', completed: false },
      { id: 'key-assumptions', title: 'Key Assumptions', completed: false }
    ],
    'team': [
      { id: 'founding-team', title: 'Founding Team', completed: false },
      { id: 'advisory-board', title: 'Advisory Board', completed: false },
      { id: 'hiring-plan', title: 'Hiring Plan', completed: false },
      { id: 'organizational-structure', title: 'Organizational Structure', completed: false }
    ]
  };

  return subchapterMap[sectionId] || [];
}

/**
 * Get template recommendations based on user answers
 */
export function getTemplateRecommendations(userAnswers: Record<string, any>): BusinessPlanTemplate[] {
  const recommendations: BusinessPlanTemplate[] = [];
  
  // Analyze user answers to recommend templates
  const fundingType = userAnswers.funding_type || userAnswers.plan_type;
  // const _businessStage = userAnswers.business_stage;
  const fundingAmount = userAnswers.funding_amount;
  
  // Grant recommendations
  if (fundingType === 'grant' || userAnswers.innovation_focus) {
    recommendations.push(getTemplateById('grant')!);
  }
  
  // Loan recommendations
  if (fundingType === 'loan' || userAnswers.debt_financing) {
    recommendations.push(getTemplateById('bank')!);
    recommendations.push(getTemplateById('loan')!);
  }
  
  // Equity recommendations
  if (fundingType === 'equity' || userAnswers.equity_financing || (fundingAmount && fundingAmount > 500000)) {
    recommendations.push(getTemplateById('investor')!);
  }
  
  // Visa recommendations
  if (userAnswers.visa_application || userAnswers.immigration) {
    recommendations.push(getTemplateById('visa')!);
  }
  
  // Default recommendations
  if (recommendations.length === 0) {
    recommendations.push(getTemplateById('grant')!);
    recommendations.push(getTemplateById('bank')!);
  }
  
  return recommendations;
}

/**
 * Get template difficulty level
 */
export function getTemplateDifficulty(template: BusinessPlanTemplate): {
  level: 'beginner' | 'intermediate' | 'expert';
  description: string;
  estimatedTime: string;
} {
  const difficultyMap = {
    'beginner': {
      description: 'Suitable for first-time business plan writers',
      estimatedTime: '1-2 hours'
    },
    'intermediate': {
      description: 'Requires some business planning experience',
      estimatedTime: '2-3 hours'
    },
    'expert': {
      description: 'For experienced entrepreneurs and complex applications',
      estimatedTime: '3-4 hours'
    }
  };
  
  return {
    level: template.difficulty,
    description: difficultyMap[template.difficulty].description,
    estimatedTime: template.estimated_time
  };
}

/**
 * Validate template completeness
 */
export function validateTemplateCompleteness(template: BusinessPlanTemplate, content: Record<string, string>): {
  isComplete: boolean;
  completionPercentage: number;
  missingSections: string[];
  completedSections: string[];
} {
  const requiredSections = template.sections.filter(section => section.required);
  const completedSections: string[] = [];
  const missingSections: string[] = [];
  
  requiredSections.forEach(section => {
    const contentExists = content[section.id] && content[section.id].trim().length > 0;
    if (contentExists) {
      completedSections.push(section.title);
    } else {
      missingSections.push(section.title);
    }
  });
  
  const completionPercentage = Math.round((completedSections.length / requiredSections.length) * 100);
  const isComplete = missingSections.length === 0;
  
  return {
    isComplete,
    completionPercentage,
    missingSections,
    completedSections
  };
}
