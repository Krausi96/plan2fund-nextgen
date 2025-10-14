// ========= PLAN2FUND — ADDITIONAL DOCUMENTS =========
// Document templates required for each funding type and product combination
// Based on GPT agent comprehensive instructions

export interface AdditionalDocument {
  id: string;
  name: string;
  description: string;
  required: boolean;
  format: 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'text';
  maxSize: string;                 // e.g., "5MB"
  template: string;                // Markdown or text template for the document
  instructions: string[];          // Step‑by‑step creation guidance
  examples: string[];              // URLs or names of example files stored in /public/examples
  commonMistakes: string[];        // Pitfalls to avoid
}

// ============================================================================
// ADDITIONAL DOCUMENTS BY FUNDING TYPE AND PRODUCT
// ============================================================================

export const ADDITIONAL_DOCUMENTS = {
  grants: {
    submission: [
      {
        id: 'work_plan_gantt',
        name: 'Work Plan & Gantt Chart',
        description: 'Timeline and milestones for R&D grants with work packages and deliverables',
        required: true,
        format: 'xlsx',
        maxSize: '10MB',
        template: `# Work Plan & Gantt Chart Template

## Project Overview
- Project Title: [Project Name]
- Duration: [Start Date] - [End Date]
- Total Budget: €[Amount]

## Work Packages
| WP | Title | Description | Start | End | Duration | Lead | Partners |
|----|-------|-------------|-------|-----|----------|------|----------|
| WP1 | [Title] | [Description] | [Date] | [Date] | [Months] | [Lead] | [Partners] |
| WP2 | [Title] | [Description] | [Date] | [Date] | [Months] | [Lead] | [Partners] |
| WP3 | [Title] | [Description] | [Date] | [Date] | [Months] | [Lead] | [Partners] |

## Milestones & Deliverables
| Milestone | Description | Due Date | Deliverable | Type |
|-----------|-------------|----------|-------------|------|
| M1 | [Description] | [Date] | [Deliverable] | [Report/Prototype/etc] |
| M2 | [Description] | [Date] | [Deliverable] | [Report/Prototype/etc] |

## Gantt Chart
[Visual timeline showing work packages, milestones, and dependencies]`,
        instructions: [
          'Define clear work packages with specific objectives',
          'Set realistic timelines considering dependencies',
          'Assign lead partners and responsibilities',
          'Include measurable deliverables for each milestone',
          'Ensure alignment with project objectives and evaluation criteria'
        ],
        examples: [
          'Horizon Europe work plan example',
          'EIC Accelerator Gantt chart',
          'FFG Basisprogramm timeline'
        ],
        commonMistakes: [
          'Unrealistic timelines without considering dependencies',
          'Vague work package descriptions',
          'Missing or unclear deliverables',
          'Not assigning clear responsibilities',
          'Overlapping work packages without coordination'
        ]
      },
      {
        id: 'budget_breakdown',
        name: 'Budget Breakdown & Financial Model',
        description: 'Detailed budget with cost categories, funding sources, and financial projections',
        required: true,
        format: 'xlsx',
        maxSize: '10MB',
        template: `# Budget Breakdown & Financial Model

## Total Project Budget
- Total Project Costs: €[Amount]
- EU Contribution: €[Amount] ([Percentage]%)
- Co-financing: €[Amount] ([Percentage]%)

## Cost Categories
| Category | EU Funding | Co-financing | Total | Justification |
|----------|------------|--------------|-------|---------------|
| Personnel | €[Amount] | €[Amount] | €[Amount] | [Justification] |
| Equipment | €[Amount] | €[Amount] | €[Amount] | [Justification] |
| Travel | €[Amount] | €[Amount] | €[Amount] | [Justification] |
| Subcontracting | €[Amount] | €[Amount] | €[Amount] | [Justification] |
| Other Direct Costs | €[Amount] | €[Amount] | €[Amount] | [Justification] |
| Indirect Costs | €[Amount] | €[Amount] | €[Amount] | [Justification] |

## Year-by-Year Breakdown
| Year | Personnel | Equipment | Travel | Subcontracting | Other | Indirect | Total |
|------|-----------|-----------|--------|----------------|-------|----------|-------|
| Year 1 | €[Amount] | €[Amount] | €[Amount] | €[Amount] | €[Amount] | €[Amount] | €[Amount] |
| Year 2 | €[Amount] | €[Amount] | €[Amount] | €[Amount] | €[Amount] | €[Amount] | €[Amount] |
| Year 3 | €[Amount] | €[Amount] | €[Amount] | €[Amount] | €[Amount] | €[Amount] | €[Amount] |

## Co-financing Sources
| Source | Amount | Percentage | Status | Documentation |
|--------|--------|------------|--------|---------------|
| [Source 1] | €[Amount] | [%] | [Confirmed/Pending] | [Document] |
| [Source 2] | €[Amount] | [%] | [Confirmed/Pending] | [Document] |

## Financial Assumptions
- Personnel costs based on [rate/hour] for [hours/week]
- Equipment costs include [list of major equipment]
- Travel costs for [number] trips to [destinations]
- Subcontracting for [specific services]`,
        instructions: [
          'Break down costs by category and year',
          'Include all funding sources and co-financing commitments',
          'Provide detailed justifications for each cost category',
          'Ensure compliance with EU cost eligibility rules',
          'Include realistic assumptions and calculations'
        ],
        examples: [
          'Horizon Europe budget template',
          'EIC Accelerator financial model',
          'FFG cost breakdown example'
        ],
        commonMistakes: [
          'Missing cost categories or incorrect percentages',
          'Insufficient justification for costs',
          'Unrealistic co-financing commitments',
          'Not following EU cost eligibility rules',
          'Inconsistent calculations or missing totals'
        ]
      },
      {
        id: 'ethics_risk_assessment',
        name: 'Ethics & Risk Assessment',
        description: 'Ethical considerations and risk management plan required for EU programmes',
        required: true,
        format: 'pdf',
        maxSize: '5MB',
        template: `# Ethics & Risk Assessment

## Ethical Considerations
### Data Protection & Privacy
- [Description of personal data processing]
- [GDPR compliance measures]
- [Data retention and deletion policies]

### Research Ethics
- [Human subjects research considerations]
- [Animal research compliance]
- [Informed consent procedures]

### AI & Algorithmic Ethics
- [Bias and fairness considerations]
- [Transparency and explainability]
- [Accountability and oversight]

## Risk Assessment
### Technical Risks
| Risk | Probability | Impact | Mitigation Strategy | Owner |
|------|-------------|--------|-------------------|-------|
| [Risk 1] | [High/Medium/Low] | [High/Medium/Low] | [Strategy] | [Person] |
| [Risk 2] | [High/Medium/Low] | [High/Medium/Low] | [Strategy] | [Person] |

### Financial Risks
| Risk | Probability | Impact | Mitigation Strategy | Owner |
|------|-------------|--------|-------------------|-------|
| [Risk 1] | [High/Medium/Low] | [High/Medium/Low] | [Strategy] | [Person] |
| [Risk 2] | [High/Medium/Low] | [High/Medium/Low] | [Strategy] | [Person] |

### Market Risks
| Risk | Probability | Impact | Mitigation Strategy | Owner |
|------|-------------|--------|-------------------|-------|
| [Risk 1] | [High/Medium/Low] | [High/Medium/Low] | [Strategy] | [Person] |
| [Risk 2] | [High/Medium/Low] | [High/Medium/Low] | [Strategy] | [Person] |

## Risk Monitoring & Review
- [Risk monitoring procedures]
- [Review schedule and responsibilities]
- [Escalation procedures]`,
        instructions: [
          'Identify all potential ethical issues and risks',
          'Assess probability and impact of each risk',
          'Develop specific mitigation strategies',
          'Assign risk owners and monitoring procedures',
          'Ensure compliance with EU ethics guidelines'
        ],
        examples: [
          'AI ethics assessment example',
          'Biotech risk analysis template',
          'Data protection compliance checklist'
        ],
        commonMistakes: [
          'Ignoring ethical considerations',
          'Incomplete risk identification',
          'Vague mitigation strategies',
          'Not assigning risk owners',
          'Missing compliance requirements'
        ]
      }
    ]
  },

  bankLoans: {
    submission: [
      {
        id: 'business_plan_bank',
        name: 'Business Plan (Bank Format)',
        description: 'Formal bank-style business plan with comprehensive financial analysis',
        required: true,
        format: 'docx',
        maxSize: '50MB',
        template: `# Business Plan - [Company Name]

## Executive Summary
- Company Overview
- Loan Request: €[Amount]
- Purpose of Loan: [Description]
- Repayment Plan: [Timeline and method]
- Key Financial Highlights

## Company Description
- Business History and Background
- Legal Structure and Ownership
- Products/Services Offered
- Business Model and Revenue Streams
- Competitive Positioning

## Market Analysis
- Industry Overview and Trends
- Target Market and Customer Segments
- Market Size and Growth Potential
- Competitive Landscape
- Market Entry Strategy

## Financial Analysis
### Historical Performance
- Revenue History (3-5 years)
- Profitability Analysis
- Cash Flow Analysis
- Key Financial Ratios

### Financial Projections
- Revenue Projections (3-5 years)
- Profit and Loss Forecast
- Cash Flow Projections
- Balance Sheet Projections
- Key Assumptions

### Financial Ratios
- Current Ratio: [Number]
- Quick Ratio: [Number]
- Debt-to-Equity Ratio: [Number]
- Debt Service Coverage Ratio: [Number]
- Return on Investment: [Number]

## Repayment Plan
- Loan Amount: €[Amount]
- Interest Rate: [Rate]%
- Repayment Period: [Years]
- Monthly Payment: €[Amount]
- Repayment Source: [Primary source]
- Contingency Plans

## Risk Assessment
- Business Risks and Mitigation
- Financial Risks and Management
- Market Risks and Strategies
- Operational Risks and Controls

## Management Team
- Key Personnel and Experience
- Organizational Structure
- Succession Planning
- Advisory Board

## Use of Funds
- Equipment: €[Amount]
- Working Capital: €[Amount]
- Marketing: €[Amount]
- Other: €[Amount]
- Total: €[Amount]`,
        instructions: [
          'Follow standard bank business plan format',
          'Include comprehensive financial analysis and projections',
          'Emphasize repayment capacity and risk mitigation',
          'Provide detailed use of funds breakdown',
          'Include management team qualifications'
        ],
        examples: [
          'SME loan business plan example',
          'Startup bank application template',
          'Manufacturing business plan'
        ],
        commonMistakes: [
          'Incomplete financial analysis',
          'Weak repayment capacity demonstration',
          'Missing risk assessment',
          'Unrealistic financial projections',
          'Insufficient management team information'
        ]
      },
      {
        id: 'collateral_documentation',
        name: 'Collateral Documentation',
        description: 'Comprehensive documentation of assets offered as collateral',
        required: true,
        format: 'pdf',
        maxSize: '20MB',
        template: `# Collateral Documentation

## Asset Inventory
| Asset | Description | Location | Condition | Estimated Value | Documentation |
|-------|-------------|----------|-----------|-----------------|---------------|
| [Asset 1] | [Description] | [Address] | [Good/Fair/Poor] | €[Amount] | [Document] |
| [Asset 2] | [Description] | [Address] | [Good/Fair/Poor] | €[Amount] | [Document] |

## Real Estate Collateral
### Property Details
- Address: [Full Address]
- Property Type: [Residential/Commercial/Industrial]
- Size: [Square meters]
- Year Built: [Year]
- Current Market Value: €[Amount]

### Legal Documentation
- [ ] Title Deed
- [ ] Property Survey
- [ ] Insurance Documentation
- [ ] Property Tax Records
- [ ] Mortgage/Lien Information

## Equipment Collateral
### Equipment List
- [Equipment 1]: [Description], Value: €[Amount]
- [Equipment 2]: [Description], Value: €[Amount]
- [Equipment 3]: [Description], Value: €[Amount]

### Documentation
- [ ] Equipment Purchase Receipts
- [ ] Depreciation Schedules
- [ ] Insurance Policies
- [ ] Maintenance Records

## Financial Collateral
### Bank Accounts
- Account 1: [Bank], Balance: €[Amount]
- Account 2: [Bank], Balance: €[Amount]

### Investments
- [Investment 1]: [Type], Value: €[Amount]
- [Investment 2]: [Type], Value: €[Amount]

## Valuation Reports
- [Professional valuation report 1]
- [Professional valuation report 2]
- [Appraisal documentation]

## Insurance Coverage
- [Property insurance policy]
- [Equipment insurance policy]
- [Liability insurance policy]`,
        instructions: [
          'Provide complete inventory of all collateral assets',
          'Include professional valuations and appraisals',
          'Attach all legal documentation and proof of ownership',
          'Ensure adequate insurance coverage',
          'Update valuations if assets are older than 2 years'
        ],
        examples: [
          'Real estate collateral documentation',
          'Equipment asset documentation',
          'Financial asset documentation'
        ],
        commonMistakes: [
          'Missing valuations or appraisals',
          'Incomplete legal documentation',
          'Outdated valuations',
          'Insufficient insurance coverage',
          'Not including all relevant assets'
        ]
      }
    ]
  },

  equity: {
    submission: [
      {
        id: 'pitch_deck',
        name: 'Pitch Deck',
        description: 'Investor pitch presentation following best-practice structure',
        required: true,
        format: 'pptx',
        maxSize: '20MB',
        template: `# Pitch Deck Template

## Slide 1: Title Slide
- Company Name
- Tagline
- Date
- Contact Information

## Slide 2: Problem
- What problem are you solving?
- Why is this problem important?
- Who has this problem?
- Current solutions and their limitations

## Slide 3: Solution
- Your solution/product
- How does it work?
- Key features and benefits
- What makes it unique?

## Slide 4: Market Opportunity
- Total Addressable Market (TAM)
- Serviceable Addressable Market (SAM)
- Serviceable Obtainable Market (SOM)
- Market growth rate and trends

## Slide 5: Product
- Product demo/screenshots
- Key features and functionality
- Technology stack
- Development roadmap

## Slide 6: Business Model
- How you make money
- Revenue streams
- Pricing strategy
- Unit economics

## Slide 7: Traction
- Key metrics and KPIs
- User growth
- Revenue growth
- Customer testimonials
- Partnerships and milestones

## Slide 8: Competition
- Competitive landscape
- Direct and indirect competitors
- Competitive advantages
- Market positioning

## Slide 9: Team
- Founders and key team members
- Relevant experience and expertise
- Advisory board
- Hiring plan

## Slide 10: Financials
- Revenue projections (3-5 years)
- Key assumptions
- Unit economics
- Path to profitability

## Slide 11: Funding Ask
- Amount needed
- Use of funds
- Valuation
- Previous funding rounds

## Slide 12: Contact
- Contact information
- Next steps
- Thank you`,
        instructions: [
          'Follow the standard pitch deck structure',
          'Keep slides concise and visual',
          'Include key metrics and traction data',
          'Use high-quality visuals and graphics',
          'Practice timing (10-15 minutes total)'
        ],
        examples: [
          'Series A pitch deck example',
          'Seed stage presentation',
          'B2B SaaS pitch deck'
        ],
        commonMistakes: [
          'Too many slides (keep to 12-15)',
          'Weak traction data or metrics',
          'Unclear value proposition',
          'Poor visual design',
          'Not practicing timing'
        ]
      },
      {
        id: 'cap_table',
        name: 'Cap Table',
        description: 'Current ownership structure and dilution scenarios',
        required: true,
        format: 'xlsx',
        maxSize: '5MB',
        template: `# Cap Table Template

## Current Ownership
| Shareholder | Shares | Percentage | Type | Vesting |
|-------------|--------|------------|------|---------|
| Founder 1 | [Number] | [%] | Common | [Schedule] |
| Founder 2 | [Number] | [%] | Common | [Schedule] |
| Employee 1 | [Number] | [%] | Options | [Schedule] |
| Employee 2 | [Number] | [%] | Options | [Schedule] |
| Investor 1 | [Number] | [%] | Preferred | N/A |
| Option Pool | [Number] | [%] | Options | Various |
| **Total** | **[Number]** | **100%** | | |

## Option Pool Details
| Employee | Granted | Vested | Remaining | Strike Price | Expiry |
|----------|---------|--------|-----------|--------------|--------|
| [Name] | [Number] | [Number] | [Number] | €[Price] | [Date] |
| [Name] | [Number] | [Number] | [Number] | €[Price] | [Date] |

## Dilution Scenarios
### Series A (€[Amount] at €[Valuation])
| Shareholder | Before | After | Dilution |
|-------------|--------|-------|----------|
| Founder 1 | [%] | [%] | [%] |
| Founder 2 | [%] | [%] | [%] |
| Employee Pool | [%] | [%] | [%] |
| Series A Investors | 0% | [%] | [%] |

### Series B (€[Amount] at €[Valuation])
| Shareholder | Before | After | Dilution |
|-------------|--------|-------|----------|
| Founder 1 | [%] | [%] | [%] |
| Founder 2 | [%] | [%] | [%] |
| Employee Pool | [%] | [%] | [%] |
| Series A Investors | [%] | [%] | [%] |
| Series B Investors | 0% | [%] | [%] |

## Key Terms
- Liquidation Preference: [1x/2x/etc]
- Anti-dilution: [Full ratchet/Weighted average]
- Board Seats: [Number]
- Protective Provisions: [List]`,
        instructions: [
          'Show current ownership structure clearly',
          'Include option pool and employee equity',
          'Model dilution scenarios for future rounds',
          'Document key terms and preferences',
          'Keep calculations accurate and up-to-date'
        ],
        examples: [
          'Pre-seed cap table example',
          'Series A cap table template',
          'Post-Series B cap table'
        ],
        commonMistakes: [
          'Incorrect ownership percentages',
          'Missing option pool details',
          'Not modeling dilution scenarios',
          'Inaccurate calculations',
          'Outdated information'
        ]
      }
    ]
  },

  visa: {
    submission: [
      {
        id: 'job_creation_plan',
        name: 'Job Creation Plan',
        description: 'Detailed plan for creating jobs in Austria with timeline and recruitment strategy',
        required: true,
        format: 'pdf',
        maxSize: '10MB',
        template: `# Job Creation Plan

## Executive Summary
- Total Jobs to be Created: [Number]
- Timeline: [Start Date] - [End Date]
- Investment in Human Resources: €[Amount]
- Average Salary: €[Amount]

## Job Creation Timeline
| Year | Jobs Created | Cumulative | Investment | Key Milestones |
|------|--------------|------------|------------|----------------|
| Year 1 | [Number] | [Number] | €[Amount] | [Milestone] |
| Year 2 | [Number] | [Number] | €[Amount] | [Milestone] |
| Year 3 | [Number] | [Number] | €[Amount] | [Milestone] |
| Year 4 | [Number] | [Number] | €[Amount] | [Milestone] |
| Year 5 | [Number] | [Number] | €[Amount] | [Milestone] |

## Job Descriptions
### Position 1: [Title]
- **Responsibilities**: [List of key responsibilities]
- **Requirements**: [Education, experience, skills]
- **Salary Range**: €[Min] - €[Max]
- **Start Date**: [Date]
- **Location**: [City, Austria]

### Position 2: [Title]
- **Responsibilities**: [List of key responsibilities]
- **Requirements**: [Education, experience, skills]
- **Salary Range**: €[Min] - €[Max]
- **Start Date**: [Date]
- **Location**: [City, Austria]

### Position 3: [Title]
- **Responsibilities**: [List of key responsibilities]
- **Requirements**: [Education, experience, skills]
- **Salary Range**: €[Min] - €[Max]
- **Start Date**: [Date]
- **Location**: [City, Austria]

## Recruitment Strategy
### Sourcing Channels
- [ ] Austrian job boards (karriere.at, jobs.at)
- [ ] University partnerships
- [ ] Professional networks
- [ ] Recruitment agencies
- [ ] International talent acquisition

### Selection Process
1. [Step 1: Application screening]
2. [Step 2: Initial interviews]
3. [Step 3: Technical assessments]
4. [Step 4: Final interviews]
5. [Step 5: Reference checks]

### Onboarding Program
- [Week 1: Company orientation]
- [Week 2-4: Role-specific training]
- [Month 2-3: Mentorship program]
- [Month 6: Performance review]

## Compensation & Benefits
### Salary Structure
- Base salary: €[Amount] - €[Amount]
- Performance bonuses: Up to [%] of base salary
- Equity participation: [%] of company

### Benefits Package
- [ ] Health insurance
- [ ] Pension contributions
- [ ] Professional development budget
- [ ] Flexible working arrangements
- [ ] Company equipment and tools

## Economic Impact
### Direct Employment
- Number of jobs: [Number]
- Total salaries: €[Amount]
- Social security contributions: €[Amount]
- Income tax contributions: €[Amount]

### Indirect Economic Impact
- Supplier contracts: €[Amount]
- Local service providers: €[Amount]
- Real estate: €[Amount]
- Other local spending: €[Amount]

## Monitoring & Reporting
### Key Performance Indicators
- [KPI 1: Job creation rate]
- [KPI 2: Employee retention rate]
- [KPI 3: Salary competitiveness]
- [KPI 4: Local hiring percentage]

### Reporting Schedule
- Monthly: [Internal tracking]
- Quarterly: [Management review]
- Annually: [Government reporting]`,
        instructions: [
          'Provide specific job descriptions and requirements',
          'Include realistic timeline and salary ranges',
          'Detail recruitment and onboarding strategies',
          'Show economic impact and local benefits',
          'Include monitoring and reporting procedures'
        ],
        examples: [
          'Tech startup job creation plan',
          'Service business employment plan',
          'Manufacturing job creation strategy'
        ],
        commonMistakes: [
          'Unrealistic job creation numbers',
          'Vague job descriptions',
          'Missing recruitment strategy',
          'No economic impact analysis',
          'Unclear monitoring procedures'
        ]
      },
      {
        id: 'proof_of_funds',
        name: 'Proof of Funds',
        description: 'Documentation of financial capacity and investment commitments',
        required: true,
        format: 'pdf',
        maxSize: '20MB',
        template: `# Proof of Funds Documentation

## Personal Financial Statement
### Assets
- Bank Accounts: €[Amount]
- Investments: €[Amount]
- Real Estate: €[Amount]
- Other Assets: €[Amount]
- **Total Assets**: €[Amount]

### Liabilities
- Mortgages: €[Amount]
- Other Loans: €[Amount]
- Credit Cards: €[Amount]
- Other Debts: €[Amount]
- **Total Liabilities**: €[Amount]

### Net Worth
- **Net Worth**: €[Amount]

## Business Investment Capacity
### Available for Business Investment
- Personal Funds: €[Amount]
- Family/Friends Investment: €[Amount]
- Business Loans: €[Amount]
- Other Sources: €[Amount]
- **Total Available**: €[Amount]

### Investment Timeline
- Immediate (0-6 months): €[Amount]
- Short-term (6-12 months): €[Amount]
- Medium-term (1-2 years): €[Amount]
- Long-term (2+ years): €[Amount]

## Supporting Documentation
### Bank Statements
- [Bank 1]: Account ending [XXXX], Balance: €[Amount], Date: [Date]
- [Bank 2]: Account ending [XXXX], Balance: €[Amount], Date: [Date]
- [Bank 3]: Account ending [XXXX], Balance: €[Amount], Date: [Date]

### Investment Statements
- [Investment Account 1]: Value: €[Amount], Date: [Date]
- [Investment Account 2]: Value: €[Amount], Date: [Date]
- [Retirement Account]: Value: €[Amount], Date: [Date]

### Real Estate Documentation
- [Property 1]: Address: [Address], Value: €[Amount], Equity: €[Amount]
- [Property 2]: Address: [Address], Value: €[Amount], Equity: €[Amount]

### Business Funding Commitments
- [Investor 1]: Name: [Name], Amount: €[Amount], Status: [Confirmed/Pending]
- [Investor 2]: Name: [Name], Amount: €[Amount], Status: [Confirmed/Pending]
- [Bank Loan]: Bank: [Name], Amount: €[Amount], Status: [Approved/Pending]

## Financial Projections
### Business Revenue Projections
- Year 1: €[Amount]
- Year 2: €[Amount]
- Year 3: €[Amount]
- Year 4: €[Amount]
- Year 5: €[Amount]

### Personal Income Projections
- Year 1: €[Amount]
- Year 2: €[Amount]
- Year 3: €[Amount]
- Year 4: €[Amount]
- Year 5: €[Amount]

## Risk Assessment
### Financial Risks
- [Risk 1]: [Description], Mitigation: [Strategy]
- [Risk 2]: [Description], Mitigation: [Strategy]
- [Risk 3]: [Description], Mitigation: [Strategy]

### Contingency Plans
- [Plan 1]: [Description]
- [Plan 2]: [Description]
- [Plan 3]: [Description]`,
        instructions: [
          'Provide recent bank statements and investment records',
          'Include all sources of funding and investment commitments',
          'Document real estate and other significant assets',
          'Show realistic financial projections and assumptions',
          'Include risk assessment and contingency plans'
        ],
        examples: [
          'Personal financial statement template',
          'Business funding commitment letter',
          'Bank statement documentation'
        ],
        commonMistakes: [
          'Insufficient documentation of funds',
          'Missing investment commitments',
          'Outdated financial statements',
          'Unrealistic financial projections',
          'No risk assessment or contingency planning'
        ]
      }
    ]
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get additional documents for a specific funding type and product
 */
export function getAdditionalDocuments(fundingType: string, productType: string): AdditionalDocument[] {
  const funding = fundingType.toLowerCase() as keyof typeof ADDITIONAL_DOCUMENTS;
  const product = productType.toLowerCase() as keyof typeof ADDITIONAL_DOCUMENTS[typeof funding];
  
  if (ADDITIONAL_DOCUMENTS[funding] && ADDITIONAL_DOCUMENTS[funding][product]) {
    return ADDITIONAL_DOCUMENTS[funding][product] as AdditionalDocument[];
  }
  
  return [];
}

/**
 * Get a specific additional document by ID
 */
export function getAdditionalDocument(fundingType: string, productType: string, documentId: string): AdditionalDocument | undefined {
  const documents = getAdditionalDocuments(fundingType, productType);
  return documents.find(doc => doc.id === documentId);
}

/**
 * Get required documents only
 */
export function getRequiredDocuments(fundingType: string, productType: string): AdditionalDocument[] {
  const documents = getAdditionalDocuments(fundingType, productType);
  return documents.filter(doc => doc.required);
}

/**
 * Get documents by format
 */
export function getDocumentsByFormat(fundingType: string, productType: string, format: string): AdditionalDocument[] {
  const documents = getAdditionalDocuments(fundingType, productType);
  return documents.filter(doc => doc.format === format);
}
