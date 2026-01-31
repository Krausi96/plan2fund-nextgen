import type { DocumentTemplate, SectionTemplate } from './types/types';

// Master template sections that are shared across all products
const SHARED_SPECIAL_SECTIONS: SectionTemplate[] = [
  {
    id: 'metadata',
    title: 'Title Page',
    description: 'Document title page with company information',
    required: true,
    category: 'general',
    origin: 'template',
    icon: '📕'
  },
  {
    id: 'ancillary',
    title: 'Table of Contents',
    description: 'Automatically generated table of contents',
    required: true,
    category: 'general',
    origin: 'template',
    icon: '📑'
  },
  {
    id: 'references',
    title: 'References',
    description: 'List of references and citations',
    required: false,
    category: 'general',
    origin: 'template',
    icon: '📚'
  },
  {
    id: 'tables_data',
    title: 'Tables/Data',
    description: 'Collection of tables, charts, and data visualizations',
    required: false,
    category: 'general',
    origin: 'template',
    icon: '📊'
  },
  {
    id: 'figures_images',
    title: 'Figures/Images',
    description: 'Collection of figures, images, and illustrations',
    required: false,
    category: 'general',
    origin: 'template',
    icon: '🖼️'
  },
  {
    id: 'appendices',
    title: 'Appendices',
    description: 'Additional supporting materials and documentation',
    required: false,
    category: 'general',
    origin: 'template',
    icon: '📎'
  }
];

// ============================================================================
// STRATEGY DOCUMENTS
// ============================================================================

// ============================================================================
// STRATEGY SECTIONS
// ====================================================================

const STRATEGY_SECTIONS: SectionTemplate[] = [
  {
    id: 'business_model_canvas',
    title: 'Business Model Canvas',
    description: 'Outline your business model using the 9-block canvas framework.',
    required: true,
    wordCountMin: 300,
    wordCountMax: 600,
    order: 1,
    category: 'project',
    origin: 'template',
    prompts: [
      'Describe your value proposition and customer segments',
      'Explain your revenue streams and cost structure',
      'Define your key activities and resources'
    ]
  },
  {
    id: 'go_to_market_strategy',
    title: 'Go-To-Market Strategy',
    description: 'Detail your market entry approach and customer acquisition plan.',
    required: true,
    wordCountMin: 250,
    wordCountMax: 500,
    order: 2,
    category: 'market',
    origin: 'template',
    prompts: [
      'Identify your target market and customer personas',
      'Outline your pricing strategy and distribution channels',
      'Describe your promotional and sales tactics'
    ]
  },
  {
    id: 'unit_economics',
    title: 'Unit Economics',
    description: 'Calculate and explain your unit-level financial metrics.',
    required: true,
    wordCountMin: 200,
    wordCountMax: 400,
    order: 3,
    category: 'financial',
    origin: 'template',
    prompts: [
      'Calculate your price per unit and unit costs',
      'Determine contribution margin and break-even point',
      'Explain your path to profitability'
    ]
  },
  {
    id: 'milestones_next_steps',
    title: 'Milestones & Next Steps',
    description: 'Outline key milestones and immediate next steps for your venture.',
    required: true,
    wordCountMin: 150,
    wordCountMax: 300,
    order: 4,
    category: 'general',
    origin: 'template',
    prompts: [
      'List your short-term and medium-term milestones',
      'Identify key resources and partnerships needed',
      'Define success metrics and timeline'
    ]
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

// ============================================================================
// MASTER TEMPLATES
// ============================================================================

export const MASTER_SECTIONS: Record<string, SectionTemplate[]> = {
  strategy: [...STRATEGY_SECTIONS, ...SHARED_SPECIAL_SECTIONS], // Strategy now uses strategy-specific sections + shared special sections
  review: [...FULL_SECTIONS, ...SHARED_SPECIAL_SECTIONS], // Review now uses sections + shared special sections
  submission: [...FULL_SECTIONS, ...SHARED_SPECIAL_SECTIONS]
};

// Simplified document lookup by product type (all funding types share same docs per product)
export const MASTER_DOCUMENTS_BY_PRODUCT: Record<string, DocumentTemplate[]> = {
  strategy: [], // Strategy now uses sections, no documents
  review: [], // Review now uses sections, no documents
  submission: []
};
