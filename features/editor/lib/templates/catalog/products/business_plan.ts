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
      },
      {
        id: "usp_strengths_weaknesses",
        title: "USP, Strengths & Weaknesses",
        rawText: `
Describe the unique selling point (USP) of your product/service. What are the strengths and weaknesses of your products and/or services compared to the competition? Why should customers buy from you? What sets you apart from the competition?
`
      },
      {
        id: "degree_of_innovation",
        title: "Degree of Innovation",
        rawText: `
If you offer an innovative product or service, please describe the degree of innovation. What type of innovation is it: technical, creative, social, procedural, or process innovation? How high is the degree of innovation compared to the products/services offered on the market in Austria or worldwide?
`
      },
      {
        id: "trademark_patent_strategy",
        title: "Trademark Protection and Patents",
        rawText: `
In many industries, trademark protection and patents are of central importance. Does this also apply to your company? If so, you should explain your planned intellectual property strategy here and state the current status of its implementation (e.g., patents, utility models, or trademark rights filed or granted?).
`
      },
      {
        id: "service_provision",
        title: "Service Provision",
        rawText: `
What work do you carry out yourself? What work is carried out by partners? Describe the service provision processes.
`
      }
    ]
  },
  {
    id: 'company_management',
    title: 'Company & Management',
    description: 'Details about company structure, management team, and governance.',
    required: true,
    wordCountMin: 400,
    wordCountMax: 900,
    order: 3,
    category: 'team',
    origin: 'template',
    sectionIntro: `
This section covers company structure, management team, and governance aspects.
`,
    rawSubsections: [
      {
        id: "management_team",
        title: "Management and (founding) team",
        rawText: `
Who are the members of the founding team and what previous experience do they have? What roles do they play in the company? Is there any expertise that you do not have within the team? If so, how will you fill this gap? By outsourcing? By hiring additional staff or bringing in additional partners? Also show how the management team integrates sustainability into the company's management and what training and measures are being implemented to promote sustainable practices.
`
      },
      {
        id: "company_information",
        title: "Information about the company",
        rawText: `
What is the company name and, if applicable, the date the company was founded? What legal form are you planning? Company headquarters: Where do you plan to locate the company and what advantages or challenges does this present? What are the planned ownership structures (who holds what shares in the company)? Are there already relevant contracts (articles of association, etc.)? Are there external cooperation partners and what are the possible advantages and disadvantages in this regard? Status of company formation: What essential steps have already been taken to set up the company (trademark registration, entry in the commercial register, application for a business license, any advance commitments, etc.)?
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
    order: 4,
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
    order: 5,
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
    order: 6,
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