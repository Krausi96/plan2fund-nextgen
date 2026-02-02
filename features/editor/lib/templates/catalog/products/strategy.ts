// Strategy sections
import type { SectionTemplate } from '../../../types/types';

export const STRATEGY_SECTIONS: SectionTemplate[] = [
  {
    id: 'executive_summary',
    title: 'Executive Summary',
    description: 'Provide a concise overview of the strategy and key recommendations.',
    required: true,
    wordCountMin: 200,
    wordCountMax: 500,
    order: 1,
    category: 'general',
    origin: 'template',
    sectionIntro: `
Generate a professional executive summary that synthesizes key information from all completed sections of the strategy plan only after all content is filled.
`,
  },
  {
    id: 'business_model_canvas',
    title: 'Business Model Canvas',
    description: 'Outline your business model using the 9-block canvas framework.',
    required: true,
    wordCountMin: 300,
    wordCountMax: 600,
    order: 2,
    category: 'project',
    origin: 'template',
    sectionIntro: `
Summarize this section and its subsections professionally.
`,
    rawSubsections: [
      {
        id: "key_partners",
        title: "Key Partners",
        rawText: `
Key partners are the companies or people your business works with to create a strategic relationship. Describe the suppliers, alliances or distribution partners that provide essential resources or perform key activities. Consider what resources your company receives from partners, what activities they perform, and your motivation for working with each partner.
`
      },
      {
        id: "key_activities",
        title: "Key Activities",
        rawText: `
Key activities are the specific tasks that are fundamental to operating the business. List the activities necessary to deliver the value proposition, maintain distribution channels, build customer relationships and earn revenues. Identify what makes your activities unique, how they differ from competitors' activities and whether they need to be streamlined to keep costs and prices low.
`
      },
      {
        id: "key_resources",
        title: "Key Resources",
        rawText: `
Key resources are the assets required to operate and deliver the value proposition. These include physical assets, human capital, intellectual property and financial resources. Describe what resources your distribution channels and revenue streams need to function, what resources are needed to maintain customer relationships and whether significant capital or specialized human resources are required.
`
      },
      {
        id: "value_propositions",
        title: "Value Propositions",
        rawText: `
The value proposition defines the fundamental offering the company provides to customers. Explain what problem the company solves, what needs it satisfies and how it offers something different from competitors. Discuss the unique benefits that satisfy the demands of your customer segments—such as price, quality, design or status—and articulate the core message you want customers to understand.
`
      },
      {
        id: "customer_relationships",
        title: "Customer Relationships",
        rawText: `
Customer relationships describe the types of interactions the company has with customers. Detail whether you provide dedicated assistance, personal service, self‑service or automated support. Explain how interactions differ between customer segments, how frequently you communicate with customers and how much support is provided.
`
      },
      {
        id: "channels",
        title: "Channels",
        rawText: `
Channels are the structures and methods used to deliver the product and value proposition to customers. Describe your supply, distribution, marketing and communication channels and how they work together. Explain how you deliver your value proposition, how you reach customer segments and whether your channels are integrated, cost‑efficient and effective.
`
      },
      {
        id: "customer_segments",
        title: "Customer Segments",
        rawText: `
Customer segments are the different groups of customers the company serves. Identify who is the main focus of your value proposition, who your most important customers are, and what they need and enjoy. Describe the different types of customers, whether you are targeting a niche or mass market, and how customer segments influence your value proposition.
`
      },
      {
        id: "cost_structure",
        title: "Cost Structure",
        rawText: `
The cost structure refers to how the company spends money on operations. Discuss whether the business is cost‑driven or value‑driven and list key costs and cost drivers. Explain how key activities and resources contribute to costs, how costs relate to revenue streams, whether economies of scale are utilized and what portion of costs are fixed versus variable.
`
      },
      {
        id: "revenue_streams",
        title: "Revenue Streams",
        rawText: `
Revenue streams are the company's sources of cash flow. Identify the different ways your value proposition generates money, such as through multiple products or services. Discuss pricing strategies, the channels through which customers pay and whether the business offers multiple payment options like up‑front payments, payment plans or financing.
`
      }
    ]
  },
  {
    id: 'go_to_market_strategy',
    title: 'Go-To-Market Strategy',
    description: 'Detail your market entry approach and customer acquisition plan.',
    required: true,
    wordCountMin: 250,
    wordCountMax: 500,
    order: 3,
    category: 'market',
    origin: 'template',
    sectionIntro: `
Summarize this section and its subsections professionally.
`,
    rawSubsections: [
      {
        id: "mission_statement",
        title: "Mission Statement",
        rawText: `
Begin your go‑to‑market plan by writing a mission statement that sets the tone for the launch. Introduce the larger purpose behind your brand and product, include customer pain points and explain how the product will solve them. Connect the product to the broader brand identity and offerings.
`
      },
      {
        id: "situational_analysis",
        title: "Situational Analysis",
        rawText: `
Organise market research data into a structured situational analysis. Use frameworks such as SWOT, 5C analysis and competitive analysis to highlight insights from customer research and industry trends. Consider employing industry analysis templates to identify opportunities and threats associated with bringing the new product to market.
`
      },
      {
        id: "customer_pain_points_and_ideas",
        title: "Customer Pain Points and Ideation",
        rawText: `
List customer pain points and the category they fall under (for example, productivity or process). Brainstorm solutions to these pain points and use the insights to generate ideas that address each category. This helps ensure that the product concept directly addresses the most pressing problems customers face.
`
      },
      {
        id: "industry_analysis",
        title: "Industry Analysis",
        rawText: `
Assess competitors and industry trends to understand the market landscape. An industry analysis should evaluate the strengths and weaknesses of competitors, identify market opportunities and threats and reveal trends that could influence your strategy.
`
      },
      {
        id: "target_market_and_personas",
        title: "Target Market and Buyer Personas",
        rawText: `
Define your target market by developing detailed buyer personas using demographic, psychographic and behavioural data. Analyse how each persona relates to the brand, identify their specific pain points and develop personalised messages for each profile so that you reach customers with messaging that resonates.
`
      },
      {
        id: "product_concept",
        title: "Product Concept",
        rawText: `
Use the solutions brainstormed during the ideation stage to develop a product concept that addresses customer pain points. The product concept should be based on clear problem–solution fit and should align with the brand's identity.
`
      },
      {
        id: "swot_analysis",
        title: "SWOT Analysis",
        rawText: `
Perform a SWOT analysis of the potential product to identify strengths, weaknesses, opportunities and threats. The SWOT framework helps evaluate whether the product has a competitive advantage and reveals areas that need improvement.
`
      },
      {
        id: "pitch_and_buy_in",
        title: "Pitch and Stakeholder Buy‑in",
        rawText: `
List everyone who needs to be pitched in order to get buy‑in for the product, including internal stakeholders and potential investors or partners. Outline how you will present the product's value proposition and address stakeholders' concerns so that they are motivated to support the launch.
`
      },
      {
        id: "goals_and_kpis",
        title: "Goals and Key Performance Indicators",
        rawText: `
Set specific, measurable, achievable, relevant and time‑bound (SMART) goals for both marketing and sales. Establish key performance indicators (KPIs) to monitor progress toward these goals and ensure they align with overarching business objectives. For example, marketing goals might focus on impressions or marketing‑qualified leads (MQLs), while sales goals might centre on conversion and retention rates.
`
      },
      {
        id: "status_log_and_journey_map",
        title: "Status Log and Customer Journey Map",
        rawText: `
Maintain a status log to track key tasks, who is accountable for them and their deadlines. Map out everything about the ideal customer experience as they move through the sales funnel to ensure that the go‑to‑market plan addresses every stage of the customer journey.
`
      },
      {
        id: "marketing_and_sales_tactics",
        title: "Marketing and Sales Tactics",
        rawText: `
Convert marketing and sales strategies into actionable campaigns and processes. Break down the customer's buying cycle to determine the ideal marketing and sales touchpoints. Create a sales cycle and pipeline that aligns with the buyer's journey, highlight your unique selling proposition and define the marketing mix (4Ps) that supports pricing and distribution strategies. Provide specific campaign tactics for each channel and message.
`
      },
      {
        id: "performance_metrics",
        title: "Performance Metrics",
        rawText: `
Decide how to measure the success of the launch and determine key benchmarks. Choose metrics that align with your goals and define data collection methods and frequency. Examples include customer acquisition cost, time to close or product usage metrics, and market share. Revisit and adjust the plan based on customer feedback and performance results.
`
      },
      {
        id: "budget_and_resource_plan",
        title: "Budget and Resource Plan",
        rawText: `
Allocate resources appropriately and develop a timeline for accomplishing each component of the plan. Create a clear action plan with team member responsibilities and deadlines, breaking down the phases into pre‑launch, launch and post‑launch. Develop a budget that aligns with marketing and sales plans for each phase and ensure resources are directed toward the highest‑impact activities.
`
      },
      {
        id: "promotion_and_enablement",
        title: "Promotion and Enablement",
        rawText: `
Decide on the marketing and sales enablement tools needed to meet launch sales goals. Ensure that the chosen tools support your promotion strategy and enable your teams to reach target customers effectively. Integrate promotion and enablement with the wider execution plan so that messaging and tactics are consistent across channels.
`
      },
      {
        id: "timeline",
        title: "Timeline and Product Roadmap",
        rawText: `
Create a product roadmap with deadlines. Clearly outline the sequence of activities and ensure that dependencies are identified so that the launch stays on schedule. The timeline should serve as a central reference point for coordinating all teams involved in the go‑to‑market plan.
`
      }
    ]
  },
  {
    id: 'unit_economics',
    title: 'Unit Economics',
    description: 'Calculate and explain your unit-level financial metrics.',
    required: true,
    wordCountMin: 200,
    wordCountMax: 400,
order: 4,
    category: 'financial',
    origin: 'template',
    sectionIntro: `
Summarize this section and its subsections professionally.
`,
    rawSubsections: [
      {
        id: "customer_acquisition_cost",
        title: "Customer Acquisition Cost (CAC)",
        rawText: `
Customer acquisition cost represents the total cost of acquiring a new customer. It is calculated by dividing the total sales and marketing expenses by the number of new customers acquired in a given period. A clear understanding of CAC helps startups determine whether they are spending efficiently to obtain each new customer.
`
      },
      {
        id: "lifetime_value",
        title: "Lifetime Value (LTV)",
        rawText: `
Lifetime value estimates the total revenue a customer will generate over their entire relationship with the company. For SaaS businesses the formula is typically LTV = (Average Revenue Per Account × Gross Margin) / Churn Rate. Knowing LTV enables startups to gauge how much value a customer contributes and informs pricing and retention strategies.
`
      },
      {
        id: "cac_payback_period",
        title: "CAC Payback Period",
        rawText: `
The CAC payback period shows how long it takes to recover the cost of acquiring a customer. It is calculated as CAC Payback Period = CAC / (Monthly Revenue per Customer × Gross Margin). A shorter payback period allows the company to reinvest cash more quickly, signalling efficient growth.
`
      },
      {
        id: "ltv_cac_ratio",
        title: "LTV/CAC Ratio",
        rawText: `
The LTV/CAC ratio measures the relationship between the lifetime value of a customer and the cost to acquire them. It is calculated as LTV/CAC = Lifetime Value (LTV) / Customer Acquisition Cost (CAC). A higher ratio, with a common benchmark of 3:1 or higher, indicates healthy unit economics and suggests that the business can scale profitably.
`
      },
      {
        id: "using_metrics_together",
        title: "Using Unit Economics Metrics Together",
        rawText: `
Startups should regularly calculate, analyse and compare the four core unit economics metrics to gain a comprehensive understanding of their financial performance. Evaluating profitability requires comparing LTV to CAC to see if revenues per customer exceed acquisition costs. The CAC payback period indicates how quickly cash can be reinvested into growth, while the LTV/CAC ratio reflects scalability. Analysing these metrics identifies optimization opportunities and informs investment decisions.
`
      },
      {
        id: "improving_unit_economics",
        title: "Improving Unit Economics",
        rawText: `
To improve unit economics, startups can adopt strategies such as optimising customer acquisition (reducing CAC by improving marketing efficiency and targeting high‑value customers), increasing customer lifetime value through better retention and upselling, improving productivity to lower costs per unit, experimenting with pricing strategies to maximise revenue, and continuously monitoring and controlling costs without compromising quality.
`
      },
      {
        id: "income_statement",
        title: "Income Statement",
        rawText: `
The income statement, also known as a profit‑and‑loss statement, reports the business's net profit or loss over a specific period. It includes the cost of goods sold (COGS), operating expenses such as rent and utilities, revenue streams (for example, sales and subscription services) and the resulting total net profit or loss. This statement demonstrates how revenue minus expenses and taxes produces profit.
`
      },
      {
        id: "balance_sheet",
        title: "Balance Sheet",
        rawText: `
The balance sheet reports the business's financial standing at a specific point in time by listing assets, liabilities and shareholder equity. Assets may include available cash, inventory and property, while liabilities comprise amounts owed to suppliers, personnel, landlords and creditors. Shareholder equity measures the company's net worth and is calculated as Assets – Liabilities. The balance sheet is used with other financial statements to calculate financial ratios.
`
      },
      {
        id: "cash_flow_projection",
        title: "Cash Flow Projection",
        rawText: `
The cash flow projection shows how much cash a business has, where it is going, where future cash will come from and a schedule for each activity. It documents how much cash came in and went out of the business during a specific period and is critical for assessing liquidity and ensuring the business can meet its obligations.
`
      },
      {
        id: "personnel_plan",
        title: "Personnel Plan",
        rawText: `
A personnel plan evaluates the resources and staffing needed to meet business goals while maintaining healthy cash flow. It assesses existing positions, determines when to bring on additional team members and examines whether new hires should be full‑time, part‑time or contractual. The plan also outlines compensation and benefits and forecasts the cost of new hires against potential growth.
`
      },
      {
        id: "business_ratios",
        title: "Business Ratios",
        rawText: `
Business ratios provide specific insights into the company's financial health by using data from the income statement, balance sheet and cash flow statement. Key ratios include net profit margin, return on equity, accounts payable turnover, assets to sales, working capital and total debt to total assets. Ratios help evaluate performance and are often used when seeking funding from investors or lenders.
`
      },
      {
        id: "sales_forecast",
        title: "Sales Forecast",
        rawText: `
A sales forecast estimates how much the business will sell during a specific period. It needs to be consistent with the revenue figures in the income statement. The forecast should segment sales by product or service and can be organised according to how thoroughly the business wants to track different revenue streams.
`
      },
      {
        id: "income_projections",
        title: "Income Projections",
        rawText: `
Income projections use the sales forecast to estimate the revenue the business is on track to generate in a given period, usually a year. They are calculated by subtracting anticipated expenses from revenue. In some cases, income projections are incorporated directly into the profit‑and‑loss statement.
`
      },
      {
        id: "assets_and_liabilities",
        title: "Assets and Liabilities",
        rawText: `
Assets and liabilities appear on the balance sheet and are typically divided into current and long‑term categories. Current assets, such as cash, stocks and accounts receivable, can be converted into cash within a year. Long‑term assets, such as buildings, machinery and vehicles, are used over longer periods. Liabilities include current obligations like payroll and taxes payable and long‑term debts such as shareholder loans and bank debt.
`
      },
      {
        id: "break_even_analysis",
        title: "Break‑Even Analysis",
        rawText: `
A break‑even analysis determines how much a business must sell to cover its fixed and variable expenses. The break‑even point guides sales revenue and volume goals and requires calculating the contribution margin (sales revenue minus variable costs). Businesses use break‑even analyses to evaluate expenses and determine how much to mark up goods and services to turn a profit.
`
      },
      {
        id: "create_strategic_plan",
        title: "Create a Strategic Plan",
        rawText: `
Before examining numbers, develop a strategic plan that focuses on what the company wants to accomplish and the resources needed to achieve its goals. Consider whether the organisation needs to buy equipment or hire staff, how its goals will affect cash flow and what resources are required. Creating a list of existing expenses and assets is helpful and informs the remaining financial planning steps.
`
      },
      {
        id: "create_financial_projections",
        title: "Create Financial Projections",
        rawText: `
Financial projections should be based on anticipated expenses and sales forecasts. They estimate the costs needed to reach goals under various scenarios, such as best‑case, worst‑case and most likely. Accountants or financial professionals may review the plan with stakeholders and suggest how to expand it for external audiences, including investors and lenders.
`
      },
      {
        id: "plan_for_contingencies",
        title: "Plan for Contingencies",
        rawText: `
Use data from the cash flow statement and balance sheet to develop worst‑case scenario plans, such as when incoming cash declines or expenses spike unexpectedly. Contingency planning may include maintaining cash reserves, securing lines of credit for quick access to funds during slow periods, or developing plans to sell assets to break even.
`
      },
      {
        id: "monitor_and_compare_goals",
        title: "Monitor and Compare Goals",
        rawText: `
Regularly analyse actual results from the cash flow statement, income projections and relevant business ratios to determine how closely real‑world results adhere to projections. Frequent check‑ins help identify potential problems early and inform necessary course corrections. Businesses should update their financial plans as market conditions change and as new information becomes available.
`
      }
    ]
  },
  {
    id: 'milestones_next_steps',
    title: 'Milestones & Next Steps',
    description: 'Outline key milestones and immediate next steps for your venture.',
    required: true,
    wordCountMin: 150,
    wordCountMax: 300,
order: 5,
    category: 'general',
    origin: 'template',
    sectionIntro: `
Summarize this section and its subsections professionally.
`,
    rawSubsections: [
      {
        id: "scope_statement",
        title: "Scope Statement",
        rawText: `
The scope statement defines the boundaries of the project and should be SMART—specific, measurable, achievable, relevant and time‑bound. It spells out what is included in the project and helps prevent scope creep. Examples of good scope statements include building an 8‑foot fence between two properties or creating a construction safety app with defined features.
`
      },
      {
        id: "critical_success_factors",
        title: "Critical Success Factors",
        rawText: `
Identify the criteria that will define success for the project. Beyond time and cost, critical success factors may include quality standards, end‑user benefits, minimal change orders, low rejection rates and employee satisfaction. Examples include completing the project by a certain date, ensuring the app accomplishes required tasks with minimal clicks or developing new skills that benefit the organisation.
`
      },
      {
        id: "deliverables",
        title: "Deliverables",
        rawText: `
Deliverables are the products, services or results that the project is commissioned to produce. They should be spelled out in detail within the project plan, including size, quality and other standards. Examples of deliverables might include an 8‑foot fence, a cell phone app or a training course.
`
      },
      {
        id: "work_breakdown_structure",
        title: "Work Breakdown Structure (WBS)",
        rawText: `
A work breakdown structure is a logical subdivision of the project into tasks and is the foundation of project management. Tasks can be listed with IDs, dependencies, start and end dates to provide a roadmap for implementation. The WBS can be simple or detailed depending on project size.
`
      },
      {
        id: "schedule",
        title: "Schedule",
        rawText: `
The schedule outlines the timeline for project activities. Since projects have defined beginnings and ends, the schedule is crucial for managing deadlines and dependencies. For small projects, the WBS can be expanded to include start and end dates; for larger projects, graphical schedules or specialised software may be used.
`
      },
      {
        id: "budget",
        title: "Budget",
        rawText: `
A clearly defined budget is required to manage costs effectively. Budgets can be incorporated into the WBS by adding a budget column for each task. Project managers should track the budget throughout the project and use methods such as earned value management if necessary.
`
      },
      {
        id: "quality_management",
        title: "Quality Management",
        rawText: `
Quality management addresses the standards that the project deliverables must meet. The project plan should identify applicable standards (for example, ASTM, IEEE or ISO‑9001) and outline strategies for meeting them (quality assurance) and measuring them (quality control). Quality results should be documented and any changes to standards or processes should be updated in the plan.
`
      },
      {
        id: "human_resources_plan",
        title: "Human Resources Plan",
        rawText: `
The human resources plan outlines resource requirements, project team acquisition, training and development and management activities. It should list the positions needed, describe how team members will be acquired, detail any necessary training and development, and specify management practices such as performance assessments and reassignment procedures.
`
      },
      {
        id: "stakeholder_list",
        title: "Stakeholder List",
        rawText: `
Develop a stakeholder list that identifies all individuals and organisations that have an interest in the project. The list should include the stakeholder's power and interest levels and should be consulted regularly. A proper stakeholder analysis helps manage relationships and ensures stakeholder needs are considered throughout the project.
`
      },
      {
        id: "communication_plan",
        title: "Communication Plan",
        rawText: `
Identify regular communication needs and include them in the project plan. This may involve progress reports, investor circulars and other formal communications that occur at specified frequencies. The project manager should also contact stakeholders promptly when issues arise and keep them informed throughout the project.
`
      },
      {
        id: "risk_register",
        title: "Risk Register",
        rawText: `
The risk register lists the most significant risks to the project. Each risk should include a description, probability, impact, priority (calculated by multiplying probability and impact), triggers that indicate when the risk has occurred and a response plan that outlines the actions to take and stakeholders to notify. A maximum of around 10–20 risks is usually sufficient for most projects.
`
      },
      {
        id: "procurement_plan",
        title: "Procurement Plan",
        rawText: `
The procurement plan identifies what outside products and services are needed, how they will be procured and how their progress and quality will be monitored. It explains the procurement process from developing a statement of work (or request for proposal) through choosing a bidder and making progress payments. The statement of work defines what the outside contractor must perform and establishes boundaries to prevent scope creep.
`
      }
    ]
  }
];