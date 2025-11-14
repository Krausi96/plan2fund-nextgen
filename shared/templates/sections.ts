// ========= PLAN2FUND - MASTER SECTION TEMPLATES =========
// Master templates - base structure for all programs
// Program-specific sections override these
// UPDATED: High-quality templates based on official sources (Horizon Europe, FFG, WKO, Sequoia, etc.)

import { SectionTemplate } from './types';

// Type alias for backward compatibility (categoryConverters uses this)
export type StandardSection = SectionTemplate;

/*
 * MASTER_SECTIONS defines the canonical section structures for different types of
 * funding applications.  Each key in the exported object represents a funding
 * modality - grants, bank loans, equity investments or business-visa oriented
 * plans—and maps to an ordered array of SectionTemplate definitions.  These
 * templates were derived from the common denominators found in official
 * application forms and guidance documents, including the Horizon Europe
 * proposal template (which divides the narrative into "Excellence", "Impact"
 * and "Implementation" sections with subsections for objectives, methodology
 * and work plan), the Austrian FFG Basisprogramm project description template
 * (which covers firm description, project goals, state of the art, novelty,
 * benefits, risks, resources, market and socio‑economic aspects), the WKO
 * business plan guidance (which emphasises an executive summary, product/service
 * description, market and competition analysis, marketing and sales, management
 * team, financial planning and implementation milestones), the Sequoia Capital
 * pitch deck structure (which recommends slides on company purpose, problem,
 * solution, market size, product, business model, go‑to‑market strategy,
 * competitive analysis, traction, team, financials and vision), and the Austrian
 * Red‑White‑Red Card requirements for start‑up founders (which call for a
 * consistent business plan demonstrating innovative products or services and
 * proof of capital and management control).  Word count ranges have been
 * chosen to reflect typical limits in these programmes: grants often allow
 * narratives of 200-1000 words per section, bank loan applications favour
 * concise descriptions of 300-800 words, equity pitches aim for succinct
 * overviews of 150-500 words, and business-visa applications usually fall
 * between 200-600 words.  Validation rules specify mandatory content fields
 * and formatting requirements to ensure completeness and clarity.
 */

// Helper function to create Strategy sections for a funding type
function createStrategySections(fundingType: 'grants' | 'bankLoans' | 'equity' | 'visa'): SectionTemplate[] {
  const baseConfig = {
    grants: {
      executiveSummary: {
        title: 'Executive Summary',
        description: 'Provide a concise overview of your project idea and funding goals. Summarise the core problem, your solution concept and potential impact.',
        prompts: [
          'What is your business mission?',
          'What problem are you solving?',
          'Who are your target customers?',
          'How much funding do you seek?'
        ]
      },
      marketOpportunity: {
        title: 'Market Opportunity',
        description: 'Describe the market size, trends, and unmet needs. Identify your target customer segments.',
        prompts: [
          'Who is the target market?',
          'How large is the market?',
          'What trends support your opportunity?',
          'What unmet needs exist?'
        ]
      },
      businessModel: {
        title: 'Business Model & Value Proposition',
        description: 'Outline how your business will generate revenue, pricing strategy, and value delivered to customers.',
        prompts: [
          'How will you make money?',
          'What are your main revenue streams?',
          'What value do you offer that competitors do not?',
          'What is your cost structure?'
        ]
      },
      competitiveLandscape: {
        title: 'Competitive Landscape',
        description: 'Identify key competitors and differentiate your offering.',
        prompts: [
          'Who are your main competitors?',
          'What are their strengths?',
          'How is your solution different or better?'
        ]
      },
      financialOverview: {
        title: 'Preliminary Financial Overview',
        description: 'Provide high-level financial assumptions including costs, revenue potential, and funding needed.',
        prompts: [
          'What are your expected revenue streams?',
          'What are your major cost drivers?',
          'How much funding is needed to reach the next milestone?'
        ]
      }
    },
    bankLoans: {
      executiveSummary: {
        title: 'Executive Summary',
        description: 'Introduce your business idea and financing needs. Summarise the opportunity and funding request.',
        prompts: [
          'What is your business idea?',
          'What financing do you need?',
          'How will you use the loan?',
          'How will you repay it?'
        ]
      },
      marketOpportunity: {
        title: 'Market Opportunity',
        description: 'Describe the market size, trends, and customer demand for your business.',
        prompts: [
          'Who are your target customers?',
          'How large is the market?',
          'What trends support demand?',
          'Why is now the right time?'
        ]
      },
      businessModel: {
        title: 'Business Model & Value Proposition',
        description: 'Explain how your business will generate revenue and deliver value to customers.',
        prompts: [
          'How will you make money?',
          'What are your revenue streams?',
          'What makes your offering unique?',
          'How will you price your products/services?'
        ]
      },
      competitiveLandscape: {
        title: 'Competitive Landscape',
        description: 'Identify competitors and explain your competitive advantage.',
        prompts: [
          'Who are your main competitors?',
          'What are their strengths and weaknesses?',
          'How will you compete?'
        ]
      },
      financialOverview: {
        title: 'Preliminary Financial Overview',
        description: 'Provide high-level financial projections and funding requirements.',
        prompts: [
          'What are your revenue projections?',
          'What are your main costs?',
          'How much funding do you need?',
          'How will you repay the loan?'
        ]
      }
    },
    equity: {
      executiveSummary: {
        title: 'Executive Summary',
        description: 'Provide a concise overview of your startup idea, market opportunity, and funding needs.',
        prompts: [
          'What problem does your startup solve?',
          'What is your solution?',
          'Who are your target customers?',
          'How much funding do you seek?'
        ]
      },
      marketOpportunity: {
        title: 'Market Opportunity',
        description: 'Describe the market size, growth potential, and customer segments.',
        prompts: [
          'How large is the addressable market?',
          'What is the market growth rate?',
          'Who are your target customers?',
          'Why is this opportunity attractive?'
        ]
      },
      businessModel: {
        title: 'Business Model & Value Proposition',
        description: 'Explain your revenue model, pricing strategy, and unique value proposition.',
        prompts: [
          'How will you generate revenue?',
          'What is your pricing strategy?',
          'What makes your solution unique?',
          'What is your unit economics?'
        ]
      },
      competitiveLandscape: {
        title: 'Competitive Landscape',
        description: 'Identify competitors and explain your differentiation strategy.',
        prompts: [
          'Who are your main competitors?',
          'What are their strengths?',
          'How will you differentiate?',
          'What is your competitive moat?'
        ]
      },
      financialOverview: {
        title: 'Preliminary Financial Overview',
        description: 'Provide high-level financial projections and funding requirements.',
        prompts: [
          'What are your revenue projections?',
          'What are your key costs?',
          'How much funding do you need?',
          'What is your path to profitability?'
        ]
      }
    },
    visa: {
      executiveSummary: {
        title: 'Executive Summary',
        description: 'Provide a concise overview of your business idea and plans for Austria.',
        prompts: [
          'What is your business idea?',
          'Why do you want to establish in Austria?',
          'What makes your idea innovative?',
          'How much capital do you have?'
        ]
      },
      marketOpportunity: {
        title: 'Market Opportunity',
        description: 'Describe the market opportunity in Austria and your target customers.',
        prompts: [
          'Who are your target customers in Austria?',
          'What is the market size?',
          'Why is Austria the right market?',
          'What trends support your opportunity?'
        ]
      },
      businessModel: {
        title: 'Business Model & Value Proposition',
        description: 'Explain how your business will operate and generate revenue in Austria.',
        prompts: [
          'How will you make money?',
          'What are your revenue streams?',
          'What value do you offer?',
          'How will you price your products/services?'
        ]
      },
      competitiveLandscape: {
        title: 'Competitive Landscape',
        description: 'Identify competitors in Austria and explain your competitive advantage.',
        prompts: [
          'Who are your competitors in Austria?',
          'What are their strengths?',
          'How will you compete?',
          'What makes you unique?'
        ]
      },
      financialOverview: {
        title: 'Preliminary Financial Overview',
        description: 'Provide high-level financial assumptions and funding requirements.',
        prompts: [
          'What are your revenue projections?',
          'What are your main costs?',
          'How much capital do you have available?',
          'How much funding do you need?'
        ]
      }
    }
  };

  const config = baseConfig[fundingType];
  
  return [
    {
      id: 'executive_summary',
      title: config.executiveSummary.title,
      description: config.executiveSummary.description,
      required: true,
      wordCountMin: 200,
      wordCountMax: 300,
      order: 1,
      category: 'general',
      prompts: config.executiveSummary.prompts,
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
        verifiedDate: '2025-01-03',
        officialProgram: 'Strategic Planning Best Practices',
        sourceUrl: '',
        version: '1.0'
      }
    },
    {
      id: 'market_opportunity',
      title: config.marketOpportunity.title,
      description: config.marketOpportunity.description,
      required: true,
      wordCountMin: 150,
      wordCountMax: 300,
      order: 2,
      category: 'market',
      prompts: config.marketOpportunity.prompts,
      validationRules: {
        requiredFields: ['market_size', 'target_customers', 'market_trends'],
        formatRequirements: ['data_citation', 'market_analysis']
      },
      source: {
        verified: true,
        verifiedDate: '2025-01-03',
        officialProgram: 'Strategic Planning Best Practices',
        sourceUrl: '',
        version: '1.0'
      }
    },
    {
      id: 'business_model_value_proposition',
      title: config.businessModel.title,
      description: config.businessModel.description,
      required: true,
      wordCountMin: 150,
      wordCountMax: 350,
      order: 3,
      category: 'business',
      prompts: config.businessModel.prompts,
      validationRules: {
        requiredFields: ['revenue_streams', 'value_proposition', 'cost_structure'],
        formatRequirements: ['clear_business_model', 'pricing_strategy']
      },
      source: {
        verified: true,
        verifiedDate: '2025-01-03',
        officialProgram: 'Strategic Planning Best Practices',
        sourceUrl: '',
        version: '1.0'
      }
    },
    {
      id: 'competitive_landscape',
      title: config.competitiveLandscape.title,
      description: config.competitiveLandscape.description,
      required: true,
      wordCountMin: 150,
      wordCountMax: 300,
      order: 4,
      category: 'market',
      prompts: config.competitiveLandscape.prompts,
      validationRules: {
        requiredFields: ['competitor_analysis', 'competitive_advantage'],
        formatRequirements: ['differentiation_clear', 'competitive_positioning']
      },
      source: {
        verified: true,
        verifiedDate: '2025-01-03',
        officialProgram: 'Strategic Planning Best Practices',
        sourceUrl: '',
        version: '1.0'
      }
    },
    {
      id: 'preliminary_financial_overview',
      title: config.financialOverview.title,
      description: config.financialOverview.description,
      required: true,
      wordCountMin: 150,
      wordCountMax: 300,
      order: 5,
      category: 'financial',
      prompts: config.financialOverview.prompts,
      validationRules: {
        requiredFields: ['revenue_assumptions', 'cost_assumptions', 'funding_need'],
        formatRequirements: ['realistic_numbers', 'financial_justification']
      },
      source: {
        verified: true,
        verifiedDate: '2025-01-03',
        officialProgram: 'Strategic Planning Best Practices',
        sourceUrl: '',
        version: '1.0'
      }
    },
    {
      id: 'funding_fit_eligibility',
      title: 'Funding Fit & Eligibility',
      description: 'Analyse which funding programs (FFG Basisprogramm, AWS Preseed, bank loan, equity, visa) are most suitable for your project. Reference eligibility criteria such as innovation level, funding amounts, and personal qualifications.',
      required: true,
      wordCountMin: 150,
      wordCountMax: 250,
      order: 6,
      category: 'general',
      prompts: [
        'Which Austrian grant programs match your project?',
        'Does your idea involve R&D or innovation?',
        'Do you have the required capital for a visa?',
        'Are you seeking debt or equity?'
      ],
      validationRules: {
        requiredFields: ['program_match', 'eligibility_assessment'],
        formatRequirements: ['at_least_one_match', 'gap_identification']
      },
      source: {
        verified: true,
        verifiedDate: '2025-01-03',
        officialProgram: 'FFG Basisprogramm / AWS Preseed',
        sourceUrl: 'https://www.ffg.at/',
        version: '1.0'
      }
    }
  ];
}

// Store full sections for review/submission (they're the same)
const FULL_SECTIONS_GRANTS: SectionTemplate[] = [
  /**
   * Sections for grant applications.  These templates are aligned with EU
   * research programmes and national funding bodies like FFG and AWS.  They
   * emphasise a detailed project narrative, clear impact pathways and
   * comprehensive resource planning.
   */
    {
      id: 'executive_summary',
      title: 'Executive Summary',
      description:
        'Provide a concise overview of the project and funding request. Summarise the core problem, your innovative solution and the expected impact.',
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
        verifiedDate: '2025-11-04',
        officialProgram: 'WKO Businessplan Guide',
        sourceUrl: 'https://www.wko.at/gruendung/inhalte-businessplan',
        version: '1.0'
      }
    },
    {
      id: 'project_description',
      title: 'Project Description',
      description:
        'Detail the objectives, scope and methodology of the project. Explain what you plan to do and why it is necessary.',
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
        requiredFields: [
          'objectives',
          'state_of_the_art',
          'methodology',
          'expected_outcomes'
        ],
        formatRequirements: ['structured_subsections', 'evidence_of_need']
      },
      source: {
        verified: true,
        verifiedDate: '2025-11-04',
        officialProgram: 'FFG Basisprogramm – Projektbeschreibung',
        sourceUrl: 'https://www.ffg.at/sites/default/files/downloads/bpprojektbeschreibung_v1-2018_muster.pdf',
        version: '1.0'
      }
    },
    {
      id: 'innovation_technology',
      title: 'Innovation & Technology',
      description:
        'Explain the innovative aspects and technological foundations of the project. Position your project within the spectrum from idea to application.',
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
        requiredFields: [
          'novelty',
          'state_of_the_art_comparison',
          'protection_strategy',
          'technical_risks'
        ],
        formatRequirements: ['evidence_based_claims', 'risk_mitigation_plan']
      },
      source: {
        verified: true,
        verifiedDate: '2025-11-04',
        officialProgram: 'Horizon Europe RIA/IA Application Form',
        sourceUrl: 'https://ec.europa.eu/info/funding-tenders/opportunities/docs/2021-2027/horizon/temp-form/af/af_he-ria-ia_en.pdf',
        version: '1.0'
      }
    },
    {
      id: 'impact_assessment',
      title: 'Impact Assessment',
      description:
        'Describe the expected economic, social and environmental impacts of the project. Explain who will benefit and how you will measure success.',
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
        requiredFields: [
          'target_beneficiaries',
          'economic_impact',
          'social_environmental_impact',
          'impact_metrics'
        ],
        formatRequirements: ['quantifiable_metrics', 'alignment_with_policy']
      },
      source: {
        verified: true,
        verifiedDate: '2025-11-04',
        officialProgram: 'Horizon Europe Impact Section',
        sourceUrl: 'https://ec.europa.eu/info/funding-tenders/opportunities/docs/2021-2027/horizon/temp-form/af/af_he-ria-ia_en.pdf',
        version: '1.0'
      }
    },
    {
      id: 'consortium_partners',
      title: 'Consortium Partners',
      description:
        'List and describe the partners involved in the project, their roles and the value they bring. Highlight collaboration and governance arrangements.',
      required: false,
      wordCountMin: 200,
      wordCountMax: 600,
      order: 5,
      category: 'consortium',
      prompts: [
        'Identify all consortium partners, including companies, universities and other organisations.',
        'Describe the specific role of each partner and how their expertise contributes to the project objectives.',
        'Explain the management and decision‑making structure of the consortium.',
        'Provide information on existing agreements or memoranda of understanding.'
      ],
      validationRules: {
        requiredFields: ['partner_list', 'roles', 'governance_structure'],
        formatRequirements: ['clear_partner_roles', 'collaboration_evidence']
      },
      source: {
        verified: true,
        verifiedDate: '2025-11-04',
        officialProgram: 'Horizon Europe Implementation Section',
        sourceUrl: 'https://ec.europa.eu/info/funding-tenders/opportunities/docs/2021-2027/horizon/temp-form/af/af_he-ria-ia_en.pdf',
        version: '1.0'
      }
    },
    {
      id: 'financial_plan',
      title: 'Financial Plan',
      description:
        'Provide a detailed budget and financing plan. Outline costs, funding requested, co‑financing and expected revenue or savings.',
      required: true,
      wordCountMin: 300,
      wordCountMax: 800,
      order: 6,
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
        verifiedDate: '2025-11-04',
        officialProgram: 'FFG Basisprogramm – Projektbeschreibung',
        sourceUrl: 'https://www.ffg.at/sites/default/files/downloads/bpprojektbeschreibung_v1-2018_muster.pdf',
        version: '1.0'
      }
    },
    {
      id: 'market_analysis',
      title: 'Market Analysis',
      description:
        'Analyse the market context for your project. Provide data on market size, trends, competition and customer segments.',
      required: true,
      wordCountMin: 300,
      wordCountMax: 700,
      order: 7,
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
        verifiedDate: '2025-11-04',
        officialProgram: 'WKO Businessplan Guide',
        sourceUrl: 'https://www.wko.at/gruendung/inhalte-businessplan',
        version: '1.0'
      }
    },
    {
      id: 'team_qualifications',
      title: 'Team & Qualifications',
      description:
        'Present the project team, their roles and qualifications. Highlight relevant experience and capacity to deliver the project.',
      required: true,
      wordCountMin: 200,
      wordCountMax: 600,
      order: 8,
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
        verifiedDate: '2025-11-04',
        officialProgram: 'WKO Businessplan Guide',
        sourceUrl: 'https://www.wko.at/gruendung/inhalte-businessplan',
        version: '1.0'
      }
    },
    {
      id: 'risk_assessment',
      title: 'Risk Assessment',
      description:
        'Identify potential risks (technical, financial, market or operational) and describe mitigation strategies.',
      required: true,
      wordCountMin: 200,
      wordCountMax: 600,
      order: 9,
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
        verifiedDate: '2025-11-04',
        officialProgram: 'FFG Basisprogramm – Projektbeschreibung',
        sourceUrl: 'https://www.ffg.at/sites/default/files/downloads/bpprojektbeschreibung_v1-2018_muster.pdf',
        version: '1.0'
      }
    },
    {
      id: 'timeline_milestones',
      title: 'Timeline & Milestones',
      description:
        'Provide a schedule of your project with key milestones and deliverables. Include start and end dates for major tasks.',
      required: true,
      wordCountMin: 200,
      wordCountMax: 500,
      order: 10,
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
        verifiedDate: '2025-11-04',
        officialProgram: 'Horizon Europe Implementation Section',
        sourceUrl: 'https://ec.europa.eu/info/funding-tenders/opportunities/docs/2021-2027/horizon/temp-form/af/af_he-ria-ia_en.pdf',
        version: '1.0'
      }
    }
];

// Store full sections for bank loans (review/submission)
const FULL_SECTIONS_BANKLOANS: SectionTemplate[] = [
  /**
   * Sections for bank loan applications.  This template focuses on providing
   * lenders with a comprehensive understanding of the borrower's business, the
   * project to be financed, the ability to repay and the associated risks.  It
   * draws on typical bank requirements such as detailed financial plans and
   * repayment schedules.
   */
    {
      id: 'executive_summary',
      title: 'Executive Summary',
      description:
        'Introduce your company and the financing request. Summarise the business opportunity, amount requested and repayment outlook.',
      required: true,
      wordCountMin: 200,
      wordCountMax: 400,
      order: 1,
      category: 'general',
      prompts: [
        'Provide a concise overview of your business and the purpose of the loan.',
        'State the amount of financing requested and how it will be used.',
        'Highlight key financial indicators (revenue, profitability, growth).',
        'Explain how the loan aligns with your strategic objectives.'
      ],
      validationRules: {
        requiredFields: ['business_overview', 'loan_purpose', 'funding_amount', 'financial_highlights'],
        formatRequirements: ['concise_summary', 'clear_ask']
      },
      source: {
        verified: true,
        verifiedDate: '2025-11-04',
        officialProgram: 'WKO Businessplan Guide',
        sourceUrl: 'https://www.wko.at/gruendung/inhalte-businessplan',
        version: '1.0'
      }
    },
    {
      id: 'project_description',
      title: 'Business & Project Description',
      description:
        'Describe your business model and the specific project or investment to be financed. Provide context on history and operations.',
      required: true,
      wordCountMin: 300,
      wordCountMax: 700,
      order: 2,
      category: 'project',
      prompts: [
        'Summarise your company\'s history, products/services and market positioning.',
        'Describe the project or investment for which the loan is sought (e.g., expansion, equipment, working capital).',
        'Explain why the project is necessary and how it will strengthen the business.',
        'Provide timelines for implementation and expected outcomes.'
      ],
      validationRules: {
        requiredFields: ['company_description', 'project_purpose', 'justification', 'implementation_timeline'],
        formatRequirements: ['structured_narrative', 'business_context']
      },
      source: {
        verified: true,
        verifiedDate: '2025-11-04',
        officialProgram: 'Bank Loan Application Best Practices',
        sourceUrl: 'https://www.wko.at/gruendung/inhalte-businessplan',
        version: '1.0'
      }
    },
    {
      id: 'financial_plan',
      title: 'Financial Plan & Projections',
      description:
        'Provide historical financial statements and future projections. Demonstrate the company\'s ability to service the loan.',
      required: true,
      wordCountMin: 300,
      wordCountMax: 700,
      order: 3,
      category: 'financial',
      prompts: [
        'Summarise your last three years of financial statements (balance sheet, income statement, cash flow).',
        'Provide financial projections for the next three to five years, including revenue, expenses and profitability.',
        'Explain key assumptions behind your projections (market growth, pricing, cost structures).',
        'Describe how the loan will impact your financial position and cash flow.'
      ],
      validationRules: {
        requiredFields: ['historical_financials', 'projections', 'assumptions', 'loan_impact'],
        formatRequirements: ['financial_tables', 'assumption_rationale']
      },
      source: {
        verified: true,
        verifiedDate: '2025-11-04',
        officialProgram: 'Standard Bank Loan Requirements',
        sourceUrl: 'https://www.bankaustria.at/en/corporate-customers-working-capital-loan.jsp',
        version: '1.0'
      }
    },
    {
      id: 'market_analysis',
      title: 'Market & Competition',
      description:
        'Analyse the market environment for your business. Discuss market size, competition and trends relevant to lenders.',
      required: true,
      wordCountMin: 200,
      wordCountMax: 600,
      order: 4,
      category: 'market',
      prompts: [
        'Describe the market you operate in and its growth prospects.',
        'Identify main competitors and explain your competitive advantage.',
        'Discuss market trends that may affect your business positively or negatively.',
        'Provide evidence of customer demand and sales pipeline.'
      ],
      validationRules: {
        requiredFields: ['market_size', 'competition', 'market_trends', 'customer_demand'],
        formatRequirements: ['market_data', 'competitive_differentiation']
      },
      source: {
        verified: true,
        verifiedDate: '2025-11-04',
        officialProgram: 'WKO Businessplan Guide',
        sourceUrl: 'https://www.wko.at/gruendung/inhalte-businessplan',
        version: '1.0'
      }
    },
    {
      id: 'team_qualifications',
      title: 'Management & Organisation',
      description:
        'Introduce the management team and organisational structure. Convince lenders of your team\'s competence to run the business.',
      required: true,
      wordCountMin: 200,
      wordCountMax: 500,
      order: 5,
      category: 'team',
      prompts: [
        'Provide a brief biography of each key manager, highlighting relevant experience.',
        'Describe the organisational structure and responsibilities.',
        'Explain any governance mechanisms or advisory boards in place.',
        'Identify gaps in the team and how you plan to address them.'
      ],
      validationRules: {
        requiredFields: ['management_team', 'organisation_structure', 'governance'],
        formatRequirements: ['professional_bios', 'clear_responsibilities']
      },
      source: {
        verified: true,
        verifiedDate: '2025-11-04',
        officialProgram: 'WKO Businessplan Guide',
        sourceUrl: 'https://www.wko.at/gruendung/inhalte-businessplan',
        version: '1.0'
      }
    },
    {
      id: 'risk_assessment',
      title: 'Risk Analysis & Mitigation',
      description:
        'Assess the risks associated with the business and the loan. Demonstrate awareness and mitigation strategies.',
      required: true,
      wordCountMin: 200,
      wordCountMax: 500,
      order: 6,
      category: 'risk',
      prompts: [
        'List the primary risks facing your business (operational, financial, market).',
        'Discuss how these risks could impact loan repayment.',
        'Describe measures in place to mitigate each risk.',
        'Explain contingency plans should adverse events occur.'
      ],
      validationRules: {
        requiredFields: ['risk_list', 'repayment_impact', 'mitigation_measures', 'contingency_plans'],
        formatRequirements: ['structured_risk_section', 'realistic_assessment']
      },
      source: {
        verified: true,
        verifiedDate: '2025-11-04',
        officialProgram: 'FFG Basisprogramm – Projektbeschreibung',
        sourceUrl: 'https://www.ffg.at/sites/default/files/downloads/bpprojektbeschreibung_v1-2018_muster.pdf',
        version: '1.0'
      }
    },
    {
      id: 'financial_stability',
      title: 'Financial Stability & Ratios',
      description:
        'Demonstrate the financial health of the business through key ratios and cash-flow analysis. Show the company\'s ability to meet obligations.',
      required: true,
      wordCountMin: 200,
      wordCountMax: 500,
      order: 7,
      category: 'financial',
      prompts: [
        'Provide liquidity, solvency and profitability ratios for the past three years.',
        'Analyse trends in these ratios and what they indicate about your financial stability.',
        'Present a cash‑flow statement showing inflows and outflows over time.',
        'Explain how your financial position will evolve with the requested loan.'
      ],
      validationRules: {
        requiredFields: ['financial_ratios', 'trend_analysis', 'cash_flow_statement', 'stability_explanation'],
        formatRequirements: ['ratio_tables', 'clear_interpretation']
      },
      source: {
        verified: true,
        verifiedDate: '2025-11-04',
        officialProgram: 'Standard Bank Loan Requirements',
        sourceUrl: 'https://www.bankaustria.at/en/corporate-customers-working-capital-loan.jsp',
        version: '1.0'
      }
    },
    {
      id: 'repayment_plan',
      title: 'Repayment Plan',
      description:
        'Describe how and when the loan will be repaid. Include revenue projections, repayment schedule and contingency provisions.',
      required: true,
      wordCountMin: 200,
      wordCountMax: 500,
      order: 8,
      category: 'financial',
      prompts: [
        'Provide a detailed repayment schedule with amounts and dates.',
        'Explain the sources of funds you will use to repay the loan (e.g., cash flow, revenue increases).',
        'Discuss sensitivity scenarios (best case, base case, worst case) and how they affect repayment.',
        'Include a contingency plan in case of unforeseen financial difficulties.'
      ],
      validationRules: {
        requiredFields: ['repayment_schedule', 'funding_sources', 'sensitivity_analysis', 'contingency_plan'],
        formatRequirements: ['repayment_table', 'realistic_forecasts']
      },
      source: {
        verified: true,
        verifiedDate: '2025-11-04',
        officialProgram: 'Standard Bank Loan Requirements',
        sourceUrl: 'https://www.bankaustria.at/en/corporate-customers-working-capital-loan.jsp',
        version: '1.0'
      }
    }
];

// Store full sections for equity (review/submission)
const FULL_SECTIONS_EQUITY: SectionTemplate[] = [
  /**
   * Sections for equity (venture capital and angel investment) fundraising.  The
   * structure is inspired by leading VC pitch deck templates such as Sequoia
   * Capital's recommended format.  It encourages concise storytelling, evidence
   * of traction and clear financial projections.
   */
    {
      id: 'executive_summary',
      title: 'Company Purpose & Vision',
      description:
        'Open with a compelling statement of what your company does and the long‑term vision. Capture the essence of your mission in a single page.',
      required: true,
      wordCountMin: 150,
      wordCountMax: 300,
      order: 1,
      category: 'general',
      prompts: [
        'Describe your company\'s purpose in one sentence.',
        'Summarise the mission and vision driving your team.',
        'Highlight the broader impact you aim to achieve in the next 5-10 years.'
      ],
      validationRules: {
        requiredFields: ['company_purpose', 'mission_statement', 'long_term_vision'],
        formatRequirements: ['concise_language', 'inspirational_tone']
      },
      source: {
        verified: true,
        verifiedDate: '2025-11-04',
        officialProgram: 'Sequoia Capital Pitch Deck Template',
        sourceUrl: 'https://www.slidegenius.com/cm-faq-question/what-is-the-recommended-pitch-deck-template-provided-by-sequoia-capital',
        version: '1.0'
      }
    },
    {
      id: 'problem_solution',
      title: 'Problem & Solution',
      description:
        'Define the customer problem you are solving and explain your solution. Emphasise pain points and how your product uniquely addresses them.',
      required: true,
      wordCountMin: 200,
      wordCountMax: 400,
      order: 2,
      category: 'project',
      prompts: [
        'Describe the specific problem or pain your target customers face.',
        'Explain why existing solutions are inadequate.',
        'Present your product or service as the solution and highlight its unique features.',
        'Show how your solution improves the customer experience or outcomes.'
      ],
      validationRules: {
        requiredFields: ['problem_statement', 'current_solutions', 'your_solution', 'unique_value_proposition'],
        formatRequirements: ['customer_centric_language', 'evidence_of_need']
      },
      source: {
        verified: true,
        verifiedDate: '2025-11-04',
        officialProgram: 'Sequoia Capital Pitch Deck Template',
        sourceUrl: 'https://www.slidegenius.com/cm-faq-question/what-is-the-recommended-pitch-deck-template-provided-by-sequoia-capital',
        version: '1.0'
      }
    },
    {
      id: 'market_opportunity',
      title: 'Market Opportunity',
      description:
        'Demonstrate the size and attractiveness of your target market. Provide credible data on the total addressable market (TAM), serviceable market and growth trends.',
      required: true,
      wordCountMin: 150,
      wordCountMax: 350,
      order: 3,
      category: 'market',
      prompts: [
        'Quantify the total addressable market (TAM) and the portion you can realistically capture (SAM/SOM).',
        'Identify key market segments and customer personas.',
        'Discuss trends or catalysts that make this market attractive right now.',
        'Explain barriers to entry and how they affect your opportunity.'
      ],
      validationRules: {
        requiredFields: ['tam_sam_som', 'market_segments', 'growth_trends', 'barriers_to_entry'],
        formatRequirements: ['credible_sources', 'data_visualisation']
      },
      source: {
        verified: true,
        verifiedDate: '2025-11-04',
        officialProgram: 'Sequoia Capital Pitch Deck Template',
        sourceUrl: 'https://www.slidegenius.com/cm-faq-question/what-is-the-recommended-pitch-deck-template-provided-by-sequoia-capital',
        version: '1.0'
      }
    },
    {
      id: 'product_technology',
      title: 'Product & Technology',
      description:
        'Provide an overview of your product or service. Explain how it works, its current stage of development and any proprietary technology.',
      required: true,
      wordCountMin: 150,
      wordCountMax: 350,
      order: 4,
      category: 'technical',
      prompts: [
        'Describe the core functionality of your product/service.',
        'Explain the technology stack or scientific basis underpinning your offering.',
        'Indicate your current development stage (prototype, MVP, full product).',
        'Highlight any intellectual property or defensible technology.'
      ],
      validationRules: {
        requiredFields: ['product_description', 'technology_basis', 'development_stage', 'intellectual_property'],
        formatRequirements: ['clear_technical_explanation', 'proof_of_concept']
      },
      source: {
        verified: true,
        verifiedDate: '2025-11-04',
        officialProgram: 'Sequoia Capital Pitch Deck Template',
        sourceUrl: 'https://www.slidegenius.com/cm-faq-question/what-is-the-recommended-pitch-deck-template-provided-by-sequoia-capital',
        version: '1.0'
      }
    },
    {
      id: 'business_model',
      title: 'Business Model & Revenue',
      description:
        'Explain how your company makes money. Outline your revenue streams, pricing strategy and unit economics.',
      required: true,
      wordCountMin: 150,
      wordCountMax: 350,
      order: 5,
      category: 'financial',
      prompts: [
        'Identify your primary revenue streams (product sales, subscriptions, services, etc.).',
        'Describe your pricing strategy and rationale.',
        'Discuss unit economics such as customer acquisition cost (CAC) and lifetime value (LTV).',
        'Highlight any secondary or future revenue opportunities.'
      ],
      validationRules: {
        requiredFields: ['revenue_streams', 'pricing_strategy', 'unit_economics', 'future_revenues'],
        formatRequirements: ['financial_clarity', 'scalability_evidence']
      },
      source: {
        verified: true,
        verifiedDate: '2025-11-04',
        officialProgram: 'Sequoia Capital Pitch Deck Template',
        sourceUrl: 'https://www.slidegenius.com/cm-faq-question/what-is-the-recommended-pitch-deck-template-provided-by-sequoia-capital',
        version: '1.0'
      }
    },
    {
      id: 'go_to_market',
      title: 'Go‑to‑Market Strategy',
      description:
        'Describe how you plan to reach your customers and scale your business. Include marketing, sales and distribution strategies.',
      required: true,
      wordCountMin: 150,
      wordCountMax: 300,
      order: 6,
      category: 'market',
      prompts: [
        'Explain your customer acquisition strategy and key channels (online, direct sales, partnerships).',
        'Describe your marketing and communications plan.',
        'Outline sales processes, including conversion funnels or pilot programmes.',
        'Discuss partnerships or distribution agreements that accelerate growth.'
      ],
      validationRules: {
        requiredFields: ['acquisition_strategy', 'marketing_plan', 'sales_process', 'partnerships'],
        formatRequirements: ['coherent_strategy', 'evidence_of_traction']
      },
      source: {
        verified: true,
        verifiedDate: '2025-11-04',
        officialProgram: 'Sequoia Capital Pitch Deck Template',
        sourceUrl: 'https://www.slidegenius.com/cm-faq-question/what-is-the-recommended-pitch-deck-template-provided-by-sequoia-capital',
        version: '1.0'
      }
    },
    {
      id: 'competitive_analysis',
      title: 'Competitive Analysis',
      description:
        'Map your competitive landscape. Identify key competitors and articulate your competitive advantage.',
      required: true,
      wordCountMin: 150,
      wordCountMax: 300,
      order: 7,
      category: 'market',
      prompts: [
        'List direct and indirect competitors operating in your space.',
        'Compare key features, pricing and market positioning with those competitors.',
        'Highlight differentiators that give you a sustainable advantage.',
        'Discuss potential substitutes or emerging threats.'
      ],
      validationRules: {
        requiredFields: ['competitor_list', 'comparison', 'unique_advantages', 'threats'],
        formatRequirements: ['competitive_matrix', 'honest_assessment']
      },
      source: {
        verified: true,
        verifiedDate: '2025-11-04',
        officialProgram: 'Sequoia Capital Pitch Deck Template',
        sourceUrl: 'https://www.slidegenius.com/cm-faq-question/what-is-the-recommended-pitch-deck-template-provided-by-sequoia-capital',
        version: '1.0'
      }
    },
    {
      id: 'traction_metrics',
      title: 'Traction & Metrics',
      description:
        'Provide evidence that your business is gaining momentum. Showcase key metrics, milestones and user/customer growth.',
      required: true,
      wordCountMin: 150,
      wordCountMax: 300,
      order: 8,
      category: 'market',
      prompts: [
        'List key milestones achieved to date (product launches, partnerships, revenue milestones).',
        'Present user or customer growth metrics and engagement indicators.',
        'Highlight retention, churn or other cohort analyses as appropriate.',
        'Include testimonials or case studies if available.'
      ],
      validationRules: {
        requiredFields: ['milestones', 'growth_metrics', 'engagement_metrics', 'evidence_of_validation'],
        formatRequirements: ['charts_or_graphs', 'time_series_data']
      },
      source: {
        verified: true,
        verifiedDate: '2025-11-04',
        officialProgram: 'Sequoia Capital Pitch Deck Template',
        sourceUrl: 'https://www.slidegenius.com/cm-faq-question/what-is-the-recommended-pitch-deck-template-provided-by-sequoia-capital',
        version: '1.0'
      }
    },
    {
      id: 'team_qualifications',
      title: 'Team & Advisors',
      description:
        'Introduce the founding team and advisors. Emphasise relevant experience and the capacity to execute the vision.',
      required: true,
      wordCountMin: 150,
      wordCountMax: 300,
      order: 9,
      category: 'team',
      prompts: [
        'List founders and key employees, including their roles and previous accomplishments.',
        'Describe complementary skills and how the team works together.',
        'Mention advisors or board members who bring industry or technical expertise.',
        'Identify any gaps in the team and plans to fill them.'
      ],
      validationRules: {
        requiredFields: ['founder_bios', 'team_complementarity', 'advisors', 'team_gaps'],
        formatRequirements: ['concise_biographies', 'role_clarity']
      },
      source: {
        verified: true,
        verifiedDate: '2025-11-04',
        officialProgram: 'Sequoia Capital Pitch Deck Template',
        sourceUrl: 'https://www.slidegenius.com/cm-faq-question/what-is-the-recommended-pitch-deck-template-provided-by-sequoia-capital',
        version: '1.0'
      }
    },
    {
      id: 'financials',
      title: 'Financials & Projections',
      description:
        'Summarise your financial performance to date and provide projections. Include revenue forecasts, cost assumptions and capital requirements.',
      required: true,
      wordCountMin: 150,
      wordCountMax: 300,
      order: 10,
      category: 'financial',
      prompts: [
        'Present historical financial data (revenue, expenses, profits) if available.',
        'Offer projections for the next three to five years, including key assumptions.',
        'Detail your capital needs and planned use of funds from the investment.',
        'Discuss break‑even analysis or profitability timelines.'
      ],
      validationRules: {
        requiredFields: ['historical_financials', 'projections', 'capital_requirements', 'break_even_analysis'],
        formatRequirements: ['clean_financial_tables', 'assumption_transparency']
      },
      source: {
        verified: true,
        verifiedDate: '2025-11-04',
        officialProgram: 'Sequoia Capital Pitch Deck Template',
        sourceUrl: 'https://www.slidegenius.com/cm-faq-question/what-is-the-recommended-pitch-deck-template-provided-by-sequoia-capital',
        version: '1.0'
      }
    },
    {
      id: 'exit_strategy',
      title: 'Exit Strategy',
      description:
        'Explain potential exit routes for investors. Discuss acquisition opportunities, IPO prospects or other liquidity events.',
      required: false,
      wordCountMin: 150,
      wordCountMax: 300,
      order: 11,
      category: 'financial',
      prompts: [
        'Identify possible exit options (acquisition, merger, public offering).',
        'Discuss potential acquirers or comparable exits in your industry.',
        'Provide a rough timeline and milestones needed to reach an exit.',
        'Describe your expectations regarding valuation and investor returns.'
      ],
      validationRules: {
        requiredFields: ['exit_options', 'comparable_exits', 'exit_timeline', 'return_expectations'],
        formatRequirements: ['realistic_assumptions', 'industry_comparables']
      },
      source: {
        verified: true,
        verifiedDate: '2025-11-04',
        officialProgram: 'Sequoia Capital Pitch Deck Template',
        sourceUrl: 'https://www.slidegenius.com/cm-faq-question/what-is-the-recommended-pitch-deck-template-provided-by-sequoia-capital',
        version: '1.0'
      }
    }
];

// Store full sections for visa (review/submission)
const FULL_SECTIONS_VISA: SectionTemplate[] = [
  /**
   * Sections for business visa and start‑up residence applications.  These
   * templates align with the Austrian Red‑White‑Red Card requirements for
   * start‑up founders, emphasising a solid business concept, proof of innovation,
   * financial robustness and the creation of employment.  They also incorporate
   * elements commonly requested in self‑employment visa applications (e.g.
   * business plan, compliance and job creation commitments).
   */
    {
      id: 'executive_summary',
      title: 'Executive Summary',
      description:
        'Provide a succinct overview of your business concept for immigration authorities. Summarise the purpose, innovation and expected benefits to Austria.',
      required: true,
      wordCountMin: 200,
      wordCountMax: 400,
      order: 1,
      category: 'general',
      prompts: [
        'State the business idea and its innovative aspects.',
        'Explain why Austria is the right location for your venture.',
        'Summarise the economic and societal benefits your business will bring.',
        'Briefly indicate the investment amount and equity stake.'
      ],
      validationRules: {
        requiredFields: ['business_idea', 'innovation', 'benefits_to_austria', 'investment_overview'],
        formatRequirements: ['compelling_narrative', 'clarity_for_regulators']
      },
      source: {
        verified: true,
        verifiedDate: '2025-11-04',
        officialProgram: 'Red‑White‑Red Card (Start‑up Founders)',
        sourceUrl: 'https://www.migration.gv.at/en/types-of-immigration/permanent-immigration/start-up-founders/',
        version: '1.0'
      }
    },
    {
      id: 'business_concept',
      title: 'Business Concept',
      description:
        'Describe in detail the business you intend to establish. Cover products or services, target customers and your unique selling proposition.',
      required: true,
      wordCountMin: 250,
      wordCountMax: 600,
      order: 2,
      category: 'project',
      prompts: [
        'Explain your product or service and its development stage.',
        'Identify the market need and how your offering addresses it.',
        'Describe your target customers and channels to reach them.',
        'Highlight what differentiates your business from competitors.'
      ],
      validationRules: {
        requiredFields: ['product_service', 'market_need', 'target_customers', 'unique_value_proposition'],
        formatRequirements: ['clear_description', 'evidence_of_innovation']
      },
      source: {
        verified: true,
        verifiedDate: '2025-11-04',
        officialProgram: 'Red‑White‑Red Card (Start‑up Founders)',
        sourceUrl: 'https://www.migration.gv.at/en/types-of-immigration/permanent-immigration/start-up-founders/',
        version: '1.0'
      }
    },
    {
      id: 'market_opportunity',
      title: 'Market Opportunity',
      description:
        'Provide evidence of market demand and competition. Show that your business has a viable market in Austria or internationally.',
      required: true,
      wordCountMin: 200,
      wordCountMax: 500,
      order: 3,
      category: 'market',
      prompts: [
        'Describe the size of the market you intend to enter.',
        'Identify competitors and explain how you will compete.',
        'Discuss trends or regulatory factors that affect market entry.',
        'Provide any market research or pilot results that support your case.'
      ],
      validationRules: {
        requiredFields: ['market_size', 'competition', 'market_trends', 'supporting_evidence'],
        formatRequirements: ['data_supported', 'local_relevance']
      },
      source: {
        verified: true,
        verifiedDate: '2025-11-04',
        officialProgram: 'WKO Businessplan Guide',
        sourceUrl: 'https://www.wko.at/gruendung/inhalte-businessplan',
        version: '1.0'
      }
    },
    {
      id: 'financial_plan',
      title: 'Financial Plan & Investment',
      description:
        'Outline your capital needs, funding sources and financial forecasts. Show that you meet the minimum investment thresholds and can sustain operations.',
      required: true,
      wordCountMin: 200,
      wordCountMax: 500,
      order: 4,
      category: 'financial',
      prompts: [
        'State the amount of capital you will invest and your equity share.',
        'Provide a budget for the first two years, including expected revenues and costs.',
        'Describe funding sources (personal funds, investors, grants).',
        'Explain how the business will reach financial sustainability.'
      ],
      validationRules: {
        requiredFields: ['investment_amount', 'equity_share', 'budget_forecast', 'funding_sources'],
        formatRequirements: ['financial_tables', 'compliance_with_thresholds']
      },
      source: {
        verified: true,
        verifiedDate: '2025-11-04',
        officialProgram: 'Red‑White‑Red Card (Start‑up Founders)',
        sourceUrl: 'https://www.migration.gv.at/en/types-of-immigration/permanent-immigration/start-up-founders/',
        version: '1.0'
      }
    },
    {
      id: 'job_creation_plan',
      title: 'Job Creation & Economic Impact',
      description:
        'Demonstrate how your business will create jobs and contribute to the Austrian economy. Provide a hiring timeline and roles to be filled.',
      required: true,
      wordCountMin: 200,
      wordCountMax: 400,
      order: 5,
      category: 'impact',
      prompts: [
        'Estimate the number of jobs you plan to create over the next two years.',
        'Describe the roles and qualifications required.',
        'Explain the timeline for recruitment and training.',
        'Discuss broader economic contributions (tax revenue, supply chain effects).'
      ],
      validationRules: {
        requiredFields: ['job_numbers', 'role_descriptions', 'hiring_timeline', 'economic_contributions'],
        formatRequirements: ['realistic_hiring_plan', 'quantitative_impact']
      },
      source: {
        verified: true,
        verifiedDate: '2025-11-04',
        officialProgram: 'Red‑White‑Red Card (Start‑up Founders)',
        sourceUrl: 'https://www.migration.gv.at/en/types-of-immigration/permanent-immigration/start-up-founders/',
        version: '1.0'
      }
    },
    {
      id: 'compliance_legal',
      title: 'Compliance & Legal Structure',
      description:
        'Describe the legal structure of your company and demonstrate compliance with Austrian regulations. Include licences, permits and governance.',
      required: true,
      wordCountMin: 200,
      wordCountMax: 400,
      order: 6,
      category: 'legal',
      prompts: [
        'State the planned legal form of your company (e.g., GmbH, OG, AG).',
        'Explain your ownership structure and management control.',
        'List any licences or permits required to operate your business.',
        'Describe compliance measures related to taxation, labour and environmental laws.'
      ],
      validationRules: {
        requiredFields: ['legal_form', 'ownership_structure', 'required_licences', 'compliance_measures'],
        formatRequirements: ['legal_precision', 'regulatory_alignment']
      },
      source: {
        verified: true,
        verifiedDate: '2025-11-04',
        officialProgram: 'Red‑White‑Red Card (Start‑up Founders)',
        sourceUrl: 'https://www.migration.gv.at/en/types-of-immigration/permanent-immigration/start-up-founders/',
        version: '1.0'
      }
    },
    {
      id: 'team_qualifications',
      title: 'Founders & Key Personnel',
      description:
        'Introduce yourself and any co‑founders or key personnel. Highlight qualifications, experience and evidence of controlling influence over the company.',
      required: true,
      wordCountMin: 200,
      wordCountMax: 400,
      order: 7,
      category: 'team',
      prompts: [
        'Provide short biographies of the founder(s) and key personnel.',
        'Explain the roles each person will play in the company.',
        'Highlight relevant experience or qualifications (education, previous ventures).',
        'Demonstrate that the founder(s) hold at least 50 % equity and have controlling influence.'
      ],
      validationRules: {
        requiredFields: ['founder_bios', 'roles', 'experience', 'equity_and_control'],
        formatRequirements: ['evidence_of_control', 'qualification_proof']
      },
      source: {
        verified: true,
        verifiedDate: '2025-11-04',
        officialProgram: 'Red‑White‑Red Card (Start‑up Founders)',
        sourceUrl: 'https://www.migration.gv.at/en/types-of-immigration/permanent-immigration/start-up-founders/',
        version: '1.0'
      }
    },
    {
      id: 'timeline_milestones',
      title: 'Implementation Timeline',
      description:
        'Provide a schedule for launching and scaling your business in Austria. Include major milestones such as company registration, product launch and job creation.',
      required: true,
      wordCountMin: 150,
      wordCountMax: 350,
      order: 8,
      category: 'project',
      prompts: [
        'List the key steps required to establish the company in Austria.',
        'Provide dates or timeframes for each major milestone (registration, funding, product launch).',
        'Include hiring milestones and scaling plans.',
        'Explain how progress will be monitored and reported to authorities.'
      ],
      validationRules: {
        requiredFields: ['setup_steps', 'milestone_dates', 'hiring_milestones', 'monitoring_plan'],
        formatRequirements: ['chronological_order', 'realistic_timeline']
      },
      source: {
        verified: true,
        verifiedDate: '2025-11-04',
        officialProgram: 'Red‑White‑Red Card (Start‑up Founders)',
        sourceUrl: 'https://www.migration.gv.at/en/types-of-immigration/permanent-immigration/start-up-founders/',
        version: '1.0'
      }
    }
];

// ============================================================================
// RESTRUCTURED EXPORT WITH PRODUCT TYPES
// ============================================================================

/**
 * MASTER_SECTIONS with product-specific structure
 * Strategy: 6 focused sections (new)
 * Review: All sections (existing full sections)
 * Submission: All sections (existing full sections - same as review)
 */
export const MASTER_SECTIONS: Record<string, Record<string, SectionTemplate[]>> = {
  grants: {
    strategy: createStrategySections('grants'),
    review: FULL_SECTIONS_GRANTS,
    submission: FULL_SECTIONS_GRANTS
  },
  bankLoans: {
    strategy: createStrategySections('bankLoans'),
    review: FULL_SECTIONS_BANKLOANS,
    submission: FULL_SECTIONS_BANKLOANS
  },
  equity: {
    strategy: createStrategySections('equity'),
    review: FULL_SECTIONS_EQUITY,
    submission: FULL_SECTIONS_EQUITY
  },
  visa: {
    strategy: createStrategySections('visa'),
    review: FULL_SECTIONS_VISA,
    submission: FULL_SECTIONS_VISA
  }
};

// ============================================================================
// HELPER FUNCTIONS (for backward compatibility)
// ============================================================================

/**
 * Get standard sections for a specific funding type
 * Backward compatibility alias - categoryConverters uses this
 * Returns submission sections by default (full sections)
 */
export function getStandardSections(fundingType: string): SectionTemplate[] {
  const type = fundingType.toLowerCase();
  
  switch (type) {
    case 'grants':
    case 'grant':
      return MASTER_SECTIONS.grants.submission; // Return submission (full sections)
    case 'bankloans':
    case 'bank_loans':
    case 'loan':
      return MASTER_SECTIONS.bankLoans.submission;
    case 'equity':
    case 'investment':
      return MASTER_SECTIONS.equity.submission;
    case 'visa':
    case 'residency':
      return MASTER_SECTIONS.visa.submission;
    default:
      return MASTER_SECTIONS.grants.submission; // Default to grants submission
  }
}

/**
 * Get section by ID and funding type
 */
export function getSectionById(sectionId: string, fundingType: string): SectionTemplate | undefined {
  const sections = getStandardSections(fundingType);
  return sections.find(section => section.id === sectionId);
}

/**
 * Get sections that map to specific requirement categories
 */
export function getSectionsByCategory(category: string, fundingType: string): SectionTemplate[] {
  const sections = getStandardSections(fundingType);
  return sections.filter(section => section.category === category);
}
