import type { DocumentTemplate, SectionTemplate } from './types/types';

// ============================================================================
// STRATEGY DOCUMENTS
// ============================================================================

const STRATEGY_DOCUMENTS: DocumentTemplate[] = [
  {
    id: 'business_model_value_proposition',
    name: 'Business Model & Value Proposition',
    description: 'Outline how your business will generate revenue, pricing strategy, and value delivered to customers.',
    required: true,
    format: 'docx',
    maxSize: '5MB',
    category: 'business',
    fundingTypes: ['grants', 'bankLoans', 'equity', 'visa']
  },
  {
    id: 'competitive_landscape',
    name: 'Competitive Landscape',
    description: 'Identify key competitors and differentiate your offering.',
    required: true,
    format: 'docx',
    maxSize: '5MB',
    category: 'market',
    fundingTypes: ['grants', 'bankLoans', 'equity', 'visa']
  },
  {
    id: 'preliminary_financial_overview',
    name: 'Preliminary Financial Overview',
    description: 'Provide high-level financial assumptions including costs, revenue potential, and funding needed.',
    required: true,
    format: 'xlsx',
    maxSize: '10MB',
    category: 'financial',
    fundingTypes: ['grants', 'bankLoans', 'equity', 'visa']
  }
];

// ============================================================================
// FULL SECTIONS
// ============================================================================

const FULL_SECTIONS: SectionTemplate[] = [
  {
    id: 'executive_summary',
    title: 'Executive Summary',
    description: 'Provide a concise overview of the project and funding request.',
    required: true,
    wordCountMin: 200,
    wordCountMax: 500,
    order: 1,
    category: 'general',
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
    category: 'project'
  },
  {
    id: 'market_analysis',
    title: 'Market Analysis',
    description: 'Analyse the market context for your project.',
    required: true,
    wordCountMin: 300,
    wordCountMax: 700,
    order: 6,
    category: 'market'
  },
  {
    id: 'financial_plan',
    title: 'Financial Plan',
    description: 'Provide a detailed budget and financing plan.',
    required: true,
    wordCountMin: 300,
    wordCountMax: 800,
    order: 5,
    category: 'financial'
  },
  {
    id: 'team_qualifications',
    title: 'Team & Qualifications',
    description: 'Present the project team, their roles and qualifications.',
    required: true,
    wordCountMin: 200,
    wordCountMax: 600,
    order: 7,
    category: 'team'
  },
  {
    id: 'risk_assessment',
    title: 'Risk Assessment',
    description: 'Identify potential risks and describe mitigation strategies.',
    required: true,
    wordCountMin: 200,
    wordCountMax: 600,
    order: 8,
    category: 'risk'
  }
];

// ============================================================================
// MASTER TEMPLATES
// ============================================================================

export const MASTER_DOCUMENTS: Record<string, Record<string, DocumentTemplate[]>> = {
  grants: {
    submission: [],
    strategy: STRATEGY_DOCUMENTS,
    review: []
  },
  bankLoans: {
    submission: [],
    strategy: STRATEGY_DOCUMENTS,
    review: []
  },
  equity: {
    submission: [],
    strategy: STRATEGY_DOCUMENTS,
    review: []
  },
  visa: {
    submission: [],
    strategy: STRATEGY_DOCUMENTS,
    review: []
  }
};

export const MASTER_SECTIONS: Record<string, SectionTemplate[]> = {
  strategy: [], // Strategy uses documents instead
  review: FULL_SECTIONS,
  submission: FULL_SECTIONS
};
