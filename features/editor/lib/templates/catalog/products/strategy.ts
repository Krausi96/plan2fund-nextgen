// Strategy sections
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
    sectionIntro: `
The Business Model Canvas provides a strategic management template for developing
new business models or documenting existing ones.
`,
    rawSubsections: [
      {
        id: "value_proposition_customer_segments",
        title: "Value Proposition & Customer Segments",
        rawText: `
What value do you deliver to customers?
For whom do you create value?
Who are your most important customers?
`
      },
      {
        id: "channels_customer_relationships",
        title: "Channels & Customer Relationships",
        rawText: `
Through which channels do your customer segments want to be reached?
How are you reaching them?
What type of relationship does each segment expect?
`
      }
    ],
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
    sectionIntro: `
This section details your market entry approach and customer acquisition plan.
`,
    rawSubsections: [
      {
        id: "target_market_entry_approach",
        title: "Target Market & Entry Approach",
        rawText: `
Who are your target customers?
What is your market entry strategy?
How will you reach your first customers?
`
      },
      {
        id: "pricing_distribution_channels",
        title: "Pricing & Distribution Channels",
        rawText: `
What is your pricing strategy?
What distribution channels will you use?
How do these align with customer preferences?
`
      }
    ],
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
    sectionIntro: `
Unit economics describe the direct revenues and costs for each unit of what you sell.
Understanding unit economics is crucial for scaling efficiently.
`,
    rawSubsections: [
      {
        id: "revenue_costs_per_unit",
        title: "Revenue & Costs Per Unit",
        rawText: `
What is your price per unit?
What are your variable costs per unit?
What is your contribution margin?
`
      },
      {
        id: "break_even_path_profitability",
        title: "Break-Even Point & Path to Profitability",
        rawText: `
What is your break-even point?
What is your path to profitability?
How do unit economics scale with volume?
`
      }
    ],
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
    sectionIntro: `
This section outlines key milestones and immediate next steps for your venture.
`,
    rawSubsections: [
      {
        id: "short_medium_term_milestones",
        title: "Short-Term & Medium-Term Milestones",
        rawText: `
What are your short-term milestones (next 6 months)?
What are your medium-term milestones (next 1-2 years)?
How will you measure progress?
`
      },
      {
        id: "resources_partnerships_needed",
        title: "Resources & Partnerships Needed",
        rawText: `
What key resources do you need?
What strategic partnerships are required?
What is your timeline for achieving these?
`
      }
    ],
    prompts: [
      'List your short-term and medium-term milestones',
      'Identify key resources and partnerships needed',
      'Define success metrics and timeline'
    ]
  }
];