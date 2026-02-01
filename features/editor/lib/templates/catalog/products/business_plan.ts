// Split custom plan sections here
import type { SectionTemplate } from '../../../types/types';

export const BUSINESS_PLAN_SECTIONS: SectionTemplate[] = [
  {
    id: 'executive_summary',
    title: 'Executive Summary',
    description: 'Provide a concise overview of the business plan and funding request.',
    required: true,
    wordCountMin: 200,
    wordCountMax: 500,
    order: 1,
    category: 'general',
    origin: 'template',
    prompts: [
      'Summarise your project in two to three sentences.',
      'Which problem or need does your project address?',
      'What makes your approach innovative?',
      'Briefly state the expected impact.'
    ],
    validationRules: {
      requiredFields: ['project_overview', 'innovation_aspect', 'expected_impact'],
      formatRequirements: ['clear_problem_statement', 'solution_description']
    }
  },
  {
    id: 'project_description',
    title: 'Project Description',
    description: 'Detail the objectives, scope and methodology of the project.',
    required: true,
    wordCountMin: 400,
    wordCountMax: 900,
    order: 2,
    category: 'project',
    origin: 'template'
  },
  {
    id: 'market_analysis',
    title: 'Market Analysis',
    description: 'Analyse the market context for your project.',
    required: true,
    wordCountMin: 300,
    wordCountMax: 700,
    order: 6,
    category: 'market',
    origin: 'template'
  },
  {
    id: 'financial_plan',
    title: 'Financial Plan',
    description: 'Provide a detailed budget and financing plan.',
    required: true,
    wordCountMin: 300,
    wordCountMax: 800,
    order: 5,
    category: 'financial',
    origin: 'template'
  },
  {
    id: 'team_qualifications',
    title: 'Team & Qualifications',
    description: 'Present the project team, their roles and qualifications.',
    required: true,
    wordCountMin: 200,
    wordCountMax: 600,
    order: 7,
    category: 'team',
    origin: 'template'
  },
  {
    id: 'risk_assessment',
    title: 'Risk Assessment',
    description: 'Identify potential risks and describe mitigation strategies.',
    required: true,
    wordCountMin: 200,
    wordCountMax: 600,
    order: 8,
    category: 'risk',
    origin: 'template'
  }
];