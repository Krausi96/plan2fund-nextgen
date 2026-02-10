// Business plan sections
import type { SectionTemplate } from '@/platform/core/types';

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
Generate a professional executive summary that synthesizes key information from all completed sections of the business plan only after all content is filled.
`,
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
Summarize this section and its subsections professionally.
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
Summarize this section and its subsections professionally.
`,
    rawSubsections: [
      {
        id: "management_team",
        title: "Management and (Founding) Team",
        rawText: `
Who are the members of the founding team and what previous experience do they have? What roles do they play in the company? Is there any expertise that you do not have within the team? If so, how will you fill this gap? By outsourcing? By hiring additional staff or bringing in additional partners? Also show how the management team integrates sustainability into the company's management and what training and measures are being implemented to promote sustainable practices.
`
      },
      {
        id: "company_information",
        title: "company Information",
        rawText: `
What is the company name and, if applicable, the date the company was founded? What legal form are you planning? Company headquarters: Where do you plan to locate the company and what advantages or challenges does this present? What are the planned ownership structures (who holds what shares in the company)? Are there already relevant contracts (articles of association, etc.)? Are there external cooperation partners and what are the possible advantages and disadvantages in this regard? Status of company formation: What essential steps have already been taken to set up the company (trademark registration, entry in the commercial register, application for a business license, any advance commitments, etc.)?
`
      },
      {
        id: "organizational_structure",
        title: "Organizational structure",
        rawText: `
Use an organizational chart to illustrate the (planned) organizational structure, including any outsourced areas of activity (e.g., accounting). If positions have already been filled, this should be clearly indicated.
`
      },
      {
        id: "swot_analysis",
        title: "Company analysis/SWOT analysis",
        rawText: `
What are your company's core tasks? What business model do you have in mind? SWOT analysis: Identify strengths and weaknesses in relation to your competitors. Compare these strengths and weaknesses with current trends to identify opportunities and risks for your business model and derive measures if necessary.
`
      },
      {
        id: "goals",
        title: "Goals",
        rawText: `
Set goals (short-, medium-, and long-term) against which you can measure your progress. The goals you set should be SMART (specific, measurable, realistic, relevant, and time-bound). Useful model: Balanced Scorecard.
`
      },
      {
        id: "implementation_planning",
        title: "Implementation planning",
        rawText: `
What individual steps have you planned for the successful establishment of your company over the next few years (personnel, location, etc.)? What milestones have you set? By what dates do you want to have your planning measures implemented (product completion, financing finalized, business license obtained, etc.)? Which tasks and milestones are directly dependent on each other? What is the critical path during the implementation or start-up phase? What milestones have you planned for the post-start-up phase?
`
      },
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
    id: 'industry_market_competition',
    title: 'Industry, market, and competition',
    description: 'Analysis of the industry, market potential, and competitive landscape.',
    required: true,
    wordCountMin: 400,
    wordCountMax: 900,
    order: 4,
    category: 'market',
    origin: 'template',
    sectionIntro: `
Summarize this section and its subsections professionally.
`,
    rawSubsections: [
      {
        id: "industry_analysis",
        title: "Industry",
        rawText: `
Describe the industry in which you want to operate: the size of the industry (number of companies), the structure of the industry (company size, fragmented structures or a few market leaders), special features and rules (e.g., opening hours, free services, down payments, regular customer discounts, trends in prices, demand). Useful model: Industry structure analysis according to Porter (Five Forces). Also analyze the importance of sustainability in your industry and how you can differentiate yourself from your competitors through sustainable practices.
`
      },
      {
        id: "market_sales_potential",
        title: "Market & Sales Potential",
        rawText: `
Unlike the industry, the market does not refer to the sum of suppliers, but rather to the sum of consumers. Important parameters are volume, price, sales, and growth. Based on the market figures, you can derive your company's sales potential. Try to write down plausible estimates for the future and set your sales target for the initial phase lower, as market penetration will take place gradually.
`
      },
      {
        id: "target_groups",
        title: "Target groups",
        rawText: `
Which target group are you addressing with your offering? What characteristics and purchase-deciding factors such as age group, interests, preferences, values, behavior, etc. does your target group have? Is your offering aimed at private customers (B2C) or companies (B2B)?
`
      },
      {
        id: "trends",
        title: "Trends",
        rawText: `
Describe current trends. Technology-driven changes and trends in customer behavior are particularly interesting. How do you take these trends into account and even use them for your product/service?
`
      },
      {
        id: "competitor_analysis",
        title: "Competitor analysis",
        rawText: `
Compare your product/service with the offerings of your main competitors. Use the competition analysis overview table on our website (under Downloads). A comprehensive competition analysis will help you identify your strengths and weaknesses in comparison to other companies and optimize your offering.
`
      },
      {
        id: "market_entry_barriers_dependencies",
        title: "Market entry barriers & dependencies",
        rawText: `
Are there any legal, economic, regional, or other market entry barriers, and how do you intend to deal with them? Are there any dependencies on suppliers, customers, or competitors, e.g., that only one production company can manufacture your product?
`
      },
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
  },
  {
    id: 'marketing_sales',
    title: 'Marketing & Sales',
    description: 'Strategies for marketing, sales, pricing, and customer service.',
    required: true,
    wordCountMin: 400,
    wordCountMax: 900,
    order: 5,
    category: 'market',
    origin: 'template',
    sectionIntro: `
Summarize this section and its subsections professionally.
`,
    rawSubsections: [
      {
        id: "marketing_strategy_channels",
        title: "Marketing Strategy & Communication Channels",
        rawText: `
Present your marketing strategy and the marketing measures derived from it (including your market entry strategy). Which communication channels and advertising media do you intend to use? Also explain how sustainability is integrated into your marketing and sales strategies and how you communicate your sustainability initiatives.
`
      },
      {
        id: "sales_strategy_channels",
        title: "Sales Strategy & Sales Channels",
        rawText: `
Present your sales strategy and the sales measures derived from it. How do you intend to sell your product/service (online shop, retail store, via third parties, etc.)?
`
      },
      {
        id: "pricing",
        title: "Pricing",
        rawText: `
What retail price do you want/can you achieve? On the one hand, the sales price must cover costs and, on the other hand, it must be marketable. It is easier to charge a higher price for innovative products/services, while for traditional products/services, you tend to have to orient yourself towards prevailing prices, unless you can plausibly argue why a higher price is justified in your case (e.g., due to higher quality).
`
      },
      {
        id: "payment_terms_customer_service",
        title: "Payment terms & customer service",
        rawText: `
What payment terms do you set (payment deadlines, discounts, reminder fees, etc.)? How do you handle service and complaint requests from your customers?
`
      }
    ]
  },
  {
    id: 'performance_financial_planning',
    title: 'Financial Planning',
    description: 'Financial planning including investment, cost, revenue, and capital requirements.',
    required: true,
    wordCountMin: 400,
    wordCountMax: 900,
    order: 6,
    category: 'financial',
    origin: 'template',
    sectionIntro: `
Summarize this section and its subsections professionally.
`,
    rawSubsections: [
      {
        id: "founding_investment_costs",
        title: "Founding costs & Investment costs",
        rawText: `
In addition to founding costs such as legal and tax fees, investments are required to get your business up and running. What investments are necessary to generate initial revenue? Are there alternatives such as leasing or shared use? Will you need to make further investments in the medium term (within the next 3-5 financial years)? Also describe how sustainable investments and technologies enable long-term cost savings and efficiency gains. Take ecological and social risks into account in your financial planning.
`
      },
      {
        id: "cost_planning",
        title: "Cost planning",
        rawText: `
What production costs or cost of goods sold do you expect? What other running costs do you anticipate? What staffing requirements and personnel costs do you expect? How much is your entrepreneur's salary? (Costs within the next 3-5 fiscal years.) Also take into account social security contributions and taxes payable to the tax office.
`
      },
      {
        id: "sales_revenue_planning",
        title: "Sales/revenue planning",
        rawText: `
You can plan your sales/revenue based on the sales potential you determined in Chapter 3.2. Market and sales potential. The planning must be realistic and comprehensible.
`
      },
      {
        id: "profit_loss_balance_sheet",
        title: "Profit and loss statement & balance sheet",
        rawText: `
Compare revenue with costs.
`
      },
      {
        id: "capital_requirements_sources",
        title: "Capital requirements and sources of financing",
        rawText: `
How high is your total capital requirement based on the calculations carried out above? What sources of financing can you use to cover the financing requirement?
`
      },
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
  }  
];