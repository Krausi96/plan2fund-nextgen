// Business plan sections
import type { SectionTemplate } from '../../../types/types';

export const BUSINESS_PLAN_SECTIONS: SectionTemplate[] = [
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
    sectionIntro: `
We recommend writing the executive summary only after completing the full
business plan. It should concisely summarise the most important points from
all sections of the plan.
`,
    rawSubsections: [
      {
        id: "exec_summary_overview",
        title: "Overall Project Summary",
        rawText: `
Provide a concise summary of the project, including the business idea,
target market, solution approach, and expected impact.
`
      }
    ],
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
    origin: 'template',
    sectionIntro: `
This section describes the core product or service of the project, its current
development status, the value it creates for customers, and its differentiation
from competing solutions.
`,
    rawSubsections: [
      {
        id: "product_description_development",
        title: "Product / Service Description & Development Status",
        rawText: `
Describe your product or service offering in detail.

What is the current development stage?
Is there already a prototype or proof of concept?
Does the prototype still need to be developed, or have you already produced
a first small production series?
Are there already initial customers or pilot users?

Also describe how your product or service is designed to be future-proof
and which sustainable materials or processes are used.
`
      },
      {
        id: "customer_value",
        title: "Customer Value",
        rawText: `
Describe the value your product or service creates for customers.

Does it reduce workload?
Does it save time or costs?
Does it improve quality or efficiency?
Does it provide something entirely new?

Describe the product or service from the customer's perspective.
`
      }
    ]
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
    origin: 'template',
    sectionIntro: `
This section analyzes the market opportunity, target customers, competition,
and positioning strategy.
`,
    rawSubsections: [
      {
        id: "target_market_segmentation",
        title: "Target Market & Segmentation",
        rawText: `
Define your primary and secondary target markets.
What are the key demographics, psychographics, and behavioral characteristics?
What is the size of your addressable market?
`
      },
      {
        id: "competitive_analysis",
        title: "Competitive Analysis",
        rawText: `
Who are your direct and indirect competitors?
What are their strengths and weaknesses?
How do you differentiate from them?
What is your competitive advantage?
`
      }
    ]
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
    origin: 'template',
    sectionIntro: `
This section presents your financial projections, funding requirements,
and expected returns for investors.
`,
    rawSubsections: [
      {
        id: "revenue_model_projection",
        title: "Revenue Model & Projections",
        rawText: `
What is your revenue model?
What are your projected revenues for the next 3-5 years?
What are the key assumptions behind your projections?
`
      },
      {
        id: "funding_requirements_use",
        title: "Funding Requirements & Use of Funds",
        rawText: `
How much funding do you require?
How will you use the funds?
What are the key milestones the funding will achieve?
`
      }
    ]
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
    origin: 'template',
    sectionIntro: `
This section presents your team, their qualifications, and their ability
to execute the business plan.
`,
    rawSubsections: [
      {
        id: "team_structure_key_roles",
        title: "Team Structure & Key Roles",
        rawText: `
Who are the key members of your team?
What are their roles and responsibilities?
What is their background and experience?
`
      },
      {
        id: "advisors_partnerships",
        title: "Advisors & Strategic Partnerships",
        rawText: `
Who are your advisors and board members?
What strategic partnerships do you have?
How do these relationships strengthen your business?
`
      }
    ]
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
    origin: 'template',
    sectionIntro: `
This section identifies key risks to your business and outlines mitigation strategies.
`,
    rawSubsections: [
      {
        id: "market_regulatory_risks",
        title: "Market & Regulatory Risks",
        rawText: `
What are the key market risks?
What regulatory challenges do you face?
How will you mitigate these risks?
`
      },
      {
        id: "operational_financial_risks",
        title: "Operational & Financial Risks",
        rawText: `
What are the operational risks?
What are the financial risks?
What contingency plans do you have?
`
      }
    ]
  }
];