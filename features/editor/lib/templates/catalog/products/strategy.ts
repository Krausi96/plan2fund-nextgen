// Split custom business plan sections here
import type { SectionTemplate } from '../../../types/types';

export const STRATEGY_SECTIONS: SectionTemplate[] = [
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