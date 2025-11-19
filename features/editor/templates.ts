// ========= PLAN2FUND — UNIFIED TEMPLATE REGISTRY =========
// All template types, sections, documents, and knowledge in one file

// ============================================================================
// TYPES
// ============================================================================

export interface SectionQuestion {
  text: string;
  required: boolean;
  placeholder?: string;
  hint?: string;
}

export interface SectionTemplate {
  id: string;
  title: string;
  description: string;
  required: boolean;
  wordCountMin: number;
  wordCountMax: number;
  order: number;
  category: string;
  prompts: string[];
  questions?: SectionQuestion[];
  validationRules: {
    requiredFields: string[];
    formatRequirements: string[];
  };
  source?: {
    verified: boolean;
    verifiedDate?: string;
    officialProgram?: string;
    sourceUrl?: string;
    version?: string;
  };
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  required: boolean;
  format: 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'text';
  maxSize: string;
  template: string;
  instructions: string[];
  examples: string[];
  commonMistakes: string[];
  category: string;
  fundingTypes: string[];
  isVariable?: boolean;
  defaultStructure?: string;
  source?: {
    verified: boolean;
    verifiedDate?: string;
    officialProgram?: string;
    sourceUrl?: string;
    version?: string;
  };
}

export interface TemplateKnowledge {
  guidance: string;
  requiredElements: string[];
  frameworks?: string[];
  bestPractices?: string[];
  commonMistakes?: string[];
  expertQuestions?: string[];
  validation?: string;
}

// Type aliases for backward compatibility
export type StandardSection = SectionTemplate;
export type AdditionalDocument = DocumentTemplate;

// ============================================================================
// SECTION TEMPLATES
// ============================================================================

const STRATEGY_SECTIONS: SectionTemplate[] = [
  {
    id: 'executive_summary',
    title: 'Executive Summary',
    description: 'Provide a concise overview of your project idea and funding goals. Summarise the core problem, your solution concept and potential impact.',
    required: true,
    wordCountMin: 200,
    wordCountMax: 300,
    order: 1,
    category: 'general',
    prompts: [
      'What is your business mission?',
      'What problem are you solving?',
      'Who are your target customers?',
      'How much funding do you seek?'
    ],
    questions: [
      {
        text: 'Wie heißt Ihr Unternehmen?',
        required: true,
        placeholder: 'Geben Sie den vollständigen Firmennamen ein',
        hint: 'Verwenden Sie den offiziellen, registrierten Firmennamen'
      },
      {
        text: 'Wie hoch ist der benötigte Förderbetrag?',
        required: true,
        placeholder: 'z.B. €50.000 oder €100.000 - €200.000',
        hint: 'Geben Sie einen konkreten Betrag oder einen Bereich an'
      },
      {
        text: 'Wofür werden die Mittel verwendet?',
        required: true,
        placeholder: 'Beschreiben Sie die geplanten Ausgaben',
        hint: 'Beispiele: Personal, Entwicklung, Marketing, Ausrüstung'
      },
      {
        text: 'Was macht Ihr Projekt einzigartig?',
        required: false,
        placeholder: 'Beschreiben Sie Ihre Alleinstellungsmerkmale',
        hint: 'Was unterscheidet Sie von Wettbewerbern?'
      }
    ],
    validationRules: {
      requiredFields: ['business_overview', 'funding_goal'],
      formatRequirements: ['clear_problem_statement', 'solution_description']
    },
    source: {
      verified: true,
      verifiedDate: '2025-01-20',
      officialProgram: 'Strategic Planning Best Practices',
      version: '2.0'
    }
  },
  {
    id: 'market_opportunity',
    title: 'Market Opportunity',
    description: 'Describe the market size, trends, and unmet needs. Identify your target customer segments.',
    required: true,
    wordCountMin: 150,
    wordCountMax: 300,
    order: 2,
    category: 'market',
    prompts: [
      'Who is the target market?',
      'How large is the market?',
      'What trends support your opportunity?',
      'What unmet needs exist?'
    ],
    validationRules: {
      requiredFields: ['market_size', 'target_customers', 'market_trends'],
      formatRequirements: ['data_citation', 'market_analysis']
    },
    source: {
      verified: true,
      verifiedDate: '2025-01-20',
      officialProgram: 'Strategic Planning Best Practices',
      version: '2.0'
    }
  },
  {
    id: 'project_description',
    title: 'Project Description / Business Concept',
    description: 'Describe your core business tasks, business model, and conduct a SWOT analysis. Explain what your business does and how it operates.',
    required: true,
    wordCountMin: 200,
    wordCountMax: 400,
    order: 3,
    category: 'project',
    prompts: [
      'What are your core business tasks?',
      'What is your business model?',
      'What are your strengths and weaknesses?',
      'What opportunities and threats do you face?'
    ],
    validationRules: {
      requiredFields: ['core_tasks', 'business_model', 'swot_analysis'],
      formatRequirements: ['structured_narrative']
    },
    source: {
      verified: true,
      verifiedDate: '2025-01-20',
      officialProgram: 'Strategic Planning Best Practices',
      version: '2.0'
    }
  },
  {
    id: 'business_model_value_proposition',
    title: 'Business Model & Value Proposition',
    description: 'Outline how your business will generate revenue, pricing strategy, and value delivered to customers.',
    required: true,
    wordCountMin: 150,
    wordCountMax: 350,
    order: 4,
    category: 'business',
    prompts: [
      'How will you make money?',
      'What are your main revenue streams?',
      'What value do you offer that competitors do not?',
      'What is your cost structure?'
    ],
    validationRules: {
      requiredFields: ['revenue_streams', 'value_proposition', 'cost_structure'],
      formatRequirements: ['clear_business_model', 'pricing_strategy']
    },
    source: {
      verified: true,
      verifiedDate: '2025-01-20',
      officialProgram: 'Strategic Planning Best Practices',
      version: '2.0'
    }
  },
  {
    id: 'competitive_landscape',
    title: 'Competitive Landscape',
    description: 'Identify key competitors and differentiate your offering.',
    required: true,
    wordCountMin: 150,
    wordCountMax: 300,
    order: 5,
    category: 'market',
    prompts: [
      'Who are your main competitors?',
      'What are their strengths?',
      'How is your solution different or better?'
    ],
    validationRules: {
      requiredFields: ['competitor_analysis', 'competitive_advantage'],
      formatRequirements: ['differentiation_clear', 'competitive_positioning']
    },
    source: {
      verified: true,
      verifiedDate: '2025-01-20',
      officialProgram: 'Strategic Planning Best Practices',
      version: '2.0'
    }
  },
  {
    id: 'preliminary_financial_overview',
    title: 'Preliminary Financial Overview',
    description: 'Provide high-level financial assumptions including costs, revenue potential, and funding needed.',
    required: true,
    wordCountMin: 150,
    wordCountMax: 300,
    order: 6,
    category: 'financial',
    prompts: [
      'What are your expected revenue streams?',
      'What are your major cost drivers?',
      'How much funding is needed to reach the next milestone?'
    ],
    validationRules: {
      requiredFields: ['revenue_assumptions', 'cost_assumptions', 'funding_need'],
      formatRequirements: ['realistic_numbers', 'financial_justification']
    },
    source: {
      verified: true,
      verifiedDate: '2025-01-20',
      officialProgram: 'Strategic Planning Best Practices',
      version: '2.0'
    }
  }
];

const FULL_SECTIONS: SectionTemplate[] = [
  {
    id: 'executive_summary',
    title: 'Executive Summary',
    description: 'Provide a concise overview of the project and funding request. Summarise the core problem, your innovative solution and the expected impact.',
    required: true,
    wordCountMin: 200,
    wordCountMax: 500,
    order: 1,
    category: 'general',
    prompts: [
      'Summarise your project in two to three sentences.',
      'Which problem or need does your project address?',
      'What makes your approach innovative compared to the state of the art?',
      'Briefly state the expected impact on your target group or market.'
    ],
    validationRules: {
      requiredFields: ['project_overview', 'innovation_aspect', 'expected_impact'],
      formatRequirements: ['clear_problem_statement', 'solution_description']
    },
    source: {
      verified: true,
      verifiedDate: '2025-01-20',
      officialProgram: 'WKO Businessplan Guide',
      sourceUrl: 'https://www.wko.at/gruendung/inhalte-businessplan',
      version: '2.0'
    }
  },
  {
    id: 'project_description',
    title: 'Project Description',
    description: 'Detail the objectives, scope and methodology of the project. Explain what you plan to do and why it is necessary.',
    required: true,
    wordCountMin: 400,
    wordCountMax: 900,
    order: 2,
    category: 'project',
    prompts: [
      'Describe the main objectives and deliverables of your project.',
      'Explain the current state of the art and how your project goes beyond it.',
      'Outline the methodology and approach you will use to achieve the objectives.',
      'What are the expected outcomes and how will they be measured?'
    ],
    validationRules: {
      requiredFields: ['objectives', 'state_of_the_art', 'methodology', 'expected_outcomes'],
      formatRequirements: ['structured_subsections', 'evidence_of_need']
    },
    source: {
      verified: true,
      verifiedDate: '2025-01-20',
      officialProgram: 'FFG Basisprogramm – Projektbeschreibung',
      sourceUrl: 'https://www.ffg.at/',
      version: '2.0'
    }
  },
  {
    id: 'innovation_technology',
    title: 'Innovation & Technology',
    description: 'Explain the innovative aspects and technological foundations of the project. Position your project within the spectrum from idea to application.',
    required: true,
    wordCountMin: 300,
    wordCountMax: 800,
    order: 3,
    category: 'technical',
    prompts: [
      'Describe what is novel about your solution compared with existing approaches.',
      'Provide evidence of prior art and explain how you will protect your innovation (e.g., patents, know‑how).',
      'Discuss the Technology Readiness Level (TRL) at the start and end of the project.',
      'Outline any technical risks and how you plan to mitigate them.'
    ],
    validationRules: {
      requiredFields: ['novelty', 'state_of_the_art_comparison', 'protection_strategy', 'technical_risks'],
      formatRequirements: ['evidence_based_claims', 'risk_mitigation_plan']
    },
    source: {
      verified: true,
      verifiedDate: '2025-01-20',
      officialProgram: 'Horizon Europe RIA/IA Application Form',
      version: '2.0'
    }
  },
  {
    id: 'impact_assessment',
    title: 'Impact Assessment',
    description: 'Describe the expected economic, social and environmental impacts of the project. Explain who will benefit and how you will measure success.',
    required: true,
    wordCountMin: 300,
    wordCountMax: 800,
    order: 4,
    category: 'impact',
    prompts: [
      'Who are the target beneficiaries of your project and what outcomes do you expect for them?',
      'What economic or market impact will your project have?',
      'Identify any social or environmental benefits and describe how they align with policy priorities.',
      'Which indicators or metrics will you use to assess impact during and after the project?'
    ],
    validationRules: {
      requiredFields: ['target_beneficiaries', 'economic_impact', 'social_environmental_impact', 'impact_metrics'],
      formatRequirements: ['quantifiable_metrics', 'alignment_with_policy']
    },
    source: {
      verified: true,
      verifiedDate: '2025-01-20',
      officialProgram: 'Horizon Europe Impact Section',
      version: '2.0'
    }
  },
  {
    id: 'financial_plan',
    title: 'Financial Plan',
    description: 'Provide a detailed budget and financing plan. Outline costs, funding requested, co‑financing and expected revenue or savings.',
    required: true,
    wordCountMin: 300,
    wordCountMax: 800,
    order: 5,
    category: 'financial',
    prompts: [
      'Break down your project costs by category (personnel, equipment, travel, subcontracting, etc.).',
      'Specify the amount of funding requested and any co‑financing or matching funds.',
      'Describe your cost assumptions and provide justification for major expenditures.',
      'If applicable, outline expected revenues or cost savings resulting from the project.'
    ],
    validationRules: {
      requiredFields: ['budget_breakdown', 'funding_request', 'co_financing', 'cost_justification'],
      formatRequirements: ['tabular_budget', 'realistic_assumptions']
    },
    source: {
      verified: true,
      verifiedDate: '2025-01-20',
      officialProgram: 'FFG Basisprogramm – Projektbeschreibung',
      version: '2.0'
    }
  },
  {
    id: 'market_analysis',
    title: 'Market Analysis',
    description: 'Analyse the market context for your project. Provide data on market size, trends, competition and customer segments.',
    required: true,
    wordCountMin: 300,
    wordCountMax: 700,
    order: 6,
    category: 'market',
    prompts: [
      'Define the market you intend to target and estimate its size and growth.',
      'Identify key trends and drivers that influence this market.',
      'Describe the competitive landscape and how you differentiate yourself.',
      'Define your target customer segments and explain their needs.'
    ],
    validationRules: {
      requiredFields: ['market_size', 'market_trends', 'competition', 'target_customers'],
      formatRequirements: ['data_citation', 'competitive_positioning']
    },
    source: {
      verified: true,
      verifiedDate: '2025-01-20',
      officialProgram: 'WKO Businessplan Guide',
      version: '2.0'
    }
  },
  {
    id: 'team_qualifications',
    title: 'Team & Qualifications',
    description: 'Present the project team, their roles and qualifications. Highlight relevant experience and capacity to deliver the project.',
    required: true,
    wordCountMin: 200,
    wordCountMax: 600,
    order: 7,
    category: 'team',
    prompts: [
      'List key team members and describe their roles within the project.',
      'Summarise each member\'s qualifications, experience and expertise relevant to the project.',
      'Mention any external advisors or partners providing critical know-how.',
      'Explain how the team structure supports successful implementation.'
    ],
    validationRules: {
      requiredFields: ['team_members', 'roles', 'qualifications'],
      formatRequirements: ['professional_bios', 'role_alignment']
    },
    source: {
      verified: true,
      verifiedDate: '2025-01-20',
      officialProgram: 'WKO Businessplan Guide',
      version: '2.0'
    }
  },
  {
    id: 'risk_assessment',
    title: 'Risk Assessment',
    description: 'Identify potential risks (technical, financial, market or operational) and describe mitigation strategies.',
    required: true,
    wordCountMin: 200,
    wordCountMax: 600,
    order: 8,
    category: 'risk',
    prompts: [
      'List the main technical and operational risks that could affect the project.',
      'Assess financial risks, such as cost overruns or funding gaps.',
      'Analyse market risks, including changes in demand or competitive actions.',
      'Describe mitigation measures and contingency plans for each risk category.'
    ],
    validationRules: {
      requiredFields: ['technical_risks', 'financial_risks', 'market_risks', 'mitigation_plans'],
      formatRequirements: ['risk_matrix', 'contingency_plans']
    },
    source: {
      verified: true,
      verifiedDate: '2025-01-20',
      officialProgram: 'FFG Basisprogramm – Projektbeschreibung',
      version: '2.0'
    }
  },
  {
    id: 'timeline_milestones',
    title: 'Timeline & Milestones',
    description: 'Provide a schedule of your project with key milestones and deliverables. Include start and end dates for major tasks.',
    required: true,
    wordCountMin: 200,
    wordCountMax: 500,
    order: 9,
    category: 'project',
    prompts: [
      'Outline the overall project timeline with major phases.',
      'List critical milestones and their expected completion dates.',
      'Describe deliverables associated with each milestone.',
      'Explain how progress will be monitored and reported.'
    ],
    validationRules: {
      requiredFields: ['project_schedule', 'milestones', 'deliverables'],
      formatRequirements: ['gantt_chart_or_table', 'realistic_timelines']
    },
    source: {
      verified: true,
      verifiedDate: '2025-01-20',
      officialProgram: 'Horizon Europe Implementation Section',
      version: '2.0'
    }
  }
];

export const MASTER_SECTIONS: Record<string, SectionTemplate[]> = {
  strategy: STRATEGY_SECTIONS,
  review: FULL_SECTIONS,
  submission: FULL_SECTIONS
};

export function getStandardSections(_fundingType: string): SectionTemplate[] {
  return MASTER_SECTIONS.submission;
}

export function getSectionById(sectionId: string, fundingType: string): SectionTemplate | undefined {
  const sections = getStandardSections(fundingType);
  return sections.find(section => section.id === sectionId);
}

export function getSectionsByCategory(category: string, fundingType: string): SectionTemplate[] {
  const sections = getStandardSections(fundingType);
  return sections.filter(section => section.category === category);
}

// ============================================================================
// DOCUMENT TEMPLATES
// ============================================================================

const ADDITIONAL_DOCUMENTS = {
  grants: {
    submission: [
      {
        id: 'work_plan_gantt',
        name: 'Work Plan & Gantt Chart',
        description: 'Timeline and milestones for R&D grants with work packages and deliverables',
        required: true,
        format: 'xlsx' as const,
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
        ],
        category: 'submission',
        fundingTypes: ['grants']
      },
      {
        id: 'budget_breakdown',
        name: 'Budget Breakdown & Financial Model',
        description: 'Detailed budget with cost categories, funding sources, and financial projections',
        required: true,
        format: 'xlsx' as const,
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
        ],
        category: 'submission',
        fundingTypes: ['grants']
      },
      {
        id: 'ethics_risk_assessment',
        name: 'Ethics & Risk Assessment',
        description: 'Ethical considerations and risk management plan required for EU programmes',
        required: true,
        format: 'pdf' as const,
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
        ],
        category: 'submission',
        fundingTypes: ['grants']
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
        format: 'docx' as const,
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
        ],
        category: 'submission',
        fundingTypes: ['bankLoans']
      },
      {
        id: 'collateral_documentation',
        name: 'Collateral Documentation',
        description: 'Comprehensive documentation of assets offered as collateral',
        required: true,
        format: 'pdf' as const,
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
        ],
        category: 'submission',
        fundingTypes: ['bankLoans']
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
        format: 'pptx' as const,
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
        ],
        category: 'submission',
        fundingTypes: ['equity']
      },
      {
        id: 'cap_table',
        name: 'Cap Table',
        description: 'Current ownership structure and dilution scenarios',
        required: true,
        format: 'xlsx' as const,
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
        ],
        category: 'submission',
        fundingTypes: ['equity']
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
        format: 'pdf' as const,
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
        ],
        category: 'submission',
        fundingTypes: ['visa']
      },
      {
        id: 'proof_of_funds',
        name: 'Proof of Funds',
        description: 'Documentation of financial capacity and investment commitments',
        required: true,
        format: 'pdf' as const,
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
        ],
        category: 'submission',
        fundingTypes: ['visa']
      }
    ]
  }
};

export const MASTER_DOCUMENTS: Record<string, Record<string, DocumentTemplate[]>> = {
  grants: {
    submission: ADDITIONAL_DOCUMENTS.grants.submission as DocumentTemplate[],
    strategy: [],
    review: []
  },
  bankLoans: {
    submission: ADDITIONAL_DOCUMENTS.bankLoans.submission as DocumentTemplate[],
    strategy: [],
    review: []
  },
  equity: {
    submission: ADDITIONAL_DOCUMENTS.equity.submission as DocumentTemplate[],
    strategy: [],
    review: []
  },
  visa: {
    submission: ADDITIONAL_DOCUMENTS.visa.submission as DocumentTemplate[],
    strategy: [],
    review: []
  }
};

// ============================================================================
// TEMPLATE KNOWLEDGE BASE
// ============================================================================

export const TEMPLATE_KNOWLEDGE: Record<string, TemplateKnowledge> = {
  executive_summary: {
    guidance: "Wir empfehlen diese Zusammenfassung erst dann zu verfassen, wenn Sie den gesamten Businessplan erstellt haben. Es sollen die wichtigsten Inhalte aus den jeweiligen Kapiteln komprimiert dargestellt werden.",
    requiredElements: [
      "Compressed representation of most important content from all chapters",
      "Business mission and core problem",
      "Solution concept",
      "Target customers",
      "Funding amount and purpose",
      "Expected impact"
    ],
    bestPractices: [
      "Write after completing entire business plan",
      "Compress key content from all chapters",
      "Make it compelling and clear",
      "Keep it concise (max 20-30 pages total for entire plan)",
      "Write for external readers (funding bodies, incubators, banks)"
    ],
    commonMistakes: [
      "Writing before completing other sections",
      "Including too much detail",
      "Contradictions with other sections",
      "Unrealistic claims"
    ],
    expertQuestions: [
      "Does it accurately reflect all key sections?",
      "Is it compelling enough to grab attention?",
      "Are all key points (problem, solution, market, funding) covered?",
      "Is it free of contradictions?"
    ],
    validation: "Check if it compresses key content from all chapters, covers problem/solution/market/funding, and is compelling"
  },
  product_description: {
    guidance: "Beschreiben Sie detailliert Ihr Produkt- / Dienstleistungsangebot. Wie ist der aktuelle Entwicklungsstand? Liegt bereits ein Prototyp oder Proof of Concept vor? Muss dieser erst entwickelt werden? Oder haben Sie bereits die erste Kleinserie produziert? Gibt es erste Kunden? Beschreiben Sie auch, wie Ihre Produkte oder Dienstleistungen zukunftsfit gestaltet sind und welche nachhaltigen Materialien und Prozesse verwendet werden.",
    requiredElements: [
      "Detailed product/service description",
      "Current development status (prototype, proof of concept, first production run)",
      "Initial customers (if any)",
      "Future-fit design and sustainability aspects",
      "Sustainable materials and processes used"
    ],
    bestPractices: [
      "Be specific about development stage",
      "Mention sustainability aspects",
      "Describe from customer perspective",
      "Include proof of concept or prototype status"
    ],
    commonMistakes: [
      "Vague product description",
      "Not stating development status clearly",
      "Ignoring sustainability aspects",
      "Too technical without customer benefit"
    ],
    expertQuestions: [
      "Is the development status clearly stated?",
      "Are sustainability aspects addressed?",
      "Is it described from customer perspective?",
      "Is there proof of concept or prototype?"
    ],
    validation: "Check if development status is clearly stated, product is described from customer perspective, and sustainability is addressed"
  },
  innovation_technology: {
    guidance: "Falls Sie ein innovatives Produkt oder eine innovative Dienstleistung anbieten, beschreiben Sie bitte den Innovationsgrad. Um welche Art der Innovation handelt es sich: technisch, kreativwirtschaftliche, soziale, Verfahrens- oder Prozessinnovationen? Wie hoch ist der Innovationsgrad im Vergleich zu den am Markt angebotenen Produkten/Dienstleistungen in Österreich oder auch weltweit?",
    requiredElements: [
      "Type of innovation (technical, creative, social, process, procedure)",
      "Innovation level compared to market (Austria and worldwide)",
      "Protection strategy (patents, trademarks, know-how)",
      "Current protection status"
    ],
    frameworks: ["Technology Readiness Level (TRL)"],
    bestPractices: [
      "Clearly define innovation type",
      "Compare with market offerings",
      "Explain protection strategy",
      "State current protection status"
    ],
    commonMistakes: [
      "Claiming innovation without justification",
      "Not comparing with market",
      "No protection strategy",
      "Vague innovation description"
    ],
    expertQuestions: [
      "Is the innovation type clearly defined?",
      "Is it compared with market offerings?",
      "Is there a protection strategy?",
      "What is the current protection status?"
    ],
    validation: "Check if innovation type is defined, compared with market, and protection strategy is explained"
  },
  market_analysis: {
    guidance: "Beschreiben Sie die Branche, in der Sie tätig werden wollen: Die Größe der Branche (Anzahl der Unternehmen), die Struktur der Branche (Betriebsgröße, kleinteilige Strukturen oder wenige Platzhirsche), Besonderheiten und Spielregeln (z.B. Öffnungszeiten, Gratis-Serviceleistungen, Anzahlungen, Stammkundenrabatt, Trends in Bezug auf Preise, Nachfrage. Nützliches Modell: Branchenstrukturanalyse nach Porter (Five Forces). Analysieren Sie auch die Bedeutung von Nachhaltigkeit in Ihrer Branche und wie Sie sich durch nachhaltige Praktiken von Ihren Wettbewerbern abheben.",
    requiredElements: [
      "Industry size (number of companies)",
      "Industry structure (company size, fragmented or few dominant players)",
      "Special characteristics and rules (opening hours, free services, deposits, loyalty discounts, price trends, demand)",
      "Porter Five Forces analysis",
      "Sustainability importance in industry",
      "How sustainable practices differentiate from competitors"
    ],
    frameworks: ["Porter Five Forces", "TAM/SAM/SOM"],
    bestPractices: [
      "Use Porter Five Forces framework",
      "Calculate market size with sources",
      "Analyze industry structure",
      "Address sustainability",
      "Identify market rules and characteristics"
    ],
    commonMistakes: [
      "Not using Porter Five Forces",
      "Overestimating market size without sources",
      "Vague industry structure description",
      "Ignoring sustainability",
      "Not analyzing market rules"
    ],
    expertQuestions: [
      "Is Porter Five Forces properly used?",
      "Is market size realistic and sourced?",
      "Is industry structure clearly described?",
      "Are sustainability aspects addressed?",
      "Are market rules and characteristics identified?"
    ],
    validation: "Check if Porter Five Forces is used, market size is sourced, industry structure is clear, and sustainability is addressed"
  },
  market_opportunity: {
    guidance: "Mit dem Markt ist im Unterschied zur Branche nicht die Summe der Anbieter gemeint, sondern jene der Nachfrager. Wichtige Kenngrößen sind Volumen, Preis, Umsatz und Wachstum. Basierend auf den Marktzahlen leiten Sie das Absatzpotential Ihres Unternehmens ab. Versuchen Sie plausible Einschätzungen für die Zukunft nieder zu schreiben und setzen Sie Ihr Absatzziel für die Einstiegsphase niedriger an, da die Markteroberung schrittweise erfolgen wird.",
    requiredElements: [
      "Market volume, price, revenue, and growth",
      "Sales potential based on market data",
      "Realistic future estimates",
      "Conservative entry-phase sales targets",
      "Gradual market penetration approach"
    ],
    frameworks: ["TAM/SAM/SOM", "Market Sizing"],
    bestPractices: [
      "Distinguish market (demand) from industry (supply)",
      "Use market data (volume, price, revenue, growth)",
      "Set conservative entry-phase targets",
      "Explain gradual penetration approach",
      "Base sales potential on market data"
    ],
    commonMistakes: [
      "Confusing market with industry",
      "Overestimating sales potential",
      "Unrealistic entry-phase targets",
      "No market data cited",
      "Not explaining penetration approach"
    ],
    expertQuestions: [
      "Is market (demand) distinguished from industry (supply)?",
      "Are market data (volume, price, revenue, growth) provided?",
      "Are entry-phase targets conservative?",
      "Is gradual penetration explained?",
      "Is sales potential based on market data?"
    ],
    validation: "Check if market is distinguished from industry, market data is provided, targets are conservative, and penetration approach is explained"
  },
  competitive_landscape: {
    guidance: "Vergleichen Sie Ihr Produkt / Ihre Dienstleistung mit dem Angebot der wichtigsten Mitbewerber. Nutzen Sie die Übersichtstabelle Konkurrenzanalyse auf unserer Website (unter Downloads). Eine umfassende Konkurrenzanalyse hilft Ihnen ihre Stärken und Schwächen im Vergleich zu anderen Unternehmen zu identifizieren und Ihr Angebot zu optimieren.",
    requiredElements: [
      "Comparison with main competitors",
      "Competitive analysis table",
      "Strengths and weaknesses vs competitors",
      "Offer optimization based on analysis"
    ],
    frameworks: ["Competitive Matrix", "SWOT Analysis"],
    bestPractices: [
      "Use competitive analysis table",
      "Compare with main competitors",
      "Identify strengths and weaknesses",
      "Optimize offer based on analysis"
    ],
    commonMistakes: [
      "Not analyzing competitors properly (just listing names)",
      "No competitive comparison table",
      "Not identifying strengths/weaknesses",
      "No optimization based on analysis"
    ],
    expertQuestions: [
      "Are competitors properly analyzed (not just listed)?",
      "Is a competitive analysis table used?",
      "Are strengths and weaknesses identified?",
      "Is offer optimization based on analysis?"
    ],
    validation: "Check if competitors are analyzed (not just listed), competitive table is used, and strengths/weaknesses are identified"
  },
  business_model_value_proposition: {
    guidance: "Beschreiben Sie den Mehrwert, den Sie für Ihre KundInnen generieren. Nehmen Sie Ihren KundInnen Arbeit ab? Sparen Sie ihnen Zeit oder Kosten? Liefen Sie bessere Qualität? Ober überhaupt etwas Neues? Betrachten Sie Ihr Produkt / Ihre Dienstleistung aus der Sicht der KundInnen. Beschreiben Sie den \"Unique Selling Point\" (USP) Ihres Produktes / Ihrer Dienstleistung. Welche Stärken und Schwächen haben Ihre Produkte und/oder Dienstleistung im Vergleich zum Mitbewerb?",
    requiredElements: [
      "Customer value proposition",
      "Unique Selling Point (USP)",
      "Strengths and weaknesses vs competitors",
      "Customer perspective (saves time, costs, better quality, something new)",
      "Why customers should buy from you"
    ],
    frameworks: ["Value Proposition Canvas", "USP Analysis"],
    bestPractices: [
      "Describe from customer perspective",
      "Clearly state USP",
      "Compare strengths/weaknesses with competitors",
      "Explain why customers should buy from you"
    ],
    commonMistakes: [
      "Not describing from customer perspective",
      "Vague USP",
      "Not comparing with competitors",
      "Not explaining differentiation"
    ],
    expertQuestions: [
      "Is it described from customer perspective?",
      "Is USP clearly stated?",
      "Are strengths/weaknesses compared with competitors?",
      "Is differentiation explained?"
    ],
    validation: "Check if described from customer perspective, USP is clear, and strengths/weaknesses are compared with competitors"
  },
  team_qualifications: {
    guidance: "Welche Personen sind Teil des Gründungsteams und über welche Vorerfahrung verfügen diese Personen? Welche Rolle haben die Personen im Unternehmen? Gibt es \"Know How\" das Sie nicht im Team haben? Wenn ja, wie schließen Sie diese Lücke? Durch Vergabe an Externe? Durch Aufnahme von Personal oder zusätzlichen Gesellschaftern? Zeigen Sie auch, wie das Managementteam Nachhaltigkeit in die Unternehmensführung integriert und welche Schulungen und Maßnahmen zur Förderung nachhaltiger Praktiken durchgeführt werden.",
    requiredElements: [
      "Founding team members and their experience",
      "Roles in the company",
      "Knowledge gaps identification",
      "How to close knowledge gaps (external, hiring, partners)",
      "Sustainability integration in management",
      "Training and measures for sustainable practices"
    ],
    bestPractices: [
      "List all founding team members",
      "Describe relevant experience",
      "Identify knowledge gaps",
      "Explain how to close gaps",
      "Address sustainability in management"
    ],
    commonMistakes: [
      "Not listing all team members",
      "Vague experience description",
      "Not identifying knowledge gaps",
      "No plan to close gaps",
      "Ignoring sustainability"
    ],
    expertQuestions: [
      "Are all team members listed with experience?",
      "Are roles clearly defined?",
      "Are knowledge gaps identified?",
      "Is there a plan to close gaps?",
      "Is sustainability addressed?"
    ],
    validation: "Check if all team members are listed with experience, roles are defined, knowledge gaps are identified, and sustainability is addressed"
  },
  financial_plan: {
    guidance: "Wie hoch ist Ihr Gesamtkapitalbedarf aufgrund der zuvor durchgeführten Berechnungen? Welche Finanzierungsquellen können Sie zur Deckung des Finanzbedarfs verwenden? Neben den Gründungskosten wie z.B. Anwalts- und Steuerkosten fallen Investitionen an um Ihr Unternehmen überhaupt in Betrieb zu setzen. Welche Investitionen sind notwendig, um erste Umsätze zu erzielen? Beschreiben Sie auch, wie nachhaltige Investitionen und Technologien langfristige Kosteneinsparungen und Effizienzsteigerungen ermöglichen. Berücksichtigen Sie ökologische und soziale Risiken in Ihrer Finanzplanung.",
    requiredElements: [
      "Total capital requirement",
      "Financing sources",
      "Startup costs (legal, tax, etc.)",
      "Investment costs to start operations",
      "Investments needed for first revenue",
      "Sustainable investments and technologies",
      "Long-term cost savings and efficiency gains",
      "Ecological and social risks in financial planning"
    ],
    frameworks: ["Financial Projections", "Cost Breakdown", "Funding Sources"],
    bestPractices: [
      "Calculate total capital requirement",
      "List all financing sources",
      "Include startup and investment costs",
      "Address sustainable investments",
      "Consider ecological and social risks"
    ],
    commonMistakes: [
      "Unrealistic capital requirements",
      "Missing financing sources",
      "Not including all costs",
      "Ignoring sustainability",
      "Not considering risks"
    ],
    expertQuestions: [
      "Is total capital requirement realistic?",
      "Are all financing sources listed?",
      "Are all costs included?",
      "Are sustainable investments addressed?",
      "Are ecological and social risks considered?"
    ],
    validation: "Check if capital requirement is realistic, financing sources are listed, all costs are included, and sustainability/risks are addressed"
  },
  preliminary_financial_overview: {
    guidance: "Mit welchen Produktionskosten bzw. Wareneinsatz rechnen Sie? Mit welchen sonstigen laufenden Kosten rechnen Sie? Welchen Personalbedarf und welche Personalkosten erwarten Sie? Wie hoch ist Ihr Unternehmerlohn? (Kosten innerhalb der nächsten 3-5 Geschäftsjahre.) Beachten Sie auch die Sozialversicherungsbeiträge und die Abgaben ans Finanzamt. Anhand Ihres ermittelten Absatzpotential in Kapitel 3.2. Markt und Absatzpotential können Sie die Ihren Absatz/Umsatz planen. Die Planung muss realistisch und nachvollziehbar sein.",
    requiredElements: [
      "Production costs / cost of goods",
      "Other operating costs",
      "Personnel requirements and costs",
      "Entrepreneur salary",
      "Social security contributions",
      "Tax obligations",
      "Sales/revenue planning based on sales potential",
      "Realistic and comprehensible planning"
    ],
    frameworks: ["Cost Breakdown", "Revenue Projections", "P&L Statement"],
    bestPractices: [
      "Break down all costs",
      "Include personnel and entrepreneur salary",
      "Consider social security and taxes",
      "Base revenue on sales potential",
      "Keep planning realistic and comprehensible"
    ],
    commonMistakes: [
      "Missing cost categories",
      "Forgetting social security and taxes",
      "Unrealistic revenue projections",
      "Not based on sales potential",
      "Incomprehensible planning"
    ],
    expertQuestions: [
      "Are all costs included?",
      "Are social security and taxes considered?",
      "Are revenue projections realistic?",
      "Is planning based on sales potential?",
      "Is planning comprehensible?"
    ],
    validation: "Check if all costs are included, revenue is realistic and based on sales potential, and planning is comprehensible"
  },
  risk_assessment: {
    guidance: "Gibt es rechtliche, wirtschaftliche oder regionale etc. Markteintrittsbarrieren und wie wollen Sie damit umgehen? Bestehen Abhängigkeiten zu Lieferanten, Kunden oder Mitbewerbern wie z.B., dass nur ein Produktionsunternehmen Ihr Produkt erstellen kann?",
    requiredElements: [
      "Market entry barriers (legal, economic, regional)",
      "How to handle barriers",
      "Dependencies on suppliers, customers, or competitors",
      "Risk mitigation strategies"
    ],
    frameworks: ["Risk Matrix", "SWOT Analysis"],
    bestPractices: [
      "Identify all market entry barriers",
      "Explain how to handle barriers",
      "Identify dependencies",
      "Provide mitigation strategies"
    ],
    commonMistakes: [
      "Not identifying barriers",
      "No plan to handle barriers",
      "Not identifying dependencies",
      "No mitigation strategies"
    ],
    expertQuestions: [
      "Are all barriers identified?",
      "Is there a plan to handle barriers?",
      "Are dependencies identified?",
      "Are mitigation strategies provided?"
    ],
    validation: "Check if barriers are identified, there's a plan to handle them, dependencies are identified, and mitigation strategies are provided"
  },
  go_to_market: {
    guidance: "Stellen Sie Ihre Marketingstrategie mit den daraus abgeleiteten Marketingmaßen (inkl. Markteintrittsstrategie dar. Welche Kommunikationskanäle und Werbemittel wollen Sie nutzen? Erläutern Sie auch, wie Nachhaltigkeit in Ihre Marketing- und Vertriebsstrategien integriert ist und wie Sie Ihre nachhaltigen Initiativen kommunizieren. Stellen Sie Ihre Vertriebsstrategie mit den daraus abgeleiteten vertrieblichen Maßnahmen dar. Wie wollen Sie Ihr Produkt / Ihre Dienstleistung verkaufen (Online Shop, Geschäftslokal, über Dritte, ….)?",
    requiredElements: [
      "Marketing strategy and measures",
      "Market entry strategy",
      "Communication channels and advertising",
      "Sustainability in marketing and sales",
      "How to communicate sustainable initiatives",
      "Sales strategy and measures",
      "Sales channels (online shop, physical location, third parties)"
    ],
    frameworks: ["Go-to-Market Strategy", "Marketing Mix"],
    bestPractices: [
      "Define marketing strategy",
      "Identify communication channels",
      "Address sustainability",
      "Define sales channels",
      "Explain market entry strategy"
    ],
    commonMistakes: [
      "Vague marketing strategy",
      "No communication channels defined",
      "Ignoring sustainability",
      "No sales channels defined",
      "No market entry strategy"
    ],
    expertQuestions: [
      "Is marketing strategy clearly defined?",
      "Are communication channels identified?",
      "Is sustainability addressed?",
      "Are sales channels defined?",
      "Is market entry strategy explained?"
    ],
    validation: "Check if marketing and sales strategies are defined, channels are identified, and sustainability is addressed"
  },
  timeline_milestones: {
    guidance: "Welche einzelnen Schritte haben Sie innerhalb der nächsten Jahre zur erfolgreichen Etablierung Ihres Unternehmens geplant (Personal, Standort, …)? Welche Meilensteine haben Sie festgelegt? Bis zu welchen Terminen möchten Sie Ihre Planungsmaßnahmen konkret umgesetzt haben (Fertigstellung des Produktes, Finanzierungen abgeschlossen, Gewerbeberechtigung erhalten, …)? Welche Aufgaben und Meilensteine hängen direkt voneinander ab? Welcher ist der kritische Pfad bei der Umsetzung bzw. Start-up Phase? Welche Meilensteine habe Sie für die Nachgründungsphase geplant?",
    requiredElements: [
      "Steps for company establishment (personnel, location, etc.)",
      "Milestones with dates",
      "Concrete implementation dates (product completion, financing, permits, etc.)",
      "Task and milestone dependencies",
      "Critical path for implementation/startup phase",
      "Post-founding phase milestones"
    ],
    frameworks: ["Gantt Chart", "Critical Path Method", "SMART Goals"],
    bestPractices: [
      "Define clear milestones with dates",
      "Identify dependencies",
      "Determine critical path",
      "Plan post-founding phase",
      "Set SMART goals"
    ],
    commonMistakes: [
      "Vague milestones without dates",
      "No dependencies identified",
      "No critical path",
      "Unrealistic timelines",
      "No post-founding planning"
    ],
    expertQuestions: [
      "Are milestones clearly defined with dates?",
      "Are dependencies identified?",
      "Is critical path determined?",
      "Are timelines realistic?",
      "Is post-founding phase planned?"
    ],
    validation: "Check if milestones have dates, dependencies are identified, critical path is determined, and timelines are realistic"
  },
  project_description: {
    guidance: "Was sind die Kernaufgaben Ihres Unternehmens? Welches Geschäftsmodell haben Sie vorgesehen? SWOT-Analyse: Identifizieren Sie Stärken und Schwächen im Verhältnis zu Ihren Konkurrenten. Setzen Sie diese Stärken und Schwächen den Trends gegenüber, so ergeben sich Chancen und Risiken für Ihr Geschäftsmodell und leiten Sie gegebenenfalls Maßnahmen ab.",
    requiredElements: [
      "Core tasks of the company",
      "Business model",
      "SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats)",
      "Measures derived from SWOT"
    ],
    frameworks: ["SWOT Analysis", "Business Model Canvas"],
    bestPractices: [
      "Define core tasks",
      "Explain business model",
      "Conduct SWOT analysis",
      "Derive measures from SWOT"
    ],
    commonMistakes: [
      "Vague core tasks",
      "No business model explanation",
      "Incomplete SWOT analysis",
      "No measures derived from SWOT"
    ],
    expertQuestions: [
      "Are core tasks clearly defined?",
      "Is business model explained?",
      "Is SWOT analysis complete?",
      "Are measures derived from SWOT?"
    ],
    validation: "Check if core tasks are defined, business model is explained, SWOT is complete, and measures are derived"
  }
};

export function getTemplateKnowledge(sectionId: string): TemplateKnowledge | undefined {
  return TEMPLATE_KNOWLEDGE[sectionId];
}

export function getAllFrameworks(): string[] {
  const frameworks = new Set<string>();
  Object.values(TEMPLATE_KNOWLEDGE).forEach(knowledge => {
    knowledge.frameworks?.forEach(framework => frameworks.add(framework));
  });
  return Array.from(frameworks);
}

export function getExpertQuestions(sectionId: string): string[] {
  return TEMPLATE_KNOWLEDGE[sectionId]?.expertQuestions || [];
}

// ============================================================================
// TEMPLATE REGISTRY API
// ============================================================================

export async function getSections(
  _fundingType: string,
  productType: string = 'submission',
  _programId?: string,
  _baseUrl?: string
): Promise<SectionTemplate[]> {
  return MASTER_SECTIONS[productType] || MASTER_SECTIONS.submission;
}

export async function getDocuments(
  fundingType: string,
  productType: string,
  programId?: string,
  baseUrl?: string
): Promise<DocumentTemplate[]> {
  const masterDocs = MASTER_DOCUMENTS[fundingType]?.[productType] || [];
  
  if (programId) {
    const programDocs = await loadProgramDocuments(programId, baseUrl);
    if (programDocs.length > 0) {
      return mergeDocuments(masterDocs, programDocs);
    }
  }
  
  return masterDocs;
}

export async function getDocument(
  fundingType: string,
  productType: string,
  docId: string,
  programId?: string,
  baseUrl?: string
): Promise<DocumentTemplate | undefined> {
  const docs = await getDocuments(fundingType, productType, programId, baseUrl);
  return docs.find((d: DocumentTemplate) => d.id === docId);
}

export async function getSection(
  fundingType: string,
  sectionId: string,
  productType: string = 'submission',
  programId?: string,
  baseUrl?: string
): Promise<SectionTemplate | undefined> {
  const sections = await getSections(fundingType, productType, programId, baseUrl);
  return sections.find((s: SectionTemplate) => s.id === sectionId);
}

function mergeDocuments(
  masterDocuments: DocumentTemplate[],
  programDocuments: DocumentTemplate[]
): DocumentTemplate[] {
  const merged: DocumentTemplate[] = [];
  const programById = new Map(programDocuments.map(d => [d.id, d]));
  
  for (const master of masterDocuments) {
    const override = programById.get(master.id);
    if (override) {
      merged.push({
        ...master,
        ...override,
        source: {
          verified: override.source?.verified ?? master.source?.verified ?? false,
          verifiedDate: override.source?.verifiedDate || master.source?.verifiedDate,
          officialProgram: override.source?.officialProgram || master.source?.officialProgram,
          sourceUrl: override.source?.sourceUrl || master.source?.sourceUrl,
          version: override.source?.version || master.source?.version
        }
      });
      programById.delete(master.id);
    } else {
      merged.push(master);
    }
  }
  
  for (const programDoc of programById.values()) {
    merged.push(programDoc);
  }
  
  return merged;
}

async function loadProgramDocuments(programId: string, baseUrl?: string): Promise<DocumentTemplate[]> {
  try {
    const apiUrl = baseUrl 
      ? `${baseUrl}/api/programs/${programId}/requirements`
      : typeof window !== 'undefined' 
        ? `/api/programs/${programId}/requirements`
        : `http://localhost:3000/api/programs/${programId}/requirements`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) return [];
    
    const data = await response.json();
    const categorizedRequirements = data.categorized_requirements;
    
    if (!categorizedRequirements || !categorizedRequirements.documents) return [];
    
    const documents = categorizedRequirements.documents as Array<{
      value: string | string[];
      description?: string;
      format?: string;
      required?: boolean;
      requirements?: string[];
    }>;
    
    return documents.map((doc, idx) => {
      const value = Array.isArray(doc.value) ? doc.value.join(', ') : doc.value;
      const docId = `prog_doc_${idx}`;
      
      return {
        id: docId,
        name: value || 'Required Document',
        description: doc.description || value || '',
        required: doc.required !== false,
        format: (doc.format?.toLowerCase() as any) || 'pdf',
        maxSize: '10MB',
        template: `# ${value}\n\n## Document Description\n${doc.description || 'Program-specific required document.'}\n\n## Requirements\n${doc.requirements ? doc.requirements.map(r => `- ${r}`).join('\n') : '- Please provide as required by program'}`,
        instructions: doc.requirements || ['Follow program-specific requirements'],
        examples: [],
        commonMistakes: [],
        category: 'submission',
        fundingTypes: [data.program_type || 'grants'],
        source: {
          verified: true,
          verifiedDate: new Date().toISOString(),
          officialProgram: data.program_name
        }
      };
    });
  } catch (error) {
    console.error('Error loading program documents:', error);
    return [];
  }
}

